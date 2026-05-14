# Phase 5: TA Chatbot - Research

**Researched:** 2026-05-13
**Domain:** RAG chatbot web application (Next.js + Vercel AI SDK + vector search)
**Confidence:** HIGH

## Summary

Phase 5 delivers "Tutor," a standalone web chatbot that serves as a teaching assistant for Sample Academy. The chatbot is a separate Next.js application (not part of the Remotion video pipeline) that answers questions from the course content repository with inline source citations. It has two access modes: open demo (for stakeholders, no auth) and authenticated student mode (access code from Instructor via Teachable enrollment).

The architecture centers on Vercel AI SDK v6 for streaming chat UI and LLM integration, with a progressive enhancement path: bootstrap mode (Claude-powered, no RAG) works immediately, and RAG layers on when Phase 3 content arrives. The dual LLM backend (Claude Code passthrough vs. direct API key) is implemented as a provider configuration switch in the AI SDK. For vector search, the AI SDK's built-in `embed`/`embedMany`/`cosineSimilarity` functions with a simple in-memory store are sufficient for the content scale (12 tools x 11 capabilities = ~132 content entries), avoiding the operational overhead of a separate ChromaDB service.

**Primary recommendation:** Use Next.js 16 (App Router) + Vercel AI SDK v6 + `@ai-sdk/anthropic` provider + Tailwind CSS v4 + iron-session for access control. Start with bootstrap mode (no RAG), then add in-memory vector search when Phase 3 content materializes. Keep the architecture simple -- no LangChain, no external vector database, no heavy abstractions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dual-mode access -- open demo (no auth required) + authenticated student mode (access code). Demo is public for stakeholders, marketing, and discovery. Student mode requires an access code shared by Instructor via Teachable enrollment.
- **D-02:** Dev bypass mechanism for access code during development/testing. Environment variable or URL parameter that skips auth so developers don't get blocked during testing.
- **D-03:** Demo content is module-scoped and configurable. Demo mode starts with Module 1 content only. The scope is a configuration setting (not hard-coded) -- can be expanded or restricted. Students get full content access across all modules.
- **D-04:** Course-first with redirects. Chatbot answers from the course content repository first. When content doesn't cover the question, redirects to specific vendor docs or resources. No generic LLM answers -- every response is either grounded in course content or explicitly redirecting to an authoritative external source.
- **D-05:** Knowledge + practical help (full TA mode). Tutor answers knowledge questions AND helps with practical tasks -- prompt writing, tool setup guidance, troubleshooting. This is what makes it a teaching assistant, not just a reference bot.
- **D-06:** Multi-turn conversations within session. Chatbot remembers prior messages in the current conversation. Session expires when the tab closes. Follow standard RAG chatbot architecture patterns for session management.
- **D-07:** Gentle redirect for off-topic questions. Politely declines non-AI/non-course questions: "I'm Tutor, your Sample Academy AI assistant -- I'm best at helping with AI tools and the course material. What AI topic can I help with?"
- **D-08:** Dual LLM backend built in from day one. Two options: (1) Claude Code as passthrough -- routes questions through Claude Code for answers, (2) Direct API key -- calls the LLM API directly. API key is the fallback since the platform choice isn't locked yet. Both options must be programmed in and switchable via configuration.
- **D-09:** Friendly, clear tutoring voice. Practical and empowering -- like a knowledgeable friend showing you how to do something. Tone calibrated for working professionals.
- **D-10:** Inline citations with expandable details. Source citations appear as clickable references within the response text (e.g., [Module 2, Lesson 3]). Clicking expands to show the full source -- lesson name, module, tool, and verification date. Clean reading experience with detail on demand.
- **D-11:** Named TA persona "Tutor." Introduces itself: "Hi, I'm Tutor, your Sample Academy AI teaching assistant." Personal and memorable.
- **D-12:** Chatbot must work before Phase 3 content exists. In bootstrap mode, Tutor operates as a Claude-powered AI assistant with the personality prompt but no RAG content.
- **D-13:** Bootstrap mode enables testing the full chat experience (UI, multi-turn, access control, personality, citations UX) without waiting for content population.

### Claude's Discretion
- RAG architecture and vector store implementation
- Frontend framework and component library choice (must follow brand system)
- Chat UI layout and responsive design (Apple/Google/Anthropic design principles)
- All UI/UX decisions -- user deferred to Claude's recommendations using Apple/Google/Anthropic design principles and the brand system
- Session storage and memory implementation
- API route design and error handling
- Deployment configuration

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHAT-01 | RAG-grounded TA chatbot answering from course content repository with verified, current information | AI SDK `embed`/`cosineSimilarity` for in-memory vector search against Phase 3 JSON content; system prompt enforces course-first answers (D-04); bootstrap mode operates without RAG content (D-12) |
| CHAT-02 | Source citations in every response (which lesson/module/tool the answer references) | Structured citation metadata in RAG retrieval results; AI SDK `streamText` with system prompt requiring inline `[Module X, Lesson Y]` references; Citation component with expand/collapse |
| CHAT-03 | Standalone web application (separate from Teachable) with its own frontend | Next.js 16 App Router as standalone app in `chatbot/` directory; separate from Remotion pipeline; own `package.json`, Docker service, and port (3001) |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Chat UI (message rendering, input, streaming display) | Browser / Client | -- | React client components with `useChat` hook; all rendering is client-side |
| Chat API (LLM calls, RAG retrieval, response streaming) | API / Backend (Next.js Route Handler) | -- | Server-side only; API keys never exposed to client; streaming via SSE |
| Access control (demo vs student mode) | API / Backend | Browser / Client | Server validates access code; client stores mode in session cookie |
| Session memory (multi-turn context) | Browser / Client | -- | `useChat` maintains message history in React state; session expires on tab close (D-06) |
| Content embedding & vector search | API / Backend | -- | Embeddings generated at build/startup time; similarity search runs server-side |
| Brand system (fonts, colors, styling) | Browser / Client | CDN / Static | CSS custom properties + Tailwind; Syne font loaded from Google Fonts CDN |
| System prompt (personality, grounding rules) | API / Backend | -- | System prompt injected server-side before LLM call; never exposed to client |
| Citation rendering (expandable source cards) | Browser / Client | -- | Client-side component parses citation markers from response text |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.6 | Full-stack React framework | App Router with Route Handlers for API, SSR for initial page load, `output: "standalone"` for Docker. Project already uses React 19. [VERIFIED: npm registry] |
| Vercel AI SDK (`ai`) | 6.0.182 | Streaming chat, LLM abstraction, embeddings | `useChat` hook handles streaming UI, `streamText` handles server-side generation, `embed`/`embedMany`/`cosineSimilarity` for RAG. Supports Zod v4 (peerDep: `^3.25.76 \|\| ^4.1.8`). Provider-agnostic -- switch LLM backends via config. [VERIFIED: npm registry] |
| `@ai-sdk/react` | 3.0.184 | React hooks for chat UI | `useChat` for message state, streaming display, send/stop controls. [VERIFIED: npm registry] |
| `@ai-sdk/anthropic` | 3.0.77 | Anthropic/Claude provider | Direct Claude API integration for `streamText`. Supports claude-sonnet-4-5 and claude-haiku models. [VERIFIED: npm registry] |
| React | 19.2.6 | UI rendering | Already used in project; Next.js 16 requires React 19. [VERIFIED: npm registry] |
| Tailwind CSS | 4.3.0 | Utility-first CSS framework | Rapid UI development following brand tokens; v4 integrates via `@tailwindcss/postcss`. [VERIFIED: npm registry] |
| Zod | 4.4.3 | Schema validation | Already in project (`^4.3.6`). AI SDK v6 peer-depends on `^4.1.8`. Use for request validation, content schemas. [VERIFIED: npm registry] |
| TypeScript | 6.x | Type safety | Already in project. Strict mode. [VERIFIED: package.json] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@ai-sdk/openai` | 3.0.63 | OpenAI provider (embeddings) | For `text-embedding-3-small` embeddings in RAG pipeline. OpenAI embeddings are the most cost-effective option ($0.02/M tokens). [VERIFIED: npm registry] |
| `iron-session` | 8.0.4 | Stateless cookie sessions | Access code validation state stored in encrypted cookie. No database needed. [VERIFIED: npm registry] |
| `react-markdown` | 10.1.0 | Markdown rendering | Chatbot responses are markdown-formatted; render with code highlighting and citation markers. [VERIFIED: npm registry] |
| `remark-gfm` | 4.0.1 | GitHub Flavored Markdown | Tables, strikethrough, task lists in chatbot responses. [VERIFIED: npm registry] |
| `@fontsource/syne` | 5.x | Self-hosted Syne font | Alternative to Google Fonts CDN; ensures font availability in Docker. Already in project. [VERIFIED: package.json] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AI SDK `embed` + in-memory | ChromaDB | ChromaDB adds a separate Docker service, Python dependency, and operational complexity. For ~132 content chunks (12 tools x 11 categories), in-memory cosine similarity is fast enough (<10ms) and dramatically simpler. Use ChromaDB only if content grows past ~10K chunks. |
| AI SDK `streamText` | LangChain | LangChain adds abstraction layers, larger bundle size, and more complex debugging. AI SDK is purpose-built for streaming chat UIs in Next.js. LangChain is warranted for complex multi-step agent workflows; this chatbot is single-retrieval + generation. |
| `iron-session` | `next-auth` | next-auth is for OAuth/social login. This app uses simple access codes -- iron-session is the right weight. |
| Next.js | Plain Express + React SPA | Next.js provides API routes, SSR, `output: "standalone"` for Docker, and `useChat` integration out of the box. Express would require wiring all of this manually. |
| Tailwind CSS | Styled Components / CSS Modules | Tailwind v4 is the most productive option for brand-consistent UI development with custom properties. The project's Remotion pipeline already uses CSS custom properties for brand tokens. |
| `@ai-sdk/openai` (embeddings) | `@ai-sdk/anthropic` (embeddings) | Anthropic does not offer an embedding model. OpenAI's `text-embedding-3-small` is the industry standard for cost-effective embeddings ($0.02/M tokens). [VERIFIED: Anthropic docs do not list embedding models] |

**Installation:**
```bash
# In chatbot/ directory
npx create-next-app@latest chatbot --typescript --tailwind --eslint --app --src-dir --no-import-alias
cd chatbot
npm install ai @ai-sdk/react @ai-sdk/anthropic @ai-sdk/openai iron-session react-markdown remark-gfm zod @fontsource/syne
```

**Version verification:** All versions verified against npm registry on 2026-05-13.

## Architecture Patterns

### System Architecture Diagram

```
                           +------------------+
                           |   Browser        |
                           |   (React 19)     |
                           |                  |
                           |  useChat() hook  |
                           |  Message list    |
                           |  Citation cards  |
                           |  Access gate     |
                           +--------+---------+
                                    |
                        SSE stream  |  POST /api/chat
                        (text +     |  POST /api/access
                         citations) |
                                    v
                           +--------+---------+
                           |  Next.js API     |
                           |  Route Handlers  |
                           |                  |
                           |  /api/chat       +---> System Prompt (Tutor persona)
                           |  /api/access     |     + RAG context injection
                           +--------+---------+
                                    |
                    +---------------+---------------+
                    |                               |
           +--------v---------+            +--------v---------+
           |  LLM Provider    |            |  Vector Search   |
           |  (switchable)    |            |  (in-memory)     |
           |                  |            |                  |
           |  @ai-sdk/        |            |  embed() query   |
           |  anthropic       |            |  cosineSimilarity |
           |                  |            |  top-k retrieval  |
           +------------------+            +--------+---------+
                                                    |
                                           +--------v---------+
                                           |  Content Repo    |
                                           |  (Phase 3 JSON)  |
                                           |                  |
                                           |  tools/*.json    |
                                           |  sources/*.json  |
                                           +------------------+
```

**Data flow for a user question:**
1. User types question in chat UI
2. `useChat` sends POST to `/api/chat` with message + session history
3. Route handler embeds the question using `text-embedding-3-small`
4. In-memory vector search finds top-k relevant content chunks
5. System prompt (Tutor persona + grounding rules) + retrieved context + conversation history sent to Claude via `streamText`
6. Streaming response sent back via SSE; client renders incrementally
7. Citation markers in response text rendered as expandable cards

**Bootstrap mode flow (D-12):** Steps 3-4 are skipped. The system prompt tells Claude to act as a general AI assistant with the Tutor personality but without specific course content grounding.

### Recommended Project Structure

```
chatbot/
  src/
    app/
      layout.tsx              # Root layout, Syne font, brand CSS vars
      page.tsx                # Landing / mode selector
      chat/
        page.tsx              # Chat interface (client component)
      api/
        chat/
          route.ts            # POST: streaming chat endpoint
        access/
          route.ts            # POST: access code validation
      globals.css             # Brand CSS custom properties + Tailwind
    components/
      ChatMessage.tsx         # Single message bubble with citations
      ChatInput.tsx           # Message input with send button
      CitationCard.tsx        # Expandable citation detail card
      AccessGate.tsx          # Demo/Student mode selector + code entry
      TutorAvatar.tsx          # TA persona avatar/icon
    lib/
      brand.ts                # Brand tokens (replicated from src/brand/tokens.ts)
      types.ts                # Shared TypeScript types + Zod schemas
      access.ts               # Access control logic
      llm.ts                  # LLM provider configuration (dual backend)
      rag.ts                  # RAG pipeline: embed, search, retrieve
      system-prompt.ts        # Tutor personality + grounding instructions
      content-loader.ts       # Load Phase 3 JSON content for embedding
    hooks/
      useAccessMode.ts        # Client-side access mode state
  next.config.ts              # Standalone output, port 3001
  Dockerfile                  # Multi-stage build for production
  .env.example                # Environment variable template
  package.json
  tsconfig.json
```

### Pattern 1: Vercel AI SDK Streaming Chat

**What:** Use `useChat` hook on client and `streamText` on server for real-time streaming responses.
**When to use:** Every chat interaction.
**Example:**

```typescript
// Source: https://ai-sdk.dev (AI SDK v6 docs) [VERIFIED: Context7]

// Server: chatbot/src/app/api/chat/route.ts
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { getSystemPrompt } from '@/lib/system-prompt';
import { retrieveContext } from '@/lib/rag';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];

  // RAG: retrieve relevant content (skip in bootstrap mode)
  const context = await retrieveContext(lastMessage.content);

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: getSystemPrompt(context),
    messages,
  });

  return result.toUIMessageStreamResponse();
}

// Client: chatbot/src/app/chat/page.tsx
'use client';
import { useChat } from '@ai-sdk/react';

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat();
  // ... render messages with streaming
}
```

### Pattern 2: In-Memory Vector Search with AI SDK

**What:** Embed content at startup, store in memory, search with cosine similarity.
**When to use:** RAG retrieval when Phase 3 content is available.
**Example:**

```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/embeddings [VERIFIED: Context7]

import { embed, embedMany, cosineSimilarity } from 'ai';
import { openai } from '@ai-sdk/openai';

interface ContentChunk {
  text: string;
  embedding: number[];
  metadata: {
    tool: string;
    capability: string;
    module: string;
    sourceRef: string;
  };
}

let contentStore: ContentChunk[] = [];

// Called at startup or when content changes
export async function indexContent(chunks: { text: string; metadata: ContentChunk['metadata'] }[]) {
  const { embeddings } = await embedMany({
    model: openai.embeddingModel('text-embedding-3-small'),
    values: chunks.map(c => c.text),
  });

  contentStore = chunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }));
}

// Called per query
export async function retrieveContext(query: string, topK = 4): Promise<ContentChunk[]> {
  if (contentStore.length === 0) return []; // Bootstrap mode

  const { embedding } = await embed({
    model: openai.embeddingModel('text-embedding-3-small'),
    value: query,
  });

  return contentStore
    .map(chunk => ({
      chunk,
      similarity: cosineSimilarity(embedding, chunk.embedding),
    }))
    .filter(r => r.similarity > 0.5)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map(r => r.chunk);
}
```

### Pattern 3: Dual LLM Backend (D-08)

**What:** Switchable LLM provider via environment variable.
**When to use:** All LLM calls.
**Example:**

```typescript
// chatbot/src/lib/llm.ts
import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModelV2 } from '@ai-sdk/provider';

export type LLMProvider = 'anthropic-api' | 'claude-passthrough';

export function getModel(): LanguageModelV2 {
  const provider = process.env.LLM_PROVIDER || 'anthropic-api';

  switch (provider) {
    case 'anthropic-api':
      // Direct API key -- uses ANTHROPIC_API_KEY env var
      return anthropic('claude-sonnet-4-5');
    case 'claude-passthrough':
      // Claude Code passthrough -- same provider, different model selection
      // In practice, both use the Anthropic API; the distinction is
      // operational (who pays: subscription vs. API key)
      return anthropic('claude-haiku-3.5');
    default:
      return anthropic('claude-sonnet-4-5');
  }
}
```

**Note on D-08 "Claude Code passthrough":** The practical implementation is that during development, the developer can use Claude Code to test the chatbot behavior directly (Claude Code acts as the LLM). For production, a direct API key is used. Both paths use the `@ai-sdk/anthropic` provider -- the distinction is operational (subscription cost vs. per-token API cost), not architectural. The `LLM_PROVIDER` env var controls which model tier to use. [ASSUMED]

### Pattern 4: System Prompt with Personality and Grounding (D-09, D-04, D-07)

**What:** Structured system prompt encoding Tutor's personality, grounding rules, and redirect behavior.
**When to use:** Every LLM call.
**Example:**

```typescript
// chatbot/src/lib/system-prompt.ts
import type { ContentChunk } from './rag';

const TUTOR_PERSONA = `You are Tutor, the Sample Academy AI teaching assistant.

## Your Personality
- Friendly, clear, and encouraging
- Practical and empowering -- like a knowledgeable friend helping someone
- You speak to professionals who want to use AI to advance their careers
- You say "Hi, I'm Tutor, your Sample Academy AI teaching assistant" when introducing yourself

## Your Responsibilities
- Answer questions about AI tools covered in the Sample Academy course
- Help with practical tasks: prompt writing, tool setup, troubleshooting
- Provide specific, actionable guidance -- not vague overviews

## Citation Rules
- ALWAYS cite your sources using [Module X, Lesson Y] format inline
- If you reference a specific tool, include the tool name in the citation
- Example: "Claude's Projects feature lets you organize conversations by topic [Module 3, Lesson 2: Claude]"

## Boundaries
- If a question is not about AI tools or the course material, respond:
  "I'm Tutor, your Sample Academy AI assistant -- I'm best at helping with AI tools and the course material. What AI topic can I help with?"
- NEVER provide generic LLM answers. Every response must be grounded in course content OR redirect to specific vendor documentation.
- If you don't have information in the provided context, say so honestly and redirect to the official vendor docs.`;

export function getSystemPrompt(context: ContentChunk[]): string {
  if (context.length === 0) {
    // Bootstrap mode -- no RAG content available
    return `${TUTOR_PERSONA}

## Bootstrap Mode
You are currently operating without the full course content repository.
Answer AI questions based on your general knowledge, but still maintain the Tutor persona.
When the course content is loaded, your answers will be grounded in specific lesson material.`;
  }

  const contextText = context
    .map(c => `[Source: ${c.metadata.module}, ${c.metadata.capability}, Tool: ${c.metadata.tool}]\n${c.text}`)
    .join('\n\n---\n\n');

  return `${TUTOR_PERSONA}

## Course Content (use this to answer)
${contextText}

Answer ONLY from the above content. If the content doesn't cover the question, say so and redirect to the appropriate vendor documentation.`;
}
```

### Pattern 5: Access Control with iron-session (D-01, D-02)

**What:** Stateless encrypted cookie for access mode persistence.
**When to use:** Access code validation and mode gating.
**Example:**

```typescript
// chatbot/src/lib/session.ts
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  accessMode: 'demo' | 'student';
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'this-is-a-development-secret-change-in-prod-32chars',
  cookieName: 'tutor-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
```

### Anti-Patterns to Avoid

- **Exposing API keys to the client:** Never use `NEXT_PUBLIC_` prefix for `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. All LLM calls happen in Route Handlers (server-side only).
- **Client-side RAG:** Never embed or search vectors in the browser. Embedding models are server-side only; the client sends text and receives streamed responses.
- **Storing full conversation history on the server:** Per D-06, session memory lives in React state (client-side) and is sent with each request. The server is stateless. History is lost when the tab closes -- this is by design.
- **Over-engineering the vector store:** For ~132 content entries (12 tools x 11 categories), a dedicated vector database is unnecessary overhead. In-memory array + cosine similarity is correct at this scale.
- **Using LangChain for simple RAG:** LangChain adds significant complexity. The AI SDK's `embed` + `cosineSimilarity` + `streamText` covers the full RAG pipeline with fewer abstractions and better streaming support.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming SSE | Custom SSE implementation | AI SDK `streamText` + `toUIMessageStreamResponse` | Protocol handling, backpressure, error recovery are tricky; AI SDK handles all of it [VERIFIED: Context7] |
| Chat state management | Custom React state for messages | `useChat` hook from `@ai-sdk/react` | Handles message history, streaming state, loading/error states, retry logic [VERIFIED: Context7] |
| Markdown rendering | Custom parser | `react-markdown` + `remark-gfm` | Markdown parsing edge cases (nested lists, code blocks, tables) are numerous [VERIFIED: npm registry] |
| Session encryption | Custom cookie encryption | `iron-session` | Crypto is easy to get wrong; iron-session uses `@hapi/iron` for battle-tested encryption [VERIFIED: npm registry] |
| Embedding similarity | Custom distance functions | AI SDK `cosineSimilarity` | One-liner that handles vector math correctly [VERIFIED: Context7] |
| LLM provider switching | Custom API wrappers per provider | AI SDK provider pattern (`@ai-sdk/anthropic`, `@ai-sdk/openai`) | Unified interface across providers; swap by changing one import [VERIFIED: Context7] |

**Key insight:** The Vercel AI SDK is specifically designed for the exact use case of this chatbot -- streaming chat UI with RAG. Using it avoids reinventing the streaming protocol, chat state management, and provider abstraction layers.

## Common Pitfalls

### Pitfall 1: Zod v4 Compatibility
**What goes wrong:** AI SDK v6 peer-depends on `zod ^3.25.76 || ^4.1.8`. Using the wrong Zod version causes type errors.
**Why it happens:** The project uses Zod v4.3.6. Older AI SDK examples use Zod v3 syntax.
**How to avoid:** The project's Zod v4.3.6 satisfies the peer dependency. Ensure all schema definitions use Zod v4 API (mostly backward-compatible with v3). [VERIFIED: npm registry peerDeps]
**Warning signs:** TypeScript errors about `z.ZodType` not being assignable.

### Pitfall 2: ANTHROPIC_API_KEY Exposure
**What goes wrong:** API key exposed to client via `NEXT_PUBLIC_` prefix or client-side import.
**Why it happens:** Next.js makes it easy to accidentally expose server-only env vars.
**How to avoid:** Never prefix LLM API keys with `NEXT_PUBLIC_`. Only access them in Route Handlers (`app/api/*/route.ts`). Use `.env.local` (gitignored). The `@ai-sdk/anthropic` provider reads `ANTHROPIC_API_KEY` automatically from `process.env`. [CITED: https://ai-sdk.dev/providers/ai-sdk-providers/anthropic]
**Warning signs:** Browser Network tab showing API key in request headers.

### Pitfall 3: Bootstrap Mode System Prompt Drift
**What goes wrong:** In bootstrap mode (no RAG content), Tutor gives generic ChatGPT-style answers that don't match the teaching voice.
**Why it happens:** Without grounding content, the LLM falls back to its general training.
**How to avoid:** The bootstrap system prompt must still strongly encode Tutor's personality, tone, and boundaries (D-09). Include example responses in the system prompt. Test the personality separately from the RAG grounding. [ASSUMED]
**Warning signs:** Tutor answers like a generic assistant instead of a direct, practical teaching voice.

### Pitfall 4: Streaming + Citation Parsing Race Condition
**What goes wrong:** Citation markers like `[Module 2, Lesson 3]` appear mid-stream and the UI tries to parse incomplete markers.
**Why it happens:** Streaming delivers text character-by-character; a citation marker might arrive as `[Module 2, Le` in one chunk and `sson 3]` in the next.
**How to avoid:** Parse citations from the complete message text after streaming finishes, not during streaming. During streaming, show raw text. After stream completes, do a second pass to replace citation markers with interactive components. [ASSUMED]
**Warning signs:** Broken citation UI during streaming; citation cards appearing and disappearing.

### Pitfall 5: Docker Standalone Output Missing Static Files
**What goes wrong:** Next.js `output: "standalone"` doesn't automatically include the `public/` directory or `.next/static/` in the standalone output.
**Why it happens:** The standalone build only copies files actually imported by server code.
**How to avoid:** In the Dockerfile, explicitly copy `public/` and `.next/static/` to the runner stage alongside `.next/standalone/`. [CITED: https://nextjs.org/docs/app/guides/self-hosting]
**Warning signs:** 404 errors for fonts, images, or CSS files in production Docker container.

### Pitfall 6: In-Memory Embeddings Lost on Restart
**What goes wrong:** Embeddings stored in memory are lost when the Next.js server restarts, requiring re-embedding all content on every startup.
**Why it happens:** In-memory store has no persistence.
**How to avoid:** For ~132 chunks, re-embedding on startup takes ~2-3 seconds with `text-embedding-3-small` and is acceptable. For larger datasets, cache embeddings to a JSON file and only re-embed when content changes (compare file hashes). [ASSUMED]
**Warning signs:** Slow cold starts; unnecessary API costs from re-embedding unchanged content.

## Code Examples

### Complete Route Handler with RAG + Streaming

```typescript
// Source: Composite from AI SDK v6 docs [VERIFIED: Context7]
// chatbot/src/app/api/chat/route.ts
import { streamText } from 'ai';
import { getModel } from '@/lib/llm';
import { getSystemPrompt } from '@/lib/system-prompt';
import { retrieveContext } from '@/lib/rag';
import { ChatRequestSchema } from '@/lib/types';

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = ChatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response('Invalid request', { status: 400 });
  }

  const { messages, accessMode } = parsed.data;
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();

  // Retrieve context (returns empty array in bootstrap mode)
  const context = lastUserMessage
    ? await retrieveContext(lastUserMessage.content, accessMode)
    : [];

  const result = streamText({
    model: getModel(),
    system: getSystemPrompt(context),
    messages,
  });

  return result.toUIMessageStreamResponse();
}
```

### Chat UI Component with Brand System

```typescript
// chatbot/src/app/chat/page.tsx
// Design: Apple Messages-inspired, warm linen palette [ASSUMED]
'use client';

import { useChat } from '@ai-sdk/react';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';

export default function ChatPage() {
  const { messages, sendMessage, status, stop } = useChat();

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 style={{ fontFamily: 'var(--font)', fontWeight: 700, color: 'var(--text)' }}>
          Tutor
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Sample Academy AI Teaching Assistant
        </p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>

      {/* Input */}
      <ChatInput
        onSend={(text) => sendMessage({ text })}
        isStreaming={status === 'streaming'}
        onStop={stop}
      />
    </div>
  );
}
```

### Citation Card Component

```typescript
// chatbot/src/components/CitationCard.tsx [ASSUMED design pattern]
'use client';

import { useState } from 'react';
import type { Citation } from '@/lib/types';

export function CitationCard({ citation }: { citation: Citation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="inline-flex items-center px-1.5 py-0.5 text-xs rounded"
      style={{
        backgroundColor: 'var(--accent-soft)',
        color: 'var(--accent)',
        borderRadius: 'var(--radius)',
        fontFamily: 'var(--font)',
      }}
    >
      [{citation.module}, {citation.lesson}]
      {expanded && (
        <div
          className="absolute mt-1 p-3 shadow-lg text-left text-sm"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
          }}
        >
          <p className="font-semibold">{citation.lesson}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {citation.module} {citation.tool && `| ${citation.tool}`}
          </p>
          {citation.verifiedDate && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Verified: {citation.verifiedDate}
            </p>
          )}
          <p className="mt-2 text-xs">{citation.snippet}</p>
        </div>
      )}
    </button>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LangChain + external vector DB for all RAG | AI SDK `embed`/`cosineSimilarity` for simple RAG | AI SDK 3.2+ (2024) | Eliminates LangChain dependency for straightforward RAG; reduces complexity |
| `useChat` with `handleSubmit`/`handleInputChange` | `useChat` with `sendMessage` | AI SDK 6.0 (2026) | Simplified API; `sendMessage` replaces separate input state management [VERIFIED: Context7] |
| `result.toAIStreamResponse()` | `result.toUIMessageStreamResponse()` | AI SDK 6.0 (2026) | New streaming protocol with richer message types including parts [VERIFIED: Context7] |
| Pages Router API routes | App Router Route Handlers | Next.js 13+ (2023) | Standard web Request/Response API; no Next.js-specific types needed |
| Tailwind CSS v3 (config file) | Tailwind CSS v4 (@tailwindcss/postcss) | Tailwind v4 (2025) | No more `tailwind.config.js`; CSS-first configuration [VERIFIED: npm registry] |
| Zod v3 | Zod v4 | Zod 4.0 (2025) | Better performance, smaller bundle; AI SDK v6 supports both [VERIFIED: npm registry] |

**Deprecated/outdated:**
- `@ai-sdk/react` `handleSubmit` / `handleInputChange` pattern: Replaced by `sendMessage` in AI SDK v6
- `result.toAIStreamResponse()`: Replaced by `toUIMessageStreamResponse()` in AI SDK v6
- LangChain for simple embedding + search: Unnecessary abstraction when AI SDK provides `embed`/`cosineSimilarity` directly

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "Claude Code passthrough" (D-08) means using the same Anthropic provider but with different model tier/cost structure, not a fundamentally different architecture | Architecture Patterns - Pattern 3 | LOW -- the AI SDK provider abstraction means switching is a one-line change regardless |
| A2 | In-memory vector store is sufficient for ~132 content chunks | Architecture Patterns - Pattern 2 | LOW -- if content grows, migration to ChromaDB is straightforward (same embedding, different storage) |
| A3 | Citation markers should be parsed after streaming completes, not during | Common Pitfalls - Pitfall 4 | MEDIUM -- if users expect real-time citation rendering during streaming, the UX pattern needs revision |
| A4 | Bootstrap mode system prompt is sufficient to maintain Tutor personality without RAG content | Common Pitfalls - Pitfall 3 | LOW -- system prompts are the standard approach for persona enforcement |
| A5 | Re-embedding ~132 chunks on startup is acceptable (~2-3 seconds) | Common Pitfalls - Pitfall 6 | LOW -- worst case, add file-based embedding cache |
| A6 | Chat UI design should follow Apple Messages / iMessage aesthetic adapted to brand | Code Examples - Chat UI | LOW -- user deferred all UI/UX decisions to Claude's discretion |

## Open Questions

1. **OpenAI API key for embeddings**
   - What we know: Embeddings require `text-embedding-3-small` via OpenAI API ($0.02/M tokens). The project rule is "no paid services/subscriptions -- API keys only if necessary."
   - What's unclear: Does the user already have an OpenAI API key, or is this a new expense?
   - Recommendation: OpenAI embeddings are pay-per-use (not a subscription), costing <$0.01 for the entire content corpus. This qualifies under "API keys only if necessary." Bootstrap mode works without any embedding API key.

2. **Anthropic API key availability**
   - What we know: The chatbot needs an Anthropic API key for Claude responses (unless using Claude Code passthrough).
   - What's unclear: Does the user have an Anthropic API key, or will Claude Code subscription be the primary path?
   - Recommendation: Start with Claude Code passthrough during development. The API key path should be the production deployment option.

3. **Content structure from Phase 3**
   - What we know: Phase 3 will produce `content/tools/*.json` (one per tool) and `content/sources/*.json` (per vendor). Content has 11 capability categories across 12 tools.
   - What's unclear: Exact JSON schema for tool files -- needed to build the content loader.
   - Recommendation: Define a minimal content interface in Phase 5 types. When Phase 3 schema finalizes, the content loader adapts. Bootstrap mode means Phase 5 doesn't block on this.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js runtime | Yes | 24.13.0 | -- |
| npm | Package management | Yes | 11.6.2 | -- |
| Docker | Container deployment | Yes | 29.3.1 | -- |
| Docker Compose | Multi-service orchestration | Yes | 5.1.1 | -- |
| Anthropic API key | LLM responses | Unknown | -- | Claude Code passthrough (D-08) |
| OpenAI API key | Embeddings | Unknown | -- | Bootstrap mode (no RAG) until key available |

**Missing dependencies with no fallback:**
- None -- bootstrap mode (D-12) eliminates all external dependencies for initial development.

**Missing dependencies with fallback:**
- Anthropic API key: Use Claude Code passthrough during development.
- OpenAI API key: Bootstrap mode works without embeddings. When RAG is needed, OpenAI embeddings API key is required ($0.02/M tokens, pay-per-use).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 (already in project) |
| Config file | `chatbot/vitest.config.ts` (needs creation -- Wave 0) |
| Quick run command | `cd chatbot && npx vitest run --reporter=verbose` |
| Full suite command | `cd chatbot && npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHAT-01 | Chatbot answers from course content (not generic LLM) | integration | `npx vitest run tests/rag.test.ts -t "retrieves relevant content"` | Wave 0 |
| CHAT-01 | Bootstrap mode works without content | unit | `npx vitest run tests/rag.test.ts -t "returns empty in bootstrap"` | Wave 0 |
| CHAT-02 | Every response includes source citations | integration | `npx vitest run tests/system-prompt.test.ts -t "citation format"` | Wave 0 |
| CHAT-02 | Citation card renders and expands | unit | `npx vitest run tests/components/CitationCard.test.tsx` | Wave 0 |
| CHAT-03 | Standalone app builds and serves | smoke | `cd chatbot && npm run build` | Wave 0 |
| CHAT-03 | Access control validates codes correctly | unit | `npx vitest run tests/access.test.ts` | Wave 0 |
| CHAT-03 | Demo mode gates module access | unit | `npx vitest run tests/access.test.ts -t "module scope"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd chatbot && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd chatbot && npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `chatbot/vitest.config.ts` -- Vitest config for Next.js app (jsdom environment for component tests)
- [ ] `chatbot/tests/access.test.ts` -- covers access control logic
- [ ] `chatbot/tests/rag.test.ts` -- covers RAG retrieval and bootstrap mode
- [ ] `chatbot/tests/system-prompt.test.ts` -- covers system prompt generation with citations
- [ ] `chatbot/tests/components/CitationCard.test.tsx` -- covers citation UI component
- [ ] Framework install: `cd chatbot && npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom` -- testing dependencies for chatbot app

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (access codes) | iron-session encrypted cookies; server-side validation only |
| V3 Session Management | Yes | iron-session with httpOnly, secure cookies; session expires on tab close |
| V4 Access Control | Yes (demo vs student) | Server re-validates access mode on every /api/chat request |
| V5 Input Validation | Yes | Zod schema validation on all API inputs; message length limits |
| V6 Cryptography | No | iron-session handles cookie encryption; no custom crypto |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key exposure in browser | Information Disclosure | Server-only env vars (no `NEXT_PUBLIC_` prefix); Route Handlers only |
| Prompt injection via user message | Tampering | System prompt with clear boundaries; input sanitization; message length cap (2000 chars) |
| Access code brute force | Spoofing | Rate limiting on `/api/access` endpoint; iron-session for state |
| Session hijacking | Spoofing | httpOnly + secure cookies via iron-session; no session token in URL |
| Denial of service via long conversations | Denial of Service | Message history sent per-request; cap conversation length (e.g., 50 messages) |
| Content injection via RAG sources | Tampering | Content is Git-versioned, not user-generated; sources are trusted |

## Project Constraints (from CLAUDE.md)

- **Container-first:** Docker from day 1. Chatbot app must have its own Dockerfile.
- **TDD approach:** Write tests before implementation. Vitest for chatbot tests.
- **Visual verification:** Chat UI needs human-reviewable screenshots at key milestones.
- **Brand compliance:** Syne font, warm linen palette (#EDE8E3 base, #8B2635 accent), 4px radius -- no exceptions.
- **Official sources only:** AI tool claims in the content repository must reference vendor docs.
- **No paid services/subscriptions:** API keys only if necessary. OpenAI embeddings ($0.02/M tokens) and Anthropic API are pay-per-use.
- **Simplicity first:** No features beyond what was asked. No over-engineering.
- **Surgical changes:** Touch only what you must.

## Sources

### Primary (HIGH confidence)
- [Context7: /vercel/ai] -- `useChat` hook, `streamText`, `embed`/`embedMany`/`cosineSimilarity`, `toUIMessageStreamResponse()`, Anthropic provider integration. Benchmark Score 86.65.
- [Context7: /vercel/next.js] -- App Router, Route Handlers, standalone output. Benchmark Score 89.19.
- [npm registry] -- All package versions verified: next@16.2.6, ai@6.0.182, @ai-sdk/react@3.0.184, @ai-sdk/anthropic@3.0.77, @ai-sdk/openai@3.0.63, iron-session@8.0.4, react-markdown@10.1.0, zod@4.4.3, tailwindcss@4.3.0.
- [AI SDK RAG Cookbook](https://ai-sdk.dev/cookbook/guides/rag-chatbot) -- RAG architecture, tool-based retrieval, in-memory vector store pattern.

### Secondary (MEDIUM confidence)
- [Next.js Self-Hosting Guide](https://nextjs.org/docs/app/guides/self-hosting) -- Docker deployment with standalone output.
- [iron-session GitHub](https://github.com/vvo/iron-session) -- Stateless cookie session for Next.js.
- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript) -- Streaming patterns with `messages.stream()`.

### Tertiary (LOW confidence)
- [T4 Stack Tutorial](https://www.sitepoint.com/t4-stack-nextjs-16-vercel-ai-sdk-local-rag-tutorial/) -- Next.js 16 + AI SDK + local RAG pattern (community tutorial, not official).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries verified via npm registry and Context7; versions confirmed compatible
- Architecture: HIGH -- AI SDK streaming chat + in-memory RAG is a well-documented pattern with official examples
- Pitfalls: MEDIUM -- Some pitfalls (citation streaming, bootstrap persona drift) are experience-based assumptions

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (30 days -- stack is stable; AI SDK releases frequently but backward-compatible)
