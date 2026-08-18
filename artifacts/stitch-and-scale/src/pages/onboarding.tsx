import React, { useState, useEffect } from 'react';
import { InstallBanner } from '@/components/install-banner';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useSettings, SizingStandard } from '@/context/SettingsContext';
import { useProjects } from '@/context/ProjectsContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  HardDrive,
  Database,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Scissors,
  Layers,
  Ruler,
  FileText,
  Eye,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { SAMPLE_CREW_NECK_SWEATER, SAMPLE_BASIC_BEANIE } from '@/lib/sample-projects';

const TOTAL_STEPS = 7;

// Premium Progress Dashes
function ProgressDashes({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 w-full mt-8 mb-12">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 rounded-full transition-all duration-500 flex-1",
            i + 1 === current 
              ? "bg-accent" 
              : i + 1 < current 
                ? "bg-primary/40" 
                : "bg-border/40"
          )}
        />
      ))}
    </div>
  );
}

function StepWelcome() {
  const { t } = useSettings();
  return (
    <div className="flex flex-col items-start w-full">
      <div className="w-16 h-16 bg-primary-foreground text-primary rounded-3xl flex items-center justify-center shadow-lg mb-10 border border-border/20">
        <HardDrive className="w-8 h-8" strokeWidth={2} />
      </div>
      <h3 className="text-xs font-bold tracking-[0.2em] text-accent uppercase mb-3">Stitch & Scale</h3>
      <h2 className="text-[2.5rem] leading-[1.1] sm:text-5xl font-serif font-bold tracking-tight text-foreground mb-4">
        Private by design
      </h2>
      <p className="text-lg text-muted-foreground leading-relaxed font-medium mb-4 text-balance">
        Your projects stay on your device and remain available offline.
      </p>
    </div>
  );
}

function StepPhilosophy() {
  const { t } = useSettings();
  return (
    <div className="flex flex-col items-start w-full">
      <div className="w-16 h-16 bg-primary-foreground text-primary rounded-3xl flex items-center justify-center shadow-lg mb-10 border border-border/20">
        <ShieldCheck className="w-8 h-8" strokeWidth={2} />
      </div>
      <h3 className="text-xs font-bold tracking-[0.2em] text-accent uppercase mb-3">Math-Free</h3>
      <h2 className="text-[2.5rem] leading-[1.1] sm:text-5xl font-serif font-bold tracking-tight text-foreground mb-4">
        Grade without limits
      </h2>
      <p className="text-lg text-muted-foreground leading-relaxed font-medium mb-4 text-balance">
        Input your gauge and master measurements. The engine grades every size instantly.
      </p>
    </div>
  );
}

function StepSizingStandard({ sizingStandard, setSizingStandard }: { sizingStandard: SizingStandard, setSizingStandard: (s: SizingStandard) => void }) {
  return (
    <div className="flex flex-col items-start w-full">
      <h3 className="text-xs font-bold tracking-[0.2em] text-accent uppercase mb-3">Target Audience</h3>
      <h2 className="text-[2.5rem] leading-[1.1] font-serif font-bold tracking-tight text-foreground mb-6">
        Choose standard
      </h2>
      <div className="flex flex-col gap-3 w-full">
        {(['ASTM', 'CYCA', 'Custom'] as SizingStandard[]).map((std) => (
          <button
            key={std}
            onClick={() => setSizingStandard(std)}
            className={cn(
              "w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center justify-between",
              sizingStandard === std 
                ? "border-accent bg-accent/10" 
                : "border-border/40 hover:border-primary/30"
            )}
          >
            <span className="font-bold text-lg">{std}</span>
            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", sizingStandard === std ? "border-accent" : "border-muted-foreground/30")}>
              {sizingStandard === std && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepUnits({ unit, setUnit }: { unit: 'in' | 'cm', setUnit: (u: 'in' | 'cm') => void }) {
  return (
    <div className="flex flex-col items-start w-full">
      <h3 className="text-xs font-bold tracking-[0.2em] text-accent uppercase mb-3">Preferences</h3>
      <h2 className="text-[2.5rem] leading-[1.1] font-serif font-bold tracking-tight text-foreground mb-6">
        Measurement unit
      </h2>
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={() => setUnit('in')}
          className={cn(
            "w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center justify-between",
            unit === 'in' ? "border-accent bg-accent/10" : "border-border/40 hover:border-primary/30"
          )}
        >
          <span className="font-bold text-lg">Inches (in)</span>
          <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", unit === 'in' ? "border-accent" : "border-muted-foreground/30")}>
            {unit === 'in' && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
          </div>
        </button>
        <button
          onClick={() => setUnit('cm')}
          className={cn(
            "w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center justify-between",
            unit === 'cm' ? "border-accent bg-accent/10" : "border-border/40 hover:border-primary/30"
          )}
        >
          <span className="font-bold text-lg">Centimeters (cm)</span>
          <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", unit === 'cm' ? "border-accent" : "border-muted-foreground/30")}>
            {unit === 'cm' && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
          </div>
        </button>
      </div>
    </div>
  );
}

function StepWorkspaceTour() {
  return (
    <div className="flex flex-col items-start w-full">
      <div className="w-16 h-16 bg-primary-foreground text-primary rounded-3xl flex items-center justify-center shadow-lg mb-10 border border-border/20">
        <Layers className="w-8 h-8" strokeWidth={2} />
      </div>
      <h3 className="text-xs font-bold tracking-[0.2em] text-accent uppercase mb-3">Architecture</h3>
      <h2 className="text-[2.5rem] leading-[1.1] font-serif font-bold tracking-tight text-foreground mb-4">
        Multi-tier workspace
      </h2>
      <p className="text-lg text-muted-foreground leading-relaxed font-medium text-balance">
        Navigate seamlessly between Design, Fit, Pricing, and Launch modules via the top command bar.
      </p>
    </div>
  );
}

function StepSampleJourney({ onOpenSample, onSkip }: { onOpenSample: () => void, onSkip: () => void }) {
  return (
    <div className="flex flex-col items-start w-full">
      <h3 className="text-xs font-bold tracking-[0.2em] text-accent uppercase mb-3">Get Started</h3>
      <h2 className="text-[2.5rem] leading-[1.1] font-serif font-bold tracking-tight text-foreground mb-6">
        Explore a sample
      </h2>
      <p className="text-lg text-muted-foreground leading-relaxed font-medium mb-8 text-balance">
        Start with a pre-configured sweater or beanie to see how automatic grading works.
      </p>
      <div className="flex flex-col gap-3 w-full">
        <Button size="lg" onClick={onOpenSample} className="w-full text-base py-6 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90">
          Open Sample Project
        </Button>
        <Button variant="outline" size="lg" onClick={onSkip} className="w-full text-base py-6 rounded-xl font-bold border-border/40">
          Start from Scratch
        </Button>
      </div>
    </div>
  );
}

function StepCompletion({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-start w-full">
      <div className="w-16 h-16 bg-primary-foreground text-primary rounded-3xl flex items-center justify-center shadow-lg mb-10 border border-border/20">
        <FileText className="w-8 h-8" strokeWidth={2} />
      </div>
      <h3 className="text-xs font-bold tracking-[0.2em] text-accent uppercase mb-3">Ready</h3>
      <h2 className="text-[2.5rem] leading-[1.1] font-serif font-bold tracking-tight text-foreground mb-4">
        You are all set
      </h2>
      <p className="text-lg text-muted-foreground leading-relaxed font-medium mb-8 text-balance">
        Your offline workspace is ready. Export professional PDFs instantly.
      </p>
      <Button size="lg" onClick={onFinish} className="w-full text-base py-6 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">
        Enter Workspace <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
}

export default function OnboardingOverlay() {
  const { unit, setUnit, sizingStandard, setSizingStandard, setOnboardingCompleted } = useSettings();
  const { projects, createProject } = useProjects();
  const [location, setLocation] = useLocation();
  const [entryRoute] = useState(() => location);
  const [step, setStep] = useState(1);
  const [localUnit, setLocalUnit] = useState<'in' | 'cm'>(unit);
  const [localStandard, setLocalStandard] = useState<SizingStandard>(sizingStandard);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

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

  const skipOnboarding = () => {
    setUnit(localUnit);
    setSizingStandard(localStandard);
    setOnboardingCompleted(true);
    const now = new Date().toISOString();
    if (projects.length === 0) {
      createProject({ ...SAMPLE_CREW_NECK_SWEATER, createdAt: now, updatedAt: now });
      createProject({ ...SAMPLE_BASIC_BEANIE, createdAt: now, updatedAt: now });
    }
    setLocation(/^\/project\//.test(entryRoute) ? entryRoute : '/project/new');
  };

  const goNext = () => {
    setDirection('forward');
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleOpenSample = () => {
    setUnit(localUnit);
    setSizingStandard(localStandard);
    const alreadySeeded = projects.some(p => p.id === SAMPLE_CREW_NECK_SWEATER.id);
    if (!alreadySeeded && projects.length === 0) {
      const now = new Date().toISOString();
      createProject({ ...SAMPLE_CREW_NECK_SWEATER, createdAt: now, updatedAt: now });
      createProject({ ...SAMPLE_BASIC_BEANIE, createdAt: now, updatedAt: now });
    }
    setOnboardingCompleted(true);
    setLocation(`/project/${SAMPLE_CREW_NECK_SWEATER.id}`);
  };

  const variants = {
    enter: (dir: string) => ({ opacity: 0, x: dir === 'forward' ? 20 : -20 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: string) => ({ opacity: 0, x: dir === 'forward' ? -20 : 20 }),
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-between" role="dialog" aria-modal="true">
      {/* Top Header */}
      <div className="w-full max-w-md mx-auto px-6 py-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="Stitch & Scale" className="w-8 h-8 rounded-xl object-cover shadow-sm" />
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">By Emlux</span>
        </div>
        <button
          onClick={skipOnboarding}
          className="text-sm font-bold text-foreground hover:text-accent transition-colors px-3 py-1.5"
        >
          Skip
        </button>
      </div>

      {/* Main Center Content */}
      <div className="flex-1 w-full max-w-md mx-auto px-6 flex flex-col justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex flex-col"
          >
            {step === 1 && <StepWelcome />}
            {step === 2 && <StepPhilosophy />}
            {step === 3 && <StepSizingStandard sizingStandard={localStandard} setSizingStandard={setLocalStandard} />}
            {step === 4 && <StepUnits unit={localUnit} setUnit={setLocalUnit} />}
            {step === 5 && <StepWorkspaceTour />}
            {step === 6 && <StepSampleJourney onOpenSample={handleOpenSample} onSkip={completeOnboarding} />}
            {step === 7 && <StepCompletion onFinish={completeOnboarding} />}
            
            {step < 6 && <ProgressDashes current={step} total={5} />}
            
            {step < 6 && (
              <div className="flex flex-col items-center w-full mt-4">
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 text-foreground font-bold text-lg group py-3 px-6 rounded-full hover:bg-accent/10 transition-colors"
                >
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  Continue
                </button>
                
                {step === 1 && (
                  <p className="text-xs text-muted-foreground/60 tracking-wide mt-8">
                    No account required &middot; Works offline
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
