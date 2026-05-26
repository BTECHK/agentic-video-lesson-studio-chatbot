# `scenes/` — platform-walkthrough demo scenes (NOT lesson scenes)

These components are the **platform-walkthrough demo set** — they were built to
showcase the site and the animation skill in a short walkthrough video, not to
teach a lesson. This is intentional.

- `BrandElementsScene`, `ChatDemo`, `ComparisonView`, `ContentViewer`,
  `MotionTestScene`, `TitleCard`, `TypographyScene`

**The deliverable lesson scenes live elsewhere** — in
[`../lesson-scenes/`](../lesson-scenes), which implements the 14 schema'd lesson
scene types (`content/schemas/scene-types.ts`) rendered by `LessonVideo` and
shipped to Teachable as MP4. If you're looking for the animated-lesson
components, go there.

Keep the two sets separate: walkthrough/demo presentation here, teachable lesson
content in `lesson-scenes/`.
