/**
 * Book It — PoD Book Builder & Evaluator.
 *
 * Bundles a designer's patterns into one print/ebook collection and runs it
 * through the real 2026 print-on-demand economics (KDP, Lulu direct/retail,
 * IngramSpark, direct storefront, self-fulfilled). Modeled per the cited
 * figures in src/lib/pod-book-planner.ts.
 *
 * Storage: project-scoped key `stitch-and-scale-podbook-{projectId}` (storage
 * seam convention — no cross-project bleed).
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, ClipboardCopy, Printer, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  analyzePodBook,
  POD_CHANNELS,
  POD_CHANNEL_LABELS,
  DEFAULT_COSTS,
  type PodChannelId,
  type PodBookResult,
} from '@/lib/pod-book-planner';

const STORAGE_KEY = (projectId: string) => `stitch-and-scale-podbook-${projectId}`;

function loadStored(projectId: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function saveStored(projectId: string, patch: Record<string, unknown>) {
  try {
    const existing = loadStored(projectId) ?? {};
    localStorage.setItem(STORAGE_KEY(projectId), JSON.stringify({ ...existing, ...patch }));
  } catch {
    // storage is best-effort; the model still works in-session.
  }
}

const num = (
  v: number,
  set: (n: number) => void,
  label: string,
  hint: string,
  min?: number,
  max?: number,
  step?: number
) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <Input
      type="number"
      min={min}
      max={max}
      step={step ?? 1}
      value={Number.isFinite(v) ? v : ''}
      onChange={e => set(Number(e.target.value) || 0)}
      aria-label={label}
    />
    <p className="text-[11px] text-muted-foreground">{hint}</p>
  </div>
);

export function PodBookCard({ project }: { project: PatternProject }) {
  const { toast } = useToast();
  const stored = React.useMemo(() => loadStored(project.id), [project.id]);
  const [listPrice, setListPrice] = React.useState<number>(stored?.listPrice ?? 24);
  const [pageCount, setPageCount] = React.useState<number>(stored?.pageCount ?? 120);
  const [colorPageCount, setColorPageCount] = React.useState<number>(stored?.colorPageCount ?? 40);
  const [copiesExpected, setCopiesExpected] = React.useState<number>(stored?.copiesExpected ?? 150);
  const [productionBudget, setProductionBudget] = React.useState<number>(stored?.productionBudget ?? 1000);
  const [marketingBudget, setMarketingBudget] = React.useState<number>(stored?.marketingBudget ?? 150);
  const [pdfBaselineNet, setPdfBaselineNet] = React.useState<number>(stored?.pdfBaselineNet ?? 900);
  const [primaryChannel, setPrimaryChannel] = React.useState<PodChannelId>(
    (stored?.primaryChannel as PodChannelId) ?? 'kdp'
  );
  const [checklist, setChecklist] = React.useState<boolean[]>(
    stored?.checklist instanceof Array && stored.checklist.length >= 6
      ? stored.checklist.slice(0, 6)
      : Array(6).fill(false)
  );

  React.useEffect(() => {
    saveStored(project.id, {
      listPrice,
      pageCount,
      colorPageCount,
      copiesExpected,
      productionBudget,
      marketingBudget,
      pdfBaselineNet,
      primaryChannel,
      checklist,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPrice, pageCount, colorPageCount, copiesExpected, productionBudget, marketingBudget, pdfBaselineNet, primaryChannel, checklist]);

  const result: PodBookResult = React.useMemo(
    () =>
      analyzePodBook({
        listPrice,
        pageCount,
        colorPageCount: Math.min(colorPageCount, pageCount),
        copiesExpected,
        productionBudget,
        marketingBudget,
        pdfBaselineNet,
        primaryChannel,
      }),
    [listPrice, pageCount, colorPageCount, copiesExpected, productionBudget, marketingBudget, pdfBaselineNet, primaryChannel]
  );

  const fmt$ = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const pitch = React.useMemo(() => {
    const r = result;
    const book = `${project.name || 'My collection'} — ${r.primary.channel === 'direct_self' ? 'self-fulfilled' : POD_CHANNEL_LABELS[r.primary.channel]} edition`;
    return [
      `THE BOOK: ${book}`,
      `${r.primary.printCost.toFixed(2)} print cost / copy at $${listPrice} list → ${fmt$(r.primary.netPerBook)} net per copy.`,
      `Break-even: ${r.primary.breakEvenCopies} copies (production + marketing = ${fmt$(productionBudget + marketingBudget)}).`,
      `At ${copiesExpected} copies the book nets ${fmt$(r.netTotal)} vs ${fmt$(pdfBaselineNet)} selling the same patterns as PDFs (${r.incrementalVsPdf >= 0 ? '+' : ''}${fmt$(r.incrementalVsPdf)} incremental).`,
      ...r.watchOuts.map(w => `WATCH-OUT: ${w}`),
      '',
      'PRE-FLIGHT CHECKLIST:',
      ...r.checklist.map(c => `- [${c.done ? 'x' : ' '}] ${c.item}`),
      '',
      r.verdictReason,
    ].join('\n');
  }, [result, project.name, listPrice, productionBudget, marketingBudget, copiesExpected, pdfBaselineNet]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pitch);
      toast({ title: 'Copied', description: 'Paste it into your launch plan, LYS pitch, or KAL thread.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Select the text manually.' });
    }
  };

  const toggleCheck = (i: number) =>
    setChecklist(prev => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Printer className="w-4 h-4" /> Book It — pattern collection planner
        </CardTitle>
        <CardDescription>
          Bundle your patterns into one print collection and price every channel honestly. Color pages cost 6x a B&W
          page on print-on-demand — this planner counts them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {num(listPrice, setListPrice, 'Book list price', '$15–35 is the pattern-book band', 5, 100, 0.01)}
          {num(pageCount, setPageCount, 'Total pages', 'B&W pages including front/back matter', 10, 600, 1)}
          {num(colorPageCount, setColorPageCount, 'Color pages', 'Charts + photography; the margin killer', 0, pageCount, 1)}
          {num(copiesExpected, setCopiesExpected, 'Expected launch-window copies', 'Be honest — this sets break-even', 0, 50000, 1)}
          {num(productionBudget, setProductionBudget, 'Production budget', 'Tech edit ≈$100/pattern, photos, layout, cover', 0, 50000, 10)}
          {num(marketingBudget, setMarketingBudget, 'Marketing spend', 'Ads, review copies, launch-team swag', 0, 50000, 10)}
          {num(pdfBaselineNet, setPdfBaselineNet, 'PDF baseline net', 'Same patterns sold solo, net of fees', 0, 100000, 10)}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Primary channel</Label>
            <select
              value={primaryChannel}
              onChange={e => setPrimaryChannel(e.target.value as PodChannelId)}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
              aria-label="Primary channel"
            >
              {(Object.keys(POD_CHANNELS) as PodChannelId[]).map(c => (
                <option key={c} value={c}>
                  {POD_CHANNEL_LABELS[c]}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">{POD_CHANNELS[primaryChannel].trafficNote}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left p-2 font-medium">Channel</th>
                <th className="text-right p-2 font-medium">Net / copy</th>
                <th className="text-right p-2 font-medium">Break-even</th>
                <th className="text-right p-2 font-medium">Payout</th>
                <th className="text-right p-2 font-medium">Clears?</th>
              </tr>
            </thead>
            <tbody>
              {result.allChannels.map(r => (
                <tr key={r.channel} className={'border-b border-border/50 ' + (r.channel === primaryChannel ? 'bg-accent/40' : '')}>
                  <td className="p-2 font-medium">{POD_CHANNEL_LABELS[r.channel]}</td>
                  <td className={'p-2 text-right ' + (r.netPerBook <= 0 ? 'text-destructive' : 'text-accent')}>{fmt$(r.netPerBook)}</td>
                  <td className="p-2 text-right">{r.breakEvenCopies.toLocaleString()}</td>
                  <td className="p-2 text-right">
                    {r.channel === 'direct_self' ? 'on delivery' : `~${POD_CHANNELS[r.channel].payoutDays}d`}
                  </td>
                  <td className="p-2 text-right">
                    {r.netPerBook <= 0 ? (
                      <Badge variant="secondary" className="uppercase">
                        dead
                      </Badge>
                    ) : r.clearsBreakEven ? (
                      <Badge className="bg-accent text-accent-foreground uppercase">yes</Badge>
                    ) : (
                      <Badge variant="secondary" className="uppercase">
                        no
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Net book total (after all spend)</p>
            <p className={'text-lg font-semibold ' + (result.netTotal < 0 ? 'text-destructive' : 'text-accent')}>{fmt$(result.netTotal)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Incremental vs selling PDFs solo</p>
            <p className={'text-lg font-semibold ' + (result.incrementalVsPdf >= 0 ? 'text-accent' : 'text-destructive')}>
              {result.incrementalVsPdf >= 0 ? '+' : ''}{fmt$(result.incrementalVsPdf)}
            </p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Verdict</p>
            <Badge className={'uppercase mt-1 ' + (result.verdict === 'great' || result.verdict === 'good' ? 'bg-accent text-accent-foreground' : '')}>
              {result.verdict}
            </Badge>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Print cost / copy</p>
            <p className="text-lg font-semibold">{fmt$(result.primary.printCost)}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border p-3 space-y-1">
          <p className="text-sm text-muted-foreground">{result.verdictReason}</p>
          {result.watchOuts.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.watchOuts.map((w, i) => (
                <li key={i} className="text-xs flex gap-1.5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {w}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Production pre-flight checklist
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {result.checklist.map((c, i) => (
              <label key={i} className="flex items-start gap-2 text-xs rounded-md border border-border/60 p-2 cursor-pointer hover:border-primary/40">
                <Checkbox
                  checked={checklist[i] ?? false}
                  onCheckedChange={() => toggleCheck(i)}
                  aria-label={c.item}
                />
                <span className="text-muted-foreground">{c.item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium">Launch-ready summary (copies anywhere)</p>
          <pre className="text-xs whitespace-pre-wrap rounded-lg bg-secondary/30 p-3 border border-border max-h-72 overflow-y-auto">
            {pitch}
          </pre>
          <Button variant="outline" size="sm" onClick={copy}>
            <ClipboardCopy className="w-3.5 h-3.5 mr-1" /> Copy summary
          </Button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CheckCircle2 className="w-3 h-3" />
          Modeled on cited 2026 PoD economics: KDP 60% − print ($3.40 for 200pp B&W, ~60d payout), Lulu direct 80%
          (200pp B&W ≈ $10.00 print), IngramSpark 70%, direct storefronts ~100% minus print with zero discovery.
        </div>
      </CardContent>
    </Card>
  );
}
