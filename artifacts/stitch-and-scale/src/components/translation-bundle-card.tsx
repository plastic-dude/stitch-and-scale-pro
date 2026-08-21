import { copyTextOrThrow } from '@/lib/clipboard';
/**
 * Translation & Bundle Revenue Planner (CHK-015)
 *
 * Two channels no designer tooling covers, wired to the same card conventions:
 *
 * TRANSLATION PLANNING — Ravelry makes translations derivative works (only the
 * designer can add them), and buyers won't pay for patterns they can't read.
 * Each language unlocked is revenue unlocked. Costed on cited market pricing
 * (Knitlingo $0.01/word automated+human-reviewed; human specialists pricier
 * but include conversion/formatting; repeated size sections billable at a
 * discount). Each language gets a cost, added monthly net, payback months,
 * break-even copies, and a worthIt flag (pays back within 24 months).
 *
 * BUNDLE PLANNING — Coalition bundles (Knit for Me 2020: 56 patterns $27)
 * discount 80–90% and split revenue. Modeled against the designer's own solo
 * window baseline so bundling is only recommended when it beats selling solo.
 *
 * Persists inputs in localStorage under a project-scoped key.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { useProjectStorage, useProjectStorageState } from '@/lib/storage-lib';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getToastCopy, type ToastCopy } from '@/lib/toast-copy';
import { useSettings } from '@/context/SettingsContext';
import { translationBundlePartnersEmptyState } from '@/lib/translation-bundle-copy';
import {
  planTranslations,
  planBundle,
  generateBundlePitch,
  TranslationInput,
  LanguageMarket,
  BundlePattern,
} from '@/lib/translation-bundle-planner';
import { PatternProject } from '@/lib/grading-engine';
import { Languages, Package, ClipboardCopy, Globe, Trash2 } from 'lucide-react';

interface StoredState {
  translation?: {
    wordCount: number;
    repeatedWords: number;
    perWordRate: number;
    repeatDiscount: number;
    fixedFees: number;
    homeMonthlyCopies: number;
    pricePerCopy: number;
    channelFeeRate: number;
  };
  markets?: LanguageMarket[];
  bundle?: {
    bundlePrice: number;
    expectedUnits: number;
    channelFeeRate: number;
    hostFeeRate: number;
    splitMode: 'equal' | 'perPattern';
    designerCount: number;
    partners?: { name: string; retailPrice: number; soloWindowCopies: number }[];
  };
}

// CHK-152: pure derivation over the raw stored value — takes no handle, so
// it can never reach for a freshly-created handle inside an initializer.
function loadStored(raw: StoredState | null): StoredState {
  try {
    if (raw && typeof raw === 'object') return raw as StoredState;
  } catch {
    /* storage unreadable — start fresh */
  }
  return {};
}

function CopyLine({ text, tc, ls }: { text: string; tc: ToastCopy; ls: LabStatCopy }) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await copyTextOrThrow(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast({ title: tc.copied, description: tc.copiedDescription });
    } catch {
      toast({ title: tc.copyFailed, description: tc.selectManually });
    }
  };
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={copy} aria-label={ls.copyText}>
        <ClipboardCopy className="w-3.5 h-3.5 mr-1" /> {copied ? 'Copied!' : 'Copy'}
      </Button>
    </div>
  );
}

const DEFAULT_MARKETS: LanguageMarket[] = [
  { code: 'de', label: 'German', demandShare: 0.5, upliftFactor: 0.3 },
  { code: 'fr', label: 'French', demandShare: 0.4, upliftFactor: 0.25 },
  { code: 'es', label: 'Spanish', demandShare: 0.45, upliftFactor: 0.3 },
  { code: 'it', label: 'Italian', demandShare: 0.3, upliftFactor: 0.2 },
  { code: 'nl', label: 'Dutch', demandShare: 0.25, upliftFactor: 0.2 },
  { code: 'da', label: 'Danish', demandShare: 0.2, upliftFactor: 0.25 },
  { code: 'no', label: 'Norwegian', demandShare: 0.2, upliftFactor: 0.25 },
  { code: 'pt', label: 'Portuguese', demandShare: 0.3, upliftFactor: 0.2 },
  { code: 'ja', label: 'Japanese', demandShare: 0.35, upliftFactor: 0.35 },
];

export function TranslationBundleCard({ project }: { project: PatternProject }) {
  // issue #4 project seam (S018/S042): one scoped store per project; the
  // legacy flat key 'stitch-and-scale-translation-bundle' was projectId-partitioned
  // (projects shared one blob, silently colliding). Read-once migration folds
  // this project's partition into the scoped key, then removes the flat key.
  // CHK-152 (QUEUE-010): handle now comes from the shared seam — stable by
  // key string across re-renders and HMR module re-evaluation, instead of a
  // useMemo that built a fresh handle on every module re-run.
  const handle = useProjectStorage<StoredState>('translate', project.id, ['stitch-and-scale-translation-bundle'], { partition: true });
  const { toast } = useToast();
  const { language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const tc = getToastCopy(language);
  // CHK-152: stored comes from a memoized derivation over the stable seam
  // handle — never from a lazy initializer touching a handle (the crash
  // class). Mutations persist through the seam's write-on-change effect.
  const [stored, setStored] = useProjectStorageState(handle, (raw) => loadStored(raw));
  const [wordCount, setWordCount] = React.useState(stored.translation?.wordCount ?? 2000);
  const [repeatedWords, setRepeatedWords] = React.useState(stored.translation?.repeatedWords ?? 400);
  const [perWordRate, setPerWordRate] = React.useState(stored.translation?.perWordRate ?? 0.01);
  const [repeatDiscount, setRepeatDiscount] = React.useState(stored.translation?.repeatDiscount ?? 0.5);
  const [fixedFees, setFixedFees] = React.useState(stored.translation?.fixedFees ?? 10);
  const [homeMonthlyCopies, setHomeMonthlyCopies] = React.useState(stored.translation?.homeMonthlyCopies ?? 20);
  const [pricePerCopy, setPricePerCopy] = React.useState(stored.translation?.pricePerCopy ?? 8);
  const [channelFeeRate, setChannelFeeRate] = React.useState(stored.translation?.channelFeeRate ?? 0.15);
  const [markets, setMarkets] = React.useState<LanguageMarket[]>(stored.markets ?? DEFAULT_MARKETS);

  const [bundlePrice, setBundlePrice] = React.useState(stored.bundle?.bundlePrice ?? 9);
  const [expectedUnits, setExpectedUnits] = React.useState(stored.bundle?.expectedUnits ?? 100);
  const [bundleChannelFeeRate, setBundleChannelFeeRate] = React.useState(stored.bundle?.channelFeeRate ?? 0.15);
  const [hostFeeRate, setHostFeeRate] = React.useState(stored.bundle?.hostFeeRate ?? 0);
  const [splitMode, setSplitMode] = React.useState<'equal' | 'perPattern'>(stored.bundle?.splitMode ?? 'perPattern');
  const [designerCount, setDesignerCount] = React.useState(stored.bundle?.designerCount ?? 2);
  const [partners, setPartners] = React.useState<{ name: string; retailPrice: number; soloWindowCopies: number }[]>(
    Array.isArray(stored.bundle?.partners)
      ? stored.bundle!.partners!.slice(0, 3).map(p => ({ name: p.name || '', retailPrice: p.retailPrice ?? 8, soloWindowCopies: p.soloWindowCopies ?? 5 }))
      : []
  );
  const updatePartner = (i: number, patch: Partial<{ name: string; retailPrice: number; soloWindowCopies: number }>) =>
    setPartners(prev => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const addPartner = () =>
    setPartners(prev => (prev.length >= 3 ? prev : [...prev, { name: '', retailPrice: 8, soloWindowCopies: 5 }]));
  const removePartner = (i: number) => setPartners(prev => prev.filter((_, idx) => idx !== i));

  const [patternName, setPatternName] = React.useState(project.name || '');
  const [patternRetail, setPatternRetail] = React.useState(8);
  const [patternSoloCopies, setPatternSoloCopies] = React.useState(5);

  // CHK-152: persistence owned by the seam's state hook — one stable effect
  // keyed on the scoped-key string, replacing the 17-field write effect
  // that re-ran through a freshly-created handle on every HMR module re-run.
  React.useEffect(() => {
    setStored({
      translation: { wordCount, repeatedWords, perWordRate, repeatDiscount, fixedFees, homeMonthlyCopies, pricePerCopy, channelFeeRate },
      markets,
      bundle: { bundlePrice, expectedUnits, channelFeeRate: bundleChannelFeeRate, hostFeeRate, splitMode, designerCount, partners },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordCount, repeatedWords, perWordRate, repeatDiscount, fixedFees, homeMonthlyCopies, pricePerCopy, channelFeeRate, markets, bundlePrice, expectedUnits, bundleChannelFeeRate, hostFeeRate, splitMode, designerCount, partners]);

  const translationInput: TranslationInput = {
    wordCount,
    repeatedWords,
    perWordRate,
    repeatDiscount,
    fixedFees,
    homeMonthlyCopies,
    pricePerCopy,
    channelFeeRate,
    markets,
  };
  const translationOutcome = planTranslations(translationInput);

  const toggleMarket = (code: string) => {
    setMarkets(prev =>
      prev.find(m => m.code === code) ? prev.filter(m => m.code !== code) : [...prev, DEFAULT_MARKETS.find(m => m.code === code)!]
    );
  };

  const bundlePatterns: BundlePattern[] = [
    { name: patternName || 'My pattern', mine: true, retailPrice: patternRetail, soloWindowCopies: patternSoloCopies },
    ...partners
      .filter(p => (p.name || '').trim())
      .map(p => ({ name: p.name.trim(), mine: false, retailPrice: p.retailPrice, soloWindowCopies: p.soloWindowCopies })),
  ];
  const bundleOutcome = planBundle({
    patterns: bundlePatterns,
    bundlePrice,
    expectedUnits,
    channelFeeRate: bundleChannelFeeRate,
    hostFeeRate,
    splitMode,
    designerCount,
  });
  const pitch = generateBundlePitch({
    patterns: bundlePatterns,
    bundlePrice,
    expectedUnits,
    channelFeeRate: bundleChannelFeeRate,
    hostFeeRate,
    splitMode,
    designerCount,
  });

  const fmt$ = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const num = (v: number, set: (n: number) => void, label: string, min?: number, max?: number, step?: number) => (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      placeholder={ls.zeroPlaceholder}
      value={Number.isFinite(v) ? v : 0}
      onChange={e => {
        const n = parseFloat(e.target.value);
        set(Number.isFinite(n) ? n : 0);
        toast({ title: `${label} ${tc.updated}` });
      }}
      data-testid={`tb-${label.toLowerCase().replace(/[^a-z]/g, '-')}`}
    />
  );

  return (
    <Card className="border-card-border bg-card">
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Globe className="w-5 h-5 text-accent" />
          Translation & Bundle Planner
        </CardTitle>
        <CardDescription>
          The two channels every designer underuses. Unlock languages buyers actually read — translations are
          derivative works, so only you control them and every language pays for itself when it breaks even. And
          before you join any coalition bundle, check the bundle against your own solo baseline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ============ TRANSLATION PLANNING ============ */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg flex items-center gap-2">
            <Languages className="w-4 h-4 text-accent" /> Unlock a language
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Pattern word count</Label>
              {num(wordCount, setWordCount, 'word count')}
              <p className="text-[11px] text-muted-foreground">Prose + abbreviations; a sweater is typically 1,500–3,000 words.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Repeated size-section words</Label>
              {num(repeatedWords, setRepeatedWords, 'repeated words')}
              <p className="text-[11px] text-muted-foreground">Billable at a discount — translators commonly halve them.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Per-word rate ($)</Label>
              {num(perWordRate, setPerWordRate, 'per-word rate', 0, 1, 0.001)}
              <p className="text-[11px] text-muted-foreground">$0.01 automated+reviewed (Knitlingo) — human specialists cost more.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Repeat-section discount</Label>
              {num(repeatDiscount, setRepeatDiscount, 'repeat discount', 0, 1, 0.05)}
              <p className="text-[11px] text-muted-foreground">0.5 = half price on repeated words.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fixed fees ($)</Label>
              {num(fixedFees, setFixedFees, 'fixed fees')}
              <p className="text-[11px] text-muted-foreground">Conversion/formatting/upload help, if charged separately.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Home monthly copies</Label>
              {num(homeMonthlyCopies, setHomeMonthlyCopies, 'home monthly copies')}
              <p className="text-[11px] text-muted-foreground">Steady sales of this pattern in your home language.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Price per copy ($)</Label>
              {num(pricePerCopy, setPricePerCopy, 'price per copy')}
              <p className="text-[11px] text-muted-foreground">Same price in all languages (default) or edit per market.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Channel fee</Label>
              {num(channelFeeRate, setChannelFeeRate, 'channel fee', 0, 1, 0.01)}
              <p className="text-[11px] text-muted-foreground">e.g. 0.15 Ravelry — all language versions ride one listing.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Markets to consider</Label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_MARKETS.map(m => {
                const active = !!markets.find(x => x.code === m.code);
                return (
                  <button
                    key={m.code}
                    type="button"
                    onClick={() => toggleMarket(m.code)}
                    className={
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ' +
                      (active ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border/60 hover:border-primary/40')
                    }
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">Uplift = share of your current monthly copies the market can add at steady state; demand share = how much of that uplift lands in this market.</p>
          </div>

          {markets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-1.5 pr-3 font-medium">Language</th>
                    <th className="py-1.5 pr-3 font-medium">Cost</th>
                    <th className="py-1.5 pr-3 font-medium">Added copies/mo</th>
                    <th className="py-1.5 pr-3 font-medium">Added net/mo</th>
                    <th className="py-1.5 pr-3 font-medium">Break-even copies</th>
                    <th className="py-1.5 pr-3 font-medium">Payback (months)</th>
                    <th className="py-1.5 pr-3 font-medium">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {translationOutcome.rows.map(row => (
                    <tr key={row.market.code} className="border-b border-border/40">
                      <td className="py-1.5 pr-3">{row.market.label}</td>
                      <td className="py-1.5 pr-3">{fmt$(row.cost)}</td>
                      <td className="py-1.5 pr-3">{row.addedMonthlyCopies}</td>
                      <td className="py-1.5 pr-3">{fmt$(row.addedMonthlyNet)}</td>
                      <td className="py-1.5 pr-3">{Number.isFinite(row.breakEvenCopies) ? row.breakEvenCopies : '—'}</td>
                      <td className="py-1.5 pr-3">{Number.isFinite(row.paybackMonths) ? row.paybackMonths : 'never'}</td>
                      <td className="py-1.5 pr-3">
                        <Badge variant={row.worthIt ? 'default' : 'secondary'} className={row.worthIt ? 'bg-accent text-accent-foreground' : ''}>
                          {row.worthIt ? 'Worth it' : 'Skip'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {markets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Portfolio cost (worthwhile only)</p>
                <p className="text-lg font-semibold">{fmt$(translationOutcome.totalCost)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Added monthly net</p>
                <p className="text-lg font-semibold">{fmt$(translationOutcome.addedMonthlyNet)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Portfolio payback</p>
                <p className="text-lg font-semibold">
                  {Number.isFinite(translationOutcome.portfolioPaybackMonths) ? `${translationOutcome.portfolioPaybackMonths} mo` : 'never'}
                </p>
              </div>
            </div>
          )}

          {translationOutcome.priorityOrder.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Translate first, in order: {translationOutcome.priorityOrder.map((c, i) => {
                const lab = markets.find(m => m.code === c)?.label ?? c;
                return `${i + 1}. ${lab}`;
              }).join(' · ')} — ranked by fastest payback.
            </p>
          )}
        </div>

        <div className="border-t border-border" />

        {/* ============ BUNDLE PLANNING ============ */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg flex items-center gap-2">
            <Package className="w-4 h-4 text-accent" /> Bundle sanity check
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">My pattern name</Label>
              <Input value={patternName} onChange={e => setPatternName(e.target.value)} placeholder={ls.patternNamePlaceholder} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">My retail price ($)</Label>
              {num(patternRetail, setPatternRetail, 'retail price')}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Solo copies in bundle window</Label>
              {num(patternSoloCopies, setPatternSoloCopies, 'solo copies')}
              <p className="text-[11px] text-muted-foreground">What you'd sell solo during the same window if you don't bundle.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Bundle price ($)</Label>
              {num(bundlePrice, setBundlePrice, 'bundle price')}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Expected bundle units</Label>
              {num(expectedUnits, setExpectedUnits, 'expected units')}
              <p className="text-[11px] text-muted-foreground">Combined coalition audience — ask the organiser for list size.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Channel fee</Label>
              {num(bundleChannelFeeRate, setBundleChannelFeeRate, 'channel fee', 0, 1, 0.01)}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Bundle host fee</Label>
              {num(hostFeeRate, setHostFeeRate, 'host fee', 0, 1, 0.01)}
              <p className="text-[11px] text-muted-foreground">e.g. 0.05 if the coalition uses a bundle platform.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Split mode</Label>
              <div className="flex gap-1.5 flex-wrap">
                {(['perPattern', 'equal'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSplitMode(m)}
                    className={
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ' +
                      (splitMode === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border/60 hover:border-primary/40')
                    }
                  >
                    {m === 'equal' ? 'Equal per designer' : 'By retail weight'}
                  </button>
                ))}
              </div>
            </div>
            {splitMode === 'equal' && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Designer count</Label>
                {num(designerCount, setDesignerCount, 'designer count', 1, 100, 1)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Partner patterns (the coalition's other picks)</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={partners.length >= 3}
                onClick={addPartner}
                aria-label={ls.addPartnerPattern}
              >
                + Partner pattern{partners.length >= 3 ? ' (max 3)' : ''}
              </Button>
            </div>
            {partners.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                {translationBundlePartnersEmptyState(language)}
              </p>
            )}
            {partners.map((p, i) => (
              <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-md border border-border/60 p-2">
                <div className="col-span-5 space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Pattern name *</Label>
                  <Input
                    value={p.name}
                    onChange={e => updatePartner(i, { name: e.target.value })}
                    placeholder={ls.lunaWrapPlaceholder}
                    aria-label={`Partner pattern ${i + 1} name`}
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Their retail ($)</Label>
                  {num(p.retailPrice, v => updatePartner(i, { retailPrice: v }), 'partner retail', 0, 1000, 0.01)}
                </div>
                <div className="col-span-3 space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Solo copies</Label>
                  {num(p.soloWindowCopies, v => updatePartner(i, { soloWindowCopies: v }), 'partner solo copies', 0, 100000, 1)}
                </div>
                <div className="col-span-1 flex justify-end pb-1">
                  <button
                    type="button"
                    onClick={() => removePartner(i)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Remove partner pattern ${i + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Discount depth vs solo retail</p>
              <p className="text-lg font-semibold">{Math.round(bundleOutcome.discountDepth * 100)}%</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">My share of bundle net</p>
              <p className="text-lg font-semibold">{fmt$(bundleOutcome.myDesignerShare)}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">My solo baseline</p>
              <p className="text-lg font-semibold">{fmt$(bundleOutcome.mySoloBaseline)}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Incremental vs solo</p>
              <p className={'text-lg font-semibold ' + (bundleOutcome.incrementalVsSolo >= 0 ? 'text-accent' : 'text-destructive')}>
                {fmt$(bundleOutcome.incrementalVsSolo)}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border p-3 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={
                bundleOutcome.verdict === 'great' || bundleOutcome.verdict === 'good' ? 'default' : 'secondary'
              } className={
                bundleOutcome.verdict === 'great' || bundleOutcome.verdict === 'good'
                  ? 'bg-accent text-accent-foreground uppercase'
                  : 'uppercase'
              }>
                {bundleOutcome.verdict}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{bundleOutcome.verdictReason}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium">Paste-ready pitch to coalition designers</p>
            <pre className="text-xs whitespace-pre-wrap rounded-lg bg-secondary/30 p-3 border border-border max-h-64 overflow-y-auto">
              {pitch}
            </pre>
            <CopyLine text={pitch} tc={tc}  ls={ls} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
