import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';

describe('Deployment Security (F-13, F-14)', () => {
  const rootDir = join(process.cwd(), '..', '..');

  it('vercel.json does not overlay wildcard CORS on the exact-origin MCP handler', () => {
    const source = readFileSync(join(rootDir, 'vercel.json'), 'utf-8');
    const config = JSON.parse(source);
    const staticHeaders = (config.headers ?? []).flatMap((entry: any) => entry.headers ?? []);
    expect(staticHeaders).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'Access-Control-Allow-Origin', value: '*' }),
    ]));
  });

  it('vercel.json implements strict SPA routing (no wildcard for API/assets)', () => {
    const source = readFileSync(join(rootDir, 'vercel.json'), 'utf-8');
    const config = JSON.parse(source);
    
    const spaRewrite = config.rewrites.find((r: any) => r.destination === '/');
    expect(spaRewrite).toBeDefined();
    expect(config.cleanUrls).toBe(true);
    expect(spaRewrite.source).toContain('/:path(');
    expect(spaRewrite.source).toContain('?!api');
    expect(spaRewrite.source).toContain('api(?:/|$)');
    expect(spaRewrite.source).toContain('assets(?:/|$)');
    expect(spaRewrite.source).not.toMatch(/\)\$$/);
  });

  it('mockup sandbox supplies deterministic build-only preview values', () => {
    const packagePath = join(rootDir, 'artifacts', 'mockup-sandbox', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    expect(packageJson.scripts.build).toBe('PORT=8081 BASE_PATH=/__mockup vite build');
  });

  it('workspace build serializes package builds for constrained release runners', () => {
    const packagePath = join(rootDir, 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    expect(packageJson.scripts.build).toContain('--workspace-concurrency=1');
  });

  it('splash screen uses the square app icon instead of the oversized portrait asset', () => {
    const splashPath = join(rootDir, 'artifacts', 'stitch-and-scale', 'src', 'components', 'splash-screen.tsx');
    const splashSource = readFileSync(splashPath, 'utf-8');
    expect(splashSource).toContain('src="/icon-192.png"');
    expect(splashSource).not.toContain('src="/app-icon.png"');

    const splashIconPath = join(rootDir, 'artifacts', 'stitch-and-scale', 'public', 'icon-192.png');
    expect(statSync(splashIconPath).size).toBeLessThan(64 * 1024);
  });

  it('app shell uses the right-sized favicon for browser chrome', () => {
    const htmlPath = join(rootDir, 'artifacts', 'stitch-and-scale', 'index.html');
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('href="/favicon-32.png"');
    expect(html).not.toMatch(/rel="icon"[^>]+href="\/favicon\.png"/);

    const faviconPath = join(rootDir, 'artifacts', 'stitch-and-scale', 'public', 'favicon-32.png');
    expect(statSync(faviconPath).size).toBeLessThan(16 * 1024);
  });

  it('runtime branding avoids loading the oversized source favicon', () => {
    const sourcePaths = [
      join(rootDir, 'artifacts', 'stitch-and-scale', 'src', 'components', 'shell.tsx'),
      join(rootDir, 'artifacts', 'stitch-and-scale', 'src', 'pages', 'landing.tsx'),
      join(rootDir, 'artifacts', 'stitch-and-scale', 'src', 'lib', 'pdf', 'renderer.ts'),
    ];
    for (const sourcePath of sourcePaths) {
      const source = readFileSync(sourcePath, 'utf-8');
      expect(source).not.toContain('/favicon.png');
      expect(source).toContain('/favicon-192.png');
    }

    const faviconPath = join(rootDir, 'artifacts', 'stitch-and-scale', 'public', 'favicon-192.png');
    expect(statSync(faviconPath).size).toBeLessThan(64 * 1024);
  });

  it('active app-logo consumers prefer the lossless WebP payload with a PNG fallback', () => {
    const sourcePaths = [
      join(rootDir, 'artifacts', 'stitch-and-scale', 'src', 'pages', 'about-emlux.tsx'),
      join(rootDir, 'artifacts', 'stitch-and-scale', 'src', 'pages', 'dashboard.tsx'),
      join(rootDir, 'artifacts', 'stitch-and-scale', 'src', 'pages', 'landing.tsx'),
      join(rootDir, 'artifacts', 'stitch-and-scale', 'src', 'pages', 'onboarding.tsx'),
    ];
    for (const sourcePath of sourcePaths) {
      const source = readFileSync(sourcePath, 'utf-8');
      expect(source).toContain('srcSet="/app-logo.webp"');
      expect(source).toContain('src="/app-logo.png"');
    }

    const webpPath = join(rootDir, 'artifacts', 'stitch-and-scale', 'public', 'app-logo.webp');
    expect(statSync(webpPath).size).toBeLessThan(450 * 1024);
  });
});
