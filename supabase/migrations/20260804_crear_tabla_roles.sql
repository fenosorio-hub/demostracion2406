-- 1. Crear el tipo de datos enum para los roles (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_rol') THEN
        CREATE TYPE public.app_rol AS ENUM ('super_admin', 'admin', 'empleado');
    END IF;
END $$;

-- 2. Crear la tabla 'user_roles'
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role public.app_rol NOT NULL DEFAULT 'empleado',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Crear Política de Lectura: Cada usuario ve su propio rol, Super Admin ve todos
CREATE POLICY "Permitir lectura de roles"
ON public.user_roles
FOR SELECT
USING (
    auth.uid() = user_id 
    OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

-- 5. Crear Políticas de Modificación: Solo Super Admin puede hacer INSERT/UPDATE/DELETE
CREATE POLICY "Permitir insercion solo a super_admin"
ON public.user_roles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

CREATE POLICY "Permitir actualizacion solo a super_admin"
ON public.user_roles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    )
);

-- 6. Insertar / Asignar el rol 'super_admin' a tu correo
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_rol
FROM auth.users
WHERE email = 'fenosorio@gmail.com'
ON CONFLICT (user_id) DO UPDATE 
SET role = 'super_admin'::public.app_rol;
