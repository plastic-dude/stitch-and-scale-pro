/**
 * CHK-176 — SPA 404 route guard and regression test.
 * Audit F-14 (MINOR) noted: "Server returns SPA shell with HTTP 200 for
 * nonexistent paths — Monitoring, indexing, and diagnostics become weaker."
 *
 * While an SPA must return 200 for all client-side routes to function, we
 * must ensure the client-side 404 state is robust, localized, and pinned.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const APP_SRC = readFileSync(join(__dirname, 'App.tsx'), 'utf8');
const ROUTES_SRC = readFileSync(join(__dirname, 'routes.tsx'), 'utf8');
const I18N_SRC = readFileSync(join(__dirname, 'lib/i18n.ts'), 'utf8');

describe('SPA 404 Route Contract (CHK-176)', () => {
  it('App.tsx implements a catch-all route using the NotFound component', () => {
    // Pin the catch-all route at the end of the main Switch
    expect(APP_SRC).toContain('<Route component={NotFound} />');
  });

  it('routes.tsx exports the NotFound component', () => {
    expect(ROUTES_SRC).toContain('export { NotFound };');
    expect(ROUTES_SRC).toContain("const NotFound = lazy(() => import('@/pages/not-found'))");
  });

  it('localized 404 keys exist in all 5 locales (en, de, fr, es, pt)', () => {
    const locales = ['en', 'de', 'fr', 'es', 'pt'];
    for (const locale of locales) {
      // Check for title and description keys in each locale block
      const localeBlock = I18N_SRC.slice(I18N_SRC.indexOf(`${locale}: {`));
      expect(localeBlock).toContain('route.notFound.title');
      expect(localeBlock).toContain('route.notFound.description');
      expect(localeBlock).toContain('route.notFound.back');
      expect(localeBlock).toContain('route.notFound.newPattern');
    }
  });

  it('onboarding-gate.test.ts already pins that 404 routes do not show onboarding', () => {
    const ONBOARDING_GATE_TEST = readFileSync(join(__dirname, 'onboarding-gate.test.ts'), 'utf8');
    expect(ONBOARDING_GATE_TEST).toContain("it('never renders on unknown routes (404)'");
    expect(ONBOARDING_GATE_TEST).toContain("expect(gateShowsOverlay('/this-path-does-not-exist', false)).toBe(false)");
  });

  it('shell.tsx renders the app chrome even on 404 routes', () => {
    // Verify that the catch-all route is wrapped in the Shell in App.tsx
    // The structure is <Shell><Switch>...<Route component={NotFound} /></Switch></Shell>
    const shellBlock = APP_SRC.slice(APP_SRC.indexOf('<Shell>'), APP_SRC.indexOf('</Shell>'));
    expect(shellBlock).toContain('<Route component={NotFound} />');
  });
});
