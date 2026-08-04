import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Vehiculo = Tables<"vehiculos">;
export type VehiculoInput = TablesInsert<"vehiculos">;

export const CAMPOS =
  "id,slug,marca,modelo,version,anio,km,combustible,caja,traccion,potencia_hp,torque_nm,consumo,cilindrada,tipo_motor,estado,garantia,precio,precio_contado,precio_financiado,ubicacion,tipo,color,imagen_url,galeria,equipamiento,destacado,vistas,created_at,descripcion,video_url,vendido,fecha_publicacion,publicado,updated_at";

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

/* ---------- Administración ---------- */

export async function fetchVehiculosAdmin(): Promise<Vehiculo[]> {
  const { data, error } = await supabase
    .from("vehiculos")
    .select(CAMPOS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Vehiculo[];
}

export const vehiculosAdminQuery = () =>
  queryOptions({ queryKey: ["vehiculos-admin"], queryFn: fetchVehiculosAdmin });

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function crearVehiculo(input: VehiculoInput): Promise<Vehiculo> {
  const { data, error } = await supabase.from("vehiculos").insert(input).select(CAMPOS).single();
  if (error) throw error;
  return data as Vehiculo;
}

export async function actualizarVehiculo(id: string, input: Partial<VehiculoInput>): Promise<void> {
  const { error } = await supabase
    .from("vehiculos")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarVehiculo(id: string): Promise<void> {
  const { error } = await supabase.from("vehiculos").delete().eq("id", id);
  if (error) throw error;
}

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