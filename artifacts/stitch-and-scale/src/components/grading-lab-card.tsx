import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FlaskConical, RotateCw } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { analyzeGrading, EASE_BANDS, type LabResult } from '@/lib/grading-lab';

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
  const result = useMemo(() => analyzeGrading(project), [project]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FlaskConical className="h-4 w-4" /> Grading Lab
        </CardTitle>
        <CardDescription>
          No tool in the market validates a whole graded set in one pass — freelancers catch these
          at $15–25 per size and a Google Sheet carries them silently. This lab grades every size in
          one sweep, then runs the checks a tech editor would: ease drift between neighbours, repeat
          alignment, decreasing stitches, gauge sanity, and ease conformance against the industry
          ease guide (very fitted ≤ −5cm … oversized ≥ +15cm at the bust).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verdict */}
        <div className={`rounded-lg border p-4 ${verdictColor(result.verdict)}`}>
          <Badge className={`${verdictColor(result.verdict)} border uppercase`}>{result.verdict}</Badge>
          <p className="text-sm mt-2">{result.verdictReason}</p>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Sizes graded</div>
            <div className="text-2xl font-bold">{result.gradedSizeCount}</div>
            <div className="text-xs text-muted-foreground mt-1">XS through 5XL walk the chart</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Ease at base size (bust)</div>
            <div className={`text-2xl font-bold ${
              result.gradedBustEaseCm !== null && result.gradedBustEaseCm < 0 ? 'text-blue-600' :
              'text-emerald-600'}`}>
              {result.gradedBustEaseCm !== null ? fmtCm(result.gradedBustEaseCm) : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{result.easeBand ?? 'no bust graded'}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Freelance cost saved</div>
            <div className="text-2xl font-bold text-emerald-600">
              {result.gradedSizeCount > 0 ? `${fmt$(result.freelanceCost.min)}–${fmt$(result.freelanceCost.max)}` : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">at $15–25/size market rates</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">Max ease drift (size step)</div>
            <div className={`text-2xl font-bold ${
              result.sizeChecks.some(c => (c.maxDriftCm ?? 0) > 1) ? 'text-destructive' : 'text-emerald-600'}`}>
              {result.sizeChecks.length > 0
                ? fmtCm(Math.max(...result.sizeChecks.map(c => c.maxDriftCm ?? 0)))
                : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">under 1cm is smooth walking</div>
          </div>
        </div>

        {/* Per-size walk */}
        {result.sizeChecks.some(c => c.stitchCount > 0) && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center justify-between">
              <span>Size walk — bust row</span>
              <span className="text-xs font-normal text-muted-foreground">stitch counts × step</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left py-1.5 pr-2 font-medium">Size</th>
                    <th className="text-right py-1.5 pr-2 font-medium">Bust (cm)</th>
                    <th className="text-right py-1.5 pr-2 font-medium">Stitches</th>
                    <th className="text-right py-1.5 font-medium">Step</th>
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
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Lab flags — G-01 to G-08
            </div>
            {result.flags.map((f, i) => (
              <div key={`${f.code}-${i}`} className={`rounded-lg border p-3 text-sm ${flagColor(f.severity)}`}>
                <div className="font-medium">
                  {f.title} <span className="text-xs text-muted-foreground">({f.code})</span>
                  <Badge variant="outline" className="ml-2 text-[10px] uppercase">{f.severity}</Badge>
                </div>
                <div className="text-muted-foreground text-xs mt-1 whitespace-pre-line">{f.detail}</div>
              </div>
            ))}
          </div>
        )}
        {result.flags.length === 0 && result.verdict !== 'blocked' && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
            <div className="font-medium text-emerald-700">No flags — the set grades cleanly.</div>
            <div className="text-muted-foreground text-xs mt-1">
              Every size walks the chart evenly, repeats align, and ease sits in a named band.
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Benchmarks baked in: ease bands follow sistermountain.com&apos;s sizing workshop
          (very fitted ≤ −5cm, classic ≈ +5, relaxed ≈ +10, oversized ≥ +15 at the bust); freelance
          grading runs $15–25 per size with $125–250 minimum jobs (fashion-incubator.com) — one
          graded set here is worth a quarter of a freelance job; size steps target the standard 2in
          bust grade rule; the XS–5XL range is the common published inclusive practice. Re-grade is
          one click after editing any section — the lab is a pure pass over your project, nothing is
          stored separately.
        </p>
        <Button variant="outline" size="sm"
          onClick={() => window.location.reload()}>
          <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Re-run lab
        </Button>
      </CardContent>
    </Card>
  );
}

// ease-band reference kept next to the component for quick editing without re-opening the lib:
// [Very fitted ≤ −5cm · Classic fit 5–15 · Relaxed 15–25 · Oversized ≥ 15+10]
void EASE_BANDS;
