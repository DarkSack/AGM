-- =====================================================================
-- AGM Diseño y Proyección — esquema de base de datos
--
-- Ejecutar una vez en el SQL Editor de Supabase.
-- Es idempotente: se puede volver a lanzar sin romper nada.
--
-- Principios:
--   * Row Level Security activo en todas las tablas.
--   * El público anónimo solo lee lo publicado, nunca borradores.
--   * Escribir requiere estar autenticado y tener perfil de staff.
--   * Los textos multiidioma viven en jsonb {"es": "...", "en": "..."}.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'editor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.publish_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.project_category as enum (
    'residential', 'commercial', 'remodeling', 'maintenance', 'executive', 'other'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
-- search_path fijo: si se resuelve con el del rol que dispara el trigger, un
-- esquema anterior en la ruta podria colar su propio now().
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles — un registro por usuario del panel
--
-- Tener fila aquí es lo que convierte a un usuario de auth en staff. Crear el
-- usuario en Authentication no basta: hay que darle perfil explícitamente.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  role       public.app_role not null default 'editor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Helpers en un esquema no expuesto por PostgREST, para que no sean llamables
-- desde la API pública. `security definer` evita la recursión de RLS al
-- consultar profiles desde las políticas de otras tablas.
create schema if not exists internal;
revoke all on schema internal from anon, authenticated;

create or replace function internal.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid());
$$;

create or replace function internal.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  );
$$;

grant execute on function internal.is_staff() to authenticated;
grant execute on function internal.is_admin() to authenticated;

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() or internal.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid() or internal.is_admin())
  with check (id = auth.uid() or internal.is_admin());

-- La política anterior deja a cada usuario editar su propia fila, y RLS no
-- puede restringir columnas: sin este trigger un editor se daba rol de admin
-- con un simple UPDATE desde la API.
--
-- La regla solo se aplica a peticiones que llegan por la API (llevan JWT). Desde
-- el SQL Editor no hay JWT, y el alta del primer administrador sigue
-- funcionando. `security definer` porque `authenticated` no tiene acceso al
-- esquema `internal` desde código plpgsql.
create or replace function public.guard_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce(auth.jwt()->>'role', '') in ('authenticated', 'anon') then
    if new.id is distinct from old.id then
      raise exception 'No se puede cambiar el id de un perfil.'
        using errcode = '42501';
    end if;
    if new.role is distinct from old.role and not internal.is_admin() then
      raise exception 'Solo un administrador puede cambiar roles (row-level security).'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_changes();

-- Solo un admin da de alta a otro miembro del equipo.
drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert on public.profiles
  for insert to authenticated
  with check (internal.is_admin());

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete on public.profiles
  for delete to authenticated
  using (internal.is_admin());

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       jsonb not null default '{}'::jsonb,
  summary     jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  category    public.project_category not null default 'other',
  location    jsonb not null default '{}'::jsonb,
  year        text,
  client      jsonb,
  area        text,
  status      public.publish_status not null default 'draft',
  featured    boolean not null default false,
  is_concept  boolean not null default false,
  cover_image jsonb,
  gallery     jsonb not null default '[]'::jsonb,
  tags        text[] not null default '{}',
  seo         jsonb not null default '{}'::jsonb,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- El slug forma parte de la URL pública: solo minúsculas, dígitos y guiones.
  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint projects_slug_length check (char_length(slug) between 2 and 96),
  constraint projects_gallery_is_array check (jsonb_typeof(gallery) = 'array')
);

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_position_idx on public.projects (position, created_at desc);

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

alter table public.projects enable row level security;

-- El público solo ve lo publicado. Los borradores son invisibles vía API.
drop policy if exists projects_public_read on public.projects;
create policy projects_public_read on public.projects
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists projects_staff_read on public.projects;
create policy projects_staff_read on public.projects
  for select to authenticated
  using (internal.is_staff());

drop policy if exists projects_staff_write on public.projects;
create policy projects_staff_write on public.projects
  for all to authenticated
  using (internal.is_staff())
  with check (internal.is_staff());

-- ---------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  icon        text not null default 'design',
  position    integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint services_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index if not exists services_position_idx on public.services (position);

drop trigger if exists services_touch on public.services;
create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();

alter table public.services enable row level security;

drop policy if exists services_public_read on public.services;
create policy services_public_read on public.services
  for select to anon, authenticated
  using (active);

drop policy if exists services_staff_read on public.services;
create policy services_staff_read on public.services
  for select to authenticated
  using (internal.is_staff());

drop policy if exists services_staff_write on public.services;
create policy services_staff_write on public.services
  for all to authenticated
  using (internal.is_staff())
  with check (internal.is_staff());

-- ---------------------------------------------------------------------
-- site_settings — fila única con el contenido editorial del sitio
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  id         smallint primary key default 1,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,

  constraint site_settings_singleton check (id = 1)
);

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated
  using (true);

drop policy if exists site_settings_staff_write on public.site_settings;
create policy site_settings_staff_write on public.site_settings
  for all to authenticated
  using (internal.is_staff())
  with check (internal.is_staff());

-- ---------------------------------------------------------------------
-- content_blocks — composición de la página pública
--
-- `type` está restringido a un catálogo cerrado. No existe ningún tipo que
-- acepte HTML ni JavaScript: cada bloque se renderiza con su componente.
-- ---------------------------------------------------------------------
create table if not exists public.content_blocks (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  position   integer not null default 0,
  enabled    boolean not null default true,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint content_blocks_type_allowed check (type in (
    'hero', 'about', 'services', 'projects', 'featuredProject', 'method',
    'values', 'stats', 'quote', 'text', 'image', 'imageGrid', 'cta',
    'divider', 'contact'
  ))
);

create index if not exists content_blocks_position_idx on public.content_blocks (position);

drop trigger if exists content_blocks_touch on public.content_blocks;
create trigger content_blocks_touch before update on public.content_blocks
  for each row execute function public.touch_updated_at();

alter table public.content_blocks enable row level security;

drop policy if exists content_blocks_public_read on public.content_blocks;
create policy content_blocks_public_read on public.content_blocks
  for select to anon, authenticated
  using (enabled);

drop policy if exists content_blocks_staff_read on public.content_blocks;
create policy content_blocks_staff_read on public.content_blocks
  for select to authenticated
  using (internal.is_staff());

drop policy if exists content_blocks_staff_write on public.content_blocks;
create policy content_blocks_staff_write on public.content_blocks
  for all to authenticated
  using (internal.is_staff())
  with check (internal.is_staff());

-- Reemplaza la composición completa en una sola transacción. Borrar e insertar
-- desde la aplicación eran dos peticiones: si fallaba la segunda, la tabla se
-- quedaba vacía y se perdía la composición.
--
-- `security invoker`: corre con los permisos de quien llama, así que las
-- políticas RLS de arriba siguen siendo las que deciden. Quien no es staff no
-- borra ninguna fila y su INSERT falla, lo que deshace la transacción entera.
create or replace function public.replace_content_blocks(blocks jsonb)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
begin
  if jsonb_typeof(blocks) is distinct from 'array' then
    raise exception 'blocks debe ser un array.' using errcode = '22023';
  end if;

  -- `where true`: Supabase rechaza DELETE sin WHERE en peticiones de la API.
  delete from public.content_blocks where true;

  insert into public.content_blocks (type, position, enabled, data)
  select
    item->>'type',
    (ord - 1)::integer,
    coalesce((item->>'enabled')::boolean, true),
    coalesce(item->'data', '{}'::jsonb)
  from jsonb_array_elements(blocks) with ordinality as t(item, ord);
end;
$$;

revoke all on function public.replace_content_blocks(jsonb) from public, anon;
grant execute on function public.replace_content_blocks(jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- contact_messages — envíos del formulario público
--
-- El anónimo puede insertar (es un formulario público) pero nunca leer.
-- Los CHECK de longitud son la segunda barrera tras la validación con zod
-- en la ruta de API: la base de datos no confía en el cliente.
-- ---------------------------------------------------------------------
create table if not exists public.contact_messages (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  phone        text,
  project_type text not null,
  message      text not null,
  locale       text not null default 'es',
  read         boolean not null default false,
  created_at   timestamptz not null default now(),

  constraint contact_name_len    check (char_length(name) between 2 and 120),
  constraint contact_email_len   check (char_length(email) between 5 and 200),
  constraint contact_email_shape check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$'),
  constraint contact_phone_len   check (phone is null or char_length(phone) <= 40),
  constraint contact_message_len check (char_length(message) between 10 and 4000),
  constraint contact_locale_ok   check (locale in ('es', 'en')),
  constraint contact_type_ok     check (project_type in (
    'architectural-design', 'remodeling', 'construction', 'maintenance',
    'executive-project', 'consulting', 'other'
  ))
);

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

drop policy if exists contact_messages_public_insert on public.contact_messages;
create policy contact_messages_public_insert on public.contact_messages
  for insert to anon, authenticated
  with check (true);

drop policy if exists contact_messages_staff_read on public.contact_messages;
create policy contact_messages_staff_read on public.contact_messages
  for select to authenticated
  using (internal.is_staff());

drop policy if exists contact_messages_staff_update on public.contact_messages;
create policy contact_messages_staff_update on public.contact_messages
  for update to authenticated
  using (internal.is_staff())
  with check (internal.is_staff());

drop policy if exists contact_messages_staff_delete on public.contact_messages;
create policy contact_messages_staff_delete on public.contact_messages
  for delete to authenticated
  using (internal.is_staff());

-- ---------------------------------------------------------------------
-- Storage — bucket `media`
--
-- Lectura pública (las fotos se sirven en el sitio), escritura solo staff.
-- El límite de tamaño y los MIME permitidos se aplican en el propio bucket,
-- de modo que no dependen de la validación del cliente.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists media_staff_insert on storage.objects;
create policy media_staff_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and internal.is_staff());

drop policy if exists media_staff_update on storage.objects;
create policy media_staff_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and internal.is_staff());

drop policy if exists media_staff_delete on storage.objects;
create policy media_staff_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and internal.is_staff());

-- =====================================================================
-- Alta del primer administrador
--
-- 1. Authentication > Users > Add user, con correo y contraseña.
-- 2. Copiar su UUID y ejecutar:
--
--    insert into public.profiles (id, email, full_name, role)
--    values ('<UUID>', '<correo>', '<nombre>', 'admin')
--    on conflict (id) do update set role = 'admin';
--
-- Sin fila en profiles el usuario inicia sesión pero no puede escribir nada:
-- las políticas exigen internal.is_staff().
-- =====================================================================
