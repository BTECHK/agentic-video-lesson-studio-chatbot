# Completion Contract & Acceptance — Facelift V2

Binding definition of "done" for every task. Read by Claude (lead implementer)
and Codex (independent reviewer). The rule that overrides everything:

> **Do not claim "complete" by agreement or assertion. Claim it with falsifiable
> proof. Agreement is weaker than artifact-based proof.**

## The Completion Contract
A task MAY NOT be `done` unless ALL SIX exist:
1. **Files changed** — exact paths, one line each.
2. **Tests run** — exact commands + real verbatim output; new behavior has a test that FAILS without the change.
3. **Acceptance criteria** — each MET/UNMET with specific evidence.
4. **Visual/functional proof** — artifact under `artifacts/verification/<task-id>/` for any rendered output (renderStill PNG and/or MP4 frame; route/frame + assertions). "Looks good" with no artifact = AUTOMATIC FAIL.
5. **Remaining risks**.
6. **Independent cross-model review** — one adversarial Codex pass per `docs/REVIEW_CHECKLIST.md`, blocking issues resolved. (On the known Windows Codex env-death `-1073741502`: mark `awaiting_codex_review`, PNG/test proof stands as interim evidence — never fail open, never hang.)

Missing any item → status is `in_progress`/`blocked`, never `done`.

---

## FV2-0 — Render & encode foundation
**Expected:** both render scripts render at 2× backing resolution (SSAA) and encode with the parity contract; zero design code touched.
- **AC0.1** Both render scripts render at scale 2. The committed default is the literal `2` (a named `RENDER_SCALE` constant defaulting to `2`, env-overridable only for ops; grep shows the default is `2`, not `1.5`). No `scale: 1.5` path in the committed code. — proof: diff + grep. *(Reconciles Codex finding #5: scale is unambiguously 2; the earlier "1.5 fallback" is removed from the contract.)*
- **AC0.2** Encode flags present: `crf` ≤ 18, `preset: 'slow'` (or x264 equiv), `colorSpace: 'bt709'` retained, `yuv420p`, faststart. Sizzle keeps its existing strong CRF (≤18). — proof: diff.
- **AC0.3** A `renderStill` at `scale: 2` of one LessonVideo frame emits a **3840×2160** PNG (2× of 1920×1080), proving SSAA is wired. — proof: sharp dims of the PNG under `artifacts/verification/FV2-0/`.
- **AC0.4** `npm run check:fast` green (no type/lint/test regression from the script edits). — proof: command output.
- **AC0.5 (encode proof — blocks `done`)** A real MP4 emitted by the **modified** `render-sizzle.ts` is `ffprobe`d and shows `color_space=bt709`, `pix_fmt=yuv420p`, the `moov` atom at the front (faststart), output dimensions consistent with scale 2 (2160 backing → delivered res), and plays. FV2-0 stays `in_progress` until this is captured (satisfied by the FV2-4 sizzle render batch, which is produced by this exact script). Diff-only proof is NOT sufficient to mark FV2-0 `done`. — proof: ffprobe stdout under `artifacts/verification/FV2-0/`. *(Reconciles Codex finding #4.)*

## FV2-1 — Font integrity
**Expected:** a missing/failed font throws instead of silently substituting; Playfair available for the sizzle.
- **AC1.1** `shared.tsx` font loader no longer swallows failure with `.catch(() => continueRender(handle))`; on load failure it logs + `cancelRender(err)` (or rethrows). — proof: diff.
- **AC1.2** A unit test asserts the failure path calls `cancelRender`/throws (mock a rejecting `FontFace.load`), and would FAIL against the old silent-catch code. — proof: `vitest run` output naming the test.
- **AC1.3** Playfair Display variable TTF present in `public/fonts/` and registered via a gated `FontFace` (weights ≥ 500/600/700, incl. italic if available). Mono kept (system stack acceptable per token comment, or bundled). — proof: `ls public/fonts/` + diff.
- **AC1.4** `npm run check:fast` green. — proof: command output.

## FV2-2 — Lesson parity (literal value swaps)
**Expected:** rendered lesson frames match Claude Design's literal system (flat, graphic, 700).
- **AC2.1** Title weight resolves to **700** wherever titles render: `sceneTitleStyle` (shared.tsx), Cover hero, FeatureGrid title. Grep finds **0** `extraBold` on title styles. — proof: grep + diff.
- **AC2.2** `LEADING.title = 1.02` exists and is used by scene/cover titles; tracking tightened ~0.01em at title/sub levels. — proof: diff.
- **AC2.3** `radiusWindow` (14) used **only** by chat/voice window components (allowlist: ComparisonChats, VoiceDemo, ToolDemo composer, ScreenFlow browser frame, PreviewBand). Feature/recap/table/quadrant/dig cards use `radius` (4). — proof: grep of `radiusWindow` usages, each on the allowlist.
- **AC2.4** Cards have **no resting shadow**: grep shows no unconditional `SHADOW.card` on grid/feature/recap/table cards; shadow appears only on the focused branch (`isActive ? <lift> : 'none'`). — proof: grep + diff.
- **AC2.5** Sub/body copy weight 400→500 and resized down (cover sub ≤26, feature sub ≤17). Cover stats use `display:grid; repeat(n,1fr)`, numbers 76/600. "You are here" pill radius 999→2 with 11px/0.16em. Eyebrow 14/600/0.14em. Journey dots uniform ~30px (active = glow ring, not bigger). Dimmed cards 0.4 + grayscale(0.6). Gemini gradient stops `#1C7DFF/#9168C0/#F65AA3`. — proof: diff per item.
- **AC2.6** Visual proof: `renderStill` PNG of a Cover frame and a FeatureGrid frame under `artifacts/verification/FV2-2/`, visibly flat-at-rest with 4px corners and 700 titles, alongside the design reference for comparison. — proof: PNGs.
- **AC2.7** `npm run check:fast` green; `gate:layout` still passes (no safe-area breach). — proof: command output.

## FV2-3 — Motion parity
**Expected:** entrances land on a known frame (eased), not asymptotic spring drift.
- **AC3.1** `useGlideIn`/`usePopIn` (or their replacements) use `interpolate(frame,[d,d+Δ],[0,1],{easing: Easing.out(Easing.cubic)})` over explicit durations — no `spring()` on entrance helpers. Springs/`outBack` only on genuine pop atoms. — proof: diff.
- **AC3.2** A unit test asserts the glide progress is **0 at frame d** and **≥0.999 at frame d+Δ** (hard arrival), and would FAIL for an asymptotic spring (never reaches 1.0 by d+Δ). — proof: `vitest run` output.
- **AC3.3** Travel distances updated (hero ↑, small copy ↓) per the contract; line-draw easing `easeInOutCubic`. — proof: diff.
- **AC3.4** `gate:motion` PASS on a **freshly rendered** MP4 that exercises the changed easing helpers — i.e. the FV2-4 sizzle render (the sizzle uses `shared.tsx`'s motion via `Glide`/`Pop`/`usePopIn`), NOT a stale pre-change artifact. `npm run check:fast` green. — proof: gate stdout naming the fresh render + its timestamp (gate after render). *(Reconciles Codex finding #3: the gate must run on output that actually contains the new easing.)*

## FV2-5 — Guardrails
**Scope (reconciles Codex finding #1):** the anti-drift artifact for this run is the **values-lint test** (`test/parity.test.ts`). **Committed golden-frame regression is DEFERRED** (it needs a per-scene render pass — out of this run's render budget) and is recorded in `left_in_backlog`, so there is no unmet golden-frame promise in the acceptance.
**Expected:** the literal drifts cannot silently return.
- **AC5.1** `test/parity.test.ts` asserts: title style weight === 700; no `radiusWindow` outside the window allowlist (string-scan the lesson-scenes sources); no unconditional `SHADOW.card` on a known grid-card set; no `borderRadius: 999` above ~12px. The test FAILS if reverted to the pre-FV2 values (demonstrated by temporarily reverting one value and showing the test red, then restoring). — proof: `vitest run` output + the red-against-old-values demonstration.
- **AC5.2** Repo `CLAUDE.md` gains a "match values, don't re-derive" section (grafted from sizzle-v3-handoff/CLAUDE.md hard rules). — proof: diff.
- **AC5.3** `npm run check:fast` green including the new test. — proof: output.

## FV2-4 — Sizzle (lean)
**Scope (explicit, reconciles Codex finding #2):** this is the **lean** route — it delivers the **Playfair/Syne/mono identity + the missing content beats + gate-green motion/media**. It does **NOT** claim scene-contract determinism, frame-exact parity to `scene-contract.json`, or golden-frame reproducibility — those belong to the deferred **FV2-4-full** (backlog). AC4 therefore does not assert reproducibility; it asserts identity + concrete content + liveliness.
**Expected:** the sizzle adopts the Playfair/Syne/mono identity and gains the missing content beats, staying gate-green.
- **AC4.1** Headline text in the sizzle beats renders in **Playfair Display**; wordmark/kickers/labels stay **Syne**; captions/timecodes **mono**. — proof: diff (fontFamily per element) + renderStill.
- **AC4.2 (VO-locked reality)** The sizzle is driven by the existing 65.6s voiceover (`original-sizzle-audio.m4a`); beats are pinned to VO timestamps and `MANIFESTO_BEATS`/`SIZZLE_DURATION`/`<Audio>` must NOT change (prior AC8). So the content work is what's possible WITHOUT desyncing the VO; narrative restructure (a separate "hero beat", a new hook→payoff turn that needs spoken lines) is explicitly **deferred to FV2-4-full** (needs new audio) and is NOT claimed here. This run delivers, all copy data-driven in `sizzle.storyboard.ts` (grep new strings = **0** hardcoded in `SizzleManifesto.tsx`), each shown in a renderStill under `artifacts/verification/FV2-4/`:
  - **CTA** added to the close beat — a call-to-action line carrying `sample content only` (placeholder URL, flagged for the real value). Visual-only addition to the existing `cta` beat; does not change duration/audio.
  - **"Built by practitioners, for learners"** given **hero-level visual emphasis within its existing beat** (it is already spoken in the `different` beat) — larger/accented, not a small buried bullet.
  — proof: grep (CTA string present in storyboard, 0 in component) + diff + renderStills of the close beat (with CTA) and the emphasized hero line.
- **AC4.3** Inherits FV2-2/3 (no resting card shadow on chips beyond design, eased entrances). — proof: visual + diff.
- **AC4.4** Both formats render; `gate:motion` PASS (activePct ≥ 0.6, no still > 2.5s) and `gate:media` PASS (audible + bt709). Duration/audio unchanged (ffprobe ≈ existing). — proof: gate stdout + ffprobe (render batch, alone).
- **AC4.5** `npm run check:fast` green. — proof: output.

---

## Test plan (shared)
`npm run check:fast` per task; new behavior gets a failing-first test (FV2-1, FV2-3, FV2-5); `renderStill` PNG proof for visual tasks (FV2-0/2/4); full MP4 + `gate:motion`/`gate:media` in the render batch (FV2-4 + one lesson regression), run **alone** — never gate while rendering.
