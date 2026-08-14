import { useEffect, useMemo, useState } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCopy, FileText, Scale } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { YARN_WEIGHTS, YarnWeight } from '@/lib/yarn-estimator';
import { PLATFORMS, PLATFORM_LABELS, PlatformId } from '@/lib/pattern-income-calculator';
import {
  analyzeLicenseOffer,
  LICENCE_LABELS,
  LicenceOffer,
  LicenceType,
} from '@/lib/pattern-license-planner';

const STORAGE_KEY = 'pslc-v1';

interface StoredLicence {
  yarnWeight: string;
  platform: PlatformId;
  price: number;
  monthlySales: number;
  designRate: number;
  effortHours: number;
  horizonMonths: number;
  offer: Omit<LicenceOffer, 'type'> & { type: LicenceType };
}

function defaultStored(): StoredLicence {
  return {
    yarnWeight: 'worsted',
    platform: 'ravelry',
    price: 8,
    monthlySales: 10,
    designRate: 25,
    effortHours: 40,
    horizonMonths: 24,
    offer: {
      type: 'nonExclusive',
      fee: 120,
      royaltyPercent: 0,
      licensorMonthlySales: 0,
      exclusivityMonths: 0,
      licensorPaysProduction: true,
      productionCost: 0,
      marketingIncluded: false,
      derivativeRightsTransferred: false,
      worldwide: false,
      paymentTimingMonths: 0,
      creditAndPromotionRights: true,
    },
  };
}

function loadStored(handle: ProjectStorageHandle<StoredLicence>): StoredLicence {
  try {
    const parsed = handle.read();
    if (parsed) {
      if (parsed && parsed.offer) {
        return { ...defaultStored(), ...parsed, offer: { ...defaultStored().offer, ...parsed.offer } };
      }
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return defaultStored();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function PatternLicensePlannerCard({ project }: { project: PatternProject }) {
  // issue #4 project seam: one scoped store per project; the legacy flat key 'pslc-v1' is folded in on first read, then removed.
  const handle = useMemo(() => projectStorage<StoredLicence>('pslicense', project.id, ['pslc-v1']), [project.id]);
  const { toast } = useToast();
  const [stored, setStored] = useState(() => loadStored(handle));

  useEffect(() => {
    handle.write(stored);
  }, [stored]);

  const result = useMemo(
    () =>
      analyzeLicenseOffer({
        project,
        yarnWeight: stored.yarnWeight as YarnWeight,
        platform: stored.platform,
        price: stored.price,
        monthlySales: stored.monthlySales,
        designRate: stored.designRate,
        effortHours: stored.effortHours,
        horizonMonths: stored.horizonMonths,
        offer: stored.offer,
      }),
    [stored, project],
  );

  const setOffer = (patch: Partial<LicenceOffer>) =>
    setStored((s) => ({ ...s, offer: { ...s.offer, ...patch } }));
  const setField = (patch: Partial<StoredLicence>) => setStored((s) => ({ ...s, ...patch }));

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Select and copy manually' });
    }
  };

  const verdictColor =
    result.verdict === 'go' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
    result.verdict === 'no' ? 'bg-destructive/15 text-destructive border-destructive/30' :
    'bg-amber-500/15 text-amber-700 border-amber-500/30';

  const isRoyalty = stored.offer.type.startsWith('royalty');
  const isBuyout = stored.offer.type === 'exclusiveBuyout';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" /> Pattern License Planner
        </CardTitle>
        <CardDescription>
          A yarn company or marketplace wants the rights to this pattern? Price their offer against what
          self-publishing would earn — and run an eight-point rights audit before you sign anything.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pattern baseline */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="pl-weight">Yarn weight</Label>
            <Select value={stored.yarnWeight} onValueChange={(v) => setField({ yarnWeight: v })}>
              <SelectTrigger id="pl-weight"><SelectValue /></SelectTrigger>
              <SelectContent>
                {YARN_WEIGHTS.map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-platform">Where you'd self-sell</Label>
            <Select value={stored.platform} onValueChange={(v) => setField({ platform: v as PlatformId })}>
              <SelectTrigger id="pl-platform"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-price">Pattern price ($)</Label>
            <Input
              id="pl-price"
              type="number"
              min={0}
              value={stored.price}
              onChange={(e) => setField({ price: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-sales">Expected monthly sales</Label>
            <Input
              id="pl-sales"
              type="number"
              min={0}
              value={stored.monthlySales}
              onChange={(e) => setField({ monthlySales: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-rate">Design rate ($/hr)</Label>
            <Input
              id="pl-rate"
              type="number"
              min={12}
              value={stored.designRate}
              onChange={(e) => setField({ designRate: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-hours">Hours already invested</Label>
            <Input
              id="pl-hours"
              type="number"
              min={0}
              value={stored.effortHours}
              onChange={(e) => setField({ effortHours: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-horizon">Comparison horizon (months)</Label>
            <Input
              id="pl-horizon"
              type="number"
              min={1}
              max={60}
              value={stored.horizonMonths}
              onChange={(e) => setField({ horizonMonths: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* The offer */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="pl-type">Deal structure</Label>
            <Select value={stored.offer.type} onValueChange={(v) => setOffer({ type: v as LicenceType })}>
              <SelectTrigger id="pl-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(LICENCE_LABELS) as LicenceType[]).map((t) => (
                  <SelectItem key={t} value={t}>{LICENCE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!isRoyalty && (
            <div className="space-y-1.5">
              <Label htmlFor="pl-fee">One-off fee ($)</Label>
              <Input
                id="pl-fee"
                type="number"
                min={0}
                value={stored.offer.fee}
                onChange={(e) => setOffer({ fee: Number(e.target.value) })}
              />
            </div>
          )}
          {isRoyalty && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="pl-fee-r">Minimum guarantee ($)</Label>
                <Input
                  id="pl-fee-r"
                  type="number"
                  min={0}
                  value={stored.offer.fee}
                  onChange={(e) => setOffer({ fee: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pl-royalty">Royalty (%)</Label>
                <Input
                  id="pl-royalty"
                  type="number"
                  min={0}
                  max={100}
                  value={stored.offer.royaltyPercent}
                  onChange={(e) => setOffer({ royaltyPercent: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pl-lm">Licensor monthly sales</Label>
                <Input
                  id="pl-lm"
                  type="number"
                  min={0}
                  value={stored.offer.licensorMonthlySales}
                  onChange={(e) => setOffer({ licensorMonthlySales: Number(e.target.value) })}
                />
              </div>
            </>
          )}
          {!isBuyout && (
            <div className="space-y-1.5">
              <Label htmlFor="pl-window">Exclusivity window (months, 0 = none)</Label>
              <Input
                id="pl-window"
                type="number"
                min={0}
                max={60}
                value={stored.offer.exclusivityMonths}
                onChange={(e) => setOffer({ exclusivityMonths: Number(e.target.value) })}
              />
            </div>
          )}
          {!isRoyalty && (
            <div className="space-y-1.5">
              <Label htmlFor="pl-prod">Production you'd cover ($)</Label>
              <Input
                id="pl-prod"
                type="number"
                min={0}
                value={stored.offer.productionCost}
                onChange={(e) => setOffer({ productionCost: Number(e.target.value) })}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="pl-pay">Payment lag (months)</Label>
            <Input
              id="pl-pay"
              type="number"
              min={0}
              max={12}
              value={stored.offer.paymentTimingMonths}
              onChange={(e) => setOffer({ paymentTimingMonths: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={stored.offer.licensorPaysProduction}
              onCheckedChange={(v) => setOffer({ licensorPaysProduction: v })}
            />
            They cover sample / photo / tech edit
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={stored.offer.worldwide}
              onCheckedChange={(v) => setOffer({ worldwide: v })}
            />
            Worldwide rights
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={stored.offer.derivativeRightsTransferred}
              onCheckedChange={(v) => setOffer({ derivativeRightsTransferred: v })}
            />
            Derivatives transfer to them
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={stored.offer.creditAndPromotionRights}
              onCheckedChange={(v) => setOffer({ creditAndPromotionRights: v })}
            />
            I keep credit &amp; promotion rights
          </label>
        </div>

        {/* Verdict */}
        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={`${verdictColor} border text-base px-3 py-1 uppercase`}>{result.verdict}</Badge>
            <span className="text-sm font-medium">Rights audit: {result.rightsScore}/8 passed</span>
          </div>
          <p className="text-sm text-muted-foreground">{result.verdictNote}</p>
          <div className="grid gap-2 sm:grid-cols-4 text-sm">
            <div>Self-sell window value<div className="font-semibold">{fmt$(result.selfSellValue)}</div></div>
            <div>Fee + royalties value<div className="font-semibold">{fmt$(result.licensorIncomeValue)}</div></div>
            <div>Your labour floor<div className="font-semibold">{fmt$(result.labourValue)}</div></div>
            <div>Total offer value<div className="font-semibold">{fmt$(result.totalOfferValue)}</div></div>
          </div>
          <div className="text-sm text-muted-foreground">
            Keep self-publishing for {stored.horizonMonths} months: {fmt$(result.keepVsSell.selfSell24)} ·
            Sell under this deal now: {fmt$(result.keepVsSell.sellValue)} ·
            <span className="font-semibold"> {result.keepVsSell.difference >= 0 ? 'Sell wins by' : 'Keep wins by'} {fmt$(Math.abs(result.keepVsSell.difference))}</span>
          </div>
        </div>

        {/* Rights audit */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Rights audit</h4>
          {result.rightsAudit.map((check) => (
            <div key={check.check} className="rounded-md border bg-background p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={check.pass ? 'text-emerald-600' : 'text-destructive'}>{check.pass ? '✓' : '✗'}</span>
                <span className="font-medium">{check.check}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{check.note}</p>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="space-y-1 text-sm text-muted-foreground">
          {result.notes.map((n) => (
            <p key={n} className="flex gap-2"><span>•</span><span>{n}</span></p>
          ))}
        </div>

        {/* Offer letter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4" /> Your reply
            </h4>
            <Button variant="outline" size="sm" onClick={() => copy(result.offerLetter)}>
              <ClipboardCopy className="h-4 w-4" /> Copy
            </Button>
          </div>
          <pre className="whitespace-pre-wrap rounded-md border bg-background p-4 text-sm">
            {result.offerLetter}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
