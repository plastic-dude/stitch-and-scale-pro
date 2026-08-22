import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, FileText, Plus, X } from 'lucide-react';
import { BenchmarkFooter } from './benchmark-footer';
import { getWorkspaceCopy } from '@/lib/workspace-copy';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { getSpecSheetCopy, getSpecFlagMessage, getSpecFlagTitle, getSpecGaugeLine, getSpecVerdictReason, getSpecYarnLabel } from '@/lib/spec-sheet-copy';
import { YARN_WEIGHT_LABELS, YARN_WEIGHTS } from '@/lib/yarn-estimator';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeSpecSheet,
  DEFAULT_SPEC_SHEET,
  SESSION_45_MARKET,
  type PomRow,
  type SpecSheetInputs,
} from '@/lib/spec-sheet-lab';

function defaultStored(): SpecSheetInputs {
  return { ...DEFAULT_SPEC_SHEET };
}

function loadStored(handle: ReturnType<typeof projectStorage<SpecSheetInputs>>): SpecSheetInputs {
  const parsed = handle.read();
  if (parsed) {
    const merged = { ...defaultStored(), ...parsed };
    merged.construction = ['', 'flat', 'circular', 'fully-fashioned'].includes(merged.construction)
      ? (merged.construction as SpecSheetInputs['construction'])
      : '';
    merged.yarnWeight = YARN_WEIGHTS.includes(merged.yarnWeight)
      ? merged.yarnWeight
      : 'worsted';
    return merged;
  }
  return defaultStored();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const verdictColor = (v: string) =>
  v === 'ready' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v === 'blocked' ? 'bg-destructive/15 text-destructive border-destructive/30' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

function NumField({ id, label, value, onChange, min = 0, max, step = 0.01, suffix }: {
  id: string; label: string; value: number;
  onChange: (n: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="relative">
        <Input id={id} type="number" min={min} {...(max !== undefined ? { max } : {})} step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) >= 0 ? Number(e.target.value) : 0)}
          className={suffix ? 'pr-8' : undefined} />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function pomRowLabel(row: PomRow): string {
  return row.note ? `${row.point} (${row.note})` : row.point;
}

export function SpecSheetLabCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copy = getSpecSheetCopy(language);
  const workspaceCopy = getWorkspaceCopy(language);
  const handle = useMemo(
    () => projectStorage<SpecSheetInputs>('specsheetlab', project.id || '', []),
    [project.id],
  );
  const [stored, setStored] = useState<SpecSheetInputs>(() => loadStored(handle));
  useEffect(() => {
    handle.write(stored);
  }, [stored, handle]);
  const patch = (patch: Partial<SpecSheetInputs>) => setStored((s) => ({ ...s, ...patch }));
  const result = useMemo(() => analyzeSpecSheet(project, stored), [project, stored]);

  const allRows = [...result.pomTable, ...result.extraPoints];
  const sizeCols = useMemo(
    () => Array.from(new Set(allRows.flatMap((r) => Object.keys(r.values)))) as import('@/lib/grading-engine').SizeKey[],
    [allRows],
  );

  const addColourway = () =>
    patch({ colourways: [...stored.colourways, { name: '', yarnSpec: '' }] });
  const updateColourway = (i: number, p: Partial<{ name: string; yarnSpec: string }>) =>
    patch({ colourways: stored.colourways.map((c, j) => (j === i ? { ...c, ...p } : c)) });
  const removeColourway = (i: number) =>
    patch({ colourways: stored.colourways.filter((_, j) => j !== i) });

  const addPoint = () =>
    patch({ pomPoints: [...stored.pomPoints, { label: '', gradingKey: '', toleranceIn: 0 }] });
  const updatePoint = (i: number, p: Partial<{ label: string; gradingKey: string; toleranceIn: number }>) =>
    patch({ pomPoints: stored.pomPoints.map((c, j) => (j === i ? { ...c, ...p } : c)) });
  const removePoint = (i: number) =>
    patch({ pomPoints: stored.pomPoints.filter((_, j) => j !== i) });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-4 w-4" /> {copy.title}
        </CardTitle>
        <CardDescription>
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verdict */}
        <div className={`rounded-lg border p-4 ${verdictColor(result.verdict)}`}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${verdictColor(result.verdict)} border uppercase`}>{copy.verdict[result.verdict]}</Badge>
            <span className="text-sm font-medium">
              {copy.quoteReadiness} {result.readinessScore}/6
            </span>
          </div>
          <p className="text-sm mt-2">{getSpecVerdictReason(language, result.verdict, result.readinessScore)}</p>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.pomPoints}</div>
            <div className={`text-2xl font-bold ${allRows.length >= result.benchmarks.pomNormMin ? 'text-emerald-600' : allRows.length >= 8 ? 'text-amber-600' : 'text-destructive'}`}>
              {allRows.length}
            </div>
            <div className="text-xs text-muted-foreground">{copy.norm} {result.benchmarks.pomNormMin}–{result.benchmarks.pomNormMax}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.yarnBill}</div>
            <div className="text-2xl font-bold">{result.yarnBill.length > 0 ? copy.complete : '—'}</div>
            <div className="text-xs text-muted-foreground">
              {result.yarnBill.find(r => r.label === 'Estimated yardage (base size)')?.value ?? copy.noYardage}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.toleranceBand}</div>
            <div className="text-2xl font-bold">±{stored.toleranceDefault.toFixed(2)}in</div>
            <div className="text-xs text-muted-foreground">norm {result.benchmarks.toleranceBand}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.colourways}</div>
            <div className="text-2xl font-bold">{stored.colourways.length || '—'}</div>
            <div className="text-xs text-muted-foreground">{copy.strengthensQuote}</div>
          </div>
        </div>

        {/* Gauge block */}
        <div className="space-y-2">
          <div className="font-semibold text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> {copy.gaugeConstruction}
          </div>
          {result.gaugeBlock.length > 0 ? (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
              {result.gaugeBlock.map((g, i) => (
                <div key={i}>{getSpecGaugeLine(language, g)}</div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {copy.noGauge}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumField id="ss-tolerance" label={copy.tolerance} value={stored.toleranceDefault}
              onChange={(n) => patch({ toleranceDefault: Math.min(1, n) })} min={0.01} max={1} suffix="in" />
            <NumField id="ss-machine-gauge" label={copy.machineGauge} value={stored.machineGauge}
              onChange={(n) => patch({ machineGauge: Math.min(20, n) })} min={0} max={20} suffix="g" />
            <div className="space-y-1.5">
              <Label htmlFor="ss-construction" className="text-xs">{copy.construction}</Label>
              <Select value={stored.construction} onValueChange={(v) => patch({ construction: v as SpecSheetInputs['construction'] })}>
                <SelectTrigger id="ss-construction"><SelectValue placeholder={copy.choose} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{copy.notChosen}</SelectItem>
                  <SelectItem value="flat">{copy.flat}</SelectItem>
                  <SelectItem value="circular">{copy.circular}</SelectItem>
                  <SelectItem value="fully-fashioned">{copy.fullyFashioned}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ss-yarn-weight" className="text-xs">{copy.yarnWeight}</Label>
              <Select value={stored.yarnWeight} onValueChange={(v) => patch({ yarnWeight: v as SpecSheetInputs['yarnWeight'] })}>
                <SelectTrigger id="ss-yarn-weight"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YARN_WEIGHTS.map((w) => (
                    <SelectItem key={w} value={w}>{YARN_WEIGHT_LABELS[w]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* POM table */}
        <div className="space-y-2">
          <div className="font-semibold text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> {copy.pomSheet}
          </div>
          {allRows.length > 0 ? (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left p-2 whitespace-nowrap">{copy.point}</th>
                    {sizeCols.map((s) => (
                      <th key={s} className="text-right p-2">{s}</th>
                    ))}
                    <th className="text-right p-2 whitespace-nowrap">{copy.toleranceShort}</th>
                  </tr>
                </thead>
                <tbody>
                  {allRows.map((row) => (
                    <tr key={row.point} className="border-b last:border-b-0">
                      <td className="p-2 whitespace-nowrap">
                        {row.point}
                        {row.note ? <span className="text-muted-foreground"> ({row.note})</span> : null}
                        {!row.graded && <Badge variant="outline" className="ml-1 text-[10px]">{copy.manual}</Badge>}
                      </td>
                      {sizeCols.map((s) => (
                        <td key={s} className="text-right p-2 tabular-nums">
                          {row.values[s] !== undefined ? row.values[s]!.toFixed(1) : '—'}
                        </td>
                      ))}
                      <td className="text-right p-2 tabular-nums">{row.toleranceIn.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {copy.noPom} {copy.addMeasurements}
            </div>
          )}
        </div>

        {/* Manual POM points */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm">{copy.manualPoints}</div>
            <button onClick={addPoint}
              className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 hover:bg-muted">
              <Plus className="h-3 w-3" /> {copy.addPoint}
            </button>
          </div>
          {stored.pomPoints.map((p, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="space-y-1.5 min-w-[140px] flex-1">
                <Label className="text-xs">{copy.label}</Label>
                <Input value={p.label} placeholder={copy.labelPlaceholder}
                  onChange={(e) => updatePoint(i, { label: e.target.value })} />
              </div>
              <div className="space-y-1.5 w-[160px]">
                <Label className="text-xs">{copy.toleranceDefault}</Label>
                <Input type="number" step={0.05} min={0} max={1} value={p.toleranceIn}
                  onChange={(e) => updatePoint(i, { toleranceIn: Number(e.target.value) >= 0 ? Number(e.target.value) : 0 })} />
              </div>
              <button onClick={() => removePoint(i)}
                className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 text-destructive hover:bg-destructive/10">
                <X className="h-3 w-3" /> {copy.remove}
              </button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            {copy.manualHelp}
          </p>
        </div>

        {/* Yarn bill & colourways */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="font-semibold text-sm">{copy.yarnBill}</div>
            <div className="space-y-1.5">
              <Label htmlFor="ss-fibre" className="text-xs">{copy.fibre}</Label>
              <Input id="ss-fibre" value={stored.fibreComposition}
                placeholder={copy.fibrePlaceholder}
                onChange={(e) => patch({ fibreComposition: e.target.value })} />
            </div>
            <NumField id="ss-yardage" label={copy.yardageOverride}
              value={stored.yardageOverride} onChange={(n) => patch({ yardageOverride: Math.min(100000, n) })}
              min={0} max={100000} suffix="yd" />
            {result.yarnBill.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
                {result.yarnBill.map((r) => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-muted-foreground">{getSpecYarnLabel(language, r.label)}</span>
                    <span className="font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">{copy.colourways}</div>
              <button onClick={addColourway}
                className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 hover:bg-muted">
                <Plus className="h-3 w-3" /> {copy.addColourway}
              </button>
            </div>
            {stored.colourways.map((c, i) => (
              <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="space-y-1.5 flex-1 min-w-[120px]">
                  <Label className="text-xs">{copy.name}</Label>
                  <Input value={c.name} placeholder={copy.namePlaceholder}
                    onChange={(e) => updateColourway(i, { name: e.target.value })} />
                </div>
                <div className="space-y-1.5 flex-1 min-w-[160px]">
                  <Label className="text-xs">{copy.yarnSpec}</Label>
                  <Input value={c.yarnSpec} placeholder={copy.yarnSpecPlaceholder}
                    onChange={(e) => updateColourway(i, { yarnSpec: e.target.value })} />
                </div>
                <button onClick={() => removeColourway(i)}
                  className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 text-destructive hover:bg-destructive/10">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              {copy.colourwayHelp}
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="ss-notes" className="text-xs">{copy.notes}</Label>
          <Textarea id="ss-notes" value={stored.notes}
            placeholder={copy.notesPlaceholder}
            onChange={(e) => patch({ notes: e.target.value })} rows={3} />
        </div>

        {/* Flags */}
        {result.flags.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> {copy.flags}
            </div>
            {result.flags.map((f) => (
              <div key={f.code} className={`rounded-lg border p-3 text-sm ${
                f.severity === 'error' ? 'border-destructive/30 bg-destructive/5' :
                f.severity === 'warning' ? 'border-amber-500/30 bg-amber-500/5' :
                'border-border bg-muted/30'}`}>
                <div className="font-medium"><span className="font-semibold">{getSpecFlagTitle(language, f.code)}</span>: {getSpecFlagMessage(language, f.code, f.message)} <span className="text-xs text-muted-foreground">({f.code})</span></div>
              </div>
            ))}
          </div>
        )}

        {/* Market framing */}
        <BenchmarkFooter 
          text={copy.benchmarks(result.benchmarks.pomNormMin, result.benchmarks.pomNormMax, SESSION_45_MARKET.machineGaugeLow, SESSION_45_MARKET.machineGaugeHigh, SESSION_45_MARKET.freelancePackLow, SESSION_45_MARKET.freelancePackHigh, SESSION_45_MARKET.aiPackLow, SESSION_45_MARKET.aiPackHigh)}
          sourceLabel={workspaceCopy.sourceMethodology}
          methodology={workspaceCopy.methodologySubmissions}
        />
      </CardContent>
    </Card>
  );
}
