import { describe, expect, it } from 'vitest';
import { getToastCopy, type ToastCopy } from './toast-copy';

const LOCALES = ['en', 'de', 'fr', 'es', 'pt'] as const;

const stringKeys: Array<keyof ToastCopy> = [
  'copied',
  'copiedDescription',
  'copyFailed',
  'copyFailedDescription',
  'selectManually',
  'selectManuallyFromBox',
  'notesSaved',
  'sectionDeletedTitle',
  'sectionDeletedDescription',
  'unknownError',
  'fileCouldNotBeRead',
  'importFailed',
  'importFailedDescription',
  'backupExportRequested',
  'onboardingRestarted',
  'onboardingRestartedDescription',
  'resetToCycValues',
  'resetToCycValuesDescription',
  'credibilityStatementCopied',
  'credibilityStatementPaste',
  'listingCopied',
  'listingCopiedPaste',
  'publishNotesSaved',
  'publishNotesSavedDescription',
  'tableCopied',
  'tableCopiedDescription',
  'showTierNoted',
  'preEditSummaryCopied',
  'preEditSummaryPaste',
  'testerCallCopied',
  'testerCallPaste',
  'rosterRebuilt',
  'wholesaleCopied',
  'wholesaleSelectManually',
  'courseCopied',
  'courseCopiedPaste',
  'storesReconciled',
  'reconcileComplete',
  'reconciledDescription',
  'unifiedDescription',
  'reconcileFailed',
  'reconcileFailedDescription',
  'updated',
];

describe('getToastCopy', () => {
  it('returns the English copy for an unknown language code', () => {
    const tc = getToastCopy('xx' as never);
    expect(tc.sectionDeletedTitle).toBe('Section deleted');
    expect(tc.backupExportRequested).toBe('Backup export requested');
    expect(tc.projectImportedDescription('Test')).toBe('"Test" was added to your patterns.');
  });

  it('returns a full, non-empty localized copy object for every supported locale', () => {
    for (const locale of LOCALES) {
      const tc = getToastCopy(locale);
      for (const key of stringKeys) {
        const value = tc[key];
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('renders the German delete toast, not English', () => {
    const tc = getToastCopy('de');
    expect(tc.sectionDeletedTitle).toBe('Abschnitt gelöscht');
    expect(tc.sectionDeletedDescription).toContain('letzten Export');
    expect(tc.measurementRestored('Ärmel').title).toContain('Ärmel');
    expect(tc.measurementDeleted('Brustumfang').title).toContain('Brustumfang');
    expect(tc.projectDeletedDescription('Winterkleid')).toContain('Winterkleid');
  });

  it('interpolates labels, counts and units for every locale', () => {
    for (const locale of LOCALES) {
      const tc = getToastCopy(locale);
      const m = tc.measurementRestored('Sleeve');
      expect(m.title).toContain('Sleeve');
      expect(tc.measurementDeleted('Cuff').title).toContain('Cuff');
      expect(tc.importMergedDescription(2, 1)).toContain('2');
      expect(tc.importMergedDescription(2, 1)).toContain('1');
      expect(tc.backupExportRequestedDescription(4)).toContain('4');
      expect(tc.rosterRebuiltDescription(6, 3)).toContain('6');
      expect(tc.rosterRebuiltDescription(6, 3)).toContain('3');
      expect(tc.importSuccessTitle(1)).toContain('1');
      expect(tc.projectDuplicateDescription('A (Copy)')).toContain('A (Copy)');
      expect(tc.projectExportRequestedDescription('B')).toContain('B');
      expect(tc.yarnLoadedTitle('Merino')).toContain('Merino');
      expect(tc.showTierNotedDescription('Regional show')).toContain('Regional show');
      expect(tc.yarnPoolRequired(6, 'Grams', 6)).toContain('6');
      expect(tc.measurementUpdatedAdded('Hip', false).title).toContain('Hip');
      expect(tc.measurementUpdatedAdded('Hip', true).title).toContain('Hip');
    }
  });

  it('uses singular for exactly one item and plural for zero and many (measurement chip parity)', () => {
    const de = getToastCopy('de');
    expect(de.yarnPoolRequired(1, 'Gramm', 6)).toContain('Gramm');
    expect(de.yarnPoolRequired(0, 'Gramm', 6)).toContain('0');
    const en = getToastCopy('en');
    expect(en.yarnPoolRequired(1, 'g', 8)).toContain('1 g');
    expect(en.yarnPoolRequired(9, 'g', 8)).toContain('9 g');
  });

  it('leaves no plain-English leftovers in the German and French maps', () => {
    const leftovers = ['Section deleted', 'Notes saved', 'Backup downloaded', 'Backup export requested', 'Pattern exported', 'Copied', 'Copy failed'];
    for (const locale of ['de', 'fr'] as const) {
      const tc = getToastCopy(locale);
      for (const key of stringKeys) {
        expect(tc[key]).not.toBe(leftovers as never);
      }
    }
  });

  it('describes browser-mediated exports as requests, not completed downloads', () => {
    for (const locale of LOCALES) {
      const tc = getToastCopy(locale);
      const messages = [tc.backupExportRequested, tc.backupExportRequestedDescription(2), tc.projectExportRequestedDescription('B')].join(' ');
      expect(messages).not.toMatch(/downloaded|heruntergeladen|téléchargé|descargado|descarregado|saved to the file|in der Datei gesichert|enregistré.*fichier|guardado.*archivo|guardado.*ficheiro/i);
      expect(messages).toMatch(/requested|angefordert|demandé|solicitada|solicitada/i);
    }
  });

  it('exports the same key set in every locale map', () => {
    const enKeys = Object.keys(getToastCopy('en'));
    for (const locale of LOCALES) {
      expect(Object.keys(getToastCopy(locale))).toEqual(enKeys);
    }
  });
});
