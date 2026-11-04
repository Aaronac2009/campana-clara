import { useI18n } from "@/lib/use-i18n";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Copy, Download, Eye, ImagePlus, RefreshCw, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { newId, useStore } from "@/lib/store";
import { generateProposal, generateBilingual } from "@/lib/generator";
import { campaignText, downloadBlob, orientationOf, posterLayout, rasterize, slugify } from "@/lib/poster";
import { useCampaignImage } from "@/lib/campaign-image";
import { stockById } from "@/lib/stock";
import { ImagePicker } from "@/components/app/ImagePicker";
import { isValidUrl } from "@/lib/rules";
import { parseTags } from "@/lib/campaign-filter";
import { AUDIENCES, CAMPAIGN_TYPES, CHANNELS, CUSTOM_MAX, CUSTOM_MIN, DEFAULT_IMAGE, FORMAT_KEYS, FORMATS, INSTITUTION_TYPES, LANGUAGES, TONES, DEFAULT_BRAND, type BrandToggles, type Campaign, type CampaignImage, type FormatKey, type Orientation } from "@/lib/types";
import { Field, PageHeader, Safeguard } from "@/components/app/ui-bits";
import { Poster } from "@/components/app/Poster";
import { campaignForLanguage, contentFor, editContent , applyGenerated, missingFields, requiredLangs, hasContent } from '@/lib/campaign-content';
import type { CampaignContent, Lang } from '@/lib/types';

export const Route = createFileRoute("/crear")({
  validateSearch: (s: Record<string, unknown>): { id?: string; stock?: string } => ({ ...(typeof s['id'] === 'string' ? { id: s['id'] } : {}), ...(typeof s['stock'] === 'string' && stockById(s['stock']) ? { stock: s['stock'] } : {}) }),
  head: () => ({
    meta: [
      { title: "Crear campaña · Campaña Clara" },
      { name: "description", content: "Generá una propuesta de campaña institucional con vista previa del afiche." },
      { property: "og:title", content: "Crear campaña · Campaña Clara" },
      { property: "og:description", content: "Propuestas editables con vista previa y exportación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Create,
});

function blank(name: string): Campaign {
  const g = generateProposal({ theme: "Convivencia, respeto y hábitos saludables", campaignType: "Campaña temática", tone: "", audience: "Comunidad educativa", efemerideEnabled: false, efemerideName: "" });
  return {
    id: newId(), ...g, institutionType: "Colegio técnico profesional", institutionName: name, campaignType: "Campaña temática",
    theme: "Convivencia, respeto y hábitos saludables", audience: "Comunidad educativa", tone: "Formal e institucional", format: "afiche",
    language: "Español", date: "", efemeride: { enabled: false, name: "", date: "", sourceUrl: "", confirmed: false },
    status: "borrador", checklist: {}, reviewer: "", approvalDate: "", updatedAt: "",
  };
}

function Create() {
  const { tr, label, locale } = useI18n();
  const { id, stock } = Route.useSearch();
  const { campaigns, profile, media, upsertCampaign, ready } = useStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const navigate = useNavigate();
  const [c, setC] = useState<Campaign>(() => blank(profile.name));
  const [generated, setGenerated] = useState(false);
  const [tagText, setTagText] = useState("");
  const [artLang, setArtLang] = useState<Lang>('es');
  const loadedCampaign = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || loadedCampaign.current === (id ?? 'new')) return;
    const found = id && campaigns.find((x) => x.id === id);
    if (found) { setC(found); setGenerated(true); setTagText((found.tags ?? []).join(", ")); }
    else if (!id) { const next = blank(profile.name); if (stock) next.image = { ...DEFAULT_IMAGE, source: 'stock', ref: stock }; setC(next); setTagText(''); setArtLang('es'); }
    loadedCampaign.current = id ?? 'new';
  }, [id, stock, campaigns, profile.name, ready]);

  const set = <K extends keyof Campaign>(k: K, v: Campaign[K]) => setC((p) => ({ ...p, [k]: v }));
  const setEf = (patch: Partial<Campaign["efemeride"]>) => setC((p) => ({ ...p, efemeride: { ...p.efemeride, ...patch } }));

  const art = useCampaignImage(c.image, media);
  const selected = campaignForLanguage(c, artLang);
  const copyFields = contentFor(c, artLang);
  const setCopy = (patch: Partial<CampaignContent>) => setC(prev => editContent(prev, artLang, patch));
  const layout = posterLayout(selected, profile, c.format, art.image);
  const setImg = (patch: Partial<CampaignImage>) => setC((p) => (p.image ? { ...p, image: { ...p.image, ...patch } } : p));
  const imgName = c.image ? (c.image.source === "stock" ? (locale === 'en-US' ? stockById(c.image.ref)?.titleEn ?? label(stockById(c.image.ref)?.title ?? '') : stockById(c.image.ref)?.title) : media.find((m) => m.id === c.image?.ref)?.name) ?? tr("Imagen no disponible") : "";
  const groups: Record<Orientation, FormatKey[]> = { vertical: [], cuadrado: [], horizontal: [] };
  for (const k of FORMAT_KEYS) if (!FORMATS[k].planned && k !== "personalizado") groups[orientationOf(FORMATS[k].w, FORMATS[k].h)].push(k);

  const generate = (langs: Lang[] = requiredLangs(c)) => {
    const g = generateBilingual({ theme: c.theme, campaignType: c.campaignType, tone: c.tone, audience: c.audience, efemerideEnabled: c.efemeride.enabled, efemerideName: c.efemeride.name });
    const existing = langs.some(l => hasContent(c, l));
    const overwrite = existing ? confirm(tr('Ya hay texto en estos idiomas. ¿Reemplazarlo? Cancelar rellena solo los campos vacíos.')) : true;
    setC((p) => {
      const next = applyGenerated(p, { es: g.es, en: g.en }, langs, overwrite);
      return langs.includes('es') ? { ...next, note: g.es.note } : next;
    });
    setGenerated(true);
    setArtLang(langs[0] ?? 'es'); toast.success(tr("Propuesta generada"), { description: tr('Texto propio, sin traducción automática: los campos personalizados quedan vacíos en EN hasta que alguien los redacte.') });
  };
  const downloadBoth = async () => {
    for (const lang of ['es', 'en'] as const) {
      const sel = campaignForLanguage(c, lang);
      if (!sel.title.trim()) { toast.error(tr(lang === 'en' ? 'Versión inglesa incompleta: faltan campos esenciales.' : 'Versión española incompleta: faltan campos esenciales.')); return; }
    }
    if (c.image && !art.image) { toast.error(tr("La imagen aún no está lista o ya no existe. Cambiála o quitála antes de exportar.")); return; }
    try {
      for (const lang of ['es', 'en'] as const) {
        const sel = campaignForLanguage(c, lang);
        const l = posterLayout(sel, profile, c.format, art.image);
        downloadBlob(await rasterize(l.svg, l.w, l.h, 'image/png'), `${slugify(sel.title)}-${lang}-${l.w}x${l.h}.png`);
      }
      toast.success(tr('Paquete bilingüe PNG (ES + EN)'));
    } catch { toast.error(tr('No se pudo exportar.')); }
  };
  const save = (status: Campaign["status"]) => {
    if (c.endDate && c.startDate && c.endDate < c.startDate) { toast.error(tr('La fecha de fin es anterior a la de inicio.')); return; }
    try { upsertCampaign({ ...c, status }); } catch { return; }
    toast.success(status === "revision" ? tr("Marcada para revisión editorial") : tr("Borrador guardado en este navegador"));
    if (status === "revision") navigate({ to: "/criterios", search: { id: c.id } });
  };
  const copy = async () => {
    const text = campaignText(selected);
    try { await navigator.clipboard.writeText(text); toast.success(tr("Texto copiado")); }
    catch { window.prompt(tr("Copiá el texto manualmente:"), text); }
  };
  const download = async (kind: "svg" | "png" | "jpg") => {
    if (!selected.title.trim()) { toast.error(artLang === 'en' ? tr('Completar versión inglesa') : `${tr('Título')}: ${tr('Campo obligatorio')}`); return; }
    if (c.image && !art.image) { toast.error(tr("La imagen aún no está lista o ya no existe. Cambiála o quitála antes de exportar.")); return; }
    const { svg, w, h } = layout;
    const name = `${slugify(selected.title)}-${artLang}-${w}x${h}`;
    if (kind === "svg") { downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${name}.svg`); toast.success(`${tr('Descargar SVG')} · ${artLang.toUpperCase()} (${w}×${h})`); return; }
    try { downloadBlob(await rasterize(svg, w, h, kind === "png" ? "image/png" : "image/jpeg"), `${name}.${kind}`); toast.success(`${tr('Archivo preparado para descargar.')} ${artLang.toUpperCase()} (${w}×${h})`); }
    catch { toast.error(tr('No se pudo exportar.')); }
  };

  return (
    <div>
      <PageHeader eyebrow={tr("Nueva propuesta")} title={id ? tr("Editar campaña") : tr("Crear campaña")} subtitle={tr("La fecha es opcional. Una campaña temática no necesita estar vinculada a una efeméride.")} />
      <div className="campaign-editor grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <section className="card-editorial space-y-4 p-6">
            <h2 className="text-xl font-semibold">{tr("1 · Contexto")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={tr("Tipo de institución")}><select className="field" value={c.institutionType} onChange={(e) => set("institutionType", e.target.value)}>{INSTITUTION_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select></Field>
              <Field label={tr("Perfil institucional")}><input className="field" value={c.institutionName} onChange={(e) => set("institutionName", e.target.value)} /></Field>
              <Field label={tr("Tipo de campaña")}><select className="field" value={c.campaignType} onChange={(e) => { set("campaignType", e.target.value); if (e.target.value === "Conmemoración/efeméride") setEf({ enabled: true }); }}>{CAMPAIGN_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select></Field>
              <Field label={tr("Tema")}><input className="field" value={c.theme} onChange={(e) => set("theme", e.target.value)} /></Field>
              <Field label={tr("Público")}><select className="field" value={c.audience} onChange={(e) => set("audience", e.target.value)}>{AUDIENCES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select></Field>
              <Field label={tr("Tono")}><select className="field" value={c.tone} onChange={(e) => set("tone", e.target.value)}>{TONES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select></Field>
              <Field label={tr("Idioma del contenido")}><select className="field" value={c.language} onChange={(e) => set("language", e.target.value)}>{LANGUAGES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select></Field>
              <Field label={tr("Fecha de publicación (opcional)")}><input type="date" className="field" value={c.date} onChange={(e) => set("date", e.target.value)} /></Field>
              <Field label={tr("Canal")}><select className="field" value={c.channel ?? ""} onChange={(e) => set("channel", e.target.value)}><option value="">{tr("Sin definir")}</option>{CHANNELS.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select></Field>
              <Field label={tr("Inicio de difusión (opcional)")}><input type="date" className="field" value={c.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} /></Field>
              <Field label={tr("Fin de difusión (opcional)")}><input type="date" className="field" min={c.startDate || undefined} value={c.endDate ?? ""} onChange={(e) => set("endDate", e.target.value)} /></Field>
              <Field label={tr("Estado")}><select className="field" value={c.status} onChange={(e) => set("status", e.target.value as Campaign["status"])}><option value="borrador">{tr("Borrador")}</option><option value="revision">{tr("En revisión")}</option>{c.status === "aprobado" && <option value="aprobado">{tr("Aprobado")}</option>}{c.status === "observado" && <option value="observado">{tr("Cambios solicitados")}</option>}{c.status === 'denegado' && <option value="denegado">{tr('Denegado')}</option>}</select></Field>
            </div>
            <Field label={tr("Objetivo de la campaña")}><textarea rows={2} className="field" value={c.objective ?? ""} maxLength={500} onChange={(e) => set("objective", e.target.value)} placeholder={tr("¿Qué querés lograr con esta campaña?")} /></Field>
            <Field label={tr("Etiquetas (separadas por comas)")}><input className="field" value={tagText} onChange={(e) => { setTagText(e.target.value); set("tags", parseTags(e.target.value)); }} placeholder={tr("convivencia, valores")} /></Field>
            {c.endDate && c.startDate && c.endDate < c.startDate && <p role="alert" className="text-xs font-semibold text-destructive">{tr("La fecha de fin es anterior a la de inicio.")}</p>}
            <label className="flex items-center gap-3 rounded-lg border p-3 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-teal" checked={c.efemeride.enabled} onChange={(e) => setEf({ enabled: e.target.checked, confirmed: false })} /> {tr("Vincular a una efeméride")}</label>
            {c.efemeride.enabled && (
              <div className="space-y-3 rounded-lg border border-warn/30 bg-warn-soft/50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={tr("Nombre de la efeméride")}><input className="field" value={c.efemeride.name} onChange={(e) => setEf({ name: e.target.value })} /></Field>
                  <Field label={tr("Fecha")}><input type="date" className="field" value={c.efemeride.date} onChange={(e) => setEf({ date: e.target.value })} /></Field>
                </div>
                <Field label={tr("URL de la fuente")} hint={tr("Enlace a la fuente oficial que respalda la fecha.")}><input className="field" placeholder="https://" value={c.efemeride.sourceUrl} onChange={(e) => setEf({ sourceUrl: e.target.value, confirmed: false })} /></Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-teal" disabled={!isValidUrl(c.efemeride.sourceUrl)} checked={c.efemeride.confirmed} onChange={(e) => setEf({ confirmed: e.target.checked })} />
                  {tr("Revisé manualmente la fuente y confirma la fecha")}</label>
                <p className="text-xs font-semibold text-warn">{isValidUrl(c.efemeride.sourceUrl) && c.efemeride.confirmed ? tr("Fuente confirmada manualmente — aún requiere aprobación institucional.") : tr("Pendiente de verificación")}</p>
              </div>
            )}
            <Button onClick={() => generate()} className="w-full" size="lg"><Sparkles /> {tr("Generar propuesta")} · {requiredLangs(c).map(l => l.toUpperCase()).join(' + ')}</Button>
            <p className="text-xs text-muted-foreground">{tr('El idioma de la interfaz no cambia el idioma de la campaña.')}</p>
          </section>

          <section className="card-editorial space-y-4 p-6" aria-labelledby="fmt-h">
            <h2 id="fmt-h" className="text-xl font-semibold">{tr("Formato y canal")}</h2>
            <Field label={tr("Preset de publicación")} hint={tr("Medidas de referencia; verificá las especificaciones vigentes de cada plataforma.")}>
              <select className="field" value={c.format} onChange={(e) => set("format", e.target.value as FormatKey)}>
                {(["vertical", "cuadrado", "horizontal"] as const).map((o) => (
                  <optgroup key={o} label={o === "vertical" ? tr("Vertical") : o === "cuadrado" ? tr("Cuadrado") : tr("Horizontal")}>
                    {groups[o].map((k) => <option key={k} value={k}>{label(FORMATS[k].label)} · {FORMATS[k].w}×{FORMATS[k].h}</option>)}
                  </optgroup>
                ))}
                <optgroup label={tr("Otros")}><option value="personalizado">{tr("Medida personalizada")}</option>{c.format === "video" && <option value="video">{label(FORMATS.video.label)}</option>}</optgroup>
              </select>
            </Field>
            {c.format === "personalizado" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label={`${tr("Ancho")} (${CUSTOM_MIN}–${CUSTOM_MAX} px)`}><input type="number" className="field" min={CUSTOM_MIN} max={CUSTOM_MAX} value={c.customW ?? 1080} onChange={(e) => set("customW", Number(e.target.value))} /></Field>
                <Field label={`${tr("Alto")} (${CUSTOM_MIN}–${CUSTOM_MAX} px)`}><input type="number" className="field" min={CUSTOM_MIN} max={CUSTOM_MAX} value={c.customH ?? 1080} onChange={(e) => set("customH", Number(e.target.value))} /></Field>
              </div>
            )}
          </section>

          <section className="card-editorial space-y-4 p-6" aria-labelledby="img-h">
            <div className="flex items-center justify-between gap-2">
              <h2 id="img-h" className="text-xl font-semibold">{tr("Imagen")}</h2>
              {c.image && <span className="truncate text-sm text-muted-foreground">{imgName}</span>}
            </div>
            {!c.image ? (
              <Button variant="outline" className="w-full" onClick={() => setPickerOpen(true)}><ImagePlus /> {tr("Añadir imagen")}</Button>
            ) : (
              <>
                {art.missing && <p role="alert" className="text-sm font-semibold text-destructive">{tr("La imagen ya no está en este navegador. Elegí otra o quitála.")}</p>}
                {c.image.source === "stock" && <p className="text-xs text-muted-foreground">{stockById(c.image.ref)?.kind === 'photo' ? tr('Fotografía CC0') : tr('Ilustración original')}.</p>}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setPickerOpen(true)}><RefreshCw /> {tr("Cambiar imagen")}</Button>
                  <Button variant="outline" onClick={() => set("image", undefined)}><Trash2 /> {tr("Quitar")}</Button>
                </div>
                <Field label={tr("Encuadre")}>
                  <div role="radiogroup" className="flex gap-1">
                    {([["cover", "Cubrir"], ["contain", "Contener"], ["crop", "Recortar"]] as const).map(([k, l]) => (
                      <button key={k} role="radio" aria-checked={c.image?.fit === k} onClick={() => setImg({ fit: k })} className={`flex-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${c.image?.fit === k ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{label(l)}</button>
                    ))}
                  </div>
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  {c.image.fit === "contain" && <Range label={tr("Tamaño")} min={30} max={100} unit="%" value={c.image.size} onChange={(v) => setImg({ size: v })} />}
                  {c.image.fit === "crop" && <Range label={tr("Acercamiento")} min={100} max={250} unit="%" value={c.image.zoom} onChange={(v) => setImg({ zoom: v })} />}
                  <Range label={tr("Posición horizontal")} min={0} max={100} unit="%" value={c.image.focusX} onChange={(v) => setImg({ focusX: v })} />
                  <Range label={tr("Posición vertical")} min={0} max={100} unit="%" value={c.image.focusY} onChange={(v) => setImg({ focusY: v })} />
                  <Range label={tr("Oscurecer")} min={0} max={60} unit="%" value={c.image.shade} onChange={(v) => setImg({ shade: v })} />
                </div>
              </>
            )}
          </section>
          <section className="card-editorial space-y-3 p-6" aria-labelledby="brand-h">
            <h2 id="brand-h" className="text-xl font-semibold">{tr("Marca institucional")}</h2>
            <p className="text-xs text-muted-foreground">{tr("Mostrar en esta campaña. Los textos y el logo se editan en Perfil y preferencias.")}</p>
            <div className="grid grid-cols-2 gap-2">
              {([["logo", "Logo o escudo"], ["header", "Encabezado del arte"], ["footer", "Pie del arte"], ["slogan", "Eslogan"]] as [keyof BrandToggles, string][]).map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 rounded-md border p-2.5 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-teal" checked={(c.brand ?? DEFAULT_BRAND)[k]} onChange={(e) => set("brand", { ...(c.brand ?? DEFAULT_BRAND), [k]: e.target.checked })} /> {label(l)}
                </label>
              ))}
            </div>
          </section>
          <ImagePicker open={pickerOpen} onOpenChange={setPickerOpen} onPick={(p) => setC((x) => ({ ...x, image: { ...DEFAULT_IMAGE, ...(x.image ?? {}), ...p } }))} />

          {(
            <section className="card-editorial space-y-4 p-6">
              <h2 className="text-xl font-semibold">{tr("2 · Texto editable")}</h2>
              <div role="tablist" aria-label={tr('Idioma del arte')} className="flex gap-2">
                {(['es', 'en'] as const).map(lang => <Button key={lang} role="tab" aria-selected={artLang === lang} variant={artLang === lang ? 'default' : 'outline'} onClick={() => setArtLang(lang)}>{lang.toUpperCase()}</Button>)}
              </div>
              {artLang === 'en' && !copyFields.title && <p role="status" className="text-sm text-warn">{tr('Completar versión inglesa')}</p>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => generate([artLang === 'es' ? 'en' : 'es'])}>{tr(artLang === 'es' ? 'Generar EN' : 'Generar ES')}</Button>
                <Button size="sm" variant="outline" onClick={() => generate(['es', 'en'])}>{tr('Generar ambos')}</Button>
              </div>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-xs">
                  <caption className="sr-only">{tr('Comparar ES / EN')}</caption>
                  <thead><tr className="border-b bg-muted/50"><th scope="col" className="p-2 text-left">{tr('Comparar ES / EN')}</th><th scope="col" className="p-2 text-left">ES</th><th scope="col" className="p-2 text-left">EN</th></tr></thead>
                  <tbody>
                    {([['title', 'Título'], ['tagline', 'Mensaje'], ['bullets', 'Cuerpo (una idea por línea)'], ['cta', 'Llamado a la acción']] as const).map(([k, l]) => (
                      <tr key={k} className="border-b last:border-0 align-top">
                        <th scope="row" className="p-2 text-left font-medium">{tr(l)}</th>
                        {(['es', 'en'] as const).map(lang => { const v = contentFor(c, lang)[k]; const txt = Array.isArray(v) ? v.filter(Boolean).join(' · ') : v; return <td key={lang} lang={lang} className="p-2">{missingFields(c, lang).includes(k) ? <span className="font-medium text-warn">{tr(lang === 'en' ? 'Pendiente de traducción' : 'Falta')}</span> : txt}</td>; })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">{tr('Mensaje, cuerpo, CTA y eslogan son opcionales; no se copian de la otra versión.')}</p>
              <Field label={tr("Título")}><input maxLength={200} className="field" value={copyFields.title} onChange={(e) => setCopy({ title: e.target.value })} /></Field>
              <Field label={tr("Mensaje")}><input maxLength={300} className="field" value={copyFields.tagline} onChange={(e) => setCopy({ tagline: e.target.value })} /></Field>
              <Field label={tr("Cuerpo (una idea por línea)")}><textarea rows={5} className="field" value={copyFields.bullets.join("\n")} onChange={(e) => setCopy({ bullets: e.target.value.split("\n").slice(0,12) })} /></Field>
              <Field label={tr("Llamado a la acción")}><input maxLength={300} className="field" value={copyFields.cta} onChange={(e) => setCopy({ cta: e.target.value })} /></Field>
              <Field label={tr('Eslogan')}><input maxLength={120} className="field" value={copyFields.slogan} onChange={e => setCopy({ slogan: e.target.value })} /></Field>
              <Field label={tr("Nota editorial")}><input className="field" value={c.note} onChange={(e) => set("note", e.target.value)} /></Field>
            </section>
          )}
        </div>

        <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <section className="card-editorial space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">{tr("Vista previa")}</h2>
              <select className="field max-w-40" aria-label={tr('Idioma del arte')} value={artLang} onChange={e => setArtLang(e.target.value as Lang)}><option value="es">ES</option><option value="en">EN</option></select>
              <div className="flex flex-wrap gap-1">
                {(["afiche", "cuadrado", "historia", "fb_h"] as FormatKey[]).map((k) => (
                  <button key={k} onClick={() => set("format", k)} aria-pressed={c.format === k} className={`rounded-full border px-3 py-1 text-xs font-semibold ${c.format === k ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{k === "afiche" ? "4:5" : k === "cuadrado" ? "1:1" : k === "historia" ? "9:16" : tr("Horizontal")}</button>
                ))}
              </div>
            </div>
            {FORMATS[c.format].planned && <Safeguard>{tr("GIF/video es un formato planificado. Se muestra la versión estática.")}</Safeguard>}
            <p className="text-center text-xs font-semibold text-muted-foreground">{label(FORMATS[c.format].label)} · {layout.w}×{layout.h} px</p>
            <div className={`mx-auto overflow-hidden rounded-md ${layout.orientation === "horizontal" ? "max-w-full" : "max-w-sm"}`}><Poster campaign={selected} profile={profile} format={c.format} image={art.image} /></div>
            {(layout.hiddenBullets > 0 || layout.titleTruncated || layout.scale < 1) && (
              <p role="status" className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn-soft/50 p-3 text-xs font-semibold text-warn">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{tr('El texto se ajustó al formato. Revisá la vista previa o acortá el contenido.')} · {Math.round(layout.scale * 100)}% · {tr('Ideas ocultas')}: {layout.hiddenBullets}{layout.titleTruncated ? ` · ${tr('Título acortado')}` : ''}</span>
              </p>
            )}
            <p className="text-center text-xs text-muted-foreground">{c.note}</p>
            <Safeguard>{tr("La generación automática no equivale a aprobación institucional.")}</Safeguard>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={copy}><Copy /> {tr("Copiar texto")}</Button>
              <Button variant="outline" onClick={() => save("borrador")}><Save /> {tr("Guardar borrador")}</Button>
              <Button variant="outline" onClick={() => download("png")}><Download /> PNG · {artLang.toUpperCase()}</Button>
              <Button variant="outline" onClick={() => download("jpg")}><Download /> JPG · {artLang.toUpperCase()}</Button>
              <Button variant="outline" className="col-span-2" onClick={() => download("svg")}><Download /> SVG · {artLang.toUpperCase()}</Button>
              <Button variant="outline" className="col-span-2" onClick={downloadBoth}><Download /> {tr('Paquete bilingüe PNG (ES + EN)')}</Button>
              <Button className="col-span-2" onClick={() => save("revision")}><Eye /> {tr("Enviar a revisión")}</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Range({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm font-semibold">
      <span className="flex justify-between">{label}<span className="font-normal text-muted-foreground">{value}{unit}</span></span>
      <input type="range" className="mt-1 w-full accent-teal" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
