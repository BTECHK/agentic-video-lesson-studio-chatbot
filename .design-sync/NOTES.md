# design-sync notes

## 2026-06-22 — `/design-sync sampleacademy`: no syncable component-library DS; used context-bundle approach instead

**Finding (explored, do not re-discover):** this repo has **no conventional component-library design system** for `/design-sync` to consume:
- No Storybook (`**/.storybook/main.*`) and no `**/*.stories.*`.
- Root `package.json` build is `remotion bundle src/index.ts` — a **video** bundle, not a compiled UI `dist/`.
- Only `package.json`s: root (Remotion), `chatbot/` (Next.js app), `bot/`. None is a buildable component library.
- The "design system" exists only as (a) **Remotion video scene components** (`src/compositions/lesson-scenes/*.tsx`) which are frame-driven (`useCurrentFrame`/`<Sequence>`) and **do not render as standalone UI** in Claude Design's React runtime, or (b) **loose React+Babel-CDN JSX** from the original Claude Design session (`_claude-design-import/sampleacademy/project/*.jsx`) — not a packaged/buildable library.

**Decision:** user chose the lightweight **context-bundle** path (not a full component sync). No Claude Design project was created; no `projectId` pinned (so this is NOT a recorded sync — a future `/design-sync` still gets first-time treatment, which is correct).

**Output:** `claude-design-context/` (`tokens.css`, `design-guidelines.md`, `CONTEXT-PROMPT.md`) + the reference material in `claude-design-delta/`.

**When a real `/design-sync` would make sense:** only if a buildable component library is created (e.g. package the `_claude-design-import/sampleacademy` JSX into an esbuild-bundlable design-system package, or sync the `chatbot/` UI components if they form a coherent library). Until then, sync has no compiled `dist/` to ship.
