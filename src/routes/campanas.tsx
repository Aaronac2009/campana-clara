import { useI18n } from "@/lib/use-i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runLocalAction, useStore } from "@/lib/store";
import { CHANNELS, STATUS_LABEL, type CampaignStatus } from "@/lib/types";
import { allTags, DEFAULT_FILTER, filterCampaigns, type CampaignFilter } from "@/lib/campaign-filter";
import { PageHeader, StatusBadge, formatDate } from "@/components/app/ui-bits";
import { Poster } from "@/components/app/Poster";
import { ReviewActions } from '@/components/app/ReviewActions';

export const Route = createFileRoute("/campanas")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s['q'] === "string" ? { q: s['q'] } : {}),
  head: () => ({
    meta: [
      { title: "Mis campañas · Campaña Clara" },
      { name: "description", content: "Gestioná borradores, campañas en revisión y aprobadas." },
      { property: "og:title", content: "Mis campañas · Campaña Clara" },
      { property: "og:description", content: "Listado de campañas institucionales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Campaigns,
});

function Campaigns() {
  const { tr, label, locale } = useI18n();
  const { q: initial } = Route.useSearch();
  const { campaigns, profile, deleteCampaign, duplicateCampaign } = useStore();
  const navigate = useNavigate();
  const [f, setF] = useState<CampaignFilter>({ ...DEFAULT_FILTER, q: initial ?? "" });
  const set = (p: Partial<CampaignFilter>) => setF((x) => ({ ...x, ...p }));
  useEffect(() => set({ q: initial ?? "" }), [initial]);
  const { q, status } = f;
  const setQ = (v: string) => set({ q: v });
  const setStatus = (v: "todos" | CampaignStatus) => set({ status: v });
  const tags = allTags(campaigns);
  const list = filterCampaigns(campaigns, f);

  return (
    <div>
      <PageHeader eyebrow={tr("Archivo")} title={tr("Mis campañas")} subtitle={tr("Guardadas solo en este navegador.")} action={<Button asChild><Link to="/crear"><Plus /> {tr("Nueva campaña")}</Link></Button>} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input className="field sm:max-w-xs" placeholder={tr("Filtrar por título o tema")} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-1">
          {(["todos", "borrador", "revision", "aprobado", "observado", "denegado"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${status === s ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{s === "todos" ? tr("Todos") : label(STATUS_LABEL[s])}</button>
          ))}
        </div>
      </div>
      <div className="-mt-3 mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select className="field" aria-label={tr("Canal")} value={f.channel} onChange={(e) => set({ channel: e.target.value })}><option value="">{tr("Todos los canales")}</option>{CHANNELS.map((c) => <option key={c} value={c}>{label(c)}</option>)}</select>
        <select className="field" aria-label={tr("Etiqueta")} value={f.tag} onChange={(e) => set({ tag: e.target.value })}><option value="">{tr("Todas las etiquetas")}</option>{tags.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        <select className="field" aria-label={tr("Tipo")} value={f.kind} onChange={(e) => set({ kind: e.target.value as CampaignFilter["kind"] })}><option value="todas">{tr("Efeméride y temática")}</option><option value="efemeride">{tr("Solo efemérides")}</option><option value="tematica">{tr("Solo temáticas")}</option></select>
        <select className="field" aria-label={tr("Ordenar")} value={f.sort} onChange={(e) => set({ sort: e.target.value as CampaignFilter["sort"] })}><option value="recientes">{tr("Más recientes")}</option><option value="titulo">{tr("Título (A–Z)")}</option><option value="fecha">{tr("Fecha de inicio")}</option></select>
      </div>
      <p className="mb-4 text-xs text-muted-foreground" aria-live="polite">{list.length} {tr("de")} {campaigns.length} {tr("campañas")}</p>
      {list.length === 0 ? (
        <div className="card-editorial p-10 text-center text-sm text-muted-foreground">{tr("No hay campañas con estos filtros.")}<Link to="/crear" className="font-semibold text-teal">{tr("Crear una")}</Link></div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <article key={c.id} className="card-editorial overflow-hidden">
              <div className="bg-secondary p-5"><div className="mx-auto w-40 overflow-hidden rounded-md shadow-lift"><Poster campaign={c} profile={profile} format="afiche" /></div></div>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-2"><StatusBadge status={c.status} /><span className="text-xs text-muted-foreground">{c.efemeride.enabled ? tr("Efeméride") : tr("Campaña temática")}</span></div>
                <h3 className="text-lg font-semibold leading-snug">{c.title}</h3>
                <p className="text-xs text-muted-foreground">{c.theme} · {c.date ? formatDate(c.date, locale) : tr("Sin fecha")}{c.channel ? ` · ${label(c.channel)}` : ""}</p>
                {!!c.tags?.length && <div className="flex flex-wrap gap-1">{c.tags.map((t) => <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">#{t}</span>)}</div>}
                {c.status === 'revision' && <ReviewActions campaign={c}/>}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => navigate({ to: "/crear", search: { id: c.id } })}><Pencil /> {tr("Editar")}</Button>
                  <Button size="sm" variant="outline" onClick={() => void runLocalAction(() => { duplicateCampaign(c.id); toast.success(tr("Campaña duplicada como borrador")); })}><Copy /> {tr("Duplicar")}</Button>
                  <Button size="sm" variant="ghost" aria-label={tr("Eliminar")} onClick={() => void runLocalAction(() => { if (confirm(`${tr("¿Eliminar esta campaña?")} ${c.title}`)) { deleteCampaign(c.id); toast.success(tr("Campaña eliminada")); } })}><Trash2 className="text-destructive" /></Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
