# 08 · Reference video → style spec

Claude can't watch video. It **can** see screenshots and read transcripts. This doc gives you a copy-paste prompt that turns a reference video (via screenshots + optional transcript) into a structured **style spec** that plugs directly into this skill's brand system (`01`), motion contract (`02`), and scene catalog (`03`).

Use this when you find a video whose look/feel you want to recreate — an Anthropic demo, an Apple feature reel, a competitor's explainer, etc.

---

## Step 1 · Capture the inputs

Before prompting, gather:

1. **8–15 screenshots** spanning the video's timeline. Prioritize *moments of change*, not pretty hold frames:
   - The opening / title card
   - First content reveal
   - A transition mid-motion (pause the video between two scenes and grab the in-between frame — this is the most valuable shot for reading easing/style)
   - Any "loading" / "processing" / "thinking" state
   - A data reveal or chart build
   - Text-heavy moment (for typography)
   - The outro / end card
   - Label each screenshot with its timestamp if you can (e.g. `00-04s-title.png`).

2. **The transcript or captions** (optional but helpful) — paste as text, or note "no VO, music only".

3. **The video's basic facts** — source/URL, runtime, aspect ratio, who made it.

> Tip for grabbing the transition frame: scrub to a cut, then step **one frame back**. The blur/scale/offset in that half-finished frame tells Claude more about the easing than any held frame.

---

## Step 2 · The prompt

Paste this into Claude Code (or Claude) **with the screenshots attached**:

```
You are a motion-design analyst. I'm going to show you screenshots from a
reference video (and a transcript, if provided). I want you to reverse-engineer
its visual and motion style into a structured STYLE SPEC that I can hand to a
coding agent to recreate the look in HTML/React.

Reference video: [SOURCE / URL]
Runtime: [e.g. 1:30]   Aspect ratio: [e.g. 16:9]   Made by: [if known]
Transcript: [paste, or "none — music only"]

I've attached [N] screenshots in timeline order. Study them carefully before
writing anything. Then produce the spec below. Be specific and quantitative —
estimate real values (hex codes, px sizes, seconds, easing curves). Where you're
inferring rather than certain, say "(inferred)".

Produce exactly these sections:

## 1. One-paragraph vibe
The aesthetic in 3–4 sentences. What world does this live in? What's the
emotional register (calm/energetic/clinical/playful)? What does it remind you of?

## 2. Color system
- Background color(s) with hex estimates.
- Accent color(s) with hex estimates, and what they're used for (active states,
  CTAs, highlights).
- Text colors (note if it's true black or off-black).
- Whether it's light-mode, dark-mode, or warm/cool.
- A note on contrast and saturation level (muted vs vivid).

## 3. Typography
- Serif or sans? Estimate the typeface family or a close Google-Fonts substitute.
- Are headings and body the same family or paired?
- Weight range used. Letter-spacing impression (tight/normal/loose).
- Relative type scale: how big is the hero vs body (e.g. "hero ~5x body").
- Any all-caps eyebrows / labels? Numeric style (tabular?)?

## 4. Layout & composition
- Margin generosity (edge-to-edge vs heavy padding).
- Grid feel (centered single column, split, card grid).
- Use of whitespace.
- Corner radius impression (sharp / slightly soft / very rounded).
- Shadow/depth language (flat / subtle float / heavy).
- Any signature UI motifs (chat bubbles, device frames, browser chrome, etc).

## 5. Motion & transitions
For EACH transition or animated moment you can infer from the frames:
- What moves, from where to where.
- Estimated duration in seconds.
- Easing character: does it snap, glide, overshoot, decelerate? Map to a
  cubic-bezier guess (e.g. "smooth decel ≈ cubic-bezier(0.22,1,0.36,1)").
- Whether elements stagger or arrive together.
Then summarize the OVERALL motion personality in 2 sentences.

## 6. Loading / processing / "thinking" states
If the video shows any waiting state, describe it precisely (spinner? drawn line?
pulsing? scanning dot? typewriter text?). If none, say so.

## 7. Scene inventory
List each distinct scene/shot in timeline order as a table:
| # | ~timestamp | what's on screen | purpose | closest scene-type* |
*Map to one of: cover, journey-map, comparison-chats, tool-card-reveal,
capability-table, setup-checklist, feature-grid, voice-demo, recap-grid,
demo-cue, quote-card. Say "NEW: <describe>" if nothing fits.

## 8. Recreation notes for the coding agent
- 3–5 bullet "must-haves" — the things that, if missed, would lose the style.
- 3–5 "avoid" bullets — traps that would make a recreation feel cheap/off.
- Any element that needs a custom primitive we likely don't have yet.

## 9. Deltas from the house style
Assume our existing house style is: warm minimalist — Soft Linen #EDE8E3
background, Crimson #8B2635 accent, Syne font, 4px radius, glide easing
cubic-bezier(0.22,1,0.36,1), semantic micro-interactions over spinners.
List what in THIS reference differs from that, and for each: recommend either
"adopt into house style", "use only for this video", or "skip — clashes".

End with a single sentence: is this style a good fit to fold into the animated-lesson system, or is it a different enough world that it should be its
own track?
```

---

## Step 3 · Use the output

The spec maps onto the skill like this:

| Spec section | Feeds into |
|---|---|
| 2. Color system | `references/01-brand-system.md` — propose new tokens or confirm existing |
| 3. Typography | `01-brand-system.md` type scale |
| 5. Motion & transitions | `references/02-motion-contract.md` easing + staging rules |
| 6. Loading states | `02-motion-contract.md` rule 3 (semantic micro-interactions) — may justify a new primitive in `lesson-ui.jsx` |
| 7. Scene inventory | `references/03-scene-catalog.md` — confirms existing scene types or flags a NEW one to build |
| 8. Recreation notes | direct instructions when you build the lesson |
| 9. Deltas | decision log: what to adopt house-wide vs keep one-off |

If section 9 concludes the style is a **good fit**, fold the deltas into the reference docs and proceed normally. If it concludes the style is a **different world**, don't pollute the house style — clone the skill into a new track (e.g. `animated-lesson-<style>`) with its own brand-system doc.

---

## Step 4 · (Optional) Build a swatch to confirm

Before committing a new style to a full lesson, ask the coding agent to build **one** `cover` scene and **one** transition using the extracted spec. Render it, compare side-by-side with the reference screenshots, and iterate on the spec until the swatch reads right. Cheap to throw away; expensive to discover a mismatch after building nine scenes.

---

## Why screenshots beat "just give it the link"

A YouTube link gives Claude the page text — title, description, sometimes captions. It conveys **what is said**, never **what is shown**. Motion, color, type, timing, and layout are all invisible from a link. Screenshots are the only high-fidelity channel for visual style, and the mid-transition frame (Step 1 tip) is worth more than any held frame because it exposes the easing.
