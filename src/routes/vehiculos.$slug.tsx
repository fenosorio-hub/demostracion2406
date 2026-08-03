import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Check, MapPin, ShieldCheck } from "lucide-react";

import { kilometros, precio, titulo, vehiculoQuery } from "@/lib/vehiculos";

export const Route = createFileRoute("/vehiculos/$slug")({
  loader: async ({ context, params }) => {
    const vehiculo = await context.queryClient.ensureQueryData(vehiculoQuery(params.slug));
    if (!vehiculo) throw notFound();
    return vehiculo;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Vehículo no disponible" }, { name: "robots", content: "noindex" }],
      };
    }
    const nombre = `${titulo(loaderData)} ${loaderData.anio}`;
    const desc = `${nombre} — ${kilometros(loaderData.km)}, ${loaderData.combustible}, ${loaderData.caja}. ${precio(loaderData.precio)} en Lorena Automotores.`;
    return {
      meta: [
        { title: `${nombre} | Lorena Automotores` },
        { name: "description", content: desc },
        { property: "og:title", content: `${nombre} | Lorena Automotores` },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: Ficha,
  notFoundComponent: NoEncontrado,
});

function NoEncontrado() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-40 text-center">
      <h1 className="text-3xl font-semibold">Vehículo no disponible</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Puede que se haya vendido. Mirá el resto del catálogo, seguro encontrás algo mejor.
      </p>
      <Link
        to="/catalogo"
        className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        Ver catálogo
      </Link>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string | number | null }) {
  if (valor == null || valor === "") return null;
  return (
    <div className="border-b py-3.5">
      <dt className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{valor}</dd>
    </div>
  );
}

function Ficha() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(vehiculoQuery(slug));
  const [zoom, setZoom] = useState(false);
  if (!data) return <NoEncontrado />;

  const v = data;
  const galeria = v.galeria.length ? v.galeria : [v.imagen_url ?? ""];

  return (
    <article className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8 sm:pt-36">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Volver al catálogo
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <button
            type="button"
            onClick={() => setZoom((z) => !z)}
            aria-label={zoom ? "Reducir imagen" : "Ampliar imagen"}
            className="block w-full overflow-hidden rounded-3xl border bg-surface-2 shadow-elevated"
          >
            <img
              src={galeria[0]}
              alt={`${titulo(v)} ${v.anio} — vista principal`}
              width={1280}
              height={720}
              className={`aspect-[16/10] w-full object-cover transition-transform duration-700 ${zoom ? "scale-150" : "scale-100"}`}
            />
          </button>

          <dl className="mt-10 grid gap-x-10 sm:grid-cols-2">
            <Dato label="Marca" valor={v.marca} />
            <Dato label="Modelo" valor={`${v.modelo}${v.version ? ` ${v.version}` : ""}`} />
            <Dato label="Año" valor={v.anio} />
            <Dato label="Kilómetros" valor={kilometros(v.km)} />
            <Dato label="Combustible" valor={v.combustible} />
            <Dato label="Caja" valor={v.caja} />
            <Dato label="Tracción" valor={v.traccion} />
            <Dato label="Potencia" valor={v.potencia_hp ? `${v.potencia_hp} CV` : null} />
            <Dato label="Torque" valor={v.torque_nm ? `${v.torque_nm} Nm` : null} />
            <Dato label="Consumo" valor={v.consumo} />
            <Dato label="Cilindrada" valor={v.cilindrada} />
            <Dato label="Tipo de motor" valor={v.tipo_motor} />
            <Dato label="Carrocería" valor={v.tipo} />
            <Dato label="Color" valor={v.color} />
            <Dato label="Estado" valor={v.estado} />
            <Dato label="Garantía" valor={v.garantia} />
          </dl>

          <section className="mt-12">
            <h2 className="text-xl font-semibold">Equipamiento</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {v.equipamiento.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="glass-panel rounded-3xl p-7 shadow-elevated">
            <p className="text-xs uppercase tracking-[0.28em] text-primary">
              {v.estado} · {v.anio}
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">{titulo(v)}</h1>

            <p className="mt-6 font-display text-4xl font-semibold">{precio(v.precio)}</p>
            <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <p>Contado: {precio(v.precio_contado)}</p>
              <p>Financiado: {precio(v.precio_financiado)}</p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary" /> {v.ubicacion}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" /> {v.garantia ?? "Consultar garantía"}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <a
                href={`https://wa.me/5491155554820?text=${encodeURIComponent(`Hola, quiero agendar un test drive del ${titulo(v)} ${v.anio}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-primary px-6 py-3.5 text-center text-sm font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-gold"
              >
                Agendar test drive
              </a>
              <a
                href={`mailto:ventas@lorenzana.com.ar?subject=${encodeURIComponent(`Consulta ${titulo(v)}`)}`}
                className="rounded-full border px-6 py-3.5 text-center text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50"
              >
                Solicitar cotización
              </a>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}