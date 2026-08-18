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
    }
  });
});
