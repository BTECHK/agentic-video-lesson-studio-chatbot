import { getAllTools } from '@/lib/content';
import { ComparisonPage } from '@/components/ComparisonPage';

export default function ComparePage() {
  const tools = getAllTools();

  return <ComparisonPage tools={tools} />;
}
