import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

async function exigirSuperAdmin(context: Ctx) {
  const { data, error } = await context.supabase
    .from("perfiles")
    .select("rol,activo,email")
    .eq("id", context.userId)
    .maybeSingle();
  if (error || !data || data.rol !== "super_admin" || !data.activo) {
    throw new Error("Solo el Super Admin puede realizar esta acción");
  }
  return data as { rol: string; activo: boolean; email: string };
}

function claveTemporal() {
  return `SA-${Math.random().toString(36).slice(2, 8)}${Math.random().toString(36).slice(2, 6).toUpperCase()}!`;
}

/** Invita/crea un usuario por email y le asigna rol + permisos iniciales. */
export const crearUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; nombre?: string; rol: "admin" | "empleado"; permisos: string[] }) => input)
  .handler(async ({ data, context }) => {
    const admin = await exigirSuperAdmin(context as Ctx);
    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email inválido");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password = claveTemporal();

    const { data: creado, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: data.nombre ? { nombre: data.nombre } : {},
    });
    if (error || !creado.user) throw new Error(error?.message ?? "No se pudo crear el usuario");

    const uid = creado.user.id;
    await supabaseAdmin.from("perfiles").upsert({
      id: uid,
      email,
      nombre: data.nombre ?? null,
      rol: data.rol,
      activo: true,
    });
    if (data.permisos.length) {
      await supabaseAdmin
        .from("permisos_usuario")
        .upsert(data.permisos.map((p) => ({ user_id: uid, permiso: p as never })), {
          onConflict: "user_id,permiso",
        });
    }
    await supabaseAdmin.from("historial_actividad").insert({
      user_id: context.userId,
      email: admin.email,
      accion: "Creó un usuario",
      elemento: email,
      detalle: `Rol: ${data.rol}`,
    });

    return { id: uid, email, password };
  });

export const eliminarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const admin = await exigirSuperAdmin(context as Ctx);
    if (data.userId === context.userId) throw new Error("No podés eliminar tu propia cuenta");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: perfil } = await supabaseAdmin
      .from("perfiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("historial_actividad").insert({
      user_id: context.userId,
      email: admin.email,
      accion: "Eliminó un usuario",
      elemento: perfil?.email ?? data.userId,
    });
    return { ok: true };
  });

export const restablecerPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const admin = await exigirSuperAdmin(context as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password = claveTemporal();
    const { data: actualizado, error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("historial_actividad").insert({
      user_id: context.userId,
      email: admin.email,
      accion: "Restableció una contraseña",
      elemento: actualizado.user?.email ?? data.userId,
    });
    return { password };
  });