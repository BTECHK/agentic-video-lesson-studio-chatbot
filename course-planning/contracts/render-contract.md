# Render & Output Contract — course-wide

> **Why / Intent:** the half of "it looks worse" that no component edit can fix. These are the
> exact output settings the FaceliftV2 remediation landed (now live in `scripts/render-lesson.ts`
> and `scripts/render-sizzle.ts`). Recording them here makes them a contract, not a buried code default.

## Render settings (non-negotiable)
| Setting | Value | Why |
|---|---|---|
| fps | **30** | All durations in the scene contracts are integer frames at 30. |
| Composition | 1920×1080 (sizzle also 1080×1920 for 9:16) | — |
| **Scale** | **2×** (`scale: 2`, backing render 3840×2160) | Supersampled antialiasing — the #1 crispness lever. Committed default is literally `2` (env override ops-only). |
| Frame range | derive from the scene-contract `duration` | Never hardcode. |

## Encode (Remotion / x264)
| Setting | Value |
|---|---|
| codec | `h264` |
| crf | **≤ 18** (`crf: 18` lessons; sizzle uses a stronger crf) |
| preset | `x264Preset: 'slow'` |
| pixel format | `yuv420p` |
| color | **BT.709** (`colorSpace: 'bt709'`) + range tv — stops the "duller/washed" remap |
| faststart | moov atom at front (Remotion default for mp4) — instant playback on Teachable |

## Determinism guarantees
1. No wall clock (`useCurrentFrame()` only). 2. No unseeded random. 3. **Fonts fail loud** —
`delayRender()` until the exact local font files load; `cancelRender(err)` on failure, never a silent
fallback (that's how a serif shipped where Syne was intended). 4. Assets local + pinned (no network at
render). 5. Tokens read-only inside components — change `src/brand/tokens.ts`, not the renderer.

## Delivery
- Lessons: 1080p (or ship the 2× 2160 directly; keep < 2GB for Teachable).
- Liveliness/media gates before publish: `gate:motion` (activePct ≥ 0.6, no still > 2.5s) +
  `gate:media` (audible + BT.709). Gate AFTER rendering, never during.

## Golden frames + version lock (the determinism proof — to add)
One PNG per scene at its mid-frame, committed under a `golden/` dir; re-render diffs prove
determinism. Pin Remotion + Node (lockfile + `.nvmrc`). *(Deferred — recorded here as the standard.)*
