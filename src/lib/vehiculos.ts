import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Vehiculo = Tables<"vehiculos">;

export const CAMPOS =
  "id,slug,marca,modelo,version,anio,km,combustible,caja,traccion,potencia_hp,torque_nm,consumo,cilindrada,tipo_motor,estado,garantia,precio,precio_contado,precio_financiado,ubicacion,tipo,color,imagen_url,galeria,equipamiento,destacado,vistas,created_at";

export async function fetchVehiculos(): Promise<Vehiculo[]> {
  const { data, error } = await supabase
    .from("vehiculos")
    .select(CAMPOS)
    .eq("publicado", true)
    .order("destacado", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Vehiculo[];
}

export async function fetchVehiculo(slug: string): Promise<Vehiculo | null> {
  const { data, error } = await supabase
    .from("vehiculos")
    .select(CAMPOS)
    .eq("slug", slug)
    .eq("publicado", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Vehiculo | null;
}

export const vehiculosQuery = () =>
  queryOptions({ queryKey: ["vehiculos"], queryFn: fetchVehiculos });

export const vehiculoQuery = (slug: string) =>
  queryOptions({ queryKey: ["vehiculo", slug], queryFn: () => fetchVehiculo(slug) });

const formatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const precio = (valor: number | null) =>
  valor == null ? "Consultar" : formatter.format(Number(valor));

export const kilometros = (valor: number) =>
  valor === 0 ? "0 km" : `${new Intl.NumberFormat("es-AR").format(valor)} km`;

export const titulo = (v: Vehiculo) =>
  `${v.marca} ${v.modelo}${v.version ? ` ${v.version}` : ""}`;