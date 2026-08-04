UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'fenosorio@gmail.com'
);
INSERT INTO public.profiles (id, role)
SELECT id, 'admin'
FROM auth.users
WHERE LOWER(email) = 'fenosorio@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET role = 'admin';
