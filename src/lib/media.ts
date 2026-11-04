import type { MediaKind } from "./types";

export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
export type MediaMime = "image/png" | "image/jpeg" | "image/webp" | "image/gif" | "video/mp4" | "video/webm";

const starts = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v);

/** Detects the real file type from its first bytes. Returns null for anything unsupported (SVG, HTML, etc). */
export function sniffMedia(b: Uint8Array): { mime: MediaMime; kind: MediaKind } | null {
  if (starts(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", kind: "imagen" };
  if (starts(b, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", kind: "imagen" };
  if (starts(b, [0x52, 0x49, 0x46, 0x46]) && starts(b, [0x57, 0x45, 0x42, 0x50], 8)) return { mime: "image/webp", kind: "imagen" };
  if (starts(b, [0x47, 0x49, 0x46, 0x38]) && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return { mime: "image/gif", kind: "gif" };
  if (starts(b, [0x66, 0x74, 0x79, 0x70], 4)) return { mime: "video/mp4", kind: "video" };
  if (starts(b, [0x1a, 0x45, 0xdf, 0xa3])) return { mime: "video/webm", kind: "video" };
  return null;
}

export class MediaError extends Error {}

export async function readMediaFile(file: File) {
  if (file.size === 0) throw new MediaError("El archivo está vacío.");
  if (file.size > MAX_MEDIA_BYTES) throw new MediaError("El archivo supera el límite de 25 MB.");
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const type = sniffMedia(head);
  if (!type) throw new MediaError("Formato no admitido. Usá PNG, JPEG, WebP, GIF, MP4 o WebM. SVG no se acepta por seguridad.");
  const blob = new Blob([await file.arrayBuffer()], { type: type.mime });
  const dims = await probe(blob, type.kind);
  return { blob, ...type, ...dims };
}

function probe(blob: Blob, kind: MediaKind): Promise<{ width?: number | undefined; height?: number | undefined; duration?: number | undefined }> {
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const done = (v: { width?: number | undefined; height?: number | undefined; duration?: number | undefined } | Error) => {
      URL.revokeObjectURL(url);
      if (v instanceof Error) reject(v); else resolve(v);
    };
    if (kind === "video") {
      const v = document.createElement("video");
      v.preload = "metadata"; v.muted = true;
      v.onloadedmetadata = () => done({ width: v.videoWidth, height: v.videoHeight, duration: Number.isFinite(v.duration) ? v.duration : undefined });
      v.onerror = () => done(new MediaError("El video está dañado o tu navegador no puede leerlo."));
      v.src = url;
    } else {
      const img = new Image();
      img.onload = () => done({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => done(new MediaError("La imagen está dañada o no se puede leer."));
      img.src = url;
    }
  });
}

// ---- IndexedDB blob storage (browser only; call from effects/handlers) ----
const DB = "campana-clara-media";
const STORE = "blobs";
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const req = fn(transaction.objectStore(STORE));
    transaction.oncomplete = () => { db.close(); resolve(req.result); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
    transaction.onabort = () => { db.close(); reject(transaction.error); };
  });
}
export const putBlob = (id: string, blob: Blob) => tx("readwrite", (s) => s.put(blob, id));
export const getBlob = (id: string) => tx<Blob | undefined>("readonly", (s) => s.get(id) as IDBRequest<Blob | undefined>);
export const deleteBlob = (id: string) => tx("readwrite", (s) => s.delete(id));

export const formatBytes = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
