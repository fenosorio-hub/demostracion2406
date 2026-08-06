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

export function normalizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

/** Email interno derivado del nombre del empleado (los empleados ingresan por nombre). */
export function emailDeEmpleado(nombre: string): string {
  return `${normalizarNombre(nombre)}@${DOMINIO_EMPLEADOS}`;
}