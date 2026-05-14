# Phase 5: TA Chatbot - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-13
**Phase:** 05-ta-chatbot
**Areas discussed:** Access & audience, Conversation boundaries, Chatbot personality

---

## Access & Audience

### Who should be able to use the chatbot?

| Option | Description | Selected |
|--------|-------------|----------|
| Open to anyone | No login required. Great for stakeholder demos, marketing. | |
| Enrolled students only | Requires Teachable enrollment or login. | |
| Open with limits | Anyone can try, enrolled students get unlimited. | |

**User's choice:** Other — Feature flag with demo version (open) and student version (auth-protected). Wanted both options available.
**Notes:** User was unsure whether a code or full login was needed. Requested research on real-world patterns.

### How should students prove access?

| Option | Description | Selected |
|--------|-------------|----------|
| Access code | Instructor shares a code with enrolled students via Teachable. No user accounts. | ✓ |
| Email magic link | Students enter email, get a sign-in link. Per-student identity. | |
| You decide | Claude picks simplest approach. | |

**User's choice:** Access code, with a dev bypass mechanism for testing
**Notes:** User flagged that relying on the code to get in can be an issue during development. Wants env var or URL param to bypass during testing.

### What's different between demo mode and student mode?

| Option | Description | Selected |
|--------|-------------|----------|
| Message limit only | Demo gets 5-10 messages. Students unlimited. Same chatbot. | |
| Scoped content | Demo only accesses Module 1. Students access everything. | |
| Same experience | No functional difference — access code is just a gate. | |

**User's choice:** Other — Dynamic settings on demo scope. Module-scoped to start, configurable up or down.
**Notes:** User wants the demo content scope to be a configuration setting, not hard-coded.

---

## Conversation Boundaries

### Out-of-scope question handling

| Option | Description | Selected |
|--------|-------------|----------|
| Strict course-only | Only answers from content repo. Hard boundary. | |
| Course-first, then general | Tries course content first, falls back to general LLM knowledge (labeled). | |
| Course-only with redirect | Only course content, but suggests where to find the answer elsewhere. | |

**User's choice:** Course-first with redirects
**Notes:** Hybrid of options 2 and 3 — course content first, then redirect to specific vendor docs. No generic LLM answers.

### Practical task help

| Option | Description | Selected |
|--------|-------------|----------|
| Knowledge + practical help | Answers questions AND helps with tasks (prompt writing, tool setup). | ✓ |
| Knowledge only | Only factual questions about AI tools from the course. | |
| You decide | Claude determines the right balance. | |

**User's choice:** Knowledge + practical help
**Notes:** None — straightforward selection.

### Conversation memory

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-turn within session | Remembers prior messages. Session resets on tab close. | ✓ |
| Single-turn Q&A | Each question independent. No memory. | |
| You decide | Claude picks for v1. | |

**User's choice:** Multi-turn within session
**Notes:** None — straightforward selection.

### Off-topic handling

| Option | Description | Selected |
|--------|-------------|----------|
| Gentle redirect | Politely declines, redirects to AI topics. | ✓ |
| Strict refusal | Hard boundary, no engagement. | |
| You decide | Claude determines boundary handling. | |

**User's choice:** Gentle redirect
**Notes:** User added additional context: sessions should persist within a session and save a memory. Follow standard RAG chatbot architecture. Also specified dual LLM backend requirement — Claude Code passthrough AND API key fallback, both programmed in from the start.

---

## Chatbot Personality

### Tone

| Option | Description | Selected |
|--------|-------------|----------|
| Friendly tutoring voice | Friendly, clear, encouraging. Like a knowledgeable friend. | ✓ |
| Formal academic TA | Structured, thorough. Professionally distant. | |
| Casual peer coach | Very conversational, colloquial. Low barrier. | |
| You decide | Claude picks the voice. | |

**User's choice:** Friendly tutoring voice
**Notes:** None — aligns with established brand voice.

### Citation display

| Option | Description | Selected |
|--------|-------------|----------|
| Inline with expandable details | Clickable references within text, expand to show full source. | ✓ |
| Footer references | Clean text, sources listed at bottom. Academic style. | |
| You decide | Claude picks the citation style. | |

**User's choice:** Inline with expandable details
**Notes:** None — clean reading experience with detail on demand.

### Chatbot identity

| Option | Description | Selected |
|--------|-------------|----------|
| Named TA persona | Give chatbot a name, introduces itself. Memorable and personal. | ✓ |
| Unnamed assistant | No persona name. Brand-forward, professional. | |
| You decide | Claude picks what fits the brand. | |

**User's choice:** Named TA persona — "Tutor"
**Notes:** User chose the name "Tutor".

---

## Claude's Discretion

- RAG architecture and vector store implementation
- Frontend framework and component library choice
- Chat UI layout and responsive design
- Session storage and memory implementation
- API route design and error handling
- Deployment configuration

## Deferred Ideas

None — discussion stayed within phase scope
