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
import { ClipboardCopy, LineChart, Megaphone, CheckCircle2, XCircle, AlertTriangle, PackageOpen } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { copyTextOrThrow } from '@/lib/clipboard';
import { KAL_ROI_COPY } from '@/lib/kal-roi-copy';
import { getToastCopy } from '@/lib/toast-copy';
import {
  analyzeKal,
  defaultKalEvent,
  rightsChecklist,
  estimateCollabFee,
  generateCollabPitch,
  KAL_FORMAT_LABELS,
  KalEvent,
  KalFormat,
  CollabOffer,
} from '@/lib/kal-roi-planner';

const STORAGE_KEY = 'kskroi-v1';

interface StoredRates {
  showRights: boolean;
  showPitch: boolean;
  sponsorPayment: number;
  yarnProvided: boolean;
  selfResellRight: boolean;
  resalePriceFloor: boolean;
  rightsTransferred: boolean;
  exclusivityMonths: number;
  sizingScope: string;
  deliverables: string;
  followers: number;
  newsletter: number;
  patternsSold: number;
  pitchAsk: string;
  pitchFee: number;
}

function defaultRates(): StoredRates {
  return {
    showRights: false,
    showPitch: false,
    sponsorPayment: 0,
    yarnProvided: true,
    selfResellRight: true,
    resalePriceFloor: false,
    rightsTransferred: false,
    exclusivityMonths: 0,
    sizingScope: '',
    deliverables: 'pattern, chart, photos',
    followers: 0,
    newsletter: 0,
    patternsSold: 0,
    pitchAsk: 'yarn support for a KAL around my next release',
    pitchFee: 0,
  };
}

function loadStored(raw: { event: KalEvent; rates: StoredRates } | null): { event: KalEvent; rates: StoredRates } {
  try {
    
    if (raw) {
      if (raw && raw.event) {
        return { event: { ...defaultKalEvent(), ...raw.event }, rates: { ...defaultRates(), ...raw.rates } };
      }
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return { event: defaultKalEvent(), rates: defaultRates() };
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function KalRoiCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copyText = KAL_ROI_COPY[language];
  const toastCopy = getToastCopy(language);
  // issue #4 project seam: one scoped store per project; the legacy flat key 'kskroi-v1' is folded in on first read, then removed.
  // CHK-152 (QUEUE-010): the old useMemo handle + `useState(() =>
// loadStored(handle))` lazy initializer was the crash class under HMR.
// Now flows through the shared seam: stable handle, memoized derivation.
const handle = useProjectStorage<{ event: KalEvent; rates: StoredRates }>('kalroi', project.id, ['kskroi-v1']);
  const { toast } = useToast();
  const [stored, setStored] = useProjectStorageState(handle, (raw) => loadStored(raw));
  // CHK-152: persistence owned by the seam's state hook — a manual
  // write-on-change effect would double-write every update.

  const result = useMemo(() => analyzeKal(stored.event), [stored.event]);

  const rights = useMemo(
    () =>
      rightsChecklist({
        upfrontPayment: stored.rates.sponsorPayment,
        yarnProvided: stored.rates.yarnProvided,
        selfResellRight: stored.rates.selfResellRight,
        resalePriceFloor: stored.rates.resalePriceFloor,
        rightsTransferred: stored.rates.rightsTransferred,
        exclusivityMonths: stored.rates.exclusivityMonths,
        sizingScope: stored.rates.sizingScope,
        deliverables: stored.rates.deliverables.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    [stored.rates]
  );

  const fee = useMemo(
    () =>
      estimateCollabFee({
        upfrontPayment: stored.rates.sponsorPayment,
        yarnProvided: stored.rates.yarnProvided,
        selfResellRight: stored.rates.selfResellRight,
        resalePriceFloor: stored.rates.resalePriceFloor,
        rightsTransferred: stored.rates.rightsTransferred,
        exclusivityMonths: stored.rates.exclusivityMonths,
        sizingScope: stored.rates.sizingScope,
        deliverables: stored.rates.deliverables.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    [stored.rates]
  );

  const pitch = useMemo(
    () =>
      generateCollabPitch({
        designerName: project.author,
        patternName: project.name,
        brandName: 'the yarn brand',
        kpis: { followers: stored.rates.followers, newsletter: stored.rates.newsletter, patternsSold: stored.rates.patternsSold },
        ask: stored.rates.pitchAsk,
        feeAsk: stored.rates.pitchFee,
      }),
    [stored.rates, project]
  );

  const updateEvent = (patch: Partial<KalEvent>) => {
    setStored((s) => ({ ...s, event: { ...s.event, ...patch } }));
  };
  const updateRates = (patch: Partial<StoredRates>) => {
    setStored((s) => ({ ...s, rates: { ...s.rates, ...patch } }));
  };

  const copy = (text: string, label: string) => {
    copyTextOrThrow(text)
      .then(() => {
        toast({ title: `${label} ${copyText.copied}`, description: copyText.paste });
      })
      .catch(() => {
        toast({ title: `${label} — ${toastCopy.copyFailed}`, description: toastCopy.copyFailedDescription });
      });
  };

  const num = (v: string, fallback: number) => (v === '' ? fallback : Number(v) || fallback);

  const verdictStyle =
    result.verdict === 'go'
      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-400/40'
      : result.verdict === 'maybe'
        ? 'bg-amber-500/15 text-amber-700 border-amber-400/40'
        : 'bg-destructive/10 text-destructive border-destructive/40';

  const verdictIcon =
    result.verdict === 'go' ? <CheckCircle2 className="h-5 w-5" /> : result.verdict === 'maybe' ? <AlertTriangle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><Megaphone className="h-5 w-5" />{copyText.title}</CardTitle>
        <CardDescription>
          {copyText.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format + basics */}
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-sm">{copyText.campaign}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">{copyText.format}</Label>
              <Select value={stored.event.format} onValueChange={(v) => updateEvent({ format: v as KalFormat })}>
                <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(KAL_FORMAT_LABELS) as KalFormat[]).map((f) => (
                    <SelectItem key={f} value={f}>{KAL_FORMAT_LABELS[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.price}</Label>
              <Input type="number" min={0} value={stored.event.patternPrice} onChange={(e) => updateEvent({ patternPrice: num(e.target.value, 8) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.discount}</Label>
              <Input type="number" min={0} max={100} value={stored.event.discountPct} onChange={(e) => updateEvent({ discountPct: num(e.target.value, 0) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.eventSales}</Label>
              <Input type="number" min={0} value={stored.event.eventSalesUnits} onChange={(e) => updateEvent({ eventSalesUnits: num(e.target.value, 0) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.tailSales}</Label>
              <Input type="number" min={0} value={stored.event.tailSalesPerMonth} onChange={(e) => updateEvent({ tailSalesPerMonth: num(e.target.value, 4) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.tailMonths}</Label>
              <Input type="number" min={0} value={stored.event.tailMonths} onChange={(e) => updateEvent({ tailMonths: num(e.target.value, 3) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.crossSell}</Label>
              <Input type="number" min={0} value={stored.event.crossSellRevenue} onChange={(e) => updateEvent({ crossSellRevenue: num(e.target.value, 60) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.leads}</Label>
              <Input type="number" min={0} value={stored.event.newLeads} onChange={(e) => updateEvent({ newLeads: num(e.target.value, 25) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.duration}</Label>
              <Input type="number" min={1} value={stored.event.durationWeeks} onChange={(e) => updateEvent({ durationWeeks: num(e.target.value, 4) })} />
            </div>
          </div>
        </div>

        {/* Affiliate */}
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-sm">{copyText.affiliate}</h4>
          <p className="text-xs text-muted-foreground">
            {copyText.affiliateNote}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">{copyText.affiliateBuyers}</Label>
              <Input type="number" min={0} value={stored.event.affiliateBuyers} onChange={(e) => updateEvent({ affiliateBuyers: num(e.target.value, 5) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.cartValue}</Label>
              <Input type="number" min={0} value={stored.event.affiliateCartValue} onChange={(e) => updateEvent({ affiliateCartValue: num(e.target.value, 45) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.commission}</Label>
              <Input type="number" min={0} max={1} step={0.01} value={stored.event.affiliateRate} onChange={(e) => updateEvent({ affiliateRate: num(e.target.value, 0.1) })} />
            </div>
          </div>
        </div>

        {/* Costs + hours */}
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-sm">{copyText.costsHours}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">{copyText.sampleCost}</Label>
              <Input type="number" min={0} value={stored.event.sampleYarnCost} onChange={(e) => updateEvent({ sampleYarnCost: num(e.target.value, 0) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.otherCosts}</Label>
              <Input type="number" min={0} value={stored.event.otherCosts} onChange={(e) => updateEvent({ otherCosts: num(e.target.value, 0) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.designHours}</Label>
              <Input type="number" min={0} value={stored.event.designHours} onChange={(e) => updateEvent({ designHours: num(e.target.value, 10) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.promoHours}</Label>
              <Input type="number" min={0} value={stored.event.promotionHours} onChange={(e) => updateEvent({ promotionHours: num(e.target.value, 3) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.supportHours}</Label>
              <Input type="number" min={0} value={stored.event.supportHours} onChange={(e) => updateEvent({ supportHours: num(e.target.value, 5) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.hourlyRate}</Label>
              <Input type="number" min={0} value={stored.event.hourlyRate} onChange={(e) => updateEvent({ hourlyRate: num(e.target.value, 12) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{copyText.platformFee}</Label>
              <Input type="number" min={0} max={1} step={0.01} value={stored.event.platformFeeRate} onChange={(e) => updateEvent({ platformFeeRate: num(e.target.value, 0.05) })} />
            </div>
          </div>
        </div>

        {/* Verdict + numbers */}
        <div className="space-y-4">
          <div className={`border rounded-md px-4 py-3 flex items-center gap-3 ${verdictStyle}`}>
            {verdictIcon}
            <div className="text-sm font-semibold capitalize">{result.verdict === 'go' ? copyText.go : result.verdict === 'maybe' ? copyText.maybe : copyText.no}</div>
            <Badge variant="outline" className="ml-auto">{fmt$(result.netProfit)} net profit · {fmt$(result.effectiveHourly)}/hr effective</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border rounded-md p-3">
              <p className="text-xs text-muted-foreground">{copyText.grossRevenue}</p>
              <p className="text-lg font-semibold">{fmt$(result.grossRevenue)}</p>
              <p className="text-xs text-muted-foreground">{copyText.grossDetail}</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-xs text-muted-foreground">{copyText.feesCash}</p>
              <p className="text-lg font-semibold">{fmt$(result.platformFees + result.cashCosts)}</p>
              <p className="text-xs text-muted-foreground">{copyText.feesDetail}: {fmt$(result.platformFees)} · {fmt$(result.cashCosts)}</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-xs text-muted-foreground">{copyText.labourCost}</p>
              <p className="text-lg font-semibold">{fmt$(result.labourCost)}</p>
              <p className="text-xs text-muted-foreground">{copyText.labourDetail}</p>
            </div>
            <div className="border rounded-md p-3">
              <p className="text-xs text-muted-foreground">{copyText.netProfit}</p>
              <p className={`text-lg font-semibold ${result.netProfit >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>{fmt$(result.netProfit)}</p>
              <p className="text-xs text-muted-foreground">{copyText.netDetail}</p>
            </div>
          </div>

          <div className="border rounded-md divide-y">
            {result.notes.map((n, i) => (
              <div key={i} className="px-3 py-2 text-sm text-muted-foreground flex items-start gap-2">
                <LineChart className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                {n}
              </div>
            ))}
          </div>
        </div>

        {/* Rights checklist */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{copyText.rights}</h4>
            <Switch checked={stored.rates.showRights} onCheckedChange={(v) => updateRates({ showRights: v })} />
          </div>
          {stored.rates.showRights && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">{copyText.upfront}</Label>
                  <Input type="number" min={0} value={stored.rates.sponsorPayment} onChange={(e) => updateRates({ sponsorPayment: num(e.target.value, 0) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{copyText.exclusivity}</Label>
                  <Input type="number" min={0} value={stored.rates.exclusivityMonths} onChange={(e) => updateRates({ exclusivityMonths: num(e.target.value, 0) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{copyText.sizing}</Label>
                  <Input value={stored.rates.sizingScope} onChange={(e) => updateRates({ sizingScope: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{copyText.deliverables}</Label>
                  <Input value={stored.rates.deliverables} onChange={(e) => updateRates({ deliverables: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch checked={stored.rates.yarnProvided} onCheckedChange={(v) => updateRates({ yarnProvided: v })} />
                  <Label className="text-xs">{copyText.yarnProvided}</Label>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch checked={stored.rates.selfResellRight} onCheckedChange={(v) => updateRates({ selfResellRight: v })} />
                  <Label className="text-xs">{copyText.selfResell}</Label>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch checked={stored.rates.resalePriceFloor} onCheckedChange={(v) => updateRates({ resalePriceFloor: v })} />
                  <Label className="text-xs">{copyText.resaleFloor}</Label>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch checked={stored.rates.rightsTransferred} onCheckedChange={(v) => updateRates({ rightsTransferred: v })} />
                  <Label className="text-xs">{copyText.transferred}</Label>
                </div>
              </div>
              <div className="border rounded-md divide-y">
                {rights.map((c) => (
                  <div key={c.item} className="px-3 py-2 flex items-start gap-2 text-sm">
                    {c.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />}
                    <div>
                      <span className="font-medium">{c.item}</span>
                      <p className="text-xs text-muted-foreground">{c.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-muted/40 rounded-md p-3 text-sm">
                <p className="font-medium mb-1">{copyText.suggestedFee}: {fmt$(fee.suggestedMin)} – {fmt$(fee.suggestedMax)}</p>
                {fee.notes.map((n, i) => <p key={i} className="text-xs text-muted-foreground">{n}</p>)}
              </div>
            </>
          )}
        </div>

        {/* Collab pitch */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{copyText.pitch}</h4>
            <div className="flex items-center gap-3">
              <Switch checked={stored.rates.showPitch} onCheckedChange={(v) => updateRates({ showPitch: v })} />
              <Button variant="outline" size="sm" disabled={!stored.rates.showPitch} onClick={() => copy(pitch, copyText.pitch)}>
                <ClipboardCopy className="h-4 w-4 mr-2" />{copyText.copyPitch}
              </Button>
            </div>
          </div>
          {stored.rates.showPitch && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">{copyText.followers}</Label>
                  <Input type="number" min={0} value={stored.rates.followers} onChange={(e) => updateRates({ followers: num(e.target.value, 0) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{copyText.newsletter}</Label>
                  <Input type="number" min={0} value={stored.rates.newsletter} onChange={(e) => updateRates({ newsletter: num(e.target.value, 0) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{copyText.patternsSold}</Label>
                  <Input type="number" min={0} value={stored.rates.patternsSold} onChange={(e) => updateRates({ patternsSold: num(e.target.value, 0) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{copyText.feeAsk}</Label>
                  <Input type="number" min={0} value={stored.rates.pitchFee} onChange={(e) => updateRates({ pitchFee: num(e.target.value, 0) })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{copyText.asking}</Label>
                <Input value={stored.rates.pitchAsk} onChange={(e) => updateRates({ pitchAsk: e.target.value })} />
              </div>
              <pre className="whitespace-pre-wrap text-xs bg-muted/40 rounded-md p-3 font-sans">{pitch}</pre>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {copyText.sources}
        </p>
      </CardContent>
    </Card>
  );
}
