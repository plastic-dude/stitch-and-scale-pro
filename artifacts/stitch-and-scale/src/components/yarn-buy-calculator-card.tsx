import { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
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
    toast({ title: `Loaded ${y.name} — verify the yardage against your ball band.`, duration: 3500 });
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
            <Label className="text-xs">Quick-load a market-standard yarn (edit the numbers to match your ball band)</Label>
            <Select onValueChange={(v) => chooseYarn(parseInt(v, 10))}>
              <SelectTrigger className="w-72"><SelectValue placeholder="Pick a yarn..." /></SelectTrigger>
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
              <Label className="text-xs">Yarn weight</Label>
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
              <Label className="text-xs">Yardage per skein (ball band)</Label>
              <Input type="number" min={1} value={stored.skeinYardage}
                placeholder="e.g. 220"
                onChange={(e) => patch({ skeinYardage: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Price per skein</Label>
              <Input type="number" min={0} step={0.01} value={stored.skeinPrice}
                placeholder="e.g. 14.99"
                onChange={(e) => patch({ skeinPrice: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stash of this yarn (grams)</Label>
              <Input type="number" min={0} value={stored.stashGrams}
                placeholder="0"
                onChange={(e) => patch({ stashGrams: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Grams per skein</Label>
              <Input type="number" min={1} value={stored.skeinGrams}
                placeholder="100"
                onChange={(e) => patch({ skeinGrams: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={stored.swatchConfirmed} onCheckedChange={(c) => patch({ swatchConfirmed: c })} />
            <Label className="text-xs">Swatch confirmed before buying</Label>
            <span className="text-xs text-muted-foreground">
              — a confirmed swatch holds the buffer at the documented 10% floor.
            </span>
          </div>
        </div>

        {/* Result */}
        {plan.invalid ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <span>Enter the yardage and price from your yarn's ball band to price the buy list — yardage per skein is the only number that matters here.</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground">Base yardage ({project.baseSize} base size)</div>
                <div className="text-2xl font-bold">{Math.round(plan.baseYards).toLocaleString()} yd</div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Target with risk buffer ({fmtPct(plan.bufferPct)})
                </div>
                <div className="text-2xl font-bold">{Math.round(plan.targetYards).toLocaleString()} yd</div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Package className="h-3 w-3" /> Skeins to buy, one dye lot
                </div>
                <div className="text-2xl font-bold">{plan.skeinsToBuy}</div>
                {plan.stashSkeins > 0 && (
                  <div className="text-xs text-emerald-700 mt-1">−{plan.stashSkeins} covered by stash ({plan.stashSkeinsExact} skein eq.)</div>
                )}
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CircleDollarSign className="h-3 w-3" /> Buy-list cost
                </div>
                <div className="text-2xl font-bold">{fmt$(plan.totalCost)}</div>
                {plan.costPerSizeLow !== null && plan.costPerSizeHigh !== null && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {fmt$(plan.costPerSizeLow)}–{fmt$(plan.costPerSizeHigh)} across grades
                  </div>
                )}
              </div>
            </div>

            {/* Buffer transparency */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="font-semibold text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-600" /> Risk buffer — why {fmtPct(plan.bufferPct)}%
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
                  <strong>Buy one extra skein of this same dye lot as insurance.</strong> Standard pro
                  practice: a same-lot spare keeps the project repairable and re-sellable. Unopened
                  lots hold resale value on Ravelry and Etsy yarn groups.
                </span>
              </div>
            )}
            {plan.stashShortfallYards > 0 && plan.stashSkeins > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Your stash covers {plan.stashSkeins} skein{plan.stashSkeins === 1 ? '' : 's'}; the remaining{" "}
                  {plan.stashShortfallYards.toLocaleString()} yd still need a same-dye-lot purchase —
                  buy the shortfall in one go, not piecemeal.
                </span>
              </div>
            )}

            <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
              <p className="mb-1">
                <strong className="text-foreground">Buy list:</strong> {plan.skeinsToBuy} skein{plan.skeinsToBuy === 1 ? '' : 's'} ×{" "}
                {stored.skeinYardage || '?'} yd ({stored.weight}) = {Math.round(plan.targetYards).toLocaleString()} yd target, {fmt$(plan.totalCost)} total.
              </p>
              <p>
                Base-size estimate ({Math.round(plan.baseYards).toLocaleString()} yd) is graded for {project.baseSize};
                {plan.costPerSizeLow !== null && plan.costPerSizeHigh !== null
                  ? ` larger sizes run up to ${fmt$(plan.costPerSizeHigh)}.`
                  : ' confirm against the size you will actually release.'}{" "}
                Always confirm yardage against your own swatch — the ball band is truth, the model is a plan.
              </p>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          Sources: the 10–15% buffer rule is published buying guidance (Mary Maxim, 2026);
          dye lots cannot be re-ordered once depleted (Lion Brand support); stash offsets round
          down to whole skeins because a partial skein still requires a full same-lot purchase.
        </p>
      </CardContent>
    </Card>
  );
}
