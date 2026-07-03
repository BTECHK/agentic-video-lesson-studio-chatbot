import Link from 'next/link';
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
    // Two distinct empty states: no lessons exist at all, vs. this specific
    // lesson exists but predates the outline-based generate flow (it was
    // authored directly as a scene contract — lesson.json, no outline.json).
    const lessonExists = ids.includes(lessonId);
    return (
      <main style={{ padding: '3rem 1.5rem', fontFamily: 'var(--font)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Generate</h1>
        {lessonExists ? (
          <p style={{ color: 'var(--text-muted)' }}>
            <strong>{lessonId}</strong> has no outline to generate a script from — it was authored
            directly via the scene-contract pipeline (<code>lesson.json</code>), not the
            outline/script flow. View its content in the{' '}
            <Link href={`/studio?lesson=${encodeURIComponent(lessonId)}`}>Studio timeline</Link>{' '}
            instead.
          </p>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No lesson with an outline found.</p>
        )}
      </main>
    );
  }

  const applyEnabled = process.env.REGEN_TRIGGER_ENABLED === 'true';
  return <GeneratePanel outline={outline} applyEnabled={applyEnabled} />;
}
