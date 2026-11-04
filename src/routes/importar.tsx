import { useI18n } from "@/lib/use-i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, FileUp, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Safeguard } from "@/components/app/ui-bits";
import { runLocalAction, useStore } from "@/lib/store";
import { BackupError, buildBackup, MAX_BACKUP_BYTES, parseBackup, type Backup } from "@/lib/backup";

export const Route = createFileRoute("/importar")({
  head: () => ({
    meta: [
      { title: "Importar y exportar · Campaña Clara" },
      { name: "description", content: "Respaldá y recuperá campañas, calendario, perfil e historial con validación segura." },
      { property: "og:title", content: "Importar y exportar · Campaña Clara" },
      { property: "og:description", content: "Respaldo local verificado antes de importar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Transfer,
});

function Transfer() {
  const { tr, label, locale } = useI18n();
  const { campaigns, calendar, profile, activity, media, importBackup, log, t } = useStore();
  const [pending, setPending] = useState<{ name: string; backup: Backup } | null>(null);
  const [withProfile, setWithProfile] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const exportAll = () => {
    const b = buildBackup({ campaigns, calendar, profile, activity, media });
    const url = URL.createObjectURL(new Blob([JSON.stringify(b, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `campana-clara-respaldo-${b.exportedAt.slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    void runLocalAction(() => log("exportar", "Respaldo", `${campaigns.length} campañas`));
    toast.success(tr("Respaldo descargado"));
  };

  const pick = async (f: File | undefined) => {
    setError(""); setPending(null);
    if (!f) return;
    try {
      if (f.size > MAX_BACKUP_BYTES) throw new BackupError("El archivo supera el límite de 2 MB.");
      setPending({ name: f.name, backup: parseBackup(await f.text()) });
    } catch (e) {
      setError(e instanceof BackupError ? (label(e.message) === e.message && locale === 'en-US' ? tr('Validación del respaldo fallida.') : label(e.message)) : tr("No se pudo leer el archivo."));
    } finally {
      if (input.current) input.current.value = "";
    }
  };

  const ids = new Set(campaigns.map((c) => c.id));
  const b = pending?.backup;

  return (
    <div>
      <PageHeader eyebrow={t("io.eyebrow")} title={t("io.title")} subtitle={t("io.subtitle")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-editorial space-y-4 p-6">
          <h2 className="text-xl font-semibold">{tr("Exportar")}</h2>
          <p className="text-sm text-muted-foreground">{campaigns.length} {tr("campañas ·")}{calendar.length} {tr("fechas ·")}{activity.length} {tr("registros ·")}{media.length} {tr("recursos (solo datos).")}</p>
          <Safeguard>{t("io.mediaNote")}</Safeguard>
          <Button onClick={exportAll}><Download /> {t("io.export")}</Button>
        </section>
        <section className="card-editorial space-y-4 p-6">
          <h2 className="text-xl font-semibold">{tr("Importar")}</h2>
          <p className="flex gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-ok" /> {tr("Se revisa cada campo antes de cambiar algo. Se combinan los datos: nada local se borra.")}</p>
          <input ref={input} type="file" accept="application/json,.json" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <Button variant="outline" onClick={() => input.current?.click()}><FileUp /> {t("io.import")}</Button>
          {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">{label(error)}</p>}
          {b && pending && (
            <div className="space-y-3 rounded-lg border border-teal/40 bg-teal-soft/40 p-4 text-sm" aria-live="polite">
              <p className="font-semibold">{pending.name} {tr("· válido")}</p>
              <ul className="list-disc pl-5 text-muted-foreground">
                <li>{b.campaigns.filter((c) => !ids.has(c.id)).length} {tr("campañas nuevas,")}{b.campaigns.filter((c) => ids.has(c.id)).length} {tr("reemplazarán a la versión local con el mismo identificador")}</li>
                <li>{b.calendar.length} {tr("fechas de calendario ·")}{b.activity.length} {tr("registros de historial")}</li>
                <li>{b.media.length} {tr("datos de recursos (solo se aplican a archivos que ya están en este navegador)")}</li>
              </ul>
              {b.profile && <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-teal" checked={withProfile} onChange={(e) => setWithProfile(e.target.checked)} /> {tr("Reemplazar también el perfil institucional (")}{b.profile.name})</label>}
              <div className="flex gap-2">
                <Button onClick={() => { try { const s = importBackup(b, { profile: withProfile }); setPending(null); toast.success(`${tr('Importado')}: ${s.campaigns.added} ${tr('nuevas')}, ${s.campaigns.updated} ${tr('actualizadas')}`); } catch { /* retain pending backup */ } }}>{t("io.confirm")}</Button>
                <Button variant="ghost" onClick={() => setPending(null)}>{t("io.cancel")}</Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
