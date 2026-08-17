import { describe, expect, it } from 'vitest';
import { BODY_SCHEMATIC_COPY } from './body-schematic-copy';

describe('Body Schematic copy catalogue', () => {
  it('contains translated reference vocabulary in all supported locales', () => {
    const locales = Object.values(BODY_SCHEMATIC_COPY);
    expect(locales).toHaveLength(5);
    for (const copy of locales) {
      expect(copy.heading).toBeTruthy();
      expect(copy.description).toBeTruthy();
      expect(copy.aria).toBeTruthy();
      expect(Object.keys(copy.labels)).toHaveLength(Object.keys(BODY_SCHEMATIC_COPY.en.labels).length);
    }
    for (const language of ['de', 'fr', 'es', 'pt'] as const) {
      expect(BODY_SCHEMATIC_COPY[language].heading).not.toBe(BODY_SCHEMATIC_COPY.en.heading);
      expect(BODY_SCHEMATIC_COPY[language].aria).not.toBe(BODY_SCHEMATIC_COPY.en.aria);
    }
  });
});
