import { useI18n } from "@/lib/use-i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/ui-bits";
import { runLocalAction, useStore } from "@/lib/store";
import { activityToCsv, filterActivity } from "@/lib/activity";
import type { ActivityAction } from "@/lib/types";

export const Route = createFileRoute("/historial")({
  head: () => ({
    meta: [
      { title: "Historial de actividad · Campaña Clara" },
      { name: "description", content: "Registro local y exportable de acciones sobre campañas y recursos." },
      { property: "og:title", content: "Historial de actividad · Campaña Clara" },
      { property: "og:description", content: "Trazabilidad local de la preparación de campañas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

const ACTIONS: ActivityAction[] = ["crear", "editar", "eliminar", "duplicar", "importar", "exportar", "recurso", "perfil", "restablecer"];

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function HistoryPage() {
  const { tr, label, locale } = useI18n();
  const { activity, t, log } = useStore();
  const [action, setAction] = useState<"todas" | ActivityAction>("todas");
  const [q, setQ] = useState("");
  const list = filterActivity(activity, action, q);
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader eyebrow={t("hist.eyebrow")} title={t("hist.title")} subtitle={t("hist.subtitle")} action={
        <div className="flex gap-2">
          <Button variant="outline" disabled={!list.length} onClick={() => { save(new Blob([activityToCsv(list)], { type: "text/csv;charset=utf-8" }), `historial-${stamp}.csv`); void runLocalAction(() => log("exportar", "Historial", "CSV")); }}><Download /> {t("hist.csv")}</Button>
          <Button variant="outline" disabled={!list.length} onClick={() => { save(new Blob([JSON.stringify(list, null, 2)], { type: "application/json" }), `historial-${stamp}.json`); void runLocalAction(() => log("exportar", "Historial", "JSON")); }}><Download /> {t("hist.json")}</Button>
        </div>
      } />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input className="field sm:max-w-xs" aria-label={tr("Buscar en el historial")} placeholder={tr("Buscar…")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="field sm:max-w-[200px]" aria-label={tr("Filtrar por acción")} value={action} onChange={(e) => setAction(e.target.value as typeof action)}>
          <option value="todas">{t("hist.all")}</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{label(a)}</option>)}
        </select>
      </div>
      {list.length === 0 ? <div className="card-editorial p-10 text-center text-sm text-muted-foreground">{t("hist.empty")}</div> : (
        <div className="card-editorial overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="p-3">{tr("Fecha")}</th><th className="p-3">{tr("Acción")}</th><th className="p-3">{tr("Objeto")}</th><th className="p-3">{tr("Detalle")}</th></tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="whitespace-nowrap p-3 text-muted-foreground">{new Date(e.at).toLocaleString(locale)}</td>
                  <td className="p-3"><span className="rounded-full bg-teal-soft px-2 py-0.5 text-xs font-semibold text-accent-foreground">{label(e.action)}</span></td>
                  <td className="p-3 font-medium">{e.target}</td>
                  <td className="p-3 text-muted-foreground">{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
