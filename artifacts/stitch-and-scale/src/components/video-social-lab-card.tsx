/**
 * CHK-054 — Video & Social ROI Lab card (52nd workspace tab).
 *
 * Prices a designer's organic video & social effort across five channels with documented
 * decay curves, funnel math, hourly reach dollars, and VS-01..VS-07 quality flags.
 * Session-54 research — sources in lib/video-social-lab.ts header.
 */
import { useMemo, useState, useEffect } from 'react';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { useSettings } from '@/context/SettingsContext';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { VIDEO_SOCIAL_COPY } from '@/lib/video-social-copy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Video, Flag, Lightbulb, TrendingUp, Users } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  PLATFORM_LABELS,
  PLATFORM_DESCRIPTIONS,
  analyzeVideoSocial,
  type VideoLabInput,
  type VideoLabResult,
} from '@/lib/video-social-lab';

const STORAGE_KEY = 'stitch-and-scale-videosocial-v1';

interface StoredVideoLab {
  input: VideoLabInput;
}

const VS_INPUT_DEFAULTS: VideoLabInput = {
  followersByPlatform: { instagram: 3200, tiktok: 800, pinterest: 500, youtube: 200, email: 450 },
  postsPerMonth: 10,
  minutesPerPost: 45,
  videoLengthSec: 26,
  hookStrong: true,
  videoUnderSixtySec: true,
  hasCallToAction: true,
  linkDestination: 'pattern_page',
  monthlyPatternSales: 25,
  patternPrice: 8,
  platformFeePct: 0.15,
  listSize: 450,
  listGrowthPerMonth: 60,
  emailSalesPerMonth: 8,
  patternPriceEmail: 7.8,
};

function defaultStored(): StoredVideoLab {
  return { input: { ...VS_INPUT_DEFAULTS, followersByPlatform: { ...VS_INPUT_DEFAULTS.followersByPlatform } } };
}

function loadStored(handle: ProjectStorageHandle<StoredVideoLab>): StoredVideoLab {
  try {
    const raw = handle.read();
    if (raw) {
      const parsed = raw as StoredVideoLab;
      if (parsed && parsed.input && typeof parsed.input.postsPerMonth === 'number') {
        return {
          ...defaultStored(),
          ...parsed,
          input: { ...defaultStored().input, ...parsed.input, followersByPlatform: { ...defaultStored().input.followersByPlatform, ...parsed.input.followersByPlatform } },
        };
      }
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return defaultStored();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

function NumField({ id, label, value, onChange, min = 0, max, step = 1, suffix, hint }: {
  id: string; label: string; value: number;
  onChange: (n: number) => void; min?: number; max?: number; step?: number; suffix?: string; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="relative">
        <Input id={id} type="number" min={min} {...(max !== undefined ? { max } : {})} step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) >= 0 ? Number(e.target.value) : 0)}
          className={suffix ? 'pr-8' : undefined} />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ChannelRow({ platform, score, isBest }: {
  platform: string;
  score: VideoLabResult['platforms'][number];
  isBest: boolean;
}) {
  return (
    <div className={`border rounded-lg p-3 space-y-1.5 ${isBest ? 'ring-1 ring-emerald-500/50 bg-emerald-500/5' : 'border-slate-300/60'}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-medium text-sm">{platform}</span>
        {isBest && <Badge variant="outline" className="text-xs border-emerald-500/40 bg-emerald-500/15 text-emerald-700">Best channel</Badge>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Monthly views: <span className="text-foreground font-medium">{Math.round(score.monthlyViews).toLocaleString()}</span></span>
        <span>Clicks: <span className="text-foreground font-medium">{Math.round(score.monthlyClicks).toLocaleString()}</span></span>
        <span>Sales: <span className="text-foreground font-medium">{score.attributableSales.toFixed(1)}/mo</span></span>
        <span>Net: <span className="text-foreground font-medium">{fmt$(score.attributableNet)}/mo</span></span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Time: <span className="text-foreground font-medium">{score.monthlyHours.toFixed(1)} hrs/mo</span></span>
        <span>Net per hour: <span className={`font-semibold ${score.netPerHour > 0 ? 'text-emerald-700' : 'text-muted-foreground'}`}>{fmt$(score.netPerHour)}/hr</span></span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{score.decayNote}</p>
    </div>
  );
}

export function VideoSocialLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredVideoLab>('videosocial', project.id, [STORAGE_KEY]), [project.id]);
  const { toast } = useToast();
  const [stored, setStored] = useState<StoredVideoLab>(() => loadStored(handle));
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const copyText = VIDEO_SOCIAL_COPY[language];
  useEffect(() => {
    handle.write(stored);
  }, [stored]);

  const patchInput = (patch: Partial<VideoLabInput>) =>
    setStored((s) => ({ input: { ...s.input, ...patch } }));
  const patchFollowers = (platform: keyof VideoLabInput['followersByPlatform'], n: number) =>
    setStored((s) => ({ input: { ...s.input, followersByPlatform: { ...s.input.followersByPlatform, [platform]: n } } }));

  const result = useMemo(() => analyzeVideoSocial(stored.input), [stored.input]);
  const i = stored.input;
  // Best channel = highest net/hour among channels actually earning something.
  const topNetPerHour = useMemo(
    () => Math.max(0, ...result.platforms.filter((p) => p.netPerHour > 0).map((p) => p.netPerHour)),
    [result.platforms],
  );

  const setBool = (key: keyof VideoLabInput) => (v: boolean) => patchInput({ [key]: v });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="w-4 h-4" />
          Video &amp; Social ROI Lab
        </CardTitle>
        <CardDescription>
          What your reels, pins, and list are actually earning per hour — funnel math with
          documented decay curves. Session-54 research.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Audience by channel
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(PLATFORM_LABELS) as (keyof typeof PLATFORM_LABELS)[]).map((p) => (
              <NumField key={p} id={`vs-${p}`} label={PLATFORM_LABELS[p]} value={i.followersByPlatform[p]}
                onChange={(n) => patchFollowers(p, n)} min={0} step={50}
                hint={PLATFORM_DESCRIPTIONS[p].split(';')[0]} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumField id="vs-posts" label={ls.postsPerMonthAllPlatforms} value={i.postsPerMonth}
            onChange={(n) => patchInput({ postsPerMonth: n })} min={0} max={60} hint={copyText.k34WeekPerPlatform} />
          <NumField id="vs-min" label={ls.minutesPerPost} value={i.minutesPerPost}
            onChange={(n) => patchInput({ minutesPerPost: n })} min={0} max={300} step={5}
            hint={copyText.filmingEditingBatchedOr} />
          <NumField id="vs-len" label={ls.videoLength} value={i.videoLengthSec}
            onChange={(n) => patchInput({ videoLengthSec: n })} min={5} max={180} step={5} suffix="sec"
            hint={copyText.k26sIsIgS} />
          <NumField id="vs-price" label={ls.patternPriceVideo} value={i.patternPrice}
            onChange={(n) => patchInput({ patternPrice: n })} min={0} max={100} step={0.5} suffix="$" />
          <NumField id="vs-fee" label={ls.platformFee} value={Math.round(i.platformFeePct * 100)}
            onChange={(n) => patchInput({ platformFeePct: n / 100 })} min={0} max={50} suffix="%"
            hint={copyText.k15PctTypicalEtsyListing} />
          <NumField id="vs-sales" label={ls.monthlyPatternSales} value={i.monthlyPatternSales}
            onChange={(n) => patchInput({ monthlyPatternSales: n })} min={0} step={1} />
          <NumField id="vs-listsize" label={ls.emailListSize} value={i.listSize}
            onChange={(n) => patchInput({ listSize: n })} min={0} step={25} />
          <NumField id="vs-emailsales" label={ls.emailSalesPerMonth} value={i.emailSalesPerMonth}
            onChange={(n) => patchInput({ emailSalesPerMonth: n })} min={0} step={1}
            hint={copyText.dmEmailAdjacentAudiencesBuy} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5 flex items-center gap-3">
            <Switch id="vs-under60" checked={i.videoUnderSixtySec} onCheckedChange={setBool('videoUnderSixtySec')} />
            <Label htmlFor="vs-under60" className="text-xs">Under 60 seconds</Label>
          </div>
          <div className="space-y-1.5 flex items-center gap-3">
            <Switch id="vs-hook" checked={i.hookStrong} onCheckedChange={setBool('hookStrong')} />
            <Label htmlFor="vs-hook" className="text-xs">Message in first 3 seconds (+13% breakthrough)</Label>
          </div>
          <div className="space-y-1.5 flex items-center gap-3">
            <Switch id="vs-cta" checked={i.hasCallToAction} onCheckedChange={setBool('hasCallToAction')} />
            <Label htmlFor="vs-cta" className="text-xs">Call to action in every post</Label>
          </div>
        </div>

        <div className="space-y-1.5 max-w-xs">
          <Label className="text-xs">Where every post links to</Label>
          <Select value={i.linkDestination} onValueChange={(v) => patchInput({ linkDestination: v as VideoLabInput['linkDestination'] })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pattern_page">Pattern page (direct sales)</SelectItem>
              <SelectItem value="list_building">List-building link (compounds)</SelectItem>
              <SelectItem value="none">Nowhere (vanity posting)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> What each channel earns (per month, attributable)
          </p>
          {result.platforms.map((score) => (
            <ChannelRow key={score.platform} platform={PLATFORM_LABELS[score.platform]} score={score}
              isBest={topNetPerHour > 0 && Math.abs(score.netPerHour - topNetPerHour) < 0.001} />
          ))}
        </div>

        <div className="border rounded-lg p-3 space-y-1 bg-primary/5 border-primary/20">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm">
            <span>Total content hours: <b>{result.totalHours.toFixed(1)} hrs/mo</b></span>
            <span>Attributable net: <b>{fmt$(result.totalAttributableNet)}/mo</b></span>
            <span>Net per content hour: <b className="text-emerald-700">{fmt$(result.netPerHour)}/hr</b></span>
          </div>
        </div>

        {result.flags.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" /> Watch-outs
            </p>
            <ul className="space-y-1">
              {result.flags.map((f) => (
                <li key={f.id} className="flex items-start gap-1.5 text-xs text-amber-700 leading-relaxed">
                  <Flag className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span><b>{f.id}</b> — {f.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border rounded-lg p-3 space-y-1 bg-slate-50 dark:bg-slate-900/40">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Verdict
          </p>
          <p className="text-sm leading-relaxed">{result.verdict}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{result.suggestion}</p>
        </div>
      </CardContent>
    </Card>
  );
}
