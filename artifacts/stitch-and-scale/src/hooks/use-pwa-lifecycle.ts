import { useState, useEffect } from 'react';

export interface PwaLifecycleState {
  isOnline: boolean;
  updateAvailable: boolean;
  installPromptEvent: any | null;
  isInstalled: boolean;
  applyUpdate: () => void;
}

export function usePwaLifecycle(): PwaLifecycleState {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [installPromptEvent, setInstallPromptEvent] = useState<any | null>(null);
  const [isInstalled, setIsInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );

  useEffect(() => {
    let disposed = false;
    let observedRegistration: ServiceWorkerRegistration | null = null;
    let observedInstallingWorker: ServiceWorker | null = null;
    let refreshing = false;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPromptEvent(null);
    };
    const handleInstallingStateChange = () => {
      if (!disposed && observedInstallingWorker?.state === 'installed' && navigator.serviceWorker.controller) {
        setUpdateAvailable(true);
      }
    };
    const handleUpdateFound = () => {
      const newWorker = observedRegistration?.installing;
      if (!newWorker || newWorker === observedInstallingWorker) return;
      observedInstallingWorker?.removeEventListener('statechange', handleInstallingStateChange);
      observedInstallingWorker = newWorker;
      newWorker.addEventListener('statechange', handleInstallingStateChange);
    };
    const handleControllerChange = () => {
      if (!disposed && !refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (disposed) return;
        observedRegistration = reg;
        setRegistration(reg);

        if (reg.waiting) {
          setUpdateAvailable(true);
        }

        reg.addEventListener('updatefound', handleUpdateFound);
        handleUpdateFound();
      });

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }

    return () => {
      disposed = true;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
      observedRegistration?.removeEventListener('updatefound', handleUpdateFound);
      observedInstallingWorker?.removeEventListener('statechange', handleInstallingStateChange);
    };
  }, []);

  const applyUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    isOnline,
    updateAvailable,
    installPromptEvent,
    isInstalled,
    applyUpdate,
  };
}
