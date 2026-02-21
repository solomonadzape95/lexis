-- Link jobs to authenticated users (Supabase Auth) for GitHub sign-in flow.
-- Run after 001_jobs.sql. Existing rows keep user_id NULL.

alter table public.jobs
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists github_username text;

-- Optional: RLS so users only see their own jobs (service role bypasses for pipeline).
alter table public.jobs enable row level security;

create policy "Users can view own jobs"
  on public.jobs for select
  using (auth.uid() = user_id);

create policy "Users can insert own jobs"
  on public.jobs for insert
  with check (auth.uid() = user_id);
