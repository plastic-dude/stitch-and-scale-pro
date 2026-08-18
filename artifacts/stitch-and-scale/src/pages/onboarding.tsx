import React, { useState, useEffect } from 'react';
import { InstallBanner } from '@/components/install-banner';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useSettings, SizingStandard } from '@/context/SettingsContext';
import { useProjects } from '@/context/ProjectsContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Shield,
  Ruler,
  Settings2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  FolderOpen,
  MonitorSmartphone,
  Info
} from 'lucide-react';
import { SAMPLE_CREW_NECK_SWEATER, SAMPLE_BASIC_BEANIE } from '@/lib/sample-projects';

const TOTAL_STEPS = 7;

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i + 1 === current 
              ? "bg-primary w-6" 
              : i + 1 < current 
                ? "bg-primary/40 w-1.5" 
                : "bg-muted w-1.5"
          )}
        />
      ))}
    </div>
  );
}

function StepWelcome() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <MonitorSmartphone className="w-10 h-10 text-primary" strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-4">
        Welcome to Stitch & Scale
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
        A private, offline-first workspace for grading and releasing professional knitwear patterns.
      </p>
      
      <div className="mt-8 p-4 bg-muted/50 rounded-2xl flex items-start gap-3 text-left w-full max-w-sm">
        <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Private by design</p>
          <p className="text-sm text-muted-foreground mt-1">Your data stays on your device. No cloud sync, no tracking.</p>
        </div>
      </div>
    </div>
  );
}

function StepPhilosophy() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-primary" strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-4">
        Math-Free Grading
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
        Input your gauge and master measurements. The engine grades every size instantly based on your chosen standard.
      </p>
    </div>
  );
}

function StepSizingStandard({ sizingStandard, setSizingStandard }: { sizingStandard: SizingStandard, setSizingStandard: (s: SizingStandard) => void }) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Ruler className="w-10 h-10 text-primary" strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-4">
        Sizing Standard
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-sm">
        Select the baseline standard your designs target. You can always change this later.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {(['ASTM', 'CYCA', 'Custom'] as SizingStandard[]).map((std) => (
          <button
            key={std}
            onClick={() => setSizingStandard(std)}
            className={cn(
              "w-full text-left px-5 py-4 rounded-2xl border transition-all flex items-center justify-between",
              sizingStandard === std 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border/60 hover:border-border hover:bg-muted/30"
            )}
          >
            <span className="font-medium text-foreground">{std} Standard</span>
            <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center transition-colors", sizingStandard === std ? "border-primary bg-primary" : "border-muted-foreground/30")}>
              {sizingStandard === std && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepUnits({ unit, setUnit }: { unit: 'in' | 'cm', setUnit: (u: 'in' | 'cm') => void }) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Settings2 className="w-10 h-10 text-primary" strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-4">
        Measurement Units
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-sm">
        Choose your preferred unit for inputs and display.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={() => setUnit('in')}
          className={cn(
            "w-full text-left px-5 py-4 rounded-2xl border transition-all flex items-center justify-between",
            unit === 'in' ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-border hover:bg-muted/30"
          )}
        >
          <span className="font-medium text-foreground">Inches (in)</span>
          <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center transition-colors", unit === 'in' ? "border-primary bg-primary" : "border-muted-foreground/30")}>
            {unit === 'in' && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
          </div>
        </button>
        <button
          onClick={() => setUnit('cm')}
          className={cn(
            "w-full text-left px-5 py-4 rounded-2xl border transition-all flex items-center justify-between",
            unit === 'cm' ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-border hover:bg-muted/30"
          )}
        >
          <span className="font-medium text-foreground">Centimeters (cm)</span>
          <div className={cn("w-5 h-5 rounded-full border flex items-center justify-center transition-colors", unit === 'cm' ? "border-primary bg-primary" : "border-muted-foreground/30")}>
            {unit === 'cm' && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
          </div>
        </button>
      </div>
    </div>
  );
}

function StepWorkspaceTour() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <FolderOpen className="w-10 h-10 text-primary" strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-4">
        Multi-Tier Workspace
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed max-w-sm mb-6">
        Navigate seamlessly between Design, Fit, Pricing, and Launch modules via the top command bar.
      </p>
      
      <div className="p-4 bg-muted/50 rounded-2xl flex items-start gap-3 text-left w-full max-w-sm border border-border/50">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">Auto-Save Enabled</p>
          <p className="text-sm text-muted-foreground mt-1">Changes are saved instantly to your device. You can download backups anytime.</p>
        </div>
      </div>
    </div>
  );
}

function StepSampleJourney({ onOpenSample, onSkip }: { onOpenSample: () => void, onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-primary" strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-4">
        Explore a sample
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-sm">
        Start with a pre-configured sweater or beanie to see how automatic grading works right out of the box.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button size="lg" onClick={onOpenSample} className="w-full text-base py-6 rounded-2xl shadow-sm">
          Open Sample Project
        </Button>
        <Button variant="outline" size="lg" onClick={onSkip} className="w-full text-base py-6 rounded-2xl bg-background border-border/60 hover:bg-muted/50">
          Start from Scratch
        </Button>
      </div>
    </div>
  );
}

function StepCompletion({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
        <Check className="w-10 h-10 text-emerald-600" strokeWidth={2} />
      </div>
      <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-4">
        You're all set!
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-sm">
        Your offline workspace is ready. Design, grade, and export professional PDFs instantly.
      </p>
      <Button size="lg" onClick={onFinish} className="w-full max-w-sm text-base py-6 rounded-2xl shadow-sm flex items-center justify-center gap-2">
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
  
  const goBack = () => {
    setDirection('back');
    setStep(s => Math.max(s - 1, 1));
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
    enter: (dir: string) => ({ opacity: 0, x: dir === 'forward' ? 20 : -20, scale: 0.98 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: string) => ({ opacity: 0, x: dir === 'forward' ? -20 : 20, scale: 0.98 }),
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg bg-background border border-border/40 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.png" alt="" className="w-7 h-7 rounded-lg shadow-sm" />
            <span className="font-serif font-bold text-sm tracking-tight text-foreground">Stitch & Scale</span>
          </div>
          {step < 6 && (
            <button
              onClick={skipOnboarding}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted"
            >
              Skip setup
            </button>
          )}
        </div>

        {/* Main Center Content */}
        <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center justify-center relative">
          <div className="w-full">
            {step < 6 && <StepDots current={step} total={5} />}
            
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                {step === 1 && <StepWelcome />}
                {step === 2 && <StepPhilosophy />}
                {step === 3 && <StepSizingStandard sizingStandard={localStandard} setSizingStandard={setLocalStandard} />}
                {step === 4 && <StepUnits unit={localUnit} setUnit={setLocalUnit} />}
                {step === 5 && <StepWorkspaceTour />}
                {step === 6 && <StepSampleJourney onOpenSample={handleOpenSample} onSkip={completeOnboarding} />}
                {step === 7 && <StepCompletion onFinish={completeOnboarding} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Bottom Nav */}
        {step < 6 && (
          <div className="px-6 py-5 border-t border-border/40 bg-muted/20 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={step === 1}
              className={cn("rounded-xl px-4 gap-2", step === 1 && "opacity-0")}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            
            <Button
              onClick={goNext}
              className="rounded-xl px-6 gap-2 shadow-sm"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
