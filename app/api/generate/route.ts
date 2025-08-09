import { TemplatePayload, UploadedFont } from "@/lib/types";
import { Resvg } from "@resvg/resvg-js";
import { NextRequest, NextResponse } from "next/server";
import satori from "satori";
import { OGTemplate } from "../generate/batch/template";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const request = (await req.json()) as { template: TemplatePayload; fonts?: UploadedFont[] };
        const { template, fonts } = request;
        if (!template?.width || !template?.height || !Array.isArray(template.texts)) {
            return NextResponse.json({ error: "Invalid template" }, { status: 400 });
        }

        const satoriFonts = (fonts ?? []).map((f) => {
            const buf = Buffer.from(f.dataB64, "base64");
            const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
            return { name: f.name, data: ab, weight: f.weight, style: f.style };
        });

        const element = OGTemplate({
            width: template.width,
            height: template.height,
            backgroundDataUrl: template.backgroundDataUrl,
            texts: template.texts,
        });

        const svg = await satori(element as unknown as React.ReactElement, {
            width: template.width,
            height: template.height,
            fonts: satoriFonts as unknown as Parameters<typeof satori>[1]["fonts"],
        });
        const resvg = new Resvg(svg, { background: "#00000000" });
        const png = resvg.render().asPng();
        const body = new Uint8Array(png as unknown as ArrayBufferLike);
        return new NextResponse(body as unknown as BodyInit, { headers: { "Content-Type": "image/png" } });
    } catch (e) {
        const err = e as Error;
        return NextResponse.json({ error: err.message ?? "unknown" }, { status: 500 });
    }
}

