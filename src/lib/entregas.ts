import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Entrega = Tables<"entregas">;
export type EntregaInput = TablesInsert<"entregas">;

export async function fetchEntregas(): Promise<Entrega[]> {
  const { data, error } = await supabase
    .from("entregas")
    .select("*")
    .order("fecha", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export const entregasQuery = () =>
  queryOptions({ queryKey: ["entregas"], queryFn: fetchEntregas });

export async function crearEntrega(input: EntregaInput) {
  const { error } = await supabase.from("entregas").insert(input);
  if (error) throw error;
}

export async function eliminarEntrega(id: string) {
  const { error } = await supabase.from("entregas").delete().eq("id", id);
  if (error) throw error;
}