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
import { useSettings } from '@/context/SettingsContext';
import { KIT_ECONOMICS_COPY } from '@/lib/kit-economics-copy';
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

function CopyLine({ text, label, copyLabels }: { text: string; label: string; copyLabels: { copied: string; copyFailed: string; selectManually: string } }) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast({ title: copyLabels.copied, description: label });
    } catch {
      toast({ title: copyLabels.copyFailed, description: copyLabels.selectManually });
    }
  };
  return (
    <div>
      <div className="flex items-start justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed font-mono">{text}</p>
        <Button variant="ghost" size="sm" onClick={copy} aria-label={`${copyLabels.copied} ${label}`}>
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
  const { language } = useSettings();
  const copyText = KIT_ECONOMICS_COPY[language];
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
          {copyText.title}
        </CardTitle>
        <CardDescription>
          {copyText.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>{copyText.weight}</Label>
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
            <p className="text-xs text-muted-foreground">{copyText.weightHint}</p>
          </div>
          <div className="space-y-2">
            <Label>{copyText.yarnPrice}</Label>
            <Input type="number" min={0} value={pricePerSkein} onChange={e => setPricePerSkein(e.target.value)} />
            <p className="text-xs text-muted-foreground">{copyText.yarnPriceHint}</p>
          </div>
          <div className="space-y-2">
            <Label>{copyText.retailPrice}</Label>
            <Input type="number" min={0} value={retailPrice} onChange={e => setRetailPrice(e.target.value)} />
            <p className="text-xs text-muted-foreground">{copyText.retailHint}</p>
          </div>
          <div className="space-y-2">
            <Label>{copyText.platform}</Label>
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
            <p className="text-xs text-muted-foreground">{copyText.platformHint}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>{copyText.notions}</Label>
            <Input type="number" min={0} value={notionsCost} onChange={e => setNotionsCost(e.target.value)} />
            <p className="text-xs text-muted-foreground">{copyText.notionsHint}</p>
          </div>
          <div className="space-y-2">
            <Label>{copyText.packaging}</Label>
            <Input type="number" min={0} value={packagingCost} onChange={e => setPackagingCost(e.target.value)} />
            <p className="text-xs text-muted-foreground">{copyText.packagingHint}</p>
          </div>
          <div className="space-y-2">
            <Label>{copyText.labourHours}</Label>
            <Input type="number" min={0} value={labourHours} onChange={e => setLabourHours(e.target.value)} />
            <p className="text-xs text-muted-foreground">{copyText.labourHoursHint}</p>
          </div>
          <div className="space-y-2">
            <Label>{copyText.labourRate}</Label>
            <Input type="number" min={0} value={labourRate} onChange={e => setLabourRate(e.target.value)} />
            <p className="text-xs text-muted-foreground">{copyText.labourRateHint}</p>
          </div>
          <div className="space-y-2">
            <Label>{copyText.overhead}</Label>
            <Input type="number" min={0} value={overheadShare} onChange={e => setOverheadShare(e.target.value)} />
            <p className="text-xs text-muted-foreground">{copyText.overheadHint}</p>
          </div>
          <div className="space-y-2">
            <Label>{copyText.consignor}</Label>
            <Input type="number" min={0} max={1} step={0.05} value={consignorShare} onChange={e => setConsignorShare(e.target.value)} />
            <p className="text-xs text-muted-foreground">{copyText.consignorHint}</p>
          </div>
          <div className="space-y-2">
            <Label>{copyText.processor}</Label>
            <Input type="number" min={0} max={1} step={0.001} value={processorFeePct} onChange={e => setProcessorFeePct(e.target.value)} />
            <p className="text-xs text-muted-foreground">{copyText.processorHint}</p>
          </div>
          <div className="space-y-2">
            <Label>{copyText.wholesaleFee}</Label>
            <Input type="number" min={0} max={1} step={0.05} value={wholesaleMarketplaceFeePct} onChange={e => setWholesaleMarketplaceFeePct(e.target.value)} />
            <p className="text-xs text-muted-foreground">{copyText.wholesaleFeeHint}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>{copyText.selfSell}</Label>
            <Input type="number" min={0} value={monthlyKitSales} onChange={e => setMonthlyKitSales(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{copyText.consignment}</Label>
            <Input type="number" min={0} value={monthlyConsignmentSales} onChange={e => setMonthlyConsignmentSales(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{copyText.wholesalePerOrder}</Label>
            <Input type="number" min={1} value={wholesaleKitsPerOrder} onChange={e => setWholesaleKitsPerOrder(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{copyText.wholesaleOrders}</Label>
            <Input type="number" min={0} value={monthlyWholesaleOrders} onChange={e => setMonthlyWholesaleOrders(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{copyText.soloIncome}</Label>
            <Input type="number" min={0} value={soloPatternIncome} onChange={e => setSoloPatternIncome(e.target.value)} />
            <p className="text-xs text-muted-foreground">{copyText.soloHint}</p>
          </div>
          <div className="space-y-2">
            <Label>{copyText.shopName}</Label>
            <Input value={shopName} onChange={e => setShopName(e.target.value)} placeholder={copyText.shopPlaceholder} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{copyText.cogs}</p>
            <p className="text-2xl font-semibold">{fmt(cogs.totalCogs)}</p>
            <p className="text-xs text-muted-foreground">{cogs.skeins} {copyText.skeins} ≈ {cogs.estimatedYards} yd</p>
          </div>
          {(Object.keys(CHANNEL_LABELS) as KitChannel[]).map(ch => {
            const o = result.channels.find(c => c.channel === ch)!;
            return (
              <div key={ch} className="rounded-lg border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{CHANNEL_LABELS[ch]}</p>
                <p className="text-2xl font-semibold">{fmt(o.netPerKit)}/kit</p>
                <p className="text-xs text-muted-foreground">{fmt(o.monthlyNet)}/mo · {copyText.take} {o.takePct}%</p>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={result.capacity.keystoneCapacity ? 'default' : 'destructive'}
              className="text-xs">
              {copyText.capacity}: {result.capacity.keystoneCapacity ? copyText.holds : copyText.fails} (COGS {result.capacity.cogsSharePct}% of retail; retail ÷ 4 {'>'} COGS)
            </Badge>
            <Badge variant={result.capacity.conveniencePremiumWarning ? 'destructive' : 'secondary'} className="text-xs">
              {copyText.retailAnchor} {result.capacity.retailToYarnMultiple}× yarn cost{result.capacity.conveniencePremiumWarning ? ` ${copyText.diyWarning}` : ` ${copyText.marketTolerance}`}
            </Badge>
            <Badge
              variant={result.bestChannel && result.beatsBaseline ? 'default' : 'secondary'}
              className="text-xs">
              {result.bestChannel && result.beatsBaseline
                ? `${CHANNEL_LABELS[result.bestChannel]} ${copyText.beatsBaseline}`
                : result.bestChannel
                  ? `${CHANNEL_LABELS[result.bestChannel]} ${copyText.underBaseline}`
                  : copyText.noChannel}
            </Badge>
          </div>

          {result.bestChannel && (
            <div className="flex items-start gap-2 rounded-md border bg-primary/5 px-3 py-2 text-sm">
              <TrendingUp className="size-4 mt-0.5 shrink-0" />
              <span>
                {copyText.bestChannel} {fmt(result.bestMonthlyNet)}/mo versus {fmt(num(soloPatternIncome))} pattern baseline —{' '}
                {result.beatsBaseline ? copyText.earnsMore : copyText.supplements}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="size-4" />
            {copyText.checklist}
          </Label>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {clauses.map((c, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-accent" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <CopyLine text={clauses.join('\n')} label={copyText.checklistLabel} copyLabels={copyText} />
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-semibold">{copyText.proposal}</Label>
          <p className="text-sm text-muted-foreground">
            {copyText.proposalHint} ({fmt(wholesalePrice)}).
          </p>
          <CopyLine text={proposal} label={copyText.proposal} copyLabels={copyText} />
        </div>
      </CardContent>
    </Card>
  );
}
