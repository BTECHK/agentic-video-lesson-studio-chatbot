# ADR-006: A standalone, dependency-free Tutor bot whose sources are grounded by construction

- **Status:** Accepted and implemented. The bot first appears in the history on 2026-06-09; the header-only webhook authorization, container hardening and usage events were added in the July hardening pass.
- **Scope:** the learner-facing question-and-answer service and its production posture.

## Context

Learners need answers about the AI tools the course teaches. The internal console already has a chat
route, but it is an operator tool: it spawns local processes, reads lesson files, and assumes Docker and
a logged-in CLI on the host. Anything exposed to learners has to be independently deployable, cheap when
idle, and safe against three risks:

1. **Fabricated sources.** A language model can cite a tool or lesson that was never retrieved.
2. **Prompt injection.** Retrieved text is data, but a model can be tricked into treating it as instructions.
3. **Abuse and spend.** A public bot with a paid provider is a denial-of-wallet target.

The design log records the split: the rendering pipeline stays local, and only the bot goes to the cloud
([`wiki/concepts/standalone-bot.md`](../../wiki/concepts/standalone-bot.md)).

## Decision

Build [`bot/`](../../bot/) as a separate, tiny service with a channel-agnostic brain.

**Shape**

- Node 22 with `node:http` and no framework. The source in [`bot/src`](../../bot/src/) imports only Node
  built-ins and its own modules. It runs TypeScript through `tsx`; there is no build step.
- One function, `respond()` in [`brain.ts`](../../bot/src/brain.ts), serves every channel: retrieve, build
  the prompt, call the provider, strip markup, derive sources. Telegram (webhook for production, long-poll
  for local use) and a web test page are thin adapters over it.
- Retrieval is keyword scoring over the same `content/tools/*.json` profiles the lessons use, baked into
  the image, so the public bot indexes only public-safe tool data. The design log says paid lesson bodies
  must never be indexed here.
- Providers are `mock` (default, no key) or `gemini`, chosen by `LLM_PROVIDER`. Choosing `gemini` without
  a key throws at startup. Gemini's hidden "thinking" budget defaults to 0 because an earlier setting
  burned the whole output budget and returned empty answers.

**The citation guard**

[`citations.ts`](../../bot/src/citations.ts) does not parse sources out of model text. It strips any
`[Source: ...]`, `[Tool: ...]` or `(Tool: ...)` markup the model emitted, then builds the `Sources:` footer
from the retrieved tools whose names the answer actually contains, preferring the longest name. A source
the model invented cannot appear, because the footer is computed from the retrieved set. The console's
chat route enforces the same invariant differently: it parses citations and drops any whose tool was not
retrieved ([`chatbot/src/lib/citations.ts`](../../chatbot/src/lib/citations.ts)).

**Production hardening** (each item is exercised by a test unless noted)

| Concern | Control | Where |
|---|---|---|
| Webhook authenticity | Fixed path, authorized only by the `X-Telegram-Bot-Api-Secret-Token` header, constant-time compare; no configured secret means no valid caller; the old secret-in-URL path returns 404 | [`server.ts`](../../bot/src/server.ts), [`test/server.test.ts`](../../bot/test/server.test.ts) |
| Unsafe boot | Refuses to start in webhook mode with a bot token but no secret | [`webhook-config.ts`](../../bot/src/webhook-config.ts), [`test/webhook-config.test.ts`](../../bot/test/webhook-config.test.ts) |
| Private pilot | Chat-id allowlist; non-listed chats get no reply at all | [`channels/telegram.ts`](../../bot/src/channels/telegram.ts), [`test/telegram.test.ts`](../../bot/test/telegram.test.ts) |
| Abuse | Per-user sliding-window limit (Telegram chat id, or client IP for the web route rather than a client-supplied session id) plus a global daily request cap shared across channels | [`rate-limit.ts`](../../bot/src/rate-limit.ts), [`test/rate-limit.test.ts`](../../bot/test/rate-limit.test.ts) |
| Injection | Retrieved content sits between BEGIN and END markers, labelled untrusted data, with an instruction to ignore embedded commands | [`prompt.ts`](../../bot/src/prompt.ts) |
| Output and input size | Plain text only (no parse mode), 4,000-character send cap; a 1 MB body cap on both POST routes and a 2,000-character message cap on the web route | [`channels/telegram.ts`](../../bot/src/channels/telegram.ts), [`server.ts`](../../bot/src/server.ts) |
| Provider failure | Any provider error becomes an in-persona reply, never a raw 500 | [`brain.ts`](../../bot/src/brain.ts), [`test/server.test.ts`](../../bot/test/server.test.ts) |
| Privacy of usage events | One JSON line per handled message and per reply, chat id replaced by a truncated SHA-256; no message bodies logged anywhere | [`events.ts`](../../bot/src/events.ts), [`test/events.test.ts`](../../bot/test/events.test.ts) |
| Container | Digest-pinned base image, runs as the non-root `node` user | [`bot/Dockerfile`](../../bot/Dockerfile) (configuration, not tested) |
| Deploy posture | Public invoker, because Telegram cannot attach an identity token; authorization lives in the app (header secret, allowlist, rate caps) | [`bot/cloudbuild.yaml`](../../bot/cloudbuild.yaml) comments |

## Consequences

Positive:

- The public surface is small (908 lines under `bot/src`, no third-party runtime imports) and can be
  deployed and scaled to zero independently of everything else.
- The invariant "never show a source the model fabricated" is structural, and the tests state it
  directly ([`test/brain.test.ts`](../../bot/test/brain.test.ts): a source the model named but retrieval did
  not surface is never shown).
- The suite passes locally: 39 tests in 6 files. Running the bot in mock mode (`LLM_PROVIDER=mock npm start`)
  answers `/healthz` and `/chat` without keys.

Costs and known gaps:

- **All state is in memory.** Sessions (last 12 turns per chat), rate limits and the daily cap reset on a
  cold start and are correct only for a single instance.
- **The Telegram access-log line records the raw chat id.** Only the usage events hash it; the per-request
  log line (and the allowlist-rejection line) carry `chatId` as-is, so log access should be treated as
  sensitive.
- **Retrieval is keyword scoring**, adequate for a corpus of 14 profiles; the source says to swap in
  embeddings behind the same signature if lesson retrieval is added.
- **Citations are per tool, not per lesson.** Module and lesson fields are the constant `General`.
- **Only two providers exist.** The design log describes a one-flag paid upgrade, but `makeProvider` accepts
  only `mock` and `gemini`.
- **Not in CI.** The CI matrix covers the root package and the console, and the stop hook runs only those two
  slices; the bot's tests run by hand (`npm --prefix bot run check`).
- **Documentation lags the code.** `bot/.env.example` and `bot/README.md` still describe the earlier
  secret-in-path webhook and an old test count; the code and tests are authoritative.
- **No deployment evidence in this repository.** The Cloud Run configuration is here; a running service is not.

## Alternatives considered

- **Reuse the console's chat route.** Rejected: it is an internal tool tied to the operator machine.
- **Lock the Cloud Run service behind IAM.** Rejected, and the reason is written into the build file:
  Telegram's webhook caller cannot present a Google identity token, so the bot could never receive a
  message.
- **Secret in the webhook URL.** Replaced by header-only authorization, since URLs leak through logs and
  proxies; a test asserts the old path is gone.
- **Other channels.** WhatsApp was queued (verification and a paid business provider) and Slack skipped,
  per the design log; the adapter seam is what makes adding one cheap.

## Evidence

- Code: [`bot/src/`](../../bot/src/), [`bot/Dockerfile`](../../bot/Dockerfile), [`bot/cloudbuild.yaml`](../../bot/cloudbuild.yaml)
- Tests: [`bot/test/`](../../bot/test/) (`brain`, `events`, `rate-limit`, `server`, `telegram`, `webhook-config`)
- Design log: [`wiki/concepts/standalone-bot.md`](../../wiki/concepts/standalone-bot.md); hardening spec:
  [`docs/ACCEPTANCE.md`](../ACCEPTANCE.md) criteria AC10 to AC12
- Component diagram: [ARCHITECTURE section 3b](../ARCHITECTURE.md#3b-tutor-bot-botsrc)
