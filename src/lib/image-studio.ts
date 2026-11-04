export const MAX_FILE_BYTES = 12 * 1024 * 1024;
export const MAX_INPUT_PIXELS = 24_000_000;
export const MAX_OUTPUT_SIDE = 4096;
export type RasterMime = "image/png" | "image/jpeg" | "image/webp";
export type ExportKind = "png" | "jpeg" | "webp" | "svg";
export type CropRect = { x: number; y: number; width: number; height: number };
export interface EditState {
  crop: CropRect; rotation: number; flipX: boolean; flipY: boolean;
  width: number; height: number; fit: "contain" | "cover";
  background: "transparent" | "paper" | "ink"; padding: number;
  text: string; textSize: number; textColor: "paper" | "ink";
}
export interface History { past: EditState[]; present: EditState; future: EditState[] }
export function initialEdit(width: number, height: number): EditState {
  const scale = Math.min(1, MAX_OUTPUT_SIDE / Math.max(width, height));
  return { crop: { x: 0, y: 0, width: 100, height: 100 }, rotation: 0, flipX: false, flipY: false, width: Math.round(width * scale), height: Math.round(height * scale), fit: "contain", background: "transparent", padding: 0, text: "", textSize: 48, textColor: "ink" };
}
export function changeHistory(h: History, next: EditState): History {
  if (JSON.stringify(h.present) === JSON.stringify(next)) return h;
  return { past: [...h.past.slice(-39), h.present], present: next, future: [] };
}
export function undoHistory(h: History): History {
  const previous = h.past.at(-1);
  return previous ? { past: h.past.slice(0, -1), present: previous, future: [h.present, ...h.future] } : h;
}
export function redoHistory(h: History): History {
  const next = h.future[0];
  return next ? { past: [...h.past, h.present], present: next, future: h.future.slice(1) } : h;
}
export function validateDimensions(width: number, height: number, output = false) {
  const maxSide = output ? MAX_OUTPUT_SIDE : 8192;
  const maxPixels = output ? MAX_OUTPUT_SIDE ** 2 : MAX_INPUT_PIXELS;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > maxSide || height > maxSide || width * height > maxPixels) {
    throw new Error(output ? "El tamaño debe estar entre 1 y 4096 píxeles por lado." : "La imagen supera 8192 píxeles por lado o 24 megapíxeles.");
  }
}
export function validateImageBytes(bytes: Uint8Array, declaredMime: string): RasterMime {
  if (!bytes.length) throw new Error("El archivo está vacío.");
  if (bytes.length > MAX_FILE_BYTES) throw new Error("El archivo supera el límite de 12 MB.");
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  let mime: RasterMime;
  if ([137,80,78,71,13,10,26,10].every((b, i) => bytes[i] === b)) {
    mime = "image/png";
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.length < 33) throw new Error("El PNG está incompleto.");
    validateDimensions(view.getUint32(16), view.getUint32(20));
    for (let i = 8; i + 12 <= bytes.length;) {
      const length = view.getUint32(i);
      if (ascii(i + 4, i + 8) === "acTL") throw new Error("No se admiten PNG animados (APNG).");
      if (i + length + 12 > bytes.length) throw new Error("El PNG está incompleto.");
      i += length + 12;
    }
  } else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) mime = "image/jpeg";
  else if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    mime = "image/webp";
    if (ascii(12, 16) === "VP8X" && ((bytes[20] ?? 0) & 2)) throw new Error("No se admiten WebP animados.");
  } else throw new Error("Formato no compatible. Importá PNG, JPG/JPEG o WebP estáticos. SVG, GIF, HEIC, PDF y otros formatos no se admiten.");
  if (declaredMime && declaredMime !== mime) throw new Error("El tipo declarado no coincide con el contenido real del archivo.");
  return mime;
}
export async function importLocalImage(file: File) {
  if (file.size > MAX_FILE_BYTES) throw new Error("El archivo supera el límite de 12 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = validateImageBytes(bytes, file.type);
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  try {
    const image = new Image(); image.src = url;
    await image.decode(); validateDimensions(image.naturalWidth, image.naturalHeight);
    return { image, url, name: file.name, mime };
  } catch (error) {
    URL.revokeObjectURL(url);
    if (error instanceof Error && error.message.includes("megapíxeles")) throw error;
    throw new Error("No se pudo decodificar la imagen. Puede estar dañada o no ser compatible con este navegador.");
  }
}
export function renderEdit(image: HTMLImageElement, edit: EditState, colors: { paper: string; ink: string }): HTMLCanvasElement {
  validateDimensions(edit.width, edit.height, true);
  const crop = edit.crop;
  if (crop.x < 0 || crop.y < 0 || crop.width <= 0 || crop.height <= 0 || crop.x + crop.width > 100.01 || crop.y + crop.height > 100.01) throw new Error("El recorte no es válido.");
  const sw = image.naturalWidth * crop.width / 100, sh = image.naturalHeight * crop.height / 100;
  const sideways = edit.rotation % 180 !== 0;
  const rw = sideways ? sh : sw, rh = sideways ? sw : sh;
  const canvas = document.createElement("canvas"); canvas.width = edit.width; canvas.height = edit.height;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Este navegador no permite editar con canvas.");
  if (edit.background !== "transparent") { ctx.fillStyle = colors[edit.background]; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  const pad = Math.min(edit.width, edit.height) * edit.padding / 100;
  const availableW = edit.width - 2 * pad, availableH = edit.height - 2 * pad;
  const scale = edit.fit === "cover" ? Math.max(availableW / rw, availableH / rh) : Math.min(availableW / rw, availableH / rh);
  ctx.save(); ctx.beginPath(); ctx.rect(pad, pad, availableW, availableH); ctx.clip();
  ctx.translate(edit.width / 2, edit.height / 2); ctx.rotate(edit.rotation * Math.PI / 180);
  ctx.scale(edit.flipX ? -scale : scale, edit.flipY ? -scale : scale);
  ctx.drawImage(image, image.naturalWidth * crop.x / 100, image.naturalHeight * crop.y / 100, sw, sh, -sw / 2, -sh / 2, sw, sh); ctx.restore();
  if (edit.text.trim()) {
    ctx.fillStyle = colors[edit.textColor]; ctx.font = `600 ${edit.textSize}px Manrope, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText(edit.text.slice(0, 120), edit.width / 2, edit.height - Math.max(12, pad), Math.max(1, edit.width - 24));
  }
  return canvas;
}
export function encodeCanvas(canvas: HTMLCanvasElement, mime: RasterMime, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (!blob || blob.type !== mime) reject(new Error("Este navegador no puede exportar ese formato. Probá PNG.")); else resolve(blob);
  }, mime, quality));
}
export function rasterSvg(width: number, height: number, pngDataUrl: string) {
  validateDimensions(width, height, true);
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(pngDataUrl)) throw new Error("El contenido del SVG generado no es válido.");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image width="${width}" height="${height}" href="${pngDataUrl}"/></svg>`;
}
export async function exportCanvas(canvas: HTMLCanvasElement, kind: ExportKind, paper: string): Promise<Blob> {
  if (kind === "svg") return new Blob([rasterSvg(canvas.width, canvas.height, canvas.toDataURL("image/png"))], { type: "image/svg+xml" });
  if (kind === "jpeg") {
    const opaque = document.createElement("canvas"); opaque.width = canvas.width; opaque.height = canvas.height;
    const ctx = opaque.getContext("2d"); if (!ctx) throw new Error("No se puede exportar.");
    ctx.fillStyle = paper; ctx.fillRect(0, 0, opaque.width, opaque.height); ctx.drawImage(canvas, 0, 0);
    return encodeCanvas(opaque, "image/jpeg");
  }
  return encodeCanvas(canvas, kind === "png" ? "image/png" : "image/webp");
}
export async function deliverImage(blob: Blob, name: string) {
  const file = new File([blob], name, { type: blob.type });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}