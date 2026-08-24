import * as React from "react";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/context/ProjectsContext";
import { useSettings } from "@/context/SettingsContext";
import {
  getPersistentStorageStatus,
  isPersistentStorageSupported,
  readStorageProtectionDecision,
  requestPersistentStorageProtection,
  writeStorageProtectionDecision,
  type StorageProtectionRequestResult,
} from "@/lib/storage-protection";

/**
 * A non-modal, post-save priming surface. Browser persistence is requested only
 * from the primary button handler; rendering and route changes are inert.
 */
export function StorageProtectionBanner() {
  const { storageProtectionPromptAvailable, dismissStorageProtectionPrompt } =
    useProjects();
  const { getCopy } = useSettings();
  const copy = getCopy();
  const [outcome, setOutcome] =
    React.useState<StorageProtectionRequestResult | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [storedDecision] = React.useState(readStorageProtectionDecision);

  React.useEffect(() => {
    // A prior decision may have been recorded in another render/session. Clear
    // only the provider signal; never retry or call the browser from here.
    if (storageProtectionPromptAvailable && storedDecision) {
      dismissStorageProtectionPrompt();
    }
  }, [
    dismissStorageProtectionPrompt,
    storageProtectionPromptAvailable,
    storedDecision,
  ]);

  if (!storageProtectionPromptAvailable || (storedDecision && !outcome))
    return null;

  const handleDismiss = () => {
    // “Not now” is a prompt decision; closing an already completed result is
    // only presentation state and must preserve the browser outcome.
    if (!outcome) writeStorageProtectionDecision("dismissed");
    dismissStorageProtectionPrompt();
  };

  const handleProtect = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Reading an existing browser decision and requesting protection both
      // happen only after this explicit user action.
      const current = await getPersistentStorageStatus();
      const result: StorageProtectionRequestResult =
        current === "protected"
          ? "protected"
          : !isPersistentStorageSupported()
            ? "unavailable"
            : await requestPersistentStorageProtection();
      writeStorageProtectionDecision(result);
      setOutcome(result);
    } finally {
      setBusy(false);
    }
  };

  const message =
    outcome === "protected"
      ? copy.storageProtectionProtected
      : outcome === "declined"
        ? copy.storageProtectionDeclined
        : outcome === "unavailable"
          ? copy.storageProtectionUnavailable
          : outcome === "error"
            ? copy.storageProtectionError
            : copy.storageProtectionDescription;

  return (
    <div
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex items-start gap-4 rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 via-secondary/20 to-transparent px-5 py-4 shadow-sm">
        <div
          className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center shrink-0 text-accent"
          aria-hidden="true"
        >
          <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {copy.storageProtectionTitle}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {message}
          </p>
          {!outcome && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Button
                onClick={handleProtect}
                disabled={busy}
                size="sm"
                className="rounded-full h-9 px-4 font-medium"
                data-testid="button-protect-local-storage"
              >
                {busy
                  ? copy.storageProtectionAction + "…"
                  : copy.storageProtectionAction}
              </Button>
              <Button
                onClick={handleDismiss}
                disabled={busy}
                variant="ghost"
                size="sm"
                className="rounded-full h-9 px-3 font-medium"
                data-testid="button-dismiss-storage-protection"
              >
                {copy.storageProtectionNotNow}
              </Button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          disabled={busy}
          className="p-1.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-background/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          aria-label={copy.storageProtectionDismiss}
          data-testid="button-close-storage-protection"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
