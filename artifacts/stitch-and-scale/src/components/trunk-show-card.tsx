/**
 * Trunk Show & Cottage License Planner — models the in-person sales channel
 * no tool in the market currently does: trunk shows at local yarn shops and
 * cottage licenses for selling finished knits.
 *
 * The gap (session-15 research): trunk show splits are handshake math in
 * LYS owner FAQs (70/30 or 50/50), cottage license pricing lives on one
 * designer's hand-written page, and the arithmetic of "is this event worth
 * driving 3 hours for" is done on the back of an envelope. Nobody's tool
 * answers it.
 *
 * Built from the pattern's own data: sample yardage (time-costed at a
 * realistic 30 yd/hr knitting pace), traffic assumptions the designer
 * supplies, and cited split norms they can override. Generates a dated
 * task list, a paste-ready shop proposal letter, an event pitch, and a
 * full cottage-license price sheet with copy-ready buyer offer.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { useSettings } from '@/context/SettingsContext';
import { TRUNK_SHOW_COPY } from '@/lib/trunk-show-copy';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  analyzeTrunkShow,
  priceLicenses,
  generateLicenseTerms,
  generateLicenseOffer,
  DEFAULT_LICENSE_PRICES,
  LicenseTierId,
  LicenseConfig,
  TrunkShowInput,
} from '@/lib/trunk-show-planner';
import { PatternProject } from '@/lib/grading-engine';
import { Truck, DollarSign, Copy, CheckCircle2, ClipboardCopy, ListChecks, ScrollText, CalendarDays } from 'lucide-react';

interface StoredState {
  trunk?: Partial<TrunkShowInput>;
  licensePrices?: Partial<Record<LicenseTierId, number>>;
  licenseConfig?: Partial<LicenseConfig>;
}

function loadStored(handle: ProjectStorageHandle<StoredState>): StoredState {
  try {
    const parsed = handle.read();
    if (parsed && typeof parsed === 'object') return parsed as StoredState;
  } catch {
    /* storage unreadable — start fresh */
  }
  return {};
}

function numField(value: string): number {
  const n = parseFloat(value);
  return isFinite(n) ? n : 0;
}

function CopyLine({ text, label }: { text: string; label: string }) {
  const { toast } = useToast();
  const { language } = useSettings();
  const copyText = TRUNK_SHOW_COPY[language];
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast({ title: copyText.copied, description: label });
    } catch {
      toast({ title: copyText.copyFailed, description: copyText.selectManually });
    }
  };
  return (
    <div>
      <div className="flex items-start justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed font-mono">{text}</p>
        <Button variant="ghost" size="sm" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <CheckCircle2 className="size-4 text-emerald-600" /> : <ClipboardCopy className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

export function TrunkShowCard({ project }: { project: PatternProject }) {
  // issue #4 project seam (S018/S042): one scoped store per project; the
  // legacy flat key 'stitch-and-scale-trunk-show' was projectId-partitioned
  // (projects shared one blob, silently colliding). Read-once migration folds
  // this project's partition into the scoped key, then removes the flat key.
  const handle = useMemo(() => projectStorage<StoredState>('trunkshow', project.id, ['stitch-and-scale-trunk-show'], { partition: true }), [project.id]);

  const [stored, setStored] = React.useState<StoredState>(() => loadStored(handle));
  const { language } = useSettings();
  const copyText = TRUNK_SHOW_COPY[language];
  const saved: StoredState = stored;

  // ---- Trunk show inputs ----
  const [eventDate, setEventDate] = React.useState(saved.trunk?.eventDate ?? '');
  const [visitorsPerDay, setVisitorsPerDay] = React.useState(saved.trunk?.visitorsPerDay?.toString() ?? '10');
  const [tryOnRate, setTryOnRate] = React.useState(saved.trunk?.tryOnRate?.toString() ?? '0.35');
  const [conversionRate, setConversionRate] = React.useState(saved.trunk?.conversionRate?.toString() ?? '0.3');
  const [shopSplit, setShopSplit] = React.useState(saved.trunk?.shopSplit?.toString() ?? '0.3');
  const [patternPrice, setPatternPrice] = React.useState(saved.trunk?.patternPrice?.toString() ?? '8');
  const [channelFeeRate, setChannelFeeRate] = React.useState(saved.trunk?.channelFeeRate?.toString() ?? '0');
  const [sampleYards, setSampleYards] = React.useState(saved.trunk?.sampleYards?.toString() ?? '1800');
  const [sampleCost, setSampleCost] = React.useState(saved.trunk?.sampleCost?.toString() ?? '105');
  const [shippingCost, setShippingCost] = React.useState(saved.trunk?.shippingCost?.toString() ?? '30');
  const [travelCost, setTravelCost] = React.useState(saved.trunk?.travelCost?.toString() ?? '50');
  const [eventCost, setEventCost] = React.useState(saved.trunk?.eventCost?.toString() ?? '90');
  const [yarnSales, setYarnSales] = React.useState(saved.trunk?.yarnSales?.toString() ?? '1200');
  const [yarnShopSplit, setYarnShopSplit] = React.useState(saved.trunk?.yarnShopSplit?.toString() ?? '0.5');
  const [hourlyRate, setHourlyRate] = React.useState(saved.trunk?.hourlyRate?.toString() ?? '25');
  const [attending, setAttending] = React.useState(saved.trunk?.attending ?? true);
  const [attendingHours, setAttendingHours] = React.useState(saved.trunk?.attendingHours?.toString() ?? '8');
  const [trunkDays, setTrunkDays] = React.useState(saved.trunk?.trunkDays?.toString() ?? '14');

  const saveTrunk = (next: Partial<TrunkShowInput>) => {
    setStored(s => ({ trunk: next, licensePrices: s.licensePrices, licenseConfig: s.licenseConfig }));
  };

  const trunkInput: TrunkShowInput = React.useMemo(
    () => ({
      eventDate,
      visitorsPerDay: numField(visitorsPerDay),
      tryOnRate: numField(tryOnRate),
      conversionRate: numField(conversionRate),
      shopSplit: numField(shopSplit),
      copiesPerSale: 1,
      sampleYards: numField(sampleYards),
      sampleCost: numField(sampleCost),
      shippingCost: numField(shippingCost),
      travelCost: numField(travelCost),
      eventCost: numField(eventCost),
      attending,
      attendingHours: numField(attendingHours),
      hourlyRate: numField(hourlyRate),
      patternPrice: numField(patternPrice),
      channelFeeRate: numField(channelFeeRate),
      trunkDays: numField(trunkDays),
      yarnSales: numField(yarnSales),
      yarnShopSplit: numField(yarnShopSplit),
    }),
    [eventDate, visitorsPerDay, tryOnRate, conversionRate, shopSplit, sampleYards, sampleCost,
      shippingCost, travelCost, eventCost, attending, attendingHours, hourlyRate, patternPrice,
      channelFeeRate, trunkDays, yarnSales, yarnShopSplit],
  );

  const analysis = React.useMemo(() => analyzeTrunkShow(trunkInput), [trunkInput]);

  // ---- License pricing ----
  const [licensePrices, setLicensePrices] = React.useState<Partial<Record<LicenseTierId, string>>>(
    Object.fromEntries(Object.entries(saved.licensePrices ?? {}).map(([k, v]) => [k, String(v)])) as never,
  );
  const [designerName, setDesignerName] = React.useState(saved.licenseConfig?.designerName ?? '');
  const [patternRequired, setPatternRequired] = React.useState(saved.licenseConfig?.patternRequired ?? true);
  const [machineAllowed, setMachineAllowed] = React.useState(saved.licenseConfig?.machineAllowed ?? false);
  const [resaleAllowed, setResaleAllowed] = React.useState(saved.licenseConfig?.resaleAllowed ?? true);

  const saveLicense = (next: StoredState) => {
    setStored(s => ({ ...s, ...next }));
  };

  const licensePricing = React.useMemo(
    () =>
      priceLicenses({
        prices: Object.fromEntries(
          Object.entries(licensePrices).map(([k, v]) => [k, numField(v)]),
        ) as Partial<Record<LicenseTierId, number>>,
      }),
    [licensePrices],
  );

  const licenseConfig: LicenseConfig = React.useMemo(
    () => ({
      designerName,
      patternRequired,
      machineAllowed,
      resaleAllowed,
    }),
    [designerName, patternRequired, machineAllowed, resaleAllowed],
  );

  const licenseTerms = React.useMemo(() => generateLicenseTerms(licenseConfig), [licenseConfig]);
  const licenseOffer = React.useMemo(
    () => generateLicenseOffer(licenseConfig, licensePricing, project.name),
    [licenseConfig, licensePricing, project.name],
  );

  React.useEffect(() => {
    handle.write(stored);
  }, [stored]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="size-5" />
          {copyText.title}
        </CardTitle>
        <CardDescription>
          {copyText.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* ---------- Trunk show economics ---------- */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <DollarSign className="size-4" />
            <Label className="text-base font-semibold">{copyText.trunkShop}</Label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="ts-event-date">{copyText.kickoff}</Label>
              <Input id="ts-event-date" type="date" value={eventDate}
                onChange={e => { setEventDate(e.target.value); saveTrunk({ ...trunkInput, eventDate: e.target.value }); }} />
            </div>
            <div>
              <Label htmlFor="ts-visitors">{copyText.visitors}</Label>
              <Input id="ts-visitors" type="number" min={0} placeholder="10" value={visitorsPerDay}
                onChange={e => { setVisitorsPerDay(e.target.value); saveTrunk({ ...trunkInput, visitorsPerDay: numField(e.target.value) }); }} />
            </div>
            <div>
              <Label htmlFor="ts-tryon">{copyText.tryOn}</Label>
              <Input id="ts-tryon" type="number" min={0} max={1} step={0.05} placeholder="0.35" value={tryOnRate}
                onChange={e => { setTryOnRate(e.target.value); saveTrunk({ ...trunkInput, tryOnRate: numField(e.target.value) }); }} />
              <p className="mt-1 text-[11px] text-muted-foreground">{copyText.tryOnHelp}</p>
            </div>
            <div>
              <Label htmlFor="ts-conversion">{copyText.conversion}</Label>
              <Input id="ts-conversion" type="number" min={0} max={1} step={0.05} placeholder="0.3" value={conversionRate}
                onChange={e => { setConversionRate(e.target.value); saveTrunk({ ...trunkInput, conversionRate: numField(e.target.value) }); }} />
            </div>
            <div>
              <Label htmlFor="ts-shop-split">{copyText.shopCut}</Label>
              <Input id="ts-shop-split" type="number" min={0} max={1} step={0.05} placeholder="0.3" value={shopSplit}
                onChange={e => { setShopSplit(e.target.value); saveTrunk({ ...trunkInput, shopSplit: numField(e.target.value) }); }} />
              <p className="mt-1 text-[11px] text-muted-foreground">0.3 = classic 70/30 to you; wholesale proper is usually 50/50.</p>
            </div>
            <div>
              <Label htmlFor="ts-price">{copyText.patternPrice}</Label>
              <Input id="ts-price" type="number" min={0} step={0.5} placeholder="8" value={patternPrice}
                onChange={e => { setPatternPrice(e.target.value); saveTrunk({ ...trunkInput, patternPrice: numField(e.target.value) }); }} />
            </div>
            <div>
              <Label htmlFor="ts-channel-fee">{copyText.channelFee}</Label>
              <Input id="ts-channel-fee" type="number" min={0} max={1} step={0.01} placeholder="0" value={channelFeeRate}
                onChange={e => { setChannelFeeRate(e.target.value); saveTrunk({ ...trunkInput, channelFeeRate: numField(e.target.value) }); }} />
              <p className="mt-1 text-[11px] text-muted-foreground">e.g. 0.15 if the shop sells via Ravelry's in-store channel.</p>
            </div>
            <div>
              <Label htmlFor="ts-trunk-days">{copyText.trunkLength}</Label>
              <Input id="ts-trunk-days" type="number" min={1} max={30} placeholder="14" value={trunkDays}
                onChange={e => { setTrunkDays(e.target.value); saveTrunk({ ...trunkInput, trunkDays: numField(e.target.value) }); }} />
            </div>
            <div>
              <Label htmlFor="ts-yarn-sales">{copyText.yarnSales}</Label>
              <Input id="ts-yarn-sales" type="number" min={0} placeholder="1200" value={yarnSales}
                onChange={e => { setYarnSales(e.target.value); saveTrunk({ ...trunkInput, yarnSales: numField(e.target.value) }); }} />
              <p className="mt-1 text-[11px] text-muted-foreground">Trunks move yarn — often the real income.</p>
            </div>
            <div>
              <Label htmlFor="ts-yarn-split">{copyText.yarnCut}</Label>
              <Input id="ts-yarn-split" type="number" min={0} max={1} step={0.05} placeholder="0.5" value={yarnShopSplit}
                onChange={e => { setYarnShopSplit(e.target.value); saveTrunk({ ...trunkInput, yarnShopSplit: numField(e.target.value) }); }} />
            </div>
            <div>
              <Label htmlFor="ts-sample-yards">{copyText.sampleYardage}</Label>
              <Input id="ts-sample-yards" type="number" min={0} placeholder="1800" value={sampleYards}
                onChange={e => { setSampleYards(e.target.value); saveTrunk({ ...trunkInput, sampleYards: numField(e.target.value) }); }} />
              <p className="mt-1 text-[11px] text-muted-foreground">All garments in the trunk, time-costed at ~30 yd/hr.</p>
            </div>
            <div>
              <Label htmlFor="ts-sample-cost">{copyText.sampleCost}</Label>
              <Input id="ts-sample-cost" type="number" min={0} placeholder="105" value={sampleCost}
                onChange={e => { setSampleCost(e.target.value); saveTrunk({ ...trunkInput, sampleCost: numField(e.target.value) }); }} />
            </div>
            <div>
              <Label htmlFor="ts-shipping">{copyText.shipping}</Label>
              <Input id="ts-shipping" type="number" min={0} placeholder="30" value={shippingCost}
                onChange={e => { setShippingCost(e.target.value); saveTrunk({ ...trunkInput, shippingCost: numField(e.target.value) }); }} />
            </div>
            <div>
              <Label htmlFor="ts-travel">{copyText.travel}</Label>
              <Input id="ts-travel" type="number" min={0} placeholder="50" value={travelCost}
                onChange={e => { setTravelCost(e.target.value); saveTrunk({ ...trunkInput, travelCost: numField(e.target.value) }); }} />
            </div>
            <div>
              <Label htmlFor="ts-event-cost">{copyText.eventCost}</Label>
              <Input id="ts-event-cost" type="number" min={0} placeholder="90" value={eventCost}
                onChange={e => { setEventCost(e.target.value); saveTrunk({ ...trunkInput, eventCost: numField(e.target.value) }); }} />
            </div>
            <div>
              <Label htmlFor="ts-rate">{copyText.rate}</Label>
              <Input id="ts-rate" type="number" min={0} placeholder="25" value={hourlyRate}
                onChange={e => { setHourlyRate(e.target.value); saveTrunk({ ...trunkInput, hourlyRate: numField(e.target.value) }); }} />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={attending}
                  onChange={e => { setAttending(e.target.checked); saveTrunk({ ...trunkInput, attending: e.target.checked }); }}
                  className="size-4 accent-rose-600" />
                {copyText.attend}
              </label>
              <Input type="number" min={0} placeholder="8 event hrs" value={attendingHours}
                onChange={e => { setAttendingHours(e.target.value); saveTrunk({ ...trunkInput, attendingHours: numField(e.target.value) }); }}
                className="w-24" aria-label={copyText.attendingHours} />
            </div>
          </div>
        </div>

        {/* ---------- Verdict ---------- */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border px-4 py-3">
            <p className="text-xs text-muted-foreground">{copyText.expectedCopies}</p>
            <p className="text-2xl font-bold" data-testid="ts-expected-copies">{analysis.expectedCopies}</p>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <p className="text-xs text-muted-foreground">{copyText.net}</p>
            <p className={cn('text-2xl font-bold', analysis.netToDesigner >= 0 ? 'text-emerald-600' : 'text-destructive')}
              data-testid="ts-net-designer">
              {analysis.netToDesigner.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <p className="text-xs text-muted-foreground">{copyText.effectiveRate}</p>
            <p className="text-2xl font-bold" data-testid="ts-effective-rate">
              {analysis.effectiveHourlyRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <p className="text-xs text-muted-foreground">{copyText.invested}</p>
            <p className="text-2xl font-bold">{analysis.hoursInvested}</p>
          </div>
        </div>

        <div className={cn(
          'rounded-lg border px-4 py-3 text-sm',
          analysis.verdict === 'go' ? 'border-emerald-500/40 bg-emerald-500/5'
            : analysis.verdict === 'review' ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-destructive/40 bg-destructive/5',
        )}>
          <div className="flex items-center gap-2 font-semibold">
            <Badge variant="outline" className={cn(
              analysis.verdict === 'go' ? 'border-emerald-500/50 text-emerald-700'
                : analysis.verdict === 'review' ? 'border-amber-500/50 text-amber-700'
                : 'border-destructive/50 text-destructive',
            )}>
              {analysis.verdict.toUpperCase()}
            </Badge>
            <span>{analysis.verdictReason}</span>
          </div>
        </div>

        {/* ---------- Task list ---------- */}
        <div>
          <Label className="mb-2 flex items-center gap-2 text-base font-semibold">
            <ListChecks className="size-4" />
            {copyText.tasks}
          </Label>
          <div className="space-y-1.5">
            {analysis.tasks.map(t => (
              <div key={t.date + t.label} className="flex items-start gap-3 rounded-md border px-3 py-2 text-sm">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <span className="font-mono text-xs text-muted-foreground">{t.date}</span>
                  <span className="mx-2 font-medium">{t.label}</span>
                  <p className="text-xs text-muted-foreground">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- Copy ---- */}
        <div className="space-y-4">
          <div>
            <Label className="mb-2 flex items-center gap-2 text-base font-semibold">
              <ScrollText className="size-4" />
              {copyText.proposal}
            </Label>
            <CopyLine text={analysis.proposalLetter} label="shop proposal letter" />
          </div>
          <div>
            <Label className="mb-2 flex items-center gap-2 text-base font-semibold">
              <ScrollText className="size-4" />
              {copyText.eventPitch}
            </Label>
            <CopyLine text={analysis.eventPitch} label="kick-off event pitch" />
          </div>
        </div>

        {/* ---------- Cottage licenses ---------- */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <DollarSign className="size-4" />
            <Label className="text-base font-semibold">{copyText.licenses}</Label>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            {copyText.licenseHelp}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {licensePricing.map(row => (
              <div key={row.tier.id} className="rounded-lg border px-3 py-2.5">
                <p className="text-xs font-medium">{row.tier.label}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-lg font-bold">${row.price.toFixed(0)}</span>
                  <span className="text-[11px] text-muted-foreground">= ${row.annualizedValue.toFixed(0)}/yr equivalent</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min={0}
                    aria-label={`Price for ${row.tier.label}`}
                    value={licensePrices[row.tier.id] ?? ''}
                    onChange={e => {
                      const next = { ...licensePrices, [row.tier.id]: e.target.value };
                      setLicensePrices(next);
                      const numeric = Object.fromEntries(
                        Object.entries(next).filter(([, v]) => v !== '').map(([k, v]) => [k, numField(v)]),
                      ) as Partial<Record<LicenseTierId, number>>;
                      saveLicense({ licensePrices: numeric });
                    }}
                    className="h-7 w-20"
                  />
                  <span className="text-[11px] text-muted-foreground">bulk ${row.bulkPrice.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="ts-designer-name">{copyText.designName}</Label>
              <Input id="ts-designer-name" placeholder="e.g. Stitch & Scale" value={designerName}
                onChange={e => { setDesignerName(e.target.value); saveLicense({ licenseConfig: { designerName: e.target.value, patternRequired, machineAllowed, resaleAllowed } }); }} />
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={patternRequired}
                  onChange={e => { setPatternRequired(e.target.checked); saveLicense({ licenseConfig: { designerName, patternRequired: e.target.checked, machineAllowed, resaleAllowed } }); }}
                  className="size-4 accent-rose-600" />
                {copyText.purchaseRequired}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={machineAllowed}
                  onChange={e => { setMachineAllowed(e.target.checked); saveLicense({ licenseConfig: { designerName, patternRequired, machineAllowed: e.target.checked, resaleAllowed } }); }}
                  className="size-4 accent-rose-600" />
                {copyText.machine}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={resaleAllowed}
                  onChange={e => { setResaleAllowed(e.target.checked); saveLicense({ licenseConfig: { designerName, patternRequired, machineAllowed, resaleAllowed: e.target.checked } }); }}
                  className="size-4 accent-rose-600" />
                {copyText.resale}
              </label>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <Label className="mb-2 flex items-center gap-2 text-base font-semibold">
                <ScrollText className="size-4" />
                {copyText.licenseTerms}
              </Label>
              <CopyLine text={licenseTerms} label="license terms" />
            </div>
            <div>
              <Label className="mb-2 flex items-center gap-2 text-base font-semibold">
                <ScrollText className="size-4" />
                {copyText.buyerOffer} ({project.name})
              </Label>
              <CopyLine text={licenseOffer} label="buyer offer letter" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
