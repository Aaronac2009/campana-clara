import type { ReactNode } from "react";
import { useI18n } from '@/lib/use-i18n';
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type CampaignStatus, type CalendarKind, KIND_LABEL } from "@/lib/types";
import { AlertTriangle, BadgeCheck, CircleDashed, Eye, FileText, Tag } from "lucide-react";

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-semibold text-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

const statusStyle: Record<CampaignStatus, string> = {
  borrador: "bg-muted text-muted-foreground border-border",
  revision: "bg-gold-soft text-warn border-gold/40",
  aprobado: "bg-ok-soft text-ok border-ok/30",
  observado: "bg-destructive/10 text-destructive border-destructive/30",
  denegado: "bg-muted text-foreground border-border",
};
const statusIcon = { borrador: FileText, revision: Eye, aprobado: BadgeCheck, observado: AlertTriangle, denegado: FileText };

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const { label } = useI18n();
  const I = statusIcon[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", statusStyle[status])}>
      <I className="h-3 w-3" /> {label(STATUS_LABEL[status])}
    </span>
  );
}

const kindStyle: Record<CalendarKind, string> = {
  verificada: "bg-ok-soft text-ok border-ok/30",
  pendiente: "bg-warn-soft text-warn border-warn/30",
  tematica: "bg-teal-soft text-accent-foreground border-teal/30",
};
const kindIcon = { verificada: BadgeCheck, pendiente: CircleDashed, tematica: Tag };

export function KindBadge({ kind }: { kind: CalendarKind }) {
  const { label } = useI18n();
  const I = kindIcon[kind];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", kindStyle[kind])}>
      <I className="h-3 w-3" /> {label(KIND_LABEL[kind])}
    </span>
  );
}

export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Safeguard({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-gold/40 bg-gold-soft px-3 py-2 text-xs text-foreground">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
      <span>{children}</span>
    </div>
  );
}

export const formatDate = (iso: string, locale = 'es-CR') => {
  if (!iso) return locale === 'en-US' ? 'No date' : "Sin fecha";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return locale === 'en-US' ? 'Invalid date' : "Fecha no válida";
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return locale === 'en-US' ? 'Invalid date' : "Fecha no válida";
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(date);
};
