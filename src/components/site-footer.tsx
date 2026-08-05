import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-xl font-semibold">STARK</p>
          <p className="text-[0.6rem] tracking-[0.42em] text-muted-foreground">AUTOMOTORES</p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Vehículos premium seleccionados uno por uno. Peritaje certificado, garantía escrita y
            asesoramiento personalizado desde 1998.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Navegación</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="transition-colors hover:text-primary">
                Inicio
              </Link>
            </li>
            <li>
              <Link to="/catalogo" className="transition-colors hover:text-primary">
                Catálogo
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Contacto</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              Av. del Libertador 4820, Palermo, CABA
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-primary" />
              +54 11 5555-4820
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 shrink-0 text-primary" />
              ventas@lorenzana.com.ar
            </li>
            <li className="flex items-center gap-2.5">
              <Clock className="size-4 shrink-0 text-primary" />
              Lun a Sáb · 9 a 19 h
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} Stark Automotores. Todos los derechos reservados.</p>
          <p>Precios expresados en USD. Fotos ilustrativas.</p>
        </div>
      </div>
    </footer>
  );
}