import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";

export type Perfil = Tables<"perfiles">;
export type Permiso = Enums<"app_permission">;
export type Rol = Enums<"app_rol">;
export type Actividad = Tables<"historial_actividad">;

export const SUPER_ADMIN_EMAIL = "fenosorio@gmail.com";

export const GRUPOS_PERMISOS: { grupo: string; permisos: { id: Permiso; label: string }[] }[] = [
  {
    grupo: "Vehículos",
    permisos: [
      { id: "vehiculos_crear", label: "Agregar vehículos" },
      { id: "vehiculos_editar", label: "Editar vehículos" },
      { id: "vehiculos_eliminar", label: "Eliminar vehículos" },
      { id: "vehiculos_vender", label: "Marcar como vendidos" },
      { id: "precios_editar", label: "Modificar precios" },
    ],
  },
  {
    grupo: "Contenido",
    permisos: [
      { id: "imagenes_editar", label: "Editar imágenes" },
      { id: "videos_editar", label: "Editar videos" },
      { id: "textos_editar", label: "Editar textos de la web" },
      { id: "promociones_editar", label: "Modificar promociones" },
      { id: "contacto_editar", label: "Editar información de contacto" },
      { id: "estadisticas_editar", label: "Editar estadísticas (entregas, rating, peritaje)" },
    ],
  },
  {
    grupo: "Clientes",
    permisos: [
      { id: "testdrive_gestionar", label: "Administrar solicitudes de Test Drive" },
      { id: "consultas_gestionar", label: "Administrar consultas de clientes" },
    ],
  },
  {
    grupo: "Sistema",
    permisos: [
      { id: "panel_estadisticas", label: "Ver el panel de estadísticas" },
      { id: "usuarios_gestionar", label: "Gestionar usuarios" },
      { id: "acceso_total", label: "Acceso total" },
    ],
  },
];

export const TODOS_LOS_PERMISOS: Permiso[] = GRUPOS_PERMISOS.flatMap((g) =>
  g.permisos.map((p) => p.id),
);

export const etiquetaPermiso = (p: Permiso) =>
  GRUPOS_PERMISOS.flatMap((g) => g.permisos).find((x) => x.id === p)?.label ?? p;

export const ETIQUETA_ROL: Record<Rol, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  empleado: "Empleado",
};

/* ---------- Sesión / perfil actual ---------- */

export async function asegurarPerfil(): Promise<Perfil | null> {
  const { data, error } = await supabase.rpc("asegurar_perfil");
  if (error) throw error;
  return (data as unknown as Perfil) ?? null;
}

export async function fetchMisPermisos(userId: string): Promise<Permiso[]> {
  const { data, error } = await supabase
    .from("permisos_usuario")
    .select("permiso")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.permiso);
}

export type Cuenta = {
  perfil: Perfil;
  permisos: Permiso[];
  esSuperAdmin: boolean;
  puede: (p: Permiso) => boolean;
  algunPermiso: boolean;
};

export function useCuenta(userId: string | undefined) {
  return useQuery<Cuenta | null>({
    queryKey: ["cuenta", userId],
    enabled: !!userId,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const perfil = await asegurarPerfil();
      if (!perfil) return null;
      const permisos = await fetchMisPermisos(perfil.id);
      const esSuperAdmin = perfil.rol === "super_admin" && perfil.activo;
      const puede = (p: Permiso) =>
        perfil.activo && (esSuperAdmin || permisos.includes("acceso_total") || permisos.includes(p));
      return { perfil, permisos, esSuperAdmin, puede, algunPermiso: esSuperAdmin || permisos.length > 0 };
    },
  });
}

/* ---------- Historial ---------- */

export async function registrarActividad(accion: string, elemento?: string, detalle?: string) {
  const { error } = await supabase.rpc("registrar_actividad", {
    _accion: accion,
    _elemento: elemento ?? null,
    _detalle: detalle ?? null,
  });
  if (error) console.error("No se pudo registrar la actividad", error);
}

export async function fetchHistorial(limite = 200): Promise<Actividad[]> {
  const { data, error } = await supabase
    .from("historial_actividad")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data ?? [];
}

/* ---------- Gestión de usuarios ---------- */

export type UsuarioGestion = Perfil & { permisos: Permiso[] };

export async function fetchUsuarios(): Promise<UsuarioGestion[]> {
  const [{ data: perfiles, error: e1 }, { data: permisos, error: e2 }] = await Promise.all([
    supabase.from("perfiles").select("*").order("created_at", { ascending: true }),
    supabase.from("permisos_usuario").select("user_id,permiso"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return (perfiles ?? []).map((p) => ({
    ...p,
    permisos: (permisos ?? []).filter((x) => x.user_id === p.id).map((x) => x.permiso),
  }));
}

export async function otorgarPermiso(userId: string, permiso: Permiso) {
  const { error } = await supabase.from("permisos_usuario").insert({ user_id: userId, permiso });
  if (error) throw error;
}

export async function quitarPermiso(userId: string, permiso: Permiso) {
  const { error } = await supabase
    .from("permisos_usuario")
    .delete()
    .eq("user_id", userId)
    .eq("permiso", permiso);
  if (error) throw error;
}

export async function actualizarPerfil(
  userId: string,
  cambios: Partial<Pick<Perfil, "rol" | "activo" | "nombre">>,
) {
  const { error } = await supabase.from("perfiles").update(cambios).eq("id", userId);
  if (error) throw error;
}