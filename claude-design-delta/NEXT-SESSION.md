# Next session — handoff (branch `claude-design-advice`)

Branched from `feat/v2-claude-design-facelift` @ `30827e7`. This branch is for the **design-fidelity remediation**: applying Claude Design's parity punch list to the Remotion render so the MP4 matches the HTML.

## Where things stand
- **Sizzle v2.3** — shipped, all 10 ACs green, **delivered to Drive `00 — START HERE`** (both formats, byte/cloud-verified). Committed `1510843`, pushed. Status `awaiting_codex_review` only because **Codex is un-runnable on this Windows box** (see learnings: `codex exec` PowerShell dies `-1073741502`). Not a code issue.
- **Claude Design delta bundle** — `claude-design-delta/` (committed `30827e7`, pushed). Claude Design already returned its diagnosis: **`claude design response/Remotion Parity Punch List (offline).html`** ← read this first.
- **On-brand context bundle** — `claude-design-context/` (`tokens.css` + guidelines) for keeping Claude Design output on-brand. `/design-sync` does NOT apply here (video pipeline, not a component library — see `.design-sync/NOTES.md`).

## The diagnosis (don't re-derive)
Color is identical (sRGB hex both sides, ΔE ≈ 0). The "dull/soft" gap is **resolution/DPI → codec → implementation/motion**. Full concept: `wiki/concepts/design-fidelity-html-vs-mp4.md` + the new `learnings.md` entry.

## Next steps (the remediation)
1. Read the punch list (above). Apply via the prompt in `claude-design-delta/README.md` — **Design owns VALUES, the pipeline owns IMPLEMENTATION** (don't let it refactor the pipeline).
2. **Render config first (highest leverage):** render the comp at **2× (3840×2160) → downscale to 1080p (SSAA)** + lower CRF / higher bitrate, keep BT.709 (`scripts/render-sizzle.ts` + `scripts/render-lesson.ts`).
3. Then implementation/motion parity items from the punch list (shadows, gradient stops, stroke widths, font AA, spring/easing).
4. Verify **PNG↔PNG** (fresh `renderStill` vs Design reference) — never the MP4. Regenerate stills with `scripts/_gen-delta-stills.ts`.

## Loose ends
- Pre-existing v2 WIP is still **uncommitted** in the working tree (gate-motion system: `scripts/gate-motion.ts`, `src/lib/{gate-motion,media-probe}.ts`, `test/gate-motion.test.ts`, `.planning/MOTION-CONTRACT.md`; modified `shared.tsx`, `render-lesson.ts`, `gate-media.ts`, `publish-to-drive.ts` + doc updates). Decide whether to commit. Scratch/imports (`_review/`, `_claude-design-import/`, `_claude-design-skill/`, `.codex/`) intentionally left out.
- gitnexus index refreshed (854 files / 8007 symbols @ 30827e7).
