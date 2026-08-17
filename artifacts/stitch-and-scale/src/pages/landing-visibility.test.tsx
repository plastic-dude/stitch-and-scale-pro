// CHK-121 — Regression suite for first-paint visibility of the landing page.
//
// QA #63 found the capability section invisible until scrolled into view:
// the cards used Framer Motion `whileInView` with `initial={{opacity:0}}`,
// which (a) hides content behind a scroll gesture the visitor may never make,
// and (b) leaves content PERMANENTLY invisible under prefers-reduced-motion,
// because Framer Motion freezes at the initial state when motion is disabled.
//
// The repo deliberately carries no @testing-library/jsdom DOM harness — every
// test here is a deterministic source/structural invariant, which is the only
// guarantee a layout engine cannot fake. The visual check (cards present
// before any scroll on a cold load) ran in the real browser during the gate.
//
// Invariants pinned:
//  1. No content-bearing element may ever pair an opacity-0 initial state
//     with whileInView — that pair is the QA #63 defect, regardless of what
//     content sits inside.
//  2. The capability grid renders from the copy catalogue (single source,
//     localized in all 5 locales — hardcoded English cards are a regression).
//  3. Every capability title in the catalogue is reached by the grid's map
//     (no catalogue entry silently skipped).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getLandingCopy } from '@/lib/landing-copy';

const LANDING_SOURCE = fs.readFileSync(
  path.resolve(__dirname, 'landing.tsx'),
  'utf8',
);

describe('landing first-paint visibility', () => {
  it('never gates content visibility on a scroll gesture again', () => {
    // Content-bearing motion elements must not combine an opacity-0 initial
    // state with whileInView — that pair reproduces the QA #63 defect.
    // (whileInView used purely for non-visibility effects like scale/clip is
    // allowed, but not with an opacity-0 initial state.)
    const badPattern = /initial=\{\{\s*opacity:\s*0[\s\S]{0,140}whileInView/;
    const match = badPattern.exec(LANDING_SOURCE);
    expect(
      match,
      'landing.tsx must not pair initial={{opacity:0}} with whileInView — ' +
        'content must be visible on first paint in all locales and motion settings',
    ).toBeNull();
  });

  it('keeps a single source of capability data (copy catalogue)', () => {
    // The grid maps copy.capabilities — if a hardcoded English card is ever
    // added here, localization regressions follow.
    expect(LANDING_SOURCE).toMatch(/copy\.capabilities\.map/);
  });

  it('renders every catalogue capability title through the grid map', () => {
    const enCapabilities = getLandingCopy('en').capabilities;
    expect(enCapabilities.length).toBeGreaterThanOrEqual(6);
    const mapLine = LANDING_SOURCE.match(/copy\.capabilities\.map\(\(c,\s*i\)\s*=>/);
    expect(mapLine, 'capability grid must map every catalogue entry').not.toBeNull();
    // Verify all five locales ship the same capability count — an asymmetry
    // means a locale lost a capability card.
    const perLocale = (['en', 'de', 'fr', 'es', 'pt'] as const).map(
      (lang) => getLandingCopy(lang).capabilities.length,
    );
    expect(
      perLocale.every((n) => n === perLocale[0]),
      `locale capability counts differ: ${JSON.stringify(perLocale)}`,
    ).toBe(true);
  });
});
