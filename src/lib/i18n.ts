import type { Lang } from "./types";
import { EN_PHRASES } from './i18n-phrases';

const es = {
  "nav.home": "Inicio", "nav.create": "Crear campaña", "nav.campaigns": "Mis campañas", "nav.library": "Biblioteca visual",
  "nav.studio": "Estudio de imágenes", "nav.calendar": "Calendario editorial", "nav.criteria": "Criterios editoriales",
  "nav.transfer": "Importar / exportar", "nav.history": "Historial", "nav.profile": "Perfil y preferencias", "nav.login": "Acceso", "nav.workspace": "Espacio institucional",
  "shell.search": "Buscar campañas…", "shell.independent": "Herramienta independiente. No es software oficial del MEP ni de ninguna institución pública.",
  "shell.openMenu": "Abrir menú", "shell.closeMenu": "Cerrar menú", "shell.notifications": "Notificaciones", "shell.team": "Equipo editorial", "shell.demoProfile": "Perfil de demostración", "shell.lang": "Idioma",
  "lib.eyebrow": "Recursos", "lib.title": "Biblioteca visual", "lib.subtitle": "Catálogo precargado y archivos propios, sin perder tus recursos existentes.",
  "lib.upload": "Añadir archivos", "lib.empty": "Aún no hay recursos. Añadí imágenes, GIF o videos propios o con licencia.",
  "lib.notice": "Los archivos se guardan solo en este navegador (no se suben a ningún servidor). Límite: 25 MB por archivo. SVG no se acepta.",
  "lib.all": "Todos", "lib.image": "Imágenes", "lib.gif": "GIF", "lib.video": "Videos", "lib.filter": "Filtrar por nombre o etiqueta",
  "res.back": "Volver a la biblioteca", "res.meta": "Datos del archivo", "res.campaign": "Campaña asociada", "res.none": "Sin campaña",
  "res.tags": "Etiquetas (separadas por comas)", "res.alt": "Texto alternativo (accesibilidad)", "res.save": "Guardar cambios",
  "res.download": "Descargar", "res.studio": "Abrir el Estudio", "res.delete": "Eliminar", "res.notFound": "Recurso no encontrado",
  "hist.eyebrow": "Trazabilidad", "hist.title": "Historial de actividad", "hist.subtitle": "Registro local de acciones en este navegador. No es una auditoría inalterable.",
  "hist.all": "Todas", "hist.empty": "No hay actividad con estos filtros.", "hist.csv": "Exportar CSV", "hist.json": "Exportar JSON",
  "io.eyebrow": "Respaldo", "io.title": "Importar / exportar", "io.subtitle": "Guardá o recuperá tus campañas, calendario, perfil e historial en un archivo.",
  "io.export": "Exportar respaldo (JSON)", "io.import": "Elegir archivo de respaldo", "io.confirm": "Confirmar importación", "io.cancel": "Cancelar",
  "io.mediaNote": "Los archivos multimedia no se incluyen en el respaldo; solo sus datos descriptivos.",
  "login.title": "Acceso al prototipo", "login.demo": "Pantalla de demostración: no hay cuentas reales ni seguridad. Cualquier dato entra como \"Equipo editorial\".",
  "login.email": "Correo", "login.password": "Contraseña", "login.enter": "Entrar al panel",
  "pref.title": "Preferencias", "pref.lang": "Idioma de la interfaz", "pref.compact": "Vista compacta", "pref.motion": "Reducir animaciones",
} as const;

export type TKey = keyof typeof es | keyof typeof EN_PHRASES;

const en: Record<keyof typeof es, string> = {
  "nav.home": "Home", "nav.create": "Create campaign", "nav.campaigns": "My campaigns", "nav.library": "Visual library",
  "nav.studio": "Image studio", "nav.calendar": "Editorial calendar", "nav.criteria": "Editorial criteria",
  "nav.transfer": "Import / export", "nav.history": "Activity log", "nav.profile": "Profile & preferences", "nav.login": "Sign in", "nav.workspace": "Institutional workspace",
  "shell.search": "Search campaigns…", "shell.independent": "Independent tool. Not official software of the MEP or any public institution.",
  "shell.openMenu": "Open menu", "shell.closeMenu": "Close menu", "shell.notifications": "Notifications", "shell.team": "Editorial team", "shell.demoProfile": "Demo profile", "shell.lang": "Language",
  "lib.eyebrow": "Assets", "lib.title": "Visual library", "lib.subtitle": "Preloaded catalogue and your own files, keeping all existing resources.",
  "lib.upload": "Add files", "lib.empty": "No assets yet. Add your own or licensed images, GIFs or videos.",
  "lib.notice": "Files are stored only in this browser (never uploaded). Limit: 25 MB per file. SVG is not accepted.",
  "lib.all": "All", "lib.image": "Images", "lib.gif": "GIF", "lib.video": "Videos", "lib.filter": "Filter by name or tag",
  "res.back": "Back to library", "res.meta": "File details", "res.campaign": "Linked campaign", "res.none": "No campaign",
  "res.tags": "Tags (comma separated)", "res.alt": "Alt text (accessibility)", "res.save": "Save changes",
  "res.download": "Download", "res.studio": "Open Studio", "res.delete": "Delete", "res.notFound": "Asset not found",
  "hist.eyebrow": "Traceability", "hist.title": "Activity log", "hist.subtitle": "Local log of actions in this browser. Not a tamper-proof audit.",
  "hist.all": "All", "hist.empty": "No activity matches these filters.", "hist.csv": "Export CSV", "hist.json": "Export JSON",
  "io.eyebrow": "Backup", "io.title": "Import / export", "io.subtitle": "Save or restore your campaigns, calendar, profile and log in a file.",
  "io.export": "Export backup (JSON)", "io.import": "Choose backup file", "io.confirm": "Confirm import", "io.cancel": "Cancel",
  "io.mediaNote": "Media files are not included in the backup, only their descriptive data.",
  "login.title": "Prototype sign-in", "login.demo": "Demo screen: no real accounts or security. Any input signs in as \"Editorial team\".",
  "login.email": "Email", "login.password": "Password", "login.enter": "Enter dashboard",
  "pref.title": "Preferences", "pref.lang": "Interface language", "pref.compact": "Compact view", "pref.motion": "Reduce motion",
};

export const DICTS: Record<Lang, Record<TKey, string>> = {
  es: { ...Object.fromEntries(Object.keys(EN_PHRASES).map(k => [k, k])), ...es } as Record<TKey, string>,
  en: { ...EN_PHRASES, ...en },
};
export const translate = (lang: Lang, key: TKey) => DICTS[lang][key];
/** Only explicitly registered interface labels/errors; never user content. */
export const localize = (lang: Lang, source: string) => DICTS[lang][source as TKey] ?? source;
