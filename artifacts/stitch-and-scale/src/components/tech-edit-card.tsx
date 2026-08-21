import { copyTextOrThrow } from '@/lib/clipboard';
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
import { TECH_EDIT_COPY } from '@/lib/tech-edit-copy';
import { LanguageCode } from '@/lib/i18n';
import { ClipboardCopy, CheckCircle2, AlertTriangle, Info, ScrollText, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'stitch-and-scale-techedit';

interface PersistedState {
  ratePerHour: number;
}

export function TechEditCard({ project }: { project: PatternProject }) {
  const { toast } = useToast();
  const { language } = useSettings();
  const tc = getToastCopy(language);
  const tec = TECH_EDIT_COPY[language];

  const handle = useMemo(() => projectStorage<PersistedState>('techedit', project.id, ['stitch-and-scale-techedit']), [project.id]);

  const [ratePerHour, setRatePerHour] = React.useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const persisted: PersistedState | null = saved ? safeJson(saved) : null;
    return persisted?.ratePerHour ?? 35;
  });
  const [summary, setSummary] = React.useState<AuditSummary>(() => runTechEditAudit(project, { language }));

  React.useEffect(() => {
    setSummary(runTechEditAudit(project, { language }));
  }, [project.sections, project.baseSize, project.gauge, language]);

  const savings = estimateEditorSavings(summary, ratePerHour, language);

  const VERDICT_META: Record<'clean' | 'check' | 'fix', { label: string; className: string; icon: React.ReactNode }> = {
    clean: {
      label: tec.verdictClean,
      className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    check: {
      label: tec.verdictCheck,
      className: 'bg-amber-500/15 text-amber-600 border-amber-500/40',
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    fix: {
      label: tec.verdictFix,
      className: 'bg-destructive/15 text-destructive border-destructive/40',
      icon: <AlertTriangle className="h-4 w-4" />,
    },
  };

  const verdict = VERDICT_META[summary.verdict];

  function handleRateChange(value: string) {
    const rate = Math.max(0, Math.min(200, Number(value) || 0));
    setRatePerHour(rate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ratePerHour: rate }));
  }

  async function handleCopySummary() {
    const text = generatePreEditSummary(project, summary, language);
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
          {tec.title}
        </CardTitle>
        <CardDescription>
          {tec.description}
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
              {tec.findingsCount(summary.findingCounts.error, summary.findingCounts.warning, summary.findingCounts.info)}
            </p>
          </div>
        </div>

        {/* Findings */}
        {(errors.length + warnings.length + infos.length) > 0 ? (
          <div className="space-y-4">
            {errors.map((f, i) => (
              <FindingRow key={`e${i}`} finding={f} language={language} />
            ))}
            {warnings.map((f, i) => (
              <FindingRow key={`w${i}`} finding={f} language={language} />
            ))}
            {infos.map((f, i) => (
              <FindingRow key={`n${i}`} finding={f} language={language} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700">
            {tec.cleanSweep}
          </div>
        )}

        {/* Editor-savings card */}
        <Card className="bg-muted/50">
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{tec.editorBillSaved}</p>
              <span className="text-lg font-bold">${savings.savings}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="te-rate" className="text-xs text-muted-foreground">{tec.editorRateLabel}</Label>
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
              <span className="text-xs text-muted-foreground">{tec.perHour}</span>
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
              <p className="text-sm font-medium">{tec.marketQuoteTitle}</p>
              <span className="text-lg font-bold text-emerald-700">${summary.marketBill.low}–${summary.marketBill.high}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{tec.marketQuoteDetails(summary.marketBill.hours, summary.marketBill.waitDays)}</span>
              {summary.marketBill.pending > 0 && <span className="text-amber-600 font-medium">{tec.negotiateHint(summary.marketBill.pending)}</span>}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{summary.marketBill.note}</p>
          </CardContent>
        </Card>

        {/* Pre-edit summary */}
        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> {tec.preEditSummaryTitle}
              </p>
              <Button variant="outline" size="sm" onClick={handleCopySummary}>
                <ClipboardCopy className="h-3.5 w-3.5 mr-1" />
                {tec.copyForEditor}
              </Button>
            </div>
            <pre className="max-h-72 overflow-auto rounded-md bg-muted/60 p-3 text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {generatePreEditSummary(project, summary, language)}
            </pre>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

function FindingRow({ finding, language }: { finding: AuditFinding; language: LanguageCode }) {
  const tec = TECH_EDIT_COPY[language];
  const SEVERITY_META: Record<AuditFinding['severity'], { label: string; className: string; icon: React.ReactNode }> = {
    error: { label: tec.severityError, className: 'bg-destructive/15 text-destructive border-destructive/40', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    warning: { label: tec.severityWarning, className: 'bg-amber-500/15 text-amber-600 border-amber-500/40', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    info: { label: tec.severityNote, className: 'bg-slate-500/15 text-slate-600 border-slate-500/40', icon: <Info className="h-3.5 w-3.5" /> },
    pass: { label: tec.severityPass, className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  };
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
