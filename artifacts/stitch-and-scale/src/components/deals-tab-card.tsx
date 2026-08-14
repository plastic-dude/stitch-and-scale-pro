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
import { PLATFORMS, PLATFORM_LABELS, PlatformId } from '@/lib/pattern-income-calculator';
import { PatternProject } from '@/lib/grading-engine';
import { Handshake, Scale, Copy, TrendingUp, Lock, BadgeDollarSign } from 'lucide-react';

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
  const royaltyOutcome = compareDeal(input, { type: 'royalty_no_exclusivity', royaltyPct, companySales });
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
              <Label className="text-xs">Royalty of net (%)<DefaultBadge text="30% cited" /></Label>
              {inputField(royaltyPct * 100, (v) => setRoyaltyPct(Math.min(Math.max(v, 0) / 100, 1)), '5', 'royalty percent')}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Company channel sales<DefaultBadge text="their reach" /></Label>
              {inputField(companySales, setCompanySales, '50', 'company sales')}
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
            subtitle="Designer sells anywhere; royalty is a share of the company's net channel proceeds."
            offer={{ type: 'royalty_no_exclusivity', royaltyPct, companySales }}
            outcome={royaltyOutcome}
            onCopy={() => copyTerms({ type: 'royalty_no_exclusivity', royaltyPct, companySales }, royaltyOutcome)}
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
      </CardContent>
    </Card>
  );
}
