import { describe, expect, it } from 'vitest';
import { inspectPublicationArtifact } from './artifact-inspection';

describe('publication artifact inspection', () => {
  it('blocks an empty rendered artifact', () => {
    const result = inspectPublicationArtifact('');
    expect(result.readyForReview).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'A-001' && issue.severity === 'error')).toBe(true);
  });

  it('accepts a titled structured artifact for review', () => {
    const html = '<title>Pattern</title><h1>Pattern</h1><h2>Gauge</h2><table><tr><th>Size</th></tr></table><img alt="Logo">';
    const result = inspectPublicationArtifact(html);
    expect(result.readyForReview).toBe(true);
    expect(result.headingCount).toBe(2);
    expect(result.tableCount).toBe(1);
    expect(result.imagesMissingAlt).toBe(0);
  });

  it('blocks a cover whose title exceeds the conservative text budget', () => {
    const longTitle = 'An exceptionally long translated-ready pattern title that exceeds the safe cover budget for a single page';
    const result = inspectPublicationArtifact(`<title>${longTitle}</title><h1>${longTitle}</h1><h2>Notes</h2>`);
    expect(result.readyForReview).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'A-007' && issue.severity === 'error')).toBe(true);
  });

  it('applies theme and locale context to the cover budget', () => {
    const title = 'A deliberately long but still plausible title that reaches ninety-five characters for review';
    const craft = inspectPublicationArtifact(`<html lang="en"><title>${title}</title><h1>${title}</h1><h2>Notes</h2>`, { themeId: 'craft', locale: 'en' });
    const minimal = inspectPublicationArtifact(`<html lang="en"><title>${title}</title><h1>${title}</h1><h2>Notes</h2>`, { themeId: 'minimal', locale: 'en' });
    expect(craft.coverBudget).toMatchObject({ themeId: 'craft', locale: 'en', titleRisk: true, status: 'blocked' });
    expect(minimal.coverBudget).toMatchObject({ themeId: 'minimal', locale: 'en', titleRisk: false, status: 'safe' });
  });

  it('tightens the budget for expansion-heavy locales', () => {
    const title = 'A title that is intentionally long enough to expose locale expansion risk';
    const result = inspectPublicationArtifact(`<html lang="de"><title>${title}</title><h1>${title}</h1><h2>Notizen</h2>`, { themeId: 'craft', locale: 'de' });
    expect(result.coverBudget.locale).toBe('de');
    expect(result.coverBudget.titleLimit).toBeLessThan(90);
  });

  it('covers every supported locale and theme in the conservative matrix', () => {
    const short = '<html lang="en"><title>Classic Crew Neck Sweater</title><h1>Classic Crew Neck Sweater</h1><h2>Gauge</h2>';
    const longTitle = 'A deliberately long translated pattern title that should not fit safely on one fixed-height cover page'.padEnd(130, 'x');
    for (const locale of ['en', 'de', 'fr', 'es', 'pt']) {
      for (const themeId of ['minimal', 'luxury', 'craft', 'technical'] as const) {
        expect(inspectPublicationArtifact(short, { themeId, locale }).coverBudget.status, `${locale}/${themeId} short`).toBe('safe');
        expect(inspectPublicationArtifact(`<html lang="${locale}"><title>${longTitle}</title><h1>${longTitle}</h1><h2>Notes</h2>`, { themeId, locale }).coverBudget.status, `${locale}/${themeId} long`).toBe('blocked');
      }
    }
  });

  it('keeps image-alt and pagination findings visible as review issues', () => {
    const result = inspectPublicationArtifact('<h1>Pattern</h1><h2>Notes</h2><img src="logo.png">');
    expect(result.readyForReview).toBe(true);
    expect(result.issues.some((issue) => issue.code === 'A-004' && issue.severity === 'warn')).toBe(true);
    expect(result.issues.some((issue) => issue.code === 'A-006' && issue.severity === 'info')).toBe(true);
  });
});
