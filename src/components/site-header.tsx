import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/catalogo", label: "Catálogo" },
] as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "glass-panel border-b py-3" : "border-b border-transparent py-5",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" className="group flex flex-col leading-none">
          <span className="font-display text-lg font-semibold tracking-tight sm:text-xl">
            LORENA
          </span>
          <span className="text-[0.6rem] tracking-[0.42em] text-muted-foreground">
            AUTOMOTORES
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Principal">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-primary" }}
              className="relative text-sm text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/catalogo"
            className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-gold md:inline-flex"
          >
            Agendar test drive
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className="rounded-full border border-border p-2.5 text-foreground transition-colors hover:bg-accent md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="glass-panel mx-5 mt-3 rounded-2xl p-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Móvil">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/catalogo"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
            >
              Agendar test drive
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}