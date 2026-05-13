---
phase: 01-rendering-environment
plan: 01
subsystem: infra
tags: [remotion, docker, typescript, syne-font, brand-tokens, vitest]

# Dependency graph
requires: []
provides:
  - Docker two-service architecture (dev + render)
  - Remotion v4 project scaffold with TypeScript
  - Brand token system (#EDE8E3, #8B2635, Syne, 4px radius)
  - Syne variable font bundled in Docker images
  - Vitest test framework configured
affects: [01-02-PLAN, 01-03-PLAN, 01-04-PLAN, phase-2]

# Tech tracking
tech-stack:
  added: [remotion@4.0.460, "@remotion/renderer", "@remotion/cli", "@remotion/bundler", "@remotion/google-fonts", "@remotion/transitions", zod, pixelmatch, pngjs, sharp, vitest, typescript]
  patterns: [docker-two-service, variable-font-bundling, brand-token-constants]

key-files:
  created:
    - package.json
    - tsconfig.json
    - remotion.config.ts
    - vitest.config.ts
    - src/index.ts
    - src/Root.tsx
    - src/brand/tokens.ts
    - docker/Dockerfile.render
    - docker/Dockerfile.dev
    - docker-compose.yml
    - .dockerignore
    - public/fonts/Syne-Variable.ttf
  modified: []

key-decisions:
  - "Used Syne variable font (single TTF, all weights 400-800) instead of 4 static weight files -- Google Fonts no longer ships static Syne TTFs"
  - "Used built-in node user (uid 1000) instead of creating remotion user -- node:22-bookworm-slim already has uid 1000 allocated"
  - "Used npm install instead of npm ci in Dockerfiles -- lockfile format incompatibility between host npm 11 and container npm 10"

patterns-established:
  - "Brand tokens as const object: import { BRAND } from './brand/tokens'"
  - "Docker two-service: dev (Remotion Studio, port 3000) + render (headless Chrome + FFmpeg)"
  - "Variable font bundling: COPY *.ttf to /usr/share/fonts/syne/ + fc-cache -fv"

requirements-completed: [INFRA-01, INFRA-02, INFRA-03, VERI-02]

# Metrics
duration: 62min
completed: 2026-05-13
---

# Phase 1 Plan 01: Project Scaffold Summary

**Remotion v4 project with Docker two-service architecture (dev Studio + headless render), bundled Syne variable font, and brand token system**

## Performance

- **Duration:** 62 min
- **Started:** 2026-05-13T16:47:59Z
- **Completed:** 2026-05-13T17:50:00Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- Remotion v4 project initialized with all dependencies (renderer, bundler, CLI, google-fonts, transitions, zod, pixelmatch, sharp, vitest)
- Brand token constants defined with exact hex values (#EDE8E3, #8B2635, #1C1C1C), Syne font family, 4px radius, 1920x1080@30fps
- Docker two-service architecture: dev container runs Remotion Studio on port 3000 (VERI-02), render container has Chrome Headless Shell + FFmpeg + bundled Syne font
- Both Docker images build and pass all infrastructure verification checks

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Remotion project with dependencies and brand tokens** - `92be229` (feat)
2. **Task 2: Create Docker two-service architecture with bundled fonts** - `b741dae` (feat)
3. **Task 3: Build Docker images and verify infrastructure** - `07371b0` (fix)

## Files Created/Modified
- `package.json` - Remotion v4 + supporting dependencies, npm scripts
- `tsconfig.json` - TypeScript strict mode, node16 module resolution
- `remotion.config.ts` - Remotion CLI configuration (PNG format, overwrite output)
- `vitest.config.ts` - Test framework: node environment, test/**/*.test.ts pattern, 30s timeout
- `src/index.ts` - Remotion entry point (registerRoot)
- `src/Root.tsx` - Root component (compositions added in Plan 02)
- `src/brand/tokens.ts` - Brand constants: colors, font, radius, video dimensions
- `docker/Dockerfile.render` - node:22-bookworm-slim + Chrome + FFmpeg + Syne + non-root user
- `docker/Dockerfile.dev` - node:22-bookworm-slim + Chrome + Syne + Remotion Studio
- `docker-compose.yml` - Two services: dev (port 3000, source bind-mount) + render (output volume, 2gb shm)
- `.dockerignore` - Excludes node_modules, output, .git, .planning, video files, archives
- `public/fonts/Syne-Variable.ttf` - Syne variable font (weights 400-800)
- `.gitignore` - Standard Node.js ignores + output directory

## Decisions Made
- **Variable font instead of static weight files:** Google Fonts no longer distributes static Syne TTF files. The variable font (Syne-Variable.ttf) covers all required weights (400, 600, 700, 800) in a single 147KB file. fontconfig correctly recognizes all weight styles.
- **Built-in node user instead of custom remotion user:** The node:22-bookworm-slim base image already allocates UID 1000 to the `node` user. Creating a `remotion` user with UID 1000 fails. Using `node` user is the standard Docker pattern for Node.js images.
- **npm install instead of npm ci:** The host runs npm 11 (Node 24) but the Docker image has npm 10 (Node 22). The lockfile format is incompatible with `npm ci` across versions. `npm install` is more forgiving and produces correct results.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Syne font files unavailable as static TTFs**
- **Found during:** Task 1 (font download)
- **Issue:** Google Fonts no longer distributes static Syne-Regular.ttf/SemiBold/Bold/ExtraBold files. Only a variable font (Syne[wght].ttf) is available.
- **Fix:** Downloaded the Syne variable font which contains all weights 400-800. fontconfig recognizes all weight variants from the single file.
- **Files modified:** public/fonts/Syne-Variable.ttf
- **Verification:** `fc-list | grep -i syne` inside Docker shows Regular, Medium, SemiBold, Bold, ExtraBold styles
- **Committed in:** 92be229 (Task 1 commit)

**2. [Rule 1 - Bug] Docker UID 1000 conflict with node user**
- **Found during:** Task 3 (Docker build)
- **Issue:** `useradd -m -u 1000 remotion` fails because UID 1000 is already taken by the `node` user in node:22-bookworm-slim
- **Fix:** Removed useradd, use built-in `node` user with `chown -R node:node /app` and `USER node`
- **Files modified:** docker/Dockerfile.render, docker/Dockerfile.dev
- **Verification:** Both images build successfully, run as non-root
- **Committed in:** 07371b0 (Task 3 commit)

**3. [Rule 1 - Bug] npm ci lockfile format incompatibility**
- **Found during:** Task 3 (Docker build)
- **Issue:** `npm ci` fails inside Docker (npm 10) because package-lock.json was generated by npm 11 on host
- **Fix:** Changed `npm ci` to `npm install --omit=dev` (render) and `npm install` (dev)
- **Files modified:** docker/Dockerfile.render, docker/Dockerfile.dev
- **Verification:** Both images build and install dependencies correctly
- **Committed in:** 07371b0 (Task 3 commit)

**4. [Rule 3 - Blocking] Docker build context included 2.7GB of video files**
- **Found during:** Task 3 (Docker build)
- **Issue:** .dockerignore didn't exclude .mp4, .zip, and other large files in project root, causing 2.7GB context transfer
- **Fix:** Added *.mp4, *.zip, *.mov, *.avi, and specific directories to .dockerignore
- **Files modified:** .dockerignore
- **Verification:** Context transfer reduced to <1MB, build completes in reasonable time
- **Committed in:** 07371b0 (Task 3 commit)

---

**Total deviations:** 4 auto-fixed (2 bugs, 2 blocking)
**Impact on plan:** All fixes necessary for the Docker build to succeed. No scope creep. The variable font approach is functionally superior to static files.

## Issues Encountered
- Docker image build was slow on first run (~5 min) due to downloading base image and Chrome Headless Shell. Subsequent builds use layer cache.
- The Remotion `create-video` scaffolding tool is interactive and doesn't accept `--template` as a non-interactive flag. Initialized project manually with npm init + dependency install instead.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Docker environment is fully operational: both images build and run
- Remotion Studio accessible at localhost:3000 for headed development (VERI-02)
- Render container has Chrome + FFmpeg + Syne font for headless MP4 output
- Brand tokens defined and verified
- Vitest configured, ready for test files in Plan 02+
- Ready for Plan 02: Brand Showcase test composition and render script

## Self-Check: PASSED

All 13 files verified present. All 3 commit hashes verified in git log.

---
*Phase: 01-rendering-environment*
*Completed: 2026-05-13*
