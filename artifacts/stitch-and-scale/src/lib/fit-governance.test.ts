import { describe, it, expect } from 'vitest';
import { EASE_PROFILES } from './ease-profiles';
import { CYC_METADATA } from './grading-engine';
import { FIT_GOVERNANCE_COPY } from './fit-governance-copy';

describe('Fit Governance Logic', () => {
  it('should have a complete set of ease profiles', () => {
    expect(EASE_PROFILES.length).toBeGreaterThan(0);
    const ids = EASE_PROFILES.map(p => p.id);
    expect(ids).toContain('standard');
    expect(ids).toContain('relaxed');
    expect(ids).toContain('oversized');
  });

  it('should have valid CYC metadata', () => {
    expect(CYC_METADATA.source).toContain('Craft Yarn Council');
    expect(CYC_METADATA.isInclusive).toBe(true);
  });

  it('should have localized copy for all 5 locales', () => {
    const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;
    locales.forEach(lang => {
      const copy = FIT_GOVERNANCE_COPY[lang];
      expect(copy).toBeDefined();
      expect(copy.title).toBeDefined();
      expect(copy.standardTitle).toBeDefined();
    });
  });

  it('should have informal German tone', () => {
    const de = FIT_GOVERNANCE_COPY.de;
    // Verify informal tone (Nein/Ja/Standard)
    expect(de.inclusiveNo).toBe('Nein');
    expect(de.inclusiveYes).toBe('Ja');
  });
});
