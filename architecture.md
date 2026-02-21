# Autonomous i18n Agent — Full Technical Plan
> Hackathon project using Lingo.dev CLI, MCP, CI/CD, SDK + Next.js + Supabase

---

## What It Is

A web app where a user pastes any public GitHub repo URL (Next.js App Router project), clicks one button, and an AI agent pipeline fully globalizes it — scanning for hardcoded strings, wiring up i18n infrastructure, translating into multiple languages via Lingo.dev, and opening a real GitHub Pull Request. Zero manual work.

**The demo arc**: Paste URL → watch live logs tick by → see a real PR link appear.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend + API | Next.js 14 (App Router) |
| Database + Realtime | Supabase (Postgres + Realtime channels) |
| Background jobs | Supabase Edge Functions OR a `/api/agent/run` long-running route |
| AI string transform | Gemini API (`gemini-2.0-flash-exp`) |
| i18n setup scaffolding | Lingo.dev MCP patterns (baked into agent prompt) |
| Translation engine | Lingo.dev CLI (`npx lingo.dev@latest i18n`) |
| GitHub integration | Octokit REST (`@octokit/rest`) |
| Repo cloning | `simple-git` |
| Code parsing | `@babel/parser` + `@babel/traverse` |
| Styling | Tailwind CSS |

---

## User Flow

```
1. User lands on homepage
2. Pastes a GitHub repo URL (must be Next.js App Router)
3. Selects target languages (checkboxes: Spanish, French, German, Japanese, Chinese...)
4. Clicks "Globalize This Repo"
5. Redirected to /jobs/[jobId] — a live progress dashboard
6. Watches steps complete in real-time (streamed via Supabase Realtime)
7. At the end: a green "View Pull Request" button appears with a real GitHub PR link
8. Stats shown: X files modified, Y strings extracted, Z languages added
```

---

## File & Folder Structure

```
/
├── app/
│   ├── page.tsx                        # Landing page with URL input form
│   ├── jobs/
│   │   └── [jobId]/
│   │       └── page.tsx                # Live job progress dashboard
│   └── api/
│       ├── jobs/
│       │   └── route.ts                # POST: create job, GET: list jobs
│       └── jobs/[jobId]/
│           ├── route.ts                # GET: job status
│           └── run/
│               └── route.ts            # POST: triggers the agent pipeline
│
├── lib/
│   ├── supabase.ts                     # Supabase client (server + client)
│   ├── github.ts                       # GitHub API wrapper (Octokit)
│   ├── lingo.ts                        # Lingo.dev CLI runner helpers
│   └── agent/
│       ├── pipeline.ts                 # Main orchestrator — runs steps in order
│       ├── logger.ts                   # Writes logs to Supabase in real-time
│       └── steps/
│           ├── 1-clone.ts              # Clone repo to /tmp/[jobId]/
│           ├── 2-scan.ts               # Find all hardcoded JSX strings
│           ├── 3-setup-i18n.ts         # Scaffold i18n config + locale files
│           ├── 4-transform.ts          # Wrap strings in t() via Gemini API
│           ├── 5-translate.ts          # Run `npx lingo.dev@latest i18n`
│           ├── 6-commit-push.ts        # Commit changes, push to fork
│           └── 7-open-pr.ts            # Open GitHub PR via Octokit
│
├── components/
│   ├── JobProgress.tsx                 # Real-time step progress UI
│   ├── StepRow.tsx                     # Individual step with status + logs
│   ├── LanguageSelector.tsx            # Checkboxes for target languages
│   └── ResultCard.tsx                  # Final PR link + stats card
│
├── types/
│   └── index.ts                        # Shared TypeScript types
│
├── .env.local                          # Secrets (see below)
└── supabase/
    └── migrations/
        └── 001_jobs.sql                # DB schema
```

---

## Supabase Schema

```sql
-- supabase/migrations/001_jobs.sql

create table jobs (
  id          uuid primary key default gen_random_uuid(),
  repo_url    text not null,
  repo_owner  text not null,
  repo_name   text not null,
  languages   text[] not null default '{}',
  status      text not null default 'pending',
    -- pending | running | completed | failed
  current_step text,
  pr_url      text,
  stats       jsonb default '{}',
    -- { filesModified: 12, stringsFound: 47, languagesAdded: 5 }
  logs        jsonb default '[]',
    -- [{ step: 'clone', message: 'Cloning repo...', ts: '...', level: 'info' }]
  error       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Enable Realtime on jobs table
alter publication supabase_realtime add table jobs;
```

---

## Environment Variables (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# GitHub — a bot account's PAT with repo + pull_request scopes
GITHUB_TOKEN=
GITHUB_BOT_USERNAME=          # e.g. "i18n-agent-bot"

# Google Gemini
GEMINI_API_KEY=

# Lingo.dev
LINGODOTDEV_API_KEY=
```

---

## Agent Pipeline — Step by Step

### Step 1: `1-clone.ts` — Clone the Repo
```
- Use simple-git to clone the target repo to /tmp/[jobId]/repo/
- Detect: is this a Next.js App Router project?
  - Check for /app directory
  - Check package.json for "next" dependency
  - If not Next.js App Router: fail early with a helpful error message
- Log: "Cloned [repo] in X seconds"
```

### Step 2: `2-scan.ts` — Find Hardcoded Strings
```
- Walk all .tsx, .ts, .jsx, .js files in /app/** and /components/**
- Use @babel/parser to parse each file into an AST
- Use @babel/traverse to find:
  - JSXText nodes (text directly in JSX)
  - JSXAttribute string values (alt="...", placeholder="...", title="...")
  - String literals inside specific patterns (aria-label, etc.)
- SKIP: strings that are already inside t() calls
- SKIP: strings that are purely whitespace, numbers, or single chars
- SKIP: import paths, CSS classnames, data-* attributes
- Output: Map<filepath, StringHit[]>
  where StringHit = { node, value, line, column }
- Log: "Found X hardcoded strings across Y files"
```

### Step 3: `3-setup-i18n.ts` — Scaffold i18n Infrastructure
```
This step wires up the i18n plumbing the Lingo.dev MCP would normally do.
Bake these as file writes (no need to actually call the MCP server):

Files to create/modify:
  1. i18n.json (Lingo.dev config)
     {
       "$schema": "https://lingo.dev/schema/i18n.json",
       "version": "1.10",
       "locale": {
         "source": "en",
         "targets": ["es", "fr", "de", "ja", "zh"]  // from user selection
       },
       "buckets": {
         "json": {
           "include": ["messages/[locale].json"]
         }
       }
     }

  2. messages/en.json — empty for now, filled in step 4

  3. lib/i18n.ts — next-intl config or similar
     (use next-intl, it's the most common Next.js i18n library)

  4. middleware.ts — locale detection + routing
     (standard next-intl middleware pattern)

  5. next.config.ts — add withNextIntl() wrapper

  6. app/[locale]/layout.tsx — wrap with NextIntlClientProvider
     (move existing app/layout.tsx content here)

  7. app/[locale]/page.tsx — move existing app/page.tsx content here

- Install next-intl: write to package.json dependencies
- Log: "i18n infrastructure scaffolded (next-intl)"
```

### Step 4: `4-transform.ts` — Wrap Strings with Gemini API
```
For each file that has hardcoded strings (from step 2):
  - Send Gemini API a prompt with:
    - The full file contents
    - The list of hardcoded strings detected (with line numbers)
    - Instructions to:
      a) Add `import { useTranslations } from 'next-intl'` at top
      b) Add `const t = useTranslations('namespace')` inside the component
      c) Replace each hardcoded string with t('key') — generate sensible keys
      d) Return the full modified file content
      e) Also return a JSON map of { key: original_string } for the locale file

  - Write the modified file back to disk
  - Accumulate all { key: original_string } pairs

After all files:
  - Write messages/en.json with all accumulated key-value pairs

IMPORTANT PROMPT DETAILS for Gemini:
  - Tell it the file is a Next.js App Router component
  - Tell it to use `useTranslations` for client components, `getTranslations` for server components
  - Tell it NOT to modify anything outside of string replacement
  - Tell it to return ONLY the file content, no explanation

- Log: "Transformed X files, extracted Y translation keys"
```

### Step 5: `5-translate.ts` — Run Lingo.dev CLI
```
- cd into the cloned repo directory
- Run: npx lingo.dev@latest i18n
  with env var LINGODOTDEV_API_KEY set
- This reads i18n.json, reads messages/en.json,
  and auto-generates messages/es.json, messages/fr.json, etc.
- Parse stdout for progress info
- Log: "Translated X words into Y languages via Lingo.dev"
```

### Step 6: `6-commit-push.ts` — Commit + Push to Fork
```
- Use GitHub API (Octokit) to fork the original repo to the bot account
- Add bot account as remote in simple-git
- git add -A
- git commit -m "feat: add i18n support via Lingo.dev"
         --author "i18n-agent[bot] <bot@example.com>"
- git push fork HEAD:feat/i18n-lingo-dev
- Log: "Pushed changes to fork"
```

### Step 7: `7-open-pr.ts` — Open the Pull Request
```
- Use Octokit to create a PR from the fork branch to the original repo's main branch
- PR title: "🌍 Add i18n support for X languages (via Lingo.dev)"
- PR body: auto-generated markdown summary:
    ## What this PR does
    This PR was auto-generated by the Autonomous i18n Agent.
    
    ### Changes
    - Set up next-intl i18n routing and middleware
    - Extracted N hardcoded strings from Y files into messages/en.json
    - Translated all strings into: Spanish, French, German, Japanese, Chinese
    - Added Lingo.dev CI/CD config for automatic future translations
    
    ### Files modified
    [list of files]
    
    ### Powered by
    Lingo.dev + Gemini + Autonomous i18n Agent
- Save pr_url to Supabase
- Update job status to "completed"
- Log: "PR opened: [URL]"
```

---

## Real-Time Frontend (Supabase Realtime)

The `/jobs/[jobId]` page subscribes to changes on the `jobs` table row:

```typescript
// components/JobProgress.tsx

const channel = supabase
  .channel(`job-${jobId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'jobs',
    filter: `id=eq.${jobId}`
  }, (payload) => {
    setJob(payload.new)
  })
  .subscribe()
```

Every time the pipeline writes a log or advances a step, it calls:
```typescript
// lib/agent/logger.ts
await supabase
  .from('jobs')
  .update({
    current_step: stepName,
    logs: [...existingLogs, { step, message, ts, level }],
    updated_at: new Date().toISOString()
  })
  .eq('id', jobId)
```

The UI re-renders instantly showing the new log line.

---

## UI: Step Progress Display

7 steps, each showing:
- ⏳ Pending (grey)
- 🔄 Running (blue spinner)
- ✅ Done (green checkmark + duration)
- ❌ Failed (red X + error message)

Each step expands to show its log lines (like a mini terminal).

At the bottom, once complete:
- Big green "View Pull Request →" button
- Stats row: "12 files modified · 47 strings translated · 5 languages added"

---

## API Routes

### `POST /api/jobs`
```typescript
// Body: { repoUrl: string, languages: string[] }
// 1. Validate GitHub URL format
// 2. Extract owner/repo from URL
// 3. Verify repo exists via GitHub API (unauthenticated)
// 4. Insert job row into Supabase with status='pending'
// 5. Fire-and-forget: fetch('/api/jobs/[id]/run')
// 6. Return: { jobId }
```

### `GET /api/jobs/[jobId]`
```typescript
// Return full job row from Supabase
```

### `POST /api/jobs/[jobId]/run`
```typescript
// The actual pipeline runner
// 1. Update job status to 'running'
// 2. Call pipeline(job) which runs steps 1-7 in sequence
// 3. Each step catches its own errors and logs them
// 4. On any fatal error: update job status to 'failed'
// 5. On success: update job status to 'completed'
// This route can be long-running (no timeout issue in Next.js with edge runtime disabled)
```

---

## Types

```typescript
// types/index.ts

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed'

export type LogEntry = {
  step: string
  message: string
  ts: string
  level: 'info' | 'success' | 'warning' | 'error'
}

export type JobStats = {
  filesModified: number
  stringsFound: number
  languagesAdded: number
}

export type Job = {
  id: string
  repo_url: string
  repo_owner: string
  repo_name: string
  languages: string[]
  status: JobStatus
  current_step: string | null
  pr_url: string | null
  stats: JobStats
  logs: LogEntry[]
  error: string | null
  created_at: string
  updated_at: string
}

export type StringHit = {
  value: string
  line: number
  column: number
  type: 'JSXText' | 'JSXAttribute' | 'StringLiteral'
  attributeName?: string  // for JSXAttribute hits
}
```

---

## Key Dependencies to Install

```bash
# Core
npm install @supabase/supabase-js @supabase/ssr
npm install next-intl
npm install simple-git
npm install @octokit/rest
npm install @babel/parser @babel/traverse @babel/types
npm install @google/genai

# Dev
npm install -D @types/babel__traverse
```

---

## Lingo.dev Integration Points Summary

| Tool | Where Used | Purpose |
|---|---|---|
| **Lingo.dev CLI** | Step 5 | Translate all locale files from en.json source |
| **Lingo.dev i18n.json** | Step 3 | Config file that CLI reads to know source/target locales |
| **Lingo.dev MCP patterns** | Step 3 | The scaffold this generates mirrors what MCP produces |
| **Lingo.dev CI/CD** | Step 7 PR body | Mention + optionally add `.github/workflows/i18n.yml` to the PR |

---

## Optional Bonus Features (If Time Allows)

1. **Add Lingo.dev CI/CD to the PR** — Include a `.github/workflows/i18n.yml` that auto-translates future commits. This makes the PR even more valuable and showcases more of the Lingo.dev ecosystem.

2. **Before/After Preview** — Show a diff of one transformed file in the UI so judges can see what the agent actually changed.

3. **Support multiple frameworks** — After Next.js works, add React Router or TanStack Start (Lingo.dev MCP supports these too).

4. **Language auto-detection** — Instead of checkboxes, detect what locale files already exist and only add missing ones.

5. **Repo validation** — Detect if the repo already has i18n set up and tell the user rather than duplicating it.

---

## Demo Script (For Presentation)

1. Open the app live in the browser
2. Use a real simple public Next.js repo (prepare 2-3 options in advance as backup)
3. Select Spanish, French, Japanese
4. Hit "Globalize"
5. Narrate each step as it runs (~45-90 seconds total)
6. Click the PR link — show the real GitHub PR with file diffs
7. Show the translated locale files (`messages/es.json`, etc.) in the PR
8. One-liner close: "What used to take days of manual work, a translation agency, and thousands of dollars — now takes 60 seconds and zero human effort."

---

## Potential Failure Points to Handle Gracefully

- Repo is not Next.js → clear error: "Currently supports Next.js App Router projects only"
- Repo is private → clear error: "Please use a public repository"
- File has complex patterns Gemini can't cleanly transform → skip the file, log a warning, continue
- Lingo.dev CLI fails → retry once, then fail with output in logs
- GitHub fork already exists → use existing fork, push to new branch
- GitHub PR creation fails (permissions) → still mark job complete, show the diff as a download instead
