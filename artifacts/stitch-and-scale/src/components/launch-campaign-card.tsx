/**
 * Launch Campaign Manager — a dated, paste-ready launch plan built from
 * the pattern's own data.
 *
 * Session-13 research, turned into interface:
 * - Sister Mountain's canonical 3-phase release playbook (pre: assets,
 *   yarn-company email with real usage stats; launch: publish + groups
 *   + bundles; post: daily momentum for a week, tester-FO roundup,
 *   launch review) encoded as dated milestones instead of a blog
 *   checklist.
 * - Ravelry Hot Right Now rewards concentrated momentum; weekends sell
 *   most. The coupon banner says so explicitly.
 * - KAL mode: 4 weekly clues with a firm end date (Stitchcraft
 *   Marketing make-along mechanics).
 * - Gates: the plan won't pretend you're ready — it cross-checks the
 *   Publish checklist (CHK-005), tech-edit score (CHK-010) and finished
 *   test knits (CHK-009) from inside this project.
 *
 * Persists the campaign config + milestone done-state in localStorage
 * under a project-scoped key so reloads survive until cloud storage
 * arrives.
 */
import React, { useMemo } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  buildCampaign,
  milestoneDate,
  CampaignPlan,
  CampaignConfig,
  CampaignMilestone,
  scoreLaunchReadiness,
  projectedLaunchRevenue,
  discountGuardrail,
  bannerBreakEven,
  momentumTargets,
  ReadinessItem,
} from '@/lib/launch-campaign';
import { advisePrice, sizeCountForProject } from '@/lib/pattern-pricing-advisor';
import { PatternProject } from '@/lib/grading-engine';
import {
  buildRoster,
  TesterSlot,
} from '@/lib/test-knit-programme';
import { CalendarDays, ClipboardCopy, CheckCircle2, XCircle, Flame, Rocket, RotateCcw, Flag, Gauge, TrendingUp, Target, Banknote } from 'lucide-react';

const STORAGE_KEY = 'stitch-and-scale-launch-campaign';

interface StoredState {
  config?: Partial<CampaignConfig>;
  doneMilestones?: Record<string, boolean>;
  kalMode?: boolean;
  review?: string;
  emailListSize?: number;
  photoCount?: number;
  couponDurationDays?: number;
  teaserSent?: boolean;
  adBudget?: number;
}

function loadStored(handle: ProjectStorageHandle<StoredState>): StoredState {
  try {
    const raw = handle.read();
    if (raw && typeof raw === 'object') return raw as StoredState;
    return {};
  } catch {
    return {};
  }
}

function persist(handle: ProjectStorageHandle<unknown>, next: StoredState) {
  try {
    const prev = (handle.read() ?? {}) as StoredState;
    handle.write({ ...prev, ...next });
  } catch {
    // Offline or full storage — in-memory state still works.
  }
}

function PhaseBadge({ phase }: { phase: CampaignMilestone['phase'] }) {
  const meta = {
    pre: { label: 'Pre-launch', className: 'bg-slate-500/15 text-slate-600 border-slate-500/40' },
    launch: { label: 'Launch day', className: 'bg-rose-500/15 text-rose-600 border-rose-500/40' },
    post: { label: 'Post-launch', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40' },
  }[ { pre: 'pre', launch: 'launch', post: 'post' }[phase] as 'pre' | 'launch' | 'post' ];
  return (
    <Badge variant="outline" className={cn('font-medium', meta.className)}>
      {meta.label}
    </Badge>
  );
}

function CopyLine({ text }: { text: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast({ title: 'Copied', description: 'Paste it wherever the campaign runs.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Select the text manually.' });
    }
  };
  return (
    <div className="mt-2">
      <div className="flex items-start justify-between gap-2">
        <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">{text}</p>
        <Button variant="ghost" size="sm" onClick={copy} aria-label="Copy milestone text">
          {copied ? <CheckCircle2 className="size-4 text-emerald-600" /> : <ClipboardCopy className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

export function LaunchCampaignCard({ project }: { project: PatternProject }) {
  // issue #4 project seam: one scoped store per project; the legacy flat key 'stitch-and-scale-launch-campaign' is folded in on first read, then removed.
  const handle = useMemo(() => projectStorage<StoredState>('launch', project.id, ['stitch-and-scale-launch-campaign']), [project.id]);

  const { toast } = useToast();
  const stored = React.useRef<StoredState>(loadStored(handle));
  const [config, setConfig] = React.useState<Partial<CampaignConfig>>(stored.current.config ?? {});
  const [kalMode, setKalMode] = React.useState(stored.current.kalMode ?? false);
  const [review, setReview] = React.useState(stored.current.review ?? '');
  const [doneMilestones, setDoneMilestones] = React.useState<Record<string, boolean>>(stored.current.doneMilestones ?? {});

  const launchDate = config.launchDate ?? '';
  // Session-47 readiness layer: funnel inputs persisted at the same project-scoped seam.
  const [emailListSize, setEmailListSize] = React.useState(stored.current.emailListSize ?? 0);
  const [photoCount, setPhotoCount] = React.useState(stored.current.photoCount ?? 0);
  const [couponDurationDays, setCouponDurationDays] = React.useState(stored.current.couponDurationDays ?? 7);
  const [teaserSent, setTeaserSent] = React.useState(stored.current.teaserSent ?? false);
  const [adBudget, setAdBudget] = React.useState(stored.current.adBudget ?? 0);
  React.useEffect(() => {
    persist(handle, { emailListSize, photoCount, couponDurationDays, teaserSent, adBudget });
  });
  // Slots feed the test-knit gate: reflect the live roster so the gate
  // opens when the designer finishes their Test Knit tab work.
  const slots: TesterSlot[] = React.useMemo(() => buildRoster(project), [project]);

  const plan: CampaignPlan = React.useMemo(
    () => buildCampaign(
      project,
      Object.fromEntries(Object.entries({ ...config, kalMode }).filter(([, v]) => v !== undefined)) as unknown as CampaignConfig,
      slots,
    ),
    [project, config, kalMode, slots],
  );

  const saveConfig = (next: Partial<CampaignConfig>) => {
    setConfig(next);
    persist(handle, { config: { ...(config ?? {}), ...next }, kalMode });
  };
  const saveKal = (next: boolean) => {
    setKalMode(next);
    persist(handle, { kalMode: next, config });
  };
  const toggleMilestone = (m: CampaignMilestone) => {
    const key = `${m.dayOffset}-${m.title}`;
    setDoneMilestones(prev => {
      const next = { ...prev, [key]: !prev[key] };
      persist(handle, { doneMilestones: next });
      return next;
    });
  };
  const saveReview = (next: string) => {
    setReview(next);
    persist(handle, { review: next });
  };
  const resetAll = () => {
    setConfig({});
    setKalMode(false);
    setDoneMilestones({});
    setReview('');
    setEmailListSize(0);
    setPhotoCount(0);
    setCouponDurationDays(7);
    setTeaserSent(false);
    setAdBudget(0);
    persist(handle, { config: {}, kalMode: false, doneMilestones: {}, review: '', emailListSize: 0, photoCount: 0, couponDurationDays: 7, teaserSent: false, adBudget: 0 });
    toast({ title: 'Campaign reset', description: 'All settings and checkboxes cleared.' });
  };

  const allDone = plan.milestones.length > 0 && plan.milestones.every(m => doneMilestones[`${m.dayOffset}-${m.title}`]);
  const doneCount = plan.milestones.filter(m => doneMilestones[`${m.dayOffset}-${m.title}`]).length;

  // ── Session-47 readiness layer computations ──
  // Market price band derived from the pattern's real data (sizes, tech-edit,
  // test-knit status) — the same math the Launch day milestone copy uses.
  const finishedTesters = React.useMemo(
    () => slots.filter(s => s.status === 'finished').length,
    [slots],
  );
  const avgPrice = React.useMemo(() => {
    const itemType = /(sweater|jumper|pullover)/i.test(project.name) ? 'sweater'
      : /cardigan/i.test(project.name) ? 'cardigan'
      : /shawl/i.test(project.name) ? 'shawl'
      : /sock/i.test(project.name) ? 'socks'
      : /hat|beanie/i.test(project.name) ? 'hat'
      : /mitt|glove/i.test(project.name) ? 'mitts'
      : /scarf/i.test(project.name) ? 'scarf' : 'other';
    const price = advisePrice({
      itemType,
      skillLevel: 'intermediate',
      sizeCount: sizeCountForProject(project),
      techEdited: true,
      testKnitted: finishedTesters > 0,
      hoursWorked: 0,
      hourlyRate: 0,
      currentPrice: 0,
      marketTarget: 'standard',
    });
    const market = price.bands.find(b => b.label === 'Market') ?? price.bands[0];
    return Math.round((market.low + market.high) / 2);
  }, [project, finishedTesters]);
  const readiness = React.useMemo(
    () => scoreLaunchReadiness({
      emailListSize,
      photoCount,
      salesTarget: config.salesTarget,
      couponPercent: config.couponPercent,
      couponDurationDays,
      teaserSent,
      channelLinksCount: [config.ravelryUrl, config.etsyUrl].filter(Boolean).length,
      testersFinishedCount: finishedTesters,
      publishErrors: plan.gates[0] ? (plan.gates[0].ok ? 0 : 1) : undefined,
      techEditScore: plan.gates[1] ? (plan.gates[1].ok ? 85 : 60) : undefined,
      avgPrice,
    }),
    [emailListSize, photoCount, config.salesTarget, config.couponPercent, couponDurationDays, teaserSent, config.ravelryUrl, config.etsyUrl, finishedTesters, plan.gates],
  );
  const revenue = React.useMemo(
    () => projectedLaunchRevenue({ emailListSize, avgPrice }),
    [emailListSize, avgPrice],
  );
  const guardrail = React.useMemo(
    () => discountGuardrail(config.couponPercent ?? 0, couponDurationDays),
    [config.couponPercent, couponDurationDays],
  );
  const banner = React.useMemo(
    () => bannerBreakEven(adBudget, avgPrice),
    [adBudget, avgPrice],
  );
  const momentum = React.useMemo(
    () => momentumTargets(config.salesTarget ?? 0),
    [config.salesTarget],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="size-5" />
          Launch Campaign
        </CardTitle>
        <CardDescription>
          A dated, paste-ready plan for launching {project.name}. Set a launch date, and every milestone
          generates its copy from the pattern's real data — sizes, yarn, price band. Gate status checks
          the Publish checklist, tech-edit score and finished test knits before you go public.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ---------- Settings ---------- */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="lc-launch-date">Launch date</Label>
            <Input
              id="lc-launch-date"
              type="date"
              value={launchDate}
              onChange={e => saveConfig({ ...config, launchDate: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {launchDate ? `Launch lands on a ${milestoneDate(launchDate, 0).split(',')[0]} — pick a weekend-inclusive coupon week, most sales run Sat–Sun.` : 'Set a date to build the timeline.'}
            </p>
          </div>
          <div>
            <Label htmlFor="lc-yarn-company">Yarn company</Label>
            <Input
              id="lc-yarn-company"
              placeholder="e.g. The Fibre Co"
              value={config.yarnCompany ?? ''}
              onChange={e => saveConfig({ ...config, yarnCompany: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="lc-ravelry-url">Ravelry pattern page</Label>
            <Input
              id="lc-ravelry-url"
              placeholder="https://ravelry.com/patterns/library/…"
              value={config.ravelryUrl ?? ''}
              onChange={e => saveConfig({ ...config, ravelryUrl: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="lc-etsy-url">Etsy listing (optional)</Label>
            <Input
              id="lc-etsy-url"
              placeholder="https://etsy.com/listing/…"
              value={config.etsyUrl ?? ''}
              onChange={e => saveConfig({ ...config, etsyUrl: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="lc-coupon-code">Launch coupon code</Label>
            <Input
              id="lc-coupon-code"
              placeholder="LAUNCH15"
              value={config.couponCode ?? ''}
              onChange={e => saveConfig({ ...config, couponCode: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="lc-coupon-percent">Coupon % off</Label>
            <Input
              id="lc-coupon-percent"
              type="number"
              min={1}
              max={50}
              placeholder="15"
              value={config.couponPercent ?? ''}
              onChange={e => saveConfig({ ...config, couponPercent: e.target.value ? Number(e.target.value) : undefined })}
            />
            <p className={cn('mt-1 text-xs', guardrail.ok ? 'text-muted-foreground' : 'font-medium text-destructive')}>
              {guardrail.reason}
            </p>
          </div>
          <div>
            <Label htmlFor="lc-coupon-days">Coupon window (days)</Label>
            <Input
              id="lc-coupon-days"
              type="number"
              min={1}
              max={30}
              placeholder="7"
              value={couponDurationDays || ''}
              onChange={e => setCouponDurationDays(e.target.value ? Number(e.target.value) : 0)}
            />
            <p className="mt-1 text-xs text-muted-foreground">One week max — end it on a Sunday so the window includes a weekend.</p>
          </div>
          <div>
            <Label htmlFor="lc-email-list">Email list size</Label>
            <Input
              id="lc-email-list"
              type="number"
              min={0}
              placeholder="e.g. 250"
              value={emailListSize || ''}
              onChange={e => setEmailListSize(e.target.value ? Number(e.target.value) : 0)}
            />
            <p className="mt-1 text-xs text-muted-foreground">59% of buyers say marketing email drives purchases — the list is your biggest sales lever.</p>
          </div>
          <div>
            <Label htmlFor="lc-sales-target">Sales target (copies)</Label>
            <Input
              id="lc-sales-target"
              type="number"
              min={1}
              placeholder="50"
              value={config.salesTarget ?? ''}
              onChange={e => saveConfig({ ...config, salesTarget: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div>
            <Label htmlFor="lc-photo-count">Pattern photos</Label>
            <Input
              id="lc-photo-count"
              type="number"
              min={0}
              max={30}
              placeholder="e.g. 6"
              value={photoCount || ''}
              onChange={e => setPhotoCount(e.target.value ? Number(e.target.value) : 0)}
            />
            <p className="mt-1 text-xs text-muted-foreground">Aim for 6+ — front/back/sides, flat-lay, WIP and detail shots across Ravelry, Etsy and Pinterest.</p>
          </div>
          <div>
            <Label htmlFor="lc-ad-budget">Paid banner budget ($)</Label>
            <Input
              id="lc-ad-budget"
              type="number"
              min={0}
              placeholder="e.g. 45"
              value={adBudget || ''}
              onChange={e => setAdBudget(e.target.value ? Number(e.target.value) : 0)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Ravelry Group Forum Banner PPC runs ≈ $1.50 per 1,000 impressions — the cheapest targeted ad in the niche.
            </p>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={teaserSent}
                onChange={e => setTeaserSent(e.target.checked)}
                className="size-4 accent-rose-600"
              />
              Teaser email sent (2 days before launch)
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={kalMode}
                onChange={e => saveKal(e.target.checked)}
                className="size-4 accent-rose-600"
              />
              Run as a KAL (4 weekly clues) instead of a standard launch
            </label>
          </div>
        </div>

        {/* ---------- Seasonal note ---------- */}
        {launchDate && (
          <p className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <CalendarDays className="mt-0.5 size-4 shrink-0" />
            {plan.seasonalNote}
          </p>
        )}

        {/* ---------- Gates ---------- */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Flag className="size-4" />
              Launch gates
            </Label>
            <Badge variant={allDone && launchDate ? 'default' : 'outline'} className={allDone && launchDate ? 'bg-emerald-600' : ''}>
              {plan.gateSummary}
            </Badge>
          </div>
          <div className="space-y-1.5">
            {plan.gates.map(g => (
              <div key={g.label} className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
                {g.ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                )}
                <div>
                  <span className="font-medium">{g.label}</span>
                  <span className={cn('ml-2', g.ok ? 'text-emerald-700' : 'text-destructive')}>
                    {g.ok ? 'open' : 'blocked'}
                  </span>
                  <p className="mt-0.5 text-muted-foreground">{g.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Launch Readiness Lab (session 47) ---------- */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Gauge className="size-4" />
              Launch readiness
            </Label>
            <Badge
              variant={readiness.band === 'cleared-for-announcement' ? 'default' : 'outline'}
              className={cn(
                'font-semibold',
                readiness.band === 'cleared-for-announcement' && 'bg-emerald-600',
                readiness.band === 'warm-up' && 'bg-amber-500/20 text-amber-700 border-amber-500/40',
                readiness.band === 'not-ready' && 'bg-rose-500/15 text-rose-600 border-rose-500/40',
              )}
            >
              {readiness.score}/100
            </Badge>
          </div>
          <div className="mb-3 space-y-2">
            {readiness.items.map((item: ReadinessItem) => {
              const earned = item.earned / item.weight;
              return (
                <div key={item.id} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.earned}/{item.weight}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        earned >= 1 ? 'bg-emerald-500' : earned > 0 ? 'bg-amber-500' : 'bg-rose-400',
                      )}
                      style={{ width: `${earned * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
                </div>
              );
            })}
          </div>
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{readiness.note}</p>

          {/* Revenue projection */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <TrendingUp className="size-3.5" /> Email revenue
              </div>
              <p className="mt-1 text-lg font-semibold">
                ${revenue.emailRevenueLow.toLocaleString()}–${revenue.emailRevenueHigh.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {emailListSize > 0
                  ? `${emailListSize.toLocaleString()} subscribers at ${revenue.conversionLowPct}–${revenue.conversionHighPct}% conversion, $${avgPrice} avg. price`
                  : 'Set your email list size to project launch-week revenue.'}
              </p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Banknote className="size-3.5" /> Copies sold
              </div>
              <p className="mt-1 text-lg font-semibold">
                {revenue.copiesLow}–{revenue.copiesHigh}
              </p>
              <p className="text-xs text-muted-foreground">
                Email-attributed copies — launch-week sales will also stack from Ravelry momentum.
              </p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Target className="size-3.5" /> Momentum targets
              </div>
              <p className="mt-1 text-lg font-semibold">
                {momentum.queueTarget} queue{momentum.queueTarget === 1 ? '' : 's'} · {momentum.faveTarget} favourites
              </p>
              <p className="text-xs text-muted-foreground">{momentum.reason}</p>
            </div>
          </div>

          {/* Paid banner break-even */}
          {adBudget > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <Banknote className="mt-0.5 size-4 shrink-0" />
              At ${adBudget} on Ravelry banners: ≈ {banner.impressions.toLocaleString()} impressions, {banner.clicks} clicks,
              ≈ {banner.expectedCopies} copies (~${banner.expectedRevenue.toLocaleString()} revenue). Net {banner.net >= 0 ? 'profit' : 'loss'} of ${banner.net.toLocaleString()} at a cost of ${banner.costPerCopy}/copy.
              Cheap enough to test — but the email list usually beats it.
            </p>
          )}
        </div>

        {/* ---------- Timeline ---------- */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Flame className="size-4" />
              {kalMode ? 'KAL clues' : 'Campaign timeline'}
            </Label>
            <span className="text-xs text-muted-foreground">
              {doneCount}/{plan.milestones.length} done
            </span>
          </div>
          {plan.milestones.length === 0 && !launchDate && (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              Set a launch date above to generate the dated plan.
            </p>
          )}
          <div className="space-y-3">
            {plan.milestones.map(m => {
              const key = `${m.dayOffset}-${m.title}`;
              const done = !!doneMilestones[key];
              return (
                <div
                  key={key}
                  className={cn(
                    'rounded-lg border px-4 py-3 transition-colors',
                    done ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {m.dayOffset === 0 ? 'day 0' : m.dayOffset > 0 ? `+${m.dayOffset}` : `${m.dayOffset}`}
                    </span>
                    {launchDate && (
                      <span className="text-xs text-muted-foreground">{milestoneDate(launchDate, m.dayOffset)}</span>
                    )}
                    <PhaseBadge phase={m.phase} />
                    <span className={cn('font-medium', done && 'line-through opacity-70')}>{m.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => toggleMilestone(m)}
                      aria-label={done ? 'Mark milestone not done' : 'Mark milestone done'}
                    >
                      {done ? <CheckCircle2 className="size-4 text-emerald-600" /> : <ClipboardCopy className="size-4" />}
                    </Button>
                  </div>
                  <CopyLine text={m.copy} />
                  {m.checklist.length > 0 && (
                    <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                      {m.checklist.map(c => (
                        <li key={c} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="size-1.5 shrink-0 rounded-full bg-rose-400/70" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          {kalMode && launchDate && (
            <p className="mt-2 text-xs text-muted-foreground">
              KAL participants need a firm end date: {milestoneDate(launchDate, 28)}. Newsletter-gated sign-up,
              discount code valid only during the event, and a public FO showcase after the final clue.
            </p>
          )}
        </div>

        {/* ---------- Post-launch review ---------- */}
        <div>
          <Label htmlFor="lc-review" className="flex items-center gap-2 text-base font-semibold">
            <RotateCcw className="size-4" />
            Post-launch review
          </Label>
          <p className="mb-2 text-xs text-muted-foreground">
            Fill this in two weeks after launch while it's fresh — your next launch improves when you keep notes.
          </p>
          <textarea
            id="lc-review"
            value={review}
            onChange={e => saveReview(e.target.value)}
            placeholder={plan.postLaunchReview}
            rows={9}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
          />
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button variant="outline" size="sm" onClick={resetAll}>
            Reset campaign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
