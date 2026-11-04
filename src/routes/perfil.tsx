import { useI18n } from "@/lib/use-i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runLocalAction, useStore } from "@/lib/store";
import { INSTITUTION_TYPES, type Profile, type ThemePref } from "@/lib/types";
import { isSafeLogo, readLogoFile } from "@/lib/logo";
import { Field, PageHeader, Safeguard } from "@/components/app/ui-bits";
import { Poster } from "@/components/app/Poster";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil institucional · Campaña Clara" },
      { name: "description", content: "Identidad visual y datos de la institución para las campañas." },
      { property: "og:title", content: "Perfil institucional · Campaña Clara" },
      { property: "og:description", content: "Nombre, colores y logo autorizado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { tr, label, locale } = useI18n();
  const { profile, setProfile, campaigns, prefs, setPrefs, t } = useStore();
  const [p, setP] = useState<Profile>(profile);
  useEffect(() => setP(profile), [profile]);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }));
  const sample = campaigns[0];

  return (
    <div>
      <PageHeader eyebrow={tr("Identidad")} title={tr("Perfil y preferencias")} subtitle={tr("Preparado para escuelas, CTP, universidades, preescolares, hogares de personas adultas mayores y otras organizaciones.")} />
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <form className="min-w-0 card-editorial space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); try { setProfile(p); toast.success(tr("Perfil guardado en este navegador")); } catch { /* store reports failure; retain form */ } }}>
          <Field label={tr("Nombre oficial")}><input required maxLength={200} className="field" value={p.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Tipo de institución")}><select className="field" value={p.type} onChange={(e) => set("type", e.target.value)}>{INSTITUTION_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select></Field>
            <Field label={tr("Circuito / región (opcional)")} hint={tr("Dato ingresado por la institución; no verificado.")}><input className="field" value={p.region} onChange={(e) => set("region", e.target.value)} /></Field>
          </div>
          <Field label={tr("Eslogan")}><input className="field" maxLength={120} value={p.slogan} onChange={(e) => set("slogan", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tr("Encabezado del arte")} hint={tr("Franja superior, p. ej. dependencia o programa.")}><input className="field" maxLength={80} value={p.headerText ?? ""} onChange={(e) => set("headerText", e.target.value)} /></Field>
            <Field label={tr("Pie del arte")} hint={tr("P. ej. sitio web, teléfono o red social.")}><input className="field" maxLength={100} value={p.footerText ?? ""} onChange={(e) => set("footerText", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {(["primary", "secondary", "accent"] as const).map((k, i) => (
              <Field key={k} label={label(["Color primario", "Color secundario", "Color de acento"][i] ?? "Color")}>
                <input type="color" className="h-10 w-full cursor-pointer rounded-md border" value={p[k]} onChange={(e) => set(k, e.target.value)} />
              </Field>
            ))}
          </div>
          <div className="space-y-3 rounded-lg border p-4">
            <Safeguard>{tr("Subí un logo solo si contás con autorización para usarlo. No uses logos del MEP ni de entidades de gobierno.")}</Safeguard>
            <p className="text-sm font-semibold">{tr("Logo o escudo")}</p>
            <p className="text-xs text-muted-foreground">{tr("La imagen queda solo en este navegador; no se sube a ningún servidor.")}</p>
            <p className="text-xs text-muted-foreground">{tr('Logo no verificado oficialmente. PNG/JPEG/WebP, hasta 600 KB.')}</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
              <Upload className="h-4 w-4" /> {p.logoDataUrl ? tr("Cambiar logo") : tr("Subir logo (PNG, JPEG o WebP)")}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
                try { set("logoDataUrl", await readLogoFile(f)); toast.success(tr("Logo cargado para vista previa")); }
                catch (err) { toast.error(err instanceof Error ? label(err.message) : tr("No se pudo leer el archivo.")); }
              }} />
            </label>
            {!p.logoDataUrl && <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed text-center text-[10px] leading-tight text-muted-foreground">{tr("Añadir escudo/logo oficial")}</div>}
            {p.logoDataUrl && !isSafeLogo(p.logoDataUrl) && <p role="alert" className="text-xs font-semibold text-destructive">{tr("El logo guardado es SVG u otro formato no admitido y no se mostrará en el arte. Subí un PNG, JPEG o WebP.")}</p>}
            {p.logoDataUrl && isSafeLogo(p.logoDataUrl) && (
              <div className="flex items-center gap-3">
                <img src={p.logoDataUrl} alt={tr("Logo cargado")} className="h-16 w-16 rounded border object-contain" />
                <Button type="button" variant="ghost" size="sm" onClick={() => set("logoDataUrl", "")}>{tr("Quitar")}</Button>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-teal" checked={p.logoAuthorized} onChange={(e) => set("logoAuthorized", e.target.checked)} /> {tr("Confirmo que el uso de este logo está autorizado")}</label>
            {p.logoDataUrl && !p.logoAuthorized && <p className="text-xs text-warn">{tr("El logo no aparecerá en los afiches hasta confirmar la autorización.")}</p>}
          </div>
          <Button type="submit"><Save /> {tr("Guardar perfil")}</Button>
        </form>
        <section className="card-editorial space-y-4 p-6 lg:col-start-1" aria-labelledby="prefs-title">
          <h2 id="prefs-title" className="text-xl font-semibold">{t("pref.title")}</h2>
          <Field label={t("pref.lang")}>
            <select className="field" value={prefs.lang} onChange={(e) => void runLocalAction(() => setPrefs({ lang: e.target.value as "es" | "en" }))}><option value="es">{tr("Español")}</option><option value="en">English</option></select>
          </Field>
          <Field label={tr("Tema")}>
            <select className="field" value={prefs.theme ?? "system"} onChange={(e) => void runLocalAction(() => setPrefs({ theme: e.target.value as ThemePref }))}><option value="system">{tr("Tema del sistema")}</option><option value="light">{tr("Tema claro")}</option><option value="dark">{tr("Tema oscuro")}</option></select>
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-teal" checked={prefs.reduceMotion} onChange={(e) => void runLocalAction(() => setPrefs({ reduceMotion: e.target.checked }))} /> {t("pref.motion")}</label>
          <p className="text-xs text-muted-foreground">{tr("Se guardan al instante en este navegador.")}</p>
        </section>
        {sample && <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start"><p className="eyebrow mb-3">{tr("Vista previa con tu identidad")}</p><div className="mx-auto max-w-xs overflow-hidden rounded-md"><Poster campaign={{ ...sample, institutionName: p.name }} profile={p} format="afiche" /></div></div>}
      </div>
    </div>
  );
}
