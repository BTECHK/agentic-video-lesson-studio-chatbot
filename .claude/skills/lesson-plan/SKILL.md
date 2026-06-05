---
name: lesson-plan
description: Construct the load-bearing lesson plan for a Sample Academy lesson BEFORE any scene contract, script or animation is generated. Runs the learner-journey cascade from the course outline's objective, keeps every input in its lane (only the outline sets scope), budgets narration words per beat, and produces the plan that the scene contract, storyboard and narration script all render from. Trigger when the team says "plan lesson Topic N.M", "build the lesson plan for [lesson]", or before generating a script or scene contract for a new lesson.
---

# Sample Academy · Lesson Plan Builder

> **Plan before you generate.** The outline sets *what the lesson is*; the plan decides *how it will
> teach*. This skill builds the lesson plan **once, up front**, so the scene contract and the script
> render from one decision instead of being patched downstream.

This skill is **Stage 1** of the lesson pipeline:

```
Outline → [LESSON PLAN] → scene-contract + storyboard → narration script → render → gates
          ▲ you are here                                                            ▲ Definition of Done
```

The lesson plan is the **load-bearing artifact**. Don't skip it, and don't generate scenes or a
script straight from the outline. Doing that produces lessons that pass schema, render, audio and
coverage checks yet don't teach.

> **The outline stays the source of truth.** The plan is *derived from* it and never replaces it.
> A human can write the plan, this skill can draft it, or both can share the work. Either way, an
> approved plan must exist before anything is rendered.

## The two failure modes this prevents

1. **Weak scope fence.** Enrichment material (examples, reference docs, tool pages) drifts into
   deciding lesson order and scope, so the richest source wins instead of the authored one.
2. **Coverage ≠ teaching.** Every required fact is present, current, sourced and mapped to a row,
   and the learner still can't *do* anything new.

## Inputs are lanes (only the outline sets scope)

| Lane | Source (in this repo) | Sets… | **Never** |
|---|---|---|---|
| **Shape** | `.planning/curriculum/source-materials-extracted/course-outline.txt` → `content/curriculum/course-map.json` (row ids, minutes) + `content/curriculum/delivery-types.json` | Structure, scope, objective, delivery type per row | — |
| **Pedagogy** | this skill's journey cascade (below) | How the journey is built; whether it teaches | sets scope |
| **Facts** | `content/tools/*.json` + official vendor docs (verified by the accuracy sweep, Gate A) | Grounds every tool claim | sets scope or structure |
| **Illustration** | worked examples, sample tasks | Concrete, relatable examples | sets scope; fabricated outputs presented as real |
| **Voice** | `content/teaching/STYLE.md` | Cadence and wording, at the **script** stage only | leaks into the plan's structure |

If an enrichment source seems to demand new scope, raise a **flagged revision** (see below). Never
override the outline silently.

## Process — build the journey

### 1. Load the brief (Shape lane only)
Read the lesson's rows from `content/curriculum/course-map.json` (compiled from the outline). Capture
for each row: the **row id** (e.g. `T1.1.r2`), its minutes, its **delivery type**
(Slide / Demo / Talking-head) and its content. Also capture the outline's non-negotiables
(timed rows, engagement beats, locked labels). Don't open enrichment sources yet. The brief fixes
the destination first.

### 2. Run the journey cascade (Pedagogy lane)
The cascade is produced at plan time; the outline doesn't contain it. Answer, in order:

- **Learner:** who is the learner? (the course persona: a working professional)
- **Prior knowledge:** what do they already know, including what earlier lessons gave them?
- **Misconception to break:** what might they wrongly believe that this lesson should address?
- **Approach:** how will the lesson move them from where they are to the objective? (worked example,
  contrast, demonstration, …)
- **Payoff:** what can the learner do by the end that they couldn't before?
- **Takeaway:** the skill they can reuse beyond the examples shown.

### 3. Keep frameworks consistent
Use **at most one framework per concept** and say what it covers. Framework names and labels must
stay **stable across the whole course**, and the accuracy sweep guards that.

### 4. Sequence by dependency and delivery type, then budget the words
Each piece rests on the ones before it. Open by setting expectations, including what the lesson is
**not** (exclusions point to the lesson that owns that material). Carry the **delivery type per row**
end to end. Demo rows must use an interactive scene type
(`course-planning/contracts/interactive-mandate.md`), because a demo rendered as a slide is off-spec.

**Budget the words per beat** (`references/pacing-and-depth.md`, enforced mechanically). Duration
is audio-authoritative, so the narration's length *is* the video's length.

| Quantity | Formula |
|---|---|
| Authoring target | `outline minutes × 60 × 2.96 × 0.85` |
| Hard floor (Gate T fails below) | `outline minutes × 60 × 2.96 × 0.75` |
| Ceiling | `outline minutes × 60 × 2.96 × 1.20` |

Add a **~words column to the beat table**, weighted by each row's minutes. Demo beats get more than
their even share because they narrate input → output → what to notice at walkthrough pace. A beat
far under its allocation was summarized, not taught. Reopen that beat and teach it with a worked
example, a contrast, or a mistake to avoid. Don't pad it.

### 5. Pull evidence second, never first
*Now* bring in the Facts and Illustration lanes to ground claims and supply concrete examples.
Every tool claim needs a source ref (a `content/tools/<id>.json` profile or an official vendor
page). If a claim can't be confirmed on an official source, soften it or drop it. Off-outline ideas
become **review notes** (§5 Open / `openQuestions`), never lesson content.

### 6. Write the plan package
Write one folder per lesson from the templates in `course-planning/_templates/`:

```
course-planning/lessons/topic-N/lesson-N.M/
  LESSON-PLAN.md        ← LESSON-PLAN.template.md: brief (+ word-budget table) · journey cascade ·
                          scene breakdown (+ row and ~words columns) · animation notes · open questions
  scene-contract.json   ← scene-contract.template.json, validated by contracts/scene-contract.schema.json
  storyboard.md         ← storyboard.template.md: one key pose per scene id
```

Every scene carries the **outline row id** it maps to (fidelity), its **delivery type**, and a
`sceneType` from `course-planning/contracts/scene-type-catalog.md`. The `LESSON-PLAN.md` must name
its **Outline source**. Then run the gate:

```
node course-planning/validate.mjs     # contracts parse, sceneTypes valid, storyboard ↔ scene ids
```

**Worked example:** `course-planning/lessons/topic-1/lesson-1.1/` (sample lesson *How This Course
Works*: a 3-min, 3-row lesson with a 455-word budget, six scenes and one interactive
`setup-checklist`).

## Revision channel: hold the objective open
Building the journey can show that an outline row doesn't serve the learner, for example when it's
scoped for one audience but really serves two. Treat that as a **flagged revision**, neither a
silent override nor silent compliance. Name the problem, propose the adjustment, record it in the
plan's §5 / `openQuestions`, and keep going.

## Hand-off
- **To the render build:** the approved `scene-contract.json` is design-altitude. Claude Code maps
  it into the strict production `content/lessons/<id>/lesson.json`
  (`course-planning/contracts/planning-to-render.md`, `content/schemas/scene-types.ts`). The
  animated-lesson builder is `.claude/skills/animated-lesson/`.
- **To the script step:** `tsx scripts/generate-script.ts <lessonId>` embeds the word budget, and
  `--check` fails a SHORT script before any render. Narration is timed to what's on screen, in the
  Voice lane's cadence.
- **To the Definition of Done:** the plan's objective, payoff, takeaway and per-row beats are what
  the teaching-axis gate and the watch gate verify the finished MP4 against
  (`.planning/curriculum/LESSON-DEFINITION-OF-DONE.md`; Gate T = `npm run gate:timing`).

## What NOT to do
- Don't generate a scene contract or script before the plan exists.
- Don't let Facts, Illustration or Voice set scope or order. That's the outline's job only.
- Don't ship a list of examples as the lesson; say what idea they illustrate.
- Don't introduce a framework without saying what it covers.
- Don't fabricate tool outputs as if real. Animate the interaction faithfully.
- Don't silently comply with a broken outline row, and don't silently override it. Flag it.

## References (in this repo)
- `references/pacing-and-depth.md`: the word-budget discipline in full
- `course-planning/_templates/`: LESSON-PLAN, scene-contract and storyboard templates
- `course-planning/contracts/`: scene-type catalog, interactive mandate, motion contract,
  planning-to-render bridge, scene-contract schema
- `content/curriculum/course-map.json` + `content/curriculum/delivery-types.json`: the outline, compiled
- `.planning/curriculum/LESSON-DEFINITION-OF-DONE.md`: the gates a finished lesson must pass
