"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TemplatePayload, TextLayer, UploadedFont, VariantSetRequest } from "@/lib/types";
import React, { useMemo, useState } from "react";
import EditorCanvas from "./EditorCanvas";
import FontFaceInjector from "./FontFaceInjector";

export default function EditorPage() {
    const [template, setTemplate] = useState<TemplatePayload>({
        width: 1080,
        height: 1350,
        texts: [
            { id: "headline", text: "Titolo", x: 80, y: 200, size: 96, color: "#ffffff", maxWidth: 900 },
        ],
    });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [csv, setCsv] = useState<string>("headline\nCiao mondo\nOfferta imperdibile");
    const [busy, setBusy] = useState(false);
    const [fonts, setFonts] = useState<UploadedFont[]>([]);

    const headers = useMemo(() => {
        const [head] = csv.split(/\r?\n/);
        return head?.split(",").map((s) => s.trim()) ?? [];
    }, [csv]);
    const rows = useMemo(() => {
        const lines = csv.split(/\r?\n/).slice(1).filter(Boolean);
        return lines.map((line) => line.split(",").map((s) => s.trim()));
    }, [csv]);

    function onBgFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => setTemplate((p) => ({ ...p, backgroundDataUrl: String(reader.result) }));
        reader.readAsDataURL(f);
    }

    function addTextLayer() {
        setTemplate((p) => ({
            ...p,
            texts: [
                ...p.texts,
                { id: `text${p.texts.length + 1}`, text: "", x: 80, y: 80, size: 64, color: "#ffffff" },
            ],
        }));
    }

    function updateLayer(id: string, patch: Partial<TextLayer>) {
        setTemplate((prev) => ({
            ...prev,
            texts: prev.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));
    }

    async function generateToDisk() {
        setBusy(true);
        try {
            const variants: VariantSetRequest["variants"] = rows.map((cols, idx) => {
                const m: Record<string, string> = {};
                headers.forEach((h, i) => (m[h] = cols[i] ?? ""));
                return { overrideTexts: m, filename: `image_${idx + 1}.png` };
            });

            const res = await fetch("/api/generate/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ template, variants, fonts }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            console.log("Saved:", data);
            alert(`Salvato in: ${data.outputDir} (files: ${data.files.length})`);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="p-6 grid grid-cols-[auto_360px] gap-6">
            <FontFaceInjector fonts={fonts} />
            <div>
                <EditorCanvas
                    template={template}
                    onChangeTemplate={setTemplate}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Font custom (TTF/OTF)</Label>
                    <Input
                        type="file"
                        accept=".ttf,.otf,.woff,.woff2"
                        multiple
                        onChange={async (e) => {
                            const files = Array.from(e.target.files ?? []);
                            const newFonts: UploadedFont[] = [];
                            for (const f of files) {
                                const b = await f.arrayBuffer();
                                const b64 = Buffer.from(b).toString("base64");
                                const name = f.name.replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?|)$/i, "");
                                newFonts.push({ name, dataB64: b64 });
                            }
                            setFonts((prev) => [...prev, ...newFonts]);
                        }}
                    />
                    {fonts.length > 0 ? (
                        <div className="text-xs text-muted-foreground">Caricati: {fonts.map((f) => f.name).join(", ")}</div>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Label>Background</Label>
                    <Input type="file" accept="image/*" onChange={onBgFile} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label>Width</Label>
                        <Input
                            type="number"
                            value={template.width}
                            onChange={(e) => setTemplate((p) => ({ ...p, width: Number(e.target.value) || 0 }))}
                        />
                    </div>
                    <div>
                        <Label>Height</Label>
                        <Input
                            type="number"
                            value={template.height}
                            onChange={(e) => setTemplate((p) => ({ ...p, height: Number(e.target.value) || 0 }))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Text layers</Label>
                        <Button size="sm" onClick={addTextLayer}>+ Add</Button>
                    </div>

                    <div className="space-y-3">
                        {template.texts.map((t) => (
                            <div key={t.id} className={`border rounded p-2 ${selectedId === t.id ? "ring-1 ring-sky-400" : ""}`}>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">{t.id}</div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedId(t.id)}>Select</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div>
                                        <Label>X</Label>
                                        <Input type="number" value={t.x} onChange={(e) => updateLayer(t.id, { x: Number(e.target.value) || 0 })} />
                                    </div>
                                    <div>
                                        <Label>Y</Label>
                                        <Input type="number" value={t.y} onChange={(e) => updateLayer(t.id, { y: Number(e.target.value) || 0 })} />
                                    </div>
                                    <div>
                                        <Label>Size</Label>
                                        <Input type="number" value={t.size ?? 48} onChange={(e) => updateLayer(t.id, { size: Number(e.target.value) || 0 })} />
                                    </div>
                                    <div>
                                        <Label>Rotation</Label>
                                        <Input type="number" value={t.rotation ?? 0} onChange={(e) => updateLayer(t.id, { rotation: Number(e.target.value) || 0 })} />
                                    </div>
                                    <div>
                                        <Label>Color</Label>
                                        <Input type="color" value={t.color ?? "#ffffff"} onChange={(e) => updateLayer(t.id, { color: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label>Max width</Label>
                                        <Input type="number" value={t.maxWidth ?? 0} onChange={(e) => updateLayer(t.id, { maxWidth: Number(e.target.value) || undefined })} />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <Label>Text</Label>
                                    <Textarea value={t.text} onChange={(e) => updateLayer(t.id, { text: e.target.value })} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Varianti (CSV)</Label>
                    <Textarea rows={6} value={csv} onChange={(e) => setCsv(e.target.value)} />
                </div>

                <Button disabled={busy || rows.length === 0} onClick={generateToDisk}>
                    {busy ? "Generazione..." : `Genera su disco (${rows.length})`}
                </Button>
            </div>
        </div>
    );
}

