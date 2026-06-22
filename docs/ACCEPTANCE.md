# Completion Contract & Acceptance Template

Binding definition of "done" for every task. Read by Claude (lead implementer)
and Codex (independent reviewer). The rule that overrides everything:

> **Do not claim "complete" by agreement or assertion. Claim it with falsifiable
> proof. Agreement is weaker than artifact-based proof.**

## The Completion Contract

A task MAY NOT be marked `done` / "complete" unless ALL SIX are present:

1. **Files changed** — exact paths, one line each on what changed.
2. **Tests run** — the exact commands AND their real pass/fail output (verbatim,
   not paraphrased). New behavior must have a test that would FAIL without the
   change.
3. **Acceptance criteria** — every criterion below, each marked MET or UNMET with
   the specific evidence that proves it.
4. **Visual / functional proof** (required for any UI, route, or endpoint work) —
   an artifact under `artifacts/verification/<task-id>/`:
   - Playwright (or equivalent) screenshot(s), before AND after where relevant,
   - the exact route/page tested and the viewport size(s),
   - the visible-element assertions that passed (selector + expected state).
   "Looks good" with no artifact is an AUTOMATIC FAIL.
5. **Remaining risks** — known gaps, untested surfaces, assumptions made.
6. **Independent cross-model review** — one adversarial review pass from the
   OTHER model family (Codex on Claude's work, or vice versa) per
   `docs/REVIEW_CHECKLIST.md`, with every blocking issue resolved. An unresolved
   disagreement = NOT done.

If any item is missing, the correct status is `in_progress` or `blocked` — never
`done`.

---

## Acceptance Criteria (fill per task / feature)

**Task:** `sizzle-v2.3-fidelity` — Sizzle reel fidelity restore + colored icons + smooth float + color quality + data-driven storyboard
**Expected UX:** the rendered sizzle MP4 matches the original 6/15 hand-crafted reel for content, shows brand-colored, per-tool-distinct icons that float smoothly, has the 3-column transform scene incl. Unchecked→Gated + the closing-line tagline, and reads at the Claude-design color/contrast level — without altering the audio, duration, beat timeline, or the lessons. Editing the storyboard data changes content with no component edit.
**Artifacts dir:** `artifacts/verification/sizzle-v2.3-fidelity/`. Verification helpers (throwaway): `scripts/_sizzle-icon-check.ts`, `scripts/_sizzle-float-check.ts`, `scripts/_sizzle-color-de.ts`.

> **Icon-shape note (reconciliation):** exact vendor pixel-logos are NOT required — the user confirmed the current glyph *shapes* are fine; the requirement is a *distinct glyph per tool* + brand color. So AC1 verifies distinctness + color, not path-identity to the design SVGs.

**Acceptance criteria (each objectively checkable — coordinates/thresholds fixed so a broken render fails):**

- [ ] **AC1 — colored, distinct icons.** `ColoredToolMark` renders a DISTINCT glyph SHAPE per tool — unit test asserts the four glyphs' SVG path **geometry** (the `d` path-data strings) are pairwise different (not merely different React nodes/fills, which would pass even if every icon were the same shape) — each with a brand fill: Claude solid `#D97757`, ChatGPT solid `#0f0f0f`, Perplexity solid `#20B8CD`, Gemini an SVG `<linearGradient>` blue→purple→pink. **Pixel proof** via `scripts/_sizzle-icon-check.ts` on the `different` frame: for each chip crop ONLY the icon's glyph bbox (left of its text label, from the deterministic chip x-positions — the text is excluded by geometry, not by color), take the dominant non-linen pixel there (so ChatGPT's near-black GLYPH is captured, not wrongly excluded) and require CIE2000 **ΔE ≤ 18** to the target hex for Claude/ChatGPT/Perplexity; for Gemini sample that bbox's upper third vs lower third and require the two dominant hues to differ by **≥ 40° HSL hue**, one in blue (h 200–250) and one in purple/pink (h 280–340) — a real gradient, not AA/shadow. — proof: script stdout (per-icon ΔE + Gemini hue pair) + `different.png`.
- [ ] **AC2 — 3rd transform column.** Storyboard test asserts `transform.cols.length === 3` and `cols[2]` deep-equals `{from:'Unchecked', to:'Gated', label:'How it ships'}`. A frame ~2s into the transform beat shows three columns, the header **HOW IT SHIPS**, and **Unchecked** (struck) → **Gated**. — proof: test output + `transform.png`.
- [ ] **AC3 — restored copy.** The do-items equal exactly `Render lessons *straight from data*` · `Check every render with automated gates` · `Built by practitioners, for learners` in the storyboard, and are legible in the `different` frame. The superseded strings (`Scripts, scenes and voice in one pass`, `Videos that build themselves`) appear in **neither** `SizzleManifesto.tsx` **nor** `sizzle.storyboard.ts` (grep = 0). — proof: grep output + `different.png`.
- [ ] **AC3b — no AI tells (em-dashes), per user 2026-06-21.** NO em-dash (`—`) appears in any on-screen text: zero in `sizzle.storyboard.ts` strings AND zero in the rendered-beat output of `SizzleManifesto.tsx` (Promise / Different / Master / Transform). Enforced by a test that renders those beats to string and asserts no `—`, plus a source grep. On-screen swaps applied: Promise → `Write the *outline*. The pipeline turns it into a *finished video lesson*.`; do-item → `Check every render with automated gates`; Master 02 sub → `A lesson plan and narration drafted from the outline`. — proof: test output + grep = 0.
- [ ] **AC4 — tagline (reworked per user 2026-06-21).** `transform.tagline` = `Turn a structured outline into a *finished, gate-checked video lesson.*`, and the full text is legible in a late-transform frame — it wraps to ≤2 centered lines with no clipping and no collision with the columns above or the progress dots below. — proof: `transform-tagline.png` + storyboard value.
- [ ] **AC5 — smooth float (numeric, no cherry-picking).** `scripts/_sizzle-float-check.ts` runs over a FIXED span — consecutive frames **600–660** of the 16:9 render (chips settled, ~2s) — for **all four** chips (no verifier choice of chip or window). For each chip, track vertical position by cross-correlating its fixed icon-column crop (parabolic sub-pixel peak). Let `Δyᵢ` be successive deltas; let `range` be the max−min of the tracked cumulative vertical displacement (running sum of `Δyᵢ`) over the window. PASS requires, for EVERY chip: **(a)** mean `|Δy| ≥ 0.4px` **OR** tracked vertical displacement `range ≥ 4px` over frames 600–660 (it actually moves) — *the range metric is added because per-frame sub-pixel cross-correlation under-reads a genuinely smooth gentle float; it is a more-robust falsifiable motion test (it tracks real net displacement), not a weaker one* — **AND (b)** **no** consecutive pair with `|Δyᵢ| < 0.3px` AND `|Δyᵢ₊₁| > 1.2px` (the freeze-then-jump stair-step, unchanged). Turning points are allowed — only the freeze-then-jump pattern fails. Code: `Float` uses `translate3d(0,y,0)` + `willChange:'transform'` (unchanged). — proof: per-chip `mean|Δy|` + `range` series + verdict from the script + the code diff.
- [ ] **AC6 — storyboard drives the render (positive proof).** (a) grep `SizzleManifesto.tsx` for each canonical literal (every do/not item, each tool name, each column word, the tagline) → **0** hardcoded matches (all arrive via the imported `SIZZLE`). (b) Mutation test in `test/sizzle-storyboard.test.ts`: render the `Different` (and `Transform`) beat to string with a MUTATED storyboard fixture and assert the mutated value appears and the original does NOT — proving each field actually drives output, not merely exists. (c) Structural test: `cols.length===3`, each tool has `{name,color}`, `tagline` non-empty, `doItems`/`notItems` length 3. — proof: grep output + green mutation + structural tests.
- [ ] **AC7 — liveliness + media gates.** Both formats: `gate:motion` PASS (`activePct ≥ 0.6`, no still > 2.5s) and `gate:media` PASS (audible + `color_space=bt709`). — proof: gate command stdout for 16:9 and 9:16.
- [ ] **AC8 — audio / duration / timeline UNCHANGED.** ffprobe: MP4 duration = 65.6s (1968 frames @30fps) within ±2 frames, and an audio stream of ≈65.6s is present. `git diff` shows `MANIFESTO_BEATS`, `SIZZLE_DURATION`, and the `<Audio src=…original-sizzle-audio.m4a>` line **unchanged**. — proof: ffprobe duration + `git diff` excerpt of those three.
- [ ] **AC9 — color quality (two gates: VALUES and ENCODE).** `scripts/_sizzle-color-de.ts` over a fixed patch set (linen bg, crimson accent, the 4 icon colors, dark-transform bg) runs BOTH: (a) **values** — the true-color `renderStill` PNG patches are within mean CIE2000 **ΔE ≤ 5** of the DESIGN target hexes (linen `#EDE8E3`, accent `#8B2635`, Claude `#D97757`, ChatGPT `#0f0f0f`, Perplexity `#20B8CD`, dark `#191717`) — this catches wrong token VALUES; (b) **encode** — the encoded MP4 frame patches are within mean **ΔE ≤ 6** of the SAME-frame renderStill PNG — this catches encode LOSS. BOTH must pass (a wrong-color render can no longer slip through as "value-driven"). The 1-paragraph finding attributes any residual design gap to whichever gate is tighter. Chosen encode (`--crf`, `--pixel-format`) recorded; Teachable-playable (h264; `yuv444p` only if it still plays, else `yuv420p`; < 2GB). — proof: both ΔE tables + both frames + encode params + the finding.
- [ ] **AC10 — no lesson regression (proven, not assumed).** (a) `git diff --name-only` lists ONLY sizzle-scoped paths (`src/compositions/sizzle.storyboard.ts`, `sizzle.storyboard.md`, `src/compositions/ColoredToolMark.tsx`, `src/compositions/SizzleManifesto.tsx`, `test/sizzle-storyboard.test.ts`, the sizzle render command) — NO shared lesson files (`shared.tsx`, `brand/tokens.ts`, `ToolMark.tsx`, `primitives.tsx`, `LessonVideo.tsx`). (b) Render `topic-1-lesson-1` at a fixed frame before vs after; `pixelmatch` mismatch ≤ 0.1%. (c) `vitest run` fully green (count ≥ baseline). — proof: `git diff --name-only` + pixelmatch number + test summary.

**Test plan:** `test/sizzle-storyboard.test.ts` (structural + mutation + distinct-glyph) ; `tsc --noEmit` ; `eslint` on changed files ; `vitest run` (count ≥ baseline) ; render both formats (bt709, **alone** — never gate while rendering) ; `gate:motion` + `gate:media` on both ; the three `_sizzle-*` check scripts ; ffprobe duration + `git diff` for AC8/AC10.

**Visual verification checklist (this is a rendered VIDEO — frames from the ENCODED MP4 are the artifact):**
- [ ] `different.png` (~24s), `transform.png` + `transform-tagline.png` (transform beat), and 12 consecutive frames across a settled chip float — all under `artifacts/verification/sizzle-v2.3-fidelity/`.
- [ ] a true-color `renderStill` PNG of the `different` frame for the AC9 ΔE comparison.
- [ ] element assertions read off the frames + scripts: per-tool colored glyphs (AC1), 3 columns + HOW IT SHIPS (AC2), copy (AC3) + tagline (AC4) legible.
- [ ] both MP4s: `gate:motion` + `gate:media` PASS (AC7); ffprobe duration = 65.6s (AC8).
