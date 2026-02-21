-- User profiles table for storing user preferences and settings
-- Run after 002_jobs_user_id.sql

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  github_avatar_url text,
  theme text default 'system' check (theme in ('light', 'dark', 'system')),
  accent_color text default '#3c3cf6',
  default_language text default 'en',
  preferred_languages text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_profiles enable row level security;

create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_profiles_updated_at
  before update on public.user_profiles
  for each row
  execute function update_updated_at_column();
