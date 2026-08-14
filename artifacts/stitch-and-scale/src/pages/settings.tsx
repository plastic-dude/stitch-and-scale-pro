import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Moon, Sun, Monitor, Ruler, Settings as SettingsIcon, RotateCcw, Layers, Check } from 'lucide-react';
import StorageHealthCard from '@/components/storage-health-card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { GradingKey, GRADING_KEY_LABELS, ALL_SIZES, SIZE_STANDARDS } from '@/lib/grading-engine';

export default function SettingsPage() {
  const {
    unit, theme, setUnit, setTheme, exportData, importData, setOnboardingCompleted,
    sizingStandard, setSizingStandard, customStandard, setCustomStandardValue, resetCustomStandard,
  } = useSettings();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [editingKey, setEditingKey] = React.useState<GradingKey>('bust');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const data = JSON.parse(content);
        if (!data || (!data.projects && !data.settings)) throw new Error('not a backup');
        const { importSnapshot } = await import('@/lib/storage-lib');
        const result = await importSnapshot(data);
        toast({
          title: `Import successful — ${result.imported} project${result.imported === 1 ? '' : 's'} restored`,
          description: `Merged with your workspace; ${result.existingKept} existing project${result.existingKept === 1 ? '' : 's'} preserved untouched.`,
        });
      } catch {
        toast({ title: 'Import failed', description: 'The file could not be parsed correctly.', variant: 'destructive' });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExport = async () => {
    const { exportSnapshot, recordBackupEvent } = await import('@/lib/storage-lib');
    const snapshot = await exportSnapshot();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `stitch-and-scale-export-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    recordBackupEvent(new Blob([JSON.stringify(snapshot)]).size, snapshot.projects.length);
    toast({ title: 'Backup downloaded', description: `${snapshot.projects.length} project${snapshot.projects.length === 1 ? '' : 's'} saved to the file.` });
  };

  const handleRestartOnboarding = () => {
    setOnboardingCompleted(false);
    toast({ title: "Onboarding restarted", description: "The setup guide will appear on your next visit to the dashboard." });
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-10 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-secondary/40 rounded-full flex items-center justify-center text-primary shrink-0">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-foreground">Preferences</h1>
          <p className="text-muted-foreground mt-1">Manage your workspace environment and data.</p>
        </div>
      </div>

      <div className="grid gap-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/60 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-secondary/10 border-b border-border/40 pb-5">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Ruler className="w-5 h-5 text-accent" />
                Measurement Defaults
              </CardTitle>
              <CardDescription className="text-[13px]">Choose the primary unit for your workspace.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <label className={cn(
                  "cursor-pointer border-2 rounded-xl p-5 flex flex-col items-center gap-3 transition-all",
                  unit === 'in' ? "border-primary bg-primary/5 text-primary" : "border-border/60 hover:border-primary/30 text-muted-foreground hover:bg-secondary/10"
                )}>
                  <input type="radio" name="unit" value="in" checked={unit === 'in'} onChange={() => setUnit('in')} className="sr-only" data-testid="radio-unit-inches" />
                  <span className="font-mono text-2xl font-bold">in</span>
                  <span className="font-medium text-sm text-foreground">Inches</span>
                </label>
                <label className={cn(
                  "cursor-pointer border-2 rounded-xl p-5 flex flex-col items-center gap-3 transition-all",
                  unit === 'cm' ? "border-primary bg-primary/5 text-primary" : "border-border/60 hover:border-primary/30 text-muted-foreground hover:bg-secondary/10"
                )}>
                  <input type="radio" name="unit" value="cm" checked={unit === 'cm'} onChange={() => setUnit('cm')} className="sr-only" data-testid="radio-unit-cm" />
                  <span className="font-mono text-2xl font-bold">cm</span>
                  <span className="font-medium text-sm text-foreground">Centimeters</span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">You can override this setting per-project.</p>
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
              <CardDescription className="text-[13px]">The grading standard your patterns are built from.</CardDescription>
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
                    <span className="font-medium text-sm text-foreground">Craft Yarn Council</span>
                    {sizingStandard === 'CYC' && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <span className="text-xs text-muted-foreground">The published CYC body-measurement chart.</span>
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
                    <span className="font-medium text-sm text-foreground">Custom</span>
                    {sizingStandard === 'Custom' && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <span className="text-xs text-muted-foreground">Your own measurement chart.</span>
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
                            toast({ title: 'Reset to CYC values', description: 'Your custom chart now matches CYC again.' });
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
                                <span className="text-[10px] text-muted-foreground shrink-0" title={`CYC value: ${cycValue}"`}>
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
                Appearance
              </CardTitle>
              <CardDescription className="text-[13px]">How Stitch & Scale looks on this device.</CardDescription>
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
                  <span className="font-medium">Light</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className={cn("h-16 flex flex-col gap-2 rounded-xl border-2 transition-all", theme === 'dark' ? "border-primary shadow-sm" : "border-border/60 hover:border-primary/30 shadow-none")}
                  data-testid="button-theme-dark"
                >
                  <Moon className="w-5 h-5" />
                  <span className="font-medium">Dark</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setTheme('system')}
                  className={cn("h-16 flex flex-col gap-2 rounded-xl border-2 transition-all", theme === 'system' ? "border-primary shadow-sm" : "border-border/60 hover:border-primary/30 shadow-none")}
                  data-testid="button-theme-system"
                >
                  <Monitor className="w-5 h-5" />
                  <span className="font-medium">System</span>
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
                  <h4 className="font-medium text-foreground">Restart Onboarding</h4>
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
                  <h4 className="font-medium text-foreground">Export Workspace</h4>
                  <p className="text-sm text-muted-foreground mt-1">Download a JSON file containing all your patterns and settings.</p>
                </div>
                <Button onClick={handleExport} className="shrink-0 rounded-full shadow-sm group-hover:bg-primary/90 transition-colors" data-testid="button-export-data">
                  <Download className="w-4 h-4 mr-2" />
                  Download Backup
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-5 border border-border/60 rounded-xl bg-background hover:border-primary/30 transition-colors group">
                <div>
                  <h4 className="font-medium text-foreground">Restore from Backup</h4>
                  <p className="text-sm text-muted-foreground mt-1">Merges with your workspace — your existing patterns are never deleted or overwritten.</p>
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
