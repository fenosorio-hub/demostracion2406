
REVOKE ALL ON FUNCTION public.es_super_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tiene_permiso(uuid, public.app_permission) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.asegurar_perfil() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.registrar_actividad(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.asegurar_perfil() TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_actividad(text, text, text) TO authenticated;
