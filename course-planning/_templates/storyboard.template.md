# Storyboard — Topic {N}.{M}: {Lesson Title}

> **Why / Intent:** one annotated key pose per scene — the visual contract a human (Instructor / Claude
> Design) signs off BEFORE any code runs. Every scene id here MUST match a scene in
> `scene-contract.json` (the validator checks this), so picture and timing can't disagree.
> Poses are described in words (+ optional ASCII block); the rendered reference frame comes later.

## Scene poses

### {scene-id} — {sceneType} ({start}f–{end}f)
- **Key pose:** {what's on screen at the scene's most representative frame — layout, the main copy,
  where the eye goes}.
- **For interactive scenes:** show the MID-interaction frame (cursor mid-click, response half-streamed,
  two panels mid-compare) — not the empty start or finished end.
- **Brand:** linen bg / Syne 700 titles / 4px cards / crimson accent (see `brand-tokens-ref.md`).
- **Motion in one line:** {how it enters + what moves}.

{repeat per scene, in order}

## Sign-off
- [ ] Instructor / Claude Design reviewed poses
- [ ] Poses match scene-contract.json scene ids + order
- [ ] Demo scenes show real interaction (not static) per `interactive-mandate.md`
