import type { CampaignComposition, CampaignLayer, ImageLayer, ShapeLayer, TextLayer } from "./composition";
import { isSafeImageSource, validateComposition } from "./composition";

export interface CanvasExportOptions {
  scale?: number;
  background?: string;
  mimeType?: "image/png" | "image/jpeg" | "image/webp";
  quality?: number;
  maxPixels?: number;
}

export interface ExportResult {
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
  warnings: string[];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!isSafeImageSource(src)) return reject(new Error("La imagen usa una fuente no permitida."));
    const image = new Image();
    if (src.startsWith("https://")) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar una imagen. Revisá el archivo o los permisos CORS del servidor."));
    image.src = src;
  });
}

function drawImageLayer(ctx: CanvasRenderingContext2D, layer: ImageLayer, image: HTMLImageElement) {
  const sw = image.naturalWidth, sh = image.naturalHeight;
  if (!sw || !sh) throw new Error(`La imagen de la capa "${layer.name}" no tiene dimensiones válidas.`);
  const sourceRatio = sw / sh, targetRatio = layer.width / layer.height;
  if (layer.fit === "contain") {
    const scale = Math.min(layer.width / sw, layer.height / sh);
    const dw = sw * scale, dh = sh * scale;
    ctx.drawImage(image, (layer.width - dw) / 2, (layer.height - dh) / 2, dw, dh);
    return;
  }
  let sx = 0, sy = 0, sWidth = sw, sHeight = sh;
  if (layer.fit === "cover") {
    if (sourceRatio > targetRatio) { sWidth = sh * targetRatio; sx = (sw - sWidth) / 2; }
    else { sHeight = sw / targetRatio; sy = (sh - sHeight) / 2; }
  }
  ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, layer.width, layer.height);
}

function drawText(ctx: CanvasRenderingContext2D, layer: TextLayer) {
  ctx.fillStyle = layer.color;
  ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
  ctx.textAlign = layer.align;
  ctx.textBaseline = "top";
  const x = layer.align === "left" ? 0 : layer.align === "center" ? layer.width / 2 : layer.width;
  const lines = layer.text.split("\n");
  const lineHeight = layer.fontSize * layer.lineHeight;
  const totalHeight = lines.length * lineHeight;
  const startY = layer.verticalAlign === "middle" ? Math.max(0, (layer.height - totalHeight) / 2)
    : layer.verticalAlign === "bottom" ? Math.max(0, layer.height - totalHeight) : 0;
  lines.forEach((line, index) => {
    // Canvas letter spacing is not supported consistently; native fillText remains predictable.
    ctx.fillText(line, x, startY + index * lineHeight, layer.width);
  });
}

function drawShape(ctx: CanvasRenderingContext2D, layer: ShapeLayer) {
  ctx.beginPath();
  if (layer.shape === "ellipse") ctx.ellipse(layer.width / 2, layer.height / 2, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
  else if (layer.shape === "line") { ctx.moveTo(0, layer.height / 2); ctx.lineTo(layer.width, layer.height / 2); }
  else {
    const r = Math.min(layer.radius, layer.width / 2, layer.height / 2);
    ctx.roundRect(0, 0, layer.width, layer.height, r);
  }
  if (layer.shape !== "line") { ctx.fillStyle = layer.fill; ctx.fill(); }
  if (layer.strokeWidth > 0) { ctx.strokeStyle = layer.stroke; ctx.lineWidth = layer.strokeWidth; ctx.stroke(); }
}

async function drawLayer(ctx: CanvasRenderingContext2D, layer: CampaignLayer) {
  ctx.save();
  try {
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;
    ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
    ctx.rotate(layer.rotation * Math.PI / 180);
    ctx.translate(-layer.width / 2, -layer.height / 2);
    if (layer.kind === "text") drawText(ctx, layer);
    else if (layer.kind === "shape") drawShape(ctx, layer);
    else drawImageLayer(ctx, layer, await loadImage(layer.src));
  } finally {
    ctx.restore();
  }
}

/**
 * Exports the exact design-space composition. Cross-origin image servers must allow CORS.
 * Animated GIF/video layers are intentionally not silently flattened: add a still frame first.
 */
export async function exportComposition(
  composition: CampaignComposition,
  options: CanvasExportOptions = {},
): Promise<ExportResult> {
  const issues = validateComposition(composition);
  const errors = issues.filter(issue => issue.severity === "error");
  if (errors.length) throw new Error(`No se puede exportar: ${errors.map(x => x.message).join(" ")}`);
  const scale = Math.min(4, Math.max(0.25, options.scale ?? 1));
  const width = Math.round(composition.width * scale), height = Math.round(composition.height * scale);
  const maxPixels = options.maxPixels ?? 32_000_000;
  if (width * height > maxPixels) throw new Error("La exportación supera el límite seguro de píxeles. Reducí la escala o el tamaño del lienzo.");
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no pudo crear el lienzo de exportación.");
  ctx.scale(scale, scale);
  ctx.fillStyle = options.background ?? composition.background;
  ctx.fillRect(0, 0, composition.width, composition.height);
  const warnings = issues.filter(issue => issue.severity === "warning").map(issue => issue.message);
  for (const layer of [...composition.layers].filter(layer => layer.visible).sort((a, b) => a.zIndex - b.zIndex)) {
    try { await drawLayer(ctx, layer); }
    catch (error) { throw new Error(error instanceof Error ? error.message : `Falló la capa "${layer.name}".`); }
  }
  const mimeType = options.mimeType ?? "image/png";
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error("No se pudo generar el archivo de imagen.")), mimeType, options.quality ?? 0.92));
  return { blob, width, height, mimeType: blob.type, warnings };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
