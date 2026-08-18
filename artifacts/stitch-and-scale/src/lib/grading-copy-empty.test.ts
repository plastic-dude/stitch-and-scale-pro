import { describe, expect, it } from 'vitest';
import { getGradingCopy } from '@/lib/grading-copy';

describe('grading copy — gradingEmptyState (CHK-139)', () => {
  const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

  it.each(locales)('renders gradingEmptyState for %s', (locale) => {
    const copy = getGradingCopy(locale);
    expect(copy.gradingEmptyState.trim()).toBeTruthy();
    expect(copy.gradingEmptyState.length).toBeGreaterThan(20);
  });

  it('uses English for unknown locale codes', () => {
    expect(getGradingCopy('xx' as never).gradingEmptyState).toBe(
      getGradingCopy('en').gradingEmptyState,
    );
  });

  it('keeps the English wording verbatim', () => {
    const en = getGradingCopy('en').gradingEmptyState;
    expect(en).toBe(
      'No grading data available yet. Return to the project workspace to add sections and measurements.',
    );
  });

  it('uses the local language for non-English locales', () => {
    expect(getGradingCopy('de').gradingEmptyState).toContain('Abschnitte');
    expect(getGradingCopy('fr').gradingEmptyState).toContain('gradation');
    expect(getGradingCopy('es').gradingEmptyState).toContain('gradación');
    expect(getGradingCopy('pt').gradingEmptyState).toContain('graduação');
  });

  it('has no English leftovers in non-English empty states', () => {
    const englishSentences = [
      'No grading data available',
      'Return to the project workspace',
      'add sections and measurements',
    ];
    for (const locale of locales) {
      if (locale === 'en') continue;
      const text = getGradingCopy(locale).gradingEmptyState;
      for (const frag of englishSentences) {
        expect(text).not.toContain(frag);
      }
    }
  });
});
