import { describe, expect, it } from 'vitest';
import { IMPORT_CSV_COPY } from './import-csv-copy';

describe('Import CSV copy catalogue', () => {
  it('contains route labels and placeholders in all supported locales', () => {
    const keys = Object.keys(IMPORT_CSV_COPY.en) as Array<keyof typeof IMPORT_CSV_COPY.en>;
    expect(Object.keys(IMPORT_CSV_COPY)).toHaveLength(5);
    for (const locale of Object.values(IMPORT_CSV_COPY)) {
      for (const key of keys) expect(locale[key], key).toBeTruthy();
    }
    for (const language of ['de', 'fr', 'es', 'pt'] as const) {
      expect(IMPORT_CSV_COPY[language].title).not.toBe(IMPORT_CSV_COPY.en.title);
      expect(IMPORT_CSV_COPY[language].patternPlaceholder).not.toBe(IMPORT_CSV_COPY.en.patternPlaceholder);
    }
  });
});
