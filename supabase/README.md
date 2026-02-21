# Supabase setup

## Create the `jobs` table

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Go to **SQL Editor** → **New query**.
3. Copy the contents of `migrations/001_jobs.sql` and paste into the editor.
4. Click **Run**.

If the line `alter publication supabase_realtime add table public.jobs` fails (e.g. "already exists"), you can run only the `create table` block; the app will still work, but the job progress page won’t get live updates until Realtime is enabled for `jobs`.

## Using Supabase CLI (optional)

If you use the Supabase CLI and link this project:

```bash
supabase db push
```

This applies all migrations in `supabase/migrations/`.
