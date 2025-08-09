"use client";

import { UploadedFont } from "@/lib/types";
import { useMemo } from "react";

function toFamilyName(name: string): string {
    return (name || "Custom").replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/i, "");
}

export default function FontFaceInjector({ fonts }: { fonts: UploadedFont[] }) {
    const css = useMemo(() => {
        return fonts
            .map((f) => {
                const lower = f.name.toLowerCase();
                const mime = lower.endsWith(".otf")
                    ? "font/otf"
                    : lower.endsWith(".woff2")
                        ? "font/woff2"
                        : lower.endsWith(".woff")
                            ? "font/woff"
                            : "font/ttf";
                const url = `data:${mime};base64,${f.dataB64}`;
                const weight = f.weight ?? 400;
                const style = f.style ?? "normal";
                const family = toFamilyName(f.name);
                const format = lower.endsWith(".otf")
                    ? "opentype"
                    : lower.endsWith(".woff2")
                        ? "woff2"
                        : lower.endsWith(".woff")
                            ? "woff"
                            : "truetype";
                return `@font-face{font-family:'${family}';src:url('${url}') format('${format}');font-weight:${weight};font-style:${style};font-display:swap;}`;
            })
            .join("\n");
    }, [fonts]);

    return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export { toFamilyName };

