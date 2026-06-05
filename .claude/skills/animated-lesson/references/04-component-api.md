# 04 · Component API

Primitives exposed by `templates/lesson-ui.jsx` and `templates/animations.jsx`. All are React components, all read time from the `TimelineContext` provided by `<Stage>`.

You rarely call these directly — `lesson-renderer.jsx` composes them based on JSON. But when you're building a new scene type or fixing a layout bug, this is your reference.

---

## Timeline primitives (`animations.jsx`)

### `<Stage>`

The root of the animation. Hosts a fixed 1920×1080 canvas, scales it to viewport, runs the rAF loop, persists playhead to localStorage, draws the scrubber.

```jsx
<Stage
  width={1920} height={1080}
  duration={104}                   // total seconds
  background="#EDE8E3"
  loop={true}
  autoplay={true}
  persistKey="m1-lesson"            // localStorage key for playhead
>
  {/* scenes go here */}
</Stage>
```

### `<Sprite>`

Mounts children only when the playhead is in `[start, end]`. Provides `localTime` and `progress` via `useSprite()` context.

```jsx
<Sprite start={8} end={15}>
  <MyScene/>
</Sprite>

<Sprite start={8} end={15}>
  {({ progress }) => <div style={{ opacity: progress }}>...</div>}
</Sprite>
```

### `useTime()`

Returns the **global** playhead time in seconds. Use this inside any scene component.

```jsx
const t = useTime();
const visible = t > 5;
```

### `Easing.*`

```js
Easing.linear
Easing.easeInQuad / easeOutQuad / easeInOutQuad
Easing.easeInCubic / easeOutCubic / easeInOutCubic
Easing.easeInQuart / easeOutQuart / easeInOutQuart
Easing.easeInExpo / easeOutExpo / easeInOutExpo
Easing.easeInSine / easeOutSine / easeInOutSine
Easing.easeOutBack / easeInBack / easeInOutBack
Easing.easeOutElastic
```

Use `easeOutCubic` and `easeOutBack` 80% of the time. See `02-motion-contract.md` for the policy.

### `interpolate(input, output, ease?)`

Popmotion-style keyframe interpolation:

```js
const opacity = interpolate([0, 0.3, 0.7, 1], [0, 1, 1, 0], Easing.easeInOutCubic);
opacity(0.5); // returns 1
```

### `animate({ from, to, start, end, ease })`

Single-segment tween:

```js
const x = animate({ from: 0, to: 200, start: 1.5, end: 2.8, ease: Easing.easeOutCubic });
x(2.0); // returns a value between 0 and 200
```

### `clamp(v, min, max)`

Bog-standard clamp.

---

## Brand primitives (`lesson-ui.jsx`)

### `BRAND`

The token object:

```js
window.BRAND = {
  bgBase, bgAlt, bgCard, bgDark,
  text, textMuted, textDim,
  accent, accentSoft,
  border, borderStrong,
  font, mono, radius,
};
```

Use these inline rather than CSS variables for consistency with the rest of the JS-driven styles.

### `<Eyebrow>`

The small uppercase accent label above every scene title.

```jsx
<Eyebrow>Lesson 1.2 · Picking the Right Assistant</Eyebrow>
```

### `<SceneTitle>`

Eyebrow + 64px section title with built-in stagger.

```jsx
<SceneTitle
  eyebrow="The landscape"
  title="Sample assistants at a glance."
  x={200} y={180}
  start={s + 0.2}
/>
```

### `<FadeIn>`

Wraps children, fades + slides them in.

```jsx
<FadeIn
  start={s + 0.5}                  // global time when entry begins
  duration={0.6}
  from="down"                       // "up" | "down" | "left" | "right"
  distance={24}                     // px to slide from
  ease={Easing.easeOutCubic}
  style={{ position: 'absolute', left: 200, top: 360 }}
>
  <div>content</div>
</FadeIn>
```

### `<TypeOn>`

Character-by-character text reveal with a blinking caret.

```jsx
<TypeOn
  text="Sample typed text."
  start={4.0}                       // global time
  duration={2.5}                    // seconds to type the whole thing
  x={200} y={760}
  size={26}
  weight={500}
  color={BRAND.text}
  maxWidth={1500}
  caret={true}
/>
```

### `<Pinwheel>` and `<ThinkingPinwheel>`

The "thinking" indicator. `<Pinwheel>` is the standalone version; `<ThinkingPinwheel>` is the smaller in-chat variant.

```jsx
<Pinwheel x={100} y={100} size={56} color={BRAND.accent}/>
<ThinkingPinwheel size={26}/>
```

### `<Tether>`

The hand-drawn squiggle. Pass an SVG `d` path and a draw window.

```jsx
<Tether
  d="M 425 875 C 500 940, 700 940, 960 875 C 1100 830, 1300 950, 1495 875"
  start={s + 5.0}                   // global time when drawing begins
  drawDur={1.4}
  color={BRAND.accent}
  strokeWidth={3}
  width={1920} height={1080}
/>
```

The path is in canvas coordinates (1920×1080). One per scene only.

### `<ChatWindow>`

A static chat-window frame. For the animated version with prompt → think → respond, use `<GlidingChat>` (defined in `lesson-scenes.jsx`).

```jsx
<ChatWindow
  x={180} y={280} width={490} height={620}
  title="Claude" logoId="logo-claude"
  composerText="Ask anything…"
  showComposer={true}
>
  {/* chat messages */}
</ChatWindow>
```

### `<DesktopFrame>`

Mock macOS window chrome. Useful for "here's what a settings screen looks like" scenes.

```jsx
<DesktopFrame x={400} y={200} width={1120} height={680} title="Claude — Settings">
  {/* settings content */}
</DesktopFrame>
```

### `<CountUp>`

Animated numeric counter from `from` to `to`.

```jsx
<CountUp from={0} to={50} start={2.6} duration={1.0} suffix="" ease={Easing.easeOutCubic}/>
```

Use `from={0}` 99% of the time. The exception: animated price changes ($X → $Y).

### `<Cursor>`

A mock mouse pointer that moves between keyframes. Use for "Instructor navigating through a UI" beats.

```jsx
<Cursor start={s + 1.6} keyframes={[
  { t: 0,    x: 1620, y: 460 },
  { t: 2.0,  x: 1620, y: 560 },
  { t: 11.5, x: 1620, y: 830 }
]}/>
```

`t` is scene-relative (added to `start`). Easing between keyframes is `easeInOutCubic`.

### `<SceneFrame>` (in `lesson-scenes.jsx`)

Wraps a scene with auto fade-in/fade-out and gates visibility via `<Sprite>`. Use as the root of every scene component.

```jsx
function MyScene({ s = 0 }) {
  return (
    <SceneFrame start={s} end={s + 12} fadeIn={0.5} fadeOut={0.5} background={B.bgAlt}>
      {/* scene content here, using absolute global times like (s + 0.3) */}
    </SceneFrame>
  );
}
```

---

## Composition pattern

A typical scene:

```jsx
function SceneCapabilityTable({ scene, sceneStart }) {
  const s = sceneStart;
  return (
    <SceneFrame start={s} end={s + scene.duration}>
      <SceneTitle
        eyebrow={scene.content.eyebrow}
        title={scene.content.title}
        x={200} y={140}
        start={s + 0.2}
      />

      <FadeIn start={s + 0.8} style={{ position: 'absolute', left: 200, right: 200, top: 320 }}>
        <Table headers={scene.content.headers} rows={scene.content.rows} startTime={s + 1.4}/>
      </FadeIn>

      <FadeIn start={s + 8} style={{ position: 'absolute', left: 200, right: 200, top: 940 }}>
        <div>{scene.content.footnote}</div>
      </FadeIn>
    </SceneFrame>
  );
}
```

The renderer in `lesson-renderer.jsx` is exactly this shape — one function per scene type, all reading from `scene.content`.

---

## What NOT to expose

These exist but are internal:

- `PulseRing` (used by `voice-demo` only)
- `DrawLine` (used by `journey-map` only)
- `RecordTimer` (used by `voice-demo` only)

If you find yourself wanting to use them outside their original scene, promote them: rename, move to `lesson-ui.jsx`, document here.
