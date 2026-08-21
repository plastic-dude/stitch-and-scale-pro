import { copyTextOrThrow } from '@/lib/clipboard';
import { useMemo, useState } from 'react';
import { useProjectStorage, useProjectStorageState } from '@/lib/storage-lib';
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
import { useSettings } from '@/context/SettingsContext';
import { CHANNEL_FUNNEL_COPY, getChannelTypeLabel, getChannelVerdictLabel, getChannelNote } from '@/lib/channel-funnel-copy';
import {
  analyzeChannel,
  analyzeFunnel,
  normalizeBoxPitchInput,
  normalizeChannelDeal,
  normalizeFunnelInput,
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

// CHK-152: pure derivation over the raw stored value — takes no
// handle, so it can never reach for a freshly-created handle in an initializer.
function loadStored(raw: StoredChannel | null): StoredChannel {
  try {
    if (raw?.channel) {
      const channel = normalizeChannelDeal(raw.channel);
      const pitch = normalizeBoxPitchInput({
        ...raw.pitch,
        audienceReach: channel.audienceReach,
      });
      return {
        ...defaultChannel(),
        ...raw,
        channel,
        funnel: normalizeFunnelInput(raw.funnel),
        pitch: {
          ...defaultChannel().pitch,
          ...raw.pitch,
          feeAsk: pitch.feeAsk,
          exclusivityAskMonths: pitch.exclusivityAskMonths,
        },
      };
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return defaultChannel();
}

function boundedNumber(raw: string, min: number, max: number, fallback: number): number {
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function boundedInteger(raw: string, min: number, max: number, fallback: number): number {
  return Math.round(boundedNumber(raw, min, max, fallback));
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function ChannelFunnelCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copyText = CHANNEL_FUNNEL_COPY[language];
  // issue #4 project seam: one scoped store per project; the legacy flat key 'kskchannels-v1' is folded in on first read, then removed.
  // CHK-152 (QUEUE-010): the old useMemo handle + `useState(() =>
// loadStored(handle))` lazy initializer was the crash class under HMR.
// Now flows through the shared seam: stable handle, memoized derivation.
const handle = useProjectStorage<StoredChannel>('channels', project.id, ['kskchannels-v1']);
  const { toast } = useToast();
  const [stored, setStored] = useProjectStorageState(handle, (raw) => loadStored(raw));
  // CHK-152: persistence owned by the seam's state hook — a manual
  // write-on-change effect would double-write every update.

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
      await copyTextOrThrow(text);
      toast({ title: copyText.copied });
    } catch {
      toast({ title: copyText.copyManual });
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
          <TrendingUp className="h-5 w-5" /> {copyText.title}
        </CardTitle>
        <CardDescription>{copyText.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ---------------------------------------------------------------- */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {copyText.offer}
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{copyText.channelType}</Label>
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
                      {getChannelTypeLabel(language, t, CHANNEL_TYPE_LABELS[t])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-name">
                {copyText.channelName}
              </Label>
              <Input
                id="cf-name"
                className="h-9"
                placeholder={copyText.channelPlaceholder}
                value={stored.channel.name}
                onChange={(e) => setChannel({ name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-fee">
                {copyText.designFee}
              </Label>
              <Input
                id="cf-fee"
                type="number"
                className="h-9"
                value={stored.channel.designFee}
                onChange={(e) => setChannel({ designFee: boundedNumber(e.target.value, 0, 1_000_000, stored.channel.designFee) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-extras">
                {copyText.extras}
              </Label>
              <Input
                id="cf-extras"
                type="number"
                className="h-9"
                value={stored.channel.extrasValue}
                onChange={(e) => setChannel({ extrasValue: boundedNumber(e.target.value, 0, 1_000_000, stored.channel.extrasValue) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-excl">
                {copyText.exclusivity}
              </Label>
              <Input
                id="cf-excl"
                type="number"
                className="h-9"
                value={stored.channel.exclusivityMonths}
                onChange={(e) => setChannel({ exclusivityMonths: boundedNumber(e.target.value, 0, 240, stored.channel.exclusivityMonths) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-reach">
                {copyText.reach}
              </Label>
              <Input
                id="cf-reach"
                type="number"
                className="h-9"
                value={stored.channel.audienceReach}
                onChange={(e) => setChannel({ audienceReach: boundedInteger(e.target.value, 0, 100_000_000, stored.channel.audienceReach) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-visit">
                {copyText.visit}
              </Label>
              <Input
                id="cf-visit"
                type="number"
                className="h-9"
                value={stored.channel.profileVisitPct}
                onChange={(e) => setChannel({ profileVisitPct: boundedNumber(e.target.value, 0, 100, stored.channel.profileVisitPct) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-conv">
                {copyText.conversion}
              </Label>
              <Input
                id="cf-conv"
                type="number"
                className="h-9"
                value={stored.channel.visitorConvertPct}
                onChange={(e) => setChannel({ visitorConvertPct: boundedNumber(e.target.value, 0, 100, stored.channel.visitorConvertPct) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-spend">
                {copyText.spend}
              </Label>
              <Input
                id="cf-spend"
                type="number"
                className="h-9"
                value={stored.channel.visitorSpend}
                onChange={(e) => setChannel({ visitorSpend: boundedNumber(e.target.value, 0, 1_000_000, stored.channel.visitorSpend) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-effect">
                {copyText.effect}
              </Label>
              <Input
                id="cf-effect"
                type="number"
                className="h-9"
                value={stored.channel.effectMonths}
                onChange={(e) => setChannel({ effectMonths: boundedNumber(e.target.value, 0, 240, stored.channel.effectMonths) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-baseline">
                {copyText.baseline}
              </Label>
              <Input
                id="cf-baseline"
                type="number"
                className="h-9"
                value={stored.channel.baselineSalesPerMonth}
                onChange={(e) => setChannel({ baselineSalesPerMonth: boundedNumber(e.target.value, 0, 1_000_000, stored.channel.baselineSalesPerMonth) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-price">
                {copyText.patternPrice}
              </Label>
              <Input
                id="cf-price"
                type="number"
                className="h-9"
                value={stored.channel.patternPrice}
                onChange={(e) => setChannel({ patternPrice: boundedNumber(e.target.value, 0, 1_000_000, stored.channel.patternPrice) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-hours">
                {copyText.hours}
              </Label>
              <Input
                id="cf-hours"
                type="number"
                className="h-9"
                value={stored.channel.workHours}
                onChange={(e) => setChannel({ workHours: boundedNumber(e.target.value, 0, 100_000, stored.channel.workHours) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-buffer">
                {copyText.buffer}
              </Label>
              <Input
                id="cf-buffer"
                type="number"
                className="h-9"
                value={stored.channel.deliveryBufferWeeks}
                onChange={(e) => setChannel({ deliveryBufferWeeks: boundedNumber(e.target.value, 0, 520, stored.channel.deliveryBufferWeeks) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-defunct">
                {copyText.defunct}
              </Label>
              <Input
                id="cf-defunct"
                type="number"
                className="h-9"
                value={Math.round(stored.channel.channelDefunctRate * 100)}
                onChange={(e) => setChannel({ channelDefunctRate: boundedNumber(e.target.value, 0, 100, stored.channel.channelDefunctRate * 100) / 100 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-excl2">
                {copyText.selfSell}
              </Label>
              <Select
                value={stored.channel.isExclusive ? 'yes' : 'no'}
                onValueChange={(v) => setChannel({ isExclusive: v === 'yes' })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{copyText.exclusiveYes}</SelectItem>
                  <SelectItem value="no">{copyText.exclusiveNo}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>{copyText.insert}</span>
              <Switch
                checked={stored.channel.hasMarketingInsert}
                onCheckedChange={(v) => setChannel({ hasMarketingInsert: v })}
              />
            </label>
            <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>{copyText.writing}</span>
              <Switch
                checked={stored.channel.paidInWriting}
                onCheckedChange={(v) => setChannel({ paidInWriting: v })}
              />
            </label>
            <div className="flex items-center gap-2">
              <Badge className={`${verdictColor} border px-3 py-1 text-sm`}>
                {getChannelVerdictLabel(language, channel.verdict)} · {fmt$(channel.netProfit)} · {channel.effectiveHourly.toFixed(1)}/hr
              </Badge>
              <Badge variant="outline" className="px-3 py-1 text-sm">
                {copyText.deadline}: {channel.deadlineRisk}
              </Badge>
            </div>
          </div>
          {channel.notes.length > 0 && (
            <div className="space-y-2">
              {channel.notes.map((note, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {getChannelNote(language, note)}
                </p>
              ))}
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {copyText.funnel}
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-list">
                {copyText.listSize}
              </Label>
              <Input
                id="cf-list"
                type="number"
                className="h-9"
                value={stored.funnel.listSize}
                onChange={(e) => setFunnel({ listSize: boundedInteger(e.target.value, 0, 100_000_000, stored.funnel.listSize) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-leads">
                {copyText.newLeads}
              </Label>
              <Input
                id="cf-leads"
                type="number"
                className="h-9"
                value={stored.funnel.freebieLeadInPerMonth}
                onChange={(e) => setFunnel({ freebieLeadInPerMonth: boundedInteger(e.target.value, 0, 10_000_000, stored.funnel.freebieLeadInPerMonth) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-lc">
                {copyText.launchConversion}
              </Label>
              <Input
                id="cf-lc"
                type="number"
                className="h-9"
                value={stored.funnel.launchConversionPct}
                onChange={(e) => setFunnel({ launchConversionPct: boundedNumber(e.target.value, 0, 100, stored.funnel.launchConversionPct) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-lprice">
                {copyText.launchPrice}
              </Label>
              <Input
                id="cf-lprice"
                type="number"
                className="h-9"
                value={stored.funnel.launchPrice}
                onChange={(e) => setFunnel({ launchPrice: boundedNumber(e.target.value, 0, 1_000_000, stored.funnel.launchPrice) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-week">
                {copyText.launchWeek}
              </Label>
              <Input
                id="cf-week"
                type="number"
                className="h-9"
                value={Math.round(stored.funnel.launchWeekShare * 100)}
                onChange={(e) => setFunnel({ launchWeekShare: boundedNumber(e.target.value, 0, 100, stored.funnel.launchWeekShare * 100) / 100 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-ev">
                {copyText.evergreen}
              </Label>
              <Input
                id="cf-ev"
                type="number"
                className="h-9"
                value={stored.funnel.evergreenConversionPct}
                onChange={(e) => setFunnel({ evergreenConversionPct: boundedNumber(e.target.value, 0, 100, stored.funnel.evergreenConversionPct) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-post">
                {copyText.evergreen}
              </Label>
              <Input
                id="cf-post"
                type="number"
                className="h-9"
                value={stored.funnel.postLaunchConversionPct}
                onChange={(e) => setFunnel({ postLaunchConversionPct: boundedNumber(e.target.value, 0, 100, stored.funnel.postLaunchConversionPct) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-months">
                {copyText.effect}
              </Label>
              <Input
                id="cf-months"
                type="number"
                className="h-9"
                value={stored.funnel.monthsTracked}
                onChange={(e) => setFunnel({ monthsTracked: boundedInteger(e.target.value, 1, 120, stored.funnel.monthsTracked) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-maint">
                {copyText.hours}
              </Label>
              <Input
                id="cf-maint"
                type="number"
                className="h-9"
                value={stored.funnel.maintenanceHoursPerMonth}
                onChange={(e) => setFunnel({ maintenanceHoursPerMonth: boundedNumber(e.target.value, 0, 10_000, stored.funnel.maintenanceHoursPerMonth) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-leffort">
                {copyText.hours}
              </Label>
              <Input
                id="cf-leffort"
                type="number"
                className="h-9"
                value={stored.funnel.launchEffortHours}
                onChange={(e) => setFunnel({ launchEffortHours: boundedNumber(e.target.value, 0, 100_000, stored.funnel.launchEffortHours) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cf-funnelnet">
                {copyText.deadline}
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
                  {getChannelNote(language, note)}
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
            <Send className="h-4 w-4" /> {copyText.pitch}
          </label>
          {stored.showPitch && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="cf-dname">
                    {copyText.channelName}
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
                    {copyText.patternPrice}
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
                    {copyText.channelName}
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
                    {copyText.designFee}
                  </Label>
                  <Input
                    id="cf-pask"
                    type="number"
                    className="h-9"
                    value={stored.pitch.feeAsk}
                    onChange={(e) => setPitch({ feeAsk: boundedNumber(e.target.value, 0, 1_000_000, stored.pitch.feeAsk) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="cf-pexcl">
                    {copyText.exclusivity}
                  </Label>
                  <Input
                    id="cf-pexcl"
                    type="number"
                    className="h-9"
                    value={stored.pitch.exclusivityAskMonths}
                    onChange={(e) => setPitch({ exclusivityAskMonths: boundedNumber(e.target.value, 0, 240, stored.pitch.exclusivityAskMonths) })}
                  />
                </div>
                <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4" /> {copyText.insert}
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
                  aria-label={copyText.copyPitch}
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
