import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Onboarding Footer Spacing (F-10)', () => {
  const sourcePath = path.resolve(__dirname, 'onboarding.tsx');
  const source = fs.readFileSync(sourcePath, 'utf8');

  it('reserves bottom space for the fixed mobile footer', () => {
    // Q65: increased bottom padding to pb-48 for better mobile clearance
    expect(source).toContain('pb-48 sm:pb-10');
  });

  it('uses fixed positioning with safe-area padding for the footer', () => {
    // Q64: stronger safe-area footer padding
    expect(source).toContain('fixed bottom-0 left-0 right-0');
    expect(source).toContain('pb-[max(env(safe-area-inset-bottom),1.5rem)]');
  });

  it('uses backdrop-blur for footer legibility over content', () => {
    expect(source).toContain('backdrop-blur-sm');
  });
});
