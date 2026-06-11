---
name: animated-lesson
description: Generate animated HTML lesson videos for Sample Academy from a JSON lesson script. Produces a self-contained HTML file under lessons/ following the brand system, with scene-based modular structure, stable beat IDs for surgical updates, an auto-play timeline with scrubber, and a render path to MP4 when the lesson is approved. Trigger when Instructor says "build an animated lesson for Topic N", "make a lesson video from this script", "animate Module N", or asks for animated HTML lessons.
---

# Sample Academy · Animated Lesson Builder

You are generating a **self-contained interactive HTML lesson animation** for a Sample Academy module. The output lives at `lessons/<lesson-id>.html` and opens in any browser — no build step, no dependencies beyond Google Fonts and React+Babel CDN.

This skill is the **moving-image counterpart** to the static slide deck skill (`slide-deck`). Slides are for live teaching; animated lessons are for asynchronous on-demand consumption (YouTube, course platform).

## Source of truth

The course outline lives in `sample-course-outline.docx` at the project root. **Always read directly from the docx** — it's the authoritative content.

For animated lessons specifically, the content comes from a **lesson script JSON file** (see `references/05-content-schema.md`). If no script exists, generate one from the outline first, get Instructor's approval on the content, *then* build the HTML.

## Output structure

Every lesson is a `lessons/<lesson-id>.html` that:

1. Imports React 18 + Babel from CDN (pinned versions in `templates/lesson-template.html`).
2. Loads `animations.jsx` (timeline engine — Stage, Sprite, easing).
3. Loads `lesson-ui.jsx` (brand primitives — TypeOn, Pinwheel, Tether, ChatWindow, etc.).
4. Loads `lesson-renderer.jsx` (data-driven scene renderer — takes JSON, produces scenes).
5. Loads `lesson-shell.jsx` (App + chrome).
6. Inlines a `<script type="application/json" id="lesson-content">...</script>` block with the scene data.

The JSON is the only thing that changes between lessons. The four `.jsx` files are the runtime — copy them from `templates/` to the project on first lesson, then reuse.

## Brand system (non-negotiable)

See `src/brand/tokens.ts` (the `references/01-brand-system.md` write-up is not in this copy). Key invariants:

- **Font:** Syne (400–800). No substitutions.
- **Colors:** Soft Linen `#EDE8E3` base, Charcoal `#1C1C1C` text, Crimson `#8B2635` accent, Card White `#FDFBF9`.
- **Radius:** 4px everywhere. 14px for chat windows and demo cards only.
- **Canvas:** 1920×1080. Letterboxed to viewport.
- **Easing:** cubic-bezier(0.22, 1, 0.36, 1) — the "Anthropic glide".

## Motion contract (non-negotiable)

See `references/02-motion-contract.md`. The five rules:

1. **Fluid physics.** Natural easing. No abrupt snaps.
2. **Tether method.** Hand-drawn squiggle connects related elements across the canvas — replaces explanatory text.
3. **Semantic micro-interactions.** Pinwheels and waveforms instead of generic spinners. Loading states should mean something.
4. **Sequential staging.** Container slides in → action triggers → "thinking" state → result fades in. Never all at once.
5. **Purpose-driven.** If a motion doesn't teach or guide, cut it.

## Scene catalog

See `references/03-scene-catalog.md` for the full schema. Match content to scene types by these signals:

| Content signal | Scene type |
|---|---|
| Hero title + duration metrics for a lesson | `cover` |
| "You are here" within a multi-topic course | `journey-map` |
| Same prompt across 2–4 different AI tools | `comparison-chats` (with tether) |
| 3–6 tools/products as a landscape | `tool-card-reveal` |
| "Best at X" matrix of tools × capabilities | `capability-table` |
| Sequential 3–7 settings or steps to enable | `setup-checklist` |
| 2–6 features as named categories with examples | `feature-grid` |
| Voice/audio feature highlight | `voice-demo` |
| A tool generating an output (prompt → generating → result tiles) | `tool-demo` |
| A multi-step in-tool walkthrough (click through a builder, page a dashboard) | `screen-flow` (see `references/08-simulated-screen-contract.md`) |
| Recap with 3 numbered cards | `recap-grid` |
| "Coming next" footer | `preview-band` |
| Background context that's optional reading | `dig-deeper` |
| Pre-class homework | `assignment-list` |
| A spoken / talking-head moment (Instructor to camera) | `quote-card` (narrate over a pulled key line) |

**Delivery type → scene (NO FOOTAGE — every beat is animated; see `CLAUDE.md` → "Lesson Production Model").**
The outline tags rows 🟦 slide / 🟩 demo / 🟧 talking-head, but **all three render as animation**:
- 🟩 **demo / in-tool** → animate it: `comparison-chats`, `tool-demo`, `screen-flow`,
  `setup-checklist`, or `voice-demo` (`feature-grid` only when the beat is genuinely a category
  overview — a demo rendered as a static grid "tells instead of shows" and Gate B will hold it).
  Show clearly-illustrative, grounded interactions per the simulated-screen contract
  (`references/08-simulated-screen-contract.md`) — never a real captured session, never a
  capability absent from the facts. Demo beats are multi-step and run at walkthrough pace — this
  is how demo rows earn their outline minutes.
- 🟧 **talking-head** → narrate over `quote-card` (default; as in topic-1-lesson-1).
- ⛔ **Do not use `demo-cue`** — it was a placeholder for a live recorded demo; this pipeline animates
  the demo instead. (It remains a registered type only for backward compatibility.)

If the content genuinely doesn't fit any scene type, **add a new one to `templates/lesson-renderer.jsx` and document it in `references/03-scene-catalog.md`** — don't hack an existing one.

## Stable IDs and surgical updates

**Every scene has a stable `id` field** in the JSON. Every beat (titled element, list item, stat) within a scene has a `data-beat-id` attribute in the rendered DOM. This is the contract that allows downstream automation to surgically update content:

- "ChatGPT Go pricing changed" → edit `scenes[id=tool-cards].content.tools[id=chatgpt].priceNote` only.
- "Module 3 renamed to Module 3.5" → edit `scenes[id=journey].content.stops[id=topic-3].title` only.

**Do not rename scene or beat IDs once published.** Slug them once, keep them forever. Change `title`/`body` fields freely.

## Voice & labels

- Learner-facing labels only: plain words on screen, no internal jargon (for example "Practice" and "Preview").
- Bold/accent words carry the conceptual payload. In the JSON, mark accent words with asterisks: `"Sample line. *Accent.*"`. The renderer applies the crimson color.
- Never fabricate demo outputs — animate them as clearly-stylized simulations (`tool-demo`/`screen-flow`/`comparison-chats`, per `references/08-simulated-screen-contract.md`). Never type fake AI responses *as if* they're real outputs unless they're clearly marked as illustrative. (⛔ `demo-cue` stays forbidden — see the delivery-type rules above.)

## Logos

Real brand SVGs are inlined as `<symbol>` defs in `templates/lesson-template.html`. The registry is: ChatGPT, Claude, Gemini, Perplexity, Grok. Add new ones to the template, reference them by id (e.g. `"logo": "logo-chatgpt"`).

## Build process

1. **Read the lesson source.** Either an existing JSON script, or generate one from the outline docx and confirm with Instructor.
2. **Sketch the scene order.** Typical flow: cover → journey-map (early lessons only) → comparison/demo → content scenes → recap-grid → preview-band → assignment-list. Aim for **90–120 seconds** total runtime.
3. **Author the content JSON.** Each scene gets a stable `id` (slug-case), `type`, `start`, `duration`, optional `label` (top-right chrome), and `content` matching the scene-type schema.
4. **Copy template files** to the lesson project if not already present:
   - `lessons/animations.jsx`
   - `lessons/lesson-ui.jsx`
   - `lessons/lesson-renderer.jsx`
   - `lessons/lesson-shell.jsx`
   - `lessons/<lesson-id>.html` (from `lesson-template.html`)
5. **Embed the JSON** in the HTML via `<script type="application/json" id="lesson-content">...</script>`.
6. **Open the HTML.** Verify visually. Scrub the timeline. Confirm each scene's beats land cleanly.
7. **For MP4 render**, see `references/06-render-pipeline.md`.

## What NOT to do

- Don't write per-lesson custom scene functions when an existing scene type fits. If 80% fits and 20% doesn't, the answer is "extend the existing scene with a new optional content field", not "fork the function".
- Don't bake content into JSX. Content lives in JSON. JSX is presentation only.
- Don't change IDs across versions. Slug once, keep forever.
- Don't add stock spinners. Always semantic.
- Don't pad with filler content. If a beat doesn't earn its place, cut it.
- Don't deviate from the 4px / 14px radius rule.
- Don't introduce new fonts.
- Don't render to MP4 until Instructor has approved the HTML version. The whole point of code-driven motion is fast iteration in HTML — render only when frozen.

## After building

Tell Instructor:
- Which file you created (`lessons/<id>.html`).
- Total runtime in seconds.
- Scene count and which scene types you used.
- Any outline content that didn't have a clean scene-type fit (so the instructor can decide: extend a scene type, add a new one, or cut).
- Any factual claims about AI tool features/pricing that should be fact-checked (feed into `/accuracy-sweep`).

Do NOT claim any fact about AI tools is verified — that's the accuracy sweep's job.
