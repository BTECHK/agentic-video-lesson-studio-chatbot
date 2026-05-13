# Architecture Patterns

**Domain:** AI Content System + Programmatic Video Generation for Learning Platform
**Researched:** 2026-05-13

## Recommended Architecture

The system is a **content-driven video pipeline** with five primary subsystems connected through a JSON-based data contract layer. Content flows left-to-right from structured Markdown knowledge through a storyboard intermediate representation, into animated React compositions, out through headless rendering to MP4, and finally to Teachable for delivery. A separate branch serves the RAG chatbot from the same content repository.

```
                                 +------------------+
                                 | Content Repo     |
                                 | (Markdown + YAML)|
                                 +--------+---------+
                                          |
                            +-------------+-------------+
                            |                           |
                   +--------v---------+       +---------v---------+
                   | Storyboard       |       | RAG Chatbot       |
                   | Generator        |       | (LangChain +      |
                   | (JSON scenes)    |       |  Vector DB)       |
                   +--------+---------+       +-------------------+
                            |
                   +--------v---------+
                   | Voiceover        |
                   | Generator        |
                   | (ElevenLabs TTS) |
                   +--------+---------+
                            |
                   +--------v---------+
                   | Animation Engine |
                   | (Remotion React) |
                   +--------+---------+
                            |
                   +--------v---------+
                   | Video Renderer   |
                   | (Headless Chrome |
                   |  + FFmpeg)       |
                   +--------+---------+
                            |
                   +--------v---------+
                   | Output / Export   |
                   | (MP4 to Teachable|
                   |  1080p, 24-30fps)|
                   +-------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With | Technology |
|-----------|---------------|-------------------|------------|
| **Content Repository** | Stores and versions AI tool knowledge, lesson structures, teaching philosophy | Storyboard Generator, RAG Chatbot, Content Updater | Markdown + YAML frontmatter in Git |
| **Storyboard Generator** | Transforms lesson content into scene-by-scene JSON with timing, layout, and animation instructions | Content Repository (reads), Animation Engine (feeds) | Node.js/TypeScript CLI |
| **Voiceover Generator** | Produces narration audio with word-level timestamps for animation sync | Storyboard Generator (reads script), Animation Engine (provides timing data) | ElevenLabs TTS API + TypeScript SDK |
| **Animation Engine** | Renders React compositions frame-by-frame using brand design system | Storyboard JSON (reads), Voiceover timestamps (reads), Video Renderer (feeds) | Remotion + React + TailwindCSS |
| **Video Renderer** | Converts animated frames into compressed MP4 | Animation Engine (reads compositions), FFmpeg (post-processing) | Remotion @remotion/renderer + Chrome Headless Shell + FFmpeg |
| **RAG Chatbot** | Answers learner questions using course content | Content Repository (reads), Vector DB (searches), LLM API (generates) | LangChain + ChromaDB/FAISS + OpenAI/Claude API |
| **Content Updater** | Monitors AI tool changes and proposes content diffs | Content Repository (reads/writes), Official vendor docs (scrapes) | Scheduled Node.js jobs + LLM diffing |
| **Export/Delivery** | Validates MP4 specs and handles Teachable upload | Video Renderer (reads MP4), Teachable (uploads) | FFmpeg validation + manual upload (API later) |

### Data Flow

**Primary Pipeline: Content to Video**

```
1. Content Repository
   ├── Markdown lessons with YAML frontmatter (topic, duration, objectives)
   ├── Scene descriptions (what to show, what to say)
   └── Teaching philosophy annotations
          │
          ▼
2. Storyboard Generator
   ├── Reads lesson Markdown
   ├── Splits into scenes with estimated durations
   ├── Assigns animation types per scene (intro, demo, comparison, summary)
   ├── Generates narration script per scene
   └── Outputs: storyboard.json
          │
          ▼
3. Voiceover Generator (deferred for prototype, but metadata designed in)
   ├── Reads narration script from storyboard
   ├── Calls ElevenLabs TTS with-timestamps endpoint
   ├── Receives audio .mp3 + word-level timestamp array
   ├── Calculates exact scene durations from audio length
   └── Outputs: voiceover.mp3 + timestamps.json
          │
          ▼
4. Animation Engine (Remotion)
   ├── Reads storyboard.json as inputProps
   ├── Reads timestamps.json for audio-driven timing
   ├── Each scene = a React <Sequence> component
   ├── Brand system applied via CSS variables + TailwindCSS
   ├── Animations use Remotion spring() + interpolate() with custom easing
   └── Outputs: Remotion composition ready for rendering
          │
          ▼
5. Video Renderer
   ├── Remotion renderMedia() with Chrome Headless Shell
   ├── 1920x1080, 30fps, H.264 codec
   ├── FFmpeg post-processing: CRF 23, AAC audio, <2GB validation
   └── Outputs: lesson-module-1.mp4
          │
          ▼
6. Export to Teachable
   ├── Validate: 1080p, 24-30fps, <2GB, .mp4 format
   └── Manual upload (Teachable has no public bulk upload API)
```

**Secondary Pipeline: Content to Chatbot**

```
1. Content Repository (same Markdown files)
          │
          ▼
2. Document Processor
   ├── Chunks Markdown into ~512 token segments with 20% overlap
   ├── Preserves metadata (topic, module, lesson)
   └── Outputs: document chunks with metadata
          │
          ▼
3. Embedding Generator
   ├── Converts chunks to vector embeddings (OpenAI text-embedding-3-small)
   └── Stores in vector database (ChromaDB for simplicity in Docker)
          │
          ▼
4. RAG Query Engine
   ├── User question → embedding → semantic search → top-k chunks
   ├── Chunks + question → LLM prompt → answer
   └── Instructor's teaching philosophy injected as system prompt
```

## Key Data Contract: storyboard.json

This is the central intermediate representation that connects content to animation. Every component upstream produces it, every component downstream consumes it.

```typescript
interface Storyboard {
  meta: {
    moduleId: string;         // "module-1"
    title: string;            // "Introduction to AI Tools"
    totalDurationFrames: number;
    fps: 30;
    width: 1920;
    height: 1080;
  };
  scenes: Scene[];
}

interface Scene {
  id: string;                   // "scene-01-intro"
  type: "intro" | "concept" | "demo" | "comparison" | "summary" | "transition";
  durationFrames: number;       // calculated from content or voiceover
  narration: {
    script: string;             // what the voiceover says
    audioFile?: string;         // path to generated .mp3 (when voiceover exists)
    wordTimestamps?: WordTimestamp[]; // from ElevenLabs forced alignment
  };
  layout: {
    template: string;           // "centered-card" | "split-screen" | "full-bleed" etc.
    elements: SceneElement[];   // what to render
  };
  animations: {
    enter: AnimationSpec;       // how elements appear
    active: AnimationSpec[];    // animations during the scene
    exit: AnimationSpec;        // how elements leave
  };
}

interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
}

interface SceneElement {
  type: "text" | "card" | "icon" | "code-block" | "comparison-grid" | "tether-line";
  content: Record<string, unknown>;
  position: { x: number; y: number };
  style: Record<string, string>;     // maps to brand CSS variables
}

interface AnimationSpec {
  type: "slide-in" | "fade" | "scale" | "spring-enter" | "tether" | "cascade";
  direction?: "left" | "right" | "up" | "down";
  easing: "spring" | "ease-in-out" | "custom-bezier";
  durationFrames: number;
  stagger?: number;                   // frames between cascading elements
}
```

## Patterns to Follow

### Pattern 1: Composition-as-Template

**What:** Each scene type (intro, concept, demo, comparison, summary) is a reusable Remotion React component that accepts structured props from the storyboard JSON.

**When:** Always. Every scene in every lesson follows this pattern.

**Why:** This is how you scale from 1 module to 11 capabilities across many topics without custom animation code per lesson. The storyboard JSON varies; the compositions stay fixed.

**Example:**
```typescript
// src/compositions/scenes/ConceptScene.tsx
import { useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";

interface ConceptSceneProps {
  title: string;
  explanation: string;
  elements: SceneElement[];
  animations: AnimationSpec;
}

export const ConceptScene: React.FC<ConceptSceneProps> = ({
  title, explanation, elements, animations
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = spring({ frame, fps, config: { damping: 20 } });
  const titleY = interpolate(titleOpacity, [0, 1], [30, 0]);

  return (
    <div style={{ backgroundColor: "var(--bg-base)", fontFamily: "var(--font)" }}>
      <h1 style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)` }}>
        {title}
      </h1>
      {/* Elements rendered from props with animation specs */}
    </div>
  );
};
```

### Pattern 2: Brand System as CSS Variables

**What:** The entire brand system (colors, fonts, radii, easing) is defined once as CSS custom properties and consumed everywhere in Remotion compositions.

**When:** Every visual component.

**Why:** Remotion renders a full DOM tree via headless Chrome. CSS variables work exactly as they do in a browser. This means the brand system from the existing HTML mockup transfers 1:1 into video compositions with zero translation effort.

```css
:root {
  --bg-base: #EDE8E3;
  --bg-alt: #F7F4F0;
  --bg-card: #FDFBF9;
  --text: #1C1C1C;
  --accent: #8B2635;
  --font: 'Syne', sans-serif;
  --radius: 4px;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
}
```

### Pattern 3: Sequential Staging with Remotion Sequences

**What:** Choreograph animations using Remotion's `<Sequence>` component so elements cascade logically: container slides in, action triggers, thinking animates, results fade in.

**When:** Every scene transition and within-scene animation.

**Why:** This directly implements the "Sequential Staging" principle from the animation design contract. Remotion's `<Sequence>` maps perfectly to this -- each `<Sequence>` has a `from` frame offset and `durationInFrames`, creating the stagger effect.

```typescript
<Sequence from={0} durationInFrames={30}>
  <SlideIn direction="left"><Card /></SlideIn>
</Sequence>
<Sequence from={20} durationInFrames={45}>
  <FadeIn><ActionIndicator /></FadeIn>
</Sequence>
<Sequence from={50} durationInFrames={60}>
  <SpringIn><ResultPanel /></SpringIn>
</Sequence>
```

### Pattern 4: Tether Method via SVG Path Animation

**What:** When showing data flow between AI concepts (e.g., prompt to response, input to output), animate an SVG path connecting the elements, similar to the Anthropic Cowork video's "squiggly line."

**When:** Demo scenes, data flow explanations, cross-component relationships.

**Why:** The animation research document specifically identifies this as a signature technique. Remotion can render SVG with full CSS animation support, including `stroke-dashoffset` for path drawing effects.

### Pattern 5: Audio-Driven Scene Duration

**What:** When voiceover exists, scene duration is calculated from audio length (not estimated). Word-level timestamps from ElevenLabs drive subtitle/highlight animations.

**When:** Post-prototype, when voiceover is integrated.

**Why:** Prevents the most common failure mode in educational video: audio/visual desync. The pipeline calculates `durationInFrames = Math.ceil((audioDurationMs / 1000) * fps)` rather than guessing.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Monolithic Scene Components

**What:** Writing one massive React component per lesson that contains all scenes, all animations, and all layout logic.

**Why bad:** Unmaintainable, unreusable, impossible to regenerate individual scenes when content changes. A single typo fix requires re-rendering the entire video.

**Instead:** One component per scene type (intro, concept, demo, comparison, summary). Compose them via `<Sequence>` chains driven by the storyboard JSON. This also enables scene-level caching -- only re-render scenes whose content actually changed.

### Anti-Pattern 2: CSS Animations Instead of Remotion Primitives

**What:** Using CSS `@keyframes` or `transition` properties for animation timing.

**Why bad:** CSS animations are time-based and non-deterministic in a frame-by-frame rendering context. Remotion renders each frame independently; CSS animations may not produce consistent results because there's no real "time" passing between frames during rendering.

**Instead:** Use `spring()`, `interpolate()`, and frame-math exclusively. These are deterministic and produce identical output on every render.

### Anti-Pattern 3: Hardcoded Durations

**What:** Setting scene durations as fixed constants (e.g., "every intro is 150 frames").

**Why bad:** Content length varies. A lesson explaining ChatGPT basics needs less time than one comparing 4 AI platforms. When voiceover is added later, fixed durations guarantee desync.

**Instead:** Calculate durations from content (word count estimation for prototype) and from audio length (when voiceover exists). The storyboard generator should compute this.

### Anti-Pattern 4: Storing Content in Code

**What:** Embedding lesson text, tool descriptions, and teaching content directly in React components or JavaScript files.

**Why bad:** Defeats the entire content update pipeline. When ChatGPT releases a new feature, you'd need to find the right `.tsx` file, edit it, and hope the animation still works. Content and presentation must be decoupled.

**Instead:** All content lives in the Markdown repository. The storyboard generator reads it. The animation engine receives only structured props.

### Anti-Pattern 5: Re-rendering Entire Videos for Partial Updates

**What:** When one fact in a lesson changes (e.g., "Claude 3.5 Sonnet" becomes "Claude 4 Opus"), re-rendering the entire 10-minute video.

**Why bad:** Rendering a 10-minute 1080p video at 30fps takes significant time and compute (thousands of frames through headless Chrome). Most scenes are unchanged.

**Instead:** Design for scene-level rendering from the start. Render individual scenes as clips, then concatenate with FFmpeg. Only re-render the scene(s) whose source content changed. This requires scene-level checksums in the storyboard.

## Container Architecture

### Docker Compose Services

```yaml
services:
  # Service 1: Content & Storyboard
  content-api:
    build: ./services/content
    volumes:
      - ./content:/app/content          # Markdown repository
      - ./storyboards:/app/output       # Generated storyboard JSON
    environment:
      - NODE_ENV=production

  # Service 2: Remotion Studio (development only)
  remotion-dev:
    build: ./services/remotion
    ports:
      - "3000:3000"                     # Remotion Studio UI
    volumes:
      - ./services/remotion/src:/app/src # Hot reload
      - ./storyboards:/app/storyboards  # Read storyboard JSON
      - ./assets:/app/public/assets     # Images, audio files
    environment:
      - NODE_ENV=development
    command: npm run dev

  # Service 3: Video Renderer (production rendering)
  remotion-render:
    build:
      context: ./services/remotion
      dockerfile: Dockerfile.render
    volumes:
      - ./storyboards:/app/storyboards  # Read storyboard JSON
      - ./assets:/app/public/assets     # Images, audio
      - ./output:/app/output            # Write rendered MP4
    environment:
      - NODE_ENV=production
      - REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium
    # Chrome Headless Shell dependencies:
    # libnss3, libdbus-1-3, libatk1.0-0, libgbm-dev, libasound2
    # Base image: node:22-bookworm-slim

  # Service 4: Voiceover Generator (when needed)
  voiceover:
    build: ./services/voiceover
    volumes:
      - ./storyboards:/app/storyboards  # Read narration scripts
      - ./assets/audio:/app/output      # Write audio files
    environment:
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}

  # Service 5: RAG Chatbot (deferred scope)
  chatbot:
    build: ./services/chatbot
    ports:
      - "8080:8080"
    volumes:
      - ./content:/app/content          # Read course content
      - ./vectordb:/app/vectordb        # Persistent vector store
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}

  # Service 6: Vector Database (for chatbot)
  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - ./vectordb:/chroma/chroma
```

### Container Dependency Graph

```
content-api ──────► storyboard JSON files (shared volume)
                         │
                    ┌────┴────┐
                    │         │
              voiceover    remotion-dev (for authoring)
                    │         │
                    └────┬────┘
                         │
                   remotion-render (for production MP4)
                         │
                    output/*.mp4

content-api ──────► chatbot ◄──── chromadb
```

### What Runs Where

| Container | Base Image | Key Dependencies | Purpose |
|-----------|-----------|-----------------|---------|
| `content-api` | node:22-slim | typescript, gray-matter (YAML parser), chokidar (file watching) | Parse Markdown, generate storyboards |
| `remotion-dev` | node:22-slim | remotion, react, @remotion/tailwind-v4, @remotion/google-fonts | Author/preview animations in browser |
| `remotion-render` | node:22-bookworm-slim | remotion, @remotion/renderer, Chrome Headless Shell, ffmpeg | Render MP4 headlessly |
| `voiceover` | node:22-slim | elevenlabs SDK, ffmpeg | Generate narration audio + timestamps |
| `chatbot` | python:3.12-slim | langchain, chromadb-client, openai, fastapi | Serve RAG chatbot API |
| `chromadb` | chromadb/chroma | built-in | Vector similarity search |

### Communication Pattern

Services communicate through **shared filesystem volumes** (not HTTP APIs) for the video pipeline. This is deliberate:

1. **Simplicity** -- No API gateway, no service mesh, no network debugging. Storyboard JSON and audio files are just files on disk.
2. **Debuggability** -- You can inspect every intermediate artifact: the Markdown, the storyboard JSON, the audio files, the rendered MP4. Each is a plain file.
3. **Idempotency** -- Re-running any stage reads the same files and produces the same output. No state management needed.
4. **CLI-first** -- Each service can be run as a CLI command (`node generate-storyboard.js module-1`) or as a Docker service. Same code, two modes.

The chatbot is the exception -- it requires a persistent HTTP API for learner queries and uses ChromaDB over HTTP.

## Suggested Build Order

Dependencies between components dictate a strict build sequence:

### Phase 1: Animation Engine + Brand System (Stakeholder Demo Critical Path)

Build Remotion compositions with the brand system. Manually author the Module 1 storyboard (hardcoded JSON, not generated). Render to MP4. This produces the stakeholder demo video.

**Rationale:** This is the immediate deliverable. Everything else is infrastructure that pays off at scale but is not needed for a single prototype video. The storyboard JSON can be hand-written for one module.

**Depends on:** Nothing. Greenfield.
**Produces:** Working Remotion project, brand system in CSS, scene type components, Module 1 MP4.

### Phase 2: Content Repository + Storyboard Generator

Formalize the Markdown content structure. Build the storyboard generator that reads Markdown and outputs the same JSON format that Phase 1 consumes. Migrate the hand-written Module 1 storyboard to generated output.

**Rationale:** Now that the animation engine works, automate the input side. This is what makes the system scalable beyond one module.

**Depends on:** Phase 1 (defines the storyboard JSON contract that the generator must produce).
**Produces:** Structured content repo, automated storyboard generation, content-to-video automation.

### Phase 3: Voiceover Integration

Add ElevenLabs TTS generation with word-level timestamps. Update scene durations to be audio-driven rather than estimated. Add subtitle/highlight animations synced to word timestamps.

**Rationale:** The visual pipeline must work before adding audio. Audio timing changes scene durations, which means the animation engine must already handle variable durations gracefully.

**Depends on:** Phase 1 (animation engine handles variable durations), Phase 2 (storyboard includes narration scripts).
**Produces:** Narrated videos with synced animations.

### Phase 4: Content Update Pipeline

Add content monitoring (official vendor doc scraping), change detection, and selective scene re-rendering. This is the content-freshness goal.

**Rationale:** Only worth building after the forward pipeline (content to video) is proven. The update pipeline is the same pipeline run in reverse-diff mode.

**Depends on:** Phase 2 (content repo structure), Phase 1 (scene-level rendering).
**Produces:** Semi-automated content freshness.

### Phase 5: RAG Chatbot

Build the learner support chatbot from the content repository. Separate concern from video pipeline.

**Rationale:** Entirely independent of the video pipeline. Shares only the content repository. Can be built in parallel with Phases 3-4 if resources allow, but not needed for stakeholder demo.

**Depends on:** Phase 2 (structured content repository to embed).
**Produces:** TA chatbot for learner support.

## Scalability Considerations

| Concern | 1 Module (Now) | Full Topic Set / 11 Capabilities | Full Course + Updates |
|---------|----------------|---------------------------|----------------------|
| Rendering time | ~2-5 min per video | Scene-level rendering + FFmpeg concat, parallelize across scenes | Cache unchanged scenes, only re-render diffs |
| Content management | Hand-written JSON | Markdown repo with YAML frontmatter, git-versioned | Automated vendor doc monitoring, LLM-assisted diffing |
| Storage | ~500MB per video raw, ~100MB compressed | ~6GB total compressed | S3/cloud storage with lifecycle policies |
| Voiceover cost | N/A (visual only prototype) | ~$5-15 per full module via ElevenLabs | Selective regeneration per changed scene |
| Chatbot load | N/A | Single ChromaDB instance, sufficient for <1000 concurrent | Scale ChromaDB or migrate to pgvector |

## Sources

- [Remotion Official Documentation -- SSR](https://www.remotion.dev/docs/ssr) (HIGH confidence)
- [Remotion Fundamentals](https://www.remotion.dev/docs/the-fundamentals) (HIGH confidence)
- [Remotion vs Motion Canvas Comparison](https://www.remotion.dev/docs/compare/motion-canvas) (HIGH confidence)
- [Remotion Docker Template -- Scott Havird](https://scotthavird.com/blog/remotion-docker-template/) (MEDIUM confidence)
- [Remotion AI Coding Agents](https://www.remotion.dev/docs/ai/coding-agents) (HIGH confidence)
- [Remotion Google Fonts](https://www.remotion.dev/docs/google-fonts/) (HIGH confidence)
- [Remotion TailwindCSS](https://www.remotion.dev/docs/tailwind) (HIGH confidence)
- [Remotion Audio](https://www.remotion.dev/docs/using-audio) (HIGH confidence)
- [Remotion Prompt-to-Video Template](https://github.com/remotion-dev/template-prompt-to-video) (HIGH confidence)
- [ElevenLabs Forced Alignment](https://elevenlabs.io/docs/overview/capabilities/forced-alignment) (HIGH confidence)
- [ElevenLabs TTS with Timestamps](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps) (HIGH confidence)
- [Video Automation Pipeline with Remotion and AI APIs](https://dev.to/comlaterra_38/building-a-video-automation-pipeline-with-remotion-and-ai-apis-4i82) (MEDIUM confidence)
- [Programmatic Video Pipeline with Remotion](https://dev.to/ryancwynar/i-built-a-programmatic-video-pipeline-with-remotion-and-you-should-too-jaa) (MEDIUM confidence)
- [Teachable Content File Types](https://support.teachable.com/hc/en-us/articles/8212488517901-Content-File-Types) (HIGH confidence)
- [Remotion Licensing](https://www.remotion.dev/docs/license) (HIGH confidence -- free for individuals)
- [RAG Chatbots for Education Survey](https://www.mdpi.com/2076-3417/15/8/4234) (MEDIUM confidence)
