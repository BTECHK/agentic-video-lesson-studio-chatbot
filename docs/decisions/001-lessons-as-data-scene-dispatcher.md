# ADR-001: Lessons are validated data; scenes are dispatched by type from a registry

- **Status:** Accepted and implemented. The schemas and dispatcher first appear in the history on 2026-05-13, the first day of the project.
- **Scope:** the lesson document format and the render entry point.

## Context

The first lessons were hand-authored, silent Remotion compositions with frame durations typed by
hand ([spec section 1](../superpowers/specs/2026-05-23-codified-lesson-pipeline-design.md)). Keeping a
lesson current after a tool changed meant re-authoring it, which the spec calls "the human
equivalent of re-recording".

The system needs to produce many lessons whose content changes often, so:

- adding or changing course content must not mean writing React;
- a malformed lesson must fail in milliseconds, not after a render that takes tens of minutes to hours;
- the same structure has to be readable by the scene planner, the gates and the operator UI.

## Decision

1. **A lesson is one JSON document**, `content/lessons/<id>/lesson.json`, validated by
   `LessonSchema` (Zod) in [`content/schemas/lesson.ts`](../../content/schemas/lesson.ts).
2. **Scene types are a closed enum.** `SCENE_TYPES` in
   [`content/schemas/scene-types.ts`](../../content/schemas/scene-types.ts) lists 18 types. Each has a
   Zod content schema, gathered in `SCENE_CONTENT_SCHEMAS`. `SceneBaseSchema.superRefine` validates a
   scene's `content` against the schema for that scene's `type`, so a wrong shape is reported with a path.
3. **Timeline invariants live in the schema.** The first scene starts at 0, each scene starts where the
   previous one ends, and `lesson.duration` equals the last scene's end.
4. **A registry dispatches type to component.**
   [`scene-dispatcher.ts`](../../src/lib/scene-dispatcher.ts) exposes `registerSceneComponent` (throws
   on a duplicate) and `getSceneComponent` (returns `null` for an unknown or unregistered type).
   [`register.ts`](../../src/compositions/lesson-scenes/register.ts) registers all 18 components and is
   idempotent so hot reload and repeated test imports are safe.
   [`LessonVideo.tsx`](../../src/compositions/LessonVideo.tsx) lays scenes out on a Remotion `<Series>`
   and renders a visible "No component registered" scene instead of crashing on a gap.
5. **New fields are additive.** `narration`, `zoom` and `motionProfile` are optional. A lesson without
   `motionProfile` resolves to the `v3` profile (`lesson.lesson.motionProfile ?? 'v3'` in
   `LessonVideo.tsx`), so existing lesson files stay valid without edits.
6. **Look-and-feel values are read-only for components.** Palette, type weights, leading, spacing, safe
   area and motion durations live in [`src/brand/tokens.ts`](../../src/brand/tokens.ts). A parity test
   scans scene sources and fails on drift, for example by allowing `weights.extraBold` only a fixed
   number of times per file ([`test/parity.test.ts`](../../test/parity.test.ts)).

## Consequences

Positive:

- A content change is a JSON diff, and `npm run validate:content` plus the schema tests catch
  structural errors before any render.
- The scene planner can emit lessons, the gates can read them, and the console's Studio timeline is
  derived from the same document ([`studio-timeline.ts`](../../chatbot/src/lib/studio-timeline.ts)).
- Adding a scene type is a checklist with teeth: enum entry, content schema, component, registration.
  Tests pin the count (`has exactly 18 scene type entries`, `registers a component for all 18`), so a
  half-finished type fails CI.

Costs and limits:

- **The vocabulary is closed.** A new visual idea is a code change in four places, not a content edit.
- **Content typing is runtime only.** The base schema types `content` as `Record<string, unknown>` and
  validates it in `superRefine`, so TypeScript cannot narrow a scene's content statically.
- **Some per-type facts live outside the schema.** The list of simulated-tool scene types is a literal
  array in `LessonVideo.tsx`, and minimum on-screen durations exist for 10 of the 18 types in
  [`scene-planner.ts`](../../src/lib/scene-planner.ts) (the rest use a 3 second default).
- **No migration path.** `schemaVersion` is the literal `'1.0'`; a breaking change would need a new
  mechanism.

## Alternatives considered

- **Hand-authored composition per lesson.** This was the starting point and is what the design spec
  set out to replace.
- **Editing video in a timeline tool, or recording hosted demos.** The architecture decision log
  rejected a CapCut-style tool driven through an unofficial backend (a manual export step and less
  control than code that already runs), hosted demo recorders (not open-source or local, off-brand,
  cannot fold in an already-rendered MP4), and a second code-based renderer (Revideo) because Remotion
  was already in use. See ADR-004 in
  [`wiki/concepts/architecture-decisions.md`](../../wiki/concepts/architecture-decisions.md).

## Evidence

- Schemas: [`content/schemas/lesson.ts`](../../content/schemas/lesson.ts),
  [`scene-types.ts`](../../content/schemas/scene-types.ts), [`outline.ts`](../../content/schemas/outline.ts),
  [`script.ts`](../../content/schemas/script.ts)
- Dispatch: [`src/lib/scene-dispatcher.ts`](../../src/lib/scene-dispatcher.ts),
  [`register.ts`](../../src/compositions/lesson-scenes/register.ts),
  [`LessonVideo.tsx`](../../src/compositions/LessonVideo.tsx)
- Tests: [`test/scene-dispatcher.test.ts`](../../test/scene-dispatcher.test.ts),
  [`test/lesson-scenes-register.test.ts`](../../test/lesson-scenes-register.test.ts),
  [`test/schemas.test.ts`](../../test/schemas.test.ts), [`test/parity.test.ts`](../../test/parity.test.ts)
- Sample data: [`content/lessons/`](../../content/lessons/)
