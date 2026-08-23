import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = (relativePath: string) => fs.readFileSync(
  path.resolve(__dirname, relativePath),
  'utf8',
);

const SHELL_SOURCE = source('components/shell.tsx');
const DASHBOARD_SOURCE = source('pages/dashboard.tsx');
const NEW_PROJECT_SOURCE = source('pages/new-project.tsx');
const PORTFOLIO_SOURCE = source('pages/portfolio.tsx');
const SETTINGS_SOURCE = source('pages/settings.tsx');
const INDEX_CSS_SOURCE = source('index.css');

describe('device-native responsive layout contracts', () => {
  it('keeps one primary route navigation below the desktop breakpoint', () => {
    expect(SHELL_SOURCE).toContain('<nav className="hidden lg:flex items-center gap-1 sm:gap-4">');
    expect(SHELL_SOURCE).toContain('aria-label="Primary mobile navigation" className="lg:hidden');
    expect(SHELL_SOURCE).toContain('<Link href="/" className="flex items-center gap-2.5 no-underline group">');
  });

  it('keeps fixed mobile surfaces tied to the device viewport and clears the footer', () => {
    expect(SHELL_SOURCE).toContain('w-[100dvw] max-w-[100dvw] box-border');
    expect(SHELL_SOURCE).toContain('pb-[calc(4.25rem+env(safe-area-inset-bottom))] pt-6 md:pt-0 lg:py-0 lg:h-16 lg:pb-0');
    expect(SHELL_SOURCE).toContain('Reserve its full visual height in the footer');
    expect(INDEX_CSS_SOURCE).toContain('@media (max-width: 1023px)');
    expect(INDEX_CSS_SOURCE).toContain('[data-sonner-toaster]');
    expect(INDEX_CSS_SOURCE).toContain('width: 100dvw !important;');
  });

  it('stacks portfolio planning and summary cards before the small breakpoint', () => {
    expect(PORTFOLIO_SOURCE).toContain('w-full min-w-0 max-w-5xl mx-auto p-4 md:p-6 space-y-5');
    expect(PORTFOLIO_SOURCE).toContain('grid grid-cols-1 sm:grid-cols-2 gap-3');
    expect(PORTFOLIO_SOURCE).toContain('grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3');
  });

  it('reserves space for project selectors and wraps batch actions on phones', () => {
    expect(DASHBOARD_SOURCE).toContain('flex flex-wrap items-center justify-between gap-3 bg-accent/5');
    expect(DASHBOARD_SOURCE).toContain('flex min-w-0 flex-wrap items-center gap-3 sm:gap-4');
    expect(DASHBOARD_SOURCE).toContain('pb-4 pt-6 pl-16 pr-6');
  });
});

describe('New Project grading-standard deep link', () => {
  it('links to the exact Settings section and preserves a stable focus contract', () => {
    expect(NEW_PROJECT_SOURCE).toContain('href="/settings?focus=grading-standard#grading-standard"');
    expect(SETTINGS_SOURCE).toContain('id="grading-standard"');
    expect(SETTINGS_SOURCE).toContain('scrollIntoView({ behavior: \'smooth\', block: \'start\' })');
    expect(SETTINGS_SOURCE).toContain('querySelector<HTMLButtonElement>(\'[aria-pressed="true"]\')');
    expect(SETTINGS_SOURCE).toContain('aria-pressed={sizingStandard === \'CYC\'}');
    expect(SETTINGS_SOURCE).toContain('aria-pressed={sizingStandard === \'Custom\'}');
  });
});
