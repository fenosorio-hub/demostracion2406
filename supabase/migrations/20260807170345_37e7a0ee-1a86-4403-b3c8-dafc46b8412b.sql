-- 1) es_staff: solo roles autorizados
create or replace function public.es_staff(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('admin','empleado')
  )
$$;

-- 2) entregas: quitar acceso anónimo
drop policy if exists "Entregas visibles" on public.entregas;
create policy "Staff ve entregas" on public.entregas
  for select to authenticated
  using (public.es_staff(auth.uid()));
revoke all on public.entregas from anon;

-- 3) historial_actividad: nadie inserta directo
drop policy if exists "Nadie inserta directo" on public.historial_actividad;
revoke insert, update, delete on public.historial_actividad from authenticated, anon;

-- 4) funciones security definer no ejecutables por clientes
revoke all on function public.es_admin(uuid) from public, anon, authenticated;
revoke all on function public.es_staff(uuid) from public, anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke all on function public.registrar_actividad(text, text, text) from public, anon, authenticated;
