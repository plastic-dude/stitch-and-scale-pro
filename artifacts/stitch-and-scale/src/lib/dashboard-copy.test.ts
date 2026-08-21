import { describe, expect, it } from 'vitest';
import { DASHBOARD_COPY } from './dashboard-copy';

describe('Dashboard copy catalogue', () => {
  it('contains the global dashboard vocabulary in every supported locale', () => {
    const keys = Object.keys(DASHBOARD_COPY.en) as Array<keyof typeof DASHBOARD_COPY.en>;
    expect(Object.keys(DASHBOARD_COPY)).toHaveLength(5);
    for (const locale of Object.values(DASHBOARD_COPY)) {
      for (const key of keys) expect(locale[key], key).toBeTruthy();
    }
    expect(DASHBOARD_COPY.de.notice).not.toBe(DASHBOARD_COPY.en.notice);
    expect(DASHBOARD_COPY.fr.notice).not.toBe(DASHBOARD_COPY.en.notice);
    expect(DASHBOARD_COPY.es.notice).not.toBe(DASHBOARD_COPY.en.notice);
    expect(DASHBOARD_COPY.pt.notice).not.toBe(DASHBOARD_COPY.en.notice);
  });

  it('card status chips are translated in every supported locale (QA 51-A)', () => {
    expect(DASHBOARD_COPY.en.graded).toBe('Graded');
    expect(DASHBOARD_COPY.en.draft).toBe('Draft');
    expect(DASHBOARD_COPY.de.graded).toBe('Graduiert');
    expect(DASHBOARD_COPY.de.draft).toBe('Entwurf');
    expect(DASHBOARD_COPY.fr.graded).toBe('Gradé');
    expect(DASHBOARD_COPY.es.draft).toBe('Borrador');
    expect(DASHBOARD_COPY.pt.graded).toBe('Graduado');
  });

  it('delete dialog placeholder renders a real name in every locale (QA 51-A)', () => {
    for (const locale of Object.keys(DASHBOARD_COPY) as Array<keyof typeof DASHBOARD_COPY>) {
      const title = DASHBOARD_COPY[locale].deleteTitle.replace('{0}', 'Crew Neck');
      expect(title).toContain('Crew Neck');
      expect(title).not.toContain('{0}');
    }
    expect(DASHBOARD_COPY.fr.deleteTitle).toBe('Supprimer « {0} » ?');
    expect(DASHBOARD_COPY.es.deleteTitle).toContain('¿Eliminar');
  });

  it('size label interpolates the base size in every locale (QA 51-A)', () => {
    expect(DASHBOARD_COPY.de.sizeLabel.replace('{0}', 'M')).toBe('Größe M');
    expect(DASHBOARD_COPY.pt.sizeLabel.replace('{0}', '42')).toBe('Tamanho 42');
  });

  it('rename keys exist in every locale and are translated outside English (CHK-155)', () => {
    const keys = ['renameAction', 'renameSaved', 'renameFailed', 'renameEmpty'] as const;
    expect(Object.keys(DASHBOARD_COPY)).toHaveLength(5);
    for (const locale of Object.values(DASHBOARD_COPY)) {
      for (const key of keys) expect(locale[key], key).toBeTruthy();
    }
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      for (const key of keys) {
        expect(DASHBOARD_COPY[locale][key]).not.toBe(DASHBOARD_COPY.en[key]);
      }
      expect(DASHBOARD_COPY[locale].renameAction).not.toBe('Rename');
    }
    expect(DASHBOARD_COPY.de.renameAction).toBe('Umbenennen');
    expect(DASHBOARD_COPY.de.renameSaved).toBe('Muster umbenannt');
  });

  it('non-English locales override the English card-action fallbacks (QA 51-A)', () => {
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      expect(DASHBOARD_COPY[locale].duplicateAction).not.toBe('Duplicate');
      expect(DASHBOARD_COPY[locale].exportJson).not.toBe('Export as JSON');
      expect(DASHBOARD_COPY[locale].cancel).not.toBe('Cancel');
      expect(DASHBOARD_COPY[locale].startNewPattern).not.toBe('Start New Pattern');
    }
  });
});
