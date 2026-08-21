import { describe, expect, it } from 'vitest';
import { notesNeedSave, normalizedNotes, withNotes } from './notes-persistence';
import type { PatternProject } from './grading-engine';

const project: PatternProject = {
  id: 'notes-regression',
  name: 'Notes regression',
  author: 'Tester',
  baseSize: 'M',
  gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' },
  sections: [],
  createdAt: '2026-08-21T00:00:00.000Z',
  updatedAt: '2026-08-21T00:00:00.000Z',
};

describe('notes persistence seam', () => {
  it('persists a long draft instead of dropping it from the project payload', () => {
    const draft = `${'Worked flat. '.repeat(80)}Block before grading.`;
    const next = withNotes(project, draft);

    expect(next.description).toBe(draft);
    expect(next.id).toBe(project.id);
    expect(next.sections).toBe(project.sections);
  });

  it('trims saved notes and omits an empty description', () => {
    expect(normalizedNotes('  Block generously.  ')).toBe('Block generously.');
    expect(withNotes(project, '   ').description).toBeUndefined();
  });

  it('marks a raw draft dirty until the persisted value matches it', () => {
    expect(notesNeedSave(project, 'New construction notes')).toBe(true);
    expect(notesNeedSave({ ...project, description: 'New construction notes' }, 'New construction notes')).toBe(false);
  });
});
