-- 1. Dar acceso de lectura al propio usuario
CREATE POLICY "Permitir ver propio perfil"
ON public.perfiles FOR SELECT
USING (auth.uid() = id);

-- 2. Asegurar que el usuario sea Super Admin y esté activo
UPDATE public.perfiles
SET rol = 'super_admin'::public.app_rol, activo = true
WHERE email = 'fenosorio@gmail.com';
