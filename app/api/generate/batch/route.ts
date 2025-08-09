import { VariantSetRequest, VariantSetResponse } from "@/lib/types";
import { Resvg } from "@resvg/resvg-js";
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import satori from "satori";
import { OGTemplate } from "./template";

export const runtime = "nodejs";

async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as VariantSetRequest;
        const { template, variants, fonts, outputDir } = body;

        if (!template?.width || !template?.height || !Array.isArray(template.texts)) {
            return NextResponse.json({ error: "Invalid template" }, { status: 400 });
        }
        if (!Array.isArray(variants) || variants.length === 0) {
            return NextResponse.json({ error: "No variants provided" }, { status: 400 });
        }

        const outDir = path.resolve(process.cwd(), outputDir ?? "output");
        await ensureDir(outDir);

        // Prepare fonts for satori
        const satoriFonts: Array<{ name: string; data: ArrayBuffer; weight?: number; style?: "normal" | "italic" }> = [];
        if (fonts && fonts.length > 0) {
            for (const f of fonts) {
                const buf = Buffer.from(f.dataB64, "base64");
                const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
                satoriFonts.push({ name: f.name, data: ab, weight: f.weight ?? 400, style: f.style ?? "normal" });
            }
        }

        const files: string[] = [];
        for (let i = 0; i < variants.length; i++) {
            const v = variants[i];
            const texts = template.texts.map((t) => ({
                ...t,
                text: String(v.overrideTexts?.[t.id] ?? t.text ?? ""),
            }));

            const element = OGTemplate({
                width: template.width,
                height: template.height,
                backgroundDataUrl: template.backgroundDataUrl,
                texts,
            });

            debugger;
            const svg = await satori(element as React.ReactElement, {
                width: template.width,
                height: template.height,
                fonts: satoriFonts as unknown as Parameters<typeof satori>[1]["fonts"],
            });

            const resvg = new Resvg(svg, { background: "#00000000" });
            const png = resvg.render().asPng();
            const filename = v.filename ?? `image_${String(i + 1).padStart(3, "0")}.png`;
            const abs = path.join(outDir, filename);
            await fs.writeFile(abs, png);
            files.push(abs);
        }

        const res: VariantSetResponse = { outputDir: outDir, files };
        return NextResponse.json(res, { status: 200 });
    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message ?? "unknown" }, { status: 500 });
    }
}

