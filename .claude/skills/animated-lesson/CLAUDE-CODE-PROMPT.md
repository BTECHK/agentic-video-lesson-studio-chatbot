# Claude Code prompt — animated lesson builder

Paste this prompt into Claude Code when you want it to build or update an animated lesson. Replace the bracketed parts.

---

## The prompt

> You are working in the **Sample Academy course** repo. I want you to build an animated HTML lesson video for **[Module N · Topic Name]**, using the `animated-lesson` skill in `skills/animated-lesson/`.
>
> **Read these in order before doing anything else:**
>
> 1. `skills/animated-lesson/SKILL.md` — the top-level rules.
> 2. `src/brand/tokens.ts` — colors, font, easing tokens. Non-negotiable. (The `01-brand-system.md` write-up is not in this copy.)
> 3. `skills/animated-lesson/references/02-motion-contract.md` — the five motion rules.
> 4. `skills/animated-lesson/references/03-scene-catalog.md` — the scene types you can use, with content schemas.
> 5. `skills/animated-lesson/references/05-content-schema.md` — the JSON shape.
> 6. `content/lessons/module-1/lesson.json` — a complete worked example (the skill's own `examples/` folder is not in this copy).
>
> Skim the others as needed (component API, render pipeline, industry research).
>
> **Then do this work, in order:**
>
> 1. **Read the source content** for Module N from `sample-course-outline.docx`. Pull out the lesson script — eyebrows, titles, sub-copy, tools mentioned, settings to enable, etc.
> 2. **Map the content to scene types.** Use the table in SKILL.md. For each scene, decide: type, stable slug-case id, start time, duration. Target 90–120s total. Read aloud the rationale for the order before writing JSON.
> 3. **Author `lessons/module-N.content.json`** following the schema. Use stable IDs. Mark accent words with asterisks (`*workspace*`). Keep beats minimal — every word should earn its place.
> 4. **If the template files don't already exist in `lessons/`**, copy them from `skills/animated-lesson/templates/`:
>    - `animations.jsx`, `lesson-ui.jsx`, `lesson-renderer.jsx`, `lesson-shell.jsx`
> 5. **Create `lessons/module-N.html`** from `lesson-template.html`. Inline the JSON via `<script type="application/json" id="lesson-content">…</script>`. Update the `<title>`.
> 6. **Open the HTML in a browser** (`open lessons/module-N.html`). Scrub through the timeline. For each scene, verify:
>    - Beats land in narrative order.
>    - No two text layers overlap.
>    - Pinwheels start before responses, end when responses do.
>    - Tether (if used) draws after prompts are sent, not before.
>    - The scene fits its allotted window — neither rushes nor lingers.
> 7. **Self-check:** do not invent facts about AI tool capabilities or pricing. If the outline says "ChatGPT has X", use that; if you're unsure, leave the content slot empty and flag it. Run `/accuracy-sweep` after if available.
>
> **Report back:**
> - File path, total runtime, scene count + types.
> - Any outline content that didn't have a clean scene-type fit.
> - Any factual claims that need fact-checking.
>
> **Do not** render to MP4 yet. The point of the HTML format is fast iteration. I'll approve the timing in the browser first.

---

## What makes this prompt work

The skill is structured so Claude Code doesn't have to invent anything:

- **Brand tokens are tabulated** — Claude can copy values directly, no aesthetic judgment.
- **Scene catalog has signal-→-type mapping** — Claude doesn't decide *how* to present content, just *which* template fits.
- **JSON schema is strict** — content is data, not code. One file to edit per lesson.
- **Stable IDs are required** — surgical updates are addressable.
- **Worked example is included** — Claude has a concrete artifact to pattern-match on.

The combination of "read these files first" + "do this work, in order" + "report back" is the workflow that gets consistent output across runs.

## When to deviate from this prompt

You'd deviate when:

- **Building a brand-new scene type.** Tell Claude Code: "the content needs a scene type that doesn't exist yet — extend `lesson-renderer.jsx` and document the new type in `03-scene-catalog.md`". This is the only case where Claude is authoring code, not data.
- **Updating an already-published lesson.** Different prompt: "edit `lessons/module-N.content.json` only; do not touch the template `.jsx` files; locate the beat by scene id + content path and update the field in place." This is the surgical-update workflow.
- **Rendering to MP4.** Different prompt: "the lesson at `lessons/module-N.html` is approved. Follow `references/06-render-pipeline.md` to capture it to MP4."

## Variations worth keeping in your back pocket

- **"Build several module lessons in parallel."** Give Claude Code the outline for several modules in one prompt; tell it to author all the JSON files first (no HTML), so you can review the content plan as a batch before any rendering.
- **"Adapt this for [non-AI topic]."** Replace logo references and demo-cue scenes with topic-appropriate primitives. The motion contract stays the same; only the visual nouns change.
- **"Build a 30-second teaser."** Same skill, target duration 30s. Force the use of only `cover`, `comparison-chats`, and `preview-band`. Useful for social-media cuts.

## Anti-patterns to call out if Claude Code does them

- Authors content directly in JSX instead of JSON.
- Invents a new scene type for content that 90% fits an existing one.
- Picks non-brand colors, fonts, or radius values.
- Pads scenes with filler ("Welcome to this lesson where we will…") instead of starting in media res.
- Renders to MP4 in the same turn as building the HTML.
- Skips the timeline scrub-through verification step.

If any of these happen, push back and reference the specific SKILL.md or motion-contract.md section.
