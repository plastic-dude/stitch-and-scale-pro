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
import { NEW_PROJECT_COPY } from '@/lib/new-project-copy';

export default function NewProjectWizard() {
  const [, setLocation] = useLocation();
  const { createProject } = useProjects();
  const { unit: defaultUnit, sizingStandard, customStandard, studioProfile, t, language } = useSettings();
  const copy = NEW_PROJECT_COPY[language];

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [author, setAuthor] = useState(studioProfile.designerName);
  const [baseSize, setBaseSize] = useState<SizeKey>('M');
  const [gauge, setGauge] = useState<Gauge>({ stitchesPer4In: 20, rowsPer4In: 28, unit: defaultUnit });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const totalSteps = 3;

  const validateStep = (s: number) => {
    const newErrors: Record<string, string> = {};
    if (s === 1) {
      if (!name.trim()) newErrors.name = copy.fieldRequired;
      if (!author.trim()) newErrors.author = copy.fieldRequired;
    }
    if (s === 3) {
      if (gauge.stitchesPer4In <= 0) newErrors.sts = copy.invalidGauge;
      if (gauge.rowsPer4In <= 0) newErrors.rows = copy.invalidGauge;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      setTouched({ name: true, author: true });
      if (!validateStep(1)) return;
    }
    if (step < totalSteps) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleCreate = () => {
    setTouched({ sts: true, rows: true });
    if (!validateStep(3)) return;
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
    createProject(newProject, 'manual');
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
        <h1 className="text-3xl sm:text-4xl font-serif font-medium mb-3 text-foreground tracking-tight">{t('workflow.newProject.title')}</h1>
        <p className="text-muted-foreground">{t('workflow.newProject.description')}</p>
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
                  <h2 className="text-2xl font-serif font-medium">{t('workflow.newProject.details')}</h2>
                </div>

                <div className="space-y-6 max-w-md mx-auto w-full">
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className={cn("text-sm font-medium uppercase tracking-wider", errors.name && touched.name ? "text-destructive" : "text-muted-foreground")}>{t('workflow.newProject.patternName')}</Label>
                    <Input 
                      id="name" 
                      placeholder={copy.patternPlaceholder}
                      value={name} 
                      onChange={(e) => { setName(e.target.value); if (touched.name) validateStep(1); }}
                      onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                      className={cn(
                        "text-xl py-6 border-0 border-b-2 rounded-none focus-visible:ring-0 px-0 bg-transparent shadow-none",
                        errors.name && touched.name ? "border-destructive focus-visible:border-destructive" : "border-border focus-visible:border-primary"
                      )}
                      aria-invalid={!!(errors.name && touched.name)}
                      aria-describedby={errors.name && touched.name ? "name-error" : undefined}
                      autoFocus
                      data-testid="input-pattern-name"
                    />
                    {errors.name && touched.name && <p id="name-error" className="text-xs text-destructive font-medium">{errors.name}</p>}
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="author" className={cn("text-sm font-medium uppercase tracking-wider", errors.author && touched.author ? "text-destructive" : "text-muted-foreground")}>{t('workflow.newProject.designer')}</Label>
                    <div className="relative flex items-center">
                      <Fingerprint className={cn("absolute left-0 w-5 h-5", errors.author && touched.author ? "text-destructive/60" : "text-muted-foreground/60")} />
                      <Input 
                        id="author" 
                        placeholder={copy.authorPlaceholder}
                        value={author} 
                        onChange={(e) => { setAuthor(e.target.value); if (touched.author) validateStep(1); }}
                        onBlur={() => setTouched(prev => ({ ...prev, author: true }))}
                        className={cn(
                          "text-lg py-6 pl-8 border-0 border-b-2 rounded-none focus-visible:ring-0 bg-transparent shadow-none",
                          errors.author && touched.author ? "border-destructive focus-visible:border-destructive" : "border-border focus-visible:border-primary"
                        )}
                        aria-invalid={!!(errors.author && touched.author)}
                        aria-describedby={errors.author && touched.author ? "author-error" : undefined}
                        data-testid="input-author"
                      />
                    </div>
                    {errors.author && touched.author && <p id="author-error" className="text-xs text-destructive font-medium">{errors.author}</p>}
                  </div>

                  {/* Sizing standard indicator — informational only */}
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary/20 rounded-lg border border-border/40 text-xs text-muted-foreground">
                    <Info className="w-3.5 h-3.5 shrink-0 text-accent/70" />
                    <span>
                      {copy.sizingStandard}{' '}
                      <span className="font-medium text-foreground">
                        {sizingStandard === 'Custom' ? copy.customStandard : copy.cycStandard}
                      </span>
                      {' · '}
                      <Link href="/settings?focus=grading-standard#grading-standard" className="underline underline-offset-2 hover:text-foreground transition-colors">
                        {copy.changeSettings}
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
                  <h2 className="text-2xl font-serif font-medium">{t('workflow.newProject.baseSize')}</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">{t('workflow.newProject.baseSizeDescription')}</p>
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
                      aria-pressed={baseSize === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                
                <div className="max-w-lg mx-auto bg-muted/40 p-4 rounded-xl text-sm text-muted-foreground flex items-start gap-3 border border-border/40">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p>
                    {copy.gradingUses}{' '}
                    {sizingStandard === 'Custom' ? copy.custom : copy.standard}{' '}
                    {copy.across}
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
                  <h2 className="text-2xl font-serif font-medium">{t('workflow.newProject.blockedGauge')}</h2>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">{t('workflow.newProject.blockedGaugeDescription')}</p>
                </div>

                <div className="max-w-md mx-auto space-y-8">
                  <div className="flex justify-center">
                    <div className="flex bg-muted/60 p-1 rounded-lg">
                      <button 
                        className={cn("px-6 py-2 min-h-11 text-sm font-semibold rounded-md transition-all", gauge.unit === 'in' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => setGauge({...gauge, unit: 'in'})}
                        data-testid="button-unit-inches"
                        aria-pressed={gauge.unit === 'in'}
                      >
                        {t('workflow.onboarding.inches')}
                      </button>
                      <button 
                        className={cn("px-6 py-2 min-h-11 text-sm font-semibold rounded-md transition-all", gauge.unit === 'cm' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => setGauge({...gauge, unit: 'cm'})}
                        data-testid="button-unit-cm"
                        aria-pressed={gauge.unit === 'cm'}
                      >
                        {t('workflow.onboarding.centimeters')}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className={cn(
                      "space-y-3 p-5 rounded-xl border relative overflow-hidden group transition-colors",
                      errors.sts && touched.sts ? "bg-destructive/5 border-destructive/50 focus-within:border-destructive" : "bg-secondary/10 border-border/40 focus-within:border-primary/50"
                    )}>
                      <Label htmlFor="sts" className={cn("text-xs font-semibold uppercase tracking-wider block", errors.sts && touched.sts ? "text-destructive" : "text-muted-foreground")}>{t('workflow.newProject.stitches')}</Label>
                      <div className="flex items-baseline">
                        <Input 
                          id="sts" 
                          type="number"
                          min="0.25"
                          step="0.25"
                          value={gauge.stitchesPer4In || ''} 
                          onChange={(e) => { 
                            const val = parseFloat(e.target.value) || 0;
                            setGauge(prev => {
                              const next = {...prev, stitchesPer4In: val};
                              if (touched.sts) {
                                const newErrors = {...errors};
                                if (val <= 0) newErrors.sts = copy.invalidGauge;
                                else delete newErrors.sts;
                                setErrors(newErrors);
                              }
                              return next;
                            });
                          }}
                          onBlur={() => setTouched(prev => ({ ...prev, sts: true }))}
                          className={cn(
                            "text-4xl font-mono p-0 border-0 bg-transparent h-12 shadow-none focus-visible:ring-0 w-full",
                            errors.sts && touched.sts ? "text-destructive" : "text-foreground"
                          )}
                          aria-invalid={!!(errors.sts && touched.sts)}
                          aria-describedby={errors.sts && touched.sts ? "sts-error" : undefined}
                          data-testid="input-stitches"
                        />
                      </div>
                      <div className="absolute right-4 bottom-5 text-xs text-muted-foreground font-medium">{gauge.unit === 'in' ? 'per 4 inches' : 'per 10 cm'}</div>
                      {errors.sts && touched.sts && <p id="sts-error" className="absolute left-5 bottom-1 text-[10px] text-destructive font-medium">{errors.sts}</p>}
                    </div>
                    
                    <div className={cn(
                      "space-y-3 p-5 rounded-xl border relative overflow-hidden group transition-colors",
                      errors.rows && touched.rows ? "bg-destructive/5 border-destructive/50 focus-within:border-destructive" : "bg-secondary/10 border-border/40 focus-within:border-primary/50"
                    )}>
                      <Label htmlFor="rows" className={cn("text-xs font-semibold uppercase tracking-wider block", errors.rows && touched.rows ? "text-destructive" : "text-muted-foreground")}>{t('workflow.newProject.rows')}</Label>
                      <div className="flex items-baseline">
                        <Input 
                          id="rows" 
                          type="number"
                          min="0.25"
                          step="0.25"
                          value={gauge.rowsPer4In || ''} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setGauge(prev => {
                              const next = {...prev, rowsPer4In: val};
                              if (touched.rows) {
                                const newErrors = {...errors};
                                if (val <= 0) newErrors.rows = copy.invalidGauge;
                                else delete newErrors.rows;
                                setErrors(newErrors);
                              }
                              return next;
                            });
                          }}
                          onBlur={() => setTouched(prev => ({ ...prev, rows: true }))}
                          className={cn(
                            "text-4xl font-mono p-0 border-0 bg-transparent h-12 shadow-none focus-visible:ring-0 w-full",
                            errors.rows && touched.rows ? "text-destructive" : "text-foreground"
                          )}
                          aria-invalid={!!(errors.rows && touched.rows)}
                          aria-describedby={errors.rows && touched.rows ? "rows-error" : undefined}
                          data-testid="input-rows"
                        />
                      </div>
                      <div className="absolute right-4 bottom-5 text-xs text-muted-foreground font-medium">{gauge.unit === 'in' ? 'per 4 inches' : 'per 10 cm'}</div>
                      {errors.rows && touched.rows && <p id="rows-error" className="absolute left-5 bottom-1 text-[10px] text-destructive font-medium">{errors.rows}</p>}
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
            className="font-medium min-h-11 min-w-11 text-muted-foreground hover:text-foreground"
            data-testid="button-back"
          >
            {step === 1 ? t('workflow.newProject.cancel') : (
              <>
                <ChevronLeft className="w-4 h-4 mr-1.5" /> {t('workflow.newProject.back')}
              </>
            )}
          </Button>
          
          {step < totalSteps ? (
            <Button 
              onClick={handleNext} 
              disabled={step === 1 && (!name.trim() || !author.trim())} 
              className="font-medium px-8 min-h-11 rounded-full shadow-sm"
              data-testid="button-next"
            >
              {t('workflow.newProject.next')} <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button 
              onClick={handleCreate} 
              disabled={!gauge.stitchesPer4In || !gauge.rowsPer4In} 
              className="font-medium px-8 min-h-11 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
              data-testid="button-create"
            >
              {t('workflow.newProject.create')} <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
