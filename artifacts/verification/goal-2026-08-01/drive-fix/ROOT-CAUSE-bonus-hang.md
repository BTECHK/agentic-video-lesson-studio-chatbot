# extras-topic publish:drive hang — root cause

## Symptom
`npm run publish:drive -- <extras-lesson-id> --source out/v3/<extras-lesson-id>.mp4` reaches
`INFO media + motion gates green on source video` within seconds/minutes (proportional to video
length — normal), then hangs indefinitely. It happened for every lesson of one special topic and
for no other. Confirmed hung, not slow:
- The Node worker process (`tsx scripts/publish-to-drive.ts ...`) accumulates active CPU time
  continuously over tens of minutes of wall time — not blocked/idle.
- Zero filesystem progress the entire time: no `.part` temp file, no destination file, in the
  lesson's actual Drive folder.
- Raw `cp` of the exact same source file into an ALREADY-EXISTING, already-synced Drive folder
  completes in under 1 second — proves Drive I/O and the mount itself are not the bottleneck.

## Root cause (confirmed via source read, not just inference)
`src/lib/drive-publish.ts` `lessonDriveTarget()` derives the Drive target path generically from
`course-map.json` for every topic:

```
moduleFolder = `Module ${topic.number} — ${topic.title}`
lessonFolder = `Lesson ${lesson.number} — ${lesson.title}`
```

For the special "extras" topic in `content/curriculum/course-map.json` (its own topic number,
lessons numbered `"B.0"`, `"B.1"`, ...), this computes a nested `Module N — <topic title>` /
`Lesson B.n — <lesson title>` path.

**None of these folders exist on Drive.** The real, human-created folders live at a top-level
extras folder with its own naming convention, which the mapping function had no special case for.

`pickFolder()` finds no existing folder matching the `Module N` prefix, so it falls through to the
canonical (non-existent) name. `publish-to-drive.ts` then calls `fs.mkdirSync(destDir, { recursive: true })`
to create this brand-new, previously non-existent nested folder path *from scratch* under the Google
Drive virtual filesystem mount. Every raw-copy diagnostic test (which all returned instantly) wrote
into folders that **already existed and were already synced** — none of them exercised fresh
multi-level folder *creation* on the Drive mount. Creating new folders through Node's synchronous
`fs.mkdirSync` against Google Drive's Cloud Filter API mount is the one operation type never exercised
by the earlier successful publishes (their target folders already existed) — and is the one operation
this hangs on.

## Why this is deterministic, not transient
Every lesson of the extras topic routes through the same topic entry in course-map.json and therefore
computes the identical (wrong, non-existent) parent folder. This is a code path, not a flaky I/O
condition — it reproduces identically every time until `lessonDriveTarget()` (or the course-map
entry) is given a special case for the extras topic's actual Drive folder-naming convention. It was
reproduced independently on two lessons; the remaining lessons share the identical code path, so
re-running them would not add new information, only burn more time. Their gates were confirmed green
via `gate:status`.

## Side effects / cleanup
Confirmed via directory sweep of the full Curriculum tree (3 levels deep) after killing the hung
processes: **zero** stray folders, **zero** `.part` temp files anywhere. The hang occurs before (or
during, without completing) the folder-creation step, so nothing was left behind on Drive. All killed
processes were confirmed terminated, with no lingering `node` processes running `publish-to-drive`.

## Out of authorized scope
Task authorization was `npm run publish:drive -- <lessonId>` ONLY — no code edits authorized. This is
a script bug, not a gate failure and not something `--force` would fix (force only bypasses the
gate-green precondition check, not the folder-path derivation). Fixing `lessonDriveTarget()` /
`pickFolder()` to special-case the extras topic's folder-naming convention is required before any of
its lessons can publish via this script.
