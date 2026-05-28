# Architecture + Feature Map (Issue #69)

Updated: 2026-05-28  
Repo commit: `37f12b9`  
GitNexus status: indexed and up to date at `37f12b9` (`gitnexus status`).

This is the canonical walkthrough map for the internal demo: what exists, how it connects, and what "working" means per page.

## C4 Context

```mermaid
flowchart LR
  Team[Internal Team]
  Learner[Demo Learner]
  Console[internal Console]
  Content[Content Repository JSON]
  Pipeline[Lesson Pipeline Scripts]
  LLM[LLM Backends]
  Logs[Ingest and Pipeline Logs]
  Media[Drive Review Bundles]

  Team --> Console
  Learner --> Console
  Console --> Content
  Console --> Pipeline
  Pipeline --> Content
  Pipeline --> Logs
  Pipeline --> Media
  Console --> LLM
```

## C4 Container

```mermaid
flowchart TB
  subgraph Browser["Browser UI"]
    Pages["Next.js Pages and Components"]
  end

  subgraph App["chatbot Next.js App"]
    API["API Routes /api/*"]
    Auth["Access and Operator Auth"]
    Rate["Rate Limit and Idempotency"]
    Session["Session Store"]
    ReadModel["Content and Lesson Read Models"]
  end

  subgraph Root["Root Repo Runtime"]
    Content["content/tools + content/lessons + content/sources"]
    Scripts["scripts/generate, scripts/ingest, scripts/regenerate"]
    Logs["logs/ingest + lesson status files"]
    Publish["publish bundles"]
  end

  ExternalLLM["Claude CLI / Anthropic API / Mock"]

  Pages --> API
  API --> Auth
  API --> Rate
  API --> Session
  API --> ReadModel
  ReadModel --> Content
  API --> Scripts
  Scripts --> Content
  Scripts --> Logs
  Scripts --> Publish
  API --> ExternalLLM
```

## Sequence: Auth (Access + Session)

```mermaid
sequenceDiagram
  participant U as User
  participant UI as AccessGate
  participant A as POST /api/access
  participant S as POST /api/session
  participant ST as SessionStore

  U->>UI: Enter code or choose demo
  UI->>A: Validate access code
  A-->>UI: valid true or false
  UI->>S: Create session with mode
  S->>ST: create(accessMode)
  ST-->>S: sessionId
  S-->>UI: sessionId and accessMode
```

## Sequence: Chat

```mermaid
sequenceDiagram
  participant U as User
  participant UI as ChatInterface
  participant C as POST /api/chat
  participant ST as SessionStore
  participant R as Retrieval
  participant P as LLM Provider

  U->>UI: Submit message
  UI->>C: message, sessionId, mode
  C->>ST: get and addMessage
  C->>R: findRelevantContent
  C->>P: provider.chat
  P-->>C: answer
  C-->>UI: message plus grounded citations
```

## Sequence: Generate

```mermaid
sequenceDiagram
  participant U as User
  participant G as GeneratePanel
  participant AP as POST /api/generate
  participant BG as Detached script process
  participant GS as GET /api/generate/status
  participant AA as POST /api/generate/apply
  participant RG as scripts/regenerate.ts

  U->>G: Click Generate
  G->>AP: lessonId
  AP->>BG: Spawn detached headless generation
  AP-->>G: status running
  loop poll
    G->>GS: lessonId
    GS-->>G: running or done or error
  end
  U->>G: Click Apply
  G->>AA: lessonId
  AA->>RG: trigger rebuild on host
  AA-->>G: applied or gated message
```

## Sequence: Ingestion

```mermaid
sequenceDiagram
  participant U as User
  participant IP as IngestionPanel
  participant I as POST /api/ingest
  participant OP as OperatorAuth
  participant ING as scripts/ingest.ts
  participant LOG as logs/ingest

  U->>IP: Refresh all
  IP->>I: mode poll
  I->>OP: requireOperator and rate limit
  OP-->>I: allow or deny
  I->>ING: spawn detached ingest
  ING->>LOG: write scrape and ingest events
  I-->>IP: queued or disabled or denied
```

## Per-Page Feature Contract

| Page | Purpose | Data Inputs | Routes Used | Working Means | Status |
|---|---|---|---|---|---|
| `/` | Internal console home and launchpad | lesson directory stats | none | Hub links load and metrics render from live lesson state | Working |
| `/chat` | Tutor chat entry | access mode and session | `/api/access`, `/api/session`, `/api/chat` | valid session creation, answers returned, citations shown, mode toggle works | Working |
| `/content` | Tool repository browsing | `content/tools/*.json` | none | list and detail views load all tools with filters | Working |
| `/content/compare` | Side-by-side tool comparison | `content/tools/*.json`, benchmark data | none | selected tools compare with benchmark/source sections | Working |
| `/ingestion` | Freshness and manual trigger | ingest logs + ingest config | `/api/ingest` | latest run, freshness states, trigger response surfaced | Working (host trigger gated) |
| `/studio/generate` | Draft script and apply flow | lesson outline summary + draft files | `/api/generate`, `/api/generate/status`, `/api/generate/cancel`, `/api/generate/apply` | generation starts, survives navigation via status polling, cancel works, apply gives honest host gate | Working |
| `/studio/menu` | Lesson directory for planning | lesson metadata from content folder | none | lessons list with title, duration, stale/draft flags | Working |
| `/studio` | Timeline review and comment/edit control plane | lesson timeline, comments, edits | `/api/comments`, `/api/edits`, `/api/edits/apply`, `/api/regen` | timeline and inspector load, comments persist, edits apply path responds | Partially Working (video pane and full rebuild UX still limited) |
| `/marketing` | Public-facing marketing surface | static content | none | hero and feature sections render; links into product surfaces | Working |

## GitNexus Reconciliation

This map was reconciled against current GitNexus symbol/process context at commit `37f12b9`.

| Flow | GitNexus Evidence | Reconciled Result |
|---|---|---|
| Chat | `context POST --file chatbot/src/app/api/chat/route.ts` shows calls to `requireRateLimit`, `findRelevantContent`, `getLLMProvider`, `parseCitations`, `keepGroundedCitations` | Sequence includes rate limit, retrieval, provider call, grounded citations |
| Generate | `context POST --file chatbot/src/app/api/generate/route.ts` shows `requireOperator`, `readIdempotentReplay`, `writeIdempotentResult`, status helpers | Sequence includes operator gate, idempotency, detached background job, status polling |
| Ingest | `context POST --file chatbot/src/app/api/ingest/route.ts` shows `requireOperator`, idempotency helpers, `buildIngestArgs` | Sequence includes operator auth + rate limit, detached ingest spawn, runtime log output |
| Auth boundary | `context requireOperator --file chatbot/src/lib/operator-auth.ts` shows inbound write routes and outbound `requireRateLimit` + `isOperatorAuthorized` | Auth section reflects deny-by-default operator routes with rate limiting |
| Access gate | `context POST --file chatbot/src/app/api/access/route.ts` shows `validateAccessCode` + `requireRateLimit` | Auth sequence and page contract reflect access validation and throttling |

Notes:
- GitNexus process names are currently generic (for example, many `POST -> ...` labels), so symbol context was used as the primary reconciliation signal.
- If process labels need business-level names for leadership artifacts, rename/mapping should be done in a follow-up graph curation pass.
