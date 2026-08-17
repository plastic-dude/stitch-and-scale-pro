import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useSettings } from '@/context/SettingsContext';
import { INSTALL_BANNER_COPY } from '@/lib/install-banner-copy';

type Trigger = 'onboarding' | 'export';

const SHOWN_KEY_PREFIX = 'stitch-and-scale-install-banner-shown-';

function hasShown(trigger: Trigger): boolean {
  return localStorage.getItem(SHOWN_KEY_PREFIX + trigger) === '1';
}
function markShown(trigger: Trigger): void {
  localStorage.setItem(SHOWN_KEY_PREFIX + trigger, '1');
}

/**
 * Fires at most once per named trigger ('onboarding', then 'export'),
 * only if the app isn't already installed. Each trigger is independent —
 * if dismissed at 'onboarding', it can still surface once at 'export'.
 * Beyond those two moments, it stays quiet — never a header nag, never a
 * recurring interruption.
 *
 * Renders one of two variants depending on the platform:
 * - Standard (Chrome/Edge/Android): a real "Install" button wired to the
 *   native beforeinstallprompt flow.
 * - iOS Safari: there is no programmatic install trigger on iOS at all,
 *   so this shows real instructions (Share -> Add to Home Screen)
 *   instead of a button that would silently do nothing.
 */
export function InstallBanner({ trigger }: { trigger: Trigger }) {
  const { canInstall, isIOSSafari, isInstalled, promptInstall } = usePWAInstall();
  const { language } = useSettings();
  const copy = INSTALL_BANNER_COPY[language];
  const [dismissed, setDismissed] = React.useState(false);
  const [installing, setInstalling] = React.useState(false);

  const variant: 'standard' | 'ios' | null = canInstall ? 'standard' : isIOSSafari ? 'ios' : null;
  const shouldShow = !!variant && !isInstalled && !dismissed && !hasShown(trigger);

  React.useEffect(() => {
    if (shouldShow) markShown(trigger);
  }, [shouldShow, trigger]);

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await promptInstall();
    setInstalling(false);
    if (!accepted) setDismissed(true);
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4"
          role="status"
        >
          <div className="relative flex items-center gap-4 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 via-secondary/20 to-transparent px-5 py-4 shadow-sm overflow-hidden">
            <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center shrink-0 text-accent">
              {variant === 'ios' ? (
                <Share className="w-5 h-5" strokeWidth={1.75} />
              ) : (
                <Download className="w-5 h-5" strokeWidth={1.75} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                {copy.title}
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              </p>
              {variant === 'ios' ? (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {copy.ios}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {copy.standard}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {variant === 'standard' && (
                <Button
                  onClick={handleInstall}
                  disabled={installing}
                  size="sm"
                  className="rounded-full h-9 px-4 font-medium"
                  data-testid={`button-install-pwa-${trigger}`}
                >
                  {installing ? copy.installing : copy.install}
                </Button>
              )}
              {variant === 'ios' && (
                <Button
                  onClick={() => setDismissed(true)}
                  variant="secondary"
                  size="sm"
                  className="rounded-full h-9 px-4 font-medium"
                  data-testid={`button-acknowledge-install-${trigger}`}
                >
                  {copy.gotIt}
                </Button>
              )}
              <button
                onClick={() => setDismissed(true)}
                className="p-1.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-background/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label={copy.dismiss}
                data-testid={`button-dismiss-install-${trigger}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

