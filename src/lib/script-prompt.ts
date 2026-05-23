import { SCENE_TYPES } from '../../content/schemas/scene-types';
import type { Outline } from '../../content/schemas/outline';
import type { GroundingContext } from './grounding';

/**
 * Builds the script-generation prompt (SCRIPT-01). Following the project's "Claude Code passthrough"
 * design (see ingest:llm / D-02), generation is prompt-only — no paid API call. The CLI writes this
 * prompt; Claude produces a ScriptSchema-valid script.json, which is then fact-checked (SCRIPT-02).
 */

function renderGrounding(grounding: GroundingContext): string {
  const tools = Object.values(grounding.tools)
    .map((t) => `- tool:${t.id} — ${t.name} (${t.vendor}): ${t.description}`)
    .join('\n');

  const caps = Object.values(grounding.capabilities)
    .map((c) => {
      const status = c.supported ? 'SUPPORTED' : 'NOT SUPPORTED';
      const feats = c.subFeatures.length ? ` Features: ${c.subFeatures.join(', ')}.` : '';
      return `- cap:${c.toolId}:${c.category} [${status}] — ${c.summary}${feats}`;
    })
    .join('\n');

  return `TOOLS (reference as tool:<id>):\n${tools}\n\nCAPABILITIES (reference as cap:<id>:<category>):\n${caps}`;
}

export function buildScriptPrompt(
  outline: Outline,
  styleGuide: string,
  grounding: GroundingContext,
): string {
  const beats = outline.sections
    .map((s) => {
      const lines = s.beats
        .map((b) => {
          const hint = b.sceneTypeHint ? ` [suggested scene: ${b.sceneTypeHint}]` : '';
          const refs = [
            ...(b.toolRefs ?? []).map((t) => `tool:${t}`),
            ...(b.capabilityRefs ?? []).map((c) => `(capabilities: ${c})`),
          ].join(' ');
          return `  - beat ${b.id}${hint}: ${b.summary}${refs ? `\n    refs: ${refs}` : ''}`;
        })
        .join('\n');
      return `SECTION ${s.id} — "${s.title}"\n  objective: ${s.objective}\n${lines}`;
    })
    .join('\n\n');

  return `You are generating a narrated lesson script for Sample Academy in the voice of the Course Instructor.

# Voice & style (follow exactly)
${styleGuide}

# Grounding facts (the ONLY source of truth for tool claims)
Every factual claim about a tool's capability MUST come from the records below. Do not assert any
capability not listed. When you make a tool/capability claim in a block, list the corresponding
ref(s) in that block's contentRefs. If a capability is marked NOT SUPPORTED, you may still teach it
as a limitation, but phrase it as a limitation.

${renderGrounding(grounding)}

# Outline to script
Produce one script block per beat (you may split a beat into multiple blocks if the teaching needs
it, keeping sectionId/beatId). Honor the suggested scene type unless a different one in the allowed
list teaches the beat better.

Allowed sceneType values: ${SCENE_TYPES.join(', ')}

${beats}

# Output format
Return ONLY valid JSON matching this shape (no prose, no markdown fence):
{
  "schemaVersion": "1.0",
  "lessonId": "${outline.id}",
  "blocks": [
    {
      "id": "<unique block id>",
      "sectionId": "<section id>",
      "beatId": "<beat id>",
      "sceneType": "<one of the allowed values>",
      "narration": "<the talk track in Instructor's voice — what the instructor SAYS over this scene>",
      "contentRefs": ["tool:claude", "cap:claude:writing-chat"],
      "emphasisWords": ["optional", "words to emphasize"]
    }
  ],
  "meta": { "generatedAt": "<ISO date>", "styleSource": "content/teaching/STYLE.md", "generator": "claude-code-passthrough" }
}

# Rules
- Narration is spoken word for video: ~140-160 WPM pace, one idea per sentence where possible.
- Drop live-workshop mechanics (polls, chat prompts, filler words).
- Keep the instructor's warmth, plain language, and honest caveats.
- Only include contentRefs you actually reference in the narration; every ref must resolve to a
  record above (the fact-check gate will reject unresolved refs).`;
}
