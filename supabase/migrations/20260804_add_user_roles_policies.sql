-- 1. Asegurar que RLS esté activo en la tabla de roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Permitir que los usuarios vean sus propios roles y que el Super Admin vea todos
CREATE POLICY "Permitir lectura de roles" 
ON public.user_roles 
FOR SELECT 
USING (
  auth.uid() = user_id OR es_super_admin(auth.uid())
);

-- 3. Permitir solo al Super Admin INSERTAR nuevos roles
CREATE POLICY "Permitir INSERT solo a super admin" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  es_super_admin(auth.uid())
);

-- 4. Permitir solo al Super Admin ACTUALIZAR roles
CREATE POLICY "Permitir UPDATE solo a super admin" 
ON public.user_roles 
FOR UPDATE 
USING (
  es_super_admin(auth.uid())
)
WITH CHECK (
  es_super_admin(auth.uid())
);

-- 5. Permitir solo al Super Admin ELIMINAR roles
CREATE POLICY "Permitir DELETE solo a super admin" 
ON public.user_roles 
FOR DELETE 
USING (
  es_super_admin(auth.uid())
);
