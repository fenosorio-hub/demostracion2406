import { Link } from "@tanstack/react-router";
import { Fuel, Gauge, Settings2 } from "lucide-react";
import { kilometros, precio, titulo, type Vehiculo } from "@/lib/vehiculos";
import { useReveal } from "@/hooks/use-reveal";

export function VehiculoCard({ vehiculo, delay = 0 }: { vehiculo: Vehiculo; delay?: number }) {
  const reveal = useReveal<HTMLDivElement>(delay);

  return (
    <div ref={reveal.ref} className={reveal.className}>
      <Link
        to="/vehiculos/$slug"
        params={{ slug: vehiculo.slug }}
        className="group block overflow-hidden rounded-3xl border bg-card transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
          <img
            src={vehiculo.imagen_url ?? "/images/vehiculos/porsche-911.jpg"}
            alt={`${titulo(vehiculo)} en venta`}
            loading="lazy"
            width={1280}
            height={720}
            className="size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
          <div className="absolute left-4 top-4 flex gap-2">
            <span className="rounded-full bg-background/70 px-3 py-1 text-[0.68rem] font-medium backdrop-blur-md">
              {vehiculo.estado}
            </span>
            {vehiculo.destacado && (
              <span className="rounded-full bg-primary px-3 py-1 text-[0.68rem] font-semibold text-primary-foreground">
                Destacado
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {vehiculo.marca} · {vehiculo.anio}
            </p>
            <h3 className="mt-1.5 text-lg font-semibold">
              {vehiculo.modelo}
              {vehiculo.version ? <span className="text-muted-foreground"> {vehiculo.version}</span> : null}
            </h3>
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Gauge className="size-3.5 text-primary" /> {kilometros(vehiculo.km)}
            </li>
            <li className="flex items-center gap-1.5">
              <Fuel className="size-3.5 text-primary" /> {vehiculo.combustible}
            </li>
            <li className="flex items-center gap-1.5">
              <Settings2 className="size-3.5 text-primary" /> {vehiculo.caja}
            </li>
          </ul>

          <div className="flex items-end justify-between border-t pt-4">
            <div>
              <p className="text-[0.68rem] uppercase tracking-widest text-muted-foreground">Precio</p>
              <p className="font-display text-xl font-semibold">{precio(vehiculo.precio)}</p>
            </div>
            <span className="text-sm font-medium text-primary transition-transform duration-300 group-hover:translate-x-1">
              Ver ficha →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}