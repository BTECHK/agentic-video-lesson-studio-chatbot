# Chatbot / Bot Security Pass — Phase 2 (READ-ONLY, check-your-vibe)

**Date:** 2026-07-02
**Reviewer:** Claude (check-your-vibe skill), read-only — no edits made, no commits, no renders, no Docker started.
**Scope requested:** "the `chatbot/` workspace ... the only cloud-deployed surface (Telegram bot, webhook-first on Cloud Run, LLM_PROVIDER flag for Gemini-free operation)."

## 0. Scope correction (important)

The description in the task ("Telegram bot, webhook-first on Cloud Run, `LLM_PROVIDER` flag,
Gemini-free") does **not** match `chatbot/`. `chatbot/` is a Next.js 16 internal content-ops
console (lesson generation studio, ingestion panel, content index) — it has no Telegram code at
all (`grep -ril telegram chatbot/src` → zero hits) and its `LLM_PROVIDER` values are
`mock|claude-code|anthropic|google` for a different purpose (content generation, not a bot).

The actual Telegram/Cloud-Run/webhook/`LLM_PROVIDER`(`mock`|`gemini`) surface is a **separate,
sibling workspace: `bot/`** (`package.json` name: `tutor-bot`, "Standalone Sample Academy Tutor chatbot
— Telegram-first, channel-adapter seam, Gemini free-tier provider. Deploys to Cloud Run
(webhook-first)."). This report audits **`bot/`** as the real subject, and separately confirms
secrets hygiene in `chatbot/` since it's part of "the whole repo minus node_modules" secrets sweep.

GitNexus corroborates: `bot/src/index.ts`, `bot/src/channels/telegram.ts`, `bot/test/telegram.test.ts`
are the indexed Telegram symbols; nothing under `chatbot/` is.

Recommend flagging this naming collision to the user — future audits/automation keyed on
"chatbot" could silently skip the actual deployed bot.

---

## 1. Secrets hygiene

**Verification commands run:**

```
git ls-files chatbot/.env chatbot/.env.*        → only chatbot/.env.example tracked
git check-ignore -v chatbot/.env                → chatbot/.gitignore:42:.env  chatbot/.env  (ignored)
git ls-files bot/.env                            → (empty — not tracked)
git check-ignore -v bot/.env                     → bot/.gitignore:2:.env  bot/.env  (ignored)
ls bot/.env                                       → No such file or directory (never created locally)
git log --all --diff-filter=A --name-only --pretty=format: -- "*.env" | grep -v '.env.example'
                                                   → (empty — no non-example .env ever added, any branch, all history)
grep -rnE "AIza[0-9A-Za-z_-]{20,}|sk-ant-...|sk-...|[0-9]{8,10}:AA[0-9A-Za-z_-]{30,}|ghp_...|xox[baprs]-..."
  --include=*.ts --include=*.tsx --include=*.js --include=*.json --include=*.md --include=*.yaml
  --include=*.yml --include=*.env* -- . (repo root, minus node_modules/.git)
                                                   → 0 matches (checked Google/Gemini, Anthropic, generic sk-, GitHub PAT, Telegram bot-token shape, Slack token patterns)
grep -n "service_role|sk_live|PRIVATE KEY|API_KEY\s*=\s*[\"'][A-Za-z0-9]" bot/**
                                                   → 0 matches (only README placeholder strings like "PASTE_GEMINI_KEY")
```

**Findings:**
- No `.env` (real, non-example) file has ever been committed to this repo, on any branch, in the
  full git history. `bot/.env` doesn't even exist on disk locally.
- Both `bot/.gitignore` and `chatbot/.gitignore` correctly ignore `.env`.
- Whole-repo pattern grep for hardcoded Google (`AIza...`), Anthropic (`sk-ant-...`), generic
  `sk-...`, GitHub PAT (`ghp_...`), Telegram bot-token shape (`\d{8,10}:AA...`), and Slack
  (`xox[baprs]-...`) tokens returned zero matches outside placeholder text in README docs.
- `bot/README.md` documents secret provisioning via `openssl rand -hex 16` piped straight into
  `gcloud secrets create` (never touches a file), and Cloud Run deploy commands wire secrets via
  `--set-secrets` (Google Secret Manager references), not `--set-env-vars` with literal values.
  This is the correct pattern — no secret transits a shell history or repo file it doesn't need to.
- `bot/Dockerfile` never bakes credentials into the image; the API key / bot token / webhook
  secret are all runtime env vars supplied by Cloud Run's Secret Manager binding.

**Verdict: PASS.** No secrets hygiene findings.

---

## 2. Webhook auth (Telegram → Cloud Run)

`bot/src/server.ts` (lines 108–125) implements **two independent checks** for the webhook route:

1. **Path-embedded secret** — the route only matches `POST /telegram/${webhookSecret}` (line 108).
2. **Header secret** — Telegram's own `X-Telegram-Bot-Api-Secret-Token` header is compared against
   the same secret (line 111), rejecting with 403 on mismatch.

The secret itself (`bot/README.md:239`) is generated with `openssl rand -hex 16` (128 bits of
entropy) and stored in Secret Manager — not guessable, not derived from anything public.

This is **defense-in-depth done correctly** for the intended-config case: even if the URL path
leaks (e.g., via a proxy log), the header check still blocks a forged POST, and vice versa.

### FINDING (MEDIUM): webhook auth silently disables itself if `TELEGRAM_WEBHOOK_SECRET` is unset while `TELEGRAM_MODE=webhook` and a bot token is present

Traced in `bot/src/index.ts` + `bot/src/server.ts`:

- `index.ts` (lines 36–47) constructs a `TelegramChannel` (and thus sets `deps.telegram` truthy in
  `startServer`) whenever `TELEGRAM_BOT_TOKEN` is set — **independent of `TELEGRAM_MODE` or whether
  `TELEGRAM_WEBHOOK_SECRET` is set.**
- `index.ts` (lines 56–63) only *registers* the webhook with Telegram (`telegram.setWebhook(...)`)
  when both `PUBLIC_URL` and `webhookSecret` are present — otherwise it just logs an error and
  does nothing further. So in the misconfigured case, Telegram itself is never told about a webhook
  URL.
- **But** `startServer(...)` on line 53 runs unconditionally, and `createApp` in `server.ts` always
  registers the route matcher `path === `/telegram/${deps.webhookSecret}`` (line 108) and the header
  check `if (deps.webhookSecret && headerSecret !== deps.webhookSecret)` (line 111) — note the
  header check is itself gated on `deps.webhookSecret` being truthy.
- If `webhookSecret` is `undefined` (env var unset), the route literal becomes
  `/telegram/undefined` (a well-known, guessable path) and the header-check condition
  (`deps.webhookSecret && ...`) short-circuits to `true` (no check performed at all).

**Verified by isolated trace** (pure-logic reproduction of the exact branch, no server/network
touched):

```
Scenario: webhookSecret unset, attacker POSTs /telegram/undefined
{ matched: true, headerCheckSkipped: true, wouldPass: true }
```

**Impact:** on an otherwise-live Cloud Run deployment where an operator sets
`TELEGRAM_BOT_TOKEN` + `TELEGRAM_MODE=webhook` but forgets to also set
`TELEGRAM_WEBHOOK_SECRET` (or it fails to inject from Secret Manager), a third party who knows or
guesses the fixed literal path `POST https://<service>.run.app/telegram/undefined` can submit
**arbitrary forged Telegram-shaped JSON updates with zero auth**, and get the bot to process them
through the full brain pipeline (LLM calls against the Gemini free-tier quota, i.e. quota/cost
abuse and, since request bodies are attacker-controlled, a route into whatever the LLM will do with
attacker text — mitigated somewhat by the prompt-injection fencing in `prompt.ts`, but the
authentication layer itself is void). It is not open to arbitrary volume — Telegram-channel abuse
still passes through the per-chat-id `RateLimiter` and `GlobalDailyCap` inside
`TelegramChannel.handleUpdate`, so it's an availability/quota-abuse vector, not unbounded, but the
**intended webhook-auth boundary itself provides zero protection** in this misconfiguration.

This is entirely config-dependent (does not manifest when the env is set correctly, which is the
documented/expected deploy path), so it's a **defense-in-depth / fail-open gap**, not an
active vulnerability in the currently-documented deploy. Recommend (no code changed — read-only
audit): fail closed by having `createApp`/`startServer` refuse to mount the `/telegram/*` route (or
mount a route that always 403s) when `deps.telegram` is set but `webhookSecret` is falsy, rather
than trusting `TELEGRAM_MODE`/`setWebhook` registration as the only guard.

**No test currently exercises this branch** — `bot/test/server.test.ts` covers `/chat` (provider
failure, sources footer, per-IP rate limit, daily cap) but has zero test cases for the
`/telegram/<secret>` route, the header-secret check, or the missing-secret edge case. Worth adding
regression coverage regardless of whether the fail-open behavior above is fixed.

---

## 3. Injection / abuse handling

**Prompt-injection containment** (`bot/src/prompt.ts`, lines 58–70): retrieved course-content is
wrapped in an explicit `<<< BEGIN COURSE CONTENT (untrusted data) >>>` / `END` fence with an
instruction telling the model to treat anything instruction-shaped inside as inert data, not a
directive. This is the standard mitigation pattern and is applied consistently (also documented as
kept in sync with `chatbot/src/lib/llm/system-prompt.ts` per the file's own header comment — did
not independently diff the two prompts since `chatbot/` is out of primary scope, flagged above).

**Citation hallucination guard** (`bot/src/citations.ts`): sources shown to the user are
constructed **only** from the retrieved tool set that the model's answer text actually names
(`groundedSources`), never from whatever bracket-tag the model itself might emit — and
`stripSourceMarkup` scrubs any `[Source: ...]` / `[Tool: ...]` / `(Tool: ...)` the model emits
regardless, so a model that tries to fabricate a citation cannot get it displayed. Good
defense-in-depth (belt: system prompt tells the model not to; suspenders: output is
reconstructed server-side regardless of what the model says).

**Output rendering:** the web test page (`bot/src/web.ts`) renders all message content via
`textContent` (never `innerHTML`), so model output — which is attacker-influenceable via prompt
injection attempts — cannot become a stored/reflected XSS sink. The Telegram send path
(`channels/telegram.ts:92-97`) sends plain text with no `parse_mode`, so Telegram won't interpret
HTML/Markdown either — same reasoning applied consistently across both channels.

**Rate limiting who can invoke the bot:**
- **Telegram channel:** per-chat-id sliding-window limiter (`RateLimiter`, default 12/min via
  `RATE_LIMIT_PER_MIN`), plus a process-wide `GlobalDailyCap` (default 1000/day via
  `DAILY_REQUEST_CAP`) shared across both channels as a circuit breaker.
- **Web `/chat`:** rate-limited **by client IP** (`clientIp()` reads `x-forwarded-for` first hop,
  correct for Cloud Run's proxy) rather than the client-supplied `sessionId` — correctly defeats
  the obvious "just rotate your session id" bypass; this exact case is covered by a passing test
  (`server.test.ts`: "rate-limits by client IP, not the client-supplied sessionId").
- **Who can invoke the bot at all:** `TELEGRAM_ALLOWED_CHAT_IDS` is an opt-in allowlist
  (`bot/src/channels/telegram.ts:56-59`) — **empty/unset by default = open to anyone who finds the
  bot link**, which is explicitly documented as the intended pilot posture in
  `.env.example`/README ("Empty = open to anyone who finds the bot. Set it to lock the bot to known
  testers"). This is a **conscious, documented tradeoff for a pilot**, not an oversight — flagging
  as **LOW / informational**: confirm with the user whether the allowlist should be populated
  before/at public launch, since "open to anyone who finds the link" plus a real (non-mock)
  provider means real Gemini-quota spend is possible from an unauthenticated public surface (bounded
  only by the rate limiter + daily cap, which is by design — see README's own threat-model section
  explaining free-tier $0 spend ceiling reasoning).
- **Body size guard:** `readBody()` in `server.ts` destroys the request past 1MB — reasonable input-size
  guard against a giant-payload DoS attempt on `/chat` and the webhook route alike.
- **Message length caps:** user message truncated to 2000 chars (`/chat`) and bot reply truncated to
  4000 chars before sending to Telegram (`channels/telegram.ts:96`) — bounds token/cost blowup.

**Verdict: PASS**, with one LOW informational item (open-by-default Telegram allowlist — documented,
intentional pilot posture, user should confirm before general-audience launch).

---

## 4. Dependency red flags (`bot/package.json`)

```json
"dependencies": { "zod": "^4.3.6" }
"devDependencies": {
  "@types/node": "^25.7.0", "tsx": "^4.19.0", "typescript": "^6.0.3", "vitest": "^4.1.6"
}
```

- **Production dependency surface is minimal: exactly one runtime package (`zod`)** — no HTTP
  framework, no Telegram SDK (the bot hand-rolls Telegram API calls over `fetch`, deliberately, per
  its own README: "no SDK, just fetch, so the image stays tiny"), no Gemini SDK (same — raw REST
  call in `provider.ts`). Minimal dependency surface = minimal supply-chain attack surface. This is
  a genuinely good pattern, not a gap.
- No dev dependency stood out as abandoned/known-malicious by name/version at a glance; a full
  `npm audit`/OSV lookup would require network access, which is out of scope for this read-only,
  no-network-mutation pass — flagging as **not independently verified against a live vuln database**,
  everything else in this report is direct code/repo inspection.
- `Dockerfile` runs `npm install --omit=dev --no-audit --no-fund` — `--no-audit` means the Docker
  build itself never checks the npm advisory database at build time. Low-risk given the tiny/pinned
  dependency tree, but worth noting: nothing in the CI/build pipeline currently fails a build on a
  newly-disclosed CVE in `zod` or its (currently zero, since it's dependency-free) transitive
  deps. **LOW** — recommend a periodic (not necessarily CI-blocking) `npm audit` given the low cost
  of running one against a 1-dependency project.

**Verdict: PASS**, one LOW informational item (no automated vuln-DB check in the build).

---

## Summary — Severity-ranked findings

| # | Severity | File:Line | Finding |
|---|----------|-----------|---------|
| 1 | **MEDIUM** | `bot/src/server.ts:108-113`, `bot/src/index.ts:36-53` | Webhook auth (path secret + header secret) silently fails open to `POST /telegram/undefined` with zero auth if `TELEGRAM_WEBHOOK_SECRET` is unset while a bot token is present and mode is webhook — a documented-deploy misconfiguration, not the default/correct path, but the route mounts unconditionally regardless of whether `setWebhook` ever registered it with Telegram. No test covers this branch. |
| 2 | **LOW / informational** | `bot/src/channels/telegram.ts:56-59`, `bot/.env.example:40-43` | `TELEGRAM_ALLOWED_CHAT_IDS` is empty/open-to-anyone by default — a documented, intentional pilot posture. Confirm with the user whether to lock it down before wider/public launch. |
| 3 | **LOW / informational** | `bot/Dockerfile:9` | `npm install --no-audit` at build time means no automated vuln-DB check in the image build; dependency tree is tiny (1 prod dep) so blast radius is small, but nothing currently catches a newly disclosed CVE. |
| 4 | **Process note** | n/a | The task's described surface ("chatbot/ workspace... Telegram bot, webhook-first Cloud Run, LLM_PROVIDER flag") is actually `bot/` (tutor-bot), a separate sibling workspace — `chatbot/` is an unrelated internal Next.js content-ops console with no Telegram code. Recommend correcting this naming assumption in any future automated/scheduled audits so the real deployed surface isn't silently skipped. |

**No secrets hygiene findings** (no `.env` ever committed anywhere in git history, both `bot/` and
`chatbot/` `.gitignore` correctly exclude `.env`, zero hardcoded-key pattern matches repo-wide,
Cloud Run secrets are wired via Secret Manager references not literal env values).

**No confirmed injection/XSS/abuse-bypass vulnerability** — prompt-injection fencing, citation
grounding, plain-text/`textContent` output, per-IP (not per-session) rate limiting, and body-size/
message-length caps are all present and, where tested, passing.

## What was NOT done (per task constraints)
- No `git commit` was made.
- No video render or `gate:*` command was run.
- No Docker container was started (a TTS job may be using Docker, per task instruction).
- No live network call was made against Telegram's API, Gemini's API, or any vuln database — all
  findings are from static code/config/git-history inspection plus one offline, no-network
  logic-trace script (`node` executed a standalone reproduction of the exact auth branch, no
  server or network involved).
