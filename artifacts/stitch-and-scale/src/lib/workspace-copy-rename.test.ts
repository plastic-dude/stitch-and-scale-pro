import { describe, expect, it } from 'vitest';
import { getWorkspaceCopy } from './workspace-copy';
import type { LanguageCode } from './i18n';

describe('Workspace rename copy (CHK-155)', () => {
  const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

  it('exposes the rename vocabulary in every supported locale', () => {
    for (const locale of locales) {
      const copy = getWorkspaceCopy(locale);
      const keys = ['renameProject', 'renameDialogTitle', 'renameSave', 'renameCancel', 'renameSaved', 'renameFailed', 'renameEmpty', 'renameSame'] as const;
      for (const key of keys) {
        expect(copy[key], `${locale}.${key}`).toBeTruthy();
        expect(typeof copy[key]).toBe('string');
      }
    }
  });

  it('German rename vocabulary uses informal du/dein register and is not English', () => {
    const de = getWorkspaceCopy('de');
    expect(de.renameProject).toBe('Projekt umbenennen');
    expect(de.renameDialogTitle).toBe('Dein Musterprojekt umbenennen');
    expect(de.renameSave).toBe('Speichern');
    expect(de.renameCancel).toBe('Abbrechen');
    expect(de.renameSaved).toBe('Projekt umbenannt');
    expect(de.renameFailed).toBe('Der neue Name konnte nicht gespeichert werden');
    expect(de.renameEmpty).toBe('Der Name darf nicht leer sein');
    for (const key of ['renameProject', 'renameDialogTitle', 'renameSave', 'renameCancel', 'renameSaved', 'renameFailed', 'renameEmpty', 'renameSame'] as const) {
      expect(de[key]).not.toBe(getWorkspaceCopy('en')[key]);
    }
  });

  it('non-English locales never carry English rename labels', () => {
    const en = getWorkspaceCopy('en');
    for (const locale of ['de', 'fr', 'es', 'pt'] as const) {
      const copy = getWorkspaceCopy(locale);
      expect(copy.renameProject).not.toBe(en.renameProject);
      expect(copy.renameSaved).not.toBe(en.renameSaved);
      expect(copy.renameFailed).not.toBe(en.renameFailed);
      expect(copy.renameEmpty).not.toBe(en.renameEmpty);
    }
  });

  it('falls back to English for unknown locale codes', () => {
    const en = getWorkspaceCopy('xx');
    expect(en.renameProject).toBe('Rename project');
  });
});
