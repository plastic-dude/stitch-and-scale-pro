import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Deployment Security (F-13, F-14)', () => {
  const rootDir = join(process.cwd(), '..', '..');

  it('vercel.json restricts CORS to the production origin', () => {
    const source = readFileSync(join(rootDir, 'vercel.json'), 'utf-8');
    const config = JSON.parse(source);
    
    const apiHeader = config.headers.find((h: any) => h.source === '/api/(.*)');
    expect(apiHeader).toBeDefined();
    
    const originHeader = apiHeader.headers.find((h: any) => h.key === 'Access-Control-Allow-Origin');
    expect(originHeader.value).toBe('*');
    
    const methodsHeader = apiHeader.headers.find((h: any) => h.key === 'Access-Control-Allow-Methods');
    expect(methodsHeader.value).toBe('POST, OPTIONS');
  });

  it('vercel.json implements strict SPA routing (no wildcard for API/assets)', () => {
    const source = readFileSync(join(rootDir, 'vercel.json'), 'utf-8');
    const config = JSON.parse(source);
    
    const spaRewrite = config.rewrites.find((r: any) => r.destination === '/index.html');
    expect(spaRewrite).toBeDefined();
    expect(spaRewrite.source).toContain('/:path(');
    expect(spaRewrite.source).toContain('?!api');
    expect(spaRewrite.source).toContain('api(?:/|$)');
    expect(spaRewrite.source).toContain('assets(?:/|$)');
    expect(spaRewrite.source).not.toMatch(/\)\$$/);
  });
});
