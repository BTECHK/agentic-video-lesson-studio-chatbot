# Lesson Plan — Topic 1.1: How This Course Works

> **Sample content.** A synthetic lesson from the sample course *Practical AI Assistants*, included to
> show how a lesson is planned: brief → journey cascade → word budget → scenes → animation notes.

- **Outline source:** `.planning/curriculum/source-materials-extracted/course-outline.txt` → Topic 1, Lesson 1.1
  (rows `T1.1.r1`–`T1.1.r3` in `content/curriculum/course-map.json`). Duration target: 3 min.
- **Build status:** DESIGNED FROM OUTLINE. The production render input
  (`content/lessons/topic-1-lesson-1/lesson.json`) is generated from the approved contract at build time
  (see `contracts/planning-to-render.md`).
- **Delivery mix (from the outline's row colors):** 🟧 Talking-head (`T1.1.r1`) · 🟦 Slide (`T1.1.r2`) ·
  🟩 Demo (`T1.1.r3`).
- **Why / Intent (for Claude Design):** the front door of Topic 1. It has one job: show the learner how
  every lesson in this topic runs (see the idea → watch it in a tool → try it on your own task), where the
  four skill lessons sit, and get them set up to practice. Keep it calm and orienting. Lessons 1.2–1.5 are
  the hands-on ones.

## 1. Brief (from the outline — do not expand scope)
- **Objective:** the learner can describe the three-step rhythm every Topic 1 lesson follows, name the four
  skills Topic 1 builds (pick, prompt, check, personalize), and has an assistant, a practice chat, a practice
  log and one real task ready before Lesson 1.2.
- **Required beats (timed, from the outline):**
  - **1 min — Welcome + how the course is paced (🟧, `T1.1.r1`):** short lessons, one skill each. Every
    skill is shown in a real assistant first, then practiced on the learner's own work.
  - **1 min — Topic 1 at a glance + the lesson rhythm (🟦, `T1.1.r2`):** the five Topic 1 lessons as a
    map with 1.1 active; the rhythm every lesson repeats: *See the idea → Watch it in a tool → Try it on
    your own task.*
  - **1 min — Get ready to practice (🟩, `T1.1.r3`):** a four-item setup checklist. Engagement beat:
    pick one real task from your week and hold onto it. Hand-off to 1.2.
- **Word budget (`.claude/skills/lesson-plan/references/pacing-and-depth.md`):** 3 min × 60 × 2.96 wps
  → authoring target ×0.85 ≈ **453 words**, hard floor ×0.75 ≈ **400**, ceiling ×1.20 ≈ **639**.
  Per row (1 min each): floor 133, ceiling 213. The demo row gets more than its even share because it
  runs at walkthrough pace.

  | Row | Beat | Delivery | Row min | ~words (target) | Row floor | Scenes |
  |---|---|---|---|---|---|---|
  | `T1.1.r1` | Welcome + pacing | 🟧 | 1 | 150 | 133 | `cover`, `one-skill-at-a-time` |
  | `T1.1.r2` | Topic map + rhythm | 🟦 | 1 | 145 | 133 | `topic-1-map`, `lesson-rhythm` |
  | `T1.1.r3` | Get ready to practice | 🟩 | 1 | 160 | 133 | `practice-setup`, `up-next` |
  | | **Total** | | **3** | **455** | **400** | 6 scenes |

- **Exclusions (lane discipline):** no tool comparison (that's 1.2), no prompt techniques (1.3), no
  output-checking method (1.4), no custom-instruction or memory setup (1.5), nothing about automating
  tasks (Topic 3). This lesson frames and prepares. It teaches no tool skill.
- **Non-negotiables:** the three rhythm labels are reused word-for-word in every Topic 1 lesson. Tools
  are named only from `content/tools/*.json`. No plan, price or feature-availability claims appear in
  this lesson, so it has no facts that can go stale.

## 2. Journey cascade (pedagogy)
- **Learner / prior knowledge:** a working professional who has tried an AI assistant a few times, mostly
  for one-off questions. Has finished Lesson 0.1 (*Welcome to the Sample Course*). Knows the course exists
  but not how a lesson is structured or what they'll be asked to do.
- **Misconception to break:** "A course about AI assistants is something I watch." The lesson reframes it:
  every lesson ends with the learner doing the skill on their own task, because watching alone doesn't
  build it.
- **Approach that moves them:** map, then ritual. Show where they are (the Topic 1 map), name the repeatable
  rhythm, then make the first practice step concrete with a checklist they finish before moving on.
- **Payoff:** the learner reaches 1.2 with an assistant open, a practice log started and one real task
  picked, so every later lesson has real work to practice on.
- **Takeaway:** *idea → example → own-task practice* works for learning any new tool, not just
  this course.

## 3. Scene breakdown (→ scene-contract.json)
`sceneType` values come from `scene-type-catalog.md`. The one Demo row uses an interactive type
(`interactive-mandate.md`). Durations are design estimates. Narration is authoritative (timing
inversion), so the synthesized audio sets the final frame counts at build.

| # | id | sceneType | Row | ~dur (s) | Layout / content | On-screen copy (keys) | VO (gist) | ~words | Interaction / motion |
|---|----|-----------|-----|----------|------------------|------------------------|-----------|--------|----------------------|
| 1 | `cover` | cover | r1 | 20 | title + eyebrow + sub + 3 stats | eyebrow, title (2 lines), sub, stats | "Welcome to Topic 1. Here's how the next five lessons work." | 50 | title glides up (outCubic), stats pop staggered (outBack) |
| 2 | `one-skill-at-a-time` | quote-card | r1 | 40 | pull quote + attribution | eyebrow, quote, attribution | "One skill per lesson. You see it in a real assistant, then you use it on your own work." | 100 | quote fades up, accent rule draws (inOutCubic), idle float hold |
| 3 | `topic-1-map` | journey-map | r2 | 30 | 5-stop Topic 1 map, 1.1 active | eyebrow, title, sub, stops | "Five short lessons: pick, prompt, check, personalize. You're at the start." | 75 | path draws (inOutCubic), active stop pulses (outBack) |
| 4 | `lesson-rhythm` | recap-grid | r2 | 30 | 3 numbered cards | eyebrow, title, cards | "Every lesson runs the same way: see the idea, watch it in a tool, try it on your own task." | 70 | cards stagger in 6f apart (outCubic) |
| 5 | `practice-setup` | setup-checklist | r3 | 42 | 4-item checklist + cursor | eyebrow, title, sub, items | "Four things to have ready before Lesson 1.2." | 115 | cursor glides to each item, clicks, check pops, row tints (see §4) |
| 6 | `up-next` | preview-band | r3 | 18 | coming-next band | eyebrow, title | "Hold onto that task. Next, we pick the right assistant for it." | 45 | band slides in (outCubic), title lands |

## 4. Animation notes (the "not a slideshow" specifics)
- **`practice-setup` (setup-checklist)** is the only interactive scene, the one place the learner
  watches something get *done*. All four rows land unchecked (stagger 6f). Then, per item, the cursor
  glides to the checkbox (outCubic, ~18f), clicks, the check pops (outBack), the row tints to
  `accentSoft`, and its "why" line fades up. Items activate at scene frames **90 / 360 / 630 / 900**.
  Item 4 (*Pick one real task from your week*) is the engagement beat. The cursor parks beside the open
  checkbox while the narration asks the learner to pause and write the task down, then it ticks
  (~frame 1080). `SceneAmbient` keeps drifting through the pause so the hold never reads as a freeze.
- **`topic-1-map` (journey-map)** is the "alive" data scene. The connecting path draws through all five
  stops (inOutCubic), and stop 1.1 is the focal node (accent fill + gentle pulse). Stops 1.2–1.5 sit
  muted ahead. This is a lesson-level map (`variant: standard`), not the course-wide one.
- **Quote-card + cover holds:** after landing, the quote block runs the idle sine float from
  `motion-contract.md`, and `SceneAmbient` drift sits behind every hold.

## 5. Assets / open questions
- **Assets referenced:** none beyond brand tokens. The checklist names no specific tool, and the
  narration says "any assistant from the course tool list", so no logos are needed.
- **Open for Claude Design / Instructor:** one non-blocking question. `preview-band` has no sub line in the
  render schema. If the "bring your task" reminder should stay on screen in `up-next`, that needs a small
  component request. Otherwise it stays narration-only.
