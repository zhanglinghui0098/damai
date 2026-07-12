import type { NodeKind, ImageData, VideoData, OutputData } from "../types";
import type { AudioData } from "../types";

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickColors(seed: number): { a: string; b: string; c: string } {
  const palettes = [
    { a: "#6e8cd6", b: "#e87d6d", c: "#4ec9a8" },
    { a: "#5a7fbf", b: "#e8b86d", c: "#a896e0" },
    { a: "#4ec9a8", b: "#6e8cd6", c: "#e87d6d" },
    { a: "#a896e0", b: "#4ec9a8", c: "#e8b86d" },
  ];
  return palettes[seed % palettes.length];
}

function makeImageSvg(prompt: string, seed: number, kind: NodeKind): string {
  const { a, b, c } = pickColors(seed);
  const w = 512, h = 512;
  const shapeCount = 3 + (seed % 4);
  const shapes: string[] = [];
  for (let i = 0; i < shapeCount; i++) {
    const cx = ((seed >> (i * 3)) & 0xff) / 255 * w;
    const cy = ((seed >> (i * 3 + 4)) & 0xff) / 255 * h;
    const r = 30 + ((seed >> (i * 2)) & 0x3f);
    const col = [a, b, c][i % 3];
    shapes.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col}" opacity="0.72" />`
    );
  }
 const label = kind === "text" ? "TEXT" : kind === "image" ? "IMG" : "IMG>VIDEO";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${a}" stop-opacity="0.4"/>` +
    `<stop offset="1" stop-color="${b}" stop-opacity="0.4"/>` +
    `</linearGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#g${seed})"/>` +
    shapes.join("") +
    `<rect x="16" y="${h - 36}" width="${(prompt.length * 7) + 24}" height="22" rx="4" fill="rgba(0,0,0,0.6)"/>` +
    `<text x="28" y="${h - 20}" fill="#fff" font-family="monospace" font-size="12">${label} - ${escapeXml(prompt.slice(0, 32))}</text>` +
    `</svg>`;
  return svg;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => (
    { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]!
  ));
}

export type GenerateOpts = {
  prompt: string;
  inputImage?: string | null;
  strength?: number;
  quantity?: number;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
};

export type GenerateResult = {
  output: OutputData;
};

export async function generate(
  kind: NodeKind,
  opts: GenerateOpts
): Promise<GenerateResult> {
  const seed = hashStr(`${kind}|${opts.prompt}|${opts.inputImage ?? ""}`);
  const qty = opts.quantity || 1;
  const totalMs = (1500 + (seed % 1000)) * qty;
  const steps = 20;
  const stepMs = totalMs / steps;

  for (let i = 1; i <= steps; i++) {
    if (opts.signal?.aborted) {
      throw new DOMException("aborted", "AbortError");
    }
    await new Promise((r) => setTimeout(r, stepMs));
    opts.onProgress?.(Math.round((i / steps) * 100));
  }

  let output: OutputData;
  if (kind === "audio") {
    output = { kind: "audio", src: "" } as AudioData;
  } else {
    const svg = makeImageSvg(opts.prompt, seed, kind);
    const dataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    output =
      kind === "video"
        ? ({ kind: "video", src: dataUrl } as VideoData)
        : ({ kind: "image", src: dataUrl } as ImageData);
  }

  return { output };
}
