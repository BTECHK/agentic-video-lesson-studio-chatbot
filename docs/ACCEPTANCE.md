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
- **AC0.1** `scripts/render-sizzle.ts` and `scripts/render-lesson.ts` pass `scale: 2` to `renderMedia` (grep shows the literal). — proof: diff + grep.
- **AC0.2** Encode flags present: `crf` ≤ 18, `preset: 'slow'` (or x264 equiv), `colorSpace: 'bt709'` retained, `yuv420p`, faststart. Sizzle keeps its existing strong CRF (≤18). — proof: diff.
- **AC0.3** A `renderStill` at `scale: 2` of one LessonVideo frame emits a **3840×2160** PNG (2× of 1920×1080), proving SSAA is wired. — proof: `file`/sharp dims of the PNG under `artifacts/verification/FV2-0/`.
- **AC0.4** `npm run check:fast` green (no type/lint/test regression from the script edits). — proof: command output.
- **Note:** full MP4 + `gate:media` BT.709 confirmation happens in the render batch (AC carried to FV2-4 / lesson regression), not inline (renders own the machine).

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
- **AC3.4** `gate:motion` still PASS on an existing rendered MP4 (or the sizzle render batch); `npm run check:fast` green. — proof: command output (gate after render).

## FV2-5 — Guardrails
**Expected:** the drift cannot silently return.
- **AC5.1** `test/parity.test.ts` asserts: title style weight === 700; no `radiusWindow` outside the window allowlist (string-scan the lesson-scenes sources); no unconditional `SHADOW.card` on a known grid-card set; no `borderRadius: 999` above ~12px. The test FAILS if reverted to the pre-FV2 values (prove by description of which line each rule guards). — proof: `vitest run` output + a demonstration the test is red against old values.
- **AC5.2** Repo `CLAUDE.md` gains a "match values, don't re-derive" section (grafted from sizzle-v3-handoff/CLAUDE.md hard rules). — proof: diff.
- **AC5.3** `npm run check:fast` green including the new test. — proof: output.

## FV2-4 — Sizzle (lean)
**Expected:** the sizzle adopts the Playfair/Syne/mono identity and gains the missing content beats, staying gate-green.
- **AC4.1** Headline text in the sizzle beats renders in **Playfair Display**; wordmark/kickers/labels stay **Syne**; captions/timecodes **mono**. — proof: diff (fontFamily per element) + renderStill.
- **AC4.2** Content beats added/strengthened: hook has a real **payoff** line; a **"Built by practitioners, for learners"** hero beat (dark ground + rose) exists; the close carries a **CTA** line (placeholder URL ok). Copy lives in `sizzle.storyboard.ts` (data-driven), not hardcoded in components — grep the new strings = 0 in the component. — proof: grep + diff + renderStill of each new beat under `artifacts/verification/FV2-4/`.
- **AC4.3** Inherits FV2-2/3 (no resting card shadow on chips beyond design, eased entrances). — proof: visual + diff.
- **AC4.4** Both formats render; `gate:motion` PASS (activePct ≥ 0.6, no still > 2.5s) and `gate:media` PASS (audible + bt709). Duration/audio unchanged (ffprobe ≈ existing). — proof: gate stdout + ffprobe (render batch, alone).
- **AC4.5** `npm run check:fast` green. — proof: output.

---

## Test plan (shared)
`npm run check:fast` per task; new behavior gets a failing-first test (FV2-1, FV2-3, FV2-5); `renderStill` PNG proof for visual tasks (FV2-0/2/4); full MP4 + `gate:motion`/`gate:media` in the render batch (FV2-4 + one lesson regression), run **alone** — never gate while rendering.
