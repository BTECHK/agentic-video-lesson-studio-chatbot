# Planning → Render bridge (two altitudes, one path)

> **Why / Intent (resolves a real gap a cross-model review caught):** the per-lesson
> `scene-contract.json` in this package is a **design-altitude** spec — `sceneType` + copy *intent* +
> timing + interaction notes — sized for Claude Design to review pacing/scene-choice/visual design.
> It is **NOT** the production render input. The Remotion renderer validates a **stricter per-type
> content schema** (`content/schemas/scene-types.ts` → `SCENE_CONTENT_SCHEMAS`, consumed as
> `content/lessons/<id>/lesson.json`). This file makes the path between the two explicit so nobody
> assumes the planning JSON renders as-is, and so Design improves toward shapes that WILL render.

## The two artifacts
| | Planning scene-contract (this package) | Production lesson.json (the renderer) |
|---|---|---|
| Altitude | design: what scene, when, what it says/does | production: exact validated content per type |
| Lives in | `course-planning/lessons/.../scene-contract.json` | `content/lessons/<id>/lesson.json` |
| Validated by | `course-planning/validate.mjs` (sceneType ∈ 17, parses, storyboard refs) | `content/schemas/lesson.ts` + `scene-types.ts` (strict Zod per type) |
| `copy` shape | loose, intent-level (e.g. `panels[]`, `studentMsg/botMsg`, string `steps`) | strict `content` per type (see table) |

## The build step (who closes the gap)
After Claude Design reviews/improves the plans, **Claude Code** generates the production `lesson.json`
from the approved scene-contract — mapping each scene's design `copy`/`motion` into the strict
`content` shape its `sceneType` requires, then `vitest`/schema-validates it before render. That
mapping is a bounded, mechanical build step; it is intentionally NOT done in the planning layer
(the plans will change during Design review, so producing render-strict JSON now would be thrown away).

## Required render `content` per sceneType (the target shapes)
Authoritative source: `content/schemas/scene-types.ts` (`SCENE_CONTENT_SCHEMAS`). `?` = optional.

| sceneType | Required `content` fields at render time |
|---|---|
| `cover` | eyebrow, title, sub |
| `quote-card` | eyebrow, quote, attribution |
| `preview-band` | eyebrow, title |
| `journey-map` | eyebrow, title, sub, variant?, stops[]{id,label,title,state} |
| `feature-grid` | eyebrow, title, features[]{id,n,cat,title,sub,focusAt} |
| `recap-grid` | eyebrow, title, cards[] |
| `assignment-list` | eyebrow, title, sub, tasks[]{id,bold,context}, callout?{label,body} |
| `capability-table` | eyebrow, title, footnote?, headers[], rows[]{id,label,cells[B/Y/L/-]} |
| `audit-quadrant` | eyebrow, title, yAxis{top,bottom}, xAxis{left,right}, **tasks[]{id,label,cap,quadrant(tl/tr/bl/br)}** (2–8) |
| `tool-card-reveal` | eyebrow, title, sub, tools[]{id,name,logo,tag,oneliner} |
| `dig-deeper` | (loose — render schema is `z.object({})`; carries optional leave-behind detail) |
| `demo-cue` | eyebrow, title, sub, meta[] |
| **`comparison-chats`** | eyebrow, title, caption?, **prompt**, **tools[]{id,name,logo,response}**, tether? |
| **`tool-demo`** | eyebrow, title, caption?, **tool{name,logo?}**, **prompt**, **outputs[]{id,kind(image\|file\|slides\|app\|text),label,sub?,badge?}** (1–3) |
| **`voice-demo`** | eyebrow, title, sub, **transcript**, transcriptLabel |
| **`setup-checklist`** | eyebrow, title, sub, **items[]{id,name,why,activateAt}**, cursor? |
| **`screen-flow`** | eyebrow, title, caption?, **windowTitle**, **fidelity**(cartoon\|hybrid), **layout**(full\|split), **steps[]{id, action(click\|type\|navigate\|reveal), target, typedText?, uiState, dwell}**, targetPositions? |

## For Claude Design
You don't have to author the strict shapes — but when you improve a scene, keep its design intent
**mappable** to the row above (e.g. a `comparison-chats` scene should name a single shared `prompt`
and the tools + their responses; a `screen-flow` should be expressible as ordered click/type/navigate/
reveal steps). Flag anything that can't map as a new-component request.
