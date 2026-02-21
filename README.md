# Lexis

**Autonomous i18n Agent** — Paste a public Next.js (App Router) GitHub repo URL, pick target languages, and get a real Pull Request that adds full i18n: hardcoded strings extracted, next-intl wired up, and translations generated via [Lingo.dev](https://lingo.dev).

- **Paste URL** → **Globalize** → **Watch live progress** → **Open PR**

---

## Tech stack

| Layer | Tool |
|-------|------|
| App | Next.js 14 (App Router), React, TypeScript, Tailwind |
| Data & realtime | Supabase (Postgres + Realtime) |
| AI transform | Google Gemini |
| Translation | Lingo.dev CLI |
| GitHub | Octokit, simple-git |
| Parsing | Babel (parser + traverse) |

---

## Getting started

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project
- GitHub bot account (PAT with `repo` + `pull_request` scopes)
- [Google AI](https://ai.google.dev) API key (Gemini)
- [Lingo.dev](https://lingo.dev) API key

### Install

```bash
npm install
```

### Environment

Copy env vars into `.env.local` (see [architecture.md](./architecture.md) for full schema):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# GitHub (bot PAT)
GITHUB_TOKEN=
GITHUB_BOT_USERNAME=

# Google Gemini
GEMINI_API_KEY=

# Lingo.dev
LINGODOTDEV_API_KEY=
```

Apply migrations in the Supabase dashboard (or via CLI) from `supabase/migrations/`.

#### Deployment (production)

Set these so sign-in and callbacks never redirect to localhost:

```bash
# Your app’s public URL (required for OAuth redirects)
NEXT_PUBLIC_APP_URL=https://your-domain.com
# Optional: same idea for server-side fetch (Vercel sets VERCEL_URL automatically)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

**Supabase (Authentication → URL Configuration):**

- **Site URL**: set to your production URL (e.g. `https://your-domain.com`), not `http://localhost:3000`.
- **Redirect URLs**: add your callback, e.g. `https://your-domain.com/auth/callback`.

If Site URL or Redirect URLs stay as localhost, the browser will be sent to localhost after GitHub sign-in and the connection will fail in production.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a public Next.js App Router repo URL, choose languages, and click **Globalize This Repo**. You’ll be redirected to the job page with live logs and a PR link when it’s done.

---

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server (via `scripts/dev.js`) |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | Next.js lint |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright e2e tests |

---

## Project structure

```
├── app/                 # Next.js App Router (pages, API routes, auth)
├── components/          # React UI (forms, job progress, dashboard, theme)
├── lib/                 # Supabase clients, agent pipeline, steps, repo detector
├── types/               # Shared TypeScript types
├── supabase/migrations/ # DB schema (jobs, user profiles)
├── __tests__/           # Unit tests (Vitest)
├── e2e/                 # E2E tests (Playwright)
└── scripts/             # Dev server and utilities
```

The agent pipeline lives under `lib/agent/`: clone → scan → setup i18n → transform (Gemini) → translate (Lingo.dev) → commit/push → open PR.

---

## Docs

- **[architecture.md](./architecture.md)** — Technical plan, schema, env, pipeline steps, and failure handling
- **[TESTING.md](./TESTING.md)** — How to run and write tests
