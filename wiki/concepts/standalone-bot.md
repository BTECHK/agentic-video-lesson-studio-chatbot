---
type: concept
title: "Standalone Tutor Bot"
tags: [chatbot, telegram, cloud-run, rag, architecture]
created: 2026-06-09
updated: 2026-06-09
sources: []
---

# Standalone Tutor Bot

The student-facing chatbot, separate from the internal console (`chatbot/` is the content-ops surface; this is what students actually message). Lives in `bot/` as a tiny, self-contained Node service so it can deploy independently to the cloud while the rendering pipeline stays local.

## Brain (channel-agnostic)

`content/tools/*.json` (shared source of truth) → keyword retrieval → Tutor system prompt → LLM provider → **citation hallucination guard** (drops any source the model fabricated; the "Tutor invariant"). One `respond()` serves every channel.

## Decisions (locked 2026-06-09)

- **Channel:** Telegram first — free `@BotFather` token, long-poll for local pilot (no public URL), webhook for prod — behind a thin adapter seam so Slack/WhatsApp drop in without brain changes. WhatsApp queued (Meta verification + paid BSP); Slack skipped.
- **Provider:** `LLM_PROVIDER` flag → `gemini` free tier ($0); Anthropic Haiku is the one-flag paid upgrade. `mock` for tests/dev. The old console default was `mock` — that was the canned/robotic feel Instructor reported.
- **Hosting:** Google Cloud Run, webhook-first (`*.run.app`, no domain, scale-to-zero). Oracle Always-Free VM is the documented fallback. **Only the bot** goes to the cloud — render/gates/console stay local with Claude Code; the API-key requirement is isolated to this one prod service.
- **Persona:** natural — greeting only on a conversation's first turn, varied redirects (no per-turn self-intro, no templated refusal sentence).

## Guards

Backend-only key, UNTRUSTED-DATA prompt fence, per-user rate limit (Denial-of-Wallet), output-token cap, session isolation per chat id, plain-text output (no XSS). Public bot indexes **public-safe tool data only**; when RAG-over-lessons lands, paid lesson bodies must be access-gated at retrieval time in code, never indexed into this public bot.

Related: [[studio-generate]], [[architecture-decisions]]
