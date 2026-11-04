import { useI18n } from "@/lib/use-i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runLocalAction, useStore } from "@/lib/store";
import { approvalBlockers, isValidUrl } from "@/lib/rules";
import { CHECKLIST, STATUS_LABEL, type CampaignStatus } from "@/lib/types";
import { Field, PageHeader, Safeguard, StatusBadge, formatDate } from "@/components/app/ui-bits";
import { ReviewActions } from '@/components/app/ReviewActions';
import { Poster } from '@/components/app/Poster';
import { campaignForLanguage } from '@/lib/campaign-content';
import type { Lang } from '@/lib/types';

export const Route = createFileRoute("/criterios")({
  validateSearch: (s: Record<string, unknown>): { id?: string } => (typeof s['id'] === "string" ? { id: s['id'] } : {}),
  head: () => ({
    meta: [
      { title: "Criterios editoriales · Campaña Clara" },
      { name: "description", content: "Lista de verificación y flujo de aprobación editorial." },
      { property: "og:title", content: "Criterios editoriales · Campaña Clara" },
      { property: "og:description", content: "Fuentes, derechos, accesibilidad y aprobación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Criteria,
});

function Criteria() {
  const { tr, label, locale } = useI18n();
  const { id } = Route.useSearch();
  const { campaigns, profile, upsertCampaign, ready } = useStore();
  const [filter,setFilter] = useState('revision');
  const [artLang,setArtLang] = useState<Lang>('es');
  const [sel, setSel] = useState(id ?? campaigns[0]?.id ?? "");
  useEffect(() => { if (ready) setSel(id ?? campaigns.find(c => c.status === 'revision')?.id ?? campaigns[0]?.id ?? ''); }, [id, ready]);
  const c = campaigns.find((x) => x.id === sel);

  const setStatus = (s: CampaignStatus) => void runLocalAction(() => {
    if (!c) return;
    if (s !== 'borrador' && s !== 'revision') return;
    upsertCampaign({ ...c, status: s, approvalDate: '' });
    toast.success(`${tr('Estado')}: ${label(STATUS_LABEL[s])}`);
  });

  return (
    <div>
      <PageHeader eyebrow={tr("Revisión")} title={tr("Criterios editoriales")} subtitle={tr("Una campaña temática sin fecha puede revisarse sin efeméride. Una efeméride requiere fuente confirmada.")} />
      <div className="mb-6"><Safeguard>{tr("La generación automática no equivale a aprobación institucional. La aprobación aquí es una simulación local.")}</Safeguard></div>
      <div className="mb-5 flex flex-wrap items-center gap-3"><h2 className="text-xl">{tr('Cola de revisión')} · {campaigns.filter(c => c.status === 'revision').length}</h2><select className="field max-w-xs" aria-label={tr('Estado')} value={filter} onChange={e => setFilter(e.target.value)}><option value="todos">{tr('Todos')}</option>{Object.entries(STATUS_LABEL).map(([key,value]) => <option key={key} value={key}>{label(value)}</option>)}</select></div>
      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-2">
          {campaigns.filter(x => filter === 'todos' || x.status === filter).map((x) => (
            <div key={x.id} className="border-b py-3"><Button variant="ghost" onClick={() => setSel(x.id)} className={`h-auto w-full flex-col items-stretch p-4 text-left whitespace-normal ${sel === x.id ? "ring-2 ring-teal" : ""}`}>
              <p className="font-semibold">{x.title}</p>
              <div className="mt-2 flex items-center justify-between"><StatusBadge status={x.status} /><span className="text-xs text-muted-foreground">{x.efemeride.enabled ? tr("Efeméride") : tr("Campaña temática")}</span></div>
            </Button><ReviewActions campaign={x}/></div>
          ))}
          {campaigns.filter(c => filter === 'todos' || c.status === filter).length === 0 && <p className="text-sm text-muted-foreground">{tr("No hay campañas para revisar.")}</p>}
        </div>
        {c && (
          <section className="card-editorial space-y-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-2xl font-semibold">{c.title}</h2><StatusBadge status={c.status} /></div>
            <select className="field max-w-40" aria-label={tr('Idioma del arte')} value={artLang} onChange={e => setArtLang(e.target.value as Lang)}><option value="es">ES</option><option value="en">EN</option></select><div className="mx-auto max-w-56"><Poster campaign={campaignForLanguage(c,artLang)} profile={profile} format={c.format}/></div>
            <p className="text-sm text-muted-foreground">{c.efemeride.enabled ? `${tr("Efeméride")}: ${c.efemeride.name || tr("sin nombre")} · ${formatDate(c.efemeride.date, locale)}` : tr("Campaña temática — no requiere fecha conmemorativa.")}</p>
            {c.efemeride.enabled && (
              <div className="space-y-2 rounded-lg border border-warn/30 bg-warn-soft/50 p-4">
                <Field label={tr("URL de la fuente")}><input className="field" placeholder="https://" value={c.efemeride.sourceUrl} onChange={(e) => void runLocalAction(() => upsertCampaign({ ...c, efemeride: { ...c.efemeride, sourceUrl: e.target.value, confirmed: false } }))} /></Field>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-teal" disabled={!isValidUrl(c.efemeride.sourceUrl)} checked={c.efemeride.confirmed} onChange={(e) => void runLocalAction(() => upsertCampaign({ ...c, efemeride: { ...c.efemeride, confirmed: e.target.checked } }))} /> {tr("Fuente revisada y confirmada manualmente")}</label>
              </div>
            )}
            <ul className="space-y-2">
              {CHECKLIST.filter((i) => c.efemeride.enabled || (i.key !== "fecha" && i.key !== "designacion")).map((i) => (
                <li key={i.key}>
                  <label className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50">
                    <input type="checkbox" className="mt-1 h-4 w-4 accent-teal" checked={!!c.checklist[i.key]} onChange={(e) => void runLocalAction(() => upsertCampaign({ ...c, checklist: { ...c.checklist, [i.key]: e.target.checked } }))} />
                    <span><span className="block text-sm font-semibold">{label(i.label)}</span><span className="text-xs text-muted-foreground">{label(i.hint)}</span></span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Persona revisora")}><input className="field" value={c.reviewer} onChange={(e) => void runLocalAction(() => upsertCampaign({ ...c, reviewer: e.target.value }))} /></Field>
              <Field label={tr("Fecha de aprobación")}><input className="field" readOnly value={c.approvalDate ? formatDate(c.approvalDate, locale) : "—"} /></Field>
            </div>
            <p className="text-xs text-muted-foreground">{tr("Última revisión:")}{c.updatedAt ? new Date(c.updatedAt).toLocaleString(locale) : "—"}</p>
            {approvalBlockers(c).length > 0 && <ul className="list-disc pl-5 text-xs text-warn">{approvalBlockers(c).map((b) => <li key={b}>{label(b)}</li>)}</ul>}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setStatus("borrador")}>{tr("Borrador")}</Button>
              <Button variant="outline" onClick={() => setStatus("revision")}>{tr("En revisión")}</Button>
              <ReviewActions campaign={c}/>
            </div>
            <h3 className="text-lg font-semibold">{tr('Historial de decisiones')}</h3>{!c.reviewHistory?.length && <p className="text-sm text-muted-foreground">{tr('Sin decisiones registradas')}</p>}<ol className="space-y-3">{[...(c.reviewHistory ?? [])].reverse().map(e => <li key={e.id} className="border-l-2 pl-3 text-sm"><strong>{tr(e.decision === 'aprobar' ? 'Aprobar' : e.decision === 'cambios' ? 'Solicitar cambios' : 'Denegar')} · {e.lang.toUpperCase()}</strong><p>{e.reviewer} · {new Date(e.at).toLocaleString(locale)}</p><p className="whitespace-pre-wrap text-muted-foreground">{e.comment}</p></li>)}</ol>
          </section>
        )}
      </div>
    </div>
  );
}
