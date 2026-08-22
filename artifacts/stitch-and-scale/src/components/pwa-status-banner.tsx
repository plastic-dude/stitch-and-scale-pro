import * as React from 'react';
import { WifiOff, RefreshCw, X, Wifi } from 'lucide-react';
import { usePwaLifecycle } from '@/hooks/use-pwa-lifecycle';
import { useSettings } from '@/context/SettingsContext';
import { PWA_LIFECYCLE_COPY } from '@/lib/pwa-lifecycle-copy';
import { cn } from '@/lib/utils';

export function PwaStatusBanner() {
  const { isOnline, updateAvailable, applyUpdate } = usePwaLifecycle();
  const { language } = useSettings();
  const copy = PWA_LIFECYCLE_COPY[language] || PWA_LIFECYCLE_COPY.en;
  
  const [showOnlineToast, setShowOnlineToast] = React.useState(false);
  const prevOnline = React.useRef(isOnline);

  React.useEffect(() => {
    if (!prevOnline.current && isOnline) {
      setShowOnlineToast(true);
      const timer = setTimeout(() => setShowOnlineToast(false), 5000);
      return () => clearTimeout(timer);
    }
    prevOnline.current = isOnline;
    return undefined;
  }, [isOnline]);

  if (updateAvailable) {
    return (
      <div className="w-full bg-primary text-primary-foreground py-2 px-4 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2 text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
          <span>{copy.updateAvailable}</span>
        </div>
        <button
          onClick={applyUpdate}
          className="bg-background text-foreground px-3 py-1 rounded text-xs font-bold hover:bg-background/90 transition-colors"
        >
          {copy.updateAction}
        </button>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="w-full bg-destructive text-destructive-foreground py-2 px-4 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-300">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">{copy.offlineStatus}</span>
      </div>
    );
  }

  if (showOnlineToast) {
    return (
      <div className="w-full bg-emerald-600 text-white py-2 px-4 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-300">
        <Wifi className="w-4 h-4" />
        <span className="text-sm font-medium">{copy.onlineStatus}</span>
        <button onClick={() => setShowOnlineToast(false)} className="ml-2">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return null;
}
