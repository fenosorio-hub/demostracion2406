import { MessageCircle } from "lucide-react";

export function WhatsappFab() {
  return (
    <a
      href="https://wa.me/5491155554820?text=Hola%20Stark%2C%20quiero%20consultar%20por%20un%20veh%C3%ADculo"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-gold transition-transform duration-300 hover:-translate-y-1"
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">Consultar</span>
    </a>
  );
}