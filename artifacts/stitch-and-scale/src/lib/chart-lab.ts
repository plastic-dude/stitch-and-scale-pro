/**
 * Chart Lab — the chart desk no competitor connects to grading & costing.
 *
 * Market context (session 41):
 * - Stitchmastery (£60 desktop): chart→text exists but raw per-row output; no project data.
 * - Stitch Fiddle: flat charts only — no repeats, no multi-size on flat charts.
 * - Chart Minder: basic charts, limited symbols, no accounting.
 * - EnvisioKnit: text→chart, not chart sanity. All stale or isolated from grading/cost.
 *
 * This lab gives designers: (a) a CYC-standard symbol key, (b) row-budget
 * stitch accounting that checks a row's repeat math against the graded stitch
 * counts, (c) multi-size repeat awareness, and (d) plain-prose instruction
 * drafting with proper repeat arithmetic (n×rep + remainder + borders).
 */

import { type ValidationResult, validateField } from './validate-field';

/** CYC standardized knit chart symbols (craftyarncouncil.com/standards/knit-chart-symbols). */
export interface ChartSymbol {
  id: string;
  name: string;
  abbr: string;
  /** Stitches consumed per symbol instance. */
  stitchCost: number;
}

export const CYC_SYMBOLS: ChartSymbol[] = [
  { id: 'knit', name: 'Knit', abbr: 'k', stitchCost: 1 },
  { id: 'purl', name: 'Purl', abbr: 'p', stitchCost: 1 },
  { id: 'yo', name: 'Yarnover', abbr: 'yo', stitchCost: 1 },
  { id: 'k2tog', name: 'Knit two together', abbr: 'k2tog', stitchCost: 2 },
  { id: 'ssk', name: 'Slip, slip, knit', abbr: 'ssk', stitchCost: 2 },
  { id: 'p2tog', name: 'Purl two together', abbr: 'p2tog', stitchCost: 2 },
  { id: 'sl1k', name: 'Slip one knitwise', abbr: 'sl 1', stitchCost: 0 },
  { id: 'blank', name: 'Work as set (no operation)', abbr: '·', stitchCost: 1 },
  { id: 'c2f', name: 'Cable 2 front', abbr: 'c2f', stitchCost: 2 },
  { id: 'c2b', name: 'Cable 2 back', abbr: 'c2b', stitchCost: 2 },
  { id: 'm1l', name: 'Make one left', abbr: 'm1L', stitchCost: 1 },
  { id: 'm1r', name: 'Make one right', abbr: 'm1R', stitchCost: 1 },
  { id: 'bobble', name: 'Bobble (into one stitch)', abbr: 'mb', stitchCost: 1 },
];

/** One authored chart row: a sequence of symbol counts, optionally bracketed as a repeat. */
export interface ChartRowDef {
  /** 1-based row number as drawn. */
  row: number;
  /** Symbol counts inside the repeat block. */
  symbols: { symbolId: string; count: number }[];
  /** Number of times the repeat block repeats across the row. */
  repeatCount: number;
  /** Extra stitches before the repeat block (e.g. selvedge / border). */
  before: { symbolId: string; count: number }[];
  /** Extra stitches after the repeat block. */
  after: { symbolId: string; count: number }[];
}

export interface RowAccounting {
  row: number;
  /** Stitches one full repeat block consumes. */
  repeatStitches: number;
  /** Stitches the whole row consumes: before + repeatCount×block + after. */
  totalStitches: number;
  /** Row fits the graded stitch count exactly. */
  exactFit: boolean;
  /** Difference vs the graded count (positive = row uses more stitches). */
  drift: number;
}

export interface ChartFlag {
  code: string;
  title: string;
  severity: 'error' | 'warn' | 'info';
  detail: string;
}

export interface ChartLabResult {
  rows: RowAccounting[];
  /** Number of rows that fit their graded count exactly. */
  exactFitRows: number;
  totalRows: number;
  /** Largest absolute drift (in stitches) across the chart. */
  maxDrift: number;
  /** The graded bust (or base) stitch count rows were checked against. */
  gradedStitchCount: number | null;
  flags: ChartFlag[];
  /** Plain-prose row instructions with repeat math in pattern-writer English. */
  proseRows: { row: number; text: string }[];
  /** Verdict over the authored chart rows. */
  verdict: 'ready' | 'review' | 'blocked';
  verdictReason: string;
}

function symCost(symbolId: string, count: number): number {
  const inst = CYC_SYMBOLS.find(s => s.id === symbolId);
  return (inst?.stitchCost ?? 1) * count;
}

/** How many stitches the authoring definition of a row consumes. */
export function rowStitchTotal(r: ChartRowDef): number {
  const block = r.symbols.reduce((a, s) => a + symCost(s.symbolId, s.count), 0);
  const before = r.before.reduce((a, s) => a + symCost(s.symbolId, s.count), 0);
  const after = r.after.reduce((a, s) => a + symCost(s.symbolId, s.count), 0);
  return before + block * Math.max(1, Math.round(r.repeatCount)) + after;
}

function fmtRep(text: string, n: number): string {
  if (n === 1) return text;
  if (n === 2) return `${text}, ${text}`;
  return `${text} ${n} times`;
}

/** Plain-prose instruction for one authored row, with proper repeat arithmetic. */
export function rowProse(r: ChartRowDef): string {
  const nameOf = (id: string) => (CYC_SYMBOLS.find(s => s.id === id) ?? { abbr: id }).abbr;
  const pieces: string[] = [];
  for (const b of r.before) {
    if (b.count > 0) pieces.push(fmtRep(nameOf(b.symbolId), b.count));
  }
  const block = r.symbols.filter(s => s.count > 0)
    .map(s => `${s.count} ${nameOf(s.symbolId)}`)
    .join(', ');
  if (block) {
    if (r.repeatCount > 1) pieces.push(`(${block}) x ${r.repeatCount}`);
    else pieces.push(block);
  }
  for (const a of r.after) {
    if (a.count > 0) pieces.push(fmtRep(nameOf(a.symbolId), a.count));
  }
  return `Row ${r.row}: ${pieces.join('; ')}.`;
}

/**
 * Analyze authored chart rows against a graded stitch count (the base-size
 * stitch count for the measurement the chart rows belong to).
 */
export function analyzeChartRows(
  rows: ChartRowDef[],
  gradedStitchCount: number | null,
): ChartLabResult {
  // A graded count is only usable when it is a positive, finite number —
  // a zero or negative "base count" means the lab has nothing legitimate
  // to check rows against, same as having no count at all. A chart can never
  // truthfully be declared "ready" without a usable graded count (F-08).
  const usableGradedCount = gradedStitchCount !== null &&
    Number.isFinite(gradedStitchCount) &&
    gradedStitchCount > 0
    ? gradedStitchCount
    : null;
  const accounts = rows.map((r) => {
    const total = rowStitchTotal(r);
    const block = r.symbols.reduce((a, s) => a + symCost(s.symbolId, s.count), 0);
    const drift = usableGradedCount !== null ? total - usableGradedCount : 0;
    return {
      row: r.row,
      repeatStitches: block,
      totalStitches: total,
      exactFit: usableGradedCount !== null && total === usableGradedCount,
      drift,
    };
  });

  const flags: ChartFlag[] = [];
  const emptyRepeat = rows.some(r => r.symbols.length === 0);
  if (emptyRepeat) {
    flags.push({
      code: 'C-01', title: 'Row has no repeat block', severity: 'warn',
      detail: 'At least one row declares only border stitches — a chart without a repeat ' +
        'block cannot be multiplied across sizes. Add the repeat symbols.',
    });
  }
  const badRepeat = rows.some(r => r.repeatCount < 1 || !Number.isFinite(r.repeatCount));
  if (badRepeat) {
    flags.push({
      code: 'C-02', title: 'Repeat count below 1', severity: 'error',
      detail: 'A repeat must run at least once across the row. A chart like Stitch Fiddle\u2019s ' +
        'flat-only boards can\u2019t express this — ours can, and must.',
    });
  }
  const unknown = rows.some(r =>
    [...r.symbols, ...r.before, ...r.after].some(s => !CYC_SYMBOLS.find(c => c.id === s.symbolId)));
  if (unknown) {
    flags.push({
      code: 'C-03', title: 'Unknown symbol in row', severity: 'error',
      detail: 'A symbol is not in the CYC key. Custom symbols must define their stitch cost — ' +
        'an undefined cost silently breaks the row budget.',
    });
  }
  const negative = accounts.some(a => a.totalStitches < 0);
  if (negative) {
    flags.push({
      code: 'C-04', title: 'Negative row budget', severity: 'error',
      detail: 'At least one row consumes a negative stitch count — a repeat block with a ' +
        'net-decreasing count (e.g. 3 decreases, 0 yarnovers) will run out of stitches.',
    });
  }
  const exact = accounts.filter(a => a.exactFit).length;
  // With a usable graded count, drift is the gap to that count; without one,
  // report the widest internal disagreement between rows (stitches a designer
  // must still reconcile) rather than pretending the gap is zero.
  const drifts = usableGradedCount !== null
    ? accounts.map(a => Math.abs(a.drift))
    : accounts.map(a => {
        // No valid target: drift = how far this row's total sits from the
        // chart's own center (median row total), so the max-drift tile never
        // pretends an unverified chart is internally consistent.
        const totals = accounts.map(x => x.totalStitches).sort((x, y) => x - y);
        const median = totals[Math.floor(totals.length / 2)] ?? 0;
        return Math.abs(a.totalStitches - median);
      });
  const maxDrift = drifts.length ? Math.max(...drifts) : 0;
  if (usableGradedCount !== null && exact < accounts.length) {
    const off = accounts.filter(a => !a.exactFit).map(a => `row ${a.row}`).join(', ');
    flags.push({
      code: 'C-05', title: 'Row budget mismatch', severity: 'warn',
      detail: `${accounts.length - exact} of ${accounts.length} rows (${off}) don\u2019t sum to the ` +
        `graded base count of ${gradedStitchCount} stitches. Max drift is ${maxDrift} stitch(es) ` +
        '— check selvedges, yarnovers, or the repeat count before publishing.',
    });
  }
  if (rows.length === 0) {
    flags.push({
      code: 'C-06', title: 'No chart rows authored', severity: 'info',
      detail: 'The chart desk is empty — author at least one row to run the lab.',
    });
  }
  if (gradedStitchCount === null || !Number.isFinite(gradedStitchCount) || gradedStitchCount <= 0) {
    flags.push({
      code: 'C-07', title: 'No graded count to check against', severity: 'info',
      detail: 'Give the lab the base-size stitch count (e.g. the graded bust row) so row ' +
        'budgets can be verified — the chart lives in the same project as the graded table.',
    });
  }

  const hasError = flags.some(f => f.severity === 'error');
  const hasWarn = flags.some(f => f.severity === 'warn');
  const hasIncomplete = flags.some(f => f.severity === 'info');
  // F-08: info flags (no rows authored, no usable graded count) mean the lab
  // has not actually validated anything — never surface a false "ready".
  const verdict: ChartLabResult['verdict'] = hasError ? 'blocked' : (hasWarn || hasIncomplete) ? 'review' : 'ready';
  const verdictReason = verdict === 'ready'
    ? `All ${accounts.length} row(s) balance against the graded count; repeat math is sound.`
    : verdict === 'blocked'
      ? `${accounts.length} row(s) analyzed; ${flags.filter(f => f.severity === 'error').length} ` +
        'error(s) must be fixed before the chart can be trusted.'
      : `${accounts.length} row(s) analyzed; review the flagged rows — max drift ${maxDrift} ` +
        `stitch(es) vs the graded count of ${gradedStitchCount}.`;

  return {
    rows: accounts,
    exactFitRows: exact,
    totalRows: accounts.length,
    maxDrift,
    gradedStitchCount,
    flags,
    proseRows: rows.map(r => ({ row: r.row, text: rowProse(r) })),
    verdict,
    verdictReason,
  };
}

export const DEFAULT_CHART_INPUT: { rows: ChartRowDef[]; gradedStitchCount: string } = {
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
};

/**
 * Validates Chart Lab inputs (selvedge, repeat count, graded count).
 * Note: individual symbol counts are currently driven by +/- buttons,
 * but the validator handles them if they were to become raw inputs.
 */
export function validateChartInputs(state: { rows: ChartRowDef[]; gradedStitchCount: string }): ValidationResult[] {
  const errors: ValidationResult[] = [];
  
  // 1. Graded count (optional, but must be positive if given)
  if (state.gradedStitchCount.trim() !== '') {
    errors.push(validateField({ type: 'positive', label: 'Graded count', required: false }, state.gradedStitchCount, 'gradedStitchCount'));
  }

  // 2. Per-row validation
  state.rows.forEach((r, i) => {
    const rowLabel = `Row ${r.row}`;
    
    // Repeat count must be strictly positive (min 1)
    errors.push(validateField({ type: 'count', min: 1, label: `${rowLabel} repeat count` }, r.repeatCount, `rows.${i}.repeatCount`));
    
    // Selvedges must be non-negative counts
    r.before.forEach((s, j) => {
      errors.push(validateField({ type: 'count', label: `${rowLabel} selvedge before` }, s.count, `rows.${i}.before.${j}.count`));
    });
    r.after.forEach((s, j) => {
      errors.push(validateField({ type: 'count', label: `${rowLabel} selvedge after` }, s.count, `rows.${i}.after.${j}.count`));
    });

    // Symbols inside repeat (non-negative counts)
    r.symbols.forEach((s, j) => {
      errors.push(validateField({ type: 'count', label: `${rowLabel} symbol count` }, s.count, `rows.${i}.symbols.${j}.count`));
    });
  });

  return errors.filter(e => !e.ok);
}
