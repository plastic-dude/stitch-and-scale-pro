import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PatternProject } from '@/lib/grading-engine';
import { PLATFORM_LABELS } from '@/lib/pattern-income-calculator';
import { cn } from '@/lib/utils';
import {
  ITEM_TYPE_LIST,
  ITEM_TYPE_LABELS,
  SKILL_LEVEL_LIST,
  SKILL_LEVEL_LABELS,
  sizeCountForProject,
  advisePrice,
} from '@/lib/pattern-pricing-advisor';

/**
 * Pattern Pricing Advisor — tells the designer what this specific pattern
 * should cost, and why.
 *
 * Competitor gap: Stitchmastery, EnvisioKnit, KnitCompanion, Pattern
 * Keeper, and every marketplace (Ravelry/Etsy/Ribblr/Payhip) leave the
 * designer guessing the price. Market guidance exists only as blog posts
 * (GoSadi, Woolly Wormhead, r/knitting pricing discussions) — no tool
 * converts a pattern's own engineering (size range, item type,
 * skill level) plus the designer's real costs into a price recommendation.
 *
 * Bands and premium justifiers follow the cited industry data
 * (see pattern-pricing-advisor.ts). Volume scenarios reuse the verified
 * per-platform fee model from pattern-income-calculator.ts — no new fee
 * constants here, so the two views can never drift apart.
 */
export function PricingAdvisorCard({ project }: { project: PatternProject }) {
  const [itemType, setItemType] = React.useState<string>('sweater');
  const [skillLevel, setSkillLevel] = React.useState<string>('intermediate');
  const [techEdited, setTechEdited] = React.useState(false);
  const [testKnitted, setTestKnitted] = React.useState(false);
  const [hoursWorked, setHoursWorked] = React.useState('20');
  const [hourlyRate, setHourlyRate] = React.useState('25');
  const [currentPrice, setCurrentPrice] = React.useState('8.00');
  const [marketTarget, setMarketTarget] = React.useState<string>('standard');

  const hoursNum = Math.max(0, parseFloat(hoursWorked) || 0);
  const rateNum = Math.max(0, parseFloat(hourlyRate) || 0);
  const currentPriceNum = Math.max(0, parseFloat(currentPrice) || 0);

  const advice = advisePrice({
    itemType: itemType as never,
    skillLevel: skillLevel as never,
    sizeCount: sizeCountForProject(project),
    techEdited,
    testKnitted,
    hoursWorked: hoursNum,
    hourlyRate: rateNum,
    currentPrice: currentPriceNum,
    marketTarget: marketTarget as 'standard' | 'premium',
  });

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">Pattern Pricing Advisor</CardTitle>
        <CardDescription>
          Every platform and design tool leaves the price up to you — this one does the
          math. It turns your pattern's actual engineering (size range, item type, skill
          level) plus your real costs into a documented market band, flags underpricing
          against your time, and shows what that price nets per platform at three
          volume scenarios.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="pricing-item" className="text-xs text-muted-foreground mb-1 block">Item type</Label>
            <NativeSelect id="pricing-item" value={itemType}
              onChange={(e) => setItemType(e.target.value)} data-testid="select-pricing-item">
              {ITEM_TYPE_LIST.map(t => (
                <option key={t} value={t}>{ITEM_TYPE_LABELS[t]}</option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="pricing-skill" className="text-xs text-muted-foreground mb-1 block">Skill level</Label>
            <NativeSelect id="pricing-skill" value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)} data-testid="select-pricing-skill">
              {SKILL_LEVEL_LIST.map(t => (
                <option key={t} value={t}>{SKILL_LEVEL_LABELS[t]}</option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="pricing-market" className="text-xs text-muted-foreground mb-1 block">Market position</Label>
            <NativeSelect id="pricing-market" value={marketTarget}
              onChange={(e) => setMarketTarget(e.target.value)} data-testid="select-pricing-market">
              <option value="standard">Standard band ($5–10)</option>
              <option value="premium">Premium band ($12–18)</option>
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="pricing-current" className="text-xs text-muted-foreground mb-1 block">Your current price (USD)</Label>
            <Input id="pricing-current" type="number" min="0" step="0.5" value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)} data-testid="pricing-current" className="h-10" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <div>
            <Label htmlFor="pricing-hours" className="text-xs text-muted-foreground mb-1 block">Hours worked</Label>
            <Input id="pricing-hours" type="number" min="0" value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)} data-testid="pricing-hours" className="h-10" />
          </div>
          <div>
            <Label htmlFor="pricing-rate" className="text-xs text-muted-foreground mb-1 block">Hourly rate (USD)</Label>
            <Input id="pricing-rate" type="number" min="0" value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)} data-testid="pricing-rate" className="h-10" />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer" data-testid="pricing-tech-edited">
            <Checkbox checked={techEdited} onCheckedChange={(v) => setTechEdited(v === true)} id="pricing-tech-edited" />
            Tech edited
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer" data-testid="pricing-test-knitted">
            <Checkbox checked={testKnitted} onCheckedChange={(v) => setTestKnitted(v === true)} id="pricing-test-knitted" />
            Test knitted
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-muted/40 rounded-lg p-4 text-center flex-1">
            <div className="text-2xl font-mono font-bold text-foreground">${advice.recommendedPrice.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">recommended price</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-4 text-center flex-1">
            <div className="text-2xl font-mono font-bold text-foreground">${fmt(advice.costPlusFloor)}</div>
            <div className="text-xs text-muted-foreground mt-1">cost-plus floor (time ÷ 150-sale lifetime)</div>
          </div>
          <div className={cn("rounded-lg p-4 text-center flex-1", advice.underpriced ? "bg-destructive/10 border border-destructive/40" : "bg-muted/40")}>
            <div className="text-2xl font-mono font-bold">{advice.underpriced ? 'Underpriced!' : 'At or above floor'}</div>
            <div className="text-xs text-muted-foreground mt-1">vs your current ${currentPriceNum.toFixed(2)}</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Documented market bands for this pattern</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="px-2 py-2 font-medium">Position</th>
                  <th className="px-3 py-2 text-right font-medium">Band</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {advice.bands.map(band => (
                  <tr key={band.label} className="hover:bg-muted/30">
                    <td className="px-2 py-2.5 font-medium">{band.label}</td>
                    <td className="px-3 py-2.5 text-right font-mono">${band.low.toFixed(2)}–${band.high.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Why this price — adjusters, each grounded in market data</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {advice.reasoning.map((line, i) => (
              <li key={i} className="leading-relaxed">• {line}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">What the recommended price nets per platform</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="px-2 py-2 font-medium">Volume scenario</th>
                  {Object.keys(advice.volumeScenarios[0].platformNets).map(p => (
                    <th key={p} className="px-3 py-2 text-right font-medium">{PLATFORM_LABELS[p as keyof typeof PLATFORM_LABELS]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {advice.volumeScenarios.map(scenario => (
                  <tr key={scenario.label} className="hover:bg-muted/30">
                    <td className="px-2 py-2.5 font-medium">{scenario.label}</td>
                    {Object.entries(scenario.platformNets).map(([p, net]) => (
                      <td key={p} className="px-3 py-2.5 text-right font-mono">${fmt(net)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Bands from documented market guidance: standard $5–10 (GoSadi, Oct 2025), premium
          detailed patterns $14–18 (designer pricing discussions 2019–2025); cost-plus floor
          models a conservative 150-sale lifetime vs the $203 average Ravelry lifetime
          (Media Peruana, 10,000-designer analysis). Per-platform nets reuse the verified
          fee model from the Income Planner — no separate fee assumptions.
        </p>
      </CardContent>
    </Card>
  );
}
