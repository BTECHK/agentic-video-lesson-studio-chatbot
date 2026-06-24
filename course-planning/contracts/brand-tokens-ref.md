# Brand Tokens — reference (immutable)

> **Why / Intent:** color/type/spacing/radius are locked in code (`src/brand/tokens.ts`) and read-only
> inside components. To change the look you change the token, never the renderer. This is a human-readable
> mirror for planning/review; `src/brand/tokens.ts` is the source of truth.

## Surfaces (warm linen family)
- `bgBase #EDE8E3` (Soft Linen — default scene bg) · `bgAlt #F7F4F0` · `bgCard #FDFBF9` (Card White) · `bgDark #E3DED9`
- Dark scenes (sizzle transform): ink `#191717`, rose accent `#E7A6AE`

## Ink
- `text #1C1C1C` (Charcoal) · `textMuted rgba(28,28,28,.60)` · `textDim rgba(28,28,28,.33)`

## Accent (the only chromatic color)
- `accent #8B2635` (crimson) · `accentSoft rgba(139,38,53,.10)`

## Type
- **Lessons:** Syne. Title weight **700** (bold), `LEADING.title 1.02`, tracking ~ −0.025em. Sub **500**.
- **Sizzle (marketing):** Playfair headlines (600) + Syne chrome + mono captions.
- Eyebrow: Syne 600, 14px, 0.14em uppercase.

## Geometry
- Radius **4px** everywhere; **14px** only on chat/voice/browser windows. No in-between (6/8/12).
- 4px spacing grid. Safe-area inset ~96×54px.
- Cards: flat on linen + 1px border at rest; lift (shadow) only on focus.

## Shadows (charcoal, low opacity — never glow)
- card `0 4px 12px rgba(28,28,28,.04)` (focus only) · window `0 30px 60px -20px rgba(28,28,28,.20)`

## Video
- 1920×1080 @ 30fps (sizzle also 1080×1920).
