import { describe, expect, it } from 'vitest';
import { RELEASE_DRAFT_LOCALES } from './release-draft';
import { assertReleaseDraftCopyParity, getReleaseDraftCopy } from './release-draft-copy';

describe('QUEUE-070 Release Draft copy', () => {
  it('keeps all required visible labels non-empty in every supported locale', () => {
    expect(assertReleaseDraftCopyParity()).toBe(true);
    for (const locale of RELEASE_DRAFT_LOCALES) {
      const copy = getReleaseDraftCopy(locale);
      for (const value of Object.values(copy)) {
        if (typeof value === 'string') expect(value.trim()).not.toBe('');
      }
      expect(Object.keys(copy.purposeOptions)).toEqual(['portfolio', 'pattern-preview', 'finished-work', 'private-review']);
      expect(Object.keys(copy.audienceOptions)).toEqual(['private', 'trusted-reviewer', 'public']);
    }
  });
});
