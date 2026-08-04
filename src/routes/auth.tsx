import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acceso administradores | Lorena Automotores" },
      { name: "description", content: "Ingreso privado al panel de gestión de Lorena Automotores." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Acceso administradores | Lorena Automotores" },
      { property: "og:description", content: "Ingreso privado al panel de gestión." },
    ],
  }),
  component: AuthPage,
});

const inputCls =
  "w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm outline-none transition-colors focus-visible:border-primary";

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registro, setRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (session) void navigate({ to: "/admin", replace: true });
  }, [session, navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    try {
      if (registro) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Pedí que te asignen el rol de administrador.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-28">
      <div className="glass-panel rounded-3xl p-8 shadow-elevated">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">Área privada</p>
        <h1 className="mt-3 text-2xl font-semibold">
          {registro ? "Crear cuenta" : "Ingresar al panel"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Solo administradores autorizados pueden gestionar el catálogo.
        </p>

        <form onSubmit={enviar} className="mt-8 space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={registro ? "new-password" : "current-password"}
            placeholder="Contraseña"
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-gold disabled:opacity-50"
          >
            {cargando ? "Procesando…" : registro ? "Crear cuenta" : "Ingresar"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setRegistro((r) => !r)}
          className="mt-6 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          {registro ? "Ya tengo cuenta, ingresar" : "Crear una cuenta nueva"}
        </button>
      </div>
    </div>
  );
}