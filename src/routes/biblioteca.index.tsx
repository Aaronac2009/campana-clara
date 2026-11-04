import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Film, ImageIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Safeguard } from "@/components/app/ui-bits";
import { newId, useStore } from "@/lib/store";
import { formatBytes, getBlob, MediaError, putBlob, readMediaFile } from "@/lib/media";
import type { MediaKind, MediaMeta } from "@/lib/types";
import { useI18n } from '@/lib/use-i18n';
import { StockCatalog } from '@/components/app/StockCatalog';

export const Route = createFileRoute("/biblioteca/")({
  head: () => ({
    meta: [
      { title: "Biblioteca visual · Campaña Clara" },
      { name: "description", content: "Imágenes, GIF y videos de campaña guardados solo en este navegador." },
      { property: "og:title", content: "Biblioteca visual · Campaña Clara" },
      { property: "og:description", content: "Recursos visuales locales con filtros por tipo y etiquetas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Library,
});

export function Thumb({ meta, className = "" }: { meta: MediaMeta; className?: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let u = "";
    getBlob(meta.id).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u); } }).catch(() => {});
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [meta.id]);
  if (!url) return <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}>{meta.kind === "video" ? <Film /> : <ImageIcon />}</div>;
  return meta.kind === "video"
    ? <video src={url} muted playsInline preload="metadata" className={`object-cover ${className}`} aria-label={meta.alt || meta.name} />
    : <img src={url} alt={meta.alt || meta.name} className={`object-cover ${className}`} />;
}

function Library() {
  const navigate = useNavigate();
  const [source, setSource] = useState<'stock' | 'mine'>('stock');
  const { tr, label } = useI18n();
  const { media, t, upsertMedia } = useStore();
  const [kind, setKind] = useState<"todos" | MediaKind>("todos");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    for (const file of Array.from(files)) {
      try {
        const r = await readMediaFile(file);
        const id = newId();
        await putBlob(id, r.blob);
        upsertMedia({ id, name: file.name.slice(0, 200), kind: r.kind, mime: r.mime, size: r.blob.size, width: r.width, height: r.height, duration: r.duration, tags: [], campaignId: "", alt: "", addedAt: new Date().toISOString() });
        setSource('mine');
        toast.success(`${tr("Añadido")}: ${file.name}`);
      } catch (e) {
        toast.error(`${file.name}: ${e instanceof MediaError ? label(e.message) : tr("No se pudo guardar el recurso.")}`);
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  const needle = q.trim().toLowerCase();
  const list = media.filter((m) => (kind === "todos" || m.kind === kind) && (!needle || `${m.name} ${m.tags.join(" ")}`.toLowerCase().includes(needle)));
  const tabs: { k: "todos" | MediaKind; l: string }[] = [{ k: "todos", l: t("lib.all") }, { k: "imagen", l: t("lib.image") }, { k: "gif", l: t("lib.gif") }, { k: "video", l: t("lib.video") }];

  return (
    <div>
      <PageHeader eyebrow={t("lib.eyebrow")} title={t("lib.title")} subtitle={t("lib.subtitle")} action={
        <Button disabled={busy} onClick={() => input.current?.click()}><Upload /> {t("lib.upload")}</Button>
      } />
      <input ref={input} type="file" multiple hidden accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm" onChange={(e) => add(e.target.files)} />
      <div role="tablist" className="mb-6 flex flex-wrap gap-2 border-b pb-4">
        <Button role="tab" aria-selected={source === 'stock'} variant={source === 'stock' ? 'default' : 'outline'} onClick={() => setSource('stock')}>{tr('Catálogo precargado')}</Button>
        <Button role="tab" aria-selected={source === 'mine'} variant={source === 'mine' ? 'default' : 'outline'} onClick={() => setSource('mine')}>{tr('Mis archivos')} ({media.length})</Button>
      </div>
      {source === 'stock' ? <StockCatalog action="Crear campaña con esta imagen" onPick={s => navigate({ to: '/crear', search: { stock: s.id } })}/> : <>
      <div className="mb-5"><Safeguard>{t("lib.notice")}</Safeguard></div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input className="field sm:max-w-xs" placeholder={t("lib.filter")} aria-label={t("lib.filter")} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-1" role="group">
          {tabs.map((x) => (
            <button key={x.k} aria-pressed={kind === x.k} onClick={() => setKind(x.k)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${kind === x.k ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {x.l} ({x.k === "todos" ? media.length : media.filter((m) => m.kind === x.k).length})
            </button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <div className="card-editorial p-10 text-center text-sm text-muted-foreground">{t("lib.empty")}</div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {list.map((m) => (
            <li key={m.id}>
              <Link to="/biblioteca/$id" params={{ id: m.id }} className="card-editorial block overflow-hidden hover:border-teal/40 focus-visible:ring-2">
                <Thumb meta={m} className="aspect-square w-full" />
                <div className="p-3">
                  <p className="truncate text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{label(m.kind)} · {formatBytes(m.size)}{m.width ? ` · ${m.width}×${m.height}` : ""}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      </>}
    </div>
  );
}
