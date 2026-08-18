import * as React from 'react';
import { HardDrive, Download, ShieldAlert } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/context/SettingsContext';
import { STORAGE_COPY } from '@/lib/storage-copy';

/**
 * Always-visible entry point for local-storage status + backup.
 * Lives in the header on every page — unlike the one-time dashboard
 * banner, this is never fully dismissed, only collapsed to an icon.
 * Satisfies: "clear, persistent visibility of local-only status" and
 * "easy, low-friction path to back up... not buried only in Settings."
 */
export function StorageBadge() {
  const { exportData, language } = useSettings();
  const copyText = STORAGE_COPY[language];
  const [open, setOpen] = React.useState(false);

  const handleBackup = async () => {
    await exportData();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-muted-foreground border border-border/60 hover:border-border hover:bg-secondary/40 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label={copyText.aria}
          data-testid="button-storage-badge"
        >
          <HardDrive className="w-3.5 h-3.5" />
          {copyText.localOnly}
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-80">
        <div className="space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{copyText.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {copyText.warning}
              </p>
            </div>
          </div>
          <Button onClick={handleBackup} size="sm" className="w-full" data-testid="button-quick-backup">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {copyText.backup}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
