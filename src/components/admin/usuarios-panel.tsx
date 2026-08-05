import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Mail, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  ETIQUETA_ROL,
  GRUPOS_PERMISOS,
  TODOS_LOS_PERMISOS,
  actualizarPerfil,
  fetchUsuarios,
  otorgarPermiso,
  quitarPermiso,
  type Permiso,
  type UsuarioGestion,
} from "@/lib/permisos";
import { crearUsuario, eliminarUsuario, restablecerPassword } from "@/lib/usuarios.functions";

function Switch({
  activo,
  onToggle,
  disabled,
}: {
  activo: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
        activo ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-background transition-transform ${
          activo ? "translate-x-[1.15rem]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function ClaveGenerada({ email, password }: { email: string; password: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/5 p-4 text-sm">
      <p className="font-medium">Credenciales para {email}</p>
      <p className="mt-1 text-muted-foreground">
        Contraseña temporal: <code className="rounded bg-surface-2 px-2 py-0.5 text-foreground">{password}</code>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Compartila por un canal seguro. El usuario puede cambiarla luego desde su cuenta.
      </p>
    </div>
  );
}

export function UsuariosPanel({ miId }: { miId: string }) {
  const qc = useQueryClient();
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: fetchUsuarios,
  });
  const [abierto, setAbierto] = useState<string | null>(null);
  const [credencial, setCredencial] = useState<{ email: string; password: string } | null>(null);

  const crearFn = useServerFn(crearUsuario);
  const eliminarFn = useServerFn(eliminarUsuario);
  const resetFn = useServerFn(restablecerPassword);

  // Actualización en tiempo real de perfiles y permisos.
  useEffect(() => {
    const canal = supabase
      .channel("gestion-usuarios")
      .on("postgres_changes", { event: "*", schema: "public", table: "perfiles" }, () => {
        void qc.invalidateQueries({ queryKey: ["usuarios"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "permisos_usuario" }, () => {
        void qc.invalidateQueries({ queryKey: ["usuarios"] });
        void qc.invalidateQueries({ queryKey: ["cuenta"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [qc]);

  const refrescar = () => qc.invalidateQueries({ queryKey: ["usuarios"] });

  const togglePermiso = useMutation({
    mutationFn: async ({ u, p }: { u: UsuarioGestion; p: Permiso }) =>
      u.permisos.includes(p) ? quitarPermiso(u.id, p) : otorgarPermiso(u.id, p),
    onSuccess: () => void refrescar(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo actualizar el permiso"),
  });

  const cambiarPerfil = useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: Parameters<typeof actualizarPerfil>[1] }) =>
      actualizarPerfil(id, cambios),
    onSuccess: () => void refrescar(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo actualizar el usuario"),
  });

  const invitar = useMutation({
    mutationFn: (input: { email: string; nombre: string; rol: "admin" | "empleado"; permisos: Permiso[] }) =>
      crearFn({ data: { email: input.email, nombre: input.nombre, rol: input.rol, permisos: input.permisos } }),
    onSuccess: (res) => {
      setCredencial({ email: res.email, password: res.password });
      toast.success("Usuario creado");
      void refrescar();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo crear el usuario"),
  });

  const borrar = useMutation({
    mutationFn: (userId: string) => eliminarFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("Usuario eliminado");
      void refrescar();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo eliminar"),
  });

  const reset = useMutation({
    mutationFn: (u: UsuarioGestion) => resetFn({ data: { userId: u.id } }).then((r) => ({ ...r, email: u.email })),
    onSuccess: (res) => {
      setCredencial({ email: res.email, password: res.password });
      toast.success("Contraseña restablecida");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo restablecer"),
  });

  const [form, setForm] = useState<{ email: string; nombre: string; rol: "admin" | "empleado" }>({
    email: "",
    nombre: "",
    rol: "empleado",
  });
  const [permisosNuevos, setPermisosNuevos] = useState<Permiso[]>([]);

  return (
    <div className="space-y-10">
      <section className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <UserPlus className="size-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Invitar usuario</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Se crea la cuenta con una contraseña temporal que podés compartir con la persona.
        </p>

        <form
          className="mt-5 grid gap-3 sm:grid-cols-[1.4fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            invitar.mutate({ ...form, permisos: permisosNuevos });
          }}
        >
          <input
            type="email"
            required
            placeholder="correo@empresa.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="rounded-xl border bg-surface-2 px-4 py-2.5 text-sm outline-none focus-visible:border-primary"
          />
          <input
            placeholder="Nombre (opcional)"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="rounded-xl border bg-surface-2 px-4 py-2.5 text-sm outline-none focus-visible:border-primary"
          />
          <div className="flex gap-2">
            <select
              value={form.rol}
              onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value as "admin" | "empleado" }))}
              className="rounded-xl border bg-surface-2 px-3 py-2.5 text-sm outline-none focus-visible:border-primary"
            >
              <option value="empleado">Empleado</option>
              <option value="admin">Administrador</option>
            </select>
            <button
              type="submit"
              disabled={invitar.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Mail className="size-4" /> {invitar.isPending ? "Creando…" : "Crear"}
            </button>
          </div>
        </form>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GRUPOS_PERMISOS.map((g) => (
            <div key={g.grupo}>
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">{g.grupo}</p>
              <div className="mt-2 space-y-2">
                {g.permisos.map((p) => (
                  <label key={p.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">{p.label}</span>
                    <Switch
                      activo={permisosNuevos.includes(p.id)}
                      onToggle={() =>
                        setPermisosNuevos((prev) =>
                          prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {credencial && <ClaveGenerada {...credencial} />}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Usuarios del sistema</h2>
        {isLoading && <p className="mt-4 text-sm text-muted-foreground">Cargando usuarios…</p>}

        <div className="mt-4 space-y-3">
          {usuarios.map((u) => {
            const esSuper = u.rol === "super_admin";
            const desplegado = abierto === u.id;
            return (
              <div key={u.id} className="rounded-2xl border">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium">
                      {u.nombre || u.email}
                      {esSuper && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[0.62rem] text-primary">
                          <ShieldCheck className="size-3" /> Super Admin
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={u.rol}
                      disabled={esSuper}
                      onChange={(e) =>
                        cambiarPerfil.mutate({ id: u.id, cambios: { rol: e.target.value as never } })
                      }
                      className="rounded-lg border bg-surface-2 px-3 py-1.5 text-xs disabled:opacity-50"
                    >
                      {(["empleado", "admin", "super_admin"] as const).map((r) => (
                        <option key={r} value={r}>
                          {ETIQUETA_ROL[r]}
                        </option>
                      ))}
                    </select>

                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      Activo
                      <Switch
                        activo={u.activo}
                        disabled={esSuper}
                        onToggle={() => cambiarPerfil.mutate({ id: u.id, cambios: { activo: !u.activo } })}
                      />
                    </label>

                    <button
                      type="button"
                      title="Restablecer contraseña"
                      onClick={() => reset.mutate(u)}
                      className="rounded-lg border p-2 hover:border-primary/50"
                    >
                      <KeyRound className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Eliminar usuario"
                      disabled={esSuper || u.id === miId}
                      onClick={() => {
                        if (confirm(`¿Eliminar la cuenta de ${u.email}?`)) borrar.mutate(u.id);
                      }}
                      className="rounded-lg border p-2 text-destructive hover:border-destructive/50 disabled:opacity-40"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbierto(desplegado ? null : u.id)}
                      className="rounded-full border px-4 py-1.5 text-xs"
                    >
                      {desplegado ? "Ocultar permisos" : "Permisos"}
                    </button>
                  </div>
                </div>

                {desplegado && (
                  <div className="border-t p-4">
                    {esSuper ? (
                      <p className="text-xs text-muted-foreground">
                        El Super Admin tiene acceso total a todas las secciones.
                      </p>
                    ) : (
                      <>
                        <div className="mb-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              TODOS_LOS_PERMISOS.filter((p) => !u.permisos.includes(p)).forEach((p) =>
                                togglePermiso.mutate({ u, p }),
                              )
                            }
                            className="rounded-full border px-4 py-1.5 text-[0.7rem]"
                          >
                            Activar todos
                          </button>
                          <button
                            type="button"
                            onClick={() => u.permisos.forEach((p) => togglePermiso.mutate({ u, p }))}
                            className="rounded-full border px-4 py-1.5 text-[0.7rem]"
                          >
                            Quitar todos
                          </button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          {GRUPOS_PERMISOS.map((g) => (
                            <div key={g.grupo}>
                              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                                {g.grupo}
                              </p>
                              <div className="mt-2 space-y-2">
                                {g.permisos.map((p) => (
                                  <label key={p.id} className="flex items-center justify-between gap-3 text-xs">
                                    <span className="text-muted-foreground">{p.label}</span>
                                    <Switch
                                      activo={u.permisos.includes(p.id)}
                                      onToggle={() => togglePermiso.mutate({ u, p: p.id })}
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}