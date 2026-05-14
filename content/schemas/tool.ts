import { z } from 'zod';
import { CapabilityCategorySchema } from './capabilities';

export const SubFeatureSchema = z.object({
  name: z.string(),
  description: z.string(),
  availableOn: z.array(z.string()).optional(),
});

export const VersionHistoryEntrySchema = z.object({
  version: z.string(),
  date: z.string(),
  changes: z.string(),
});

export const CapabilityEntrySchema = z.object({
  category: CapabilityCategorySchema,
  supported: z.boolean(),
  summary: z.string(),
  subFeatures: z.array(SubFeatureSchema).min(1),
  limitations: z.array(z.string()),
  pricingTiers: z.array(
    z.object({
      tier: z.string(),
      details: z.string(),
    }),
  ),
  versionHistory: z.array(VersionHistoryEntrySchema),
});

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  vendor: z.string(),
  priority: z.enum(['P0', 'P1']),
  description: z.string(),
  url: z.string().url(),
  capabilities: z.record(CapabilityCategorySchema, CapabilityEntrySchema),
  sourceRefs: z.array(z.string()),
});

export type SubFeature = z.infer<typeof SubFeatureSchema>;
export type VersionHistoryEntry = z.infer<typeof VersionHistoryEntrySchema>;
export type CapabilityEntry = z.infer<typeof CapabilityEntrySchema>;
export type Tool = z.infer<typeof ToolSchema>;
