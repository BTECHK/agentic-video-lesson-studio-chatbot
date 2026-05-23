# Codified Lesson Pipeline — Build Handoff

**Branch:** `feat/codified-lesson-pipeline`
**Design:** `docs/superpowers/specs/2026-05-23-codified-lesson-pipeline-design.md`
**Research:** `.planning/research/ai-lesson-pipeline-research.md`, `.planning/research/studio-timeline-ui-spec.md`
**Status:** Phases A, B, C-1, **C-2, D complete** (262/262 tests). **Phase E ⬅ NEXT.** F, G remaining.

## The vision (one line)
Outline → script (Instructor's voice) → animation → free/local AI voiceover → MP4 — fully codified so any
layer regenerates surgically without re-recording. Humans give direction + review via a control plane.

## Pipeline data flow (current state)
```
content/lessons/module-1/
  outline.json   ✅ authored (7 sections, 9 beats)        [OUTLINE-01]
  → script.json  ✅ generated, fact-checked (0 flags)      [SCRIPT-01/02]  scripts/generate-script.ts
  → lesson.json  ✅ planned, LessonSchema-valid, narration  [PLAN-01]       scripts/plan-lesson.ts
  → module-1-silent.mp4 ✅ C-2 renders (out/, 248.79s/1080p, gitignored)    LessonVideo
  → audio/*.wav  🟡 Phase D code ready (adapter+sidecar); NOT yet generated (needs docker build tts + model dl)
  → align/*.json ⬜ Phase E
  → module-1.mp4 ⬜ Phase E (silent video + synced audio + captions)
```

## Key files built
- `content/schemas/{outline,script}.ts`, `narration` on `lesson.ts`
- `src/lib/{grounding,fact-check,script-prompt,scene-planner}.ts`
- `scripts/{generate-script,plan-lesson}.ts`
- `content/teaching/STYLE.md` (Instructor voice), `content/teaching/transcripts/*` (corpus)
- Tests: `test/{pipeline-schemas,script-pipeline,scene-planner}.test.ts`

---

## Phase C-2 — Remotion scene components + LessonVideo  ✅ DONE (81dea56)
Delivered: `src/compositions/lesson-scenes/` (shared.tsx primitives + register.ts +
9 components) + `LessonVideo.tsx` (`<Series>` timeline, `lessonMetadata` calculateMetadata),
registered in `Root.tsx`. All 9 scenes visually verified via
`tsx scripts/render-lesson-stills.ts`; full silent MP4 renders (248.79s/1080p).
Known gap: tool-card monograms use first letter (ChatGPT/Claude both "C") — wants real
logo assets in `public/`. Original task spec preserved below.

**Goal:** lesson.json renders to a silent MP4. **QUALITY-SENSITIVE** — honor the P0 animation bar
(Apple/Anthropic, spring physics, no choppy transitions). Use the `frontend-design` skill + visual
verification (VERI-01..04), and the design system in `Claude design work in session-SampleAcademy/`
(scene catalog: `.../animated-lesson-skill/references/03-scene-catalog.md` — has per-scene beats,
durations, and visual notes for every type).

Tasks:
1. Build data-driven components reading `scene.content` for the 9 Module 1 types: `cover`, `quote-card`,
   `preview-band`, `journey-map`, `tool-card-reveal`, `capability-table`, `feature-grid`, `recap-grid`,
   `assignment-list`. (Existing `src/compositions/scenes/*` are hardcoded for PlatformWalkthrough — not reusable as-is, but copy the spring/brand patterns from `TitleCard.tsx` + `src/brand/tokens.ts` + `src/lib/animations.ts`.)
2. Register each via `registerSceneComponent` (`src/lib/scene-dispatcher.ts`).
3. `src/compositions/LessonVideo.tsx`: load lesson.json, render scenes with `<Series>`/`<Sequence>`
   (each scene `duration` frames), dispatch by type. Add to `src/Root.tsx` with `calculateMetadata`
   computing `durationInFrames` from lesson.json (research §4, remotion.dev/docs/dynamic-metadata).
4. Brand: Syne, #EDE8E3 base, #8B2635 accent, 4px radius. Capability-table cells: B=Best(accent pill),
   Y=Yes(neutral), L=Limited(faint), -=dash (per scene-catalog line 191).
5. Render silent draft: `npm run render -- LessonVideo out/module-1-silent.mp4` (verify, screenshot).

## Phase D — Free/local TTS sidecar + adapter  ✅ DONE (4f8933d)  [VOICE-01]
Delivered: `docker/tts/` (Kokoro-82M sidecar, `Dockerfile.tts`), `src/lib/tts-adapter.ts`
(injectable runner, `selectImpl`/`sceneWavPath`/`lessonToSynthPlan`, paid slot gated by
`TTS_PAID_API_KEY`), `scripts/synthesize-lesson.ts`, 16 tests. docker-compose `tts` service +
`tts-models` volume; npm `tts:build`/`tts:lesson`.
**NOT yet run end-to-end** — to produce real audio (the Phase E input):
`docker compose build tts` then `npm run tts:lesson module-1` (first run downloads the model).
Original task spec preserved below.

**Goal:** narration text → per-scene wav, free/local, commercial-safe. Needs Docker + model downloads.
- `docker/tts/`: Python sidecar. **Kokoro-82M (Apache-2.0)** as the branded neutral default;
  **Chatterbox (MIT)** for the Instructor-clone upgrade (needs a clean ~15s Instructor reference clip — extract
  from a workshop recording on Drive). Do NOT use XTTS-v2 / F5-TTS (non-commercial weights).
- `src/lib/tts-adapter.ts`: interface `synthesize(text, voice) -> wavPath`; impls: kokoro, chatterbox,
  and a `paid` slot (ElevenLabs/OpenAI) gated behind an env key (no subscription by default).
- Per-scene output `content/lessons/<id>/audio/scene-<id>.wav` (per-scene = the cache granularity that
  enables surgical regeneration — research §6).

## Phase E — Alignment + timing inversion + captions → MP4  ⬅ NEXT  [VOICE-02/03]
**Gating step first:** generate Phase D audio (`docker compose build tts` → `npm run tts:lesson module-1`)
so `content/lessons/module-1/audio/scene-*.wav` exist. Then wire `<Audio>` per scene into
`LessonVideo.tsx` (the silent composition is built and renders).
- `src/lib/aligner.ts` via **stable-ts `align()`** (MIT) over (narration text, wav) → word timestamps.
  Write to `scene.narration.words` (schema already supports it). Fallback: `@remotion/install-whisper-cpp`.
- Timing inversion: replace estimated `duration` with measured audio length (ceil to frame), keep the
  per-scene-type min floor, recompute contiguous `start` + `lesson.duration`, re-validate LessonSchema.
- Captions: convert words → `@remotion/captions` `Caption[]` (`timestampMs=(startMs+endMs)/2`), render
  per scene with `createTikTokStyleCaptions`. Add `<Audio>` per scene `<Sequence>`.
- **Deliverable: `out/module-1.mp4`** with synced narration + captions (the review artifact). Validate
  size <1.8GB / 1080p / no blank frames (existing Phase-1 checks).

## Phase F — Regeneration DAG  [FRESH-01/02/03]
- `src/lib/build-dag.ts` (~150 LOC): each artifact = `{id, inputs[], output, run()}`; cache key = SHA-256
  of input hashes + step version. **Content hashes, not mtime** (WSL2/Docker mounts). Cache PER SCENE
  for TTS/align so editing one tool feature regenerates only affected scenes, then re-splice.
- `scripts/regenerate.ts <lessonId>` with fresh/stale/error reporting.

## Phase G — Studio control plane  [CTRL-01/02/03]
- New "Studio" tab in `chatbot/` (Next.js 19, **inline-styled components + CSS-variable tokens — no
  Tailwind/shadcn**, matching existing convention). Full UI contract: `studio-timeline-ui-spec.md`.
- 4 parallel tracks (animation thumbnails / voiceover waveform / script blocks / caption pages) on one
  shared time axis; synced playhead; click-to-isolate inspector + comment (AI-delegated edits, no
  in-app editing); fresh/stale/error badges; set-and-forget default.
- Hand-build timeline with absolutely-positioned divs; **wavesurfer.js (BSD-3)** for waveforms only.

## Constraints to keep honoring
- No paid services (P0): all TTS/align tools chosen are MIT/Apache/BSD + commercial-OK.
- Official sources only: fact-check gate already enforces grounding; keep it in the loop.
- TDD + audit integrity (P0): tests before impl; never report a phase complete without passing tests +
  (for visual phases) human-verified screenshots/MP4.
- Container-first: TTS/align run as Docker sidecar; Remotion render in existing container.
