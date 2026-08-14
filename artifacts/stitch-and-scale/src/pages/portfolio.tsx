/**
 * Release Portfolio — the catalogue-level view every design tool skips.
 *
 * One pattern at a time is how the market builds; a portfolio at a time is
 * how a designer's income actually works (Media Peruana's catalogue income
 * analysis, 2016). This page ranks every pattern by launch readiness ×
 * revenue potential, spots "matching set" bundle candidates across the
 * catalogue (Fit for Art's $36-vs-$51 positioning = 71% of sum-of-parts),
 * and benchmarks the release cadence (Sister Mountain's monthly rhythm,
 * Dec 2023).
 *
 * All math comes from the existing, tested libraries — nothing new is
 * invented here.
 */
import React from 'react';
import { useProjects } from '@/context/ProjectsContext';
import { Link } from 'wouter';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  buildPortfolio,
  type PortfolioLine,
  type PortfolioInputs,
} from '@/lib/release-portfolio';
import {
  ITEM_TYPE_LIST, ITEM_TYPE_LABELS, SKILL_LEVEL_LIST, SKILL_LEVEL_LABELS,
  PRICING_MARKET_TARGET_LABELS,
} from '@/lib/pattern-pricing-advisor';
import { PLATFORMS } from '@/lib/pattern-income-calculator';
import { Coins, ListChecks, Package, Rocket, Target, TrendingUp } from 'lucide-react';

const DEFAULT_INPUTS: PortfolioInputs = {
  itemType: 'sweater',
  skillLevel: 'intermediate',
  marketTarget: 'standard',
  hoursWorked: 20,
  hourlyRate: 25,
  currentPrice: 8,
};

function numberInput(id: string, label: string, hint: string, value: string, onChange: (v: string) => void) {
  return (
    <div className="flex-1 min-w-[9rem]">
      <Label htmlFor={id} className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      <Input id={id} type="number" min="0" value={value}
        onChange={(e) => onChange(e.target.value)} className="h-9" />
      <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}

function usd(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Readiness score → label + tone. */
function readinessMeta(score: number) {
  if (score >= 75) return { label: 'Ready to launch', tone: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40' as const };
  if (score >= 40) return { label: 'Almost there', tone: 'bg-amber-500/15 text-amber-600 border-amber-500/40' as const };
  return { label: 'Needs work', tone: 'bg-destructive/10 text-destructive border-destructive/40' as const };
}

function PortfolioLineRow({ line }: { line: PortfolioLine }) {
  const meta = readinessMeta(line.readinessScore);
  return (
    <div className="grid grid-cols-12 gap-2 items-center py-2.5 border-b border-border/60 last:border-b-0 text-sm">
      <div className="col-span-4">
        <Link href={`/project/${line.projectId}`} className="font-medium hover:underline underline-offset-2 block truncate">
          {line.name}
        </Link>
        <div className="text-xs text-muted-foreground">{line.yarnWeightClass} · {line.listingReady ? 'listing material ready' : 'listing incomplete'}</div>
      </div>
      <div className="col-span-2 text-center">
        <Badge variant="outline" className={meta.tone}>{meta.label}</Badge>
        <div className="text-[11px] text-muted-foreground mt-1">{line.readinessScore}/100 readiness</div>
      </div>
      <div className="col-span-2 text-center">
        <div className="font-mono font-semibold">{usd(line.pricing.recommendedPrice)}</div>
        <div className="text-[11px] text-muted-foreground">recommended</div>
      </div>
      <div className="col-span-2 text-center">
        <div className="font-mono text-xs">{usd(line.netPerUnitBest)} / {usd(line.netPerUnitWorst)}</div>
        <div className="text-[11px] text-muted-foreground">net per unit (best/worst)</div>
      </div>
      <div className="col-span-2">
        <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
          <div className="h-full bg-primary/80 rounded-full" style={{ width: `${line.launchScore}%` }} />
        </div>
        <div className="text-[11px] text-muted-foreground mt-1 text-center">{Math.round(line.launchScore)} launch score</div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { projects } = useProjects();
  const [inputs, setInputs] = React.useState<PortfolioInputs>(DEFAULT_INPUTS);
  const [inputsRaw, setInputsRaw] = React.useState({ hours: '20', rate: '25', price: '8' });

  const portfolio = buildPortfolio(projects, inputs);
  const bestPlatform = PLATFORMS[0];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
      <header>
        <h1 className="font-serif text-2xl flex items-center gap-2">
          <Package className="h-6 w-6" /> Release Portfolio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your whole catalogue, ranked for launch. Every tool stops at one pattern —
          your income is a portfolio decision.
        </p>
      </header>

      {/* Planning inputs */}
      <Card className="border-border/70 bg-card/50">
        <CardHeader>
          <CardTitle className="font-serif text-base">Your launch plan</CardTitle>
          <CardDescription>
            The advisory inputs applied across every pattern (per-pattern engineering data still comes from each project).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[9rem]">
              <Label htmlFor="port-item" className="text-xs text-muted-foreground mb-1 block">Item type</Label>
              <NativeSelect id="port-item" value={inputs.itemType}
                onChange={(e) => setInputs((p) => ({ ...p, itemType: e.target.value }))}
                className="h-9" data-testid="portfolio-item-type">
                {ITEM_TYPE_LIST.map(t => (
                  <option key={t} value={t}>{ITEM_TYPE_LABELS[t]}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex-1 min-w-[9rem]">
              <Label htmlFor="port-skill" className="text-xs text-muted-foreground mb-1 block">Skill level</Label>
              <NativeSelect id="port-skill" value={inputs.skillLevel}
                onChange={(e) => setInputs((p) => ({ ...p, skillLevel: e.target.value }))}
                className="h-9" data-testid="portfolio-skill">
                {SKILL_LEVEL_LIST.map(t => (
                  <option key={t} value={t}>{SKILL_LEVEL_LABELS[t]}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex-1 min-w-[9rem]">
              <Label htmlFor="port-target" className="text-xs text-muted-foreground mb-1 block">Market target</Label>
              <NativeSelect id="port-target" value={inputs.marketTarget}
                onChange={(e) => setInputs((p) => ({ ...p, marketTarget: e.target.value as 'standard' | 'premium' }))}
                className="h-9" data-testid="portfolio-target">
                {(Object.keys(PRICING_MARKET_TARGET_LABELS) as ('standard' | 'premium')[]).map(t => (
                  <option key={t} value={t}>{PRICING_MARKET_TARGET_LABELS[t]}</option>
                ))}
              </NativeSelect>
            </div>
            {numberInput('port-hours', 'Hours per pattern', 'Your tracked design hours', inputsRaw.hours, (v) => { setInputsRaw((p) => ({ ...p, hours: v })); setInputs((p) => ({ ...p, hoursWorked: parseFloat(v) || 0 })); })}
            {numberInput('port-rate', 'Hourly rate (USD)', 'What your time is worth', inputsRaw.rate, (v) => { setInputsRaw((p) => ({ ...p, rate: v })); setInputs((p) => ({ ...p, hourlyRate: parseFloat(v) || 0 })); })}
            {numberInput('port-price', 'Launch price (USD)', 'Your planned list price', inputsRaw.price, (v) => { setInputsRaw((p) => ({ ...p, price: v })); setInputs((p) => ({ ...p, currentPrice: parseFloat(v) || 0 })); })}
          </div>
        </CardContent>
      </Card>

      {/* Summary chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/70 bg-card/50 text-center">
          <CardContent className="pt-4">
            <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="font-mono text-xl font-bold">{portfolio.lines.length}</div>
            <div className="text-xs text-muted-foreground">patterns in catalogue</div>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/50 text-center">
          <CardContent className="pt-4">
            <Rocket className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="font-mono text-xl font-bold">{portfolio.readyToLaunch.length}</div>
            <div className="text-xs text-muted-foreground">ready to launch now</div>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/50 text-center">
          <CardContent className="pt-4">
            <Coins className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="font-mono text-xl font-bold">{usd(portfolio.totalCatalogueValue)}</div>
            <div className="text-xs text-muted-foreground">catalogue value at recommended prices</div>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/50 text-center">
          <CardContent className="pt-4">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="font-mono text-sm font-bold leading-5">{portfolio.recommendedCadence}</div>
            <div className="text-xs text-muted-foreground">documented working rhythm</div>
          </CardContent>
        </Card>
      </div>

      {/* Launch ranking */}
      <Card className="border-border/70 bg-card/50">
        <CardHeader>
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Rocket className="h-4 w-4" /> Launch ranking
          </CardTitle>
          <CardDescription>
            Ordered by readiness × revenue potential. Scores reuse the verified readiness checks,
            pricing advisor, and platform fee model — nothing new invented.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {portfolio.lines.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No projects yet — open <Link href="/" className="underline underline-offset-2">your dashboard</Link> to add the first pattern.
            </div>
          ) : (
            <div className="hidden md:grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wide text-muted-foreground px-1 pb-1 border-b">
              <div className="col-span-4">Pattern</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-center">Recommended</div>
              <div className="col-span-2 text-center">Net per unit</div>
              <div className="col-span-2 text-center">Launch priority</div>
            </div>
          )}
          {portfolio.lines.map(line => <PortfolioLineRow key={line.projectId} line={line} />)}
        </CardContent>
      </Card>

      {/* Bundle candidates */}
      <Card className="border-border/70 bg-card/50">
        <CardHeader>
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Package className="h-4 w-4" /> Bundle candidates
          </CardTitle>
          <CardDescription>
            Patterns sharing a yarn weight knit as a matching set — bundle at 71% of the sum of parts
            (Fit for Art's documented positioning: $36 vs $51 individual) to lift revenue per customer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {portfolio.bundles.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No bundle candidates yet — you need at least two patterns in the same yarn weight (or two graded garments).
            </div>
          ) : (
            <div className="space-y-3">
              {portfolio.bundles.map(bundle => (
                <div key={bundle.id} className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-medium">{bundle.patterns.map(p => p.name).join(' + ')}</span>
                    <Badge variant="outline" className="text-xs">
                      {usd(bundle.sumOfParts)} individually → <span className="font-semibold ml-1">{usd(bundle.bundlePrice)} bundle</span>
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">{bundle.why}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Net per bundle on {bestPlatform} ≈ {usd(bundle.bundleNetExtra)} beyond selling separately at the discounted rate.
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footnote */}
      <div className="text-[11px] text-muted-foreground space-y-1 border-t border-border/60 pt-3">
        <p>Readiness reuses the Pre-Publish Toolkit's checks; pricing reuses the Pricing Advisor's cited market bands ($5–10 standard, $12–18 premium); per-platform net reuses the Income Planner's verified fee model.</p>
        <p>Bundle math: 71% of sum of parts (Fit for Art's $36/$51 observed positioning). Cadence: one release per month (Sister Mountain, Dec 2023).</p>
      </div>
    </div>
  );
}
