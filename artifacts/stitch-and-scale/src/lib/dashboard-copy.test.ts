import { describe, expect, it } from 'vitest';
import { DASHBOARD_COPY } from './dashboard-copy';

describe('Dashboard copy catalogue', () => {
  it('contains the global dashboard vocabulary in every supported locale', () => {
    const keys = Object.keys(DASHBOARD_COPY.en) as Array<keyof typeof DASHBOARD_COPY.en>;
    expect(Object.keys(DASHBOARD_COPY)).toHaveLength(5);
    for (const locale of Object.values(DASHBOARD_COPY)) {
      for (const key of keys) expect(locale[key], key).toBeTruthy();
    }
    expect(DASHBOARD_COPY.de.notice).not.toBe(DASHBOARD_COPY.en.notice);
    expect(DASHBOARD_COPY.fr.notice).not.toBe(DASHBOARD_COPY.en.notice);
    expect(DASHBOARD_COPY.es.notice).not.toBe(DASHBOARD_COPY.en.notice);
    expect(DASHBOARD_COPY.pt.notice).not.toBe(DASHBOARD_COPY.en.notice);
  });
});
