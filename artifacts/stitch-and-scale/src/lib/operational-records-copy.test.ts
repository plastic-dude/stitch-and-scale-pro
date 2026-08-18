import { describe, expect, it } from 'vitest';
import { getOperationalRecordsCopy } from './operational-records-copy';

describe('operational records copy', () => {
  it('provides distinct backup and restore guidance for every supported locale', () => {
    const locales = ['en', 'de', 'fr', 'es', 'pt'];
    const exported = locales.map((locale) => getOperationalRecordsCopy(locale).backupExported);
    const restored = locales.map((locale) => getOperationalRecordsCopy(locale).backupSuccess);

    expect(exported).toHaveLength(5);
    expect(restored).toHaveLength(5);
    for (const locale of locales) {
      const copy = getOperationalRecordsCopy(locale);
      expect(copy.backupTitle).toBeTruthy();
      expect(copy.backupDescription).toBeTruthy();
      expect(copy.exportBackup).toBeTruthy();
      expect(copy.importBackup).toBeTruthy();
      expect(copy.backupConfirm).toBeTruthy();
      expect(copy.backupCancel).toBeTruthy();
      expect(copy.backupConfirmAction).toBeTruthy();
      expect(copy.backupError).toBeTruthy();
    }
    expect(new Set(exported).size).toBe(5);
    expect(new Set(restored).size).toBe(5);
  });
});
