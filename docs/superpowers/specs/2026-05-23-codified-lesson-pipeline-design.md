# Codified Lesson Factory — Design Spec

**Date:** 2026-05-23
**Status:** Approved for autonomous build (user pre-authorized execution; review gate at finished MP4 + control-plane interfaces)
**Author:** Technical lead + Claude
**Supersedes/promotes:** v2 requirements `VOICE-01/02/03`, `PHILO-01/02`, `SCALE-02`, `FRESH-01/02/03` → active path; `ANIM-05/08` → active. Adds new `CTRL-*` (control plane) and `STYLE/SCRIPT` requirement groups.

---

## 1. Problem & Core Value

Sample Academy produces animated AI lessons. Today a lesson is a **hand-authored, silent** Remotion composition: a human writes `lesson.json` scenes with frame durations by hand, and there is no narration. When an AI tool ships a new feature, keeping a lesson current means re-authoring — the human equivalent of re-recording.

**Core value (restated):** *A lesson is fully codified data. Change the data — a tool's capability, an outline beat, a line of script — and the affected script, animation, and voiceover regenerate surgically and autonomously, without re-recording. Humans give direction and review; AI generates everything in between.*

Instructor has now supplied **verified workshop transcripts** (`content/teaching/transcripts/`), which unblock learning the instructor's teaching voice (the thing that was blocking `PHILO-01`).

## 2. What Already Exists (do not rebuild)

- `content/{tools,sources}/*.json` + `content/schemas/{capabilities,tool,source}.ts` — **the fact source**, Zod-validated, with official-source attribution.
- `content/schemas/{lesson,scene-types}.ts` — `Lesson` schema, 14 scene types each with a content schema, contiguous-timing validator.
- `src/lib/{content-loader,scene-dispatcher}.ts` — validated load + scene-type→component registry.
- `src/compositions/scenes/*` — Remotion components (~5 of 14 scene types implemented).
- Docker render pipeline → 1080p/30fps MP4, validation, screenshots (Phase 1 complete).
- Next.js app (`chatbot/`) with Home / Chat / Content / Compare tabs — host for the control plane.

## 3. Architecture — The Generation Stack

The existing JSON→Remotion spine becomes the **bottom**. New layers sit above it; every artifact is a file in git, content-hashed.

```
SOURCE OF TRUTH (codified, version-controlled)
  content/tools|sources|capabilities/*.json     facts (exist) — grounds every claim
  content/teaching/STYLE.md                       NEW — Instructor's voice, mined from transcripts
  content/teaching/transcripts/*                   NEW — corpus (exemplars for RAG few-shot)
  content/lessons/<id>/outline.json                NEW — sections, objectives, tool/capability refs

GENERATION DAG  (idempotent · content-hashed · cached PER SCENE)
  ① outline + STYLE + facts   ──Claude───▶  script.json        talk track, grounded + cited
  ② script.json               ──planner──▶  lesson.json(draft) maps blocks → 14 scene types
  ③ scene.narration.text      ──TTS──────▶  audio/scene-NN.wav free/local (Kokoro→Chatterbox)
  ④ audio + known text        ──stable-ts▶  align/scene-NN.json word-level timestamps
  ⑤ measured audio            ──timing───▶  lesson.json(final)  durations INVERTED from audio
  ⑥ lesson.json(final)        ──Remotion─▶  <lesson>.mp4 + per-scene screenshots

CONTROL PLANE  ("Studio" tab in chatbot/ Next.js app)
  • Multi-track timeline (CapCut/GarageBand-style) — 4 parallel tracks on ONE shared time axis:
        ANIMATION  ▕▔scene thumbnails on the timeline▔▏
        VOICEOVER  ▕▔audio waveform per scene▔▏
        SCRIPT     ▕▔narration text blocks▔▏
        CAPTIONS   ▕▔word-timed caption pages▔▏
    → see how every layer lines up against the others; scrub/play all together.
  • Click any element → view it ISOLATED (the script block, the audio clip, the rendered
    scene, the caption page) + leave a COMMENT. Editing is delegated to AI (comment → I regenerate);
    in-app editing is NOT a goal. Optional touch-points only when the user wants granularity.
  • Status overlay: each element shows fresh / stale / error; stale = upstream input changed.
  • Set-and-forget default: pipeline runs autonomously to a finished MP4; the timeline is for
    oversight + targeted comments, not mandatory interaction.

REGENERATION ENGINE (custom Node content-hash DAG, ~150 LOC)
  Edit one tool feature → only referencing scenes' script+audio+video rebuild → re-splice.
```

### 3.1 Required schema change (single, additive)

Add an optional narration layer to `SceneBaseSchema` so audio + captions live in the single source of truth:

```ts
narration: z.object({
  text: z.string(),
  audioSrc: z.string().optional(),
  words: z.array(z.object({
    word: z.string(), startMs: z.number(), endMs: z.number(),
  })).optional(),
}).optional(),
```

Backward compatible: existing silent lessons (no `narration`) still validate and render.

### 3.2 Timing inversion (the conceptual core)

Today `duration` (frames) is hand-authored and the validator checks contiguity. In the pipeline, **narration audio length drives `duration`**:

1. Pre-audio estimate for fast preview: `frames = words / WPM(~150) * 60 * fps` + a per-scene-type read-floor.
2. Authoritative pass: replace estimate with measured per-scene audio length (ceil to frame).
3. Recompute contiguous `start` values; set `lesson.duration` = last scene end. The existing `superRefine` validator becomes the **guarantee the generator must satisfy**.

Enforce a per-scene-type **minimum duration floor** so audio shorter than the reveal animation never produces an unreadable scene.

## 4. Component Boundaries

| Unit | Purpose | Input → Output | Depends on |
|------|---------|----------------|------------|
| `style-extractor` | One-time mine Instructor's voice | transcripts → `STYLE.md` | Claude (prompt-only) |
| `outline` schema + loader | Codify lesson structure | authored/generated `outline.json` | Zod |
| `script-generator` | Talk track in Instructor's voice, grounded | outline + STYLE + facts → `script.json` | Claude + capability JSON (RAG) |
| `fact-check gate` | No hallucinated tool claims | script.json → pass/flag | capability/source JSON |
| `scene-planner` | Map script blocks → scenes | script.json → `lesson.json(draft)` | scene-types schemas |
| `tts-adapter` | Pluggable synth | narration text → `scene-NN.wav` | Python sidecar (Kokoro/Chatterbox); paid adapter slot |
| `aligner` | Word timestamps | wav + text → `align/scene-NN.json` | stable-ts (Python sidecar) |
| `timing` | Audio-authoritative durations | measured audio → `lesson.json(final)` | media-utils |
| `captions` | Word-synced on-screen text | alignment → `Caption[]` | `@remotion/captions` |
| remaining scene components | Render the 9 unimplemented types | `lesson.json` → frames | scene-dispatcher |
| `build-dag` | Incremental regeneration | input hashes → rebuild affected only | sha-256, per-scene cache |
| `studio` (UI) | Control plane | artifacts ↔ user edits → trigger build-dag | Next.js, build-dag API |

## 5. Tooling Decisions (all free + commercial-OK)

| Layer | Pick | License | Note |
|-------|------|---------|------|
| TTS default (no clone) | **Kokoro-82M** | Apache-2.0 | fast, polished, branded neutral voice |
| TTS upgrade (Instructor clone) | **Chatterbox** | MIT | zero-shot clone from a clean ~15s Instructor clip |
| Paid slot | adapter interface | — | ElevenLabs/OpenAI drop-in if a meeting needs it (needs key + sign-off) |
| Forced alignment | **stable-ts `align()`** | MIT | aligns known text → accurate word timing |
| Alignment fallback | `@remotion/install-whisper-cpp` | MIT | stays in Node; emits `Caption[]` |
| Captions | `@remotion/captions` | Remotion (in repo) | verified `Caption` type |
| Audio length/waveform | `@remotion/media-utils` | Remotion | `getAudioDurationInSeconds`, `useAudioData` |
| Script gen | Claude + STYLE.md + RAG over facts | — | no fine-tuning |
| Orchestration | custom Node content-hash DAG | — | per-scene cache granularity |

**Disqualified:** XTTS-v2 (CPML), F5-TTS weights (CC-BY-NC) — non-commercial weights. Piper only as out-of-process CLI (GPL).

TTS + alignment are PyTorch → run as a **Docker sidecar** (`docker/tts/`); Remotion render stays in the existing container. This honors container-first.

## 6. Error Handling & Quality Gates (TDD + audit-integrity P0)

- **Schema gates:** `outline.json`, `script.json`, `lesson.json` each Zod-validated before downstream steps; golden-file tests.
- **Fact-check gate:** every tool claim in `script.json` must map to a capability record; unverifiable claims block and are flagged in the control plane (never silently shipped).
- **Min-duration floor:** per-scene-type; render fails loudly if violated.
- **Determinism:** same inputs → same artifacts (hash-stable). TTS seeded where supported; otherwise audio cached so re-runs are stable.
- **Visual verification:** per-scene screenshots retained; final MP4 validated (size <1.8GB, 1080p, no blank frames) per existing Phase-1 checks.

## 7. Decomposition — Build Phases

| Phase | Delivers | Key outputs |
|-------|----------|-------------|
| **A — Foundation** | Voice + structure codified | `STYLE.md` (from transcripts), `outline` schema + Module 1 outline, `narration` schema change, all with tests |
| **B — Script gen** | Talk track in Instructor's voice | `script-generator`, fact-check gate, Module 1 `script.json` |
| **C — Scene planner + components** | Draft animation from script | `scene-planner`, the 9 missing scene components (`ANIM-08`) needed for Module 1 |
| **D — Voice/audio** | Free/local narration | `docker/tts/` sidecar (Kokoro + Chatterbox adapter), `tts-adapter`, per-scene wav |
| **E — Timing + sync** | Audio-driven, captioned render | `aligner`, `timing` inversion, `@remotion/captions` wiring → **Module 1 MP4 with synced narration** |
| **F — Regeneration DAG** | Surgical updates | content-hash build engine, per-scene cache, `regenerate` CLI |
| **G — Control plane** | Human oversight via a CapCut/GarageBand-style **multi-track timeline** | `Studio` tab: 4 parallel tracks (animation/voiceover/script/captions) on a shared time axis; click element → isolate + comment; AI-delegated edits; fresh/stale status. Preceded by its own UX research. |

Phases A→E produce the **finished Module 1 MP4** (the review deliverable). F makes updates surgical. G gives the click-in control the user asked for.

## 8. Non-Goals (unchanged from REQUIREMENTS Out-of-Scope)

AI talking-head/avatar; custom LMS; live/real-time; in-video quizzes; manual NLE editing. Voice is audio-only narration over motion graphics — not a digital person.

## 9. Open Items (resolved during build, not blocking)

- Extract one clean ~15s Instructor reference clip from workshop audio for Chatterbox (Phase D; neutral Kokoro voice is the default until then).
- Confirm exact Remotion v4.0.460 signatures (`useAudioData`, `createTikTokStyleCaptions`) against live docs at impl time (research A4).
- Measure Instructor's actual WPM from transcripts to tune the pre-audio estimate (corrected by audio-authoritative pass regardless).
