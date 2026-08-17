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
import { useSettings } from '@/context/SettingsContext';
import { PHOTO_ROI_COPY, type PhotoRoiCopy } from '@/lib/photo-roi-copy';
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

function OptionRow({ opt, isBest, copy }: {
  opt: ReturnType<typeof analyzePhotoRoi>['options'][number];
  isBest: boolean;
  copy: PhotoRoiCopy;
}) {
  const meta = OPTION_META[opt.id];
  return (
    <div className={`border rounded-lg p-3 space-y-1.5 ${meta.tone} ${isBest ? 'ring-1 ring-emerald-500/50' : ''}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-medium text-sm">{opt.label}</span>
        {isBest && <Badge variant="outline" className="text-xs border-emerald-500/40 bg-emerald-500/15 text-emerald-700">{copy.best}</Badge>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{copy.totalCost}: <span className="text-foreground font-medium">{fmt$(opt.totalCost)}</span></span>
        <span>{copy.cashTime}: <span className="text-foreground font-medium">{fmt$(opt.cashCost)} / {fmt$(opt.timeCost)}</span></span>
        <span>{copy.perPattern}: <span className="text-foreground font-medium">{fmt$(opt.perPattern)}</span></span>
        <span>{copy.breakEven}: <span className="text-foreground font-medium">{opt.breakEvenUnits} {copy.copies}</span></span>
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
  const { language } = useSettings();
  const copy = PHOTO_ROI_COPY[language];
  const handle = useMemo(() => projectStorage<StoredPhotoLab>('photolab', project.id, [STORAGE_KEY]), [project.id]);
  const { toast } = useToast();
  const [stored, setStored] = useState<StoredPhotoLab>(() => loadStored(handle));
  useEffect(() => {
    handle.write(stored);
  }, [stored]);

  const patchInput = (patch: Partial<PhotoRoiInput>) =>
    setStored((s) => ({ input: { ...s.input, ...patch } }));

  const result = useMemo(() => analyzePhotoRoi(stored.input, language), [stored.input, language]);
  const i = stored.input;

  const copyStyle = (style: PhotoStyle) => {
    patchInput({ photoStyle: style });
    toast({ title: copy.style[style], description: copy.selling });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="w-4 h-4" />
          {copy.title}
        </CardTitle>
        <CardDescription>
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumField id="ph-patterns" label={copy.patterns} value={i.patterns}
            onChange={(n) => patchInput({ patterns: n })} min={1} />
          <NumField id="ph-images" label={copy.images} value={i.imagesPerPattern}
            onChange={(n) => patchInput({ imagesPerPattern: n })} min={1} max={12}
            hint={copy.hints.images} />
          <NumField id="ph-rate" label={copy.hourlyRate} value={i.hourlyRate}
            onChange={(n) => patchInput({ hourlyRate: n })} suffix="$/hr" />
          <NumField id="ph-diyhours" label={copy.diyHours} value={i.diyHoursPerPattern}
            onChange={(n) => patchInput({ diyHoursPerPattern: n })} step={0.5}
            hint={copy.hints.diy} />
          <NumField id="ph-gear" label={copy.gear} value={i.gearValue}
            onChange={(n) => patchInput({ gearValue: n })} step={100} suffix="$"
            hint={copy.hints.gear} />
          <NumField id="ph-library" label={copy.library} value={i.gearLibrarySize}
            onChange={(n) => patchInput({ gearLibrarySize: n })} min={1} />
          <NumField id="ph-modelrate" label={copy.modelPay} value={i.modelHourlyRate}
            onChange={(n) => patchInput({ modelHourlyRate: n })} suffix="$/hr"
            hint={copy.hints.model} />
          <NumField id="ph-modelhours" label={copy.modelHours} value={i.modelHoursPerPattern}
            onChange={(n) => patchInput({ modelHoursPerPattern: n })} step={0.5} />
        </div>
        <div className="border-t pt-3">
          <p className="text-xs font-medium mb-2">{copy.proRates}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField id="ph-perimage" label={copy.perImage} value={i.proPerImageRate}
              onChange={(n) => patchInput({ proPerImageRate: n })} suffix="$"
              hint={copy.hints.perImage} />
            <NumField id="ph-halfday" label={copy.halfDay} value={i.proHalfDayRate}
              onChange={(n) => patchInput({ proHalfDayRate: n })} suffix="$"
              hint={copy.hints.halfDay} />
            <NumField id="ph-batch" label={copy.batch} value={i.patternsPerHalfDay}
              onChange={(n) => patchInput({ patternsPerHalfDay: n })} min={1} max={12} />
            <NumField id="ph-extras" label={copy.extras} value={i.proExtrasPerImage}
              onChange={(n) => patchInput({ proExtrasPerImage: n })} suffix="$"
              hint={copy.hints.extras} />
          </div>
        </div>
        <div className="border-t pt-3">
          <p className="text-xs font-medium mb-2">{copy.selling}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField id="ph-price" label={copy.price} value={i.patternPrice}
              onChange={(n) => patchInput({ patternPrice: n })} step={0.5} suffix="$" />
            <NumField id="ph-fee" label={copy.fee} value={Math.round(i.platformFeePct * 100)}
              onChange={(n) => patchInput({ platformFeePct: n / 100 })} step={1} max={50} suffix="%" />
            <NumField id="ph-sales" label={copy.sales} value={i.monthlySales}
              onChange={(n) => patchInput({ monthlySales: n })} />
            <NumField id="ph-lift" label={copy.lift} value={Math.round(i.thumbCtrLift * 100)}
              onChange={(n) => patchInput({ thumbCtrLift: n / 100 })} step={1} max={50} suffix="%"
              hint={copy.hints.lift} />
            <NumField id="ph-runway" label={copy.runway} value={i.liftMonths}
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
                {copy.style[style]}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-medium">{copy.shootOptions}</p>
          {result.options.sort((a, b) => a.totalCost - b.totalCost).map((opt) => (
            <OptionRow key={opt.id} opt={opt} isBest={opt.id === result.best} copy={copy} />
          ))}
        </div>

        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            {copy.thumbnail(i.liftMonths)}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{copy.extraSales}: <span className="text-foreground font-medium">{result.extraSalesPerMonth.toFixed(2)}</span></span>
            <span>{copy.extraRevenue}: <span className="text-foreground font-medium">{fmt$(result.liftRevenue)}</span></span>
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
