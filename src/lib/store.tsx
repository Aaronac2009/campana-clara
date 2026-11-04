import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_PROFILE, demoCalendar, demoCampaigns } from "./demo-data";
import { makeActivity, pushActivity } from "./activity";
import { mergeById, type Backup, type MergeSummary } from "./backup";
import { translate, type TKey } from "./i18n";
import { toast } from 'sonner';
import { reviewCampaign } from './moderation';
import type { ReviewEntry } from './types';
import type { ActivityAction, ActivityEntry, CalendarEntry, Campaign, MediaMeta, Preferences, Profile } from "./types";

// Local-only persistence layer. Swap this provider for a backend-backed one later.
export const KEY_V1 = "campana-clara-demo-v1";
export const KEY = "campana-clara-v2";

export interface State {
  version: 2;
  campaigns: Campaign[];
  profile: Profile;
  calendar: CalendarEntry[];
  onboardingDismissed: boolean;
  activity: ActivityEntry[];
  media: MediaMeta[];
  prefs: Preferences;
}

export const DEFAULT_PREFS: Preferences = { lang: "es", compact: false, reduceMotion: false, theme: "system" };

export const seed = (): State => ({
  version: 2,
  campaigns: demoCampaigns(),
  profile: DEFAULT_PROFILE,
  calendar: demoCalendar(),
  onboardingDismissed: false,
  activity: [],
  media: [],
  prefs: DEFAULT_PREFS,
});

/** Upgrades any stored shape (v1 or v2) to v2 without dropping existing data. */
export function migrate(raw: unknown): State {
  const base = seed();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<State>;
  return {
    ...base,
    ...r,
    version: 2,
    campaigns: Array.isArray(r.campaigns) ? r.campaigns.map((c) => ({ ...c, tags: c.tags ?? [] })) : base.campaigns,
    activity: Array.isArray(r.activity) ? r.activity : [],
    media: Array.isArray(r.media) ? r.media : [],
    prefs: { ...DEFAULT_PREFS, ...(r.prefs ?? {}), lang: r.prefs?.lang === 'en' ? 'en' : 'es', theme: r.prefs?.theme === 'dark' || r.prefs?.theme === 'light' ? r.prefs.theme : 'system' },
  };
}

export function applyTheme(t: "system" | "light" | "dark") {
  const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

/** Runs before first paint (inlined in <head>) so the saved theme shows without a flash. */
export const THEME_BOOT = `try{var s=JSON.parse(localStorage.getItem("${"campana-clara-v2"}")||"{}"),t=(s.prefs&&s.prefs.theme)||"system";if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark");if(s.prefs&&s.prefs.lang)document.documentElement.lang=s.prefs.lang}catch(e){}`;

export interface ImportSummary { campaigns: MergeSummary; calendar: MergeSummary; media: MergeSummary; profile: boolean }

interface Ctx extends State {
  ready: boolean;
  upsertCampaign: (c: Campaign) => void;
  decideReview: (id: string, entry: ReviewEntry) => void;
  deleteCampaign: (id: string) => void;
  duplicateCampaign: (id: string) => Campaign | undefined;
  setProfile: (p: Profile) => void;
  upsertCalendar: (e: CalendarEntry) => void;
  deleteCalendar: (id: string) => void;
  dismissOnboarding: () => void;
  clearAll: () => void;
  reset: () => void;
  log: (action: ActivityAction, target: string, detail?: string) => void;
  upsertMedia: (m: MediaMeta) => void;
  removeMedia: (id: string) => void;
  setPrefs: (p: Partial<Preferences>) => void;
  importBackup: (b: Backup, opts: { profile: boolean }) => ImportSummary;
  t: (k: TKey) => string;
}

const StoreCtx = createContext<Ctx | null>(null);

export const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));

export function persistState(storage: Pick<Storage, 'setItem'>, state: State) {
  storage.setItem(KEY, JSON.stringify(state));
}

export class LocalSaveError extends Error {}
/** The store already reports save errors; event handlers must not leak them into React. */
export async function runLocalAction(action: () => unknown | Promise<unknown>): Promise<boolean> {
  try { await action(); return true; }
  catch (error) { if (error instanceof LocalSaveError) return false; throw error; }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, updateState] = useState<State>(seed);
  const current = useRef(state);
  const writable = useRef(false);
  const [restored, setRestored] = useState(false);
  const setState = useCallback((updater: (previous: State) => State) => {
    const next = updater(current.current);
    try {
      if (!writable.current) throw new Error('storage unavailable');
      persistState(localStorage, next);
    } catch {
      toast.error(translate(current.current.prefs.lang, 'No se pudieron guardar los cambios. Conservá esta página abierta y liberá espacio; descargá un respaldo.'));
      throw new LocalSaveError('Local save failed');
    }
    current.current = next;
    updateState(next);
  }, []);

  useEffect(() => {
    try {
      // v1 key is left untouched as an automatic backup of pre-upgrade data.
      const raw = localStorage.getItem(KEY) ?? localStorage.getItem(KEY_V1);
      if (raw) {
        const restored = migrate(JSON.parse(raw));
        current.current = restored;
        updateState(restored);
      }
      writable.current = true;
    } catch {
      toast.error(translate('es', 'No se pudieron leer los datos guardados. No se reemplazó el respaldo existente.'));
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    document.documentElement.lang = state.prefs.lang;
    document.documentElement.classList.toggle("reduce-motion", state.prefs.reduceMotion);
    applyTheme(state.prefs.theme ?? "system");
  }, [state, restored]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => applyTheme(state.prefs.theme ?? "system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [state.prefs.theme]);

  const withLog = (s: State, action: ActivityAction, target: string, detail = ""): State => ({ ...s, activity: pushActivity(s.activity, makeActivity(action, target, detail)) });

  const upsertCampaign = useCallback((c: Campaign) => {
    const next = { ...c, updatedAt: new Date().toISOString() };
    setState((s) => {
      const exists = s.campaigns.some((x) => x.id === c.id);
      const campaigns = exists ? s.campaigns.map((x) => (x.id === c.id ? next : x)) : [next, ...s.campaigns];
      return withLog({ ...s, campaigns }, exists ? "editar" : "crear", c.title || "Sin título", `Estado: ${c.status}`);
    });
  }, [setState]);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      ready: restored,
      upsertCampaign,
      decideReview: (id, entry) => setState(s => {
        const campaign = s.campaigns.find(c => c.id === id);
        if (!campaign) throw new Error('No hay campañas para revisar.');
        const reviewed = reviewCampaign(campaign, entry);
        if (reviewed === campaign) return s;
        return withLog({ ...s, campaigns: s.campaigns.map(c => c.id === id ? { ...reviewed, updatedAt: entry.at } : c) }, 'editar', campaign.title, `${entry.decision} · ${entry.lang.toUpperCase()} · ${entry.reviewer}: ${entry.comment}`.slice(0,500));
      }),
      deleteCampaign: (id) =>
        setState((s) => withLog({ ...s, campaigns: s.campaigns.filter((c) => c.id !== id) }, "eliminar", s.campaigns.find((c) => c.id === id)?.title ?? id)),
      duplicateCampaign: (id) => {
        const src = state.campaigns.find((c) => c.id === id);
        if (!src) return;
        const copy: Campaign = { ...src, id: newId(), title: `${src.title} (copia)`, status: "borrador", reviewer: "", approvalDate: "", updatedAt: new Date().toISOString() };
        setState((s) => withLog({ ...s, campaigns: [copy, ...s.campaigns] }, "duplicar", src.title));
        return copy;
      },
      setProfile: (profile) => setState((s) => withLog({ ...s, profile }, "perfil", profile.name, "Perfil actualizado")),
      upsertCalendar: (e) =>
        setState((s) => ({
          ...s,
          calendar: s.calendar.some((x) => x.id === e.id) ? s.calendar.map((x) => (x.id === e.id ? e : x)) : [e, ...s.calendar],
        })),
      deleteCalendar: (id) => setState((s) => ({ ...s, calendar: s.calendar.filter((e) => e.id !== id) })),
      dismissOnboarding: () => setState((s) => ({ ...s, onboardingDismissed: true })),
      clearAll: () => setState((s) => ({ ...s, campaigns: [], onboardingDismissed: false })),
      // Reset restores demo content but keeps the activity log, media and preferences.
      reset: () => setState((s) => withLog({ ...seed(), activity: s.activity, media: s.media, prefs: s.prefs }, "restablecer", "Datos de demostración")),
      log: (action, target, detail) => setState((s) => withLog(s, action, target, detail)),
      upsertMedia: (m) =>
        setState((s) => {
          const exists = s.media.some((x) => x.id === m.id);
          return withLog({ ...s, media: exists ? s.media.map((x) => (x.id === m.id ? m : x)) : [m, ...s.media] }, "recurso", m.name, exists ? "Recurso editado" : "Recurso añadido");
        }),
      removeMedia: (id) => setState((s) => withLog({ ...s, media: s.media.filter((m) => m.id !== id) }, "recurso", s.media.find((m) => m.id === id)?.name ?? id, "Recurso eliminado")),
      setPrefs: (p) => setState((s) => ({ ...s, prefs: { ...s.prefs, ...p } })),
      importBackup: (b, opts) => {
        const c = mergeById(state.campaigns, b.campaigns);
        const cal = mergeById(state.calendar, b.calendar);
        // Media metadata without a stored file in this browser is skipped.
        const knownMedia = new Set(state.media.map((m) => m.id));
        const med = mergeById(state.media, b.media.filter((m) => knownMedia.has(m.id)));
        const useProfile = opts.profile && !!b.profile;
        setState((s) =>
          withLog(
            {
              ...s,
              campaigns: c.result,
              calendar: cal.result,
              media: med.result,
              profile: useProfile && b.profile ? b.profile : s.profile,
              activity: mergeById(s.activity, b.activity).result.sort((x, y) => y.at.localeCompare(x.at)).slice(0, 500),
            },
            "importar",
            "Respaldo",
            `${c.summary.added} nuevas, ${c.summary.updated} actualizadas`,
          ),
        );
        return { campaigns: c.summary, calendar: cal.summary, media: med.summary, profile: useProfile };
      },
      t: (k) => translate(state.prefs.lang, k),
    }),
    [state, restored, upsertCampaign, setState],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}
