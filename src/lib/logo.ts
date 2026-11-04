import { sniffMedia } from "./media";
import { validateImageBytes, validateDimensions } from './image-studio';

export const MAX_LOGO_BYTES = 600_000;
/** Only verified raster data URLs are drawn in artwork; SVG/other stored values are ignored, not deleted. */
export const isSafeLogo = (u: string) => /^data:image\/(png|jpeg|webp);base64,/.test(u);

export async function readLogoFile(f: File): Promise<string> {
  if (f.size === 0) throw new Error("El archivo está vacío.");
  if (f.size > MAX_LOGO_BYTES) throw new Error("El archivo supera 600 KB.");
  const t = sniffMedia(new Uint8Array(await f.slice(0, 16).arrayBuffer()));
  if (!t || t.kind !== "imagen") throw new Error("Usá PNG, JPEG o WebP. SVG no se acepta por seguridad.");
  const bytes = new Uint8Array(await f.arrayBuffer());
  validateImageBytes(bytes, f.type);
  const blob = new Blob([bytes], { type: t.mime });
  const bmp = await createImageBitmap(blob).catch(() => { throw new Error("La imagen está dañada o no se puede decodificar."); });
  try { validateDimensions(bmp.width, bmp.height); } finally { bmp.close(); }
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error("No se pudo leer el archivo.")); r.readAsDataURL(blob); });
}
