# 03 · Scene catalog

Every scene in an animated lesson uses one of these types. Each entry below lists:

- **When to use** — the content signal that maps to this type.
- **Default duration** — the target window. Stay close.
- **Content schema** — the JSON shape under `scene.content`.
- **Beats** — the timing of internal animations.
- **Visual notes** — anything you'd otherwise have to read code to know.

To add a new scene type, implement it in `templates/lesson-renderer.jsx` and add an entry here. Never invent a scene type on the fly inside a lesson file.

---

## `cover`

**When to use:** Opening of every lesson. Hero title, eyebrow, sub-copy, optional stat grid.

**Default duration:** 8s.

**Content:**
```json
{
  "eyebrow": "Topic 1 · Lesson 1.1",
  "title": ["How this", "*course* works."],
  "sub": "Short lessons, one skill each, practiced in a real assistant.",
  "stats": [
    { "id": "lessons-count", "value": 5, "label": "Short lessons" },
    { "id": "minutes", "value": 27, "suffix": "min", "label": "Topic total" },
    { "id": "steps", "value": 3, "label": "Steps per lesson" }
  ]
}
```

**Beats:**
- 0.3s: eyebrow fades in
- 0.55s, 0.95s: hero title lines glide in (stagger)
- 1.6s: sub fades in
- 2.4s: stat grid container fades in
- 2.6–3.6s: each stat counts up from 0 (CountUp easing)

**Notes:**
- `title` is an array of strings (each is one line). `white-space: nowrap` is applied per line — keep each line ≤22 characters or it'll overflow.
- Asterisks `*word*` apply accent color to the wrapped word.
- `stats` is optional. Omit for lessons that don't have a time/count promise.

---

## `journey-map`

**When to use:** Show "you are here" within a multi-topic course. Use only on the *first* lesson of a topic — not every lesson.

**Default duration:** 7s.

**Content:**
```json
{
  "eyebrow": "The course journey",
  "title": "You're right here.",
  "sub": "Five short lessons. Each one adds a skill the next one uses.",
  "stops": [
    { "id": "topic-0", "label": "Topic 0", "title": "Welcome", "state": "done" },
    { "id": "topic-1", "label": "Topic 1", "title": "Getting Started", "state": "active" },
    { "id": "topic-3", "label": "Topic 3", "title": "Automating Everyday Work", "state": "todo" }
  ]
}
```

**Beats:**
- 0.2s: scene title fades in
- 1.5s: background track line draws across
- 1.6s+: each stop dot pops in (stagger 0.12s)
- 2.0s: accent fill animates from start to the active stop
- 3.0s: "You are here" pill pops below the active stop

**Notes:**
- `state` is `"done" | "active" | "todo"`. Exactly one stop should be `active`.
- 6 stops max, otherwise crowd. Use a horizontal scroll variant (not yet built) for >6.

---

## `comparison-chats`

**When to use:** Show 2–4 AI tools responding to the same prompt. A signature scene for tool-comparison lessons.

**Default duration:** 17s.

**Content:**
```json
{
  "eyebrow": "Lesson 1.2 · Picking the Right Assistant",
  "title": "Same prompt. *Different answers.*",
  "caption": "Same input. *Different results.*",
  "prompt": "Write a two-line status update for my team.",
  "tools": [
    {
      "id": "chatgpt",
      "name": "ChatGPT",
      "logo": "logo-chatgpt",
      "response": "Quick update: the draft is ready for review. ..."
    },
    {
      "id": "claude",
      "name": "Claude",
      "logo": "logo-claude",
      "response": "Status: the draft is done and needs your review. ..."
    },
    {
      "id": "gemini",
      "name": "Gemini",
      "logo": "logo-gemini",
      "response": "Heads up: the first draft is ready..."
    }
  ],
  "tether": true
}
```

**Beats (one per chat window, staggered 0.25s):**
- +1.0s: window glides in from below
- +2.3s: composer starts typing the prompt
- +4.3s: prompt clears (user "sent") + bubble appears at top
- +5.0s: thinking pinwheel appears
- +7.0s: response types out over ~3s
- +5.0s scene-relative: tether squiggle draws across all windows (if `tether: true`)

**Notes:**
- 2–4 tools. Less than 2 is pointless; more than 4 doesn't fit at 1920px.
- The `response` should *illustrate* tonal differences, not claim to be real outputs. Keep each response 1–2 sentences.
- Caption is optional; appears below the tether near scene end.

---

## `tool-card-reveal`

**When to use:** Show 3–6 AI tools as a landscape — each with a name, tag, and one-liner. Cards reveal sequentially with a brief highlight.

**Default duration:** 12s.

**Content:**
```json
{
  "eyebrow": "The landscape",
  "title": "Sample assistants at a glance.",
  "sub": "Sample subtitle.",
  "tools": [
    {
      "id": "chatgpt",
      "name": "ChatGPT",
      "logo": "logo-chatgpt",
      "tag": "Sample tag",
      "oneliner": "One-line summary"
    }
  ]
}
```

**Beats:**
- 0.2s: title in
- 0.9s: sub in
- 1.6s+: each tool card glides up (stagger 0.8s)
- Each card highlights for 1.3s as it enters (border becomes accent, shadow deepens, lifts 6px)

**Notes:**
- 3 to 6 tools. Beyond 6, use `tool-grid-static` (not yet built) to fit them.
- `tag` is short — 3–5 words. Appears in accent color, uppercase.

---

## `capability-table`

**When to use:** Capability × Tool matrix. Compare 4–6 tools across 8–12 capabilities.

**Default duration:** 12s.

**Content:**
```json
{
  "eyebrow": "At a glance",
  "title": "Which assistant fits which job.",
  "footnote": "Sample footnote.",
  "headers": ["ChatGPT", "Claude", "Gemini", "Perplexity", "Grok"],
  "rows": [
    { "id": "capability-a", "label": "Sample capability A", "cells": ["B","Y","Y","Y","Y"] },
    { "id": "capability-b", "label": "Sample capability B", "cells": ["Y","B","Y","L","Y"] }
  ]
}
```

**Cell values:** `B` (Best, accent pill), `Y` (Yes, neutral pill), `L` (Limited, faint pill), `-` (none, dash).

**Beats:**
- 0.2s: title in
- 0.8s: table container in
- 1.4s+: each row fades+slides in (stagger 0.32s)

**Notes:**
- 8–12 rows is the readable range. Beyond 12 rows it scrolls off canvas at 1080px.
- Header order matters — it's the column order in every row.

---

## `setup-checklist`

**When to use:** Sequential settings or steps to enable, where each "lights up" then becomes "Done".

**Default duration:** 14s.

**Content:**
```json
{
  "eyebrow": "Lesson 1.5 · Making the Assistant Yours",
  "title": "Sample settings checklist.",
  "sub": "Sample subtitle.",
  "items": [
    {
      "id": "setting-one",
      "name": "Sample setting",
      "why": "Sample reason line.",
      "activateAt": 1.8
    }
  ],
  "cursor": true
}
```

**Beats per item:**
- `activateAt`: row becomes active (accent border, pinwheel spins where toggle was)
- `activateAt + 1.6`: row becomes done (pinwheel → checkmark + "Done" pill)

**Notes:**
- 3–7 items.
- `cursor: true` adds a mock cursor that walks down the list, stopping at each item.
- `activateAt` is scene-relative seconds. Stagger by 1.9s.

---

## `feature-grid`

**When to use:** 2–6 named feature categories with one-line descriptions. Each focuses for a beat with others dimmed.

**Default duration:** 12s.

**Content:**
```json
{
  "eyebrow": "Lesson 1.4 · Checking the Output",
  "title": "Sample categories.",
  "features": [
    {
      "id": "category-one",
      "n": "01",
      "cat": "SAMPLE CATEGORY",
      "title": "Sample feature",
      "sub": "One-line description of the feature.",
      "focusAt": 1.6
    }
  ]
}
```

**Beats per feature:**
- 0.9 + i*0.15s: card fades+slides in
- `focusAt`: card "focuses" — border becomes accent, lifts, others dim (1.4s window)

**Notes:**
- 2, 3, 4, or 6 features. (Use a 2-col grid for 4–6, single column for 2–3.)

---

## `voice-demo`

**When to use:** Highlight voice/audio features. Pulsing mic + live waveform + a quote that types in below.

**Default duration:** 10s.

**Content:**
```json
{
  "eyebrow": "Voice input",
  "title": "Talk it through.",
  "sub": "Speak your request and review a clean transcript.",
  "transcript": "Sample dictated transcript line.",
  "transcriptLabel": "Live transcript"
}
```

**Beats:**
- 0.2s: title in
- 1.5s: voice card in
- 2.0s: mic pulses + waveform animates + timer starts
- 4.0s: transcript types in over 4.5s

---

## `recap-grid`

**When to use:** End-of-lesson summary. 3 numbered cards.

**Default duration:** 12s (often paired with `preview-band` after).

**Content:**
```json
{
  "eyebrow": "Lesson 1.5 · Wrap",
  "title": "Sample recap.",
  "cards": [
    {
      "id": "card-one",
      "n": "01",
      "title": "Sample card",
      "body": "Sample recap body."
    }
  ]
}
```

**Beats:**
- 0.9 + i*0.2s: each card glides in
- 4.5s (if `preview` is included): "Coming next" band slides up

**Notes:**
- Always exactly 3 cards. Two looks empty; four looks crowded at this size.
- Optional `preview` field at scene level adds a "Coming next" band (see below).

---

## `preview-band`

**When to use:** A "Coming next" footer that often appears within a `recap-grid` scene rather than its own. As a standalone, use it for a final preview slide.

**Content:**
```json
{
  "eyebrow": "Coming next · Topic 3",
  "title": "Automating everyday work."
}
```

---

## `demo-cue`

**When to use:** Hook into a live demo Instructor is about to show on camera. Dark background, pulsing "Live demo" flag, the question the demo will answer.

**Default duration:** 8–10s.

**Content:**
```json
{
  "eyebrow": "Lesson 1.2 · Picking the Right Assistant",
  "title": "Same prompt.\nDifferent results.",
  "sub": "Sample demo lead-in.",
  "meta": [
    { "id": "tools", "k": "Tools on screen", "v": "ChatGPT, Claude, Gemini" },
    { "id": "watch", "k": "What to watch for", "v": "Sample watch-for text." },
    { "id": "why", "k": "Why this matters", "v": "Same input, different outputs." }
  ]
}
```

**Notes:**
- Dark scene (background `--text`, text `--bg-card`).
- The pulsing "Live demo" flag is rendered automatically — don't put "Live demo" in the title.
- Never fabricate the demo outputs in this scene. The demo is real; the cue just frames it.

---

## `dig-deeper`

**When to use:** Background context that's optional reading. Renders as a collapsed accordion at the bottom of a slide — the user clicks to expand. **Use sparingly** in animated lessons (it requires interaction, which breaks auto-play flow). Prefer for "leave-behind" content in static slides instead.

**Default duration:** N/A (renders as a static element within another scene, not its own scene).

---

## `assignment-list`

**When to use:** Practice tasks between lessons. Checkbox + bold task + context.

**Default duration:** 10s.

**Content:**
```json
{
  "eyebrow": "After this lesson",
  "title": "Your assignment.",
  "sub": "Sample subtitle.",
  "tasks": [
    {
      "id": "task-one",
      "bold": "Sample assignment task.",
      "context": "Sample task context."
    }
  ],
  "callout": {
    "label": "Sample callout",
    "body": "Sample callout body."
  }
}
```

---

## `quote-card`

**When to use:** Pull out one Instructor-voice quote that anchors a lesson. A standalone card-sized scene.

**Content:**
```json
{
  "eyebrow": "Instructor's take",
  "quote": "Sample pull quote with one *accent* phrase.",
  "attribution": "Course Instructor"
}
```

---

## `screen-flow`

**When to use:** Animated mock browser/desktop window walking through a sequence of UI interactions — clicks, typed input, navigation, and staged reveals. Use for step-by-step tool walkthroughs ("Build a custom assistant", "Navigate a dashboard", "Fill a settings form") without any screen recording. Style reference: Anthropic YouTube product demos.

**Default duration:** 10–16s (budget ~2–3s per step; 4–6 steps is the sweet spot).

**Content:**
```json
{
  "eyebrow": "Assistant builder",
  "title": "Build a *custom assistant* in 4 steps",
  "windowTitle": "Assistant builder — Create",
  "fidelity": "cartoon",
  "layout": "split",
  "caption": "Clearly stylized — not a real screenshot.",
  "steps": [
    { "id": "s1", "action": "navigate", "target": "Explore", "uiState": "Store homepage visible", "dwell": 1.2 },
    { "id": "s2", "action": "click",    "target": "Create",        "uiState": "Builder form open",          "dwell": 1.0 },
    { "id": "s3", "action": "type",     "target": "Name field",    "typedText": "Study Coach", "uiState": "Name field filled", "dwell": 0.8 },
    { "id": "s4", "action": "reveal",   "target": "Preview panel", "uiState": "Preview shown with name", "dwell": 1.5 }
  ],
  "targetPositions": {
    "Explore":       { "x": 20, "y": 15 },
    "Create":        { "x": 35, "y": 40 },
    "Name field":    { "x": 30, "y": 55 },
    "Preview panel": { "x": 72, "y": 50 }
  }
}
```

**Fields:**
- `fidelity`: `"cartoon"` (default, brand palette only) | `"hybrid"` (neutral gray sidebar for structural distinction, still no vendor colors)
- `layout`: `"split"` (left form panel + right preview, for builder UIs) | `"full"` (single scrollable panel, for navigation/dashboard flows)
- `steps`: 1–8 steps. Each step has an `action` and `dwell` (minimum 0.5s).
  - `click` — cursor glides to target, dwells, fires click pulse ring
  - `type` — characters appear one-by-one in the target field (requires `typedText`)
  - `navigate` — brief crossfade to new UI state (skip crossfade at step 0)
  - `reveal` — target block pops in with spring (used in the right preview panel)
- `targetPositions`: optional `{ target: { x, y } }` percentages within the window body. Omit the field entirely to hide the cursor (always safe).
- `caption`: optional italic muted note shown below the window.

**Beats:**
- 0.3s: eyebrow glides in
- 0.67s: title glides in
- 0.93s: window glides in
- Each step advances after its `dwell + action-overhead` frame budget (click=+12f, type=+2f/char, navigate=+18f, reveal=+8f)
- Cursor spring: `damping: 26, mass: 0.7` — arrives within the first 60% of dwell, holds until click pulse fires
- Click pulse: `damping: 10, stiffness: 80` ring, scales 0.5→2.5 and fades 1→0 over ~20 frames

**Timing rule — overflow guard:** if the sum of step durations exceeds `scene.duration`, steps beyond that point are silently elided (a `console.warn` fires in dev mode). Author steps so their total dwell + overhead is ≤ 70% of `durationInFrames / fps` to leave a clean hold at the end.

**Visual notes:**
- Window chrome is generic cartoon chrome: HAIRLINE traffic-light dots, HAIRLINE URL bar, never any vendor logo.
- The cursor SVG arrow is brand-text stroke / bgBase fill (no crimson fill — cursor is neutral).
- `fidelity: 'cartoon'` shows a tooltip pill (dark bg, light text) floating above the cursor during each step's glide. The pill text is the step's `target` string — keep it short (≤ 20 chars).
- `fidelity: 'hybrid'` is only for lessons where the two-zone structural split (nav/content, form/preview) is the teaching point. Use sparingly.
- `data-decor` is on the cursor wrapper SVG so LayoutProbe skips it. The tooltip pill is **not** data-decor — its text is checked for safe-area compliance. Keep `targetPositions.x` between 12–85 and `y` between 10–85 to stay clear of edges.

**Honesty rule:** The window chrome is always generic; no vendor logos, vendor brand colors, or real UI assets appear. Step `uiState` text may describe a real product's behavior (Gate A verifies this), but the rendered panels use abstract shapes/labels — never fabricated real content.

**File:** `src/compositions/lesson-scenes/ScreenFlow.tsx`

---

## Adding new scene types

1. Implement the renderer in `templates/lesson-renderer.jsx`. Follow the existing pattern: function takes `{ scene, sceneStart }`, returns JSX wrapped in `<SceneFrame>`.
2. Add an entry here with content schema + beats.
3. If the type needs new primitives, add them to `templates/lesson-ui.jsx` and document them in `04-component-api.md`.
4. Add a usage example to `examples/`.
5. Bump the schema version in `05-content-schema.md`.

Do not let a one-off scene live only in a lesson file — promote it to the catalog so the next lesson can reuse it.
