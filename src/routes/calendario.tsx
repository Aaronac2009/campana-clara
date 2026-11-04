import { useI18n } from "@/lib/use-i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { newId, runLocalAction, useStore } from "@/lib/store";
import { KIND_LABEL, type CalendarKind } from "@/lib/types";
import { Field, KindBadge, PageHeader, Safeguard, formatDate } from "@/components/app/ui-bits";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario editorial · Campaña Clara" },
      { name: "description", content: "Planificación de campañas temáticas y efemérides con estado de verificación." },
      { property: "og:title", content: "Calendario editorial · Campaña Clara" },
      { property: "og:description", content: "Fechas con fuente y campañas sin fecha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { tr, label, locale } = useI18n();
  const { calendar, upsertCalendar, deleteCalendar } = useStore();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"todos" | CalendarKind>("todos");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const list = calendar.filter((e) => (kind === "todos" || e.kind === kind) && e.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader eyebrow={tr("Planificación")} title={tr("Calendario editorial")} subtitle={tr("Distinguí campañas temáticas (sin fecha) de efemérides que requieren fuente.")} />
      <div className="mb-6"><Safeguard>{tr("Datos ilustrativos de demostración. Toda fecha debe verificarse con su fuente antes de cualquier uso institucional.")}</Safeguard></div>
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <input className="field sm:max-w-xs" placeholder={tr("Buscar en el calendario")} value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="flex flex-wrap gap-1">
              {(["todos", "verificada", "pendiente", "tematica"] as const).map((k) => (
                <button key={k} onClick={() => setKind(k)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${kind === k ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{k === "todos" ? tr("Todos") : label(KIND_LABEL[k])}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {list.map((e) => (
              <div key={e.id} className="card-editorial flex gap-4 p-5">
                <div className="w-20 shrink-0 text-center">
                  {e.date ? (<><p className="font-display text-3xl font-semibold">{Number(e.date.slice(8, 10))}</p><p className="text-xs uppercase text-muted-foreground">{new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(`${e.date}T12:00:00Z`))}</p></>) : <p className="text-xs text-muted-foreground">{tr("Sin fecha")}</p>}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold">{e.title}</h3><KindBadge kind={e.kind} /></div>
                  <p className="text-sm text-muted-foreground">{e.note}</p>
                  <p className="text-xs text-muted-foreground">{tr("Alcance:")} {e.scope} {tr("· Fuente:")} {e.sourceOrg || tr("no registrada")} {e.date && tr("· requiere validación")}</p>
                </div>
                <button aria-label={tr("Eliminar")} className="self-start text-muted-foreground hover:text-destructive" onClick={() => void runLocalAction(() => { deleteCalendar(e.id); toast.success(tr("Entrada eliminada")); })}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {list.length === 0 && <p className="text-sm text-muted-foreground">{tr("Sin resultados.")}</p>}
          </div>
        </div>
        <form className="card-editorial h-fit space-y-4 p-6" onSubmit={(ev) => {
          ev.preventDefault();
          void runLocalAction(() => {
          if (!title.trim()) { toast.error(tr("Escribí un título")); return; }
          upsertCalendar({ id: newId(), title, date, kind: date ? "pendiente" : "tematica", sourceOrg: "", scope: "Institucional", note: date ? "Fecha ingresada sin fuente. Pendiente de verificación." : "Campaña temática sin fecha." });
          setTitle(""); setDate(""); toast.success(tr("Entrada agregada")); });
        }}>
          <h2 className="text-xl font-semibold">{tr("Agregar entrada")}</h2>
          <Field label={tr("Título")}><input className="field" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label={tr("Fecha (opcional)")} hint={tr("Si agregás fecha, quedará como pendiente de fuente.")}><input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Button type="submit" className="w-full"><Plus /> {tr("Agregar")}</Button>
        </form>
      </div>
    </div>
  );
}
