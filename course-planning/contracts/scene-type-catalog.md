# Scene-Type Catalog — the 18 building blocks

> **Why this exists:** a lesson video is assembled from a fixed set of pre-built, brand-locked
> scene components (Remotion). Planning a lesson = choosing a sequence of these types and filling
> their content. You may NOT invent a new `sceneType` — if content is a 90% fit, use the closest
> type. The exact strings below are the only valid `sceneType` values (they match
> `src/compositions/lesson-scenes/register.ts`; the validator rejects anything else).
>
> **For Claude Design:** these are the components Claude Code can already render. When you improve a
> plan, keep `sceneType` to this list, or flag a genuinely missing type as a new-component request.
>
> **Render content shapes:** the planning `scene-contract.json` carries design-altitude `copy`; each
> type's STRICT render `content` shape (what the build step must produce) is in
> `planning-to-render.md` (source of truth: `content/schemas/scene-types.ts`). Keep scenes mappable to it.

## Interactive (animate the interaction — use these for any Demo / in-tool / "show it" beat)
| sceneType | Animates | Use when the outline says… |
|---|---|---|
| `screen-flow` | A click-through: gliding cursor, clicks, typing, UI state changes across steps | "Demo: do X in the tool", a multi-step workflow, building/configuring something, a tour |
| `tool-demo` | A single AI tool moment: prompt typed in, response streams out, interface state | "Show ChatGPT/Claude doing X", one prompt→output beat |
| `comparison-chats` | Two (or more) chat panels side-by-side, responses animating together | "Prompt A vs Prompt B", "Before vs after", any A/B output |
| `voice-demo` | Voice input: waveform, live transcription, response streaming | "Voice input demo", talking to the AI |
| `setup-checklist` | A checklist whose items animate in and check off | "Set up your workspace", step-by-step config, "here's your setup" |
| `tool-card-reveal` | Cards revealing tool/feature capabilities progressively | Introducing a set of tools/features one at a time |
| `demo-cue` | An instruction/prompt cue with an animated callout (a lightweight demo lead-in) | A short "here's the prompt we'll use" beat before a bigger demo |

## Data / framework (animated, structured — for concepts and comparisons)
| sceneType | Renders | Use when… |
|---|---|---|
| `capability-table` | A Best/Yes/Limited/— matrix (capabilities × tools) | "Capability comparison chart", any tool×feature grid |
| `feature-grid` | A 4-item numbered card grid (01–04) | "By the end you'll get…", a 3–4 item framework |
| `recap-grid` | 3 recap cards | "Here's what we covered", wrap summaries |
| `assignment-list` | A bulleted task list with emphasis | "Your assignment", action items |
| `audit-quadrant` | A 2×2 scatter (e.g. Effort × Impact) | "Prioritization", quadrant frameworks |
| `journey-map` | The course progress map (stops, active highlight) | "Course journey map", "you are here" |
| `progression-curve` | Labelled stage chips on a smooth rising path (optional dip), with an optional self-locating marker | "levels", "maturity model", any low→high progression |

## Title / narrative (framing — not the body of a lesson)
| sceneType | Renders | Use when… |
|---|---|---|
| `cover` | Lesson/topic title card (eyebrow, title, sub, stats) | Lesson open ("How This Course Works") |
| `quote-card` | Pull quote + attribution | A spoken hook, a memorable line, talking-head moments |
| `preview-band` | "Coming next" preview text | Teasing the next lesson/topic |
| `dig-deeper` | A leave-behind "dig deeper" detail card | Optional depth, a resource pointer |

## Rules
- **Demo beats are NEVER `cover`/`quote-card`/`feature-grid`.** If the outline color is 🟩 Demo
  (in-tool) or the copy says "show / demo / side-by-side / put the prompt in", pick an **interactive**
  type. This is the "not a slideshow" mandate — see `interactive-mandate.md`.
- **Talking-head** beats (🟧, Instructor on camera) render as a narrated `quote-card` or a full-bleed
  narrator moment — NOT a camera (animation-first; see the repo's "Animation-First" model).
- **Slide** beats (🟦) use the data/framework or title types.
- One beat may need 1–N scenes; one scene may cover a short beat. Keep scene durations realistic
  (a 4-min demo beat is several `screen-flow`/`tool-demo` scenes, not one 4-min scene).
