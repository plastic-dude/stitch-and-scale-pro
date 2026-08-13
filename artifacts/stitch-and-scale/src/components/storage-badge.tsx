import * as React from 'react';
import { HardDrive, Download, ShieldAlert } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/context/SettingsContext';

/**
 * Always-visible entry point for local-storage status + backup.
 * Lives in the header on every page — unlike the one-time dashboard
 * banner, this is never fully dismissed, only collapsed to an icon.
 * Satisfies: "clear, persistent visibility of local-only status" and
 * "easy, low-friction path to back up... not buried only in Settings."
 */
export function StorageBadge() {
  const { exportData } = useSettings();
  const [open, setOpen] = React.useState(false);

  const handleBackup = () => {
    exportData();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-muted-foreground border border-border/60 hover:border-border hover:bg-secondary/40 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Local storage status and backup"
          data-testid="button-storage-badge"
        >
          <HardDrive className="w-3.5 h-3.5" />
          Local only
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-80">
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Your patterns live only on this device</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Nothing is uploaded anywhere. That also means clearing your browser data, switching devices, or reinstalling this browser will permanently delete everything — unless you've backed up first.
              </p>
            </div>
          </div>
          <Button onClick={handleBackup} size="sm" className="w-full" data-testid="button-quick-backup">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Back up all patterns now
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
