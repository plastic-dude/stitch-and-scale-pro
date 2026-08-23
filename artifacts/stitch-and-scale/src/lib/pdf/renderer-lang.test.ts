// CHK-122 regression — the PDF renderer used to emit <html lang="en"> for
// every export regardless of the document locale, a silent localization lie
// (screen readers / print pipelines treat de/fr/es/pt content as English).
// These tests pin the fixed behaviour.
import { describe, expect, it } from 'vitest';
import { resolveTheme } from '@/lib/pdf/themes';
import { PDF_RENDERER_VERSION, renderDocument } from '@/lib/pdf/renderer';
import { gradePattern } from '@/lib/grading-engine';
import { getInitialLanguage, isValidLanguageCode, LANGUAGE_OPTIONS } from '@/lib/i18n';
import { SAMPLE_CREW_NECK_SWEATER } from '@/lib/sample-projects';

const GRADING = gradePattern(SAMPLE_CREW_NECK_SWEATER);

function renderWith(locale: string | undefined): string {
  return renderDocument({
    theme: resolveTheme('minimal'),
    pattern: SAMPLE_CREW_NECK_SWEATER,
    gradingResult: GRADING,
    locale,
  });
}

describe('renderDocument html lang (CHK-122)', () => {
  it('defaults to lang="en" when no locale is provided', () => {
    expect(renderWith(undefined)).toContain('<html lang="en">');
  });

  it('uses the provided locale verbatim for supported codes', () => {
    for (const { code } of LANGUAGE_OPTIONS) {
      expect(renderWith(code)).toContain(`<html lang="${code}">`);
    }
  });

  it('clamps unsupported / garbage locale values to "en"', () => {
    for (const bad of ['zz', 'ja', '', '<script>', 'en;drop table', 'zh-TW']) {
      expect(renderWith(bad)).toContain('<html lang="en">');
    }
  });

  it('escapes the lang value (no injection via malformed locale)', () => {
    const html = renderWith('" onload="alert(1)');
    expect(html).not.toContain('onload');
    expect(html).toContain('<html lang="');
  });

  it('lang agrees with the localized cover labels for non-English exports', () => {
    // resolveTheme('minimal') renders the minimal cover, which uses the by label
    // ('von' de / 'por' pt), not designedBy.
    const de = renderWith('de');
    expect(de).toContain('<html lang="de">');
    expect(de).toContain('>von '); // de labels.by
    const pt = renderWith('pt');
    expect(pt).toContain('<html lang="pt">');
    expect(pt).toContain('>por '); // pt labels.by
  });

  it('emits the declared renderer contract marker used by prepared artifact provenance', () => {
    const html = renderDocument({
      theme: resolveTheme('minimal'),
      pattern: SAMPLE_CREW_NECK_SWEATER,
      gradingResult: GRADING,
      locale: 'en',
      templateId: 'minimal',
    });
    expect(html).toContain(`<meta name="stitch-and-scale-renderer" content="${PDF_RENDERER_VERSION}">`);
    expect(html).toContain('<meta name="stitch-and-scale-template" content="minimal">');
  });

  it('provenance footer reports the actual export locale and templateId, not hardcoded values', () => {
    const de = renderWith('de');
    expect(de).toContain('locale:de');
    expect(de).not.toContain('locale:en');
    const t2 = renderDocument({
      theme: resolveTheme('luxury'),
      pattern: SAMPLE_CREW_NECK_SWEATER,
      gradingResult: GRADING,
      locale: 'fr',
      templateId: 'custom-brand',
    });
    expect(t2).toContain('locale:fr');
    expect(t2).toContain('template:custom-brand');
  });

  it('isValidLanguageCode mirrors the supported locale set exactly', () => {
    for (const { code } of LANGUAGE_OPTIONS) {
      expect(isValidLanguageCode(code)).toBe(true);
    }
    expect(isValidLanguageCode('xx')).toBe(false);
    expect(isValidLanguageCode('en-US')).toBe(false); // BCP-47 compound, not a LanguageCode
  });

  it('getInitialLanguage stays within the supported set', () => {
    expect(isValidLanguageCode(getInitialLanguage())).toBe(true);
  });
});
