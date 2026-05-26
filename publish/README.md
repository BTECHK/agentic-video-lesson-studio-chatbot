# `publish/` — review bundles (Drive-synced)

This folder holds **per-lesson review bundles**. It is the handoff point for
async video review and for the eventual Teachable upload.

```
publish/<id>/
  <id>.mp4             the rendered video (watch in Google Drive)
  script-reference.md  scene-by-scene narration — cite scenes by id
  manifest.json        version stamp (scriptHash detects video↔script drift)
  REVIEW-NOTES.md      reviewer's notes (timestamp · scene id · change)
```

Everything here is **git-ignored** (only this README is tracked) — MP4s are too
big for git. Instead, this folder is meant to be **synced via Google Drive for
Desktop** so it's shared between machines (tech lead on Windows, Instructor on Mac).

## The async review loop

1. Render the lesson, then package it:
   `npm run publish:lesson <id>` → writes `publish/<id>/` (a self-contained bundle).
   Point it at your Drive folder with `REVIEW_BUNDLE_DIR=/path/to/DriveFolder`.
2. **Instructor** opens the bundle in Google Drive, watches `<id>.mp4`, and records edits
   in `REVIEW-NOTES.md` (timestamp + scene id from `script-reference.md` + a
   specific change). Emailed notes get pasted into the same file.
3. **Claude Code** reads `REVIEW-NOTES.md` + the script, applies the edits,
   re-renders, and re-runs `publish:lesson` to refresh the bundle.

`REVIEW-NOTES.md` is **never overwritten** by re-publishing — only seeded once —
so review notes are safe across re-renders.

## Drift protection

`manifest.json` stamps the **scriptHash** the video was rendered from. If the
script changes after a render, the next publish shows a new hash — so you always
know whether a given MP4 matches the current script before reviewing it.

## Teachable

The same approved MP4 is the upload-ready master. Teachable has no upload API,
so the final step is a manual drag into the Teachable lesson's video block.

## Why not git for the video?

GitHub caps files at 100MB and bloats permanently with binaries; Git LFS is
paid beyond a tiny tier. So git carries source + notes (small, and Claude Code
reads them); Drive (now) / cloud storage (later) carries the video.
