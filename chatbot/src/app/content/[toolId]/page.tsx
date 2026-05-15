import { notFound } from 'next/navigation';
import { getToolById, getAllTools, getSourcesForVendor } from '@/lib/content';
import { ToolDetail } from '@/components/ToolDetail';

export function generateStaticParams() {
  return getAllTools().map((tool) => ({ toolId: tool.id }));
}

export default async function ToolPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  const tool = getToolById(toolId);
  if (!tool) notFound();

  const vendorId = tool.vendor.toLowerCase().replace(/\s+/g, '-');
  const vendorSources = getSourcesForVendor(vendorId);
  const sources = vendorSources?.sources ?? [];

  return <ToolDetail tool={tool} sources={sources} />;
}
