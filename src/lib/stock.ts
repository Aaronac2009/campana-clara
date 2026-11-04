// Demo catalogue of ORIGINAL illustrations drawn in code for this prototype (no external photos,
// no third-party licences). See STOCK_LICENSE.md. Markup is our own constant code, never user input.

import { ORIGINAL_STOCK } from './stock-originals';
import { PHOTO_STOCK } from './stock-photos';
import { FLAG_STOCK } from './stock-flags';
import { BATCH_STOCK } from './stock-batch';
export interface StockItem { id: string; title: string; titleEn?: string; category: string; categoryEn?: string; keywords: readonly string[]; w: number; h: number; svg: string; url?: string; kind?: string; license?: string; source?: string; author?: string; countryCode?: string; family?: string }

const W = 800, H = 600;
const frame = (bg1: string, bg2: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/><circle cx="660" cy="110" r="150" fill="#ffffff" opacity="0.12"/><circle cx="120" cy="520" r="200" fill="#ffffff" opacity="0.08"/>${body}</svg>`;

const person = (x: number, y: number, c: string, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-120" r="42" fill="#f3d9b8"/><path d="M-70 40 Q-70 -60 0 -60 Q70 -60 70 40 Z" fill="${c}"/></g>`;

const ITEMS: Omit<StockItem, "w" | "h">[] = [
  { id: "convivencia", title: "Comunidad unida", category: "Convivencia", keywords: ["respeto", "valores", "grupo", "personas"],
    svg: frame("#2a8a85", "#1d2b4f", person(250, 470, "#d4a84b") + person(400, 450, "#fbf8f1", 1.1) + person(550, 470, "#e07a5f") + `<path d="M300 380 Q400 330 500 380" stroke="#fbf8f1" stroke-width="10" fill="none" stroke-linecap="round"/>`) },
  { id: "dialogo", title: "Diálogo y escucha", category: "Convivencia", keywords: ["conversar", "escuchar", "conflictos"],
    svg: frame("#f1e6cf", "#d4a84b", person(270, 500, "#1d2b4f") + person(530, 500, "#2a8a85") + `<rect x="200" y="140" width="190" height="110" rx="30" fill="#fbf8f1"/><path d="M260 250 l20 40 l20 -40z" fill="#fbf8f1"/><rect x="420" y="110" width="190" height="110" rx="30" fill="#1d2b4f"/><path d="M520 220 l20 40 l20 -40z" fill="#1d2b4f"/><g fill="#2a8a85"><circle cx="255" cy="195" r="10"/><circle cx="295" cy="195" r="10"/><circle cx="335" cy="195" r="10"/></g>`) },
  { id: "salud", title: "Hábitos saludables", category: "Salud", keywords: ["frutas", "agua", "alimentación", "hidratación"],
    svg: frame("#d9efe9", "#2a8a85", `<circle cx="300" cy="340" r="110" fill="#e07a5f"/><path d="M300 230 q20 -50 60 -60" stroke="#3b6b3a" stroke-width="12" fill="none"/><ellipse cx="370" cy="190" rx="40" ry="18" fill="#5c9c5a"/><rect x="460" y="200" width="110" height="260" rx="30" fill="#bfe3df" stroke="#fbf8f1" stroke-width="10"/><rect x="470" y="300" width="90" height="150" rx="22" fill="#5aa9d6"/>`) },
  { id: "deporte", title: "Movimiento y deporte", category: "Salud", keywords: ["actividad física", "bola", "juego", "mover"],
    svg: frame("#1d2b4f", "#2a8a85", `<circle cx="400" cy="300" r="150" fill="#fbf8f1"/><path d="M400 150 v300 M250 300 h300 M295 195 q105 105 0 210 M505 195 q-105 105 0 210" stroke="#1d2b4f" stroke-width="10" fill="none"/><path d="M110 520 q290 -60 580 0" stroke="#d4a84b" stroke-width="12" fill="none" stroke-linecap="round"/>`) },
  { id: "lectura", title: "Lectura", category: "Educación", keywords: ["libro", "biblioteca", "leer", "aprender"],
    svg: frame("#fbf8f1", "#f1e6cf", `<path d="M400 200 Q300 160 180 180 V440 Q300 420 400 460 Z" fill="#1d2b4f"/><path d="M400 200 Q500 160 620 180 V440 Q500 420 400 460 Z" fill="#2a8a85"/><path d="M220 230 Q300 215 370 240 M220 280 Q300 265 370 290 M430 240 Q500 215 580 230 M430 290 Q500 265 580 280" stroke="#fbf8f1" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="620" cy="130" r="30" fill="#d4a84b"/>`) },
  { id: "aula", title: "Aula y pizarra", category: "Educación", keywords: ["clase", "docente", "escuela", "colegio"],
    svg: frame("#e9edf5", "#bfe3df", `<rect x="160" y="110" width="480" height="270" rx="16" fill="#2b4a3f" stroke="#8a6a3b" stroke-width="14"/><path d="M210 180 h180 M210 230 h260 M210 280 h140" stroke="#fbf8f1" stroke-width="8" stroke-linecap="round"/><circle cx="540" cy="250" r="45" fill="none" stroke="#d4a84b" stroke-width="8"/>` + person(400, 590, "#1d2b4f", 0.9)) },
  { id: "tecnologia", title: "Tecnología", category: "Tecnología", keywords: ["computadora", "digital", "laptop", "programar"],
    svg: frame("#1d2b4f", "#121a33", `<rect x="220" y="160" width="360" height="230" rx="16" fill="#2a8a85"/><rect x="240" y="180" width="320" height="190" rx="8" fill="#121a33"/><path d="M180 410 h440 l-30 40 h-380z" fill="#bfe3df"/><path d="M290 240 l-30 35 l30 35 M510 240 l30 35 l-30 35 M420 230 l-40 90" stroke="#d4a84b" stroke-width="10" fill="none" stroke-linecap="round"/>`) },
  { id: "ciberseguridad", title: "Ciberseguridad", category: "Tecnología", keywords: ["seguridad", "contraseña", "candado", "internet"],
    svg: frame("#2a8a85", "#1d2b4f", `<path d="M400 120 L560 180 V320 Q560 440 400 500 Q240 440 240 320 V180 Z" fill="#fbf8f1"/><rect x="335" y="290" width="130" height="110" rx="16" fill="#1d2b4f"/><path d="M360 290 v-35 a40 40 0 0 1 80 0 v35" stroke="#1d2b4f" stroke-width="16" fill="none"/><circle cx="400" cy="340" r="14" fill="#d4a84b"/>`) },
  { id: "ambiente", title: "Ambiente", category: "Ambiente", keywords: ["naturaleza", "árbol", "reciclar", "planeta"],
    svg: frame("#d9efe9", "#5c9c5a", `<rect x="385" y="300" width="30" height="190" fill="#8a6a3b"/><circle cx="400" cy="260" r="120" fill="#3b6b3a"/><circle cx="330" cy="300" r="80" fill="#5c9c5a"/><circle cx="470" cy="300" r="80" fill="#5c9c5a"/><path d="M0 500 q400 -40 800 0 v100 h-800z" fill="#2b4a3f"/><circle cx="640" cy="120" r="50" fill="#d4a84b"/>`) },
  { id: "reciclaje", title: "Reciclaje", category: "Ambiente", keywords: ["residuos", "separar", "basura", "limpieza"],
    svg: frame("#fbf8f1", "#d9efe9", `<g stroke-linecap="round" stroke-width="10"><rect x="160" y="250" width="140" height="210" rx="14" fill="#2a8a85"/><rect x="330" y="250" width="140" height="210" rx="14" fill="#d4a84b"/><rect x="500" y="250" width="140" height="210" rx="14" fill="#1d2b4f"/><path d="M150 250 h160 M320 250 h160 M490 250 h160" stroke="#121a33"/></g><path d="M370 160 a50 50 0 1 1 60 60" stroke="#2a8a85" stroke-width="12" fill="none"/><path d="M430 200 l0 25 l-25 0" stroke="#2a8a85" stroke-width="12" fill="none"/>`) },
  { id: "celebracion", title: "Celebración", category: "Institucional", keywords: ["fiesta", "acto", "aniversario", "logro"],
    svg: frame("#1d2b4f", "#2a8a85", `<g fill="#d4a84b"><rect x="160" y="140" width="18" height="40" transform="rotate(25 169 160)"/><rect x="620" y="170" width="18" height="40" transform="rotate(-30 629 190)"/><circle cx="250" cy="420" r="12"/><circle cx="560" cy="430" r="12"/></g><g fill="#e07a5f"><rect x="300" y="110" width="16" height="36" transform="rotate(-20 308 128)"/><circle cx="520" cy="120" r="10"/></g><path d="M400 180 l40 90 h95 l-75 60 l30 95 l-90 -55 l-90 55 l30 -95 l-75 -60 h95z" fill="#fbf8f1"/>`) },
  { id: "aviso", title: "Aviso institucional", category: "Institucional", keywords: ["comunicado", "megáfono", "información", "noticia"],
    svg: frame("#f1e6cf", "#fbf8f1", `<path d="M230 260 L520 150 V450 L230 340 Z" fill="#1d2b4f"/><rect x="180" y="260" width="60" height="80" rx="10" fill="#2a8a85"/><path d="M260 340 l30 110 h50 l-25 -95" fill="#2a8a85"/><path d="M570 230 q40 70 0 140 M610 190 q70 110 0 220" stroke="#d4a84b" stroke-width="12" fill="none" stroke-linecap="round"/>`) },
];

export const STOCK: StockItem[] = [...PHOTO_STOCK, ...BATCH_STOCK, ...ORIGINAL_STOCK, ...ITEMS.map((i) => ({ ...i, w: W, h: H, kind: 'graphic', license: 'original' })), ...FLAG_STOCK];
export const STOCK_CATEGORIES = [...new Set(STOCK.map((s) => s.category))];
export const STOCK_NOTICE = "Ilustración demo original · uso libre en este prototipo";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const searchIndex = new Map(STOCK.map(s => [s.id, norm([s.title, s.titleEn, s.category, s.categoryEn, ...s.keywords].join(' '))]));
export function searchStock(q: string, category = ""): StockItem[] {
  const n = norm(q.trim());
  return STOCK.filter((s) => (!category || s.category === category) && (!n || searchIndex.get(s.id)?.includes(n)));
}
const byId = new Map(STOCK.map(s => [s.id, s]));
export const stockById = (id: string) => byId.get(id);
export const svgDataUrl = (svg: string) => `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
export const stockUrl = (s: StockItem) => s.url ?? svgDataUrl(s.svg);
