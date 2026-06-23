# Facelift V2 — Master List (requirements catalogue)

Human-readable index of everything in scope. **Live status is tracked in the issue board**; this file is the stable
requirements map. Plan: [.planning/FACELIFT-V2.md](../.planning/FACELIFT-V2.md).
Diagnosis source: Remotion Parity Punch List + sizzle-v3-handoff contracts.

| ID | Phase | Requirement | Key files | Proof surface |
|----|-------|-------------|-----------|---------------|
| **FV2-0** | Render foundation | `scale: 2` (SSAA) on both render scripts; encode `crf 18 · preset slow · yuv420p · BT.709 + range tv · faststart`; sizzle→lanczos 1080, lessons→2160 direct (or 1.5) | `scripts/render-sizzle.ts`, `scripts/render-lesson.ts` | renderStill emits 2× dimensions; encode flags present in code; MP4 in render batch |
| **FV2-1** | Font integrity | Kill silent `.catch(continueRender)` → fail loud; bundle Playfair Display; confirm/keep mono | `src/compositions/lesson-scenes/shared.tsx`, `public/fonts/` | unit test: load-failure throws; font files present + gated |
| **FV2-2** | Lesson parity | 800→700 titles · `LEADING.title=1.02` · tracking −0.01em · radius 14→4 (non-window) · flat-at-rest shadow (lift on focus only) · sub 400→500 resized · cover stat flex→grid 76/600 · pill 999→2 · eyebrow 22/700→14/600 · dots uniform 30 + glow · dim 0.4+grayscale · Gemini stops exact | `tokens.ts`, `shared.tsx`, `Cover/FeatureGrid/JourneyMap/RecapGrid/CapabilityTable/…` | values-lint + renderStill PNG vs design reference |
| **FV2-3** | Motion parity | `useGlideIn`/`usePopIn` spring → `interpolate + Easing.out(Easing.cubic)` over explicit durations; hero travels more / small copy less; line draws `easeInOutCubic`; springs only for genuine pops | `src/compositions/lesson-scenes/shared.tsx` | unit test: easing lands at 1.0 by end frame; gate:motion stays green |
| **FV2-5** | Guardrails | values-lint test (weight 700 / no stray radiusWindow / no resting card shadow / no oversized pill); graft "match values, don't re-derive" hard rules into repo `CLAUDE.md` | `test/parity.test.ts`, `CLAUDE.md` | new test green in check:fast; rules present |
| **FV2-4** | Sizzle (lean) | Playfair headlines + Syne chrome + mono captions; add hook **payoff**, **"Built by practitioners, for learners"** hero beat (dark+rose), **CTA** in close; inherit FV2-2/3 fixes | `SizzleManifesto.tsx`, `sizzle.storyboard.ts` | renderStill + grep + gate:motion/media on MP4 |

## Two intended identities (decided, not a bug)
- **Lessons** = Syne, headline weight **700**.
- **Sizzle / marketing** = **Playfair** headlines · **Syne** chrome · **JetBrains Mono** captions.
- Shared wordmark + kickers keep them one brand.

## Deferred (backlog, not this run)
- **FV2-4-full** — sizzle deterministic rebuild from `scene-contract.json` (single
  source of truth, golden frames, audio beat-map). Needs audio spec; lean route first.

## Decisions made (no user input required)
- CTA copy ships a placeholder URL; real date/URL is a later one-field swap.
- Lesson delivery: scale=2 → 2160p direct (fall back to 1.5 if render time bites).
- Codex: attempt once per gate; on the known Windows env-death, mark
  `awaiting_codex_review` and continue (PNG diffs are the falsifiable proof meanwhile).

## Build & verify commands
- `npm run check:fast` — typecheck + lint + test (the Stop-gate slice check).
- `npm run test` — vitest (baseline 47 test files; count must not drop).
- `npx tsx scripts/_gen-delta-stills.ts` — true-color renderStill PNGs for PNG↔PNG proof.
- `npm run render:sizzle` / `npx tsx scripts/render-lesson.ts <id>` — MP4 (render batch, ALONE).
- `npm run gate:motion` / `gate:media` — liveliness + audible/BT.709 (AFTER renders, never during).

## Loop / reliability (this run)
- Self-paced ~hourly until **2026-06-23 12:00**. Each tick: load STATE → health-check
  (hung render? stale heartbeat? missed task?) → continue next task → persist → log → reschedule.
- Structured log: `agent-ops/logs/run-2026-06-23.log`.
- Checkpoint commits on `claude-design-advice` after each verify gate; **never push**.
