import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { sincronizarCuenta, type CuentaDTO, type Rol } from "./staff.functions";

export type { CuentaDTO, Rol };

export const ETIQUETA_ROL: Record<Rol, string> = {
  admin: "Administrador",
  empleado: "Empleado",
};

export function useSesion() {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setCargando(false);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, cargando };
}

/** Cuenta del usuario autenticado (perfil + rol), sincronizada en el servidor. */
export function useCuenta() {
  const { session, cargando } = useSesion();
  const userId = session?.user.id;

  const consulta = useQuery({
    queryKey: ["cuenta", userId],
    enabled: Boolean(userId),
    staleTime: 1000 * 60,
    queryFn: () => sincronizarCuenta(),
  });

  return {
    session,
    cuenta: consulta.data ?? null,
    esAdmin: consulta.data?.rol === "admin",
    cargando: cargando || (Boolean(userId) && consulta.isPending),
    error: consulta.error,
  };
}

export async function registrarActividad(accion: string, elemento?: string, detalle?: string) {
  const { error } = await supabase.rpc("registrar_actividad", {
    _accion: accion,
    _elemento: elemento ?? undefined,
    _detalle: detalle ?? undefined,
  });
  if (error) console.error("[historial]", error.message);
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}