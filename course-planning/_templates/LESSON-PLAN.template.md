# Lesson Plan — Topic {N}.{M}: {Lesson Title}

> Fill every `{…}`. Keep it grounded in the outline (scope) + the established voice (taste).
> Delete this quote block in the real file.

- **Outline source:** `course-outline.txt` Lesson {N}.{M} (lines {…}) {+ `content/curriculum/course-map.json` row ids if built}. Duration target: {X} min.
- **Build status:** {BUILT — see `content/lessons/{id}/` | DESIGNED FROM OUTLINE (not yet built)}.
- **Delivery mix (from the outline's row colors):** {🟦 Slide / 🟩 Demo / 🟧 Talking-head per beat}.
- **Why / Intent (for Claude Design):** {one line on what this lesson is FOR in the course arc — the
  job it does, so Design can review with the reasoning visible}.

## 1. Brief (from the outline — do not expand scope)
- **Objective:** {what the learner can DO after this lesson — one sentence}.
- **Required beats (timed, from the outline):**
  - **{time} — {beat title} ({🟦/🟩/🟧}):** {the beat's content, from the outline}.
  - … (one bullet per outline row)
- **Exclusions (lane discipline):** {what belongs to other lessons — don't cover it here}.
- **Non-negotiables:** {locked framework names/labels, citations}.

## 2. Journey cascade (pedagogy)
- **Learner / prior knowledge:** {who they are coming in; what earlier lessons gave them}.
- **Misconception to break:** {the wrong belief this lesson corrects}.
- **Approach that moves them:** {the teaching move — map-then-proof, contrast, etc.}.
- **Payoff:** {what clicks by the end}.

## 3. Scene breakdown (→ scene-contract.json)
One row per scene. `sceneType` MUST be from `scene-type-catalog.md`. Demo/in-tool beats MUST use an
INTERACTIVE type (`interactive-mandate.md`).

| # | sceneType | ~dur (s) | Layout / content | On-screen copy (keys) | VO (gist) | Interaction / motion |
|---|-----------|----------|------------------|------------------------|-----------|----------------------|
| 1 | cover | 8 | title + eyebrow + stats | title, eyebrow | "Welcome to…" | title glides, stats pop |
| 2 | {…} | {…} | {…} | {…} | {…} | {for interactive: the click-through steps} |

## 4. Animation notes (the "not a slideshow" specifics)
{For each demo/interactive scene, spell out the interaction Claude Code animates — e.g. "scene 4
screen-flow: cursor → New GPT → type 'Meeting Notes Formatter' → paste instructions → click Test →
response streams". This is the heart of the interactive mandate for this lesson.}

## 5. Assets / open questions
- **Assets referenced:** {tool logos, screenshots-to-mock, any data}.
- **Open for Claude Design / Instructor:** {anything needing a human call — flag it, don't guess}.
