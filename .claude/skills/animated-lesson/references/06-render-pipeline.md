# 06 · Render pipeline

How to take the HTML lesson from "approved in browser" to "MP4 on disk". This is the **last** step in the workflow — never render to MP4 before the timing is approved, because re-rendering takes minutes and the whole point of code-driven motion is iteration in seconds.

---

## The three states a lesson can be in

1. **Draft** — JSON content is being edited. HTML opens and plays but content is rough.
2. **Approved HTML** — Instructor has scrubbed the timeline, all beats land cleanly. Content is frozen. This is the **canonical artifact** — the file you re-render whenever you need a fresh MP4.
3. **Rendered MP4** — A frozen snapshot of the HTML at a specific point in time. Becomes stale when content changes. Treat as disposable.

**Key insight:** the HTML is the source of truth, not the MP4. When a fact changes (e.g. ChatGPT's pricing), you edit the JSON, re-open the HTML, re-render the MP4. The MP4 is build output, not source.

---

## Render path A · Headless capture (recommended)

Use a headless Chromium instance to capture the HTML one frame at a time, then encode with ffmpeg. This is what production lesson rendering should use.

**Tools:**
- [Playwright](https://playwright.dev) for headless browser control
- `ffmpeg` for encoding

**Script** (`scripts/render-lesson.mjs`, you'll need to add to the project):

```javascript
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'fs/promises';
import { execFileSync } from 'child_process';
import path from 'path';

const LESSON_PATH = process.argv[2];       // e.g. "lessons/module-1.html"
const OUTPUT_PATH = process.argv[3];       // e.g. "renders/module-1.mp4"
const FPS = 60;
const WIDTH = 1920;
const HEIGHT = 1080;
const DURATION = 104;                       // read from lesson.duration

const TMP = path.resolve('.render-tmp');
await mkdir(TMP, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }});
await page.goto('file://' + path.resolve(LESSON_PATH));

// Disable auto-play, take manual control of the playhead.
await page.evaluate(() => {
  // Stage exposes setTime + setPlaying via context — we'll bridge them.
  window.__stageController = { setTime: null, setPlaying: null };
  // The Stage component's ctxValue already exposes these; we hook them via a custom dispatch in a small patch.
});

const totalFrames = Math.floor(DURATION * FPS);

for (let f = 0; f < totalFrames; f++) {
  const t = f / FPS;
  await page.evaluate((t) => window.__stageController.setTime(t), t);
  await page.waitForTimeout(16);             // let React flush
  await page.screenshot({
    path: path.join(TMP, `${String(f).padStart(6, '0')}.png`),
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  });
  if (f % 60 === 0) console.log(`Captured ${f}/${totalFrames}`);
}

await browser.close();

// Encode
execFileSync('ffmpeg', [
  '-y',
  '-framerate', String(FPS),
  '-i', path.join(TMP, '%06d.png'),
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-crf', '18',
  OUTPUT_PATH,
], { stdio: 'inherit' });
```

**To make this work**, expose Stage's `setTime` to the window in `templates/animations.jsx`:

```jsx
// Inside Stage component, after defining setTime:
React.useEffect(() => {
  window.__stageController = { setTime, setPlaying };
  return () => { delete window.__stageController; };
}, []);
```

**Runtime:** ~30 seconds of headless rendering per 1 second of video at 1920×1080, 60fps. A 100-second lesson takes ~50 minutes. Run overnight.

**Bitrate / codec:** `libx264` with `crf 18` is the right default for educational content. Output is ~30–50MB for a 100s lesson. For YouTube upload, that's fine; YouTube re-encodes anyway.

---

## Render path B · Migrate to Remotion

Once the lesson format is stable, the cleanest production pipeline is to port the scene components to [Remotion](https://www.remotion.dev/). Remotion is "<cite index="3-2">a framework that enables developers to create videos programmatically using React components, JSX, and CSS instead of traditional video editing software</cite>" — exactly the same paradigm as the HTML version, but built for batch rendering.

**Why migrate eventually:**
- <cite index="3-9,3-10">Server-side rendering — deploy to Lambda functions and render videos programmatically. Perfect for generating personalized content on demand.</cite>
- <cite index="3-13">Frame-perfect timeline control via frame numbers, no rAF drift.</cite>
- <cite index="10-4,10-5,10-6">Generate thousands of variants by looping over CSV/JSON; git-diff keyframes instead of binary blobs; CI/CD-friendly nightly renders.</cite>

**Why not migrate today:**
- Remotion <cite index="2-7,2-8">requires a company license in some cases</cite> — read the license terms before committing.
- The HTML version supports interactive scrubbing, in-browser preview, and instant Babel-in-browser iteration. Remotion needs a build step.
- Most components port 1:1 (you'd swap `useTime()` for Remotion's `useCurrentFrame()` and `<Sprite>` for `<Sequence>`).

**Migration map** (when you're ready):

| HTML version | Remotion equivalent |
|---|---|
| `Stage` | `Composition` (in `src/Root.tsx`) |
| `useTime()` | `useCurrentFrame() / fps` |
| `<Sprite start end>` | `<Sequence from durationInFrames>` |
| `Easing.easeOutCubic` | `Easing.bezier(0.22, 1, 0.36, 1)` |
| Inline Babel `.jsx` files | Compiled TypeScript build |
| `localStorage` playhead persist | N/A (Remotion has frame URL params) |

The actual rendering command becomes:

```bash
npx remotion render src/index.ts module-1 out/module-1.mp4 \
  --props='{"lessonId":"module-1"}'
```

Plan to migrate when: (a) you have ≥5 lessons in production, (b) you need to batch-render variants (e.g. English + a second language versions), or (c) you outgrow Babel-in-browser performance.

---

## Render path C · Quick screen capture

For one-off "I just need a video of this lesson right now" cases:

1. Open `lessons/<id>.html` in Chrome.
2. Press F11 for fullscreen, hide bookmarks bar.
3. Use macOS Quicktime Player → File → New Screen Recording → select the browser window region.
4. Refresh the page (Cmd+R) to restart playback, immediately start recording.
5. Stop recording when the lesson finishes its loop.
6. Trim the lead-in / lead-out in Quicktime.

**Use this only for review drafts.** The output isn't pixel-perfect (real screen capture has compression artifacts, varies by display scale). Don't ship to YouTube from this path.

---

## Adding voiceover

Three options, in order of preference:

### Option 1 · Voiceover after MP4 render (recommended)

1. Render the MP4 (path A).
2. Author the voiceover script. Easiest: copy `lesson.speakerNotes[]` from the JSON and paste into a TTS tool (ElevenLabs, Anthropic Voice, etc.) or record live.
3. Use ffmpeg or Premiere/Final Cut to layer voiceover onto the video. Adjust scene durations in the JSON if the voiceover doesn't fit (then re-render). Iterate.

This is the **cleanest** workflow because it separates concerns. Video timing is one artifact, audio is another, they meet in post.

### Option 2 · Embedded audio via Web Audio in HTML

You can preload an `<audio>` element in the HTML and play it on Stage start. Sync is fragile — drift accumulates over 100s — so use this only for short clips.

### Option 3 · Per-scene audio cues (future)

A future schema extension: each scene declares its own audio cue with a start offset. The renderer mounts an `<audio>` per scene, plays it when the scene starts. Useful for music stings, sound effects on transitions.

---

## When content changes

The whole reason for this code-driven approach is that fact changes don't require re-recording voiceover or re-doing motion graphics by hand. The flow:

1. **Identify the changed beat.** E.g. "ChatGPT Go is now $8/month, not $7".
2. **Locate it in the JSON** by scene ID + content path. (`scenes[id=tool-cards].content.tools[id=chatgpt].oneliner`)
3. **Edit just that string.** Don't touch any other field.
4. **Re-open the HTML.** Verify the visual change.
5. **Re-render the MP4** (path A).
6. **Re-record only the affected voiceover segment**, then splice in. (If the voiceover script has timestamps per scene, this is straightforward.)

**Result:** what was historically a multi-hour reshoot is now a 3-line JSON diff, a 50-minute headless render, and a 90-second audio splice. Multiply across dozens of lessons and the cost savings compound.

---

## Open questions / known limitations

- **Web font loading.** Syne is loaded from Google Fonts CDN. In headless Chromium, ensure the page waits for `document.fonts.ready` before the first frame is captured. The current render script doesn't do this — add `await page.evaluate(() => document.fonts.ready)` after page.goto.
- **localStorage persistence.** The Stage persists the playhead to localStorage. In the renderer, clear it before each render: `await page.evaluate(() => localStorage.clear())`.
- **Pinwheel + waveform per-frame randomness.** The pinwheel rotation phase is a function of time `t`, so it's deterministic. The waveform uses `Math.sin(t * ... + i * ...)`, also deterministic. Good — frame N renders identically every time. **Do not** introduce `Math.random()` into any scene component, or the output won't be reproducible.
