import React from 'react';
import { AlertTriangle, Check, CloudOff, Loader2 } from 'lucide-react';
import type { ProjectValidityReport } from '@/lib/project-validity';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutosaveIndicatorProps {
  status: SaveStatus;
  /** QUEUE-017-GATE: project-wide data-validity flag. When the persistent
   *  project record contains impossible measurements, the chip must never
   *  show a plain green "Saved" — it shows the invalid-data state instead.
   *  Derived from the project object on every render (never stored), so it
   *  cannot drift out of sync with the data. */
  validity?: ProjectValidityReport;
}

export function AutosaveIndicator({ status, validity }: AutosaveIndicatorProps) {
  const [hover, setHover] = React.useState(false);
  const invalid = validity?.level === 'invalid';
  if (status === 'idle') return null;
  return (
        <div
          key={status}
          className="flex items-center gap-1.5 text-xs text-muted-foreground select-none save-status-enter"
          aria-live="polite"
          aria-label={
            invalid ? `Saved locally — invalid data: ${validity.reason}` :
            status === 'saving' ? 'Saving…' :
            status === 'saved'  ? 'Saved locally' :
            'Save error'
          }
        >
          {invalid ? (
            <span
              className="relative inline-flex items-center gap-1.5 cursor-help text-amber-700 dark:text-amber-400 font-medium"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Saved — invalid data</span>
              {hover && (
                <span role="tooltip" className="absolute right-0 top-full mt-1 z-50 w-64 rounded-md border border-border bg-popover p-2 text-xs font-normal text-popover-foreground shadow-md">
                  Project saved, but it contains impossible measurements the
                  grading lab cannot work with (not finite, zero, or negative):
                  {' '}{validity.reason}
                </span>
              )}
            </span>
          ) : (
            <>
              {status === 'saving' && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving…</span>
                </>
              )}
              {status === 'saved' && (
                <>
                  <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-green-700 dark:text-green-400 font-medium">Saved</span>
                </>
              )}
              {status === 'error' && (
                <>
                  <CloudOff className="w-3 h-3 text-destructive" />
                  <span className="text-destructive">Save failed</span>
                </>
              )}
            </>
          )}
        </div>
  );
}
