import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Release Integrity (QUEUE-029)', () => {
  const rootDir = join(process.cwd(), '..', '..');

  it('package.json has production smoke gate scripts', () => {
    const source = readFileSync(join(process.cwd(), 'package.json'), 'utf-8');
    const pkg = JSON.parse(source);
    
    expect(pkg.scripts.smoke).toBeDefined();
    expect(pkg.scripts['smoke:prod']).toBeDefined();
    expect(pkg.scripts['smoke:prod']).toContain('prod-smoke.mjs');
  });

  it('prod-smoke.mjs exists and contains critical assertions', () => {
    const smokeScript = readFileSync(join(rootDir, 'scripts', 'prod-smoke.mjs'), 'utf-8');
    
    expect(smokeScript).toContain("document.getElementById('root').innerHTML");
    expect(smokeScript).toContain("Production #root element is empty");
    expect(smokeScript).toContain("!!document.querySelector('header')");
    expect(smokeScript).toContain("!!document.querySelector('nav')");
  });

  it('WorkspaceCopy interface includes health status keys', () => {
    const copySource = readFileSync(join(process.cwd(), 'src', 'lib', 'workspace-copy.ts'), 'utf-8');
    
    expect(copySource).toContain('healthReady: string;');
    expect(copySource).toContain('healthLoading: string;');
    expect(copySource).toContain('healthError: string;');
  });

  it('HealthIndicator component is implemented', () => {
    const indicatorSource = readFileSync(join(process.cwd(), 'src', 'components', 'health-indicator.tsx'), 'utf-8');
    
    expect(indicatorSource).toContain('export function HealthIndicator()');
    expect(indicatorSource).toContain("document.getElementById('root')");
    expect(indicatorSource).toContain("setStatus('ready')");
  });
});
