// CHK-129 — structural regression suite: the app-shell header nav links are
// icon-only at phone widths (<640px, labels hidden until md) so their hit
// areas must never regress below the 44×44px touch-target minimum
// (QA LIVE-004 / CHK-123 family). The three plain nav links were p-2
// (36×36px) and the New Project button was h-9 (36px). All four must carry
// min-h-11 (44px) at every width.
//
// Reads source text at test time (fs pattern used by touch-target.test.ts)
// — no jsdom dependency.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SHELL_PATH = join(import.meta.dirname ?? __dirname, 'components', 'shell.tsx');
const SRC = readFileSync(SHELL_PATH, 'utf8');

const NAV_LINKS = ['href="/"', 'href="/portfolio"', 'href="/settings"', 'href="/project/new"'];

describe('shell header nav touch targets (CHK-129)', () => {
  it('every nav link in the header nav carries min-h-11 (44px)', () => {
    const navMatch = SRC.match(/<nav className="flex items-center gap-1[^>]*">([\s\S]*?)<\/nav>/);
    expect(navMatch, 'header nav must exist').not.toBeNull();
    const nav = navMatch![1];
    // The nav contains four Link elements; collect each one's full tag.
    const linkTags = [...nav.matchAll(/<Link [\s\S]*?<\/Link>/g)].map((m) => m[0]);
    expect(linkTags.length).toBeGreaterThanOrEqual(4);
    for (const tag of linkTags) {
      expect(tag, `min-h-11 missing on nav Link: ${tag.slice(0, 80)}`).toContain('min-h-11');
    }
  });

  it('the icon-only nav links (/, /portfolio, /settings) also carry min-w-11', () => {
    const navMatch = SRC.match(/<nav className="flex items-center gap-1[^>]*">([\s\S]*?)<\/nav>/);
    const nav = navMatch![1];
    const iconLinks = [...nav.matchAll(/<Link [\s\S]*?<\/Link>/g)]
      .map((m) => m[0])
      .filter((tag) => /href="\/"|href="\/portfolio"|href="\/settings"/.test(tag));
    expect(iconLinks.length, `expected 3 icon-only nav links, found ${iconLinks.length}`).toBe(3);
    for (const tag of iconLinks) {
      expect(tag, `min-w-11 missing on icon-only nav Link: ${tag.slice(0, 80)}`).toContain('min-w-11');
    }
  });

  it('no p-2-only nav link without a min-h guard exists', () => {
    // p-2 alone resolves to 36×36px at any width — a regression hazard.
    const navMatch = SRC.match(/<nav className="flex items-center gap-1[^>]*">([\s\S]*?)<\/nav>/);
    const nav = navMatch![1];
    const vulnerable = [...nav.matchAll(/<Link [\s\S]*?<\/Link>/g)]
      .map((m) => m[0])
      .filter((tag) => /(^|[\s"'`])p-2($|[\s"'`])/.test(tag) && !/min-h-11/.test(tag));
    expect(vulnerable).toHaveLength(0);
  });

  it('the nav label spans hide on phones (icon-only mode) — confirming which widths the 44px guard protects', () => {
    const navMatch = SRC.match(/<nav className="flex items-center gap-1[^>]*">([\s\S]*?)<\/nav>/);
    const nav = navMatch![1];
    const hiddenOnPhone = [...nav.matchAll(/<span className="hidden md:inline[^"]*"[^>]*>/g)];
    expect(hiddenOnPhone.length).toBeGreaterThanOrEqual(3);
  });

  it('the New Project button keeps its 44px hit area on the icon-only breakpoint', () => {
    const navMatch = SRC.match(/<nav className="flex items-center gap-1[^>]*">([\s\S]*?)<\/nav>/);
    const nav = navMatch![1];
    const newProj = [...nav.matchAll(/<Link [\s\S]*?<\/Link>/g)].find((m) =>
      /href="\/project\/new"/.test(m[0]),
    );
    expect(newProj, 'New Project nav link must exist').not.toBeUndefined();
    expect(newProj![0]).toContain('min-h-11');
    // h-9 must NOT be present (36px) — only the min-h-11 guard remains.
    expect(newProj![0]).not.toMatch(/(^|[\s"'`])h-9($|[\s"'`])/);
  });
});
