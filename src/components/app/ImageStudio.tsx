import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/use-i18n";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import { ArrowLeftRight, Crop, Download, FlipHorizontal2, FlipVertical2, ImagePlus, Redo2, RotateCcw, RotateCw, ShieldCheck, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, PageHeader } from "./ui-bits";
import { changeHistory, deliverImage, exportCanvas, importLocalImage, initialEdit, redoHistory, renderEdit, undoHistory, type EditState, type ExportKind, type History } from "@/lib/image-studio";

type Source = Awaited<ReturnType<typeof importLocalImage>>;
export function ImageStudio() {
  const { tr, label, locale } = useI18n();
  const { prefs: { theme } } = useStore();
  const [source, setSource] = useState<Source | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false); const [dragging, setDragging] = useState(false);
  const [cropping, setCropping] = useState(false); const [crop, setCrop] = useState<PercentCrop>({ unit: "%", x: 0, y: 0, width: 100, height: 100 });
  const [compare, setCompare] = useState(false); const [kind, setKind] = useState<ExportKind>("png");
  const [prepared, setPrepared] = useState<Blob | null>(null); const [exporting, setExporting] = useState(false);
  const [size, setSize] = useState({ width: "", height: "" }); const [locked, setLocked] = useState(true);
  const input = useRef<HTMLInputElement>(null); const preview = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null); const importVersion = useRef(0);
  const edit = history?.present;
  const commit = useCallback((patch: Partial<EditState>) => { setHistory(h => h ? changeHistory(h, { ...h.present, ...patch }) : h); setPrepared(null); setNotice(""); setError(""); }, []);
  const undo = useCallback(() => { setHistory(h => h ? undoHistory(h) : h); setPrepared(null); setError(""); }, []);
  const redo = useCallback(() => { setHistory(h => h ? redoHistory(h) : h); setPrepared(null); setError(""); }, []);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select,[contenteditable]")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
      if (e.key === "Escape") setCropping(false);
    };
    window.addEventListener("keydown", handle); return () => window.removeEventListener("keydown", handle);
  }, [undo, redo]);
  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url); }, [source]);
  useEffect(() => () => { importVersion.current++; }, []);
  useEffect(() => {
    if (!source || !edit || !preview.current) return;
    const styles = getComputedStyle(document.documentElement);
    try {
      const rendered = renderEdit(source.image, edit, { paper: styles.getPropertyValue("--card").trim(), ink: styles.getPropertyValue("--foreground").trim() });
      rendered.setAttribute("role", "img"); rendered.setAttribute("aria-label", tr("Imagen editada"));
      preview.current.replaceChildren(rendered); canvas.current = rendered;
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo editar la imagen."); canvas.current = null; }
    setPrepared(null); setSize({ width: String(edit.width), height: String(edit.height) });
  }, [source, edit, compare, cropping, locale, theme]);
  async function load(files: FileList | File[]) {
    if (files.length !== 1) { setError("Importá una sola imagen a la vez."); return; }
    const file = files[0]; if (!file) return;
    const version = ++importVersion.current; setLoading(true); setError(""); setNotice("");
    try {
      const next = await importLocalImage(file);
      if (version !== importVersion.current) { URL.revokeObjectURL(next.url); return; }
      setSource(next); setHistory({ past: [], present: initialEdit(next.image.naturalWidth, next.image.naturalHeight), future: [] });
      setCropping(false); setCompare(false); setPrepared(null); setNotice("Imagen importada. El archivo permanece en este dispositivo.");
    } catch (err) { if (version === importVersion.current) setError(err instanceof Error ? err.message : "No se pudo importar."); }
    finally { if (version === importVersion.current) setLoading(false); if (input.current) input.current.value = ""; }
  }
  function dimension(axis: "width" | "height", value: string) {
    setSize(s => {
      const next = { ...s, [axis]: value };
      if (locked && edit && Number(value) > 0) next[axis === "width" ? "height" : "width"] = String(Math.max(1, Math.round(Number(value) * (axis === "width" ? edit.height / edit.width : edit.width / edit.height))));
      return next;
    });
  }
  async function prepare() {
    if (!canvas.current) return;
    setExporting(true); setError("");
    try {
      const blob = await exportCanvas(canvas.current, kind, getComputedStyle(document.documentElement).getPropertyValue("--card").trim());
      setPrepared(blob); setNotice("Archivo preparado para descargar.");
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo exportar."); }
    finally { setExporting(false); }
  }
  const labelText = label;
  const tool = (label: string, icon: React.ReactNode, action: () => void, disabled = false) => <Button variant="outline" size="icon" title={labelText(label)} aria-label={labelText(label)} disabled={disabled || !source || loading || exporting || cropping} onClick={action}>{icon}</Button>;
  return <div className="space-y-6">
    <PageHeader eyebrow={tr("Taller creativo · local")} title={tr("Estudio de imágenes")} action={<Button onClick={() => input.current?.click()} disabled={loading || exporting}><ImagePlus />{source ? tr("Cambiar imagen") : tr("Importar imagen")}</Button>} />
    <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" aria-label={tr("Importar archivo de imagen")} className="sr-only" tabIndex={-1} onChange={e => { if (e.target.files) void load(e.target.files); }} />
    <p className="flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-teal" />{tr("Edición privada en este navegador. No enviamos ni guardamos imágenes en servidores. Al salir del estudio se pierde la sesión.")}</p>
    {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{label(error)}</div>}
    <p role="status" aria-live="polite" className="text-sm text-teal">{loading ? tr("Validando y decodificando imagen…") : label(notice)}</p>
    <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }} onDrop={e => { e.preventDefault(); setDragging(false); if (!loading && !exporting) void load(e.dataTransfer.files); }} className={dragging ? "rounded-lg ring-2 ring-teal" : ""}>
      {!source || !edit ? <section className="studio-drop flex min-h-80 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 text-center">
        <ImagePlus className="h-12 w-12 text-teal" /><h2 className="text-2xl">{tr("Tu próxima imagen empieza aquí")}</h2>
        <p className="text-sm text-muted-foreground">{tr("Arrastrá una imagen o seleccioná un archivo")}</p><Button variant="outline" disabled={loading} onClick={() => input.current?.click()}>{tr("Seleccionar imagen")}</Button>
        <p className="text-xs text-muted-foreground">{tr("PNG · JPG/JPEG · WebP estáticos — hasta 12 MB")}</p>
      </section> : <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label={tr("Herramientas de imagen")}>
            {tool("Deshacer", <Undo2 />, undo, !history?.past.length)}{tool("Rehacer", <Redo2 />, redo, !history?.future.length)}
            {tool("Girar 90°", <RotateCw />, () => commit({ rotation: (edit.rotation + 90) % 360 }))}
            {tool("Voltear horizontal", <FlipHorizontal2 />, () => commit({ flipX: !edit.flipX }))}{tool("Voltear vertical", <FlipVertical2 />, () => commit({ flipY: !edit.flipY }))}
            {tool("Recortar", <Crop />, () => { setCrop({ unit: "%", ...edit.crop }); setCropping(true); })}
            {tool("Restaurar original", <RotateCcw />, () => commit(initialEdit(source.image.naturalWidth, source.image.naturalHeight)))}
            <Button variant={compare ? "secondary" : "outline"} size="sm" aria-pressed={compare} disabled={cropping} onClick={() => setCompare(v => !v)}><ArrowLeftRight />{tr("Comparar")}</Button>
          </div>
          {cropping ? <div className="space-y-3">
            <div className="studio-stage"><ReactCrop crop={crop} onChange={(_, p) => setCrop(p)}><img src={source.url} alt={tr("Original para recortar")} className="studio-original" /></ReactCrop></div>
            <div className="flex gap-2"><Button disabled={!crop.width || !crop.height} onClick={() => { commit({ crop: { x: crop.x, y: crop.y, width: crop.width, height: crop.height } }); setCropping(false); }}>{tr("Aplicar recorte")}</Button><Button variant="outline" onClick={() => setCropping(false)}><X />{tr("Cancelar")}</Button></div>
          </div> : <div className={compare ? "grid gap-4 md:grid-cols-2" : ""}>
            {compare && <figure className="min-w-0"><figcaption className="mb-2 text-xs font-semibold text-muted-foreground">{tr("Antes · original")}</figcaption><div className="studio-stage"><img src={source.url} alt={tr("Imagen original")} className="studio-original" /></div></figure>}
            <figure className="min-w-0"><figcaption className="mb-2 text-xs font-semibold text-muted-foreground">{compare ? tr("Después") : tr("Vista previa")} · {edit.width} × {edit.height} px</figcaption><div ref={preview} className="studio-stage" /></figure>
          </div>}
          <p className="break-all text-xs text-muted-foreground">{source.name} · {source.image.naturalWidth} × {source.image.naturalHeight} px · {source.mime}</p>
        </section>
        <aside className="min-w-0 space-y-5 border-t pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0" aria-label={tr("Ajustes de imagen")}>
          <fieldset disabled={cropping || loading || exporting} className="space-y-5 disabled:opacity-50">
            <div className="space-y-3"><h2 className="text-xl">{tr("Tamaño y encuadre")}</h2><div className="grid grid-cols-2 gap-3">
              <Field label={tr("Ancho (px)")}><input className="field" type="number" min="1" max="4096" value={size.width} onChange={e => dimension("width", e.target.value)} /></Field>
              <Field label={tr("Alto (px)")}><input className="field" type="number" min="1" max="4096" value={size.height} onChange={e => dimension("height", e.target.value)} /></Field>
            </div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={locked} onChange={e => setLocked(e.target.checked)} />{tr("Mantener proporción")}</label>
            <Button size="sm" variant="outline" onClick={() => { const width = Number(size.width), height = Number(size.height); if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 4096 || height > 4096) { setError("El tamaño debe estar entre 1 y 4096 píxeles por lado."); return; } commit({ width, height }); }}>{tr("Aplicar tamaño")}</Button>
            <Field label={tr("Encuadre")}><select className="field" value={edit.fit} onChange={e => commit({ fit: e.target.value as EditState["fit"] })}><option value="contain">{tr("Ajustar sin cortar")}</option><option value="cover">{tr("Rellenar el marco")}</option></select></Field>
            <Field label={`${tr("Margen")} · ${edit.padding}%`}><input className="w-full accent-teal" type="range" min="0" max="30" value={edit.padding} onChange={e => commit({ padding: Number(e.target.value) })} /></Field>
            <Field label={tr("Fondo")}><select className="field" value={edit.background} onChange={e => commit({ background: e.target.value as EditState["background"] })}><option value="transparent">{tr("Transparente")}</option><option value="paper">{tr("Papel institucional")}</option><option value="ink">{tr("Tinta institucional")}</option></select></Field></div>
            <div className="space-y-3 border-t pt-4"><h2 className="text-xl">{tr("Texto")}</h2><Field label={tr('Texto inferior (opcional)')}><input className="field" maxLength={120} value={edit.text} onChange={e => commit({ text: e.target.value })} /></Field>
            <Field label={`${tr("Tamaño de texto")} · ${edit.textSize} px`}><input className="w-full accent-teal" type="range" min="12" max="180" step="2" value={edit.textSize} onChange={e => commit({ textSize: Number(e.target.value) })} /></Field>
            <Field label={tr("Color del texto")}><select className="field" value={edit.textColor} onChange={e => commit({ textColor: e.target.value as EditState["textColor"] })}><option value="ink">{tr("Tinta institucional")}</option><option value="paper">{tr("Papel institucional")}</option></select></Field></div>
          </fieldset>
          <div className="space-y-3 border-t pt-4"><h2 className="text-xl">{tr("Exportar")}</h2><Field label={tr("Formato")}><select className="field" value={kind} disabled={exporting} onChange={e => { setKind(e.target.value as ExportKind); setPrepared(null); }}><option value="png">{tr("PNG · transparencia")}</option><option value="jpeg">{tr("JPG / JPEG · fondo opaco")}</option><option value="webp">{tr("WebP · según navegador")}</option><option value="svg">{tr("SVG · imagen raster incrustada")}</option></select></Field>
            {kind === "svg" && <p className="text-xs text-muted-foreground">{tr("Contenedor SVG con PNG incrustado; no convierte la imagen en vectores editables.")}</p>}
            {kind === "jpeg" && <p className="text-xs text-muted-foreground">{tr("Las áreas transparentes se rellenan con papel institucional.")}</p>}
            {prepared ? <Button className="w-full" onClick={() => { const name = source.name.replace(/\.[^.]+$/, "").replace(/[^\p{L}\p{N}_-]/gu, "-").slice(0, 80) || "imagen"; void deliverImage(prepared, `${name}-editada.${kind === "jpeg" ? "jpg" : kind}`).catch(() => setError("No se pudo descargar. Intentá de nuevo.")); }}><Download />{tr("Descargar")} {kind.toUpperCase()}</Button> : <Button className="w-full" disabled={exporting || cropping || loading} onClick={() => void prepare()}>{exporting ? tr('Preparando…') : tr('Preparar exportación')}</Button>}
          </div>
        </aside>
      </div>}
    </div>
    <details className="border-t pt-4 text-sm text-muted-foreground"><summary className="cursor-pointer font-semibold text-foreground">{tr("Formatos, privacidad y limitaciones")}</summary><div className="mt-3 space-y-2">
      <p>{tr("Importación: PNG, JPG/JPEG y WebP estáticos con firma real, MIME coincidente y decodificación válida. Máximo 12 MB, 24 megapíxeles y 8192 px por lado. Rechazamos SVG, GIF, HEIC, PDF, APNG y WebP animado.")}</p>
      <p>{tr("Exportación: hasta 4096 px por lado. PNG y WebP conservan transparencia; JPEG es opaco y con pérdida. WebP depende del navegador. SVG contiene una imagen PNG, no vectores. Se descartan metadatos al exportar.")}</p>
      <p>{tr("La imagen nunca sale del dispositivo por esta herramienta. No se guarda al recargar o cambiar de página. El sistema puede ofrecer compartir el archivo en móviles; el destino lo elegís vos.")}</p>
      <p>{tr("Recorte sobre el original, giros de 90°, volteos y una línea de texto inferior. No hay capas ni edición vectorial. Historial de hasta 40 cambios; restaurar original también puede deshacerse. Deshacer: Ctrl/Cmd+Z; rehacer: Ctrl/Cmd+Shift+Z. El recorte admite flechas del teclado y Escape cancela.")}</p>
    </div></details>
  </div>;
}