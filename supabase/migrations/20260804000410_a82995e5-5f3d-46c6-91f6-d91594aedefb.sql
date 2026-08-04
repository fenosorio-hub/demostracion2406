ALTER TABLE public.vehiculos
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS vendido boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fecha_publicacion timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS vehiculos_publicado_idx ON public.vehiculos (publicado, destacado DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS vehiculos_marca_idx ON public.vehiculos (marca);
CREATE INDEX IF NOT EXISTS vehiculos_fecha_pub_idx ON public.vehiculos (fecha_publicacion DESC);