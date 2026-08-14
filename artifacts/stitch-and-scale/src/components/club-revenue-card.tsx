import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCopy, CalendarDays, Layers, Receipt } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
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

function loadStored(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.club) {
        return {
          ...defaultState(),
          ...parsed,
          club: { ...defaultClubInput(), ...parsed.club },
          email: { ...defaultState().email, ...parsed.email },
        };
      }
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return defaultState();
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function ClubRevenueCard({ project }: { project: PatternProject }) {
  const { toast } = useToast();
  const [stored, setStored] = useState(() => loadStored());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [stored]);

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
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied to clipboard' });
    } catch {
      toast({ title: 'Select and copy manually' });
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
          <Receipt className="h-5 w-5" /> Club Revenue Model
        </CardTitle>
        <CardDescription>
          A pattern club is a subscription business, not a price copied off a competitor's page. This models twelve
          months of churn and signups against real costs, tells you how many members you need to breakeven, audits
          your premium tier, and writes the founding-member launch email. Benchmarks: 65%–78% 3-month retention,
          25–35% annual churn for small creators, the $12/hr professional floor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ---------------------------------------------------------------- */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Membership &amp; churn</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-mm">
                Monthly members
              </Label>
              <Input
                id="cr-mm"
                type="number"
                className="h-9"
                value={stored.club.monthlyMembers}
                onChange={(e) => setClub({ monthlyMembers: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-am">
                Annual members
              </Label>
              <Input
                id="cr-am"
                type="number"
                className="h-9"
                value={stored.club.annualMembers}
                onChange={(e) => setClub({ annualMembers: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-mp">
                Monthly price ($)
              </Label>
              <Input
                id="cr-mp"
                type="number"
                className="h-9"
                value={stored.club.monthlyPrice}
                onChange={(e) => setClub({ monthlyPrice: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-ap">
                Annual price ($)
              </Label>
              <Input
                id="cr-ap"
                type="number"
                className="h-9"
                value={stored.club.annualPrice}
                onChange={(e) => setClub({ annualPrice: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-new">
                New signups/mo
              </Label>
              <Input
                id="cr-new"
                type="number"
                className="h-9"
                value={stored.club.newMembersPerMonth}
                onChange={(e) => setClub({ newMembersPerMonth: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="cr-churn">
                Monthly churn (%)
              </Label>
              <Input
                id="cr-churn"
                type="number"
                className="h-9"
                value={stored.club.monthlyChurnPct}
                onChange={(e) => setClub({ monthlyChurnPct: Number(e.target.value) })}
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
                onChange={(e) => setClub({ directCostPerPattern: Number(e.target.value) })}
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
                onChange={(e) => setClub({ monthlyOverhead: Number(e.target.value) })}
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
                onChange={(e) => setClub({ marketingSpendPerMonth: Number(e.target.value) })}
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
                onChange={(e) => setClub({ hoursPerPattern: Number(e.target.value) })}
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
                onChange={(e) => setClub({ adminHoursPerMonth: Number(e.target.value) })}
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
                onChange={(e) => setClub({ premiumMembers: Number(e.target.value) })}
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
                onChange={(e) => setClub({ premiumPrice: Number(e.target.value) })}
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
                onChange={(e) => setClub({ premiumHoursPerMonth: Number(e.target.value) })}
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
                onChange={(e) => setClub({ monthlyNoticeDays: Number(e.target.value) })}
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
                  aria-label="Copy email"
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
