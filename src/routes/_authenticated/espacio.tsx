import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Building2, CloudUpload, LogOut, ShieldCheck, Users, History as HistoryIcon, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/use-i18n";
import { CLOUD_ROLES, can, canReviewCampaign, toCloudCampaign, type CloudRole } from "@/lib/cloud";

export const Route = createFileRoute("/_authenticated/espacio")({
  head: () => ({
    meta: [
      { title: "Espacio institucional · Campaña Clara" },
      { name: "description", content: "Instituciones, miembros, roles, campañas compartidas y revisión con registro de auditoría." },
      { property: "og:title", content: "Espacio institucional · Campaña Clara" },
      { property: "og:description", content: "Trabajo editorial compartido por institución." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Workspace,
});

const ROLE_LABEL: Record<CloudRole, string> = { admin: "Administración institucional", editor: "Edición", reviewer: "Revisión y aprobación", reader: "Lectura" };
const errMsg = (e: unknown) => (e && typeof e === "object" && "message" in e ? String((e as { message: string }).message).slice(0, 200) : "Error");

function Workspace() {
  const { tr, label } = useI18n();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [inst, setInst] = useState<string>("");

  const memberships = useQuery({
    queryKey: ["memberships", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("memberships").select("institution_id, role, institutions(name, kind, region)").eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => { if (!inst && memberships.data?.[0]) setInst(memberships.data[0].institution_id); }, [inst, memberships.data]);
  const role = (memberships.data?.find(m => m.institution_id === inst)?.role ?? null) as CloudRole | null;

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{tr("Espacio institucional")}</p>
          <h1 className="mt-1 text-3xl font-semibold">{memberships.data?.find(m => m.institution_id === inst)?.institutions?.name ?? tr("Tu institución")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}{role && ` · ${label(ROLE_LABEL[role])}`}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(memberships.data?.length ?? 0) > 1 && (
            <select aria-label={tr("Institución")} className="field w-auto" value={inst} onChange={e => setInst(e.target.value)}>
              {memberships.data!.map(m => <option key={m.institution_id} value={m.institution_id}>{m.institutions?.name}</option>)}
            </select>
          )}
          <Button variant="outline" onClick={signOut}><LogOut /> {tr("Cerrar sesión")}</Button>
        </div>
      </header>

      {memberships.isLoading ? <p className="text-sm text-muted-foreground">{tr("Cargando…")}</p>
        : memberships.error ? <p role="alert" className="text-sm text-destructive">{tr("No se pudo cargar tu espacio.")}</p>
        : !memberships.data?.length ? <CreateInstitution onCreated={id => { setInst(id); void qc.invalidateQueries({ queryKey: ["memberships"] }); }} />
        : inst && role && (
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-8">
              <CloudCampaigns inst={inst} role={role} uid={user.id} />
              {can(role, "editCampaign") && <LocalMigration inst={inst} uid={user.id} />}
            </div>
            <aside className="space-y-8">
              <Members inst={inst} role={role} uid={user.id} />
              {can(role, "viewAudit") && <Audit inst={inst} />}
              <div className="border-t pt-4"><CreateInstitution compact onCreated={id => { setInst(id); void qc.invalidateQueries({ queryKey: ["memberships"] }); }} /></div>
            </aside>
          </div>
        )}
    </div>
  );
}

function CreateInstitution({ onCreated, compact }: { onCreated: (id: string) => void; compact?: boolean }) {
  const { tr } = useI18n();
  const [name, setName] = useState(""); const [kind, setKind] = useState(""); const [region, setRegion] = useState("");
  const [open, setOpen] = useState(!compact);
  if (!open) return <Button variant="ghost" size="sm" onClick={() => setOpen(true)}><Building2 /> {tr("Crear otra institución")}</Button>;
  return (
    <form className="max-w-lg space-y-3" onSubmit={async e => {
      e.preventDefault();
      const { data, error } = await supabase.rpc("create_institution", { _name: name, _kind: kind, _region: region });
      if (error) { toast.error(errMsg(error)); return; }
      toast.success(tr("Institución creada. Tenés el rol de administración."));
      setName(""); onCreated(data as string);
    }}>
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Building2 className="h-5 w-5" /> {tr("Crear institución")}</h2>
      {!compact && <p className="text-sm text-muted-foreground">{tr("Todavía no pertenecés a ninguna institución. Creá una o pedí a su administración que te agregue con tu correo.")}</p>}
      <label className="block text-sm font-semibold">{tr("Nombre")}<input required minLength={2} maxLength={160} className="field mt-1" value={name} onChange={e => setName(e.target.value)} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">{tr("Tipo")}<input maxLength={80} className="field mt-1" value={kind} onChange={e => setKind(e.target.value)} /></label>
        <label className="block text-sm font-semibold">{tr("Región")}<input maxLength={120} className="field mt-1" value={region} onChange={e => setRegion(e.target.value)} /></label>
      </div>
      <Button type="submit">{tr("Crear institución")}</Button>
    </form>
  );
}

const STATUS: Record<string, string> = { borrador: "Borrador", revision: "En revisión", aprobado: "Aprobado", observado: "Cambios solicitados", denegado: "Denegado" };

function CloudCampaigns({ inst, role, uid }: { inst: string; role: CloudRole; uid: string }) {
  const { tr, label, locale } = useI18n();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["cloud-campaigns", inst],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("id, title_es, title_en, status, created_by, updated_by, updated_at").eq("institution_id", inst).order("updated_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["cloud-campaigns", inst] });
  async function toReview(id: string) {
    const { error } = await supabase.from("campaigns").update({ status: "revision" }).eq("id", id);
    if (error) toast.error(errMsg(error)); else { toast.success(tr("Enviada a revisión.")); void refresh(); }
  }
  async function decide(id: string, decision: "aprobar" | "cambios" | "denegar", lang: "es" | "en") {
    const comment = decision === "aprobar" ? "" : (window.prompt(tr("Motivo o comentario (obligatorio)")) ?? "").trim();
    if (decision !== "aprobar" && !comment) return;
    const { error } = await supabase.rpc("decide_review", { _campaign: id, _decision: decision, _lang: lang, _comment: comment });
    if (error) toast.error(errMsg(error)); else { toast.success(tr("Decisión registrada.")); void refresh(); }
  }
  return (
    <section aria-labelledby="cc-title">
      <h2 id="cc-title" className="mb-3 text-lg font-semibold">{tr("Campañas compartidas")}</h2>
      {q.isLoading ? <p className="text-sm text-muted-foreground">{tr("Cargando…")}</p>
        : !q.data?.length ? <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{tr("Aún no hay campañas compartidas en esta institución.")}</p>
        : (
          <ul className="divide-y rounded-xl border bg-card">
            {q.data.map(c => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.title_es || tr("Sin título")}</p>
                  <p className="truncate text-xs text-muted-foreground">EN: {c.title_en || tr("Sin versión inglesa")} · {new Date(c.updated_at).toLocaleDateString(locale)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold">{label(STATUS[c.status] ?? c.status)}</span>
                  {can(role, "editCampaign") && ["borrador", "observado"].includes(c.status) && <Button size="sm" variant="outline" onClick={() => toReview(c.id)}><Send /> {tr("Enviar a revisión")}</Button>}
                  {canReviewCampaign(role, uid, c) && (<>
                    <Button size="sm" onClick={() => decide(c.id, "aprobar", "es")}>{tr("Aprobar ES")}</Button>
                    <Button size="sm" variant="outline" disabled={!c.title_en} onClick={() => decide(c.id, "aprobar", "en")}>{tr("Aprobar EN")}</Button>
                    <Button size="sm" variant="outline" onClick={() => decide(c.id, "cambios", "es")}>{tr("Pedir cambios")}</Button>
                    <Button size="sm" variant="ghost" onClick={() => decide(c.id, "denegar", "es")}>{tr("Denegar")}</Button>
                  </>)}
                  {can(role, "review") && c.status === "revision" && !canReviewCampaign(role, uid, c) && <span className="text-xs text-muted-foreground">{tr("Otra persona debe revisarla")}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}

function LocalMigration({ inst, uid }: { inst: string; uid: string }) {
  const { tr } = useI18n();
  const { campaigns } = useStore();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const rows = useMemo(() => campaigns.map(c => toCloudCampaign(c, inst, uid)), [campaigns, inst, uid]);
  const approvedLocal = campaigns.filter(c => c.status === "aprobado").length;
  async function run() {
    if (!window.confirm(tr("Se copiarán las campañas de este navegador a la institución. Los datos locales no se borran. ¿Continuar?"))) return;
    setBusy(true);
    const { data, error } = await supabase.from("campaigns").upsert(rows as unknown as TablesInsert<"campaigns">[], { onConflict: "institution_id,local_id", ignoreDuplicates: true }).select("id");
    setBusy(false);
    if (error) { toast.error(errMsg(error)); return; }
    const added = data?.length ?? 0;
    setResult(`${tr("Nuevas copiadas")}: ${added} · ${tr("Ya existentes, sin cambios")}: ${rows.length - added}`);
    void qc.invalidateQueries({ queryKey: ["cloud-campaigns", inst] });
  }
  return (
    <section aria-labelledby="mig-title" className="rounded-xl border bg-card p-5">
      <h2 id="mig-title" className="flex items-center gap-2 text-lg font-semibold"><CloudUpload className="h-5 w-5" /> {tr("Copiar campañas de este navegador")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{tr("Opcional y repetible: las campañas ya copiadas no se duplican ni se sobrescriben. Tus datos locales quedan intactos.")}</p>
      <p className="mt-3 text-sm">{tr("Campañas locales")}: <strong>{rows.length}</strong>{approvedLocal > 0 && <> · {tr("Las aprobaciones locales no se copian; deben revisarse de nuevo en la institución")} ({approvedLocal})</>}</p>
      <Button className="mt-4" disabled={busy || rows.length === 0} onClick={run}><CloudUpload /> {tr("Copiar a la institución")}</Button>
      {result && <p role="status" className="mt-3 text-sm font-semibold">{result}</p>}
    </section>
  );
}

function Members({ inst, role, uid }: { inst: string; role: CloudRole; uid: string }) {
  const { tr, label } = useI18n();
  const qc = useQueryClient();
  const [email, setEmail] = useState(""); const [newRole, setNewRole] = useState<CloudRole>("editor");
  const q = useQuery({
    queryKey: ["members", inst],
    queryFn: async () => {
      const { data: m, error } = await supabase.from("memberships").select("user_id, role").eq("institution_id", inst);
      if (error) throw error;
      const { data: p } = await supabase.from("profiles").select("user_id, display_name").in("user_id", m.map(x => x.user_id));
      return m.map(x => ({ ...x, name: p?.find(y => y.user_id === x.user_id)?.display_name || "—" }));
    },
  });
  const admin = can(role, "manageMembers");
  return (
    <section aria-labelledby="mem-title">
      <h2 id="mem-title" className="mb-3 flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5" /> {tr("Miembros y roles")}</h2>
      <ul className="space-y-2 text-sm">
        {q.data?.map(m => (
          <li key={m.user_id} className="flex items-center justify-between gap-2">
            <span className="truncate">{m.name}{m.user_id === uid && ` (${tr("vos")})`}</span>
            {admin && m.user_id !== uid ? (
              <select aria-label={tr("Rol")} className="field w-auto py-1 text-xs" value={m.role} onChange={async e => {
                const { error } = await supabase.from("memberships").update({ role: e.target.value as CloudRole }).eq("institution_id", inst).eq("user_id", m.user_id);
                if (error) toast.error(errMsg(error)); else void qc.invalidateQueries({ queryKey: ["members", inst] });
              }}>{CLOUD_ROLES.map(r => <option key={r} value={r}>{label(ROLE_LABEL[r])}</option>)}</select>
            ) : <span className="text-xs text-muted-foreground">{label(ROLE_LABEL[m.role as CloudRole])}</span>}
          </li>
        ))}
      </ul>
      {admin && (
        <form className="mt-4 space-y-2" onSubmit={async e => {
          e.preventDefault();
          const { error } = await supabase.rpc("add_member_by_email", { _inst: inst, _email: email, _role: newRole });
          if (error) { toast.error(errMsg(error)); return; }
          toast.success(tr("Miembro agregado.")); setEmail(""); void qc.invalidateQueries({ queryKey: ["members", inst] });
        }}>
          <label className="block text-sm font-semibold">{tr("Agregar por correo (la persona debe tener cuenta)")}<input type="email" required className="field mt-1" value={email} onChange={e => setEmail(e.target.value)} /></label>
          <div className="flex gap-2">
            <select aria-label={tr("Rol")} className="field" value={newRole} onChange={e => setNewRole(e.target.value as CloudRole)}>{CLOUD_ROLES.map(r => <option key={r} value={r}>{label(ROLE_LABEL[r])}</option>)}</select>
            <Button type="submit"><ShieldCheck /> {tr("Agregar")}</Button>
          </div>
        </form>
      )}
    </section>
  );
}

function Audit({ inst }: { inst: string }) {
  const { tr, locale } = useI18n();
  const q = useQuery({
    queryKey: ["audit", inst],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_log").select("id, action, target, detail, created_at").eq("institution_id", inst).order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
  });
  return (
    <section aria-labelledby="aud-title">
      <h2 id="aud-title" className="mb-3 flex items-center gap-2 text-lg font-semibold"><HistoryIcon className="h-5 w-5" /> {tr("Auditoría reciente")}</h2>
      <ul className="space-y-1.5 text-xs">
        {q.data?.map(a => <li key={a.id} className="flex justify-between gap-2"><span className="truncate">{a.action} · {a.target.split(":")[0]} {JSON.stringify(a.detail) === "{}" ? "" : JSON.stringify(a.detail)}</span><time className="shrink-0 text-muted-foreground">{new Date(a.created_at).toLocaleString(locale)}</time></li>)}
      </ul>
      <p className="mt-2 text-[11px] text-muted-foreground">{tr("Registro de solo inserción: no se puede editar ni borrar desde la app.")}</p>
    </section>
  );
}
