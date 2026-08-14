import { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Handshake, Flag, Lightbulb, Banknote, AlertTriangle } from 'lucide-react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import {
  analyzeWholesale,
  WHOLESALE_SKU_DEFAULTS,
  WHOLESALE_TERM_DEFAULTS,
  PAYMENT_TERM_LABELS,
} from '@/lib/wholesale-lab';
import type {
  WholesaleResult,
  WholesaleSku,
  WholesaleTermInput,
} from '@/lib/wholesale-lab';
import { PatternProject } from '@/lib/grading-engine';

const STORAGE_KEY = 'stitch-and-scale-wholesale-v1';

interface StoredWholesale {
  skus: WholesaleSku[];
  terms: WholesaleTermInput;
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
  min,
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
          min={min ?? 0}
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

export function WholesaleLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo<ProjectStorageHandle<StoredWholesale>>(
    () => projectStorage<StoredWholesale>('wholesale', project.id, [STORAGE_KEY]),
    [project.id],
  );

  const [stored, setStored] = useState<StoredWholesale>(() => {
    const saved = handle.read();
    return saved ?? {
      skus: WHOLESALE_SKU_DEFAULTS.map((d) => ({ ...d })),
      terms: { ...WHOLESALE_TERM_DEFAULTS },
    };
  });

  useEffect(() => {
    handle.write(stored);
  }, [stored, handle]);

  const skus = stored.skus;
  const terms = stored.terms;

  const result: WholesaleResult = useMemo(
    () =>
      analyzeWholesale({
        skus: skus.map((s) => ({ ...s })),
        terms: { ...terms },
      }),
    [skus, terms],
  );

  const paymentTerms = Object.entries(PAYMENT_TERM_LABELS);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Handshake className="h-4 w-4" />
            Wholesale Program Lab
          </CardTitle>
          <CardDescription>
            Price your wholesale line honestly before pitching a single boutique.
            Keystone = 2x COGS; processing ≤ 10% of order value; the line sheet is
            your entire pitch until you have ~200 stockists.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SKU margin table */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Your line (wholesale prices vs COGS)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-1 pr-2">SKU</th>
                    <th className="pb-1 pr-2">Knit hrs</th>
                    <th className="pb-1 pr-2">Materials</th>
                    <th className="pb-1 pr-2">Labor $/hr</th>
                    <th className="pb-1 pr-2">COGS</th>
                    <th className="pb-1 pr-2">Keystone</th>
                    <th className="pb-1 pr-2">Wholesale</th>
                    <th className="pb-1 pr-2">Retail</th>
                    <th className="pb-1">$ margin/hr</th>
                  </tr>
                </thead>
                <tbody>
                  {result.skuRows.map((row, i) => {
                    const s = skus[i];
                    return (
                      <tr key={row.label} className="border-b last:border-0">
                        <td className="whitespace-nowrap py-1.5 pr-2 font-medium">
                          {row.label}
                        </td>
                        <td className="py-1.5 pr-2">
                          <input
                            type="number"
                            className="h-7 w-16 rounded border bg-background px-1 text-sm"
                            value={s.knitHours}
                            min={0.25}
                            step={0.25}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!Number.isNaN(v) && v >= 0.25) {
                                const next = skus.map((x, j) =>
                                  j === i ? { ...x, knitHours: v } : x,
                                );
                                setStored((p) => ({ ...p, skus: next }));
                              }
                            }}
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <input
                            type="number"
                            className="h-7 w-16 rounded border bg-background px-1 text-sm"
                            value={s.materials}
                            min={0}
                            step={1}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!Number.isNaN(v) && v >= 0) {
                                const next = skus.map((x, j) =>
                                  j === i ? { ...x, materials: v } : x,
                                );
                                setStored((p) => ({ ...p, skus: next }));
                              }
                            }}
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <input
                            type="number"
                            className="h-7 w-16 rounded border bg-background px-1 text-sm"
                            value={s.laborRate}
                            min={0}
                            step={1}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!Number.isNaN(v) && v >= 0) {
                                const next = skus.map((x, j) =>
                                  j === i ? { ...x, laborRate: v } : x,
                                );
                                setStored((p) => ({ ...p, skus: next }));
                              }
                            }}
                          />
                        </td>
                        <td className="py-1.5 pr-2">${row.cogs.toFixed(2)}</td>
                        <td className="py-1.5 pr-2">${row.keystoneWholesale.toFixed(0)}</td>
                        <td className="py-1.5 pr-2">
                          <input
                            type="number"
                            className="h-7 w-20 rounded border bg-background px-1 text-sm"
                            value={s.wholesalePrice}
                            min={0}
                            step={1}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!Number.isNaN(v) && v >= 0) {
                                const next = skus.map((x, j) =>
                                  j === i ? { ...x, wholesalePrice: v } : x,
                                );
                                setStored((p) => ({ ...p, skus: next }));
                              }
                            }}
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <input
                            type="number"
                            className="h-7 w-20 rounded border bg-background px-1 text-sm"
                            value={s.retailPrice}
                            min={0}
                            step={1}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!Number.isNaN(v) && v >= 0) {
                                const next = skus.map((x, j) =>
                                  j === i ? { ...x, retailPrice: v } : x,
                                );
                                setStored((p) => ({ ...p, skus: next }));
                              }
                            }}
                          />
                        </td>
                        <td className="whitespace-nowrap py-1.5">
                          {row.marginPerHour.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.skuRows.map((row) =>
                row.underKeystone ? (
                  <Badge key={row.label} variant="destructive" className="text-xs">
                    {row.label}: under keystone (keep ≥ ${row.keystoneWholesale.toFixed(0)})
                  </Badge>
                ) : (
                  <Badge key={row.label} variant="outline" className="text-xs">
                    {row.label}: {(row.wholesaleMarginPct * 100).toFixed(0)}% margin ✓
                  </Badge>
                ),
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField
              label="First-order minimum ($)"
              value={terms.firstOrderMinimum}
              onChange={(v) => setStored((p) => ({ ...p, terms: { ...p.terms, firstOrderMinimum: v } }))}
              min={50}
              step={25}
              prefix="$"
            />
            <NumField
              label="Repeat minimum ($)"
              value={terms.repeatMinimum}
              onChange={(v) => setStored((p) => ({ ...p, terms: { ...p.terms, repeatMinimum: v } }))}
              min={25}
              step={25}
              prefix="$"
            />
            <NumField
              label="Reorders per stockist / yr"
              value={terms.reordersPerYear}
              onChange={(v) => setStored((p) => ({ ...p, terms: { ...p.terms, reordersPerYear: v } }))}
              min={0}
              step={1}
            />
            <NumField
              label="Order processing cost"
              value={terms.orderProcessingCost}
              onChange={(v) => setStored((p) => ({ ...p, terms: { ...p.terms, orderProcessingCost: v } }))}
              min={0}
              step={1}
              prefix="$"
            />
            <NumField
              label="Units per SKU per order"
              value={terms.unitsPerSkuPerOrder}
              onChange={(v) => setStored((p) => ({ ...p, terms: { ...p.terms, unitsPerSkuPerOrder: v } }))}
              min={1}
              step={1}
            />
            <NumField
              label="Knit hours / year to wholesale"
              value={terms.annualWholesaleHours}
              onChange={(v) => setStored((p) => ({ ...p, terms: { ...p.terms, annualWholesaleHours: v } }))}
              min={10}
              step={10}
              suffix="h"
            />
            <NumField
              label="Faire-style commission"
              value={terms.marketplaceCommission}
              onChange={(v) => setStored((p) => ({ ...p, terms: { ...p.terms, marketplaceCommission: v } }))}
              min={0}
              step={0.01}
              suffix="×"
            />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Payment terms</span>
              <Select
                value={terms.paymentTerm}
                onValueChange={(v) =>
                  setStored((p) => ({
                    ...p,
                    terms: { ...p.terms, paymentTerm: v as WholesaleTermInput['paymentTerm'] },
                  }))
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentTerms.map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order economics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote className="h-4 w-4" />
            Order & annual economics
          </CardTitle>
          <CardDescription>
            A typical order: {terms.unitsPerSkuPerOrder} units of each SKU. COGS is
            deducted before the annual net is reported.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">Net per order</div>
              <div className="text-lg font-semibold">
                ${result.netPerOrder.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Processing share</div>
              <div className="text-lg font-semibold">
                {(result.processingCostPct * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Suggested minimum</div>
              <div className="text-lg font-semibold">
                ${result.suggestedMinimum.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Net / stockist / yr</div>
              <div className="text-lg font-semibold">
                ${result.annualNetPerStockist.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Annual wholesale net</div>
              <div className="text-lg font-semibold">
                ${result.annualWholesaleNet.toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">$/wholesale-hour</div>
              <div className="text-lg font-semibold">
                ${result.netPerWholesaleHour.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Same hours direct</div>
              <div className="text-lg font-semibold">
                ${result.directNetPerHour.toFixed(2)}/hr
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Retail-margin reference</div>
              <div className="text-lg font-semibold">
                ${result.directRetailNetSameHours.toFixed(0)}
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
            <AlertTriangle className="h-4 w-4" />
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
