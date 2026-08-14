import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, ClipboardCopy, Package, TrendingUp, ShieldCheck } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { YarnWeight, YARN_WEIGHTS, YARN_WEIGHT_LABELS } from '@/lib/yarn-estimator';
import { PlatformId, PLATFORMS, PLATFORM_LABELS } from '@/lib/pattern-income-calculator';
import {
  buildKitCogs,
  analyzeKitChannels,
  consignmentClauseChecklist,
  generateKitProposal,
  CHANNEL_LABELS,
  type KitChannel,
} from '@/lib/kit-economics';

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function CopyLine({ text, label }: { text: string; label: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast({ title: 'Copied', description: label });
    } catch {
      toast({ title: 'Copy failed', description: 'Select the text manually.' });
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

interface StoredKitState {
  weight: YarnWeight;
  pricePerSkein: string;
  notionsCost: string;
  packagingCost: string;
  labourHours: string;
  labourRate: string;
  overheadShare: string;
  retailPrice: string;
  consignorShare: string;
  processorFeePct: string;
  monthlyKitSales: string;
  monthlyConsignmentSales: string;
  wholesaleKitsPerOrder: string;
  monthlyWholesaleOrders: string;
  wholesaleMarketplaceFeePct: string;
  soloPatternIncome: string;
  platform: PlatformId;
  shopName: string;
}

function loadStored(projectId: string): StoredKitState {
  try {
    const raw = localStorage.getItem(`kit-economics-${projectId}`);
    if (raw) return { ...(JSON.parse(raw) as Partial<StoredKitState>) } as StoredKitState;
  } catch {
    /* fall through */
  }
  return {
    weight: 'worsted',
    pricePerSkein: '12',
    notionsCost: '4',
    packagingCost: '3.5',
    labourHours: '1',
    labourRate: '25',
    overheadShare: '2',
    retailPrice: '85',
    consignorShare: '0.6',
    processorFeePct: '0.029',
    monthlyKitSales: '8',
    monthlyConsignmentSales: '5',
    wholesaleKitsPerOrder: '12',
    monthlyWholesaleOrders: '2',
    wholesaleMarketplaceFeePct: '0',
    soloPatternIncome: '80',
    platform: 'etsy',
    shopName: '',
  };
}

export function KitEconomicsCard({ project }: { project: PatternProject }) {
  const stored = React.useRef<StoredKitState>(loadStored(project.id));
  const saved = stored.current;

  const [weight, setWeight] = React.useState<YarnWeight>(saved.weight);
  const [pricePerSkein, setPricePerSkein] = React.useState(saved.pricePerSkein);
  const [notionsCost, setNotionsCost] = React.useState(saved.notionsCost);
  const [packagingCost, setPackagingCost] = React.useState(saved.packagingCost);
  const [labourHours, setLabourHours] = React.useState(saved.labourHours);
  const [labourRate, setLabourRate] = React.useState(saved.labourRate);
  const [overheadShare, setOverheadShare] = React.useState(saved.overheadShare);
  const [retailPrice, setRetailPrice] = React.useState(saved.retailPrice);
  const [consignorShare, setConsignorShare] = React.useState(saved.consignorShare);
  const [processorFeePct, setProcessorFeePct] = React.useState(saved.processorFeePct);
  const [monthlyKitSales, setMonthlyKitSales] = React.useState(saved.monthlyKitSales);
  const [monthlyConsignmentSales, setMonthlyConsignmentSales] = React.useState(saved.monthlyConsignmentSales);
  const [wholesaleKitsPerOrder, setWholesaleKitsPerOrder] = React.useState(saved.wholesaleKitsPerOrder);
  const [monthlyWholesaleOrders, setMonthlyWholesaleOrders] = React.useState(saved.monthlyWholesaleOrders);
  const [wholesaleMarketplaceFeePct, setWholesaleMarketplaceFeePct] = React.useState(saved.wholesaleMarketplaceFeePct);
  const [soloPatternIncome, setSoloPatternIncome] = React.useState(saved.soloPatternIncome);
  const [platform, setPlatform] = React.useState<PlatformId>(saved.platform);
  const [shopName, setShopName] = React.useState(saved.shopName);

  React.useEffect(() => {
    localStorage.setItem(
      `kit-economics-${project.id}`,
      JSON.stringify({
        weight,
        pricePerSkein,
        notionsCost,
        packagingCost,
        labourHours,
        labourRate,
        overheadShare,
        retailPrice,
        consignorShare,
        processorFeePct,
        monthlyKitSales,
        monthlyConsignmentSales,
        wholesaleKitsPerOrder,
        monthlyWholesaleOrders,
        wholesaleMarketplaceFeePct,
        soloPatternIncome,
        platform,
        shopName,
      }),
    );
  }, [
    project.id,
    weight,
    pricePerSkein,
    notionsCost,
    packagingCost,
    labourHours,
    labourRate,
    overheadShare,
    retailPrice,
    consignorShare,
    processorFeePct,
    monthlyKitSales,
    monthlyConsignmentSales,
    wholesaleKitsPerOrder,
    monthlyWholesaleOrders,
    wholesaleMarketplaceFeePct,
    soloPatternIncome,
    platform,
    shopName,
  ]);

  const cogs = React.useMemo(
    () =>
      buildKitCogs(project, weight, num(pricePerSkein), {
        notionsCost: num(notionsCost),
        packagingCost: num(packagingCost),
        labourHours: num(labourHours),
        labourRate: num(labourRate),
        overheadShare: num(overheadShare),
      }),
    [project, weight, pricePerSkein, notionsCost, packagingCost, labourHours, labourRate, overheadShare],
  );

  const result = React.useMemo(
    () =>
      analyzeKitChannels({
        kitCogs: cogs.totalCogs,
        retailPrice: num(retailPrice),
        consignorShare: num(consignorShare),
        processorFeePct: num(processorFeePct),
        monthlyKitSales: num(monthlyKitSales),
        monthlyConsignmentSales: num(monthlyConsignmentSales),
        wholesaleKitsPerOrder: Math.max(1, Math.round(num(wholesaleKitsPerOrder) || 12)),
        monthlyWholesaleOrders: num(monthlyWholesaleOrders),
        wholesaleMarketplaceFeePct: num(wholesaleMarketplaceFeePct),
        soloPatternIncomeMonthly: num(soloPatternIncome),
        platform,
      }),
    [cogs.totalCogs, retailPrice, consignorShare, processorFeePct, monthlyKitSales, monthlyConsignmentSales, wholesaleKitsPerOrder, monthlyWholesaleOrders, wholesaleMarketplaceFeePct, soloPatternIncome, platform],
  );

  const wholesalePrice = num(retailPrice) / 2;

  const clauses = React.useMemo(
    () =>
      consignmentClauseChecklist({
        shopName: shopName || 'the yarn shop',
        consignorShare: num(consignorShare),
      }),
    [shopName, consignorShare],
  );

  const proposal = React.useMemo(
    () => generateKitProposal(project, num(retailPrice), wholesalePrice, { shopName: shopName || undefined }),
    [project, retailPrice, shopName, wholesalePrice],
  );

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Package className="w-5 h-5 text-accent" />
          Kit Economics
        </CardTitle>
        <CardDescription>
          The only thing that turns a pattern into a kit channel is a price the market accepts against a cost
          stack you actually pay. This builds the kit's true COGS from the project's yardage model, then
          stress-tests three channels side by side — self-sell, LYS consignment, and keystone wholesale —
          with cited fee models.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Yarn weight</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={weight}
              onChange={e => setWeight(e.target.value as YarnWeight)}>
              {YARN_WEIGHTS.map(w => (
                <option key={w} value={w}>
                  {YARN_WEIGHT_LABELS[w]}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Drives yarn COGS via the yardage model.</p>
          </div>
          <div className="space-y-2">
            <Label>Yarn price / 100g skein ($)</Label>
            <Input type="number" min={0} value={pricePerSkein} onChange={e => setPricePerSkein(e.target.value)} />
            <p className="text-xs text-muted-foreground">What you actually pay per skein.</p>
          </div>
          <div className="space-y-2">
            <Label>Kit retail price ($)</Label>
            <Input type="number" min={0} value={retailPrice} onChange={e => setRetailPrice(e.target.value)} />
            <p className="text-xs text-muted-foreground">The price knitters see everywhere.</p>
          </div>
          <div className="space-y-2">
            <Label>Self-sell platform</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={platform}
              onChange={e => setPlatform(e.target.value as PlatformId)}>
              {PLATFORMS.map(p => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Fees from the Income Planner's cited model — one seam.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Notions ($)</Label>
            <Input type="number" min={0} value={notionsCost} onChange={e => setNotionsCost(e.target.value)} />
            <p className="text-xs text-muted-foreground">Buttons, ties, waste yarn, printout.</p>
          </div>
          <div className="space-y-2">
            <Label>Packaging ($)</Label>
            <Input type="number" min={0} value={packagingCost} onChange={e => setPackagingCost(e.target.value)} />
            <p className="text-xs text-muted-foreground">Box, label, tissue paper.</p>
          </div>
          <div className="space-y-2">
            <Label>Kitting labour (hours)</Label>
            <Input type="number" min={0} value={labourHours} onChange={e => setLabourHours(e.target.value)} />
            <p className="text-xs text-muted-foreground">Assembly time per kit.</p>
          </div>
          <div className="space-y-2">
            <Label>Labour rate ($/hr)</Label>
            <Input type="number" min={0} value={labourRate} onChange={e => setLabourRate(e.target.value)} />
            <p className="text-xs text-muted-foreground">Including your own time — the line most makers skip.</p>
          </div>
          <div className="space-y-2">
            <Label>Overhead share ($)</Label>
            <Input type="number" min={0} value={overheadShare} onChange={e => setOverheadShare(e.target.value)} />
            <p className="text-xs text-muted-foreground">Studio share per kit.</p>
          </div>
          <div className="space-y-2">
            <Label>Consignor share</Label>
            <Input type="number" min={0} max={1} step={0.05} value={consignorShare} onChange={e => setConsignorShare(e.target.value)} />
            <p className="text-xs text-muted-foreground">0.60 = you keep 60% — the cited industry standard.</p>
          </div>
          <div className="space-y-2">
            <Label>Processor fee (deducted before split)</Label>
            <Input type="number" min={0} max={1} step={0.001} value={processorFeePct} onChange={e => setProcessorFeePct(e.target.value)} />
            <p className="text-xs text-muted-foreground">2.6–3.5% card processing, off the top.</p>
          </div>
          <div className="space-y-2">
            <Label>Wholesale marketplace fee</Label>
            <Input type="number" min={0} max={1} step={0.05} value={wholesaleMarketplaceFeePct} onChange={e => setWholesaleMarketplaceFeePct(e.target.value)} />
            <p className="text-xs text-muted-foreground">Faire-style: 15% new retailers, 0% existing.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Kits / mo — self-sell</Label>
            <Input type="number" min={0} value={monthlyKitSales} onChange={e => setMonthlyKitSales(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Kits / mo — consignment</Label>
            <Input type="number" min={0} value={monthlyConsignmentSales} onChange={e => setMonthlyConsignmentSales(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Wholesale kits per order</Label>
            <Input type="number" min={1} value={wholesaleKitsPerOrder} onChange={e => setWholesaleKitsPerOrder(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Wholesale orders / mo</Label>
            <Input type="number" min={0} value={monthlyWholesaleOrders} onChange={e => setMonthlyWholesaleOrders(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Solo pattern income ($/mo)</Label>
            <Input type="number" min={0} value={soloPatternIncome} onChange={e => setSoloPatternIncome(e.target.value)} />
            <p className="text-xs text-muted-foreground">Your current baseline, for the like-for-like comparison.</p>
          </div>
          <div className="space-y-2">
            <Label>Target shop name (optional)</Label>
            <Input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="The Wool Room" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Kit COGS</p>
            <p className="text-2xl font-semibold">{fmt(cogs.totalCogs)}</p>
            <p className="text-xs text-muted-foreground">{cogs.skeins} skeins ≈ {cogs.estimatedYards} yd</p>
          </div>
          {(Object.keys(CHANNEL_LABELS) as KitChannel[]).map(ch => {
            const o = result.channels.find(c => c.channel === ch)!;
            return (
              <div key={ch} className="rounded-lg border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{CHANNEL_LABELS[ch]}</p>
                <p className="text-2xl font-semibold">{fmt(o.netPerKit)}/kit</p>
                <p className="text-xs text-muted-foreground">{fmt(o.monthlyNet)}/mo · take {o.takePct}%</p>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={result.capacity.keystoneCapacity ? 'default' : 'destructive'}
              className="text-xs">
              Keystone capacity: {result.capacity.keystoneCapacity ? 'holds' : 'fails'} (COGS {result.capacity.cogsSharePct}% of retail; retail ÷ 4 {'>'} COGS)
            </Badge>
            <Badge variant={result.capacity.conveniencePremiumWarning ? 'destructive' : 'secondary'} className="text-xs">
              Retail is {result.capacity.retailToYarnMultiple}× yarn cost{result.capacity.conveniencePremiumWarning ? ' — buyers may anchor DIY' : ' — in line with market tolerance'}
            </Badge>
            <Badge
              variant={result.bestChannel && result.beatsBaseline ? 'default' : 'secondary'}
              className="text-xs">
              {result.bestChannel && result.beatsBaseline
                ? `${CHANNEL_LABELS[result.bestChannel]} beats the solo baseline`
                : result.bestChannel
                  ? `${CHANNEL_LABELS[result.bestChannel]} is best but under the solo baseline`
                  : 'No channel sells at these volumes'}
            </Badge>
          </div>

          {result.bestChannel && (
            <div className="flex items-start gap-2 rounded-md border bg-primary/5 px-3 py-2 text-sm">
              <TrendingUp className="size-4 mt-0.5 shrink-0" />
              <span>
                Best channel nets {fmt(result.bestMonthlyNet)}/mo versus {fmt(num(soloPatternIncome))} pattern baseline —{' '}
                {result.beatsBaseline ? 'the kit channel earns more on its own.' : 'it supplements rather than replaces pattern income.'}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="size-4" />
            Consignment agreement checklist
          </Label>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {clauses.map((c, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-accent" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <CopyLine text={clauses.join('\n')} label="consignment checklist" />
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-semibold">Paste-ready kit proposal</Label>
          <p className="text-sm text-muted-foreground">
            Wholesale price is keystone — half retail ({fmt(wholesalePrice)}) — so the shop's margin holds at full retail.
          </p>
          <CopyLine text={proposal} label="kit proposal to the shop" />
        </div>
      </CardContent>
    </Card>
  );
}
