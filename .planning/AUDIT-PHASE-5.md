# Phase 5 Audit: TA Chatbot

**Audited:** 2026-05-14
**Auditor:** Claude (integrity audit)
**Trigger:** Phase marked "complete" in STATE.md with ZERO automated tests and a misrepresented "passthrough" provider

---

## Plan 05-01: App Scaffold, Brand System, Access Control

### Claimed Features

- **Next.js standalone app in chatbot/**: PRESENT -- package.json exists with Next.js 16.2.6, build config present
- **Brand tokens (Syne, #EDE8E3, #8B2635, 4px radius)**: PRESENT -- brand.ts and globals.css contain correct values
- **CSS custom properties**: PRESENT -- globals.css defines all required variables
- **Syne font in layout.tsx**: PARTIAL -- layout.tsx imports Syne via next/font/google and sets `--font-syne` CSS variable, but all components reference `--font` (defined in globals.css via Google Fonts @import). The Next.js font optimization variable `--font-syne` is SET but NEVER READ. Double font loading: once via Next.js `next/font/google` and once via `@import url()` in globals.css
- **Shared types (ChatMessage, ChatSession, AccessMode, LLMProvider, Citation)**: PARTIAL -- All types are DEFINED but `ChatSession` and `LLMProvider` type from types.ts are never imported or used by any other file. Dead exports.
- **ChatRequestSchema (Zod validation)**: PRESENT -- defined and used by chat route
- **access.ts exports (validateAccessCode, getAccessMode, getDemoModuleScope, isModuleAccessible)**: PARTIAL -- All functions exist but `getAccessMode`, `getDemoModuleScope`, and `isModuleAccessible` are NEVER CALLED by any other file. Only `validateAccessCode` is actually wired (via api/access/route.ts)
- **Demo mode loads without authentication**: PRESENT -- AccessGate "Try Demo" button immediately sets mode
- **Student mode requires access code**: PRESENT -- Access code validated via POST /api/access
- **Dev bypass (NEXT_PUBLIC_DEV_BYPASS=true)**: PRESENT in code but see Security finding below
- **Port 3001 for dev server**: MISSING -- next.config.ts has NO port configuration. Package.json `dev` script is just `next dev` (defaults to port 3000). Only Docker ENV sets port 3001. The plan said "Update chatbot/next.config.ts to set the dev server to port 3001" -- this was not done.
- **.env.example**: PRESENT -- contains all 5 required variables
- **POST /api/access route**: PRESENT and functional
- **Key link: page.tsx -> access.ts via getAccessMode**: BROKEN -- page.tsx never imports access.ts. It imports AccessMode type from types.ts and AccessGate from components. getAccessMode() is orphaned dead code.

### Test Coverage

- validateAccessCode: UNTESTED
- getAccessMode: UNTESTED (also dead code)
- getDemoModuleScope: UNTESTED (also dead code)
- isModuleAccessible: UNTESTED (also dead code)
- POST /api/access: UNTESTED
- ChatRequestSchema: UNTESTED
- brand.ts: UNTESTED
- types.ts: UNTESTED

### Connection Integrity

- page.tsx -> access.ts (getAccessMode): **BROKEN** -- claimed link does not exist
- layout.tsx -> brand.ts (BRAND): **BROKEN** -- layout.tsx never imports brand.ts. CSS custom properties are set in globals.css instead. brand.ts is not imported by ANY component.
- page.tsx -> AccessGate -> /api/access: **CONNECTED** -- works as designed
- globals.css -> layout.tsx: **CONNECTED** -- imported correctly

### Orphans

1. `getAccessMode()` in access.ts -- never called
2. `getDemoModuleScope()` in access.ts -- never called
3. `isModuleAccessible()` in access.ts -- never called (D-03 module scoping NOT enforced)
4. `ChatSession` interface in types.ts -- never imported
5. `LLMProvider` type in types.ts -- never imported (llm module has its own `LLMProviderInterface`)
6. `brand.ts` -- exported BRAND constant is never imported by any file. All styling uses CSS variables from globals.css directly
7. Next.js `--font-syne` CSS variable set by layout.tsx -- never referenced by any component

---

## Plan 05-02: LLM Backend, System Prompt, Session Store

### Claimed Features

- **LLM provider interface (LLMProviderInterface, LLMRequest, LLMResponse, LLMMessage)**: PRESENT -- all types defined in llm/types.ts
- **System prompt with Tutor persona (D-09, D-11)**: PRESENT -- getSystemPrompt encodes personality
- **System prompt contains D-07 redirect text**: PRESENT -- exact text "I'm Tutor, your Sample Academy AI assistant -- I'm best at helping with AI tools and the course material" included
- **System prompt contains bootstrap mode (D-12)**: PRESENT -- BOOTSTRAP_ADDENDUM with "[Source: General AI knowledge -- course content coming soon]"
- **System prompt contains demo mode restriction (D-03)**: PRESENT in prompt text -- but NOT enforced via code (isModuleAccessible never called)
- **ClaudePassthroughProvider**: MISREPRESENTED -- Plan D-08 describes this as "routes questions through Claude Code for answers, no additional API key needed." The implementation is `new Anthropic()` which reads ANTHROPIC_API_KEY from environment. This IS an API key. The "passthrough" name implies no key is needed; in reality it is functionally identical to ApiKeyProvider. Both providers make the exact same Anthropic API call to claude-sonnet-4-20250514.
- **ApiKeyProvider**: PRESENT -- functionally identical to ClaudePassthroughProvider. The only difference: ApiKeyProvider explicitly passes `apiKey: process.env.ANTHROPIC_API_KEY` while ClaudePassthroughProvider lets the SDK find it automatically from env. Same result.
- **getLLMProvider factory**: PRESENT -- switches on LLM_PROVIDER env var
- **SessionStore class**: PRESENT -- create, get, addMessage, getMessages, cleanup all implemented
- **SessionStore singleton**: PRESENT -- `sessionStore` exported
- **30-minute session expiry**: PRESENT in code (maxAge = 30 * 60 * 1000)
- **cleanup() method**: PRESENT but NEVER CALLED -- sessions only expire on individual access via get(). No periodic cleanup. Unbounded memory growth for abandoned sessions.
- **@anthropic-ai/sdk in dependencies**: PRESENT -- v0.96.0

### Test Coverage

- ClaudePassthroughProvider.chat(): UNTESTED
- ApiKeyProvider.chat(): UNTESTED
- getSystemPrompt(): UNTESTED
- getLLMProvider(): UNTESTED
- SessionStore.create(): UNTESTED
- SessionStore.get(): UNTESTED
- SessionStore.addMessage(): UNTESTED
- SessionStore.getMessages(): UNTESTED
- SessionStore.cleanup(): UNTESTED (also dead code)
- parseCitations() [in claude-passthrough.ts]: UNTESTED
- parseCitations() [in api-key.ts]: UNTESTED

### Connection Integrity

- provider.ts -> claude-passthrough.ts (factory): **CONNECTED**
- provider.ts -> api-key.ts (factory): **CONNECTED**
- claude-passthrough.ts -> system-prompt.ts (getSystemPrompt): **CONNECTED**
- api-key.ts -> system-prompt.ts (getSystemPrompt): **CONNECTED**
- session.ts -> llm/types.ts (LLMMessage): **CONNECTED**

### Orphans

1. `parseCitations()` in claude-passthrough.ts -- duplicated code, result discarded by chat route (see Plan 03)
2. `parseCitations()` in api-key.ts -- same duplication, same discard
3. `SessionStore.cleanup()` -- defined but never called from anywhere

---

## Plan 05-03: Chat UI and API Routes

### Claimed Features

- **POST /api/chat route**: PRESENT -- validates input, calls LLM provider, returns response
- **POST /api/session route**: PRESENT -- creates session with access mode
- **ChatInterface component**: PRESENT -- handles message send, session creation, loading state
- **MessageBubble component**: PRESENT -- role-based styling, citation display, timestamps
- **CitationBadge component**: PRESENT -- expandable inline badge with details panel
- **AccessGate component**: PRESENT -- "Try Demo" and "I'm a Student" buttons, code input
- **page.tsx composes AccessGate and ChatInterface**: PRESENT
- **All components use 'use client'**: PRESENT
- **Zod validation on /api/chat**: PRESENT -- ChatRequestSchema.safeParse
- **Error handling (400, 404, 500)**: PRESENT in chat route
- **Session management on mount**: PRESENT -- ChatInterface useEffect creates session
- **Multi-turn conversation**: PRESENT -- session messages passed to LLM
- **Citation parsing**: PRESENT but DUPLICATED (see Critical Findings)
- **Key link: ChatInterface -> /api/chat**: **CONNECTED**
- **Key link: ChatInterface -> /api/session**: **CONNECTED**
- **Key link: chat/route.ts -> getLLMProvider**: **CONNECTED**
- **Key link: chat/route.ts -> sessionStore**: **CONNECTED**
- **Key link: MessageBubble -> CitationBadge**: **CONNECTED**
- **Key link: AccessGate -> /api/access**: **CONNECTED**

### Test Coverage

- POST /api/chat: UNTESTED
- POST /api/session: UNTESTED
- parseCitations() [in chat/route.ts]: UNTESTED
- ChatInterface component: UNTESTED
- MessageBubble component: UNTESTED
- CitationBadge component: UNTESTED
- AccessGate component: UNTESTED
- page.tsx: UNTESTED

### Connection Integrity

- ChatInterface -> /api/chat: **CONNECTED**
- ChatInterface -> /api/session: **CONNECTED**
- chat/route.ts -> getLLMProvider(): **CONNECTED**
- chat/route.ts -> sessionStore: **CONNECTED**
- MessageBubble -> CitationBadge: **CONNECTED**
- AccessGate -> /api/access: **CONNECTED**
- page.tsx -> AccessGate + ChatInterface: **CONNECTED**

### Orphans

1. `parseCitations()` in chat/route.ts -- third copy of the same function, but this is the one whose results are actually used. The provider-level copies compute citations that are thrown away.

---

## Plan 05-04: Docker Containerization

### Claimed Features

- **Dockerfile with node:22-bookworm-slim**: PRESENT
- **Multi-stage build (deps, builder, runner)**: PRESENT
- **Non-root user (nextjs uid 1001)**: PRESENT
- **Standalone output copy**: PRESENT
- **PORT=3001 and HOSTNAME=0.0.0.0**: PRESENT
- **.dockerignore**: PRESENT
- **docker-compose.chatbot.yml at project root**: PRESENT
- **Port mapping 3001:3001**: PRESENT
- **Environment variables passed through**: PRESENT (all 5 vars)
- **next.config.ts output: 'standalone'**: PRESENT

### Test Coverage

- Docker build: UNTESTED (no CI, no build verification committed)
- docker-compose validity: UNTESTED

### Connection Integrity

- docker-compose.chatbot.yml -> chatbot/Dockerfile: **CONNECTED** (build context: ./chatbot)

### Orphans

None in this plan.

---

## Critical Findings

### CF-01: BLOCKER -- "Claude Code Passthrough" is a Lie

**Files:** `chatbot/src/lib/llm/claude-passthrough.ts`, `chatbot/src/lib/llm/api-key.ts`

D-08 states: "Claude Code as passthrough -- routes questions through Claude Code for answers, no additional API key needed." The context document (05-CONTEXT.md line 28) repeats this.

Reality: `ClaudePassthroughProvider` does `new Anthropic()` which reads `ANTHROPIC_API_KEY` from the environment. This is a direct API call requiring a paid Anthropic API key. It is functionally IDENTICAL to `ApiKeyProvider`. The only difference is whether the key is passed explicitly or found via env.

**There is no passthrough. There is no "no API key needed." There are two identical API-key providers with different names.** The entire dual-provider architecture (D-08) is a fiction -- both paths do the exact same thing.

This is not a matter of interpretation. The plan explicitly says "no additional API key needed" and the user_setup block in Plan 05-03 line 25 then contradicts this by requiring ANTHROPIC_API_KEY. The "passthrough" name misleads anyone reading the code into thinking there's a key-free path.

### CF-02: BLOCKER -- Access Control Bypass (Demo User Can Escalate to Student)

**File:** `chatbot/src/app/api/chat/route.ts:46,61`

The chat route reads `accessMode` from the client-submitted JSON body:
```typescript
const { message, sessionId, accessMode } = parsed.data;
```
Then passes it directly to the LLM:
```typescript
const response = await provider.chat({ messages, accessMode });
```

It does NOT verify that `accessMode` matches `session.accessMode`. A demo user can:
1. Create a session with mode "demo" (via /api/session)
2. Send chat requests with `accessMode: "student"` in the body
3. Receive student-level responses (no module scope restriction in system prompt)

The session stores the access mode (set during creation), but the chat route ignores it and trusts the client.

Similarly, `/api/session` accepts `accessMode` from the body with no validation -- anyone can create a "student" session without presenting an access code.

### CF-03: BLOCKER -- Zero Automated Tests

**All files**

There are:
- No test files (*.test.*, *.spec.*, __tests__/)
- No test framework installed (no jest, vitest, mocha in package.json)
- No test scripts in package.json
- No test configuration files

The project's hard rules (CLAUDE.md) state: "TDD approach. Write tests before implementation. Never report 'complete' without tests passing."

STATE.md claims "Phase 1, 3, 5 complete" while Phase 5 has literally 0% test coverage. This is a direct violation of the project's own rules.

Every single function, component, route, and module is UNTESTED.

### CF-04: WARNING -- Module Scoping (D-03) Not Enforced

**File:** `chatbot/src/lib/access.ts:15-22`

D-03 requires: "Demo content is module-scoped and configurable. Demo mode starts with Module 1 content only."

The functions `getDemoModuleScope()` and `isModuleAccessible()` were written to implement this, but they are NEVER CALLED. No code path checks whether a demo user's question is within Module 1 scope. The only "enforcement" is a line in the system prompt asking the LLM to limit itself -- which is a suggestion, not a constraint. The LLM is free to ignore it.

### CF-05: WARNING -- Potential Crash: Unchecked Array Access on LLM Response

**Files:** `chatbot/src/lib/llm/claude-passthrough.ts:29`, `chatbot/src/lib/llm/api-key.ts:30`

```typescript
const content = response.content[0].type === 'text' ? response.content[0].text : '';
```

If the Anthropic API returns an empty `content` array (e.g., on certain error conditions or stop reasons), `response.content[0]` is `undefined` and accessing `.type` throws `TypeError: Cannot read properties of undefined`. No bounds check.

### CF-06: WARNING -- Double Citation Parsing (Wasted Computation + Architecture Confusion)

**Files:** `chatbot/src/lib/llm/claude-passthrough.ts:32-34`, `chatbot/src/lib/llm/api-key.ts:32-38`, `chatbot/src/app/api/chat/route.ts:68`

Citation parsing happens in THREE places:
1. Inside `ClaudePassthroughProvider.chat()` -- result returned in `LLMResponse.citations`
2. Inside `ApiKeyProvider.chat()` -- same
3. Inside `chat/route.ts` POST handler -- parses AGAIN from `response.content`

The chat route discards the provider's parsed citations and re-parses from scratch. Three copies of identical code, two of which produce results that are thrown away.

### CF-07: WARNING -- "cleanContent" is Not Clean

**File:** `chatbot/src/app/api/chat/route.ts:27`

```typescript
return { cleanContent: content, citations };
```

The variable name `cleanContent` implies citation markers like `[Source: Module 1, Lesson 2]` have been stripped from the text. They have not. The raw content including all `[Source: ...]` markers is returned as-is to the client. Users see raw citation syntax in the chat UI.

### CF-08: WARNING -- Session Route Has No JSON Error Handling

**File:** `chatbot/src/app/api/session/route.ts:6`

```typescript
const body = await req.json();
```

No try/catch. If the client sends invalid JSON (or no body), this throws an unhandled error causing a 500 response. The access route (`api/access/route.ts:5`) has the same issue.

### CF-09: WARNING -- Timing Attack on Access Code Validation

**File:** `chatbot/src/lib/access.ts:12`

```typescript
return code === validCode;
```

String comparison using `===` is not constant-time. An attacker can determine the access code character-by-character by measuring response times. Should use `crypto.timingSafeEqual()` with Buffer comparison. Given this is a single shared access code (not per-user), compromising it grants access to all student content.

### CF-10: WARNING -- brand.ts Is Entirely Orphaned

**File:** `chatbot/src/lib/brand.ts`

The `BRAND` constant is exported but never imported by any file. Every component uses CSS variables from `globals.css` directly. This file is dead code that creates the illusion of a "shared brand system" without actually being part of one.

### CF-11: WARNING -- Duplicate Font Loading

**Files:** `chatbot/src/app/layout.tsx:2,8`, `chatbot/src/app/globals.css:1`

The Syne font is loaded twice:
1. `layout.tsx` imports from `next/font/google` (optimized, self-hosted by Next.js), sets CSS variable `--font-syne`
2. `globals.css` imports from Google Fonts CDN via `@import url(...)`, sets CSS variable `--font`

All components use `var(--font)` (the Google Fonts CDN version). The Next.js font optimization is wasted -- it loads the font, generates the CSS variable, but nobody reads `--font-syne`. This results in the font being downloaded twice.

### CF-12: WARNING -- Dev Server Not on Port 3001

**Files:** `chatbot/package.json`, `chatbot/next.config.ts`

Plan 05-01 says: "Update chatbot/next.config.ts to set the dev server to port 3001 (avoid conflict with Remotion on 3000)."

The dev script is `next dev` with no port flag. next.config.ts has no port setting. The dev server runs on default port 3000, conflicting with Remotion. Only the Docker container sets port 3001.

### CF-13: WARNING -- No Summary or Verification Files

**Directory:** `.planning/phases/05-ta-chatbot/`

Each plan specifies an output: "After completion, create `.planning/phases/05-ta-chatbot/05-0X-SUMMARY.md`". None of these files exist. No 05-VERIFICATION.md exists either. STATE.md claims "Phase 1, 3, 5 complete" with no verification artifacts for Phase 5.

### CF-14: WARNING -- Hardcoded Default Access Code in Source

**File:** `chatbot/src/lib/access.ts:11`

```typescript
const validCode = process.env.ACCESS_CODE || 'demo-access-code';
```

If `ACCESS_CODE` env var is not set, the fallback is a hardcoded string in source code that is also committed to `.env.example`. The threat model (T-05-03) says "Store in .env (gitignored), never expose via NEXT_PUBLIC_ prefix; .env.example has placeholder only" -- but `.env.example` contains the actual default code `demo-access-code`, and the source code hardcodes the same value as a fallback. This means the "secret" access code is readable in the public repository.

---

## Summary

| Metric | Count |
|--------|-------|
| Total claimed features (across all 4 plans) | 47 |
| Present and working as described | 28 |
| Partial (exists but incomplete/misleading) | 8 |
| Missing or not implemented | 3 |
| Misrepresented (exists but does not do what was claimed) | 8 |

| Test Coverage | |
|---------------|--|
| Total testable components | 28 |
| Components with automated tests | 0 |
| Test coverage | **0%** |
| Test framework installed | **No** |

| Orphan Structures | |
|-------------------|--|
| Dead functions (defined, never called) | 4 (getAccessMode, getDemoModuleScope, isModuleAccessible, cleanup) |
| Dead types (defined, never imported) | 3 (ChatSession, LLMProvider type, brand.ts BRAND constant) |
| Dead CSS variables | 1 (--font-syne) |
| Duplicated code | 3 copies of parseCitations across 3 files |

### Integrity Assessment

**Phase 5 should NOT have been marked "complete."** The critical issues are:

1. **The "passthrough" provider is a falsehood.** Both LLM providers are the same API-key-based Anthropic call. The architectural distinction in D-08 does not exist in the implementation. Anyone reading "claude-passthrough" would reasonably believe no API key is needed -- that is wrong.

2. **Access control is cosmetic.** A demo user can send `accessMode: "student"` in their request body to bypass restrictions. The session's stored mode is never checked. The module-scoping functions are dead code.

3. **Zero tests in a project that mandates TDD.** The project's CLAUDE.md says "Never report 'complete' without tests passing." There are no tests to pass or fail.

4. **No verification artifacts.** Phase 3 has a 05-VERIFICATION.md proving completion. Phase 5 has nothing -- no summaries, no verification, just a STATE.md entry claiming it's done.

The code that IS present is structurally sound (types are well-defined, components compose correctly, the API routes wire correctly to the LLM provider and session store). The chatbot would likely work end-to-end if you provide an API key. But the gap between what was PROMISED and what was DELIVERED is significant, particularly around the passthrough claim, access control enforcement, and test coverage.

---

_Audited: 2026-05-14_
_Auditor: Claude (integrity audit, Opus 4.6)_
