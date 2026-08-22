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
  BUNDLE_DISCOUNT_RANGE,
  bundlePriceAt,
  bundleNetAt,
} from '@/lib/release-portfolio';
import {
  ITEM_TYPE_LIST, ITEM_TYPE_LABELS, SKILL_LEVEL_LIST, SKILL_LEVEL_LABELS,
  PRICING_MARKET_TARGET_LABELS,
} from '@/lib/pattern-pricing-advisor';
import { PLATFORMS } from '@/lib/pattern-income-calculator';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Coins, Download, ListChecks, Package, Rocket, Target, TrendingUp } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { PORTFOLIO_COPY, type PortfolioCopy } from '@/lib/portfolio-copy';
import { normalizeProjectBookFilename, projectBookPrintTitle, renderProjectBookDocument } from '@/lib/project-book-export';
import { RevenueGrowthPanel } from '@/components/revenue-growth-panel';

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
function readinessMeta(score: number, copy: PortfolioCopy) {
  if (score >= 75) return { label: copy.readyLaunch, tone: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40' as const };
  if (score >= 40) return { label: copy.almost, tone: 'bg-amber-500/15 text-amber-600 border-amber-500/40' as const };
  return { label: copy.needs, tone: 'bg-destructive/10 text-destructive border-destructive/40' as const };
}

function PortfolioLineRow({ line, copy }: { line: PortfolioLine; copy: PortfolioCopy }) {
  const meta = readinessMeta(line.readinessScore, copy);
  const scoreLabel = `${Math.round(line.launchScore)} ${copy.mobileLaunchScore}`;
  return (
    <div className="border-b border-border/60 last:border-b-0">
      {/* Mobile layout: a stacked card with sr-only headers, so no value ever
          fights its label for horizontal space at 360px widths. */}
      <div className="md:hidden py-3 px-1 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/project/${line.projectId}`} className="font-medium hover:underline underline-offset-2 block truncate">
              {line.name}
            </Link>
            <div className="text-xs text-muted-foreground">{line.yarnWeightClass} · {line.listingReady ? 'listing material ready' : 'listing incomplete'}</div>
          </div>
          <Badge variant="outline" className={meta.tone} aria-label="readiness">{meta.label}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{copy.mobileRecommendedPrice}</div>
            <div className="font-mono font-semibold">{usd(line.pricing.recommendedPrice)}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <div className="text-[11px] text-muted-foreground">{copy.mobileNetPerUnit}</div>
            <div className="font-mono text-xs truncate">{usd(line.netPerUnitBest)} – {usd(line.netPerUnitWorst)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-muted/60 overflow-hidden">
            <div className="h-full bg-primary/80 rounded-full" style={{ width: `${line.launchScore}%` }} />
          </div>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">{scoreLabel}</span>
        </div>
      </div>
      {/* Desktop layout: the 12-column table — unchanged at md+ */}
      <div className="hidden md:grid md:grid-cols-12 md:gap-2 md:items-center md:py-2.5 md:text-sm">
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
          <div className="text-[11px] text-muted-foreground mt-1 text-center">{scoreLabel}</div>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { projects } = useProjects();
  const { language, studioProfile } = useSettings();
  const copy = PORTFOLIO_COPY[language];
  const interpolate = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
  const [inputs, setInputs] = React.useState<PortfolioInputs>(DEFAULT_INPUTS);
  const [inputsRaw, setInputsRaw] = React.useState({ hours: '20', rate: '25', price: '8' });
  const [bookFilename, setBookFilename] = React.useState(copy.bookTitle);
  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>(() => projects.map(project => project.id));
  const [bookStatus, setBookStatus] = React.useState('');

  React.useEffect(() => {
    setSelectedProjectIds(previous => {
      const available = new Set(projects.map(project => project.id));
      const kept = previous.filter(id => available.has(id));
      return kept.length > 0 || projects.length === 0 ? kept : projects.map(project => project.id);
    });
  }, [projects]);

  const portfolio = buildPortfolio(projects, inputs);
  const selectedBookProjects = projects.filter(project => selectedProjectIds.includes(project.id));
  const toggleBookProject = (projectId: string) => {
    setSelectedProjectIds(previous => previous.includes(projectId)
      ? previous.filter(id => id !== projectId)
      : [...previous, projectId]);
  };
  const prepareProjectBook = () => {
    if (selectedBookProjects.length === 0) {
      setBookStatus(copy.bookEmptySelection);
      return;
    }
    const filename = normalizeProjectBookFilename(bookFilename, copy.bookTitle);
    const popup = window.open('', '_blank');
    if (!popup) {
      setBookStatus(copy.bookFailed);
      return;
    }
    const html = renderProjectBookDocument({
      title: projectBookPrintTitle(filename),
      projects: selectedBookProjects,
      portfolio: buildPortfolio(selectedBookProjects, inputs),
      studio: studioProfile,
      locale: language,
    });
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setBookStatus(copy.bookPrepared);
    window.setTimeout(() => { if (!popup.closed) popup.print(); }, 160);
  };
  const bestPlatform = PLATFORMS[0];
  // Bundle premium slider (CHK-134, S284): per-bundle discount factor.
  // Defaults to the documented 71% anchor — the UI lets the designer slide
  // the full defensible range (65–80%) with live net deltas. Ranking stays
  // anchored at the 71% position so what-if exploration can't distort the
  // launch order.
  const [bundleDiscounts, setBundleDiscounts] = React.useState<Record<string, number>>({});
  const discountFor = (bundleId: string) => bundleDiscounts[bundleId] ?? 0.71;
  const setDiscountFor = (bundleId: string, discount: number) =>
    setBundleDiscounts(p => ({ ...p, [bundleId]: discount }));

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
      <header>
          <h1 className="font-serif text-2xl flex items-center gap-2">
            <Package className="h-6 w-6" /> {copy.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {copy.description}
        </p>
      </header>

      {/* Planning inputs */}
      <Card className="border-border/70 bg-card/50">
        <CardHeader>
          <CardTitle className="font-serif text-base">{copy.plan}</CardTitle>
          <CardDescription>
            {copy.planDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <Label htmlFor="port-item" className="text-xs text-muted-foreground mb-1 block">{copy.itemType}</Label>
              <NativeSelect id="port-item" value={inputs.itemType}
                onChange={(e) => setInputs((p) => ({ ...p, itemType: e.target.value }))}
                className="w-full h-9" data-testid="portfolio-item-type">
                {ITEM_TYPE_LIST.map(t => (
                  <option key={t} value={t}>{ITEM_TYPE_LABELS[t]}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="min-w-0">
              <Label htmlFor="port-skill" className="text-xs text-muted-foreground mb-1 block">{copy.skill}</Label>
              <NativeSelect id="port-skill" value={inputs.skillLevel}
                onChange={(e) => setInputs((p) => ({ ...p, skillLevel: e.target.value }))}
                className="w-full h-9" data-testid="portfolio-skill">
                {SKILL_LEVEL_LIST.map(t => (
                  <option key={t} value={t}>{SKILL_LEVEL_LABELS[t]}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="min-w-0">
              <Label htmlFor="port-target" className="text-xs text-muted-foreground mb-1 block">{copy.market}</Label>
              <NativeSelect id="port-target" value={inputs.marketTarget}
                onChange={(e) => setInputs((p) => ({ ...p, marketTarget: e.target.value as 'standard' | 'premium' }))}
                className="w-full h-9" data-testid="portfolio-target">
                {(Object.keys(PRICING_MARKET_TARGET_LABELS) as ('standard' | 'premium')[]).map(t => (
                  <option key={t} value={t}>{PRICING_MARKET_TARGET_LABELS[t]}</option>
                ))}
              </NativeSelect>
            </div>
            {numberInput('port-hours', copy.hours, copy.hoursHint, inputsRaw.hours, (v) => { setInputsRaw((p) => ({ ...p, hours: v })); setInputs((p) => ({ ...p, hoursWorked: parseFloat(v) || 0 })); })}
            {numberInput('port-rate', copy.rate, copy.rateHint, inputsRaw.rate, (v) => { setInputsRaw((p) => ({ ...p, rate: v })); setInputs((p) => ({ ...p, hourlyRate: parseFloat(v) || 0 })); })}
            {numberInput('port-price', copy.price, copy.priceHint, inputsRaw.price, (v) => { setInputsRaw((p) => ({ ...p, price: v })); setInputs((p) => ({ ...p, currentPrice: parseFloat(v) || 0 })); })}
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
        <CardContent className="overflow-x-auto overflow-y-hidden">
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
          {portfolio.lines.map(line => <PortfolioLineRow key={line.projectId} line={line} copy={copy} />)}
        </CardContent>
      </Card>

      {/* Bundle candidates */}
      <Card className="border-border/70 bg-card/50">
        <CardHeader>
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Package className="h-4 w-4" /> {copy.bundle}
          </CardTitle>
          <CardDescription>
            {copy.bundleDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto overflow-y-hidden">
          {portfolio.bundles.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center">
              {copy.noBundles}
            </div>
          ) : (
            <div className="space-y-3">
              {portfolio.bundles.map(bundle => {
                const discount = discountFor(bundle.id);
                const livePrice = bundlePriceAt(bundle.sumOfParts, discount);
                const liveNet = bundleNetAt(bundle.sumOfParts, discount);
                const delta = Math.round((liveNet - bundle.separateNet) * 100) / 100;
                const atAnchor = Math.abs(discount - 0.71) < 0.005;
                return (
                  <div key={bundle.id} className="rounded-lg border border-border/70 bg-muted/30 p-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="font-medium">{bundle.patterns.map(p => p.name).join(' + ')}</span>
                      <Badge variant="outline" className="text-xs">
                        {usd(bundle.sumOfParts)} individually → <span className="font-semibold ml-1">{usd(livePrice)} bundle</span>
                        {!atAnchor && <span className="ml-1 text-muted-foreground">({Math.round(discount * 100)}%)</span>}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">{bundle.why}</div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                        <span>{copy.bundleDiscount}</span>
                        <span className="font-mono font-semibold text-foreground">{Math.round(discount * 100)}%</span>
                      </div>
                      <Slider min={BUNDLE_DISCOUNT_RANGE.min * 100} max={BUNDLE_DISCOUNT_RANGE.max * 100} step={BUNDLE_DISCOUNT_RANGE.step * 100}
                        value={[discount * 100]}
                        onValueChange={v => setDiscountFor(bundle.id, v[0] / 100)}
                        aria-label={`${copy.bundleDiscount} (${Math.round(discount * 100)}%)`}
                        data-testid={`bundle-discount-${bundle.id}`} />
                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                        <span>{interpolate(copy.bundleNetBundle, { platform: bestPlatform, amount: usd(liveNet) })}</span>
                        <span>{interpolate(copy.bundleNetSeparate, { amount: usd(bundle.separateNet) })}</span>
                        <span className={delta >= 0 ? 'text-emerald-600 font-medium' : 'text-destructive font-medium'}>
                          {delta >= 0 ? '+' : ''}{usd(delta)} {copy.bundleNetDelta}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-project Project Book handoff */}
      <Card className="border-primary/25 bg-primary/[0.03]">
        <CardHeader>
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Download className="h-4 w-4" /> {copy.bookTitle}
          </CardTitle>
          <CardDescription>{copy.bookDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="portfolio-book-name" className="text-xs text-muted-foreground">{copy.bookName}</Label>
            <Input
              id="portfolio-book-name"
              value={bookFilename}
              onChange={(event) => setBookFilename(event.target.value)}
              maxLength={100}
              aria-describedby="portfolio-book-name-hint"
              data-testid="portfolio-book-filename"
            />
            <p id="portfolio-book-name-hint" className="text-[11px] text-muted-foreground">{copy.bookNameHint}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {interpolate(copy.bookSelected, { selected: selectedBookProjects.length, total: projects.length })}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={() => setSelectedProjectIds(projects.map(project => project.id))}>{copy.bookSelectAll}</Button>
              <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={() => setSelectedProjectIds([])}>{copy.bookClear}</Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label={copy.bookTitle}>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">{copy.noProjects}</p>
            ) : projects.map(project => (
              <label key={project.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProjectIds.includes(project.id)}
                  onChange={() => toggleBookProject(project.id)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="min-w-0 truncate">{project.name || 'Untitled pattern'}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" className="min-h-11" onClick={prepareProjectBook} disabled={selectedBookProjects.length === 0} data-testid="portfolio-book-export">
              <Download className="h-4 w-4 mr-1" /> {copy.bookExport}
            </Button>
            <span className="text-xs text-muted-foreground" aria-live="polite">{bookStatus}</span>
          </div>
        </CardContent>
      </Card>

      <RevenueGrowthPanel />

      {/* Footnote */}
      <div className="text-[11px] text-muted-foreground space-y-1 border-t border-border/60 pt-3">
        <p>{copy.footnoteReadiness}</p>
        <p>{copy.footnoteBundle}</p>
      </div>
    </div>
  );
}
