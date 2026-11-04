import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/use-i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña · Campaña Clara" },
      { name: "description", content: "Definí una nueva contraseña para tu cuenta de Campaña Clara." },
      { property: "og:title", content: "Nueva contraseña · Campaña Clara" },
      { property: "og:description", content: "Restablecimiento seguro de contraseña." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const { tr } = useI18n();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form className="mx-auto max-w-md space-y-4 rounded-2xl border bg-card p-8" onSubmit={async e => {
      e.preventDefault();
      if (pw.length < 10) { toast.error(tr("La contraseña debe tener al menos 10 caracteres.")); return; }
      setBusy(true);
      const { error } = await supabase.auth.updateUser({ password: pw });
      setBusy(false);
      if (error) { toast.error(tr("El enlace venció o no es válido. Pedí uno nuevo.")); return; }
      toast.success(tr("Contraseña actualizada."));
      navigate({ to: "/espacio" });
    }}>
      <h1 className="text-2xl font-semibold">{tr("Nueva contraseña")}</h1>
      <label className="block text-sm font-semibold">{tr("Contraseña")}<input type="password" required minLength={10} autoComplete="new-password" className="field mt-1" value={pw} onChange={e => setPw(e.target.value)} /></label>
      <Button type="submit" className="w-full" disabled={busy}>{tr("Guardar contraseña")}</Button>
    </form>
  );
}
