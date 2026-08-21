import type { LanguageCode } from '@/lib/i18n';
/**
 * CHK-051 — Sample & Launch Window Lab card (49th workspace tab).
 *
 * Prices the two revenue assets nobody else prices: the physical sample garment
 * (yarn + knit hours recovered through a sample sale across four channels) and
 * the launch-week burst (a timed launch catches Ravelry Hot Right Now; the week
 * carries most of month-1 sales before demand tails off).
 * Session-51 research — sources in lib/sample-launch-lab.ts header.
 */
import { useMemo, useState, useEffect } from 'react';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { useSettings } from '@/context/SettingsContext';
import { projectStorage, type ProjectStorageHandle } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingDown, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  SAMPLE_LAB_DEFAULTS,
  analyzeSampleLab,
  type SampleLabInput,
  type SampleSaleChannel,
} from '@/lib/sample-launch-lab';

const STORAGE_KEY = 'stitch-and-scale-samplelaunch-v1';

interface StoredSampleLaunch {
  input: SampleLabInput;
  garmentSeason: 'fall' | 'winter' | 'spring' | 'summer';
  launchMonth: number;
}

function defaultStored(): StoredSampleLaunch {
  return { input: { ...SAMPLE_LAB_DEFAULTS }, garmentSeason: 'fall', launchMonth: 7 };
}

function loadStored(handle: ProjectStorageHandle<StoredSampleLaunch>): StoredSampleLaunch {
  try {
    const raw = handle.read();
    if (raw) {
      const parsed = raw as StoredSampleLaunch;
      if (parsed && parsed.input && typeof parsed.input.knitHours === 'number') {
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

const MONTH_LABELS_LOCAL: Record<LanguageCode, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
};
const SEASON_LOCAL: Record<LanguageCode, Record<string, string>> = {
  en: { fall: 'fall', winter: 'winter', spring: 'spring', summer: 'summer' },
  de: { fall: 'Herbst', winter: 'Winter', spring: 'Frühling', summer: 'Sommer' },
  fr: { fall: 'automne', winter: 'hiver', spring: 'printemps', summer: 'été' },
  es: { fall: 'otoño', winter: 'invierno', spring: 'primavera', summer: 'verano' },
  pt: { fall: 'outono', winter: 'inverno', spring: 'primavera', summer: 'verão' },
};
const CHANNEL_KEY: Record<string, keyof LabStatCopy> = {
  etsy: 'channelEtsy', flash_online: 'channelFlash', boutique: 'channelBoutique', craftfair: 'channelCraftFair',
};
const ROW_NOTE_LOCAL: Record<string, string> = {
  'Etsy transaction + listing fees apply to physical knitwear too; the sample is one listing.': '__NOTE_ETSY__',
  'Westknits-style flash drops: ~10% platform cut; demand concentrates into the drop window, samples clear fast at a discount.': '__NOTE_FLASH__',
  'Boutique consignment typically takes 40% (30–50% band) — no unsold risk and no selling effort, but the deepest cut.': '__NOTE_CONSIGN__',
};
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SEASON_OPTIONS = (language: LanguageCode): Array<{ value: StoredSampleLaunch['garmentSeason']; label: string }> => ({
  en: [
    { value: 'fall', label: 'Fall knitwear (sweaters, cowls)' },
    { value: 'winter', label: 'Winter knitwear (heavy knits, gift season)' },
    { value: 'spring', label: 'Spring knitwear (lace, light yarns)' },
    { value: 'summer', label: 'Summer knitwear (cottons, tees)' },
  ],
  de: [
    { value: 'fall', label: 'Herbststrick (Pullover, Schlauchtücher)' },
    { value: 'winter', label: 'Winterstrick (schwere Strickwaren, Geschenksaison)' },
    { value: 'spring', label: 'Frühlingsstrick (Spitze, feine Garne)' },
    { value: 'summer', label: 'Sommerstrick (Baumwolle, T-Shirts)' },
  ],
  fr: [
    { value: 'fall', label: 'Tricot d’automne (pulls, tours de cou)' },
    { value: 'winter', label: 'Tricot d’hiver (mailles épaisses, cadeaux)' },
    { value: 'spring', label: 'Tricot de printemps (dentelle, fils légers)' },
    { value: 'summer', label: 'Tricot d’été (coton, t-shirts)' },
  ],
  es: [
    { value: 'fall', label: 'Tejido de otoño (suéteres, cuellos)' },
    { value: 'winter', label: 'Tejido de invierno (puntos gruesos, regalos)' },
    { value: 'spring', label: 'Tejido de primavera (encaje, hilos ligeros)' },
    { value: 'summer', label: 'Tejido de verano (algodón, camisetas)' },
  ],
  pt: [
    { value: 'fall', label: 'Tricô de outono (suéteres, golas)' },
    { value: 'winter', label: 'Tricô de inverno (malhas pesadas, presentes)' },
    { value: 'spring', label: 'Tricô de primavera (renda, fios leves)' },
    { value: 'summer', label: 'Tricô de verão (algodão, camisetas)' },
  ],
}[language]) as Array<{ value: StoredSampleLaunch['garmentSeason']; label: string }>;

function NumField({ id, label, value, onChange, min = 0, max, step = 1, suffix }: {
  id: string; label: string; value: number;
  onChange: (n: number) => void; min?: number; max?: number; step?: number; suffix?: string;
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
    </div>
  );
}

function rowNoteText(row: { note: string }, ls: LabStatCopy): string {
  const k = ROW_NOTE_LOCAL[row.note];
  if (k === '__NOTE_ETSY__') return ls.channelNoteEtsy;
  if (k === '__NOTE_FLASH__') return ls.channelNoteFlash;
  if (k === '__NOTE_CONSIGN__') return ls.channelNoteConsignment;
  const m = row.note.match(/^Booth cost \$([\d.]+)/);
  if (m) return ls.channelNoteFair.replace('{cost}', m[1]);
  return row.note;
}

function SampleRow({ row, isBest, ls }: { row: ReturnType<typeof analyzeSampleLab>['samples'][number]; isBest: boolean; ls: LabStatCopy }) {
  return (
    <div className={`rounded-lg border p-3 space-y-1.5 ${isBest ? 'border-emerald-500/40 bg-emerald-500/5' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{CHANNEL_KEY[row.channel] ? ls[CHANNEL_KEY[row.channel]] : row.label}</span>
        {isBest && (
          <Badge variant="outline" className="text-xs border border-emerald-500/30 bg-emerald-500/15 text-emerald-700">
            {ls.bestNetBadge}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Gross: <span className="text-foreground font-medium">{fmt$(row.gross)}</span></span>
        <span>Fees: <span className="text-foreground font-medium">{fmt$(row.fees)}</span></span>
        <span>Net: <span className="text-foreground font-medium">{fmt$(row.net)}</span></span>
        <span>
          vs {fmt$(row.costBasis)} basis: <span className={`font-medium ${row.recoveredVsCost >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
            {fmt$(row.recoveredVsCost)}
          </span>
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{rowNoteText(row, ls)}</p>
    </div>
  );
}

export function SampleLaunchLabCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const handle = useMemo(
    () => projectStorage<StoredSampleLaunch>(STORAGE_KEY, project.id || '', []),
    [project.id],
  );
  const [stored, setStored] = useState<StoredSampleLaunch>(() => loadStored(handle));
  useEffect(() => {
    handle.write(stored);
  }, [stored, handle]);

  const { input, garmentSeason, launchMonth } = stored;
  const setInput = (patch: Partial<SampleLabInput>) =>
    setStored((s) => ({ ...s, input: { ...s.input, ...patch } }));

  const result = useMemo(
    () => analyzeSampleLab(input, garmentSeason, launchMonth),
    [input, garmentSeason, launchMonth],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-4 w-4" /> {ls.sampleLaunchLabTitle}
        </CardTitle>
        <CardDescription>{ls.sampleAndLaunchLabDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sample economics */}
        <div className="space-y-3">
          <div className="text-sm font-medium">{ls.sampleCostRecoveryHeading}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField id="sl-knithours" label={ls.knitHoursSample} value={input.knitHours}
              onChange={(n) => setInput({ knitHours: n })} step={1} suffix="h" />
            <NumField id="sl-yarncost" label={ls.yarnAndMaterials} value={input.yarnCost}
              onChange={(n) => setInput({ yarnCost: n })} step={5} suffix="$" />
            <NumField id="sl-knithourly" label={ls.yourKnitHourlyRate} value={input.knitHourlyRate}
              onChange={(n) => setInput({ knitHourlyRate: n })} step={1} suffix="$" />
            <NumField id="sl-monthlysales" label={ls.expectedMonth1PatternSales} value={input.monthlySales}
              onChange={(n) => setInput({ monthlySales: Math.round(n) })} step={1} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NumField id="sl-ask" label={ls.customNewGarmentAskPrice} value={input.askPrice}
              onChange={(n) => setInput({ askPrice: n })} min={1} step={5} suffix="$" />
            <NumField id="sl-sample" label={ls.sampleSalePrice} value={input.samplePrice}
              onChange={(n) => setInput({ samplePrice: n })} min={1} step={5} suffix="$" />
            <NumField id="sl-booth" label={ls.boothCostFairs} value={input.boothCost}
              onChange={(n) => setInput({ boothCost: n })} step={5} suffix="$" />
            <NumField id="sl-days" label={ls.daysAfterReleaseForSale} value={input.daysAfterRelease}
              onChange={(n) => setInput({ daysAfterRelease: Math.round(n) })} step={1} suffix="d" />
          </div>
        </div>

        {/* Sample verdict banner */}
        <div className={`rounded-md border p-3 ${result.sampleVerdict.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' : 'border-amber-500/30 bg-amber-500/10 text-amber-700'}`}>
          <div className="flex items-start gap-2 text-sm">
            {result.sampleVerdict.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            <span>{result.sampleVerdict.ok && result.best ? ls.sampleVerdictRecovers     .replace("{channel}", CHANNEL_KEY[result.best.channel] ? ls[CHANNEL_KEY[result.best.channel]] : result.best.channel)     .replace("{net}", result.best.net.toFixed(2))     .replace("{basis}", result.best.costBasis.toFixed(2))     .replace("{pct}", String(Math.round((result.best.net / Math.max(1, result.best.costBasis)) * 100))) : !result.sampleVerdict.ok && result.best ? ls.sampleVerdictPartial     .replace("{net}", result.best.net.toFixed(2))     .replace("{basis}", result.best.costBasis.toFixed(2)) : ls.sampleNoChannels}</span>
          </div>
        </div>

        {/* Channel comparison */}
        <div className="space-y-2">
          <div className="text-sm font-medium">{ls.sampleSaleByChannelHeading}</div>
          {result.samples.map((row) => (
            <SampleRow key={row.channel} row={row} isBest={row === result.best} ls={ls} />
          ))}
          <p className="text-xs text-muted-foreground leading-relaxed">{ls.keepVsSellNote}</p>
        </div>

        {/* Launch window */}
        <div className="space-y-3">
          <div className="text-sm font-medium">{ls.launchWindowHeading}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sl-season" className="text-xs">{ls.garmentSeason}</Label>
              <select id="sl-season" value={garmentSeason}
                onChange={(e) => setStored((s) => ({ ...s, garmentSeason: e.target.value as StoredSampleLaunch['garmentSeason'] }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {SEASON_OPTIONS(language).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sl-launchmonth" className="text-xs">{ls.plannedReleaseMonth}</Label>
              <select id="sl-launchmonth" value={launchMonth}
                onChange={(e) => setStored((s) => ({ ...s, launchMonth: Number(e.target.value) }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {MONTH_LABELS_LOCAL[language].map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={`rounded-md border p-3 space-y-2 ${result.burst.seasonFactor >= 1 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4" /> {ls.launchBurstAtSeasonFactor.replace('{factor}', result.burst.seasonFactor.toFixed(2))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                {ls.weekOneSales}: <span className="text-foreground font-semibold">{result.burst.weekOneSales}</span>
                <span className="ml-1">({Math.round(result.burst.firstWeekMultiple * 100)} {ls.monthPctSuffix})</span>
              </span>
              <span>
                {ls.tailSales}: <span className="text-foreground font-semibold">{result.burst.tailSales}</span>
              </span>
              <span>
                {ls.weeklyValueAtPrice.replace('{price}', fmt$(input.samplePrice))}: <span className="text-foreground font-semibold">{fmt$(result.burst.weekOneSales * input.samplePrice)}</span>
              </span>
              <span className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> {ls.thenTheTailTakesOver}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{result.burst.note.startsWith("Launch month lands inside") ? ls.burstNoteOnPeak : ls.burstNoteOffPeak.replace("{season}", SEASON_LOCAL[language][garmentSeason] ?? garmentSeason)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
