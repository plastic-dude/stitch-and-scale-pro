import { describe, it, expect } from 'vitest';
import { TECH_EDIT_COPY } from './tech-edit-copy';

describe('Tech-Edit Audit Title Localization', () => {
  it('should have localized title for German', () => {
    expect(TECH_EDIT_COPY.de.title).toBe('Selbstprüfung für technische Redaktion');
  });

  it('should have localized title for French', () => {
    expect(TECH_EDIT_COPY.fr.title).toBe('Audit d’auto-révision technique');
  });

  it('should have localized title for Spanish', () => {
    expect(TECH_EDIT_COPY.es.title).toBe('Auditoría de autoedición técnica');
  });

  it('should have localized title for Portuguese', () => {
    expect(TECH_EDIT_COPY.pt.title).toBe('Auditoria de autoedição técnica');
  });

  it('should not fall back to English title "Self Tech-Edit Audit" for non-English locales', () => {
    const enTitle = TECH_EDIT_COPY.en.title;
    expect(TECH_EDIT_COPY.de.title).not.toBe(enTitle);
    expect(TECH_EDIT_COPY.fr.title).not.toBe(enTitle);
    expect(TECH_EDIT_COPY.es.title).not.toBe(enTitle);
    expect(TECH_EDIT_COPY.pt.title).not.toBe(enTitle);
  });
});
