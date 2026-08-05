
-- ============ ENUM DE PERMISOS ============
CREATE TYPE public.app_permission AS ENUM (
  'vehiculos_crear','vehiculos_editar','vehiculos_eliminar','vehiculos_vender',
  'precios_editar','estadisticas_editar','promociones_editar','imagenes_editar',
  'videos_editar','textos_editar','contacto_editar','testdrive_gestionar',
  'consultas_gestionar','panel_estadisticas','usuarios_gestionar','acceso_total'
);

CREATE TYPE public.app_rol AS ENUM ('super_admin','admin','empleado');

-- ============ PERFILES ============
CREATE TABLE public.perfiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nombre text,
  rol public.app_rol NOT NULL DEFAULT 'empleado',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX perfiles_email_key ON public.perfiles (lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfiles TO authenticated;
GRANT ALL ON public.perfiles TO service_role;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- ============ PERMISOS ============
CREATE TABLE public.permisos_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permiso public.app_permission NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permiso)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permisos_usuario TO authenticated;
GRANT ALL ON public.permisos_usuario TO service_role;
ALTER TABLE public.permisos_usuario ENABLE ROW LEVEL SECURITY;

-- ============ HISTORIAL ============
CREATE TABLE public.historial_actividad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  nombre text,
  accion text NOT NULL,
  elemento text,
  detalle text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX historial_actividad_created_at_idx ON public.historial_actividad (created_at DESC);
GRANT SELECT, INSERT ON public.historial_actividad TO authenticated;
GRANT ALL ON public.historial_actividad TO service_role;
ALTER TABLE public.historial_actividad ENABLE ROW LEVEL SECURITY;

-- ============ FUNCIONES ============
CREATE OR REPLACE FUNCTION public.es_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = _user_id AND activo = true AND rol = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.tiene_permiso(_user_id uuid, _permiso public.app_permission)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles p
    WHERE p.id = _user_id AND p.activo = true
      AND (
        p.rol = 'super_admin'
        OR EXISTS (
          SELECT 1 FROM public.permisos_usuario pu
          WHERE pu.user_id = _user_id
            AND pu.permiso IN (_permiso, 'acceso_total'::public.app_permission)
        )
      )
  )
$$;

-- Crea/actualiza el perfil del usuario autenticado y designa al Super Admin
CREATE OR REPLACE FUNCTION public.asegurar_perfil()
RETURNS public.perfiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _id uuid := auth.uid();
  _email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  _perfil public.perfiles;
BEGIN
  IF _id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  INSERT INTO public.perfiles (id, email, rol, activo)
  VALUES (
    _id, _email,
    CASE WHEN _email = 'fenosorio@gmail.com' THEN 'super_admin'::public.app_rol ELSE 'empleado'::public.app_rol END,
    CASE WHEN _email = 'fenosorio@gmail.com' THEN true ELSE false END
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now()
  RETURNING * INTO _perfil;

  IF _email = 'fenosorio@gmail.com' AND (_perfil.rol <> 'super_admin' OR _perfil.activo = false) THEN
    UPDATE public.perfiles SET rol = 'super_admin', activo = true, updated_at = now()
    WHERE id = _id RETURNING * INTO _perfil;
  END IF;

  RETURN _perfil;
END;
$$;

-- Registro de actividad
CREATE OR REPLACE FUNCTION public.registrar_actividad(_accion text, _elemento text DEFAULT NULL, _detalle text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.perfiles;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  SELECT * INTO _p FROM public.perfiles WHERE id = auth.uid();
  INSERT INTO public.historial_actividad (user_id, email, nombre, accion, elemento, detalle)
  VALUES (auth.uid(), coalesce(_p.email, auth.jwt() ->> 'email', 'desconocido'), _p.nombre, _accion, _elemento, _detalle);
END;
$$;

-- ============ POLÍTICAS: perfiles ============
CREATE POLICY "Ver propio perfil" ON public.perfiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Gestores ven todos los perfiles" ON public.perfiles
  FOR SELECT TO authenticated USING (public.tiene_permiso(auth.uid(), 'usuarios_gestionar'));
CREATE POLICY "Super admin crea perfiles" ON public.perfiles
  FOR INSERT TO authenticated WITH CHECK (public.es_super_admin(auth.uid()));
CREATE POLICY "Super admin edita perfiles" ON public.perfiles
  FOR UPDATE TO authenticated
  USING (public.es_super_admin(auth.uid())) WITH CHECK (public.es_super_admin(auth.uid()));
CREATE POLICY "Super admin elimina perfiles" ON public.perfiles
  FOR DELETE TO authenticated USING (public.es_super_admin(auth.uid()) AND id <> auth.uid());

-- ============ POLÍTICAS: permisos_usuario ============
CREATE POLICY "Ver propios permisos" ON public.permisos_usuario
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Gestores ven permisos" ON public.permisos_usuario
  FOR SELECT TO authenticated USING (public.tiene_permiso(auth.uid(), 'usuarios_gestionar'));
CREATE POLICY "Super admin otorga permisos" ON public.permisos_usuario
  FOR INSERT TO authenticated WITH CHECK (public.es_super_admin(auth.uid()));
CREATE POLICY "Super admin quita permisos" ON public.permisos_usuario
  FOR DELETE TO authenticated USING (public.es_super_admin(auth.uid()));

-- ============ POLÍTICAS: historial ============
CREATE POLICY "Ver historial con permiso" ON public.historial_actividad
  FOR SELECT TO authenticated
  USING (public.tiene_permiso(auth.uid(), 'usuarios_gestionar') OR public.tiene_permiso(auth.uid(), 'panel_estadisticas'));
CREATE POLICY "Usuarios registran su actividad" ON public.historial_actividad
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============ VEHICULOS: nuevas políticas por permiso ============
DROP POLICY IF EXISTS "Admins pueden crear vehiculos" ON public.vehiculos;
DROP POLICY IF EXISTS "Admins pueden actualizar vehiculos" ON public.vehiculos;
DROP POLICY IF EXISTS "Admins pueden eliminar vehiculos" ON public.vehiculos;
DROP POLICY IF EXISTS "Admins pueden ver todos los vehiculos" ON public.vehiculos;

CREATE POLICY "Staff ve todos los vehiculos" ON public.vehiculos
  FOR SELECT TO authenticated
  USING (
    public.tiene_permiso(auth.uid(), 'vehiculos_editar')
    OR public.tiene_permiso(auth.uid(), 'vehiculos_crear')
    OR public.tiene_permiso(auth.uid(), 'panel_estadisticas')
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Crear vehiculos con permiso" ON public.vehiculos
  FOR INSERT TO authenticated
  WITH CHECK (public.tiene_permiso(auth.uid(), 'vehiculos_crear'));
CREATE POLICY "Editar vehiculos con permiso" ON public.vehiculos
  FOR UPDATE TO authenticated
  USING (public.tiene_permiso(auth.uid(), 'vehiculos_editar') OR public.tiene_permiso(auth.uid(), 'vehiculos_vender'))
  WITH CHECK (public.tiene_permiso(auth.uid(), 'vehiculos_editar') OR public.tiene_permiso(auth.uid(), 'vehiculos_vender'));
CREATE POLICY "Eliminar vehiculos con permiso" ON public.vehiculos
  FOR DELETE TO authenticated
  USING (public.tiene_permiso(auth.uid(), 'vehiculos_eliminar'));

CREATE TRIGGER update_perfiles_updated_at BEFORE UPDATE ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.vehiculos;
