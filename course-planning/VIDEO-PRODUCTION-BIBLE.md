# Video Production Bible — the artifacts that ground a deterministic, interactive video pipeline

> **Why / Intent:** a brand video must be reproducible — same inputs → same video — and a "tweak"
> must mean *edit one data file*, never *rewrite a component*. That only holds if every input is
> pinned. This Bible is the permanent list of the grounding artifacts and what each one locks down.
> Two were already in place (script + tokens); the rest were the gap this package fills.

## The mental model
```
video = render(scene-contract, brand-tokens, motion-contract, render-contract, assets)
```
Components are **pure render functions** of those inputs. No copy, no hex, no px constant, no timing
number lives in a component that isn't read from an input. If you're typing a string or a color into a
`.tsx`, stop — it belongs in an input file.

## The 10 grounding artifacts

| # | Artifact | Where | Locks down |
|---|----------|-------|-----------|
| 1 | **Script / outline** | the course outline DOCX → `.planning/curriculum/source-materials-extracted/course-outline.txt`; per-lesson `LESSON-PLAN.md` | The narrative spine + scope. The outline is the ONLY scope authority. |
| 2 | **Design tokens** | `src/brand/tokens.ts` (mirror: `contracts/brand-tokens-ref.md`) | Immutable color / type / spacing / radius. |
| 3 | **Scene contract** | per lesson: `lessons/.../scene-contract.json` (schema: `contracts/scene-contract.schema.json`) | THE keystone — every scene's id, start frame, duration (frames), sceneType, layout, copy, motion. Makes the build data-driven + tweakable. |
| 4 | **Storyboard** | per lesson: `lessons/.../storyboard.md` | One annotated key pose per scene — the visual contract a human signs off before code runs. References the scene-contract frame numbers so picture + timing can't disagree. |
| 5 | **Copy deck** | inside `LESSON-PLAN.md` (scene table) + `scene-contract.json` `copy` keys | Every word in one place, never typed into a component — the #1 cause of "it changed when we re-ran it." |
| 6 | **Motion contract** | `contracts/motion-contract.md` | The easing library (outCubic / outBack / inOutCubic) + per-element timing. Pins the *curve*, not just the start frame — what v2 drifted on. |
| 7 | **Asset manifest** | `contracts/asset-manifest.md` | Every font / logo / audio: local + checksummed. Directly fixes the serif-fallback bug. |
| 8 | **Render contract** | `contracts/render-contract.md` | Output spec: fps, scale 2, crf 18, BT.709, faststart. The half of "it looks worse" no component edit can fix. |
| 9 | **Audio / sound spec** | per-lesson VO gist (here) → recorded WAVs + word-level timing (`lesson.json.narration.words`, supplied later); sizzle music + BPM + downbeat map | Cuts land on beats; VO syncs to frames. (Recorded audio is NOT in this planning handoff.) |
| 10 | **Golden frames + version lock** | `render-contract.md` (standard recorded; `golden/` to be added) | One PNG per scene committed; pinned Remotion/Node. Proves determinism by diffing re-renders. |

## The two that pin "what's on screen and when"
The **scene contract (#3)** + the **storyboard (#4)** together are the "design contract" / "scene layout":
the scene contract is the machine-readable timing/layout/copy; the storyboard is the human-signoff
visual. Everything else (#2, #6, #7, #8) is shared and course-wide; #1, #5, #9 are per-lesson.

## The interactive mandate (non-negotiable register)
These videos must feel **interactive, not a slideshow**. Any in-tool / demo / click-through / "build an
agent" beat is **animated** (gliding cursor, clicking, typing, streaming responses) via the interactive
scene components — never a static screenshot. See `contracts/interactive-mandate.md` +
`contracts/scene-type-catalog.md`.
