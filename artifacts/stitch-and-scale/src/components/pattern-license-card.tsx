import { copyTextOrThrow } from '@/lib/clipboard';
import { useMemo } from 'react';
import { useProjectStorage, useProjectStorageState } from '@/lib/storage-lib';
import { useSettings } from '@/context/SettingsContext';
import { PATTERN_LICENSE_COPY } from '@/lib/pattern-license-copy';
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
import { safeNum } from '@/lib/numeric-guard';
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

// CHK-152: pure derivation over the raw stored value — takes no
// handle, so it can never reach for a freshly-created handle in an initializer.
function bounded(raw: string | number, fallback: number, min = 0, max = Infinity): number {
  return Math.min(max, Math.max(min, safeNum(raw, fallback)));
}

function loadStored(raw: StoredLicence | null): StoredLicence {
  const base = defaultStored();
  try {
    if (raw?.offer) {
      const offer = { ...base.offer, ...raw.offer };
      return {
        ...base,
        ...raw,
        price: bounded(raw.price, base.price),
        monthlySales: bounded(raw.monthlySales, base.monthlySales),
        designRate: bounded(raw.designRate, base.designRate, 12),
        effortHours: bounded(raw.effortHours, base.effortHours),
        horizonMonths: bounded(raw.horizonMonths, base.horizonMonths, 1, 60),
        offer: {
          ...offer,
          fee: bounded(offer.fee, base.offer.fee),
          royaltyPercent: bounded(offer.royaltyPercent, base.offer.royaltyPercent, 0, 100),
          licensorMonthlySales: bounded(offer.licensorMonthlySales, base.offer.licensorMonthlySales),
          exclusivityMonths: bounded(offer.exclusivityMonths, base.offer.exclusivityMonths, 0, 60),
          productionCost: bounded(offer.productionCost, base.offer.productionCost),
          paymentTimingMonths: bounded(offer.paymentTimingMonths, base.offer.paymentTimingMonths, 0, 12),
        },
      };
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return base;
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function PatternLicensePlannerCard({ project }: { project: PatternProject }) {
  // issue #4 project seam: one scoped store per project; the legacy flat key 'pslc-v1' is folded in on first read, then removed.
  // CHK-152 (QUEUE-010): the old useMemo handle + `useState(() =>
  // loadStored(handle))` lazy initializer was the crash class under HMR.
  // Now flows through the shared seam: stable handle, memoized derivation.
  const handle = useProjectStorage<StoredLicence>('pslicense', project.id, ['pslc-v1']);
  const { toast } = useToast();
  const { language } = useSettings();
  const copyText = PATTERN_LICENSE_COPY[language];
  const [stored, setStored] = useProjectStorageState(handle, (raw) => loadStored(raw));
  // CHK-152: persistence owned by the seam's state hook — a manual
  // write-on-change effect would double-write every update.

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
      await copyTextOrThrow(text);
      toast({ title: copyText.copied });
    } catch {
      toast({ title: copyText.copyManually });
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
          <Scale className="h-5 w-5" /> {copyText.title}
        </CardTitle>
        <CardDescription>
          {copyText.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pattern baseline */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="pl-weight">{copyText.yarnWeight}</Label>
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
            <Label htmlFor="pl-platform">{copyText.selfSell}</Label>
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
            <Label htmlFor="pl-price">{copyText.patternPrice}</Label>
            <Input
              id="pl-price"
              type="number"
              min={0}
              value={stored.price}
              onChange={(e) => setField({ price: bounded(e.target.value, stored.price) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-sales">{copyText.monthlySales}</Label>
            <Input
              id="pl-sales"
              type="number"
              min={0}
              value={stored.monthlySales}
              onChange={(e) => setField({ monthlySales: bounded(e.target.value, stored.monthlySales) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-rate">{copyText.designRate}</Label>
            <Input
              id="pl-rate"
              type="number"
              min={12}
              value={stored.designRate}
              onChange={(e) => setField({ designRate: bounded(e.target.value, stored.designRate, 12) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-hours">{copyText.hoursInvested}</Label>
            <Input
              id="pl-hours"
              type="number"
              min={0}
              value={stored.effortHours}
              onChange={(e) => setField({ effortHours: bounded(e.target.value, stored.effortHours) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-horizon">{copyText.horizon}</Label>
            <Input
              id="pl-horizon"
              type="number"
              min={1}
              max={60}
              value={stored.horizonMonths}
              onChange={(e) => setField({ horizonMonths: bounded(e.target.value, stored.horizonMonths, 1, 60) })}
            />
          </div>
        </div>

        {/* The offer */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="pl-type">{copyText.dealStructure}</Label>
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
              <Label htmlFor="pl-fee">{copyText.oneOffFee}</Label>
              <Input
                id="pl-fee"
                type="number"
                min={0}
                value={stored.offer.fee}
                onChange={(e) => setOffer({ fee: bounded(e.target.value, stored.offer.fee) })}
              />
            </div>
          )}
          {isRoyalty && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="pl-fee-r">{copyText.minimumGuarantee}</Label>
                <Input
                  id="pl-fee-r"
                  type="number"
                  min={0}
                  value={stored.offer.fee}
                  onChange={(e) => setOffer({ fee: bounded(e.target.value, stored.offer.fee) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pl-royalty">{copyText.royalty}</Label>
                <Input
                  id="pl-royalty"
                  type="number"
                  min={0}
                  max={100}
                  value={stored.offer.royaltyPercent}
                  onChange={(e) => setOffer({ royaltyPercent: bounded(e.target.value, stored.offer.royaltyPercent, 0, 100) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pl-lm">{copyText.licensorSales}</Label>
                <Input
                  id="pl-lm"
                  type="number"
                  min={0}
                  value={stored.offer.licensorMonthlySales}
                  onChange={(e) => setOffer({ licensorMonthlySales: bounded(e.target.value, stored.offer.licensorMonthlySales) })}
                />
              </div>
            </>
          )}
          {!isBuyout && (
            <div className="space-y-1.5">
              <Label htmlFor="pl-window">{copyText.exclusivity}</Label>
              <Input
                id="pl-window"
                type="number"
                min={0}
                max={60}
                value={stored.offer.exclusivityMonths}
                onChange={(e) => setOffer({ exclusivityMonths: bounded(e.target.value, stored.offer.exclusivityMonths, 0, 60) })}
              />
            </div>
          )}
          {!isRoyalty && (
            <div className="space-y-1.5">
              <Label htmlFor="pl-prod">{copyText.production}</Label>
              <Input
                id="pl-prod"
                type="number"
                min={0}
                value={stored.offer.productionCost}
                onChange={(e) => setOffer({ productionCost: bounded(e.target.value, stored.offer.productionCost) })}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="pl-pay">{copyText.paymentLag}</Label>
            <Input
              id="pl-pay"
              type="number"
              min={0}
              max={12}
              value={stored.offer.paymentTimingMonths}
              onChange={(e) => setOffer({ paymentTimingMonths: bounded(e.target.value, stored.offer.paymentTimingMonths, 0, 12) })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={stored.offer.licensorPaysProduction}
              onCheckedChange={(v) => setOffer({ licensorPaysProduction: v })}
            />
            {copyText.coverCosts}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={stored.offer.worldwide}
              onCheckedChange={(v) => setOffer({ worldwide: v })}
            />
            {copyText.worldwide}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={stored.offer.derivativeRightsTransferred}
              onCheckedChange={(v) => setOffer({ derivativeRightsTransferred: v })}
            />
            {copyText.derivatives}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={stored.offer.creditAndPromotionRights}
              onCheckedChange={(v) => setOffer({ creditAndPromotionRights: v })}
            />
            {copyText.keepRights}
          </label>
        </div>

        {/* Verdict */}
        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={`${verdictColor} border text-base px-3 py-1 uppercase`}>{result.verdict}</Badge>
            <span className="text-sm font-medium">{copyText.rightsAuditPassed(result.rightsScore)}</span>
          </div>
          <p className="text-sm text-muted-foreground">{result.verdictNote}</p>
          <div className="grid gap-2 sm:grid-cols-4 text-sm">
            <div>{copyText.selfSellWindow}<div className="font-semibold">{fmt$(result.selfSellValue)}</div></div>
            <div>{copyText.feeRoyalties}<div className="font-semibold">{fmt$(result.licensorIncomeValue)}</div></div>
            <div>{copyText.labourFloor}<div className="font-semibold">{fmt$(result.labourValue)}</div></div>
            <div>{copyText.totalOffer}<div className="font-semibold">{fmt$(result.totalOfferValue)}</div></div>
          </div>
          <div className="text-sm text-muted-foreground">
            {copyText.keepVsSell(stored.horizonMonths, fmt$(result.keepVsSell.selfSell24), fmt$(result.keepVsSell.sellValue), result.keepVsSell.difference >= 0 ? copyText.sellWinsBy : copyText.keepWinsBy, fmt$(Math.abs(result.keepVsSell.difference)))}
          </div>
        </div>

        {/* Rights audit */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{copyText.rightsAudit}</h4>
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
              <FileText className="h-4 w-4" /> {copyText.reply}
            </h4>
            <Button variant="outline" size="sm" onClick={() => copy(result.offerLetter)}>
              <ClipboardCopy className="h-4 w-4" /> {copyText.copy}
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
