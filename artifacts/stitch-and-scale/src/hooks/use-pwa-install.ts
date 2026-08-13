import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's non-standard flag for "added to home screen"
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectIOS(): boolean {
  const ua = window.navigator.userAgent;
  const isIPadOrIPhone = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as "Macintosh" but exposes multi-touch, unlike a real Mac
  const isIPadOS13Plus = ua.includes('Macintosh') && navigator.maxTouchPoints > 1;
  return isIPadOrIPhone || isIPadOS13Plus;
}

function detectSafari(): boolean {
  const ua = window.navigator.userAgent;
  // Chrome/Edge/Firefox on iOS all include "Safari" in their UA too, so this
  // only means anything combined with isIOS — it's here to exclude the rare
  // case of a non-WebKit-shell iOS browser rather than to detect Safari on
  // desktop.
  return /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
}

/**
 * Wraps the native beforeinstallprompt flow, plus iOS detection.
 *
 * beforeinstallprompt is Chrome/Edge/Android only — Safari and iOS never
 * fire it. There's no programmatic install trigger on iOS at all; the only
 * path is the user manually tapping Share -> Add to Home Screen. So this
 * hook also exposes `isIOSSafari` so callers can show real instructions
 * instead of a button that would silently do nothing.
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandalone);
  const [isIOSSafari] = useState(() => detectIOS() && detectSafari());

  useEffect(() => {
    if (isInstalled) return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [isInstalled]);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') setIsInstalled(true);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  return {
    /** True once the browser has signaled the app is installable right now. */
    canInstall: !!deferredPrompt && !isInstalled,
    /** True on iOS Safari specifically — no programmatic prompt exists here. */
    isIOSSafari: isIOSSafari && !isInstalled,
    isInstalled,
    promptInstall,
  };
}
