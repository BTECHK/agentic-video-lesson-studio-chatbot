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
  priority: "P0" | "P1";
  description: string;
  url: string;
  capabilities: Record<string, ToolCapability>;
  sourceRefs?: string[];
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
