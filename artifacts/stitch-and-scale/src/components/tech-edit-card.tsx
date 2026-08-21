import { copyTextOrThrow } from '@/lib/clipboard';
/**
 * Self Tech-Edit Audit — run a numbers-first tech edit before paying a human
 * editor. Built from session-11 research on the tech-edit market:
 *
 * - Human tech editors bill $20–40/hr and take ~4 hours per sweater
 *   (Tech Editor Hub / Stitch Reader interviews) — the *numbers sweep*
 *   (grading math, stitch counts, gauge, size progression, rounding) is
 *   the most expensive and most automatable part of their bill.
 * - Size.ly / Fit Analytics only do retail-fit widgets; KnitBird charted
 *   garments only, and the stitch-chart tools never touch the size chart
 *   at all. Nobody audits a designer's OWN graded table.
 * - The audit produces a paste-ready "pre-edit summary" so a paid editor's
 *   scope shrinks to the prose pass — every finding resolved is billable
 *   time saved.
 *
 * All state persists in localStorage under a project-scoped key so the
 * last audit and rate setting survive reloads until cloud storage arrives.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { getToastCopy } from '@/lib/toast-copy';
import { cn } from '@/lib/utils';
import { runTechEditAudit, estimateEditorSavings, estimateMarketBill, generatePreEditSummary, AuditFinding, AuditSummary } from '@/lib/tech-edit-audit';
import { PatternProject } from '@/lib/grading-engine';
import { ClipboardCopy, CheckCircle2, AlertTriangle, Info, ScrollText, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'stitch-and-scale-techedit';

interface PersistedState {
  ratePerHour: number;
}

const VERDICT_META: Record<'clean' | 'check' | 'fix', { label: string; className: string; icon: React.ReactNode }> = {
  clean: {
    label: 'Clean — the numbers sweep passed',
    className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  check: {
    label: 'Worth a look',
    className: 'bg-amber-500/15 text-amber-600 border-amber-500/40',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  fix: {
    label: 'Fix before publishing',
    className: 'bg-destructive/15 text-destructive border-destructive/40',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
};

const SEVERITY_META: Record<AuditFinding['severity'], { label: string; className: string; icon: React.ReactNode }> = {
  error: { label: 'Error', className: 'bg-destructive/15 text-destructive border-destructive/40', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  warning: { label: 'Warning', className: 'bg-amber-500/15 text-amber-600 border-amber-500/40', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  info: { label: 'Note', className: 'bg-slate-500/15 text-slate-600 border-slate-500/40', icon: <Info className="h-3.5 w-3.5" /> },
  pass: { label: 'Pass', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

export function TechEditCard({ project }: { project: PatternProject }) {
  // issue #4 project seam: one scoped store per project; the legacy flat key 'stitch-and-scale-techedit' is folded in on first read, then removed.
  const handle = useMemo(() => projectStorage<PersistedState>('techedit', project.id, ['stitch-and-scale-techedit']), [project.id]);

  const { toast } = useToast();
  const { language } = useSettings();
  const tc = getToastCopy(language);


  const [ratePerHour, setRatePerHour] = React.useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const persisted: PersistedState | null = saved ? safeJson(saved) : null;
    return persisted?.ratePerHour ?? 35;
  });
  const [summary, setSummary] = React.useState<AuditSummary>(() => runTechEditAudit(project));

  React.useEffect(() => {
    setSummary(runTechEditAudit(project));
  }, [project.sections, project.baseSize, project.gauge]);

  const savings = estimateEditorSavings(summary, ratePerHour);
  const verdict = VERDICT_META[summary.verdict];

  function handleRateChange(value: string) {
    const rate = Math.max(0, Math.min(200, Number(value) || 0));
    setRatePerHour(rate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ratePerHour: rate }));
  }

  async function handleCopySummary() {
    const text = generatePreEditSummary(project, summary);
    try {
      await copyTextOrThrow(text);
      toast({ title: tc.preEditSummaryCopied, description: tc.preEditSummaryPaste });
    } catch {
      toast({ title: tc.copyFailed, description: tc.selectManuallyFromBox });
    }
  }

  const errors = summary.findings.filter(f => f.severity === 'error');
  const warnings = summary.findings.filter(f => f.severity === 'warning');
  const infos = summary.findings.filter(f => f.severity === 'info');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" />
          Self Tech-Edit Audit
        </CardTitle>
        <CardDescription>
          A numbers-first pass before a human editor sees the pattern — editors
          bill $20–40/hr at ~10-day turnaround, so every finding you resolve is
          billable time saved.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Score + verdict */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={cn(
              'flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold',
              summary.score >= 90
                ? 'border-emerald-500/40 text-emerald-600'
                : summary.score >= 70
                  ? 'border-amber-500/40 text-amber-600'
                  : 'border-destructive/40 text-destructive',
            )}
          >
            {summary.score}
          </div>
          <div className="space-y-1">
            <Badge variant="outline" className={cn('font-medium', verdict.className)}>
              <span className="flex items-center gap-1">{verdict.icon}{verdict.label}</span>
            </Badge>
            <p className="text-xs text-muted-foreground">
              {summary.findingCounts.error} error{summary.findingCounts.error === 1 ? '' : 's'} · {summary.findingCounts.warning} warning{summary.findingCounts.warning === 1 ? '' : 's'} · {summary.findingCounts.info} note{summary.findingCounts.info === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Findings */}
        {(errors.length + warnings.length + infos.length) > 0 ? (
          <div className="space-y-4">
            {errors.map((f, i) => (
              <FindingRow key={`e${i}`} finding={f} />
            ))}
            {warnings.map((f, i) => (
              <FindingRow key={`w${i}`} finding={f} />
            ))}
            {infos.map((f, i) => (
              <FindingRow key={`n${i}`} finding={f} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700">
            The numbers sweep passed clean: gauge validity, size-progression
            monotonicity, stitch/row rounding vs your repeats, stitch counts
            in every size, key-vs-type consistency, and base values against
            the body standard all check out.
          </div>
        )}

        {/* Editor-savings card */}
        <Card className="bg-muted/50">
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Editor bill saved</p>
              <span className="text-lg font-bold">${savings.savings}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="te-rate" className="text-xs text-muted-foreground">Your editor's hourly rate</Label>
              <span className="text-xs text-muted-foreground">$</span>
              <Input
                id="te-rate"
                type="number"
                min={0}
                max={200}
                value={ratePerHour}
                onChange={e => handleRateChange(e.target.value)}
                className="h-7 w-20 text-sm"
              />
              <span className="text-xs text-muted-foreground">/hr</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{savings.note}</p>
          </CardContent>
        </Card>

        {/* Session-42 market-bill tile: what a human editor would quote for
            the identical numbers sweep, with real market rates and the
            ~10-day wait. */}
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Market quote for this sweep</p>
              <span className="text-lg font-bold text-emerald-700">${summary.marketBill.low}–${summary.marketBill.high}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>≈{summary.marketBill.hours}h of editor time</span>
              <span>~{summary.marketBill.waitDays}-day turnaround</span>
              {summary.marketBill.pending > 0 && <span className="text-amber-600 font-medium">{summary.marketBill.pending} finding(s) — resolve to negotiate the lower end</span>}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{summary.marketBill.note}</p>
          </CardContent>
        </Card>

        {/* Pre-edit summary */}
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Pre-edit summary
              </p>
              <Button variant="outline" size="sm" onClick={handleCopySummary}>
                <ClipboardCopy className="h-3.5 w-3.5 mr-1" />
                Copy for your editor
              </Button>
            </div>
            <pre className="max-h-72 overflow-auto rounded-md bg-muted/60 p-3 text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {generatePreEditSummary(project, summary)}
            </pre>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

function FindingRow({ finding }: { finding: AuditFinding }) {
  const meta = SEVERITY_META[finding.severity];
  return (
    <div className="space-y-1 rounded-md border bg-card p-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn('font-medium', meta.className)}>
          {finding.code}
        </Badge>
        <span className="text-xs text-muted-foreground">{finding.location}</span>
      </div>
      <p className="text-sm font-medium">{finding.title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{finding.detail}</p>
    </div>
  );
}

function safeJson(text: string): PersistedState | null {
  try {
    return JSON.parse(text) as PersistedState;
  } catch {
    return null;
  }
}
