-- Le asigna el rol de admin al usuario en la tabla de perfiles (si usas esa tabla)
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'FENOSORIO@gmail.com'
);