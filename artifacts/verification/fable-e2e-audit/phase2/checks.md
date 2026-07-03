# Phase-2 Technical Audit — House Verification Suite

**Role:** checker (proof-gated, no commits, no renders, no gate:* on MP4s, no Docker starts)
**Repo:** `C:\Users\dev\OneDrive\Desktop\github\agentic-video-lesson-studio-chatbot`
**Branch:** `fable-e2e-audit` @ `36bf933` (working tree matched `origin/fable-e2e-audit` at run start)
**Run window:** 2026-07-02 ~16:12–16:19 local time
**Pre-flight:** confirmed no `remotion`/`ffmpeg` render process running (`tasklist`/`wmic` scan, clean). Docker Desktop background processes were present (per instructions, not started/touched, no `docker compose`/`docker run` issued).

---

## Summary table

| Stage | Command | Result | Notes |
|---|---|---|---|
| 1a. Root check:fast (typecheck+lint+test) | `npm run typecheck && npm run lint && npm run test` (via `check:all`) | **PASS** | 0 type errors; lint 0 errors/13 warnings; vitest 49 files / 530 tests passed |
| 1b. Content validation | `npm run validate:content` (via `check:all`) | **PASS (with 1 warning)** | 41/41 checks passed, 1 non-blocking WARN (131 sources missing recent ingest-log success) |
| 1c. Chatbot check:fast | `npm --prefix chatbot run check:fast` (via `check:all`) | **PASS** | 0 type errors; lint 0 errors/2 warnings; vitest 31 files / 268 passed, 1 skipped |
| **`npm run check:all` overall** | | **PASS — exit code 0** | All three sub-stages green |
| 2. Chatbot e2e | `npm run check:e2e` | **FAIL (environmental, not a code defect)** | `npm error code ENOENT ... Could not read package.json`, process exit **127** — see incident below |
| 3. Remotion bundle build | `npm run check:build` | **BLOCKED — not run** | Root `package.json` (and 18 other root files) missing from disk at time of stage; running `npm run check:build` would fail identically to stage 2. Not attempted to avoid a second misleading ENOENT run against a known-bad tree. |

---

## Incident discovered mid-audit: root-level tracked files missing from working tree

While moving from stage 1 to stage 2, `npm run check:e2e` failed immediately with:

```
npm error code ENOENT
npm error syscall open
npm error path C:\Users\dev\OneDrive\Desktop\github\agentic-video-lesson-studio-chatbot\package.json
npm error errno -4058
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open 'C:\Users\dev\OneDrive\Desktop\github\agentic-video-lesson-studio-chatbot\package.json'
npm error enoent This is related to npm not being able to find a file.
npm error enoent
npm error A complete log of this run can be found in: <npm-cache>\_logs\2026-07-02T20_15_57_435Z-debug-0.log
EXIT_CODE=127
```

(Note: the background-task wrapper reported "exit code 0" for the shell invocation that *wrote this log* — that refers to the outer `npm run check:e2e > log 2>&1; echo EXIT_CODE=$?` command succeeding at writing the file, not npm's own exit code. The captured `EXIT_CODE=127` inside the log is npm's real result — this is a FAIL, not a pass. Flagging this explicitly since it could otherwise be misread as green.)

### Forensics

- `git status --short` showed **19 root-level tracked files** as `deleted` (working-tree only, not staged/committed):
  `.dockerignore, .gcloudignore, .gitignore, project-brief.md, AGENTS.md, CLAUDE.md, "Module 1 Animated Lesson (offline).html", README.md, docker-compose.chatbot.yml, docker-compose.yml, drive.config.example.json, eslint.config.mjs, ingest.config.json, learnings.md, package-lock.json, package.json, skills-lock.json, tsconfig.json, vitest.config.ts`
- Confirmed independently via **PowerShell** (`Get-ChildItem -File` on repo root returned **zero files**) — not a bash/POSIX-layer artifact.
- All **subdirectories** (`src/`, `test/`, `scripts/`, `chatbot/` incl. its own `package.json`, `node_modules/` — 233 entries) were intact and unaffected. Only loose root files vanished.
- `git reflog -10` showed no destructive operation (reset/checkout/clean) around the incident time — the last commit (`36bf933`, "ops(state): phase-2 exit criteria + launch") was clean. `.git/index` mtime (16:12) predates the failure, ruling out a git-side cause.
- `git worktree list` showed only this one worktree — not a sibling-worktree collision.
- `wmic process` scan at the time showed **`OneDrive.Sync.Service.exe`** actively running; no `git`, `npm`, render, or ffmpeg process was active that could explain the deletion.
- Polled every 5s for 60s (`Monitor`, 12 checks, 16:18:06–16:19:02): package.json **remained missing the entire window** — this is not a momentary race, it persisted.
- Timing: `check:all`'s own root-stage npm invocation successfully read `package.json` (it completed normally, finishing chatbot tests at "Start at 16:14:32" + ~9.5s). The `check:e2e` ENOENT was logged at 20:15:57 UTC (16:15:57 local). So the files disappeared from disk in roughly a **1–2 minute window between the two stages**, while this audit was the only intentional actor and issued no file-deleting commands.

**Most likely cause:** a OneDrive Files-On-Demand sync/dehydration fault on this repo path (`...\OneDrive\Desktop\github\agentic-video-lesson-studio-chatbot`) — the pattern (only loose root files gone, all directories/subfiles untouched, sync service actively running, no git/npm actor) is consistent with a client-side sync hiccup rather than anything this audit run or `check:all`/`check:e2e` did. This was **not caused by this audit** (no delete/clean/checkout was issued) and was **not fixed by this audit** (no recovery attempted, per the checker-role/no-destructive-ops constraint — recovery risks colliding with the OneDrive sync client mid-fault or with other concurrent agent/render activity on this shared machine).

**Action taken:** none beyond diagnosis (read-only checks only: `ls`, `git status`, `git reflog`, `git worktree list`, `wmic`, PowerShell `Get-ChildItem`). No `git checkout`, `git restore`, or `git clean` was run. Recommend the user verify OneDrive sync health for this folder and, once `package.json` is confirmed back on disk, re-run stages 2 and 3 standalone.

### Consequence for stages 2 and 3

- **Stage 2 (`check:e2e`) verdict: FAIL — but environmental, not a code/test defect.** The command never got past reading `package.json`; Playwright/the e2e suite itself never ran. No external credentials were needed or missing (the Playwright config forces `LLM_PROVIDER=mock` for its `webServer`, and the local `.env` already had `ACCESS_CODE` set) — the blocker was purely the missing root file, not a missing service/env var. This is **documented-blocked** by the environment fault, not a genuine e2e regression, but per the task's own PASS/FAIL/BLOCKED taxonomy I'm reporting it as **BLOCKED** (not silently as a code FAIL) since the underlying test logic was never exercised.
- **Stage 3 (`check:build`) verdict: BLOCKED — not run.** `npm run check:build` invokes `npm run build`, which needs the same root `package.json` that was confirmed absent at the time this stage was due. Running it would have produced the identical ENOENT/exit 127 with zero new information, so it was skipped rather than logged as a redundant failure. Per task instructions this stage was already gated on no render process running (confirmed clean) — the actual blocker turned out to be the file-system fault, unrelated to render/Docker load.

---

## Stage 1 detail: `npm run check:all` (full evidence)

Command: `npm run check:all` → `npm run check:fast && npm run check:content && npm --prefix chatbot run check:fast`
Exit code: **0**

### 1a. Root typecheck
```
> agentic-video-lesson-studio-chatbot@1.0.0 typecheck
> tsc --noEmit
```
No output after the command header = clean pass (tsc prints nothing on success).

### 1a. Root lint
```
> agentic-video-lesson-studio-chatbot@1.0.0 lint
> eslint .

C:\...\scripts\ingest\llm-extract.ts
  2:16  warning  'dirname' is defined but never used...
C:\...\scripts\ingest\scraper.ts
  4:10  warning  'join' is defined but never used...
C:\...\src\compositions\lesson-scenes\LayoutProbe.tsx
  75:11  warning  Unused eslint-disable directive (no problems were reported from 'no-console')
C:\...\src\compositions\lesson-scenes\ScreenFlow.tsx
  265:54 / 530:58  warning  'fps' is defined but never used...
  625:94  warning  'stepDurations' is defined but never used...
C:\...\test\gallery.test.ts
  1:32 / 1:43 / 2:8 / 4:8 / 7:7  warning  unused vars (beforeAll, afterAll, fs, sharp, FIXTURES_DIR)
C:\...\test\pipeline.test.ts
  66:28  warning  'PipelineResult' unused
C:\...\test\schemas.test.ts
  8:3  warning  'SourceEntrySchema' unused

✖ 13 problems (0 errors, 13 warnings)
  0 errors and 1 warning potentially fixable with the `--fix` option.
```

### 1a. Root test (vitest)
```
> agentic-video-lesson-studio-chatbot@1.0.0 test
> vitest run

 RUN  v4.1.6 C:/Users/dev/OneDrive/Desktop/github/agentic-video-lesson-studio-chatbot
 ✓ test/ai-regen.test.ts (4 tests) 68ms
 ✓ test/tts-adapter.test.ts (22 tests) 247ms
 ✓ test/differ.test.ts (10 tests) 216ms
 ✓ test/validation.test.ts (25 tests) 370ms
 ✓ test/sizzle-storyboard.test.ts (14 tests) 245ms
 ✓ test/regen-graph.test.ts (10 tests) 902ms
 ✓ test/pipeline.test.ts (5 tests) 55ms
 ✓ test/gate-lesson.test.ts (12 tests) 54ms
 ✓ test/parity.test.ts (5 tests) 152ms
 ✓ test/ingest-config.test.ts (15 tests) 71ms
 ✓ test/ingest-validation.test.ts (7 tests) 66ms
 ✓ test/script-pipeline.test.ts (13 tests) 64ms
 ... [49 files total]

 Test Files  49 passed (49)
      Tests  530 passed (530)
   Duration  12.50s (transform 9.54s, setup 0ms, import 33.25s, tests 4.57s, environment 27ms)
```
(Note: `pipeline.test.ts` exercises the render pipeline orchestrator against mocks — logs like `[pipeline] Rendering MP4...` are from a stubbed/mocked pipeline in the test, not an actual ffmpeg render; no real MP4 was rendered by this audit.)

### 1b. Content validation
```
> agentic-video-lesson-studio-chatbot@1.0.0 validate:content
> tsx scripts/validate-content.ts

Validating tool files...
  PASS  chatgpt.json / claude-code.json / claude.json / codex.json / comet.json / cowork.json /
        deepseek.json / gemini.json / grok.json / manus.json / perplexity.json / qwen.json

Validating product taxonomy...
  PASS  every product has exactly one primary surface

Validating source files...
  PASS  alibaba.json / anthropic-code.json / anthropic.json / comet.json / deepseek.json /
        google.json / manus.json / openai-codex.json / openai.json / perplexity.json / xai.json

Cross-referencing sourceRefs...
  PASS  chatgpt: all 18 refs found / claude-code: all 11 / claude: all 20 / codex: all 11 /
        comet: all 3 / cowork: all 5 / deepseek: all 8 / gemini: all 16 / grok: all 9 /
        manus: all 7 / perplexity: all 14 / qwen: all 8

Validating ingest log signals...
  PASS  parsed 216 ingest events from .../logs/ingest/ingest-2026-05-28.jsonl
  PASS  anthropic: success (x3)
  PASS  per-source freshness tracked for 0/131 sources
  WARN  131 source(s) are missing a recent success in logs

Summary
  Passed: 41
  Failed: 0
  Warnings: 1

Warnings:
  131 source(s) are missing a recent success in logs
```
This warning is pre-existing / non-blocking (ingest-log freshness tracking, not a content-schema failure) — the script itself still exits 0.

### 1c. Chatbot check:fast
```
> chatbot@0.1.0 typecheck
> tsc --noEmit
[clean — no output]

> chatbot@0.1.0 lint
> eslint

C:\...\chatbot\src\app\chat\page.tsx
  3:10  warning  'useRef' is defined but never used
C:\...\chatbot\src\components\ViewToggle.tsx
  10:39  warning  'label' is defined but never used

✖ 2 problems (0 errors, 2 warnings)

> chatbot@0.1.0 test
> vitest run
 ...
 Test Files  31 passed (31)
      Tests  268 passed | 1 skipped (269)
   Duration  9.50s (transform 7.41s, setup 0ms, import 25.09s, tests 9.61s, environment 14ms)
JSON report written to C:/.../chatbot/.test-results/results.json
```

---

## Stage 2 detail: `npm run check:e2e`

Command: `npm run check:e2e` (repo-root script proxies to `chatbot/scripts/check-e2e-proof.mjs` → `npx playwright test`)

**Result: FAIL / BLOCKED (environmental) — full log:**
```
npm error code ENOENT
npm error syscall open
npm error path C:\Users\dev\OneDrive\Desktop\github\agentic-video-lesson-studio-chatbot\package.json
npm error errno -4058
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open 'C:\Users\dev\OneDrive\Desktop\github\agentic-video-lesson-studio-chatbot\package.json'
npm error enoent This is related to npm not being able to find a file.
npm error enoent
npm error A complete log of this run can be found in: <npm-cache>\_logs\2026-07-02T20_15_57_435Z-debug-0.log
EXIT_CODE=127
```

**What this does NOT mean:** no missing external credential caused this. Inspected `chatbot/playwright.config.ts`: its `webServer` forces `env: { LLM_PROVIDER: 'mock' }` (deterministic stub, no API key needed) and runs on a dedicated port 3201 (not 3000, avoiding collision with another local project per prior audit note #65). The local `chatbot/.env` already had `ACCESS_CODE` set and `LLM_PROVIDER=mock`. So had the root file-system fault not occurred, this stage did not appear to be blocked by missing creds — it never got the chance to reach Playwright/the dev server at all.

**Not re-attempted a second time** once the file-system fault was confirmed persistent (60s poll, files still gone) — re-running would only reproduce the identical ENOENT.

---

## Stage 3 detail: `npm run check:build`

**Result: BLOCKED — not executed.**

Pre-checks done per task instructions:
- Render/ffmpeg/remotion process scan (`tasklist`, `wmic`) — **clean, none running**. This stage was not skipped for render-load reasons.
- Actual blocker: root `package.json` (which defines the `build`/`check:build` scripts themselves) was confirmed absent from disk at the time this stage was due, and remained absent through a 60-second poll. Running `npm run check:build` would fail identically to Stage 2 (`ENOENT ... package.json`, exit 127) with no additional diagnostic value, so it was not run.

**Recommended next step:** once the user confirms OneDrict has restored the 19 missing root files (or restores them via `git checkout -- <paths>` themselves, since this is a checker session and that decision/action is intentionally left to the user), re-run `npm run check:e2e` and `npm run check:build` standalone and append results to this file.

---

## Overall Phase-2 verdict

| Item | Status |
|---|---|
| `check:all` (typecheck + lint + test + validate:content + chatbot check:fast) | **PASS** — 0 errors across all sub-stages, 15 total lint warnings (13 root + 2 chatbot, all pre-existing unused-var/directive style warnings, non-blocking), 1 content-validation WARN (ingest freshness, non-blocking), 798 total tests passed (530 root + 268 chatbot) + 1 skipped |
| `check:e2e` | **BLOCKED** by an environmental fault discovered mid-audit (root tracked files vanished from disk, most consistent with a OneDrive sync fault) — not a code or test regression; not caused or fixed by this audit |
| `check:build` | **BLOCKED** — same root-cause; not attempted since precondition (root `package.json` present) was already known false |

**This audit made no code changes, no commits, ran no renders, ran no `gate:*` checks on MP4s, and did not start any Docker containers.** The one open item is environmental (OneDrive/file-system) and outside the scope of what a checker role should remediate unilaterally.
