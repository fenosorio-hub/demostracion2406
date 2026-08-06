import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  cambiarClaveEmpleado,
  crearEmpleado,
  eliminarEmpleado,
  listarEmpleados,
  EMAIL_ADMIN,
} from "@/lib/staff.functions";
import { ETIQUETA_ROL } from "@/lib/cuenta";

const inputCls =
  "w-full rounded-xl border bg-surface-2 px-4 py-2.5 text-sm outline-none transition-colors focus-visible:border-primary";

export function EmpleadosPanel({ miId }: { miId: string }) {
  const qc = useQueryClient();
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["empleados"],
    queryFn: () => listarEmpleados(),
  });
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");

  const refrescar = () => qc.invalidateQueries({ queryKey: ["empleados"] });

  const alta = useMutation({
    mutationFn: () => crearEmpleado({ data: { nombre, password } }),
    onSuccess: async (emp) => {
      setNombre("");
      setPassword("");
      await refrescar();
      toast.success(`Empleado creado. Usuario de ingreso: ${emp.nombre}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo crear el empleado"),
  });

  const clave = useMutation({
    mutationFn: (v: { userId: string; password: string }) => cambiarClaveEmpleado({ data: v }),
    onSuccess: () => toast.success("Contraseña actualizada"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo actualizar"),
  });

  const baja = useMutation({
    mutationFn: (userId: string) => eliminarEmpleado({ data: { userId } }),
    onSuccess: async () => {
      await refrescar();
      toast.success("Empleado eliminado");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo eliminar"),
  });

  return (
    <div className="animate-fade-in space-y-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          alta.mutate();
        }}
        className="glass-panel grid gap-3 rounded-2xl p-5 sm:grid-cols-[1fr_1fr_auto]"
      >
        <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del empleado" className={inputCls} />
        <input
          required
          minLength={6}
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña (mín. 6)"
          className={inputCls}
        />
        <button
          type="submit"
          disabled={alta.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-gold disabled:opacity-50"
        >
          <UserPlus className="size-4" /> {alta.isPending ? "Creando…" : "Crear empleado"}
        </button>
        <p className="text-xs text-muted-foreground sm:col-span-3">
          El empleado ingresa con su <strong>nombre</strong> y la contraseña asignada.
        </p>
      </form>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-surface-2 text-left text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Alta</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Cargando…</td></tr>
            )}
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t transition-colors hover:bg-surface-2/60">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.nombre}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.65rem] ${
                      u.rol === "admin" ? "bg-primary/15 text-primary" : "border text-muted-foreground"
                    }`}
                  >
                    {ETIQUETA_ROL[u.rol]}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      title="Restablecer contraseña"
                      onClick={() => {
                        const nueva = prompt(`Nueva contraseña para ${u.nombre}`);
                        if (nueva) clave.mutate({ userId: u.id, password: nueva });
                      }}
                      className="rounded-lg border p-2 transition-all hover:-translate-y-0.5 hover:border-primary"
                    >
                      <KeyRound className="size-4" />
                    </button>
                    {u.id !== miId && u.email !== EMAIL_ADMIN && (
                      <button
                        type="button"
                        title="Eliminar"
                        onClick={() => {
                          if (confirm(`¿Eliminar a ${u.nombre}?`)) baja.mutate(u.id);
                        }}
                        className="rounded-lg border p-2 transition-all hover:-translate-y-0.5 hover:border-destructive"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}