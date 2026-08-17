import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { PRICING_ADVISOR_COPY } from '@/lib/pricing-advisor-copy';
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
  const { language } = useSettings();
  const copyText = PRICING_ADVISOR_COPY[language];
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
        <CardTitle className="font-serif flex items-center gap-2">{copyText.title}</CardTitle>
        <CardDescription>
                    {copyText.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="pricing-item" className="text-xs text-muted-foreground mb-1 block">{copyText.itemType}</Label>
            <NativeSelect id="pricing-item" value={itemType}
              onChange={(e) => setItemType(e.target.value)} data-testid="select-pricing-item">
              {ITEM_TYPE_LIST.map(t => (
                <option key={t} value={t}>{copyText.itemTypes[t]}</option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="pricing-skill" className="text-xs text-muted-foreground mb-1 block">{copyText.skillLevel}</Label>
            <NativeSelect id="pricing-skill" value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)} data-testid="select-pricing-skill">
              {SKILL_LEVEL_LIST.map(t => (
                <option key={t} value={t}>{copyText.skills[t]}</option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="pricing-market" className="text-xs text-muted-foreground mb-1 block">{copyText.market}</Label>
            <NativeSelect id="pricing-market" value={marketTarget}
              onChange={(e) => setMarketTarget(e.target.value)} data-testid="select-pricing-market">
              <option value="standard">{copyText.standard}</option>
              <option value="premium">{copyText.premium}</option>
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="pricing-current" className="text-xs text-muted-foreground mb-1 block">{copyText.currentPrice}</Label>
            <Input id="pricing-current" type="number" min="0" step="0.5" value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)} data-testid="pricing-current" className="h-10" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <div>
            <Label htmlFor="pricing-hours" className="text-xs text-muted-foreground mb-1 block">{copyText.hours}</Label>
            <Input id="pricing-hours" type="number" min="0" value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)} data-testid="pricing-hours" className="h-10" />
          </div>
          <div>
            <Label htmlFor="pricing-rate" className="text-xs text-muted-foreground mb-1 block">{copyText.hourlyRate}</Label>
            <Input id="pricing-rate" type="number" min="0" value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)} data-testid="pricing-rate" className="h-10" />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer" data-testid="pricing-tech-edited">
            <Checkbox checked={techEdited} onCheckedChange={(v) => setTechEdited(v === true)} id="pricing-tech-edited" />
            {copyText.techEdited}
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer" data-testid="pricing-test-knitted">
            <Checkbox checked={testKnitted} onCheckedChange={(v) => setTestKnitted(v === true)} id="pricing-test-knitted" />
            {copyText.testKnitted}
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="bg-muted/40 rounded-lg p-4 text-center flex-1">
            <div className="text-2xl font-mono font-bold text-foreground">${advice.recommendedPrice.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">{copyText.recommended}</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-4 text-center flex-1">
            <div className="text-2xl font-mono font-bold text-foreground">${fmt(advice.costPlusFloor)}</div>
            <div className="text-xs text-muted-foreground mt-1">{copyText.floor}</div>
          </div>
          <div className={cn("rounded-lg p-4 text-center flex-1", advice.underpriced ? "bg-destructive/10 border border-destructive/40" : "bg-muted/40")}>
            <div className="text-2xl font-mono font-bold">{advice.underpriced ? copyText.underpriced : copyText.atOrAbove}</div>
            <div className="text-xs text-muted-foreground mt-1">{copyText.vsCurrent(currentPriceNum.toFixed(2))}</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">{copyText.bands}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="px-2 py-2 font-medium">{copyText.position}</th>
                  <th className="px-3 py-2 text-right font-medium">{copyText.band}</th>
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
          <h3 className="text-sm font-medium mb-2">{copyText.why}</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {advice.reasoning.map((line, i) => (
              <li key={i} className="leading-relaxed">• {line}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">{copyText.nets}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="px-2 py-2 font-medium">{copyText.volume}</th>
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
          {copyText.disclosure}
        </p>
      </CardContent>
    </Card>
  );
}
