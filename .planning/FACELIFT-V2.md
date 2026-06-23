# Facelift V2 — closing the Design ↔ Remotion gap

> **Goal:** make the rendered MP4s (lessons + sizzle) read as crisp, graphic, and
> "on-brand" as the Claude Design HTML references the user preferred.
> **Source of truth:** `claude-design-delta/claude design response/.../sizzle-v3-handoff/`
> (contracts + `brand-tokens.ts` + reference HTML) and the **Remotion Parity Punch List**.
> **Branch:** `claude-design-advice`. **Status:** plan locked, ready to execute.

---

## 0. Why Claude Code's output came out different (the root cause)

The palette is already identical — sRGB hex on both sides, ΔE ≈ 0. Color is not the
problem. The gap is **three structural failures**, in order of how much they hurt:

1. **Re-derivation instead of literal matching.** Claude Code re-built each value from
   *intent* ("a bold display title", "a card with depth") and landed one notch
   **heavier, rounder, softer, looser** every single time: title weight **800 vs 700**,
   card radius **14 vs 4**, a **resting shadow on every card**, a **999px pill** where the
   design uses a 2px tag, **spring** motion where the design uses **eased tweens**. Each
   choice looked "designed" in isolation; together they erased the taut, flat, graphic
   character of the real system. This is most of the "it doesn't look like my design."
2. **A flat 1080p raster.** The HTML renders on a retina display (DPR≈2) — 4 device
   pixels per CSS pixel, then downscaled. Remotion writes 1 pixel per CSS pixel: a
   quarter of the antialiasing samples on every Syne stroke and 1px hairline. This is the
   dominant **"soft / blurry"** gap, and it's baked in *before* the codec.
3. **No single source of truth + lossy defaults.** Copy/timing/values live inside
   components, so a "tweak" means rewriting a component and drifting again. Motion uses
   `spring()` (asymptotic, never lands). Fonts load with a silent `.catch(continueRender)`
   that swaps a fallback face instead of failing loud. The encode left range/primaries to
   chance, which can desaturate ("duller").

**The fix is as much process as code:** port the *computed* values verbatim, render
supersampled, and add guardrails so the pipeline can't quietly re-derive its way back to
"designerly."

---

## 1. Scope — two identities, one shared foundation

The work splits cleanly. The references prove **two deliberate type identities** (this is
not a bug to reconcile — it's the design):

| Track | Deliverable | Type identity | Title weight | State |
|---|---|---|---|---|
| **A — Lessons** | 7 animated lessons | **Syne** everywhere | **700** | shipped/shipping; needs parity pass |
| **B — Sizzle** | promo reel (v3) | **Playfair** headlines · **Syne** chrome · **JetBrains Mono** captions | n/a | rebuild |

> Evidence: Claude Design's lesson reference sets headlines in `Syne 700`
> (`Module-1-Animated-Lesson__DESIGN-reference.html:25`); its sizzle reference (`Hero
> Scene (animated).html:42`) sets headlines in `Playfair Display`, chrome in Syne, captions
> in JetBrains Mono. The current repo collapsed **both** to Syne-800 — that collapse is the
> drift, not the baseline.

**Shared foundation** (fixes both tracks at once): render config, font integrity, motion
helpers, token discipline. Most leverage lives here.

---

## 2. The plan — phased by visual impact

Each phase ends green and proven before the next. Render-heavy verification runs **after**
renders, never during (hard rule: renders own the machine).

### Phase 0 — Render & encode foundation  ·  *highest leverage, zero design code*
The single biggest lever for "less crisp," and it touches no components.

- **`scripts/render-sizzle.ts` + `scripts/render-lesson.ts`:** add `scale: 2` to
  `renderMedia`. (Currently neither sets it; no global `Config.setScale` exists.)
- **Encode (align both to the render contract):** `-crf 18 -preset slow`,
  `-pix_fmt yuv420p`, **BT.709 + `-color_range tv`** (lessons already tag bt709; sizzle
  too — keep), `+faststart`. Sizzle currently uses `crf 10` (fine, keep ≤18).
- **Delivery:** sizzle renders at 2× (2160) → **one ffmpeg lanczos pass to 1080p** (true
  SSAA) — it's 65s, cheap. **Lessons:** scale=2 **quadruples** an already 2–3h render; ship
  **2160p direct** (Teachable downscales client-side, keeps the SSAA win) **or** drop to
  `scale: 1.5` if the render budget is tight. *(ponytail: don't add a 1080 downscale pass
  to the lesson path unless file size forces it.)*
- **Verify:** fresh `renderStill` PNG vs the Design reference PNG, **PNG↔PNG, never the
  MP4** (regenerate with `scripts/_gen-delta-stills.ts`).

### Phase 1 — Font integrity  ·  *unblocks Track B, kills the silent-serif class of bug*
- **`src/compositions/lesson-scenes/shared.tsx:32`** — replace `.catch(() =>
  continueRender(handle))` with **fail-loud**: log + `cancelRender(err)` (or rethrow). A
  missing face must throw, not substitute.
- **Bundle the two missing faces** into `public/fonts/` (only `Syne-Variable.ttf` is there
  today): **Playfair Display** (500/600/700 roman + italic) and **JetBrains Mono** (400/500).
  Load each via gated `FontFace` like Syne. Confirm the bundled Syne is the same variable
  file the CDN serves (stale TTF shifts glyph AA).
- *(ponytail: JetBrains Mono can stay a system stack at caption sizes per the token comment;
  bundle it only if the system fallback visibly differs in a renderStill.)*

### Phase 2 — Lesson parity (Track A)  ·  *the bulk of "on-brand," literal value swaps*
All in `src/compositions/lesson-scenes/` + `src/brand/tokens.ts`. Every item is a
value-for-value swap from the punch list — **no reinterpretation**:

- **Title weight 800 → 700** everywhere titles render: `shared.tsx:191` (`sceneTitleStyle`),
  `Cover.tsx:25,104`, `FeatureGrid.tsx:70,95`. Keep 800 only where the design explicitly
  uses extraBold (none confirmed in references).
- **Leading:** add `LEADING.title = 1.02` and use it for scene/cover titles
  (`LEADING.display = 1.12` is the loose-leading culprit). Tighten tracking ~**−0.01em** at
  every level.
- **Card radius 14 → 4** for feature/tool/table/recap/quadrant cards. Keep `radiusWindow`
  (14) **only** on chat & voice windows (`ComparisonChats`, `VoiceDemo`, `ToolDemo`
  composer, `ScreenFlow` browser frame). Offenders to fix: `FeatureGrid.tsx:55`,
  `RecapGrid.tsx:31`, `CapabilityTable.tsx:44`, `AssignmentList.tsx:63`, `AuditQuadrant.tsx:50`,
  `DigDeeper.tsx:36`, `ToolCardReveal.tsx:70`.
- **Resting shadow → none.** Cards sit flat on linen with a 1px border; lift (shadow +
  translate) **only during their focus beat**. Fix the always-on `SHADOW.card`:
  `FeatureGrid.tsx:64` (`isActive ? cardHover : card` → `isActive ? focusedLift : 'none'`),
  `RecapGrid`, `CapabilityTable`, `AssignmentList`, `DigDeeper`, `PreviewBand`, `ToolDemo`.
  Focused depth = `0 18px 40px rgba(28,28,28,.12)`.
- **Sub/body copy weight 400 → 500**, sized **down** (cover sub 30→26, feature sub 22→17),
  leading 1.5–1.55. Lighter+larger is what reads thin/washed.
- **Cover stats:** `flex` → `display:grid; repeat(n,1fr)` across full width; numbers
  **64/800 → 76/600**, `-0.015em`, lh 1.
- **"You are here" pill** (`JourneyMap.tsx:131`): `radius 999 → 2`, **16/0.08em → 11/0.16em**,
  padding 8×18 → 5×10, color `bgBase → bgCard`. (Other `borderRadius:999` on true ≤12px
  dots are correct circles — leave them.)
- **Eyebrows** (`shared.tsx:175`): **22/700/0.16em → 14/600/0.14em**; scale the accent
  rule-dash to the 14px kicker (not 40×4).
- **Journey dots:** uniform **30px**, differentiate active by the `accentSoft` glow ring
  alone (not 40px); todo-fill `bgCard → bgBase`.
- **Dimmed cards:** `opacity 0.6` → **0.4 + grayscale(0.6)** (harder dim makes the focus pop).
- **Gemini gradient:** keep stops byte-exact `#1C7DFF → #9168C0 → #F65AA3`.

### Phase 3 — Motion parity  ·  *shared `shared.tsx`, fixes both tracks*
The schedule was ported faithfully; the **curves** were not. Springs never "land" — that
tail is the floatiness.

- **`useGlideIn` / `usePopIn`:** replace `spring()` with
  `interpolate(frame,[d,d+Δ],[0,1],{easing: Easing.out(Easing.cubic)})` over explicit
  durations (cover title 0.7s→21f, sub 0.6s→18f, eyebrow 0.5s→15f). The `GLIDE` cubic
  (`[0.16,1,0.3,1]`) is defined but unused — replace with `easeOutCubic`/`easeInOutCubic`
  per the motion contract.
- **Travel:** move the **hero more, small copy less** (cover title fromY 28→36; sub 18→12;
  feature cards 30→18).
- **Line draws** (journey track, sizzle `DrawLine`): `easeInOutCubic` (symmetric) over ~1.0s,
  not the fast-out GLIDE bezier and not spring.
- **Reserve springs/`outBack`** for genuine overshoot pops only (dots/badges); even there
  the HTML's journey dots *slide* (easeOutCubic, 16px) — prefer the slide for true parity.

### Phase 4 — Sizzle v3 (Track B)
Two routes; **take the lean one first.**

- **Lean (recommended, ~1 session):** keep the existing 6-beat `SizzleManifesto.tsx` and:
  (a) swap headline face to **Playfair** (chrome/wordmark stay Syne, captions mono);
  (b) inherit the Phase 2/3 parity + motion fixes; (c) add the **content gaps** the critique
  flagged — a real **hook payoff**, the **"Built by practitioners, for learners"** hero beat
  (dark ground + rose, per `scene-contract.json` scene 03), and a **CTA** in the close
  (scene 07). Keep the existing `original-sizzle-audio.m4a`.
- **Full (follow-on, deferred):** the deterministic rebuild from
  `sizzle-v3-handoff/` — `scene-contract.json` as the single source of truth, components as
  pure render functions, golden frames, audio beat-map. This is the *correct* long answer
  to "couldn't be reproduced," but it's a ground-up rewrite + needs the audio spec. Do it
  after the lean pass ships the visible quality. *(ponytail: the existing manifesto already
  reads tokens, is frame-clock-driven, and is gate:motion-green — the lean route captures
  ~90% of the visible gap at a fraction of the cost.)*

### Phase 5 — Guardrails  ·  *so it never drifts back*
The meta-fix. Without this, the next regeneration re-derives the same drift.

- **One values-lint test** (`test/parity.test.ts`): assert title style resolves to weight
  700; no `radiusWindow` outside the window-component allowlist; no resting `SHADOW.card` on
  grid cards; no `borderRadius:999` above ~12px. Cheap, runs in the Stop-hook check.
- **Golden frames:** commit one PNG per scene at mid-frame; diff on every change (zero-diff
  unless intended). Wire into `gate:layout`/`gate:review`.
- **Pin render scale** as a named constant in the render scripts (not a flag people forget).
- **Graft the "match values, don't re-derive" hard rules** from
  `sizzle-v3-handoff/CLAUDE.md` into the repo `CLAUDE.md` / the `animated-lesson` skill
  references, so future generations get the rule, not just the values.

---

## 3. Decisions made (no follow-up needed)

- **Marketing voice = Playfair headlines + Syne chrome + JetBrains Mono captions.** This is
  what Claude Design actually built and what you preferred. Lessons stay **Syne / 700**. The
  shared wordmark + kickers keep reel and lessons one brand.
- **CTA copy:** ship the placeholder `Demo build · sample content only`. Swap in the
  real date/URL when you have it — it's a one-field copy change, not a blocker.
- **Audio:** reuse the existing sizzle track for the lean route. The full vo-timing/beat-map
  is only needed for the deferred deterministic rebuild.
- **Lesson delivery resolution:** scale=2 → ship 2160p direct (fall back to 1.5 if render
  time bites); sizzle → scale=2 → lanczos to 1080p.

---

## 4. Verification contract

- **PNG↔PNG** parity: fresh `renderStill` vs Design reference, per scene. The MP4 is never
  the comparison surface.
- **Gates green, run AFTER renders:** `gate:motion` (liveliness), `gate:media` (audible +
  BT.709), `gate:layout` (+ new golden diff). Never during a live render.
- **Values-lint** (Phase 5) green in the Stop-hook slice check.
- **Codex review** at the milestone — note Codex is currently un-runnable on this Windows
  box (`codex exec` dies `-1073741502`), so the **PNG diffs are the falsifiable proof** in
  the interim, not Codex agreement.

---

## 5. Sequencing — what to do first

```
Phase 0 (scale=2 + encode)      → biggest crispness win, zero design risk   ← START HERE
Phase 1 (fonts fail-loud + bundle)
Phase 2 (lesson literal value swaps)
Phase 3 (spring → easeOutCubic)
Phase 4 lean (sizzle: Playfair + content beats)
Phase 5 (guardrails: lint + golden frames + CLAUDE.md rules)
— later — Phase 4 full (deterministic scene-contract rebuild)
```

**Single highest-leverage move:** `scale: 2` in the two render scripts. It recovers the
dominant "soft/blurry" gap, changes zero design code, and is reversible in one line.
**Single highest-leverage *character* move:** title weight 800 → 700 — it's most of the
"heavier / not my design" read across every scene.

---

## 6. Spec reconciliation — Codex adversarial plan-review (2026-06-23)

Codex returned BLOCK with 5 findings; all accepted and folded into `docs/ACCEPTANCE.md`:
1. **Golden frames** (Phase 5) are **deferred to backlog** (need a per-scene render pass);
   the **values-lint test** is this run's anti-drift artifact — no unmet golden-frame promise.
2. **Sizzle lean route ≠ determinism.** FV2-4 claims identity + concrete content beats +
   liveliness only; frame-exact `scene-contract.json` reproducibility is the deferred
   **FV2-4-full**, not asserted here.
3. **Motion gate on fresh output.** FV2-3's `gate:motion` runs on the freshly rendered
   sizzle (which uses the changed `shared.tsx` helpers), never a stale MP4.
4. **Encode proven, not just diffed.** FV2-0 is not `done` until a real MP4 from the
   modified script is ffprobed (bt709 / yuv420p / faststart / plays) — AC0.5.
5. **Scale is unambiguously 2.** The "1.5 fallback" is removed from the contract; the
   committed default is a `RENDER_SCALE` constant = `2` (env-overridable for ops only).
