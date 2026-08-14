import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Flag, Handshake, Layers, Lightbulb, Package } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeYarnLicensing,
  DEFAULT_YARN_LICENSING,
  fmt$,
  type LicenseScope,
  type ReachTier,
  type YarnLicensingInput,
} from '@/lib/yarn-licensing-lab';

const STORAGE_KEY = 'stitch-and-scale-yarn-license-v1';

type StoredState = YarnLicensingInput & { ts?: number };

function defaultStored(): StoredState {
  return { ...DEFAULT_YARN_LICENSING };
}

function loadStored(handle: ReturnType<typeof projectStorage<StoredState>>): StoredState {
  const parsed = handle.read();
  if (parsed) {
    return { ...defaultStored(), ...parsed, ts: undefined };
  }
  return defaultStored();
}

function NumField({ id, label, value, onChange, min = 0, max, step = 1, suffix }: {
  id: string; label: string; value: number;
  onChange: (n: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="relative">
        <Input id={id} type="number" min={min} {...(max !== undefined ? { max } : {})} step={step}
          value={value}
          onChange={e => {
            const n = parseFloat(e.target.value);
            if (Number.isFinite(n)) onChange(n);
          }}
          className="text-sm pr-8" />
        {suffix ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}

function StatBox({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'warn' | 'bad' }) {
  const toneCls =
    tone === 'good' ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30' :
    tone === 'warn' ? 'text-amber-700 bg-amber-500/10 border-amber-500/30' :
    tone === 'bad' ? 'text-destructive bg-destructive/10 border-destructive/30' :
    'text-foreground bg-accent/50 border-border';
  return (
    <div className={`rounded-md border p-3 ${toneCls}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

const scopeOptions: { value: LicenseScope; label: string }[] = [
  { value: 'single-pattern', label: 'Single pattern' },
  { value: 'collection', label: 'Collection' },
  { value: 'full-catalog', label: 'Full catalog' },
];

const reachOptions: { value: ReachTier; label: string }[] = [
  { value: 1, label: 'Tier 1 — micro indie' },
  { value: 2, label: 'Tier 2 — small indie' },
  { value: 3, label: 'Tier 3 — established indie' },
  { value: 4, label: 'Tier 4 — large brand' },
  { value: 5, label: 'Tier 5 — major brand' },
];

const verdictColor = (v: string) =>
  v.startsWith('Take it') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.startsWith('Flat + royalty hybrid') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.startsWith('Take the flat') ? 'bg-sky-500/15 text-sky-700 border-sky-500/30' :
  v.startsWith('Negotiate') ? 'bg-violet-500/15 text-violet-700 border-violet-500/30' :
  v.startsWith('Skip') ? 'bg-destructive/10 text-destructive border-destructive/30' :
  'bg-accent/50 text-muted-foreground border-border';

export function YarnLicensingLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('yarn-licensing', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<YarnLicensingInput>(() => loadStored(handle));

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: YarnLicensingInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzeYarnLicensing(input), [input]);
  const set = <K extends keyof YarnLicensingInput>(k: K, v: YarnLicensingInput[K]) => persist({ ...input, [k]: v });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Handshake className="size-4" />Yarn Licensing Lab</CardTitle>
        <CardDescription>A yarn company is offering you $350 for a pattern or a royalty on their kits — is it a good deal? This lab prices the offer against your own shop's long tail, verified against real industry terms: Farm &amp; Fiber Knits pays $200–400 for accessories and $400–750 for garments with a 1-year exclusive; Knit Picks keeps 15% on its IDP program; Interweave Knits flats run $200–600 with 20–40% royalties after exclusivity; Malabrigo still issues unpaid "exposure" calls; and full buyouts are the trend designers refuse. Everything the brand gives — cash, royalty stream (risk-haircut by brand size), free yarn, paid tech edit and photography — is weighed against your time, the exclusivity drag, and your self-publish baseline.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Handshake className="size-4" />The offer</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="yl-brand" className="text-xs">Brand</Label>
              <Input id="yl-brand" value={input.brandName} onChange={e => set('brandName', e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="yl-scope" className="text-xs">Scope</Label>
              <select
                id="yl-scope"
                value={input.scope}
                onChange={e => set('scope', e.target.value as LicenseScope)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                {scopeOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="yl-reach" className="text-xs">Brand reach tier</Label>
              <select
                id="yl-reach"
                value={input.brandReach}
                onChange={e => set('brandReach', Number(e.target.value) as ReachTier)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                {reachOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <NumField id="yl-flat" label="Flat fee (0 = none)" value={input.flatFee} onChange={n => set('flatFee', Math.max(0, n))} suffix="$" />
            <NumField id="yl-royalty" label="Royalty %" value={input.royaltyPct} onChange={n => set('royaltyPct', Math.max(0, Math.min(100, n)))} step={0.5} suffix="%" />
            <NumField id="yl-units" label="Brand sales / month" value={input.expectedUnitsPerMonth} onChange={n => set('expectedUnitsPerMonth', Math.max(0, n))} min={0} suffix="units/mo" />
            <NumField id="yl-price" label="Brand unit price" value={input.unitPrice} onChange={n => set('unitPrice', Math.max(0, n))} step={0.5} suffix="$" />
            <NumField id="yl-term" label="Term (0 = perpetual)" value={input.termMonths} onChange={n => set('termMonths', Math.max(0, n))} min={0} suffix="mo" />
            <NumField id="yl-excl" label="Exclusivity months" value={input.exclusivityMonths} onChange={n => set('exclusivityMonths', Math.max(0, Math.min(n, input.termMonths || 120)))} min={0} suffix="mo" />
            <NumField id="yl-yarn" label="Free yarn / goods value" value={input.yarnGoodsValue} onChange={n => set('yarnGoodsValue', Math.max(0, n))} suffix="$" />
            <NumField id="yl-services" label="Brand-paid services (tech edit, photo, layout)" value={input.brandPaidServices} onChange={n => set('brandPaidServices', Math.max(0, n))} suffix="$" />
            <div className="flex flex-col justify-end gap-3 pb-1">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={input.attribution} onChange={e => set('attribution', e.target.checked)} />
                Designer credited by name
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={input.copyrightTransfer} onChange={e => set('copyrightTransfer', e.target.checked)} />
                Copyright transfer / buyout
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Layers className="size-4" />Your costs &amp; baseline</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="yl-hours" label="Your design + sample hours" value={input.designHours} onChange={n => set('designHours', Math.max(1, n))} min={1} step={0.5} suffix="hrs" />
            <NumField id="yl-rate" label="Your hourly rate" value={input.hourlyRate} onChange={n => set('hourlyRate', Math.max(1, n))} min={1} suffix="$/hr" />
            <NumField id="yl-baseline" label="Self-publish baseline / month (from this design)" value={input.ownMonthlyRevenue} onChange={n => set('ownMonthlyRevenue', Math.max(0, n))} min={0} suffix="$" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Package className="size-4" />What the deal is actually worth</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label="Flat fee received" value={fmt$(result.flatEV)} tone={result.flatEV > 0 ? 'good' : 'bad'} />
            <StatBox label="Royalty stream (term total)" value={fmt$(result.royaltyEV)} tone={result.royaltyEV > 0 ? 'good' : 'default'} />
            <StatBox label="Royalty after risk haircut" value={`${fmt$(result.royaltyEVRiskAdjusted)} (${(result.reachDiscount * 100).toFixed(0)}% risk cut)`} tone={result.royaltyEVRiskAdjusted > result.flatEV ? 'good' : 'warn'} />
            <StatBox label="Yarn goods + paid services" value={fmt$(result.yarnGoodsEV + result.servicesEV)} tone={result.yarnGoodsEV + result.servicesEV > 0 ? 'good' : 'default'} />
            <StatBox label="Total offer value" value={fmt$(result.totalOfferEV)} tone="default" />
            <StatBox label="Your time cost" value={fmt$(result.yourTimeCost)} tone="warn" />
            <StatBox label="Exclusivity drag (own shop)" value={fmt$(result.exclusivityDrag)} tone={result.exclusivityDrag > 0 ? 'bad' : 'default'} />
            <StatBox label="Net vs your time + drag" value={fmt$(result.netEV)} tone={result.netEV > 0 ? 'good' : 'bad'} />
            <StatBox label="Your own-shop baseline (same window)" value={fmt$(result.baselineEV)} tone={result.totalOfferEV >= result.baselineEV ? 'good' : 'warn'} />
            <StatBox label="Offer in years of your baseline" value={result.yearsOfBaselineEarnings.toFixed(2) + ' yrs'} tone={result.yearsOfBaselineEarnings >= 1 ? 'good' : 'warn'} />
            <StatBox label="Min flat to say yes" value={fmt$(Math.max(result.minFlatToJustify, 0))} tone="default" />
            <StatBox label="Min royalty to say yes" value={`${result.minRoyaltyPct.toFixed(1)}%`} tone="default" />
          </div>
          {result.netEV < 0 && (
            <p className="text-xs text-muted-foreground">A negative net means the brand is asking you to subsidize their product — the same design earns more sitting in your own shop over the same window.</p>
          )}
          <p className="text-xs text-muted-foreground leading-4">Verified anchors: Farm &amp; Fiber $200–400 accessories / $400–750 garments, 1-year exclusive; Interweave flats $200–600 with 20–40% royalties after exclusivity, rights revert at 10–12 months; Knit Picks IDP takes 15% of your sale price; kit royalties run 5–15% of kit price; full-category exclusivity ≈ 2× the non-exclusive fee; missed royalty payments from real publishers (F+W, late 2018) are why the risk haircut exists — Ravelry's own 2019 data shows most pattern sellers earn under $50/month, so the long tail you're giving away is rarely worth a low fee.</p>
        </section>

        {result.flags.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Flag className="size-4" />Watch-outs</h3>
            <div className="flex flex-wrap gap-2">
              {result.flags.map(f => (
                <Badge key={f.code} variant="outline" className={`gap-1.5 py-1.5 ${f.severity === 'high' ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'border-amber-500/40 bg-amber-500/10 text-amber-700'}`}>
                  <AlertTriangle className="size-3" />
                  <span className="font-medium">{f.code}</span> — {f.title}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <section className={`rounded-md border p-4 ${verdictColor(result.verdict)}`}>
          <div className="flex items-center gap-2 font-semibold"><Lightbulb className="size-4" />{result.verdict}</div>
          <p className="mt-1.5 text-sm">{result.verdictNote}</p>
        </section>
      </CardContent>
    </Card>
  );
}
