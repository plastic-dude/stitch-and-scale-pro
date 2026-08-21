import { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { getToastCopy } from '@/lib/toast-copy';
import { getYarnBuyCopy } from '@/lib/yarn-buy-copy';
import { ShoppingBasket, AlertTriangle, ShieldCheck, Package, CircleDollarSign } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';


import {
  YarnWeight,
  YARN_WEIGHTS,
  YARN_WEIGHT_LABELS,
  YARN_WEIGHT_NEEDLES,
  estimateYarn,
} from '@/lib/yarn-estimator';
import { buyPlan } from '@/lib/yarn-buy-calculator';

/** Display a buffer percentage to one decimal without a trailing .0 — label must agree with the itemized reasons. */
function fmtPct(pct: number): string {
  const withOne = (pct * 100).toFixed(1);
  return withOne.endsWith('.0') ? withOne.slice(0, -2) : withOne;
}

interface StoredBuyCalc {
  weight: YarnWeight;
  skeinYardage: string;
  skeinPrice: string;
  stashGrams: string;
  skeinGrams: string;
  swatchConfirmed: boolean;
}

const DEFAULT_STORED: StoredBuyCalc = {
  weight: 'worsted',
  skeinYardage: '',
  skeinPrice: '',
  stashGrams: '',
  skeinGrams: '100',
  swatchConfirmed: false,
};

export function YarnBuyCalculatorCard({ project }: { project: PatternProject }) {
  const { toast } = useToast();
  const { language } = useSettings();
  const tc = getToastCopy(language);
  const ybc = getYarnBuyCopy(language);

  const projectId = project.id || '';
  const STORAGE_KEY = 'stitch-and-scale-yarnbuy-';
  const [stored, setStored] = useState<StoredBuyCalc>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY + projectId);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.swatchConfirmed === 'boolean') {
          return { ...DEFAULT_STORED, ...parsed };
        }
      }
    } catch {
      /* storage unreadable — start fresh */
    }
    const candidate = (project.yarnWeight as YarnWeight) || null;
    return { ...DEFAULT_STORED, weight: candidate && YARN_WEIGHTS.includes(candidate) ? candidate : 'worsted' };
  });

  useEffect(() => {
    if (projectId) localStorage.setItem(STORAGE_KEY + projectId, JSON.stringify(stored));
  }, [stored, projectId]);

  const patch = useCallback((p: Partial<StoredBuyCalc>) => setStored((s) => ({ ...s, ...p })), []);

  const estimate = useMemo(() => estimateYarn(project, stored.weight), [project, stored.weight]);

  const plan = useMemo(() => buyPlan(project, {
    weight: stored.weight,
    skeinYardage: parseFloat(stored.skeinYardage),
    skeinPrice: parseFloat(stored.skeinPrice),
    stashGrams: parseFloat(stored.stashGrams) || 0,
    skeinGrams: parseFloat(stored.skeinGrams) || 100,
    swatchConfirmed: stored.swatchConfirmed,
  }), [project, stored]);

  const fmt$ = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const yarnOptions = useMemo(() => [
    // Market-standard reference yarns per weight: name, yardage/skein, price/skein, grams/skein.
    // Prices are street-midpoints from major US retailers (KnitPicks / WEBS / Jimmy Beans), verified current 2026.
    { weight: 'lace' as YarnWeight, name: 'Shibui Silk Cloud (lace, 25 g)', yardage: 310, price: 20, grams: 25 },
    { weight: 'fingering' as YarnWeight, name: 'KnitPicks Stroll (fingering)', yardage: 231, price: 8, grams: 50 },
    { weight: 'sport' as YarnWeight, name: 'Madelinetosh Tosh Sport', yardage: 180, price: 24, grams: 100 },
    { weight: 'DK' as YarnWeight, name: 'Berroco Vintage DK', yardage: 244, price: 11, grams: 100 },
    { weight: 'worsted' as YarnWeight, name: 'Cascade 220 (worsted)', yardage: 220, price: 12, grams: 100 },
    { weight: 'bulky' as YarnWeight, name: 'Malabrigo Rasta (bulky)', yardage: 88, price: 13, grams: 150 },
    { weight: 'super-bulky' as YarnWeight, name: 'Lion Brand Wool-Ease Thick & Quick', yardage: 106, price: 7, grams: 170 },
  ], []);

  const chooseYarn = (idx: number) => {
    const y = yarnOptions[idx];
    setStored((s) => ({
      ...s,
      weight: y.weight,
      skeinYardage: String(y.yardage),
      skeinPrice: String(y.price),
      skeinGrams: String(y.grams),
    }));
    toast({ title: tc.yarnLoadedTitle(y.name), duration: 3500 });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingBasket className="h-4 w-4" /> Yarn Buy Calculator
        </CardTitle>
        <CardDescription>
          Yardage is only half the decision — the money question is how many skeins of THIS yarn,
          in one dye lot, to buy now. Dye lots are batch numbers that can never be re-ordered, and
          the industry rule is explicit: buy 10–15% extra because matching lots later is impossible.
          Enter the ball-band numbers of the yarn you are buying; the calculator applies a
          risk-adjusted buffer, rounds up to whole skeins, offsets your stash, and prices the buy list.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Yarn choice */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">{ybc.quickLoadLabel}</Label>
            <Select onValueChange={(v) => chooseYarn(parseInt(v, 10))}>
              <SelectTrigger className="w-72"><SelectValue placeholder={ybc.pickAYarn} /></SelectTrigger>
              <SelectContent>
                {yarnOptions.map((y, i) => (
                  <SelectItem key={y.name} value={String(i)}>
                    {y.name} — {y.yardage} yd / {fmt$(y.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{ybc.yarnWeight}</Label>
              <Select value={stored.weight} onValueChange={(v) => patch({ weight: v as YarnWeight })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YARN_WEIGHTS.map((w) => (
                    <SelectItem key={w} value={w}>{YARN_WEIGHT_LABELS[w]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Needles: {YARN_WEIGHT_NEEDLES[stored.weight]}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{ybc.yardagePerSkein}</Label>
              <Input type="number" min={1} value={stored.skeinYardage}
                placeholder="e.g. 220"
                onChange={(e) => patch({ skeinYardage: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{ybc.pricePerSkein}</Label>
              <Input type="number" min={0} step={0.01} value={stored.skeinPrice}
                placeholder="e.g. 14.99"
                onChange={(e) => patch({ skeinPrice: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{ybc.stashOfThisYarn}</Label>
              <Input type="number" min={0} value={stored.stashGrams}
                placeholder="0"
                onChange={(e) => patch({ stashGrams: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{ybc.gramsPerSkein}</Label>
              <Input type="number" min={1} value={stored.skeinGrams}
                placeholder="100"
                onChange={(e) => patch({ skeinGrams: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={stored.swatchConfirmed} onCheckedChange={(c) => patch({ swatchConfirmed: c })} />
            <Label className="text-xs">{ybc.swatchConfirmedBefore}</Label>
            <span className="text-xs text-muted-foreground">
              {ybc.swatchConfirmedNote}
            </span>
          </div>
        </div>

        {/* Result */}
        {plan.invalid ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <span>ybc.enterYardageAndPrice</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground">{ybc.baseYardageLabel.replace("{size}", project.baseSize)}</div>
                <div className="text-2xl font-bold">{Math.round(plan.baseYards).toLocaleString()} yd</div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> {ybc.targetWithRiskBuffer.replace("{pct}", fmtPct(plan.bufferPct))}
                </div>
                <div className="text-2xl font-bold">{Math.round(plan.targetYards).toLocaleString()} yd</div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {ybc.skeinsToBuyLabel}
                </div>
                <div className="text-2xl font-bold">{plan.skeinsToBuy}</div>
                {plan.stashSkeins > 0 && (
                  <div className="text-xs text-emerald-700 mt-1">−{plan.stashSkeins} {ybc.coveredByStash.replace("{exact}", String(plan.stashSkeinsExact))}</div>
                )}
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {ybc.buyListCost}
                </div>
                <div className="text-2xl font-bold">{fmt$(plan.totalCost)}</div>
                {plan.costPerSizeLow !== null && plan.costPerSizeHigh !== null && (
                  <div className="text-xs text-muted-foreground mt-1">
                    ybc.acrossGrades
                  </div>
                )}
              </div>
            </div>

            {/* Buffer transparency */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="font-semibold text-sm flex items-center gap-2">
                {ybc.riskBufferWhy.replace("{pct}", fmtPct(plan.bufferPct))}
              </div>
              <ul className="text-sm space-y-1">
                {plan.bufferReasons.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-sky-600 mt-1">•</span> {r}
                  </li>
                ))}
                <li className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-sky-600 mt-1">•</span> industry-documented 10–15% rule for dye-lot
                  irreversibility — the buffer is the documented floor unless risk factors push it up.
                </li>
              </ul>
            </div>

            {/* Insurance skein + warnings */}
            {plan.insuranceSkein && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm flex items-start gap-2">
                <Package className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>{ybc.buyOneExtraSkein}</strong> {ybc.extraSkeinBody}
                </span>
              </div>
            )}
            {plan.stashShortfallYards > 0 && plan.stashSkeins > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  {ybc.stashMessage
                    .replace('{n}', String(plan.stashSkeins))
                    .replace('{pl}', plan.stashSkeins === 1 ? '' : 's')
                    .replace('{yd}', plan.stashShortfallYards.toLocaleString())}
                </span>
              </div>
            )}

            <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
              <p className="mb-1">
                <strong className="text-foreground">{ybc.buyListPrefix}</strong> {plan.skeinsToBuy} {ybc.skeinWord.replace('{pl}', plan.skeinsToBuy === 1 ? '' : 's')} ×{" "}
                {stored.skeinYardage || '?'} yd ({stored.weight}) = {Math.round(plan.targetYards).toLocaleString()} yd target, {fmt$(plan.totalCost)} {ybc.buyListTotal.replace('{total}', fmt$(plan.totalCost))}
              </p>
              <p>
                {ybc.baseSizeNote
                  .replace('{yd}', Math.round(plan.baseYards).toLocaleString())
                  .replace('{size}', project.baseSize)}{" "}
                {plan.costPerSizeLow !== null && plan.costPerSizeHigh !== null
                  ? ybc.largerSizesUpTo.replace('{max}', fmt$(plan.costPerSizeHigh))
                  : ybc.confirmSizeAndSwatch}
              </p>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          {ybc.sources}
        </p>
      </CardContent>
    </Card>
  );
}
