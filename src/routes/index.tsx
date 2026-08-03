import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Award, ChevronRight, ShieldCheck, Sparkles, Wrench } from "lucide-react";

import heroImg from "@/assets/hero-showroom.jpg";
import { VehiculoCard } from "@/components/vehiculo-card";
import { useReveal } from "@/hooks/use-reveal";
import { vehiculosQuery } from "@/lib/vehiculos";

const TITULO = "Lorenzana Automotores | Vehículos premium seleccionados";
const DESC =
  "Concesionaria premium en Buenos Aires: SUV, coupés, sedanes y pickups certificados con garantía escrita, financiación a medida y test drive sin cargo.";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(vehiculosQuery()),
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESC },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Index,
});

function Hero() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setTilt({
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      });
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] items-end overflow-hidden"
      aria-label="Presentación"
    >
      <img
        src={heroImg}
        alt="Coupé deportivo gris en el showroom de Lorenzana Automotores"
        width={1920}
        height={1088}
        fetchPriority="high"
        className="absolute inset-0 size-full scale-110 object-cover transition-transform duration-[1200ms] ease-out"
        style={{ transform: `scale(1.08) translate3d(${tilt.x * -22}px, ${tilt.y * -14}px, 0)` }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-fade)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at ${(tilt.x + 0.5) * 100}% ${(tilt.y + 0.5) * 100}%, oklch(0.82 0.13 84 / 16%), transparent 65%)`,
        }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-32 sm:px-8 sm:pb-28">
        <span className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs tracking-widest text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" /> DESDE 1998 EN BUENOS AIRES
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
          Manejá el auto que <span className="text-gold-gradient">merecés</span>.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Selección curada de vehículos premium con peritaje de 180 puntos, garantía escrita y
          entrega inmediata. Reservá tu test drive y sentí la diferencia.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/catalogo"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-gold"
          >
            Ver catálogo <ChevronRight className="size-4" />
          </Link>
          <a
            href="https://wa.me/5491155554820?text=Quiero%20agendar%20un%20test%20drive"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50"
          >
            Agendar test drive
          </a>
        </div>

        <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t pt-8">
          {[
            ["+2.400", "Entregas realizadas"],
            ["180", "Puntos de peritaje"],
            ["4,9/5", "Calificación de clientes"],
          ].map(([valor, label]) => (
            <div key={label}>
              <dt className="font-display text-2xl font-semibold sm:text-3xl">{valor}</dt>
              <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const PILARES = [
  {
    icon: ShieldCheck,
    titulo: "Peritaje certificado",
    texto: "Cada unidad pasa 180 controles mecánicos, de chasis y documentación antes de publicarse.",
  },
  {
    icon: Award,
    titulo: "Garantía escrita",
    texto: "Hasta 24 meses de cobertura real de motor y caja, respaldada por talleres oficiales.",
  },
  {
    icon: Wrench,
    titulo: "Postventa propia",
    texto: "Service, detailing y gestoría integral en nuestro taller de Palermo.",
  },
];

function Pilares() {
  const reveal = useReveal<HTMLDivElement>();
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <div ref={reveal.ref} className={`grid gap-6 md:grid-cols-3 ${reveal.className}`}>
        {PILARES.map(({ icon: Icon, titulo, texto }) => (
          <article
            key={titulo}
            className="rounded-3xl border bg-card p-8 transition-all duration-500 hover:-translate-y-1 hover:border-primary/40"
          >
            <Icon className="size-6 text-primary" />
            <h3 className="mt-5 text-lg font-semibold">{titulo}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{texto}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Destacados() {
  const { data } = useSuspenseQuery(vehiculosQuery());
  const destacados = data.filter((v) => v.destacado).slice(0, 3);
  const lista = destacados.length ? destacados : data.slice(0, 3);

  return (
    <section className="border-y bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-primary">Selección del mes</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Vehículos destacados</h2>
          </div>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-transform duration-300 hover:translate-x-1"
          >
            Ver todo el catálogo <ChevronRight className="size-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((v, i) => (
            <VehiculoCard key={v.id} vehiculo={v} delay={i * 90} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaFinal() {
  const reveal = useReveal<HTMLDivElement>();
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
      <div
        ref={reveal.ref}
        className={`glass-panel overflow-hidden rounded-[2rem] px-8 py-16 text-center shadow-elevated sm:px-16 ${reveal.className}`}
      >
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold sm:text-4xl">
          Tu próximo auto te está esperando en Palermo
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Coordiná una visita privada, traé tu usado como parte de pago y armá tu financiación en el
          día.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/catalogo"
            className="rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-gold"
          >
            Explorar catálogo
          </Link>
          <a
            href="tel:+541155554820"
            className="rounded-full border px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50"
          >
            Llamar al +54 11 5555-4820
          </a>
        </div>
      </div>
    </section>
  );
}

function Index() {
  return (
    <>
      <Hero />
      <Pilares />
      <Destacados />
      <CtaFinal />
    </>
  );
}
