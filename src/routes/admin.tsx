import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, LogOut, Pencil, Plus, Star, Tag, Trash2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { ETIQUETA_ROL, registrarActividad, useCuenta, type Cuenta } from "@/lib/permisos";
import { UsuariosPanel } from "@/components/admin/usuarios-panel";
import { HistorialPanel } from "@/components/admin/historial-panel";
import { VehiculoForm } from "@/components/admin/vehiculo-form";
import {
  actualizarVehiculo,
  eliminarVehiculo,
  kilometros,
  precio,
  titulo,
  vehiculosAdminQuery,
  type Vehiculo,
} from "@/lib/vehiculos";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel de administración | Stark Automotores" },
      { name: "description", content: "Gestión de vehículos, imágenes y publicación del catálogo." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Panel de administración | Stark Automotores" },
      { property: "og:description", content: "Gestión interna del catálogo de vehículos." },
    ],
  }),
  component: AdminPage,
});

function Pantalla({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-5 py-32 text-center">
      {children}
    </div>
  );
}

function AdminPage() {
  const { session, cargando } = useSession();
  const { data: cuenta, isLoading: cargandoRol } = useCuenta(session?.user.id);

  if (cargando || (session && cargandoRol)) {
    return <Pantalla><p className="text-sm text-muted-foreground">Verificando acceso…</p></Pantalla>;
  }

  if (!session) {
    return (
      <Pantalla>
        <h1 className="text-3xl font-semibold">Acceso restringido</h1>
        <p className="mt-4 text-sm text-muted-foreground">Necesitás iniciar sesión para gestionar el catálogo.</p>
        <Link to="/auth" className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Ingresar
        </Link>
      </Pantalla>
    );
  }

  if (!cuenta || !cuenta.perfil.activo || !cuenta.algunPermiso) {
    return (
      <Pantalla>
        <h1 className="text-3xl font-semibold">Acceso denegado</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Tu cuenta todavía no tiene permisos asignados. Pedile al Super Admin que te habilite el acceso.
        </p>
        <div className="mt-8 flex gap-3">
          <Link to="/" className="rounded-full border px-6 py-3 text-sm font-semibold">Volver al inicio</Link>
          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Cerrar sesión
          </button>
        </div>
      </Pantalla>
    );
  }

  return <Dashboard cuenta={cuenta} />;
}

function Metrica({ label, valor, icon: Icon }: { label: string; valor: string; icon: typeof Car }) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{valor}</p>
    </div>
  );
}

type Pestana = "vehiculos" | "usuarios" | "historial";

function Dashboard({ cuenta }: { cuenta: Cuenta }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: vehiculos = [], isLoading } = useQuery(vehiculosAdminQuery());
  const [editando, setEditando] = useState<Vehiculo | null>(null);
  const [creando, setCreando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pestana, setPestana] = useState<Pestana>("vehiculos");

  const puede = cuenta.puede;
  const gestionaUsuarios = cuenta.esSuperAdmin || puede("usuarios_gestionar");

  const refrescar = async () => {
    await qc.invalidateQueries({ queryKey: ["vehiculos-admin"] });
    await qc.invalidateQueries({ queryKey: ["vehiculos"] });
  };

  // Catálogo en tiempo real para todos los administradores conectados.
  useEffect(() => {
    const canal = supabase
      .channel("vehiculos-admin-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehiculos" }, () => {
        void refrescar();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useMutation({
    mutationFn: async ({ v, campo }: { v: Vehiculo; campo: "publicado" | "destacado" | "vendido" }) => {
      await actualizarVehiculo(v.id, { [campo]: !v[campo] });
      await registrarActividad(
        campo === "vendido"
          ? v.vendido ? "Reactivó un vehículo vendido" : "Marcó un vehículo como vendido"
          : campo === "publicado"
            ? v.publicado ? "Ocultó un vehículo" : "Publicó un vehículo"
            : v.destacado ? "Quitó un destacado" : "Destacó un vehículo",
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

  async function salir() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  if (creando || editando) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8">
        <h1 className="text-2xl font-semibold">
          {editando ? `Editar ${titulo(editando)}` : "Nuevo vehículo"}
        </h1>
        <div className="mt-8">
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
    <div className="mx-auto max-w-7xl px-5 py-28 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Panel</p>
          <h1 className="mt-2 text-3xl font-semibold">Gestión de catálogo</h1>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {cuenta.perfil.email}
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[0.62rem] text-primary">
              <ShieldCheck className="size-3" /> {ETIQUETA_ROL[cuenta.perfil.rol]}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          {puede("vehiculos_crear") && (
            <button
              type="button"
              onClick={() => setCreando(true)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-gold"
            >
              <Plus className="size-4" /> Nuevo vehículo
            </button>
          )}
          <button
            type="button"
            onClick={() => void salir()}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm"
          >
            <LogOut className="size-4" /> Salir
          </button>
        </div>
      </header>

      <nav className="mt-8 flex flex-wrap gap-2">
        {([
          ["vehiculos", "Vehículos"],
          ...(gestionaUsuarios ? ([["usuarios", "Usuarios"]] as const) : []),
          ...(gestionaUsuarios ? ([["historial", "Historial"]] as const) : []),
        ] as [Pestana, string][]).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPestana(id)}
            className={`rounded-full px-5 py-2 text-sm transition-colors ${
              pestana === id ? "bg-primary text-primary-foreground" : "border text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {pestana === "usuarios" && gestionaUsuarios && (
        <div className="mt-10">
          <UsuariosPanel miId={cuenta.perfil.id} />
        </div>
      )}

      {pestana === "historial" && gestionaUsuarios && (
        <div className="mt-10">
          <HistorialPanel />
        </div>
      )}

      {pestana === "vehiculos" && (
      <>
      {(cuenta.esSuperAdmin || puede("panel_estadisticas")) && (
      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica label="Vehículos" valor={String(vehiculos.length)} icon={Car} />
        <Metrica label="Publicados" valor={String(vehiculos.filter((v) => v.publicado).length)} icon={Eye} />
        <Metrica label="Destacados" valor={String(vehiculos.filter((v) => v.destacado).length)} icon={Star} />
        <Metrica label="Valor de stock" valor={precio(valor)} icon={Tag} />
      </section>
      )}

      <div className="mt-10 flex items-center gap-3">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por marca, modelo o año…"
          className="w-full max-w-sm rounded-xl border bg-surface-2 px-4 py-2.5 text-sm outline-none focus-visible:border-primary"
        />
        <span className="text-xs text-muted-foreground">{filtrados.length} resultado(s)</span>
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
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Cargando…</td></tr>
            )}
            {!isLoading && filtrados.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Sin vehículos todavía.</td></tr>
            )}
            {filtrados.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-4 py-3 font-medium">{titulo(v)}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.anio}</td>
                <td className="px-4 py-3 text-muted-foreground">{kilometros(v.km)}</td>
                <td className="px-4 py-3">{precio(v.precio)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {v.vendido && <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[0.65rem] text-destructive">Vendido</span>}
                    {v.destacado && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] text-primary">Destacado</span>}
                    <span className="rounded-full border px-2 py-0.5 text-[0.65rem] text-muted-foreground">
                      {v.publicado ? "Publicado" : "Oculto"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button type="button" title="Publicar/ocultar" disabled={!puede("vehiculos_editar")} onClick={() => toggle.mutate({ v, campo: "publicado" })} className="rounded-lg border p-2 hover:border-primary/50 disabled:opacity-40">
                      {v.publicado ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                    <button type="button" title="Destacar" disabled={!puede("promociones_editar") && !puede("vehiculos_editar")} onClick={() => toggle.mutate({ v, campo: "destacado" })} className="rounded-lg border p-2 hover:border-primary/50 disabled:opacity-40">
                      <Star className={`size-3.5 ${v.destacado ? "fill-primary text-primary" : ""}`} />
                    </button>
                    <button type="button" title="Marcar vendido" disabled={!puede("vehiculos_vender")} onClick={() => toggle.mutate({ v, campo: "vendido" })} className="rounded-lg border p-2 hover:border-primary/50 disabled:opacity-40">
                      <Tag className={`size-3.5 ${v.vendido ? "text-destructive" : ""}`} />
                    </button>
                    <button type="button" title="Editar" disabled={!puede("vehiculos_editar")} onClick={() => setEditando(v)} className="rounded-lg border p-2 hover:border-primary/50 disabled:opacity-40">
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Eliminar"
                      disabled={!puede("vehiculos_eliminar")}
                      onClick={() => {
                        if (confirm(`¿Eliminar ${titulo(v)}? Esta acción no se puede deshacer.`)) borrar.mutate(v);
                      }}
                      className="rounded-lg border p-2 text-destructive hover:border-destructive/50 disabled:opacity-40"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}
    </div>
  );
}