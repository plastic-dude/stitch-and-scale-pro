/**
 * Listing Test Lab (CHK-058) — the 56th workspace tab.
 *
 * Competitor flaw (session-58 research): Alura's A/B tool assumes ~30,000
 * visitors per variant; generic SEO tools never answer "does the rewrite
 * pay?". This lab applies honest low-traffic statistics (Evan Miller's
 * formula) to a pattern designer's real listings: required sample, the
 * smallest provable lift, break-even vs re-list hours, and a rewire / fix /
 * test / scale verdict ladder.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  analyzeListingTest,
  DEFAULT_LISTING,
  rankListingQueue,
  type ListingInput,
  type Platform,
  type TestVariable,
} from '@/lib/listing-test-lab';
import { PatternProject } from '@/lib/grading-engine';
import {
  ListOrdered,
  BarChart3,
  Flag,
  Lightbulb,
  TrendingUp,
  Users,
  Trash2,
  Plus,
} from 'lucide-react';

interface StoredState {
  listings?: ListingInput[];
}

function loadStored(handle: ProjectStorageHandle<StoredState>): StoredState {
  try {
    const parsed = handle.read();
    if (parsed && Array.isArray(parsed.listings)) return parsed as StoredState;
  } catch {
    /* storage unreadable — start fresh */
  }
  return { listings: [DEFAULT_LISTING] };
}

function numField(value: string): number {
  const n = parseFloat(value);
  return isFinite(n) ? n : 0;
}

const PLATFORMS: { id: Platform; label: string; hint: string }[] = [
  { id: 'ravelry', label: 'Ravelry', hint: '0% commission — ≈2.9% + $0.30 processing' },
  { id: 'etsy', label: 'Etsy', hint: '$0.20 listing + ≈6.5% + 3% + $0.25' },
  { id: 'lovecrafts', label: 'LoveCrafts', hint: '25% seller fee' },
  { id: 'payhip', label: 'Payhip', hint: '5% platform' },
];

const VARIABLES: { id: TestVariable; label: string }[] = [
  { id: 'photo', label: 'Main photo' },
  { id: 'title', label: 'Title / keywords' },
  { id: 'price', label: 'Price' },
  { id: 'description', label: 'Description' },
];

function StatBox({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'warn' | 'bad' }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'text-lg font-semibold',
          tone === 'good' && 'text-emerald-600',
          tone === 'warn' && 'text-amber-600',
          tone === 'bad' && 'text-red-600',
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ListingTestLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredState>('listingtest', project.id), [project.id]);
  const { toast } = useToast();
  const [stored, setStored] = useState<StoredState>(() => loadStored(handle));
  useEffect(() => {
    handle.write(stored);
  }, [stored]);

  const listings = stored.listings ?? [DEFAULT_LISTING];
  const current = listings[0] ?? DEFAULT_LISTING;

  const updateListing = (patch: Partial<ListingInput>) => {
    setStored(s => ({ listings: [{ ...(s.listings?.[0] ?? DEFAULT_LISTING), ...patch }] }));
  };

  const analysis = useMemo(() => analyzeListingTest(current), [current]);
  const queue = useMemo(() => rankListingQueue(listings), [listings]);

  const [qName, setQName] = useState('');
  const [qViews, setQViews] = useState('');
  const [qConv, setQConv] = useState('');
  const [qPrice, setQPrice] = useState('');

  const addToQueue = () => {
    const views = numField(qViews);
    if (!views || listings.length >= 8) {
      toast({ title: 'Add at least monthly views (max 8 listings in queue).' });
      return;
    }
    setStored(s => ({
      listings: [
        ...(s.listings ?? []),
        {
          ...DEFAULT_LISTING,
          name: qName || `Listing ${listings.length + 1}`,
          monthlyViews: views,
          conversionRate: numField(qConv) || 0.02,
          price: numField(qPrice) || 6,
        },
      ],
    }));
    setQName('');
    setQViews('');
    setQConv('');
    setQPrice('');
  };

  const removeListing = (i: number) => {
    if (listings.length <= 1) return;
    setStored(s => ({ listings: (s.listings ?? []).filter((_, idx) => idx !== i) }));
  };

  const fmt$ = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const fmtN = (n: number) => (isFinite(n) ? Math.round(n).toLocaleString('en-US') : '∞');
  const fmtM = (n: number) => (isFinite(n) ? Math.max(1, Math.round(n)).toString() : '∞');
  const fmtPct = (p: number) => `${(p * 100).toFixed(1)}%`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListOrdered className="size-5" />
          Listing Test Lab
        </CardTitle>
        <CardDescription>
          Competitors assume ~30,000 visitors per variant — impossible for one pattern listing.
          This lab answers the question Alura never does: <em>is this rewrite worth my hours?</em>
          Enter one listing's real numbers and get Miller's required sample, the smallest lift
          your traffic can prove, break-even against re-list effort, and an honest verdict.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* ---- Queue of listings ---- */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Users className="size-4" />
            <Label className="text-base font-semibold">Listing queue — test the rich ones first</Label>
          </div>
          <div className="mb-3 grid gap-2 sm:grid-cols-5">
            <Input placeholder="Listing name" value={qName} onChange={e => setQName(e.target.value)} />
            <Input type="number" placeholder="Views/mo" value={qViews} onChange={e => setQViews(e.target.value)} />
            <Input type="number" step="0.01" placeholder="Conversion" value={qConv} onChange={e => setQConv(e.target.value)} />
            <Input type="number" placeholder="Price $" value={qPrice} onChange={e => setQPrice(e.target.value)} />
            <Button variant="outline" onClick={addToQueue}>
              <Plus className="mr-1 size-4" /> Add
            </Button>
          </div>
          <div className="space-y-1">
            {queue.map((q, idx) => (
              <div key={`${q.listing.name}-${idx}`} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-muted-foreground">{idx + 1}.</span>
                <span className="flex-1">{q.listing.name}</span>
                <span className="text-muted-foreground">{fmtN(q.listing.monthlyViews)} views/mo</span>
                <Badge variant="outline">{q.verdict}</Badge>
                <span className={cn('text-xs', q.expectedValue >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  EV {fmt$(q.expectedValue)}/hr
                </span>
                {listings.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeListing(listings.indexOf(q.listing))}>
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Ranked by expected value per re-list hour. Listings at the bottom are catalog-refresh
            candidates, not test candidates.
          </p>
        </div>

        {/* ---- The testable listing ---- */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="size-4" />
            <Label className="text-base font-semibold">Design the test</Label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="lt-name">Listing name</Label>
              <Input
                id="lt-name"
                value={current.name}
                onChange={e => updateListing({ name: e.target.value })}
              />
            </div>
            <div>
              <Label>Platform</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {PLATFORMS.map(p => (
                  <Button
                    key={p.id}
                    type="button"
                    size="sm"
                    variant={current.platform === p.id ? 'default' : 'outline'}
                    onClick={() => updateListing({ platform: p.id })}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {PLATFORMS.find(p => p.id === current.platform)?.hint}
              </p>
            </div>
            <div>
              <Label htmlFor="lt-views">Views / month</Label>
              <Input
                id="lt-views"
                type="number"
                min={0}
                value={current.monthlyViews.toString()}
                onChange={e => updateListing({ monthlyViews: numField(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="lt-conv">Current conversion</Label>
              <Input
                id="lt-conv"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={current.conversionRate.toString()}
                onChange={e => updateListing({ conversionRate: numField(e.target.value) })}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Etsy avg 1–3%; above 3% is strong.</p>
            </div>
            <div>
              <Label htmlFor="lt-price">Price ($)</Label>
              <Input
                id="lt-price"
                type="number"
                min={0}
                step={0.5}
                value={current.price.toString()}
                onChange={e => updateListing({ price: numField(e.target.value) })}
              />
            </div>
            <div>
              <Label>What are you changing?</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {VARIABLES.map(v => (
                  <Button
                    key={v.id}
                    type="button"
                    size="sm"
                    variant={current.variable === v.id ? 'default' : 'outline'}
                    onClick={() => updateListing({ variable: v.id })}
                  >
                    {v.label}
                  </Button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">One variable per test — always.</p>
            </div>
            <div>
              <Label htmlFor="lt-lift">Hypothesized lift</Label>
              <Input
                id="lt-lift"
                type="number"
                min={0}
                step={0.005}
                value={current.hypothesizedLift.toString()}
                onChange={e => updateListing({ hypothesizedLift: numField(e.target.value) })}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Absolute conversion lift, e.g. 0.01 = 2%→3%.</p>
            </div>
            <div>
              <Label htmlFor="lt-hours">Re-list effort (hours)</Label>
              <Input
                id="lt-hours"
                type="number"
                min={0}
                value={current.effortHours.toString()}
                onChange={e => updateListing({ effortHours: numField(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="lt-rate">Your hourly rate ($)</Label>
              <Input
                id="lt-rate"
                type="number"
                min={0}
                value={current.hourlyRate.toString()}
                onChange={e => updateListing({ hourlyRate: numField(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="lt-duration">Planned duration (months)</Label>
              <Input
                id="lt-duration"
                type="number"
                min={0.5}
                step={0.5}
                value={current.plannedDurationMonths.toString()}
                onChange={e => updateListing({ plannedDurationMonths: numField(e.target.value) })}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Run ≥1 full month — pattern sales swing with seasons.</p>
            </div>
            <div>
              <Label htmlFor="lt-horizon">Credit the uplift for (months)</Label>
              <Input
                id="lt-horizon"
                type="number"
                min={1}
                max={60}
                value={current.upliftHorizonMonths.toString()}
                onChange={e => updateListing({ upliftHorizonMonths: numField(e.target.value) })}
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <input
                id="lt-multi"
                type="checkbox"
                checked={current.isMultipleVariables}
                onChange={e => updateListing({ isMultipleVariables: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="lt-multi" className="cursor-pointer">
                Changing several things at once
              </Label>
            </div>
            <div>
              <Label htmlFor="lt-tags">Ravelry tags used (0–1)</Label>
              <Input
                id="lt-tags"
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={current.tagsUsedPct.toString()}
                onChange={e => updateListing({ tagsUsedPct: numField(e.target.value) })}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Ravelry allows 13 tags + attributes — search runs on them.</p>
            </div>
          </div>
        </div>

        {/* ---- Results ---- */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="size-4" />
            <Label className="text-base font-semibold">The honest math</Label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox label="Required sample / variant" value={`≈${fmtN(analysis.samplePerVariant)} visits`} tone="warn" />
            <StatBox label="Months to reach power" value={`≈${fmtM(analysis.monthsToPower)} mo`} tone={analysis.monthsToPower <= 6 ? 'good' : 'warn'} />
            <StatBox
              label="Smallest provable lift (your traffic, your plan)"
              value={analysis.maxDetectableLift !== null ? `±${fmtPct(analysis.maxDetectableLift)}` : 'None — untestable'}
              tone={analysis.maxDetectableLift === null ? 'bad' : 'good'}
            />
            <StatBox label="Net per sale on this platform" value={fmt$(analysis.netRevenuePerSale)} />
            <StatBox label="Baseline net / month" value={fmt$(analysis.baselineMonthlyNet)} />
            <StatBox label="Uplift gain / month if real" value={fmt$(analysis.upliftMonthlyGain)} tone="good" />
            <StatBox label="Break-even vs your effort" value={isFinite(analysis.breakEvenMonths) ? `≈${fmtM(analysis.breakEvenMonths)} mo of uplift` : 'Beyond reach'} tone={isFinite(analysis.breakEvenMonths) ? 'good' : 'bad'} />
            <StatBox label="Expected value (honest, incl. peeking penalty)" value={fmt$(analysis.expectedValue)} tone={analysis.expectedValue >= 0 ? 'good' : 'bad'} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Required sample from Evan Miller's two-proportion z-test (α=0.05, power 0.8). EV assumes
            a 50% prior that the lift is real and penalizes early-peeking; expected-value ranking in the
            queue divides by your re-list hours.
          </p>
        </div>

        {/* ---- Flags ---- */}
        {analysis.flags.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Flag className="size-4" />
              <Label className="text-base font-semibold">Warnings</Label>
            </div>
            <div className="space-y-2">
              {analysis.flags.map(f => (
                <div key={f.code} className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 shrink-0">{f.code}</Badge>
                  <div>
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Verdict ---- */}
        <div
          className={cn(
            'rounded-lg border p-4',
            analysis.verdict === 'Rewire' && 'border-red-200 bg-red-50',
            analysis.verdict === 'Fix the test' && 'border-amber-200 bg-amber-50',
            analysis.verdict === 'Test it' && 'border-emerald-200 bg-emerald-50',
          )}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="size-4" />
            <Badge
              className={cn(
                'text-white',
                analysis.verdict === 'Rewire' && 'bg-red-600',
                analysis.verdict === 'Fix the test' && 'bg-amber-500',
                analysis.verdict === 'Test it' && 'bg-emerald-600',
              )}
            >
              {analysis.verdict}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{analysis.verdictNote}</p>
        </div>
      </CardContent>
    </Card>
  );
}
