# Sample Academy Platform

Interactive web app for Sample Academy: Tutor chat, lesson/studio operator surfaces, and the internal tool repository/compare views.

> Live project status is tracked in `../.planning/ROADMAP.md` and GitHub issues. This README is implementation overview only.

---

## Main Surfaces

- `/chat`: Tutor assistant (grounded responses + citations)
- `/studio`: lesson/studio operator controls
- `/studio/generate`: script generation/apply flow
- `/studio/menu`: Lesson Library
- `/content`: tool repository
- `/content/compare`: side-by-side tool comparison
- `/ingestion`: ingestion status + manual trigger

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Validation | Zod 4 |
| Tests | Vitest + Playwright |

---

## Local Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### LLM Provider Config

Set `.env.local` with one provider mode:

```bash
# default if unset
LLM_PROVIDER=mock

# host-only local CLI provider (no paid API key)
# requires logged-in Claude CLI on host
# LLM_PROVIDER=claude-code

# paid API provider
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=your-key-here
```

---

## Project Structure

```text
src/
  app/
    page.tsx
    chat/page.tsx
    content/
    studio/
    ingestion/
    api/
  components/
  lib/
```

---

Built by the Sample Academy engineering team.
