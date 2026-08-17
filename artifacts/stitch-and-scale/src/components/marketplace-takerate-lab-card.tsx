import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Flag, Store, Lightbulb } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { MARKETPLACE_TAKERATE_COPY } from '@/lib/marketplace-takerate-copy';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeTakeRate,
  DEFAULT_TAKE_RATE,
  fmt$,
  CHANNEL_LABELS,
  type ChannelId,
  type MarketplaceTakeRateInput,
} from '@/lib/marketplace-takerate-lab';

const STORAGE_KEY = 'stitch-and-scale-takerate-v1';

type StoredState = MarketplaceTakeRateInput & { ts?: number };

function defaultStored(): StoredState {
  return { ...DEFAULT_TAKE_RATE };
}

function loadStored(handle: ReturnType<typeof projectStorage<StoredState>>): StoredState {
  const parsed = handle.read();
  if (parsed) {
    const merged = { ...defaultStored(), ...parsed, ts: undefined };
    // Normalize stored drift: two-decimal prices, one-decimal percentages/shares.
    merged.channels = merged.channels.map(c => ({
      ...c,
      price: c.price !== undefined ? Math.round(c.price * 100) / 100 : c.price,
      offsiteAdsShare: c.offsiteAdsShare !== undefined ? Math.round(c.offsiteAdsShare * 100) / 100 : c.offsiteAdsShare,
    }));
    merged.ravelryPayPalPct = Math.round(merged.ravelryPayPalPct * 1000) / 1000;
    merged.ravelryPayPalFixed = Math.round(merged.ravelryPayPalFixed * 100) / 100;
    return merged;
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
          className="text-sm pr-11" />
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

const verdictColor = (v: string) =>
  v.startsWith('No sales modeled') ? 'bg-accent/50 text-muted-foreground border-border' :
  v.startsWith('Move revenue from the leak') ? 'bg-sky-500/15 text-sky-700 border-sky-500/30' :
  v.startsWith('Too dependent') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  v.startsWith('Balanced portfolio') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.startsWith('Trim the middle') ? 'bg-violet-500/15 text-violet-700 border-violet-500/30' :
  'bg-accent/50 text-muted-foreground border-border';

const ORDER: ChannelId[] = ['etsy', 'ravelry', 'lovecrafts', 'ribblr', 'payhip', 'own-site'];

export function MarketplaceTakeRateLabCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copyText = MARKETPLACE_TAKERATE_COPY[language];
  const channelLabels: Record<ChannelId, string> = {
    etsy: copyText.channels.etsy, ravelry: copyText.channels.ravelry, lovecrafts: copyText.channels.lovecrafts,
    ribblr: copyText.channels.ribblr, payhip: copyText.channels.payhip, 'own-site': copyText.channels.ownSite,
  };
  const handle = useMemo(() => projectStorage<StoredState>('marketplace-takerate', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<MarketplaceTakeRateInput>(() => loadStored(handle));

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: MarketplaceTakeRateInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzeTakeRate(input), [input]);

  const setChannel = <K extends keyof NonNullable<MarketplaceTakeRateInput['channels'][number]>>(
    id: ChannelId, k: K, v: NonNullable<MarketplaceTakeRateInput['channels'][number]>[K],
  ) => persist({
    ...input,
    channels: input.channels.map(c => (c.id === id ? { ...c, [k]: v } : c)),
  });

  const setRoot = <K extends keyof MarketplaceTakeRateInput>(k: K, v: MarketplaceTakeRateInput[K]) =>
    persist({ ...input, [k]: v });

    const annualByChannel = new Map(result.annualNetByChannel.map(a => [a.channel, a]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Store className="size-4" />{copyText.title}</CardTitle>
        <CardDescription>{copyText.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Store className="size-4" />{copyText.monthlyUnits}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {ORDER.map(id => {
              const ch = input.channels.find(c => c.id === id) ?? input.channels[0];
              const breakdown = result.channels.find(b => b.channel === id);
              return (
                <div key={id} className="rounded-md border border-border/70 bg-accent/30 p-3 space-y-2.5">
                  <div className="text-xs font-semibold text-muted-foreground">{channelLabels[id]}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <NumField id={`tr-units-${id}`} label={copyText.unitsMonth} value={ch?.unitsPerMonth ?? 0} onChange={n => setChannel(id, 'unitsPerMonth', Math.max(0, Math.min(10000, n)))} suffix="u/mo" />
                    <NumField id={`tr-price-${id}`} label={copyText.avgPrice} value={ch?.price !== undefined ? Math.round(ch.price * 100) / 100 : 0} onChange={n => setChannel(id, 'price', Math.max(0.5, Math.min(999, n)))} step={0.5} suffix="$" />
                  </div>
                  {id === 'etsy' && (
                    <NumField id={`tr-offsite-${id}`} label={copyText.offsiteShare} value={(ch?.offsiteAdsShare ?? 0) * 100} onChange={n => setChannel(id, 'offsiteAdsShare', Math.max(0, Math.min(100, n)) / 100)} suffix="%" />
                  )}
                  {breakdown && breakdown.revenue > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {copyText.keeps} <span className={breakdown.effectiveTakePct >= 15 ? 'text-amber-700 font-medium' : 'text-emerald-700 font-medium'}>
                        {(100 - breakdown.effectiveTakePct).toFixed(0)}¢/$1
                      </span> · {fmt$(breakdown.netPerSale)} {copyText.netSale} · {fmt$(breakdown.netPerMonth)}/{copyText.netMonth}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="tr-adsrate" className="text-xs">{copyText.offsiteRate}</Label>
              <select
                id="tr-adsrate"
                value={input.offsiteAdsRate}
                onChange={e => setRoot('offsiteAdsRate', parseFloat(e.target.value))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value={0.15}>{copyText.under10k}</option>
                <option value={0.12}>{copyText.over10k}</option>
              </select>
            </div>
            <NumField id="tr-ppfixed" label={copyText.paypalFixed} value={input.ravelryPayPalFixed} onChange={n => setRoot('ravelryPayPalFixed', Math.max(0, n))} step={0.05} suffix="$" />
            <NumField id="tr-pppct" label={copyText.paypalProcessing} value={Math.round(input.ravelryPayPalPct * 1000) / 10} onChange={n => setRoot('ravelryPayPalPct', Math.round(Math.max(0, Math.min(20, n)) * 10) / 1000)} step={0.1} suffix="%" />
            <div className="flex flex-col justify-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={input.ravelryHighTier} onChange={e => setRoot('ravelryHighTier', e.target.checked)} />
                {copyText.ravelryHigh}
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{copyText.portfolio}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label={copyText.monthlyRevenue} value={fmt$(result.totalRevenue)} tone="default" />
            <StatBox label={copyText.monthlyFees} value={fmt$(result.totalFees)} tone={result.overallTakePct <= 15 ? 'good' : 'warn'} />
            <StatBox label={copyText.monthlyNet} value={fmt$(result.totalNet)} tone={result.totalNet > 0 ? 'good' : 'bad'} />
            <StatBox label={copyText.overallTake} value={`${result.overallTakePct.toFixed(1)}%`} tone={result.overallTakePct <= 15 ? 'good' : 'warn'} />
            <StatBox label={copyText.largestShare} value={`${result.concentrationShare.toFixed(0)}%`} tone={result.concentrationShare <= 50 ? 'good' : 'bad'} />
            <StatBox label={copyText.discoveryFree} value={`${result.discoveryFreeNetShare.toFixed(0)}%`} tone={result.discoveryFreeNetShare < 40 ? 'good' : 'warn'} />
          </div>
        </section>

        <section className="space-y-2.5">
          <h3 className="text-sm font-semibold">{copyText.leaderboard} ({copyText.worstFirst})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-1.5 pr-3">#</th>
                  <th className="py-1.5 pr-3">{copyText.channel}</th>
                  <th className="py-1.5 pr-3 text-right">{copyText.revenueMonth}</th>
                  <th className="py-1.5 pr-3 text-right">{copyText.feesMonth}</th>
                  <th className="py-1.5 pr-3 text-right">{copyText.takePct}</th>
                  <th className="py-1.5 pr-3 text-right">Net/sale</th>
                  <th className="py-1.5 pr-3 text-right">Net/mo</th>
                  <th className="py-1.5 text-right">{copyText.annualNet}</th>
                </tr>
              </thead>
              <tbody>
                {result.feeLeakRanking.map((r, idx) => {
                  const b = result.channels.find(c => c.channel === r.channel);
                  const a = annualByChannel.get(r.channel);
                  return (
                    <tr key={r.channel} className="border-b border-border/40">
                      <td className="py-1.5 pr-3">{idx + 1}</td>
                      <td className="py-1.5 pr-3 font-medium">{r.label}</td>
                      <td className="py-1.5 pr-3 text-right">{b ? fmt$(b.revenue) : '—'}</td>
                      <td className="py-1.5 pr-3 text-right">{b ? fmt$(b.totalFees) : '—'}</td>
                      <td className={`py-1.5 pr-3 text-right font-medium ${r.effectiveTakePct >= 15 ? 'text-destructive' : r.effectiveTakePct >= 10 ? 'text-amber-700' : 'text-emerald-700'}`}>{r.effectiveTakePct.toFixed(1)}%</td>
                      <td className="py-1.5 pr-3 text-right">{b ? fmt$(b.netPerSale) : '—'}</td>
                      <td className="py-1.5 pr-3 text-right">{b ? fmt$(b.netPerMonth) : '—'}</td>
                      <td className="py-1.5 text-right">{a ? fmt$(a.annualNet) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Take % includes platform fees AND payment processing — the number that actually leaves your account. At the median $3.84 pattern price, fixed tolls push Etsy to ~21% and Ribblr to ~30%.</p>
        </section>

        {result.thresholdAlerts.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Store className="size-4" />{copyText.thresholds}</h3>
            <div className="flex flex-col gap-2">
              {result.thresholdAlerts.map((t, i) => (
                <div key={i} className="text-xs rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-800 p-2.5">
                  <span className="font-semibold">{t.label} — {t.crossing.replace(/-/g, ' ')}:</span> {t.detail}
                </div>
              ))}
            </div>
          </section>
        )}

        {result.flags.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Flag className="size-4" />{copyText.watchouts}</h3>
            <div className="flex flex-wrap gap-2">
              {result.flags.map((f, i) => (
                <Badge key={`${f.code}-${i}`} variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 gap-1.5 py-1.5 max-w-sm">
                  <AlertTriangle className="size-3 shrink-0" />
                  <span className="font-medium">{f.code}</span> — {f.title}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <section className={`rounded-md border p-4 ${verdictColor(result.verdict)}`}>
          <div className="flex items-center gap-2 font-semibold"><Lightbulb className="size-4" />{copyText.verdict}: {result.verdict}</div>
          <p className="mt-1.5 text-sm">{result.verdictNote}</p>
        </section>

        <p className="text-xs text-muted-foreground leading-4">{copyText.anchors}</p>
      </CardContent>
    </Card>
  );
}
