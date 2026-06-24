# Interactive Mandate — "not a slideshow"

> **Why this exists (intent for Claude Design):** the owner's #1 note is that these videos must FEEL
> interactive — not a plain slide deck with narration. Where a lesson shows a tool being used, a
> workflow running, a click-through, or an agent being built, we **animate that interaction** in the
> Anthropic-YouTube register (gliding cursors, clicking buttons, streaming responses), not a static
> screenshot. This file is the rule every lesson plan must honor.

## The rule
For each outline beat, classify it and pick the matching register:

| Outline signal | Register | Scene types |
|---|---|---|
| 🟩 Demo / "in-tool" / "show" / "put the prompt in" / "side-by-side" / "build a…" | **Animated interaction** | `screen-flow`, `tool-demo`, `comparison-chats`, `voice-demo`, `setup-checklist` |
| 🟦 Slide / framework / chart / "visual showing…" | **Animated data/framework** | `feature-grid`, `capability-table`, `audit-quadrant`, `recap-grid`, `assignment-list`, `journey-map`, `tool-card-reveal` |
| 🟧 Talking-head / "Instructor says…" / hook / engagement | **Narrated moment** (animation-first, no camera) | `quote-card`, `cover` (narrator), `preview-band` |

## What "animate the interaction" means concretely
- **A click-through** (e.g. "Settings Walkthrough", "Building a Sample Assistant") → a
  `screen-flow` scene: the cursor glides, clicks a button, a panel opens, text types in, the next
  state appears. Each step is a beat in the scene-contract's `motion` array.
- **A prompt → output** (e.g. "put the same prompt in ChatGPT") → a `tool-demo` scene: the prompt
  types into the composer, the response streams out. Never a still screenshot of a finished chat.
- **An A/B comparison** (e.g. "Prompt A vs Prompt B"; "Before vs after") →
  a `comparison-chats` scene: 2–3 panels, responses animating in parallel so the contrast lands.
- **Building an automation** (Topic 3 demos) → a `screen-flow` that walks the build step by step,
  animated as a real construction.
- **Voice** → a `voice-demo`: waveform + live transcription + streamed answer.

## Hard "don'ts"
- Don't represent a Demo beat as a `feature-grid`/`quote-card`/`cover` (that's the slideshow trap).
- Don't fabricate tool outputs as if real — animate the interaction faithfully; real
  screenshots/recordings are an explicit future upgrade, never a blocker (animation-first model).
- Don't stitch in screen recordings now; the `screen-flow`/`tool-demo` components ARE the demo.

## How a planner records it
In each `scene-contract.json` scene, set the interactive `sceneType` AND describe the interaction in
`motion[]` / `interactionNotes` (e.g. `"cursor → New GPT → type name → paste instructions → Test"`).
The `storyboard.md` key-pose for that scene shows the mid-interaction frame, not the end state.
