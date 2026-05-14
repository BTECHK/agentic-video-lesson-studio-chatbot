import { z } from 'zod';

export const SCENE_TYPES = [
  'cover',
  'journey-map',
  'comparison-chats',
  'tool-card-reveal',
  'capability-table',
  'setup-checklist',
  'feature-grid',
  'voice-demo',
  'recap-grid',
  'preview-band',
  'demo-cue',
  'dig-deeper',
  'assignment-list',
  'quote-card',
] as const;

export const SceneTypeSchema = z.enum(SCENE_TYPES);
export type SceneType = z.infer<typeof SceneTypeSchema>;

// --- Per-scene content schemas from 03-scene-catalog.md ---

export const CoverContentSchema = z.object({
  eyebrow: z.string(),
  title: z.array(z.string()),
  sub: z.string(),
  stats: z
    .array(
      z.object({
        id: z.string(),
        value: z.number(),
        suffix: z.string().optional(),
        label: z.string(),
      }),
    )
    .optional(),
});

export const JourneyMapContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  sub: z.string(),
  stops: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      title: z.string(),
      state: z.enum(['done', 'active', 'todo']),
    }),
  ),
});

export const ComparisonChatsContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  caption: z.string().optional(),
  prompt: z.string(),
  tools: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      logo: z.string(),
      response: z.string(),
    }),
  ),
  tether: z.boolean().optional(),
});

export const ToolCardRevealContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  sub: z.string(),
  tools: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      logo: z.string(),
      tag: z.string(),
      oneliner: z.string(),
    }),
  ),
});

export const CapabilityTableContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  footnote: z.string().optional(),
  headers: z.array(z.string()),
  rows: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      cells: z.array(z.enum(['B', 'Y', 'L', '-'])),
    }),
  ),
});

export const SetupChecklistContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  sub: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      why: z.string(),
      activateAt: z.number(),
    }),
  ),
  cursor: z.boolean().optional(),
});

export const FeatureGridContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  features: z.array(
    z.object({
      id: z.string(),
      n: z.string(),
      cat: z.string(),
      title: z.string(),
      sub: z.string(),
      focusAt: z.number(),
    }),
  ),
});

export const VoiceDemoContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  sub: z.string(),
  transcript: z.string(),
  transcriptLabel: z.string(),
});

export const RecapGridContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  cards: z.array(
    z.object({
      id: z.string(),
      n: z.string(),
      title: z.string(),
      body: z.string(),
    }),
  ),
  preview: z
    .object({
      eyebrow: z.string(),
      title: z.string(),
    })
    .optional(),
});

export const PreviewBandContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
});

export const DemoCueContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  sub: z.string(),
  meta: z.array(
    z.object({
      id: z.string(),
      k: z.string(),
      v: z.string(),
    }),
  ),
});

export const DigDeeperContentSchema = z.object({});

export const AssignmentListContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  sub: z.string(),
  tasks: z.array(
    z.object({
      id: z.string(),
      bold: z.string(),
      context: z.string(),
    }),
  ),
  callout: z
    .object({
      label: z.string(),
      body: z.string(),
    })
    .optional(),
});

export const QuoteCardContentSchema = z.object({
  eyebrow: z.string(),
  quote: z.string(),
  attribution: z.string(),
});

/** Map scene type string to its content schema */
export const SCENE_CONTENT_SCHEMAS: Record<SceneType, z.ZodType> = {
  'cover': CoverContentSchema,
  'journey-map': JourneyMapContentSchema,
  'comparison-chats': ComparisonChatsContentSchema,
  'tool-card-reveal': ToolCardRevealContentSchema,
  'capability-table': CapabilityTableContentSchema,
  'setup-checklist': SetupChecklistContentSchema,
  'feature-grid': FeatureGridContentSchema,
  'voice-demo': VoiceDemoContentSchema,
  'recap-grid': RecapGridContentSchema,
  'preview-band': PreviewBandContentSchema,
  'demo-cue': DemoCueContentSchema,
  'dig-deeper': DigDeeperContentSchema,
  'assignment-list': AssignmentListContentSchema,
  'quote-card': QuoteCardContentSchema,
};

export function getContentSchema(type: SceneType): z.ZodType {
  return SCENE_CONTENT_SCHEMAS[type];
}
