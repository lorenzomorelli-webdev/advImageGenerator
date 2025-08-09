export type TextAlignment = "left" | "center" | "right";

export interface TextLayer {
    id: string;
    label?: string;
    text: string;
    x: number; // px
    y: number; // px
    rotation?: number; // deg
    size?: number; // px
    color?: string; // hex
    maxWidth?: number; // px
    lineHeight?: number; // unit multiplier
    letterSpacing?: number; // px
    align?: TextAlignment;
    fontFamily?: string; // must match provided font name
    fontWeight?: number; // 100..900
    uppercase?: boolean;
}

export interface TemplatePayload {
    width: number;
    height: number;
    backgroundDataUrl?: string; // data:image/*;base64,...
    texts: TextLayer[];
}

export interface UploadedFont {
    name: string; // font family name to use in CSS
    dataB64: string; // base64 of the font file
    weight?: number; // 100..900
    style?: "normal" | "italic";
}

export interface VariantSetRequest {
    template: TemplatePayload;
    fonts?: UploadedFont[];
    // Number of variants to produce; each layer is expected to have `variants[i]`
    // provided in the `overrides` array or we will pick the layer.text.
    variants: Array<{
        overrideTexts: Record<string, string>; // { [layerId]: text }
        filename?: string; // optional custom filename
    }>;
    outputDir?: string; // relative dir under project root; default: "output"
}

export interface VariantSetResponse {
    outputDir: string;
    files: string[]; // absolute paths written on server
}

