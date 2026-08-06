import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Suscribe una tabla a Realtime e invalida las queries indicadas ante cualquier cambio. */
export function useRealtime(tabla: "vehiculos" | "entregas", claves: string[][]) {
  const qc = useQueryClient();
  const firma = JSON.stringify(claves);

  useEffect(() => {
    const canal = supabase
      .channel(`rt-${tabla}`)
      .on("postgres_changes", { event: "*", schema: "public", table: tabla }, () => {
        for (const key of JSON.parse(firma) as string[][]) {
          void qc.invalidateQueries({ queryKey: key });
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [tabla, firma, qc]);
}