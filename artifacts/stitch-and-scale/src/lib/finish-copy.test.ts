import { describe, expect, it } from 'vitest';
import { FINISH_COPY } from './finish-copy';

describe('Finish & Care copy catalogue', () => {
  it('populates all visible copy in each supported locale', () => {
    const keys = Object.keys(FINISH_COPY.en) as Array<keyof typeof FINISH_COPY.en>;
    expect(Object.keys(FINISH_COPY)).toHaveLength(5);
    for (const locale of Object.values(FINISH_COPY)) {
      for (const key of keys) expect(locale[key], key).toBeTruthy();
    }
    expect(FINISH_COPY.de.title).not.toBe(FINISH_COPY.en.title);
    expect(FINISH_COPY.fr.title).not.toBe(FINISH_COPY.en.title);
    expect(FINISH_COPY.es.title).not.toBe(FINISH_COPY.en.title);
    expect(FINISH_COPY.pt.title).not.toBe(FINISH_COPY.en.title);
  });
});
