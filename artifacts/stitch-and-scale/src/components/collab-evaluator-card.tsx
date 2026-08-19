import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Handshake, ClipboardCopy, AlertTriangle, HeartHandshake } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  analyzeCollab,
  DEFAULT_COLLAB,
  type CollabInput,
  type CollabType,
} from '@/lib/collab-evaluator';
import { PLATFORMS, PLATFORM_LABELS, type PlatformId } from '@/lib/pattern-income-calculator';
import { useSettings } from '@/context/SettingsContext';
import { COLLAB_EVALUATOR_COPY } from '@/lib/collab-evaluator-copy';

interface StoredCollab {
  input: CollabInput;
}

function defaultStored(): StoredCollab {
  return { input: { ...DEFAULT_COLLAB } };
}

function loadStored(projectId: string): StoredCollab {
  const key = `stitch-and-scale-collab-${projectId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
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

function fmt$(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

const collabTypeLabels: Record<CollabType, string> = {
  unpaid_seed: 'Product seeding — free yarn, no requirements',
  unpaid_work: 'Free work — deadlines, posts, or exclusivity asked',
  flat_fee: 'Flat fee offer',
  royalty: 'Royalty offer',
  exclusive_license: 'Exclusive license / buyout',
};

const verdictBadge = (v: string) =>
  v === 'take' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v === 'walk' ? 'bg-destructive/15 text-destructive border-destructive/30' :
  'bg-amber-500/15 text-amber-700 border-amber-500/30';

function NumField({ id, label, value, onChange, min = 0, max, step = 1, hint }: {
  id: string; label: string; value: number;
  onChange: (n: number) => void; min?: number; max?: number; step?: number; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input id={id} type="number" min={min} {...(max !== undefined ? { max } : {})} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) >= 0 ? Number(e.target.value) : 0)}
        className="h-9 bg-background" />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CollabEvaluatorCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copyText = COLLAB_EVALUATOR_COPY[language];
  const { toast } = useToast();
  const [stored, setStored] = useState<StoredCollab>(() => loadStored(project.id));

  useEffect(() => {
    localStorage.setItem(`stitch-and-scale-collab-${project.id}`, JSON.stringify(stored));
  }, [project.id, stored]);

  const patchInput = (patch: Partial<CollabInput>) =>
    setStored((s) => ({ input: { ...s.input, ...patch } }));

  const input = stored.input;
  const result = useMemo(() => analyzeCollab(input), [input]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: copyText.copied });
    } catch {
      toast({ title: copyText.copyFailed });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HeartHandshake className="h-4 w-4" /> {copyText.title}
        </CardTitle>
        <CardDescription>
          {copyText.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-md border border-border/60 bg-muted/40 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Handshake className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{copyText.offer}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-3 space-y-1.5">
              <Label className="text-xs">{copyText.askType}</Label>
              <Select
                value={input.collabType}
                onValueChange={(v) => patchInput({ collabType: v as CollabType })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(collabTypeLabels) as CollabType[]).map((t) => (
                    <SelectItem key={t} value={t}>{collabTypeLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <NumField id="ce-offered" label={copyText.offered} value={input.offeredValue}
              onChange={(v) => patchInput({ offeredValue: v })} step={25}
              hint={copyText['theCashOfferOr']} />
            <NumField id="ce-hours" label={copyText.hours} value={input.requiredHours}
              onChange={(v) => patchInput({ requiredHours: v })} hint={copyText['designGradingSamplingTech']} />
            <NumField id="ce-rate" label={copyText.rate} value={input.hourlyRate}
              onChange={(v) => patchInput({ hourlyRate: v })} hint={copyText['fromYourIncomeMath']} />
            <NumField id="ce-sample" label={copyText.sample} value={input.sampleCost}
              onChange={(v) => patchInput({ sampleCost: v })} hint={copyText['yarnSwatchingPhotosIf']} />
            <NumField id="ce-posts" label={copyText.posts} value={input.postingRequirements}
              onChange={(v) => patchInput({ postingRequirements: v })} hint={copyText['eachDemandedPostIs']} />
            <NumField id="ce-excl" label={copyText.exclusivity} value={input.exclusivityMonths}
              onChange={(v) => patchInput({ exclusivityMonths: v })} hint={copyText['whatYourOwnChannel']} />
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="ce-yarn" checked={input.yarnProvided}
                onCheckedChange={(v) => patchInput({ yarnProvided: v === true })} />
              <Label htmlFor="ce-yarn" className="text-xs">{copyText.yarnFree}</Label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="ce-copyright" checked={input.fullCopyrightTransfer}
                onCheckedChange={(v) => patchInput({ fullCopyrightTransfer: v === true })} />
              <Label htmlFor="ce-copyright" className="text-xs">{copyText.copyright}</Label>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="ce-reputation" checked={input.unpaidReputation}
                onCheckedChange={(v) => patchInput({ unpaidReputation: v === true })} />
              <Label htmlFor="ce-reputation" className="text-xs">{copyText.reputation}</Label>
            </div>
          </div>
        </div>

        {(input.collabType === 'royalty' || input.collabType === 'flat_fee') && (
          <div className="rounded-md border border-border/60 bg-muted/40 p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <NumField id="ce-royaltypct" label={copyText.royalty} value={input.royaltyPct * 100}
                onChange={(v) => patchInput({ royaltyPct: Math.min(Math.max(v, 0) / 100, 1) })} step={5}
                hint={copyText['30%OfNetIs']} />
              <div className="space-y-1.5">
                <Label className="text-xs">{copyText.royaltyBase}</Label>
                <Select value={input.royaltyBase}
                  onValueChange={(v) => patchInput({ royaltyBase: v as 'net' | 'gross' })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net">{copyText.net}</SelectItem>
                    <SelectItem value="gross">{copyText.gross}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <NumField id="ce-companysales" label={copyText.companySales} value={input.companySales}
                onChange={(v) => patchInput({ companySales: v })} step={25} />
              <NumField id="ce-price" label={copyText.patternPrice} value={input.patternPrice}
                onChange={(v) => patchInput({ patternPrice: v })} step={0.5} />
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">{copyText.royaltyPlatform}</Label>
                <Select value={input.platform}
                  onValueChange={(v) => patchInput({ platform: v as PlatformId })}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-md border border-border/60 bg-muted/40 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Handshake className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{copyText.baseline}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <NumField id="ce-ownsales" label={copyText.ownSales} value={input.ownMonthlySales}
              onChange={(v) => patchInput({ ownMonthlySales: v })} step={5}
              hint={copyText['salesThroughYourChannel']} />
            <NumField id="ce-followers" label={copyText.followers} value={input.brandFollowers}
              onChange={(v) => patchInput({ brandFollowers: v })} step={1000}
              hint={copyText['theCeilingOfThe']} />
            <div className="space-y-1.5">
              <Label className="text-xs">{copyText.channel}</Label>
              <Select value={input.platform}
                onValueChange={(v) => patchInput({ platform: v as PlatformId })}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-md border border-border p-4 space-y-3">
            <div className="text-xs text-muted-foreground">Fair-fee floor — your number</div>
            <div className="text-2xl font-bold">{fmt$(result.fairFeeFloor)}</div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Your hours, sample costs, and demanded posts at your own rate. Where negotiation starts, never where it ends.
            </p>
          </div>
          <div className="rounded-md border border-border p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {copyText.offerNet}
              {input.collabType === 'exclusive_license' && (
                <Badge variant="outline" className="text-[10px]">
                  {copyText.lockedOut}: {fmt$(result.lockedOutValue)}
                </Badge>
              )}
            </div>
            <div className={`text-2xl font-bold ${result.totalOfferValue >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {fmt$(result.totalOfferValue)}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              What the offer adds beyond the floor — positive means you come out ahead, negative means it eats your time cost.
            </p>
          </div>
          <div className="rounded-md border border-border p-4 space-y-3">
            <div className="text-xs text-muted-foreground">{copyText.exposure}</div>
            <div className="text-2xl font-bold">{fmt$(result.exposure.realisticReach)} <span className="text-xs font-normal text-muted-foreground">/ {copyText.ceiling} {fmt$(result.exposure.grossExposureValue)}</span></div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Followers × 0.5% conversion × your net per sale, floored at $50. Exposure is shown, not inflated — it can never turn a walk into a take.
            </p>
          </div>
        </div>

        <div className="rounded-md border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{copyText.verdict}</span>
            <Badge className={verdictBadge(result.verdict)}>{result.verdict === 'take' ? copyText.take : result.verdict === 'counter' ? copyText.counter : copyText.walk}</Badge>
          </div>
          <p className="text-sm leading-relaxed">{result.verdictReason}</p>
        </div>

        {result.redFlags.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="w-4 h-4" /> {copyText.redFlags}
            </div>
            {result.redFlags.map((f) => (
              <div key={f.code} className="flex items-start gap-2 text-xs leading-relaxed">
                <Badge variant="outline" className={`shrink-0 text-[10px] mt-0.5 ${f.severity === 'critical' ? 'border-destructive/50 text-destructive' : 'border-amber-500/50 text-amber-700'}`}>
                  {f.code}
                </Badge>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{copyText.reply}</span>
            <Button variant="outline" size="sm" className="gap-2 h-8 min-h-11" onClick={() => copy(result.replyLetter)}>
              <ClipboardCopy className="w-3.5 h-3.5" /> {copyText.copyLetter}
            </Button>
          </div>
          <pre className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-4 text-xs leading-relaxed">
            {result.replyLetter}
          </pre>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Benchmarks: WhoPaysKnitters rate database (industry floor reference); Making Stories royalties
          30% of net Ravelry / 20% of net in-store; posting duties ~1.5h each; UK IPO — patterns are literary
          works, copyright runs life+70 years. Cite the census, not the vibe.
        </p>
      </CardContent>
    </Card>
  );
}
