# Sample Academy — AI Learning Platform

An interactive companion platform for **Sample Academy**, a learner-focused AI education company teaching professionals how to use AI tools effectively.

This platform gives students an AI teaching assistant, a curated reference library of 12 AI tools, and side-by-side comparison tools — all designed to supplement the animated video lessons delivered through Teachable.

---

## What's Built

### Landing Page

The main entry point. Hero section with course tagline, Module 1 topic preview, and cards linking to each platform feature.

![Landing Page](docs/screenshots/01-landing-full.png)

---

### Ask Tutor (AI Teaching Assistant)

**Tutor** is the course's AI assistant, powered by Claude. Students ask questions about course material and get answers grounded in the actual content with source citations. Access-gated with a demo mode for visitors.

![Tutor Access Gate](docs/screenshots/02-chat-gate.png)

---

### Content Library (12 AI Tools)

A browsable repository of the 12 AI tools covered in the course. Each tool has a vendor, priority tier (Essential vs. Supplementary), description, and a breakdown across 11 capability categories. Supports tile and list views with filtering by priority and capability.

**Tools tracked:** ChatGPT, Claude, Claude Code, Codex, Comet, Cowork, DeepSeek, Gemini, Grok, Manus, Perplexity, Qwen

![Content Library](docs/screenshots/03-content-library.png)

---

### Tool Detail Pages

Click any tool to see its full profile: capabilities grid, feature counts per category, and expandable details with official source references.

![Tool Detail — Claude](docs/screenshots/05-tool-detail.png)

---

### Compare Tools

Side-by-side comparison of any combination of tools. Includes benchmark data (Arena ELO, quality index, speed, pricing, context window) and a capability support matrix across all 11 categories. Editorial "best for X" recommendations at the bottom.

![Compare Tools](docs/screenshots/04-compare.png)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| AI Backend | Anthropic Claude SDK |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Testing | Vitest |
| Validation | Zod 4 |
| Brand | Syne font, warm linen palette (#EDE8E3), burgundy accent (#8B2635) |

---

## Project Structure

```
chatbot/                    # The Next.js web application
  src/
    app/
      page.tsx              # Landing page
      chat/page.tsx         # Tutor chat (access-gated)
      content/
        page.tsx            # Content library index
        [toolId]/page.tsx   # Individual tool detail pages
        compare/page.tsx    # Side-by-side comparison
      api/                  # API routes (chat backend)
    components/             # 15 React components
    lib/                    # Content loading, types, utilities

content/                    # Tool data (JSON files for all 12 tools)
  tools/                    # Individual tool profiles
  sources/                  # Official source references

docs/screenshots/           # Platform screenshots (used in this README)
```

---

## Running Locally

```bash
cd chatbot
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To enable Tutor (the chat feature), create `chatbot/.env.local`:
```
ANTHROPIC_API_KEY=your-key-here
```

---

## Current Status

| Feature | Status |
|---------|--------|
| Landing page | Done |
| Tutor chat (AI assistant) | Done |
| Content library (12 tools) | Done |
| Tool detail pages | Done |
| Compare tools | Done |
| Navigation + routing | Done |
| Brand system (Syne, palette, radius) | Done |
| Access gate (demo + student modes) | Done |
| Animated video lessons (Remotion) | Separate workstream |

---

## What's Next — Input Needed from Instructor

### Content to Provide
- **Module 1 final content** — Confirm or update the 5 topic titles shown in the landing page preview. Provide final lesson scripts if available.
- **Additional modules** — When Module 2+ content is ready, the landing page and Tutor can be extended.
- **Tool priority check** — Are the 12 tools and their Essential/Supplementary tiers still accurate for what you're teaching?

### Decisions Needed
- **Landing page copy** — The hero reads *"Learn to work with AI assistants."* Confirm or suggest alternatives.
- **Tutor's voice** — Should the AI assistant sound formal-professional or warm-conversational? Currently warm but neutral.
- **Domain + hosting** — When ready to go live, we'll need to pick a hosting provider and connect the domain.

### Not Yet Started
- Production authentication (beyond demo mode)
- Student progress tracking
- Deployment to production

---

Built by the Sample Academy engineering team.
