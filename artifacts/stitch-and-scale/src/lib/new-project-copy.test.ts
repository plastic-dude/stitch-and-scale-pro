import { describe, expect, it } from 'vitest';
import { NEW_PROJECT_COPY } from './new-project-copy';

describe('New Project copy catalogue', () => {
  it('contains placeholders and sizing explanations in all supported locales', () => {
    const keys = Object.keys(NEW_PROJECT_COPY.en) as Array<keyof typeof NEW_PROJECT_COPY.en>;
    expect(Object.keys(NEW_PROJECT_COPY)).toHaveLength(5);
    for (const locale of Object.values(NEW_PROJECT_COPY)) {
      for (const key of keys) expect(locale[key], key).toBeTruthy();
    }
    for (const language of ['de', 'fr', 'es', 'pt'] as const) {
      expect(NEW_PROJECT_COPY[language].patternPlaceholder).not.toBe(NEW_PROJECT_COPY.en.patternPlaceholder);
      expect(NEW_PROJECT_COPY[language].sizingStandard).not.toBe(NEW_PROJECT_COPY.en.sizingStandard);
    }
  });
});
