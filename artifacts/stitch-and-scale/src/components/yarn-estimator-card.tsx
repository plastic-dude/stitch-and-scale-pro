import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { YarnWeight, YARN_WEIGHTS, YARN_WEIGHT_LABELS, YARN_WEIGHT_NEEDLES, YARN_WEIGHT_DATA, estimateYarn } from '@/lib/yarn-estimator';
import { PatternProject } from '@/lib/grading-engine';
import { cn } from '@/lib/utils';

/**
 * Yarn estimator panel: select a yarn weight to see the estimated yardage,
 * meters, and 100g-skein count for the project's base size, plus a
 * full-weight comparison so the designer can size up the same pattern in
 * different yarns before committing to a swatch.
 *
 * The estimate is a first-pass planning figure — always overestimate, never
 * undersell a buyer on yardage, so we present it explicitly as an estimate
 * and never as a substitute for the designer's swatch-based final math.
 */
export function YarnEstimatorCard({ project }: { project: PatternProject }) {
  const [weight, setWeight] = React.useState<YarnWeight>(() => {
    const candidate = (project.yarnWeight as YarnWeight) || null;
    return candidate && YARN_WEIGHTS.includes(candidate) ? candidate : 'worsted';
  });
  const estimate = estimateYarn(project, weight);
  const allEstimates = YARN_WEIGHTS.map(w => {
    const e = estimateYarn(project, w);
    return { weight: w, totalYards: e.totalYards, totalMeters: e.totalMeters, skeins100g: e.skeins100g, fabricAreaSqIn: e.fabricAreaSqIn };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">Yarn Requirement Estimate</CardTitle>
        <CardDescription>
          Estimated yardage for the {project.baseSize} base size, per the Craft Yarn Council weight system.
          A first-pass planning figure — always confirm against your own swatch before publishing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label htmlFor="yarn-weight-select" className="text-xs text-muted-foreground mb-1 block">Yarn weight</label>
            <NativeSelect
              id="yarn-weight-select"
              value={weight}
              onChange={(e) => setWeight(e.target.value as YarnWeight)}
              data-testid="select-yarn-weight"
            >
              {YARN_WEIGHTS.map(w => (
                <option key={w} value={w}>{YARN_WEIGHT_LABELS[w]}</option>
              ))}
            </NativeSelect>
          </div>
          <p className="text-xs text-muted-foreground pb-1">
            {YARN_WEIGHT_DATA[weight].yardagePer100g} yd / 100g • {YARN_WEIGHT_NEEDLES[weight]}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <div className="text-2xl font-mono font-bold text-foreground">{estimate.totalYards.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">yards ({estimate.totalMeters.toLocaleString()} m)</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <div className="text-2xl font-mono font-bold text-foreground">{estimate.skeins100g}</div>
            <div className="text-xs text-muted-foreground mt-1">× 100g skeins (min.)</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <div className="text-2xl font-mono font-bold text-foreground">{estimate.fabricAreaSqIn.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">sq in of fabric (base size)</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Compare across weights</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="px-2 py-2 font-medium">Weight</th>
                  <th className="px-3 py-2 text-right font-medium">Yards</th>
                  <th className="px-3 py-2 text-right font-medium">Meters</th>
                  <th className="px-3 py-2 text-right font-medium">100g skeins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allEstimates.map(e => (
                  <tr key={e.weight} className={cn("hover:bg-muted/30", e.weight === weight && "bg-primary/5")}>
                    <td className="px-2 py-2.5 font-medium">{YARN_WEIGHT_LABELS[e.weight]}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{e.totalYards.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{e.totalMeters.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{e.skeins100g}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Estimate computed from the graded base-size dimensions ({estimate.fabricAreaSqIn.toLocaleString()} sq in of fabric)
          scaled by the CYC reference gauge for the selected weight. Graded-up sizes (L–5XL) need roughly
          proportionally more yardage — use this panel after grading if you want per-size totals.
        </p>
      </CardContent>
    </Card>
  );
}
