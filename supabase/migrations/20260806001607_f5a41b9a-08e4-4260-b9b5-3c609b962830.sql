-- ============ FASE 1: LIMPIEZA ============
drop table if exists public.historial_actividad cascade;
drop table if exists public.permisos_usuario cascade;
drop table if exists public.perfiles cascade;
drop table if exists public.user_roles cascade;

drop function if exists public.asegurar_perfil() cascade;
drop function if exists public.es_super_admin(uuid) cascade;
drop function if exists public.tiene_permiso(uuid, public.app_permission) cascade;
drop function if exists public.has_role(uuid, public.app_role) cascade;
drop function if exists public.registrar_actividad(text, text, text) cascade;

drop type if exists public.app_permission cascade;
drop type if exists public.app_rol cascade;
drop type if exists public.app_role cascade;

-- ============ FASE 2: ROLES ============
create type public.app_role as enum ('admin', 'empleado');

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.perfiles to authenticated;
grant all on public.perfiles to service_role;
alter table public.perfiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.es_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = 'admin')
$$;

create or replace function public.es_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

-- Perfil propio + admins
create policy "Ver propio perfil" on public.perfiles for select to authenticated using (id = auth.uid());
create policy "Admin ve perfiles" on public.perfiles for select to authenticated using (public.es_admin(auth.uid()));
create policy "Admin crea perfiles" on public.perfiles for insert to authenticated with check (public.es_admin(auth.uid()));
create policy "Admin edita perfiles" on public.perfiles for update to authenticated using (public.es_admin(auth.uid())) with check (public.es_admin(auth.uid()));
create policy "Admin elimina perfiles" on public.perfiles for delete to authenticated using (public.es_admin(auth.uid()) and id <> auth.uid());

-- Roles: lectura propia + admin total
create policy "Ver propio rol" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "Admin ve roles" on public.user_roles for select to authenticated using (public.es_admin(auth.uid()));
create policy "Admin asigna roles" on public.user_roles for insert to authenticated with check (public.es_admin(auth.uid()));
create policy "Admin modifica roles" on public.user_roles for update to authenticated using (public.es_admin(auth.uid())) with check (public.es_admin(auth.uid()));
create policy "Admin quita roles" on public.user_roles for delete to authenticated using (public.es_admin(auth.uid()) and user_id <> auth.uid());

create trigger update_perfiles_updated_at before update on public.perfiles
for each row execute function public.update_updated_at_column();

-- ============ HISTORIAL ============
create table public.historial_actividad (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null default '',
  nombre text,
  accion text not null,
  elemento text,
  detalle text,
  created_at timestamptz not null default now()
);
grant select on public.historial_actividad to authenticated;
grant all on public.historial_actividad to service_role;
alter table public.historial_actividad enable row level security;

-- Solo admins leen. Nadie escribe directo: solo la funcion SECURITY DEFINER.
create policy "Admin ve historial" on public.historial_actividad for select to authenticated using (public.es_admin(auth.uid()));
create policy "Nadie inserta directo" on public.historial_actividad for insert to authenticated with check (false);

create or replace function public.registrar_actividad(_accion text, _elemento text default null, _detalle text default null)
returns void language plpgsql security definer set search_path = public as $$
declare _p public.perfiles;
begin
  if auth.uid() is null then return; end if;
  if not public.es_staff(auth.uid()) then return; end if;
  select * into _p from public.perfiles where id = auth.uid();
  insert into public.historial_actividad (user_id, email, nombre, accion, elemento, detalle)
  values (auth.uid(), coalesce(_p.email, auth.jwt() ->> 'email', ''), _p.nombre, _accion, _elemento, _detalle);
end;
$$;

-- ============ ENTREGAS ============
create table public.entregas (
  id uuid primary key default gen_random_uuid(),
  cliente text not null,
  vehiculo text not null default '',
  fecha date not null default current_date,
  notas text,
  registrado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.entregas to anon;
grant select, insert, update, delete on public.entregas to authenticated;
grant all on public.entregas to service_role;
alter table public.entregas enable row level security;

create policy "Entregas visibles" on public.entregas for select to anon, authenticated using (true);
create policy "Staff crea entregas" on public.entregas for insert to authenticated with check (public.es_staff(auth.uid()));
create policy "Staff edita entregas" on public.entregas for update to authenticated using (public.es_staff(auth.uid())) with check (public.es_staff(auth.uid()));
create policy "Staff elimina entregas" on public.entregas for delete to authenticated using (public.es_staff(auth.uid()));

create trigger update_entregas_updated_at before update on public.entregas
for each row execute function public.update_updated_at_column();

-- ============ VEHICULOS: politicas nuevas ============
drop policy if exists "Catalogo publico visible" on public.vehiculos;
drop policy if exists "Crear vehiculos con permiso" on public.vehiculos;
drop policy if exists "Editar vehiculos con permiso" on public.vehiculos;
drop policy if exists "Eliminar vehiculos con permiso" on public.vehiculos;
drop policy if exists "Staff ve todos los vehiculos" on public.vehiculos;

create policy "Catalogo publico visible" on public.vehiculos for select to anon, authenticated using (publicado = true);
create policy "Staff ve todos los vehiculos" on public.vehiculos for select to authenticated using (public.es_staff(auth.uid()));
create policy "Staff crea vehiculos" on public.vehiculos for insert to authenticated with check (public.es_staff(auth.uid()));
create policy "Staff edita vehiculos" on public.vehiculos for update to authenticated using (public.es_staff(auth.uid())) with check (public.es_staff(auth.uid()));
create policy "Staff elimina vehiculos" on public.vehiculos for delete to authenticated using (public.es_staff(auth.uid()));

-- ============ PERMISOS DE EJECUCION ============
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.es_admin(uuid) from public, anon;
revoke all on function public.es_staff(uuid) from public, anon;
revoke all on function public.registrar_actividad(text, text, text) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.es_admin(uuid) to authenticated;
grant execute on function public.es_staff(uuid) to authenticated;
grant execute on function public.registrar_actividad(text, text, text) to authenticated;

-- ============ REALTIME: solo operacion principal ============
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='vehiculos') then
    alter publication supabase_realtime add table public.vehiculos;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='entregas') then
    alter publication supabase_realtime add table public.entregas;
  end if;
end $$;
alter table public.vehiculos replica identity full;
alter table public.entregas replica identity full;
