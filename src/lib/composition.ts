import type { Campaign, CampaignContent, CampaignImage, Lang } from "./types";

/**
 * Versioned, language-specific campaign canvas model.
 * Coordinates are expressed in design-space pixels, never viewport pixels.
 */
export const COMPOSITION_SCHEMA_VERSION = 1 as const;
export const MAX_LAYERS = 120;
export const MAX_CANVAS_DIMENSION = 4000;

export type LayerKind = "image" | "text" | "shape";
export type ShapeKind = "rectangle" | "ellipse" | "line";
export type FitMode = "cover" | "contain" | "fill";

export interface LayerBase {
  id: string;
  kind: LayerKind;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  blendMode: "source-over" | "multiply" | "screen";
}
export interface ImageLayer extends LayerBase {
  kind: "image";
  src: string;
  alt: string;
  fit: FitMode;
  assetId?: string;
  license?: string;
  attribution?: string;
}
export interface TextLayer extends LayerBase {
  kind: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 400 | 500 | 600 | 700 | 800 | 900;
  color: string;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  lineHeight: number;
  letterSpacing: number;
}
export interface ShapeLayer extends LayerBase {
  kind: "shape";
  shape: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;
}
export type CampaignLayer = ImageLayer | TextLayer | ShapeLayer;

export interface CampaignComposition {
  schemaVersion: typeof COMPOSITION_SCHEMA_VERSION;
  id: string;
  campaignId: string;
  language: Lang;
  width: number;
  height: number;
  background: string;
  safeMargin: number;
  layers: CampaignLayer[];
  /** Legacy image descriptor retained during migration; resolve it to an asset URL before rendering. */
  legacyImage?: CampaignImage;
  updatedAt: string;
}

export interface CompositionIssue {
  code: "canvas-size" | "layer-limit" | "duplicate-id" | "bounds" | "empty-alt" | "missing-license" | "empty-text" | "unsafe-source" | "font-size";
  severity: "error" | "warning";
  layerId?: string;
  message: string;
}

export interface CompositionHistory {
  past: CampaignComposition[];
  present: CampaignComposition;
  future: CampaignComposition[];
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const finite = (n: number, fallback: number) => Number.isFinite(n) ? n : fallback;
export const createId = () => globalThis.crypto?.randomUUID?.() ?? `layer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function createComposition(input: {
  campaignId: string; language: Lang; width: number; height: number; background?: string; id?: string;
}): CampaignComposition {
  return {
    schemaVersion: COMPOSITION_SCHEMA_VERSION,
    id: input.id ?? createId(),
    campaignId: input.campaignId,
    language: input.language,
    width: clamp(Math.round(finite(input.width, 1080)), 320, MAX_CANVAS_DIMENSION),
    height: clamp(Math.round(finite(input.height, 1350)), 320, MAX_CANVAS_DIMENSION),
    background: input.background ?? "#FFFFFF",
    safeMargin: 48,
    layers: [],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeLayer(layer: CampaignLayer, index = 0): CampaignLayer {
  const common = {
    ...layer,
    x: finite(layer.x, 0),
    y: finite(layer.y, 0),
    width: clamp(finite(layer.width, 100), 1, MAX_CANVAS_DIMENSION * 2),
    height: clamp(finite(layer.height, 100), 1, MAX_CANVAS_DIMENSION * 2),
    rotation: ((finite(layer.rotation, 0) % 360) + 360) % 360,
    opacity: clamp(finite(layer.opacity, 1), 0, 1),
    zIndex: Math.max(0, Math.round(finite(layer.zIndex, index))),
    visible: layer.visible !== false,
    locked: layer.locked === true,
    blendMode: layer.blendMode ?? "source-over",
  };
  if (layer.kind === "text") return {
    ...layer, ...common,
    fontSize: clamp(finite(layer.fontSize, 32), 8, 320),
    lineHeight: clamp(finite(layer.lineHeight, 1.2), 0.8, 3),
    letterSpacing: clamp(finite(layer.letterSpacing, 0), -5, 30),
  } as TextLayer;
  if (layer.kind === "shape") return {
    ...layer, ...common,
    strokeWidth: clamp(finite(layer.strokeWidth, 0), 0, 100),
    radius: clamp(finite(layer.radius, 0), 0, 300),
  } as ShapeLayer;
  return { ...layer, ...common } as ImageLayer;
}

export function addLayer(composition: CampaignComposition, layer: CampaignLayer): CampaignComposition {
  if (composition.layers.length >= MAX_LAYERS) throw new Error(`Una campaña admite hasta ${MAX_LAYERS} capas por composición.`);
  if (composition.layers.some(item => item.id === layer.id)) throw new Error("El identificador de capa ya existe.");
  const next = normalizeLayer(layer, composition.layers.length);
  return touch({ ...composition, layers: [...composition.layers, { ...next, zIndex: composition.layers.length }] });
}

export function updateLayer(composition: CampaignComposition, id: string, patch: Partial<CampaignLayer>): CampaignComposition {
  return touch({
    ...composition,
    layers: composition.layers.map(layer => {
      if (layer.id !== id || layer.locked) return layer;
      return normalizeLayer({ ...layer, ...patch, id: layer.id, kind: layer.kind } as CampaignLayer);
    }),
  });
}

export function removeLayer(composition: CampaignComposition, id: string): CampaignComposition {
  return touch({ ...composition, layers: composition.layers.filter(layer => layer.id !== id).map((l, i) => ({ ...l, zIndex: i })) });
}

export function duplicateLayer(composition: CampaignComposition, id: string): CampaignComposition {
  const source = composition.layers.find(layer => layer.id === id);
  if (!source) return composition;
  const copy = { ...source, id: createId(), name: `${source.name} (copia)`, x: source.x + 24, y: source.y + 24, zIndex: composition.layers.length, locked: false } as CampaignLayer;
  return addLayer(composition, copy);
}

export function reorderLayer(composition: CampaignComposition, id: string, direction: "forward" | "backward" | "front" | "back"): CampaignComposition {
  const ordered = [...composition.layers].sort((a, b) => a.zIndex - b.zIndex);
  const index = ordered.findIndex(layer => layer.id === id);
  if (index < 0) return composition;
  const [item] = ordered.splice(index, 1);
  const target = direction === "front" ? ordered.length
    : direction === "back" ? 0
    : clamp(index + (direction === "forward" ? 1 : -1), 0, ordered.length);
  ordered.splice(target, 0, item);
  return touch({ ...composition, layers: ordered.map((layer, zIndex) => ({ ...layer, zIndex })) });
}

export function toggleLayerLock(composition: CampaignComposition, id: string, locked?: boolean): CampaignComposition {
  return touch({ ...composition, layers: composition.layers.map(layer => layer.id === id ? { ...layer, locked: locked ?? !layer.locked } : layer) });
}

export function toggleLayerVisibility(composition: CampaignComposition, id: string, visible?: boolean): CampaignComposition {
  return touch({ ...composition, layers: composition.layers.map(layer => layer.id === id ? { ...layer, visible: visible ?? !layer.visible } : layer) });
}

export function moveLayer(composition: CampaignComposition, id: string, x: number, y: number): CampaignComposition {
  return updateLayer(composition, id, { x, y } as Partial<CampaignLayer>);
}

function touch<T extends CampaignComposition>(composition: T): T {
  return { ...composition, updatedAt: new Date().toISOString() };
}

export function createHistory(composition: CampaignComposition): CompositionHistory {
  return { past: [], present: composition, future: [] };
}
export function commitHistory(history: CompositionHistory, next: CampaignComposition, limit = 80): CompositionHistory {
  if (next === history.present) return history;
  return { past: [...history.past, history.present].slice(-limit), present: next, future: [] };
}
export function undoComposition(history: CompositionHistory): CompositionHistory {
  if (!history.past.length) return history;
  const previous = history.past[history.past.length - 1];
  return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] };
}
export function redoComposition(history: CompositionHistory): CompositionHistory {
  if (!history.future.length) return history;
  const [next, ...future] = history.future;
  return { past: [...history.past, history.present], present: next, future };
}

export function validateComposition(composition: CampaignComposition): CompositionIssue[] {
  const issues: CompositionIssue[] = [];
  if (composition.width < 320 || composition.height < 320 || composition.width > MAX_CANVAS_DIMENSION || composition.height > MAX_CANVAS_DIMENSION) {
    issues.push({ code: "canvas-size", severity: "error", message: "El lienzo debe medir entre 320 y 4000 píxeles por lado." });
  }
  if (composition.layers.length > MAX_LAYERS) issues.push({ code: "layer-limit", severity: "error", message: `Se supera el máximo de ${MAX_LAYERS} capas.` });
  const ids = new Set<string>();
  for (const layer of composition.layers) {
    if (ids.has(layer.id)) issues.push({ code: "duplicate-id", severity: "error", layerId: layer.id, message: "Hay identificadores de capa duplicados." });
    ids.add(layer.id);
    if (![layer.x, layer.y, layer.width, layer.height, layer.rotation, layer.opacity].every(Number.isFinite) || layer.width <= 0 || layer.height <= 0) {
      issues.push({ code: "bounds", severity: "error", layerId: layer.id, message: "La capa contiene dimensiones o coordenadas inválidas." });
    } else if (layer.x + layer.width < 0 || layer.y + layer.height < 0 || layer.x > composition.width || layer.y > composition.height) {
      issues.push({ code: "bounds", severity: "warning", layerId: layer.id, message: "La capa está completamente fuera del lienzo." });
    }
    if (layer.kind === "image") {
      if (!layer.alt.trim()) issues.push({ code: "empty-alt", severity: "warning", layerId: layer.id, message: "Agregá texto alternativo para accesibilidad." });
      if (!layer.license?.trim()) issues.push({ code: "missing-license", severity: "warning", layerId: layer.id, message: "Registrá la licencia o autorización de esta imagen." });
      if (!isSafeImageSource(layer.src)) issues.push({ code: "unsafe-source", severity: "error", layerId: layer.id, message: "La fuente de imagen no es segura o no está permitida." });
    }
    if (layer.kind === "text" && !layer.text.trim()) issues.push({ code: "empty-text", severity: "warning", layerId: layer.id, message: "Hay una capa de texto vacía." });
    if (layer.kind === "text" && layer.fontSize < 12) issues.push({ code: "font-size", severity: "warning", layerId: layer.id, message: "El texto podría resultar demasiado pequeño para lectura." });
  }
  return issues;
}

export function isSafeImageSource(src: string): boolean {
  if (src.startsWith("blob:") || src.startsWith("data:image/png;") || src.startsWith("data:image/jpeg;") || src.startsWith("data:image/webp;") || src.startsWith("data:image/gif;")) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}

export function compositionFromLegacyCampaign(campaign: Campaign, language: Lang, width: number, height: number): CampaignComposition {
  const composition = createComposition({ campaignId: campaign.id, language, width, height });
  const content: CampaignContent = language === "es"
    ? { title: campaign.title, tagline: campaign.tagline, bullets: campaign.bullets, cta: campaign.cta, slogan: campaign.slogan ?? "" }
    : campaign.contentEn ?? { title: "", tagline: "", bullets: [], cta: "", slogan: "" };
  const layers: CampaignLayer[] = [
    { id: "legacy-title", kind: "text", name: "Título", x: 64, y: 72, width: width - 128, height: 150, rotation: 0, opacity: 1, zIndex: 0, visible: true, locked: false, blendMode: "source-over", text: content.title, fontFamily: "Arial, sans-serif", fontSize: 72, fontWeight: 800, color: "#142B4A", align: "center", verticalAlign: "middle", lineHeight: 1.05, letterSpacing: 0 },
    { id: "legacy-tagline", kind: "text", name: "Bajada", x: 80, y: 240, width: width - 160, height: 100, rotation: 0, opacity: 1, zIndex: 1, visible: true, locked: false, blendMode: "source-over", text: content.tagline, fontFamily: "Arial, sans-serif", fontSize: 36, fontWeight: 600, color: "#334155", align: "center", verticalAlign: "middle", lineHeight: 1.2, letterSpacing: 0 },
    { id: "legacy-body", kind: "text", name: "Contenido", x: 88, y: 370, width: width - 176, height: Math.max(160, height * 0.34), rotation: 0, opacity: 1, zIndex: 2, visible: true, locked: false, blendMode: "source-over", text: content.bullets.filter(Boolean).map((line, i) => `• ${line}`).join("\\n"), fontFamily: "Arial, sans-serif", fontSize: 30, fontWeight: 500, color: "#1F2937", align: "left", verticalAlign: "top", lineHeight: 1.35, letterSpacing: 0 },
    { id: "legacy-cta", kind: "text", name: "Llamada a la acción", x: 88, y: height - 180, width: width - 176, height: 100, rotation: 0, opacity: 1, zIndex: 3, visible: true, locked: false, blendMode: "source-over", text: content.cta, fontFamily: "Arial, sans-serif", fontSize: 34, fontWeight: 700, color: "#FFFFFF", align: "center", verticalAlign: "middle", lineHeight: 1.2, letterSpacing: 0 },
  ];
  return { ...composition, layers, ...(campaign.image ? { legacyImage: campaign.image } : {}) };
}

export function bilingualReadiness(campaign: Campaign): { ready: boolean; missing: Record<Lang, string[]> } {
  const required: Lang[] = campaign.language === "Inglés" ? ["en"] : campaign.language === "Español e inglés" ? ["es", "en"] : ["es"];
  const fields = (lang: Lang) => {
    const c = lang === "es"
      ? { title: campaign.title, tagline: campaign.tagline, bullets: campaign.bullets, cta: campaign.cta }
      : { title: campaign.contentEn?.title ?? "", tagline: campaign.contentEn?.tagline ?? "", bullets: campaign.contentEn?.bullets ?? [], cta: campaign.contentEn?.cta ?? "" };
    return [
      ...(!c.title.trim() ? ["title"] : []),
      ...(!c.tagline.trim() ? ["tagline"] : []),
      ...(!c.bullets.some(x => x.trim()) ? ["bullets"] : []),
      ...(!c.cta.trim() ? ["cta"] : []),
    ];
  };
  const missing: Record<Lang, string[]> = { es: required.includes("es") ? fields("es") : [], en: required.includes("en") ? fields("en") : [] };
  return { ready: !missing.es.length && !missing.en.length, missing };
}
