import fs from 'node:fs';
import path from 'node:path';
import { ToolSchema, type Tool } from '../../content/schemas/index';
import type { Outline } from '../../content/schemas/outline';

/**
 * Grounding context (SCRIPT-02 support) — loads the codified facts referenced by an outline so
 * the script generator can only assert real, sourced capabilities and the fact-check gate can
 * verify every claim. The fact source is content/tools/*.json (Zod-validated on load).
 */

export interface GroundingTool {
  id: string;
  name: string;
  vendor: string;
  description: string;
  url: string;
}

export interface GroundingCapability {
  toolId: string;
  toolName: string;
  category: string;
  supported: boolean;
  summary: string;
  subFeatures: string[];
  limitations: string[];
}

export interface GroundingContext {
  tools: Record<string, GroundingTool>;
  /** keyed by `${toolId}:${category}` */
  capabilities: Record<string, GroundingCapability>;
}

const DEFAULT_TOOLS_DIR = path.join(import.meta.dirname, '..', '..', 'content', 'tools');

function loadTool(toolId: string, toolsDir: string): Tool {
  const file = path.join(toolsDir, `${toolId}.json`);
  const raw = fs.readFileSync(file, 'utf-8');
  const parsed = ToolSchema.parse(JSON.parse(raw));
  return parsed;
}

/**
 * Build a grounding context for an outline: every tool referenced (toolRefs), and every
 * (tool × capability) pair implied by the beats' toolRefs + capabilityRefs.
 */
export function buildGroundingContext(
  outline: Outline,
  toolsDir: string = DEFAULT_TOOLS_DIR,
): GroundingContext {
  const tools: Record<string, GroundingTool> = {};
  const capabilities: Record<string, GroundingCapability> = {};
  const cache = new Map<string, Tool>();

  const getTool = (id: string): Tool => {
    let t = cache.get(id);
    if (!t) {
      t = loadTool(id, toolsDir);
      cache.set(id, t);
    }
    return t;
  };

  for (const section of outline.sections) {
    for (const beat of section.beats) {
      const toolRefs = beat.toolRefs ?? [];
      const capRefs = beat.capabilityRefs ?? [];

      for (const toolId of toolRefs) {
        const tool = getTool(toolId);
        tools[toolId] = {
          id: tool.id,
          name: tool.name,
          vendor: tool.vendor,
          description: tool.description,
          url: tool.url,
        };

        for (const category of capRefs) {
          const cap = (tool.capabilities as Record<string, unknown>)[category] as
            | {
                supported: boolean;
                summary: string;
                subFeatures: { name: string }[];
                limitations: string[];
              }
            | undefined;
          if (!cap) continue; // tool may not declare this category; skip silently
          capabilities[`${toolId}:${category}`] = {
            toolId,
            toolName: tool.name,
            category,
            supported: cap.supported,
            summary: cap.summary,
            subFeatures: cap.subFeatures.map((f) => f.name),
            limitations: cap.limitations,
          };
        }
      }
    }
  }

  return { tools, capabilities };
}
