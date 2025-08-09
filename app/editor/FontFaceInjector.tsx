"use client";

import { UploadedFont } from "@/lib/types";
import { useMemo } from "react";

function toDataUrl(b64: string, mime: string = "font/ttf") {
    return `data:${mime};base64,${b64}`;
}

export default function FontFaceInjector({ fonts }: { fonts: UploadedFont[] }) {
    const css = useMemo(() => {
        return fonts
            .map((f) => {
                const src = `url('${toDataUrl(f.dataB64)}') format('truetype')`;
                const weight = f.weight ?? 400;
                const style = f.style ?? "normal";
                return `@font-face{font-family:'${f.name}';src:${src};font-weight:${weight};font-style:${style};font-display:swap;}`;
            })
            .join("\n");
    }, [fonts]);

    return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

