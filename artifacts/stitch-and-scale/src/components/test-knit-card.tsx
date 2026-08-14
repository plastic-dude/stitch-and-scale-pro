/**
 * Test-Knit Programme — run a size-covered test knit from inside the project.
 *
 * Session-10 research, turned into interface:
 * - Roster: designers run ~2 testers per size (Nest Creative Works) and keep
 *   pools deep because dropouts are the norm, not the exception (A Bee in
 *   the Bonnet: 10-week lead, Instagram group chats, big pools).
 * - Yardage loop: testers report actual yards used; the estimator's per-size
 *   share (scaled by graded bust vs base bust) gives the honest benchmark.
 *   This is exactly what a test knit is for.
 * - Tester call: one paste-ready block for the Ravelry Testing Pool,
 *   Yarnpond, newsletter or group chat — every number comes from the
 *   pattern, nothing invented.
 *
 * All numbers persist in localStorage under a project-scoped key so the
 * roster survives reloads until cloud storage arrives.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  buildRoster,
  checkPoolHealth,
  generateTesterCall,
  gradedSizes,
  summarizeRoster,
  validateTesterYardage,
  TesterSlot,
  TesterStatus,
} from '@/lib/test-knit-programme';
import { PatternProject } from '@/lib/grading-engine';
import { YARN_WEIGHTS, YARN_WEIGHT_LABELS, YarnWeight } from '@/lib/yarn-estimator';
import { Users, CalendarDays, ClipboardCopy, AlertTriangle, CheckCircle2, Gauge, XCircle } from 'lucide-react';

const STORAGE_KEY = 'stitch-and-scale-testknit';

type StatusBadgeProps = { status: TesterStatus };
const STATUS_META: Record<TesterStatus, { label: string; className: string }> = {
  invited: { label: 'Invited', className: 'bg-slate-500/15 text-slate-600 border-slate-500/40' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-500/15 text-blue-600 border-blue-500/40' },
  knitting: { label: 'Knitting', className: 'bg-amber-500/15 text-amber-600 border-amber-500/40' },
  stalled: { label: 'Stalled', className: 'bg-orange-500/15 text-orange-600 border-orange-500/40' },
  finished: { label: 'Finished', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40' },
  dropped: { label: 'Dropped', className: 'bg-destructive/15 text-destructive border-destructive/40' },
};

function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  return (
    <Badge variant="outline" className={cn('font-medium', meta.className)}>
      {meta.label}
    </Badge>
  );
}

export function TestKnitCard({ project }: { project: PatternProject }) {
  const { toast } = useToast();
  const sizes = gradedSizes(project);

  const [slotsPerSize, setSlotsPerSize] = React.useState(2);
  const [slots, setSlots] = React.useState<TesterSlot[]>(() => buildRoster(project, { slotsPerSize: 2 }));
  const [weight, setWeight] = React.useState<YarnWeight>(project.yarnWeight ?? 'worsted');
  const [leadWeeks, setLeadWeeks] = React.useState(10);
  const [incentive, setIncentive] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  // When the pattern itself changes, rebuild the roster (keeping any
  // assigned testers where their slot id still exists).
  const prevSectionsRef = React.useRef(project.sections.length);
  React.useEffect(() => {
    if (prevSectionsRef.current !== project.sections.length) {
      prevSectionsRef.current = project.sections.length;
      setSlots(prev => {
        const fresh = buildRoster(project, { slotsPerSize });
        const byId = new Map(prev.map(s => [s.id, s] as const));
        return fresh.map(f => byId.get(f.id) ?? f);
      });
    }
  }, [project, slotsPerSize]);

  const summary = summarizeRoster(slots);
  const health = checkPoolHealth(slots);
  const callText = generateTesterCall(project, { slotsPerSize, leadWeeks, incentive: incentive || undefined }, weight);

  const persist = (next: TesterSlot[]) => {
    setSlots(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ [project.id]: next }));
    } catch {
      // Offline or full storage — the in-memory roster still works.
    }
  };

  const setSlot = (id: string, patch: Partial<TesterSlot>) => {
    persist(slots.map(s => (s.id === id ? { ...s, ...patch } : s)));
  };

  const resetRoster = () => {
    persist(buildRoster(project, { slotsPerSize }));
    toast({ title: 'Roster rebuilt', description: `${sizes.length} sizes × ${slotsPerSize} slot${slotsPerSize > 1 ? 's' : ''}.` });
  };

  const copyCall = async () => {
    try {
      await navigator.clipboard.writeText(callText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast({ title: 'Tester call copied', description: 'Paste it into the Ravelry Testing Pool, Yarnpond, or your newsletter.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Select the text manually from the box below.' });
    }
  };

  const STATUS_OPTIONS: { value: TesterStatus; label: string }[] = [
    { value: 'invited', label: 'Invited' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'knitting', label: 'Knitting' },
    { value: 'stalled', label: 'Stalled' },
    { value: 'finished', label: 'Finished' },
    { value: 'dropped', label: 'Dropped' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Test-Knit Programme
          </CardTitle>
          <CardDescription>
            One tester pool, every size covered. Built from your graded table: a slot per tester per size, real yardage
            reported back against the estimate, and a paste-ready call for the Ravelry Testing Pool. Dropouts are the
            norm — keep the pool deep.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Slots per size</Label>
              <NativeSelect
                value={String(slotsPerSize)}
                onChange={e => {
                  const n = Number(e.target.value);
                  setSlotsPerSize(n);
                  persist(buildRoster(project, { slotsPerSize: n }));
                }}
                aria-label="slots per size"
              >
                {[1, 2, 3, 4].map(n => (
                  <option key={n} value={n}>{n} tester{n > 1 ? 's' : ''} / size</option>
                ))}
              </NativeSelect>
              <p className="text-[11px] text-muted-foreground">~2 per size is the common practice.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Yarn weight for yardage check</Label>
              <NativeSelect value={weight} onChange={e => setWeight(e.target.value as YarnWeight)} aria-label="yarn weight">
                {YARN_WEIGHTS.map(w => (
                  <option key={w} value={w}>{YARN_WEIGHT_LABELS[w]}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lead time (weeks)</Label>
              <NativeSelect value={String(leadWeeks)} onChange={e => setLeadWeeks(Number(e.target.value))} aria-label="lead weeks">
                {[4, 6, 8, 10, 12, 16].map(n => (
                  <option key={n} value={n}>{n} weeks</option>
                ))}
              </NativeSelect>
              <p className="text-[11px] text-muted-foreground">10+ weeks is the safe window for a full sweater test.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="gap-1 bg-primary/10 border-primary/30 font-semibold">
              {summary.totalSlots} slots
            </Badge>
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {summary.finished} finished
            </Badge>
            <Badge variant="outline" className="gap-1">
              <XCircle className="w-3 h-3 text-destructive" />
              {summary.dropped} dropped
            </Badge>
            {summary.dropoutRate > 0 && (
              <span className="text-xs text-muted-foreground">
                {Math.round(summary.dropoutRate * 100)}% dropout rate
              </span>
            )}
            <Button variant="outline" size="sm" className="ml-auto" onClick={resetRoster} data-testid="button-reset-roster">
              Rebuild roster
            </Button>
          </div>

          {health.length > 0 && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-1">
              {health.map((issue, i) => (
                <p key={i} className="text-sm flex items-start gap-2 text-amber-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  {issue.message}
                </p>
              ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-3 py-2 font-medium">Size</th>
                  <th className="px-3 py-2 font-medium">Tester</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Yards used</th>
                  <th className="px-3 py-2 font-medium">vs Estimate</th>
                  <th className="px-3 py-2 font-medium min-w-[180px]">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {slots.map(slot => {
                  const validation = slot.actualYards ? validateTesterYardage(project, weight, slot.actualYards, slot.size) : null;
                  return (
                    <tr key={slot.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-3 py-2 font-semibold">{slot.size}</td>
                      <td className="px-3 py-2">
                        <Input
                          value={slot.name}
                          onChange={e => setSlot(slot.id, { name: e.target.value })}
                          placeholder="Tester name"
                          className="h-8"
                          data-testid={`input-slot-name-${slot.id}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <NativeSelect
                          value={slot.status}
                          onChange={e => setSlot(slot.id, { status: e.target.value as TesterStatus })}
                          aria-label={`status for ${slot.id}`}
                        >
                          {STATUS_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </NativeSelect>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          value={slot.actualYards ?? ''}
                          onChange={e => setSlot(slot.id, { actualYards: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="— yd"
                          className="h-8 w-24"
                          data-testid={`input-slot-yards-${slot.id}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        {validation ? (
                          <span className={cn('text-xs font-medium', validation.withinTolerance ? 'text-emerald-600' : 'text-amber-600')}>
                            {validation.withinTolerance ? '✓' : '±'} {validation.variancePercent > 0 ? '+' : ''}{validation.variancePercent}%
                            <span className="block text-[10px] text-muted-foreground">est {validation.estimatedYards.toLocaleString()} yd</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">pending</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={slot.feedback}
                          onChange={e => setSlot(slot.id, { feedback: e.target.value })}
                          placeholder="Notes per tester"
                          className="h-8"
                          data-testid={`input-slot-feedback-${slot.id}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {slots.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No graded sizes found for this project — add measurements in the Sections tab first.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-accent" />
            Timeline
          </CardTitle>
          <CardDescription>
            Put the tester call out {leadWeeks} weeks ahead and hold the date. Testers buy yarn, book the fibre, and knit
            around life — the window is the thing that protects the launch date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Gauge className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {sizes.length} size{sizes.length === 1 ? '' : 's'} graded → call needs {summary.totalSlots} tester{summary.totalSlots === 1 ? '' : 's'}.{' '}
              Recommended: close the call once every size has a confirmed tester, then hold {leadWeeks} weeks to finish.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <ClipboardCopy className="w-5 h-5 text-accent" />
            Tester Call
          </CardTitle>
          <CardDescription>
            Paste-ready recruitment text for the Ravelry Testing Pool, Yarnpond, your newsletter, or a group chat. Every
            number is pulled from this pattern — sizes, weight, yardage estimate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Incentive (optional — blank uses the standard free-pattern + credit line)</Label>
            <Input
              value={incentive}
              onChange={e => setIncentive(e.target.value)}
              placeholder="e.g. Plus a $10 gift card to my yarn sponsor"
              className="h-9"
            />
          </div>
          <pre className="whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-4 text-sm font-sans">
            {callText}
          </pre>
          <Button onClick={copyCall} size="sm" data-testid="button-copy-tester-call">
            <ClipboardCopy className="w-4 h-4 mr-2" />
            {copied ? 'Copied!' : 'Copy tester call'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
