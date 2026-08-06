import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, Eye, Pencil, Plus, Star, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { VehiculoForm } from "@/components/admin/vehiculo-form";
import { Contador } from "@/components/ui/contador";
import { useRealtime } from "@/hooks/use-realtime";
import { registrarActividad } from "@/lib/cuenta";
import {
  actualizarVehiculo,
  eliminarVehiculo,
  vehiculosAdminQuery,
  type Vehiculo,
} from "@/lib/vehiculos";

const titulo = (v: Vehiculo) => `${v.marca} ${v.modelo}${v.version ? ` ${v.version}` : ""}`;
const precio = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const kilometros = (n: number) => `${n.toLocaleString("es-AR")} km`;

export function VehiculosPanel({ puedeEliminar }: { puedeEliminar: boolean }) {
  const qc = useQueryClient();
  const { data: vehiculos = [], isLoading } = useQuery(vehiculosAdminQuery());
  const [editando, setEditando] = useState<Vehiculo | null>(null);
  const [creando, setCreando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  useRealtime("vehiculos", [["vehiculos-admin"], ["vehiculos"]]);

  const refrescar = async () => {
    await qc.invalidateQueries({ queryKey: ["vehiculos-admin"] });
    await qc.invalidateQueries({ queryKey: ["vehiculos"] });
  };

  const toggle = useMutation({
    mutationFn: async ({ v, campo }: { v: Vehiculo; campo: "publicado" | "destacado" | "vendido" }) => {
      await actualizarVehiculo(v.id, { [campo]: !v[campo] });
      await registrarActividad(
        campo === "vendido"
          ? v.vendido
            ? "Reactivó un vehículo vendido"
            : "Marcó un vehículo como vendido"
          : campo === "publicado"
            ? v.publicado
              ? "Ocultó un vehículo"
              : "Publicó un vehículo"
            : v.destacado
              ? "Quitó un destacado"
              : "Destacó un vehículo",
        titulo(v),
      );
    },
    onSuccess: refrescar,
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo actualizar"),
  });

  const borrar = useMutation({
    mutationFn: async (v: Vehiculo) => {
      await eliminarVehiculo(v.id);
      await registrarActividad("Eliminó un vehículo", titulo(v));
    },
    onSuccess: async () => {
      await refrescar();
      toast.success("Vehículo eliminado");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo eliminar"),
  });

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return vehiculos;
    return vehiculos.filter((v) => titulo(v).toLowerCase().includes(q) || String(v.anio).includes(q));
  }, [vehiculos, busqueda]);

  const stock = vehiculos.filter((v) => !v.vendido);
  const valor = stock.reduce((acc, v) => acc + Number(v.precio ?? 0), 0);

  if (creando || editando) {
    return (
      <div className="animate-fade-in">
        <h2 className="text-xl font-semibold">
          {editando ? `Editar ${titulo(editando)}` : "Nuevo vehículo"}
        </h2>
        <div className="mt-6">
          <VehiculoForm
            {...(editando ? { vehiculo: editando } : {})}
            onClose={() => {
              setCreando(false);
              setEditando(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica label="Vehículos" valor={vehiculos.length} icon={Car} />
        <Metrica label="Publicados" valor={vehiculos.filter((v) => v.publicado).length} icon={Eye} />
        <Metrica label="Destacados" valor={vehiculos.filter((v) => v.destacado).length} icon={Star} />
        <Metrica label="Valor de stock" valor={valor} icon={Tag} formato={precio} />
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por marca, modelo o año…"
          className="w-full max-w-sm rounded-xl border bg-surface-2 px-4 py-2.5 text-sm outline-none transition-colors focus-visible:border-primary"
        />
        <span className="text-xs text-muted-foreground">{filtrados.length} resultado(s)</span>
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-gold"
        >
          <Plus className="size-4" /> Nuevo vehículo
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[840px] text-sm">
          <thead className="bg-surface-2 text-left text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Vehículo</th>
              <th className="px-4 py-3">Año</th>
              <th className="px-4 py-3">Km</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Cargando…</td>
              </tr>
            )}
            {!isLoading && filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Sin vehículos todavía.</td>
              </tr>
            )}
            {filtrados.map((v) => (
              <tr key={v.id} className="border-t transition-colors hover:bg-surface-2/60">
                <td className="px-4 py-3 font-medium">{titulo(v)}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.anio}</td>
                <td className="px-4 py-3 text-muted-foreground">{kilometros(v.km)}</td>
                <td className="px-4 py-3">{precio(Number(v.precio))}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {v.vendido && (
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[0.65rem] text-destructive">Vendido</span>
                    )}
                    {v.destacado && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] text-primary">Destacado</span>
                    )}
                    <span className="rounded-full border px-2 py-0.5 text-[0.65rem] text-muted-foreground">
                      {v.publicado ? "Publicado" : "Oculto"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Accion titulo="Publicar / ocultar" onClick={() => toggle.mutate({ v, campo: "publicado" })}>
                      <Eye className="size-4" />
                    </Accion>
                    <Accion titulo="Destacar" onClick={() => toggle.mutate({ v, campo: "destacado" })}>
                      <Star className={`size-4 ${v.destacado ? "text-primary" : ""}`} />
                    </Accion>
                    <Accion titulo="Marcar vendido" onClick={() => toggle.mutate({ v, campo: "vendido" })}>
                      <Tag className={`size-4 ${v.vendido ? "text-destructive" : ""}`} />
                    </Accion>
                    <Accion titulo="Editar" onClick={() => setEditando(v)}>
                      <Pencil className="size-4" />
                    </Accion>
                    {puedeEliminar && (
                      <Accion
                        titulo="Eliminar"
                        onClick={() => {
                          if (confirm(`¿Eliminar ${titulo(v)}?`)) borrar.mutate(v);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Accion>
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

function Accion({
  titulo: t,
  onClick,
  children,
}: {
  titulo: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={t}
      onClick={onClick}
      className="rounded-lg border p-2 transition-all hover:-translate-y-0.5 hover:border-primary"
    >
      {children}
    </button>
  );
}

function Metrica({
  label,
  valor,
  icon: Icon,
  formato,
}: {
  label: string;
  valor: number;
  icon: typeof Car;
  formato?: (n: number) => string;
}) {
  return (
    <div className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">
        <Contador valor={valor} {...(formato ? { formato } : {})} />
      </p>
    </div>
  );
}