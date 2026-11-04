import { useI18n } from "@/lib/use-i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, BookOpenCheck, Building2, CalendarDays, Eye, FileText, FlaskConical, ImagePlus, Images, PenLine, RotateCcw, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runLocalAction, useStore } from "@/lib/store";
import { StatusBadge, KindBadge, formatDate } from "@/components/app/ui-bits";
import { Poster } from "@/components/app/Poster";
import { STOCK, stockUrl } from '@/lib/stock';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio · Campaña Clara" },
      { name: "description", content: "Panel editorial para preparar campañas institucionales con propósito y revisión." },
      { property: "og:title", content: "Campaña Clara · Comuniquemos con propósito" },
      { property: "og:description", content: "Campañas institucionales con criterio editorial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { tr, label, locale } = useI18n();
  const { campaigns, calendar, profile, reset, onboardingDismissed, dismissOnboarding, activity, media } = useStore();
  const navigate = useNavigate();
  const count = (s: string) => campaigns.filter((c) => c.status === s).length;
  const recent = [...campaigns].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  const featured = recent[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 rounded-xl border border-teal/30 bg-teal-soft px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 font-medium text-accent-foreground">
          <FlaskConical className="h-4 w-4" /> {tr("Prototipo de prueba · Los cambios se guardan en este navegador")}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void runLocalAction(() => {
            reset();
            toast.success(tr("Datos de demostración restablecidos"));
          })}
        >
          <RotateCcw /> {tr("Restablecer datos de demostración")}</Button>
      </div>

      <section className="border-y py-8 md:py-10">
        <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="eyebrow">{profile.name}</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
              {tr("Comuniquemos con")} <em className="text-teal">{tr("propósito.")}</em>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
              {tr("Prepará campañas claras, revisadas y coherentes con la identidad de tu institución. Cada propuesta pasa por criterios editoriales antes de publicarse.")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/crear">
                  <PenLine /> {tr("Crear campaña")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/criterios">
                  {tr("Ver criterios editoriales")}<ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
          {featured && (
            <div className="mx-auto hidden w-60 overflow-hidden md:block">
              <Poster campaign={featured} profile={profile} format="afiche" />
            </div>
          )}
        </div>
      </section>

      <section className="border-b py-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">{tr('Imágenes y recursos')}</p><h2 className="text-2xl font-semibold">{tr('Biblioteca visual')}</h2><p className="text-sm text-muted-foreground">{STOCK.length} · {tr('Recursos disponibles')}</p></div><Button asChild variant="outline"><Link to="/biblioteca">{tr('Explorar biblioteca')}<ArrowRight/></Link></Button></div>
        <Link to="/biblioteca" className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label={tr('Explorar biblioteca')}>{['photo-lake', 'visual-ciudad', 'visual-cr', 'photo-city', 'visual-cafe', 'visual-solar'].map(id => { const s = STOCK.find(x => x.id === id); return s ? <img key={id} src={stockUrl(s)} alt={locale === 'en-US' ? s.titleEn ?? label(s.title) : s.title} loading="lazy" className="aspect-[3/2] w-full rounded-sm border object-cover"/> : null; })}</Link>
      </section>
      <section className="flex flex-col gap-4 border-y border-teal/30 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4"><ImagePlus className="h-8 w-8 shrink-0 text-teal" /><div><p className="eyebrow">{tr("Taller creativo")}</p><h2 className="text-2xl font-semibold">{tr("Estudio de imágenes")}</h2><p className="text-sm text-muted-foreground">{tr("Imágenes privadas · edición local")}</p></div></div>
        <Button asChild variant="outline"><Link to="/estudio">{tr("Abrir estudio")}<ArrowRight /></Link></Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: tr("Borradores"), n: count("borrador"), icon: FileText, tone: "text-muted-foreground" },
          { label: tr("En revisión"), n: count("revision"), icon: Eye, tone: "text-warn" },
          { label: tr("Aprobadas"), n: count("aprobado"), icon: BadgeCheck, tone: "text-ok" },
          { label: tr("Recursos en biblioteca"), n: media.length, icon: Images, tone: "text-teal", to: "/biblioteca" as const },
        ].map((m) => (
          <Link key={m.label} to={"to" in m ? m.to : "/campanas"} className="flex items-center justify-between border-b p-4 hover:bg-muted">
            <div>
              <p className="text-sm text-muted-foreground">{m.label}</p>
              <p className="mt-1 font-display text-4xl font-semibold">{m.n}</p>
            </div>
            <m.icon className={`h-8 w-8 ${m.tone}`} />
          </Link>
        ))}
      </section>

      {!onboardingDismissed && campaigns.length <= 4 && (
        <section className="card-editorial relative p-6">
          <button aria-label={tr("Cerrar guía")} onClick={() => void runLocalAction(dismissOnboarding)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <p className="eyebrow">{tr("Guía rápida")}</p>
          <h2 className="mt-1 text-2xl font-semibold">{tr("Tu primera campaña en tres pasos")}</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { n: "1", t: tr("Revisá el perfil"), d: tr("Confirmá nombre, colores y si tenés autorización para usar el logo."), to: "/perfil" as const },
              { n: "2", t: tr("Generá una propuesta"), d: tr("Elegí tema, público y formato. La fecha es opcional."), to: "/crear" as const },
              { n: "3", t: tr("Pasala a revisión"), d: tr("Completá la lista editorial antes de aprobar."), to: "/criterios" as const },
            ].map((s) => (
              <li key={s.n}>
                <Link to={s.to} className="flex h-full gap-3 rounded-lg border p-4 hover:border-teal/50 hover:bg-teal-soft/40">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-foreground">{s.n}</span>
                  <span>
                    <span className="block font-semibold">{label(s.t)}</span>
                    <span className="text-sm text-muted-foreground">{label(s.d)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-semibold">{tr("Campañas recientes")}</h2>
            <Link to="/campanas" className="text-sm font-semibold text-teal hover:underline">{tr("Ver todas")}</Link>
          </div>
          {recent.length === 0 ? (
            <div className="card-editorial p-8 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-gold" />
              <p className="mt-3 font-semibold">{tr("Aún no hay campañas")}</p>
              <p className="text-sm text-muted-foreground">{tr("Empezá con una campaña temática; no necesita fecha.")}</p>
              <Button className="mt-4" onClick={() => navigate({ to: "/crear" })}>{tr("Crear campaña")}</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((c) => (
                <Link key={c.id} to="/crear" search={{ id: c.id }} className="card-editorial flex items-center gap-4 p-4 hover:border-teal/40">
                  <div className="w-14 shrink-0 overflow-hidden rounded-md">
                    <Poster campaign={c} profile={profile} format="afiche" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-semibold">{c.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.efemeride.enabled ? tr("Efeméride") : tr("Campaña temática")} · {c.theme}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          )}

          <h2 className="mb-4 mt-10 text-2xl font-semibold">{tr("Acciones editoriales")}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { t: tr("Nueva campaña temática"), i: PenLine, to: "/crear" as const },
              { t: tr("Revisar pendientes"), i: BookOpenCheck, to: "/criterios" as const },
              { t: tr("Actualizar identidad"), i: Building2, to: "/perfil" as const },
            ].map((a) => (
              <Link key={label(a.t)} to={a.to} className="card-editorial flex items-center gap-3 p-4 text-sm font-semibold hover:border-teal/40">
                <a.i className="h-5 w-5 text-teal" /> {a.t}
              </Link>
            ))}
          </div>
        </section>

        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-semibold">{tr("Próximas fechas")}</h2>
            <Link to="/calendario" className="text-sm font-semibold text-teal hover:underline">{tr("Calendario")}</Link>
          </div>
          <div className="space-y-3">
            {calendar.slice(0, 4).map((e) => (
              <div key={e.id} className="card-editorial p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.date ? formatDate(e.date, locale) : tr("Sin fecha asociada")}</p>
                    <div className="mt-2"><KindBadge kind={e.kind} /></div>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">{tr("Datos ilustrativos. Verificá cada fecha y su fuente antes de usarla institucionalmente.")}</p>
          </div>
          <div className="mb-4 mt-10 flex items-end justify-between">
            <h2 className="text-2xl font-semibold">{tr("Actividad reciente")}</h2>
            <Link to="/historial" className="text-sm font-semibold text-teal hover:underline">{tr("Historial")}</Link>
          </div>
          {activity.length === 0 ? <p className="card-editorial p-4 text-sm text-muted-foreground">{tr("Todavía no hay actividad registrada.")}</p> : (
            <ul className="card-editorial divide-y text-sm">
              {activity.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 p-3"><span className="min-w-0 truncate"><span className="font-semibold capitalize">{label(e.action)}</span> · {e.target}</span><span className="shrink-0 text-xs text-muted-foreground">{new Date(e.at).toLocaleDateString(locale)}</span></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
