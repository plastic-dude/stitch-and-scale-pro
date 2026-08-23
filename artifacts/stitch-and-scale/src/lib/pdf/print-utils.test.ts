// CHK-153 regression suite — QUEUE-013 (F-04 PDF export stuck)
//
// The anti-stuck contract: openPrintWindow must (a) return a typed
// PrintAttemptResult on every path, (b) report recoverable failures
// synchronously, (c) hand the outcome to window.afterprint, and (d) the
// page must drive the UI with that result plus a bounded fallback timer —
// never a fixed blind setTimeout while the OS print dialog blocks the JS
// thread (window.print() blocks until the dialog closes, which is exactly
// why the old 1500ms reset could not fire and left "Preparing your PDF…"
// stuck forever).
//
// Runtime DOM tests are avoided per the project's structural-test convention
// (no jsdom in this project — see grading-print-sheet.test.ts); the state
// machine is pinned structurally, and the pure utilities are pinned at
// runtime.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const UTILS = join(__dirname, 'print-utils.ts');
const PAGE = join(__dirname, '..', '..', 'pages', 'project-pdf.tsx');
const src = readFileSync(UTILS, 'utf8');
const pageSrc = readFileSync(PAGE, 'utf8');

// ── Pure utilities (unchanged behavior, pinned at runtime) ─────────────────

import {
  getDefaultFilename,
  sanitizeFilename,
  detectNamingStyle,
  applyNamingTemplate,
} from './print-utils';

describe('sanitizeFilename', () => {
  it('removes traversal sequences, path separators, and invalid characters', () => {
    expect(sanitizeFilename('../secret')).toBe('secret');
    // '..' stripped first leaves 'a/b', then '/' becomes a dash — separators
    // never pass through, characters between them stay.
    expect(sanitizeFilename('a/../b')).toBe('a-b');
    expect(sanitizeFilename('Top/Secret: "Project"')).toBe('Top-Secret- -Project');
    expect(sanitizeFilename('win\\file')).toBe('win-file');
    // control chars and NUL stripped entirely
    expect(sanitizeFilename('a\x00b\x1fc')).toBe('abc');
  });

  it('strips trailing dots and spaces that Windows silently removes', () => {
    expect(sanitizeFilename('My Sweater.')).toBe('My Sweater');
    expect(sanitizeFilename('My Sweater... ')).toBe('My Sweater');
  });

  it('collapses whitespace and removes surrogate-adjacent empty tokens', () => {
    expect(sanitizeFilename('   My   Sweater   ')).toBe('My Sweater');
  });

  it('blocks Windows reserved device names with any extension', () => {
    for (const bad of ['CON', 'con', 'PRN', 'AUX', 'NUL', 'COM1', 'COM9', 'LPT1', 'CON.txt', 'nul.log']) {
      expect(sanitizeFilename(bad)).toBe('Pattern');
    }
  });

  it('never returns an empty string — falls back to a usable basename', () => {
    expect(sanitizeFilename('')).toBe('Pattern');
    expect(sanitizeFilename('   ')).toBe('Pattern');
    expect(sanitizeFilename('<<<>>>???')).toBe('Pattern');
    expect(sanitizeFilename('...')).toBe('Pattern');
  });

  it('caps at 180 characters', () => {
    expect(sanitizeFilename('a'.repeat(300)).length).toBe(180);
  });
});

describe('getDefaultFilename', () => {
  it('uses the project name with invalid filename chars sanitized', () => {
    expect(getDefaultFilename('My Sweater')).toBe('My Sweater');
    expect(getDefaultFilename('Top/Secret: "Project"')).toBe('Top-Secret- -Project');
  });

  it('caps at 180 characters and never returns an empty name', () => {
    const longName = 'a'.repeat(300);
    expect(getDefaultFilename(longName).length).toBe(180);
    // An empty project name still yields a usable, non-empty basename.
    const empty = getDefaultFilename('');
    expect(empty).toBeTruthy();
    expect(empty.length).toBeGreaterThan(0);
  });
});

describe('detectNamingStyle', () => {
  it('returns null when the edited name equals the default', () => {
    expect(detectNamingStyle('My Sweater.pdf', 'My Sweater')).toBeNull();
  });

  it('captures prefix/suffix templates around the default name', () => {
    expect(detectNamingStyle('FINAL - My Sweater', 'My Sweater')).toBe('FINAL - {name}');
    expect(detectNamingStyle('My Sweater (v2).pdf', 'My Sweater')).toBe('{name} (v2)');
  });

  it('refuses to persist a completely unrelated custom name', () => {
    expect(detectNamingStyle('Something Else Entirely', 'My Sweater')).toBeNull();
  });
});

describe('applyNamingTemplate', () => {
  it('replaces the {name} placeholder with the sanitized project name', () => {
    expect(applyNamingTemplate('FINAL - {name}', 'My Sweater')).toBe('FINAL - My Sweater');
  });

  it('sanitizes dangerous user characters inside the template before exporting', () => {
    // F-05: a template containing path separators must not survive into the
    // exported filename.
    expect(applyNamingTemplate('{name}/../leak', 'My Sweater')).toBe('My Sweater-leak');
    expect(applyNamingTemplate('{name}: <bad>', 'My Sweater')).toBe('My Sweater- -bad');
  });

  it('falls back to the default filename when the template has no placeholder', () => {
    expect(applyNamingTemplate('static-name', 'My Sweater')).toBe(getDefaultFilename('My Sweater'));
    expect(applyNamingTemplate('', 'My Sweater')).toBe(getDefaultFilename('My Sweater'));
  });
});

// ── State-machine contract (structural) ────────────────────────────────────

describe('print-utils state-machine contract', () => {
  it('returns a typed PrintAttemptResult on every path (discriminated union)', () => {
    expect(src).toContain('export type PrintAttemptResult');
    expect(src).toContain('{ ok: true; path: "iframe" | "new-window" | "blob" }');
    expect(src).toContain('{ ok: false; reason: "blocked" | "no-window" | "write-failed" | "unknown" }');
    // Every return site must be one of the union members.
    const returns = [...src.matchAll(/return \{[^}]*\}/g)].map(m => m[0]);
    expect(returns.length).toBeGreaterThan(0);
    for (const r of returns) {
      expect(r).toMatch(/ok: (true|false)/);
    }
  });

  it('guards rapid double clicks with a module-level in-flight lock', () => {
    // The lock exists, guards the second call synchronously, and is released
    // on afterprint and on every failure branch.
    expect(src).toContain('let inFlight = false');
    expect(src).toMatch(/if \(inFlight\)[\s\S]*?return \{ ok: false, reason: "blocked" \}/);
    expect(src).toContain('inFlight = true');
    // Released on afterprint (both the iframe path and the mobile path).
    const afterprintRelease = (src.match(/onafterprint[\s\S]*?inFlight = false/g) || []).length;
    expect(afterprintRelease).toBeGreaterThanOrEqual(2);
    // Released on every failure branch.
    const failReleases = (src.match(/inFlight = false/g) || []).length;
    expect(failReleases).toBeGreaterThanOrEqual(4);
  });

  it('registers afterprint on the print surface for both paths (iframe + new window)', () => {
    // The OS print dialog reports close/cancel/save through afterprint —
    // the signal that did not exist before CHK-153.
    const matches = [...src.matchAll(/onafterprint[\s\S]{0,300}/g)];
    // At least one registration on the iframe window and one on the mobile window.
    const iframePath = matches.some(m => /contentWindow/.test(src.slice(Math.max(0, m.index! - 800), m.index! + m[0].length)));
    const mobilePath = matches.some(m => /addEventListener\("load"/.test(src.slice(Math.max(0, m.index! - 1200), m.index! + m[0].length)));
    expect(iframePath, 'iframe path must observe afterprint').toBe(true);
    expect(mobilePath, 'mobile new-window path must observe afterprint').toBe(true);
  });

  it('does not expose afterprint as a success callback to page code', () => {
    expect(src).not.toContain('onPrintSuccess');
    expect(pageSrc).not.toContain('openPrintWindow(previewHtml, suggestedPdf,');
    expect(pageSrc).toContain('tc.artifactPrepared(suggestedPdf)');
    expect(pageSrc).toContain('metadata-only');
  });

  it('writes into the print surface through a single safe helper that never throws', () => {
    expect(src).toContain('function writeInto(');
    expect(src).toMatch(/function writeInto[\s\S]*?try \{[\s\S]*?document\.close[\s\S]*?\} catch \{[\s\S]*?return false/m);
  });

  it('removes the orphaned iframe only after the print dialog closes', () => {
    // before CHK-153 the iframe was removed on a blind 5000ms timer, racing
    // the dialog. Now removal is anchored to afterprint.
    expect(src).toContain('onafterprint');
    expect(src).toMatch(/onafterprint[\s\S]*?document\.body\.removeChild\(iframe\)/);
    expect(src).not.toContain('5000');
  });
});

// ── Page wiring (structural) ───────────────────────────────────────────────

describe('project-pdf export state machine', () => {
  it('consumes the attempt result: failure toast + immediate re-enable', () => {
    expect(pageSrc).toContain('const attempt = openPrintWindow(');
    expect(pageSrc).toMatch(/if \(!attempt\.ok\)[\s\S]*?setIsExporting\(false\)/);
    expect(pageSrc).toMatch(/if \(!attempt\.ok\)[\s\S]*?toast\(/);
    expect(pageSrc).toMatch(/toast\(\{[\s\S]*?variant: 'destructive'[\s\S]*?\}/);
  });

  it('does not leave the page UI dependent on a blind print-dialog timer', () => {
    // The old "setTimeout(() => setIsExporting(false), 1500)" ran while
    // window.print() blocked the JS thread — the stuck-state root cause.
    expect(pageSrc).not.toMatch(/setTimeout\(\(\) => setIsExporting\(false\), 1500\)/);
    // The page owns only the short preparation/handoff state. The print
    // utility owns the dialog lifecycle; no page-side timeout is allowed to
    // pretend that a dialog has closed or saved a file.
    expect(pageSrc).not.toContain('resetExportTimer');
    expect(pageSrc).not.toContain("window.addEventListener('afterprint'");
    expect(pageSrc).toMatch(/const attempt = openPrintWindow\([\s\S]*?\n[\s\S]*?setIsExporting\(false\);/);
  });

  it('releases the page UI immediately after a successful print handoff', () => {
    const successStart = pageSrc.indexOf('if (!attempt.ok)');
    expect(successStart).toBeGreaterThan(-1);
    const successChunk = pageSrc.slice(successStart, successStart + 1500);
    expect(successChunk).toContain('setIsExporting(false)');
    expect(successChunk).toContain('The print utility has accepted the handoff');
  });

  it('uses the print-prepared copy instead of claiming a saved PDF', () => {
    const toastCopy = join(__dirname, '..', 'toast-copy.ts');
    const toastSrc = readFileSync(toastCopy, 'utf8');
    expect(toastSrc).toContain('artifactPrepared: (label: string) => string;');
    expect((toastSrc.match(/artifactPrepared:/g) || []).length).toBe(6);
    expect(pageSrc).not.toContain('tc.artifactCreated(');
  });

  it('translates the failure title in all five locales', () => {
    const labels = join(__dirname, 'labels.ts');
    const labelsSrc = readFileSync(labels, 'utf8');
    expect(labelsSrc).toContain("exportFailed: 'Export failed'");
    expect(labelsSrc).toContain("exportFailed: 'Export fehlgeschlagen'");
    expect(labelsSrc).toContain("exportFailed: \"L'export a échoué\"");
    expect(labelsSrc).toContain("exportFailed: 'La exportación falló'");
    expect(labelsSrc).toContain("exportFailed: 'A exportação falhou'");
    // Interface must declare the key so a missing locale is a type error.
    expect(labelsSrc).toContain('exportFailed: string;');
    const occurrences = (labelsSrc.match(/exportFailed/g) || []).length;
    expect(occurrences).toBe(6);
  });
});
