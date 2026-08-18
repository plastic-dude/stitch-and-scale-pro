import { describe, expect, it } from 'vitest';
import {
  createReleaseEvidenceChecklist,
  isReleaseEvidenceChecklist,
  summarizeReleaseEvidence,
  updateReleaseEvidenceItem,
} from './release-evidence';

describe('release evidence checklist', () => {
  it('starts with four explicit not-started evidence items', () => {
    const checklist = createReleaseEvidenceChecklist('project-1', 'rev-1');
    expect(Object.keys(checklist.items)).toHaveLength(4);
    expect(summarizeReleaseEvidence(checklist)).toMatchObject({ total: 4, notStarted: 4, passed: 0, certificationReady: false });
    expect(checklist.sourceRevision).toBe('rev-1');
  });

  it('updates one item without changing the other evidence records', () => {
    const checklist = createReleaseEvidenceChecklist('project-1');
    const next = updateReleaseEvidenceItem(checklist, 'physical-print', { status: 'in-review', note: 'Printed on A4.', evidence: 'print/a4.pdf' });
    expect(next.items['physical-print']).toMatchObject({ status: 'in-review', note: 'Printed on A4.', evidence: 'print/a4.pdf' });
    expect(next.items['test-knit'].status).toBe('not-started');
  });

  it('only reports certification-ready when every evidence item passed', () => {
    let checklist = createReleaseEvidenceChecklist('project-1');
    for (const key of ['physical-print', 'chart-readability', 'schematic-scale', 'test-knit'] as const) checklist = updateReleaseEvidenceItem(checklist, key, { status: 'passed' });
    expect(summarizeReleaseEvidence(checklist)).toMatchObject({ passed: 4, certificationReady: true });
  });

  it('validates project scope and allowed statuses before hydration', () => {
    const checklist = createReleaseEvidenceChecklist('project-1');
    expect(isReleaseEvidenceChecklist(checklist, 'project-1')).toBe(true);
    expect(isReleaseEvidenceChecklist(checklist, 'project-2')).toBe(false);
    expect(isReleaseEvidenceChecklist({ ...checklist, items: { ...checklist.items, 'test-knit': { ...checklist.items['test-knit'], status: 'passed-by-ai' } } }, 'project-1')).toBe(false);
  });
});
