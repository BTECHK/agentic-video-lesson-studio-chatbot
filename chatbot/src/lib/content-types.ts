export interface ToolSubFeature {
  name: string;
  description: string;
  availableOn?: string[];
}

export interface ToolCapability {
  category: string;
  supported: boolean;
  summary: string;
  subFeatures: ToolSubFeature[];
  limitations: string[];
  pricingTiers: Array<{ tier: string; details: string }>;
  versionHistory: Array<{ version: string; date: string; changes: string }>;
}

export interface ToolData {
  id: string;
  name: string;
  vendor: string;
  productId: string;
  surface: string;
  isPrimarySurface: boolean;
  priority: "P0" | "P1";
  description: string;
  url: string;
  capabilities: Record<string, ToolCapability>;
  sourceRefs?: string[];
}

export interface ProductGroup {
  productId: string;
  productName: string;
  vendor: string;
  primary: ToolData;
  surfaces: ToolData[];
}

/**
 * Groups tool surfaces into products by `productId`, for rendering surfaces
 * (e.g. Codex, Claude Code, Cowork, Comet) under their parent product instead
 * of as peers. The product takes its name/vendor from its primary surface,
 * which is listed first.
 */
export function groupIntoProducts(tools: ToolData[]): ProductGroup[] {
  const order: string[] = [];
  const byProduct = new Map<string, ToolData[]>();
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

export interface SourceEntry {
  id: string;
  url: string;
  title: string;
}

export interface VendorSources {
  vendor: string;
  sources: SourceEntry[];
}

export function getCapabilityCount(tool: ToolData): {
  supported: number;
  total: number;
} {
  const caps = Object.values(tool.capabilities);
  return {
    supported: caps.filter((c) => c.supported).length,
    total: caps.length,
  };
}
