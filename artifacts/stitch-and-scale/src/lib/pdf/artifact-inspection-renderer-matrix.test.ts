import { describe, expect, it } from 'vitest';
import { gradePattern } from '@/lib/grading-engine';
import { SAMPLE_CREW_NECK_SWEATER } from '@/lib/sample-projects';
import { renderDocument } from './renderer';
import { resolveTheme } from './themes';
import { inspectPublicationArtifact } from './artifact-inspection';

const LOCALES = ['en', 'de', 'fr', 'es', 'pt'] as const;
const THEMES = ['minimal', 'luxury', 'craft', 'technical'] as const;
const SAMPLE_GRADING = gradePattern(SAMPLE_CREW_NECK_SWEATER);

function renderFixture(locale: string, themeId: (typeof THEMES)[number], longText: boolean): string {
  const pattern = longText
    ? { ...SAMPLE_CREW_NECK_SWEATER, name: 'A deliberately long translated pattern title that should not fit safely on one fixed-height cover page'.padEnd(130, 'x'), description: 'A long designer-authored cover note. '.repeat(35) }
    : SAMPLE_CREW_NECK_SWEATER;
  return renderDocument({ theme: resolveTheme(themeId), pattern, gradingResult: SAMPLE_GRADING, locale, templateId: themeId });
}

describe('production renderer to artifact A-007 matrix', () => {
  it('keeps the representative production cover safe across all 20 locale-theme cells', () => {
    for (const locale of LOCALES) {
      for (const themeId of THEMES) {
        const html = renderFixture(locale, themeId, false);
        const inspection = inspectPublicationArtifact(html, { themeId, locale });
        expect(inspection.coverBudget.status, `${locale}/${themeId}`).toBe('safe');
        expect(inspection.readyForReview, `${locale}/${themeId}`).toBe(true);
      }
    }
  });

  it('blocks the actual production cover for long title content in all 20 cells', () => {
    for (const locale of LOCALES) {
      for (const themeId of THEMES) {
        const html = renderFixture(locale, themeId, true);
        const inspection = inspectPublicationArtifact(html, { themeId, locale });
        expect(inspection.coverBudget.status, `${locale}/${themeId}`).toBe('blocked');
        expect(inspection.issues.some((issue) => issue.code === 'A-007' && issue.severity === 'error'), `${locale}/${themeId}`).toBe(true);
      }
    }
  });
});
