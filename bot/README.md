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

## Run locally (mock — no keys)

```bash
cd bot
npm install
LLM_PROVIDER=mock npm start          # http://localhost:3100  → open / for the web chat
npm test                             # 15 tests: brain RAG invariant, Telegram adapter, rate limit
```

## Run locally against real Gemini + Telegram (pilot, no domain needed)

Telegram long-poll dials *out*, so no public URL is required for a pilot.

```bash
# secrets via 1Password (refs stay out of the repo):  op run -- npm start
LLM_PROVIDER=gemini \
GOOGLE_CHATBOT_API_KEY=...   # https://aistudio.google.com/apikey (free)
TELEGRAM_BOT_TOKEN=...       # @BotFather → /newbot
TELEGRAM_MODE=longpoll \
npm start
# then DM your bot on Telegram
```

## Deploy to Google Cloud Run (webhook-first)

Cloud Run gives a public `*.run.app` HTTPS URL — **no domain needed**. Webhook beats long-poll
here because scale-to-zero would kill an idle poller.

```bash
# 0. one-time: gcloud auth login && gcloud config set project <PROJECT_ID>

# 1. store secrets (copy values once from 1Password)
printf '%s' "$GEMINI_KEY"   | gcloud secrets create tutor-gemini-key   --data-file=-
printf '%s' "$TG_TOKEN"     | gcloud secrets create tutor-telegram-token --data-file=-
WEBHOOK_SECRET=$(openssl rand -hex 16)
printf '%s' "$WEBHOOK_SECRET" | gcloud secrets create tutor-webhook-secret --data-file=-

# 2. build from the REPO ROOT (Dockerfile bundles content/tools)
gcloud builds submit --tag gcr.io/<PROJECT_ID>/tutor-bot -f bot/Dockerfile .

# 3. deploy (PUBLIC_URL is filled on the second deploy once the URL exists, or use --set-env-vars after)
gcloud run deploy tutor-bot \
  --image gcr.io/<PROJECT_ID>/tutor-bot --region <REGION> --allow-unauthenticated \
  --set-env-vars LLM_PROVIDER=gemini,TELEGRAM_MODE=webhook \
  --set-secrets GOOGLE_CHATBOT_API_KEY=tutor-gemini-key:latest,TELEGRAM_BOT_TOKEN=tutor-telegram-token:latest,TELEGRAM_WEBHOOK_SECRET=tutor-webhook-secret:latest

# 4. set PUBLIC_URL to the service URL and redeploy so the bot registers its webhook
URL=$(gcloud run services describe tutor-bot --region <REGION> --format='value(status.url)')
gcloud run services update tutor-bot --region <REGION> --set-env-vars PUBLIC_URL=$URL,LLM_PROVIDER=gemini,TELEGRAM_MODE=webhook
```

Verify: open `$URL` (web chat), `GET $URL/healthz`, and DM the Telegram bot — you should get a
grounded answer with a `[Module …, Tool: …]` citation, and an off-topic question should be redirected.

## Security (what applies here — see plan file for the full triage)

Public bot + **public-safe tool data only** → no IP-exfiltration surface today. In place: backend-only
key, prompt-injection containment (UNTRUSTED DATA fence), citation guard, per-user rate limit + token
cap, session isolation, plain-text output. When RAG-over-lessons lands, paid lesson bodies must be
access-gated at retrieval time in code (never indexed into this public bot).

## What this shares with `chatbot/`

The Tutor *brain contract* (retrieval scoring, citation guard, persona) mirrors
`chatbot/src/lib/` — kept in sync by hand for now (the console is Next.js; this is a tiny Node
service deliberately decoupled). Consolidation into a shared package is a future cleanup.
