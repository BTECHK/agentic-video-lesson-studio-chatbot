---
type: source
title: "Codified Lesson Factory — Design Spec (2026-05-23)"
tags: [architecture, pipeline, design-spec, tts]
authors: [Technical lead, Claude]
url: ""
raw: raw/codified-lesson-pipeline-design.md
ingested: 2026-05-26
created: 2026-05-26
updated: 2026-05-26
sources: []
---

# Source: Codified Lesson Factory — Design Spec

Summary of `raw/codified-lesson-pipeline-design.md` (dated 2026-05-23, "Approved for autonomous build"). The architecture spec behind PR #37.

## Core value

A lesson is **fully codified data**. Change the data — a tool's capability, an outline beat, a line of script — and the affected script, animation, and voiceover **regenerate surgically and autonomously, without re-recording.** Humans give direction and review; AI generates everything in between. Replaces the prior model of hand-authored, silent Remotion compositions.

## The generation stack (6-stage DAG)

Source of truth (version-controlled, content-hashed) → generation DAG (idempotent, cached **per scene**):
1. outline + STYLE + facts → **script.json** (talk track, grounded + cited) via Claude
2. script.json → **lesson.json(draft)** — maps blocks to 14 scene types (scene-planner)
3. scene.narration.text → **audio/scene-NN.wav** via TTS (Kokoro → Chatterbox)
4. audio + known text → **align/scene-NN.json** word timestamps via stable-ts
5. measured audio → **lesson.json(final)** — durations INVERTED from audio
6. lesson.json(final) → **MP4** + per-scene screenshots via Remotion

## Key design decisions

- **Timing inversion** (the conceptual core): narration audio length drives scene `duration`, not hand-authored frames. Pre-audio WPM estimate (~150) for fast preview → authoritative pass replaces with measured audio length → recompute contiguous starts. Per-scene-type **minimum duration floor** so audio shorter than the reveal animation never produces an unreadable scene. See [[timing-inversion]].
- **Additive schema change:** optional `narration` layer on `SceneBaseSchema` (text, audioSrc, word-level timestamps). Backward compatible — existing silent lessons still validate.
- **Tooling (all free + commercial-OK):** TTS default Kokoro-82M (Apache-2.0); Instructor-clone upgrade Chatterbox (MIT, zero-shot from ~15s clip); paid adapter slot (ElevenLabs/OpenAI) needs key + sign-off; forced alignment stable-ts `align()` (MIT); captions `@remotion/captions`; orchestration custom Node content-hash DAG (~150 LOC). **Disqualified:** XTTS-v2, F5-TTS (non-commercial weights). TTS+alignment run as a **Docker sidecar** (`docker/tts/`) — honors container-first.
- **Quality gates (TDD + audit-integrity P0):** Zod schema gates on outline/script/lesson with golden-file tests; **fact-check gate** — every tool claim must map to a capability record, unverifiable claims block (never silently shipped); min-duration floor fails loudly; determinism via hash-stable artifacts + cached audio; per-scene screenshots + final MP4 validation (<1.8GB, 1080p, no blank frames).

## Build phases A–G

A Foundation (STYLE.md from transcripts, outline schema, narration schema) → B Script gen + fact-check → C Scene planner + 9 missing components → D Voice/audio (TTS sidecar) → E Timing + sync (→ Module 1 narrated MP4, the review deliverable) → F Regeneration DAG (surgical updates) → G Control plane ([[studio-generate|Studio]] multi-track timeline).

## Non-goals

AI talking-head/avatar; custom LMS; live/real-time; in-video quizzes; manual NLE editing. Voice is audio-only narration over motion graphics.

## Links

- Concept: [[codified-lesson-pipeline]]
- Concept: [[timing-inversion]]
