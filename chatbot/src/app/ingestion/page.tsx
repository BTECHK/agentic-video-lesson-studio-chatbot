import { getIngestionPanelData } from '@/lib/ingestion-panel';
import { IngestionPanel } from '@/components/IngestionPanel';

// Freshness is read live from the ingest logs on each request.
export const dynamic = 'force-dynamic';

/** Ingestion Control Panel — data freshness, schedule status, manual refresh (Phase 8.5). */
export default function IngestionPage() {
  const data = getIngestionPanelData();
  return <IngestionPanel data={data} />;
}
