# Technology Stack

**Project:** Sample Academy -- AI Content System + Programmatic Video Generation
**Researched:** 2026-05-13

---

## Recommended Stack

### Core Animation Framework: Remotion

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Remotion | 4.0.x (latest: ~4.0.460) | Programmatic video composition and MP4 rendering | React-based, full DOM rendering (CSS/SVG/Canvas/WebGL), spring physics, built-in `<Sequence>` and `<TransitionSeries>` for choreographed staging, native Google Fonts support including Syne, official Docker documentation, 60K weekly downloads, active maintenance |
| `@remotion/cli` | 4.0.x | CLI rendering to MP4 | `npx remotion render` produces MP4 directly; no external FFmpeg wiring needed |
| `@remotion/google-fonts` | 4.0.x | Type-safe Google Font loading | `loadFont()` from `@remotion/google-fonts/Syne` -- blocks rendering until font is loaded, critical for headless Docker rendering where system fonts are unavailable |
| `@remotion/transitions` | 4.0.x | Scene-to-scene transitions | `<TransitionSeries>` with crossfade, slide, and custom presentations -- avoids choppy cuts |
| `@remotion/lottie` | 4.0.x | Lottie animation embedding | Import After Effects animations as JSON; SVG renderer default. Use sparingly -- expressions have limited support |

**Confidence: HIGH** -- Verified via Context7 (benchmark score 90.59), official docs, npm registry, and multiple independent comparison articles.

#### Why Remotion Over Alternatives

| Criterion | Remotion | Motion Canvas | Revideo |
|-----------|----------|---------------|---------|
| Rendering approach | Full DOM via headless Chromium -- CSS, SVG, web fonts, any React component | Single `<canvas>` element -- canvas API only, no CSS/DOM | Canvas-based (Motion Canvas fork) |
| Animation model | Declarative/keyframe: `useCurrentFrame()` + `interpolate()` + `spring()` | Imperative/generator: `yield*` coroutines | Imperative (inherited from MC) |
| Docker support | Official Dockerfile in docs, `node:22-bookworm-slim` base, `npx remotion browser ensure` | No official Docker support; community workaround via Puppeteer + alpine-chrome | Node.js rendering API, but less documented |
| Google Fonts | `@remotion/google-fonts` package with 1400+ fonts, type-safe, render-blocking | Manual font loading | Manual font loading |
| Audio/voiceover sync | `<Audio>` component, `<Sequence>` timing, `getAudioData()` for metadata | Built-in audio sync via editor GUI | Improved audio export over Motion Canvas |
| Community size | ~60K weekly downloads | ~8K weekly downloads (stagnant since Dec 2024) | ~3K weekly downloads |
| Licensing | Free for individuals and orgs <= 3 employees; company license required above that | MIT (fully open source) | MIT (fully open source) |
| Brand system compatibility | Full CSS support -- can use exact `--bg-base`, `--accent`, `--radius: 4px`, `--ease` variables directly | Must recreate brand tokens in canvas API | Must recreate in canvas API |

**Decision: Remotion.** The brand system (Syne font, CSS variables, `border-radius: 4px`, `cubic-bezier(0.22, 1, 0.36, 1)`) is defined in CSS. Remotion renders actual CSS in a real DOM. Motion Canvas and Revideo use a canvas API where you must manually translate every CSS concept into imperative draw calls. For this project, Remotion's DOM rendering is not a luxury -- it is the path of least resistance to pixel-accurate brand compliance.

Motion Canvas would be the better choice if the project were primarily about hand-crafted mathematical visualizations with precise timeline choreography. But for structured educational content with an established CSS-based brand system, Remotion wins decisively.

**Licensing note:** Sample Academy likely qualifies for free use if the company has 3 or fewer employees. If it exceeds that threshold, a company license is required (visit remotion.pro for current pricing). The licensing applies to the organization using Remotion, not the end viewers.

---

### Animation & Physics

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `remotion` (built-in) | 4.0.x | `spring()` physics, `interpolate()`, `Easing` module | Spring-based animations with configurable mass/stiffness/damping for natural overshoot and settle. Matches "fluid physics and easing" from animation contract. Custom `cubic-bezier` easing maps directly to the brand's `--ease` variable. |
| `flubber` | 0.4.x | SVG path morphing | Generates smooth intermediate shapes for morphing between SVG paths. Enables the "tether method" (squiggly line) from the animation research. Remotion renders SVG natively. |

**Confidence: HIGH** -- `spring()` and `interpolate()` verified via Remotion official docs. `flubber` is a well-known SVG morphing library.

#### Mapping Animation Contract to Remotion Primitives

| Animation Contract Principle | Remotion Implementation |
|------------------------------|------------------------|
| Fluid physics and easing | `spring({ mass: 1, damping: 15, stiffness: 100 })` + custom `Easing.bezier(0.22, 1, 0.36, 1)` |
| Object permanence (tether method) | SVG `<path>` elements animated with `flubber` morphing between states |
| Micro-interactions over spinners | Animated SVG dots/lines using `interpolate()` on `stroke-dashoffset` |
| Sequential staging | `<Sequence from={N}>` nesting: container slides in -> action triggers -> thinking animates -> results fade in |
| Purpose-driven motion | Every `spring()` call tied to a semantic event in the storyboard JSON |

---

### AI Voiceover / TTS (Planned, Not Immediate)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ElevenLabs (Eleven v3 model) | API v1 | AI voiceover generation | Highest voice quality (MOS 4.3 vs OpenAI's 3.9), emotional range critical for educational content, voice cloning from Instructor's audio samples for brand consistency, 32+ languages for future language support |
| `elevenlabs` (npm) | latest | TypeScript SDK | Official `@elevenlabs/elevenlabs-js` SDK for Node.js integration |

**Confidence: MEDIUM** -- ElevenLabs quality leadership verified across multiple independent comparisons. Pricing may be a factor at scale.

#### TTS Alternative Considered

| Provider | MOS Score | Cost per 1M chars | Why Not Primary |
|----------|-----------|--------------------|-----------------|
| ElevenLabs (v3) | 4.3 | ~$180/M (varies by plan) | **Recommended** -- best quality, voice cloning |
| OpenAI TTS (gpt-4o-mini-tts) | 3.9 | ~$15/M | Better cost-to-quality ratio, but lacks voice cloning and emotional range. Good fallback for cost-sensitive phases. |
| Google Cloud TTS (WaveNet) | ~3.6 | ~$16/M | Lower quality, no voice cloning. Avoid. |

**Strategy:** Use ElevenLabs for production voiceover (Instructor's cloned voice). Use OpenAI TTS for draft/preview renders during development (10× cheaper, fast iteration). The system should support swappable TTS providers via a simple interface.

#### Voiceover Integration with Remotion

The pipeline: structured content JSON -> TTS API -> audio file + word-level timestamps -> Remotion `<Audio>` component with `<Sequence>` timing -> MP4 with synced voiceover.

ElevenLabs returns audio files. Word-level timestamps require a separate transcription step (see Transcription section below) to align animations with speech.

---

### Transcription (For Voiceover Alignment)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| WhisperX | latest | Word-level timestamp extraction from generated voiceover audio | Whisper alone provides utterance-level timestamps only. WhisperX adds wav2vec2 alignment for accurate word-level timestamps. Critical for syncing animation beats to speech. Free, runs locally in Docker. |
| `faster-whisper` | latest | CTranslate2-optimized Whisper inference | 4x faster than vanilla Whisper with same accuracy. Runs on CPU (no GPU required for transcription of short educational segments). |

**Confidence: MEDIUM** -- WhisperX word-level timestamps verified via GitHub (17K+ stars). Integration pattern for Remotion voiceover sync is novel -- needs prototype validation.

**Alternative:** AssemblyAI API ($0.12/min) provides word-level timestamps out of the box without local GPU. Better for teams that want to avoid running Whisper infrastructure. Use if Docker GPU setup proves too complex.

---

### Content Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript + JSON files | -- | Structured lesson content repository | Content is data, not database rows. JSON files in Git provide version control, diffability, and AI-agent editability. No CMS overhead for a system where AI agents update content. |
| Zod | 3.x | Schema validation for content JSON | Type-safe validation of lesson structure, scene definitions, timing metadata. Catches structural errors before render. |
| MDX (optional, later) | 3.x | Rich text within structured content | If lessons need inline formatting beyond what JSON handles cleanly. Defer unless needed. |

**Confidence: HIGH** -- JSON-in-Git is the established pattern for content-as-code systems. Zod is the standard TypeScript validation library.

#### Content Schema Design

```
content/
  modules/
    module-1/
      meta.json          # Module metadata (title, description, duration target)
      scenes/
        01-intro.json    # Scene definition: elements, timing, animations, narration text
        02-concept.json
        ...
      assets/
        *.svg             # Scene-specific vector assets
  shared/
    brand.json           # Brand tokens (colors, fonts, spacing) -- single source of truth
    animations.json      # Reusable animation presets (spring configs, easing curves)
```

Each scene JSON includes:
- `narration`: Text for TTS generation
- `elements[]`: Visual elements with animation directives
- `timing`: Duration, transition in/out
- `metadata`: Keywords, AI tool references (for content freshness checks)

---

### Docker / Containerization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Docker | 24+ | Container runtime | Day-1 portability requirement |
| `node:22-bookworm-slim` | -- | Base image for Remotion rendering | Official Remotion recommendation. NOT Alpine -- Alpine causes slower Rust component init and package issues with Remotion. Debian Bookworm has all needed Chrome dependencies. |
| Docker Compose | 2.x | Multi-service orchestration | Separate services for: content validation, rendering, TTS generation (later) |
| Chrome Headless Shell | (bundled via `npx remotion browser ensure`) | Headless rendering engine | Remotion auto-installs Chrome Headless Shell into node_modules. Faster and lighter than full Chrome for CPU-bound rendering. |

**Confidence: HIGH** -- Official Remotion Docker docs verified. Dockerfile template is well-documented.

#### Dockerfile Template (Remotion Rendering)

```dockerfile
FROM node:22-bookworm-slim

# Chrome dependencies (required for headless rendering)
RUN apt-get update && apt install -y \
  libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 \
  libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 \
  libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN npx remotion browser ensure

COPY . .
CMD ["node", "render.mjs"]
```

#### Critical Docker Considerations

| Concern | Approach |
|---------|----------|
| **GPU**: Remotion renders via CPU in headless mode by default. GPU is disabled in headless Chromium. | CPU rendering is fine for educational videos. Budget 8-15 seconds per 150 frames at 1080p. A 5-minute video at 30fps = 9000 frames ~ 8-15 minutes render time on a modern multi-core machine. |
| **Multi-process Chrome** | Set `chromiumOptions: { enableMultiProcessOnLinux: true }` in render config (available since v4.0.42). Leverages all CPU cores. |
| **Memory** | Budget 2-4GB RAM per concurrent render. Headless Chrome is memory-intensive. Set `--cpus` and memory limits in `docker run`. |
| **Font loading** | Syne font loaded via `@remotion/google-fonts/Syne` -- render-blocking ensures font is available before frame capture. Self-host font files inside container for offline/air-gapped builds (download woff2 from Google Fonts, use `@remotion/fonts` for local loading). |
| **Alpine Linux** | DO NOT USE. Remotion official docs explicitly warn against Alpine due to slower Rust component initialization and package version issues. Use Debian Bookworm. |
| **WebGL/Three.js** | Not needed for this project's 2D warm-minimalist style. Avoid -- causes "Error creating WebGL context" issues in Docker headless. Stick to SVG + CSS animations. |
| **Output volume** | Mount a Docker volume for `/app/output` to persist rendered MP4 files outside the container. |
| **Parallel rendering** | For longer videos, split into scene-level compositions and render in parallel across containers, then concatenate with FFmpeg. |

---

### Video Processing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| FFmpeg | 6.x+ | Video concatenation, format conversion, audio muxing | Standard tool. Remotion handles MP4 rendering internally (uses its own FFmpeg), but you need standalone FFmpeg for: concatenating scene-level renders, muxing voiceover audio into final video, format conversion if needed. |

**Confidence: HIGH** -- FFmpeg is the universal standard.

Add to Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y ffmpeg
```

---

### Development Tooling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript | 5.x | Type safety across content schemas, Remotion compositions, and tooling | Non-negotiable for a system where AI agents edit content -- types catch structural errors |
| Node.js | 22 LTS | Runtime | Matches Remotion's recommended Docker base image |
| Vite | 6.x | Dev server for Remotion Studio | Remotion uses Vite internally. Fast HMR for animation development. |
| ESLint | 9.x | Linting | Standard |
| Prettier | 3.x | Formatting | Standard |

**Confidence: HIGH** -- Standard tooling, verified.

---

### Brand System Implementation

The brand system is already fully defined in CSS variables. Remotion's DOM rendering means these can be used directly:

```typescript
// src/brand.ts -- single source of truth, derived from brand-system.md
export const brand = {
  colors: {
    bgBase: '#EDE8E3',
    bgAlt: '#F7F4F0',
    bgCard: '#FDFBF9',
    bgDark: '#E3DED9',
    text: '#1C1C1C',
    textMuted: '#1C1C1C99',
    accent: '#8B2635',
    accentHover: '#6B1D28',
    accentSoft: '#8B26351A',
    border: 'rgba(28, 28, 28, 0.08)',
  },
  font: {
    family: 'Syne',
    weights: [400, 500, 600, 700, 800] as const,
  },
  radius: 4,
  ease: [0.22, 1, 0.36, 1] as const, // cubic-bezier for CSS, also usable in Remotion Easing.bezier()
  shadow: {
    hover: '0 12px 28px rgba(28, 28, 28, 0.08)',
    lift: '0 8px 24px rgba(28, 28, 28, 0.08)',
  },
} as const;
```

Font loading in Remotion:
```typescript
import { loadFont } from '@remotion/google-fonts/Syne';

// Call at module top level, NOT inside component render
const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
});
```

**Confidence: HIGH** -- `@remotion/google-fonts/Syne` confirmed available. CSS variable mapping is straightforward.

---

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| **Motion Canvas** | Canvas-only rendering cannot use CSS -- brand system would need full reimplementation. No official Docker support. Last npm publish Dec 2024 (stagnant). Imperative generator API is more complex for content-driven videos. |
| **Revideo** | MIT-licensed fork of Motion Canvas with rendering API improvements, but inherits canvas-only limitation. Only 3K weekly downloads. Too young and small for production reliance. |
| **GSAP + Puppeteer** | Manual pipeline: animate in browser with GSAP, capture frames with Puppeteer, stitch with FFmpeg. Remotion does all of this in one framework with better DX. GSAP's commercial license (Club GreenSock) adds cost and complexity. |
| **Manim (3Blue1Brown)** | Python-based, designed for mathematical animations. Wrong language ecosystem (project is TypeScript/React). No CSS/DOM rendering. Would require a polyglot Docker setup. |
| **Lottie-only approach** | Lottie is a playback format, not a composition framework. You'd still need a tool to design and export the Lottie JSONs (After Effects + Bodymovin). Not code-driven enough for a content-to-video pipeline. Use Lottie *within* Remotion for specific micro-animations, not as the primary framework. |
| **JSON2Video / Creatomate / Shotstack** | Cloud APIs for video generation from JSON templates. Vendor lock-in, per-render pricing, limited animation customization. The "warm minimalist" animation style requires frame-level control these APIs don't provide. |
| **Alpine Linux (Docker)** | Remotion official docs explicitly warn against it. Slower Rust component initialization, package management issues. Use Debian Bookworm. |
| **Google Cloud TTS / AWS Polly** | Lower voice quality (MOS 3.3-3.6) than ElevenLabs (4.3) or even OpenAI (3.9). No voice cloning. Not worth it for educational content where voice quality matters. |

---

## Full Installation

```bash
# Initialize project
npm create video@latest edu-video -- --template hello-world

# Core Remotion packages (installed by template)
# remotion, @remotion/cli, @remotion/renderer already included

# Additional Remotion packages
npm install @remotion/google-fonts @remotion/transitions @remotion/lottie

# Content validation
npm install zod

# SVG morphing for tether animations
npm install flubber
npm install -D @types/flubber

# Dev dependencies
npm install -D typescript @types/node eslint prettier

# TTS SDK (when voiceover phase begins)
npm install @elevenlabs/elevenlabs-js

# Transcription (when voiceover alignment phase begins)
# Run in separate Python container or use API
# pip install faster-whisper whisperx
```

---

## Architecture Summary

```
[Content JSON] --> [Remotion Compositions] --> [Headless Chrome in Docker] --> [MP4]
                         |
                   [Brand System]
                   [Spring Physics]
                   [SVG Animations]
                   [Sequence Timing]

Future:
[Content JSON] --> [ElevenLabs TTS] --> [Audio + Timestamps]
                                              |
                                    [Remotion + Audio] --> [MP4 with Voiceover]
```

---

## Sources

### Animation Frameworks
- [Remotion Official Docs](https://www.remotion.dev/docs/)
- [Remotion Docker Guide](https://www.remotion.dev/docs/docker)
- [Remotion vs Motion Canvas](https://www.remotion.dev/docs/compare/motion-canvas)
- [Remotion Spring Physics](https://www.remotion.dev/docs/spring)
- [Remotion Google Fonts](https://www.remotion.dev/docs/google-fonts/)
- [Remotion Transitions](https://www.remotion.dev/docs/transitions/transitionseries)
- [Remotion Licensing](https://www.remotion.dev/docs/license)
- [Scott Havird: Remotion Docker Template](https://scotthavird.com/blog/remotion-docker-template/)
- [Motion Canvas Official](https://motioncanvas.io/)
- [Motion Canvas Docker Guide](https://henrichsen.dev/guide/motion-canvas-render-docker)
- [Remotion vs Motion Canvas vs Revideo Comparison](https://www.pkgpulse.com/blog/remotion-vs-motion-canvas-vs-revideo-programmatic-video-2026)
- [GitHub: remotion-dev/remotion](https://github.com/remotion-dev/remotion)

### TTS / Voiceover
- [ElevenLabs Documentation](https://elevenlabs.io/docs/overview/intro)
- [ElevenLabs v3 Model](https://elevenlabs.io/v3)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- [TTS API Comparison: OpenAI vs ElevenLabs](https://tokenmix.ai/blog/tts-api-comparison)
- [TTS Quality Comparison (MOS scores)](https://www.linkedin.com/pulse/real-talk-state-ai-voice-2025-which-tts-services-actually-hoffman-kwkvc)

### Transcription
- [WhisperX GitHub](https://github.com/m-bain/whisperx)
- [faster-whisper GitHub](https://github.com/SYSTRAN/faster-whisper)
- [Whisper vs AssemblyAI Comparison](https://www.assemblyai.com/compare/whisper-vs-assemblyai)

### Docker / Infrastructure
- [Remotion Chrome Headless Shell](https://www.remotion.dev/docs/miscellaneous/chrome-headless-shell)
- [Remotion GPU Rendering](https://www.remotion.dev/docs/gpu)
- [alpine-chrome Docker](https://github.com/jlandure/alpine-chrome)
- [jrottenberg/ffmpeg Docker](https://github.com/jrottenberg/ffmpeg)

### Context7 Verification
- Remotion: Library ID `/remotion-dev/remotion`, Benchmark Score 90.59, Source Reputation High
- Motion Canvas: Library ID `/motion-canvas/motion-canvas`, Benchmark Score 67.24, Source Reputation High
