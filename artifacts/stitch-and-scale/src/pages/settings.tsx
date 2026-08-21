import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, Moon, Sun, Monitor, Ruler, Settings as SettingsIcon, RotateCcw, Layers, Check, UserRound, Globe2, AtSign, Copyright } from 'lucide-react';
import StorageHealthCard from '@/components/storage-health-card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { GradingKey, GRADING_KEY_LABELS, ALL_SIZES, SIZE_STANDARDS } from '@/lib/grading-engine';
import { getInitialLanguage, LANGUAGE_OPTIONS, languageLabel, translate, type LanguageCode } from '@/lib/i18n';
import { getSettingsCopy } from '@/lib/settings-copy';
import { getToastCopy } from '@/lib/toast-copy';
import { getStudioProfileCopy } from '@/lib/studio-profile-copy';
import { compressImageToDataUrl } from '@/lib/image-utils';

export default function SettingsPage() {
  const {
    unit, theme, setUnit, setTheme, exportData, importData, setOnboardingCompleted,
    sizingStandard, setSizingStandard, customStandard, setCustomStandardValue, resetCustomStandard,
    studioProfile, updateStudioProfile,
    pdfDefaults, setPdfDefaults,
    language, setLanguage,
  } = useSettings();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [editingKey, setEditingKey] = React.useState<GradingKey>('bust');
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const copy = getSettingsCopy(language);
  const profileCopy = getStudioProfileCopy(language);
  const tc = getToastCopy(language);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const result = await importData(content);
        if (!result) throw new Error('invalid migration file');
        toast({
          title: tc.importSuccessTitle(result.imported),
          description: result.warnings.length > 0
            ? `${tc.importMergedDescription(result.imported, result.existingKept)} ${result.warnings[0]}`
            : tc.importMergedDescription(result.imported, result.existingKept),
        });
      } catch {
        toast({ title: tc.importFailed, description: tc.importFailedDescription, variant: 'destructive' });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      toast({ title: tc.importFailed, description: tc.importFailedDescription, variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExport = async () => {
    try {
      const migration = await exportData();
      toast({ title: tc.backupDownloaded, description: tc.backupDownloadedDescription(migration.snapshot.projects.length) });
    } catch {
      toast({ title: tc.importFailed, description: tc.importFailedDescription, variant: 'destructive' });
    }
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await compressImageToDataUrl(file);
    if (result.dataUrl) {
      setPdfDefaults({ ...pdfDefaults, customLogo: result.dataUrl });
      toast({ title: profileCopy.logoSaved });
    } else {
      toast({ title: profileCopy.logoFailed, description: result.error ?? undefined, variant: 'destructive' });
    }
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleLogoRemove = () => {
    const { customLogo: _removed, ...withoutLogo } = pdfDefaults;
    setPdfDefaults(withoutLogo);
    toast({ title: profileCopy.logoRemove });
  };

  const handleRestartOnboarding = () => {
    setOnboardingCompleted(false);
    toast({ title: tc.onboardingRestarted, description: tc.onboardingRestartedDescription });
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-10 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-secondary/40 rounded-full flex items-center justify-center text-primary shrink-0">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-foreground">{t('settings.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('settings.description')}</p>
        </div>
      </div>

      <div className="grid gap-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
          <Card className="border-border/60 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-secondary/10 border-b border-border/40 pb-5">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <UserRound className="w-5 h-5 text-accent" />
                {profileCopy.title}
              </CardTitle>
              <CardDescription className="text-[13px]">{profileCopy.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="studio-designer-name">{profileCopy.designerName}</Label>
                  <Input
                    id="studio-designer-name"
                    value={studioProfile.designerName}
                    onChange={(event) => updateStudioProfile({ designerName: event.target.value })}
                    placeholder={profileCopy.designerNamePlaceholder}
                    autoComplete="name"
                    data-testid="input-studio-designer-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studio-name">{profileCopy.studioName}</Label>
                  <Input
                    id="studio-name"
                    value={studioProfile.studioName}
                    onChange={(event) => updateStudioProfile({ studioName: event.target.value })}
                    placeholder={profileCopy.studioNamePlaceholder}
                    autoComplete="organization"
                    data-testid="input-studio-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studio-website" className="flex items-center gap-2"><Globe2 className="w-3.5 h-3.5 text-muted-foreground" />{profileCopy.website}</Label>
                  <Input
                    id="studio-website"
                    type="url"
                    value={studioProfile.website}
                    onChange={(event) => updateStudioProfile({ website: event.target.value })}
                    placeholder={profileCopy.websitePlaceholder}
                    inputMode="url"
                    autoComplete="url"
                    data-testid="input-studio-website"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studio-social-handle" className="flex items-center gap-2"><AtSign className="w-3.5 h-3.5 text-muted-foreground" />{profileCopy.socialHandle}</Label>
                  <Input
                    id="studio-social-handle"
                    value={studioProfile.socialHandle}
                    onChange={(event) => updateStudioProfile({ socialHandle: event.target.value })}
                    placeholder={profileCopy.socialHandlePlaceholder}
                    autoComplete="off"
                    data-testid="input-studio-social-handle"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-copyright" className="flex items-center gap-2"><Copyright className="w-3.5 h-3.5 text-muted-foreground" />{profileCopy.copyrightNotice}</Label>
                <Input
                  id="studio-copyright"
                  value={studioProfile.copyrightNotice}
                  onChange={(event) => updateStudioProfile({ copyrightNotice: event.target.value })}
                  placeholder={profileCopy.copyrightNoticePlaceholder}
                  autoComplete="off"
                  data-testid="input-studio-copyright"
                />
              </div>
              <div className="space-y-2 rounded-xl border border-border/60 bg-secondary/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Label htmlFor="studio-logo" className="flex items-center gap-2">{profileCopy.logo}</Label>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{profileCopy.logoHint}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {pdfDefaults.customLogo && <img src={pdfDefaults.customLogo} alt="" className="h-10 w-10 rounded-md border border-border/60 bg-background object-contain p-1" />}
                    <input ref={logoInputRef} id="studio-logo" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoChange} className="sr-only" />
                    <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>{profileCopy.logoChoose}</Button>
                    {pdfDefaults.customLogo && <Button type="button" variant="ghost" size="sm" onClick={handleLogoRemove}>{profileCopy.logoRemove}</Button>}
                  </div>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{profileCopy.usageHint}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/60 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-secondary/10 border-b border-border/40 pb-5">
              <CardTitle className="font-serif text-xl flex items-center gap-2">🌐 {t('settings.language.title')}</CardTitle>
              <CardDescription className="text-[13px]">{t('settings.language.description')}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => setLanguage(option.code as LanguageCode)}
                    className={cn(
                      'rounded-xl border-2 px-3 py-3 text-left transition-all',
                      language === option.code ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 hover:border-primary/30'
                    )}
                    data-testid={`button-language-${option.code}`}
                  >
                    <span className="block text-sm font-medium text-foreground">{option.nativeLabel}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">{option.label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {language === getInitialLanguage() ? t('settings.language.detected') : `${t('settings.language.manual')}: ${languageLabel(language)}`}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/60 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-secondary/10 border-b border-border/40 pb-5">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Ruler className="w-5 h-5 text-accent" />
                Measurement Defaults
              </CardTitle>
              <CardDescription className="text-[13px]">{copy.unitsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <label className={cn(
                  "cursor-pointer border-2 rounded-xl p-5 flex flex-col items-center gap-3 transition-all",
                  unit === 'in' ? "border-primary bg-primary/5 text-primary" : "border-border/60 hover:border-primary/30 text-muted-foreground hover:bg-secondary/10"
                )}>
                  <input type="radio" name="unit" value="in" checked={unit === 'in'} onChange={() => setUnit('in')} className="sr-only" data-testid="radio-unit-inches" />
                  <span className="font-mono text-2xl font-bold">in</span>
                  <span className="font-medium text-sm text-foreground">{copy.inches}</span>
                </label>
                <label className={cn(
                  "cursor-pointer border-2 rounded-xl p-5 flex flex-col items-center gap-3 transition-all",
                  unit === 'cm' ? "border-primary bg-primary/5 text-primary" : "border-border/60 hover:border-primary/30 text-muted-foreground hover:bg-secondary/10"
                )}>
                  <input type="radio" name="unit" value="cm" checked={unit === 'cm'} onChange={() => setUnit('cm')} className="sr-only" data-testid="radio-unit-cm" />
                  <span className="font-mono text-2xl font-bold">cm</span>
                  <span className="font-medium text-sm text-foreground">{copy.centimeters}</span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">{copy.projectOverride}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/60 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-secondary/10 border-b border-border/40 pb-5">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent" />
                Sizing Standard
              </CardTitle>
              <CardDescription className="text-[13px]">{copy.gradingDescription}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSizingStandard('CYC')}
                  className={cn(
                    "text-left rounded-xl p-4 border-2 transition-all",
                    sizingStandard === 'CYC' ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-primary/30"
                  )}
                  data-testid="button-standard-cyc"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-foreground">{copy.cycName}</span>
                    {sizingStandard === 'CYC' && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{copy.cycDescription}</span>
                </button>
                <button
                  onClick={() => setSizingStandard('Custom')}
                  className={cn(
                    "text-left rounded-xl p-4 border-2 transition-all",
                    sizingStandard === 'Custom' ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-primary/30"
                  )}
                  data-testid="button-standard-custom"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-foreground">{copy.custom}</span>
                    {sizingStandard === 'Custom' && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{copy.customDescription}</span>
                </button>
              </div>

              <AnimatePresence initial={false}>
                {sizingStandard === 'Custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 pt-5 border-t border-border/40">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Every value starts as a copy of the CYC chart. Edit only where your own patterns
                          run differently — everything else keeps grading exactly like CYC until you change it.
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            resetCustomStandard();
                            toast({ title: tc.resetToCycValues, description: tc.resetToCycValuesDescription });
                          }}
                          data-testid="button-reset-custom-standard"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reset all
                        </Button>
                      </div>

                      {/* One measurement at a time, not a 117-cell grid at once —
                          a designer almost always only cares about a couple of
                          keys their brand's fit differs on, and this stays usable
                          on a phone screen where a full matrix wouldn't. */}
                      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 -mx-1 px-1" style={{ contain: 'layout inline-size' }}>
                        {(Object.keys(GRADING_KEY_LABELS) as GradingKey[]).map((key) => {
                          const isModified = ALL_SIZES.some(
                            (size) => customStandard[size][key] !== SIZE_STANDARDS[size][key]
                          );
                          return (
                            <button
                              key={key}
                              onClick={() => setEditingKey(key)}
                              className={cn(
                                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors relative",
                                editingKey === key
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-transparent text-muted-foreground border-border/60 hover:border-primary/40"
                              )}
                              data-testid={`chip-key-${key}`}
                            >
                              {GRADING_KEY_LABELS[key]}
                              {isModified && (
                                <span
                                  className={cn(
                                    "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
                                    editingKey === key ? "bg-primary-foreground" : "bg-accent"
                                  )}
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="rounded-xl border border-border/50 divide-y divide-border/40 overflow-hidden">
                        {ALL_SIZES.map((size) => {
                          const cycValue = SIZE_STANDARDS[size][editingKey];
                          const customValue = customStandard[size][editingKey];
                          const isModified = customValue !== cycValue;
                          return (
                            <div key={size} className="flex items-center gap-3 px-4 py-2.5 bg-card">
                              <span className="text-xs font-medium text-muted-foreground w-10 shrink-0">{size}</span>
                              <input
                                type="number"
                                step="0.5"
                                value={customValue}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!Number.isNaN(val)) setCustomStandardValue(size, editingKey, val);
                                }}
                                className="flex-1 min-w-0 bg-transparent text-sm font-medium text-foreground outline-none"
                                data-testid={`input-custom-${size}-${editingKey}`}
                              />
                              <span className="text-[11px] text-muted-foreground shrink-0">in</span>
                              {isModified && (
                                <span className="text-[10px] text-muted-foreground shrink-0" title={copy.cycValue(cycValue)}>
                                  CYC: {cycValue}"
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Additional international standards (UK, EU, Japanese) will become available through future updates.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/60 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-secondary/10 border-b border-border/40 pb-5">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Monitor className="w-5 h-5 text-accent" />
                {t('settings.appearance.title')}
              </CardTitle>
              <CardDescription className="text-[13px]">{t('settings.appearance.description')}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className={cn("h-16 flex flex-col gap-2 rounded-xl border-2 transition-all", theme === 'light' ? "border-primary shadow-sm" : "border-border/60 hover:border-primary/30 shadow-none")}
                  data-testid="button-theme-light"
                >
                  <Sun className="w-5 h-5" />
                  <span className="font-medium">{copy.light}</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className={cn("h-16 flex flex-col gap-2 rounded-xl border-2 transition-all", theme === 'dark' ? "border-primary shadow-sm" : "border-border/60 hover:border-primary/30 shadow-none")}
                  data-testid="button-theme-dark"
                >
                  <Moon className="w-5 h-5" />
                  <span className="font-medium">{copy.dark}</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setTheme('system')}
                  className={cn("h-16 flex flex-col gap-2 rounded-xl border-2 transition-all", theme === 'system' ? "border-primary shadow-sm" : "border-border/60 hover:border-primary/30 shadow-none")}
                  data-testid="button-theme-system"
                >
                  <Monitor className="w-5 h-5" />
                  <span className="font-medium">{copy.system}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-border/60 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-secondary/10 border-b border-border/40 pb-5">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-accent" />
                Onboarding
              </CardTitle>
              <CardDescription className="text-[13px]">
                Re-run the setup guide to review your workspace configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-5 border border-border/60 rounded-xl bg-background hover:border-primary/30 transition-colors group">
                <div>
                  <h4 className="font-medium text-foreground">{copy.restartOnboarding}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Walk through the setup guide again — sizing standard, units, workspace tour.
                  </p>
                </div>
                <Button
                  onClick={handleRestartOnboarding}
                  variant="outline"
                  className="shrink-0 rounded-full border-2 hover:bg-secondary/20"
                  data-testid="button-restart-onboarding"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restart Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/60 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-secondary/10 border-b border-border/40 pb-5">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Download className="w-5 h-5 text-accent" />
                Data & Backups
              </CardTitle>
              <CardDescription className="text-[13px]">
                Your patterns live right here in this browser — nothing's uploaded unless you choose to. Back them up regularly, just in case.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-5 border border-border/60 rounded-xl bg-background hover:border-primary/30 transition-colors group">
                <div>
                  <h4 className="font-medium text-foreground">{copy.exportWorkspace}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{copy.exportDescription}</p>
                </div>
                <Button onClick={handleExport} className="shrink-0 rounded-full shadow-sm group-hover:bg-primary/90 transition-colors" data-testid="button-export-data">
                  <Download className="w-4 h-4 mr-2" />
                  Download Backup
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-5 border border-border/60 rounded-xl bg-background hover:border-primary/30 transition-colors group">
                <div>
                  <h4 className="font-medium text-foreground">{copy.restoreBackup}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{copy.restoreDescription}</p>
                </div>
                <div>
                  <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="shrink-0 rounded-full border-2 hover:bg-secondary/20" data-testid="button-import-data">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <StorageHealthCard />
        </motion.div>

        <div className="text-center text-xs text-muted-foreground/60 py-6">
          Stitch &amp; Scale v1.0.0
        </div>
      </div>
    </div>
  );
}
