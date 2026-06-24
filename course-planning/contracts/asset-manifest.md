# Asset Manifest — course-wide

> **Why / Intent:** no network at render time. Every asset is local + checksummed, which directly
> fixes the serif-fallback bug (a missing CDN font silently substituted a serif). Fill checksums when
> the real files are committed (`sha256`).

## Fonts (bundled local — never a CDN at render)
| Family | Weights | File | Used for |
|---|---|---|---|
| Syne | 400–800 (variable) | `public/fonts/Syne-Variable.ttf` | Product/lesson voice: all lesson titles, body, chrome |
| Playfair Display | 400–900 (variable) | `public/fonts/PlayfairDisplay-Variable.ttf` | Marketing voice: sizzle headlines only |
| JetBrains Mono | system stack | (system) | Captions, timecodes, data |

> ⚠️ A face that fails to load must **throw** (`cancelRender`), not substitute. Gated by `delayRender()`.

## Logos / marks (animated or mocked, brand-colored)
| Asset | Source | Notes |
|---|---|---|
| Sample wordmark | brand | Syne, crimson "Sample" + charcoal "Academy" |
| Tool marks (ChatGPT, Claude, Gemini, Perplexity, Grok) | `ColoredToolMark` component | Distinct glyph + brand color each; Gemini = gradient `#1C7DFF→#9168C0→#F65AA3` |

## Audio (supplied per lesson — NOT in this planning handoff)
| Asset | Notes |
|---|---|
| Voiceover WAVs | per-scene TTS (Kokoro/Chatterbox) or recorded; word-level timing in `lesson.json.narration.words` |
| Music bed (sizzle) | + BPM + downbeat frame map so cuts land on beats |

## Brand tokens (immutable)
All color/type/spacing/radius come from `src/brand/tokens.ts` — see `brand-tokens-ref.md`. Never inline.
