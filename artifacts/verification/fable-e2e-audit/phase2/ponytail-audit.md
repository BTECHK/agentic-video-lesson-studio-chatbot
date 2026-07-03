# Ponytail Audit — Phase 2 (over-engineering scan)

Scope: `src/`, `scripts/`, `chatbot/src/` only. Read-only — no edits applied.
Excluded per task: `node_modules`, `artifacts/`, `out/`, `output/`, `.planning`
archives, `_claude-design-import` backups.

Method: manual read-through of every file in `src/lib/`, `src/compositions/`,
`scripts/`, `chatbot/src/lib/`, `chatbot/src/app/api/`, `chatbot/src/components/`,
cross-referenced against `package.json` scripts, `Root.tsx` composition
registrations, and grep for actual import sites (not just filename pattern
matches — several initial hypotheses below were checked and *dropped* when the
code turned out to be legitimately wired; only surviving findings are listed).

Line counts, `wc -l`, `git log`, and `Grep` outputs quoted below are the actual
commands run, not paraphrased.

---

## Ranked findings

### 1. `delete:` Six self-labeled "THROWAWAY" verification scripts still live in the active `scripts/` surface
**Location:** `scripts/_fv2-stills.ts`, `scripts/_gen-delta-stills.ts`,
`scripts/_sizzle-color-de.ts`, `scripts/_sizzle-color-lib.ts`,
`scripts/_sizzle-float-check.ts`, `scripts/_sizzle-icon-check.ts` (686 lines
total: 65+31+77+132+108+89+... see per-file wc below).

**Evidence:** every one of these files opens its docblock with the literal
word `THROWAWAY`:
```
scripts/_fv2-stills.ts:1:/**
scripts/_fv2-stills.ts:2: * THROWAWAY (FV2 verify). Capture true-color renderStill PNGs...
scripts/_gen-delta-stills.ts:1:/**
scripts/_gen-delta-stills.ts:2: * THROWAWAY. Generate true-color, uncompressed renderStill PNGs...
scripts/_sizzle-color-de.ts:2: * THROWAWAY (AC9 color proof)...
scripts/_sizzle-float-check.ts:2: * THROWAWAY (AC5 smooth-float proof)...
scripts/_sizzle-icon-check.ts:2: * THROWAWAY (AC1 pixel proof)...
```
None of the six appear as an `npm run` script in `package.json` (checked via
`git show HEAD:package.json` since the root `package.json` is currently
deleted in the working tree — see integrity note below). They are referenced
only from **completed** planning docs describing a finished facelift
verification pass:
```
.planning\FACELIFT-V2.md
agent-ops\FACELIFT-V2-MASTER-LIST.md
claude-design-delta\NEXT-SESSION.md
wiki\concepts\design-fidelity-html-vs-mp4.md
```
`scripts/_sizzle-color-lib.ts` (132 lines, shared ΔE2000/HSL pixel helpers) is
imported only by the other five throwaway scripts — it has no consumer once
they're gone.

**What to delete:** all six files (445 lines: `_gen-delta-stills` 31 +
`_sizzle-color-lib` 132 + `_sizzle-float-check` 108 + `_sizzle-icon-check` 89 +
`_sizzle-color-de` 77 + `_fv2-stills` 65 — wc -l confirmed above).
**What replaces it:** nothing — the facelift-V2 verification they served is
done and merged (commits `360836d`, `30827e7`, `1510843`). If the color/motion
proof technique is needed again, `scripts/compare.ts` (pixelmatch-based, still
wired) already covers the general "diff two renders" case.
**Risk:** none — zero live callers, zero npm script entries, self-documented
as disposable.

---

### 2. `stdlib:` (inverse) — `media-probe.ts` has zero unit tests despite being the single point of failure behind 3 production incidents
**Location:** `src/lib/media-probe.ts` (84 lines — `probeMedia`, `probeMotion`).

**Evidence:** grep for a matching test file:
```
$ grep -rln "media-probe" scripts test
scripts/gate-media.ts
scripts/gate-motion.ts
scripts/publish-to-drive.ts
```
No hit in `test/`. Compare with its sibling pure-logic modules, which **do**
have dedicated tests: `test/gate-media.test.ts`, `test/gate-motion.test.ts`
both exist and test `evaluateMedia`/`evaluateMotion` — but those only cover the
threshold math, never the ffprobe/ffmpeg/sharp parsing in `media-probe.ts`
itself (regex-extracting `max_volume` from ffmpeg stderr text, walking PNG
raw buffers for luma diffs, color-space string parsing). The module's own
docblock says it exists specifically because *"nothing checked the actual
encoded MP4"* caused two shipped defects (silent audio, frozen-frame
slideshow) — i.e. this exact parsing logic is the thing that previously broke
production, and it remains the one piece with no automated coverage. It's
depended on by both liveliness/media gates AND the final `publish-to-drive.ts`
precondition — the highest-blast-radius file in the pipeline with the
thinnest test net.
**Note:** this is the audit's "inverse" ask (under-tested for blast radius),
not a delete/simplify candidate — flagging for the wrap-up triage, not
proposing removal.

---

### 3. `yagni:` `LoggerSink` interface — three implementations, but only ever composed one way
**Location:** `src/lib/logger.ts:25-113` (`consoleSink`, `fileSink`,
`multiSink`, the `LoggerSink` interface).

**Evidence:**
```
$ grep -rln "multiSink|consoleSink|fileSink|LoggerSink" src scripts
src\lib\logger.ts   (only file in either tree)
```
`pipelineLogger()` (the only exported factory anything actually calls) always
builds `multiSink(fileSink(channel), consoleSink())` — no caller anywhere in
`scripts/` or `src/` ever constructs a sink directly or supplies an
alternate/partial composition. The `LoggerSink` abstraction (pluggable
record/print pair) exists to support a swap that has never happened in the
14+ scripts that use `runMain`/`pipelineLogger`.
**What to simplify:** collapse `consoleSink`/`fileSink`/`multiSink` into the
body of `pipelineLogger`, dropping the `LoggerSink` interface; keep the
already-legitimate test-injection points (`sink` override in
`LoggerOptions`, exercised by `test/logger.test.ts`) as a single inline object
literal instead of three composable factories.
**What replaces it:** one non-exported helper inside `pipelineLogger`.
**Risk:** low — would touch `test/logger.test.ts` (confirms it drives `sink`
overrides directly, not through `consoleSink`/`fileSink`/`multiSink` by name)
before removing; otherwise zero external callers to break.

---

### 4. `yagni:` (borderline, lower confidence) — `src/compositions/scenes/` walkthrough demo set may be past its useful life
**Location:** `src/compositions/scenes/{BrandElementsScene,ChatDemo,
ComparisonView,ContentViewer,MotionTestScene,TitleCard,TypographyScene}.tsx`,
consumed only by `BrandShowcase.tsx` and `PlatformWalkthrough.tsx`.

**Evidence:** the directory ships its own README explicitly disclaiming lesson
relevance:
> "These components are the **platform-walkthrough demo set** — they were
> built to showcase the site and the animation skill in a short walkthrough
> video, not to teach a lesson."

Both parent compositions remain registered in `Root.tsx` and are referenced by
`scripts/render-walkthrough.ts`, `scripts/verify-render.ts`, `scripts/pipeline.ts`,
`scripts/render.ts`, and by early-phase planning docs (`.planning/phases/
07.1-home-and-walkthrough/*`, `.planning/phases/01-rendering-environment/*`).
This is **not** dead code — it's still wired end-to-end and self-documented —
but no evidence surfaced of it being rendered/used since the early Phase-1/07.1
scaffolding work, and it duplicates conceptual ground now covered by the real
lesson-scenes system (14 schema'd scene types under `lesson-scenes/`) and the
sizzle reel (which now does the "showcase the product" job for stakeholders).
**What to check before cutting:** confirm with the user whether
`PlatformWalkthrough`/`BrandShowcase` still serve an active purpose (e.g. dev
sanity-check composition) or can be retired now that `SizzleReel` +
`SizzleManifesto` cover stakeholder-facing showcase needs.
**Risk:** medium if cut blind (still has live render/verify script paths) —
low if the user confirms it's superseded. Flagging as a question, not a
same-day deletion.

---

### 5. Repo-integrity note (not an over-engineering finding, but blocks re-verifying deps cleanly)
**Location:** repo root.

**Evidence:** `git status` at session start shows `package.json`,
`package-lock.json`, `eslint.config.mjs`, `tsconfig.json`, `vitest.config.ts`,
`.gitignore`, `.dockerignore`, `.gcloudignore`, `AGENTS.md`, `CLAUDE.md`,
`README.md`, `learnings.md`, `skills-lock.json`, `drive.config.example.json`,
`docker-compose.yml`, `docker-compose.chatbot.yml`, `ingest.config.json`, and
the standalone HTML lesson file all marked `D` (deleted) in the working tree,
while `node_modules/` and its `.bin` CLIs (tsx, vitest, remotion) are still
present from before the deletion. This audit used `git show HEAD:package.json`
to recover the dependency list for analysis above. Not scored as an
over-engineering finding (it's working-tree state, not code architecture) —
flagging because it should be resolved (restore vs. intentional removal
confirmed) before any dependency-pruning action from finding #1 is taken, and
because `scripts/ingest/config.ts` (`loadConfig()`) will hard-crash without
`ingest.config.json` on disk.

---

## What was checked and found clean (no finding)

To keep this report honest about what *doesn't* need action:

- **`src/lib/gate-*.ts` (5 files) + `scripts/gate-*.ts` (7 files):** look
  superficially like copy-paste (same runMain/log/return-code shape) but each
  gate's pure-logic module implements genuinely distinct verdict math (audio
  loudness + color space vs. adjacent-frame luma diffs vs. DOM-rect overlap
  vs. ffprobe duration vs. lesson-plan teaching axis), each with its own
  shipped-defect story in its docblock. Not duplication.
- **`chatbot/src/lib/llm/provider.ts` (`getLLMProvider` factory):** 4 real
  implementations (mock, claude-code, anthropic, google), each behaviorally
  distinct, switched by validated env config. Legitimate factory, not
  single-implementation yagni.
- **`src/lib/build-dag.ts`, `src/lib/wav.ts`:** hand-rolled (content-hash DAG,
  RIFF/WAVE chunk parser) but justified — no stdlib equivalent exists for
  either, and both are small, well-commented, and unit-tested
  (`test/build-dag.test.ts`, `test/wav.test.ts`).
- **`src/lib/grounding.ts`, `src/lib/animations.ts`, `chatbot/src/lib/
  llm/errors.ts`, `chatbot/src/lib/idempotency.ts`:** each has a real single
  caller path doing real work, not speculative flexibility.
- **Dependencies** (`cheerio`, `robots-parser`, `p-limit`, `pixelmatch`,
  `pngjs`): every one has exactly one legitimate active consumer
  (`scripts/ingest/*`, `scripts/compare.ts`); no orphaned deps beyond the
  throwaway scripts already flagged in #1.
- **Chatbot `studio/` Timeline/Playhead/Ruler/TrackLane/Clip (1712 lines):**
  initially hypothesized as conflicting with ADR-004 ("video is rendered from
  code, not edited in a timeline") — checked and dropped. It's a read-only
  pipeline-status/oversight control plane (fresh/stale artifact monitoring +
  comments + regen triggers), not a video editor. Does not contradict the ADR.
- **Chatbot API routes** (`api/generate/*`, `api/edits/*`, `api/regen/*`):
  32–109 lines each, no cross-route duplication found.

---

## net

net: **-531 lines, -0 deps** possible from finding #1 alone (445 lines of
throwaway scripts + ~86 lines collapsible in finding #3's `LoggerSink`
simplification). No dependency removals — every package in `package.json`
has a live, legitimate single consumer once the throwaway scripts are cut.
Finding #4 (~1,000+ lines across `BrandShowcase`/`PlatformWalkthrough`/
`scenes/`) is a question for the user, not counted in the confirmed total.
