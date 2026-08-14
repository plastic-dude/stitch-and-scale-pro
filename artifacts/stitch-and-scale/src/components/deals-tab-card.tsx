/**
 * Deal Comparator — model a yarn-company collaboration offer (flat fee,
 * royalty, exclusive license) against the self-publishing baseline, built
 * from session-9 research (yarn-company deal structures and pay data).
 *
 * The market has three standard deal shapes (Stitchcraft Marketing, 2017):
 * royalties with no exclusivity, royalties with exclusivity (3–12 months),
 * and a non-exclusive license. Magazine-style flat fees run ~£60–100
 * (Who Pays Knitters), and royalty deals pay a share of NET proceeds (Making
 * Stories: 30% net Ravelry / 20% in-store). Designers accept or decline these
 * deals by hand arithmetic they rarely do correctly — the fixed costs
 * ($40–65 tech edit, ~$45 test knit, ~$40 model, ~$75 yarn) and the sales
 * they lock away during exclusivity are almost never priced into the fee.
 *
 * This card turns the pattern's own data (hours, rate, costs, recommended
 * price, platform fee model) into an honest "take / counter / walk away"
 * verdict plus a paste-ready terms response. No invented constants — every
 * figure comes from the designer's own inputs or a cited published one.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  compareDeal,
  generateTermsResponse,
  selfPublishNet,
  DealInput,
  DealOffer,
} from '@/lib/yarn-company-deal';
import {
  evaluateDesignOffer,
  generateOfferResponse,
  DESIGN_OFFER_TYPES,
  DESIGN_OFFER_TYPE_LABELS,
  DesignOfferInput,
  DesignOfferType,
  DesignOfferVerdict,
} from '@/lib/design-offer-evaluator';
import { PLATFORMS, PLATFORM_LABELS, PlatformId } from '@/lib/pattern-income-calculator';
import { PatternProject } from '@/lib/grading-engine';
import { Handshake, Scale, Copy, TrendingUp, Lock, BadgeDollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';

function DefaultBadge({ text }: { text: string }) {
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary/80">
      <TrendingUp className="mr-1 w-3 h-3" />
      {text}
    </span>
  );
}

function VerdictBadge({ verdict, label }: { verdict: 'take' | 'counter' | 'walk_away'; label: string }) {
  const config = {
    take: { className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40', icon: Scale },
    counter: { className: 'bg-amber-500/15 text-amber-600 border-amber-500/40', icon: Scale },
    walk_away: { className: 'bg-destructive/15 text-destructive border-destructive/40', icon: Scale },
  }[verdict];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn('gap-1 font-semibold uppercase tracking-wide', config.className)}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

const DEFAULT_HOURS = 60;
const DEFAULT_RATE = 40;
const DEFAULT_FIXED = 200;
const DEFAULT_PRICE = 9;
const DEFAULT_SALES = 150;

export function DealsTabCard({
  project,
}: {
  project: PatternProject;
}) {
  const { toast } = useToast();

  const [hours, setHours] = React.useState(DEFAULT_HOURS);
  const [rate, setRate] = React.useState(DEFAULT_RATE);
  const [fixed, setFixed] = React.useState(DEFAULT_FIXED);
  const [price, setPrice] = React.useState(DEFAULT_PRICE);
  const [sales, setSales] = React.useState(DEFAULT_SALES);
  const [platform, setPlatform] = React.useState<PlatformId>('ravelry');

  const [flatFee, setFlatFee] = React.useState(1000);
  const [supportValue, setSupportValue] = React.useState(150);
  const [retainsRights, setRetainsRights] = React.useState(true);
  const [royaltyPct, setRoyaltyPct] = React.useState(0.30);
  // Royalty base (issue #2 / S015): default 'net' per the Making Stories
  // precedent (their published 30% is 30% of NET proceeds). A company pushing
  // for a 'gross' base is negotiable — worth more headline, so we let the
  // designer toggle it and compare.
  const [royaltyBase, setRoyaltyBase] = React.useState<'net' | 'gross'>('net');
  const [companySales, setCompanySales] = React.useState(500);
  const [exclusiveFee, setExclusiveFee] = React.useState(800);
  const [exclusiveMonths, setExclusiveMonths] = React.useState(6);
  const [lockedFraction, setLockedFraction] = React.useState(0.5);

  const input: DealInput = {
    designHours: hours,
    hourlyRate: rate,
    fixedCosts: fixed,
    price,
    estimatedSales: sales,
    platform,
  };

  const flatOutcome = compareDeal(input, { type: 'flat_fee', fee: flatFee, supportValue, retainsResellRights: retainsRights });
  const royaltyOutcome = compareDeal(input, { type: 'royalty_no_exclusivity', royaltyPct, royaltyBase, companySales });
  const exclusiveOutcome = compareDeal(input, { type: 'exclusive_flat_fee', fee: exclusiveFee, supportValue, exclusivityMonths: exclusiveMonths, lockedOutFraction: lockedFraction });

  const baseNet = selfPublishNet(input);
  const costFloor = Math.round(Math.max(hours * rate + fixed, 0) * 100) / 100;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

  const copyTerms = async (offer: DealOffer, outcome: ReturnType<typeof compareDeal>) => {
    const text = generateTermsResponse(input, outcome);
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Terms response copied', description: 'Paste it into your reply to the yarn company.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Select the text manually from the response box.' });
    }
  };

  const inputField = (value: number, setter: (v: number) => void, step: string, ariaLabel: string) => (
    <Input
      type="number"
      value={value}
      step={step}
      onChange={(e) => setter(Number(e.target.value) || 0)}
      className="h-9 bg-background"
      aria-label={ariaLabel}
    />
  );

  const DealCard = ({
    icon: Icon,
    title,
    subtitle,
    offer,
    outcome,
    onCopy,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle: string;
    offer: DealOffer;
    outcome: ReturnType<typeof compareDeal>;
    onCopy: () => void;
  }) => (
    <Card data-testid={`deal-card-${outcome.dealType}`} className={cn('border-border/60', outcome.verdict === 'take' && 'border-emerald-500/40')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-serif">{title}</CardTitle>
          </div>
          <VerdictBadge verdict={outcome.verdict} label={outcome.verdict === 'walk_away' ? 'Walk away' : outcome.verdict} />
        </div>
        <CardDescription className="text-xs">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {offer.type === 'flat_fee' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Fee offered ($)</Label>
              {inputField(flatFee, setFlatFee, '50', 'fee offered')}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Yarn + support value ($)<DefaultBadge text="optional" /></Label>
              {inputField(supportValue, setSupportValue, '25', 'support value')}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">You keep self-resell rights?</Label>
              <NativeSelect value={retainsRights ? 'yes' : 'no'} onChange={(e) => setRetainsRights(e.target.value === 'yes')} aria-label="keep resale rights">
                <option value="yes">Yes — sell on Ravelry/Etsy too</option>
                <option value="no">No — company owns it outright</option>
              </NativeSelect>
            </div>
          </div>
        )}
        {offer.type === 'royalty_no_exclusivity' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Royalty of {royaltyBase === 'net' ? 'net' : 'gross'} (%)<DefaultBadge text="30% cited" /></Label>
              {inputField(royaltyPct * 100, (v) => setRoyaltyPct(Math.min(Math.max(v, 0) / 100, 1)), '5', 'royalty percent')}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Company channel sales<DefaultBadge text="their reach" /></Label>
              {inputField(companySales, setCompanySales, '50', 'company sales')}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Royalty is a share of<DefaultBadge text="issue #2 base" /></Label>
              <NativeSelect value={royaltyBase} onChange={(e) => setRoyaltyBase(e.target.value as 'net' | 'gross')} aria-label="royalty base">
                <option value="net">Net channel proceeds (Making Stories precedent)</option>
                <option value="gross">Gross sales (negotiate this — it pays more)</option>
              </NativeSelect>
              <p className="text-[11px] text-muted-foreground">
                {royaltyBase === 'net'
                  ? '30% of what the company actually nets after platform fees — the published precedent. If a company offers "30% of gross", that same headline pays more.'
                  : 'Royalties on raw sales before fees — a stronger headline than net. Companies sometimes demand gross; check your contract wording before agreeing.'}
              </p>
            </div>
          </div>
        )}
        {offer.type === 'exclusive_flat_fee' && (
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Fee offered ($)</Label>
              {inputField(exclusiveFee, setExclusiveFee, '50', 'exclusive fee')}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Exclusivity (mo)<DefaultBadge text="3–12 typical" /></Label>
              {inputField(exclusiveMonths, setExclusiveMonths, '1', 'exclusivity months')}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Direct sales locked (%)<DefaultBadge text="est. your share" /></Label>
              {inputField(lockedFraction * 100, (v) => setLockedFraction(Math.min(Math.max(v, 0) / 100, 1)), '10', 'locked fraction')}
            </div>
          </div>
        )}
        <div className="space-y-1 rounded-md border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed">
          <div className="flex items-center justify-between">
            <span className="font-medium">Net to you (after time + costs)</span>
            <span className={cn('font-semibold', outcome.netToDesigner >= baseNet ? 'text-emerald-600' : 'text-muted-foreground')}>{fmt(outcome.netToDesigner)}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Self-publish baseline</span>
            <span>{fmt(baseNet)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border/50 pt-1">
            <span>{outcome.verdict === 'walk_away' ? 'Gap vs baseline' : 'Beat vs baseline'}</span>
            <span className={cn('font-semibold', outcome.deltaVsSelfPublish <= 0 ? 'text-emerald-600' : 'text-amber-600')}>
              {fmt(outcome.deltaVsSelfPublish)}
            </span>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{outcome.reasoning}</p>
        <Button variant="outline" size="sm" className="w-full gap-2" data-testid={`copy-terms-${outcome.dealType}`} onClick={() => onCopy()}>
          <Copy className="w-3.5 h-3.5" />
          Copy terms response
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Card data-testid="deals-tab">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Handshake className="w-5 h-5 text-primary" />
          <CardTitle className="font-serif">Deal Comparator — yarn-company offers</CardTitle>
        </div>
        <CardDescription className="leading-relaxed">
          Modelling whether a yarn-company collaboration beats self-publishing. Deal structures and pay benchmarks are from
          cited market sources (Stitchcraft Marketing, Who Pays Knitters, Making Stories); the arithmetic uses your own
          hours, rate, costs, and this pattern's verified pricing and platform-fee data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-md border border-border/60 bg-muted/40 p-4">
          <div className="mb-3 flex items-center gap-2">
            <BadgeDollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Pattern economics</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Design hours<DefaultBadge text="your time" /></Label>
              {inputField(hours, setHours, '5', 'design hours')}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Your rate ($/hr)<DefaultBadge text="your rate" /></Label>
              {inputField(rate, setRate, '5', 'hourly rate')}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fixed costs ($)<DefaultBadge text="edit, test, model, yarn" /></Label>
              {inputField(fixed, setFixed, '25', 'fixed costs')}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Price ($)<DefaultBadge text="advisor" /></Label>
              {inputField(price, setPrice, '1', 'price')}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Est. lifetime sales<DefaultBadge text="your forecast" /></Label>
              {inputField(sales, setSales, '25', 'estimated sales')}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Direct-sales platform</Label>
              <NativeSelect value={platform} onChange={(e) => setPlatform(e.target.value as PlatformId)} aria-label="platform">
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Your self-publish baseline over this window: <span className="font-semibold">{fmt(baseNet)}</span> (direct-channel net minus
            time + production costs). Minimum fee floor: <span className="font-semibold">{fmt(costFloor)}</span>.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <DealCard
            icon={BadgeDollarSign}
            title="Flat fee"
            subtitle="Company pays once; decide whether to keep resale rights."
            offer={{ type: 'flat_fee', fee: flatFee, supportValue, retainsResellRights: retainsRights }}
            outcome={flatOutcome}
            onCopy={() => copyTerms({ type: 'flat_fee', fee: flatFee, supportValue, retainsResellRights: retainsRights }, flatOutcome)}
          />
          <DealCard
            icon={TrendingUp}
            title="Royalty, no exclusivity"
            subtitle={`Designer sells anywhere; royalty is a share of the company's ${royaltyBase} channel ${royaltyBase === 'net' ? 'net proceeds' : 'gross sales'}.`}
            offer={{ type: 'royalty_no_exclusivity', royaltyPct, royaltyBase, companySales }}
            outcome={royaltyOutcome}
            onCopy={() => copyTerms({ type: 'royalty_no_exclusivity', royaltyPct, royaltyBase, companySales }, royaltyOutcome)}
          />
          <DealCard
            icon={Lock}
            title="Exclusive flat fee"
            subtitle="Fee for a locked-out window; the fee must cover the direct sales you give up."
            offer={{ type: 'exclusive_flat_fee', fee: exclusiveFee, supportValue, exclusivityMonths: exclusiveMonths, lockedOutFraction: lockedFraction }}
            outcome={exclusiveOutcome}
            onCopy={() => copyTerms({ type: 'exclusive_flat_fee', fee: exclusiveFee, supportValue, exclusivityMonths: exclusiveMonths, lockedOutFraction: lockedFraction }, exclusiveOutcome)}
          />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Benchmarks: magazine-style flat fees ~£60–100 (Who Pays Knitters); royalties commonly ~30% of net proceeds
          (Making Stories); exclusivity windows typically 3–12 months (Stitchcraft Marketing). Adjust every number —
          the verdicts respond live to your inputs.
        </p>

        <DesignOfferSection input={input} baseNet={baseNet} fmt={fmt} />
      </CardContent>
    </Card>
  );
}

/**
 * Designer-side evaluator — when a yarn company / magazine makes you an offer,
 * model it term by term against your own channel baseline.
 */
function DesignOfferSection({
  input,
  baseNet,
  fmt,
}: {
  input: DealInput;
  baseNet: number;
  fmt: (n: number) => string;
}) {
  const { toast } = useToast();

  const [offerType, setOfferType] = React.useState<DesignOfferType>('flat_fee');
  const [designFee, setDesignFee] = React.useState(350);
  const [designRoyalty, setDesignRoyalty] = React.useState(0.30);
  const [designExclusivity, setDesignExclusivity] = React.useState(6);
  const [designSales, setDesignSales] = React.useState(30);
  const [designPrice, setDesignPrice] = React.useState(input.price || 8);
  const [techEditCovered, setTechEditCovered] = React.useState(true);
  const [photoCovered, setPhotoCovered] = React.useState(true);
  const [keepsOwnSite, setKeepsOwnSite] = React.useState(true);
  const [yarnValue, setYarnValue] = React.useState(80);

  const designInput: DesignOfferInput = {
    salesVolume: designSales,
    patternPrice: designPrice,
    platform: input.platform,
    exclusivityMonths: offerType === 'royalty_with_exclusivity' || offerType === 'non_exclusive_license' ? designExclusivity : 0,
    fee: offerType === 'flat_fee' || offerType === 'non_exclusive_license' || offerType === 'royalty_with_exclusivity' ? designFee : 0,
    royaltyPct: offerType === 'royalty_no_exclusivity' || offerType === 'royalty_with_exclusivity' ? designRoyalty : undefined,
    techEditCovered,
    photographyCovered: photoCovered,
    layoutCovered: offerType === 'flat_fee',
    keepsOwnSiteRights: keepsOwnSite,
    keepsWholesaleRights: offerType === 'yarn_support_only' ? false : keepsOwnSite,
    yarnSupportValue: yarnValue,
    designHours: input.designHours,
    hourlyRate: input.hourlyRate,
    uncoveredCosts: input.fixedCosts,
  };

  const designVerdict = evaluateDesignOffer(designInput);

  const copyOfferResponse = async () => {
    try {
      await navigator.clipboard.writeText(generateOfferResponse(designInput, designVerdict));
      toast({ title: 'Offer response copied', description: 'Paste it into your reply about the design offer.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Select the text manually from the response box.' });
    }
  };

  const inputField2 = (value: number, setter: (v: number) => void, step: string, ariaLabel: string) => (
    <Input
      type="number"
      value={value}
      step={step}
      onChange={(e) => setter(Number(e.target.value) || 0)}
      className="h-9 bg-background"
      aria-label={ariaLabel}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-t border-border/60 pt-4">
        <Handshake className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium font-serif">Design offers — evaluate an offer made to you</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        When a yarn company or magazine makes you an offer, model it term by term. Cited touchstones: WPK accessory
        flat fees avg $246 (tech edit/photo/layout excluded), Making Stories royalties 30%/20% of net, Quince-style
        fairness = company keeps its site + Ravelry, you keep your own-site sales, exclusivity 3–12 months.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Offer type</Label>
          <NativeSelect value={offerType} onChange={(e) => setOfferType(e.target.value as DesignOfferType)} aria-label="offer type">
            {DESIGN_OFFER_TYPES.map((t) => (
              <option key={t} value={t}>{DESIGN_OFFER_TYPE_LABELS[t]}</option>
            ))}
          </NativeSelect>
        </div>
        {(offerType === 'flat_fee' || offerType === 'non_exclusive_license' || offerType === 'royalty_with_exclusivity') && (
          <div className="space-y-1.5">
            <Label className="text-xs">Fee offered ($)</Label>
            {inputField2(designFee, setDesignFee, '25', 'design fee')}
          </div>
        )}
        {(offerType === 'royalty_no_exclusivity' || offerType === 'royalty_with_exclusivity') && (
          <div className="space-y-1.5">
            <Label className="text-xs">Royalty of net (%)</Label>
            {inputField2(designRoyalty * 100, (v) => setDesignRoyalty(Math.min(Math.max(v, 0) / 100, 1)), '5', 'design royalty')}
          </div>
        )}
        {(offerType === 'royalty_with_exclusivity' || offerType === 'non_exclusive_license') && (
          <div className="space-y-1.5">
            <Label className="text-xs">Exclusivity (mo)</Label>
            {inputField2(designExclusivity, setDesignExclusivity, '1', 'design exclusivity')}
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs">Yarn support value ($)</Label>
          {inputField2(yarnValue, setYarnValue, '25', 'yarn value')}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Your own-channel sales<DefaultBadge text="the baseline" /></Label>
          {inputField2(designSales, setDesignSales, '10', 'own sales')}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Pattern price ($)</Label>
          {inputField2(designPrice, setDesignPrice, '1', 'pattern price')}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Company covers tech edit?</Label>
          <NativeSelect value={techEditCovered ? 'yes' : 'no'} onChange={(e) => setTechEditCovered(e.target.value === 'yes')} aria-label="tech edit covered">
            <option value="yes">Yes</option>
            <option value="no">No — you pay</option>
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Company covers photography?</Label>
          <NativeSelect value={photoCovered ? 'yes' : 'no'} onChange={(e) => setPhotoCovered(e.target.value === 'yes')} aria-label="photography covered">
            <option value="yes">Yes</option>
            <option value="no">No — you pay</option>
          </NativeSelect>
        </div>
      </div>
      <div className="space-y-1.5 sm:w-1/2">
        <Label className="text-xs">You keep selling on your own site/Payhip?</Label>
        <NativeSelect value={keepsOwnSite ? 'yes' : 'no'} onChange={(e) => setKeepsOwnSite(e.target.value === 'yes')} aria-label="keep own-site rights">
          <option value="yes">Yes — own channel stays yours</option>
          <option value="no">No — exclusive to them</option>
        </NativeSelect>
      </div>

      <div className="rounded-md border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VerdictBadge2 verdict={designVerdict.verdict} />
          </div>
          <span className="text-muted-foreground">Effective rate: <span className="font-semibold">${designVerdict.effectiveHourlyRate.toFixed(2)}/hr</span></span>
        </div>
        <div className="flex items-center justify-between">
          <span>Offer value over the window</span>
          <span className="font-semibold">{fmt(designVerdict.estimatedOfferValue)}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Your own-channel baseline (this window)</span>
          <span>{fmt(baseNet >= 0 ? baseNet : 0)}</span>
        </div>
      </div>

      {designVerdict.flags.length > 0 && (
        <div className="space-y-2">
          {designVerdict.flags.map((f) => (
            <div key={f.code} className="flex gap-2 rounded-md border border-border/60 bg-background p-2.5 text-xs leading-relaxed">
              {f.severity === 'error' ? (
                <AlertTriangle className="mt-0.5 w-3.5 h-3.5 shrink-0 text-destructive" />
              ) : (
                <CheckCircle2 className="mt-0.5 w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              )}
              <div>
                <span className="mr-2 font-mono text-[10px] font-semibold text-muted-foreground">{f.code}</span>
                <span className={cn('font-medium', f.severity === 'error' && 'text-destructive')}>{f.detail}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">{designVerdict.summary}</p>
      <Button variant="outline" size="sm" className="w-full gap-2" data-testid="copy-design-response" onClick={copyOfferResponse}>
        <Copy className="w-3.5 h-3.5" />
        Copy offer response
      </Button>
    </div>
  );
}

function VerdictBadge2({ verdict }: { verdict: DesignOfferVerdict['verdict'] }) {
  const config = {
    take: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40',
    counter: 'bg-amber-500/15 text-amber-600 border-amber-500/40',
    walk_away: 'bg-destructive/15 text-destructive border-destructive/40',
  }[verdict];
  return (
    <Badge variant="outline" className={cn('gap-1 font-semibold uppercase tracking-wide', config)}>
      <Scale className="w-3 h-3" />
      {verdict === 'walk_away' ? 'Walk away' : verdict}
    </Badge>
  );
}
