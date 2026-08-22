import { useMemo, useState } from 'react';
import { useProjectStorage, useProjectStorageState } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar, ClipboardCopy, PackageCheck, CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { SUBMISSION_PIPELINE_COPY } from '@/lib/submission-pipeline-copy';
import { getToastCopy } from '@/lib/toast-copy';
import { YarnWeight, YARN_WEIGHTS, YARN_WEIGHT_LABELS } from '@/lib/yarn-estimator';
import { PLATFORMS, PLATFORM_LABELS } from '@/lib/pattern-income-calculator';
import { copyTextOrThrow } from '@/lib/clipboard';
import {
  buildPipeline,
  submissionPackChecklist,
  generateSubmissionLetter,
  DEFAULT_PRODUCTION_RATES,
  PipelineCall,
  ProductionRates,
} from '@/lib/submission-pipeline';

const STORAGE_KEY = 'snsp-v1';

interface StoredCall extends PipelineCall {
  id: string;
}

interface StoredRates extends ProductionRates {
  showScore: boolean;
  baselinePlatform: string;
  baselineUnits: number;
  baselinePrice: number;
  yarnWeight: string;
}

function loadStored(raw: { calls: StoredCall[]; rates: StoredRates } | null): { calls: StoredCall[]; rates: StoredRates } {
  try {
    if (raw) {
      if (Array.isArray(raw.calls) && raw.rates) {
        return { calls: raw.calls, rates: { ...defaultRates(), ...raw.rates } };
      }
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return { calls: [], rates: defaultRates() };
}

function defaultRates(): StoredRates {
  return {
    ...DEFAULT_PRODUCTION_RATES,
    showScore: true,
    baselinePlatform: 'ravelry',
    baselineUnits: 40,
    baselinePrice: 8,
    yarnWeight: 'worsted',
  };
}

function blankCall(): StoredCall {
  return {
    id: `call-${Date.now().toString(36)}`,
    publication: '',
    issue: '',
    submissionDeadline: '',
    decisionDate: '',
    patternDue: '',
    sampleDue: '',
    launchDate: '',
    exclusiveMonths: 0,
    fee: 0,
    magazineCoversTechEdit: false,
    yarnSupport: false,
  };
}

function dateInput(value: string | undefined, onChange: (v: string) => void) {
  return (
    <Input type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="h-9" />
  );
}

export function SubmissionPipelineCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copy = SUBMISSION_PIPELINE_COPY[language];
  const toastCopy = getToastCopy(language);
  // issue #4 project seam: one scoped store per project; the legacy flat key 'snsp-v1' is folded in on first read, then removed.
  // CHK-152 (QUEUE-010): the old useMemo handle + `useState(() =>
// loadStored(handle))` lazy initializer was the crash class under HMR.
// Now flows through the shared seam: stable handle, memoized derivation.
const handle = useProjectStorage<{ calls: StoredCall[]; rates: StoredRates }>('submitpipe', project.id, ['snsp-v1']);
  const { toast } = useToast();
  const [stored, setStored] = useProjectStorageState(handle, (raw) => loadStored(raw));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // CHK-152: persistence owned by the seam's state hook — a manual
  // write-on-change effect would double-write every update.

  const editing = stored.calls.find((c) => c.id === editingId);
  const selected = stored.calls.find((c) => c.id === selectedId);

  const summary = useMemo(() => {
    if (!selected) return null;
    const weight = stored.rates.yarnWeight as YarnWeight;
    return buildPipeline({
      call: selected,
      project,
      rates: stored.rates,
      yarnWeight: YARN_WEIGHTS.includes(weight) ? weight : undefined,
      baseline: stored.rates.showScore
        ? { platform: stored.rates.baselinePlatform as never, monthlyUnits: stored.rates.baselineUnits, price: stored.rates.baselinePrice }
        : undefined,
    });
  }, [selected, stored.rates, project]);

  const checklist = useMemo(
    () => (selected ? submissionPackChecklist({ publication: selected.publication || 'the publication', issue: selected.issue || 'the issue', theme: '', designName: project.name, designerName: project.author }) : []),
    [selected, project]
  );

  const letter = useMemo(
    () => (selected ? generateSubmissionLetter({ publication: selected.publication || 'the publication', issue: selected.issue || 'the issue', theme: '', designName: project.name, designerName: project.author }) : ''),
    [selected, project]
  );

  const copyText = (text: string, label: string) => {
    copyTextOrThrow(text)
      .then(() => {
        toast({ title: `${label} — ${copy.copied}`, description: copy.pasteHint });
      })
      .catch(() => {
        toast({ title: `${label} — ${toastCopy.copyFailed}`, description: toastCopy.copyFailedDescription });
      });
  };

  const updateCall = (patch: Partial<PipelineCall>, showToast = false) => {
    if (!editing) return;
    setStored((s) => ({
      ...s,
      calls: s.calls.map((c) => (c.id === editing.id ? ({ ...c, ...patch } as StoredCall) : c)),
    }));
    if (showToast) {
      toast({ title: copy.saved });
    }
  };

  const updateRates = (patch: Partial<StoredRates>, showToast = false) => {
    setStored((s) => ({ ...s, rates: { ...s.rates, ...patch } }));
    if (showToast) {
      toast({ title: copy.saved });
    }
  };

  const stateStyle = (state: string) => {
    if (state === 'past') return 'bg-muted text-muted-foreground';
    if (state === 'due-soon') return 'bg-amber-500/15 text-amber-700 border-amber-400/40';
    if (state === 'upcoming') return 'bg-emerald-500/10 text-emerald-700 border-emerald-400/40';
    return 'border-border text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><PackageCheck className="h-5 w-5" />{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calls list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">{copy.callsTracked}</Label>
            <Button variant="outline" size="sm" onClick={() => {
              const c = blankCall();
              setStored((s) => ({ ...s, calls: [...s.calls, c] }));
              setEditingId(c.id);
              toast({ title: copy.addCall, description: copy.untitled });
            }}>{copy.addCall}</Button>
          </div>
          {stored.calls.length === 0 && (
            <p className="text-sm text-muted-foreground">{copy.noCalls}</p>
          )}
          {stored.calls.map((c) => (
            <div key={c.id} className="flex items-center gap-2 border rounded-md px-3 py-2 bg-card/60">
              <span className="flex-1 text-sm truncate">
                {c.publication ? `${c.publication}${c.issue ? ` — ${c.issue}` : ''}` : <span className="text-muted-foreground italic">{copy.untitled}</span>}
              </span>
              {c.submissionDeadline && (
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{c.submissionDeadline}</span>
              )}
              <Button variant="ghost" size="sm" onClick={() => { setEditingId(c.id); setSelectedId(c.id); }}>{copy.editView}</Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
                setStored((s) => ({ ...s, calls: s.calls.filter((x) => x.id !== c.id) }));
                if (editingId === c.id) setEditingId(null);
                if (selectedId === c.id) setSelectedId(null);
                toast({ title: toastCopy.sectionDeletedTitle });
              }}>✕</Button>
            </div>
          ))}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-semibold text-sm">{copy.callDetails}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Publication</Label>
                <Input value={editing.publication} placeholder={copy.publicationPlaceholder} onChange={(e) => updateCall({ publication: e.target.value })} onBlur={() => updateCall({}, true)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Issue / theme</Label>
                <Input value={editing.issue} placeholder={copy.issuePlaceholder} onChange={(e) => updateCall({ issue: e.target.value })} onBlur={() => updateCall({}, true)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Submission deadline</Label>
                {dateInput(editing.submissionDeadline, (v) => updateCall({ submissionDeadline: v }, true))}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Decision date</Label>
                {dateInput(editing.decisionDate, (v) => updateCall({ decisionDate: v }, true))}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pattern due</Label>
                {dateInput(editing.patternDue, (v) => updateCall({ patternDue: v }, true))}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sample due</Label>
                {dateInput(editing.sampleDue, (v) => updateCall({ sampleDue: v }, true))}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Launch date</Label>
                {dateInput(editing.launchDate, (v) => updateCall({ launchDate: v }, true))}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Exclusive window (months from launch)</Label>
                <Input type="number" min={0} value={editing.exclusiveMonths} onChange={(e) => updateCall({ exclusiveMonths: Number(e.target.value) || 0 })} onBlur={() => updateCall({}, true)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fee on publishing ($)</Label>
                <Input type="number" min={0} value={editing.fee} onChange={(e) => updateCall({ fee: Number(e.target.value) || 0 })} onBlur={() => updateCall({}, true)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sample yarn weight</Label>
                <Select value={stored.rates.yarnWeight} onValueChange={(v) => updateRates({ yarnWeight: v }, true)}>
                  <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YARN_WEIGHTS.map((w) => (
                      <SelectItem key={w} value={w}>{YARN_WEIGHT_LABELS[w]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.magazineCoversTechEdit} onCheckedChange={(v) => updateCall({ magazineCoversTechEdit: v }, true)} />
                <Label className="text-xs">Magazine covers tech editing &amp; test knitting</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.yarnSupport} onCheckedChange={(v) => updateCall({ yarnSupport: v }, true)} />
                <Label className="text-xs">Yarn support / shipping provided</Label>
              </div>
            </div>
          </div>
        )}

        {/* Production rates */}
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-sm">{copy.productionRates}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Sample knitting (yd/hr)</Label>
              <Input type="number" value={stored.rates.knitYardsPerHour} onChange={(e) => updateRates({ knitYardsPerHour: Number(e.target.value) || 10 })} onBlur={() => updateRates({}, true)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pattern writing (hrs)</Label>
              <Input type="number" value={stored.rates.patternWriteHours} onChange={(e) => updateRates({ patternWriteHours: Number(e.target.value) || 0 })} onBlur={() => updateRates({}, true)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Swatch work (hrs)</Label>
              <Input type="number" value={stored.rates.swatchHours} onChange={(e) => updateRates({ swatchHours: Number(e.target.value) || 0 })} onBlur={() => updateRates({}, true)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hours/week available</Label>
              <Input type="number" value={stored.rates.availableHoursPerWeek} onChange={(e) => updateRates({ availableHoursPerWeek: Number(e.target.value) || 1 })} onBlur={() => updateRates({}, true)} />
            </div>
          </div>
        </div>

        {/* Analysis */}
        {summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border rounded-md p-3">
                <p className="text-xs text-muted-foreground">Sample knit time</p>
                <p className="text-lg font-semibold">{Math.round(summary.production.sampleKnitHours)} hrs</p>
                <p className="text-xs text-muted-foreground">{summary.production.totalProductionHours.toFixed(1)} hrs total production</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="text-xs text-muted-foreground">Time needed</p>
                <p className="text-lg font-semibold">{summary.production.requiredWeeks} wks</p>
                <p className="text-xs text-muted-foreground">at {stored.rates.availableHoursPerWeek} hrs/week</p>
              </div>
              <div className="border rounded-md p-3">
                <p className="text-xs text-muted-foreground">Feasible?</p>
                <p className="text-lg font-semibold flex items-center gap-1">
                  {summary.production.feasible ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-destructive" />}
                  {summary.production.feasible ? 'Yes' : 'No'}
                </p>
                {summary.production.mustStartBy && <p className="text-xs text-muted-foreground">start by {summary.production.mustStartBy}</p>}
              </div>
              <div className="border rounded-md p-3">
                <p className="text-xs text-muted-foreground">Weeks until first due</p>
                <p className="text-lg font-semibold">{summary.production.weeksUntilFirstDue ?? '—'}</p>
              </div>
            </div>
            <p className={`text-sm flex items-center gap-2 ${summary.production.feasible ? 'text-emerald-700' : 'text-destructive'}`}>
              {summary.production.feasible ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {summary.production.note}
            </p>

            <div className="border rounded-md divide-y">
              {summary.milestones.map((m) => (
                <div key={m.name} className="flex items-center gap-3 px-3 py-2">
                  <Badge variant="outline" className={`${stateStyle(m.state)} text-xs`}>{m.state === 'unknown' ? '—' : m.state}</Badge>
                  <span className="text-sm flex-1">{m.name}</span>
                  <span className="text-sm text-muted-foreground">{m.date ?? copy.notSet}</span>
                  {m.daysFromNow !== null && (
                    <span className="text-xs text-muted-foreground">{m.daysFromNow >= 0 ? `in ${m.daysFromNow} days` : `${-m.daysFromNow} days ago`}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Offer score */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-semibold text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />{copy.offerComparison}</h4>
                <div className="flex items-center gap-2">
                  <Switch checked={stored.rates.showScore} onCheckedChange={(v) => updateRates({ showScore: v })} />
                  <Label className="text-xs">{copy.compareBaseline}</Label>
                </div>
              </div>
              {stored.rates.showScore && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Baseline platform</Label>
                    <Select value={stored.rates.baselinePlatform} onValueChange={(v) => updateRates({ baselinePlatform: v })}>
                      <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((p) => (
                          <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Monthly sales (units)</Label>
                    <Input type="number" value={stored.rates.baselineUnits} onChange={(e) => updateRates({ baselineUnits: Number(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Self-publish price ($)</Label>
                    <Input type="number" value={stored.rates.baselinePrice} onChange={(e) => updateRates({ baselinePrice: Number(e.target.value) || 0 })} />
                  </div>
                </div>
              )}
              {summary.offer ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="border rounded-md p-3">
                      <p className="text-xs text-muted-foreground">Net vs solo</p>
                      <p className={`text-lg font-semibold ${summary.offer.netVsSolo >= 0 ? 'text-emerald-700' : 'text-destructive'}`}>
                        ${summary.offer.netVsSolo.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-xs text-muted-foreground">Effective $/hr</p>
                      <p className="text-lg font-semibold">${summary.offer.effectiveHourlyRate.toFixed(2)}</p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-xs text-muted-foreground">Lost sales window</p>
                      <p className="text-lg font-semibold">{summary.offer.lostSoloMonths} mo</p>
                      <p className="text-xs text-muted-foreground">${summary.offer.lostSoloIncome.toFixed(2)} lost</p>
                    </div>
                    <div className="border rounded-md p-3">
                      <p className="text-xs text-muted-foreground">After exclusivity</p>
                      <p className="text-lg font-semibold">${summary.offer.postExclusivityIncome.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">per 6 months</p>
                    </div>
                  </div>
                  <Badge className={summary.offer.verdict === 'go' ? 'bg-emerald-600 hover:bg-emerald-600' : summary.offer.verdict === 'skip' ? 'bg-destructive hover:bg-destructive' : 'bg-amber-500 hover:bg-amber-500'}>
                    {summary.offer.verdict.toUpperCase()}
                  </Badge>
                  <p className="text-sm">{summary.offer.note}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Turn on the comparison to score this call against your solo baseline — or save the analysis and come back.</p>
              )}
            </div>

            {/* Submission pack */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">{copy.submissionPack}</h4>
              <ul className="space-y-1.5">
                {checklist.map((item, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Textarea value={letter} readOnly rows={8} className="text-sm" />
              <Button variant="outline" size="sm" onClick={() => copyText(letter, copy.coverLetter)}>
                <ClipboardCopy className="h-4 w-4 mr-1" />{copy.copyCoverLetter}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
