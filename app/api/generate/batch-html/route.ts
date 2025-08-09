import { TextLayer, UploadedFont, VariantSetRequest, VariantSetResponse } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

export const runtime = "nodejs";

async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
}

function buildFontFaces(fonts: UploadedFont[] = []): string {
    return fonts
        .map((f) => {
            const mime = f.name.toLowerCase().endsWith(".otf") ? "font/otf" : f.name.toLowerCase().endsWith(".woff2") ? "font/woff2" : f.name.toLowerCase().endsWith(".woff") ? "font/woff" : "font/ttf";
            const url = `data:${mime};base64,${f.dataB64}`;
            const weight = f.weight ?? 400;
            const style = f.style ?? "normal";
            const family = (f.name || "Custom").replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/i, "");
            return `@font-face{font-family:'${family}';src:url('${url}') format('truetype');font-weight:${weight};font-style:${style};font-display:swap;}`;
        })
        .join("\n");
}

function buildHtml(opts: {
    width: number;
    height: number;
    backgroundDataUrl?: string;
    texts: TextLayer[];
    fonts?: UploadedFont[];
}) {
    const { width, height, backgroundDataUrl, texts, fonts } = opts;
    const fontFaces = buildFontFaces(fonts);
    const bg = backgroundDataUrl ? `<img src="${backgroundDataUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />` : "";
    const textHtml = texts
        .map((t) => {
            const family = t.fontFamily ?? "Inter, system-ui, sans-serif";
            const weight = t.fontWeight ?? 400;
            const rotate = t.rotation ? `transform:rotate(${t.rotation}deg);transform-origin:top left;` : "";
            const maxW = t.maxWidth ? `width:${t.maxWidth}px;` : "";
            const ls = t.letterSpacing ? `letter-spacing:${t.letterSpacing}px;` : "";
            const tt = t.uppercase ? "text-transform:uppercase;" : "";
            const lh = t.lineHeight ? `line-height:${t.lineHeight};` : "";
            const align = t.align ?? "left";
            const safe = String(t.text ?? "");
            return `<div style="position:absolute;left:${t.x}px;top:${t.y}px;${maxW}color:${t.color ?? "#fff"};font-size:${t.size ?? 48}px;font-family:${family};font-weight:${weight};white-space:pre-wrap;text-align:${align};${rotate}${ls}${tt}${lh}">${safe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
        })
        .join("");

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
html,body,#root{margin:0;padding:0;width:100%;height:100%;}
${fontFaces}
</style>
</head>
<body>
<div id="root" style="position:relative;width:${width}px;height:${height}px;background:#000;overflow:hidden;">
${bg}
${textHtml}
</div>
</body>
</html>`;
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

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setViewport({ width: template.width, height: template.height, deviceScaleFactor: 1 });

        const files: string[] = [];
        for (let i = 0; i < variants.length; i++) {
            const v = variants[i];
            const texts = template.texts.map((t) => ({
                ...t,
                // Usa SOLO le varianti per la generazione; il testo del layer è solo preview
                text: String(v.overrideTexts?.[t.id] ?? ""),
            }));
            const html = buildHtml({
                width: template.width,
                height: template.height,
                backgroundDataUrl: template.backgroundDataUrl,
                texts,
                fonts,
            });
            await page.setContent(html, { waitUntil: "load" });
            const filename = (v.filename ?? `image_${String(i + 1).padStart(3, "0")}.png`) as `${string}.png`;
            const abs = path.join(outDir, filename) as `${string}.png`;
            const clip = { x: 0, y: 0, width: template.width, height: template.height } as const;
            await page.screenshot({ path: abs, clip, type: "png" });
            files.push(abs);
        }

        await browser.close();
        const res: VariantSetResponse = { outputDir: outDir, files };
        return NextResponse.json(res, { status: 200 });
    } catch (e) {
        const err = e as Error;
        console.error("/api/generate/batch-html error:", err.stack || err.message);
        return NextResponse.json({ error: err.message ?? "unknown" }, { status: 500 });
    }
}

