# 00 — START HERE (Claude Design handoff)

> **Read this first.** This package is the planning layer for the Sample Academy video course —
> **everything except the rendered MP4s and the recorded voiceover.** It was produced by Claude Code from
> the course outline. In this sample copy it ships one fully planned worked example (Lesson 1.1). **Your job (Claude Design): review and improve these
> planning documents** — tighten the pedagogy, sharpen the scene choices, push the visual/interaction
> design — and hand them back. Claude Code then renders the videos from the (improved) scene contracts.
>
> **Important context:** Claude Design is a separate system without this repo's history. So every
> artifact carries short **"Why / Intent"** notes explaining the reasoning behind a decision — review
> with that reasoning visible. When a choice needs a human call, it's in an **`openQuestions` / §5
> "Open"** list rather than guessed.

## What's in here
```
course-planning/
  00-START-HERE.md             ← you are here
  VIDEO-PRODUCTION-BIBLE.md     the 10 grounding artifacts + the deterministic-pipeline philosophy
  contracts/                    SHARED, course-wide — the permanent pipeline contracts
    scene-type-catalog.md       the 17 scene components you can use (the ONLY valid sceneTypes)
    interactive-mandate.md      "not a slideshow" — when/how to animate click-throughs + agent builds
    motion-contract.md          easing library + timing (pins the curve, not just the start frame)
    render-contract.md          fps / scale 2 / crf 18 / BT.709 / faststart (the output spec)
    asset-manifest.md           fonts / logos / audio — local + checksummed
    brand-tokens-ref.md         immutable color/type/spacing (mirror of src/brand/tokens.ts)
    scene-contract.schema.json  the JSON schema each lesson's scene-contract.json follows
    planning-to-render.md       how the design-altitude plans map to the strict render schema (READ THIS)
  _templates/                   the per-lesson templates (LESSON-PLAN / scene-contract / storyboard)
  lessons/topic-1/lesson-1.1/   the worked sample lesson — 3 files (plan, contract, storyboard)
  validate.mjs                  consistency gate (run: node course-planning/validate.mjs)
```

## The sample course (*Practical AI Assistants*)
| Topic | Lessons | Status in this package |
|---|---|---|
| 0 — Welcome | 0.1 Welcome to the Sample Course | not planned here |
| 1 — Getting Started with AI Assistants | 1.1 How This Course Works · 1.2 Picking the Right Assistant · 1.3 Writing Clear Prompts · 1.4 Checking the Output · 1.5 Making the Assistant Yours | **1.1 designed from outline** — the worked example; 1.2–1.5 not planned here |
| 3 — Automating Everyday Work | 3.1 Mapping a Repetitive Task | not planned here |

Add a lesson by copying `_templates/` into `lessons/topic-N/lesson-N.M/` and adding it to `EXPECTED` in
`validate.mjs`.

`buildStatus` in each `scene-contract.json` tells you `built` (derived from a real rendered lesson —
treat as source-of-truth) vs `designed-from-outline` (a fresh draft — most open to your improvement).

> **Altitude (important):** these `scene-contract.json` are **design-altitude** — `sceneType` + copy
> *intent* + timing + interaction. They are NOT the production render input; the renderer validates a
> stricter per-type `content` schema, and Claude Code maps the *approved* plan into that validated
> `lesson.json` at build time. **Read `contracts/planning-to-render.md`** — it has the real per-type
> target shapes so your improvements stay renderable. Improve the design; the build step handles the
> strict schema.

## How to read one lesson
1. `LESSON-PLAN.md` — the brief (objective, timed beats from the outline), the journey cascade
   (pedagogy), the scene-breakdown table, and the animation notes. This is the human-facing plan.
2. `scene-contract.json` — the machine-readable scenes Claude Code renders from. `sceneType` +
   `start`/`duration` (frames @30fps) + `copy` + `motion` + `interactionNotes`.
3. `storyboard.md` — the key pose per scene (the visual sign-off).

## How to improve them (the rules that keep it renderable)
- **Keep `sceneType` to the 17 in `scene-type-catalog.md`.** If a beat genuinely needs a component that
  doesn't exist, flag it as a *new-component request* — don't invent a string (the validator rejects it).
- **Honor the interactive mandate.** Demo / in-tool / side-by-side / "build a…" beats must use an
  interactive type (`screen-flow`, `tool-demo`, `comparison-chats`, `voice-demo`, `setup-checklist`) and
  describe the interaction — never a static slide.
- **Scope comes only from the outline.** Improve *how* a lesson teaches; don't add scope that isn't in
  the outline (`.planning/curriculum/source-materials-extracted/course-outline.txt`, compiled to
  `content/curriculum/course-map.json`).
- **Stay on brand.** Lessons = Syne 700; the sizzle = Playfair headlines + Syne chrome. Colors/spacing
  from the tokens. Linen + crimson; 4px radius; flat cards.
- After edits, `node course-planning/validate.mjs` must stay green (all scene-contracts parse, all
  sceneTypes valid, every planned lesson present, storyboards reference their scene ids).

## Open questions to resolve with Instructor (collected from the lesson `openQuestions`)
- 1.1 `up-next`: `preview-band` has no sub line in the render schema — keep the "bring your task" reminder
  narration-only, or file a small component request (non-blocking).

## What's NOT here (by design)
The rendered MP4s and recorded voiceover. This is the planning layer only. Claude Code renders from the
scene contracts after your review.
