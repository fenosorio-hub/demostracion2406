export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function exigirAdmin(userId: string) {
  const db = await admin();
  const { data } = await db.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Solo un administrador puede realizar esta acción");
  const { data: perfil } = await db.from("perfiles").select("email,nombre").eq("id", userId).maybeSingle();
  return { db, email: perfil?.email ?? "", nombre: perfil?.nombre ?? "" };
}

export async function registrar(
  db: Awaited<ReturnType<typeof admin>>,
  actor: { id: string; email: string; nombre: string },
  accion: string,
  elemento?: string,
) {
  await db.from("historial_actividad").insert({
    user_id: actor.id,
    email: actor.email,
    nombre: actor.nombre,
    accion,
    elemento: elemento ?? null,
  });
}