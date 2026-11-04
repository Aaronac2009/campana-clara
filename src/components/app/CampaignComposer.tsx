import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { Download, Eye, EyeOff, ImagePlus, Lock, LockOpen, Plus, RotateCw, Trash2, Type, Layers3, Square, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addLayer, commitHistory, createHistory, createId, duplicateLayer, moveLayer, removeLayer, reorderLayer,
  toggleLayerLock, toggleLayerVisibility, undoComposition, redoComposition, updateLayer,
  validateComposition, type CampaignComposition, type CampaignLayer, type ImageLayer, type ShapeLayer, type TextLayer,
} from "@/lib/composition";
import { downloadBlob, exportComposition } from "@/lib/composition-export";

type Locale = "es" | "en";
const words = {
  es: { addText: "Añadir texto", addImage: "Añadir imagen", addShape: "Añadir forma", layers: "Capas", properties: "Propiedades", duplicate: "Duplicar", delete: "Eliminar", export: "Exportar PNG", undo: "Deshacer", redo: "Rehacer", selected: "Seleccionado", noSelection: "Seleccioná una capa", text: "Texto", fontSize: "Tamaño", color: "Color", rotation: "Rotación", opacity: "Opacidad", alt: "Texto alternativo", license: "Licencia / autorización", name: "Nombre", saved: "Cambios en memoria del editor", exportError: "No se pudo exportar", issue: "Revisar antes de exportar" },
  en: { addText: "Add text", addImage: "Add image", addShape: "Add shape", layers: "Layers", properties: "Properties", duplicate: "Duplicate", delete: "Delete", export: "Export PNG", undo: "Undo", redo: "Redo", selected: "Selected", noSelection: "Select a layer", text: "Text", fontSize: "Size", color: "Color", rotation: "Rotation", opacity: "Opacity", alt: "Alternative text", license: "License / authorization", name: "Name", saved: "Changes held in editor memory", exportError: "Export failed", issue: "Review before export" },
} as const;

export interface CampaignComposerProps {
  composition: CampaignComposition;
  onChange: (composition: CampaignComposition) => void;
  locale?: Locale;
  onExported?: (blob: Blob) => void;
  /** Uploads the binary to an authorized asset store and returns a durable, readable URL. */
  onAssetImport?: (file: File) => Promise<{ src: string; assetId?: string; license?: string; attribution?: string }>;
}

/**
 * Controlled, reusable composition editor. Parent owns persistence and authorization.
 * This component never uploads assets or claims a save to the server.
 */
export function CampaignComposer({ composition, onChange, locale = "es", onExported, onAssetImport }: CampaignComposerProps) {
  const t = words[locale];
  const [history, setHistory] = useState(() => createHistory(composition));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(1);
  const [exportFormat, setExportFormat] = useState<"png" | "jpg" | "webp">("png");
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; mode: "move" | "resize"; pointerX: number; pointerY: number; originX: number; originY: number; originWidth: number; originHeight: number; factor: number } | null>(null);
  const selected = composition.layers.find(layer => layer.id === selectedId) ?? null;
  const issues = useMemo(() => validateComposition(composition), [composition]);

  useEffect(() => {
    setHistory(current => current.present.id === composition.id ? current : createHistory(composition));
  }, [composition.id]);

  function apply(next: CampaignComposition) {
    setHistory(current => commitHistory(current, next));
    onChange(next);
  }
  function undo() { const next = undoComposition(history); setHistory(next); onChange(next.present); }
  function redo() { const next = redoComposition(history); setHistory(next); onChange(next.present); }

  function addText() {
    const id = createId();
    const layer: TextLayer = {
      id, kind: "text", name: locale === "es" ? "Texto nuevo" : "New text",
      x: composition.width * 0.1, y: composition.height * 0.15, width: composition.width * 0.8, height: 120,
      rotation: 0, opacity: 1, zIndex: composition.layers.length, visible: true, locked: false, blendMode: "source-over",
      text: locale === "es" ? "Escribí tu mensaje" : "Write your message", fontFamily: "Arial, sans-serif", fontSize: 48,
      fontWeight: 700, color: "#17365D", align: "center", verticalAlign: "middle", lineHeight: 1.15, letterSpacing: 0,
    };
    apply(addLayer(composition, layer)); setSelectedId(id);
  }
  function addShape() {
    const id = createId();
    const layer: ShapeLayer = {
      id, kind: "shape", name: locale === "es" ? "Forma" : "Shape",
      x: composition.width * 0.2, y: composition.height * 0.35, width: composition.width * 0.6, height: 120,
      rotation: 0, opacity: 1, zIndex: composition.layers.length, visible: true, locked: false, blendMode: "source-over",
      shape: "rectangle", fill: "#0D9488", stroke: "#0F766E", strokeWidth: 0, radius: 18,
    };
    apply(addLayer(composition, layer)); setSelectedId(id);
  }
  async function addImages(files: File[]) {
    try {
      let next = composition;
      let lastId: string | null = null;
      for (const file of files) {
        if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) throw new Error(`Formato no admitido: ${file.name}. Usá PNG, JPG, WebP o GIF.`);
        if (file.size > 25 * 1024 * 1024) throw new Error(`El archivo ${file.name} supera el límite de 25 MB.`);
        const imported = onAssetImport ? await onAssetImport(file) : {
          src: await new Promise<string>((resolve, reject) => {
            const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Archivo no válido."));
            reader.onerror = () => reject(new Error("No se pudo leer el archivo.")); reader.readAsDataURL(file);
          }),
        };
        lastId = createId();
        next = addLayer(next, ImageLayerPlaceholder(lastId, file.name, imported.src, next, imported));
      }
      apply(next);
      if (lastId) setSelectedId(lastId);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo añadir la imagen."); }
  }

  function startDrag(event: PointerEvent, layer: CampaignLayer) {
    if (layer.locked || event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const factor = rect.width / composition.width;
    dragRef.current = { id: layer.id, mode: "move", pointerX: event.clientX, pointerY: event.clientY, originX: layer.x, originY: layer.y, originWidth: layer.width, originHeight: layer.height, factor };
    setSelectedId(layer.id);
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }
  function startResize(event: PointerEvent, layer: CampaignLayer) {
    if (layer.locked || event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { id: layer.id, mode: "resize", pointerX: event.clientX, pointerY: event.clientY, originX: layer.x, originY: layer.y, originWidth: layer.width, originHeight: layer.height, factor: rect.width / composition.width };
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }
  function drag(event: PointerEvent) {
    const state = dragRef.current;
    if (!state) return;
    const dx = (event.clientX - state.pointerX) / state.factor;
    const dy = (event.clientY - state.pointerY) / state.factor;
    if (state.mode === "resize") onChange(updateLayer(composition, state.id, { width: Math.max(24, state.originWidth + dx), height: Math.max(24, state.originHeight + dy) }));
    else onChange(moveLayer(composition, state.id, state.originX + dx, state.originY + dy));
  }
  function endDrag() { dragRef.current = null; setHistory(current => commitHistory(current, composition)); }

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input,textarea,select,[contenteditable=true]")) return;
      const command = event.ctrlKey || event.metaKey;
      if (command && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); return; }
      if (command && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); return; }
      if (!selectedId) return;
      if (command && event.key.toLowerCase() === "d") {
        event.preventDefault();
        const next = duplicateLayer(composition, selectedId);
        const added = next.layers.find(layer => !composition.layers.some(old => old.id === layer.id));
        apply(next); if (added) setSelectedId(added.id); return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault(); apply(removeLayer(composition, selectedId)); setSelectedId(null); return;
      }
      const delta = event.shiftKey ? 10 : 1;
      const layer = composition.layers.find(item => item.id === selectedId);
      if (!layer || layer.locked) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        apply(moveLayer(composition, selectedId, layer.x + (event.key === "ArrowLeft" ? -delta : event.key === "ArrowRight" ? delta : 0), layer.y + (event.key === "ArrowUp" ? -delta : event.key === "ArrowDown" ? delta : 0)));
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [selectedId, composition, history]);

  async function exportImage() {
    setBusy(true); setError("");
    try {
      const mimeType = exportFormat === "jpg" ? "image/jpeg" : exportFormat === "webp" ? "image/webp" : "image/png";
      const result = await exportComposition(composition, { mimeType, scale: 1, quality: 0.94 });
      downloadBlob(result.blob, `campana-${composition.language}-${composition.id.slice(0, 8)}.${exportFormat}`);
      onExported?.(result.blob);
    } catch (e) { setError(`${t.exportError}: ${e instanceof Error ? e.message : "Error"}`); }
    finally { setBusy(false); }
  }

  function patchSelected(patch: Partial<CampaignLayer>) {
    if (!selected) return;
    apply(updateLayer(composition, selected.id, patch));
  }

  return <section className="grid min-h-[680px] gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <Button size="sm" variant="outline" onClick={addText}><Type className="mr-1 h-4 w-4"/>{t.addText}</Button>
        <Button size="sm" variant="outline" onClick={addShape}><Square className="mr-1 h-4 w-4"/>{t.addShape}</Button>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><ImagePlus className="mr-1 h-4 w-4"/>{t.addImage}</Button>
        <input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={e => { void addImages(Array.from(e.target.files ?? [])); e.currentTarget.value = ""; }}/>
        <span className="mx-1 h-6 w-px bg-border"/>
        <Button size="sm" variant="ghost" disabled={!history.past.length} onClick={undo}>{t.undo}</Button>
        <Button size="sm" variant="ghost" disabled={!history.future.length} onClick={redo}>{t.redo}</Button>
        <div className="flex-1"/>
        <label className="text-xs text-muted-foreground">Zoom <input className="w-20" type="range" min="0.25" max="1" step="0.05" value={scale} onChange={e => setScale(Number(e.target.value))}/></label>
        <select aria-label="Export format" className="h-9 rounded-md border bg-background px-2 text-sm" value={exportFormat} onChange={e => setExportFormat(e.target.value as "png" | "jpg" | "webp")}>
          <option value="png">PNG</option><option value="jpg">JPG</option><option value="webp">WebP</option>
        </select>
        <Button size="sm" onClick={() => void exportImage()} disabled={busy}><Download className="mr-1 h-4 w-4"/>{t.export}</Button>
      </div>
      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      <div className="overflow-auto rounded-xl border bg-muted/50 p-4">
        <div ref={stageRef} className="relative mx-auto overflow-hidden shadow-xl" style={{ width: `${scale * 100}%`, maxWidth: "100%", aspectRatio: `${composition.width}/${composition.height}`, background: composition.background, touchAction: "none", containerType: "size" }}>
          {composition.layers.filter(layer => layer.visible).sort((a,b) => a.zIndex-b.zIndex).map(layer =>
            <div key={layer.id} onPointerDown={e => startDrag(e, layer)} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag}
              onClick={() => setSelectedId(layer.id)}
              className={`absolute select-none ${selectedId === layer.id ? "outline outline-2 outline-primary" : ""} ${layer.locked ? "cursor-not-allowed" : "cursor-move"}`}
              style={{ left: `${layer.x / composition.width * 100}%`, top: `${layer.y / composition.height * 100}%`, width: `${layer.width / composition.width * 100}%`, height: `${layer.height / composition.height * 100}%`, opacity: layer.opacity, transform: `rotate(${layer.rotation}deg)`, transformOrigin: "center", zIndex: layer.zIndex, mixBlendMode: layer.blendMode as CSSProperties["mixBlendMode"] }}>
              {layer.kind === "image" ? <img src={layer.src} alt={layer.alt} draggable={false} className={`h-full w-full ${layer.fit === "contain" ? "object-contain" : layer.fit === "cover" ? "object-cover" : "object-fill"}`}/>
                : layer.kind === "text" ? <div className="h-full w-full overflow-hidden whitespace-pre-wrap" style={{ fontFamily: layer.fontFamily, fontSize: `clamp(8px, ${layer.fontSize / composition.width * 100}cqw, ${layer.fontSize}px)`, fontWeight: layer.fontWeight, color: layer.color, textAlign: layer.align, lineHeight: layer.lineHeight, display: "flex", alignItems: layer.verticalAlign === "top" ? "flex-start" : layer.verticalAlign === "bottom" ? "flex-end" : "center", justifyContent: layer.align === "left" ? "flex-start" : layer.align === "right" ? "flex-end" : "center" }}>{layer.text}</div>
                : <div className="h-full w-full" style={{ background: layer.shape === "line" ? "transparent" : layer.fill, border: `${layer.strokeWidth}px solid ${layer.stroke}`, borderRadius: layer.shape === "ellipse" ? "50%" : layer.radius }}/>}
              {selectedId === layer.id && !layer.locked && <button type="button" aria-label="Resize layer" onPointerDown={e => startResize(e, layer)} className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-sm border-2 border-background bg-primary shadow cursor-nwse-resize"/>}
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t.saved}. Atajos: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+D, Supr y flechas (Shift para mover 10 px). La persistencia definitiva debe gestionarla la aplicación que integra este editor.</p>
      {issues.length > 0 && <div className="rounded-lg border bg-card p-3 text-sm"><strong>{t.issue}</strong><ul className="mt-2 list-disc pl-5">{issues.slice(0, 8).map((issue, i) => <li key={`${issue.code}-${i}`}>{issue.message}</li>)}</ul></div>}
    </div>
    <aside className="space-y-3">
      <div className="rounded-xl border bg-card p-3">
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><Layers3 className="h-4 w-4"/>{t.layers}</h3>
        <div className="max-h-64 space-y-1 overflow-auto">
          {[...composition.layers].sort((a,b) => b.zIndex-a.zIndex).map(layer => <div key={layer.id} className={`flex items-center gap-1 rounded-lg border p-2 text-sm ${selectedId === layer.id ? "border-primary bg-primary/5" : ""}`}>
            <button className="min-w-0 flex-1 truncate text-left" onClick={() => setSelectedId(layer.id)}>{layer.name}</button>
            <button aria-label={layer.visible ? "Hide layer" : "Show layer"} onClick={() => apply(toggleLayerVisibility(composition, layer.id))}>{layer.visible ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}</button>
            <button aria-label={layer.locked ? "Unlock layer" : "Lock layer"} onClick={() => apply(toggleLayerLock(composition, layer.id))}>{layer.locked ? <Lock className="h-4 w-4"/> : <LockOpen className="h-4 w-4"/>}</button>
          </div>)}
        </div>
      </div>
      <div className="rounded-xl border bg-card p-3">
        <h3 className="mb-3 font-semibold">{t.properties}</h3>
        {!selected ? <p className="text-sm text-muted-foreground">{t.noSelection}</p> : <div className="space-y-3">
          <label className="block text-xs">{t.name}<input className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={selected.name} onChange={e => patchSelected({ name: e.target.value })}/></label>
          {selected.kind === "text" && <>
            <label className="block text-xs">{t.text}<textarea className="mt-1 w-full rounded-md border bg-background p-2 text-sm" rows={4} value={selected.text} onChange={e => patchSelected({ text: e.target.value })}/></label>
            <label className="block text-xs">{t.fontSize}<input className="mt-1 w-full" type="range" min="12" max="160" value={selected.fontSize} onChange={e => patchSelected({ fontSize: Number(e.target.value) })}/></label>
            <label className="block text-xs">{t.color}<input className="mt-1 h-9 w-full" type="color" value={selected.color} onChange={e => patchSelected({ color: e.target.value })}/></label>
          </>}
          {selected.kind === "image" && <>
            <label className="block text-xs">{t.alt}<input className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={selected.alt} onChange={e => patchSelected({ alt: e.target.value })}/></label>
            <label className="block text-xs">{t.license}<input className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={selected.license ?? ""} onChange={e => patchSelected({ license: e.target.value })}/></label>
          </>}
          <div className="grid grid-cols-2 gap-2">
            {(["x", "y", "width", "height"] as const).map(key => <label key={key} className="block text-xs">{key.toUpperCase()}<input className="mt-1 w-full rounded-md border bg-background p-2 text-sm" type="number" min={key === "width" || key === "height" ? 24 : -4000} max={4000} value={Math.round(selected[key])} onChange={e => patchSelected({ [key]: Number(e.target.value) } as Partial<CampaignLayer>)}/></label>)}
          </div>
          <label className="block text-xs">{t.rotation}<input className="mt-1 w-full" type="range" min="-180" max="180" value={selected.rotation} onChange={e => patchSelected({ rotation: Number(e.target.value) })}/></label>
          <label className="block text-xs">{t.opacity}<input className="mt-1 w-full" type="range" min="0" max="1" step="0.05" value={selected.opacity} onChange={e => patchSelected({ opacity: Number(e.target.value) })}/></label>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={() => apply(duplicateLayer(composition, selected.id))}>{t.duplicate}</Button>
            <Button size="sm" variant="destructive" onClick={() => { apply(removeLayer(composition, selected.id)); setSelectedId(null); }}><Trash2 className="mr-1 h-4 w-4"/>{t.delete}</Button>
            <Button size="sm" variant="outline" onClick={() => apply(reorderLayer(composition, selected.id, "forward"))}><ArrowUp className="mr-1 h-4 w-4"/>Front</Button>
            <Button size="sm" variant="outline" onClick={() => apply(reorderLayer(composition, selected.id, "backward"))}><ArrowDown className="mr-1 h-4 w-4"/>Back</Button>
          </div>
        </div>}
      </div>
    </aside>
  </section>;
}

function ImageLayerPlaceholder(id: string, name: string, src: string, composition: CampaignComposition, metadata: { assetId?: string; license?: string; attribution?: string } = {}): ImageLayer {
  return {
    id, kind: "image", name, src, alt: "", fit: "contain", ...metadata,
    x: composition.width * 0.1, y: composition.height * 0.2, width: composition.width * 0.8, height: composition.height * 0.5,
    rotation: 0, opacity: 1, zIndex: composition.layers.length, visible: true, locked: false, blendMode: "source-over",
  };
}
