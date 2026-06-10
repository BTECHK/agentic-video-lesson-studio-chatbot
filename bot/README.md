# Tutor bot — standalone Sample Academy chatbot

A small, self-contained service that runs the **Tutor** teaching assistant over **Telegram**
(and a browser test page), grounded in the curated AI-tool repository. Channel-agnostic brain
behind a thin adapter seam: Telegram now, Slack/WhatsApp later with no brain changes.

- **Brain:** `content/tools/*.json` (shared source of truth) → keyword retrieval → Tutor system
  prompt → LLM provider → **citation hallucination guard** (drops any source the model fabricates).
- **Provider:** `mock` (no key, tests/dev) or `gemini` (free tier). One env flag, no SDK.
- **Channels:** Telegram (long-poll for local pilot, webhook for prod) + `POST /chat` + web page.
- **Guards:** per-user rate limit (Denial-of-Wallet), output-token cap, plain-text output (no XSS),
  session isolation per chat id, untrusted-data fencing of retrieved content in the prompt.

> **This guide is written PowerShell-first (Windows).** Each command shows **PowerShell** first; a
> **macOS / Linux (bash)** variant follows where they differ. Follow it **top to bottom — never skip
> ahead**; every step only uses things created in an earlier step. It assumes you can follow technical
> steps but have never used Google Cloud or BotFather before.

> **PowerShell line-continuation:** the bash continuation character is `\`; **PowerShell does not
> understand `\`**. In the PowerShell blocks below, multi-line commands use the backtick `` ` `` instead.
> If you ever copy a bash block by mistake, either put it on one line or swap each trailing `\` for `` ` ``.
> Also note it's `gcloud config set project …` (singular `project`).

## What you'll end up with

A public `https://tutor-bot-xxxxx.run.app` URL (no domain or server to manage — Google Cloud Run
scales to zero when idle and costs ~nothing for a pilot), your Telegram bot answering DMs, and a
browser test page. You'll create three things, **in this order**: (1) a Telegram bot token, (2) a free
Gemini API key, (3) a Google Cloud project — testing locally before you deploy.

---

## Part 1 — Prerequisites (install once)

- **Node.js 22+** — install the LTS from <https://nodejs.org>. Verify: `node --version`.
- **A Telegram account** — on your phone or desktop (to create + chat with the bot).
- **A Google account** — for the Gemini key (Part 3) and Google Cloud (Part 5).
- *(The Google Cloud `gcloud` CLI is installed later, in Part 5 — you only need it to deploy, not to
  test locally, so don't install it yet.)*

---

## Part 2 — Create your Telegram bot + token (BotFather)

Do this **before** anything asks for a `TELEGRAM_BOT_TOKEN`.

1. Open Telegram, search **`@BotFather`** (blue verified checkmark), open the chat.
2. Send **`/newbot`**.
3. Give it a **name** (display name, e.g. `Tutor - Sample Academy`).
4. Give it a **username** — unique and **ending in `bot`** (e.g. `demo_tutor_bot`).
5. BotFather replies with a token like `8123456789:AAFh...`. **Copy it and keep it safe** — this is your
   `TELEGRAM_BOT_TOKEN` (treat it like a password).

Your bot's shareable link is `https://t.me/<your_bot_username>`.

---

## Part 3 — Get a free Gemini API key

1. Go to **<https://aistudio.google.com/apikey>**, sign in with your Google account.
2. Click **"Create API key"** → it generates a key like `AIza...`. **Copy it** — this is your
   `GOOGLE_CHATBOT_API_KEY`. The free tier is enough; the bot uses `gemini-2.5-flash` by default.

> **Tip (saves re-pasting later):** stash both credentials in this PowerShell window's environment now —
> you'll reuse them in Part 4 (local test) and Part 6 (secrets):
> ```powershell
> $env:GOOGLE_CHATBOT_API_KEY = "PASTE_GEMINI_KEY"     # from Part 3
> $env:TELEGRAM_BOT_TOKEN     = "PASTE_BOT_TOKEN"      # from Part 2
> ```
> These are **per-window** (session-scoped) — if you open a new PowerShell window, set them again.

---

## Part 4 — Run it locally first (you now have both credentials)

Test on your laptop before touching the cloud — fastest feedback, no Google Cloud needed yet.

### 4a. Mock mode (no keys — proves the service runs)

```powershell
# PowerShell (Windows)
cd bot
npm install
npm test                          # 15 tests
$env:LLM_PROVIDER = "mock"
npm start                         # → http://localhost:3100
```

```bash
# macOS / Linux (bash)
cd bot && npm install && npm test
LLM_PROVIDER=mock npm start       # → http://localhost:3100
```

Open <http://localhost:3100> and chat — deterministic canned answers, no API calls.

### 4b. Real pilot (uses the token from Part 2 + key from Part 3)

Telegram **long-poll** dials *out*, so no public URL is needed for this pilot.

```powershell
# PowerShell (Windows) — reuses the env vars you set in Part 3 (or set them again here)
cd bot
$env:LLM_PROVIDER = "gemini"
# if you didn't set these in Part 3:  $env:GOOGLE_CHATBOT_API_KEY = "PASTE_GEMINI_KEY"; $env:TELEGRAM_BOT_TOKEN = "PASTE_BOT_TOKEN"
$env:TELEGRAM_MODE = "longpoll"
npm start
# Open https://t.me/<your_bot_username>, press Start, DM it — it should reply.
```

```bash
# macOS / Linux (bash)
LLM_PROVIDER=gemini GOOGLE_CHATBOT_API_KEY=PASTE_GEMINI_KEY \
TELEGRAM_BOT_TOKEN=PASTE_BOT_TOKEN TELEGRAM_MODE=longpoll npm start
```

Expect a grounded answer ending with a `[Module …, Tool: …]` citation; off-topic gets redirected.
When happy, deploy the webhook version (Parts 5+).

---

## Part 5 — Set up Google Cloud (project, billing, APIs, region)

### 5a. Install the `gcloud` CLI

- **Windows:** download and run `GoogleCloudSDKInstaller.exe` from
  <https://cloud.google.com/sdk/docs/install#windows>. Tick "Run `gcloud init`"; **reopen PowerShell**
  afterward so `gcloud` is on your PATH (note: reopening clears the env vars from Part 3 — re-set them
  before Part 6 if needed).
- **macOS:** `brew install --cask google-cloud-sdk`.

Verify: `gcloud --version`.

### 5b. Log in and create a project

You can use **one shared project for your whole effort** (not just the bot) — the bot's resources are
all prefixed `tutor-…`, so they stay tidy. Pick an ID that names the effort, e.g. `sample-edu-project`:

```powershell
# PowerShell (Windows) — same on bash
gcloud auth login
gcloud projects create sample-edu-project --name="Sample Academy"   # choose your own ID
gcloud config set project sample-edu-project                      # singular "project"
```

> **Project ID rules (these bite):** must **start with a lowercase letter** (so `1st-project` is
> rejected — use `sample-edu-project`), be **6–30 chars**, only lowercase letters / digits / hyphens, and
> it's **globally unique and permanent** (rename via the changeable `--name`, not the ID).

Whatever ID you choose is your **Project ID** — paste it wherever a later command says `PROJECT_ID`.
Prefer clicking? <https://console.cloud.google.com> → project dropdown (top bar) → **New Project**.

### 5c. Enable billing

Console → ☰ → **Billing** → create/link a billing account to the project you just created (a card is
required; the pilot stays within the always-free tier).

### 5d. Enable the APIs this needs

```powershell
# PowerShell (Windows) — one line
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

```bash
# macOS / Linux (bash)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com
```

`PERMISSION_DENIED` about billing → fix 5c and re-run.

### 5e. Pick a region and create an image repository

**Use the same region everywhere** (config, repo, build, deploy) — mismatched regions break the image
pull. This guide uses **`us-central1`** (Iowa): low cost and
fully supported (Cloud Run, Artifact Registry, Cloud Build, Secret Manager all run there).

```powershell
# PowerShell (Windows)
gcloud config set run/region us-central1
gcloud artifacts repositories create tutor --repository-format=docker --location=us-central1 --description="Tutor bot images"
```

```bash
# macOS / Linux (bash)
gcloud config set run/region us-central1
gcloud artifacts repositories create tutor \
  --repository-format=docker --location=us-central1 --description="Tutor bot images"
```

The image registry host is then `us-central1-docker.pkg.dev/<PROJECT_ID>/tutor/...`.

> Region note: the bot's real latency bottleneck is the Gemini API call (a global Google endpoint, not
> pinned to your Cloud Run region), and Telegram delivery is server-to-server — so the region mostly
> affects the web-chat round-trip and the inbound Telegram hop, not AI response time. Any supported region
> works for a scale-to-zero pilot; just be consistent.

---

## Part 6 — Store your three secrets

Put the token (Part 2), the Gemini key (Part 3), and a **new webhook secret** into Secret Manager. On
Windows, write each value to a tiny ASCII file first, then delete it.

> **Keep `-NoNewline -Encoding ascii` — it is not optional.** A trailing newline or a UTF-16 BOM
> silently corrupts the secret; for the webhook secret that breaks verification (the bot compares the
> stored value byte-for-byte against the `X-Telegram-Bot-Api-Secret-Token` header on
> every call). For the same reason, **don't pipe straight into `--data-file=-` on PowerShell** — piping
> appends a newline and defaults to UTF-16. The temp-file write is the reliable Windows path.

```powershell
# PowerShell (Windows) — reuse the env vars from Part 3/4b (no re-pasting)

# 1. Confirm they're still set IN THIS WINDOW (blank output = reopened window; re-set them, see below):
$env:GOOGLE_CHATBOT_API_KEY ; $env:TELEGRAM_BOT_TOKEN
#   if blank:  $env:GOOGLE_CHATBOT_API_KEY = "PASTE_GEMINI_KEY"; $env:TELEGRAM_BOT_TOKEN = "PASTE_BOT_TOKEN"

# 2. Gemini key + bot token — straight from the env vars:
Set-Content -Path val.txt -Value $env:GOOGLE_CHATBOT_API_KEY -NoNewline -Encoding ascii
gcloud secrets create tutor-gemini-key      --data-file=val.txt
Set-Content -Path val.txt -Value $env:TELEGRAM_BOT_TOKEN     -NoNewline -Encoding ascii
gcloud secrets create tutor-telegram-token  --data-file=val.txt

# 3. Webhook secret — generate fresh into a variable now (you never type it again; the deploy injects it
#    and the bot registers the webhook with it automatically):
$webhook = [guid]::NewGuid().ToString("N")
Set-Content -Path val.txt -Value $webhook -NoNewline -Encoding ascii
gcloud secrets create tutor-webhook-secret  --data-file=val.txt

Remove-Item val.txt
```

```bash
# macOS / Linux (bash)
printf '%s' "$GOOGLE_CHATBOT_API_KEY" | gcloud secrets create tutor-gemini-key     --data-file=-
printf '%s' "$TELEGRAM_BOT_TOKEN"     | gcloud secrets create tutor-telegram-token --data-file=-
printf '%s' "$(openssl rand -hex 16)" | gcloud secrets create tutor-webhook-secret --data-file=-
```

> Update a secret later with `gcloud secrets versions add <name> --data-file=...`; the bot picks up
> `:latest` on next deploy.

---

## Part 7 — Build the container image

From the **repo root** (not `bot/`), build with the provided Cloud Build config — it builds
`bot/Dockerfile` against the whole repo (the image bundles `content/tools/`) and pushes to Artifact
Registry. Replace `PROJECT_ID`:

```powershell
# PowerShell (Windows) — one line
gcloud builds submit --config bot/cloudbuild.yaml --substitutions=_IMAGE=us-central1-docker.pkg.dev/PROJECT_ID/tutor/tutor-bot:latest .
```

```bash
# macOS / Linux (bash)
gcloud builds submit --config bot/cloudbuild.yaml \
  --substitutions=_IMAGE=us-central1-docker.pkg.dev/PROJECT_ID/tutor/tutor-bot:latest .
```

(Don't drop the trailing `.` — it's the build context.) The config file is required because the
Dockerfile lives in `bot/` but needs the repo root as its build context, which `gcloud builds submit
--tag` can't express.

---

## Part 8 — Deploy to Cloud Run, then register the webhook

We use **webhook** mode (scale-to-zero would kill an idle long-poller). The service needs its own URL
(`PUBLIC_URL`) to register the webhook, but the URL only exists after the first deploy — so deploy once,
read the URL, then update.

**8a. First deploy** (replace `PROJECT_ID`):

```powershell
# PowerShell (Windows) — backtick = line continuation
gcloud run deploy tutor-bot `
  --image us-central1-docker.pkg.dev/PROJECT_ID/tutor/tutor-bot:latest `
  --region us-central1 `
  --allow-unauthenticated `
  --set-env-vars LLM_PROVIDER=gemini,TELEGRAM_MODE=webhook `
  --set-secrets GOOGLE_CHATBOT_API_KEY=tutor-gemini-key:latest,TELEGRAM_BOT_TOKEN=tutor-telegram-token:latest,TELEGRAM_WEBHOOK_SECRET=tutor-webhook-secret:latest
```

```bash
# macOS / Linux (bash) — backslash = line continuation
gcloud run deploy tutor-bot \
  --image us-central1-docker.pkg.dev/PROJECT_ID/tutor/tutor-bot:latest \
  --region us-central1 --allow-unauthenticated \
  --set-env-vars LLM_PROVIDER=gemini,TELEGRAM_MODE=webhook \
  --set-secrets GOOGLE_CHATBOT_API_KEY=tutor-gemini-key:latest,TELEGRAM_BOT_TOKEN=tutor-telegram-token:latest,TELEGRAM_WEBHOOK_SECRET=tutor-webhook-secret:latest
```

`--allow-unauthenticated` makes the URL publicly reachable (Telegram + browsers must reach it); the bot
still rejects any webhook call without the correct secret.

**8b. Read the URL and set `PUBLIC_URL`** — this redeploy makes the bot call Telegram's `setWebhook` on
startup:

```powershell
# PowerShell (Windows)
$URL = gcloud run services describe tutor-bot --region us-central1 --format="value(status.url)"
gcloud run services update tutor-bot --region us-central1 --update-env-vars PUBLIC_URL=$URL
$URL   # prints the URL
```

```bash
# macOS / Linux (bash)
URL=$(gcloud run services describe tutor-bot --region us-central1 --format='value(status.url)')
gcloud run services update tutor-bot --region us-central1 --update-env-vars PUBLIC_URL=$URL
echo "$URL"
```

On restart the bot registers `PUBLIC_URL/telegram/webhook` (with the secret as Telegram's header token) with Telegram itself — you never run
`setWebhook`. Don't set `PORT`: Cloud Run injects `PORT=8080` and the bot listens on it automatically.

---

## Part 9 — Verify it works

```powershell
# PowerShell (Windows)
Start-Process $URL                 # opens the web chat in your browser
curl.exe "$URL/healthz"            # → {"ok":true,"provider":"gemini","tools":<n>}
gcloud run services logs read tutor-bot --region us-central1 --limit 50   # look for: Telegram webhook registered.
```

```bash
# macOS / Linux (bash)
open "$URL"; curl "$URL/healthz"
gcloud run services logs read tutor-bot --region us-central1 --limit 50
```

Then DM `https://t.me/<your_bot_username>` → a grounded answer ending with a `[Module …, Tool: …]`
citation; an off-topic question gets redirected. (Optional: `curl.exe
"https://api.telegram.org/bot<TOKEN>/getWebhookInfo"` — `url` should be your `*.run.app/telegram/webhook`
and `last_error_message` empty.)

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| PowerShell errors on a multi-line command | You copied a bash block with `\`. Use the PowerShell block (backtick `` ` ``) or put it on one line. |
| `gcloud builds submit` can't find the Dockerfile | You ran it from `bot/` instead of the **repo root**, or omitted `--config bot/cloudbuild.yaml`. Run from root with the config + trailing `.`. |
| `PERMISSION_DENIED` enabling services | Billing isn't linked to the project (Part 5c). |
| Image pull fails on deploy | Region mismatch — the repo, build `_IMAGE`, and `--region` must all be the same region. |
| Bot deploys but never replies on Telegram | `PUBLIC_URL` not set (Part 8b), or the webhook secret got a stray newline/BOM (re-store it with `-NoNewline -Encoding ascii`). Check `getWebhookInfo` `last_error_message`. |
| Webhook calls return 403 | The stored `tutor-webhook-secret` doesn't match the registered path — re-store it (clean ASCII) and redeploy so it re-registers. |
| Container crash-loops / 500 on `/chat` | Missing/mis-named secret binding. The Gemini provider **fails fast** without `GOOGLE_CHATBOT_API_KEY`. Check `gcloud run services logs read ...`. |
| Health check shows `"provider":"mock"` | You didn't set `LLM_PROVIDER=gemini` — re-run the deploy/update with it. |
| `$env:…` prints blank in Part 6 | You reopened PowerShell (per-window vars). Re-set them, or paste the literals into the `Set-Content` lines. |

## Teardown (stop the bot's costs)

Remove only the bot's `tutor-…` resources — **do not delete the project** if it's shared with the rest of
the project:

```powershell
# PowerShell (Windows) — same on bash
gcloud run services delete tutor-bot --region us-central1
gcloud secrets delete tutor-gemini-key
gcloud secrets delete tutor-telegram-token
gcloud secrets delete tutor-webhook-secret
gcloud artifacts repositories delete tutor --location us-central1   # the bot's image repo only
```

(Only if this project was *just* for the bot: `gcloud projects delete <PROJECT_ID>` — deletes everything
in it.)

---

## Reference — environment variables

| Variable | Default | Purpose |
|---|---|---|
| `LLM_PROVIDER` | `mock` | `mock` (no key, tests/dev) or `gemini` (real). |
| `GOOGLE_CHATBOT_API_KEY` | — | Gemini key; required when `LLM_PROVIDER=gemini` (falls back to `GOOGLE_API_KEY`). |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Override the Gemini model. |
| `TELEGRAM_BOT_TOKEN` | — | From @BotFather (Part 2); enables the Telegram channel. |
| `TELEGRAM_MODE` | `longpoll` | `longpoll` (local pilot) or `webhook` (Cloud Run). |
| `PUBLIC_URL` | — | This service's HTTPS base URL; required for `webhook` mode. |
| `TELEGRAM_WEBHOOK_SECRET` | — | Secret in the webhook path **and** the `X-Telegram-Bot-Api-Secret-Token` header; required for `webhook` mode. |
| `PORT` | `3100` (local); Cloud Run injects `8080` | HTTP port. Don't set it on Cloud Run. |
| `RATE_LIMIT_PER_MIN` | `12` | Per-user message cap (abuse/cost guard). |
| `MAX_OUTPUT_TOKENS` | `600` | Hard cap on model output length. |

Routes: `GET /` (web chat) · `GET /healthz` · `POST /chat` (`{message, sessionId}`) ·
`POST /telegram/webhook` (Telegram webhook; authenticated by the secret header only).

> **Why this order (reusable for Slack/WhatsApp later):** create credentials before referencing them
> (token + key in Parts 2–3, first used in 4b/6) → smoke-test locally (4) → provision infra → store
> secrets → build → deploy → bind public URL/webhook → verify. Each step's output feeds the next.

---

## Security (what applies here — see plan file for the full triage)

Public bot + **public-safe tool data only** → no IP-exfiltration surface today. In place: backend-only
key, prompt-injection containment (UNTRUSTED DATA fence), citation guard, per-user rate limit + token
cap, session isolation, plain-text output. When RAG-over-lessons lands, paid lesson bodies must be
access-gated at retrieval time in code (never indexed into this public bot).

## What this shares with `chatbot/`

The Tutor *brain contract* (retrieval scoring, citation guard, persona) mirrors
`chatbot/src/lib/` — kept in sync by hand for now (the console is Next.js; this is a tiny Node
service deliberately decoupled). Consolidation into a shared package is a future cleanup.
