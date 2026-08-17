import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Camera, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { LOOKBOOK_DESK_COPY } from '@/lib/lookbook-desk-copy';
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

export function LookbookDeskCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copyText = LOOKBOOK_DESK_COPY[language];
  const tierLabels: Record<LookbookInputs['tier'], string> = { diy: copyText.diy, friend: copyText.friend, pro: copyText.pro };
  const platformLabels = copyText.platforms;
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
          <Camera className="h-4 w-4" /> {copyText.title}
        </CardTitle>
        <CardDescription>
          {copyText.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tier + economics inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <Label className="text-xs">{copyText.shootTier}</Label>
            <div className="flex flex-col gap-1">
              {(['diy', 'friend', 'pro'] as const).map((t) => (
                <button key={t} type="button" onClick={() => patch({ tier: t })}
                  className={`rounded-md border px-3 py-1.5 text-xs text-left transition-colors ${
                    stored.tier === t
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}>
                  {tierLabels[t]}
                </button>
              ))}
            </div>
          </div>
          <NumField id="lb-model" label={copyText.modelCost} value={stored.modelCost}
            min={0} step={10} onChange={(n) => patch({ modelCost: n })} suffix="$" />
          <NumField id="lb-misc" label={copyText.props} value={stored.miscCost}
            min={0} step={5} onChange={(n) => patch({ miscCost: n })} suffix="$" />
          <NumField id="lb-opportunity" label={copyText.hourlyValue} value={stored.opportunityHourly}
            min={0} step={1} onChange={(n) => patch({ opportunityHourly: n })} suffix="$/hr" />
        </div>
        {/* Hours budget */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField id="lb-mood" label={copyText.moodHours} value={stored.hoursPerMoodShot}
            min={0} step={0.5} onChange={(n) => patch({ hoursPerMoodShot: n })} suffix="hrs" />
          <NumField id="lb-practical" label={copyText.practicalHours} value={stored.hoursPractical}
            min={0} step={0.5} onChange={(n) => patch({ hoursPractical: n })} suffix="hrs" />
          <NumField id="lb-editing" label={copyText.editingHours} value={stored.hoursEditing}
            min={0} step={0.5} onChange={(n) => patch({ hoursEditing: n })} suffix="hrs" />
          <NumField id="lb-session" label={copyText.sessionRate} value={stored.proSessionRate}
            min={0} step={25} onChange={(n) => patch({ proSessionRate: n })} suffix="$" />
        </div>
        {/* Revenue sanity inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField id="lb-price" label={copyText.patternPrice} value={stored.patternPrice}
            min={0} step={0.5} onChange={(n) => patch({ patternPrice: n })} suffix="$" />
          <NumField id="lb-sales" label={copyText.expectedSales} value={stored.expectedSales}
            min={0} step={1} onChange={(n) => patch({ expectedSales: n })} />
          <NumField id="lb-friend" label={copyText.friendRate} value={stored.friendRate}
            min={0} step={10} onChange={(n) => patch({ friendRate: n })} suffix="$" />
          <div className="space-y-1.5 pt-5">
            <div className="flex items-center gap-2">
              <Switch id="lb-fos" checked={stored.testerFos}
                onCheckedChange={(v) => patch({ testerFos: v })} />
              <Label htmlFor="lb-fos" className="text-xs">{copyText.testerPhotos}</Label>
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
                  {platformLabels[p]}
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
                  {copyText.images}
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
                  {planned && <Badge variant="outline" className="text-[10px] uppercase">{copyText.planned}</Badge>}
                  {tierLabels[t]}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{copyText.cash}</span>
                    <span className="font-semibold">{fmt$(tier.cashCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{copyText.hours}</span>
                    <span className="font-semibold">{tier.hours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{copyText.opportunity}</span>
                    <span className="font-semibold">{fmt$(tier.opportunityCost)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-muted-foreground">{copyText.totalCost}</span>
                    <span className={`font-bold ${planned ? 'text-primary' : ''}`}>{fmt$(tier.totalCost)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Verdict */}
        <div className={`rounded-lg border p-4 ${verdictColor(result.verdict)}`}>
          <Badge className={`${verdictColor(result.verdict)} border uppercase`}>{copyText.verdict}: {result.verdict}</Badge>
          <p className="text-sm mt-2">{result.verdictReason}</p>
          <p className="text-sm mt-2 text-muted-foreground">
            {result.hoursTotal} {copyText.hoursSummary} ({result.hoursTotal - result.complexityHours}h base +
            {result.complexityHours}h added from the graded size range and yarn weight)
            · {copyText.breakeven} {result.breakevenCopiesAtPrice} copies · {copyText.budgetShare} {result.budgetShareOfRevenue}% of expected revenue
          </p>
        </div>

        {/* Shot list */}
        <div className="space-y-2">
          <div className="font-semibold text-sm flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> {copyText.shotList} — {copyText.shotListFromData}
          </div>
          {result.shotList.map((s) => (
            <div key={s.code} className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-primary/10 text-primary rounded px-1.5 py-0.5">{s.code}</span>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{s.kind}</span>
                {s.required && (
                  <Badge variant="outline" className="text-[10px] uppercase">{copyText.required}</Badge>
                )}
              </div>
              <p className="mt-1">{s.shot}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
            </div>
          ))}
          {result.shotList.length === 0 && (
            <p className="text-xs text-muted-foreground">{copyText.noShots}</p>
          )}
        </div>

        {/* Red flags */}
        {result.flags.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> {copyText.flags}
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
          {copyText.benchmarkNote}
        </p>
      </CardContent>
    </Card>
  );
}
