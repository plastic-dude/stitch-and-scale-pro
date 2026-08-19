/**
 * CHK-055 — Show ROI Lab card (53rd workspace tab).
 *
 * Prices one in-person show decision in net $/hour against the 7x booth-fee rule
 * and against knitting the same hours at home for online sale.
 * Session-55 research — sources in lib/show-roi-lab.ts header.
 */
import { useMemo, useState, useEffect } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { getToastCopy } from '@/lib/toast-copy';
import { TrendingUp, Flag, Lightbulb, Banknote, Tent } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  SHOW_TIER_LABELS,
  PRODUCT_TYPE_LABELS,
  SHOW_ROI_DEFAULTS,
  analyzeShowRoi,
  type ShowRoiInput,
  type ShowTier,
  type ProductType,
} from '@/lib/show-roi-lab';
const STORAGE_KEY = 'stitch-and-scale-showroi-v1';
interface StoredShowLab {
  input: ShowRoiInput;
}
function defaultStored(): StoredShowLab {
  return { input: { ...SHOW_ROI_DEFAULTS, products: SHOW_ROI_DEFAULTS.products.map((p) => ({ ...p })) } };
}
function loadStored(handle: ProjectStorageHandle<StoredShowLab>): StoredShowLab {
  try {
    const raw = handle.read();
    if (raw) {
      const parsed = raw as StoredShowLab;
      if (parsed && parsed.input && typeof parsed.input.boothFee === 'number') {
        return {
          ...defaultStored(),
          ...parsed,
          input: {
            ...defaultStored().input,
            ...parsed.input,
            products: (parsed.input.products ?? []).length > 0
              ? parsed.input.products.map((p) => ({ ...defaultStored().input.products[0], ...p }))
              : defaultStored().input.products,
          },
        };
      }
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return defaultStored();
}
const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const fmtH = (n: number) =>
  n.toLocaleString('en-US', { maximumFractionDigits: 1 });
function NumField({ id, label, value, onChange, min = 0, max, step = 1, suffix, hint }: {
  id: string; label: string; value: number;
  onChange: (n: number) => void; min?: number; max?: number; step?: number; suffix?: string; hint?: string;
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
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
function ProductRowEditor({ product, index, onChange }: {
  product: ShowRoiInput['products'][number];
  index: number;
  onChange: (patch: ShowRoiInput['products'][number]) => void;
}) {
  return (
    <div className="border rounded-lg p-3 space-y-2 border-slate-300/60">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-medium text-sm">{PRODUCT_TYPE_LABELS[product.type]}</span>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">Units</span>
          <Input type="number" min={0} value={product.units}
            onChange={(e) => onChange({ ...product, units: Math.max(0, Number(e.target.value) || 0) })}
            className="h-7 w-16 text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumField id={`sh-knit-${product.type}`} label="Knit hrs/unit" value={product.knitHoursPerUnit}
          step={0.5} onChange={(n) => onChange({ ...product, knitHoursPerUnit: n })} />
        <NumField id={`sh-mat-${product.type}`} label="Materials" value={product.materialCostPerUnit}
          onChange={(n) => onChange({ ...product, materialCostPerUnit: n })} suffix="$" />
        <NumField id={`sh-price-${product.type}`} label="Show price" value={product.pricePerUnit}
          onChange={(n) => onChange({ ...product, pricePerUnit: n })} suffix="$" />
      </div>
    </div>
  );
}
export function ShowRoiLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredShowLab>('showroi', project.id, [STORAGE_KEY]), [project.id]);
  const { toast } = useToast();
  const { language } = useSettings();
  const tc = getToastCopy(language);

  const [stored, setStored] = useState<StoredShowLab>(() => loadStored(handle));
  useEffect(() => {
    handle.write(stored);
  }, [stored]);
  const patchInput = (patch: Partial<ShowRoiInput>) =>
    setStored((s) => ({ input: { ...s.input, ...patch } }));
  const patchProduct = (index: number, patch: ShowRoiInput['products'][number]) =>
    setStored((s) => {
      const products = [...s.input.products];
      products[index] = patch;
      return { input: { ...s.input, products } };
    });
  const result = useMemo(() => analyzeShowRoi(stored.input), [stored.input]);
  const i = stored.input;
  const pickTier = (tier: ShowTier) => {
    patchInput({ showTier: tier });
    toast({ title: tc.showTierNoted, description: tc.showTierNotedDescription(SHOW_TIER_LABELS[tier]), });
  };
  const bestRow = [...result.productRows].sort((a, b) => b.net - a.net)[0];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Tent className="w-4 h-4" />
          Show ROI Lab
        </CardTitle>
        <CardDescription className="text-xs">
          Is the booth fee worth the weekend? The 2026 craft-circles bar is 7x the fee in sales, and every hour on-site gets priced against your knit floor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* --- Show booking --- */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium"><TrendingUp className="w-4 h-4" />Show booking</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(SHOW_TIER_LABELS) as ShowTier[]).map((tier) => (
              <Badge key={tier} variant={i.showTier === tier ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => pickTier(tier)}>
                {SHOW_TIER_LABELS[tier]}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <NumField id="sh-attendance" label="Expected foot traffic" value={i.attendance}
              step={100} onChange={(n) => patchInput({ attendance: n })} hint="The event's advertised attendance" />
            <NumField id="sh-conversion" label="Conversion" value={i.conversionPct}
              step={0.001} max={1} onChange={(n) => patchInput({ conversionPct: n })} hint="1–3% browse markets, 3–8% high-intent" />
            <NumField id="sh-ticket" label="Average ticket" value={i.avgTicket}
              onChange={(n) => patchInput({ avgTicket: n })} suffix="$" hint="What a buyer spends" />
            <NumField id="sh-booth" label="Booth fee" value={i.boothFee}
              onChange={(n) => patchInput({ boothFee: n })} suffix="$" />
            <NumField id="sh-signups" label="List signups expected" value={i.listSignups}
              step={1} onChange={(n) => patchInput({ listSignups: n })} hint="Buyers live in email/DMs, not feed impressions" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField id="sh-appfee" label="Application fee" value={i.appFee}
              onChange={(n) => patchInput({ appFee: n })} suffix="$" hint="Non-refundable" />
            <NumField id="sh-travel" label="Travel & supplies" value={i.travelSupplies}
              onChange={(n) => patchInput({ travelSupplies: n })} suffix="$" />
            <NumField id="sh-power" label="Power / extras" value={i.powerExtras}
              onChange={(n) => patchInput({ powerExtras: n })} suffix="$" />
            <NumField id="sh-setup" label="Setup + teardown hrs" value={i.setupTeardownHours}
              step={0.5} onChange={(n) => patchInput({ setupTeardownHours: n })} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField id="sh-onsite" label="On-site hours" value={i.onsiteHours}
              step={0.5} onChange={(n) => patchInput({ onsiteHours: n })} hint="Full show days at the booth" />
            <NumField id="sh-cardfee" label="Card fee" value={i.cardFeePct}
              step={0.001} max={0.15} onChange={(n) => patchInput({ cardFeePct: n })} hint="Square 2.75%, Shopify 2.7%" />
            <NumField id="sh-tax" label="Effective tax" value={i.taxPct}
              step={0.001} max={0.15} onChange={(n) => patchInput({ taxPct: n })} hint="Share of gross going to sales tax" />
            <NumField id="sh-followup" label="Follow-up buy rate" value={i.followupBuyRate}
              step={0.01} max={1} onChange={(n) => patchInput({ followupBuyRate: n })} hint="Share of signups who buy online in 6 months (~12%)" />
          </div>
        </div>
        {/* --- What to bring --- */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium"><Banknote className="w-4 h-4" />What to bring</div>
          <div className="grid md:grid-cols-2 gap-3">
            {i.products.map((p, idx) => (
              <ProductRowEditor key={p.type} product={p} index={idx} onChange={(patch) => patchProduct(idx, patch)} />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumField id="sh-online" label="Online net / unit" value={i.onlineNetPerUnit}
              onChange={(n) => patchInput({ onlineNetPerUnit: n })} suffix="$" hint="Same item sold via your own channels" />
            <NumField id="sh-floor" label="Your hourly floor" value={i.hourlyFloor}
              onChange={(n) => patchInput({ hourlyFloor: n })} suffix="$" hint="What a knit hour must earn at home" />
          </div>
        </div>
        {/* --- Headline numbers --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border rounded-lg p-3 border-emerald-400/40">
            <div className="text-[11px] text-muted-foreground">Gross revenue</div>
            <div className="text-lg font-semibold">{fmt$(result.grossRevenue)}</div>
            <div className="text-[11px] text-muted-foreground">{result.unitsSoldTotal} of {i.products.reduce((s, p) => s + p.units, 0)} units sold</div>
          </div>
          <div className="border rounded-lg p-3 border-slate-300/60">
            <div className="text-[11px] text-muted-foreground">Show net (cash)</div>
            <div className="text-lg font-semibold">{fmt$(result.showNet)}</div>
            <div className="text-[11px] text-muted-foreground">After fees, materials, card &amp; tax</div>
          </div>
          <div className="border rounded-lg p-3 border-slate-300/60">
            <div className="text-[11px] text-muted-foreground">Net after your time</div>
            <div className="text-lg font-semibold">{fmt$(result.netAfterTime)}</div>
            <div className="text-[11px] text-muted-foreground">{fmt$(result.netPerHour)}/hr · {fmtH(result.totalHours)} hrs total</div>
          </div>
          <div className={`border rounded-lg p-3 ${result.clearsSevenX ? 'border-emerald-400/40' : 'border-amber-400/40'}`}>
            <div className="text-[11px] text-muted-foreground">7x fee bar</div>
            <div className="text-lg font-semibold">{result.clearsSevenX ? 'Cleared' : `Need ${fmt$(result.sevenXTarget)}`}</div>
            <div className="text-[11px] text-muted-foreground">{result.unitsForSevenX} units at the avg ticket</div>
          </div>
        </div>
        {/* --- Follow-up & home comparison --- */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border rounded-lg p-3 border-blue-400/40">
            <div className="text-[11px] text-muted-foreground">Follow-up list value (6 months)</div>
            <div className="text-lg font-semibold">{fmt$(result.followupValue)}</div>
            <div className="text-[11px] text-muted-foreground">Full net with follow-up: {fmt$(result.netWithFollowup)}</div>
          </div>
          <div className="border rounded-lg p-3 border-violet-400/40">
            <div className="text-[11px] text-muted-foreground">Knit the same hours at home</div>
            <div className="text-lg font-semibold">{fmt$(result.homeValueSameHours)}</div>
            <div className="text-[11px] text-muted-foreground">vs {fmt$(result.showNet)} show net — where the weekend goes</div>
          </div>
        </div>
        {/* --- Product breakdown --- */}
        <div className="space-y-1.5">
          <div className="text-sm font-medium">By product (what the traffic actually buys)</div>
          {result.productRows.map((row) => (
            <div key={row.type} className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md p-2 text-xs border ${row.type === bestRow.type ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-200'}`}>
              <span className="font-medium w-28">{row.label}</span>
              <span className="text-muted-foreground">{row.unitsSold}/{row.units} sold</span>
              <span>{fmt$(row.revenue)} gross</span>
              <span className="text-muted-foreground">−{fmt$(row.materials + row.cardFees)} costs</span>
              <span className="font-medium">{fmt$(row.net)} net</span>
              <span className="text-muted-foreground">{fmtH(row.knitHours)} knit hrs</span>
              {row.type === bestRow.type && <Badge className="text-[10px] border-emerald-500/40 bg-emerald-500/15 text-emerald-700">Top earner</Badge>}
            </div>
          ))}
        </div>
        {/* --- Flags --- */}
        {result.flags.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700"><Flag className="w-4 h-4" />Watch-outs</div>
            {result.flags.map((f) => (
              <div key={f.id} className="flex items-start gap-1.5 text-xs text-amber-700 leading-relaxed rounded-md bg-amber-500/10 p-2">
                <Flag className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span><b>{f.id}</b> — {f.detail}</span>
              </div>
            ))}
          </div>
        )}
        {/* --- Verdict --- */}
        <div className="border rounded-lg p-3 border-emerald-400/40 bg-emerald-500/5 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium"><Lightbulb className="w-4 h-4" />Verdict</div>
          <p className="text-sm leading-relaxed">{result.verdict}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{result.suggestion}</p>
        </div>
      </CardContent>
    </Card>
  );
}
