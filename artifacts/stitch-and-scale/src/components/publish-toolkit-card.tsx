/**
 * Publish Toolkit — pre-publish readiness checklist + marketplace listing
 * generator, built from session-6 research (tech-editing workflow + Ravelry
 * listing conventions).
 *
 * The checklist is the checklist-designer relationship turned into a free,
 * deterministic tool: checkReadiness() runs the same sanity checks a tech
 * editor would flag, and generateListing() assembles the pattern's real
 * graded data into a paste-ready marketplace description — work the market
 * currently charges $40–65/pattern to have done by hand.
 */
import React from 'react';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { getToastCopy } from '@/lib/toast-copy';
import { checkReadiness, generateListing, PLATFORM_LIST } from '@/lib/pattern-readiness';
import { computeCredibility, generateCredibilityStatement } from '@/lib/credibility-report';
import { PatternProject } from '@/lib/grading-engine';
import { YARN_WEIGHTS, YARN_WEIGHT_LABELS } from '@/lib/yarn-estimator';
import { PLATFORM_LABELS } from '@/lib/pattern-income-calculator';
import { FileCheck2, AlertTriangle, AlertCircle, CircleCheck, Copy, ClipboardCheck, Sparkles, Save, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

function SeverityBadge({ severity }: { severity: 'error' | 'warning' | 'pass' }) {
  const config = {
    error: { label: 'Fix', icon: AlertCircle, className: 'bg-destructive/15 text-destructive border-destructive/40' },
    warning: { label: 'Check', icon: AlertTriangle, className: 'bg-amber-500/15 text-amber-600 border-amber-500/40' },
    pass: { label: 'Pass', icon: CircleCheck, className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40' },
  }[severity];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn('gap-1 font-medium', config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

function CheckRow({ label, detail, severity }: { label: string; detail: string; severity: 'error' | 'warning' | 'pass' }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <SeverityBadge severity={severity} />
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug">{label}</p>
        {severity !== 'pass' && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{detail}</p>}
      </div>
    </div>
  );
}

export function PublishToolkitCard({
  project,
  onUpdateProject,
}: {
  project: PatternProject;
  onUpdateProject: (p: PatternProject) => void;
}) {
  const { toast } = useToast();
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const tc = getToastCopy(language);

  const [platform, setPlatform] = React.useState<typeof PLATFORM_LIST[number]>('ravelry');
  const [weightOverride, setWeightOverride] = React.useState<string>(project.yarnWeight ?? '');
  const [tagline, setTagline] = React.useState('');
  const [listing, setListing] = React.useState<string>('');
  const [copied, setCopied] = React.useState(false);
  const [notesDraft, setNotesDraft] = React.useState(project.description ?? '');
  const notesDirty = notesDraft !== (project.description ?? '');

  // ---------- Credibility Report (anti-AI-PDF trust signal) ----------
  const credibility = computeCredibility(project);
  const [statementCopied, setStatementCopied] = React.useState(false);

  const copyStatement = async () => {
    const statement = generateCredibilityStatement(project);
    try {
      await navigator.clipboard.writeText(statement);
    } catch {
      const area = document.createElement('textarea');
      area.value = statement;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setStatementCopied(true);
    toast({ title: tc.credibilityStatementCopied, description: tc.credibilityStatementPaste });
    setTimeout(() => setStatementCopied(false), 2000);
  };

  const verdictConfig = {
    credible: { label: 'Credible', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40', icon: ShieldCheck },
    developing: { label: 'Developing', className: 'bg-amber-500/15 text-amber-700 border-amber-500/40', icon: ShieldAlert },
    thin: { label: 'Thin — trust is not earned yet', className: 'bg-destructive/15 text-destructive border-destructive/40', icon: ShieldAlert },
  }[credibility.verdict];
  const VerdictIcon = verdictConfig.icon;

  // The designer changes weight in the Yarn tab; pick it up when the card mounts.
  React.useEffect(() => {
    setWeightOverride(project.yarnWeight ?? '');
  }, [project.yarnWeight]);

  const result = checkReadiness(project);
  const errors = result.checks.filter(c => c.severity === 'error');
  const warnings = result.checks.filter(c => c.severity === 'warning');
  const byCategory = (['engineering', 'metadata', 'presentation'] as const).map(category => ({
    category,
    checks: result.checks.filter(c => c.category === category),
  }));
  const categoryLabels: Record<string, string> = {
    engineering: 'Fit & sizing (the tech-editor material)',
    metadata: 'Pattern identity',
    presentation: 'Listing presentation',
  };

  const generate = () => {
    const output = generateListing(project, {
      platform,
      yarnWeight: (weightOverride || project.yarnWeight) as never,
      tagline,
    });
    setListing(output.description);
    setCopied(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(listing);
    } catch {
      const area = document.createElement('textarea');
      area.value = listing;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopied(true);
    toast({ title: tc.listingCopied, description: tc.listingCopiedPaste });
    setTimeout(() => setCopied(false), 2000);
  };

  const saveNotes = () => {
    onUpdateProject({ ...project, description: notesDraft.trim() || undefined });
    toast({ title: tc.publishNotesSaved, description: tc.publishNotesSavedDescription });
  };

  return (
    <div className="space-y-6">
      {/* ---------- Readiness ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-accent" />
            Pre-publish readiness
          </CardTitle>
          <CardDescription>
            The same sanity checks a tech editor would flag — run automatically against your graded data. Fix
            the errors before your pattern goes live; warnings are worth a second look, not a blocker.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {result.ready ? (
              <Badge className="gap-1.5 bg-emerald-500/15 text-emerald-700 border border-emerald-500/40 px-3 py-1.5">
                <CircleCheck className="w-4 h-4" />
                Ready to publish
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1.5 px-3 py-1.5">
                <AlertCircle className="w-4 h-4" />
                Fix {errors.length} {errors.length === 1 ? 'error' : 'errors'} before publishing
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {errors.length} error{errors.length === 1 ? '' : 's'} · {warnings.length} warning{warnings.length === 1 ? '' : 's'} · {result.checks.length} checks
            </span>
          </div>

          {byCategory.map(({ category, checks }) => (
            <div key={category} className="mb-4 last:mb-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                {categoryLabels[category]}
              </h3>
              <Card className="border-border/70 bg-card/50">
                <CardContent className="p-3">
                  {checks.map(c => (
                    <CheckRow key={c.id} label={c.label} detail={c.detail} severity={c.severity} />
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ---------- Credibility Report (the AI-era trust signal) ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            Credibility report
          </CardTitle>
          <CardDescription>
            AI pattern generators flood the marketplaces with plausible-looking PDFs that have no grading
            math and no testable yardage. This score is earned strictly from your pattern's own data — the
            one thing those PDFs cannot fake cheaply — and produces a paste-ready statement for any listing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center justify-center w-14 h-14 rounded-full border-2 font-serif text-lg font-semibold tabular-nums',
                  credibility.score >= 60
                    ? 'border-emerald-500/60 text-emerald-700'
                    : credibility.score >= 35
                      ? 'border-amber-500/60 text-amber-700'
                      : 'border-destructive/60 text-destructive',
                )}
                data-testid="credibility-score"
              >
                {credibility.score}
              </div>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <Badge className={cn('gap-1.5 px-3 py-1.5', verdictConfig.className)} data-testid="credibility-verdict">
              <VerdictIcon className="w-4 h-4" />
              {verdictConfig.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {credibility.sizeCount} size{credibility.sizeCount === 1 ? '' : 's'} graded ·{' '}
              {credibility.totalYards ? `${credibility.totalYards} yd estimated` : 'no yardage math yet'}
            </span>
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Trust checks
            </h3>
            <Card className="border-border/70 bg-card/50">
              <CardContent className="p-3">
                {credibility.checks.map(c => (
                  <div key={c.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                    {c.passed ? (
                      <CircleCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{c.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{c.proof}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Buyer-facing credibility statement</Label>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8"
                onClick={copyStatement}
                data-testid="credibility-copy-statement"
              >
                {statementCopied ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {statementCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <Textarea
              value={generateCredibilityStatement(project)}
              readOnly
              className="min-h-24 text-sm"
              data-testid="credibility-statement"
            />
          </div>
        </CardContent>
      </Card>

      {/* ---------- Listing generator ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Marketplace listing
          </CardTitle>
          <CardDescription>
            A paste-ready description assembled from your pattern's real data — sizes from the grading engine,
            yardage from the yarn estimator, nothing invented. Tailor it per marketplace, copy it, paste it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Marketplace</Label>
              <NativeSelect
                value={platform}
                onChange={(e) => setPlatform(e.target.value as typeof PLATFORM_LIST[number])}
                data-testid="publish-platform-select"
              >
                {PLATFORM_LIST.map(p => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Yarn weight (yardage)</Label>
              <NativeSelect
                value={weightOverride || project.yarnWeight || ''}
                onChange={(e) => setWeightOverride(e.target.value)}
                data-testid="publish-weight-select"
              >
                <option value="">Use project weight</option>
                {YARN_WEIGHTS.map(w => (
                  <option key={w} value={w}>{YARN_WEIGHT_LABELS[w]}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tagline (optional)</Label>
              <Input
                placeholder={ls.publishPitchPlaceholder}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                data-testid="publish-tagline-input"
              />
            </div>
          </div>

          <Button onClick={generate} data-testid="publish-generate-button">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate listing
          </Button>

          {listing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Generated description</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={copy}
                  data-testid="publish-copy-button"
                >
                  {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Textarea
                value={listing}
                onChange={(e) => setListing(e.target.value)}
                className="min-h-64 font-mono text-sm whitespace-pre-wrap"
                data-testid="publish-listing-textarea"
              />
              <p className="text-[11px] text-muted-foreground">
                Edit freely — the generated copy is a starting point, not a lock.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- Notes (listing source) ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Pattern notes
          </CardTitle>
          <CardDescription>
            The first sentence of these notes goes into the generated listing as the pattern summary — and the
            full text prints on the PDF cover page. Keep one or two plain-English sentences about construction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder={ls.publishDesignPitchPlaceholder}
            className="min-h-24"
            data-testid="publish-notes-textarea"
          />
          <div className="flex items-center gap-3">
            <Button
              variant={notesDirty ? 'default' : 'secondary'}
              disabled={!notesDirty}
              onClick={saveNotes}
              data-testid="publish-save-notes"
            >
              <Save className="w-4 h-4 mr-2" />
              Save notes
            </Button>
            {notesDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
