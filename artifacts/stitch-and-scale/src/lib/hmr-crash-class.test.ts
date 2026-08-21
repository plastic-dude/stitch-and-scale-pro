/**
 * CHK-152 regression guard (QUEUE-010).
 *
 * Defect class: a lab card built a project-scoped storage handle with
 * `useMemo(() => projectStorage(...), [project.id])` and then initialized
 * its persisted state with `useState(() => loadStored(handle))`. Under Vite
 * HMR the module re-runs but the useMemo dependency never changes, so the
 * new handle closes over disposed storage infrastructure and React 18's
 * strict-mode double-invoke of the lazy initializer throws (handle.read on
 * a disposed client). Crash class sites converted: giftcard, testknit-desk,
 * translation-bundle, trunk-show, submission-pipeline, kal-roi,
 * channel-funnel, club-revenue, wholesale-book, hire-vs-self,
 * inclusive-sizing, pattern-club, pattern-license, membership,
 * promotion, price-window, retention, platform-mix.
 *
 * This guard test scans every converted card source to make sure the exact
 * crash signature cannot sneak back in.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(import.meta.dirname, '..', 'components');

const CARDS = [
  'giftcard-lab-card.tsx',
  'testknit-desk-card.tsx',
  'translation-bundle-card.tsx',
  'trunk-show-card.tsx',
  'submission-pipeline-card.tsx',
  'kal-roi-card.tsx',
  'channel-funnel-card.tsx',
  'club-revenue-card.tsx',
  'wholesale-book-card.tsx',
  'hire-vs-self-card.tsx',
  'inclusive-sizing-card.tsx',
  'pattern-club-card.tsx',
  'pattern-license-card.tsx',
  'membership-card.tsx',
  'promotion-card.tsx',
  'price-window-card.tsx',
  'retention-card.tsx',
  'platform-mix-card.tsx',
] as const;

describe('HMR crash class guard (QUEUE-010 / CHK-152)', () => {
  it('no converted card re-uses the lazy-init-with-handle signature', () => {
    const signatures = [
      // The direct crash pattern.
      /\buseState(?:<[^>]+>)?\s*\(\s*\(\s*\)\s*=>\s*loadStored\s*\(\s*handle\s*\)\s*\)/,
      // The fresh-handle factory feeding the above.
      /useMemo\s*\(\s*\(\s*\)\s*=>\s*projectStorage\s*</,
      // Any raw projectStorage construction outside the seam (import stays
      // in storage-lib only; components must use the seam hooks).
      /\bprojectStorage\s*<|\bprojectStorage\s*\(/,
    ];
    for (const card of CARDS) {
      const src = fs.readFileSync(path.join(SRC, card), 'utf-8');
      for (const sig of signatures) {
        expect(sig.test(src), `${card} matched forbidden signature ${sig}`)
          .toBe(false);
      }
      // loadStored must no longer take a handle (pure derivation).
      expect(/loadStored\(handle:/.test(src), `${card}: loadStored still takes a handle`).toBe(false);
    }
  });

  it('storage-lib exports the seam hooks used by every card', () => {
    const lib = fs.readFileSync(
      path.resolve(SRC, '..', 'lib', 'storage-lib.ts'),
      'utf-8',
    );
    expect(/export function useProjectStorage</.test(lib)).toBe(true);
    expect(/export function useProjectStorageState</.test(lib)).toBe(true);
    // And the legacy raw `projectStorage(` construction is sealed inside the
    // seam module — components must not build handles directly.
    expect(/export function projectStorage</.test(lib)).toBe(true);
  });
});
