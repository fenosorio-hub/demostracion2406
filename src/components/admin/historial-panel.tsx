import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function fetchHistorial() {
  const { data, error } = await supabase
    .from("historial_actividad")
    .select("id,email,nombre,accion,elemento,detalle,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export function HistorialPanel() {
  const { data = [], isLoading } = useQuery({ queryKey: ["historial"], queryFn: fetchHistorial });

  return (
    <div className="animate-fade-in overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-surface-2 text-left text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Usuario</th>
            <th className="px-4 py-3">Acción</th>
            <th className="px-4 py-3">Elemento</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Cargando…</td></tr>
          )}
          {!isLoading && data.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Sin actividad registrada.</td></tr>
          )}
          {data.map((h) => (
            <tr key={h.id} className="border-t transition-colors hover:bg-surface-2/60">
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(h.created_at).toLocaleString("es-AR")}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium">{h.nombre ?? h.email}</p>
                <p className="text-xs text-muted-foreground">{h.email}</p>
              </td>
              <td className="px-4 py-3">{h.accion}</td>
              <td className="px-4 py-3 text-muted-foreground">{h.elemento ?? h.detalle ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}