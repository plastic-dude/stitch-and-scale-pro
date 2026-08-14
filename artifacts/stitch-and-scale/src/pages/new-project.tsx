import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useProjects } from '@/context/ProjectsContext';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { ALL_SIZES, SizeKey, Gauge, generateId, PatternProject } from '@/lib/grading-engine';
import { ChevronRight, ChevronLeft, Check, Ruler, Scissors, BookOpen, Fingerprint, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewProjectWizard() {
  const [, setLocation] = useLocation();
  const { createProject } = useProjects();
  const { unit: defaultUnit, sizingStandard, customStandard } = useSettings();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [baseSize, setBaseSize] = useState<SizeKey>('M');
  const [gauge, setGauge] = useState<Gauge>({ stitchesPer4In: 20, rowsPer4In: 28, unit: defaultUnit });

  const totalSteps = 3;

  const handleNext = () => {
    if (step === 1 && (!name.trim() || !author.trim())) return;
    if (step < totalSteps) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleCreate = () => {
    const newProject: PatternProject = {
      id: generateId(),
      name: name.trim(),
      author: author.trim(),
      baseSize,
      gauge,
      sections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sizingStandard,
      // Frozen at creation time - editing the (shared, global) custom chart
      // later must never silently change what this project already graded to.
      customStandardSnapshot: sizingStandard === 'Custom' ? JSON.parse(JSON.stringify(customStandard)) : undefined,
    };
    createProject(newProject);
    setLocation(`/project/${newProject.id}`);
  };

  const variants = {
    initial: { opacity: 0, y: 15, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -15, scale: 0.98 }
  };

  return (
    <div className="max-w-2xl mx-auto w-full pt-6 pb-20">
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-serif font-medium mb-3 text-foreground tracking-tight">Draft a Pattern</h1>
        <p className="text-muted-foreground">Define the foundation for your next design.</p>
      </div>

      <div className="mb-12 flex items-center justify-center max-w-sm mx-auto relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-border/60">
          <motion.div 
            className="h-full bg-primary" 
            initial={{ width: "0%" }}
            animate={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
        <div className="w-full flex justify-between relative z-10">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-300 ring-4 ring-background",
                s < step ? "bg-primary text-primary-foreground" : 
                s === step ? "bg-background border-2 border-primary text-primary" : 
                "bg-background border-2 border-border/80 text-muted-foreground"
              )}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
      </div>

      <div className="relative bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden min-h-[400px] flex flex-col">
        <div className="flex-grow p-6 sm:p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-8 h-full flex flex-col justify-center"
              >
                <div className="text-center space-y-2 mb-2">
                  <div className="w-12 h-12 bg-secondary/40 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-serif font-medium">Project Details</h2>
                </div>

                <div className="space-y-6 max-w-md mx-auto w-full">
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pattern Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. The Autumn Cardigan" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="text-xl py-6 border-0 border-b-2 border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 bg-transparent shadow-none"
                      autoFocus
                      data-testid="input-pattern-name"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="author" className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Designer</Label>
                    <div className="relative flex items-center">
                      <Fingerprint className="absolute left-0 w-5 h-5 text-muted-foreground/60" />
                      <Input 
                        id="author" 
                        placeholder="Your name or brand" 
                        value={author} 
                        onChange={(e) => setAuthor(e.target.value)}
                        className="text-lg py-6 pl-8 border-0 border-b-2 border-border rounded-none focus-visible:ring-0 focus-visible:border-primary bg-transparent shadow-none"
                        data-testid="input-author"
                      />
                    </div>
                  </div>

                  {/* Sizing standard indicator — informational only */}
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary/20 rounded-lg border border-border/40 text-xs text-muted-foreground">
                    <Info className="w-3.5 h-3.5 shrink-0 text-accent/70" />
                    <span>
                      Sizing Standard:{' '}
                      <span className="font-medium text-foreground">
                        {sizingStandard === 'Custom' ? 'Custom Standard' : 'Craft Yarn Council (CYC)'}
                      </span>
                      {' · '}
                      <Link href="/settings" className="underline underline-offset-2 hover:text-foreground transition-colors">
                        change in Settings
                      </Link>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-8"
              >
                <div className="text-center space-y-2 mb-6">
                  <div className="w-12 h-12 bg-secondary/40 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <Ruler className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-serif font-medium">Base Size</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">Select the primary size you are grading from. All other sizes will be calculated against this.</p>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">
                  {ALL_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setBaseSize(size)}
                      data-testid={`button-size-${size}`}
                      className={cn(
                        "py-5 rounded-xl font-medium text-lg transition-all duration-200 border-2 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        baseSize === size 
                          ? "bg-primary text-primary-foreground border-primary shadow-md transform scale-105" 
                          : "bg-background border-border/60 hover:border-primary/40 text-foreground hover:bg-secondary/10"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                
                <div className="max-w-lg mx-auto bg-muted/40 p-4 rounded-xl text-sm text-muted-foreground flex items-start gap-3 border border-border/40">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p>
                    Grading calculations use{' '}
                    {sizingStandard === 'Custom' ? 'your Custom Standard' : 'standard Craft Yarn Council (CYC)'}
                    {' '}body measurements to ensure consistent fit across all sizes.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-8"
              >
                <div className="text-center space-y-2 mb-6">
                  <div className="w-12 h-12 bg-secondary/40 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <Scissors className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-serif font-medium">Blocked Gauge</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">Enter the stitch and row count of your blocked swatch per 4 inches (10 cm).</p>
                </div>

                <div className="max-w-md mx-auto space-y-8">
                  <div className="flex justify-center">
                    <div className="flex bg-muted/60 p-1 rounded-lg">
                      <button 
                        className={cn("px-6 py-2 text-sm font-semibold rounded-md transition-all", gauge.unit === 'in' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => setGauge({...gauge, unit: 'in'})}
                        data-testid="button-unit-inches"
                      >
                        Inches
                      </button>
                      <button 
                        className={cn("px-6 py-2 text-sm font-semibold rounded-md transition-all", gauge.unit === 'cm' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => setGauge({...gauge, unit: 'cm'})}
                        data-testid="button-unit-cm"
                      >
                        Centimeters
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3 bg-secondary/10 p-5 rounded-xl border border-border/40 relative overflow-hidden group focus-within:border-primary/50 transition-colors">
                      <Label htmlFor="sts" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Stitches</Label>
                      <div className="flex items-baseline">
                        <Input 
                          id="sts" 
                          type="number"
                          min="1"
                          step="0.25"
                          value={gauge.stitchesPer4In || ''} 
                          onChange={(e) => setGauge({...gauge, stitchesPer4In: parseFloat(e.target.value) || 0})}
                          className="text-4xl font-mono p-0 border-0 bg-transparent h-12 shadow-none focus-visible:ring-0 w-full"
                          data-testid="input-stitches"
                        />
                      </div>
                      <div className="absolute right-4 bottom-5 text-xs text-muted-foreground font-medium">{gauge.unit === 'in' ? 'per 4 inches' : 'per 10 cm'}</div>
                    </div>
                    
                    <div className="space-y-3 bg-secondary/10 p-5 rounded-xl border border-border/40 relative overflow-hidden group focus-within:border-primary/50 transition-colors">
                      <Label htmlFor="rows" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Rows</Label>
                      <div className="flex items-baseline">
                        <Input 
                          id="rows" 
                          type="number"
                          min="1"
                          step="0.25"
                          value={gauge.rowsPer4In || ''} 
                          onChange={(e) => setGauge({...gauge, rowsPer4In: parseFloat(e.target.value) || 0})}
                          className="text-4xl font-mono p-0 border-0 bg-transparent h-12 shadow-none focus-visible:ring-0 w-full"
                          data-testid="input-rows"
                        />
                      </div>
                      <div className="absolute right-4 bottom-5 text-xs text-muted-foreground font-medium">{gauge.unit === 'in' ? 'per 4 inches' : 'per 10 cm'}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="p-6 bg-muted/20 border-t border-border/60 flex justify-between items-center mt-auto">
          <Button 
            variant="ghost" 
            onClick={step === 1 ? () => setLocation('/') : handleBack}
            className="font-medium text-muted-foreground hover:text-foreground"
            data-testid="button-back"
          >
            {step === 1 ? 'Cancel' : (
              <>
                <ChevronLeft className="w-4 h-4 mr-1.5" /> Back
              </>
            )}
          </Button>
          
          {step < totalSteps ? (
            <Button 
              onClick={handleNext} 
              disabled={step === 1 && (!name.trim() || !author.trim())} 
              className="font-medium px-8 rounded-full shadow-sm"
              data-testid="button-next"
            >
              Continue <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button 
              onClick={handleCreate} 
              disabled={!gauge.stitchesPer4In || !gauge.rowsPer4In} 
              className="font-medium px-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
              data-testid="button-create"
            >
              Finish Setup <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
