---
title: Architecture & Tooling Decisions (ADR log)
type: concept
updated: 2026-06-09
tags: [architecture, tooling, decisions, adr, video, gates, stakeholder]
related: [[codified-lesson-pipeline]], [[studio-generate]]
---

# Architecture & Tooling Decisions (ADR log)

The running list of **why we chose each tool and architecture** — so anyone (including
stakeholders asking "why this and not that?") can see the reasoning, not just the result.
New decisions get appended here; nothing is deleted, only superseded.

---

## ELI5 — how the whole thing works

**The product:** you give the system an outline; it writes the lesson, narrates it, and renders
a finished animated video — without anyone re-recording anything. A web "studio" (the chatbot
Tutor + a content console) is the control panel.

**How a prompt becomes a video:** `outline → lesson-plan → script → voiceover (TTS) → timing →
render → MP4`. It's all **data**: change the data and only the affected part re-renders. The video
is built from **code** (React components via Remotion), not hand-edited in a timeline.

**How we know the video is good:** three automatic "gates" check every finished lesson —
**A) is it accurate** (every tool claim checked against official docs), **B) does it actually
teach** (checked against the lesson plan), **C) does the finished video work when watched**
(a model literally watches the MP4). A lesson can't be called done until all three are green; a
human still makes the final publish click.

**Who does the checking:** **Claude Code itself** is the "judge" — it runs on the laptop using
the logged-in session, so there are **no API keys and no per-use cost**. Other models (Gemini) are
only used as cheap "sensors" (transcribe audio, flag suspicions); they never get the final say.

**Stakeholder sizzle reels** (a parallel track): record the real app doing the work (screen capture),
hard-cut to the finished lesson video, and assemble it — again **as code** (Remotion) — into both
a tall TikTok/Reels version and a wide YouTube version from one source.

---

## Decision register

### ADR-001 — Claude Code is the generation + review engine (not the paid API)
- **Decision:** Generation and gate-judging run through **headless `claude -p`** using the host's
  logged-in Claude Code session (no `ANTHROPIC_API_KEY`).
- **Why:** zero per-use cost / no key management (a hard project constraint); one engine for both
  writing content and judging it; runs anywhere the dev does.
- **Rejected:** Anthropic API directly (cost + key/pricing management we're not ready for); making a
  sensor model the judge (see ADR-002).
- **Status:** Active. Proven in `chatbot/src/lib/llm/claude-code-provider.ts`, `src/lib/claude-judge.ts`.

### ADR-002 — Sensors vs. judge: Gemini/Groq sense, Claude + official docs judge
- **Decision:** Cheap models (Gemini) only **transcribe + flag**; **Claude + the official-doc
  accuracy-sweep are the authoritative reviewer.**
- **Why:** model-as-judge is unreliable — during the dual-path proof Gemini wrongly claimed "Claude
  generates images." Sensors are swappable via `scripts/review-providers.json` with zero gate-code change.
- **Rejected:** trusting a single multimodal model's verdict.
- **Status:** Active.

### ADR-003 — Three-gate Definition of Done + enforced status, human publish
- **Decision:** A lesson is done only when **Gate A (fidelity/provenance/freshness)**, **Gate B
  (teaching axis)**, and **Gate C (watch the MP4)** are all green (`npm run gate:status` exits 0 only
  then). Verdicts are automated; the **publish click stays human**.
- **Why:** schema/render/audio checks pass content that is correct but doesn't teach, or a render
  with garbled text. The gates add the teaching axis and a working-video proof. Caught a real
  wrong-video bug and (later) typography defects that mechanical checks missed.
- **Rejected:** auto-publish on green (keeps a human in the loop for production-grade output).
- **Status:** Active. `src/lib/gate-status.ts`, `gate-lesson.ts`, `gate-review.ts`. Layout gate pending (#73).

### ADR-004 — Video is rendered from code (Remotion), not edited in a timeline
- **Decision:** Both lessons and stakeholder reels are **Remotion** compositions rendered to MP4.
- **Why:** versioned + diffable + re-renderable; on-brand by construction; multi-format from one source;
  "Claude does the editing" becomes real because editing = code Claude writes.
- **Rejected:** CapCut + MCP (unofficial, needs the VectCutAPI backend, still a manual export, less
  control than code we already run); Arcade/Supademo (hosted SaaS, not OSS/local, off-brand, can't fold
  in our own rendered MP4); Revideo (a strong fit for *future* batch pipelines, but we already run Remotion).
- **Status:** Active. See #74.

### ADR-005 — Stakeholder reel capture: Playwright (+ OpenScreen for hero takes)
- **Decision:** Capture the real app with a **Playwright** script (Claude-written) that drives
  localhost and records natively; use **OpenScreen** (free/OSS, MIT, Windows, auto-zoom) for
  manual hero beats that want a real-cursor feel.
- **Why:** hands-off + repeatable (identical takes), no paid tool; OpenScreen adds polish where a human
  cursor matters.
- **Rejected:** purely manual recording (not repeatable); auto-zoom recorders *alone* (no kinetic text,
  no multi-format — that's the Remotion assembly layer).
- **Status:** Planned (#74).

### ADR-006 — Course-map compiled from the committed outline extraction, not live DOCX parsing
- **Decision:** `scripts/compile-course-map.ts` parses the committed `course-outline.txt` (the extracted
  form of Instructor's DOCX) into `content/curriculum/course-map.json`.
- **Why:** the `.txt` is the committed, diffable source of truth; avoids a fragile DOCX-parsing dependency.
  Trade-off: per-row delivery-type **color** is lost in extraction → rows are `unspecified` (documented,
  not faked). DOCX→txt is a manual upstream step.
- **Status:** Active. `src/lib/course-map.ts`.

### ADR-007 — Layout integrity is checked by measuring the DOM (Remotion = real DOM)
- **Decision:** Add a `gate:layout` pre-check that measures the rendered DOM at sampled frames and fails on
  clipping / out-of-safe-area / overlap — the way web teams use overflow + visual-regression tests.
- **Why:** the watch gate judges meaning; geometry defects (clipped glyphs, overlap) are caught more
  reliably and cheaply by measurement. Only possible because our finished video is real HTML/DOM.
- **Status:** Planned (#73).

### ADR-008 — Verification is engine-agnostic (any agent, incl. ChatGPT Codex, can run it)
- **Decision:** The gates are split into **deterministic parts** (npm scripts, Vitest tests,
  `gate:status`, the sensors/collectors, the planned layout gate — all plain Node/CI, no Claude
  dependency) and a **pluggable judge step**. The judge artifacts (extracted frames as images, the
  transcript, the judge-prompt, the checklist) are plain files on disk.
- **Why:** any agent or CI can run the deterministic checks and independently verify; the "judge" can be
  Claude Code headless **or** any other vision-capable agent reading the same on-disk frames + markdown.
  No lock-in to one model for verification.
- **Status:** Active.

---

## Where things live (so we don't lose track)
- **Architecture/tooling decisions:** this page (the running ADR log).
- **Fast working memory / recent gotchas:** `learnings.md` (graduates here when mature).
- **Code-level decisions (D-01…):** `.planning/DECISIONS.md`.
- **Plans + state:** `.planning/` (`ROADMAP.md` and the latest `SESSION-HANDOFF.md`), GitHub Issues board (authoritative status).
