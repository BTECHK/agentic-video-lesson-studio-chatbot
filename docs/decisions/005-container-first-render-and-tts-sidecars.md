# ADR-005: Container-first rendering, with speech synthesis as a Python sidecar

- **Status:** Accepted and implemented. The render container and compose file first appear on 2026-05-13; the speech sidecar on 2026-05-23.
- **Scope:** how the heavy, dependency-laden steps (render, speech, ingestion) are packaged and invoked.

## Context

The pipeline mixes two very different runtimes. Rendering needs Node, Chromium with a long list of system
libraries, and FFmpeg. Speech synthesis needs Python and PyTorch. The project moved between developer
machines during its life (the incident log and code comments mention Windows, macOS and Docker Desktop
quirks), and the output has to be reproducible: same fonts, same encoder settings, same results.

There is also a licensing constraint. The original product is commercial, so the voice models must be usable in a
commercial setting without a paid API by default.

## Decision

1. **Container-first.** The repository states the rule in [`CLAUDE.md`](../../CLAUDE.md) and enforces it by
   construction: [`docker-compose.yml`](../../docker-compose.yml) defines `render`, `tts`, `ingest` and
   `dev` services from [`docker/`](../../docker/). The render image is `node:22-bookworm-slim` with the
   Chromium libraries and FFmpeg, and it bundles the brand font so a render has no network dependency
   ([`Dockerfile.render`](../../docker/Dockerfile.render)).
2. **Speech is a sidecar CLI, batched by manifest.**
   [`docker/tts/synthesize.py`](../../docker/tts/synthesize.py) takes a JSON manifest of scenes and loads the
   model once. For each scene it writes one WAV and one word-timing file (Kokoro token timestamps offset
   by the audio of earlier chunks, with punctuation merged into the preceding word). The Node side,
   [`tts-adapter.ts`](../../src/lib/tts-adapter.ts), builds the manifest and selects the implementation.
3. **Models are chosen for their licences.** Kokoro-82M (Apache-2.0) is the default. Chatterbox (MIT) is
   reserved for a future cloned voice and its code path *raises* until a reference clip exists, so the
   pipeline can never silently fall back to a different voice. A paid path exists but is inert without a
   dedicated key and has a local daily cap. Engines whose weights are non-commercial are explicitly
   excluded in the sidecar's docstring.
4. **Pin what can drift.** The TTS image installs CPU-only PyTorch first (so the resolver does not pull a
   multi-gigabyte CUDA build), pins the Python requirements, and bakes the small NLP model into the image
   ([`Dockerfile.tts`](../../docker/Dockerfile.tts), [`requirements.txt`](../../docker/tts/requirements.txt)).
5. **Treat the host-to-container boundary as Linux.** Paths handed to the container are built with
   `path.posix` and made container-relative for the render leg (`dockerRenderArgv`), with tests asserting
   forward slashes.
6. **Keep an escape hatch.** `TTS_NATIVE=1` runs the same sidecar CLI with host Python, added when Docker
   Desktop crash-looped on the development machine; the manifest paths are repo-relative so both lanes
   produce identical files.
7. **Batch runs are hardened.** [`scripts/render-lesson.ts`](../../scripts/render-lesson.ts) has a per-lesson
   watchdog (default 40 minutes), a frame timeout (default 120 seconds), an optional concurrency cap, per-lesson
   try/catch so one failure does not abort a batch, BT.709 tagging and a 2x supersample by default.

## Consequences

Positive:

- The same command produces the same output on any host with Docker, and the free local voice needs no key.
- Three infrastructure incidents became design rules, each recorded in
  [`.planning/ERROR-LOG.md`](../../.planning/ERROR-LOG.md): Windows-style backslash paths creating a literal
  file name inside the Linux container (entry 4), a multi-gigabyte CUDA install and daemon crashes (entry 5),
  and one container per scene destabilising Docker Desktop (entry 6).
- The adapter is unit-tested with an injected runner, without a model download or a running container
  ([`test/tts-adapter.test.ts`](../../test/tts-adapter.test.ts), 22 tests), including implementation
  selection, the inert paid path, POSIX paths and manifest building.

Costs and known gaps:

- **Docker Desktop is a fragile dependency for long jobs.** The native TTS lane exists because of it.
- **Two render lanes with different knobs.** `regenerate` renders in the `render` service; the batch
  script renders on the host with `RENDER_*` environment variables.
- **First runs download models**, and rendering a lesson is measured in tens of minutes or more. The
  incident log records that running tests or gates during a render triples render time and can crash the batch,
  which is why the project's rules say to gate after rendering, never during.
- **The console's own container cannot use the headless-CLI provider**, because the image has no CLI or
  session; its compose file defaults to the mock provider.
- **Not exercised here.** These images were not built and no render or synthesis was run for this write-up;
  the images are described from their Dockerfiles and the adapter from its tests.

## Alternatives considered

- **Hosted speech APIs.** Kept only as the inert paid slot, so cost stays opt-in.
- **Voice engines with non-commercial weights.** Excluded by licence; one engine is usable only as an
  out-of-process CLI because of its copyleft licence (see the design spec's tooling table).
- **One container invocation per scene.** Tried and rejected after container churn caused failures on
  scene two; replaced by the manifest.
- **Installing the Python stack on the host.** Rejected as the default for reproducibility, retained as
  `TTS_NATIVE=1` for machines where Docker is unreliable.

## Evidence

- Containers: [`docker-compose.yml`](../../docker-compose.yml), [`docker-compose.chatbot.yml`](../../docker-compose.chatbot.yml),
  [`docker/Dockerfile.render`](../../docker/Dockerfile.render), [`docker/Dockerfile.tts`](../../docker/Dockerfile.tts),
  [`docker/Dockerfile.ingest`](../../docker/Dockerfile.ingest), [`docker/crontab.ingest`](../../docker/crontab.ingest)
- Sidecar and adapter: [`docker/tts/synthesize.py`](../../docker/tts/synthesize.py),
  [`src/lib/tts-adapter.ts`](../../src/lib/tts-adapter.ts), [`scripts/synthesize-lesson.ts`](../../scripts/synthesize-lesson.ts)
- Render: [`scripts/render-lesson.ts`](../../scripts/render-lesson.ts), `dockerRenderArgv` in
  [`src/lib/regen-graph.ts`](../../src/lib/regen-graph.ts) and its test in
  [`test/regen-graph.test.ts`](../../test/regen-graph.test.ts)
- Incidents: [`.planning/ERROR-LOG.md`](../../.planning/ERROR-LOG.md)
