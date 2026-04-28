-- ============================================================
-- FRESH SCHEMA — Run this in Supabase SQL Editor
-- Drops all app tables then recreates everything cleanly.
-- ============================================================

-- ── 1. Drop existing tables (order matters for FK constraints) ──

drop table if exists public.leaves          cascade;
drop table if exists public.time_entries    cascade;
drop table if exists public.profiles        cascade;
drop table if exists public.companies       cascade;
drop table if exists public.company_settings cascade;

-- Drop old helper functions
drop function if exists public.get_my_roles() cascade;
drop function if exists public.get_my_company_id() cascade;

-- Drop old trigger first, then the function it depends on
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

-- ── 2. Create companies ──────────────────────────────────────

create table public.companies (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  address       text,
  latitude      numeric,
  longitude     numeric,
  radius_meters integer     not null default 100,
  working_days  int[]       not null default '{1,2,3,4,5}',
  shift_start   time        not null default '09:00',
  shift_end     time        not null default '18:00',
  created_at    timestamptz default now(),
  created_by    uuid        references auth.users(id)
);

alter table public.companies enable row level security;

-- ── 3. Create profiles ───────────────────────────────────────

create table public.profiles (
  id                   uuid        primary key references auth.users(id) on delete cascade,
  email                text,
  full_name            text,
  roles                text[]      not null default '{employee}',
  company_id           uuid        references public.companies(id),
  phone                text,
  department           text,
  must_change_password boolean     not null default false,
  last_login_at        timestamptz,
  created_at           timestamptz default now()
);

alter table public.profiles enable row level security;

-- ── 4. Create time_entries ───────────────────────────────────

create table public.time_entries (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users(id) on delete cascade,
  company_id         uuid        references public.companies(id),
  clock_in           timestamptz not null default now(),
  clock_out          timestamptz,
  is_auto_clocked_out boolean    not null default false,
  created_at         timestamptz default now()
);

alter table public.time_entries enable row level security;

-- ── 5. Create leaves ─────────────────────────────────────────

create table public.leaves (
  id         uuid  primary key default gen_random_uuid(),
  user_id    uuid  not null references auth.users(id) on delete cascade,
  company_id uuid  references public.companies(id),
  start_date date  not null,
  end_date   date  not null,
  reason     text,
  created_at timestamptz default now()
);

alter table public.leaves enable row level security;

-- ── 6. Helper functions (security definer for RLS) ───────────

create or replace function public.get_my_roles()
returns text[]
language sql stable security definer
as $$
  select coalesce(roles, '{employee}') from public.profiles where id = auth.uid();
$$;

create or replace function public.get_my_company_id()
returns uuid
language sql stable security definer
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

-- ── 7. Trigger: auto-create profile on sign-up ───────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (id, email, roles, must_change_password)
  values (new.id, new.email, '{employee}', false)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 8. RLS — companies ───────────────────────────────────────

create policy "companies_select" on public.companies
  for select to authenticated
  using (
    id = public.get_my_company_id()
    or 'super_admin' = any(public.get_my_roles())
  );

create policy "companies_superadmin_all" on public.companies
  for all to authenticated
  using  ('super_admin' = any(public.get_my_roles()))
  with check ('super_admin' = any(public.get_my_roles()));

create policy "companies_admin_update" on public.companies
  for update to authenticated
  using  (id = public.get_my_company_id() and 'admin' = any(public.get_my_roles()))
  with check (id = public.get_my_company_id() and 'admin' = any(public.get_my_roles()));

-- ── 9. RLS — profiles ────────────────────────────────────────

create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or 'super_admin' = any(public.get_my_roles())
    or (company_id = public.get_my_company_id() and 'admin' = any(public.get_my_roles()))
  );

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using  (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_service_all" on public.profiles
  for all to service_role
  using (true) with check (true);

-- ── 10. RLS — time_entries ───────────────────────────────────

create policy "time_entries_select" on public.time_entries
  for select to authenticated
  using (
    user_id = auth.uid()
    or 'super_admin' = any(public.get_my_roles())
    or (company_id = public.get_my_company_id() and 'admin' = any(public.get_my_roles()))
  );

create policy "time_entries_insert" on public.time_entries
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "time_entries_update" on public.time_entries
  for update to authenticated
  using (
    user_id = auth.uid()
    or 'super_admin' = any(public.get_my_roles())
    or (company_id = public.get_my_company_id() and 'admin' = any(public.get_my_roles()))
  );

-- ── 11. RLS — leaves ─────────────────────────────────────────

create policy "leaves_select" on public.leaves
  for select to authenticated
  using (
    user_id = auth.uid()
    or 'super_admin' = any(public.get_my_roles())
    or (company_id = public.get_my_company_id() and 'admin' = any(public.get_my_roles()))
  );

create policy "leaves_insert_own" on public.leaves
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "leaves_update_own" on public.leaves
  for update to authenticated
  using (user_id = auth.uid());

create policy "leaves_delete_own" on public.leaves
  for delete to authenticated
  using (user_id = auth.uid());

-- ── 12. Rebuild profile for existing auth users ──────────────
-- Ensures existing Supabase Auth accounts get a profiles row.

insert into public.profiles (id, email, roles, must_change_password)
select id, email, '{super_admin,admin,employee}', false
from auth.users
on conflict (id) do update
  set email = excluded.email,
      roles = excluded.roles;
