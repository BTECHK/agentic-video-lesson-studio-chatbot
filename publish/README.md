# `publish/` — Teachable upload staging

This folder holds **upload-ready lesson masters**. It is the last stage of the
pipeline before a human uploads to Teachable.

```
content/lessons/<id>/   source content + props (git-tracked)
out/<id>.mp4            rendered output (gitignored)
publish/<id>.mp4        ← approved master, staged for manual upload (gitignored)
publish/<id>.manifest.json   provenance + status (gitignored)
```

## Why manual upload

Teachable has **no programmatic video-upload API**. Its public API is read-only
for course content (no endpoints to create courses/sections/lessons or upload
media) and is gated behind a paid plan tier. So the honest handoff is:

1. Render the lesson: `npm run align:lesson <id>` → `npm run render -- LessonVideo out/<id>.mp4`
2. Stage it: `npm run publish:lesson <id>` (validates 2GB limit, copies to `publish/<id>.mp4`, writes a manifest)
3. **Manual step:** in the Teachable admin, open the course → section → lesson and
   upload `publish/<id>.mp4` via the lesson video block.

`publish:lesson` accepts `--source <path>` to override the default `out/<id>.mp4`.

Masters and manifests are regenerated artifacts and are gitignored; only this
README is tracked.
