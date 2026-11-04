export type CampaignStatus = "borrador" | "revision" | "aprobado" | "observado" | "denegado";

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  borrador: "Borrador",
  revision: "En revisión",
  aprobado: "Aprobado",
  observado: "Cambios solicitados",
  denegado: "Denegado",
};

export const INSTITUTION_TYPES = [
  "Colegio técnico profesional",
  "Escuela",
  "Colegio académico",
  "Colegio bilingüe",
  "Colegio científico",
  "Colegio humanístico",
  "Universidad",
  "Preescolar",
  "Hogar de personas adultas mayores",
  "Otra",
];

export const CAMPAIGN_TYPES = [
  "Conmemoración/efeméride",
  "Campaña temática",
  "Aviso institucional",
  "Promoción de hábitos saludables",
  "Convivencia y valores",
  "Ciberseguridad",
];

export const TONES = ["Formal e institucional", "Cercano y motivador", "Informativo y sobrio", "Juvenil y dinámico"];
export const AUDIENCES = ["Comunidad educativa", "Estudiantes", "Familias", "Personal docente y administrativo", "Personas adultas mayores", "Público general"];
export const LANGUAGES = ["Español", "Español e inglés", "Inglés"];

export type FormatKey = "afiche" | "historia" | "cuadrado" | "whatsapp" | "video" | "wa_estado" | "wa_chat_h" | "fb_h" | "pantalla" | "personalizado";
export type Orientation = "vertical" | "cuadrado" | "horizontal";
// Reference sizes only: platform specs change, so the UI tells users to verify them.
export const FORMATS: Record<FormatKey, { label: string; w: number; h: number; planned?: boolean }> = {
  afiche: { label: "Instagram/Facebook · publicación vertical", w: 1080, h: 1350 },
  historia: { label: "Instagram/Facebook · story", w: 1080, h: 1920 },
  cuadrado: { label: "Instagram/Facebook · publicación cuadrada", w: 1080, h: 1080 },
  whatsapp: { label: "WhatsApp · imagen para chat (cuadrada)", w: 1080, h: 1080 },
  wa_estado: { label: "WhatsApp · estado", w: 1080, h: 1920 },
  wa_chat_h: { label: "WhatsApp · imagen para chat (horizontal)", w: 1600, h: 900 },
  fb_h: { label: "Facebook · publicación horizontal", w: 1200, h: 630 },
  pantalla: { label: "Pantalla / pizarra digital", w: 1920, h: 1080 },
  personalizado: { label: "Medida personalizada", w: 1080, h: 1080 },
  video: { label: "GIF / video (planificado)", w: 1080, h: 1080, planned: true },
};
export const FORMAT_KEYS = Object.keys(FORMATS) as FormatKey[];
export const CUSTOM_MIN = 320;
export const CUSTOM_MAX = 4000;

export type ImageFit = "contain" | "cover" | "crop";
export interface CampaignImage {
  source: "stock" | "media";
  ref: string;
  fit: ImageFit;
  /** 30–100: share of the image area used in "contain" mode. */
  size: number;
  /** 100–250: zoom applied in "crop" mode. */
  zoom: number;
  focusX: number;
  focusY: number;
  /** 0–60: darkening overlay for legibility. */
  shade: number;
}
export const DEFAULT_IMAGE: Omit<CampaignImage, "source" | "ref"> = { fit: "cover", size: 100, zoom: 100, focusX: 50, focusY: 50, shade: 0 };

export interface Efemeride {
  enabled: boolean;
  name: string;
  date: string;
  sourceUrl: string;
  confirmed: boolean;
}

export const CHECKLIST = [
  { key: "fecha", label: "Fecha y fuente verificadas", hint: "Solo aplica si la campaña está vinculada a una efeméride." },
  { key: "designacion", label: "Evidencia de designación oficial", hint: "Decreto, resolución u organismo que establece la fecha." },
  { key: "datos", label: "Afirmaciones y datos revisados", hint: "Cifras y hechos con respaldo verificable." },
  { key: "imagenes", label: "Derechos de imágenes confirmados", hint: "Imágenes propias, con licencia o autorizadas." },
  { key: "logo", label: "Uso de logo institucional autorizado", hint: "Solo identidad visual con autorización expresa." },
  { key: "lenguaje", label: "Lenguaje inclusivo y respetuoso", hint: "Sin estereotipos ni expresiones excluyentes." },
  { key: "contraste", label: "Contraste y legibilidad accesibles", hint: "Texto legible en pantallas pequeñas." },
] as const;
export type ChecklistKey = (typeof CHECKLIST)[number]["key"];

export interface Campaign extends CampaignPlanning {
  reviewHistory?: ReviewEntry[];
  contentEn?: CampaignContent | undefined;
  slogan?: string;
  artLang?: Lang;
  id: string;
  title: string;
  tagline: string;
  bullets: string[];
  cta: string;
  note: string;
  institutionType: string;
  institutionName: string;
  campaignType: string;
  theme: string;
  audience: string;
  tone: string;
  format: FormatKey;
  language: string;
  date: string;
  efemeride: Efemeride;
  status: CampaignStatus;
  checklist: Partial<Record<ChecklistKey, boolean>>;
  reviewer: string;
  approvalDate: string;
  updatedAt: string;
}

export interface Profile {
  name: string;
  type: string;
  region: string;
  slogan: string;
  primary: string;
  secondary: string;
  accent: string;
  logoDataUrl: string;
  logoAuthorized: boolean;
  headerText?: string | undefined;
  footerText?: string | undefined;
}

export interface BrandToggles { logo: boolean; header: boolean; footer: boolean; slogan: boolean }
export const DEFAULT_BRAND: BrandToggles = { logo: true, header: true, footer: true, slogan: true };

export type CalendarKind = "verificada" | "pendiente" | "tematica";
export const KIND_LABEL: Record<CalendarKind, string> = {
  verificada: "Verificada (demo)",
  pendiente: "Pendiente de fuente",
  tematica: "Campaña temática (sin fecha)",
};

export interface CalendarEntry {
  id: string;
  title: string;
  date: string;
  kind: CalendarKind;
  sourceOrg: string;
  scope: string;
  note: string;
}

export const CHANNELS = ["Redes sociales", "WhatsApp", "Correo institucional", "Pizarra / impreso", "Sitio web"];

// Optional campaign planning fields (added in data v2; older campaigns lack them).
export interface CampaignPlanning {
  objective?: string;
  channel?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  image?: CampaignImage | undefined;
  customW?: number | undefined;
  customH?: number | undefined;
  brand?: BrandToggles | undefined;
}

export type Lang = "es" | "en";
export interface CampaignContent { title: string; tagline: string; bullets: string[]; cta: string; slogan: string }
export type ThemePref = "system" | "light" | "dark";
export interface ReviewEntry { id: string; at: string; decision: 'aprobar' | 'cambios' | 'denegar'; reviewer: string; comment: string; lang: Lang }
export interface Preferences { lang: Lang; compact: boolean; reduceMotion: boolean; theme?: ThemePref | undefined; visualFavorites?: string[]; visualRecent?: string[] }

export type ActivityAction = "crear" | "editar" | "eliminar" | "duplicar" | "importar" | "exportar" | "recurso" | "perfil" | "restablecer";
export interface ActivityEntry { id: string; at: string; action: ActivityAction; target: string; detail: string }

export type MediaKind = "imagen" | "gif" | "video";
export interface MediaMeta {
  id: string; name: string; kind: MediaKind; mime: string; size: number;
  width?: number | undefined; height?: number | undefined; duration?: number | undefined;
  tags: string[]; campaignId: string; alt: string; addedAt: string;
}
