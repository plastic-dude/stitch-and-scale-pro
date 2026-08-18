import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FlaskConical, RotateCw } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { getGradingCopy, getGradingFlagDetail } from '@/lib/grading-copy';
import { analyzeGrading, EASE_BANDS, type LabResult } from '@/lib/grading-lab';
import { validatePatternQuality } from '@/lib/pattern-quality';

const fmtCm = (n: number) => `${n.toFixed(1)}cm`;

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const verdictColor = (v: LabResult['verdict']) =>
  v === 'ready' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v === 'blocked' ? 'bg-destructive/15 text-destructive border-destructive/30' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

const flagColor = (s: 'error' | 'warn' | 'info') =>
  s === 'error' ? 'border-destructive/30 bg-destructive/5' :
  s === 'warn' ? 'border-amber-500/30 bg-amber-500/5' :
  'border-border bg-muted/20';

export function GradingLabCard({ project }: { project: PatternProject }) {
  // Pure analysis over the project's live sections — no stored inputs; the lab is a read-through,
  // so it stays stateless and survives the cloud-migration untouched.
  const { language } = useSettings();
  const copy = getGradingCopy(language);
  const result = useMemo(() => analyzeGrading(project), [project]);
  const quality = useMemo(() => validatePatternQuality(project), [project]);
  const structuralFlags = quality.flags.filter((flag) => flag.source === 'structure');
  const structuralErrors = structuralFlags.filter((flag) => flag.severity === 'error').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FlaskConical className="h-4 w-4" /> {copy.title}
        </CardTitle>
        <CardDescription>
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verdict */}
        <div className={`rounded-lg border p-4 ${verdictColor(result.verdict)}`}>
          <Badge className={`${verdictColor(result.verdict)} border uppercase`}>{copy.verdictLabels[result.verdict]}</Badge>
          <p className="text-sm mt-2">{result.verdict === 'blocked' ? (result.gradedSizeCount === 0 ? copy.verdictEmpty : copy.verdictBlocked(result.flags.filter(f => f.severity === 'error').length)) : result.verdict === 'review' ? copy.verdictReview(result.flags.filter(f => f.severity === 'warn').length) : copy.verdictReady(result.gradedSizeCount, result.freelanceCost.min, result.freelanceCost.max)}</p>
        </div>

        {/* Structural Pattern QA — a read-through beside grading, not a second grading engine */}
        <div
          className={`rounded-lg border p-3 ${structuralErrors > 0 ? 'border-destructive/30 bg-destructive/5' : structuralFlags.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}
          role={structuralErrors > 0 ? 'alert' : 'status'}
          aria-live={structuralErrors > 0 ? 'assertive' : 'polite'}
          data-testid="pattern-quality-summary"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-sm">{copy.qualityTitle}</div>
              <p className="text-xs text-muted-foreground mt-1">{copy.qualityDescription}</p>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
              {structuralFlags.length > 0 ? copy.qualityStructureIssues(structuralFlags.length) : copy.qualityStructureReady}
            </Badge>
          </div>
          {structuralFlags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5" aria-label={copy.qualityStructureIssues(structuralFlags.length)}>
              {structuralFlags.slice(0, 6).map((flag) => (
                <Badge key={`${flag.code}-${flag.sectionId ?? ''}-${flag.measurementId ?? ''}`} variant="secondary" className="text-[10px]">
                  {flag.code}
                </Badge>
              ))}
              {structuralFlags.length > 6 && <span className="text-xs text-muted-foreground self-center">+{structuralFlags.length - 6}</span>}
            </div>
          )}
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.sizesGraded}</div>
            <div className="text-2xl font-bold">{result.gradedSizeCount}</div>
            <div className="text-xs text-muted-foreground mt-1">{copy.comingFrom}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.easeBase}</div>
            <div className={`text-2xl font-bold ${
              result.gradedBustEaseCm !== null && result.gradedBustEaseCm < 0 ? 'text-blue-600' :
              'text-emerald-600'}`}>
              {result.gradedBustEaseCm !== null ? fmtCm(result.gradedBustEaseCm) : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{result.easeBand ?? copy.baseBandFallback}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.freelanceSaved}</div>
            <div className="text-2xl font-bold text-emerald-600">
              {result.gradedSizeCount > 0 ? `${fmt$(result.freelanceCost.min)}–${fmt$(result.freelanceCost.max)}` : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{copy.marketRate}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.maxDrift}</div>
            <div className={`text-2xl font-bold ${
              result.sizeChecks.some(c => (c.maxDriftCm ?? 0) > 1) ? 'text-destructive' : 'text-emerald-600'}`}>
              {result.sizeChecks.length > 0
                ? fmtCm(Math.max(...result.sizeChecks.map(c => c.maxDriftCm ?? 0)))
                : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{copy.smoothWalk}</div>
          </div>
        </div>

        {/* Per-size walk */}
        {result.sizeChecks.some(c => c.stitchCount > 0) && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center justify-between">
              <span>{copy.sizeWalk}</span>
              <span className="text-xs font-normal text-muted-foreground">{copy.stitchStep}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left py-1.5 pr-2 font-medium">{copy.size}</th>
                    <th className="text-right py-1.5 pr-2 font-medium">{copy.bustCm}</th>
                    <th className="text-right py-1.5 pr-2 font-medium">{copy.stitches}</th>
                    <th className="text-right py-1.5 font-medium">{copy.step}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sizeChecks.map((c) => (
                    <tr key={c.size} className="border-b last:border-0">
                      <td className="py-1.5 pr-2 font-medium">{c.size}</td>
                      <td className="text-right py-1.5 pr-2">{c.physicalCm.toFixed(1)}</td>
                      <td className="text-right py-1.5 pr-2 font-mono">{c.stitchCount || '—'}</td>
                      <td className="text-right py-1.5 font-mono">
                        {c.stepFromPrev !== null ? (c.stepFromPrev > 0 ? `+${c.stepFromPrev}` : c.stepFromPrev) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Flags */}
        {result.flags.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> {copy.flags}
            </div>
            {result.flags.map((f, i) => (
              <div key={`${f.code}-${i}`} className={`rounded-lg border p-3 text-sm ${flagColor(f.severity)}`}>
                <div className="font-medium">
                  {copy.flagTitles[f.code] ?? f.title} <span className="text-xs text-muted-foreground">({f.code})</span>
                  <Badge variant="outline" className="ml-2 text-[10px] uppercase">{copy.severityLabels[f.severity]}</Badge>
                </div>
                <div className="text-muted-foreground text-xs mt-1 whitespace-pre-line">{getGradingFlagDetail(language, f.code, f.detail)}</div>
              </div>
            ))}
          </div>
        )}
        {result.flags.length === 0 && result.verdict !== 'blocked' && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
            <div className="font-medium text-emerald-700">{copy.noFlags}</div>
            <div className="text-muted-foreground text-xs mt-1">
              {copy.noFlagsDescription}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {copy.benchmarks}
        </p>
        <Button variant="outline" size="sm"
          onClick={() => window.location.reload()}>
          <RotateCw className="h-3.5 w-3.5 mr-1.5" /> {copy.rerun}
        </Button>
      </CardContent>
    </Card>
  );
}

// ease-band reference kept next to the component for quick editing without re-opening the lib:
// [Very fitted ≤ −5cm · Classic fit 5–15 · Relaxed 15–25 · Oversized ≥ 15+10]
void EASE_BANDS;
