import { useI18n } from "@/lib/use-i18n";
import { useRef, useState } from "react";
import { ImagePlus, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { newId, useStore } from "@/lib/store";
import { MediaError, putBlob, readMediaFile } from "@/lib/media";
import { StockCatalog } from './StockCatalog';
import { LibraryThumb } from "./LibraryThumb";

export type PickedImage = { source: "stock" | "media"; ref: string };

export function ImagePicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; onPick: (p: PickedImage) => void }) {
  const { tr, label } = useI18n();
  const { media, upsertMedia } = useStore();
  const [tab, setTab] = useState<"stock" | "mine">("stock");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mine = media.filter((m) => m.kind === "imagen" && (!q || m.name.toLowerCase().includes(q.toLowerCase())));
  const pick = (p: PickedImage) => { onPick(p); onOpenChange(false); };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await readMediaFile(file);
      if (r.kind !== "imagen") throw new MediaError("Para el arte usá PNG, JPEG o WebP. GIF y video se guardan en la Biblioteca, pero no se insertan en el afiche.");
      const id = newId();
      await putBlob(id, r.blob);
      upsertMedia({ id, name: file.name.slice(0, 120), kind: r.kind, mime: r.mime, size: r.blob.size, width: r.width, height: r.height, duration: undefined, tags: [], campaignId: "", alt: "", addedAt: new Date().toISOString() });
      toast.success(tr("Imagen guardada en la Biblioteca de este navegador"));
      pick({ source: "media", ref: id });
    } catch (e) {
      toast.error(e instanceof MediaError ? label(e.message) : tr("No se pudo guardar el recurso."));
    } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tr("Añadir imagen")}</DialogTitle>
          <DialogDescription>{tr("Elegí un recurso precargado o una imagen tuya; no se suben tus archivos a servidores.")}</DialogDescription>
        </DialogHeader>
        <div role="tablist" className="flex gap-2">
          {([["stock", "Catálogo precargado"], ["mine", "Mis archivos"]] as const).map(([k, l]) => (
            <Button variant={tab === k ? 'default' : 'outline'} key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label(l)}</Button>
          ))}
        </div>
        {tab === 'mine' && <label className="relative block"><span className="sr-only">{tr("Buscar imágenes")}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className="field pl-9" placeholder={tr("Buscar (salud, lectura, ambiente…)")} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>}
        {tab === "stock" ? (
          <StockCatalog onPick={s => pick({ source: 'stock', ref: s.id })}/>
        ) : (
          <>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} aria-label={tr("Subir imagen")} />
            <Button variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}><Upload /> {busy ? tr("Verificando…") : tr("Subir imagen (PNG, JPEG o WebP, máx. 25 MB)")}</Button>
            {mine.length === 0 ? <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><ImagePlus className="h-4 w-4" /> {tr("Aún no hay imágenes en tu Biblioteca.")}</p> : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {mine.map((m) => (
                  <li key={m.id}><button onClick={() => pick({ source: "media", ref: m.id })} className="w-full overflow-hidden rounded-lg border text-left hover:border-primary" aria-label={`${tr("Insertar")} ${m.name}`}>
                    <LibraryThumb id={m.id} />
                    <span className="block truncate px-2 py-1.5 text-xs font-semibold">{m.name}</span>
                  </button></li>
                ))}
              </ul>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
