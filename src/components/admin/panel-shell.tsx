import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, ShieldCheck, Wrench } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { ETIQUETA_ROL, type CuentaDTO } from "@/lib/cuenta";

export function PanelShell({
  cuenta,
  titulo,
  bajada,
  actual,
  children,
}: {
  cuenta: CuentaDTO;
  titulo: string;
  bajada: string;
  actual: "admin" | "panel";
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function salir() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-fade-in">
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Stark Automotores</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">{titulo}</h1>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {cuenta.nombre}
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[0.62rem] text-primary">
              <ShieldCheck className="size-3" /> {ETIQUETA_ROL[cuenta.rol]}
            </span>
          </p>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{bajada}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {cuenta.rol === "admin" && (
            <button
              type="button"
              onClick={() => void navigate({ to: actual === "admin" ? "/panel" : "/admin" })}
              className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:border-primary"
            >
              {actual === "admin" ? <Wrench className="size-4" /> : <LayoutDashboard className="size-4" />}
              {actual === "admin" ? "Panel operativo" : "Panel de administración"}
            </button>
          )}
          <button
            type="button"
            onClick={() => void salir()}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:border-destructive"
          >
            <LogOut className="size-4" /> Salir
          </button>
        </div>
      </header>
      <div className="mt-10">{children}</div>
    </div>
  );
}

export function Pestanas<T extends string>({
  valor,
  opciones,
  onCambio,
}: {
  valor: T;
  opciones: [T, string][];
  onCambio: (v: T) => void;
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      {opciones.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onCambio(id)}
          className={`rounded-full px-5 py-2 text-sm transition-all ${
            valor === id
              ? "bg-primary text-primary-foreground shadow-gold"
              : "border text-muted-foreground hover:-translate-y-0.5 hover:border-primary"
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

export function PanelCargando({ mensaje = "Cargando panel…" }: { mensaje?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      {mensaje}
    </div>
  );
}