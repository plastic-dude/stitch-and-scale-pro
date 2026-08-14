import { useMemo, useState } from "react";
import { AlertTriangle, Info, Lightbulb, RefreshCw, Globe } from "lucide-react";
import {
  analyzeIntlPricing,
  DEFAULT_INTL_PRICING,
  type IntlPricingInput,
  type IntlPricingResult,
} from "@/lib/intl-pricing-lab";
import type { PatternProject } from "@/lib/grading-engine";
import { projectStorage } from "@/lib/storage-lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const STORAGE_KEY = "stitch-and-scale-intlpricing-v1";

interface StoredState {
  input: IntlPricingInput;
  ts: number;
}

function loadStored(project: PatternProject): IntlPricingInput {
  try {
    const handle = projectStorage<StoredState>("intl-pricing", project.id, [STORAGE_KEY]);
    const stored = handle.read();
    if (stored && stored.input) {
      const n = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : undefined);
      return {
        ...DEFAULT_INTL_PRICING,
        ...stored.input,
        basePriceUsd: n(stored.input.basePriceUsd) ?? DEFAULT_INTL_PRICING.basePriceUsd,
        platformFeePct: n(stored.input.platformFeePct) ?? DEFAULT_INTL_PRICING.platformFeePct,
        currentMonthlyRevenue:
          n(stored.input.currentMonthlyRevenue) ?? DEFAULT_INTL_PRICING.currentMonthlyRevenue,
        elasticity: n(stored.input.elasticity) ?? DEFAULT_INTL_PRICING.elasticity,
        abuseRate: n(stored.input.abuseRate) ?? DEFAULT_INTL_PRICING.abuseRate,
        markets: stored.input.markets?.length
          ? stored.input.markets
          : DEFAULT_INTL_PRICING.markets,
      };
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_INTL_PRICING };
}

const PLATFORM_OPTIONS: { value: IntlPricingInput["platform"]; label: string }[] = [
  { value: "ravelry", label: "Ravelry (flat USD)" },
  { value: "etsy", label: "Etsy (converted from shop currency)" },
  { value: "lovecrafts", label: "LoveCrafts (one of GBP/USD/EUR)" },
  { value: "gumroad-payhip", label: "Gumroad / Payhip (geo coupons)" },
  { value: "own-site", label: "Own site (full control)" },
];

const CURRENCY_OPTIONS = ["USD", "GBP", "EUR", "CAD", "AUD", "NZD", "CHF", "BRL", "INR", "NOK", "SEK", "DKK", "ISK"];

function NumField(props: {
  label: string;
  value: number;
  step: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  const { label, value, step, min = 0, max, prefix, suffix, hint, onChange } = props;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-1.5">
        {prefix && <span className="text-xs text-muted-foreground">{prefix}</span>}
        <Input
          type="number"
          step={step}
          min={min}
          max={max}
          value={Math.round(value * 100) / 100}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (isFinite(v)) onChange(Math.round(v * 100) / 100);
          }}
          className="h-8 bg-background"
        />
        {suffix && <span className="text-xs text-muted-foreground whitespace-nowrap">{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] leading-tight text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StatBox(props: { label: string; value: string; tone?: "good" | "warn" | "bad"; hint?: string }) {
  const { label, value, tone = "good", hint } = props;
  const toneCls =
    tone === "good"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-destructive";
  return (
    <div className="rounded-lg border bg-card/60 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${toneCls}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function IntlPricingLabCard({ project }: { project: PatternProject }) {
  const [input, setInput] = useState<IntlPricingInput>(() => loadStored(project));

  const result: IntlPricingResult = useMemo(() => analyzeIntlPricing(input), [input]);

  const persist = (next: IntlPricingInput) => {
    setInput(next);
    try {
      const handle = projectStorage<StoredState>("intl-pricing", project.id, [STORAGE_KEY]);
      handle.write({ input: next, ts: Date.now() });
    } catch {
      // storage unavailable — UI still works in memory
    }
  };

  const set = <K extends keyof IntlPricingInput>(key: K, value: IntlPricingInput[K]) =>
    persist({ ...input, [key]: value });

  const setMarket = (idx: number, patch: Partial<IntlPricingInput["markets"][number]>) => {
    const markets = input.markets.map((m, i) => (i === idx ? { ...m, ...patch } : m));
    persist({ ...input, markets });
  };

  const addMarket = () => {
    const next: IntlPricingInput["markets"][number] = {
      country: "New market",
      currency: "EUR",
      pppIndex: 0.9,
      share: 0.02,
      buyersPerMonth: 2,
      fxFee: 0.045,
    };
    persist({ ...input, markets: [...input.markets, next] });
  };

  const removeMarket = (idx: number) => {
    persist({ ...input, markets: input.markets.filter((_, i) => i !== idx) });
  };

  const verdictTone: "good" | "warn" | "bad" = result.liftPct >= 5
    ? "good"
    : result.liftPct > 0
      ? "warn"
      : "bad";

  const highFlags = result.flags.filter((f) => f.severity === "high");
  const otherFlags = result.flags.filter((f) => f.severity !== "high");

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-start gap-2">
            <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your flat USD price is actually an international price — everyone sees it converted. Ravelry sells
              to a global audience but gives you zero pricing tiers; LoveCrafts lets you pick one of GBP/USD/EUR
              and converts from there. This lab works out where PPP-based parity tiers earn you real revenue
              (+5-15% is what parity-priced digital sellers report), how much the FX spread is leaking, and
              which markets are undercharging or being priced out. Parity only works end-to-end on Gumroad,
              Payhip and your own site — so the verdict tells you where the tiers actually fit.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <NumField
              label="Pattern anchor price"
              value={input.basePriceUsd}
              step={0.5}
              min={1}
              max={50}
              prefix="$"
              hint="The US price the rest of the world sees converted — set it for your US buyer."
              onChange={(v) => set("basePriceUsd", v)}
            />
            <NumField
              label="Monthly pattern revenue"
              value={input.currentMonthlyRevenue}
              step={25}
              prefix="$"
              hint="All markets, converted to USD."
              onChange={(v) => set("currentMonthlyRevenue", v)}
            />
            <NumField
              label="Platform take"
              value={input.platformFeePct}
              step={0.5}
              suffix="%"
              hint="Ravelry 5%, Etsy 6.5%, LoveCrafts 15%, Gumroad/Payhip 10%."
              onChange={(v) => set("platformFeePct", v)}
            />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Hosting platform</Label>
              <Select value={input.platform} onValueChange={(v) => set("platform", v as IntlPricingInput["platform"])}>
                <SelectTrigger className="h-8 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-tight text-muted-foreground">{result.anchorNote}</p>
            </div>
            <NumField
              label="Demand elasticity"
              value={input.elasticity}
              step={0.05}
              max={1}
              suffix="0–1"
              hint="Volume response to parity: 0.75 is the indie-parity midpoint (0.6-0.8 range)."
              onChange={(v) => set("elasticity", Math.min(1, v))}
            />
            <NumField
              label="Abuse / coupon fraud"
              value={input.abuseRate}
              step={0.5}
              suffix="%"
              hint="Discount on parity revenue from coupon-abuse in weak-PPP markets."
              onChange={(v) => set("abuseRate", v)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Markets & PPP tiers</Label>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={addMarket}>
                Add market
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[640px] border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-2 font-medium">Market</th>
                    <th className="p-2 font-medium">Currency</th>
                    <th className="p-2 font-medium">PPP index</th>
                    <th className="p-2 font-medium">Audience share</th>
                    <th className="p-2 font-medium">FX fee</th>
                    <th className="p-2 font-medium">Parity price</th>
                    <th className="p-2 font-medium">Net now</th>
                    <th className="p-2 font-medium">Net parity</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {result.markets.map((m, i) => {
                    const row = input.markets[i];
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-2">
                          <Input
                            value={row?.country ?? m.country}
                            onChange={(e) => setMarket(i, { country: e.target.value })}
                            className="h-7 w-32 bg-background text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Select
                            value={row?.currency ?? m.currency}
                            onValueChange={(v) => setMarket(i, { currency: v })}
                          >
                            <SelectTrigger className="h-7 w-20 bg-background text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCY_OPTIONS.map((c) => (
                                <SelectItem key={c} value={c} className="text-xs">
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step={0.05}
                            value={row?.pppIndex ?? m.pppIndex}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (isFinite(v)) setMarket(i, { pppIndex: Math.round(v * 100) / 100 });
                            }}
                            className="h-7 w-16 bg-background text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step={0.01}
                            max={1}
                            value={row?.share ?? m.share}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (isFinite(v)) setMarket(i, { share: Math.min(1, Math.round(v * 100) / 100) });
                            }}
                            className="h-7 w-16 bg-background text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step={0.005}
                            max={0.5}
                            value={row?.fxFee ?? 0.045}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (isFinite(v)) setMarket(i, { fxFee: Math.min(0.5, Math.round(v * 1000) / 1000) });
                            }}
                            className="h-7 w-16 bg-background text-xs"
                          />
                        </td>
                        <td className="p-2 tabular-nums">{m.parityPriceString}</td>
                        <td className="p-2 tabular-nums text-muted-foreground">
                          ${m.currentNetPerSale.toFixed(2)}
                        </td>
                        <td
                          className={`p-2 tabular-nums ${
                            m.monthlyRevenueParity > m.monthlyRevenueNow
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          ${m.parityNetPerSale.toFixed(2)}
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeMarket(i)}
                          >
                            <span className="sr-only">Remove</span>×
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] leading-tight text-muted-foreground">
              PPP index is the market's purchasing power vs the US = 1.0 (Big-Mac-style baskets: US 1.0, UK ~0.86,
              EU ~0.78, India ~0.3). Audience share is that market's slice of your sales base; parity price is
              rounded to local endings (e.g. ₹10, €7).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => persist({ ...DEFAULT_INTL_PRICING })}
            >
              <RefreshCw className="h-3 w-3" /> Reset to demo
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox
          label="Revenue now / month"
          value={`$${result.totalCurrentMonthly.toFixed(0)}`}
          tone="good"
          hint="Flat-USD baseline across all markets"
        />
        <StatBox
          label="Parity revenue / month"
          value={`$${result.totalParityMonthly.toFixed(0)}`}
          tone={result.liftPct >= 5 ? "good" : result.liftPct > 0 ? "warn" : "bad"}
          hint={`${result.liftPct >= 0 ? "+" : ""}${result.liftPct.toFixed(1)}% lift`}
        />
        <StatBox
          label="Annual revenue lift"
          value={`${result.annualRevenueLift >= 0 ? "+" : ""}$${result.annualRevenueLift.toFixed(0)}`}
          tone={result.liftPct >= 5 ? "good" : "warn"}
          hint="If you run tiers across every market"
        />
        <StatBox
          label="FX leak / month"
          value={`$${result.totalFxLeakMonthly.toFixed(0)}`}
          tone={result.totalFxLeakMonthly / Math.max(result.totalCurrentMonthly, 1) > 0.04 ? "bad" : "warn"}
          hint={`≈ $${result.totalFxLeakAnnual.toFixed(0)}/yr to conversion spreads`}
        />
      </div>

      <div className="rounded-lg border bg-card/60 p-4">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Verdict</p>
        <div className="mt-1 flex items-start gap-2">
          {result.liftPct >= 5 ? (
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <div>
            <p className={`text-sm font-semibold ${result.liftPct >= 5 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
              {result.verdict}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{result.verdictNote}</p>
          </div>
        </div>
      </div>

      {highFlags.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">High priority</p>
          {highFlags.map((f, i) => (
            <div key={`${f.code}-${i}`} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs font-semibold">
                [{f.code}] {f.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.note}</p>
            </div>
          ))}
        </div>
      )}

      {otherFlags.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Watch items</p>
          {otherFlags.map((f, i) => (
            <div key={`${f.code}-${i}`} className="rounded-lg border bg-card/60 p-3">
              <p className="text-xs font-medium">
                [{f.code}] {f.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
