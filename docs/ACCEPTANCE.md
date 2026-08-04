# Completion Contract & Acceptance — Hail-Mary Overhaul (2026-07-04)

> Done is proven by artifacts, not assertion. Plan: `docs/PLAN.md`.

## Completion Contract (all six, per task)
1. **Files changed** — exact paths in `agent-ops/STATE.json` per task.
2. **Tests run** — `npm run check` exit 0 (typecheck + lint + vitest incl. parity); bot
   changes additionally `npm --prefix bot run check`; chatbot changes
   `npm --prefix chatbot run check:fast`. Output captured.
3. **Each acceptance criterion** MET/UNMET with evidence.
4. **Visual proof** — Remotion still renders + one 30s boundary clip under
   `artifacts/verification/hail-mary/` (full lesson re-renders are QUEUED, never run here).
5. **Remaining risks** — recorded in STATE.json + WRAP_UP.md.
6. **Independent Codex review** — adversarial pass at spec + verify gates
   (`codex exec` w/ bypass flag per this box's sandbox limitation; fail-fast prompt).
   On DLL-init crash → `awaiting_codex_review`, proceed, never hang, never fail open.

## Acceptance criteria (falsifiable)

**G1 — captions + chrome legibility**
- AC1 Inactive caption words render at ≥7:1 computed contrast against the chip backing;
  chip backing alpha ≥0.8. Proof: unit test computing WCAG ratio from the actual tokens
  (fails on regression) + caption-band still.
- AC2 Scene counter ≥4.5:1; inactive pagination dots ≥3:1 (non-text minimum). Proof: same
  contrast test + still.
- AC3 `npm run captions:export` writes valid `.srt` for every lesson whose scenes carry
  `narration.words` (every built lesson) and `out/captions/REPORT.md` names every lesson lacking
  words[]. Proof: command output + one .srt parsed by a test (monotonic, non-overlapping cues).

**G2 — v4 motion system**
- AC4 `motionProfile` seam: lesson.json WITHOUT the field parses and resolves to v3 with
  zero behavioral change (test: existing fixture parses; profile default asserted). Schema
  rejects values other than 'v3'/'v4'.
- AC5 v4 renders differ where intended: stills show (a) exit-glide mid-transition at a scene
  boundary, (b) QuoteCard partial progressive reveal mid-narration, (c) two topics' covers
  with visibly different accent geometry. Proof: PNGs under artifacts/verification/hail-mary/.
- AC6 30s v4 boundary clip passes `gate:motion` thresholds (activePct ≥ 0.6, no still >2.5s).
  Proof: gate output captured.
- AC7 Motion hygiene: entrances route through shared helpers (no inline
  `Easing.bezier(...GLIDE)` duplicates or raw interpolate-entrances in the 5 flagged
  components); genuine pops MAY keep spring() but only via a shared `MOTION.pop` preset
  (no ad-hoc damping/stiffness literals). Grep proof + values ported verbatim (parity
  green). `src/lib/animations.ts` no longer exports unused spring hooks.
- AC8 SceneAmbient constants come from tokens (no inline `231,166,174`-class literals in
  shared.tsx; grep proof) and v3 numeric values are IDENTICAL to before (test or diff proof).

**G3 — sim chip once per lesson**
- AC9 Unit test: for a lesson with 3 sim scenes, only the first receives the disclaimer
  prop; still from a later sim scene shows no chip; first-scene still shows it.

**G4 — bot security**
- AC10 Webhook: fixed path (no secret segment); missing/wrong `X-Telegram-Bot-Api-Secret-Token`
  → 403 via timing-safe compare; boot refuses when secret unset (tests for all three).
  setWebhook URL contains no secret.
- AC11 `bot/Dockerfile`: `USER node` present, base image digest-pinned (grep proof).
  Deploy posture (`--no-allow-unauthenticated` or documented IAM stance) in cloudbuild or
  bot/README.
- AC12 Usage events: one structured stdout line per handled message (hashed chat id, ts,
  kind) — unit test on the emitter; no PII beyond hash; no file writes (Cloud Run ephemeral).

**G5–G8 — docs, GTM, marketing**
- AC13 README documents the operator tasks (preview / typo-fix / publish / gate-fail), each mapped to a
  UI path or an explicit "needs Tech Lead", plus a plain-language gate FAQ (section omitted from this copy).
- AC14 Stale planning docs are archived as dated stubs and ROADMAP.md carries a stale-doc banner.
  No content deleted — moved (docs omitted from this copy).
- AC15 A go-to-market one-pager exists; each sourced claim carries its source (omitted from this copy).
- AC16 Marketing page renders module topics from `course-map.json` (no hardcoded topic
  array; test or grep proof) and chatbot check:fast stays green.

**Global**
- AC17 No regressions: `npm run check` green (534+ tests incl. parity); untouched
  lesson.json files still validate; NO motion-default flips (absent motionProfile = v3
  behavior). Intentional exceptions (defect-fix family, ALL profiles by design, take effect
  on the queued corpus re-render): G1 caption/chrome legibility AND G3 sim-chip-once-per-
  lesson. Every other v3 visual stays as-was.
- AC18 Full corpus re-render queued (WRAP_UP.md lists exact command + order), NOT run.

## Out of scope this cycle
Full re-renders; words[] alignment backfill run; lesson 1.1 audio reorder; interactivity
scene type; gate:motion rework; real footage; anything marked backlog/unconfirmed.
