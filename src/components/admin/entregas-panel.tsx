import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackageCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Contador } from "@/components/ui/contador";
import { useRealtime } from "@/hooks/use-realtime";
import { registrarActividad } from "@/lib/cuenta";
import { crearEntrega, eliminarEntrega, entregasQuery } from "@/lib/entregas";

const inputCls =
  "w-full rounded-xl border bg-surface-2 px-4 py-2.5 text-sm outline-none transition-colors focus-visible:border-primary";

export function EntregasPanel({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data: entregas = [], isLoading } = useQuery(entregasQuery());
  const [cliente, setCliente] = useState("");
  const [vehiculo, setVehiculo] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState("");

  useRealtime("entregas", [["entregas"]]);

  const mesActual = entregas.filter((e) => (e.fecha ?? "").slice(0, 7) === new Date().toISOString().slice(0, 7));

  const alta = useMutation({
    mutationFn: async () => {
      await crearEntrega({
        cliente: cliente.trim(),
        vehiculo: vehiculo.trim(),
        fecha,
        notas: notas.trim() || null,
        registrado_por: userId,
      });
      await registrarActividad("Registró una entrega", `${vehiculo.trim()} — ${cliente.trim()}`);
    },
    onSuccess: async () => {
      setCliente("");
      setVehiculo("");
      setNotas("");
      await qc.invalidateQueries({ queryKey: ["entregas"] });
      toast.success("Entrega registrada");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo registrar"),
  });

  const baja = useMutation({
    mutationFn: async (id: string) => {
      await eliminarEntrega(id);
      await registrarActividad("Eliminó una entrega");
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["entregas"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo eliminar"),
  });

  return (
    <div className="animate-fade-in space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">Entregas totales</p>
            <PackageCheck className="size-4 text-primary" />
          </div>
          <p className="mt-3 font-display text-3xl font-semibold">
            <Contador valor={entregas.length} />
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-1">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">Este mes</p>
          <p className="mt-3 font-display text-3xl font-semibold">
            <Contador valor={mesActual.length} />
          </p>
        </div>
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          alta.mutate();
        }}
        className="glass-panel grid gap-3 rounded-2xl p-5 sm:grid-cols-2"
      >
        <input required value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Cliente" className={inputCls} />
        <input required value={vehiculo} onChange={(e) => setVehiculo(e.target.value)} placeholder="Vehículo entregado" className={inputCls} />
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
        <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas (opcional)" className={inputCls} />
        <button
          type="submit"
          disabled={alta.isPending}
          className="sm:col-span-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-gold disabled:opacity-50"
        >
          {alta.isPending ? "Guardando…" : "Registrar entrega"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-2 text-left text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Vehículo</th>
              <th className="px-4 py-3">Notas</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Cargando…</td></tr>
            )}
            {!isLoading && entregas.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Todavía no hay entregas registradas.</td></tr>
            )}
            {entregas.map((e) => (
              <tr key={e.id} className="border-t transition-colors hover:bg-surface-2/60">
                <td className="px-4 py-3 text-muted-foreground">{e.fecha}</td>
                <td className="px-4 py-3 font-medium">{e.cliente}</td>
                <td className="px-4 py-3">{e.vehiculo}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.notas ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    title="Eliminar"
                    onClick={() => baja.mutate(e.id)}
                    className="rounded-lg border p-2 transition-all hover:-translate-y-0.5 hover:border-destructive"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}