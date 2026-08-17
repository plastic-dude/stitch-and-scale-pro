import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lightbulb, MapPin, TrendingUp, Flag } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { projectStorage } from '@/lib/storage-lib';
import { useSettings } from '@/context/SettingsContext';
import { CHANNEL_MIGRATION_COPY } from '@/lib/channel-migration-copy';
import {
  analyzeChannelMigration,
  CHANNELS,
  DEFAULT_MIGRATION,
  fmt$,
  type ChannelMigrationInput,
} from '@/lib/channel-migration-lab';

const STORAGE_KEY = 'stitch-and-scale-migration-v1';

type StoredState = ChannelMigrationInput & { ts?: number };

function defaultStored(): StoredState {
  return { ...DEFAULT_MIGRATION };
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

const verdictColor = (v: string) =>
  v.toLowerCase().startsWith('copy it') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.toLowerCase().startsWith('stay put') ? 'bg-destructive/15 text-destructive border-destructive/30' :
  v.toLowerCase().startsWith('migrate only') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  v.toLowerCase().startsWith('copy later') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  'bg-sky-500/15 text-sky-700 border-sky-500/30';

export function ChannelMigrationLabCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copy = CHANNEL_MIGRATION_COPY[language];
  const handle = useMemo(() => projectStorage<StoredState>('migration', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<ChannelMigrationInput>(() => loadStored(handle));

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: ChannelMigrationInput) => {
    setInput(next);
    handle.write({ ...next, ts: Date.now() });
  };

  const result = useMemo(() => analyzeChannelMigration(input), [input]);

  const set = <K extends keyof ChannelMigrationInput>(k: K, v: ChannelMigrationInput[K]) => persist({ ...input, [k]: v });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><MapPin className="size-4" />{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><TrendingUp className="size-4" />{copy.patternSales}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="cm-price" label={copy.patternPrice} value={input.price} onChange={n => set('price', n)} step={0.5} suffix="$" />
            <NumField id="cm-sales" label={copy.salesNow} value={input.salesPerMonth} onChange={n => set('salesPerMonth', n)} suffix="sales" />
            <NumField id="cm-added" label={copy.addedSales} value={input.addedSalesPerMonth} onChange={n => set('addedSalesPerMonth', n)} suffix="sales" />
            <NumField id="cm-migrated" label={copy.migratedSales} value={input.migratedSalesPerMonth} onChange={n => set('migratedSalesPerMonth', n)} suffix="sales" />
            <div className="space-y-1.5">
              <Label htmlFor="cm-from" className="text-xs">{copy.livesOn}</Label>
              <select id="cm-from" value={input.fromChannel}
                onChange={e => set('fromChannel', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm">
                {Object.values(CHANNELS).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">Added sales = new storefront revenue; migrated sales = buyers that follow the move (they leave the old channel, so the delta carries the per-sale spread on every unit that moves). Both at 0 means a pure migration paying only in fee spread.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{copy.feeSection}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="cm-hours" label={copy.relistingHours} value={input.migrationHours} onChange={n => set('migrationHours', n)} suffix="hrs" />
            <NumField id="cm-rate" label={copy.opportunityRate} value={input.hourlyRate} onChange={n => set('hourlyRate', n)} suffix="$/hr" />
            <NumField id="cm-fixed" label={copy.monthlyFee} value={input.newChannelMonthlyFee} onChange={n => set('newChannelMonthlyFee', n)} suffix="$" />
            <NumField id="cm-ads" label={copy.paidAds} value={input.adsShare * 100} onChange={n => set('adsShare', n / 100)} min={0} max={100} step={5} suffix="%" />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{copy.netSection}</h3>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-accent/60 text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">{copy.channel}</th>
                  <th className="p-2 text-right">{copy.netSale}</th>
                  <th className="p-2 text-right">{copy.feeShare}</th>
                  <th className="p-2 text-right">{copy.listingDrag}</th>
                  <th className="p-2 text-right">{copy.versusCurrent}</th>
                </tr>
              </thead>
              <tbody>
                {result.nets.map(n => (
                  <tr key={n.channel.key} className={`border-t ${n.channel.key === input.fromChannel ? 'bg-accent/40 font-medium' : ''}`}>
                    <td className="p-2">{n.channel.label}{n.channel.key === input.fromChannel ? ` ← ${copy.here}` : ''}</td>
                    <td className="p-2 text-right">{fmt$(n.netPerSale)}</td>
                    <td className="p-2 text-right">{(n.feeShare * 100).toFixed(0)}%</td>
                    <td className="p-2 text-right">{fmt$(n.annualListingDrag)}</td>
                    <td className="p-2 text-right">{(n.netPerSale - result.nets.find(x => x.channel.key === input.fromChannel)!.netPerSale) >= 0 ? '+' : ''}{fmt$(n.netPerSale - result.nets.find(x => x.channel.key === input.fromChannel)!.netPerSale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label={copy.relistingCost} value={fmt$(result.migrationCost)} />
            <StatBox label={copy.extraNet} value={`${result.deltaNetPerMonth >= 0 ? '+' : ''}${fmt$(result.deltaNetPerMonth)}`} tone={result.deltaNetPerMonth >= 0 ? 'good' : 'bad'} />
            <StatBox label={copy.payback} value={result.paybackMonths === Infinity ? '∞' : `${result.paybackMonths.toFixed(1)} mo`} tone={result.paybackMonths <= 12 ? 'good' : 'warn'} />
            <StatBox label={copy.yearOne} value={`${result.yearOneDelta >= 0 ? '+' : ''}${fmt$(result.yearOneDelta)}`} tone={result.yearOneDelta >= 0 ? 'good' : 'bad'} />
          </div>
        </section>

        {result.flags.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Flag className="size-4" />{copy.watchouts}</h3>
            <div className="flex flex-wrap gap-2">
              {result.flags.map(f => (
                <Badge key={f.code} variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 gap-1.5 py-1.5">
                  <AlertTriangle className="size-3" />
                  <span className="font-medium">{f.code}</span> — {f.title}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <section className={`rounded-md border p-4 ${verdictColor(result.verdict)}`}>
          <div className="flex items-center gap-2 font-semibold"><Lightbulb className="size-4" />{copy.verdict}: {result.verdict}</div>
          <p className="mt-1.5 text-sm">{result.verdictNote}</p>
        </section>
      </CardContent>
    </Card>
  );
}
