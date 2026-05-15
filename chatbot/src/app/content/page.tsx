import { getAllTools } from '@/lib/content';
import { ContentIndex } from '@/components/ContentIndex';

export default function ContentPage() {
  const tools = getAllTools();

  return <ContentIndex tools={tools} />;
}
