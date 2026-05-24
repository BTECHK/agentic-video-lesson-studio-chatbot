import { getOutlineSummary } from '@/lib/generate-source';
import { listLessonIds } from '@/lib/lesson-timeline';
import { GeneratePanel } from '@/components/studio/GeneratePanel';

// Reads draft existence live each request.
export const dynamic = 'force-dynamic';

/** Studio · Generate — draft a fact-checked script from a lesson's outline (Studio Generate). */
export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { lesson: requested } = await searchParams;
  const ids = listLessonIds();
  const lessonId = requested && ids.includes(requested) ? requested : ids[0] ?? 'module-1';
  const outline = getOutlineSummary(lessonId);

  if (!outline) {
    return (
      <main style={{ padding: '3rem 1.5rem', fontFamily: 'var(--font)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Generate</h1>
        <p style={{ color: 'var(--text-muted)' }}>No lesson with an outline found.</p>
      </main>
    );
  }

  const applyEnabled = process.env.REGEN_TRIGGER_ENABLED === 'true';
  return <GeneratePanel outline={outline} applyEnabled={applyEnabled} />;
}
