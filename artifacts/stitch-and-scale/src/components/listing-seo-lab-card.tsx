import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, Copy, Tag, TrendingUp } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { projectStorage } from '@/lib/storage-lib';
import { sizeCountForProject } from '@/lib/pattern-pricing-advisor';
import {
  scoreListing, netPerSale, buildListingKit, momentumTargets,
  type ListingInputs,
} from '@/lib/listing-seo-lab';

interface StoredState {
  title: string;
  sizeCount: number;
  writtenAndCharted: boolean;
  sizeInclusive: boolean;
  listPrice: number;
  photoCount: number;
  tags: string[];
  tagDraft: string;
  teaserReady: boolean;
  emailListReady: boolean;
}

function defaultStored(project: PatternProject): StoredState {
  return {
    title: '',
    sizeCount: Math.max(1, sizeCountForProject(project)),
    writtenAndCharted: false,
    sizeInclusive: project.sections.length >= 2,
    listPrice: 0,
    photoCount: 0,
    tags: [],
    tagDraft: '',
    teaserReady: false,
    emailListReady: false,
  };
}

function loadStored(handle: ReturnType<typeof projectStorage<StoredState>>, project: PatternProject): StoredState {
  const parsed = handle.read();
  if (parsed) return { ...defaultStored(project), ...parsed };
  return defaultStored(project);
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const verdictColor = (v: string) =>
  v === 'Strong — publish with push' ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v === 'Ready to publish' ? 'bg-blue-500/15 text-blue-700 border-blue-500/30' :
  v === 'Almost — a few fixes' ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  'bg-destructive/15 text-destructive border-destructive/30';

function NumField({ id, label, value, onChange, min = 0, max, suffix }: {
  id: string; label: string; value: number;
  onChange: (n: number) => void; min?: number; max?: number; suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="relative">
        <Input id={id} type="number" min={min} {...(max !== undefined ? { max } : {})} step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) >= 0 ? Number(e.target.value) : 0)}
          className={suffix ? 'pr-8' : undefined} />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function ListingSeoLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(
    () => projectStorage<StoredState>('listingseo', project.id || '', []),
    [project.id],
  );
  const [stored, setStored] = useState<StoredState>(() => loadStored(handle, project));
  const patch = <K extends keyof StoredState>(key: K, value: StoredState[K]) => {
    setStored((s) => {
      const next = { ...s, [key]: value };
      handle.write(next);
      return next;
    });
  };
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  const inputs: ListingInputs = {
    title: stored.title,
    yarnWeight: project.yarnWeight || 'worsted',
    sizeCount: Math.max(1, stored.sizeCount),
    writtenAndCharted: stored.writtenAndCharted,
    sizeInclusive: stored.sizeInclusive,
    listPrice: stored.listPrice,
    photoCount: stored.photoCount,
    tags: stored.tags,
    descriptionWords: 0,
    teaserReady: stored.teaserReady,
    emailListReady: stored.emailListReady,
  };

  const score = useMemo(() => scoreListing(project, inputs), [project, inputs]);
  const kit = useMemo(() => buildListingKit(project, inputs), [project, inputs]);
  const nets = useMemo(() => netPerSale(stored.listPrice), [stored.listPrice]);
  const momentum = useMemo(() => momentumTargets(project, inputs), [project, inputs]);

  const kitText = `Title: ${kit.title}\n\nTags: ${kit.tags}\n\nDescription:\n${kit.description}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex flex-wrap items-center gap-2">
          <Tag className="h-4 w-4 shrink-0" /> Listing SEO Lab
        </CardTitle>
        <CardDescription>
          The pre-publish audit no marketplace gives you: score the listing, generate the
          paste-ready kit, and see net-per-sale on every channel. Fees documented in the
          research file — competitors blind you until the listing is live; we check it first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verdict banner */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={verdictColor(score.verdict)}>{score.verdict}</Badge>
          <div className="text-sm font-semibold">{score.total} / 100</div>
          <div className="h-2 flex-1 min-w-24 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-destructive via-amber-500 to-emerald-500 transition-all"
              style={{ width: `${score.total}%` }}
            />
          </div>
        </div>

        {/* Scorecard items */}
        <div className="space-y-2">
          {score.items.map((item) => (
            <div key={item.key} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                <span>{item.label}</span>
                <Badge variant="outline" className="text-xs">{item.points}/{item.max}</Badge>
              </div>
              <div className="h-1.5 mt-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground/70 rounded-full" style={{ width: `${(item.points / item.max) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{item.hint}</p>
            </div>
          ))}
        </div>

        {/* Listing inputs */}
        <div className="space-y-2">
          <div className="font-semibold text-sm">Your planned listing</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="ls-title" className="text-xs">Listing title</Label>
              <Input id="ls-title" placeholder='e.g. "Willow Raglan Sweater in Fingering"'
                value={stored.title}
                onChange={(e) => patch('title', e.target.value)} />
            </div>
            <NumField id="ls-sizes" label="Advertised sizes" value={stored.sizeCount}
              onChange={(n) => patch('sizeCount', n)} max={20} />
            <NumField id="ls-photos" label="Photos ready" value={stored.photoCount}
              onChange={(n) => patch('photoCount', n)} max={12} />
            <NumField id="ls-price" label="Listing price" value={stored.listPrice}
              onChange={(n) => patch('listPrice', n)} suffix="$" />
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="ls-tags" className="text-xs">Tag draft (comma-separated, max 13)</Label>
              <Input id="ls-tags" placeholder="raglan, pullover, easy, cozy, gift, winter"
                value={stored.tagDraft}
                onChange={(e) => {
                  const tags = e.target.value.split(',')
                    .map((t) => t.trim())
                    .filter((t) => t.length > 0)
                    .slice(0, 13);
                  setStored((s) => {
                    const next = { ...s, tagDraft: e.target.value, tags };
                    handle.write(next);
                    return next;
                  });
                }} />
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 col-span-2 md:col-span-1">
              <label className="flex items-center gap-2 text-xs" htmlFor="ls-written">
                <Switch id="ls-written" checked={stored.writtenAndCharted}
                  onCheckedChange={(c) => patch('writtenAndCharted', c)} />
                Written + charts
              </label>
              <label className="flex items-center gap-2 text-xs" htmlFor="ls-inclusive">
                <Switch id="ls-inclusive" checked={stored.sizeInclusive}
                  onCheckedChange={(c) => patch('sizeInclusive', c)} />
                Size-inclusive
              </label>
              <label className="flex items-center gap-2 text-xs" htmlFor="ls-teaser">
                <Switch id="ls-teaser" checked={stored.teaserReady}
                  onCheckedChange={(c) => patch('teaserReady', c)} />
                Teaser ready
              </label>
              <label className="flex items-center gap-2 text-xs" htmlFor="ls-email">
                <Switch id="ls-email" checked={stored.emailListReady}
                  onCheckedChange={(c) => patch('emailListReady', c)} />
                Email list
              </label>
            </div>
          </div>
        </div>

        {/* Net per sale */}
        <div className="space-y-2">
          <div className="font-semibold text-sm flex flex-wrap items-center gap-2">
            <TrendingUp className="h-4 w-4 shrink-0" /> Net per sale by channel
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {nets.map((n) => (
              <div key={n.channel} className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">{n.channel}</div>
                <div className="text-lg font-semibold">{fmt$(n.net)}</div>
                <p className="text-xs text-muted-foreground mt-1">{n.feeNote}</p>
              </div>
            ))}
          </div>
          {stored.listPrice > 0 && (
            <p className="text-xs text-muted-foreground">
              $6 example (documented): Ravelry ≈ $5.70 → Etsy ≈ $5.10 → LoveCrafts ≈ $4.20.
              Ravelry keeps the most per sale — worth the discovery effort.
            </p>
          )}
        </div>

        {/* Paste-ready listing kit */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-semibold text-sm">Paste-ready listing kit</div>
            <Button variant="outline" size="sm" className="h-7 text-xs"
              onClick={() => copy(kitText, 'kit')}>
              {copied === 'kit' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === 'kit' ? 'Copied' : 'Copy kit'}
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground mb-1">Title</div>
              <div className="font-medium">{kit.title}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground mb-1">Tags ({kit.tags.split(',').length}/13)</div>
              <div>{kit.tags}</div>
            </div>
            <Textarea value={kit.description} readOnly rows={8}
              className="text-xs font-mono" />
          </div>
        </div>

        {/* Momentum targets */}
        <div className="space-y-2">
          <div className="font-semibold text-sm flex flex-wrap items-center gap-2">
            <TrendingUp className="h-4 w-4 shrink-0" /> First-week momentum targets
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">{momentum.queues}</div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">{momentum.favourites}</div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">{momentum.projects}</div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">Sweet spot: $5–6 paid</div>
          </div>
          <p className="text-xs text-muted-foreground">
            HRN ("recently popular") responds to queues and favourites, new-release
            announcements, and KAL launches — these are the targets that push a fresh
            listing onto the surface.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
