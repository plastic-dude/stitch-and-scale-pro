import { describe, expect, it } from 'vitest';
import { getLabStatCopy } from './lab-stat-copy';

describe('Deep Link Recovery Localization', () => {
  it('provides recovery strings for all supported locales', () => {
    const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;
    locales.forEach(locale => {
      const ls = getLabStatCopy(locale);
      expect(ls.recoveryImportTitle).toBeDefined();
      expect(ls.recoveryImportDesc).toBeDefined();
      expect(ls.recoveryImportButton).toBeDefined();
      expect(ls.recoveryLocalOnlyTitle).toBeDefined();
      expect(ls.recoveryLocalOnlyDesc).toBeDefined();
      
      expect(ls.recoveryImportTitle.length).toBeGreaterThan(0);
      expect(ls.recoveryImportDesc.length).toBeGreaterThan(0);
      expect(ls.recoveryImportButton.length).toBeGreaterThan(0);
      expect(ls.recoveryLocalOnlyTitle.length).toBeGreaterThan(0);
      expect(ls.recoveryLocalOnlyDesc.length).toBeGreaterThan(0);
    });
  });

  it('translates recoveryImportTitle correctly', () => {
    expect(getLabStatCopy('en').recoveryImportTitle).toBe('Shared this link?');
    expect(getLabStatCopy('de').recoveryImportTitle).toBe('Diesen Link geteilt?');
    expect(getLabStatCopy('fr').recoveryImportTitle).toBe('Lien partagé ?');
    expect(getLabStatCopy('es').recoveryImportTitle).toBe('¿Compartiste este enlace?');
    expect(getLabStatCopy('pt').recoveryImportTitle).toBe('Compartilhou este link?');
  });
});
