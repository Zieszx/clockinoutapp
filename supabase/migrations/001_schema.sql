-- time_entries
create table public.time_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  clock_in   timestamptz not null default now(),
  clock_out  timestamptz,
  created_at timestamptz default now()
);
alter table public.time_entries enable row level security;
create policy "Users read own entries" on public.time_entries for select using (auth.uid() = user_id);
create policy "Admins read all entries" on public.time_entries for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Users insert own entries" on public.time_entries for insert with check (auth.uid() = user_id);
create policy "Users update own entries" on public.time_entries for update using (auth.uid() = user_id);

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'employee' check (role in ('employee','admin')),
  email text, full_name text, created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users read all profiles" on public.profiles for select using (true);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create or replace function public.handle_new_user() returns trigger as $$ begin insert into public.profiles (id, email) values (new.id, new.email); return new; end; $$ language plpgsql security definer;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- company_settings
create table public.company_settings (
  id int primary key default 1 check (id = 1),
  latitude float, longitude float, radius_meters int not null default 100,
  updated_at timestamptz default now(), updated_by uuid references auth.users(id)
);
alter table public.company_settings enable row level security;
create policy "Anyone can read settings" on public.company_settings for select using (true);
create policy "Admins can insert settings" on public.company_settings for insert with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can update settings" on public.company_settings for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
