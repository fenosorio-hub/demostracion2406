import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "vehiculos";
const EXPIRA = 60 * 60; // 1 hora

/** Rutas internas del bucket (no absolutas ni del /public del sitio). */
export function esRutaStorage(path: string): boolean {
  return !!path && !/^(https?:)?\/\//.test(path) && !path.startsWith("/");
}

export async function firmarUrls(paths: string[]): Promise<Record<string, string>> {
  const internos = [...new Set(paths.filter(esRutaStorage))];
  const mapa: Record<string, string> = {};
  for (const p of paths) if (!esRutaStorage(p)) mapa[p] = p;
  if (!internos.length) return mapa;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(internos, EXPIRA);
  if (error) throw error;
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) mapa[item.path] = item.signedUrl;
  }
  return mapa;
}

/** Resuelve una lista de rutas/URLs a URLs mostrables, preservando el orden. */
export function useImagenes(paths: (string | null | undefined)[]): string[] {
  const limpias = paths.filter((p): p is string => !!p);
  const { data } = useQuery({
    queryKey: ["img-urls", limpias],
    queryFn: () => firmarUrls(limpias),
    enabled: limpias.length > 0,
    staleTime: 1000 * 60 * 45,
  });
  return limpias.map((p) => data?.[p] ?? (esRutaStorage(p) ? "" : p)).filter(Boolean);
}

export async function subirImagen(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}

export async function borrarImagen(path: string): Promise<void> {
  if (!esRutaStorage(path)) return;
  await supabase.storage.from(BUCKET).remove([path]);
}