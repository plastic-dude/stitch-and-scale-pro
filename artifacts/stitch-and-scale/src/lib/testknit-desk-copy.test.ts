import { describe, expect, it } from 'vitest';
import { testknitDeskTestersEmptyState } from '@/lib/testknit-desk-copy';

describe('testknit-desk copy — testersEmptyState (CHK-139)', () => {
  const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

  it.each(locales)('renders testersEmptyState for %s', (locale) => {
    expect(testknitDeskTestersEmptyState(locale).trim()).toBeTruthy();
  });

  it('falls back to English for unknown codes', () => {
    expect(testknitDeskTestersEmptyState('xx' as never)).toBe(
      testknitDeskTestersEmptyState('en'),
    );
  });

  it('keeps the English wording verbatim', () => {
    expect(testknitDeskTestersEmptyState('en')).toBe(
      "No testers yet — tap a size button above to add one.",
    );
  });

  it('uses the local language for non-English locales', () => {
    expect(testknitDeskTestersEmptyState('de')).toContain('Tester');
    expect(testknitDeskTestersEmptyState('fr')).toContain('testeur');
    expect(testknitDeskTestersEmptyState('es')).toContain('probadores');
    expect(testknitDeskTestersEmptyState('pt')).toContain('testers');
  });

  it('has no English leftovers in non-English empty states', () => {
    const frags = ['No testers yet', 'tap a size button'];
    for (const locale of locales) {
      if (locale === 'en') continue;
      const text = testknitDeskTestersEmptyState(locale);
      for (const frag of frags) {
        expect(text).not.toContain(frag);
      }
    }
  });
});
