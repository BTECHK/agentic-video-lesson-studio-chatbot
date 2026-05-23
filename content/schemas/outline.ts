import { z } from 'zod';
import { SceneTypeSchema } from './scene-types';

/**
 * Outline schema (OUTLINE-01) — the codified lesson structure that sits ABOVE the
 * scene layer. A lesson outline is the human-directed source of truth from which the
 * script generator (SCRIPT-01) produces a talk track. Beats reference tools/capabilities
 * by id so generated claims stay grounded in content/tools + content/schemas/capabilities.
 */

export const OutlineBeatSchema = z.object({
  id: z.string(),
  /** One-line description of what this beat teaches / says. */
  summary: z.string(),
  /** Optional suggested scene type — the scene planner may override. */
  sceneTypeHint: SceneTypeSchema.optional(),
  /** Tool ids referenced (must exist in content/tools/*.json). */
  toolRefs: z.array(z.string()).optional(),
  /** Capability category ids referenced (CAPABILITY_CATEGORIES). */
  capabilityRefs: z.array(z.string()).optional(),
});

export const OutlineSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  /** Learning objective for the section (drives script focus). */
  objective: z.string(),
  beats: z.array(OutlineBeatSchema).min(1),
});

export const OutlineInfoSchema = z.object({
  title: z.string(),
  topic: z.string(),
  module: z.string(),
});

export const OutlineMetaSchema = z.object({
  createdAt: z.string(),
  lastUpdated: z.string(),
  authors: z.array(z.string()),
});

export const OutlineSchema = z.object({
  schemaVersion: z.literal('1.0'),
  id: z.string(),
  lesson: OutlineInfoSchema,
  audience: z.string().optional(),
  sections: z.array(OutlineSectionSchema).min(1),
  meta: OutlineMetaSchema,
});

export type OutlineBeat = z.infer<typeof OutlineBeatSchema>;
export type OutlineSection = z.infer<typeof OutlineSectionSchema>;
export type Outline = z.infer<typeof OutlineSchema>;
