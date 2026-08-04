import { describe, it, expect } from 'vitest';
import { corpusLessonIds, ledgerRow } from '../src/lib/corpus-ledger';

describe('corpusLessonIds', () => {
  it('includes topic + bonus lessons, excludes working dirs, tracks usecases separately', () => {
    const dirs = [
      '_scene-preview',
      'module-1',
      'sizzle-1',
      'screenflow-smoke',
      'topic-1-lesson-1',
      'topic-1-lesson-2',
      'bonus-1',
      'bonus-intro',
      'usecase-sample',
    ];
    const { corpus, extra } = corpusLessonIds(dirs);
    expect(corpus).toEqual(['topic-1-lesson-1', 'topic-1-lesson-2', 'bonus-1', 'bonus-intro']);
    expect(extra).toEqual(['usecase-sample']);
  });

  it('sorts lesson 10 after lesson 9 (numeric)', () => {
    const { corpus } = corpusLessonIds(['topic-7-lesson-10', 'topic-7-lesson-2', 'topic-7-lesson-9']);
    expect(corpus).toEqual(['topic-7-lesson-2', 'topic-7-lesson-9', 'topic-7-lesson-10']);
  });
});

describe('ledgerRow', () => {
  it('renders every gate state and the verdict', () => {
    const row = ledgerRow({
      id: 'topic-1-lesson-1',
      gates: [
        { gate: 'A', state: 'pass' },
        { gate: 'B', state: 'fix' },
        { gate: 'C', state: 'missing' },
        { gate: 'L', state: 'pass' },
        { gate: 'T', state: 'pass' },
      ],
      ok: false,
    });
    expect(row).toContain('A✓');
    expect(row).toContain('B✗');
    expect(row).toContain('C—');
    expect(row).toContain('NOT GREEN');
  });
});
