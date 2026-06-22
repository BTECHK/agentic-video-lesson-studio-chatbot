# Sizzle storyboard — the content contract

> **Sample content.** The promo copy is neutral product-demo copy about the video
> pipeline itself (outline in, finished video lesson out). It describes no real
> course, audience or market.

`sizzle.storyboard.ts` is the **single source of truth** for the sizzle reel's
text and tool chips. `SizzleManifesto.tsx` renders from the exported `SIZZLE`
object and holds no copy of its own. Why this exists: earlier rebuilds kept
losing a piece (a transform column, the tagline, the do-list wording).
Centralizing the content makes those regressions impossible to introduce
silently, and easy to test (`test/sizzle-storyboard.test.ts`).

## What lives here

| Field | Meaning |
| --- | --- |
| `different.doItems` (×3) | "What it does" copy. `*…*` = crimson accent emphasis. The last item gets hero emphasis. |
| `different.notItems` (×3) | "What it replaces" copy (each gets a strikethrough). |
| `different.tools` | Tool chips, left→right. Each `{ name, color }`. |
| `transform.cols` (×3) | The dark payoff: `from`→`to` under a `label` header (Manual→Automated, One-off→Repeatable, Unchecked→Gated). |
| `transform.tagline` | Closing line under the columns. |
| `cta.apply` | Call-to-action line under the close beat (middot, never an em-dash). |

## Tool colors

Solid hex is the brand fill for that glyph. The sentinel `'gemini-gradient'`
(`GEMINI_GRADIENT`) tells `ColoredToolMark` to fill Gemini's glyph with an inline
blue→purple→pink `<linearGradient>` instead of a flat color.

- Claude `#D97757` · ChatGPT `#0f0f0f` · Gemini gradient · Perplexity `#20B8CD`

## Verbatim rule

The strings are canonical; do not paraphrase them in the component. No
em-dashes in any on-screen string (the test renders the beats and asserts it).
Retired draft do-items must never return (the test lists them).

## What is NOT here

Beat structure, timings, the audio track, and durations live in
`SizzleManifesto.tsx` (`MANIFESTO_BEATS`, `SIZZLE_DURATION`, the `<Audio>` line)
and must not change; only the content above is data-driven.
