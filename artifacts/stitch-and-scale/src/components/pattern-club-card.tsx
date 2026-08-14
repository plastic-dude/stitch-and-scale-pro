import { useMemo, useState, useEffect } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy } from 'lucide-react';
import {
  compareMagazine,
  generateClubFaq,
  generateMagazineResponse,
  planClub,
  type ClubPricingInput,
  type ClubSoloBaseline,
  type MagazineOfferInput,
} from '@/lib/pattern-club-planner';
import { useToast } from '@/hooks/use-toast';
import type { PatternProject } from '@/lib/grading-engine';

interface ClubDraftState {
  monthlyPrice: string;
  annualPrice: string;
  trialMonths: string;
  trialPrice: string;
  startMembers: string;
  monthlyNewMembers: string;
  churnPct: string;
  giftCodeCost: string;
  patternCost: string;
  labourCost: string;
  channelFee: string;
  soloCopiesPerMonth: string;
  soloPrice: string;
  platform: 'ravelry' | 'etsy' | 'ribblr' | 'payhip';
  patternsPerMonth: string;
}

const defaultDraft: ClubDraftState = {
  monthlyPrice: '7',
  annualPrice: '77',
  trialMonths: '0',
  trialPrice: '0',
  startMembers: '20',
  monthlyNewMembers: '5',
  churnPct: '10',
  giftCodeCost: '8.50',
  patternCost: '150',
  labourCost: '0',
  channelFee: '5',
  soloCopiesPerMonth: '10',
  soloPrice: '8',
  platform: 'ravelry',
  patternsPerMonth: '1',
};

interface MagazineDraftState {
  fee: string;
  exclusiveMonths: string;
  soloCopiesPerMonth: string;
  soloPrice: string;
  platform: 'ravelry' | 'etsy' | 'ribblr' | 'payhip';
  techEditCovered: boolean;
  designHours: string;
  hourlyRate: string;
  techEditCost: string;
  mediaCost: string;
}

const defaultMagazine: MagazineDraftState = {
  fee: '250',
  exclusiveMonths: '3',
  soloCopiesPerMonth: '10',
  soloPrice: '8',
  platform: 'ravelry',
  techEditCovered: true,
  designHours: '30',
  hourlyRate: '25',
  techEditCost: '100',
  mediaCost: '0',
};

interface StoredClub {
  draft: ClubDraftState;
  magazine: MagazineDraftState;
}

function loadStored(handle: ProjectStorageHandle<StoredClub>): StoredClub {
  try {
    const parsed = handle.read();
    if (parsed && typeof parsed === 'object' && parsed.draft && parsed.magazine) {
      return { draft: { ...defaultDraft, ...parsed.draft }, magazine: { ...defaultMagazine, ...parsed.magazine } };
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return { draft: { ...defaultDraft }, magazine: { ...defaultMagazine } };
}

function num(v: string, fallback = 0): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function Field({
  label,
  hint,
  value,
  onChange,
  step = '0.01',
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input
        type="number"
        step={step}
        min="0"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-9 text-sm"
      />
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function CopyLine({ text }: { text: string }) {
  const { toast } = useToast();
  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 text-xs"
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        toast({ title: 'Copied', description: 'Ready to paste wherever you need it.' });
      }}
    >
      <Copy className="h-3.5 w-3.5" />
      Copy
    </Button>
  );
}

function verdictBadge(v: string) {
  if (v === 'go') return <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">go</Badge>;
  if (v === 'review') return <Badge className="bg-amber-500 hover:bg-amber-500 text-white">review</Badge>;
  return <Badge className="bg-red-600 hover:bg-red-600 text-white">skip</Badge>;
}

export function PatternClubCard({ project }: { project: PatternProject }) {
  // issue #4 project seam (S036): the plan was fully ephemeral — a refresh
  // wiped the designer's numbers. Now persisted per project; the legacy
  // comment 'fully-ephemeral pattern-club-card' is history, not behavior.
  const handle = useMemo(() => projectStorage<StoredClub>('patternclub', project.id), [project.id]);
  const [draft, setDraft] = useState<ClubDraftState>(() => loadStored(handle).draft);
  const [mag, setMag] = useState<MagazineDraftState>(() => loadStored(handle).magazine);
  const { toast } = useToast();

  useEffect(() => {
    handle.write({ draft, magazine: mag });
  }, [draft, mag]);

  const result = useMemo(() => {
    const base: ClubSoloBaseline = {
      soloCopiesPerMonth: num(draft.soloCopiesPerMonth),
      soloPrice: num(draft.soloPrice),
      platform: draft.platform,
    };
    const pricing: ClubPricingInput = {
      monthlyPrice: num(draft.monthlyPrice),
      annualPrice: num(draft.annualPrice),
      trialMonths: num(draft.trialMonths),
      trialPrice: num(draft.trialPrice),
    };
    return planClub({
      pricing,
      demand: {
        startMembers: num(draft.startMembers),
        monthlyNewMembers: num(draft.monthlyNewMembers),
        churnPct: num(draft.churnPct) / 100,
        annualShare: pricing.annualPrice > 0 ? 0.3 : 0,
      },
      costs: {
        giftCodeCost: num(draft.giftCodeCost),
        patternCost: num(draft.patternCost),
        labourCost: num(draft.labourCost),
        channelFee: num(draft.channelFee) / 100,
      },
      baseline: base,
      patternsPerMonth: Math.max(1, Math.round(num(draft.patternsPerMonth) || 1)),
      months: 12,
    });
  }, [draft]);

  const magazineResult = useMemo<MagazineOfferInput>(() => ({
    fee: num(mag.fee),
    exclusiveMonths: num(mag.exclusiveMonths),
    soloCopiesPerMonth: num(mag.soloCopiesPerMonth),
    soloPrice: num(mag.soloPrice),
    platform: mag.platform,
    techEditCovered: mag.techEditCovered,
    designHours: num(mag.designHours),
    hourlyRate: num(mag.hourlyRate),
    techEditCost: num(mag.techEditCost),
    mediaCost: num(mag.mediaCost),
  }), [mag]);

  const magOutcome = useMemo(
    () => compareMagazine(magazineResult),
    [magazineResult],
  );

  const faqText = useMemo(
    () =>
      generateClubFaq(
        project.name || 'My Pattern Club',
        {
          monthlyPrice: num(draft.monthlyPrice),
          annualPrice: num(draft.annualPrice),
          trialMonths: num(draft.trialMonths),
          trialPrice: num(draft.trialPrice),
        },
        Math.max(1, Math.round(num(draft.patternsPerMonth) || 1)),
      ),
    [project.name, draft, result.months.length],
  );

  const magReply = useMemo(
    () =>
      generateMagazineResponse({
        magazine: '[magazine name]',
        pattern: project.name || 'your pattern',
        fee: num(mag.fee),
        exclusiveMonths: num(mag.exclusiveMonths),
      }),
    [project.name, mag.fee, mag.exclusiveMonths],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pattern Club & Magazine Lockout</CardTitle>
        <CardDescription>
          The two channels nobody models honestly. A club only pays when it beats selling the
          same patterns solo — this compares club net against your own baseline after churn,
          gift-code fulfilment and production costs. And a magazine fee has to beat the income
          the pattern loses during its exclusive window (cited: Knitty ~3 months, Laine 5,
          Farm & Fiber 12).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="club" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="club" className="flex-1 text-xs">
              Pattern Club
            </TabsTrigger>
            <TabsTrigger value="magazine" className="flex-1 text-xs">
              Magazine Offer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="club" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-3">
              <Field label="Member price / month ($)" hint="Market band: $5–$19/mo (Double The Stitches $7, Crochet Spot $10)." value={draft.monthlyPrice} onChange={v => setDraft(d => ({ ...d, monthlyPrice: v }))} step="1" />
              <Field label="Annual price ($)" hint="$0 = monthly only. Annual ≈ 2× monthly is the market norm ($77/yr on $7/mo)." value={draft.annualPrice} onChange={v => setDraft(d => ({ ...d, annualPrice: v }))} step="1" />
              <Field label="Trial length (months)" hint="0 = none; Nicki's runs 7-day trials, clubs often offer one free month." value={draft.trialMonths} onChange={v => setDraft(d => ({ ...d, trialMonths: v }))} step="1" />
              <Field label="Trial price / month ($)" hint="$0 = free trial." value={draft.trialPrice} onChange={v => setDraft(d => ({ ...d, trialPrice: v }))} step="1" />
              <Field label="Starting members" hint="Founding cohort — your launch list, realistically." value={draft.startMembers} onChange={v => setDraft(d => ({ ...d, startMembers: v }))} step="1" />
              <Field label="New members / month" hint="After launch, at your current marketing effort." value={draft.monthlyNewMembers} onChange={v => setDraft(d => ({ ...d, monthlyNewMembers: v }))} step="1" />
              <Field label="Monthly churn (%)" hint="Membership clubs typically churn 5–15%/mo." value={draft.churnPct} onChange={v => setDraft(d => ({ ...d, churnPct: v }))} />
              <Field label="Gift-code fulfilment ($)" hint="Ravelry gift codes + email copy per member per pattern." value={draft.giftCodeCost} onChange={v => setDraft(d => ({ ...d, giftCodeCost: v }))} />
              <Field label="Pattern production ($)" hint="Tech edit + layout + photography, outsourced or your valued time." value={draft.patternCost} onChange={v => setDraft(d => ({ ...d, patternCost: v }))} step="1" />
              <Field label="Community labour ($/mo)" hint="Live sessions, support, group moderation — $0 if none." value={draft.labourCost} onChange={v => setDraft(d => ({ ...d, labourCost: v }))} step="1" />
              <Field label="Channel fee (%)" hint="5 = 5% for Patreon/Payhip-style billing." value={draft.channelFee} onChange={v => setDraft(d => ({ ...d, channelFee: v }))} />
              <Field label="Patterns per month" hint="1 = standard club cadence." value={draft.patternsPerMonth} onChange={v => setDraft(d => ({ ...d, patternsPerMonth: v }))} step="1" />
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-3">
              <Field label="Solo copies / month (baseline)" hint="What this pattern sells per month if you don't put it in the club." value={draft.soloCopiesPerMonth} onChange={v => setDraft(d => ({ ...d, soloCopiesPerMonth: v }))} step="1" />
              <Field label="Solo price ($)" hint="Same price in all languages." value={draft.soloPrice} onChange={v => setDraft(d => ({ ...d, soloPrice: v }))} step="0.01" />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Solo platform</Label>
                <select
                  value={draft.platform}
                  onChange={e =>
                    setDraft(d => ({ ...d, platform: e.target.value as ClubDraftState['platform'] }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="ravelry">Ravelry</option>
                  <option value="etsy">Etsy</option>
                  <option value="ribblr">Ribblr</option>
                  <option value="payhip">Payhip</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Fees come from the Income Planner's cited model — every channel uses one seam.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Month-12 club net</p>
                <p className="text-lg font-semibold">{fmt(result.months[11]?.netRevenue ?? 0)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Solo income lost / mo</p>
                <p className="text-lg font-semibold">{fmt(result.months[11]?.soloOpportunityCost ?? 0)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Net vs selling solo</p>
                <p className="text-lg font-semibold">{fmt(result.finalMonthlyNetVsSolo)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Steady-state members needed</p>
                <p className="text-lg font-semibold">{nfmt(result.breakEvenMembers)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
              <div>{verdictBadge(result.verdict)}</div>
              <p className="text-sm leading-relaxed">{result.verdictNote}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Paste-ready club FAQ</Label>
                <CopyLine text={faqText} />
              </div>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border bg-background p-3 text-xs">
                {faqText}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="magazine" className="mt-4 space-y-6">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-3">
              <Field label="Offered fee ($)" hint="Cited band: Knitty $200–$300, Farm & Fiber $200–$750 by garment size." value={mag.fee} onChange={v => setMag(m => ({ ...m, fee: v }))} step="1" />
              <Field label="Exclusivity window (months)" hint="Cited: Knitty ~3, Laine 5, I Like Knitting 6, Farm & Fiber 12." value={mag.exclusiveMonths} onChange={v => setMag(m => ({ ...m, exclusiveMonths: v }))} step="1" />
              <Field label="Pattern production you'd pay ($)" hint="Tech edit + media if the publisher doesn't cover them." value={mag.mediaCost} onChange={v => setMag(m => ({ ...m, mediaCost: v }))} step="1" />
              <Field label="Pattern sells solo (copies/mo)" hint="Your realistic steady state after the window ends." value={mag.soloCopiesPerMonth} onChange={v => setMag(m => ({ ...m, soloCopiesPerMonth: v }))} step="1" />
              <Field label="Solo price ($)" value={mag.soloPrice} onChange={v => setMag(m => ({ ...m, soloPrice: v }))} step="0.01" />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Solo platform</Label>
                <select
                  value={mag.platform}
                  onChange={e =>
                    setMag(m => ({ ...m, platform: e.target.value as MagazineDraftState['platform'] }))
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                >
                  <option value="ravelry">Ravelry</option>
                  <option value="etsy">Etsy</option>
                  <option value="ribblr">Ribblr</option>
                  <option value="payhip">Payhip</option>
                </select>
              </div>
              <div className="flex items-end gap-2 pb-1">
                <input
                  type="checkbox"
                  id="tech-edit-covered"
                  checked={mag.techEditCovered}
                  onChange={e => setMag(m => ({ ...m, techEditCovered: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="tech-edit-covered" className="cursor-pointer text-xs">
                  Publisher covers tech editing (Knitty does)
                </Label>
              </div>
              <Field label="Your tech-edit cost ($) if not covered" value={mag.techEditCost} onChange={v => setMag(m => ({ ...m, techEditCost: v }))} step="1" />
              <Field label="Design hours" value={mag.designHours} onChange={v => setMag(m => ({ ...m, designHours: v }))} step="1" />
              <Field label="Your hourly rate ($/hr)" hint="Used for the effective rate check." value={mag.hourlyRate} onChange={v => setMag(m => ({ ...m, hourlyRate: v }))} step="1" />
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Net fee (after your costs)</p>
                <p className="text-lg font-semibold">{fmt(magOutcome.netFee)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Income lost in the window</p>
                <p className="text-lg font-semibold">{fmt(magOutcome.windowSoloNet)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Min. fee worth accepting</p>
                <p className="text-lg font-semibold">{fmt(magOutcome.minimumWorthwhileFee)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-[11px] text-muted-foreground">Effective rate / hour</p>
                <p className="text-lg font-semibold">{fmt(magOutcome.effectiveHourlyRate)}/hr</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
              <div>{verdictBadge(magOutcome.verdict)}</div>
              <p className="text-sm leading-relaxed">{magOutcome.verdictNote}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Paste-ready reply to the editor</Label>
                <CopyLine text={magReply} />
              </div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border bg-background p-3 text-xs">
                {magReply}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const fixed = Math.round(n * 100) / 100;
  const cents = Math.round(Math.abs(fixed) * 100) % 100;
  const whole = Math.floor(Math.abs(fixed)).toLocaleString('en-US');
  const sign = n < 0 ? '-' : '';
  return sign + '$' + whole + (cents > 0 ? '.' + String(cents).padStart(2, '0') : '');
}

function nfmt(n: number | null): string {
  if (n === null) return '—';
  return Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 1 }) : '—';
}
