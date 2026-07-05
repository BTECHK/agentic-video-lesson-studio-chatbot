# PLAN — Hail-Mary Overhaul (2026-07-04, branch `lastminutefable-hail-mary`)

Source of truth for findings: the nine-minds audit results (not included in this copy)
(9-persona ouroboros-style audit: Contrarian, Simplifier, Hacker, Architect, Evaluator,
Instructor, Novice-learner, Stakeholder, A11y-learner) + 3 research reports
(`research-video-engagement.md`, `research-ux-a11y-delivery.md`, and a security/GTM report not included in this copy)
+ orchestrator verification (caption keyframe crop, missing-words[] check, the 2511f static hold).
Acceptance: `docs/ACCEPTANCE.md`. State: `agent-ops/STATE.json`.

## Verified headline findings (what this plan answers)

| # | Finding (persona, verified) | Verdict |
|---|---|---|
| 1 | Captions washed-out to the point a persona mistook them for clipped/broken (Novice-learner P0 → verified: NOT clipped, but ~4.5:1 contrast on 0.55-alpha chip reads broken) | FIX NOW |
| 2 | Several lessons: audio but no `words[]` → zero captions (A11y P0, verified 0 matches) | EXPORT + QUEUE ALIGN |
| 3 | Scene counter 2.06:1, inactive dots 1.35:1 contrast (A11y P1, token math confirmed) | FIX NOW |
| 4 | Hard cuts between all scenes; longest static hold 83.7s (Evaluator P1, verified 2511f) | v4 MOTION |
| 5 | gate:motion satisfied by background wallpaper alone (Contrarian P0, code comment admits it) | v4 foreground motion (substance) + rec |
| 6 | Pixel-identical covers across all lessons; sim-disclaimer stamped on every demo scene (Contrarian P0/P1) | v4 VARIANTS + once-per-lesson chip |
| 7 | Webhook secret rides in URL path; bot container runs as root, unpinned base (Hacker P0/P1) | FIX NOW |
| 8 | Zero traction instrumentation + zero GTM artifact (Stakeholder P0×2) | MINIMAL EVENTS + GTM one-pager |
| 9 | Instructor has no terminal-free path for any core task; no gate FAQ (Instructor P0) | README SECTION |
| 10 | Three contradictory "canonical" state docs (Simplifier P0) | ARCHIVE STUBS |
| 11 | Marketing page hardcodes curriculum (Stakeholder P2) | READ COURSE-MAP |

## Goals (ranked, the user's categories)

- **G1 Accessibility — captions people can read.** Contrast fix (burned-in) + `.srt` sidecar
  export for Teachable upload — improves every delivered video with NO re-render.
- **G2 Look & feel — v4 motion system.** Additive `motionProfile: 'v3' | 'v4'` seam (never a
  22-component fork): scene-exit glides (kills hard cuts with zero timeline/audio change —
  schema contiguity + per-scene audio forbid TransitionSeries), word-synced progressive
  reveal in QuoteCard (kills 83.7s static holds with FOREGROUND motion), per-topic Cover
  variants, tokenized ambient (de-hardcode SceneAmbient constants), motion-hygiene sweep
  (5 components inline-easing → shared helpers; retire legacy `src/lib/animations.ts` springs).
- **G3 Look & feel/GTM — honesty chip once per lesson.** First sim scene shows
  `SimDisclaimer`; later sim scenes drop it. Honesty kept, fatigue killed.
- **G4 Security — bot hardening.** Fixed webhook path (secret OUT of URL), header-only
  timing-safe auth, refuse-boot-if-unset, `USER node` + digest-pinned base, deploy posture doc.
- **G5 UX — Instructor operability.** README task table (no terminal needed) + plain-language
  gate FAQ + assumptions.md pointer.
- **G6 Functionality — docs coherence.** Archive the stale state/handoff docs as dated stubs
  pointing at the current-state doc; ROADMAP.md redirect banner.
- **G7 GTM — one-pager + minimal traction events.** a GTM one-pager (research-sourced
  benchmarks + owner decisions; not included in this copy); bot appends JSONL usage events (hashed user, ts, kind).
- **G8 Functionality — marketing page reads course-map.json.**

## Execution waves (file-disjoint packets)

**Wave 0 — foundation (1 builder, first):**
- `src/brand/tokens.ts`: `MOTION` block (glide/pop durations, stagger step, exit duration,
  ambient rates/amplitudes/tints as tokens, per-profile overrides `v3`/`v4`) + caption-ink
  and chrome-contrast token values (full-ink caption words, chip alpha ≥0.85, counter →
  textMuted, inactive-dot ≥3:1 value).
- `content/schemas/lesson.ts`: `motionProfile: z.enum(['v3','v4']).optional()` on LessonInfo
  (absent = v3; existing lesson.json untouched and still valid).
- `src/lib/scene-types.ts`: ADDITIVE optional `narrationWords?: NarrationWord[]` on
  SceneComponentProps (QuoteCard word-sync needs it; components ignoring it unaffected).
- `src/compositions/lesson-scenes/shared.tsx`: MotionProfile context (read by primitives),
  SceneAmbient reads AMBIENT tokens, exit-aware helpers.
- `src/compositions/LessonVideo.tsx`: v4-only `SceneExitWrapper` around each Series.Sequence
  child (LessonVideo knows scene.duration + profile — exits live HERE, not in SceneFrame,
  so zero scene-component edits); passes narrationWords through. (This file is Wave 0 ONLY
  for the wrapper + props; B3's sim-chip index lands later in the same file — B3 therefore
  starts only after Wave 0 completes.)

**Wave 1 — parallel packets (each builder edits ONLY its files):**
- **B1 captions+chrome:** `LessonCaptions.tsx` (full-ink inactive words, stronger chip,
  shorter fade), `LessonChrome.tsx` (counter/dots consume new tokens). Contrast unit test
  (WCAG ratio computed from tokens — falsifiable).
- **B2 v4 scenes:** `QuoteCard.tsx` word-synced progressive reveal (v4 profile only; v3
  unchanged), `Cover.tsx` deterministic per-topic variant (accent geometry/stat layout,
  v4 profile only so locked layout tests stay green).
- **B3 sim-chip-once:** `LessonVideo.tsx` computes first-sim-scene index → prop; the 4 sim
  components (`ComparisonChats/ToolDemo/ScreenFlow/VoiceDemo`) render chip only when told.
  SEQUENCING: B3 starts after Wave 0 (shares LessonVideo.tsx); **B6 starts after B3**
  (both touch ScreenFlow.tsx).
- **B4 bot security+events:** `bot/src/server.ts` fixed path + timingSafeEqual header check,
  `bot/src/index.ts` setWebhook w/o secret-in-URL, refuse boot unset; usage events emitted as
  structured lines to STDOUT (Cloud Run fs is ephemeral — Cloud Logging persists stdout;
  no file writes); `bot/Dockerfile` USER node + digest pin; `bot/cloudbuild.yaml`/README
  deploy posture; bot tests for 403/boot/emitter paths.
- **B5 captions export:** `scripts/export-captions.ts` (+ `captions:export` npm script):
  narration.words (scene-relative ms) offset to lesson-absolute time via
  `scene.start / fps * 1000` → `out/captions/<id>.srt` for every lesson with words; writes
  `out/captions/REPORT.md` listing lessons lacking words[] (the queue of lessons still to align). Test:
  SRT of a fixture parses + timestamps monotonic.
- **B6 motion hygiene:** ScreenFlow/SetupChecklist/ToolCardReveal/ProgressionCurve/JourneyMap
  inline easing → shared helpers (values IDENTICAL — parity, not redesign); retire
  `src/lib/animations.ts` (fold its 2 hooks into the 2 legacy showcase consumers or delete
  if truly dead); extract ScreenFlow timing math to a tested helper only if zero-risk.
- **B7 docs:** README operator section + gate FAQ; ROADMAP banner; archive stubs;
  GTM one-pager.
- **B8 marketing:** `chatbot/src/app/marketing/page.tsx` reads course-map.json.

**Wave 2 — proof (checker):** `npm run check` (+ chatbot/bot fast checks for touched dirs);
Remotion STILLS (not full renders): v4 exit-glide mid-transition frame, QuoteCard partial
reveal, two topic covers side-by-side, caption band legibility, sim-chip-absent frame;
30s boundary clip render → `gate:motion` on it; keyframes for topic-1-lesson-1 (missing from
QC set). All artifacts → `artifacts/verification/hail-mary/`.

**Then:** Codex verify gate (1 call, whole diff) → fix packets if BLOCK → wrap
(ponytail-audit → re-check → final Codex branch pass → commit, no push → visual-recap →
WRAP_UP.md → .DONE).

## Hard rules (project contract, unchanged)
- Change the token, not the renderer; match computed values; easing for entrances, springs
  only for pops; fonts fail loud; 4px radius; no new deps (everything uses installed
  packages); minimal diffs; NEVER run renders/gates concurrently with other heavy compute;
  full corpus re-render is QUEUED for the owner, never run in this session.
- Default motion profile is **v3** — untouched lesson.json renders byte-identically. v4 is
  opt-in per lesson; flagship lesson stamped v4 as the sample.

## Explicitly out of scope (queued/recommended, not built)
- Full-corpus re-render (queue doc in WRAP_UP; many hours serial).
- words[] alignment backfill run (existing `align:lesson` pipeline; ops step, compute-heavy).
- Lesson 1.1 cold-open reorder (requires narration audio re-cut — recommendation only).
- In-video interactivity/quiz scene type + Teachable-side quizzes (recommendation in the GTM one-pager).
- gate:motion foreground-awareness rework (v4 adds the substance; gate rec noted).
- Real screen-recording footage (locked out of scope by project decision).
- Backlog/unconfirmed items untouched.
