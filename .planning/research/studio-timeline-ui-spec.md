---
title: Studio Timeline — UI Design Contract (Phase G Control Plane)
status: draft
phase: G
scope: Oversight-only multi-track timeline. NO in-browser content editing.
stack: Next.js 16 (App Router) + React 19, inline-style components, CSS-variable tokens, Tailwind v4 present but components use inline styles
brand: Syne font, #EDE8E3 linen base, #8B2635 crimson accent, 4px radius
last_updated: 2026-05-23
---

# Studio Timeline — UI Design Contract

A read-and-review control plane for the lesson-video pipeline. Four parallel tracks
(Animation, Voiceover, Script, Captions) on one shared horizontal time axis, a synced
playhead, click-to-isolate inspector, and comment-driven AI regeneration. This is an
**oversight tool**, not an editor. "Set and forget" is the default state.

---

## 1. Reference Survey — Minimum Patterns Worth Copying

Distilled from CapCut, GarageBand, Descript, Premiere Rush, and Instagram's edit screen.
For an oversight-only tool we keep the *spatial/temporal legibility* patterns and discard
everything that exists to support editing (trim handles, drag-to-move, ripple, razor, magnetic snap).

| App | Pattern worth copying | What we deliberately drop |
|-----|----------------------|---------------------------|
| **CapCut** | Fixed left **track-header column** + scrolling lane area; pinch/slider **zoom** changing px-per-second; thumbnail filmstrip on the video track | Drag-trim handles, split tool, transitions UI, keyframe rows |
| **GarageBand** | **Stacked lanes of equal time scale**, one lane per "instrument" — the canonical multi-track mental model; per-track header with name + mute/solo (we reuse the header slot for status, not mute) | Mixer, automation curves, loop library |
| **Descript** | **Audio rendered against text** so you see word/script alignment; click a word to jump the playhead; comment pins anchored to a time range — closest analog to our model | Full transcript editing, "edit audio by editing text" |
| **Premiere Rush** | Deliberately **simplified, fewer affordances** than the pro tool — proof a stripped timeline reads as friendly, not amateur | Multi-clip selection, effect stacks |
| **Instagram edit screen** | **Single bottom scrubber + giant tappable thumbnails**, near-zero chrome, one obvious primary action | Per-frame editing, layered timelines |

**Cross-app invariants (the load-bearing patterns):**
1. **One time axis governs all lanes.** A vertical playhead spans every lane; the ruler is shared. This single rule is the entire reason the screen exists ("see how layers line up").
2. **Frozen left header column, horizontally-scrolling lane body.** Headers never scroll out; lanes scroll/zoom together as one synced viewport.
3. **Playhead = thin vertical line + draggable handle in the ruler.** Click anywhere in the ruler to seek; the line is the cursor for the whole stack.
4. **Zoom changes pixels-per-second**, not lane count. A slider (and `+`/`-`) is enough; pinch is a nice-to-have.
5. **A clip is a positioned block** `left = startSec * pxPerSec`, `width = durationSec * pxPerSec`. Selection = a ring/elevation on that block.

Sources:
- wavesurfer.js (waveform rendering) — BSD-3-Clause, supports pre-decoded peaks + duration without fetching audio; official `@wavesurfer/react` wrapper; renders to `<canvas>`. https://github.com/katspaugh/wavesurfer.js
- react-timeline-editor (xzdarcy) — MIT, React+TS timeline component, v1.0.0 Jan 2026. https://github.com/xzdarcy/react-timeline-editor
- Descript timeline/comment model and CapCut/GarageBand/Rush/Instagram layouts: established product patterns observed in their shipping UIs (general industry references).

---

## 2. Recommended Layout (ASCII Wireframe)

Desktop-first, single screen. Two regions: **timeline (top)** and **inspector (right, slides in on select)**.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Module 3 · Lesson 2 — Studio            [▸ Play]   status: 2 stale · 1 error  │ ← header bar (48px, matches TopNav)
├──────────────────────────────────────────────────────────────────────────────┤
│ TRACKS │  0s        5s        10s       15s       20s       25s     ▏ruler     │
│ (200px)│  ┊         ┊         ┊         ▌(playhead 12.4s)  ┊         ┊          │
│        │            ▌                                                          │
│ ◆ Anim │  [▢ scene1 ][▢ scene2•stale][▢ scene3 ][▢ scene4 ]      ← thumbnails  │
│        │                                                                       │
│ ♪ Voice│  ∿∿∿∿∿∿ clip1 ∿∿∿  ∿∿∿∿ clip2 ∿∿∿∿∿  ∿∿ clip3 !err ∿∿   ← waveforms   │
│        │                                                                       │
│ ¶ Script│ [ "Welcome to…" ][ "Next, we…" ][ "Finally…" ]         ← text blocks │
│        │                                                                       │
│ ▭ Caps │  [pg1][pg2][pg3][pg4][pg5][pg6][pg7]                    ← caption pages│
├────────┴───────────────────────────────────────────────────────────────────┬─┘
│  [−]══════●═════ [+]   zoom              ↕ scroll lanes together              │  ← footer: zoom + transport
└──────────────────────────────────────────────────────────────────────────────┘

  ── on click of any block, inspector slides in from right (overlays lanes) ──

                                        ┌───────────────── INSPECTOR (380px) ──┐
                                        │  Animation · Scene 2            [✕]  │
                                        │  ┌────────────────────────────────┐  │
                                        │  │   isolated preview of element  │  │
                                        │  │   (scene render / audio player │  │
                                        │  │    / script text / caption pg) │  │
                                        │  └────────────────────────────────┘  │
                                        │  ● stale — upstream Script changed   │  ← status row
                                        │  5.0s – 9.2s · scene "tool-card"     │
                                        ├──────────────────────────────────────┤
                                        │  Comments                            │
                                        │  ┌──────────────────────────────┐    │
                                        │  │ Instructor · 2h ago                │    │
                                        │  │ "Make the logo bigger"       │    │
                                        │  │   ↳ AI: regenerating…        │    │
                                        │  └──────────────────────────────┘    │
                                        │  ┌──────────────────────────────┐    │
                                        │  │ Leave a comment for the AI…  │    │
                                        │  │                    [ Send ]  │    │
                                        │  └──────────────────────────────┘    │
                                        └──────────────────────────────────────┘
```

Layout rules:
- **Header column fixed at 200px**, lane body fills the rest and is the only horizontally-scrolling element. Vertical scroll (if many… here only 4 tracks, so usually none) scrolls headers + lanes together.
- **Inspector is a right overlay, 380px**, drops a translucent scrim over the lanes (not the header). Closing returns to pure timeline. The timeline never disappears — oversight context stays visible.
- **Footer is sticky**: zoom slider left, transport center. Minimal chrome, Instagram-style.
- All blocks share `4px` radius. Cards/inspector use `--bg-card`; lane background `--bg-alt`; page background `--bg-base`.

---

## 3. Component Breakdown

All components are client components (`'use client'`), inline-styled with CSS variables to
match the existing chatbot app (e.g. `ToolCard.tsx`, `TopNav.tsx`). No new styling system.

### `<Timeline>` — orchestrator
- **State:** `playheadSec`, `isPlaying`, `pxPerSec` (zoom), `scrollLeftSec`, `selectedElement | null`, `durationSec`.
- **Props:** `lesson: LessonTimeline` (the four track datasets + total duration).
- Owns the single shared time scale; passes `pxPerSec` and `scrollLeft` to all lanes. Renders `<Ruler>`, four `<TrackLane>`, `<Playhead>`, `<TransportBar>`, and conditionally `<Inspector>`.

### `<TrackLane>` — one horizontal track
- **Props:** `kind: 'animation' | 'voiceover' | 'script' | 'captions'`, `items: Clip[]`, `pxPerSec`, `onSelect(clip)`, `selectedId`.
- **State:** none (controlled). Renders a `<TrackHeader>` (in the frozen column) + a positioned row of `<Clip>`.
- Lane height: Anim 72px (thumbnails), Voice 64px (waveform), Script 56px, Caps 48px.

### `<TrackHeader>`
- **Props:** `icon`, `label`, `aggregateStatus: 'fresh' | 'stale' | 'error'`.
- Shows track icon + name + a roll-up `<StatusBadge>` (worst status across its clips). 200px wide, `--bg-card`.

### `<Clip>` — the universal block (one renderer, four variants)
- **Props:** `kind`, `startSec`, `durationSec`, `pxPerSec`, `status`, `selected`, `payload`, `onSelect`.
- **Computed:** `left = startSec * pxPerSec`, `width = max(durationSec * pxPerSec, MIN_CLIP_PX=24)`.
- **Variants:**
  - `animation` → `<img>` thumbnail strip (or first-frame), 4px radius, label overlay.
  - `voiceover` → `<WaveClip>` wrapping wavesurfer in `peaks`-only mode (no audio fetch on the lane; full audio loaded only in inspector).
  - `script` → text block, `--bg-card`, 1–2 line clamp of narration.
  - `captions` → small "page" chips; very short blocks.
- **States:** default · hover (subtle shadow, like ToolCard) · selected (2px `--accent` ring + elevation) · stale (dashed `--limitation-border` left edge + badge) · error (solid `--limitation-text` left bar + badge).

### `<Ruler>` / time axis
- **Props:** `durationSec`, `pxPerSec`, `onSeek(sec)`.
- Tick marks + `mm:ss` labels at adaptive intervals (1s/5s/10s based on `pxPerSec`). Click anywhere → `onSeek`. This is the primary scrub surface.

### `<Playhead>`
- **Props:** `playheadSec`, `pxPerSec`, `onScrub(sec)`.
- A 2px `--accent` vertical line spanning all lanes + a draggable handle (▼) sitting in the ruler. `position: absolute; left = playheadSec * pxPerSec`. Drag updates `playheadSec`; spring-eased on programmatic jumps, instant during drag.

### `<TransportBar>` (footer)
- **Props:** `isPlaying`, `onPlayPause`, `pxPerSec`, `onZoom(px)`, `playheadSec`, `durationSec`.
- Play/pause, current time `mm:ss / mm:ss`, zoom slider (`MIN 4px/s … MAX 80px/s`) with `−`/`+`.

### `<Inspector>` — isolated element + comments
- **Props:** `element: SelectedElement`, `onClose`, `comments: Comment[]`, `onComment(text)`.
- **Sections:** isolated preview (scene render in `<iframe>`/`<img>`; audio via full wavesurfer player; script as readable prose; caption as page render) → status row → `<CommentThread>`.

### `<CommentThread>` + `<CommentComposer>`
- **Props:** `comments`, `onSubmit(text)`.
- Each comment: author, relative time, body, optional `↳ AI: regenerating… / regenerated · n min ago` status line (the only "action" — comment triggers AI regen elsewhere; UI just reflects it).

### `<StatusBadge>`
- **Props:** `status: 'fresh' | 'stale' | 'error'`, `size: 'sm' | 'md'`.
- `fresh` → no badge by default (absence = healthy; keeps "set and forget" quiet). Optional tiny `--feature-text` dot on hover.
- `stale` → amber/neutral pill "stale" using `--limitation-bg`/`--limitation-text` muted, with a refresh glyph.
- `error` → solid `--accent` pill "error" with `!` glyph.

### Data shape (sketch)
```ts
type Status = 'fresh' | 'stale' | 'error';
interface Clip {
  id: string;
  kind: 'animation' | 'voiceover' | 'script' | 'captions';
  startSec: number;
  durationSec: number;
  status: Status;
  staleReason?: string;        // e.g. "Script block s2 changed"
  payload: AnimationPayload | VoicePayload | ScriptPayload | CaptionPayload;
}
interface VoicePayload { peaks: number[]; audioUrl: string; }   // peaks for lane, url for inspector
interface LessonTimeline { durationSec: number; tracks: Record<Clip['kind'], Clip[]>; }
interface Comment { id: string; clipId: string; author: string; createdAt: string; body: string; aiState?: 'queued'|'regenerating'|'done'; }
```

---

## 4. Build vs Library Decision

**Recommendation: Build the timeline from scratch with absolutely-positioned `<div>`s. Use wavesurfer.js (BSD-3-Clause) only for the waveform rendering.**

Reasoning:
- The timeline math is trivial — `left/width = sec * pxPerSec`. There is **no editing** (no drag-to-trim, snap, ripple, multi-select), which is the only reason timeline libraries are heavy. A library would import editing affordances we must then suppress, fighting its grain and its styling (e.g. react-timeline-editor uses Less, conflicting with our inline-style + CSS-var convention).
- Divs over Canvas/SVG: only 4 tracks × a handful of clips. DOM is plenty performant, gives free accessibility (focusable buttons, screen-reader text), and matches the existing inline-style component pattern. Canvas would forfeit a11y and require a custom hit-test layer for click-to-isolate. SVG offers no advantage here over divs.
- Waveforms are the **one** thing genuinely hard to hand-roll. wavesurfer.js renders peaks to `<canvas>`, accepts a **pre-decoded `peaks` array + `duration`** so the lane needs no audio file (cheap, fast, offline-friendly), and the inspector can load the real `audioUrl` for playback.

| Option | License | Verdict |
|--------|---------|---------|
| Hand-built divs (timeline, playhead, ruler, clips) | n/a (our code) | **Chosen** — minimal, on-brand, a11y-friendly |
| wavesurfer.js + `@wavesurfer/react` | BSD-3-Clause (free, commercial OK) | **Chosen** for waveform lane + inspector audio |
| react-timeline-editor (xzdarcy) | MIT (free, commercial OK) | Rejected — editing-oriented, Less styling clashes |
| Pro/commercial timeline SDKs | paid | Rejected — violates no-paid-services rule |

License compliance: wavesurfer.js BSD-3-Clause requires retaining the copyright/license notice — satisfied automatically via `node_modules` + a NOTICE/attribution line. No copyleft, no commercial fee.

---

## 5. Interaction Spec

| Interaction | Behavior |
|-------------|----------|
| **Scrub playhead** | Click anywhere on the ruler → seek. Drag the ▼ handle → continuous seek; line follows instantly (no spring during active drag). Releasing keeps position. Keyboard: ←/→ nudge ±1s, Shift+←/→ ±5s, Home/End jump. |
| **Play** | Space or footer ▸ toggles play. Playhead advances via `requestAnimationFrame` at `pxPerSec` scale; lanes auto-scroll to keep playhead in view. Voiceover audio plays from the active clip; script/caption blocks under the playhead get a faint `--accent-soft` highlight so you watch alignment. |
| **Click-to-isolate** | Single click on any clip → selects it (accent ring) and slides the inspector in from the right (220ms spring, translateX). Inspector shows that element alone + its comments. Click another clip swaps content in place. |
| **Comment** | Type in composer → Send. Optimistically appended with `aiState: 'queued'`. The act of commenting is the *only* mutation the UI performs; downstream AI regen updates `aiState` → `regenerating` → `done`, which on completion flips the clip's `status` back to `fresh`. |
| **Zoom** | Footer slider + `−`/`+` change `pxPerSec` (4–80). Zoom anchors on the playhead (keep playhead-time stationary on screen). Optional: Ctrl/Cmd+scroll over lanes. |
| **Stale surfacing** | When an upstream input changes (e.g. Script edited → its Voiceover/Animation/Captions go stale), affected clips show a dashed left edge + "stale" badge, and the track header roll-up shows the worst status. Header bar shows a global count: `2 stale · 1 error`. Non-blocking — purely informational. |
| **Error surfacing** | Failed generation → clip gets solid accent left bar + "error" badge; inspector status row explains and offers the comment box as the recovery path (comment → AI retry). |
| **Set-and-forget (unobtrusive default)** | `fresh` shows **no badge** — a healthy timeline is visually quiet (just thumbnails, waveforms, text). Nothing demands interaction. Only stale/error introduce color/badges, so attention is drawn *only* where needed. No modal nags, no required steps, no unsaved-changes prompts (there is nothing to save). |

---

## 6. Accessibility & Reduced Motion

- **Keyboard:** every clip is a `<button>` (focusable, Enter/Space selects). Playhead handle is focusable with arrow-key scrubbing. Inspector is a focus-trapped dialog (`role="dialog"`, `aria-modal`, Esc closes, focus returns to the originating clip). Logical tab order: ruler → lanes top-to-bottom, left-to-right → footer.
- **Screen readers:** each clip has an `aria-label` like `"Animation, scene 2, 5.0 to 9.2 seconds, stale: script changed"`. Status badges include visually-hidden text (don't rely on color alone). Track headers use `role="rowheader"`-style labeling. Playhead announces time via `aria-valuetext` (treat as a slider, `role="slider"`, `aria-valuemin/max/now`).
- **Color contrast:** text `#1C1C1C` on `--bg-card`/`--bg-alt` passes AA. Status conveyed by **icon + text + color**, never color alone (red/green safe). Accent `#8B2635` on linen passes AA for the badge text/glyph.
- **Reduced motion:** honor `prefers-reduced-motion: reduce`. Inspector slide → instant fade (or no transition). Playhead programmatic jumps → no spring (snap). Auto-scroll during playback → instant or disabled. Spring physics (default brand motion) applies only when motion is allowed.
- **Hit targets:** clip min width 24px but min interactive height ≥44px per lane where feasible; playhead handle ≥24×24px touch target.
- **Focus visibility:** 2px `--accent` outline on focus (reuse selected-state ring), never `outline: none` without replacement.

---

## 7. Brand Token Mapping (use existing `globals.css` vars — do not invent new ones)

| Use | Token |
|-----|-------|
| Page background | `--bg-base` #EDE8E3 |
| Lane background | `--bg-alt` #F7F4F0 |
| Clips, inspector, headers | `--bg-card` #FDFBF9 |
| Text / muted | `--text` / `--text-muted` |
| Playhead, selection ring, error badge, primary CTA (Send) | `--accent` / `--accent-hover` |
| Selected/hover wash, fresh dot | `--accent-soft`, `--feature-*` |
| Stale badge | `--limitation-bg` / `--limitation-border` / `--limitation-text` |
| Borders | `--border` |
| Radius (everything) | `--radius` 4px |
| Font | `--font` (Syne) |

Typography (3 sizes, 2 weights — matching app): 12px labels/badges (600), 14px body/comments (400/600), 16px headers (600). Body line-height 1.5, headers 1.2. Spacing on 4px grid (4/8/16/24).
