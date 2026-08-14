/**
 * CHK-053 — Pattern Photo ROI Lab card (51st workspace tab).
 *
 * DIY-vs-pro photography economics for pattern shoots: cost per pattern across three
 * shoot styles, break-even copies at the designer's price, and thumbnail-lift revenue.
 * Session-53 research — sources in lib/photo-roi-lab.ts header.
 */
import { useMemo, useState, useEffect } from 'react';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Camera, Banknote, Clock, Flag, Lightbulb, TrendingUp } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  PHOTO_STYLE_LABELS,
  analyzePhotoRoi,
  type PhotoRoiInput,
  type PhotoStyle,
} from '@/lib/photo-roi-lab';

const STORAGE_KEY = 'stitch-and-scale-photolab-v1';

interface StoredPhotoLab {
  input: PhotoRoiInput;
}

const PHOTO_INPUT_DEFAULTS: PhotoRoiInput = {
  patterns: 1,
  imagesPerPattern: 5,
  hourlyRate: 25,
  diyHoursPerPattern: 2.5,
  gearValue: 1800,
  gearLibrarySize: 50,
  modelHourlyRate: 35,
  modelHoursPerPattern: 1,
  photoStyle: 'catalog',
  proPerImageRate: 25,
  proHalfDayRate: 400,
  patternsPerHalfDay: 4,
  proExtrasPerImage: 0,
  patternPrice: 8,
  platformFeePct: 0.15,
  thumbCtrLift: 0.15,
  monthlySales: 25,
  liftMonths: 12,
};

function defaultStored(): StoredPhotoLab {
  return { input: { ...PHOTO_INPUT_DEFAULTS } };
}

function loadStored(handle: ProjectStorageHandle<StoredPhotoLab>): StoredPhotoLab {
  try {
    const raw = handle.read();
    if (raw) {
      const parsed = raw as StoredPhotoLab;
      if (parsed && parsed.input && typeof parsed.input.patterns === 'number') {
        return {
          ...defaultStored(),
          ...parsed,
          input: { ...defaultStored().input, ...parsed.input },
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

const OPTION_META: Record<string, { icon: 'camera' | 'cash' | 'clock'; tone: string }> = {
  diy: { icon: 'camera', tone: 'border-slate-300/60' },
  proCatalog: { icon: 'cash', tone: 'border-blue-400/40' },
  proLifestyle: { icon: 'clock', tone: 'border-violet-400/40' },
};

function OptionRow({
  opt,
  isBest,
}: {
  opt: ReturnType<typeof analyzePhotoRoi>['options'][number];
  isBest: boolean;
}) {
  const meta = OPTION_META[opt.id];
  return (
    <div className={`border rounded-lg p-3 space-y-1.5 ${meta.tone} ${isBest ? 'ring-1 ring-emerald-500/50' : ''}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-medium text-sm">{opt.label}</span>
        {isBest && <Badge variant="outline" className="text-xs border-emerald-500/40 bg-emerald-500/15 text-emerald-700">Best for this pattern</Badge>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Total cost: <span className="text-foreground font-medium">{fmt$(opt.totalCost)}</span></span>
        <span>Cash / time: <span className="text-foreground font-medium">{fmt$(opt.cashCost)} / {fmt$(opt.timeCost)}</span></span>
        <span>Per pattern: <span className="text-foreground font-medium">{fmt$(opt.perPattern)}</span></span>
        <span>Break-even: <span className="text-foreground font-medium">{opt.breakEvenUnits} copies</span></span>
      </div>
      {opt.redFlags.length > 0 && (
        <ul className="space-y-0.5">
          {opt.redFlags.map((f) => (
            <li key={f.id} className="flex items-start gap-1.5 text-xs text-amber-700 leading-relaxed">
              <Flag className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span><b>{f.id}</b> — {f.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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

export function PhotoRoiLabCard({ project }: { project: PatternProject }) {
  const handle = useMemo(() => projectStorage<StoredPhotoLab>('photolab', project.id, [STORAGE_KEY]), [project.id]);
  const { toast } = useToast();
  const [stored, setStored] = useState<StoredPhotoLab>(() => loadStored(handle));
  useEffect(() => {
    handle.write(stored);
  }, [stored]);

  const patchInput = (patch: Partial<PhotoRoiInput>) =>
    setStored((s) => ({ input: { ...s.input, ...patch } }));

  const result = useMemo(() => analyzePhotoRoi(stored.input), [stored.input]);
  const i = stored.input;

  const copyStyle = (style: PhotoStyle) => {
    patchInput({ photoStyle: style });
    toast({ title: 'Shoot style noted', description: `${PHOTO_STYLE_LABELS[style]} — both styles are still compared side by side.` });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="w-4 h-4" />
          Pattern Photo ROI Lab
        </CardTitle>
        <CardDescription>
          DIY vs pro photography, priced honestly — break-even copies, batch economics, and what a
          stronger first photo is worth. Session-53 research.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumField id="ph-patterns" label="Patterns in this shoot" value={i.patterns}
            onChange={(n) => patchInput({ patterns: n })} min={1} />
          <NumField id="ph-images" label="Images per pattern" value={i.imagesPerPattern}
            onChange={(n) => patchInput({ imagesPerPattern: n })} min={1} max={12}
            hint="Tiered per-image pricing rewards 5–6 strong shots over 10+." />
          <NumField id="ph-rate" label="Your hourly rate" value={i.hourlyRate}
            onChange={(n) => patchInput({ hourlyRate: n })} suffix="$/hr" />
          <NumField id="ph-diyhours" label="DIY hours per pattern" value={i.diyHoursPerPattern}
            onChange={(n) => patchInput({ diyHoursPerPattern: n })} step={0.5}
            hint="WKW average: ~2.5h (1–2h shoot + 1.5h editing) per pattern." />
          <NumField id="ph-gear" label="Gear stack value" value={i.gearValue}
            onChange={(n) => patchInput({ gearValue: n })} step={100} suffix="$"
            hint="WKW: camera alone £1,500+ — amortized over your library." />
          <NumField id="ph-library" label="Library size to amortize" value={i.gearLibrarySize}
            onChange={(n) => patchInput({ gearLibrarySize: n })} min={1} />
          <NumField id="ph-modelrate" label="Model pay" value={i.modelHourlyRate}
            onChange={(n) => patchInput({ modelHourlyRate: n })} suffix="$/hr"
            hint="0 = modeling your own designs or a friend." />
          <NumField id="ph-modelhours" label="Model hours per pattern" value={i.modelHoursPerPattern}
            onChange={(n) => patchInput({ modelHoursPerPattern: n })} step={0.5} />
        </div>
        <div className="border-t pt-3">
          <p className="text-xs font-medium mb-2">Pro shoot rates</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField id="ph-perimage" label="Per-image rate (catalog)" value={i.proPerImageRate}
              onChange={(n) => patchInput({ proPerImageRate: n })} suffix="$"
              hint="Amateur $25–100/hr; experienced $200–500/hr; per-image is most common." />
            <NumField id="ph-halfday" label="Half-day rate (lifestyle)" value={i.proHalfDayRate}
              onChange={(n) => patchInput({ proHalfDayRate: n })} suffix="$"
              hint="Half-day batches beat day rates ($5–10k/day) for most indie designers." />
            <NumField id="ph-batch" label="Patterns per half-day" value={i.patternsPerHalfDay}
              onChange={(n) => patchInput({ patternsPerHalfDay: n })} min={1} max={12} />
            <NumField id="ph-extras" label="Extras per image (props/retouch)" value={i.proExtrasPerImage}
              onChange={(n) => patchInput({ proExtrasPerImage: n })} suffix="$"
              hint="Hands in frame, props, and advanced retouch add ~2× per image." />
          </div>
        </div>
        <div className="border-t pt-3">
          <p className="text-xs font-medium mb-2">Selling economics</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField id="ph-price" label="Pattern price" value={i.patternPrice}
              onChange={(n) => patchInput({ patternPrice: n })} step={0.5} suffix="$" />
            <NumField id="ph-fee" label="Platform fee" value={Math.round(i.platformFeePct * 100)}
              onChange={(n) => patchInput({ platformFeePct: n / 100 })} step={1} max={50} suffix="%" />
            <NumField id="ph-sales" label="Current monthly sales" value={i.monthlySales}
              onChange={(n) => patchInput({ monthlySales: n })} />
            <NumField id="ph-lift" label="Thumbnail CTR lift" value={Math.round(i.thumbCtrLift * 100)}
              onChange={(n) => patchInput({ thumbCtrLift: n / 100 })} step={1} max={50} suffix="%"
              hint="First photo is the Ravelry search thumbnail; Etsy's top earners name photography their #1 driver." />
            <NumField id="ph-runway" label="Lift runway" value={i.liftMonths}
              onChange={(n) => patchInput({ liftMonths: n })} min={1} suffix="mo" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(PHOTO_STYLE_LABELS) as PhotoStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => copyStyle(style)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  i.photoStyle === style
                    ? 'bg-accent border-accent-foreground/30 font-medium'
                    : 'bg-background hover:bg-accent/40'
                }`}
              >
                {PHOTO_STYLE_LABELS[style]}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-medium">Shoot options — sorted by total cost per pattern</p>
          {result.options.sort((a, b) => a.totalCost - b.totalCost).map((opt) => (
            <OptionRow key={opt.id} opt={opt} isBest={opt.id === result.best} />
          ))}
        </div>

        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Thumbnail-lift economics ({i.liftMonths}mo runway)
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Extra sales/mo: <span className="text-foreground font-medium">{result.extraSalesPerMonth.toFixed(2)}</span></span>
            <span>Extra net revenue: <span className="text-foreground font-medium">{fmt$(result.liftRevenue)}</span></span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed flex gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
            <span>{result.suggestion}</span>
          </p>
        </div>

        <div className={`border rounded-lg px-3 py-2.5 text-xs leading-relaxed flex gap-2 items-start ${
          result.best === 'diy'
            ? 'bg-slate-500/10 border-slate-400/30'
            : result.best === 'proLifestyle'
              ? 'bg-violet-500/10 border-violet-400/30'
              : 'bg-blue-500/10 border-blue-400/30'
        }`}>
          <Banknote className="w-4 h-4 mt-0.5 shrink-0" />
          <Clock className="w-4 h-4 mt-0.5 shrink-0 hidden" />
          <span>{result.verdict}</span>
        </div>
      </CardContent>
    </Card>
  );
}
