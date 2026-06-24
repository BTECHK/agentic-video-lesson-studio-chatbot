# PLAN — Full Course Planning Artifacts (Claude Design handoff)

**Goal:** produce, for the WHOLE course, the planning artifacts that ground a deterministic,
interactive video pipeline — everything *except* the MP4 and the recorded voiceover — so Claude
Design can review/improve them and Claude Code can render. Plus the platform-walkthrough sizzle
plan. Package + zip to root for upload. Make the grounding contracts a permanent part of the pipeline.

## Source of truth
- **Outline (definitive scope):** `.planning/curriculum/source-materials-extracted/course-outline.txt` (extracted from
  `original background content/sample-course-outline.docx`).
- **Taste/voice:** existing `content/lessons/*/lesson-plan.md`, `content/curriculum/course-map.json`,
  teaching transcripts, frameworks. (Influence HOW, not WHAT — scope comes only from the outline.)
- **Render capability:** `src/compositions/lesson-scenes/register.ts` (17 scene types, incl. the
  interactive ones — ScreenFlow, ToolDemo, ComparisonChats, VoiceDemo, SetupChecklist).

## Course universe (from the outline)
- Topic 0: 1 lesson (0.1)
- Topic 1: 5 (1.1–1.5)
- Topic 3: 1 (3.1)
- **7 video lessons** + the **platform-walkthrough sizzle**.

## Deliverable layout (also the permanent pipeline home)
```
course-planning/
  00-START-HERE.md            handoff guide for Claude Design (context, why, how to review)
  VIDEO-PRODUCTION-BIBLE.md   the 10 grounding artifacts explained (permanent reference)
  contracts/                  SHARED, course-wide (the permanent pipeline contracts)
    scene-contract.schema.json
    motion-contract.md        easing library + per-element timing (ported from sizzle-v3 + FaceliftV2)
    render-contract.md        fps/scale=2/crf18/BT.709/faststart (captures the FaceliftV2 render config)
    asset-manifest.md         fonts/logos/audio — local + checksummed
    interactive-mandate.md    "not a slideshow" — when/how to animate click-throughs, mock agent builds
    scene-type-catalog.md     the 17 scene types + when to use each (interactive vs data vs static)
    brand-tokens-ref.md       points at src/brand/tokens.ts (immutable)
  _templates/                 LESSON-PLAN / scene-contract / storyboard templates
  lessons/topic-N/lesson-N.M/ LESSON-PLAN.md + scene-contract.json + storyboard.md  (per lesson)
  platform-walkthrough-sizzle/ the second sizzle plan (same artifact set)
  validate.mjs                consistency check (scene-contract ↔ storyboard ↔ copy)
```

## Phases
- **A — Permanent system (orchestrator):** scaffold `course-planning/`, write the Bible, the 6 shared
  contracts (port motion/render/asset from `claude-design-delta/.../sizzle-v3-handoff/contracts/` +
  the FaceliftV2 render settings now in `scripts/render-*.ts`), the interactive mandate, the scene-type
  catalog, the 3 templates, the 00-START-HERE handoff, and `validate.mjs`. Defines the shape.
- **B — Per-lesson artifacts (PARALLEL agents, by topic):** for each of the 7 lessons, produce
  `LESSON-PLAN.md` + `scene-contract.json` + `storyboard.md` against the templates. Built lessons
  derive from the existing `content/lessons/*` (lesson.json/outline/script); unbuilt lessons
  design from the outline. Every demo/in-tool beat must specify an INTERACTIVE scene type (animate it),
  not a static slide.
- **C — Platform-walkthrough sizzle:** plan a second sizzle that tours the platform (content pipeline,
  Tutor chatbot, the student experience, everything built), grounded in `output/video/platform-walkthrough.mp4`.
- **D — Zip:** `full-course-planning-artifacts.zip` at repo root (course-planning/ minus any heavy assets;
  HTML included — it's tiny; MP4/audio excluded).

## Rationale annotations for Claude Design
Claude Design is a separate system without this repo's context. Every artifact carries a short
"**Why / Intent**" note explaining the decision behind it (per the user's instruction), so Design can
review with the reasoning visible.

## Gates
- Spec: this PLAN + ACCEPTANCE → one Codex adversarial plan review → lock.
- Verify: `validate.mjs` green + a consistency/grounding pass (checker) → one Codex review → done.
- Parallelism: fan out builders by topic (the user asked for parallel agents; it's the long pole).
