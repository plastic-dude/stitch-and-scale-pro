/**
 * Protect — Copyright Protection Planner.
 *
 * The tab competitors skip: piracy protection for pattern designers is sold as
 * either photo-centric enforcement shops (Copytrack-style shops take ~50% of
 * enforcement fees) or brand monitors at $249+/mo — a long-tail designer who
 * earns under $50/yr (Ravelry census) cannot absorb either. This planner runs
 * the four real layers local-first: leak-exposure valuation, license-terms
 * strength audit, prevention stack, watch-word monitoring, evidence pack, and
 * a 5-step escalation ladder with the 10-business-day counter-notice deadline
 * that takedown filers always miss.
 *
 * Storage: project-scoped key `stitch-and-scale-protect-{projectId}` (storage
 * seam convention — no cross-project bleed).
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, ShieldAlert, ClipboardCopy, Lock, AlertTriangle, CalendarDays, Search } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { COPYRIGHT_COPY } from '@/lib/copyright-copy';
import {
  analyzeProtection,
  buildDmcaNotice,
  buildEvidenceChecklist,
  generateWatchWords,
  DEFAULT_PROTECT,
  DEFAULT_LICENSE_TERMS,
  DMCA_PLATFORM_LABELS,
  licenseStrengthLabel,
  type ProtectInput,
  type DmcaPlatform,
} from '@/lib/copyright-protection';

const STORAGE_KEY = (projectId: string) => `stitch-and-scale-protect-${projectId}`;

function loadStored(projectId: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function saveStored(projectId: string, patch: Record<string, unknown>) {
  try {
    const existing = loadStored(projectId) ?? {};
    localStorage.setItem(STORAGE_KEY(projectId), JSON.stringify({ ...existing, ...patch }));
  } catch {
    // storage is best-effort; the model still works in-session.
  }
}

function num(
  v: number,
  set: (n: number) => void,
  label: string,
  hint: string,
  min?: number,
  max?: number,
  step?: number
) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={step ?? 1}
        value={Number.isFinite(v) ? v : ''}
        onChange={e => set(Number(e.target.value) || 0)}
        aria-label={label}
      />
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function dateField(
  v: string,
  set: (s: string) => void,
  label: string,
  hint: string
) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type="date" value={v} onChange={e => set(e.target.value)} aria-label={label} />
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export function CopyrightProtectionCard({ project }: { project: PatternProject }) {
  const { toast } = useToast();
  const { language } = useSettings();
  const copy = COPYRIGHT_COPY[language];
  const stored = React.useMemo(() => loadStored(project.id), [project.id]);
  const [monthlyPatternCopies, setMonthlyPatternCopies] = React.useState<number>(
    stored?.monthlyPatternCopies ?? DEFAULT_PROTECT.monthlyPatternCopies
  );
  const [avgPrice, setAvgPrice] = React.useState<number>(stored?.avgPrice ?? DEFAULT_PROTECT.avgPrice);
  const [channelFeePct, setChannelFeePct] = React.useState<number>(stored?.channelFeePct ?? DEFAULT_PROTECT.channelFeePct);
  const [monthlyMarketingHours, setMonthlyMarketingHours] = React.useState<number>(
    stored?.monthlyMarketingHours ?? DEFAULT_PROTECT.monthlyMarketingHours
  );
  const [designRatePerHour, setDesignRatePerHour] = React.useState<number>(
    stored?.designRatePerHour ?? DEFAULT_PROTECT.designRatePerHour
  );
  const [watermarkEnabled, setWatermarkEnabled] = React.useState<boolean>(
    stored?.watermarkEnabled ?? DEFAULT_PROTECT.watermarkEnabled
  );
  const [uniqueDownloadLinks, setUniqueDownloadLinks] = React.useState<boolean>(
    stored?.uniqueDownloadLinks ?? DEFAULT_PROTECT.uniqueDownloadLinks
  );
  const [soldOnMultiplePlatforms, setSoldOnMultiplePlatforms] = React.useState<boolean>(
    stored?.soldOnMultiplePlatforms ?? DEFAULT_PROTECT.soldOnMultiplePlatforms
  );
  const [evidencePackReady, setEvidencePackReady] = React.useState<boolean>(
    stored?.evidencePackReady ?? DEFAULT_PROTECT.evidencePackReady
  );
  const [platformForDmca, setPlatformForDmca] = React.useState<DmcaPlatform>(
    (stored?.platformForDmca as DmcaPlatform) ?? DEFAULT_PROTECT.platformForDmca
  );
  const [infringerContactedPolitely, setInfringerContactedPolitely] = React.useState<boolean>(
    stored?.infringerContactedPolitely ?? DEFAULT_PROTECT.infringerContactedPolitely
  );
  const [counterNoticeDeadline, setCounterNoticeDeadline] = React.useState<string>(
    stored?.counterNoticeDeadline ?? DEFAULT_PROTECT.counterNoticeDeadline
  );
  const [leakDiscovered, setLeakDiscovered] = React.useState<string>(
    stored?.leakDiscovered ?? DEFAULT_PROTECT.leakDiscovered
  );
  const [licenseTerms, setLicenseTerms] = React.useState<typeof DEFAULT_LICENSE_TERMS>(
    stored?.licenseTerms ? { ...DEFAULT_LICENSE_TERMS, ...stored.licenseTerms } : { ...DEFAULT_LICENSE_TERMS }
  );
  const [patternName, setPatternName] = React.useState<string>(stored?.patternName ?? '');
  const [designerName, setDesignerName] = React.useState<string>(stored?.designerName ?? '');

  React.useEffect(() => {
    saveStored(project.id, {
      monthlyPatternCopies, avgPrice, channelFeePct, monthlyMarketingHours, designRatePerHour,
      watermarkEnabled, uniqueDownloadLinks, soldOnMultiplePlatforms, evidencePackReady,
      platformForDmca, infringerContactedPolitely, counterNoticeDeadline, leakDiscovered,
      licenseTerms, patternName, designerName,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    monthlyPatternCopies, avgPrice, channelFeePct, monthlyMarketingHours, designRatePerHour,
    watermarkEnabled, uniqueDownloadLinks, soldOnMultiplePlatforms, evidencePackReady,
    platformForDmca, infringerContactedPolitely, counterNoticeDeadline, leakDiscovered,
    licenseTerms, patternName, designerName,
  ]);

  const input: ProtectInput = React.useMemo(
    () => ({
      monthlyPatternCopies, avgPrice, channelFeePct, monthlyMarketingHours, designRatePerHour,
      licenseTerms, watermarkEnabled, uniqueDownloadLinks, soldOnMultiplePlatforms,
      evidencePackReady, platformForDmca, infringerContactedPolitely, counterNoticeDeadline,
      leakDiscovered,
    }),
    [monthlyPatternCopies, avgPrice, channelFeePct, monthlyMarketingHours, designRatePerHour,
      licenseTerms, watermarkEnabled, uniqueDownloadLinks, soldOnMultiplePlatforms,
      evidencePackReady, platformForDmca, infringerContactedPolitely, counterNoticeDeadline,
      leakDiscovered]
  );

  const result = React.useMemo(() => analyzeProtection(input), [input]);

  const fmt$ = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const toggleTerm = (k: keyof typeof DEFAULT_LICENSE_TERMS) =>
    setLicenseTerms(prev => ({ ...prev, [k]: !prev[k] }));

  const copyToClipboard = async (text: string, title: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title, description: copy.copied });
    } catch {
      toast({ title: copy.copyFailed, description: copy.manual });
    }
  };

  const watchWords = generateWords();
  const evidence = buildEvidenceChecklist(patternName.trim() || 'your pattern');

  function generateWords() {
    // Use the library generator when names exist; fall back to placeholder words
    if (patternName.trim()) {
      return [
        `"${patternName.trim()}" pattern free download`,
        `"${patternName.trim()}" pattern pdf`,
        `"${patternName.trim()}" knitting pattern free`,
        `"${patternName.trim()}" crochet pattern free`,
        ...(designerName.trim() ? [`"${designerName.trim()}" pattern free`, `"${designerName.trim()}" ${patternName.trim()}`] : []),
        `"${patternName.trim()}" site:pinterest.com`,
        `"${patternName.trim()}" filetype:pdf`,
      ];
    }
    return [
      `"${'pattern name'}" free download`,
      `"${'pattern name'}" pattern pdf`,
      `"${'pattern name'}" site:pinterest.com`,
      `"${'pattern name'}" filetype:pdf`,
    ];
  }

  const currentStep = result.escalation.currentStep;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="w-4 h-4" /> {copy.title}
        </CardTitle>
        <CardDescription>
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Verdict */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{copy.readiness}</p>
            <Badge className={'uppercase mt-1 ' + (result.verdict === 'protected' ? 'bg-accent text-accent-foreground' : result.verdict === 'patch' ? 'bg-amber-500 text-white' : 'bg-destructive text-destructive-foreground')}>
              {result.verdict}
            </Badge>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{copy.exposure}</p>
            <p className={'text-lg font-semibold ' + (result.exposure.expectedLostNetPerYear > 0 ? 'text-destructive' : 'text-accent')}>
              {fmt$(result.exposure.leakExposurePerYear)}
            </p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{copy.strength}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-lg font-semibold">{result.licenseAudit.score}</p>
              <Badge variant="secondary" className="uppercase">{licenseStrengthLabel(result.licenseAudit.score)}</Badge>
            </div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{copy.prevention}</p>
            <p className="text-lg font-semibold">{result.prevention.preventionScore}/100</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{result.verdictNote}</p>

        {/* Red flags */}
        {result.redFlags.length > 0 && (
          <div className="space-y-1.5">
            {result.redFlags.map((f, i) => (
              <div key={i} className={'flex items-start gap-2 text-xs rounded-md border p-2 ' + (f.severity === 'critical' ? 'border-destructive/40 bg-destructive/5' : 'border-amber-500/40 bg-amber-500/5')}>
                <AlertTriangle className={'w-3.5 h-3.5 mt-0.5 shrink-0 ' + (f.severity === 'critical' ? 'text-destructive' : 'text-amber-600')} />
                <span>
                  <span className="font-semibold">{f.code}</span> — {f.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Exposure inputs */}
        <div className="space-y-2">
          <p className="text-xs font-medium">{copy.exposureSection}</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {num(monthlyPatternCopies, setMonthlyPatternCopies, copy.copies, 'All channels, one pattern')}
            {num(avgPrice, setAvgPrice, copy.price, '$5–12 pattern band', 0, 200, 0.01)}
            {num(channelFeePct, setChannelFeePct, copy.platformFee, 'Etsy 6.5% + 3% ≈ 15% with card', 0, 1, 0.001)}
            {num(monthlyMarketingHours, setMonthlyMarketingHours, copy.marketingHours, 'Sunk cost — not counted')}
            {num(designRatePerHour, setDesignRatePerHour, copy.rate, 'What a takedown costs you', 5, 300, 1)}
          </div>
        </div>

        {/* Prevention stack */}
        <div className="space-y-2">
          <p className="text-xs font-medium flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> {copy.preventionStack}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {(
              [
                [watermarkEnabled, setWatermarkEnabled, 'Buyer-name PDF watermarking', 'Cheapest proven deterrent — every shared copy carries the buyer\'s name'],
                [uniqueDownloadLinks, setUniqueDownloadLinks, 'Per-buyer unique download links', 'Flags the leaker instantly when the file surfaces'],
                [soldOnMultiplePlatforms, setSoldOnMultiplePlatforms, 'Sell on two+ platforms', 'Diversifies revenue and enforcement risk'],
                [evidencePackReady, setEvidencePackReady, 'Evidence pack assembled', 'Original URL, listing URL, receipts, timestamped archive'],
              ] as const
            ).map(([on, set, label, hint], i) => (
              <label key={i} className="flex items-start gap-2 text-xs rounded-md border border-border/60 p-2 cursor-pointer hover:border-primary/40">
                <Checkbox checked={on} onCheckedChange={() => set(!on)} aria-label={label} />
                <span>
                  <span className="font-medium">{label}</span>
                  <span className="block text-muted-foreground">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* License terms */}
        <div className="space-y-2">
          <p className="text-xs font-medium">{copy.boundaries}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {(
              [
                ['personalUseOnly', copy.personal],
                ['finishedItemsMayBeSold', copy.finished],
                ['massProductionAllowed', copy.mass],
                ['translationAllowed', copy.translations],
                ['teachingAllowed', copy.teaching],
                ['derivativeChartsAllowed', copy.derivative],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-start gap-2 text-xs rounded-md border border-border/60 p-2 cursor-pointer hover:border-primary/40">
                <Checkbox checked={licenseTerms[k]} onCheckedChange={() => toggleTerm(k)} aria-label={label} />
                <span className="text-muted-foreground">{label}</span>
              </label>
            ))}
          </div>
          {result.licenseAudit.gaps.length > 0 && (
            <ul className="space-y-1">
              {result.licenseAudit.gaps.map((g, i) => (
                <li key={i} className="text-xs text-amber-700 dark:text-amber-400 flex gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {g}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Watch words + evidence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" /> {copy.monitor}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{copy.patternName}</Label>
                <Input value={patternName} onChange={e => setPatternName(e.target.value)} placeholder={copy.patternName} aria-label={copy.patternName} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{copy.designerName}</Label>
                <Input value={designerName} onChange={e => setDesignerName(e.target.value)} placeholder={copy.optional} aria-label={copy.designerName} />
              </div>
            </div>
            <div className="space-y-1">
              {watchWords.map((w, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => copyToClipboard(w, copy.copyWatch ?? '')}
                  className="w-full text-left text-xs font-mono rounded-md border border-border/60 bg-secondary/30 px-2 py-1.5 hover:border-primary/40"
                  title={copy.copyWatch}
                >
                  {w}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {copy.searchWeekly}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium">{copy.evidenceHeading}</p>
            <div className="space-y-1">
              {evidence.map((e: string, i: number) => (
                <div key={i} className="text-xs rounded-md border border-border/60 px-2 py-1.5">
                  {e}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {copy.evidenceHint}
            </p>
          </div>
        </div>

        {/* Escalation ladder */}
        <div className="space-y-2">
          <p className="text-xs font-medium flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> {copy.escalation}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dateField(leakDiscovered, setLeakDiscovered, copy.leakDate ?? '', copy.leakHint ?? '')}
            {dateField(counterNoticeDeadline, setCounterNoticeDeadline, copy.counterDeadline ?? '', copy.counterHint ?? '')}
            <label className="flex items-start gap-2 text-xs rounded-md border border-border/60 p-2 cursor-pointer hover:border-primary/40">
              <Checkbox checked={infringerContactedPolitely} onCheckedChange={() => setInfringerContactedPolitely(!infringerContactedPolitely)} aria-label={copy.contactDone} />
              <span className="text-muted-foreground">{copy.contactDone}</span>
            </label>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{copy.takedownChannel}</Label>
              <select
                value={platformForDmca}
                onChange={e => setPlatformForDmca(e.target.value as DmcaPlatform)}
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                aria-label={copy.takedownChannel}
              >
                {(Object.keys(DMCA_PLATFORM_LABELS) as DmcaPlatform[]).map(p => (
                  <option key={p} value={p}>
                    {DMCA_PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            {result.escalation.steps.map((s, i) => (
              <div key={i} className={'flex items-start gap-2 text-xs rounded-md border p-2 ' + (i === currentStep ? 'border-primary/50 bg-primary/5' : i < currentStep ? 'border-border/60 bg-secondary/30' : 'border-border/40 opacity-70')}>
                <span className={'font-semibold shrink-0 ' + (i <= currentStep ? 'text-accent' : 'text-muted-foreground')}>
                  {i < currentStep ? '✓' : i === currentStep ? '→' : '·'}
                </span>
                <span>
                  <span className="font-medium">{s.label}</span>
                  <span className="block text-muted-foreground">{s.detail}</span>
                  <span className={'block mt-0.5 flex items-center gap-1 ' + (i <= currentStep ? 'text-foreground' : 'text-muted-foreground')}>
                    <CalendarDays className="w-3 h-3" /> {s.deadlineNote}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* DMCA notice */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium flex items-center gap-1.5">
              <ClipboardCopy className="w-3.5 h-3.5" /> DMCA notice — {DMCA_PLATFORM_LABELS[platformForDmca]}
            </p>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(result.dmcaNotice, 'DMCA notice copied')}>
              <ClipboardCopy className="w-3.5 h-3.5 mr-1" /> Copy notice
            </Button>
          </div>
          <pre className="text-xs whitespace-pre-wrap rounded-lg bg-secondary/30 p-3 border border-border max-h-80 overflow-y-auto">
            {result.dmcaNotice}
          </pre>
          <p className="text-[11px] text-muted-foreground">
            All 6 required elements are present: identification of the original, infringing URLs, your contact
            info, good-faith statement, accuracy-under-penalty-of-perjury statement, and signature. Fill the
            bracketed fields — a vague claim is not a copyright claim.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3 h-3" />
          Research-grounded: Etsy removed 346,000+ counterfeit listings in 2021; patterns are protectable
          literary/artistic works (automatic copyright, life+70y); stitch types and methods are never
          protectable — the license and the URL evidence are your fence. No data leaves your device.
        </div>
      </CardContent>
    </Card>
  );
}
