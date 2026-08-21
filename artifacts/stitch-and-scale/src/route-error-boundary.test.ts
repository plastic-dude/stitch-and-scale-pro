import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOUNDARY_PATH = join(import.meta.dirname ?? __dirname, 'components', 'route-error-boundary.tsx');
const APP_PATH = join(import.meta.dirname ?? __dirname, 'App.tsx');
const BOUNDARY = readFileSync(BOUNDARY_PATH, 'utf8');
const APP = readFileSync(APP_PATH, 'utf8');

describe('route recovery boundary', () => {
  it('provides localized recovery copy for every supported language', () => {
    for (const language of ['en', 'de', 'fr', 'es', 'pt']) {
      expect(BOUNDARY).toMatch(new RegExp(`\\n  ${language}: \\{`));
    }
  });

  it('offers both a retry action and an escape back to Projects', () => {
    expect(BOUNDARY).toContain('window.location.reload()');
    expect(BOUNDARY).toContain("window.location.assign('/')");
    expect(BOUNDARY).toContain('role="alert"');
    expect(BOUNDARY).toContain('min-h-11');
  });

  it('wraps the routed application shell instead of leaving lazy routes unguarded', () => {
    expect(APP).toContain("import { RouteErrorBoundary, getRouteErrorCopy } from '@/components/route-error-boundary';");
    expect(APP).toContain('<RouteErrorBoundary copy={routeErrorCopy}>');
    expect(APP).toContain('</RouteErrorBoundary>');
  });
});
