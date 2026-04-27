alter table public.profiles
  add column if not exists last_login_at timestamptz;

alter table public.company_settings
  add column if not exists company_name text,
  add column if not exists company_address text;
