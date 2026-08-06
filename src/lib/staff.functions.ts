import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const EMAIL_ADMIN = "fenosorio@gmail.com";
export const DOMINIO_EMPLEADOS = "stark.local";

export type Rol = "admin" | "empleado";

export type CuentaDTO = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
};

export type EmpleadoDTO = CuentaDTO & { created_at: string };

function normalizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

export function emailDeEmpleado(nombre: string): string {
  return `${normalizarNombre(nombre)}@${DOMINIO_EMPLEADOS}`;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Sincroniza perfil + rol del usuario autenticado y devuelve su cuenta. */
export const sincronizarCuenta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CuentaDTO> => {
    const db = await admin();
    const userId = context.userId;
    const claims = context.claims as Record<string, unknown>;
    const email = String(claims["email"] ?? "").toLowerCase();
    const meta = (claims["user_metadata"] ?? {}) as Record<string, unknown>;
    const nombre = String(meta["nombre"] ?? "").trim() || email.split("@")[0] || "Usuario";

    await db.from("perfiles").upsert({ id: userId, email, nombre }, { onConflict: "id" });

    const esAdminFijo = email === EMAIL_ADMIN;
    const { data: rolActual } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    let rol: Rol = (rolActual?.role as Rol | undefined) ?? "empleado";
    if (esAdminFijo) rol = "admin";
    if (!rolActual || rolActual.role !== rol) {
      await db.from("user_roles").upsert({ user_id: userId, role: rol }, { onConflict: "user_id" });
    }

    return { id: userId, email, nombre, rol };
  });

async function exigirAdmin(userId: string) {
  const db = await admin();
  const { data } = await db.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (data?.role !== "admin") throw new Error("Solo un administrador puede realizar esta acción");
  const { data: perfil } = await db.from("perfiles").select("email,nombre").eq("id", userId).maybeSingle();
  return { db, email: perfil?.email ?? "", nombre: perfil?.nombre ?? "" };
}

async function registrar(
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

export const listarEmpleados = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmpleadoDTO[]> => {
    const { db } = await exigirAdmin(context.userId);
    const { data: perfiles, error } = await db
      .from("perfiles")
      .select("id,email,nombre,created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const { data: roles } = await db.from("user_roles").select("user_id,role");
    const mapa = new Map((roles ?? []).map((r) => [r.user_id, r.role as Rol]));
    return (perfiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      nombre: p.nombre,
      created_at: p.created_at,
      rol: mapa.get(p.id) ?? "empleado",
    }));
  });

export const crearEmpleado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { nombre: string; password: string }) => input)
  .handler(async ({ data, context }): Promise<EmpleadoDTO> => {
    const { db, email: emailActor, nombre: nombreActor } = await exigirAdmin(context.userId);
    const nombre = data.nombre.trim();
    if (nombre.length < 2) throw new Error("El nombre es obligatorio");
    if (data.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
    const email = emailDeEmpleado(nombre);
    if (email.startsWith("@")) throw new Error("El nombre no es válido");

    const { data: creado, error } = await db.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { nombre },
    });
    if (error || !creado.user) throw new Error(error?.message ?? "No se pudo crear el empleado");

    const uid = creado.user.id;
    await db.from("perfiles").upsert({ id: uid, email, nombre }, { onConflict: "id" });
    await db.from("user_roles").upsert({ user_id: uid, role: "empleado" }, { onConflict: "user_id" });
    await registrar(db, { id: context.userId, email: emailActor, nombre: nombreActor }, "Creó un empleado", nombre);

    return { id: uid, email, nombre, rol: "empleado", created_at: new Date().toISOString() };
  });

export const cambiarClaveEmpleado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; password: string }) => input)
  .handler(async ({ data, context }) => {
    const { db, email, nombre } = await exigirAdmin(context.userId);
    if (data.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
    const { error } = await db.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(error.message);
    const { data: perfil } = await db.from("perfiles").select("nombre").eq("id", data.userId).maybeSingle();
    await registrar(db, { id: context.userId, email, nombre }, "Restableció una contraseña", perfil?.nombre ?? data.userId);
    return { ok: true };
  });

export const eliminarEmpleado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const { db, email, nombre } = await exigirAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("No podés eliminar tu propia cuenta");
    const { data: perfil } = await db.from("perfiles").select("nombre,email").eq("id", data.userId).maybeSingle();
    if (perfil?.email === EMAIL_ADMIN) throw new Error("La cuenta de administrador principal no se puede eliminar");
    const { error } = await db.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await db.from("perfiles").delete().eq("id", data.userId);
    await registrar(db, { id: context.userId, email, nombre }, "Eliminó un empleado", perfil?.nombre ?? data.userId);
    return { ok: true };
  });

/** Crea la cuenta de administrador principal si todavía no existe. Idempotente. */
export const asegurarAdminPorDefecto = createServerFn({ method: "POST" }).handler(async () => {
  const db = await admin();
  const { data: lista } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existente = lista?.users.find((u) => u.email?.toLowerCase() === EMAIL_ADMIN);
  if (existente) return { creado: false };

  const { data: creado, error } = await db.auth.admin.createUser({
    email: EMAIL_ADMIN,
    password: "Cufa2406",
    email_confirm: true,
    user_metadata: { nombre: "Administrador" },
  });
  if (error || !creado.user) return { creado: false };

  await db.from("perfiles").upsert(
    { id: creado.user.id, email: EMAIL_ADMIN, nombre: "Administrador" },
    { onConflict: "id" },
  );
  await db.from("user_roles").upsert(
    { user_id: creado.user.id, role: "admin" },
    { onConflict: "user_id" },
  );
  return { creado: true };
});