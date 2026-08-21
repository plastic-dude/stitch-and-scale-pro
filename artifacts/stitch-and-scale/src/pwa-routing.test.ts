import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('PWA Routing Configuration', () => {
  it('vercel.json should have explicit rewrites for manifest files to prevent SPA shell hijacking', () => {
    const vercelJsonPath = path.resolve(process.cwd(), '../../vercel.json');
    const vercelJson = JSON.parse(readFileSync(vercelJsonPath, 'utf-8'));
    
    const rewrites = vercelJson.rewrites || [];
    
    const manifestWebmanifest = rewrites.find((r: any) => r.source === '/manifest.webmanifest');
    const manifestJson = rewrites.find((r: any) => r.source === '/manifest.json');
    const swJs = rewrites.find((r: any) => r.source === '/sw.js');
    const spaCatchAll = rewrites.find((r: any) => r.destination === '/index.html');
    
    expect(manifestWebmanifest).toBeDefined();
    expect(manifestWebmanifest.destination).toBe('/manifest.webmanifest');
    
    expect(manifestJson).toBeDefined();
    expect(manifestJson.destination).toBe('/manifest.json');
    
    expect(swJs).toBeDefined();
    expect(swJs.destination).toBe('/sw.js');
    
    expect(spaCatchAll).toBeDefined();
    expect(spaCatchAll.destination).toBe('/index.html');
    
    // Ensure manifest rewrites come BEFORE the SPA catch-all
    const manifestIndex = rewrites.indexOf(manifestWebmanifest);
    const spaIndex = rewrites.indexOf(spaCatchAll);
    expect(manifestIndex).toBeLessThan(spaIndex);
  });

  it('manifest files should exist in the public directory', () => {
    const publicDir = path.resolve(process.cwd(), 'public');
    expect(readFileSync(path.join(publicDir, 'manifest.json'))).toBeDefined();
    expect(readFileSync(path.join(publicDir, 'manifest.webmanifest'))).toBeDefined();
    expect(readFileSync(path.join(publicDir, 'sw.js'))).toBeDefined();
  });
});
