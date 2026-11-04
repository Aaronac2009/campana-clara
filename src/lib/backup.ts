import { CUSTOM_MAX, CUSTOM_MIN, FORMAT_KEYS, type ActivityEntry, type CalendarEntry, type Campaign, type CampaignContent, type CampaignImage, type CampaignStatus, type MediaMeta, type Profile } from "./types";

export const BACKUP_FORMAT = "campana-clara-backup";
export const BACKUP_VERSION = 2;
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;

export interface BackupData {
  campaigns: Campaign[];
  calendar: CalendarEntry[];
  profile?: Profile | undefined;
  activity: ActivityEntry[];
  media: MediaMeta[];
}
export interface Backup extends BackupData { format: typeof BACKUP_FORMAT; version: number; exportedAt: string }

export function buildBackup(d: BackupData, at = new Date().toISOString()): Backup {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: at, ...d };
}

export class BackupError extends Error {}

function uniqueIds<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.id.trim() || seen.has(item.id)) throw new BackupError("Una lista tiene un formato inválido.");
    seen.add(item.id);
  }
  return items;
}

const STATUSES: CampaignStatus[] = ["borrador", "revision", "aprobado", "observado", "denegado"];
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 2000): string => {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string") throw new BackupError("Un campo de texto tiene un tipo inválido.");
  if (v.length > max) throw new BackupError("Un campo de texto es demasiado largo.");
  return v;
};
const strList = (v: unknown, maxItems = 30): string[] => {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > maxItems) throw new BackupError("Una lista tiene un formato inválido.");
  return v.map((x) => str(x, 400));
};
const safeUrl = (v: unknown) => {
  const s = str(v, 500);
  return s === "" || /^https?:\/\//i.test(s) ? s : "";
};

const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const dim = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(num(v, CUSTOM_MIN, CUSTOM_MAX, 1080)) : undefined);
function image(v: unknown): CampaignImage | undefined {
  if (!isObj(v)) return undefined;
  const source = v["source"] === "stock" || v["source"] === "media" ? v["source"] : null;
  const ref = str(v["ref"], 80);
  if (!source || !/^[\w-]+$/.test(ref)) return undefined;
  const fit = (["contain", "cover", "crop"] as const).find((f) => f === v["fit"]) ?? "cover";
  return { source, ref, fit, size: num(v["size"], 30, 100, 100), zoom: num(v["zoom"], 100, 250, 100), focusX: num(v["focusX"], 0, 100, 50), focusY: num(v["focusY"], 0, 100, 50), shade: num(v["shade"], 0, 60, 0) };
}
function campaign(v: unknown): Campaign {
  if (!isObj(v)) throw new BackupError("Una campaña tiene formato inválido.");
  const id = str(v["id"], 80);
  if (!id) throw new BackupError("Una campaña no tiene identificador.");
  const status = str(v["status"], 20) as CampaignStatus;
  if (!STATUSES.includes(status)) throw new BackupError(`Estado de campaña desconocido: ${status}`);
  const ef = isObj(v["efemeride"]) ? v["efemeride"] : {};
  const ck = isObj(v["checklist"]) ? v["checklist"] : {};
  const fmt = str(v["format"], 20);
  return {
    ...(v['reviewHistory'] === undefined ? {} : { reviewHistory: reviews(v['reviewHistory']) }),
    ...(v['slogan'] === undefined ? {} : { slogan: str(v['slogan'], 120) }),
    ...(v['contentEn'] === undefined ? {} : { contentEn: content(v['contentEn']) }),
    id, status,
    title: str(v["title"], 200), tagline: str(v["tagline"], 300), bullets: strList(v["bullets"], 12), cta: str(v["cta"], 300), note: str(v["note"], 500),
    institutionType: str(v["institutionType"], 120), institutionName: str(v["institutionName"], 200), campaignType: str(v["campaignType"], 120),
    theme: str(v["theme"], 200), audience: str(v["audience"], 120), tone: str(v["tone"], 120),
    format: ((FORMAT_KEYS as string[]).includes(fmt) ? fmt : "afiche") as Campaign["format"],
    language: str(v["language"], 60), date: str(v["date"], 20),
    efemeride: { enabled: ef["enabled"] === true, name: str(ef["name"], 200), date: str(ef["date"], 20), sourceUrl: safeUrl(ef["sourceUrl"]), confirmed: ef["confirmed"] === true },
    checklist: Object.fromEntries(Object.entries(ck).filter(([, b]) => typeof b === "boolean").slice(0, 20)),
    reviewer: str(v["reviewer"], 120), approvalDate: str(v["approvalDate"], 40), updatedAt: str(v["updatedAt"], 40) || new Date(0).toISOString(),
    objective: str(v["objective"], 500), channel: str(v["channel"], 80), startDate: str(v["startDate"], 20), endDate: str(v["endDate"], 20), tags: strList(v["tags"], 12),
    image: image(v["image"]), customW: dim(v["customW"]), customH: dim(v["customH"]),
    brand: isObj(v["brand"]) ? { logo: v["brand"]["logo"] !== false, header: v["brand"]["header"] !== false, footer: v["brand"]["footer"] !== false, slogan: v["brand"]["slogan"] !== false } : undefined,
  };
}

function content(v: unknown): CampaignContent | undefined {
  if (v === undefined) return undefined;
  if (!isObj(v)) throw new BackupError('Una campaña tiene formato inválido.');
  return { title: str(v['title'], 200), tagline: str(v['tagline'], 300), bullets: strList(v['bullets'], 12), cta: str(v['cta'], 300), slogan: str(v['slogan'], 120) };
}

function reviews(v: unknown): NonNullable<Campaign['reviewHistory']> {
  if (!Array.isArray(v) || v.length > 200) throw new BackupError('Historial de revisión inválido.');
  return uniqueIds(v.map(e => {
    if (!isObj(e) || !['aprobar','cambios','denegar'].includes(String(e['decision'])) || !['es','en'].includes(String(e['lang']))) throw new BackupError('Historial de revisión inválido.');
    return { id: str(e['id'],80), at: str(e['at'],40), decision: e['decision'] as 'aprobar' | 'cambios' | 'denegar', lang: e['lang'] as 'es' | 'en', reviewer: str(e['reviewer'],120), comment: str(e['comment'],500) };
  }));
}

function calendarEntry(v: unknown): CalendarEntry {
  if (!isObj(v)) throw new BackupError("Una fecha del calendario es inválida.");
  const kind = str(v["kind"], 20);
  if (!["verificada", "pendiente", "tematica"].includes(kind)) throw new BackupError("Tipo de fecha desconocido.");
  return { id: str(v["id"], 80), title: str(v["title"], 200), date: str(v["date"], 20), kind: kind as CalendarEntry["kind"], sourceOrg: str(v["sourceOrg"], 200), scope: str(v["scope"], 200), note: str(v["note"], 500) };
}

function activity(v: unknown): ActivityEntry {
  if (!isObj(v)) throw new BackupError("Un registro del historial es inválido.");
  return { id: str(v["id"], 120), at: str(v["at"], 40), action: str(v["action"], 20) as ActivityEntry["action"], target: str(v["target"], 200), detail: str(v["detail"], 500) };
}

function media(v: unknown): MediaMeta {
  if (!isObj(v)) throw new BackupError("Un recurso multimedia es inválido.");
  const kind = str(v["kind"], 10);
  if (!["imagen", "gif", "video"].includes(kind)) throw new BackupError("Tipo de recurso desconocido.");
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : undefined);
  return {
    id: str(v["id"], 80), name: str(v["name"], 200), kind: kind as MediaMeta["kind"], mime: str(v["mime"], 40), size: num(v["size"]) ?? 0,
    width: num(v["width"]), height: num(v["height"]), duration: num(v["duration"]),
    tags: strList(v["tags"], 12), campaignId: str(v["campaignId"], 80), alt: str(v["alt"], 300), addedAt: str(v["addedAt"], 40),
  };
}

function profile(v: unknown): Profile | undefined {
  if (!isObj(v)) return undefined;
  const color = (x: unknown, d: string) => (typeof x === "string" && /^#[0-9a-f]{6}$/i.test(x) ? x : d);
  const logo = str(v["logoDataUrl"], 900_000);
  return {
    name: str(v["name"], 200), type: str(v["type"], 120), region: str(v["region"], 200), slogan: str(v["slogan"], 300),
    primary: color(v["primary"], "#16324f"), secondary: color(v["secondary"], "#f4efe6"), accent: color(v["accent"], "#c9a227"),
    // Only raster data URLs are accepted; SVG could carry executable markup.
    logoDataUrl: /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(logo) ? logo : "",
    logoAuthorized: v["logoAuthorized"] === true,
    headerText: str(v["headerText"], 80), footerText: str(v["footerText"], 100),
  };
}

/** Parses and strictly validates a backup file. Throws BackupError with a readable message. */
export function parseBackup(text: string): Backup {
  if (text.length > MAX_BACKUP_BYTES) throw new BackupError("El archivo supera el límite de 2 MB.");
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new BackupError("El archivo no es un JSON válido."); }
  if (!isObj(raw) || raw["format"] !== BACKUP_FORMAT) throw new BackupError("El archivo no es un respaldo de Campaña Clara.");
  const version = raw["version"];
  if (typeof version !== "number" || version < 1 || version > BACKUP_VERSION) throw new BackupError("Versión de respaldo no compatible.");
  const list = <T extends { id: string },>(k: string, fn: (v: unknown) => T, max: number): T[] => {
    const v = raw[k as keyof typeof raw];
    if (v === undefined) return [];
    if (!Array.isArray(v)) throw new BackupError(`La sección "${k}" es inválida.`);
    if (v.length > max) throw new BackupError(`La sección "${k}" tiene demasiados elementos.`);
    return uniqueIds(v.map(fn));
  };
  return {
    format: BACKUP_FORMAT, version, exportedAt: str(raw["exportedAt"], 40),
    campaigns: list("campaigns", campaign, 1000), calendar: list("calendar", calendarEntry, 1000),
    activity: list("activity", activity, 2000), media: list("media", media, 1000), profile: profile(raw["profile"]),
  };
}

export interface MergeSummary { added: number; updated: number; unchanged: number }

/** Merge by id: imported items add or replace matching ids; nothing local is removed. */
export function mergeById<T extends { id: string }>(local: T[], incoming: T[]): { result: T[]; summary: MergeSummary } {
  uniqueIds(incoming);
  const map = new Map(local.map((x) => [x.id, x]));
  const summary: MergeSummary = { added: 0, updated: 0, unchanged: 0 };
  for (const item of incoming) {
    const prev = map.get(item.id);
    if (!prev) summary.added++;
    else if (JSON.stringify(prev) === JSON.stringify(item)) summary.unchanged++;
    else summary.updated++;
    // Legacy backups lack the new independent language fields; absence is not a request to erase them.
    const merged = prev ? { ...item } : item;
    if (prev) {
      for (const key of ['contentEn', 'slogan', 'reviewHistory'] as const) {
        if (!(key in item) && key in prev) Object.assign(merged, { [key]: (prev as Record<string, unknown>)[key] });
      }
    }
    map.set(item.id, merged);
  }
  const incomingIds = new Set(incoming.map((x) => x.id));
  return { result: [...incoming.map(item => map.get(item.id) ?? item), ...local.filter((x) => !incomingIds.has(x.id))], summary };
}
