---
type: concept
title: "Timing Inversion"
tags: [architecture, pipeline, methodology]
created: 2026-05-26
updated: 2026-05-26
sources: [codified-lesson-pipeline-design]
---

# Timing Inversion

The conceptual core of the [[codified-lesson-pipeline]]. Historically a Remotion scene's `duration` (in frames) was **hand-authored**, and a `superRefine` validator merely checked that scene timings were contiguous. Timing inversion flips the dependency: **narration audio length drives `duration`.**

## The three passes

1. **Pre-audio estimate** (fast preview): `frames = words / WPM(~150) * 60 * fps`, plus a per-scene-type read-floor.
2. **Authoritative pass:** replace the estimate with the *measured* per-scene audio length (ceil to frame).
3. **Recompute** contiguous `start` values; set `lesson.duration` = last scene end. The existing `superRefine` contiguity validator becomes the **guarantee the generator must satisfy.**

## Minimum duration floor

Each scene type enforces a **minimum duration floor** so that audio shorter than the scene's reveal animation never produces an unreadable scene. The render fails loudly if a floor is violated (audit-integrity P0).

## Why it matters

It makes lessons regenerable: re-narrate a scene and its on-screen timing follows automatically, so a content change propagates through audio → timing → render without a human re-timing frames.

## Sources

- [[codified-lesson-pipeline-design]]
