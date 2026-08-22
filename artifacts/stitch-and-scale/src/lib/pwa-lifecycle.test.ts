import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Lifecycle Maturity (QUEUE-046)', () => {
  const swPath = path.resolve(__dirname, '../../public/sw.js');
  const hookPath = path.resolve(__dirname, '../hooks/use-pwa-lifecycle.ts');
  const shellPath = path.resolve(__dirname, '../components/shell.tsx');
  const bannerPath = path.resolve(__dirname, '../components/pwa-status-banner.tsx');

  it('service worker handles SKIP_WAITING only after an explicit message', () => {
    const content = fs.readFileSync(swPath, 'utf-8');
    const installBlock = content.slice(content.indexOf("self.addEventListener('install'"), content.indexOf('// On activate'));
    const messageBlock = content.slice(content.indexOf("self.addEventListener('message'"), content.indexOf('// Fetch strategy'));

    expect(installBlock).not.toContain('skipWaiting');
    expect(messageBlock).toContain("event.data.type === 'SKIP_WAITING'");
    expect(messageBlock).toContain("self.skipWaiting()");
  });

  it('usePwaLifecycle hook tracks online/offline and updates', () => {
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content).toContain("window.addEventListener('online'");
    expect(content).toContain("window.addEventListener('offline'");
    expect(content).toContain("navigator.serviceWorker.ready");
    expect(content).toContain("reg.addEventListener('updatefound', handleUpdateFound)");
    expect(content).toContain("registration.waiting.postMessage({ type: 'SKIP_WAITING' })");
    expect(content).toContain("navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)");
    expect(content).toContain("observedRegistration?.removeEventListener('updatefound', handleUpdateFound)");
  });

  it('Shell component mounts PwaStatusBanner', () => {
    const content = fs.readFileSync(shellPath, 'utf-8');
    expect(content).toContain("import { PwaStatusBanner } from \"@/components/pwa-status-banner\"");
    expect(content).toContain("<PwaStatusBanner />");
  });

  it('PwaStatusBanner renders update and offline states', () => {
    const content = fs.readFileSync(bannerPath, 'utf-8');
    expect(content).toContain("updateAvailable");
    expect(content).toContain("isOnline");
    expect(content).toContain("applyUpdate");
    expect(content).toContain("copy.updateAvailable");
    expect(content).toContain("copy.offlineStatus");
  });
});
