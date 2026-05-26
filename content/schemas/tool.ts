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
  productId: z.string(),
  surface: z.string(),
  isPrimarySurface: z.boolean(),
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

export interface ProductGroup {
  productId: string;
  productName: string;
  vendor: string;
  primary: Tool;
  surfaces: Tool[];
}

/**
 * Groups tool surfaces into products by `productId`. The product takes its name
 * and vendor from its primary surface, which is listed first. Total (never throws)
 * so it is safe for rendering — integrity is enforced by validateProductInvariant.
 */
export function groupIntoProducts(tools: Tool[]): ProductGroup[] {
  const order: string[] = [];
  const byProduct = new Map<string, Tool[]>();
  for (const t of tools) {
    if (!byProduct.has(t.productId)) {
      byProduct.set(t.productId, []);
      order.push(t.productId);
    }
    byProduct.get(t.productId)!.push(t);
  }
  return order.map((productId) => {
    const surfaces = byProduct.get(productId)!;
    const primary = surfaces.find((s) => s.isPrimarySurface) ?? surfaces[0];
    return {
      productId,
      productName: primary.name,
      vendor: primary.vendor,
      primary,
      surfaces: [primary, ...surfaces.filter((s) => s !== primary)],
    };
  });
}

/** Returns one error string per product that does not have exactly one primary surface. */
export function validateProductInvariant(tools: Tool[]): string[] {
  const byProduct = new Map<string, Tool[]>();
  for (const t of tools) {
    if (!byProduct.has(t.productId)) byProduct.set(t.productId, []);
    byProduct.get(t.productId)!.push(t);
  }
  const errors: string[] = [];
  for (const [productId, surfaces] of byProduct) {
    const primaries = surfaces.filter((s) => s.isPrimarySurface);
    if (primaries.length !== 1) {
      errors.push(
        `product "${productId}" must have exactly one primary surface, found ${primaries.length} (surfaces: ${surfaces.map((s) => s.id).join(', ')})`,
      );
    }
  }
  return errors;
}
