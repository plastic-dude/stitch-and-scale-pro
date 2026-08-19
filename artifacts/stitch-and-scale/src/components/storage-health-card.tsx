import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, RefreshCcw, Download, History, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { getToastCopy } from '@/lib/toast-copy';
import { cn } from '@/lib/utils';
import { auditStores, reconcileStores, type AuditReport } from '@/lib/storage-lib';

function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function StorageHealthCard() {
  const { toast } = useToast();
  const { language } = useSettings();
  const tc = getToastCopy(language);

  const [report, setReport] = React.useState<AuditReport | null>(null);
  const [busy, setBusy] = React.useState(false);

  const refresh = async () => {
    const r = await auditStores();
    setReport(r);
    return r;
  };

  React.useEffect(() => {
    refresh();
  }, []);

  const handleReconcile = async () => {
    setBusy(true);
    try {
      await reconcileStores();
      const r = await refresh();
      toast({
        title: r.inSync ? tc.storesReconciled : tc.reconcileComplete,
        description: r.inSync
          ? tc.reconciledDescription
          : tc.unifiedDescription,
      });
    } catch {
      toast({ title: tc.reconcileFailed, description: tc.reconcileFailedDescription, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (!report) return null;

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden rounded-2xl">
      <CardHeader className="bg-secondary/10 border-b border-border/40 pb-5">
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-accent" />
          Storage Health
        </CardTitle>
        <CardDescription className="text-[13px]">
          Where your patterns live, whether both copies agree, and when you last backed up.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/50 p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Database className="w-3.5 h-3.5" />
              Browser storage
            </div>
            <div className="font-mono text-lg font-bold text-foreground">
              {formatKB(report.localStorageBytes)}
            </div>
            <div className="text-xs text-muted-foreground">
              {report.localStorageProjectCount} project{report.localStorageProjectCount === 1 ? '' : 's'}
            </div>
          </div>
          <div className="rounded-xl border border-border/50 p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Database className="w-3.5 h-3.5" />
              Offline cache
            </div>
            <div className="font-mono text-lg font-bold text-foreground">
              {formatKB(report.idbBytes)}
            </div>
            <div className="text-xs text-muted-foreground">
              {report.idbProjectCount} project{report.idbProjectCount === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            {report.inSync ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">
                {report.inSync ? 'Stores in sync' : 'Stores out of sync'}
              </div>
              <div className="text-xs text-muted-foreground">
                {report.inSync
                  ? 'Both locations hold the same projects.'
                  : 'The two copies differ — reconcile to make them match.'}
              </div>
            </div>
          </div>
          <Button
            variant={report.inSync ? 'outline' : 'default'}
            size="sm"
            className={cn('shrink-0 h-8 gap-1.5 text-xs', report.inSync ? 'text-muted-foreground' : '')}
            onClick={handleReconcile}
            disabled={busy}
            data-testid="button-reconcile-stores"
          >
            <RefreshCcw className={cn('w-3.5 h-3.5', busy && 'animate-spin')} />
            Reconcile
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <History className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground">
                {report.daysSinceBackup === null
                  ? 'Never backed up'
                  : report.daysSinceBackup > 7
                    ? `${report.daysSinceBackup} days since last backup`
                    : report.daysSinceBackup === 0
                      ? 'Backed up today'
                      : `Backed up ${report.daysSinceBackup} day${report.daysSinceBackup === 1 ? '' : 's'} ago`}
              </div>
              <div className="text-xs text-muted-foreground">
                {report.lastExportedAt
                  ? new Date(report.lastExportedAt).toLocaleString()
                  : 'Exports are stored as JSON files — download one to be safe.'}
              </div>
            </div>
          </div>
          {report.daysSinceBackup !== null && report.daysSinceBackup > 7 && (
            <Badge variant="destructive" className="shrink-0">Overdue</Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Stitch &amp; Scale keeps two independent copies of your work on this device — each can
          recover the other. A backup file is still your true insurance: it's the one copy you
          control outside the browser.
        </p>
      </CardContent>
    </Card>
  );
}
