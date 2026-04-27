-- ============================================================
-- Migration 003: Multi-tenancy, roles array, leaves, companies
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create companies table
create table if not exists public.companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  address       text,
  latitude      numeric,
  longitude     numeric,
  radius_meters integer not null default 100,
  working_days  int[] not null default '{1,2,3,4,5}',
  shift_start   time not null default '09:00',
  shift_end     time not null default '18:00',
  created_at    timestamptz default now(),
  created_by    uuid references auth.users(id)
);
alter table public.companies enable row level security;

-- 2. Migrate existing company_settings data (if any)
insert into public.companies (name, address, latitude, longitude, radius_meters)
select
  coalesce(company_name, 'My Company'),
  company_address,
  latitude,
  longitude,
  radius_meters
from public.company_settings
where latitude is not null or company_name is not null
limit 1
on conflict do nothing;

-- 3. Update profiles table
alter table public.profiles
  add column if not exists roles                text[]  not null default '{employee}',
  add column if not exists company_id           uuid    references public.companies(id),
  add column if not exists phone                text,
  add column if not exists department           text,
  add column if not exists must_change_password boolean not null default false;

-- Migrate single role → roles array for existing users
update public.profiles
set roles = array[role]
where role is not null
  and (roles = '{employee}' or array_length(roles,1) = 1);

-- Upgrade existing admins → super_admin (first admin becomes platform owner)
update public.profiles
set roles = '{super_admin,admin,employee}'
where role = 'admin';

-- Assign all existing users to the migrated company
update public.profiles
set company_id = (select id from public.companies order by created_at limit 1)
where company_id is null
  and (select count(*) from public.companies) > 0;

-- 4. Add columns to time_entries
alter table public.time_entries
  add column if not exists company_id          uuid references public.companies(id),
  add column if not exists is_auto_clocked_out boolean not null default false;

-- 5. Create leaves table
create table if not exists public.leaves (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  company_id  uuid references public.companies(id),
  start_date  date not null,
  end_date    date not null,
  reason      text,
  created_at  timestamptz default now()
);
alter table public.leaves enable row level security;

-- 6. Helper functions for RLS (security definer so policies can call them)
create or replace function public.get_my_roles()
returns text[]
language sql stable security definer
as $$
  select coalesce(roles, '{employee}') from public.profiles where id = auth.uid()
$$;

create or replace function public.get_my_company_id()
returns uuid
language sql stable security definer
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- 7. RLS for companies
drop policy if exists "companies_select" on public.companies;
create policy "companies_select" on public.companies
  for select to authenticated
  using (
    id = public.get_my_company_id()
    or 'super_admin' = any(public.get_my_roles())
  );

drop policy if exists "companies_write_superadmin" on public.companies;
create policy "companies_write_superadmin" on public.companies
  for all to authenticated
  using ('super_admin' = any(public.get_my_roles()))
  with check ('super_admin' = any(public.get_my_roles()));

drop policy if exists "companies_update_admin" on public.companies;
create policy "companies_update_admin" on public.companies
  for update to authenticated
  using (id = public.get_my_company_id() and 'admin' = any(public.get_my_roles()))
  with check (id = public.get_my_company_id() and 'admin' = any(public.get_my_roles()));

-- 8. Replace profiles RLS policies
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'profiles' and schemaname = 'public' loop
    execute format('drop policy if exists %I on public.profiles', pol.policyname);
  end loop;
end $$;

create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or 'super_admin' = any(public.get_my_roles())
    or (company_id = public.get_my_company_id() and 'admin' = any(public.get_my_roles()))
  );

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_service_all" on public.profiles
  for all to service_role
  using (true) with check (true);

-- 9. Replace time_entries RLS policies
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where tablename = 'time_entries' and schemaname = 'public' loop
    execute format('drop policy if exists %I on public.time_entries', pol.policyname);
  end loop;
end $$;

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

-- 10. RLS for leaves
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
