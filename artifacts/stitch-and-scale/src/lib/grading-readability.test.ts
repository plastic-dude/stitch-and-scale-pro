import { describe, expect, it } from 'vitest';
import { getGradingCopy } from './grading-copy';

describe('Grading Readability Localization', () => {
  it('provides rowsLabel for all supported locales', () => {
    const locales = ['en', 'de', 'fr', 'es', 'pt'];
    locales.forEach(locale => {
      const copy = getGradingCopy(locale);
      expect(copy.rowsLabel).toBeDefined();
      expect(typeof copy.rowsLabel).toBe('string');
      expect(copy.rowsLabel.length).toBeGreaterThan(0);
    });
  });

  it('translates rowsLabel correctly', () => {
    expect(getGradingCopy('en').rowsLabel).toBe('Rows');
    expect(getGradingCopy('de').rowsLabel).toBe('Reihen');
    expect(getGradingCopy('fr').rowsLabel).toBe('Rangs');
    expect(getGradingCopy('es').rowsLabel).toBe('Vueltas');
    expect(getGradingCopy('pt').rowsLabel).toBe('Carreiras');
  });

  it('translates stitches label correctly', () => {
    expect(getGradingCopy('en').stitches).toBe('Stitches');
    expect(getGradingCopy('de').stitches).toBe('Maschen');
    expect(getGradingCopy('fr').stitches).toBe('Mailles');
    expect(getGradingCopy('es').stitches).toBe('Puntos');
    expect(getGradingCopy('pt').stitches).toBe('Malhas');
  });
});
