import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileCheck2, AlertTriangle, ClipboardCopy, TrendingUp } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { useSettings } from '@/context/SettingsContext';
import { COLLAB_DEAL_MATH_COPY } from '@/lib/collab-deal-math-copy';
import {
  analyzeDealMath,
  DEAL_MATH_DEFAULTS,
  STRUCTURE_LABELS,
  type DealMathInput,
  type RightsStructure,
} from '@/lib/collab-deal-math';
import { PLATFORMS, PLATFORM_LABELS, type PlatformId } from '@/lib/pattern-income-calculator';

const STORAGE_KEY = 'stitch-and-scale-dealmath-v1';

interface StoredDeal {
  input: DealMathInput;
}

function defaultStored(): StoredDeal {
  return { input: { ...DEAL_MATH_DEFAULTS } };
}

function loadStored(handle: ProjectStorageHandle<StoredDeal>): StoredDeal {
  try {
    const raw = handle.read();
    if (raw) {
      const parsed = raw as StoredDeal;
      if (parsed && parsed.input && typeof parsed.input.requiredHours === 'number') {
        return {
          ...defaultStored(),
          ...parsed,
          input: { ...defaultStored().input, ...parsed.input },
        };
      }
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return defaultStored();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const structureLabels: Record<RightsStructure, string> = STRUCTURE_LABELS;

const badgeStyle = (ok: boolean) =>
  ok ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
    'bg-destructive/15 text-destructive border-destructive/30';

function NumField({ id, label, value, onChange, min = 0, max, step = 1, hint }: {
  id: string; label: string; value: number;
  onChange: (n: number) => void; min?: number; max?: number; step?: number; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium">{label}</Label>
      <Input
        id={id} type="number" min={min} max={max} step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-8 text-sm"
      />
      {hint && <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>}
    </div>
  );
}

export function CollabDealMathCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copyText = COLLAB_DEAL_MATH_COPY[language];
  // Issue #4 project seam: scoped store per project; legacy flat key folded in on first read then removed.
  const handle = useMemo(() => projectStorage<StoredDeal>('dealmath', project.id, [STORAGE_KEY]), [project.id]);
  const { toast } = useToast();
  const [stored, setStored] = useState<StoredDeal>(() => loadStored(handle));
  useEffect(() => {
    handle.write(stored);
  }, [stored]);
  const patchInput = (patch: Partial<DealMathInput>) =>
    setStored((s) => ({ input: { ...s.input, ...patch } }));

  const result = useMemo(() => analyzeDealMath(stored.input), [stored.input]);
  const input = stored.input;

  const copyLetter = async () => {
    try {
      await navigator.clipboard.writeText(result.counterLetter);
      toast({ title: `${copyText.counterLetter} — ${copyText.copy}` });
    } catch {
      toast({ title: copyText.copy });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileCheck2 className="h-4 w-4" /> {copyText.title}
        </CardTitle>
        <CardDescription>
          {copyText.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Deal structure */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">{copyText.rightsStructure}</Label>
          <Select
            value={input.structure}
            onValueChange={(v) => patchInput({ structure: v as RightsStructure })}>
            <SelectTrigger className="h-8 min-h-11 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(structureLabels) as RightsStructure[]).map((s) => (
                <SelectItem key={s} value={s}>{structureLabels[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brand-side money */}
        <div className="grid grid-cols-2 gap-3">
          <NumField id="dm-fee" label={copyText.fixedFee} value={input.fixedFee} min={0}
            onChange={(v) => patchInput({ fixedFee: v })}
            hint={copyText['buyoutPriceExclusivityFee']} />
          <NumField id="dm-royalty" label={copyText.royalty} value={Math.round(input.royaltyPct * 100)} min={0} max={100}
            onChange={(v) => patchInput({ royaltyPct: v / 100 })}
            hint={copyText['shareOfTheCompany']} />
          <NumField id="dm-company-sales" label={copyText.companySales} value={input.companySales} min={0}
            onChange={(v) => patchInput({ companySales: v })} />
          <NumField id="dm-yarn" label={copyText.yarnValue} value={input.yarnSupportValue} min={0}
            onChange={(v) => patchInput({ yarnSupportValue: v })}
            hint={copyText['costOffsetNeverRevenue']} />
        </div>

        {/* Rights terms */}
        <div className="grid grid-cols-2 gap-3">
          <NumField id="dm-excl" label={copyText.exclusivity} value={input.exclusivityMonths} min={0} max={60}
            onChange={(v) => patchInput({ exclusivityMonths: v })}
            hint={copyText['monthsLockedOutOf']} />
          <NumField id="dm-tail" label={copyText.tail} value={input.tailMonths} min={0} max={120}
            onChange={(v) => patchInput({ tailMonths: v })}
            hint={copyText['howLongThePattern']} />
          <div className="col-span-2 flex items-start gap-2 pt-1">
            <Checkbox id="dm-sole" checked={input.soleYarnClause}
              onCheckedChange={(c) => patchInput({ soleYarnClause: c === true })} />
            <label htmlFor="dm-sole" className="text-sm leading-snug">
              {copyText.soleYarn} <span className="font-medium">{copyText.onlyRecommended}</span>
            </label>
          </div>
        </div>

        {/* The designer's side */}
        <div className="grid grid-cols-2 gap-3">
          <NumField id="dm-hours" label={copyText.hours} value={input.requiredHours} min={0} max={500}
            onChange={(v) => patchInput({ requiredHours: v })} />
          <NumField id="dm-rate" label={copyText.hourlyRate} value={input.hourlyRate} min={0} max={500}
            onChange={(v) => patchInput({ hourlyRate: v })}
            hint={copyText['fromYourOwnIncome']} />
          <NumField id="dm-costs" label={copyText.uncoveredCosts} value={input.uncoveredCosts} min={0}
            onChange={(v) => patchInput({ uncoveredCosts: v })}
            hint={copyText['techEditPhotographyLayout']} />
          <NumField id="dm-own-sales" label={copyText.ownSales} value={input.ownMonthlySales} min={0}
            onChange={(v) => patchInput({ ownMonthlySales: v })}
            hint={copyText['censusReality72%Of']} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">{copyText.platform}</Label>
          <Select value={input.platform} onValueChange={(v) => patchInput({ platform: v as PlatformId })}>
            <SelectTrigger className="h-8 min-h-11 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* The deal as structured */}
        <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={badgeStyle(result.deal.ok)}>
              {result.deal.ok ? copyText.pays : copyText.loses}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Net {fmt$(result.deal.brandNet)} at {fmt$(result.deal.effectiveHourly)}/hr vs your {fmt$(input.hourlyRate)}/hr floor
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between"><span>{copyText.cash}</span><span className="font-medium">{fmt$(result.deal.cash)}</span></div>
            <div className="flex justify-between"><span>{copyText.royaltyRevenue}</span><span className="font-medium">{fmt$(result.deal.royaltyRevenue)}</span></div>
            <div className="flex justify-between"><span>{copyText.costs}</span><span className="font-medium">{fmt$(result.deal.designerCosts)}</span></div>
            <div className="flex justify-between"><span>{copyText.lockedOut}</span><span className="font-medium">{fmt$(result.deal.lockedOutValue)}</span></div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{result.deal.reason}</p>
        </div>

        {/* Channel comparison */}
        <div className="rounded-lg border p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4" /> {copyText.brandVsOwn}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between"><span>{copyText.brandWindow}</span><span className="font-medium">{fmt$(result.channelComparison.brandNet)}</span></div>
            <div className="flex justify-between"><span>{copyText.ownTail}</span><span className="font-medium">{fmt$(result.channelComparison.ownNet)}</span></div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{result.channelComparison.note}</p>
        </div>

        {/* Best structure at these inputs */}
        {result.bestStructure && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
            <div className="text-xs font-medium text-emerald-700">
              {copyText.winning} {STRUCTURE_LABELS[result.bestStructure]}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {copyText.ranking}
            </p>
          </div>
        )}

        {/* Clause flags */}
        {result.clauseFlags.length > 0 && (
          <div className="space-y-2">
            {result.clauseFlags.map((f) => (
              <div key={f.code} className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <p className="text-xs leading-relaxed text-amber-900">{f.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Counter-offer letter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">{copyText.counterLetter}</Label>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={copyLetter}>
              <ClipboardCopy className="h-3 w-3" /> {copyText.copy}
            </Button>
          </div>
          <p className="whitespace-pre-wrap rounded-lg border bg-card p-3 text-xs leading-relaxed text-muted-foreground">
            {result.counterLetter}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
