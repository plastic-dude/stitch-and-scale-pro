import React from 'react';
import { Activity, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { getWorkspaceCopy } from '@/lib/workspace-copy';
import { cn } from '@/lib/utils';

export function HealthIndicator() {
  const { language } = useSettings();
  const copy = getWorkspaceCopy(language);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [hover, setHover] = React.useState(false);

  React.useEffect(() => {
    // CHK-172: Production integrity check. Verifies that the React app is mounted,
    // the #root element is not empty, and basic shell components are present.
    // In a real production environment, this could also verify the build hash
    // against a known-good remote manifest to detect deployment mismatches.
    const verify = () => {
      try {
        const root = document.getElementById('root');
        const header = document.querySelector('header');
        const nav = document.querySelector('nav');
        
        if (root && root.children.length > 0 && header && nav) {
          setStatus('ready');
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
      }
    };

    const timer = setTimeout(verify, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="relative flex items-center gap-1.5 text-xs select-none"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {status === 'loading' && (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground hidden lg:inline">{copy.healthLoading}</span>
        </>
      )}
      {status === 'ready' && (
        <>
          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span className="text-emerald-700 dark:text-emerald-400 font-medium hidden lg:inline">{copy.healthReady}</span>
        </>
      )}
      {status === 'error' && (
        <>
          <ShieldAlert className="w-3 h-3 text-destructive" />
          <span className="text-destructive font-medium hidden lg:inline">{copy.healthError}</span>
        </>
      )}

      {hover && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-md border border-border bg-popover p-3 text-xs font-normal text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold text-sm">Release Integrity</span>
          </div>
          <p className="leading-relaxed text-muted-foreground mb-2">
            This indicator confirms that the application shell has loaded correctly and React has successfully mounted to the DOM.
          </p>
          <div className="space-y-1 text-[10px] font-mono bg-muted/50 p-1.5 rounded border border-border/50">
            <div>DOM_READY: TRUE</div>
            <div>REACT_MOUNT: {status === 'ready' ? 'SUCCESS' : status === 'loading' ? 'PENDING' : 'FAILED'}</div>
            <div>SHELL_INTEGRITY: {status === 'ready' ? 'VERIFIED' : 'UNVERIFIED'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
