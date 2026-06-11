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
  'tool-demo',
  'audit-quadrant',
  'screen-flow',
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
  variant: z.enum(['standard', 'destination']).optional(),
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

export const ToolDemoContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  caption: z.string().optional(),
  tool: z.object({ name: z.string(), logo: z.string().optional() }),
  prompt: z.string(),
  outputs: z
    .array(
      z.object({
        id: z.string(),
        kind: z.enum(['image', 'file', 'slides', 'app', 'text']),
        label: z.string(),
        sub: z.string().optional(),
        badge: z.string().optional(),
      }),
    )
    .min(1)
    .max(3),
});

export const AuditQuadrantContentSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  yAxis: z.object({ top: z.string(), bottom: z.string() }),
  xAxis: z.object({ left: z.string(), right: z.string() }),
  tasks: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        cap: z.string(),
        quadrant: z.enum(['tl', 'tr', 'bl', 'br']),
      }),
    )
    .min(2)
    .max(8),
});

export const ScreenFlowStepSchema = z.object({
  id: z.string(),
  action: z.enum(['click', 'type', 'navigate', 'reveal']),
  target: z.string(),
  typedText: z.string().optional(),
  uiState: z.string(),
  dwell: z.number().min(0.5),
});

export const ScreenFlowContentSchema = z
  .object({
    eyebrow: z.string(),
    title: z.string(),
    caption: z.string().optional(),
    windowTitle: z.string(),
    fidelity: z.enum(['cartoon', 'hybrid']),
    layout: z.enum(['full', 'split']),
    steps: z.array(ScreenFlowStepSchema).min(1).max(8),
    // Optional author-supplied cursor positions: keys match step `target` values,
    // values are { x, y } as percentages (0–100) within the window body.
    // If omitted, cursor is hidden for that step (safe fallback).
    targetPositions: z
      .record(z.string(), z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }))
      .optional(),
  })
  .superRefine((data, ctx) => {
    // typedText is required when action === 'type'
    data.steps.forEach((step, i) => {
      if (step.action === 'type' && !step.typedText) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['steps', i, 'typedText'],
          message: 'typedText is required when action is "type"',
        });
      }
    });
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
  'tool-demo': ToolDemoContentSchema,
  'audit-quadrant': AuditQuadrantContentSchema,
  'screen-flow': ScreenFlowContentSchema,
};

export function getContentSchema(type: SceneType): z.ZodType {
  return SCENE_CONTENT_SCHEMAS[type];
}
