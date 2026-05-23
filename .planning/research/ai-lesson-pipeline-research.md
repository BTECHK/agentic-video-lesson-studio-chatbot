# AI Lesson Pipeline — Research Brief

**Researched:** 2026-05-23
**Domain:** Fully-codified AI-generated educational video pipeline (outline → script → animation → TTS → MP4)
**Confidence:** HIGH on TTS/alignment licensing (verified primary sources); MEDIUM-HIGH on Remotion sync APIs (training knowledge + cited docs; remotion.dev was not directly fetchable this session)

---

## Summary

The target system already has the hard part built: a Zod-validated `Lesson` JSON with 14 scene types, each carrying frame-based `start`/`duration`, rendered to MP4 in Docker via Remotion v4.0.460. **The pipeline extension is fundamentally a code-generation + audio-timing problem, not a rendering problem.** The single source of truth stays JSON; we add new artifact layers (OUTLINE, SCRIPT, SCENE-PLAN, AUDIO, CAPTIONS) upstream of the existing Lesson JSON, then *derive* scene `duration` from real audio length rather than authoring it by hand.

The "no paid subscriptions" rule is fully satisfiable in 2026 with stakeholder-demo quality. **Recommended TTS: Chatterbox (Resemble AI, MIT license, zero-shot voice cloning)** to clone Instructor's voice from the instructor transcript corpus, with **Kokoro-82M (Apache-2.0)** as a no-cloning fallback. Word-level timing for caption + scene sync comes from **stable-ts `align()`** (MIT) — which aligns the *known* TTS input text to the generated audio, far more accurate than re-transcribing.

The "surgically regenerate any layer" requirement is a content-hashed DAG build problem. Each artifact is a file whose cache key is the hash of its inputs; changing the outline regenerates script→audio→captions→video, but editing one tool's capability JSON regenerates only the scenes that reference it.

**Primary recommendation:** Build a content-hashed artifact pipeline (outline.json → script.json → lesson.json → audio/*.wav → captions.json → out.mp4). Generate script with Claude using extracted style-guide + few-shot from transcripts, grounded by RAG against the existing `capabilities.ts`/`tool.ts` JSON. Clone Instructor's voice with Chatterbox, align with stable-ts, drive Remotion scene durations from audio length via `calculateMetadata`, and render captions from the alignment JSON using `@remotion/captions`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Outline generation | LLM (Claude) orchestration script (Node/tsx) | — | Pure text gen, no runtime |
| Script in instructor voice | LLM (Claude) + RAG over capability JSON | — | Grounding needs the codified tool data |
| Scene-plan (script→scene mapping) | Node/tsx generator | LLM-assisted | Deterministic mapping w/ schema validation |
| Voice synthesis (TTS) | Python service (Chatterbox/Kokoro) in Docker | — | Models are PyTorch; not Node-native |
| Forced alignment / timestamps | Python (stable-ts/whisperX) in Docker | — | Whisper-based, PyTorch |
| Duration derivation | Node generator (reads audio length) | Remotion `calculateMetadata` | JSON stays source of truth |
| Captions render | Remotion frontend (`@remotion/captions`) | — | Visual layer |
| Final MP4 render | Remotion renderer (existing Docker) | — | Already built |
| Incremental regeneration / caching | Node orchestrator (content-hash DAG) | — | Cross-cutting build concern |

---

## 1. TTS / AI Voiceover Options (2026)

**Hard constraint:** no paid subscriptions; free/local-first; commercial license required (production-grade product); voice cloning of Instructor desired; word-level timing needed for sync.

> Key clarification used throughout: **the model-weights license is what matters for a commercial product, not the code license.** Several "open" TTS models ship MIT code but non-commercial weights.

### Local / Free Models

| Model | Weights License | Commercial OK? | Voice Cloning | Quality | Docker/Node ease | Word timestamps |
|-------|-----------------|----------------|---------------|---------|------------------|-----------------|
| **Chatterbox / Chatterbox-Turbo** (Resemble AI) | **MIT** [VERIFIED: github.com/resemble-ai/chatterbox/blob/master/LICENSE] | **Yes** | **Yes, zero-shot** from a short reference clip | SoTA open; benchmarked competitively vs ElevenLabs by the authors | Python (`pip install chatterbox-tts`), PyTorch; run as a sidecar service [VERIFIED: repo README] | No native timestamps — pair with stable-ts |
| **Kokoro-82M** (hexgrad) | **Apache-2.0** [VERIFIED: huggingface.co/hexgrad/Kokoro-82M] | **Yes** | **No** (training explicitly excludes voice clones) | Very high for size; 24kHz; "deployed in commercial APIs" | 82M params, fast on CPU; Python `kokoro` pkg; ONNX builds exist for Node | No native timestamps — pair with stable-ts |
| **MeloTTS** (MyShell/MIT) | **MIT** [VERIFIED: github.com/myshell-ai/MeloTTS] | **Yes** | No | Good; multi-accent English (US/UK/Indian/Australian) | "CPU real-time"; Python | No native timestamps |
| **Piper** (OHF-Voice/piper1-gpl) | **GPL-3.0** [VERIFIED: github.com/OHF-Voice/piper1-gpl] | Yes, but **GPL copyleft** — viral if linked into distributed code; safest run as a separate CLI/process | Voice *training* yes, not zero-shot cloning | Good, robotic-leaning; very fast CPU; embeds espeak-ng | Bundled Dockerfile; used by Home Assistant | Phoneme-level internally; not exposed cleanly |
| **F5-TTS** (SWivid) | Code MIT, **weights CC-BY-NC-4.0** [VERIFIED: huggingface.co/SWivid/F5-TTS + repo] | **No** (weights non-commercial unless self-trained) | Yes (zero-shot) | High | Python, flow-matching | No native |
| **Coqui XTTS-v2** | **CPML (non-commercial)** [VERIFIED: huggingface.co/coqui/XTTS-v2] | **No** for commercial | Yes, 6s clip, 17 langs, cross-lingual | High | Coqui company defunct; use maintained fork `idiap/coqui-ai-TTS` [ASSUMED: fork is the live maintainer] | No native |

### Free-Tier / Cheap API Fallback (only if local quality insufficient)

| Service | Free quota | Commercial license | Notes |
|---------|-----------|--------------------|-------|
| ElevenLabs | ~10k chars/mo free; cloning on paid tiers | Paid tiers grant commercial rights | Best quality but conflicts with no-paid-subscriptions rule |
| OpenAI TTS (`gpt-4o-mini-tts`) | Pay-per-use, no free tier | Commercial OK | API-key only; cheap; no cloning |
| Google Cloud TTS | Free tier (Standard/WaveNet monthly chars) | Commercial OK | API key + GCP project |
| Azure Speech | Free tier (0.5M chars/mo neural) | Commercial OK | API key |

[ASSUMED] specific free-quota numbers move frequently — confirm at integration time. All API options violate the "prefer free/local" rule and should be a fallback only.

### Recommendation

1. **Primary: Chatterbox (MIT, zero-shot cloning).** Clone Instructor's voice from a clean 10–30s reference clip extracted from the workshop audio. MIT weights make it safe for a commercial stakeholder product. Paralinguistic tags (`[laugh]`, `[chuckle]`) on Turbo add natural delivery for teaching. Run as a Python TTS sidecar in Docker, called per-scene.
2. **Fallback (no cloning): Kokoro-82M (Apache-2.0)** — a polished British/American voice if cloning quality is inconsistent on the demo timeline. Fastest, smallest, fully permissive.
3. **Word timing: do NOT rely on the TTS for timestamps.** Generate audio, then run **stable-ts `align()`** over (TTS-input-text, audio) to get accurate word-level timing. See §5.

> **Disqualified for commercial product:** XTTS-v2 (CPML), F5-TTS *weights* (CC-BY-NC). Piper usable but GPL-3.0 — keep it as an out-of-process CLI to avoid copyleft contamination of the TS codebase.

---

## 2. Script Generation in Instructor's Voice

**Goal:** Claude generates teaching scripts matching a real instructor's style learned from a transcript corpus, factually grounded in the codified tool/capability JSON, structured to map onto timed scenes.

### Approach ranking (best → worst for this project)

1. **Style-guide extraction + few-shot (RECOMMENDED).** One-time: have Claude analyze a representative transcript sample and emit a reusable **STYLE.md** (sentence cadence, vocabulary, signature phrases, how they open/close, analogies they favor, reading-grade level, energy). Then at generation time, inject STYLE.md + 3–5 verbatim few-shot excerpts of Instructor teaching a *similar* concept. This is cheap, fully local to the prompt, and regenerates instantly when content changes. [CITED: standard LLM style-transfer practice]
2. **RAG retrieval of voice exemplars.** Index the transcript corpus; for each script section retrieve the most topically-similar Instructor passages as dynamic few-shot. Better fidelity than static few-shot when topics vary widely. Combine with #1.
3. **Fine-tuning.** Not recommended — violates no-paid-subscriptions (training infra/API costs), adds a stale artifact to maintain, and the corpus is modest. Prompt-based style transfer is sufficient and stays "codified."

### Grounding / factual accuracy (avoid hallucinated tool features)

- **RAG against the existing codified JSON** — the project already has `content/schemas/capabilities.ts`, `tool.ts`, `source.ts`. Treat these as the **fact source**. The script generator must only assert tool capabilities present in that JSON, and cite the `source` records. This directly satisfies the project rule "AI tool claims must reference vendor docs."
- Enforce with a post-gen check: extract claims from the script, verify each maps to a capability record; flag unverifiable claims for human review (ties into the audit-integrity P0 rule).

### Structuring script for timed scenes

Emit the script **as structured JSON, not prose**, so it maps deterministically onto scene types:

```jsonc
// script.json — one block per intended scene
{
  "blocks": [
    {
      "sceneType": "tool-card-reveal",     // must be one of the 14 SCENE_TYPES
      "narration": "Let's meet the three tools you'll use every day...",
      "contentRefs": ["tool:claude", "tool:gemini"], // ids into capability JSON
      "emphasisWords": ["every day"]        // optional, for caption styling
    }
  ]
}
```

The generator's system prompt is given the enum `SCENE_TYPES` and each scene's content schema (already in `scene-types.ts`), so it can only request scene types the renderer supports. This is the seam between "what to say" (script) and "what to show" (scene-plan, §3).

---

## 3. Script → Animation Alignment

**Goal:** turn timed narration into a timeline of animation scenes — scene selection, duration derivation, audio-driven timing.

### Pattern: narration-first, audio-authoritative timing

The current schema authors `duration` (frames) by hand and validates contiguity. The pipeline should **invert this**: narration determines duration.

1. **Scene selection** — already decided in `script.json` (`sceneType` per block). A deterministic generator maps each block's `contentRefs` into the scene's Zod `content` shape, producing draft scenes with `duration: 0`.
2. **Duration derivation — two-stage:**
   - *Estimate* (pre-audio, for fast preview): `frames = words / WPM * 60 * fps`. Teaching narration ≈ **140–160 WPM**; at 30fps that's ~`words / 150 * 60 * 30` frames, plus a fixed pad for on-screen reading. [ASSUMED: 140–160 WPM teaching cadence — confirm against Instructor's actual delivery rate measured from transcripts+audio.]
   - *Authoritative* (post-audio): replace estimate with the **measured audio duration** of that scene's narration clip (ceil to frame). This is the real timing. See §4.
3. **Recompute contiguous `start` values** after durations are final (the existing `superRefine` contiguity rule then passes), and set `lesson.duration` = last scene end. The existing validator becomes a *guarantee* the generator must satisfy, not hand-authored data.

**Schema change required:** add an optional narration layer to each scene so audio/caption data is part of the single source of truth:

```ts
// add to SceneBaseSchema
narration: z.object({
  text: z.string(),
  audioSrc: z.string(),              // path to per-scene wav
  words: z.array(z.object({ word: z.string(), startMs: z.number(), endMs: z.number() })).optional(),
}).optional(),
```

### Anti-patterns
- **Hand-authoring frame durations when audio exists** — guarantees drift; let audio drive.
- **One giant audio file for the whole lesson** — makes per-scene regeneration impossible. **Render audio per-scene** so changing one scene's narration only re-synthesizes that clip.

---

## 4. Audio-Visual Sync Mechanics in Remotion (v4.0.460)

> Cited from Remotion v4 docs by URL; exact signatures from training knowledge of v4 (remotion.dev was not directly fetchable this session — verify the two `[ASSUMED]` signatures against live docs during implementation).

- **`calculateMetadata()`** on a `<Composition>` lets you compute `durationInFrames` from external data (e.g., the lesson JSON / measured audio) before render. This is how the JSON stays the single source of truth for total length. [CITED: remotion.dev/docs/dynamic-metadata]
- **`<Audio src={...} />`** plays narration; place each scene's narration inside that scene's `<Sequence>` so it's offset correctly. [CITED: remotion.dev/docs/audio]
- **`@remotion/media-utils`**: `getAudioDurationInSeconds(src)` and `parseMedia` give you audio length for duration derivation; `useAudioData(src)` + `visualizeAudio()` drive waveform/reactive visuals (useful for the `voice-demo` scene type). [CITED: remotion.dev/docs/audio-visualization] [ASSUMED: exact `useAudioData`/`visualizeAudio` signatures unchanged in 4.0.460]
- **`@remotion/captions`** — verified `Caption` type:
  ```ts
  export type Caption = {
    text: string;
    startMs: number;
    endMs: number;
    timestampMs: number | null;   // center timestamp of the token
    confidence: number | null;
  };
  ```
  [VERIFIED: github.com/remotion-dev/remotion/blob/main/packages/captions/src/caption.ts]
  Plus `createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds })` to group word tokens into on-screen caption pages, and `parseSrt`/`serializeSrt`. [CITED: remotion.dev/docs/captions] [ASSUMED: exact arg names]

**Sync flow:** alignment JSON (§5) → array of `Caption` (one per word, `startMs`/`endMs`/`timestampMs`) → `createTikTokStyleCaptions` for display → render captions inside each scene's `<Sequence>`, offset by the scene's audio start. Because word timings come from the *actual* generated audio, captions and narration are frame-accurate.

---

## 5. Forced Alignment / Timestamps (local, free)

**Goal:** word-level timestamps from generated TTS audio for captions + (optional) intra-scene cue timing.

| Tool | License | Best fit here | Notes |
|------|---------|---------------|-------|
| **stable-ts** | **MIT** [VERIFIED: github.com/jianfch/stable-ts] | **RECOMMENDED** | `align()` aligns a *known transcript* to audio at word level — and you already have the exact TTS input text, so this is more accurate and faster than transcribing. Outputs JSON/SRT/VTT directly. CPU-capable. |
| **WhisperX** | **BSD-2-Clause** [VERIFIED: github.com/m-bain/whisperX] | Strong alternative | wav2vec2 forced alignment; word-level timestamps; 70x realtime on GPU, runs CPU with `--compute_type int8 --device cpu`. |
| **whisper.cpp** | **MIT** [VERIFIED: github.com/ggml-org/whisper.cpp] | Good if you want a single C++ binary, no Python | Word-level via `-ml 1`; CPU-only inference supported. Remotion ships `@remotion/install-whisper-cpp` that wraps install + `transcribe` + `toCaptions()` producing the `Caption[]` shape directly. [CITED: remotion.dev/docs/install-whisper-cpp] |

**Recommendation:** **stable-ts `align()`** because you feed it the ground-truth narration text — no transcription errors, fastest path to accurate word boundaries. Convert its word list to Remotion `Caption[]` (`text`/`startMs`/`endMs`/`timestampMs = (startMs+endMs)/2`/`confidence: null`). Keep `@remotion/install-whisper-cpp` as the fallback if you'd rather stay inside the Node/Remotion toolchain with no Python.

---

## 6. Orchestration / Incremental Regeneration (content-hashed DAG)

**Goal:** each artifact cached + content-hashed so changing one input regenerates only affected downstream artifacts — an idempotent build DAG.

### Artifact DAG

```
capability JSON ─┐
                 ├─> outline.json ─> script.json ─> lesson.json(draft) ─┐
transcripts ─────┘        ▲                                            │
STYLE.md ─────────────────┘                                            │
                                                                       ▼
                              per-scene narration text ─> audio/scene-NN.wav ─> alignment/scene-NN.json
                                                                       │                    │
                                                                       ▼                    ▼
                                                          lesson.json(final durations) + captions ─> out.mp4
```

### Mechanism: input-hash cache keys

Each step writes `artifact + artifact.hash`, where the hash = SHA-256 of (all input file hashes + step version + relevant config). A step reruns **only if** any input hash changed or its output is missing. This gives surgical regeneration:

- Edit one tool's capability JSON → only `outline`/`script` blocks referencing that tool change → only those scenes' narration changes → only those `.wav` + alignment files re-synthesize → final render re-stitches (cheap). Untouched scenes' audio is reused from cache.
- Change STYLE.md → all script blocks regenerate (style is a global input) → cascades down. Expected and correct.
- Tweak a scene's visual `content` only (no narration change) → audio/captions cache hits; only the Remotion render reruns.

**Granularity rule:** hash and cache **per scene**, not per lesson, for the expensive layers (TTS, alignment). This is the single most important design decision for the "regenerate without re-recording" requirement.

### Tools / patterns

- **No new heavy dependency needed.** This is a small custom orchestrator in Node/tsx: a list of step definitions `{ id, inputs[], output, run() }` + a hash check. ~150 lines. Fits the project's "minimum code" rule.
- **If you want an off-the-shelf engine:** any general task runner with file-target up-to-date checks works — `make` (file-mtime, simplest), or a JS task graph. But mtime is unreliable across Docker/WSL mounts — **prefer content hashes over mtime**. [ASSUMED: mtime instability on WSL2/Docker bind mounts — known class of issue; verify in this environment.]
- **Remotion already supports incremental-friendly rendering** via `calculateMetadata` reading the final JSON, so the build orchestrator only needs to ensure `lesson.json` + audio + captions are fresh before invoking the existing `remotion render`.

---

## Project Constraints (from CLAUDE.md)

- **No paid subscriptions (P0):** drove rejection of XTTS-v2 (CPML), F5-TTS weights (CC-BY-NC), and all API TTS as anything but last-resort fallback. All recommended tools (Chatterbox MIT, Kokoro Apache-2.0, stable-ts MIT, whisperX BSD, whisper.cpp MIT) are free + commercial-OK.
- **Official sources only for AI tool claims:** §2 grounding ties script facts to the existing capability/`source` JSON.
- **TDD + audit integrity (P0):** add a fact-check gate (claims → capability records) and golden-file tests on outline/script/lesson schema validity before any "complete."
- **Container-first:** TTS + alignment are Python/PyTorch → run as Docker sidecar service(s); Remotion render stays in the existing container.
- **Visual verification + smooth animation:** audio-driven durations must not produce sub-readable scenes — enforce a minimum `duration` floor per scene type.

---

## Standard Stack

| Layer | Pick | License | Why |
|-------|------|---------|-----|
| TTS (cloning) | **Chatterbox / Chatterbox-Turbo** | MIT | Only SoTA open zero-shot-cloning model with commercial-safe weights |
| TTS (fallback, no clone) | **Kokoro-82M** | Apache-2.0 | Fast, tiny, polished, fully permissive |
| Forced alignment | **stable-ts `align()`** | MIT | Aligns known transcript → accurate word timing, no transcription errors |
| Alignment fallback | **@remotion/install-whisper-cpp** (whisper.cpp) | MIT | Stays in Node; `toCaptions()` emits `Caption[]` directly |
| Captions render | **@remotion/captions** | Remotion license (already in repo) | Verified `Caption` type + `createTikTokStyleCaptions` |
| Audio length / waveform | **@remotion/media-utils** | Remotion license | `getAudioDurationInSeconds`, `useAudioData`, `visualizeAudio` |
| Script gen | **Claude** + STYLE.md + RAG over capability JSON | — | Style transfer w/o fine-tuning; grounded facts |
| Orchestration | **custom Node content-hash DAG** | — | ~150 LOC; per-scene cache granularity |

---

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Word-level timestamps | Custom audio segmentation | stable-ts / whisperX | Forced alignment is a solved, hard ML problem |
| Caption grouping/paging | Manual token-batching | `createTikTokStyleCaptions` | Handles token combination + timing edge cases |
| Audio duration probing | Parse WAV headers yourself | `getAudioDurationInSeconds` / `parseMedia` | Format edge cases |
| Voice cloning | Train a model | Chatterbox zero-shot | Zero-shot from a clip vs. days of training |
| SRT/VTT parse/serialize | Regex | `parseSrt`/`serializeSrt` | Already in `@remotion/captions` |

---

## Common Pitfalls

1. **Non-commercial weights masquerading as "open."** F5-TTS/XTTS-v2 have permissive *code* but restricted *weights*. For a stakeholder product, weights license governs. → Use only MIT/Apache weights (Chatterbox, Kokoro). **Warning sign:** "CC-BY-NC" or "CPML" anywhere on the model card.
2. **Trusting TTS-emitted timestamps.** Most local TTS gives none, or inaccurate ones. → Always post-align with stable-ts against the known text.
3. **One monolithic audio file.** Kills incremental regeneration. → Per-scene audio + per-scene alignment, per-scene hash.
4. **mtime-based caching on WSL2/Docker mounts.** Bind-mount mtimes are flaky. → Content-hash, not mtime.
5. **Hand-authored frame durations drifting from audio.** → Audio is authoritative; regenerate `start`/`duration` and re-validate contiguity.
6. **Scene too short to read.** Audio-driven durations can be shorter than visual reveal animations. → Enforce per-scene-type minimum-duration floor.
7. **GPL contamination from Piper.** If chosen, invoke as a separate CLI/process, never link into the TS bundle.

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | Teaching cadence ~140–160 WPM | §3 | Pre-audio duration estimates off; corrected by audio-authoritative pass anyway (low risk) |
| A2 | `idiap/coqui-ai-TTS` is the live XTTS fork | §1 | Moot — XTTS disqualified by license regardless |
| A3 | API free-quota numbers (ElevenLabs/Google/Azure) | §1 | Fallback only; verify if ever used |
| A4 | Exact `useAudioData`/`visualizeAudio`/`createTikTokStyleCaptions` arg signatures in 4.0.460 | §4 | Compile error caught immediately; verify against live docs |
| A5 | WSL2/Docker bind-mount mtime instability | §6 | Low — content-hashing is the recommendation regardless |
| A6 | Kokoro has no custom-accent voice | §1 | Cosmetic; British voices available; cloning (Chatterbox) is the real path to Instructor's voice |

## Open Questions

1. **Clean reference audio for cloning** — is there a 10–30s segment of Instructor speaking cleanly (no overlap/noise) in the workshop corpus? Chatterbox quality depends on it. *Recommendation:* extract + denoise one clip during Wave 0.
2. **Per-scene vs per-sentence audio granularity** — per-scene is simplest for caching; per-sentence allows finer regeneration but more files. *Recommendation:* start per-scene.
3. **Does the demo need captions on-screen at all, or only A/V sync?** Affects whether `@remotion/captions` is in the demo critical path. *Recommendation:* captions are cheap once alignment exists; include them (accessibility + stakeholder polish).

## Environment Availability

| Dependency | Required by | Available | Notes |
|------------|-------------|-----------|-------|
| Remotion v4.0.460 | render | ✓ | in package.json |
| Python 3 + PyTorch (Docker) | Chatterbox/Kokoro/stable-ts | ✗ (not yet) | new TTS/alignment sidecar container needed |
| FFmpeg | audio probing, render | ✓ (Remotion bundles) | confirm in TTS container too |
| ctx7 / Context7 MCP | doc lookup | ✗ this session | Bash + MCP unavailable; verify Remotion signatures via live docs at impl time |

**Blocking with fallback:** TTS/alignment need a Python Docker sidecar (no Node-native equivalent for these models). Kokoro has ONNX builds runnable from Node if avoiding Python is desired, but cloning (Chatterbox) is Python-only.

---

## Sources

### Primary (HIGH confidence — verified this session)
- huggingface.co/hexgrad/Kokoro-82M (+ VOICES.md) — Apache-2.0, 48 voices, no cloning
- github.com/resemble-ai/chatterbox (+ /blob/master/LICENSE) — MIT, zero-shot cloning, Turbo paralinguistic tags
- huggingface.co/coqui/XTTS-v2 — CPML (non-commercial)
- huggingface.co/SWivid/F5-TTS (+ repo) — code MIT, **weights CC-BY-NC-4.0**
- github.com/myshell-ai/MeloTTS — MIT, CPU real-time
- github.com/OHF-Voice/piper1-gpl — GPL-3.0, maintained Piper
- github.com/jianfch/stable-ts — MIT, `align()` known-transcript alignment
- github.com/m-bain/whisperX — BSD-2-Clause, wav2vec2 word alignment, CPU-capable
- github.com/ggml-org/whisper.cpp — MIT, word timestamps via `-ml 1`, CPU
- github.com/remotion-dev/.../captions/src/caption.ts — verified `Caption` type

### Secondary (training knowledge, cite live docs to confirm)
- remotion.dev/docs: dynamic-metadata, audio, audio-visualization, captions, install-whisper-cpp

## Metadata
**Confidence:** TTS/alignment licensing HIGH (primary sources). Remotion sync APIs MEDIUM-HIGH (verified Caption type; other signatures from training, marked A4). Orchestration HIGH (standard build-DAG pattern).
**Valid until:** ~2026-06-23 (TTS landscape fast-moving; re-check Chatterbox/Kokoro releases monthly).
