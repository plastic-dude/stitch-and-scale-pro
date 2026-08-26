import React, { useState, useEffect } from 'react';
import { InstallBanner } from '@/components/install-banner';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useSettings, SizingStandard } from '@/context/SettingsContext';
import { useProjects } from '@/context/ProjectsContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TAB_COUNT } from '@/lib/tab-registry';
import {
  HardDrive,
  DatabaseBackup,
  ShieldCheck,
  Calculator,
  Scissors,
  Layers,
  Ruler,
  FileText,
  Eye,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';
import { getSampleCrewNeckSweater, getSampleBasicBeanie } from '@/lib/sample-projects';

const TOTAL_STEPS = 7;

// ─── Leftovers ────────────────────────────────────────────────────────────────

/**
 * @deprecated Philosophy cards were removed in CHK-127 but left in the file as inert
 * placeholders. Removing them now to keep the bundle clean and onboarding focused.
 */
// PHILOSOPHY_CARDS removed

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepDots({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total} aria-label={label}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i + 1 === current ? 'w-6 bg-accent' : i + 1 < current ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-border',
          )}
        />
      ))}
    </div>
  );
}

// ─── STEP 1: Welcome ──────────────────────────────────────────────────────────

function StepWelcome() {
  const { t } = useSettings();
  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <picture>
        <source srcSet="/app-logo.webp" type="image/webp" />
        <img
          src="/app-logo.png"
          alt="Stitch & Scale"
          className="w-28 h-28 rounded-3xl object-cover mb-8 shadow-xl"
          style={{ rotate: '2deg' }}
        />
      </picture>
      <h1 className="text-4xl font-serif font-semibold text-foreground mb-4 tracking-tight leading-tight">
        {t('workflow.welcome.title')}
      </h1>
      <p className="text-muted-foreground text-base mb-8 leading-relaxed">
        {t('workflow.welcome.description')}
      </p>
      <ul className="text-left space-y-3 w-full bg-secondary/20 rounded-2xl p-5 border border-border/40 mb-4">
        {[
          t('workflow.welcome.localFirst'),
          t('workflow.welcome.offline'),
          t('workflow.welcome.ownership'),
          t('workflow.welcome.pdf'),
        ].map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-foreground/80">
            <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        {t('workflow.welcome.cloud')}
      </p>
    </div>
  );
}

// ─── STEP 2: Philosophy ───────────────────────────────────────────────────────

const PHILOSOPHY_CARDS = [
  // All philosophy copy is localized; see StepPhilosophy below.
];

function StepPhilosophy() {
  const { t } = useSettings();
  const philosophyCards = [
    // Step content localized below; PHILOSOPHY_CARDS removed.
  { icon: HardDrive, title: t('workflow.philosophy.localTitle'), body: t('workflow.philosophy.localBody') },
    { icon: DatabaseBackup, title: t('workflow.philosophy.cloudTitle'), body: t('workflow.philosophy.cloudBody') },
    { icon: ShieldCheck, title: t('workflow.philosophy.dataTitle'), body: t('workflow.philosophy.dataBody') },
    { icon: Calculator, title: t('workflow.philosophy.mathTitle'), body: t('workflow.philosophy.mathBody') },
  ];
  return (
    <div className="flex flex-col items-center text-center max-w-lg mx-auto">
        <h2 className="text-3xl font-serif font-semibold mb-2 tracking-tight">{t('workflow.onboarding.principlesTitle')}</h2>
      <p className="text-muted-foreground text-sm mb-8">{t('workflow.onboarding.principlesDescription')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
        {philosophyCards.map(({ icon: Icon, title, body }) => (
          <div key={title} className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STEP 3: Sizing Standard ──────────────────────────────────────────────────

// Before building any of the unavailable standards below, read this:
//
// CYC has a real, single, official body-measurement chart (verified
// directly against craftyarncouncil.com - see SIZE_STANDARDS in
// grading-engine.ts). The others are NOT the same kind of gap:
//
// - 'UK' has no CYC-equivalent official body. Every UK-focused knitting
//   resource checked either explicitly varies "brand from brand" (not a
//   real standard) or states outright that it just uses CYC's chart
//   directly. There is nothing authoritative to source here as written.
// - 'EN13402' is a real official European standard, but it's fundamentally
//   a garment LABEL-coding system (what number goes on a size tag), not a
//   body-measurement chart for grading. It does have body-measurement
//   annexes that could theoretically be sourced, but that's real
//   additional research, not the same lookup CYC was. Also worth noting:
//   the 'UK' entry below cites "BS EN 13402" in its own description,
//   meaning UK and EN13402 may not actually be two independent standards
//   in practice - possibly the same family, adopted by two different
//   national bodies. Worth resolving before building both separately.
// - The most credible non-CYC resource found (Ysolda's knitwear sizing
//   chart, actively used industry-wide, size-inclusive, kept current) is
//   a respected individual designer's compiled community resource, not an
//   official standards body - a legitimate option to integrate, but a
//   different kind of decision than "add the official chart."
//
// None of this is a reason not to build these eventually - it's a reason
// not to fabricate a chart from weak sourcing just to fill the gap, which
// is exactly what happened to the CYC table before it was reconciled.
const SIZING_STANDARDS: { id: SizingStandard; labelKey: string; descKey: string; available: boolean }[] = [
  { id: 'CYC',       labelKey: 'workflow.onboarding.standard.cyc.label',    descKey: 'workflow.onboarding.standard.cyc.desc', available: true },
  { id: 'Custom',    labelKey: 'workflow.onboarding.standard.custom.label', descKey: 'workflow.onboarding.standard.custom.desc', available: true },
  { id: 'UK',        labelKey: 'workflow.onboarding.standard.uk.label',     descKey: 'workflow.onboarding.standard.uk.desc', available: false },
  { id: 'EN13402',   labelKey: 'workflow.onboarding.standard.eu.label',     descKey: 'workflow.onboarding.standard.eu.desc', available: false },
  { id: 'Japanese',  labelKey: 'workflow.onboarding.standard.jp.label',     descKey: 'workflow.onboarding.standard.jp.desc', available: false },
  { id: 'Korean',    labelKey: 'workflow.onboarding.standard.kr.label',     descKey: 'workflow.onboarding.standard.kr.desc', available: false },
  { id: 'Chinese',   labelKey: 'workflow.onboarding.standard.cn.label',     descKey: 'workflow.onboarding.standard.cn.desc', available: false },
  { id: 'Australian',labelKey: 'workflow.onboarding.standard.au.label',     descKey: 'workflow.onboarding.standard.au.desc', available: false },
];

function StepSizingStandard({ sizingStandard, setSizingStandard }: { sizingStandard: SizingStandard; setSizingStandard: (s: SizingStandard) => void }) {
  const { t } = useSettings();
  const [showMore, setShowMore] = useState(false);
  const available = SIZING_STANDARDS.filter(s => s.available);
  const unavailable = SIZING_STANDARDS.filter(s => !s.available);

  const renderCard = ({ id, labelKey, descKey, available }: typeof SIZING_STANDARDS[number]) => (
    <button
      key={id}
      onClick={() => available ? setSizingStandard(id) : undefined}
      disabled={!available}
      aria-pressed={sizingStandard === id}
      className={cn(
        'w-full text-left rounded-xl border-2 px-4 py-3 transition-all duration-200 flex items-start justify-between gap-3',
        available
          ? sizingStandard === id
            ? 'border-primary bg-primary/5 shadow-sm'
            : 'border-border/60 hover:border-primary/30 hover:bg-secondary/10 cursor-pointer'
          : 'border-border/30 bg-muted/20 cursor-not-allowed opacity-50',
      )}
    >
      <div>
        <div className={cn('text-sm font-semibold', available ? 'text-foreground' : 'text-muted-foreground')}>
          {t(labelKey as any)}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{t(descKey as any)}</div>
      </div>
      {sizingStandard === id && available && (
        <div className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center mt-0.5">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      {!available && (
        <span className="shrink-0 text-[10px] font-medium text-muted-foreground/70 bg-muted/40 rounded-md px-1.5 py-0.5 mt-0.5">
          {t('workflow.onboarding.comingSoon')}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-serif font-semibold mb-2 tracking-tight">{t('workflow.onboarding.sizingTitle')}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t('workflow.onboarding.sizingDescription')}
        </p>
      </div>
      <div className="w-full space-y-2">
        {available.map(renderCard)}
      </div>

      {/* International standards collapsed by default - with two real, ready
          options above, a wall of six 'Coming soon' cards was pulling focus
          toward what's unavailable instead of what's actually usable today. */}
      <button
        type="button"
        onClick={() => setShowMore(v => !v)}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mt-4 py-2"
        data-testid="button-toggle-more-standards"
      >
        {showMore ? t('workflow.onboarding.hideMoreStandards') : t('workflow.onboarding.showMoreStandards', { count: unavailable.length })}
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showMore && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full overflow-hidden"
          >
            <div className="w-full space-y-2 pt-1">
              {unavailable.map(renderCard)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── STEP 4: Units ────────────────────────────────────────────────────────────

function StepUnits({ unit, setUnit }: { unit: 'in' | 'cm'; setUnit: (u: 'in' | 'cm') => void }) {
  const { t } = useSettings();
  return (
    <div className="flex flex-col items-center text-center max-w-sm mx-auto">
      <h2 className="text-3xl font-serif font-semibold mb-2 tracking-tight">{t('workflow.onboarding.unitsTitle')}</h2>
      <p className="text-muted-foreground text-sm mb-8">
        {t('workflow.onboarding.unitsDescription')}
      </p>
      <div className="grid grid-cols-2 gap-4 w-full">
        <button
          onClick={() => setUnit('in')}
          aria-pressed={unit === 'in'}
          className={cn(
            'flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all duration-200 cursor-pointer',
            unit === 'in'
              ? 'border-primary bg-primary/5 text-primary shadow-md'
              : 'border-border/60 text-muted-foreground hover:border-primary/30 hover:bg-secondary/10',
          )}
        >
          <span className="font-mono text-3xl font-bold">in</span>
          <span className="font-medium text-sm text-foreground">{t('workflow.onboarding.inches')}</span>
          <span className="text-xs text-muted-foreground">{t('workflow.onboarding.inchesDescription')}</span>
        </button>
        <button
          onClick={() => setUnit('cm')}
          aria-pressed={unit === 'cm'}
          className={cn(
            'flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all duration-200 cursor-pointer',
            unit === 'cm'
              ? 'border-primary bg-primary/5 text-primary shadow-md'
              : 'border-border/60 text-muted-foreground hover:border-primary/30 hover:bg-secondary/10',
          )}
        >
          <span className="font-mono text-3xl font-bold">cm</span>
          <span className="font-medium text-sm text-foreground">{t('workflow.onboarding.centimeters')}</span>
          <span className="text-xs text-muted-foreground">{t('workflow.onboarding.centimetersDescription')}</span>
        </button>
      </div>
    </div>
  );
}

// ─── STEP 5: Workspace Tour ───────────────────────────────────────────────────

const TOUR_ITEMS = [Layers, Scissors, Ruler, Eye, ShieldCheck];

function StepWorkspaceTour() {
  const { t } = useSettings();
  const tourKeys = [
    ['workflow.onboarding.tour.dashboard', 'workflow.onboarding.tour.dashboardDescription'],
    ['workflow.onboarding.tour.search', 'workflow.onboarding.tour.searchDescription'],
    ['workspace.tab.notes', 'workspace.editor.notesDescription'],
    ['workspace.tab.preview', 'workflow.onboarding.tour.previewDescription'],
    ['workflow.onboarding.tour.integrity', 'workflow.onboarding.tour.integrityDescription'],
  ] as const;
  return (
    <div className="flex flex-col items-center max-w-lg mx-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-serif font-semibold mb-2 tracking-tight">{t('workflow.onboarding.howTitle')}</h2>
        <p className="text-muted-foreground text-sm">{t('workflow.onboarding.howDescription')}</p>
      </div>
      <div className="w-full space-y-3">
        {TOUR_ITEMS.map((Icon, i) => (
          <div key={tourKeys[i][0]} className="flex items-start gap-4 bg-card rounded-xl border border-border/50 px-4 py-3.5 shadow-sm">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-secondary/40 flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-accent/70">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-semibold text-sm text-foreground">{t(tourKeys[i][0])}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t(tourKeys[i][1], tourKeys[i][1] === 'workflow.onboarding.tour.searchDescription' ? { count: TAB_COUNT } : undefined)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STEP 6: Sample Journey ───────────────────────────────────────────────────

function StepSampleJourney({ onOpenSample, onSkip }: { onOpenSample: () => void; onSkip: () => void }) {
  const { t } = useSettings();
  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto">
      <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
        <Scissors className="w-10 h-10 text-accent" />
      </div>
      <h2 className="text-3xl font-serif font-semibold mb-3 tracking-tight">{t('workflow.onboarding.actionTitle')}</h2>
      <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
        {t('workflow.onboarding.sampleDescription')}
      </p>
      <div className="bg-card rounded-2xl border border-border/60 p-5 mb-8 text-left w-full shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">{t('workflow.onboarding.sampleName')}</div>
            <div className="text-xs text-muted-foreground">{t('workflow.onboarding.sampleMeta')}</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          {t('workflow.onboarding.sampleDetails')}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button
          onClick={onOpenSample}
          className="flex-1 h-11 rounded-full font-medium shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t('workflow.onboarding.openSample')}
        </Button>
        <Button
          onClick={onSkip}
          variant="outline"
          className="flex-1 h-11 rounded-full font-medium"
        >
          {t('workflow.onboarding.createOwn')}
        </Button>
      </div>
    </div>
  );
}

// ─── STEP 7: Completion ───────────────────────────────────────────────────────

function StepCompletion({ onFinish }: { onFinish: () => void }) {
  const { t } = useSettings();
  return (
    <div className="flex flex-col items-center text-center max-w-sm mx-auto">
      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-8 shadow-lg"
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.25 }}
        >
          <Check className="w-10 h-10 text-primary-foreground" />
        </motion.div>
      </motion.div>
      <h2 className="text-3xl font-serif font-semibold mb-3 tracking-tight">{t('workflow.onboarding.readyTitle')}</h2>
      <p className="text-muted-foreground text-base mb-2 leading-relaxed">
        {t('workflow.onboarding.readyDescription')}
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        {t('workflow.onboarding.deviceSyncHint')}
      </p>
      <p className="text-xs text-muted-foreground mb-10">
        {t('workflow.onboarding.restartHint')}
      </p>
      <Button
        onClick={onFinish}
        size="lg"
        className="rounded-full px-10 h-12 font-medium shadow-md bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {t('workflow.onboarding.draftPattern')} <ChevronRight className="ml-2 w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Main Overlay ─────────────────────────────────────────────────────────────

export default function OnboardingOverlay() {
  const { unit, setUnit, sizingStandard, setSizingStandard, setOnboardingCompleted, t, language } = useSettings();
  const { projects, createProject } = useProjects();
  const [location, setLocation] = useLocation();

  // CHK-127 — remember the entry route the overlay mounted on. When the
  // visitor skips setup from a deep link (e.g. the demo /project/:id),
  // they must land back on the page they asked for instead of being
  // rerouted to Draft a Pattern and losing the link entirely.
  const [entryRoute] = useState(() => location);

  const [step, setStep] = useState(1);
  const stepKey: 'workflow.overlay.begin' | 'workflow.overlay.continue' = step === 1 ? 'workflow.overlay.begin' : 'workflow.overlay.continue';
  const [localUnit, setLocalUnit] = useState<'in' | 'cm'>(unit);
  const [localStandard, setLocalStandard] = useState<SizingStandard>(sizingStandard);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  // Detect browser locale for unit default on first open
  useEffect(() => {
    try {
      const lang = navigator.language || 'en-US';
      if (!lang.startsWith('en-US') && !lang.startsWith('en-GB')) {
        setLocalUnit('cm');
      }
    } catch {}
  }, []);

  const completeOnboarding = () => {
    setUnit(localUnit);
    setSizingStandard(localStandard);
    setOnboardingCompleted(true);
    setLocation('/project/new');
  };

  // FIX #33 (QA, Aug 2026): skipping setup from a deep link (e.g. /project/:id with a
  // missing id) used to strand new users on "Project Not Found" with no escape, because
  // the overlay dismissed without changing location and without creating any project.
  // CHK-127 — skipping also used to DROP the requested deep link: on a fresh context the
  // demo project seeds synchronously (ProjectsContext), so `hasProject` was already true
  // and skip rerouted to /project/new. The visitor who opened the demo link never saw the
  // demo — reproducible at every mobile width. Now skip preserves the entry route the
  // overlay mounted on; only a plain root entry falls back to Draft a Pattern.
  const skipOnboarding = () => {
    setUnit(localUnit);
    setSizingStandard(localStandard);
    setOnboardingCompleted(true);
    const now = new Date().toISOString();
    const hasProject = projects.length > 0;
    if (!hasProject) {
      createProject(getSampleCrewNeckSweater(language), 'sample');
      createProject(getSampleBasicBeanie(language), 'sample');
    }
    // Preserve the deep link the visitor opened: skip returns to the entry route
    // unless it was the app root, which has no content without a project flow.
    setLocation(/^\/project\//.test(entryRoute) ? entryRoute : '/project/new');
  };

  const goNext = () => {
    setDirection('forward');
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection('back');
    setStep(s => Math.max(s - 1, 1));
  };

  const handleOpenSample = () => {
    setUnit(localUnit);
    setSizingStandard(localStandard);
    const alreadySeeded = projects.some(p => p.id === 'sample-crew-neck-sweater');
    if (!alreadySeeded && projects.length === 0) {
      createProject(getSampleCrewNeckSweater(language), 'sample');
      createProject(getSampleBasicBeanie(language), 'sample');
    }
    setOnboardingCompleted(true);
    setLocation('/project/sample-crew-neck-sweater');
  };

  const handleCreateOwn = () => {
    setUnit(localUnit);
    setSizingStandard(localStandard);
    setOnboardingCompleted(true);
    setLocation('/project/new');
  };

  const variants = {
    enter: (dir: string) => ({ opacity: 0, x: dir === 'forward' ? 30 : -30 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: string) => ({ opacity: 0, x: dir === 'forward' ? -30 : 30 }),
  };

  const isLastStep = step === TOTAL_STEPS;
  const canGoBack = step > 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={t('workflow.onboarding.dialogLabel')}
    >
      {/* Header — right padding grows on phone widths so the Skip button
          never shares x-space with the app shell's nav links beneath it
          (mobile audit CHK-126: 29x24 overlap at 360px). */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/30 sm:pr-28">
        <div className="flex items-center gap-2.5">
          <picture>
            <source srcSet="/app-logo.webp" type="image/webp" />
            <img src="/app-logo.png" alt="Stitch & Scale" className="w-7 h-7 rounded-lg object-cover" />
          </picture>
          <span className="font-serif font-bold text-base tracking-tight hidden sm:inline">Stitch & Scale</span>
        </div>

        <StepDots current={step} total={TOTAL_STEPS} label={t('workflow.onboarding.progress', { current: step, total: TOTAL_STEPS })} />

        {step === 1 ? (
          <button
            onClick={skipOnboarding}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-secondary/30"
            aria-label={t('workflow.onboarding.skipSetup')}
          >
            <X className="w-3.5 h-3.5" />
            {t('workflow.onboarding.skipSetup')}
          </button>
        ) : (
          // Empty placeholder, same footprint as the button above, keeps
          // the step dots visually centered now that Skip is gone - it
          // was never meant to stay available past the first screen.
          <div className="w-[76px]" aria-hidden="true" />
        )}
      </div>

      {step === 1 && <InstallBanner trigger="onboarding" />}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-10 pb-48 sm:pb-10 flex items-start justify-center">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 1 && <StepWelcome />}
              {step === 2 && <StepPhilosophy />}
              {step === 3 && (
                <StepSizingStandard
                  sizingStandard={localStandard}
                  setSizingStandard={setLocalStandard}
                />
              )}
              {step === 4 && <StepUnits unit={localUnit} setUnit={setLocalUnit} />}
              {step === 5 && <StepWorkspaceTour />}
              {step === 6 && (
                <StepSampleJourney onOpenSample={handleOpenSample} onSkip={handleCreateOwn} />
              )}
              {step === 7 && <StepCompletion onFinish={completeOnboarding} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer nav — hidden on steps that have their own CTAs */}
      {step !== 6 && step !== 7 && (
        <div className="fixed bottom-0 left-0 right-0 px-6 pt-4 pb-6 sm:pb-4 border-t border-border/30 flex items-center justify-between bg-background/95 backdrop-blur-sm pb-[max(env(safe-area-inset-bottom),1.5rem)] z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            disabled={!canGoBack}
            className="font-medium text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('workflow.overlay.back')}
          </Button>

          <Button
            size="sm"
            onClick={goNext}
            className="rounded-full px-6 font-medium shadow-sm"
          >
            {t(stepKey)}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Keyboard nav for step 6 / 7 back button */}
      {(step === 6 || step === 7) && (
        <div className="fixed bottom-0 left-0 right-0 px-6 pt-4 pb-6 sm:pb-4 border-t border-border/30 flex items-center justify-start bg-background/95 backdrop-blur-sm pb-[max(env(safe-area-inset-bottom),1.5rem)] z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('workflow.overlay.back')}
          </Button>
        </div>
      )}
    </div>
  );
}
