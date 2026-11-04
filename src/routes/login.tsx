import { useI18n } from "@/lib/use-i18n";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogIn, UserPlus, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acceso · Campaña Clara" },
      { name: "description", content: "Iniciá sesión o creá una cuenta para trabajar con tu institución en Campaña Clara." },
      { property: "og:title", content: "Acceso · Campaña Clara" },
      { property: "og:description", content: "Acceso con cuenta para equipos editoriales institucionales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

type Mode = "signin" | "signup" | "forgot";

function Login() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setNotice("");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw new Error(tr("No se pudo iniciar sesión. Revisá el correo y la contraseña."));
        navigate({ to: "/espacio" });
      } else if (mode === "signup") {
        if (password.length < 10) throw new Error(tr("La contraseña debe tener al menos 10 caracteres."));
        const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + "/espacio", data: { display_name: name.trim().slice(0, 120) } } });
        if (error) throw new Error(tr("No se pudo crear la cuenta. Probá con otro correo o una contraseña más segura."));
        setNotice(tr("Revisá tu correo y confirmá la cuenta para poder entrar."));
      } else {
        await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + "/reset-password" });
        setNotice(tr("Si el correo tiene una cuenta, te enviamos un enlace para restablecer la contraseña."));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr("Ocurrió un error inesperado."));
    } finally { setBusy(false); }
  }

  const title = mode === "signin" ? tr("Iniciar sesión") : mode === "signup" ? tr("Crear cuenta") : tr("Recuperar contraseña");
  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl shadow-lift md:grid-cols-2">
      <div className="hero-panel flex flex-col justify-between p-8 md:p-10">
        <div className="font-display text-3xl font-semibold">campaña <span className="italic text-gold">clara</span></div>
        <p className="mt-10 font-display text-2xl leading-snug">{tr("Campañas institucionales con criterio editorial.")}</p>
        <p className="mt-10 text-xs text-primary-foreground/70">by Gingles · Powered by BDS devs</p>
      </div>
      <form className="space-y-4 bg-card p-8 md:p-10" onSubmit={submit} noValidate={false}>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {mode === "signup" && (
          <label className="block text-sm font-semibold">{tr("Nombre visible")}<input required maxLength={120} className="field mt-1" value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
        )}
        <label className="block text-sm font-semibold">{tr("Correo")}<input required type="email" maxLength={254} className="field mt-1" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
        {mode !== "forgot" && (
          <label className="block text-sm font-semibold">{tr("Contraseña")}<input required type="password" minLength={mode === "signup" ? 10 : 1} className="field mt-1" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>
        )}
        {notice && <p role="status" className="rounded-lg border bg-muted/50 p-3 text-sm">{notice}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {mode === "signin" ? <LogIn /> : mode === "signup" ? <UserPlus /> : <KeyRound />} {title}
        </Button>
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          {mode !== "signin" && <button type="button" className="font-semibold text-primary underline-offset-4 hover:underline" onClick={() => setMode("signin")}>{tr("Ya tengo cuenta")}</button>}
          {mode !== "signup" && <button type="button" className="font-semibold text-primary underline-offset-4 hover:underline" onClick={() => setMode("signup")}>{tr("Crear cuenta")}</button>}
          {mode !== "forgot" && <button type="button" className="text-muted-foreground underline-offset-4 hover:underline" onClick={() => setMode("forgot")}>{tr("Olvidé mi contraseña")}</button>}
        </div>
        <p className="text-xs text-muted-foreground">{tr("Las campañas guardadas en este navegador siguen disponibles sin iniciar sesión.")}</p>
      </form>
    </div>
  );
}
