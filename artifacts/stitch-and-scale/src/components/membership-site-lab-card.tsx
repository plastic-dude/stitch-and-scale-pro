import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Crown, Flag, Lightbulb, TrendingUp, Users } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { MEMBERSHIP_SITE_COPY, getMembershipFeeStackLabel, getMembershipFlagTitle, getMembershipScenarioLabel, getMembershipVerdict, getMembershipVerdictNote } from '@/lib/membership-site-copy';
import { projectStorage } from '@/lib/storage-lib';
import {
  analyzeMembershipSite,
  normalizeMembershipSiteInput,
  DEFAULT_CLUB,
  FEE_STACKS,
  fmt$,
  type MembershipSiteInput,
} from '@/lib/membership-site-lab';

const STORAGE_KEY = 'stitch-and-scale-membership-v1';

type StoredState = MembershipSiteInput & { ts?: number };

function defaultStored(): StoredState {
  return { ...DEFAULT_CLUB };
}

function loadStored(handle: ReturnType<typeof projectStorage<StoredState>>): StoredState {
  const parsed = handle.read();
  return {
    ...normalizeMembershipSiteInput(parsed ?? defaultStored()),
    ts: undefined,
  };
}

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
          onChange={e => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            const bounded = Math.min(max ?? Number.MAX_SAFE_INTEGER, Math.max(min, n));
            onChange(bounded);
          }}
          className="text-sm pr-8" />
        {suffix ? <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}

function StatBox({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'warn' | 'bad' }) {
  const toneCls =
    tone === 'good' ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30' :
    tone === 'warn' ? 'text-amber-700 bg-amber-500/10 border-amber-500/30' :
    tone === 'bad' ? 'text-destructive bg-destructive/10 border-destructive/30' :
    'text-foreground bg-accent/50 border-border';
  return (
    <div className={`rounded-md border p-3 ${toneCls}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

const verdictColor = (v: string) =>
  v.startsWith('Fund') ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' :
  v.startsWith('Not ready') ? 'bg-destructive/15 text-destructive border-destructive/30' :
  v.startsWith('Borderline') ? 'bg-amber-500/15 text-amber-700 border-amber-500/30' :
  'bg-sky-500/15 text-sky-700 border-sky-500/30';


export function MembershipSiteLabCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copyText = MEMBERSHIP_SITE_COPY[language];
  const handle = useMemo(() => projectStorage<StoredState>('membership', project.id, [STORAGE_KEY]), [project.id]);
  const [input, setInput] = useState<MembershipSiteInput>(() => loadStored(handle));

  useEffect(() => {
    setInput(loadStored(handle));
  }, [handle]);

  const persist = (next: MembershipSiteInput) => {
    const sanitized = normalizeMembershipSiteInput(next);
    setInput(sanitized);
    handle.write({ ...sanitized, ts: Date.now() });
  };

  const result = useMemo(() => analyzeMembershipSite(input), [input]);
  const realistic = result.scenarios[1];
  const monthlyCost = (input.contentHours + input.supportHours) * input.hourlyRate;
  const feeShare = realistic.grossRevenue > 0 ? realistic.fees / realistic.grossRevenue : 0;
  const lifetimeLabel = input.monthlyChurn > 0 ? `≈${(1 / input.monthlyChurn).toFixed(0)} mo` : '∞';
  const localizedVerdict = getMembershipVerdict(language, result.verdict);
  const localizedVerdictNote = getMembershipVerdictNote(language, result.verdict, {
    audience: input.audienceSize,
    realisticConversion: input.conversionRealistic,
    members: realistic.members,
    net: realistic.netRevenue,
    monthlyCost,
    hours: input.contentHours + input.supportHours,
    rate: input.hourlyRate,
    breakEven: result.breakEvenAudience,
    treadmillGap: result.treadmillGap,
    blended: input.annualPrice > 0 ? input.monthlyPrice * (1 - input.annualShare) + (input.annualPrice / 12) * input.annualShare : input.monthlyPrice,
    feeShare,
    ltv: realistic.ltvPerMember,
  });

  const set = <K extends keyof MembershipSiteInput>(k: K, v: MembershipSiteInput[K]) => persist({ ...input, [k]: v });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Crown className="size-4" />{copyText.title}</CardTitle>
        <CardDescription>{copyText.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><Users className="size-4" />{copyText.audience}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="ms-audience" label={copyText.engaged} value={input.audienceSize} onChange={n => set('audienceSize', n)} max={100_000_000} suffix={copyText.people} />
            <NumField id="ms-conv-w" label={copyText.conservative} value={input.conversionWorst * 100} onChange={n => set('conversionWorst', n / 100)} min={0} max={10} step={0.5} suffix="%" />
            <NumField id="ms-conv-r" label={copyText.realistic} value={input.conversionRealistic * 100} onChange={n => set('conversionRealistic', n / 100)} min={0} max={10} step={0.5} suffix="%" />
            <NumField id="ms-conv-b" label={copyText.best} value={input.conversionBest * 100} onChange={n => set('conversionBest', n / 100)} min={0} max={10} step={0.5} suffix="%" />
          </div>
          <p className="text-xs text-muted-foreground italic">{copyText.conversionNote}</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">{copyText.pricing}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="ms-monthly" label={copyText.monthly} value={input.monthlyPrice} onChange={n => set('monthlyPrice', n)} max={100_000} step={0.5} suffix="$" />
            <NumField id="ms-annual" label={copyText.annual} value={input.annualPrice} onChange={n => set('annualPrice', n)} max={1_000_000} step={1} suffix="$" />
            <NumField id="ms-annual-share" label={copyText.annualMembers} value={input.annualShare * 100} onChange={n => set('annualShare', n / 100)} min={0} max={100} step={5} suffix="%" />
            <NumField id="ms-churn" label={copyText.churn} value={input.monthlyChurn * 100} onChange={n => set('monthlyChurn', n / 100)} min={0} max={20} step={0.5} suffix="%" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <NumField id="ms-content-h" label={copyText.contentHours} value={input.contentHours} onChange={n => set('contentHours', n)} max={10_000} suffix="hrs" />
            <NumField id="ms-support-h" label={copyText.supportHours} value={input.supportHours} onChange={n => set('supportHours', n)} max={10_000} suffix="hrs" />
            <NumField id="ms-rate" label={copyText.rate} value={input.hourlyRate} onChange={n => set('hourlyRate', n)} max={100_000} suffix="$/hr" />
            <div className="space-y-1.5">
              <Label htmlFor="ms-stack" className="text-xs">{copyText.feeStack}</Label>
              <select id="ms-stack" value={input.feeStackKey}
                onChange={e => set('feeStackKey', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm">
                {Object.entries(FEE_STACKS).map(([k, v]) => <option key={k} value={k}>{getMembershipFeeStackLabel(language, k, v.label)}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><TrendingUp className="size-4" />{copyText.numbers}</h3>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-accent/60 text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">{copyText.scenario}</th>
                  <th className="p-2 text-right">{copyText.members}</th>
                  <th className="p-2 text-right">{copyText.gross}</th>
                  <th className="p-2 text-right">{copyText.fees}</th>
                  <th className="p-2 text-right">{copyText.net}</th>
                  <th className="p-2 text-right">{copyText.ltv}</th>
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map(s => (
                  <tr key={s.label} className="border-t">
                    <td className="p-2 capitalize">{getMembershipScenarioLabel(language, s.label, s.label)}</td>
                    <td className="p-2 text-right">{s.members.toFixed(1)}</td>
                    <td className="p-2 text-right">{fmt$(s.grossRevenue)}</td>
                    <td className="p-2 text-right">{fmt$(s.fees)}</td>
                    <td className="p-2 text-right font-medium">{fmt$(s.netRevenue)}</td>
                    <td className="p-2 text-right">{fmt$(s.ltvPerMember)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox label={copyText.breakEven} value={result.breakEvenAudience === Infinity ? '∞' : result.breakEvenAudience.toLocaleString('en-US')} />
            <StatBox label={copyText.treadmill} value={`${result.treadmillGap >= 0 ? '+' : ''}${fmt$(result.treadmillGap)}`} tone={result.treadmillGap >= 0 ? 'good' : 'bad'} />
            <StatBox label={copyText.ratio} value={`${result.treadmillRatio === Infinity ? '∞' : result.treadmillRatio.toFixed(2)}×`} tone={result.treadmillRatio >= 1.5 ? 'good' : 'warn'} />
            <StatBox label={copyText.lifetime} value={lifetimeLabel} />
          </div>
        </section>

        {result.flags.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5"><Flag className="size-4" />{copyText.watchouts}</h3>
            <div className="flex flex-wrap gap-2">
              {result.flags.map(f => (
                <Badge key={f.code} variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 gap-1.5 py-1.5">
                  <AlertTriangle className="size-3" />
                  <span className="font-medium">{f.code}</span> — {getMembershipFlagTitle(language, f.code, f.title)}
                </Badge>
              ))}
            </div>
          </section>
        )}

        <section className={`rounded-md border p-4 ${verdictColor(result.verdict)}`}>
          <div className="flex items-center gap-2 font-semibold"><Lightbulb className="size-4" />{copyText.verdict}: {localizedVerdict}</div>
          <p className="mt-1.5 text-sm">{localizedVerdictNote}</p>
        </section>
      </CardContent>
    </Card>
  );
}
