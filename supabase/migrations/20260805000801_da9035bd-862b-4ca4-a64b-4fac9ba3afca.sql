ALTER TABLE public.vehiculos REPLICA IDENTITY FULL;
ALTER TABLE public.perfiles REPLICA IDENTITY FULL;
ALTER TABLE public.permisos_usuario REPLICA IDENTITY FULL;
ALTER TABLE public.historial_actividad REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.vehiculos; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.perfiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.permisos_usuario; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.historial_actividad; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;