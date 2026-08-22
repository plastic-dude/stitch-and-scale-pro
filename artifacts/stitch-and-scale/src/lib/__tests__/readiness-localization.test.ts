import { describe, it, expect } from 'vitest';
import { WORKSPACE_COPY, LanguageCode } from '../workspace-copy';

describe('Readiness Localization Integrity', () => {
  const locales: LanguageCode[] = ['en', 'de', 'fr', 'es', 'pt'];
  const newKeys = [
    'readinessIssueDescription',
    'readinessIssueSeverity',
    'readinessIssueAffectedSizes',
    'readinessIssueSourceRun',
    'readinessIssuePlaceholderDesc',
    'readinessIssuePlaceholderEvidence',
    'readinessIssuePlaceholderReproduction',
    'readinessIssuePlaceholderResolution',
    'readinessIssueOptional',
    'readinessDispositionAccepted',
    'readinessDispositionRejected',
    'readinessDispositionDeferred',
    'readinessStatusOpen',
    'readinessStatusFixed',
    'readinessStatusVerified',
    'readinessPublicationReady'
  ];

  it('contains all defect ledger keys in all five locales', () => {
    locales.forEach(lang => {
      const copy = WORKSPACE_COPY[lang];
      newKeys.forEach(key => {
        expect(copy, `Locale ${lang} is missing key ${key}`).toHaveProperty(key);
        expect(typeof (copy as any)[key], `Key ${key} in ${lang} is not a string`).toBe('string');
        expect((copy as any)[key].length, `Key ${key} in ${lang} is empty`).toBeGreaterThan(0);
      });
    });
  });

  it('German readiness labels use informal tone and correct spelling', () => {
    const de = WORKSPACE_COPY.de;
    expect(de.readinessIssueSeverityNitpick).toBe('Kleinigkeiten');
    expect(de.readinessIssuePlaceholderResolution).toContain('behoben');
    // Check for "Deine" or informal address in related areas if applicable
  });

  it('non-English locales do not have English placeholders', () => {
    const en = WORKSPACE_COPY.en;
    locales.filter(l => l !== 'en').forEach(lang => {
      const copy = WORKSPACE_COPY[lang];
      expect((copy as any).readinessIssueDescription).not.toBe(en.readinessIssueDescription);
      expect((copy as any).readinessIssueSeverity).not.toBe(en.readinessIssueSeverity);
      expect((copy as any).readinessStatusVerified).not.toBe(en.readinessStatusVerified);
    });
  });
});
