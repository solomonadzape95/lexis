# Lexis — Demo Video / Live Pitch Script

**Target length:** 2–3 minutes  
**Use for:** Recorded video or live demo to judges

---

## HOOK (0:00–0:20)

> "Going global used to mean weeks of hunting for hardcoded strings, wiring up i18n by hand, and paying for translations. Not anymore.
>
> This is **Lexis** — an autonomous agent that takes any Next.js repo, and in under a minute, opens a **real GitHub Pull Request** with full internationalization. No manual work. I’ll show you."

**[Screen: Lexis homepage]**

---

## WHAT IT DOES (0:20–0:45)

> "You paste a public GitHub repo URL, pick the languages you want — Spanish, French, Japanese, whatever — and hit **Globalize This Repo**.
>
> Lexis clones the repo, scans for hardcoded strings with Babel, sets up next-intl and Lingo.dev, uses **Gemini** to wrap every string in translation keys, runs **Lingo.dev** to translate everything, then commits, pushes to a fork, and opens a PR. All of that — one click."

**[Optional: Show framework scan detecting “Next.js app-router — Fully supported”]**

---

## LIVE DEMO (0:45–2:00)

> "Watch. I’m pasting a real Next.js App Router repo… selecting a few languages… and clicking **Globalize**."

**[Do it: paste URL, select 2–3 languages, click submit]**

> "I’m taken to the job page. Progress is streamed in real time from our pipeline — clone, scan, setup i18n, transform with AI, translate with Lingo.dev, commit and push, open PR."

**[Let the steps tick; narrate as they complete]**

> "Clone… scan for hardcoded strings… scaffolding i18n… Gemini’s wrapping strings in translation calls… Lingo.dev is translating… and there’s the PR."

**[Click “View Pull Request” when it appears]**

> "That’s a real PR on GitHub. You can see the diff — files changed, strings extracted, locale files added. Everything you’d get from a dev team, in about sixty seconds."

**[Optional: Scroll the PR briefly — modified files, messages/es.json, etc.]**

---

## WHY JUDGES SHOULD CARE (2:00–2:30)

> "Under the hood: we use **Lingo.dev** for translation and i18n config, **Gemini** for safe, context-aware code edits, and **Supabase** for real-time job updates. The pipeline is a seven-step agent — clone, scan, setup, transform, translate, commit-push, open PR — and we only support Next.js App Router today so we could ship something that actually works end-to-end.
>
> So: what used to take days and thousands of dollars now takes one click and under a minute. That’s Lexis."

---

## CLOSING (2:30–2:45)

> "Lexis — globalize your Next.js repo in one click. Thanks."

**[Optional: End card with app URL or “Try it at [URL]”]**

---

## LIVE DEMO CHEAT SHEET

- **Before you start:** Have one real public Next.js App Router repo ready (e.g. a small demo repo). Test the full flow once so you know it completes in time.
- **If something fails:** Have a short fallback: “Here’s a recording of a successful run” or “The PR from an earlier run is still open — here it is.”
- **Emphasize:** Real PR, real repo, real translations. The “one click → real PR” is the core wow moment.
- **Judges’ likely questions:** “Only Next.js?” → “Yes — we focused on App Router so the pipeline is reliable; we can extend later.” “Who does the translation?” → “Lingo.dev. We handle extraction and code changes; Lingo handles the actual translation.”

---

## ONE-LINERS (for intros or social)

- "One click. One PR. Full i18n."
- "What used to take days and thousands of dollars — now under a minute."
- "Paste a repo. Get a PR. Go global."
