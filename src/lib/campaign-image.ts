import { useEffect, useState } from "react";
import { getBlob } from "./media";
import type { PosterImage } from "./poster";
import { stockById, svgDataUrl } from "./stock";
import type { CampaignImage, MediaMeta } from "./types";

const MAX_SIDE = 2400;
const blobToDataUrl = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(b); });

/** Decodes a library blob and downsizes it so posters stay light; output is always a PNG/JPEG data URL. */
async function libraryImage(blob: Blob): Promise<PosterImage> {
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  if (k === 1 && blob.type !== "image/webp") { bmp.close(); return { href: await blobToDataUrl(blob), w, h }; }
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  cv.getContext("2d")?.drawImage(bmp, 0, 0, w, h); bmp.close();
  return { href: cv.toDataURL(blob.type === "image/jpeg" ? "image/jpeg" : "image/png", 0.9), w, h };
}

export async function resolveCampaignImage(img: CampaignImage | undefined, media: MediaMeta[]): Promise<PosterImage | null> {
  if (!img) return null;
  if (img.source === "stock") {
    const s = stockById(img.ref);
    if (!s) return null;
    if (s.url) { const response = await fetch(s.url); if (!response.ok) throw new Error('Catalogue image unavailable'); return libraryImage(await response.blob()); }
    return { href: svgDataUrl(s.svg), w: s.w, h: s.h };
  }
  const meta = media.find((m) => m.id === img.ref);
  if (!meta || meta.kind !== "imagen") return null;
  const blob = await getBlob(meta.id);
  return blob ? libraryImage(blob) : null;
}

export function useCampaignImage(img: CampaignImage | undefined, media: MediaMeta[]) {
  const key = img ? `${img.source}:${img.ref}` : "";
  const [state, setState] = useState<{ key: string; image: PosterImage | null; missing: boolean }>({ key: "", image: null, missing: false });
  useEffect(() => {
    let alive = true;
    if (!img) { setState({ key: "", image: null, missing: false }); return; }
    setState({ key, image: null, missing: false });
    resolveCampaignImage(img, media).then((image) => alive && setState({ key, image, missing: !image })).catch(() => alive && setState({ key, image: null, missing: true }));
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return state.key === key ? state : { key, image: null, missing: false };
}
