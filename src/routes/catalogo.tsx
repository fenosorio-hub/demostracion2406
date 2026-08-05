import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { VehiculoCard } from "@/components/vehiculo-card";
import { vehiculosQuery, titulo } from "@/lib/vehiculos";

const TITULO = "Catálogo de vehículos | Stark Automotores";
const DESC =
  "Buscá entre SUV, pickups, sedanes, coupés y eléctricos premium con filtros por marca, tipo, combustible, caja y precio. Unidades certificadas con garantía.";

export const Route = createFileRoute("/catalogo")({
  loader: ({ context }) => context.queryClient.ensureQueryData(vehiculosQuery()),
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESC },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Catalogo,
});

const TODOS = "Todos";

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border bg-surface-2 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-primary"
      >
        {[TODOS, ...options].map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Catalogo() {
  const { data } = useSuspenseQuery(vehiculosQuery());
  const [q, setQ] = useState("");
  const [marca, setMarca] = useState(TODOS);
  const [tipo, setTipo] = useState(TODOS);
  const [combustible, setCombustible] = useState(TODOS);
  const [caja, setCaja] = useState(TODOS);
  const [estado, setEstado] = useState(TODOS);
  const [orden, setOrden] = useState("recientes");
  const [maxPrecio, setMaxPrecio] = useState(0);

  const unicos = (fn: (v: (typeof data)[number]) => string) =>
    Array.from(new Set(data.map(fn))).sort();

  const techo = useMemo(
    () => Math.ceil(Math.max(...data.map((v) => Number(v.precio)), 0) / 1000) * 1000,
    [data],
  );
  const limite = maxPrecio || techo;

  const resultados = useMemo(() => {
    const texto = q.trim().toLowerCase();
    const lista = data.filter((v) => {
      if (texto && !titulo(v).toLowerCase().includes(texto)) return false;
      if (marca !== TODOS && v.marca !== marca) return false;
      if (tipo !== TODOS && v.tipo !== tipo) return false;
      if (combustible !== TODOS && v.combustible !== combustible) return false;
      if (caja !== TODOS && v.caja !== caja) return false;
      if (estado !== TODOS && v.estado !== estado) return false;
      if (Number(v.precio) > limite) return false;
      return true;
    });

    const ordenada = [...lista];
    if (orden === "precio-asc") ordenada.sort((a, b) => Number(a.precio) - Number(b.precio));
    if (orden === "precio-desc") ordenada.sort((a, b) => Number(b.precio) - Number(a.precio));
    if (orden === "km") ordenada.sort((a, b) => a.km - b.km);
    if (orden === "anio") ordenada.sort((a, b) => b.anio - a.anio);
    return ordenada;
  }, [data, q, marca, tipo, combustible, caja, estado, limite, orden]);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.32em] text-primary">Catálogo</p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Unidades disponibles</h1>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {data.length} vehículos certificados listos para entrega. Filtrá por marca, tipo, motor o
          presupuesto y reservá tu test drive en minutos.
        </p>
      </header>

      <section className="glass-panel mt-10 rounded-3xl p-6" aria-label="Buscador avanzado">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Buscar por marca, modelo o versión…"
            aria-label="Buscar vehículos"
            className="w-full rounded-2xl border bg-surface-2 py-3.5 pl-11 pr-4 text-sm outline-none transition-colors focus-visible:border-primary"
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Marca" value={marca} options={unicos((v) => v.marca)} onChange={setMarca} />
          <Select label="Tipo" value={tipo} options={unicos((v) => v.tipo)} onChange={setTipo} />
          <Select
            label="Combustible"
            value={combustible}
            options={unicos((v) => v.combustible)}
            onChange={setCombustible}
          />
          <Select label="Caja" value={caja} options={unicos((v) => v.caja)} onChange={setCaja} />
          <Select
            label="Estado"
            value={estado}
            options={unicos((v) => v.estado)}
            onChange={setEstado}
          />
          <label className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:col-span-2">
            Precio hasta USD {new Intl.NumberFormat("es-AR").format(limite)}
            <input
              type="range"
              min={10000}
              max={techo}
              step={1000}
              value={limite}
              onChange={(e) => setMaxPrecio(Number(e.target.value))}
              className="mt-3 w-full accent-[oklch(0.82_0.13_84)]"
              aria-label="Precio máximo"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            Ordenar por
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="rounded-xl border bg-surface-2 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-primary"
            >
              <option value="recientes">Más recientes</option>
              <option value="precio-asc">Menor precio</option>
              <option value="precio-desc">Mayor precio</option>
              <option value="km">Menos kilómetros</option>
              <option value="anio">Año más nuevo</option>
            </select>
          </label>
        </div>
      </section>

      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <SlidersHorizontal className="size-4 text-primary" />
        {resultados.length} resultado{resultados.length === 1 ? "" : "s"}
      </div>

      {resultados.length === 0 ? (
        <p className="mt-12 rounded-3xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No encontramos vehículos con esos filtros. Probá ampliando el presupuesto o escribinos por
          WhatsApp y lo buscamos por vos.
        </p>
      ) : (
        <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((v, i) => (
            <VehiculoCard key={v.id} vehiculo={v} delay={Math.min(i, 5) * 70} />
          ))}
        </div>
      )}
    </div>
  );
}