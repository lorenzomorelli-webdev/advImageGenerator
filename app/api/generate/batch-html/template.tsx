import { TextLayer } from "@/lib/types";

export function OGTemplate(props: {
    width: number;
    height: number;
    backgroundDataUrl?: string;
    texts: TextLayer[];
}) {
    const { backgroundDataUrl, texts } = props;

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                position: "relative",
                backgroundColor: "#000",
            }}
        >
            {backgroundDataUrl ? (
                <img
                    src={backgroundDataUrl}
                    alt=""
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            ) : null}

            {texts.map((t) => (
                <div
                    key={t.id}
                    style={{
                        position: "absolute",
                        left: `${t.x}px`,
                        top: `${t.y}px`,
                        width: t.maxWidth ? `${t.maxWidth}px` : "auto",
                        color: t.color ?? "#ffffff",
                        fontSize: `${t.size ?? 48}px`,
                        lineHeight: t.lineHeight ? String(t.lineHeight) : "1.1",
                        letterSpacing: t.letterSpacing ? `${t.letterSpacing}px` : undefined,
                        textAlign: t.align ?? "left",
                        whiteSpace: "pre-wrap",
                        transform: t.rotation ? `rotate(${t.rotation}deg)` : undefined,
                        transformOrigin: "top left",
                        fontFamily: t.fontFamily ?? "Inter, system-ui, sans-serif",
                        fontWeight: t.fontWeight ?? 400,
                        textTransform: t.uppercase ? "uppercase" : undefined,
                    }}
                >
                    {t.text}
                </div>
            ))}
        </div>
    );
}

