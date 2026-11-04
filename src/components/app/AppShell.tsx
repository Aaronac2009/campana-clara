import { useI18n } from "@/lib/use-i18n";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Bell, BookOpenCheck, Building2, CalendarDays, FolderKanban, History, Home, ImagePlus, Images, LogIn, Menu, Monitor, Moon, PenLine, Search, Sun, Users, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { runLocalAction, useStore } from "@/lib/store";

import type { TKey } from "@/lib/i18n";

const NAV: readonly { to: "/" | "/crear" | "/campanas" | "/biblioteca" | "/estudio" | "/calendario" | "/criterios" | "/importar" | "/historial" | "/perfil" | "/login" | "/espacio"; label: TKey; icon: typeof Home }[] = [
  { to: "/", label: "nav.home", icon: Home },
  { to: "/campanas", label: "nav.campaigns", icon: FolderKanban },
  { to: "/crear", label: "nav.create", icon: PenLine },
  { to: "/biblioteca", label: "nav.library", icon: Images },
  { to: "/estudio", label: "nav.studio", icon: ImagePlus },
  { to: "/calendario", label: "nav.calendar", icon: CalendarDays },
  { to: "/criterios", label: "nav.criteria", icon: BookOpenCheck },
  { to: "/importar", label: "nav.transfer", icon: ArrowLeftRight },
  { to: "/historial", label: "nav.history", icon: History },
  { to: "/perfil", label: "nav.profile", icon: Building2 },
  { to: "/espacio", label: "nav.workspace", icon: Users },
  { to: "/login", label: "nav.login", icon: LogIn },
];

function Wordmark() {
  const { tr, label, locale } = useI18n();
  return (
    <div>
      <div className="font-display text-2xl font-semibold leading-none text-sidebar-accent-foreground">
        campaña <span className="italic text-sidebar-primary">clara</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-sidebar-foreground/70">{tr("Campañas institucionales con criterio editorial")}</p>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useStore();
  return (
    <nav className="space-y-0.5" aria-label={t('Principal')}>
      {NAV.map((n) => {
        const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <n.icon className={cn("h-4 w-4", active && "text-sidebar-primary")} />
            {t(n.label)}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const { t } = useStore();
  return (
    <div className="rounded-lg border border-sidebar-border p-3 text-[11px] leading-relaxed text-sidebar-foreground/70">
      <p>{t("shell.independent")}</p>
      <p className="mt-3 border-t border-sidebar-border pt-3 text-sidebar-accent-foreground">by Gingles · Powered by BDS devs</p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { campaigns, t, prefs, setPrefs } = useStore();
  const pending = campaigns.filter((c) => c.status === "revision").length;

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between gap-4 overflow-y-auto bg-sidebar p-5 lg:flex">
        <div className="space-y-8">
          <Wordmark />
          <NavList />
        </div>
        <SidebarFooter />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label={t("shell.closeMenu")} className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col justify-between gap-4 overflow-y-auto bg-sidebar p-5 animate-in slide-in-from-left">
            <div className="space-y-8">
              <div className="flex items-start justify-between">
                <Wordmark />
                <button aria-label={t("shell.closeMenu")} onClick={() => setOpen(false)} className="text-sidebar-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavList onNavigate={() => setOpen(false)} />
            </div>
            <SidebarFooter />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center gap-2 border-b bg-background px-3 py-2 md:px-8">
          <button aria-label={t("shell.openMenu")} className="rounded-md p-2 hover:bg-muted lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <form
            className="relative order-3 w-full md:order-none md:max-w-md md:flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/campanas", search: { q } });
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("shell.search")} aria-label={t("shell.search")} className="field pl-9" />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <div role="group" aria-label={t("shell.lang")} className="flex overflow-hidden rounded-full border text-xs font-bold">
              {(["es", "en"] as const).map((l) => (
                <Button size="sm" variant={prefs.lang === l ? 'default' : 'ghost'} key={l} aria-pressed={prefs.lang === l} onClick={() => void runLocalAction(() => setPrefs({ lang: l }))} className="rounded-none px-2.5 uppercase">{l}</Button>
              ))}
            </div>
            <button
              aria-label={t("shell.notifications")}
              className="relative rounded-full p-2 hover:bg-muted"
              onClick={() =>
                pending
                  ? toast(`${pending} · ${t('Revisar pendientes')}`, { action: { label: t('Ver todas'), onClick: () => navigate({ to: "/criterios" }) } })
                  : toast(t("No hay notificaciones pendientes"))
              }
            >
              <Bell className="h-5 w-5" />
              {pending > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold ring-2 ring-background" />}
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <AccountChip />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}

function AccountChip() {
  const { tr } = useI18n();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return (
    <Link to={email ? "/espacio" : "/login"} className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-muted">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold uppercase text-primary-foreground">{email ? email.slice(0, 2) : "—"}</div>
      <div className="max-w-44 leading-tight">
        <p className="truncate text-sm font-semibold">{email ?? tr("Iniciar sesión")}</p>
        {!email && <p className="text-[11px] text-muted-foreground">{tr("Sin sesión · datos en este navegador")}</p>}
      </div>
    </Link>
  );
}

function ThemeToggle() {
  const { tr } = useI18n();
  const { prefs, setPrefs } = useStore();
  const cur = prefs.theme ?? "system";
  const Icon = cur === "dark" ? Moon : cur === "light" ? Sun : Monitor;
  return (
    <label className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-semibold">
      <Icon className="h-4 w-4 shrink-0" />
      <select aria-label={tr('Tema')} className="max-w-32 bg-background text-foreground focus-visible:outline-ring" value={cur} onChange={e => void runLocalAction(() => setPrefs({ theme: e.target.value as 'system' | 'light' | 'dark' }))}>
        <option value="system">{tr('Tema del sistema')}</option>
        <option value="light">{tr('Tema claro')}</option>
        <option value="dark">{tr('Tema oscuro')}</option>
      </select>
    </label>
  );
}
