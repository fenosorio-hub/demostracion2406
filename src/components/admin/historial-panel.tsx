import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { History } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { fetchHistorial } from "@/lib/permisos";

const fecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function HistorialPanel() {
  const qc = useQueryClient();
  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["historial"],
    queryFn: () => fetchHistorial(),
  });

  useEffect(() => {
    const canal = supabase
      .channel("historial-actividad")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "historial_actividad" }, () => {
        void qc.invalidateQueries({ queryKey: ["historial"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [qc]);

  return (
    <section>
      <div className="flex items-center gap-2">
        <History className="size-4 text-primary" />
        <h2 className="font-display text-lg font-semibold">Historial de actividad</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Registro de quién hizo cada cambio, sobre qué elemento y cuándo.
      </p>

      <div className="mt-5 overflow-x-auto rounded-2xl border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface-2 text-left text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Elemento</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading && eventos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Todavía no hay actividad registrada.
                </td>
              </tr>
            )}
            {eventos.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="px-4 py-3">
                  <p className="font-medium">{e.nombre || e.email}</p>
                  {e.nombre && <p className="text-xs text-muted-foreground">{e.email}</p>}
                </td>
                <td className="px-4 py-3">
                  {e.accion}
                  {e.detalle && <p className="text-xs text-muted-foreground">{e.detalle}</p>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{e.elemento ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{fecha.format(new Date(e.created_at))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}