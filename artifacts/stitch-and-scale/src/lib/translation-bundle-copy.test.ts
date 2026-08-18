import { describe, expect, it } from 'vitest';
import { translationBundlePartnersEmptyState } from '@/lib/translation-bundle-copy';

describe('translation-bundle copy — partnersEmptyState (CHK-139)', () => {
  const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

  it.each(locales)('renders partnersEmptyState for %s', (locale) => {
    expect(translationBundlePartnersEmptyState(locale).trim()).toBeTruthy();
  });

  it('falls back to English for unknown codes', () => {
    expect(translationBundlePartnersEmptyState('xx' as never)).toBe(
      translationBundlePartnersEmptyState('en'),
    );
  });

  it('keeps the English wording verbatim', () => {
    expect(translationBundlePartnersEmptyState('en')).toBe(
      "No partners added yet — the bundle is modeled with your pattern alone. Add the patterns your coalition organiser or fellow designers bring, and the split math becomes the coalition math instead of a guess.",
    );
  });

  it('uses the local language for non-English locales', () => {
    expect(translationBundlePartnersEmptyState('de')).toContain('Partner');
    expect(translationBundlePartnersEmptyState('fr')).toContain('partenaire');
    expect(translationBundlePartnersEmptyState('es')).toContain('socios');
    expect(translationBundlePartnersEmptyState('pt')).toContain('parceiros');
  });

  it('has no English leftovers in non-English empty states', () => {
    const frags = ['No partners added yet', 'coalition organiser', 'instead of a guess'];
    for (const locale of locales) {
      if (locale === 'en') continue;
      const text = translationBundlePartnersEmptyState(locale);
      for (const frag of frags) {
        expect(text).not.toContain(frag);
      }
    }
  });
});
