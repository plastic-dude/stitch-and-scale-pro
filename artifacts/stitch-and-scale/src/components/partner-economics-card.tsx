import { copyTextOrThrow } from '@/lib/clipboard';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Handshake, ClipboardCopy, AlertTriangle, ShieldCheck, CalendarClock, Plus, Trash2, Package } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { getToastCopy } from '@/lib/toast-copy';
import { PARTNER_COPY } from '@/lib/partner-copy';
import { safeNum } from '@/lib/numeric-guard';
import {
  analyzePartnerDeal,
  normalizePartnerDeal,
  scorePitch,
  summarizePipeline,
  DEFAULT_PARTNER,
  DEFAULT_PITCH,
  DEAL_LABELS,
  RIGHTS_LABELS,
  PITCH_STATUS_LABELS,
  CONTRACT_CHECKLIST,
  WPK_ACCESSORY_RATE_AVG,
  MARKETPLACE_FEE_PCT,
  type DealOffer,
  type DealType,
  type RightsGrant,
  type PitchInput,
  type PitchEntry,
  type PitchStatus,
} from '@/lib/partner-economics';

const STORAGE_KEY = 'stitch-and-scale-partners-';

interface StoredPartner {
  offer: DealOffer;
  pitch: PitchInput;
  pitches: PitchEntry[];
}

function defaultStored(): StoredPartner {
  return { offer: { ...DEFAULT_PARTNER }, pitch: { ...DEFAULT_PITCH }, pitches: [] };
}

function loadStored(projectId: string): StoredPartner {
  try {
    const raw = localStorage.getItem(STORAGE_KEY + projectId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.offer && typeof parsed.offer.productionCost === 'number') {
        return {
          ...defaultStored(),
          ...parsed,
          offer: normalizePartnerDeal({ ...defaultStored().offer, ...parsed.offer }),
          pitch: {
            ...defaultStored().pitch,
            ...(parsed.pitch || {}),
            portfolioPatterns: Math.max(0, Math.min(100000, Number.isFinite(Number(parsed.pitch?.portfolioPatterns)) ? Number(parsed.pitch.portfolioPatterns) : defaultStored().pitch.portfolioPatterns)),
          },
          pitches: Array.isArray(parsed.pitches)
            ? parsed.pitches.map((p: Partial<PitchEntry>) => ({
                ...p,
                amount: Math.max(0, Math.min(10_000_000, Number.isFinite(Number(p.amount)) ? Number(p.amount) : 0)),
              }))
            : [],
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

const verdictColor = (v: string) =>
  v === 'great' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v === 'good' ? 'bg-sky-500/15 text-sky-700 border-sky-500/30' :
  v === 'skip' ? 'bg-destructive/15 text-destructive border-destructive/30' :
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
          onChange={(e) => {
            const parsed = safeNum(e.target.value, 0);
            onChange(Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min, parsed)));
          }}
          className={suffix ? 'pr-8' : undefined} />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function PartnerEconomicsCard({ project }: { project: PatternProject }) {
  const { toast } = useToast();
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const partnerCopy = PARTNER_COPY[language];
  const projectId = project.id || '';
  const [stored, setStored] = useState<StoredPartner>(() => loadStored(projectId));

  useEffect(() => {
    if (projectId) localStorage.setItem(STORAGE_KEY + projectId, JSON.stringify(stored));
  }, [stored, projectId]);

  const patchOffer = useCallback((patch: Partial<DealOffer>) =>
    setStored((s) => ({ ...s, offer: { ...s.offer, ...patch } })), []);
  const patchPitch = useCallback((patch: Partial<PitchInput>) =>
    setStored((s) => ({ ...s, pitch: { ...s.pitch, ...patch } })), []);
  const setPitches = useCallback((pitches: PitchEntry[]) =>
    setStored((s) => ({ ...s, pitches })), []);

  const result = useMemo(() => analyzePartnerDeal(stored.offer), [stored.offer]);
  const pitchResult = useMemo(() => scorePitch(stored.pitch), [stored.pitch]);
  const pipeline = useMemo(() => summarizePipeline(stored.pitches), [stored.pitches]);

  const copy = async (text: string) => {
    try {
      await copyTextOrThrow(text);
      toast({ title: partnerCopy.copied });
    } catch {
      toast({ title: getToastCopy(language).copyFailedSelectManually });
    }
  };

  const addPitch = () => {
    const id = `p-${Date.now()}`;
    setPitches([{
      id,
      company: '',
      dealType: stored.offer.dealType,
      status: 'draft',
      dueDate: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
      amount: stored.offer.dealType === 'lumpSum' ? stored.offer.offeredAmount : 0,
      notes: '',
    }, ...stored.pitches]);
    toast({ title: partnerCopy.added });
  };

  const updatePitch = (id: string, patch: Partial<PitchEntry>) =>
    setPitches(stored.pitches.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const removePitch = (id: string) =>
    setPitches(stored.pitches.filter((p) => p.id !== id));

  const contractText = useMemo(() => {
    const o = stored.offer;
    const lines = [
      'PARTNERSHIP AGREEMENT — SIGNED CHECKLIST',
      '',
      'Company: ______________________',
      'Designer: ______________________ (retains rights per agreement)',
      'Deal type: ' + DEAL_LABELS[o.dealType],
      'Rights grant: ' + RIGHTS_LABELS[o.rights],
      o.dealType === 'idpListing' ? `Platform fee: ${o.idpFeePct}% of each pattern sale (15% is the market norm — push for less)` : '',
      o.exclusivityMonths > 0 ? `Exclusivity window: ${o.exclusivityMonths} months, then all rights revert to the designer` : '',
      `Payment: ${fmt$(o.offeredAmount)}${o.yarnValue > 0 ? ` + yarn support (~${fmt$(o.yarnValue)})` : ''}`,
      `Designer-paid production costs (tech edit, photography, sample finishing): ${fmt$(o.productionCost)}`,
      'Deliverables owed to the company:',
      ...Array.from({ length: Math.max(1, o.deliverablesCount) }, (_, i) => `  ${i + 1}. ______________________ (format + deadline)`),
      '',
      'Signed terms to attach:',
      ...CONTRACT_CHECKLIST.map((c) => `  ☐ ${c}`),
      '',
      `Nullification clause: if the company goes dark for 60+ days, all rights and listings revert to the designer.`,
    ];
    return lines.filter((l) => l !== '').join('\n');
  }, [stored.offer]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Handshake className="h-4 w-4" /> {partnerCopy.title}
        </CardTitle>
        <CardDescription>
                    {partnerCopy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deal type + rights */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="partner-deal" className="text-xs">{partnerCopy.dealType}</Label>
            <Select value={stored.offer.dealType}
              onValueChange={(v) => patchOffer({ dealType: v as DealType })}>
              <SelectTrigger id="partner-deal"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(DEAL_LABELS) as DealType[]).map((d) => (
                  <SelectItem key={d} value={d}>{DEAL_LABELS[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="partner-rights" className="text-xs">{partnerCopy.rights}</Label>
            <Select value={stored.offer.rights}
              onValueChange={(v) => patchOffer({ rights: v as RightsGrant })}>
              <SelectTrigger id="partner-rights"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(RIGHTS_LABELS) as RightsGrant[]).map((r) => (
                  <SelectItem key={r} value={r}>{RIGHTS_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Offer numbers */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumField id="partner-fee" label={partnerCopy.offeredFee} value={stored.offer.offeredAmount}
              onChange={(n) => patchOffer({ offeredAmount: n })} suffix="$" />
            {stored.offer.dealType === 'idpListing' && (
              <NumField id="partner-idp-fee" label={partnerCopy.companyCut} value={stored.offer.idpFeePct}
                min={0} max={100} onChange={(n) => patchOffer({ idpFeePct: Math.min(100, n) })} suffix="%" />
            )}
            {stored.offer.exclusivityMonths > 0 && (
              <NumField id="partner-excl" label={partnerCopy.exclusivity} value={stored.offer.exclusivityMonths}
                min={0} max={36} onChange={(n) => patchOffer({ exclusivityMonths: n })} suffix="mo" />
            )}
            {stored.offer.dealType === 'lysDayExclusive' && (
              <NumField id="partner-window" label={partnerCopy.exclusiveWindow} value={stored.offer.lysDayWindowDays}
                min={0} max={180} onChange={(n) => patchOffer({ lysDayWindowDays: n })} suffix="days" />
            )}
            {stored.offer.dealType === 'kalHost' && (
              <NumField id="partner-followers" label={partnerCopy.reach} value={stored.offer.kalfollowers}
                onChange={(n) => patchOffer({ kalfollowers: n })} suffix="followers" />
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumField id="partner-price" label={partnerCopy.patternPrice} value={stored.offer.patternPrice}
              min={0} step={0.5} onChange={(n) => patchOffer({ patternPrice: n })} suffix="$" />
            <NumField id="partner-units" label={partnerCopy.expectedSales}
              value={stored.offer.expectedUnitSales12m} onChange={(n) => patchOffer({ expectedUnitSales12m: n })} />
            <NumField id="partner-yarn" label={partnerCopy.yarnSupport} value={stored.offer.yarnValue}
              onChange={(n) => patchOffer({ yarnValue: n })} suffix="$" />
            <NumField id="partner-reach" label={partnerCopy.marketingReach} value={stored.offer.marketingReach}
              min={0} max={100} onChange={(n) => patchOffer({ marketingReach: Math.min(100, n) })} suffix="/100" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NumField id="partner-prod" label={partnerCopy.productionCost} value={stored.offer.productionCost}
              onChange={(n) => patchOffer({ productionCost: n })} suffix="$" />
            <NumField id="partner-hours" label={partnerCopy.hours} value={stored.offer.hoursWorked}
              min={1} onChange={(n) => patchOffer({ hoursWorked: Math.max(1, n) })} suffix="hrs" />
            <NumField id="partner-deliv" label={partnerCopy.deliverables} value={stored.offer.deliverablesCount}
              min={0} onChange={(n) => patchOffer({ deliverablesCount: n })} />
            <div className="space-y-1.5">
              <Label className="text-xs">{partnerCopy.locked}</Label>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={stored.offer.exclusiveListed}
                  onCheckedChange={(c) => patchOffer({ exclusiveListed: c })} />
                <span className="text-xs text-muted-foreground">
                  {stored.offer.exclusiveListed
                    ? partnerCopy.lockedYes
                    : partnerCopy.lockedNo}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Knit Picks IDP keeps a flat 15%; Who Pays Knitters records accessory design rates of
            $40–${WPK_ACCESSORY_RATE_AVG > 0 ? WPK_ACCESSORY_RATE_AVG : 246} (avg $246); marketplace baseline nets
            {MARKETPLACE_FEE_PCT}% in fees. Production costs (tech edit, photography, sample finishing) are
            usually yours in every model except yarn support.
          </p>
        </div>

        {/* Verdict */}
        <div className={`rounded-lg border p-4 ${verdictColor(result.verdict)}`}>
          <Badge className={`${verdictColor(result.verdict)} border uppercase`}>{result.verdict}</Badge>
          <p className="text-sm mt-2">{result.verdictNote}</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{partnerCopy.cash}</div>
            <div className="text-2xl font-bold">{fmt$(result.cashValue)}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{partnerCopy.runway}</div>
            <div className="text-2xl font-bold">{fmt$(result.platformNetSelfPublish)}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{partnerCopy.surrendered}</div>
            <div className={`text-2xl font-bold ${result.rightsPenalty > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {fmt$(result.rightsPenalty)}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground">{partnerCopy.hourly}</div>
            <div className={`text-2xl font-bold ${result.effectiveHourly >= 30 ? 'text-emerald-600' : result.effectiveHourly < 0 ? 'text-destructive' : 'text-amber-600'}`}>
              {fmt$(result.effectiveHourly)}
            </div>
          </div>
        </div>

        {/* Red flags */}
        {result.redFlags.length > 0 && (
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Red flags — YP-01 to YP-06
            </div>
            {result.redFlags.map((f) => (
              <div key={f.code} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm flex items-start gap-2">
                <Badge variant="outline" className="shrink-0 mt-0.5">{f.code}</Badge>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Contract checklist */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Signed-agreement checklist
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-xs whitespace-pre-line font-mono">
              {contractText}
            </div>
            <Button variant="outline" size="sm" onClick={() => copy(contractText)}>
              <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" /> Copy agreement draft
            </Button>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Handshake className="h-4 w-4" /> Pitch readiness
            </div>
            <div className={`rounded-lg border p-4 ${
              pitchResult.score >= 80 ? 'border-emerald-500/30 bg-emerald-500/10' :
              pitchResult.score >= 50 ? 'border-amber-500/30 bg-amber-500/10' :
              'border-destructive/30 bg-destructive/10'}`}>
              <div className="text-2xl font-bold">{pitchResult.score}<span className="text-sm text-muted-foreground">/100</span></div>
              <p className="text-xs text-muted-foreground mt-1">
                {pitchResult.score >= 80 ? 'Send-ready — dyers want the idea, the yarn spec, and your timeline in the first email.' :
                 pitchResult.score >= 50 ? 'Half-ready — sketch swatches and a timeline lift response rates sharply.' :
                 'Too early — build the brief and 3+ portfolio patterns before pitching.'}
              </p>
            </div>
            <div className="space-y-1.5">
              {([
                ['hasConceptBrief', 'Concept brief (the design idea, not a yarn request)'],
                ['hasSketches', 'Sketches / swatch photos'],
                ['hasYarnSpec', 'Yarn spec (weight, fiber, color theme)'],
                ['hasTimeline', 'Timeline (yarn needed-by + release date)'],
                ['hasMarketingPlan', 'Marketing plan (what you post, when, to whom)'],
                ['hasAudienceStats', 'Audience stats (list size, followers)'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={stored.pitch[key]}
                    onCheckedChange={(c) => patchPitch({ [key]: c } as Partial<PitchInput>)} />
                  {label}
                </label>
              ))}
              <NumField id="partner-portfolio" label={ls.publishedPatternsPortfolio}
                value={stored.pitch.portfolioPatterns} onChange={(n) => patchPitch({ portfolioPatterns: n })} />
            </div>
            {pitchResult.gaps.length > 0 && (
              <div className="space-y-1">
                {pitchResult.gaps.map((g, i) => (
                  <div key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs">{g}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pipeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Package className="h-4 w-4" /> Pitch pipeline
            </div>
            <Button variant="outline" size="sm" onClick={addPitch}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add pitch
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground">Open pitches</div>
              <div className="text-xl font-bold">{pipeline.open.length}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground">Cash in flight</div>
              <div className="text-xl font-bold">{fmt$(pipeline.cashInFlight)}</div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarClock className="h-3 w-3" /> Avg days to deadline
              </div>
              <div className="text-xl font-bold">{pipeline.avgDaysToDeadline > 0 ? pipeline.avgDaysToDeadline.toFixed(0) : '—'}</div>
            </div>
          </div>
          {stored.pitches.length > 0 && (
            <div className="grid gap-2">
              {stored.pitches.map((p) => (
                <div key={p.id} className="rounded-lg border bg-muted/30 px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input value={p.company}
                      onChange={(e) => updatePitch(p.id, { company: e.target.value })}
                      placeholder={ls.partnerCompanyDyerShop} className="h-8 min-h-11 text-sm" />
                    <Select value={p.status} onValueChange={(v) => updatePitch(p.id, { status: v as PitchStatus })}>
                      <SelectTrigger className="h-8 min-h-11 w-36 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PITCH_STATUS_LABELS) as PitchStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{PITCH_STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 min-h-11 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removePitch(p.id)} aria-label={ls.removePitch}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={p.dueDate}
                      onChange={(e) => updatePitch(p.id, { dueDate: e.target.value })}
                      className="h-8 text-sm" aria-label={ls.dueDate} />
                    <NumField id={`pitch-amount-${p.id}`} label={ls.amountDollars} value={p.amount} min={0}
                      onChange={(n) => updatePitch(p.id, { amount: n })} suffix="$" />
                  </div>
                  <Textarea value={p.notes}
                    onChange={(e) => updatePitch(p.id, { notes: e.target.value })}
                    placeholder={ls.partnerNotesPlaceholder}
                    className="text-sm min-h-14" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event note */}
        {result.annualEventNote && (
          <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm flex items-start gap-2">
            <CalendarClock className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{result.annualEventNote}</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {result.pitchGaps.map((g) => `· ${g}`).join('  ')}
        </p>
      </CardContent>
    </Card>
  );
}
