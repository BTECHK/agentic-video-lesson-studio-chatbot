---
type: concept
title: "Codified Lesson Pipeline"
tags: [architecture, pipeline, methodology]
created: 2026-05-26
updated: 2026-05-26
sources: [codified-lesson-pipeline-design]
---

# Codified Lesson Pipeline

The architecture that turns a lesson into **fully codified data**: change the data (a tool capability, an outline beat, a script line) and the affected script, animation, and voiceover regenerate surgically and autonomously — no re-recording. Merged to `master` in PR #37.

## The generation DAG (6 stages, content-hashed, cached per scene)

| # | Step | In → Out | Engine |
|---|------|----------|--------|
| ① | script gen | outline + STYLE + facts → `script.json` (grounded, cited) | Claude + RAG |
| ② | scene-planner | `script.json` → `lesson.json(draft)` (maps blocks → 14 scene types) | scene-types schemas |
| ③ | TTS | `narration.text` → `audio/scene-NN.wav` | Kokoro / Chatterbox sidecar |
| ④ | aligner | wav + text → `align/scene-NN.json` (word timestamps) | stable-ts |
| ⑤ | timing | measured audio → `lesson.json(final)` (durations inverted) | media-utils |
| ⑥ | render | `lesson.json(final)` → MP4 + per-scene screenshots | Remotion |

Source of truth above the DAG: `content/{tools,sources,capabilities}/*.json` (facts), `content/teaching/STYLE.md` (Instructor's voice, mined from transcripts), `content/lessons/<id>/outline.json`.

## Defining ideas

- **[[timing-inversion]]** — audio length drives scene duration (not hand-authored frames). The conceptual core.
- **Additive `narration` schema** on `SceneBaseSchema` (text + optional audioSrc + word timestamps). Backward compatible: silent lessons still validate.
- **Fact-check gate** — every tool claim in `script.json` must map to a capability record; unverifiable claims block and are flagged, never silently shipped.
- **Regeneration DAG** — custom Node content-hash engine (~150 LOC), per-scene cache. Edit one tool feature → only referencing scenes rebuild → re-splice.
- **Free + commercial-OK tooling** — Kokoro-82M (TTS default), Chatterbox (Instructor voice clone), stable-ts (alignment), `@remotion/captions`. TTS+alignment run as a Docker sidecar (`docker/tts/`).

## Control plane

The human-oversight surface is the **Studio** tab: a CapCut/GarageBand-style multi-track timeline (animation / voiceover / script / captions on one shared time axis). Click an element → isolate + comment; edits are AI-delegated (comment → regenerate), not in-app NLE editing. Its web-driven generation front door is [[studio-generate]].

## Sources

- [[codified-lesson-pipeline-design]]
