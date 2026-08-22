import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Onboarding Footer Spacing (F-10)', () => {
  const sourcePath = path.resolve(__dirname, 'onboarding.tsx');
  const source = fs.readFileSync(sourcePath, 'utf8');

  it('reserves bottom space for the fixed mobile footer', () => {
    // F-10 fix: main content must have pb-32 on mobile to prevent overlap
    expect(source).toContain('pb-32 sm:pb-10');
  });

  it('uses fixed positioning with safe-area padding for the footer', () => {
    // F-10 fix: footer must be fixed and respect safe-area-inset-bottom
    expect(source).toContain('fixed bottom-0 left-0 right-0');
    expect(source).toContain('pb-[env(safe-area-inset-bottom,16px)]');
  });

  it('uses backdrop-blur for footer legibility over content', () => {
    expect(source).toContain('backdrop-blur-sm');
  });
});
