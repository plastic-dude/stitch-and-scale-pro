import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coins, Rocket, Target, TrendingUp, Info } from 'lucide-react';
import { PRICING_MODELS, GROWTH_PILLARS, BETA_METRICS, estimateContributionMargin } from '@/lib/revenue-growth-planner';
import { useSettings } from '@/context/SettingsContext';
import { REVENUE_GROWTH_COPY } from '@/lib/revenue-growth-copy';

export function RevenueGrowthPanel() {
  const { language } = useSettings();
  const copy = REVENUE_GROWTH_COPY[language];
  const [volume, setVolume] = React.useState(10);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <CardTitle>{copy.title}</CardTitle>
        </div>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pricing" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">{copy.tabPricing}</span>
            </TabsTrigger>
            <TabsTrigger value="growth" className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              <span className="hidden sm:inline">{copy.tabGrowth}</span>
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">{copy.tabMetrics}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRICING_MODELS.map((model) => (
                <Card key={model.id} className="relative overflow-hidden border-border/60">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{model.name}</CardTitle>
                      <Badge variant="secondary">{model.period}</Badge>
                    </div>
                    <CardDescription className="text-xs">{model.target}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-bold font-mono">
                      ${model.price}
                    </div>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      {model.included.map((item, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-primary/60" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2 border-t border-border/40">
                      <p className="text-[10px] italic text-muted-foreground leading-tight">
                        {model.rationale}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4 border border-border/60">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{copy.pricingDisclaimer}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GROWTH_PILLARS.map((pillar, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-lg border border-border/60 bg-muted/20">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {i + 1}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">{pillar.title}</h4>
                    <p className="text-xs text-muted-foreground">{pillar.content}</p>
                    <Badge variant="outline" className="text-[10px] mt-1">{pillar.cta}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2 font-semibold">{copy.metricLabel}</th>
                    <th className="text-center py-2 font-semibold">{copy.metricTarget}</th>
                    <th className="text-left py-2 font-semibold">{copy.metricInsight}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {BETA_METRICS.map((metric, i) => (
                    <tr key={i}>
                      <td className="py-3 pr-4">{metric.label}</td>
                      <td className="py-3 px-4 text-center font-mono font-semibold">{metric.target}</td>
                      <td className="py-3 pl-4 text-xs text-muted-foreground">{metric.insight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
