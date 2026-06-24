# Completion Contract & Acceptance — Full Course Planning Artifacts

> Done is proven by artifacts + a consistency validator + an independent Codex review — not by assertion.

## Completion Contract (all six)
1. Files changed — exact paths. 2. Validator run — `node course-planning/validate.mjs` output. 3. Each AC MET/UNMET with evidence. 4. Artifact proof (the generated planning files). 5. Remaining risks. 6. Independent Codex review PASS (on the Windows box via `--dangerously-bypass + </dev/null`; on env-death → `awaiting_codex_review`).

## Acceptance criteria

- **AC-A (permanent system exists).** `course-planning/` contains: `00-START-HERE.md`, `VIDEO-PRODUCTION-BIBLE.md`, `contracts/` with all 6 shared contracts (scene-contract.schema.json, motion-contract.md, render-contract.md, asset-manifest.md, interactive-mandate.md, scene-type-catalog.md) + brand-tokens-ref.md, `_templates/` (3 templates), and `validate.mjs`. The render-contract records the FaceliftV2 settings (scale 2, crf ≤18, BT.709, faststart). The scene-type-catalog lists the 17 real registered types. — proof: `ls -R` + grep.

- **AC-B (every lesson planned).** For ALL 7 lessons (Topic 0:1, 1:5, 3:1) there is a `course-planning/lessons/topic-N/lesson-N.M/` dir with `LESSON-PLAN.md` + `scene-contract.json` + `storyboard.md`. Count = 7 lesson dirs, 21 lesson files. — proof: `find course-planning/lessons -name LESSON-PLAN.md | wc -l` = 7, etc.

- **AC-B2 (grounded, not invented).** Each LESSON-PLAN.md states its outline source (lesson number + the outline beats it derives from). Built lessons reference the existing `content/lessons/*` and don't contradict it; unbuilt lessons derive from `course-outline.txt`. Spot-check: a sampled lesson's beats/timings match the outline. — proof: grep "Outline source" across all lessons + a sampled cross-check.

- **AC-B3 (interactive mandate honored).** Every lesson whose outline has a Demo / in-tool / "show side-by-side" beat assigns an INTERACTIVE scene type (screen-flow / tool-demo / comparison-chats / voice-demo / setup-checklist / tool-card-reveal) for that beat in its scene-contract.json — NOT a static slide. — proof: for each demo-bearing lesson, the scene-contract contains an interactive sceneType; a grep/validator check.

- **AC-B4 (valid scene contracts — DESIGN altitude).** Every `scene-contract.json` parses, and every `sceneType` is one of the 17 registered types in `src/compositions/lesson-scenes/register.ts`. No invented types. These are **design-altitude** specs (sceneType + copy intent + timing + interaction), NOT production render inputs — that's deliberate (Design reviews design; the build step produces the strict `lesson.json`). — proof: `validate.mjs` output.

- **AC-B5 (planning→render path is explicit).** `contracts/planning-to-render.md` exists and states the two altitudes + the build-time mapping to the renderer's strict per-type `content` schema (`content/schemas/scene-types.ts`), with the required-content table per sceneType so Design improves toward renderable shapes. The catalog + 00-START-HERE point at it. (Reconciles the Codex finding that the loose `copy` shapes don't render as-is — the conversion layer is now specified, not implied.) — proof: the file + grep for the per-type table + the pointers.

- **AC-C (walkthrough sizzle plan).** `course-planning/platform-walkthrough-sizzle/` has a LESSON-PLAN.md + scene-contract.json + storyboard.md planning a platform tour covering: the content pipeline, the Tutor chatbot, and the student experience, grounded in `output/video/platform-walkthrough.mp4` (~60s). — proof: the files + grep for those three subjects.

- **AC-D (zip at root).** `full-course-planning-artifacts.zip` exists at repo root, contains `course-planning/` (incl. HTML if any, excl. MP4/audio), and unzips clean. — proof: `unzip -l` summary + size.

- **AC-E (rationale for Design).** Artifacts carry "Why/Intent" notes (Claude Design has no repo context). — proof: grep "Why" / "Intent" across the lesson plans + contracts.

- **AC-F (consistency validator).** `node course-planning/validate.mjs` exits 0: all scene-contracts parse, all sceneTypes valid, all lesson dirs have the 3 files, every storyboard references its scene-contract scene ids. — proof: command output.

## Test plan
`node course-planning/validate.mjs` (the consistency gate) ; `find`/`grep` counts for AC-A/B/B2/B3/E ; `zip`/`unzip -l` for AC-D ; one Codex adversarial review of the package against this contract.
