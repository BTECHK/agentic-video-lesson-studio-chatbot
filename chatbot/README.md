# Sample Academy Platform

A companion web app for **Sample Academy** — an AI education platform for working professionals building careers with AI.

This is the learning platform's interactive layer: an AI teaching assistant ("Tutor"), a curated library of 12 AI tools with benchmarks and capability breakdowns, and a side-by-side comparison tool. It sits alongside the animated video lessons that are the primary course content.

---

## What's Built

### Landing Page (`/`)
Brand-aligned entry point with animated hero, Module 1 preview (5 topics), and feature cards linking to each section. Warm linen palette, Syne typography, brand throughout.

### Ask Tutor (`/chat`)
AI teaching assistant powered by Claude. Grounded in course content with source citations. Students can ask questions and get answers tied to module material. Access-gated with demo mode available.

### Content Library (`/content`)
Browsable repository of 12 AI tools (ChatGPT, Claude, Gemini, Grok, DeepSeek, Perplexity, Codex, Claude Code, Cowork, Comet, Manus, Qwen). Each tool has:
- Vendor, priority tier (P0/P1), description
- Capability breakdown across 11 categories
- Official source references

Supports tile/list views with priority and capability filtering.

### Tool Detail Pages (`/content/[toolId]`)
Deep-dive pages for each tool with full capability accordion and source citations.

### Compare Tools (`/content/compare`)
Side-by-side comparison of any combination of the 12 tools:
- Benchmark data (Arena ELO, quality index, speed, price, context window)
- Capability support matrix across 11 categories
- Editorial picks (best-for-X recommendations with winner + runner-up)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| AI | Anthropic Claude SDK |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Testing | Vitest |
| Validation | Zod 4 |

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To use the chat feature, create a `.env.local` file:
```
ANTHROPIC_API_KEY=your-key-here
```

---

## What's Next

These are the remaining pieces before launch:

1. **Real course content** — Module text, lesson scripts, and topic breakdowns from Instructor need to replace the current placeholder data
2. **Tutor knowledge base** — The AI assistant needs to be grounded in final course material so answers are accurate and cited
3. **Tool data refresh** — Verify the 12 tool profiles are current (AI landscape moves fast)
4. **Authentication** — Production access control beyond demo mode
5. **Deployment** — Set up hosting (Vercel or similar) and connect the domain

---

## Input Needed from Instructor

- **Module 1 content**: Final lesson titles, topic descriptions, and any slide text you want referenced in the landing page preview
- **Course voice/tone**: Should Tutor sound formal-professional or warm-conversational? Current vibe is warm but neutral
- **Tool priority**: Are the 12 tools and their P0/P1 tiers still accurate for what you're teaching?
- **Landing page copy**: The hero text reads *"Learn to work with AI assistants"* — confirm or suggest alternatives
- **Additional modules**: When Module 2+ content is ready, the landing page and Tutor can be updated to cover them

---

## Project Structure

```
src/
  app/
    page.tsx          # Landing page
    chat/page.tsx     # Tutor chat (access-gated)
    content/
      page.tsx        # Content library index
      [toolId]/       # Individual tool detail pages
      compare/        # Side-by-side comparison
    api/              # API routes (chat backend)
  components/         # 15 React components
  lib/                # Content loading, types, utilities
```

---

Built by the Sample Academy engineering team.
