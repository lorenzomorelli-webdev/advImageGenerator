"use client";

import { TemplatePayload, TextLayer } from "@/lib/types";
import { useRef } from "react";
import Moveable from "react-moveable";

type EditorCanvasProps = {
    template: TemplatePayload;
    onChangeTemplate: (next: TemplatePayload) => void;
    overrides?: Record<string, string>;
    selectedId?: string | null;
    onSelect?: (id: string | null) => void;
};

export default function EditorCanvas({ template, onChangeTemplate, overrides, selectedId, onSelect }: EditorCanvasProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    function updateLayer(id: string, patch: Partial<TextLayer>) {
        onChangeTemplate({
            ...template,
            texts: template.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        });
    }

    return (
        <div
            className="relative border rounded-md overflow-hidden bg-black"
            style={{ width: template.width, height: template.height }}
            ref={containerRef}
        >
            {template.backgroundDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={template.backgroundDataUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : null}

            {template.texts.map((t) => {
                const content = overrides?.[t.id] ?? t.text ?? "";
                const isSel = selectedId === t.id;
                return (
                    <div
                        key={t.id}
                        onMouseDown={() => onSelect?.(t.id)}
                        style={{
                            position: "absolute",
                            left: t.x,
                            top: t.y,
                            color: t.color ?? "#fff",
                            fontSize: t.size ?? 48,
                            width: t.maxWidth,
                            lineHeight: t.lineHeight ?? 1.1,
                            letterSpacing: t.letterSpacing,
                            textTransform: t.uppercase ? "uppercase" : undefined,
                            transform: t.rotation ? `rotate(${t.rotation}deg)` : undefined,
                            transformOrigin: "top left",
                            fontFamily: t.fontFamily ?? "Inter, system-ui, sans-serif",
                            fontWeight: t.fontWeight ?? 400,
                            whiteSpace: "pre-wrap",
                            userSelect: "none",
                            cursor: isSel ? "move" : "pointer",
                        }}
                        className={isSel ? "outline outline-sky-400" : undefined}
                        id={`layer-${t.id}`}
                    >
                        {content}
                    </div>
                );
            })}

            {selectedId ? (
                <Moveable
                    target={document.getElementById(`layer-${selectedId}`) as HTMLElement | null}
                    container={containerRef.current as HTMLElement | null}
                    origin={false}
                    draggable
                    throttleDrag={0}
                    onDrag={({ left, top }) => updateLayer(selectedId, { x: Math.round(left), y: Math.round(top) })}
                    rotatable
                    throttleRotate={0}
                    rotationPosition="top"
                    onRotate={({ beforeRotate }) => updateLayer(selectedId, { rotation: Math.round(beforeRotate) })}
                    snappable
                    bounds={{ left: 0, top: 0, right: template.width, bottom: template.height }}
                    keepRatio={false}
                />
            ) : null}
        </div>
    );
}

