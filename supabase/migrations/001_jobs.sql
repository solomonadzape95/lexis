-- Jobs table for the Autonomous i18n Agent pipeline
-- Run this in Supabase: Dashboard → SQL Editor → New query → paste and Run
-- Or with Supabase CLI: supabase db push

create table if not exists public.jobs (
  id          uuid primary key default gen_random_uuid(),
  repo_url    text not null,
  repo_owner  text not null,
  repo_name   text not null,
  languages   text[] not null default '{}',
  status      text not null default 'pending',
  current_step text,
  pr_url      text,
  stats       jsonb default '{}',
  logs        jsonb default '[]',
  error       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Enable Realtime so the job dashboard gets live updates
alter publication supabase_realtime add table public.jobs;

-- Optional: RLS (enable if you want row-level security later)
-- alter table public.jobs enable row level security;
