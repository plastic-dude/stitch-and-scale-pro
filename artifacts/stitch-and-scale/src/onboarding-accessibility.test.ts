// CHK-131 — Onboarding is a full-screen dialog, so its keyboard and
// assistive-technology boundary must remain explicit during future refactors.
// This follows the repository's source-contract testing pattern.

import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.resolve(__dirname, 'pages/onboarding.tsx'),
  'utf-8',
);

describe('CHK-131 — onboarding accessibility contract', () => {
  it('keeps explicit dialog semantics and a stable dialog ref', () => {
    expect(source).toContain('ref={dialogRef}');
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
  });

  it('contains keyboard focus and restores the previous element', () => {
    expect(source).toContain("event.key !== 'Tab'");
    expect(source).toContain('event.preventDefault()');
    expect(source).toContain('previousFocusRef.current.focus()');
    expect(source).toContain("document.addEventListener('focusin', onFocusIn)");
  });

  it('hides and inert-izes the background while onboarding is active', () => {
    expect(source).toContain("sibling.setAttribute('inert', '')");
    expect(source).toContain("sibling.setAttribute('aria-hidden', 'true')");
    expect(source).toContain("sibling.removeAttribute('inert')");
  });

  it('respects reduced motion for the step transition', () => {
    expect(source).toContain('useReducedMotion');
    expect(source).toContain('transition={reduceMotion ? { duration: 0 }');
  });
});

export {};
