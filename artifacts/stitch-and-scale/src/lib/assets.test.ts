import { describe, it, expect } from 'vitest';
import { generateId } from './grading-engine';
import { ASSETS_COPY } from './assets-copy';

describe('Asset Management Logic', () => {
  it('should have valid copy for all 5 locales', () => {
    const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;
    locales.forEach(lang => {
      expect(ASSETS_COPY[lang]).toBeDefined();
      expect(ASSETS_COPY[lang].assetsTitle).toBeDefined();
      expect(ASSETS_COPY[lang].addAsset).toBeDefined();
    });
  });

  it('should generate unique IDs for assets', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(5);
  });
});
