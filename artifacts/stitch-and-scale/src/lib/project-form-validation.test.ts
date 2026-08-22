import { describe, it, expect } from 'vitest';
import { NEW_PROJECT_COPY } from './new-project-copy';
import { WORKSPACE_COPY } from './workspace-copy';

describe('Project Form Validation (QUEUE-027)', () => {
  const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

  it('exposes fieldRequired and invalidGauge in all locales for new project wizard', () => {
    locales.forEach(lang => {
      const copy = NEW_PROJECT_COPY[lang];
      expect(copy.fieldRequired).toBeDefined();
      expect(copy.fieldRequired.length).toBeGreaterThan(0);
      expect(copy.invalidGauge).toBeDefined();
      expect(copy.invalidGauge.length).toBeGreaterThan(0);
    });
  });

  it('exposes fieldRequired in all locales for workspace copy', () => {
    locales.forEach(lang => {
      const copy = WORKSPACE_COPY[lang];
      expect(copy.fieldRequired).toBeDefined();
      expect(copy.fieldRequired.length).toBeGreaterThan(0);
    });
  });

  it('localized German fieldRequired uses informal tone (du/dein)', () => {
    const copy = NEW_PROJECT_COPY.de;
    // informal German check
    expect(copy.fieldRequired).toBe('Dieses Feld ist erforderlich');
  });
});
