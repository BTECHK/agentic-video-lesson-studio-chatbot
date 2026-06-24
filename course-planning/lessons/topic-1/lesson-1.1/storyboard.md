# Storyboard — Topic 1.1: How This Course Works

> **Sample content** (synthetic sample lesson). One key pose per scene. Every scene id matches
> `scene-contract.json`. Brand: linen bg / Syne 700 titles / 4px cards / crimson accent
> (`brand-tokens-ref.md`).

## Scene poses

### cover — cover (0f–600f)
- **Key pose:** two-line Syne 700 title centred ("How this" / "course works."), eyebrow "Topic 1 · Lesson 1.1"
  above, sub line "Short lessons, one skill each, practiced in a real assistant." beneath, and three stat blocks
  (5 short lessons · 27 min topic total · 3 steps per lesson) along the lower third.
- **Brand:** linen bg, charcoal ink, crimson eyebrow tracking.
- **Motion in one line:** title glides up and settles; the three stats pop in staggered (outBack).

### one-skill-at-a-time — quote-card (600f–1800f)
- **Key pose:** large pull quote "One skill per lesson. You see it in a real assistant, then you try it on your own
  work." with a short crimson rule under the eyebrow "How the course is paced". Attribution "Course Instructor,
  Sample Academy" sits bottom-left.
- **For long holds:** the quote block keeps a slow idle sine float, so the ~40s hold never reads as a freeze.
- **Motion in one line:** quote fades up, accent rule draws left-to-right (inOutCubic), then float + ambient drift.

### topic-1-map — journey-map (1800f–2700f)
- **Key pose:** horizontal 5-stop lesson map under "You're right here". Stop 1.1 is the active focal node (accent
  fill, gentle pulse). Stops 1.2 Picking the Right Assistant · 1.3 Writing Clear Prompts · 1.4 Checking the Output ·
  1.5 Making the Assistant Yours sit muted ahead, and the connecting path is drawn through all five.
- **Motion in one line:** path draws across the stops (inOutCubic), then the 1.1 node pulses to claim focus.

### lesson-rhythm — recap-grid (2700f–3600f)
- **Key pose:** three numbered cards in a row under "Three steps, every time": 01 See the idea · 02 Watch it in a
  tool · 03 Try it on your own task.
- **Motion in one line:** cards stagger in 6f apart, each rising ~20px and landing (outCubic).

### practice-setup — setup-checklist (3600f–4860f)
- **Key pose (mid-interaction):** frame ~3990 (scene frame ~390). Items 1 ("Open an assistant you can already use")
  and 2 ("Start a fresh chat for practice") are ticked and tinted `accentSoft`, with their "why" lines visible.
  The cursor is mid-glide from item 2 toward item 3's empty checkbox. Item 4 ("Pick one real task from your
  week") is still unchecked below.
- **Engagement pause:** at scene frame ~900 the cursor parks beside item 4's open checkbox during the "write your
  task down" pause, and ticks at ~1080.
- **Motion in one line:** rows land unchecked, then cursor → click → check pop (outBack) → row tint, once per item.

### up-next — preview-band (4860f–5400f)
- **Key pose:** a low band across the lower third reads "Up next · Lesson 1.2" (eyebrow) / "Picking the Right
  Assistant" (Syne 700), with the linen field above still carrying ambient drift.
- **Motion in one line:** band slides in (outCubic) and the title lands. Hold to the end.

## Sign-off
- [ ] Instructor / Claude Design reviewed poses
- [ ] Poses match scene-contract.json scene ids + order
- [ ] The one demo beat (`practice-setup`) shows a mid-interaction frame, not a finished list, per
      `interactive-mandate.md`
