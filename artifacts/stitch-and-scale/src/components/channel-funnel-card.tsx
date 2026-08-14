import { useMemo, useState, useEffect } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCopy, Send, Megaphone, Mail, TrendingUp } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  analyzeChannel,
  analyzeFunnel,
  defaultChannelDeal,
  defaultFunnelInput,
  generateBoxPitch,
  CHANNEL_TYPE_LABELS,
  ChannelDeal,
  FunnelInput,
} from '@/lib/channel-funnel-planner';

const STORAGE_KEY = 'kskchannels-v1';

interface StoredChannel {
  showPitch: boolean;
  showFunnel: boolean;
  channel: ChannelDeal;
  funnel: FunnelInput;
  pitch: {
    designerName: string;
    patternName: string;
    boxName: string;
    feeAsk: number;
    exclusivityAskMonths: number;
    insertPromise: boolean;
  };
}

function defaultChannel(): StoredChannel {
  return {
    showPitch: false,
    showFunnel: false,
    channel: defaultChannelDeal(),
    funnel: defaultFunnelInput(),
    pitch: {
      designerName: '',
      patternName: '',
      boxName: '',
      feeAsk: 200,
      exclusivityAskMonths: 3,
      insertPromise: true,
    },
  };
}

function loadStored(handle: ProjectStorageHandle<StoredChannel>): StoredChannel {
  try {
    const parsed = handle.read();
    if (parsed) {
      if (parsed && parsed.channel) {
        return {
          ...defaultChannel(),
          ...parsed,
          channel: { ...defaultChannelDeal(), ...parsed.channel },
          funnel: { ...defaultFunnelInput(), ...parsed.funnel },
          pitch: { ...defaultChannel().pitch, ...parsed.pitch },
        };
      }
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return defaultChannel();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function ChannelFunnelCard({ project }: { project: PatternProject }) {
  // issue #4 project seam: one scoped store per project; the legacy flat key 'kskchannels-v1' is folded in on first read, then removed.
  const handle = useMemo(() => projectStorage<StoredChannel>('channels', project.id, ['kskchannels-v1']), [project.id]);
  const { toast } = useToast();
  const [stored, setStored] = useState(() => loadStored(handle));

  useEffect(() => {
    handle.write(stored);
  }, [stored]);

  const channel = useMemo(() => analyzeChannel(stored.channel), [stored.channel]);
  const funnel = useMemo(() => analyzeFunnel(stored.funnel), [stored.funnel]);
  const pitch = useMemo(
    () =>
      generateBoxPitch({
        designerName: stored.pitch.designerName || 'an independent designer',
        patternName: stored.pitch.patternName || project.name || 'a new pattern',
        boxName: stored.pitch.boxName || 'your box',
        audienceReach: stored.channel.audienceReach,
        feeAsk: stored.pitch.feeAsk,
        exclusivityAskMonths: stored.pitch.exclusivityAskMonths,
        insertPromise: stored.pitch.insertPromise,
      }),
    [stored.pitch, stored.channel.audienceReach, project.name]
  );

  const setChannel = (patch: Partial<ChannelDeal>) => setStored((s) => ({ ...s, channel: { ...s.channel, ...patch } }));
  const setFunnel = (patch: Partial<FunnelInput>) => setStored((s) => ({ ...s, funnel: { ...s.funnel, ...patch } }));
  const setPitch = (patch: Partial<StoredChannel['pitch']>) => setStored((s) => ({ ...s, pitch: { ...s.pitch, ...patch } }));

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Select and copy manually' });
    }
  };

  const verdictColor =
    channel.verdict === 'go' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
    channel.verdict === 'no' ? 'bg-destructive/15 text-destructive border-destructive/30' :
    'bg-amber-500/15 text-amber-700 border-amber-500/30';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Channel &amp; Funnel Planner
        </CardTitle>
        <CardDescription>
          Price a subscription box, brand collab or magazine offer against what self-publishing would earn — and see
          whether your email list is turning pattern releases into real money. Boxes run on hard assembly dates and
          only ~10% of suppliers include a marketing insert; the funnel shows why release-week email does the heavy
          lifting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ---------------------------------------------------------------- */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Channel offer (box, brand, magazine)
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Channel type</Label>
              <Select
                value={stored.channel.type}
                onValueChange={(v) => setChannel({ type: v as ChannelDeal['type'] })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CHANNEL_TYPE_LABELS) as ChannelDeal['type'][]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {CHANNEL_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-name">
                Channel name
              </Label>
              <Input
                id="cf-name"
                className="h-9"
                placeholder="e.g. The Wool Parcels"
                value={stored.channel.name}
                onChange={(e) => setChannel({ name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-fee">
                Design fee ($)
              </Label>
              <Input
                id="cf-fee"
                type="number"
                className="h-9"
                value={stored.channel.designFee}
                onChange={(e) => setChannel({ designFee: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-extras">
                Extras value ($)
              </Label>
              <Input
                id="cf-extras"
                type="number"
                className="h-9"
                value={stored.channel.extrasValue}
                onChange={(e) => setChannel({ extrasValue: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-excl">
                Exclusivity (months)
              </Label>
              <Input
                id="cf-excl"
                type="number"
                className="h-9"
                value={stored.channel.exclusivityMonths}
                onChange={(e) => setChannel({ exclusivityMonths: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-reach">
                Audience reach (subs)
              </Label>
              <Input
                id="cf-reach"
                type="number"
                className="h-9"
                value={stored.channel.audienceReach}
                onChange={(e) => setChannel({ audienceReach: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-visit">
                Visit your shop (%)
              </Label>
              <Input
                id="cf-visit"
                type="number"
                className="h-9"
                value={stored.channel.profileVisitPct}
                onChange={(e) => setChannel({ profileVisitPct: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-conv">
                Visitor conversion (%)
              </Label>
              <Input
                id="cf-conv"
                type="number"
                className="h-9"
                value={stored.channel.visitorConvertPct}
                onChange={(e) => setChannel({ visitorConvertPct: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-spend">
                Avg visitor spend ($)
              </Label>
              <Input
                id="cf-spend"
                type="number"
                className="h-9"
                value={stored.channel.visitorSpend}
                onChange={(e) => setChannel({ visitorSpend: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-effect">
                Effect runs (months)
              </Label>
              <Input
                id="cf-effect"
                type="number"
                className="h-9"
                value={stored.channel.effectMonths}
                onChange={(e) => setChannel({ effectMonths: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-baseline">
                Your baseline sales (units/mo)
              </Label>
              <Input
                id="cf-baseline"
                type="number"
                className="h-9"
                value={stored.channel.baselineSalesPerMonth}
                onChange={(e) => setChannel({ baselineSalesPerMonth: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-price">
                Pattern price ($)
              </Label>
              <Input
                id="cf-price"
                type="number"
                className="h-9"
                value={stored.channel.patternPrice}
                onChange={(e) => setChannel({ patternPrice: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-hours">
                Work hours
              </Label>
              <Input
                id="cf-hours"
                type="number"
                className="h-9"
                value={stored.channel.workHours}
                onChange={(e) => setChannel({ workHours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-buffer">
                Deadline buffer (weeks)
              </Label>
              <Input
                id="cf-buffer"
                type="number"
                className="h-9"
                value={stored.channel.deliveryBufferWeeks}
                onChange={(e) => setChannel({ deliveryBufferWeeks: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-defunct">
                Channel defunct risk (%)
              </Label>
              <Input
                id="cf-defunct"
                type="number"
                className="h-9"
                value={Math.round(stored.channel.channelDefunctRate * 100)}
                onChange={(e) => setChannel({ channelDefunctRate: Number(e.target.value) / 100 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-excl2">
                Self-sell during exclusivity
              </Label>
              <Select
                value={stored.channel.isExclusive ? 'yes' : 'no'}
                onValueChange={(v) => setChannel({ isExclusive: v === 'yes' })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Exclusive (can't self-sell)</SelectItem>
                  <SelectItem value="no">Not exclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>Marketing insert in the box</span>
              <Switch
                checked={stored.channel.hasMarketingInsert}
                onCheckedChange={(v) => setChannel({ hasMarketingInsert: v })}
              />
            </label>
            <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>Fee &amp; terms in writing</span>
              <Switch
                checked={stored.channel.paidInWriting}
                onCheckedChange={(v) => setChannel({ paidInWriting: v })}
              />
            </label>
            <div className="flex items-center gap-2">
              <Badge className={`${verdictColor} border px-3 py-1 text-sm`}>
                {channel.verdict.toUpperCase()} · {fmt$(channel.netProfit)} · {channel.effectiveHourly.toFixed(1)}/hr
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-sm">
                Deadline: {channel.deadlineRisk}
              </Badge>
            </div>
          </div>
          {channel.notes.length > 0 && (
            <div className="space-y-2">
              {channel.notes.map((note, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {note}
                </p>
              ))}
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Newsletter funnel
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-list">
                List size
              </Label>
              <Input
                id="cf-list"
                type="number"
                className="h-9"
                value={stored.funnel.listSize}
                onChange={(e) => setFunnel({ listSize: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-leads">
                New leads/mo (freebie)
              </Label>
              <Input
                id="cf-leads"
                type="number"
                className="h-9"
                value={stored.funnel.freebieLeadInPerMonth}
                onChange={(e) => setFunnel({ freebieLeadInPerMonth: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-lc">
                Launch conversion (%)
              </Label>
              <Input
                id="cf-lc"
                type="number"
                className="h-9"
                value={stored.funnel.launchConversionPct}
                onChange={(e) => setFunnel({ launchConversionPct: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-lprice">
                Launch price ($)
              </Label>
              <Input
                id="cf-lprice"
                type="number"
                className="h-9"
                value={stored.funnel.launchPrice}
                onChange={(e) => setFunnel({ launchPrice: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-week">
                Launch-week share (%)
              </Label>
              <Input
                id="cf-week"
                type="number"
                className="h-9"
                value={Math.round(stored.funnel.launchWeekShare * 100)}
                onChange={(e) => setFunnel({ launchWeekShare: Number(e.target.value) / 100 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-ev">
                Evergreen conversion (%)
              </Label>
              <Input
                id="cf-ev"
                type="number"
                className="h-9"
                value={stored.funnel.evergreenConversionPct}
                onChange={(e) => setFunnel({ evergreenConversionPct: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-post">
                Post-launch conversion (%)
              </Label>
              <Input
                id="cf-post"
                type="number"
                className="h-9"
                value={stored.funnel.postLaunchConversionPct}
                onChange={(e) => setFunnel({ postLaunchConversionPct: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-months">
                Months tracked
              </Label>
              <Input
                id="cf-months"
                type="number"
                className="h-9"
                value={stored.funnel.monthsTracked}
                onChange={(e) => setFunnel({ monthsTracked: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-maint">
                Maintenance hours/mo
              </Label>
              <Input
                id="cf-maint"
                type="number"
                className="h-9"
                value={stored.funnel.maintenanceHoursPerMonth}
                onChange={(e) => setFunnel({ maintenanceHoursPerMonth: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-leffort">
                Launch effort hours
              </Label>
              <Input
                id="cf-leffort"
                type="number"
                className="h-9"
                value={stored.funnel.launchEffortHours}
                onChange={(e) => setFunnel({ launchEffortHours: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-funnelnet">
                Net this cycle
              </Label>
              <Input
                id="cf-funnelnet"
                readOnly
                className="h-9 bg-muted/50 font-semibold text-primary"
                value={`${fmt$(funnel.netProfit)} · ${funnel.effectiveHourly.toFixed(1)}/hr`}
              />
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{funnel.launchWeekInsight}</p>
          {funnel.notes.length > 0 && (
            <div className="space-y-2">
              {funnel.notes.map((note, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {note}
                </p>
              ))}
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Switch
              checked={stored.showPitch}
              onCheckedChange={(v) => setStored((s) => ({ ...s, showPitch: v }))}
            />
            <Send className="h-4 w-4" /> Pitch email to a box operator
          </label>
          {stored.showPitch && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="cf-dname">
                    Your name
                  </Label>
                  <Input
                    id="cf-dname"
                    className="h-9"
                    value={stored.pitch.designerName}
                    onChange={(e) => setPitch({ designerName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="cf-pname">
                    Pattern name
                  </Label>
                  <Input
                    id="cf-pname"
                    className="h-9"
                    value={stored.pitch.patternName}
                    onChange={(e) => setPitch({ patternName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="cf-bname">
                    Box name
                  </Label>
                  <Input
                    id="cf-bname"
                    className="h-9"
                    value={stored.pitch.boxName}
                    onChange={(e) => setPitch({ boxName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="cf-pask">
                    Fee ask ($)
                  </Label>
                  <Input
                    id="cf-pask"
                    type="number"
                    className="h-9"
                    value={stored.pitch.feeAsk}
                    onChange={(e) => setPitch({ feeAsk: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="cf-pexcl">
                    Exclusivity (months)
                  </Label>
                  <Input
                    id="cf-pexcl"
                    type="number"
                    className="h-9"
                    value={stored.pitch.exclusivityAskMonths}
                    onChange={(e) => setPitch({ exclusivityAskMonths: Number(e.target.value) })}
                  />
                </div>
                <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4" /> Insert card w/ code
                  </span>
                  <Switch
                    checked={stored.pitch.insertPromise}
                    onCheckedChange={(v) => setPitch({ insertPromise: v })}
                  />
                </label>
              </div>
              <div className="relative rounded-md border bg-muted/30 p-3">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed">{pitch}</pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => copy(pitch)}
                  aria-label="Copy pitch"
                >
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 pt-2 text-sm font-medium">
            <Switch
              checked={stored.showFunnel}
              onCheckedChange={(v) => setStored((s) => ({ ...s, showFunnel: v }))}
            />
            <Mail className="h-4 w-4" /> Channel income breakdown
          </label>
          {stored.showFunnel && (
            <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-4 text-sm md:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Channel fee + extras</p>
                <p className="font-semibold">{fmt$(channel.channelIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Audience-driven shop income</p>
                <p className="font-semibold">{fmt$(channel.audienceIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lost self-sell (exclusivity)</p>
                <p className="font-semibold text-destructive/80">−{fmt$(channel.lostSelfSell)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Exposure (lead value)</p>
                <p className="font-semibold">{fmt$(channel.exposureValue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Labour cost</p>
                <p className="font-semibold text-destructive/80">−{fmt$(channel.labourCost)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net profit</p>
                <p className="font-semibold text-primary">{fmt$(channel.netProfit)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Effective hourly</p>
                <p className="font-semibold">{channel.effectiveHourly.toFixed(2)}/hr</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Box defunct risk</p>
                <p className="font-semibold">{Math.round(channel.stabilityRisk * 100)}%</p>
              </div>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
