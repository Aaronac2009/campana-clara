import { useI18n } from "@/lib/use-i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, ImagePlus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, PageHeader } from "@/components/app/ui-bits";
import { runLocalAction, useStore } from "@/lib/store";
import { deleteBlob, formatBytes, getBlob } from "@/lib/media";
import { parseTags } from "@/lib/campaign-filter";

export const Route = createFileRoute("/biblioteca/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de recurso · Campaña Clara" },
      { name: "description", content: "Vista previa, datos y etiquetas de un recurso multimedia local." },
      { property: "og:title", content: "Detalle de recurso · Campaña Clara" },
      { property: "og:description", content: "Previsualizá y asociá recursos a tus campañas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Resource,
});

function Resource() {
  const { tr, label, locale } = useI18n();
  const { id } = Route.useParams();
  const { media, campaigns, t, upsertMedia, removeMedia, log } = useStore();
  const navigate = useNavigate();
  const meta = media.find((m) => m.id === id);
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [alt, setAlt] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meta) return;
    setTags(meta.tags.join(", ")); setAlt(meta.alt); setCampaignId(meta.campaignId);
  }, [meta?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let u = "";
    let cancelled = false;
    setUrl(''); setLoading(true);
    getBlob(id).then((b) => { if (b && !cancelled) { u = URL.createObjectURL(b); setUrl(u); } }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; if (u) URL.revokeObjectURL(u); };
  }, [id]);

  if (!meta) return (
    <div className="card-editorial p-10 text-center">
      <p className="font-semibold">{t("res.notFound")}</p>
      <Link to="/biblioteca" className="mt-3 inline-block text-sm font-semibold text-teal">{t("res.back")}</Link>
    </div>
  );

  const linked = campaigns.find((c) => c.id === meta.campaignId);
  const rows: [string, string][] = [
    ["Tipo", `${label(meta.kind)} (${meta.mime})`], ["Tamaño", formatBytes(meta.size)],
    ["Dimensiones", meta.width ? `${meta.width} × ${meta.height} px` : "—"],
    ...(meta.duration ? [["Duración", `${meta.duration.toFixed(1)} s`] as [string, string]] : []),
    ["Añadido", new Date(meta.addedAt).toLocaleString(locale)],
  ];

  return (
    <div>
      <Link to="/biblioteca" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-teal"><ArrowLeft className="h-4 w-4" /> {t("res.back")}</Link>
      <PageHeader eyebrow={t("lib.title")} title={meta.name} subtitle={linked ? `${t("res.campaign")}: ${linked.title}` : t("res.none")} />
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="card-editorial flex items-center justify-center bg-secondary p-4">
          {!url ? <p role="status" className="p-10 text-sm text-muted-foreground">{loading ? tr("Cargando vista previa…") : tr('El archivo no está disponible en este navegador.')}</p>
            : meta.kind === "video" ? <video src={url} controls playsInline className="max-h-[70vh] w-full rounded-md" aria-label={meta.alt || meta.name} />
            : <img src={url} alt={meta.alt || meta.name} className="max-h-[70vh] w-auto rounded-md object-contain" />}
        </div>
        <div className="space-y-5">
          <section className="card-editorial p-5">
            <h2 className="mb-3 text-lg font-semibold">{t("res.meta")}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">{rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted-foreground">{label(k)}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
          </section>
          <form className="card-editorial space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); void runLocalAction(() => { upsertMedia({ ...meta, tags: parseTags(tags), alt: alt.slice(0, 300), campaignId }); toast.success(tr("Recurso actualizado")); }); }}>
            <Field label={t("res.campaign")}>
              <select className="field" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
                <option value="">{t("res.none")}</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </Field>
            <Field label={t("res.tags")}><input className="field" value={tags} onChange={(e) => setTags(e.target.value)} placeholder={tr("convivencia, afiche")} /></Field>
            <Field label={t("res.alt")}><input className="field" value={alt} maxLength={300} onChange={(e) => setAlt(e.target.value)} /></Field>
            <Button type="submit" className="w-full"><Save /> {t("res.save")}</Button>
          </form>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={!url} onClick={() => { const a = document.createElement("a"); a.href = url; a.download = meta.name; a.click(); void runLocalAction(() => log("exportar", meta.name, "Recurso descargado")); }}><Download /> {t("res.download")}</Button>
            <Button variant="outline" asChild><Link to="/estudio"><ImagePlus /> {t("res.studio")}</Link></Button>
            <Button variant="outline" className="col-span-2 text-destructive" onClick={async () => {
              if (!confirm(`${tr("Eliminar recurso de este navegador?")} ${meta.name}`)) return;
              // Remove metadata first; a failed local save must never delete the only image bytes.
              if (!await runLocalAction(() => removeMedia(meta.id))) return;
              try { await deleteBlob(meta.id); }
              catch { await runLocalAction(() => upsertMedia(meta)); toast.error(tr('No se pudo eliminar el recurso. Los datos se conservaron.')); return; }
              toast.success(tr("Recurso eliminado")); navigate({ to: "/biblioteca" });
            }}><Trash2 /> {t("res.delete")}</Button>
          </div>
          {meta.kind !== "video" && <p className="text-xs text-muted-foreground">{tr("El Estudio trabaja en privado y no lee la biblioteca: descargá el archivo y abrilo allí.")}</p>}
        </div>
      </div>
    </div>
  );
}
