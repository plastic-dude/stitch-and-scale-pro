import { describe, it, expect, vi } from 'vitest';
import { getSettingsCopy } from './lib/settings-copy';

describe('StorageHealthCard Localization', () => {
  const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

  it('should have all storage health keys in all locales', () => {
    locales.forEach(lang => {
      const copy = getSettingsCopy(lang);
      
      expect(copy.storageHealthTitle).toBeDefined();
      expect(copy.storageHealthDesc).toBeDefined();
      expect(copy.browserStorage).toBeDefined();
      expect(copy.offlineCache).toBeDefined();
      expect(copy.projectsCount(5)).toContain('5');
      expect(copy.projectCount(1)).toContain('1');
      expect(copy.storesInSync).toBeDefined();
      expect(copy.storesOutOfSync).toBeDefined();
      expect(copy.syncSuccess).toBeDefined();
      expect(copy.syncDiff).toBeDefined();
      expect(copy.reconcile).toBeDefined();
      expect(copy.neverBackedUp).toBeDefined();
      expect(copy.backedUpToday).toBeDefined();
      expect(copy.backedUpDays(3)).toContain('3');
      expect(copy.backedUpDay(1)).toContain('1');
      expect(copy.backupOverdue).toBeDefined();
      expect(copy.backupInstruction).toBeDefined();
      expect(copy.backupInsurance).toBeDefined();
      expect(copy.storageProtectionTitle).toBeDefined();
      expect(copy.storageProtectionDescription).toBeDefined();
      expect(copy.storageProtectionAction).toBeDefined();
      expect(copy.storageProtectionNotNow).toBeDefined();
      expect(copy.storageProtectionDismiss).toBeDefined();
      expect(copy.storageProtectionProtected).toBeDefined();
      expect(copy.storageProtectionDeclined).toBeDefined();
      expect(copy.storageProtectionUnavailable).toBeDefined();
      expect(copy.storageProtectionError).toBeDefined();
    });
  });

  it('should have translated values for German (informal)', () => {
    const de = getSettingsCopy('de');
    expect(de.storageHealthTitle).toBe('Speicherzustand');
    expect(de.backupInsurance).toContain('deiner Arbeit'); // informal 'dein'
    expect(de.backupInsurance).toContain('kontrollierst'); // informal 'du'
    expect(de.storageProtectionDescription).toContain('kein Backup');
  });
});
