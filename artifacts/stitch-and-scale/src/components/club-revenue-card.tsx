import { copyTextOrThrow } from '@/lib/clipboard';
import { useMemo, useState } from 'react';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { useProjectStorage, useProjectStorageState } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCopy, CalendarDays, Layers, Receipt } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { safeNum } from '@/lib/numeric-guard';
import { useSettings } from '@/context/SettingsContext';
import { CLUB_REVENUE_COPY } from '@/lib/club-revenue-copy';
import {
  modelClub,
  defaultClubInput,
  auditPremiumTier,
  generateFoundingOfferEmail,
  ClubInput,
} from '@/lib/club-revenue-planner';

const STORAGE_KEY = 'kskclubrev-v1';

interface StoredState {
  showEmail: boolean;
  showPerks: boolean;
  showRetention: boolean;
  showProjection: boolean;
  club: ClubInput;
  email: {
    clubName: string;
    designerName: string;
    founderLockUntil: string;
    perk1: string;
    perk2: string;
    perk3: string;
    perk4: string;
    perk5: string;
  };
}

function defaultState(): StoredState {
  return {
    showEmail: false,
    showPerks: false,
    showRetention: false,
    showProjection: false,
    club: defaultClubInput(),
    email: {
      clubName: '',
      designerName: '',
      founderLockUntil: 'forever',
      perk1: '1 pattern every month',
      perk2: 'priority pattern support',
      perk3: 'lifetime access to every delivered pattern',
      perk4: 'first access to KALs and workshops',
      perk5: 'member discount on the catalogue',
    },
  };
}

function bounded(raw: string | number, fallback: number, min = 0, max = Infinity): number {
  return Math.min(max, Math.max(min, safeNum(raw, fallback)));
}

// CHK-152: pure derivation over the raw stored value — takes no
// handle, so it can never reach for a freshly-created handle in an initializer.
function loadStored(raw: StoredState | null): StoredState {
  const base = defaultState();
  try {
    if (raw?.club) {
      const club = { ...base.club, ...raw.club };
      return {
        ...base,
        ...raw,
        club: {
          ...club,
          monthlyMembers: bounded(club.monthlyMembers, base.club.monthlyMembers),
          annualMembers: bounded(club.annualMembers, base.club.annualMembers),
          monthlyPrice: bounded(club.monthlyPrice, base.club.monthlyPrice),
          annualPrice: bounded(club.annualPrice, base.club.annualPrice),
          newMembersPerMonth: bounded(club.newMembersPerMonth, base.club.newMembersPerMonth),
          monthlyChurnPct: bounded(club.monthlyChurnPct, base.club.monthlyChurnPct, 0, 100),
          directCostPerPattern: bounded(club.directCostPerPattern, base.club.directCostPerPattern),
          monthlyOverhead: bounded(club.monthlyOverhead, base.club.monthlyOverhead),
          marketingSpendPerMonth: bounded(club.marketingSpendPerMonth, base.club.marketingSpendPerMonth),
          hoursPerPattern: bounded(club.hoursPerPattern, base.club.hoursPerPattern),
          adminHoursPerMonth: bounded(club.adminHoursPerMonth, base.club.adminHoursPerMonth),
          premiumMembers: bounded(club.premiumMembers, base.club.premiumMembers),
          premiumPrice: bounded(club.premiumPrice, base.club.premiumPrice),
          premiumHoursPerMonth: bounded(club.premiumHoursPerMonth, base.club.premiumHoursPerMonth),
          monthlyNoticeDays: bounded(club.monthlyNoticeDays, base.club.monthlyNoticeDays, 0, 365),
        },
        email: { ...base.email, ...raw.email },
      };
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return base;
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function ClubRevenueCard({ project }: { project: PatternProject }) {
  // issue #4 project seam: one scoped store per project; the legacy flat key 'kskclubrev-v1' is folded in on first read, then removed.
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const copyText = CLUB_REVENUE_COPY[language];
  // CHK-152 (QUEUE-010): the old useMemo handle + `useState(() =>
// loadStored(handle))` lazy initializer was the crash class under HMR.
// Now flows through the shared seam: stable handle, memoized derivation.
const handle = useProjectStorage<StoredState>('clubrev', project.id, ['kskclubrev-v1']);
  const { toast } = useToast();
  const [stored, setStored] = useProjectStorageState(handle, (raw) => loadStored(raw));
  // CHK-152: persistence owned by the seam's state hook — a manual
  // write-on-change effect would double-write every update.

  const analysis = useMemo(() => modelClub(stored.club), [stored.club]);
  const perks = useMemo(() => auditPremiumTier(stored.club.premiumDelivered), [stored.club.premiumDelivered]);
  const perksList = [
    stored.email.perk1,
    stored.email.perk2,
    stored.email.perk3,
    stored.email.perk4,
    stored.email.perk5,
  ].filter(Boolean);
  const email = useMemo(
    () =>
      generateFoundingOfferEmail({
        clubName: stored.email.clubName || 'the pattern club',
        designerName: stored.email.designerName || project.name || 'a designer',
        monthlyPrice: stored.club.monthlyPrice,
        annualPrice: stored.club.annualPrice,
        founderLockUntil: stored.email.founderLockUntil,
        perks: perksList,
      }),
    [stored.email, stored.club.monthlyPrice, stored.club.annualPrice, project.name]
  );

  const setClub = (patch: Partial<ClubInput>) => setStored((s) => ({ ...s, club: { ...s.club, ...patch } }));
  const setEmail = (patch: Partial<StoredState['email']>) => setStored((s) => ({ ...s, email: { ...s.email, ...patch } }));

  const copy = async (text: string) => {
    try {
      await copyTextOrThrow(text);
      toast({ title: copyText.copied });
    } catch {
      toast({ title: copyText.copyManual });
    }
  };

  const churnColor =
    analysis.churnVerdict === 'healthy'
      ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
      : analysis.churnVerdict === 'bleeding'
        ? 'bg-destructive/15 text-destructive border-destructive/30'
        : 'bg-amber-500/15 text-amber-700 border-amber-500/30';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" /> {copyText.title}
        </CardTitle>
        <CardDescription>
          {copyText.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ---------------------------------------------------------------- */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{copyText.membership}</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-mm">
                {copyText.monthlyMembers}
              </Label>
              <Input
                id="cr-mm"
                type="number"
                className="h-9"
                value={stored.club.monthlyMembers}
                onChange={(e) => setClub({ monthlyMembers: bounded(e.target.value, stored.club.monthlyMembers) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-am">
                {copyText.annualMembers}
              </Label>
              <Input
                id="cr-am"
                type="number"
                className="h-9"
                value={stored.club.annualMembers}
                onChange={(e) => setClub({ annualMembers: bounded(e.target.value, stored.club.annualMembers) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-mp">
                {copyText.monthlyPrice}
              </Label>
              <Input
                id="cr-mp"
                type="number"
                className="h-9"
                value={stored.club.monthlyPrice}
                onChange={(e) => setClub({ monthlyPrice: bounded(e.target.value, stored.club.monthlyPrice) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-ap">
                {copyText.annualPrice}
              </Label>
              <Input
                id="cr-ap"
                type="number"
                className="h-9"
                value={stored.club.annualPrice}
                onChange={(e) => setClub({ annualPrice: bounded(e.target.value, stored.club.annualPrice) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-new">
                {copyText.newSignups}
              </Label>
              <Input
                id="cr-new"
                type="number"
                className="h-9"
                value={stored.club.newMembersPerMonth}
                onChange={(e) => setClub({ newMembersPerMonth: bounded(e.target.value, stored.club.newMembersPerMonth) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-churn">
                {copyText.churn}
              </Label>
              <Input
                id="cr-churn"
                type="number"
                className="h-9"
                value={stored.club.monthlyChurnPct}
                onChange={(e) => setClub({ monthlyChurnPct: bounded(e.target.value, stored.club.monthlyChurnPct, 0, 100) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-dc">
                Direct cost/pattern ($)
              </Label>
              <Input
                id="cr-dc"
                type="number"
                className="h-9"
                value={stored.club.directCostPerPattern}
                onChange={(e) => setClub({ directCostPerPattern: bounded(e.target.value, stored.club.directCostPerPattern) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-oh">
                Overhead/mo ($)
              </Label>
              <Input
                id="cr-oh"
                type="number"
                className="h-9"
                value={stored.club.monthlyOverhead}
                onChange={(e) => setClub({ monthlyOverhead: bounded(e.target.value, stored.club.monthlyOverhead) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-mkt">
                Marketing/mo ($)
              </Label>
              <Input
                id="cr-mkt"
                type="number"
                className="h-9"
                value={stored.club.marketingSpendPerMonth}
                onChange={(e) => setClub({ marketingSpendPerMonth: bounded(e.target.value, stored.club.marketingSpendPerMonth) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-hp">
                Hours/pattern
              </Label>
              <Input
                id="cr-hp"
                type="number"
                className="h-9"
                value={stored.club.hoursPerPattern}
                onChange={(e) => setClub({ hoursPerPattern: bounded(e.target.value, stored.club.hoursPerPattern) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-admin">
                Admin hours/mo
              </Label>
              <Input
                id="cr-admin"
                type="number"
                className="h-9"
                value={stored.club.adminHoursPerMonth}
                onChange={(e) => setClub({ adminHoursPerMonth: bounded(e.target.value, stored.club.adminHoursPerMonth) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-pm">
                Premium members
              </Label>
              <Input
                id="cr-pm"
                type="number"
                className="h-9"
                value={stored.club.premiumMembers}
                onChange={(e) => setClub({ premiumMembers: bounded(e.target.value, stored.club.premiumMembers) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-pp">
                Premium add-on ($)
              </Label>
              <Input
                id="cr-pp"
                type="number"
                className="h-9"
                value={stored.club.premiumPrice}
                onChange={(e) => setClub({ premiumPrice: bounded(e.target.value, stored.club.premiumPrice) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-ph">
                Premium hours/mo
              </Label>
              <Input
                id="cr-ph"
                type="number"
                className="h-9"
                value={stored.club.premiumHoursPerMonth}
                onChange={(e) => setClub({ premiumHoursPerMonth: bounded(e.target.value, stored.club.premiumHoursPerMonth) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-notice">
                Cancel notice (days)
              </Label>
              <Input
                id="cr-notice"
                type="number"
                className="h-9"
                value={stored.club.monthlyNoticeDays}
                onChange={(e) => setClub({ monthlyNoticeDays: bounded(e.target.value, stored.club.monthlyNoticeDays, 0, 365) })}
              />
            </div>
            <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>Founder price lock</span>
              <Switch
                checked={stored.club.founderPriceLock}
                onCheckedChange={(v) => setClub({ founderPriceLock: v })}
              />
            </label>
            <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>No annual refunds</span>
              <Switch
                checked={!stored.club.annualRefunds}
                onCheckedChange={(v) => setClub({ annualRefunds: !v })}
              />
            </label>
            <label className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>Lifetime pattern access</span>
              <Switch
                checked={stored.club.lifetimeAccess}
                onCheckedChange={(v) => setClub({ lifetimeAccess: v })}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/30 p-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Net MRR (month 1)</p>
              <p className="font-semibold">{fmt$(analysis.monthlyRecurring)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Projected annual net</p>
              <p className="font-semibold">{fmt$(analysis.projectedAnnualNet)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Breakeven members</p>
              <p className="font-semibold">{analysis.breakevenMembers || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member LTV</p>
              <p className="font-semibold">{fmt$(analysis.ltv)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Effective hourly</p>
              <p className="font-semibold">{analysis.effectiveHourly.toFixed(1)}/hr</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Marketing payback</p>
              <p className="font-semibold">
                {analysis.marketingPaybackMonths > 0 ? `${analysis.marketingPaybackMonths} mo` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Your hours/mo</p>
              <p className="font-semibold">{analysis.totalHoursPerMonth}</p>
            </div>
            <div className="flex items-center">
              <Badge className={`${churnColor} border px-3 py-1 text-sm`}>
                Churn: {analysis.churnVerdict} ({analysis.churnBenchmark.label})
              </Badge>
            </div>
          </div>
          {analysis.churnBenchmark.note && (
            <p className="text-sm leading-relaxed text-muted-foreground">{analysis.churnBenchmark.note}</p>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Premium tier audit (score {perks.score}/6)
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {perks.gaps.map((g) => (
              <div key={g.name} className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Missing: {g.name}</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">{g.note}</p>
              </div>
            ))}
            {perks.gaps.length === 0 && (
              <p className="text-sm text-muted-foreground">All six core perks are in place — strong tier.</p>
            )}
          </div>
          {analysis.premiumNotes.map((n, i) => (
            <p key={i} className="text-sm leading-relaxed text-muted-foreground">
              {n}
            </p>
          ))}
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Terms &amp; retention</h3>
          {analysis.policyNotes.map((n, i) => (
            <p key={i} className="text-sm leading-relaxed text-muted-foreground">
              {n}
            </p>
          ))}

          <label className="flex items-center gap-2 pt-1 text-sm font-medium">
            <Switch
              checked={stored.showRetention}
              onCheckedChange={(v) => setStored((s) => ({ ...s, showRetention: v }))}
            />
            <CalendarDays className="h-4 w-4" /> Retention calendar (fight the churn)
          </label>
          {stored.showRetention && (
            <div className="space-y-2">
              {analysis.retentionNotes.map((n, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {n}
                </p>
              ))}
            </div>
          )}

          <label className="flex items-center gap-2 pt-2 text-sm font-medium">
            <Switch
              checked={stored.showEmail}
              onCheckedChange={(v) => setStored((s) => ({ ...s, showEmail: v }))}
            />
            <Layers className="h-4 w-4" /> Founding-member launch email
          </label>
          {stored.showEmail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="cr-cn">
                    Club name
                  </Label>
                  <Input
                    id="cr-cn"
                    className="h-9"
                    value={stored.email.clubName}
                    onChange={(e) => setEmail({ clubName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="cr-dn">
                    Your name
                  </Label>
                  <Input
                    id="cr-dn"
                    className="h-9"
                    value={stored.email.designerName}
                    onChange={(e) => setEmail({ designerName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs" htmlFor="cr-fl">
                    Price lock until
                  </Label>
                  <Input
                    id="cr-fl"
                    className="h-9"
                    value={stored.email.founderLockUntil}
                    onChange={(e) => setEmail({ founderLockUntil: e.target.value })}
                  />
                </div>
                {(['perk1', 'perk2', 'perk3', 'perk4', 'perk5'] as const).map((k, idx) => (
                  <div key={k} className="space-y-1.5">
                    <Label className="text-xs" htmlFor={`cr-${k}`}>
                      Perk {idx + 1}
                    </Label>
                    <Input
                      id={`cr-${k}`}
                      className="h-9"
                      value={stored.email[k]}
                      onChange={(e) => setEmail({ [k]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="relative rounded-md border bg-muted/30 p-3">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed">{email}</pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => copy(email)}
                  aria-label={copyText.copyEmail}
                >
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 pt-2 text-sm font-medium">
            <Switch
              checked={stored.showProjection}
              onCheckedChange={(v) => setStored((s) => ({ ...s, showProjection: v }))}
            />
            <Receipt className="h-4 w-4" /> 12-month projection
          </label>
          {stored.showProjection && (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2">Monthly members</th>
                    <th className="px-3 py-2">Annual members</th>
                    <th className="px-3 py-2">Premium members</th>
                    <th className="px-3 py-2">Net revenue</th>
                    <th className="px-3 py-2">Net after costs</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.months.map((m) => (
                    <tr key={m.month} className="border-b last:border-0">
                      <td className="px-3 py-1.5">{m.month}</td>
                      <td className="px-3 py-1.5">{m.monthlyMembers.toFixed(1)}</td>
                      <td className="px-3 py-1.5">{m.annualMembers.toFixed(1)}</td>
                      <td className="px-3 py-1.5">{m.premiumMembers.toFixed(1)}</td>
                      <td className="px-3 py-1.5">{fmt$(m.netRevenue)}</td>
                      <td className="px-3 py-1.5 font-medium">{fmt$(m.netAfterCosts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
