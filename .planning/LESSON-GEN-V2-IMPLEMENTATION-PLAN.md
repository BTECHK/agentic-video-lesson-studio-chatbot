# Lesson Generation v2 — Implementation Plan

**Date:** 2026-06-05 · Owner: technical lead · Maps to issue **#68**
**Objective (unchanged):** act on Instructor's feedback (the v1→v2 build-feedback docs + the section/HTML
material) so lesson generation **teaches**, not just populates — and prove every finished lesson works
before it ships.

This plan turns the pieces assembled today into changes in the **actual codebase, structure, and
operating procedure**. It's the bridge from "skills + gate exist as docs/tools" → "the pipeline runs
on them."

---

## 1. Recap — what we did today

| Area | Done | Where |
|---|---|---|
| **Reviewed Instructor's feedback** (v1→v2 reframe) | Diagnosis captured: the lesson-planning reframe | the project state notes, staging docs |
| **Authoring skills installed** | `slide-deck`, `accuracy-sweep` (Instructor's), `animated-lesson` (custom), `lesson-plan` (new) | `.claude/skills/` (tracked) |
| **Input separation** | Only the outline sets scope; enrichment is support; philosophy builds the journey | `lesson-plan/references/` |
| **Watch gate — security-reviewed** | `watch` skill audited line-by-line (SAFE), installed | `.claude/skills/watch/`, `.planning/verification/2026-06-05-watch-skill-security-review.md` |
| **Definition of Done** | 3 gates: A fidelity/provenance/freshness · B teaching axis · C watch | `.planning/curriculum/LESSON-DEFINITION-OF-DONE.md` |
| **Both review paths PROVEN on a real MP4** | Claude-native frames + Gemini audio+video; both caught real defects | `.planning/verification/2026-06-05-watch-gate-dual-path-proof.md`, `scripts/gemini-watch.py` |
| **Toolchain shared with Instructor** | skills tracked in git; remotion added to `skills-lock.json`; ffmpeg/yt-dlp installed | pushed to `master` |

**The headline proof:** on `topic-1-lesson-1.mp4` the gate caught a leaked authoring instruction, TTS
mispronunciations ("Perplexity"→"sophistication"), and a stale tool claim — defects that schema/render/
audio checks all passed over. That is exactly the failure mode Instructor flagged.

---

## 2. The gap to close

The **tools** exist; the **pipeline doesn't run on them yet**. Today the gate is a doc + two scripts a
human invokes. To hit the objective it must become an enforced, repeatable step in how lessons are made.

```
NOW:   outline → (skills, run ad hoc by a human) → MP4 → (gate run manually)
TARGET: course-map.json → lesson-plan → deck/animation → script → MP4 → [Gate A·B·C auto] → publish
```

---

## 3. Phased plan

### Phase 1 — Lock the authoring spine (the lesson-plan step) · *small*
**Goal:** every new lesson starts from a `lesson-plan.md`, not the outline directly.
- Use `lesson-plan` to produce `content/lessons/<id>/lesson-plan.md` for Topic 1 lesson 1 (re-plan
  the existing draft) — proves the skill end-to-end and gives a reference artifact.
- Add the lesson-plan as a required input in `STRATEGY.md`'s human→machine gate.
- **Verify:** the re-planned lesson's blocks each map to an outline row id; meta-commentary like the
  one the gate caught cannot exist (it's not in the plan).

### Phase 2 — Provider abstraction for transcription/review · *small, unblocks flexibility*
**Goal:** one config point for "who transcribes / who reviews," so we can swap Gemini → specialized
later without touching the gate. (Directly answers the key-flexibility ask.)
- Add `scripts/review-providers.json` (or a tiny TS/py module) describing each backend:
  `{ id, kind: transcribe|multimodal, keyEnv, model, endpoint?, notes }`.
  - `gemini-voice` → `GOOGLE_VOICE_API_KEY`, `GOOGLE_MODEL`
  - `gemini-chatbot` → `GOOGLE_CHATBOT_API_KEY`
  - `groq-whisper` → `GROQ_API_KEY` (when/if added)
  - `openai-whisper` → `OPENAI_API_KEY`
  - room for `premium-*` (production specialized key) with per-key "special considerations"
- `gemini-watch.py` already reads a prioritized key list + `--key-env`; generalize it to read this config.
- **Verify:** `gemini-watch.py --provider gemini-voice` works; adding a stub `premium` entry requires
  zero code change.

### Phase 3 — Wire Gate C into the pipeline · *medium*
**Goal:** the watch gate runs as a real step, not a manual command.
- Add `npm run gate:lesson -- <id>` that: runs `watch.py` (frames) **and** `gemini-watch.py`
  (transcript) on `out/<id>.mp4`, then has Claude produce `content/lessons/<id>/review/watch-gate.md`
  using the DoD checklist. (Hybrid: Gemini = sensor, Claude = judge.)
- Fold the existing `verify:render` (non-blank frames) into Gate C as the cheap pre-check.
- **Verify:** running it on `topic-1-lesson-1.mp4` reproduces today's findings into a written verdict.

### Phase 4 — Enforce the three gates as "done" · *medium*
**Goal:** a lesson can't be marked done/published until A·B·C are green.
- Gate A: wrap `accuracy-sweep` into `npm run gate:accuracy -- <id>` → `FACT-CHECK-REPORT.md`.
- Gate B: teaching-axis checklist verified against `lesson-plan.md` → `review/teaching-axis.md`.
- Surface the three gate statuses in the **console/studio** lesson view (fresh/stale/error already
  exists there — add gate badges). Block the "publish/Teachable export" action until 3× green.
- **Verify:** a lesson with a known defect (e.g. today's) shows Gate C red and cannot publish.

### Phase 5 — Course-map compiler (the #68 core) · *larger*
**Goal:** the outline DOCX becomes a versioned, diffable `course-map.json` (topic→lesson→row→delivery
type→objective) that drives everything upstream.
- `scripts/compile-course-map.ts`: DOCX → `content/curriculum/course-map.json`.
- The lesson-plan + brief read row ids from it; the gates check fidelity against it.
- **Verify:** every Topic-1 lesson plan's row ids resolve in `course-map.json`.

---

## 4. Key & provider strategy (now → production)

- **Now (dev, free):** Gemini via existing `GOOGLE_VOICE_API_KEY` for transcription/flagging; Claude for
  judgment; **no Groq key needed**. Frames path needs no key at all.
- **Production:** swap the transcription provider to a specialized/paid key for highest quality via the
  Phase-2 config — **no gate code changes**. Each provider entry carries its own "special considerations"
  (rate limits, endpoint, auth quirks). Grok/Groq/OpenAI/premium are all just config rows we can add later.
- **Secret handling:** keys stay in the environment (or 1Password shared vault → `op run`), never in the
  repo. Already true today.

---

## 5. How this achieves the original objective

Instructor's feedback was: *enrichment was driving scope, and nothing checked whether the lesson teaches.*
- **Input separation + lesson-plan** stop enrichment from setting scope (Phase 1).
- **Teaching axis (Gate B)** checks it teaches, against the plan (Phase 4).
- **Watch gate (Gate C)** proves the finished video actually works — and already caught real defects no
  prior check would (proven today).
- **Course-map (Phase 5)** makes the outline the single, versioned source of truth.

Sequence to ship: **Phase 1 → 2 → 3** gets the teaching axis + working-proof enforced on the next
lesson; **4 → 5** scale it across the course. Phases 1–3 are small and unblock the rest.
