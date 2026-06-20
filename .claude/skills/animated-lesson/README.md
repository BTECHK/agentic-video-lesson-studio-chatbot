# Animated Lesson Skill

A Claude Code skill for generating animated HTML lesson videos for Sample Academy. Produces self-contained HTML files that play in any browser, with a modular scene-based architecture that supports surgical content updates without re-recording motion graphics.

## What's in this package

```
animated-lesson-skill/
├── SKILL.md                       Main skill prompt (top-level rules + workflow)
├── CLAUDE-CODE-PROMPT.md          The exact prompt to paste into Claude Code
├── README.md                       This file
├── references/
│   ├── 01-brand-system.md          Color, type, spacing, easing tokens (not in this copy; see src/brand/tokens.ts)
│   ├── 02-motion-contract.md       The 5 motion rules
│   ├── 03-scene-catalog.md         All 15 scene types with content schemas
│   ├── 04-component-api.md         API reference for all primitives
│   ├── 05-content-schema.md        JSON shape for lesson scripts
│   ├── 06-render-pipeline.md       How to render to MP4
│   ├── 07-industry-research.md     How studios do this professionally
│   ├── 08-simulated-screen-contract.md  Mock-screen fidelity tiers + honesty rules
│   └── 08b-reference-video-to-spec.md  Turn a reference video into a style spec
├── templates/
│   ├── animations.jsx              Timeline engine (Stage, Sprite, Easing)
│   ├── lesson-ui.jsx               Brand primitives (TypeOn, Pinwheel, Tether, etc)
│   ├── lesson-renderer.jsx         Data-driven scene renderer
│   ├── lesson-shell.jsx            App + Chrome overlay
│   └── lesson-template.html        HTML shell with brand SVG logos
└── examples/
    ├── module-1.json               Module 1 expressed as data (not in this copy)
    ├── module-1.html               Module 1 rendered (not in this copy)
    └── *.jsx                       Runtime files (copies of templates/)
```

## Quick start — to build a new lesson

1. **Install the skill** into your Claude Code project at `skills/animated-lesson/`.
2. **Open `CLAUDE-CODE-PROMPT.md`** and copy the prompt template.
3. **Paste it into Claude Code**, replacing `[Module N · Topic Name]` with the lesson you want.
4. Claude will:
   - Read the relevant skill files.
   - Pull content from `sample-course-outline.docx`.
   - Map content to scene types.
   - Author `lessons/module-N.json`.
   - Copy template `.jsx` files to `lessons/`.
   - Build `lessons/module-N.html`.
5. **Open the HTML in a browser.** Scrub the timeline, verify timing.
6. When approved, **render to MP4** (see `references/06-render-pipeline.md`).

## Quick start — to update an existing lesson

1. Identify the changed beat (e.g. "ChatGPT Go pricing went from $7 to $8").
2. Open `lessons/module-N.json`.
3. Find the beat by scene `id` + content path. JSON IDs are stable across versions.
4. Edit the string. Save.
5. Re-open the HTML. Verify visually.
6. Re-render the MP4.

Critically: **no JSX file needs to change**. The presentation code is generic; the content is data. This is what enables high-throughput content maintenance.

## How the example proves it works

`examples/module-1.html` is the *exact* lesson video that's already in production, but produced from `module-1.json` data instead of hand-coded scene components. Open it and compare frame-by-frame to the hand-built version — they're indistinguishable.

That parity is the contract: anything you can author by hand, you can author as JSON and the renderer will produce the same output. Inverse: anything the renderer can produce, you can update by editing JSON.

## Why this exists

Sample Academy plans several modules, each with subtopics, with frequent content updates as AI tooling evolves. The traditional pipeline (After Effects + recorded voiceover) makes every fact change expensive: open the project, re-key, re-render, re-record. With this skill:

- **Authoring is faster.** Claude Code writes the JSON; you review it.
- **Updates are cheaper.** A 3-line JSON diff + a 50-minute headless render + a 90-second audio splice replaces a multi-hour reshoot.
- **Style is consistent.** Every lesson reads as the same product because they share the same scene catalog and brand system.
- **Scale is real.** You can produce dozens of lesson videos with the team you have, not the team you'd need to hand-key every AE project.

See `references/07-industry-research.md` for the broader context — Spotify Wrapped, GitHub Unwrapped, and Shopify all run pipelines structurally identical to this one.

## What this skill is NOT

- **Not a video editor.** You can't drag clips. You author data; the engine renders frames.
- **Not a Lottie player.** Lottie embeds keyframes; we run live React. Different tradeoff — we get programmability, they get smaller payloads.
- **Not a generative AI motion tool.** Every motion in this system is deterministic. No `Math.random()`, no AI-generated frames. Frame N renders identically every time you call it. That's the contract that makes the MP4 reproducible.

## What this skill SHOULD become

Roughly in order:

1. **Migrate the render path to Remotion** when you hit ~5 published lessons. See `06-render-pipeline.md` for the migration map.
2. **Add a `motion-review` skill** that runs an LLM critic over rendered MP4s, flagging pacing/contrast/legibility issues.
3. **Add a TTS integration** to auto-generate voiceover from `speakerNotes` when content changes.
4. **Build a localization workflow** — translate JSON, render variants per language.
5. **Build a per-feature partial-render skill** — only re-render the affected scene window when a single beat changes.

## License

Covered by the repository LICENSE (PolyForm Noncommercial 1.0.0). The brand SVG logos in `templates/lesson-template.html` are the property of their respective companies (OpenAI, Anthropic, Google, Perplexity, xAI) — use only with permission and in the context of fair-use educational content.
