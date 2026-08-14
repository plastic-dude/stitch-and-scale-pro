import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Camera, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeLookbook,
  DEFAULT_LOOKBOOK,
  formatUsd,
  type LookbookInputs,
} from '@/lib/lookbook-desk';

function defaultStored(): LookbookInputs {
  return { ...DEFAULT_LOOKBOOK };
}

function loadStored(handle: ReturnType<typeof projectStorage<LookbookInputs>>): LookbookInputs {
  const parsed = handle.read();
  if (parsed) {
    const merged = { ...defaultStored(), ...parsed };
    merged.tier = ['diy', 'friend', 'pro'].includes(merged.tier) ? merged.tier : 'diy';
    merged.platforms = { ...defaultStored().platforms, ...(parsed.platforms ?? {}) };
    return merged as LookbookInputs;
  }
  return defaultStored();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const verdictColor = (v: string) =>
  v === 'go' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v === 'blocked' ? 'bg-destructive/15 text-destructive border-destructive/30' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

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
          onChange={(e) => onChange(Number(e.target.value) >= 0 ? Number(e.target.value) : 0)}
          className={suffix ? 'pr-10' : undefined} />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

const TIER_LABELS: Record<LookbookInputs['tier'], string> = {
  diy: 'DIY (self-shot)',
  friend: "Friend (\"mate's rates\")",
  pro: 'Professional (half-day)',
};

export function LookbookDeskCard({ project }: { project: PatternProject }) {
  const handle = useMemo(
    () => projectStorage<LookbookInputs>('lookbookdesk', project.id || '', []),
    [project.id],
  );
  const [stored, setStored] = useState<LookbookInputs>(() => loadStored(handle));
  useEffect(() => {
    handle.write(stored);
  }, [stored, handle]);
  const patch = (patch: Partial<LookbookInputs>) => setStored((s) => ({ ...s, ...patch }));
  const result = useMemo(() => analyzeLookbook(project, stored), [project, stored]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-4 w-4" /> Lookbook
        </CardTitle>
        <CardDescription>
          The pattern photo is the primary selling tool on every listing — most makers only read the
          description if the photos sell them first. No tool on the market prices the photoshoot or
          plans the shot list from the pattern&apos;s own data. This desk anchors the three tiers you
          actually choose between: self-shooting with a friend&apos;s phone, &quot;mate&apos;s rates&quot;,
          and a professional half-day — then checks the budget against the pattern&apos;s revenue, the
          size range it was graded to, and each platform&apos;s gallery minimums. The one documented
          production stack (MediaPeruana, 2016) budgets 8 of 55 sweater hours on photography and
          editing; nothing has updated that line since.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tier + economics inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <Label className="text-xs">Shoot tier</Label>
            <div className="flex flex-col gap-1">
              {(['diy', 'friend', 'pro'] as const).map((t) => (
                <button key={t} type="button" onClick={() => patch({ tier: t })}
                  className={`rounded-md border px-3 py-1.5 text-xs text-left transition-colors ${
                    stored.tier === t
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}>
                  {TIER_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <NumField id="lb-model" label="Model cost" value={stored.modelCost}
            min={0} step={10} onChange={(n) => patch({ modelCost: n })} suffix="$" />
          <NumField id="lb-misc" label="Props / backdrop / print" value={stored.miscCost}
            min={0} step={5} onChange={(n) => patch({ miscCost: n })} suffix="$" />
          <NumField id="lb-opportunity" label="Your hourly value" value={stored.opportunityHourly}
            min={0} step={1} onChange={(n) => patch({ opportunityHourly: n })} suffix="$/hr" />
        </div>
        {/* Hours budget */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField id="lb-mood" label="Mood-shot hours" value={stored.hoursPerMoodShot}
            min={0} step={0.5} onChange={(n) => patch({ hoursPerMoodShot: n })} suffix="hrs" />
          <NumField id="lb-practical" label="Practical-set hours" value={stored.hoursPractical}
            min={0} step={0.5} onChange={(n) => patch({ hoursPractical: n })} suffix="hrs" />
          <NumField id="lb-editing" label="Culling + editing hours" value={stored.hoursEditing}
            min={0} step={0.5} onChange={(n) => patch({ hoursEditing: n })} suffix="hrs" />
          <NumField id="lb-session" label="Half-day session rate" value={stored.proSessionRate}
            min={0} step={25} onChange={(n) => patch({ proSessionRate: n })} suffix="$" />
        </div>
        {/* Revenue sanity inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField id="lb-price" label="Pattern price" value={stored.patternPrice}
            min={0} step={0.5} onChange={(n) => patch({ patternPrice: n })} suffix="$" />
          <NumField id="lb-sales" label="Expected sales" value={stored.expectedSales}
            min={0} step={1} onChange={(n) => patch({ expectedSales: n })} />
          <NumField id="lb-friend" label="Friend rate (half-day)" value={stored.friendRate}
            min={0} step={10} onChange={(n) => patch({ friendRate: n })} suffix="$" />
          <div className="space-y-1.5 pt-5">
            <div className="flex items-center gap-2">
              <Switch id="lb-fos" checked={stored.testerFos}
                onCheckedChange={(v) => patch({ testerFos: v })} />
              <Label htmlFor="lb-fos" className="text-xs">Tester FO photos</Label>
            </div>
          </div>
        </div>
        {/* Platforms */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['ravelry', 'etsy', 'ownStore', 'social'] as const).map((p) => (
            <div key={p} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Switch id={`lb-${p}`} checked={stored.platforms[p]}
                  onCheckedChange={(v) => patch({ platforms: { ...stored.platforms, [p]: v } })} />
                <Label htmlFor={`lb-${p}`} className="text-xs">
                  {p === 'ownStore' ? 'Own store' : p === 'social' ? 'Social' : p === 'etsy' ? 'Etsy' : 'Ravelry'}
                </Label>
              </div>
              {result.platforms.find((pf) => (p === 'ravelry' ? pf.platform === 'Ravelry' :
                p === 'etsy' ? pf.platform === 'Etsy' :
                p === 'ownStore' ? pf.platform === 'Own store' : pf.platform === 'Social'))
                && (
                <p className="text-xs text-muted-foreground">
                  ≥ {result.platforms.find((pf) => (p === 'ravelry' ? pf.platform === 'Ravelry' :
                    p === 'etsy' ? pf.platform === 'Etsy' :
                    p === 'ownStore' ? pf.platform === 'Own store' : pf.platform === 'Social'))!.minImages}{' '}
                  images
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Tier comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['diy', 'friend', 'pro'] as const).map((t) => {
            const tier = result.tiers[t];
            const planned = t === stored.tier;
            return (
              <div key={t} className={`rounded-lg border p-4 ${planned ? 'border-primary bg-primary/5' : 'bg-muted/30'}`}>
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  {planned && <Badge variant="outline" className="text-[10px] uppercase">Planned</Badge>}
                  {tier.name}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cash</span>
                    <span className="font-semibold">{fmt$(tier.cashCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hours</span>
                    <span className="font-semibold">{tier.hours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Opportunity</span>
                    <span className="font-semibold">{fmt$(tier.opportunityCost)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-muted-foreground">Total cost</span>
                    <span className={`font-bold ${planned ? 'text-primary' : ''}`}>{fmt$(tier.totalCost)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verdict */}
        <div className={`rounded-lg border p-4 ${verdictColor(result.verdict)}`}>
          <Badge className={`${verdictColor(result.verdict)} border uppercase`}>{result.verdict}</Badge>
          <p className="text-sm mt-2">{result.verdictReason}</p>
          <p className="text-sm mt-2 text-muted-foreground">
            {result.hoursTotal} hours of shoot work ({result.hoursTotal - result.complexityHours}h base +
            {result.complexityHours}h added from the graded size range and yarn weight)
            · breakeven at {result.breakevenCopiesAtPrice} copies · photo budget is {result.budgetShareOfRevenue}% of expected revenue
          </p>
        </div>

        {/* Shot list */}
        <div className="space-y-2">
          <div className="font-semibold text-sm flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Shot list — from this pattern&apos;s own data
          </div>
          {result.shotList.map((s) => (
            <div key={s.code} className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-primary/10 text-primary rounded px-1.5 py-0.5">{s.code}</span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{s.kind}</span>
                {s.required && (
                  <Badge variant="outline" className="text-[10px] uppercase">Required</Badge>
                )}
              </div>
              <p className="mt-1">{s.shot}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
            </div>
          ))}
          {result.shotList.length === 0 && (
            <p className="text-xs text-muted-foreground">No shots demanded — add measurements or describe the knit to build the list.</p>
          )}
        </div>

        {/* Red flags */}
        {result.flags.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Flags — L-01 to L-06
            </div>
            {result.flags.map((f) => (
              <div key={f.code} className={`rounded-lg border p-3 text-sm ${
                f.severity === 'major'
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-border bg-muted/30'
              }`}>
                <div className="font-medium">{f.code}
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    f.severity === 'major' ? 'bg-amber-500/20 text-amber-700' : 'bg-muted text-muted-foreground'
                  }`}>{f.severity}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{f.message}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Benchmarks: MediaPeruana&apos;s &quot;Behind the Scenes&quot; production stack (2016) — 8 of 55
          sweater hours on photography + editing, model $40; Natalie In Stitches&apos; Final-Number-For-Nothing
          stack (2021) — £200 half-day at mate&apos;s rates inside a £1,000 12-size sweater budget; Bark portrait
          sessions run $100–500. Technique practice: Sister Mountain&apos;s pattern-photography guidance and
          Laine issue 25 (&quot;you make a photo&quot; — cloudy light, editing mandatory, worn-on beats flat lay
          for garments).
        </p>
      </CardContent>
    </Card>
  );
}
