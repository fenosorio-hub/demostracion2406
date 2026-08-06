import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useCuenta } from "@/lib/cuenta";
import { asegurarAdminPorDefecto, sincronizarCuenta } from "@/lib/staff.functions";
import { emailDeEmpleado } from "@/lib/staff-shared";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acceso administradores | Stark Automotores" },
      { name: "description", content: "Ingreso privado al panel de gestión de Stark Automotores." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Acceso administradores | Stark Automotores" },
      { property: "og:description", content: "Ingreso privado al panel de gestión." },
    ],
  }),
  component: AuthPage,
});

const inputCls =
  "w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm outline-none transition-colors focus-visible:border-primary";

function AuthPage() {
  const navigate = useNavigate();
  const { cuenta } = useCuenta();
  const [modo, setModo] = useState<"admin" | "empleado">("admin");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    void asegurarAdminPorDefecto();
  }, []);

  useEffect(() => {
    if (cuenta) void navigate({ to: cuenta.rol === "admin" ? "/admin" : "/panel", replace: true });
  }, [cuenta, navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    try {
      const email = modo === "admin" ? usuario.trim().toLowerCase() : emailDeEmpleado(usuario);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error("Usuario o contraseña incorrectos");
      const perfil = await sincronizarCuenta();
      void navigate({ to: perfil.rol === "admin" ? "/admin" : "/panel", replace: true });
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
        <h1 className="mt-3 font-display text-2xl font-semibold">Ingresar al sistema</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acceso exclusivo para el equipo de Stark Automotores.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-full border p-1">
          {(["admin", "empleado"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                modo === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "admin" ? "Administrador" : "Empleado"}
            </button>
          ))}
        </div>

        <form onSubmit={enviar} className="mt-8 space-y-4">
          <input
            type={modo === "admin" ? "email" : "text"}
            required
            autoComplete="username"
            placeholder={modo === "admin" ? "Email" : "Nombre de empleado"}
            className={inputCls}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
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
            {cargando ? "Procesando…" : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Las cuentas de empleado las crea el administrador desde el panel.
        </p>
      </div>
    </div>
  );
}