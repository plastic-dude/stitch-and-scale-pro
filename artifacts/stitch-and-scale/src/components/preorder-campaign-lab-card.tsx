import { useMemo, useState, useEffect } from 'react';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { useSettings } from '@/context/SettingsContext';
import { PREORDER_CAMPAIGN_COPY, type PreorderCampaignCopy } from '@/lib/preorder-campaign-copy';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  Flag,
  Lightbulb,
  Banknote,
  CalendarDays,
  Users,
} from 'lucide-react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import {
  analyzePreorderCampaign,
  PREORDER_CAMPAIGN_DEFAULTS,
  CHARGE_MODEL_LABELS,
} from '@/lib/preorder-campaign-lab';
import type {
  PreorderCampaignInput,
  PreorderResult,
} from '@/lib/preorder-campaign-lab';
import { PatternProject } from '@/lib/grading-engine';

const STORAGE_KEY = 'stitch-and-scale-preorder-v1';

function NumField({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        <input
          type="number"
          className="h-8 w-full rounded-md border bg-background px-2 text-sm"
          value={value}
          min={min}
          step={step}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!Number.isNaN(v)) onChange(v);
          }}
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}

function PctField({
  label,
  value,
  onChange,
  step = 0.01,
  min = 0,
  max = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <NumField
      label={label}
      value={Math.round(value * 1000) / 10}
      step={Math.round(step * 1000) / 10}
      min={Math.round(min * 100)}
      suffix="%"
      onChange={(v) => onChange(Math.max(min, Math.min(max, v / 100)))}
    />
  );
}

export function PreorderCampaignLabCard({
  project,
}: {
  project: PatternProject;
}) {
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const pc: PreorderCampaignCopy = PREORDER_CAMPAIGN_COPY[language] ?? PREORDER_CAMPAIGN_COPY.en;
  const handle = useMemo<ProjectStorageHandle<PreorderCampaignInput>>(
    () => projectStorage<PreorderCampaignInput>('preorder', project.id, [STORAGE_KEY]),
    [project.id],
  );

  const [input, setInput] = useState<PreorderCampaignInput>(() => {
    const saved = handle.read();
    return saved ?? { ...PREORDER_CAMPAIGN_DEFAULTS };
  });

  useEffect(() => {
    handle.write(input);
  }, [input, handle]);

  const set = (patch: Partial<PreorderCampaignInput>) =>
    setInput((p) => ({ ...p, ...patch }));

  const result: PreorderResult = useMemo(
    () => analyzePreorderCampaign({ ...input }),
    [input],
  );

  const chargeModels = Object.entries(CHARGE_MODEL_LABELS);

  const coverageOk = result.minimumThreshold === 0 || result.thresholdCoverage >= 1;

  return (
    <div className="space-y-6">
      {/* Pricing + campaign */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-4 w-4" />
            Campaign setup
          </CardTitle>
          <CardDescription>
            Sell the garment before it exists. The all-or-nothing threshold
            guarantees no one pays unless the run funds — the pre-order converts
            audience trust into production capital, but only when the bar is set
            where the campaign can clear it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField
              label={pc.garmentPriceLabel}
              value={input.itemPrice}
              onChange={(v) => set({ itemPrice: v })}
              min={1}
              step={1}
              prefix="$"
            />
            <NumField
              label={ls.earlyBirdPriceDollar}
              value={input.earlyBirdPrice}
              onChange={(v) => set({ earlyBirdPrice: v })}
              min={1}
              step={1}
              prefix="$"
            />
            <PctField
              label={pc.earlyBirdShare}
              value={input.earlyBirdShare}
              onChange={(v) => set({ earlyBirdShare: v })}
              step={0.05}
            />
            <PctField
              label={pc.platformFee}
              value={input.platformFeePct}
              onChange={(v) => set({ platformFeePct: v })}
              step={0.005}
            />
            <NumField
              label={pc.campaignDays}
              value={input.campaignDays}
              onChange={(v) => set({ campaignDays: v })}
              min={1}
              suffix="d"
            />
            <NumField
              label={pc.leadTime}
              value={input.leadTimeDays}
              onChange={(v) => set({ leadTimeDays: v })}
              min={0}
              suffix="d"
            />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Charge model</span>
              <select
                className="h-8 rounded-md border bg-background px-2 text-sm"
                value={input.chargeModel}
                onChange={(e) =>
                  set({ chargeModel: e.target.value as PreorderCampaignInput['chargeModel'] })
                }
              >
                {chargeModels.map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost basis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote className="h-4 w-4" />
            Cost basis
          </CardTitle>
          <CardDescription>
            The safe cost basis adds the 30% safety margin to materials, knit
            labor, overhead, fulfillment labor, and shipping — the threshold is
            built from this number, not from the lean unit cost.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField
              label={pc.materialsPerUnit}
              value={input.materialsPerUnit}
              onChange={(v) => set({ materialsPerUnit: v })}
              step={1}
              prefix="$"
            />
            <NumField
              label={pc.knitHrsPerUnit}
              value={input.knitHoursPerUnit}
              onChange={(v) => set({ knitHoursPerUnit: v })}
              step={0.25}
              suffix="h"
            />
            <NumField
              label={pc.laborRate}
              value={input.laborRate}
              onChange={(v) => set({ laborRate: v })}
              min={1}
              prefix="$"
              suffix="/hr"
            />
            <NumField
              label={pc.fixedSeriesCosts}
              value={input.fixedSeriesCosts}
              onChange={(v) => set({ fixedSeriesCosts: v })}
              step={50}
              prefix="$"
            />
            <NumField
              label={pc.fulfillmentHrsPerUnit}
              value={input.fulfillmentHoursPerUnit}
              onChange={(v) => set({ fulfillmentHoursPerUnit: v })}
              step={0.1}
              suffix="h"
            />
            <NumField
              label={pc.shippingPerUnit}
              value={input.shippingPerUnit}
              onChange={(v) => set({ shippingPerUnit: v })}
              prefix="$"
            />
            <PctField
              label={pc.safetyMargin}
              value={input.safetyMarginPct}
              onChange={(v) => set({ safetyMarginPct: v })}
              step={0.05}
            />
            <PctField
              label={pc.bufferStock}
              value={input.bufferShare}
              onChange={(v) => set({ bufferShare: v })}
              step={0.01}
            />
          </div>
        </CardContent>
      </Card>

      {/* Demand */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Demand basis
          </CardTitle>
          <CardDescription>
            Email list, waitlist, and social each contribute measured baseline
            conversions — a 1–2% waitlist→order baseline for a new brand, ~3%
            list conversion in a 28-day window.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField
              label={pc.emailListSize}
              value={input.emailListSize}
              onChange={(v) => set({ emailListSize: v })}
              step={50}
            />
            <PctField
              label={ls.emailToOrder}
              value={input.emailConversion}
              onChange={(v) => set({ emailConversion: v })}
              step={0.005}
            />
            <NumField
              label={pc.waitlistSize}
              value={input.waitlistSize}
              onChange={(v) => set({ waitlistSize: v })}
              step={10}
            />
            <PctField
              label={ls.waitlistToOrder}
              value={input.waitlistConversion}
              onChange={(v) => set({ waitlistConversion: v })}
              step={0.01}
            />
            <NumField
              label={pc.socialExpectedOrders}
              value={input.socialExpectedOrders}
              onChange={(v) => set({ socialExpectedOrders: v })}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Threshold */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
            Production threshold
          </CardTitle>
          <CardDescription>
            (fixed costs + predicted units × safe cost basis) ÷ net price.
            Setting the bar at 60–70% of predicted sales is the documented
            first-campaign discipline — a missed threshold refunds every card
            and burns the trust the campaign was built to create.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={input.useThreshold}
              onCheckedChange={(v) => set({ useThreshold: v })}
            />
            <span className="text-sm font-medium">
              Minimum production threshold (all-or-nothing)
            </span>
          </div>
          {input.useThreshold && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <PctField
                label={pc.thresholdShareOfPredicted}
                value={input.thresholdShareOfPredicted}
                onChange={(v) => set({ thresholdShareOfPredicted: v })}
                step={0.05}
              />
              <div>
                <div className="text-xs text-muted-foreground">Minimum threshold</div>
                <div className="text-lg font-semibold">{result.minimumThreshold} units</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Coverage</div>
                <div className="text-lg font-semibold">
                  {(result.thresholdCoverage * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <Badge
                  variant={coverageOk ? 'outline' : 'destructive'}
                  className="mt-1 text-xs"
                >
                  {coverageOk ? 'Threshold clears ✓' : 'Below threshold'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote className="h-4 w-4" />
            Campaign economics
          </CardTitle>
          <CardDescription>
            Predicted demand across all three sources, the revenue after
            platform fees, the safe-cost unit economics, and what the season of
            knitting actually pays.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">Predicted orders</div>
              <div className="text-lg font-semibold">
                {result.predictedOrders}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({result.emailOrders} email · {result.waitlistOrders} wait · {result.socialOrders} social)
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Avg rev / order</div>
              <div className="text-lg font-semibold">
                ${result.avgRevenuePerOrder.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Net revenue</div>
              <div className="text-lg font-semibold">
                ${result.netCampaignRevenue.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cost / unit (safe)</div>
              <div className="text-lg font-semibold">
                ${result.costPerUnit.toFixed(0)} / ${result.costPerUnitSafe.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Buffer units</div>
              <div className="text-lg font-semibold">{result.bufferUnits}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Net profit</div>
              <div className="text-lg font-semibold">${result.netProfit.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Margin</div>
              <div className="text-lg font-semibold">
                {(result.profitMarginPct * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Hours (knit + fulfill)</div>
              <div className="text-lg font-semibold">
                {result.totalKnitHours.toFixed(0)} + {result.totalFulfillmentHours.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">$/production-hour</div>
              <div className="text-lg font-semibold">
                ${result.effectiveHourly.toFixed(2)}/hr
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Platform fees</div>
              <div className="text-lg font-semibold">
                ${result.platformFees.toFixed(0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flags */}
      {result.flags.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Flag className="h-4 w-4" />
              Flags ({result.flags.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {result.flags.map((f) => (
              <div key={f.id} className="flex gap-2 text-sm">
                <Badge variant="outline" className="shrink-0">
                  {f.id}
                </Badge>
                <span>{f.detail}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Verdict */}
      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Rocket className="h-4 w-4" />
            Verdict
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed">{result.verdict}</p>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{result.suggestion}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
