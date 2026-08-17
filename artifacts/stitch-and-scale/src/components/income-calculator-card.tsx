import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlatformId, PLATFORMS, PLATFORM_LABELS, platformNet, breakeven } from '@/lib/pattern-income-calculator';
import { PatternProject } from '@/lib/grading-engine';
import { cn } from '@/lib/utils';
import { useSettings } from '@/context/SettingsContext';
import { INCOME_COPY } from '@/lib/income-copy';

/**
 * Pattern income calculator: revenue planning across selling platforms.
 *
 * Lets the designer compare net take on Ravelry, Etsy, Ribblr, and Payhip
 * at any price/sales-volume combination (fee models per the documented
 * platform fee page in pattern-income-calculator.ts), then see how many
 * sales and months it takes to recover the pattern's design-time cost,
 * and what that velocity annualizes to.
 *
 * A planning figure only — real sales velocity varies per designer and
 * pattern; we never promise any income outcome.
 */
export function IncomeCalculatorCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copy = INCOME_COPY[language];
  const [platform, setPlatform] = React.useState<PlatformId>('ravelry');
  const [price, setPrice] = React.useState('8.00');
  const [monthlySales, setMonthlySales] = React.useState('15');
  const [designHours, setDesignHours] = React.useState('20');
  const [hourlyRate, setHourlyRate] = React.useState('25');

  const priceNum = Math.max(0, parseFloat(price) || 0);
  const salesNum = Math.max(0, parseInt(monthlySales) || 0);
  const hoursNum = Math.max(0, parseFloat(designHours) || 0);
  const rateNum = Math.max(0, parseFloat(hourlyRate) || 0);

  const net = platformNet(platform, priceNum, salesNum);
  const be = breakeven(platform, priceNum, salesNum, hoursNum, rateNum);

  const platformComparisons = PLATFORMS.filter(p => p !== platform).map(p => {
    const n = platformNet(p, priceNum, salesNum);
    return { platform: p, netRevenue: n.netRevenue, effectiveFeePct: n.effectiveFeePct };
  });
  // Include the active platform at the top for a complete comparison table.
  const comparisonRows = [
    { platform, netRevenue: net.netRevenue, effectiveFeePct: net.effectiveFeePct },
    ...platformComparisons,
  ].sort((a, b) => b.netRevenue - a.netRevenue);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">{copy.title}</CardTitle>
        <CardDescription>
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="income-price" className="text-xs text-muted-foreground mb-1 block">{copy.price}</Label>
            <Input id="income-price" type="number" min="0" step="0.5" value={price}
              onChange={(e) => setPrice(e.target.value)} data-testid="income-price" className="h-10" />
          </div>
          <div>
            <Label htmlFor="income-sales" className="text-xs text-muted-foreground mb-1 block">{copy.sales}</Label>
            <Input id="income-sales" type="number" min="0" value={monthlySales}
              onChange={(e) => setMonthlySales(e.target.value)} data-testid="income-sales" className="h-10" />
          </div>
          <div>
            <Label htmlFor="income-hours" className="text-xs text-muted-foreground mb-1 block">{copy.hours}</Label>
            <Input id="income-hours" type="number" min="0" value={designHours}
              onChange={(e) => setDesignHours(e.target.value)} data-testid="income-hours" className="h-10" />
          </div>
          <div>
            <Label htmlFor="income-rate" className="text-xs text-muted-foreground mb-1 block">{copy.rate}</Label>
            <Input id="income-rate" type="number" min="0" value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)} data-testid="income-rate" className="h-10" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 max-w-xs">
            <Label htmlFor="income-platform-select" className="text-xs text-muted-foreground mb-1 block">{copy.platform}</Label>
            <NativeSelect id="income-platform-select" value={platform}
              onChange={(e) => setPlatform(e.target.value as PlatformId)} data-testid="select-income-platform">
              {PLATFORMS.map(p => (
                <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <div className="text-2xl font-mono font-bold text-foreground">${net.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-muted-foreground mt-1">{copy.netMonth} ({platform})</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <div className="text-2xl font-mono font-bold text-foreground">
              {Number.isFinite(be.salesToBreakEven) ? Math.round(be.salesToBreakEven).toLocaleString() : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{copy.breakEven}</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <div className="text-2xl font-mono font-bold text-foreground">${be.annualizedNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-muted-foreground mt-1">{copy.annualized}</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">{copy.compare}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="px-2 py-2 font-medium">{copy.platformHead}</th>
                  <th className="px-3 py-2 text-right font-medium">{copy.netHead}</th>
                  <th className="px-3 py-2 text-right font-medium">{copy.feesHead}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparisonRows.map(row => (
                  <tr key={row.platform} className={cn("hover:bg-muted/30", row.platform === platform && "bg-primary/5")}>
                    <td className="px-2 py-2.5 font-medium">{PLATFORM_LABELS[row.platform]}</td>
                    <td className="px-3 py-2.5 text-right font-mono">${row.netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{row.effectiveFeePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {copy.feeNote}
        </p>
      </CardContent>
    </Card>
  );
}
