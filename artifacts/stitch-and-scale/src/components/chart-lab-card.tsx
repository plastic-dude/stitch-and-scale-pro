import { copyTextOrThrow } from '@/lib/clipboard';
import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Copy, Check, PenLine, Grid3X3, Type, Eraser, Settings2 } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { getChartCopy, getChartFlagDetail } from '@/lib/chart-copy';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeChartRows,
  CYC_SYMBOLS,
  rowProse,
  rowStitchTotal,
  type ChartRowDef,
  validateChartInputs,
  gridRowToDef,
  type VisualChartGrid,
} from '@/lib/chart-lab';
import { invalidSummary, isInputValid } from '@/lib/validate-field';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChartLabState {
  rows: ChartRowDef[];
  gradedStitchCount: string;
  grid?: VisualChartGrid;
  mode?: 'visual' | 'text';
}

const DEFAULT_GRID: VisualChartGrid = {
  width: 10,
  height: 10,
  cells: Array(10).fill(0).map(() => Array(10).fill('blank')),
};

const DEFAULT_STATE: ChartLabState = {
  rows: [
    {
      row: 1,
      symbols: [{ symbolId: 'k2tog', count: 1 }, { symbolId: 'yo', count: 1 },
        { symbolId: 'knit', count: 1 }],
      repeatCount: 1, before: [{ symbolId: 'knit', count: 1 }],
      after: [{ symbolId: 'knit', count: 1 }],
    },
  ],
  gradedStitchCount: '',
  grid: DEFAULT_GRID,
  mode: 'text',
};

const verdictColor = (v: string) =>
  v === 'ready' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v === 'blocked' ? 'bg-destructive/15 text-destructive border-destructive/30' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

function blankRow(n: number): ChartRowDef {
  return {
    row: n, symbols: [{ symbolId: 'knit', count: 1 }], repeatCount: 1,
    before: [], after: [{ symbolId: 'knit', count: 1 }],
  };
}

export function ChartLabCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copy = getChartCopy(language);
  const handle = useMemo(
    () => projectStorage<ChartLabState>('chartlab', project.id || '', []),
    [project.id],
  );
  const [state, setState] = useState<ChartLabState>(() => {
    const stored = handle.read();
    return stored && stored.rows?.length ? stored : { ...DEFAULT_STATE };
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    handle.write(state);
  }, [state, handle]);

  const inputErrors = useMemo(() => validateChartInputs(state), [state]);
  const inputsInvalid = !isInputValid(inputErrors);

  const result = useMemo(
    () => analyzeChartRows(state.rows, state.gradedStitchCount ? Number(state.gradedStitchCount) : null),
    [state],
  );

  const [activeSymbol, setActiveSymbol] = useState(CYC_SYMBOLS[0].id);

  const patchRow = (idx: number, patch: Partial<ChartRowDef>) =>
    setState((s) => ({ ...s, rows: s.rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)) }));

  const syncGridToRows = (grid: VisualChartGrid) => {
    const newRows = grid.cells.map((cells, i) => gridRowToDef(i, cells)).reverse();
    setState(s => ({ ...s, rows: newRows }));
  };

  const handleCellClick = (rowIdx: number, colIdx: number) => {
    if (!state.grid) return;
    const newCells = state.grid.cells.map((row, r) => 
      r === rowIdx ? row.map((cell, c) => c === colIdx ? activeSymbol : cell) : row
    );
    const newGrid = { ...state.grid, cells: newCells };
    setState(s => ({ ...s, grid: newGrid }));
    syncGridToRows(newGrid);
  };

  const clearGrid = () => {
    if (!state.grid) return;
    const newGrid = { ...state.grid, cells: state.grid.cells.map(r => r.fill('blank')) };
    setState(s => ({ ...s, grid: newGrid }));
    syncGridToRows(newGrid);
  };

  const resizeGrid = (w: number, h: number) => {
    if (!state.grid) return;
    const newCells = Array(h).fill(0).map((_, r) => 
      Array(w).fill(0).map((_, c) => state.grid?.cells[r]?.[c] ?? 'blank')
    );
    const newGrid = { width: w, height: h, cells: newCells };
    setState(s => ({ ...s, grid: newGrid }));
    syncGridToRows(newGrid);
  };

  const setSymbolCount = (idx: number, symbolId: string, count: number) => {
    const row = state.rows[idx];
    const symbols = count > 0
      ? [...row.symbols.filter((s) => s.symbolId !== symbolId), { symbolId, count }]
      : row.symbols.filter((s) => s.symbolId !== symbolId);
    patchRow(idx, { symbols });
  };

  const addRow = () => setState((s) => ({
    ...s,
    rows: [...s.rows, blankRow(Math.max(0, ...s.rows.map((r) => r.row)) + 1)],
  }));

  const removeRow = (idx: number) => setState((s) => ({ ...s, rows: s.rows.filter((_, i) => i !== idx) }));

  const proseText = result.proseRows.map((p) => p.text).join('\n');
  const copyProse = async () => {
    if (inputsInvalid) return;
    await copyTextOrThrow(proseText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PenLine className="h-4 w-4" /> {copy.title}
        </CardTitle>
        <CardDescription>
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={state.mode || 'text'} onValueChange={(v) => setState(s => ({ ...s, mode: v as any }))}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="text" className="gap-2 min-h-11"><Type className="h-4 w-4" /> {copy.modeText}</TabsTrigger>
            <TabsTrigger value="visual" className="gap-2 min-h-11"><Grid3X3 className="h-4 w-4" /> {copy.modeVisual}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Graded count check */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="chart-graded" className="text-xs">{copy.gradedCount}</Label>
            <div className="relative">
              <Input id="chart-graded" type="number" min={0} step={1} placeholder={`e.g. 184`}
                value={state.gradedStitchCount}
                onChange={(e) => setState((s) => ({ ...s, gradedStitchCount: e.target.value }))} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                {copy.stitchUnit}
              </span>
            </div>
          </div>
        </div>

        {/* Validation summary */}
        {inputsInvalid && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              {copy.verdictLabels.blocked} — {copy.invalidInputsTitle || 'Invalid inputs'}
            </div>
            <div className="text-xs text-destructive/80 whitespace-pre-line leading-relaxed">
              {invalidSummary(inputErrors)}
            </div>
          </div>
        )}

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.rowsBalanced}</div>
            <div className={`text-2xl font-bold ${result.exactFitRows === result.totalRows ? 'text-emerald-600' : 'text-destructive'}`}>
              {result.exactFitRows} / {result.totalRows}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.maxDrift}</div>
            <div className="text-2xl font-bold">{result.maxDrift} <span className="text-sm text-muted-foreground">st</span></div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.repeatBlock}</div>
            <div className="text-2xl font-bold">
              {result.totalRows > 0 ? `${result.rows[0].repeatStitches} ${copy.stitchUnit}` : '—'}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{copy.verdict}</div>
            <div className="mt-1">
              <Badge className={`${verdictColor(inputsInvalid ? 'blocked' : result.verdict)} uppercase`}>
                {copy.verdictLabels[inputsInvalid ? 'blocked' : result.verdict]}
              </Badge>
            </div>
          </div>
        </div>

        {/* Verdict banner */}
        <div className={`rounded-lg border p-4 ${verdictColor(inputsInvalid ? 'blocked' : result.verdict)}`}>
          <p className="text-sm">
            {inputsInvalid 
              ? (copy.invalidInputsReason || 'Please fix the highlighted input errors before the chart can be validated.')
              : result.verdictReason}
          </p>
        </div>

        {/* Mode-specific content */}
        {state.mode === 'visual' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Visual Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border bg-muted/20">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{copy.palette}</div>
                <div className="flex flex-wrap gap-1.5">
                  {CYC_SYMBOLS.map((s) => (
                    <Button 
                      key={s.id} 
                      variant={activeSymbol === s.id ? 'default' : 'outline'} 
                      size="sm" 
                      className="h-8 gap-1.5 px-2 text-xs"
                      onClick={() => setActiveSymbol(s.id)}
                    >
                      <span className="font-mono font-bold">{s.abbr}</span>
                      <span className="hidden sm:inline opacity-70">{s.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-background">
                  <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    type="number" 
                    className="h-7 w-12 p-1 text-center text-xs border-none focus-visible:ring-0" 
                    value={state.grid?.width}
                    onChange={(e) => resizeGrid(Number(e.target.value), state.grid?.height || 10)}
                  />
                  <span className="text-xs text-muted-foreground">×</span>
                  <Input 
                    type="number" 
                    className="h-7 w-12 p-1 text-center text-xs border-none focus-visible:ring-0" 
                    value={state.grid?.height}
                    onChange={(e) => resizeGrid(state.grid?.width || 10, Number(e.target.value))}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={clearGrid} className="text-destructive hover:text-destructive gap-1.5">
                  <Eraser className="h-4 w-4" /> {copy.clearGrid}
                </Button>
              </div>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto pb-4">
              <div 
                className="inline-grid gap-px bg-border border rounded-md shadow-inner"
                style={{ 
                  gridTemplateColumns: `repeat(${state.grid?.width}, minmax(32px, 1fr))`,
                  minWidth: '100%'
                }}
              >
                {state.grid?.cells.map((row, r) => 
                  row.map((cell, c) => {
                    const symbol = CYC_SYMBOLS.find(s => s.id === cell);
                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => handleCellClick(r, c)}
                        className={cn(
                          "h-10 w-full flex items-center justify-center font-mono font-bold text-sm transition-colors",
                          "bg-background hover:bg-muted/50 active:bg-muted",
                          cell !== 'blank' && "bg-primary/5 text-primary"
                        )}
                        title={`${symbol?.name} (Row ${state.grid!.height - r}, Col ${c + 1})`}
                      >
                        {symbol?.abbr}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* CYC symbol gallery */}
            <div className="space-y-2">
              <div className="font-semibold text-sm">{copy.symbolKey}</div>
              <div className="flex flex-wrap gap-2">
                {CYC_SYMBOLS.map((s) => (
                  <div key={s.id} className="rounded border bg-muted/40 px-2 py-1 text-xs" title={s.name}>
                    <span className="font-mono font-semibold">{s.abbr}</span>
                    <span className="text-muted-foreground ml-1">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Row editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm">{copy.chartRows}</div>
                <Button variant="outline" size="sm" onClick={addRow}>{copy.addRow}</Button>
              </div>
              {state.rows.map((r, idx) => (
                <div key={idx} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{copy.row} {r.row}</div>
                    <div className="flex items-center gap-2">
                      {state.rows.length > 1 && (
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive"
                          onClick={() => removeRow(idx)}>{copy.remove}</Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{copy.repeatCount}</Label>
                      <Input type="number" min={1} value={r.repeatCount}
                        onChange={(e) => patchRow(idx, { repeatCount: Math.max(1, Number(e.target.value) || 1) })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{copy.selvedgeBefore}</Label>
                      <Input type="number" min={0} value={(r.before.find(s => s.symbolId === 'knit')?.count) ?? 0}
                        onChange={(e) => patchRow(idx, {
                          before: e.target.value ? [{ symbolId: 'knit', count: Number(e.target.value) }] : [],
                        })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{copy.selvedgeAfter}</Label>
                      <Input type="number" min={0} value={(r.after.find(s => s.symbolId === 'knit')?.count) ?? 0}
                        onChange={(e) => patchRow(idx, {
                          after: e.target.value ? [{ symbolId: 'knit', count: Number(e.target.value) }] : [],
                        })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{copy.rowTotal}</Label>
                      <div className="rounded border bg-muted/40 px-2 py-1.5 text-sm font-semibold">
                        {rowStitchTotal(r)} {copy.stitchUnit}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{copy.symbolsInside}</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {CYC_SYMBOLS.map((s) => {
                        const cur = r.symbols.find((x) => x.symbolId === s.id)?.count ?? 0;
                        return (
                          <div key={s.id} className="flex items-center gap-1 rounded border bg-muted/20 px-1.5 py-0.5 text-xs">
                            <span className="font-mono font-semibold" title={s.name}>{s.abbr}</span>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-xs"
                              onClick={() => setSymbolCount(idx, s.id, cur - 1)}>-</Button>
                            <span className="w-4 text-center">{cur}</span>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-xs"
                              onClick={() => setSymbolCount(idx, s.id, cur + 1)}>+</Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded bg-muted/40 p-2.5 text-xs font-mono text-muted-foreground">
                    {rowProse(r)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pattern prose panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm">{copy.proseTitle}</div>
            <Button variant="outline" size="sm" onClick={copyProse} className="gap-1" disabled={inputsInvalid}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? copy.copied : copy.copyProse}
            </Button>
          </div>
          <Textarea value={inputsInvalid ? '—' : proseText} readOnly rows={Math.max(4, result.proseRows.length + 1)}
            className={`font-mono text-xs ${inputsInvalid ? 'opacity-50 grayscale' : ''}`} />
        </div>

        {/* Flags */}
        {result.flags.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> {copy.symbolKey} · C-01 to C-07
            </div>
            {result.flags.map((f) => (
              <div key={f.code}
                className={`rounded-lg border p-3 text-sm ${
                  f.severity === 'error' ? 'border-destructive/40 bg-destructive/5' :
                  f.severity === 'warn' ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-muted/20'}`}>
                <div className="font-medium">{copy.flagTitles[f.code] ?? f.title} <span className="text-xs text-muted-foreground">({f.code} · {copy.severityLabels[f.severity]})</span></div>
                <div className="text-muted-foreground text-xs mt-1">{getChartFlagDetail(language, f.code, f.detail)}</div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {copy.sourceNote}
        </p>
      </CardContent>
    </Card>
  );
}
