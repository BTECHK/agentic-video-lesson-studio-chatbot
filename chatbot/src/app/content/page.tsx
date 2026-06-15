import { getAllTools } from '@/lib/content';
import { getIngestionPanelData } from '@/lib/ingestion-panel';
import { ContentIndex, type VendorFreshnessMap } from '@/components/ContentIndex';

export default function ContentPage() {
  const tools = getAllTools();
  const panel = getIngestionPanelData();

  // Key freshness by the tool's display vendor name. Config vendor keys are
  // lowercase ids ("Perplexity AI" -> "perplexity", "Alibaba Cloud" -> "alibaba"),
  // so match on the normalized name or its leading segment. A vendor skipped in
  // the latest ingest run was not refreshed — surface it at stale severity.
  const vendorFreshness: VendorFreshnessMap = {};
  for (const tool of tools) {
    if (vendorFreshness[tool.vendor]) continue;
    const norm = tool.vendor.toLowerCase().replace(/\s+/g, '-');
    const row = panel.vendors.find((v) => norm === v.vendor || norm.startsWith(`${v.vendor}-`));
    if (row) {
      vendorFreshness[tool.vendor] = {
        level: row.skipped ? 'stale' : row.freshness,
        skipped: row.skipped,
      };
    }
  }

  return <ContentIndex tools={tools} vendorFreshness={vendorFreshness} />;
}
