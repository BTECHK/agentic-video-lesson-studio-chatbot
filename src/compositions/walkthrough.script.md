# Platform Walkthrough — Narration Script (v-next, 78s cut)

Companion to `PlatformWalkthrough.tsx` (2340 frames @ 30fps, hard cap 1:20).
Basic VO script for the platform as a whole with quick highlights — written to
be read at a relaxed ~140 wpm so each line lands inside its scene. No VO track
is mixed in yet (music bed only); this is the recording/TTS-ready draft.

| Time | Scene | Narration |
|------|-------|-----------|
| 0:00–0:07 | Title card | This is Sample Academy — a demo platform that renders video lessons from structured outlines. |
| 0:07–0:14 | Chat (Q1) | At the center is Tutor, your AI teaching assistant. Ask anything about the tools we teach, and Tutor answers from a curated, always-current knowledge base — with sources. |
| 0:14–0:20 | Chat (Q2) | Follow-up questions keep their context, so learning feels like a conversation, not a search box. |
| 0:20–0:28 | Telegram companion | And Tutor isn't locked to the platform. Instructors and students can message the same assistant on Telegram — same brain, same sources, wherever you already are. |
| 0:29–0:37 | Content viewer | The AI Tools Repository tracks the tools that matter — filter by capability, drill into any tool, and see exactly what it can do. |
| 0:37–0:45 | Content detail | Every capability is mapped and kept up to date, so the curriculum always reflects the tools as they are today — not as they were last quarter. |
| 0:45–0:55 | Comparison view | Need to choose a tool? Compare them side by side — live benchmarks, pricing, context windows — and get an editorial pick for the job at hand. |
| 0:55–1:01 | Comparison payoff | The comparison view shows tool metrics side by side. |
| 1:01–1:13 | Feature highlights | Under the hood, the platform keeps itself honest. Tool facts are re-verified against official vendor documentation, and every lesson passes five automated quality gates — accuracy, teaching, watchability, layout, and timing — before it ships. |
| 1:13–1:18 | Outro | Sample Academy. Outline in, finished lesson out. |

**Word count:** ~185 words · ~78s at 140 wpm — fits the cut with breathing room.

## Notes

- The Telegram beat's claim is faithful to the shipped bot: free-text Q&A with
  `Sources:` citations, open to anyone (instructors and students alike). No
  digests/notifications are claimed because the bot has none.
- "Five automated quality gates" = Gate A·B·C·L·T as badged in FeatureHighlights.
- Facts (1M context, benchmarks) mirror the fact-checked `ComparisonView` data.
