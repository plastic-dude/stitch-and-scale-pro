import { describe, expect, it } from 'vitest';
import { getWorkspaceCopy } from './workspace-copy';

describe('workspace copy — sections empty state & delete dialogs (CHK-139)', () => {
  const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

  it.each(locales)('renders emptySectionDesc for %s', (locale) => {
    const copy = getWorkspaceCopy(locale);
    expect(copy.emptySectionDesc.trim()).toBeTruthy();
    expect(copy.emptySectionDesc.length).toBeGreaterThan(20);
  });

  it.each(locales)('renders addFirstSection for %s', (locale) => {
    expect(getWorkspaceCopy(locale).addFirstSection.trim()).toBeTruthy();
  });

  it.each(locales)('interpolates the section name into confirmDeleteSectionNamed for %s', (locale) => {
    const title = getWorkspaceCopy(locale).confirmDeleteSectionNamed('"Back"');
    expect(title).toContain('Back');
  });

  it.each(locales)('interpolates the measurement count into confirmDeleteSectionBody for %s', (locale) => {
    const body = getWorkspaceCopy(locale).confirmDeleteSectionBody(3);
    expect(body).toContain('3');
  });

  it.each(locales)('renders confirmDeleteSectionAction for %s', (locale) => {
    expect(getWorkspaceCopy(locale).confirmDeleteSectionAction.trim()).toBeTruthy();
  });

  it.each(locales)('interpolates the measurement label into confirmDeleteMeasurementNamed for %s', (locale) => {
    const title = getWorkspaceCopy(locale).confirmDeleteMeasurementNamed('"Bust (Full)"');
    expect(title).toContain('Bust (Full)');
  });

  it.each(locales)('renders confirmDeleteMeasurementBody for %s', (locale) => {
    expect(getWorkspaceCopy(locale).confirmDeleteMeasurementBody.trim()).toBeTruthy();
  });

  it.each(locales)('renders confirmDeleteMeasurementAction for %s', (locale) => {
    expect(getWorkspaceCopy(locale).confirmDeleteMeasurementAction.trim()).toBeTruthy();
  });

  it('keeps the English wording verbatim', () => {
    const en = getWorkspaceCopy('en');
    expect(en.emptySectionDesc).toBe(
      'Divide your pattern into logical sections (e.g. Back, Front, Sleeves) to start adding measurements.',
    );
    expect(en.addFirstSection).toBe('Add First Section');
    expect(en.confirmDeleteSectionAction).toBe('Delete Section');
    expect(en.confirmDeleteMeasurementAction).toBe('Delete Measurement');
  });

  it('keeps the English interpolation format', () => {
    const en = getWorkspaceCopy('en');
    expect(en.confirmDeleteSectionNamed('Back')).toBe('Delete section Back?');
    expect(en.confirmDeleteSectionBody(3)).toContain(
      'This removes the section and all 3 of its measurements.',
    );
    expect(en.confirmDeleteMeasurementNamed('Bust (Full)')).toBe('Delete "Bust (Full)"?');
  });

  it('uses the local language for non-English confirm actions', () => {
    expect(getWorkspaceCopy('de').confirmDeleteSectionAction).toBe('Abschnitt löschen');
    expect(getWorkspaceCopy('de').confirmDeleteMeasurementAction).toBe('Maß löschen');
    expect(getWorkspaceCopy('fr').confirmDeleteSectionAction).toContain('Supprimer');
    expect(getWorkspaceCopy('es').confirmDeleteSectionAction).toContain('Eliminar');
    expect(getWorkspaceCopy('pt').confirmDeleteSectionAction).toContain('Eliminar');
  });

  it('has no English leftovers in non-English empty-state descriptions', () => {
    const frags = [
      'Divide your pattern',
      'logical sections',
      'to start adding measurements',
      'Add First Section',
    ];
    for (const locale of locales) {
      if (locale === 'en') continue;
      const copy = getWorkspaceCopy(locale);
      expect(copy.emptySectionDesc + ' ' + copy.addFirstSection).not.toContain(frags.join('|'));
      for (const frag of frags) {
        expect(copy.emptySectionDesc + ' ' + copy.addFirstSection).not.toContain(frag);
      }
    }
  });

  it('falls back to English for unknown codes', () => {
    expect(getWorkspaceCopy('xx' as never).emptySectionDesc).toBe(getWorkspaceCopy('en').emptySectionDesc);
    expect(getWorkspaceCopy('xx' as never).addFirstSection).toBe(getWorkspaceCopy('en').addFirstSection);
  });
});
