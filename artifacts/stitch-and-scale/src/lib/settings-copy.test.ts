import { describe, expect, it } from 'vitest';
import { getSettingsCopy } from './settings-copy';

describe('settings backup copy', () => {
  it('provides localized snapshot status messages in every supported locale', () => {
    for (const locale of ['en', 'de', 'fr', 'es', 'pt']) {
      const copy = getSettingsCopy(locale);
      expect(copy.exportDescription).toBeTruthy();
      expect(copy.restoreDescription).toBeTruthy();
      expect(copy.backupDownloaded(2)).toBeTruthy();
      expect(copy.restoreSuccessful(1, 2)).toBeTruthy();
      expect(copy.restoreFailed).toBeTruthy();
      expect(copy.restorePreviewTitle).toBeTruthy();
      expect(copy.restorePreviewCreated).toBeTruthy();
      expect(copy.restorePreviewProjects).toBeTruthy();
      expect(copy.restorePreviewRecords).toBeTruthy();
      expect(copy.restorePreviewDefects).toBeTruthy();
      expect(copy.restorePreviewEvidence).toBeTruthy();
      expect(copy.restorePreviewSettings).toBeTruthy();
      expect(copy.restorePreviewLegacy).toBeTruthy();
      expect(copy.restorePreviewWarning).toBeTruthy();
      expect(copy.restorePreviewCancel).toBeTruthy();
      expect(copy.restorePreviewConfirm).toBeTruthy();
    }
  });
});
