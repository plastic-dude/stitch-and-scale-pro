import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { useProject, useProjects, type PatternProject } from '@/context/ProjectsContext';
import { useSettings } from '@/context/SettingsContext';
import { gradePattern, resolveProjectStandards } from '@/lib/grading-engine';
import { THEMES, resolveTheme, type ThemeId } from '@/lib/pdf/themes';
import { renderDocument } from '@/lib/pdf/renderer';
import { validateDraft } from '@/lib/pattern-draft-renderer';
import { openPrintWindow, getDefaultFilename, sanitizeFilename, detectNamingStyle, applyNamingTemplate } from '@/lib/pdf/print-utils';
import { compressImageToDataUrl } from '@/lib/image-utils';
import { getPdfLabels } from '@/lib/pdf/labels';
import { getWorkspaceCopy } from '@/lib/workspace-copy';
import { getLabStatCopy } from '@/lib/lab-stat-copy';
import { validatePublicationPreflight } from '@/lib/publication-quality';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, FileText, Eye, Info, X, Loader2, ImagePlus, AlertTriangle, CheckCircle2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getToastCopy } from '@/lib/toast-copy';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Theme Card ───────────────────────────────────────────────────────────────

function ThemeCard({
  theme,
  selected,
  accentColor,
  onSelect,
  onAccentChange,
  labels,
}: {
  labels: ReturnType<typeof getPdfLabels>;
  theme: typeof THEMES[0];
  selected: boolean;
  accentColor: string;
  onSelect: () => void;
  onAccentChange: (color: string) => void;
}) {
  const displayAccent = (selected && accentColor) ? accentColor : theme.defaultAccent;
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'relative cursor-pointer rounded-xl border-2 p-3 transition-all duration-200 group',
        selected
          ? 'border-primary shadow-md ring-2 ring-primary/20'
          : 'border-border hover:border-primary/40 hover:shadow-sm',
      )}
    >
      {/* Selected badge */}
      {selected && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
        </div>
      )}

      {/* Mini cover preview */}
      <div
        className="rounded-md mb-2.5 overflow-hidden"
        style={{ background: theme.backgroundColor, height: 80, padding: '10px 12px', border: `1px solid ${theme.dividerColor}` }}
      >
        {/* Header band for luxury */}
        {theme.coverLayout === 'luxury' && (
          <div style={{ background: displayAccent, height: 8, marginBottom: 8, borderRadius: 1, marginLeft: -12, marginRight: -12, marginTop: -10 }} />
        )}
        {/* Blueprint corners for technical */}
        {theme.coverLayout === 'technical' && (
          <>
            <div style={{ position: 'absolute', top: 32, left: 12, width: 8, height: 8, borderTop: `1.5px solid ${displayAccent}`, borderLeft: `1.5px solid ${displayAccent}` }} />
            <div style={{ position: 'absolute', top: 32, right: 12, width: 8, height: 8, borderTop: `1.5px solid ${displayAccent}`, borderRight: `1.5px solid ${displayAccent}` }} />
          </>
        )}
        {/* Accent dot for minimal */}
        {theme.coverLayout === 'minimal' && (
          <div style={{ width: 8, height: 8, borderRadius: 2, background: displayAccent, marginBottom: 6 }} />
        )}
        {/* Craft dashes */}
        {theme.coverLayout === 'craft' && (
          <div style={{ width: 24, borderTop: `1.5px dashed ${displayAccent}`, marginBottom: 6, opacity: 0.75 }} />
        )}
        {/* Pattern name simulation */}
        <div
          style={{
            fontFamily: theme.headingFont.replace(/'/g, ''),
            fontSize: 11,
            fontWeight: 700,
            color: theme.textColor,
            lineHeight: 1.2,
            marginBottom: 4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {labels.samplePattern}
        </div>
        <div style={{ fontSize: 8, color: theme.mutedTextColor }}>{labels.sampleDesigner}</div>
      </div>

      {/* Color swatches */}
      <div className="flex gap-1.5 mb-2">
        {[theme.backgroundColor, theme.textColor, displayAccent].map((c, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: c,
              border: '1.5px solid rgba(0,0,0,0.12)',
            }}
          />
        ))}
        {/* Accent color override */}
        {selected && (
          <button
            type="button"
            title={labels.changeAccent}
            className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            onClick={e => { e.stopPropagation(); colorInputRef.current?.click(); }}
          >
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: displayAccent, border: '1.5px solid rgba(0,0,0,0.15)', cursor: 'pointer' }} />
            <input
              ref={colorInputRef}
              type="color"
              value={displayAccent}
              onChange={e => onAccentChange(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="sr-only"
              aria-label={labels.pickAccent}
            />
          </button>
        )}
      </div>

      {/* Name + tagline */}
      <div className="text-[11px] font-semibold text-foreground leading-tight">{theme.name}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{theme.description}</div>
    </div>
  );
}

// ─── First-Time Tip ───────────────────────────────────────────────────────────

function FirstTimeTip({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5 text-xs text-muted-foreground mb-4"
    >
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
      <span className="flex-1">
        The filename is a suggestion — you can rename it before every export, and your preferred naming style will be remembered.
      </span>
      <button type="button" onClick={onDismiss} className="text-muted-foreground/60 hover:text-muted-foreground ml-1">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectPdf() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const projectHook = useProject(params.id);
  const { pdfDefaults, setPdfDefaults, customStandard, language } = useSettings();
  const labels = getPdfLabels(language);
  const copy = getWorkspaceCopy(language);
  const ls = getLabStatCopy(language);
  const { importProject } = useProjects();
  const [isImporting, setIsImporting] = useState(false);
  const recoveryFileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed || typeof parsed.name !== 'string' || !Array.isArray(parsed.sections)) {
          throw new Error('This file doesn\'t look like a Stitch & Scale pattern export.');
        }
        importProject(parsed as PatternProject);
        toast({ title: tc.projectImportedDescription(parsed.name) });
      } catch (err) {
        toast({
          title: ls.projectNotFound,
          description: err instanceof Error ? err.message : tc.fileCouldNotBeRead,
          variant: 'destructive',
        });
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      toast({ title: ls.projectNotFound, variant: 'destructive' });
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  // Template / accent
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(pdfDefaults.themeId);
  const [accentColor, setAccentColor] = useState<string>(pdfDefaults.accentColor);

  // Custom logo
  const [customLogo, setCustomLogo] = useState<string | undefined>(pdfDefaults.customLogo);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const tc = getToastCopy(language);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsProcessingLogo(true);
    const { dataUrl, error } = await compressImageToDataUrl(file);
    setIsProcessingLogo(false);

    if (error || !dataUrl) {
      toast({ title: 'Could not use this image', description: error ?? tc.unknownError, variant: 'destructive' });
      return;
    }
    setCustomLogo(dataUrl);
  };

  // Export options
  const [includeCover, setIncludeCover]   = useState(pdfDefaults.includeCover);
  const [includeGauge, setIncludeGauge]   = useState(pdfDefaults.includeGaugeSummary);
  const [includeNotes, setIncludeNotes]   = useState(pdfDefaults.includeNotes);

  // Filename
  const [filename, setFilename]           = useState('');
  const [userEditedFilename, setUserEditedFilename] = useState(false);

  // UI state
  const [showTip, setShowTip]             = useState(!pdfDefaults.firstExportTipSeen);
  const [isExporting, setIsExporting]     = useState(false);
  const [previewKey, setPreviewKey]       = useState(0); // force iframe refresh

  // Computed: grading result (memoized — expensive)
  const gradingResult = useMemo(
    () => projectHook?.project ? gradePattern(projectHook.project, resolveProjectStandards(projectHook.project, customStandard)) : [],
    [projectHook?.project, customStandard],
  );

  // Publication preflight is deliberately computed from the same project,
  // grading result, template, locale, and logo that feed the export. This makes
  // the gate explainable and prevents a user from exporting a document whose
  // visible preview does not match the checks they just passed.
  const publicationPreflight = useMemo(
    () => projectHook?.project
      ? validatePublicationPreflight({
          project: projectHook.project,
          gradingResult,
          locale: language,
          templateId: selectedTheme,
          customLogo,
          liveCustomStandard: customStandard,
        })
      : null,
    [projectHook?.project, gradingResult, language, selectedTheme, customLogo, customStandard],
  );
  const draftIssues = useMemo(
    () => projectHook?.project ? validateDraft(projectHook.project.description || '', projectHook.project, customStandard) : [],
    [projectHook?.project, customStandard],
  );

  // Computed: rendered HTML (regenerated on any control change)
  const previewHtml = useMemo(() => {
    if (!projectHook?.project) return '';
    const theme = resolveTheme(selectedTheme, accentColor || undefined);
    return renderDocument({
      theme,
      pattern: projectHook.project,
      gradingResult,
      includeCover,
      includeGaugeSummary: includeGauge,
      includeNotes,
      customLogo,
      locale: language,
      templateId: selectedTheme,
    });
  }, [selectedTheme, accentColor, includeCover, includeGauge, includeNotes, customLogo, language, projectHook?.project, gradingResult]);

  // Initialize filename from project + saved template
  useEffect(() => {
    if (!projectHook?.project || userEditedFilename) return;
    const projectName = projectHook.project.name || 'Untitled Pattern';
    const fn = pdfDefaults.lastNamingTemplate
      ? applyNamingTemplate(pdfDefaults.lastNamingTemplate, projectName)
      : getDefaultFilename(projectName);
    setFilename(fn);
  }, [projectHook?.project]);

  const handleFilenameChange = useCallback((val: string) => {
    setFilename(val);
    setUserEditedFilename(true);
  }, []);

  const handleDismissTip = useCallback(() => {
    setShowTip(false);
    setPdfDefaults({ ...pdfDefaults, firstExportTipSeen: true });
  }, [pdfDefaults, setPdfDefaults]);

  const handleThemeSelect = useCallback((id: ThemeId) => {
    setSelectedTheme(id);
    setAccentColor(''); // reset accent override when switching theme
  }, []);

  // F-04 (CHK-153): the page UI only represents preparation and the handoff
  // attempt. The print utility owns the OS-dialog lifecycle and iframe cleanup;
  // a successful handoff must not leave this button dependent on afterprint.
  const handleExport = useCallback(() => {
    if (!previewHtml || !projectHook?.project || !publicationPreflight?.readyToPrint) return;
    setIsExporting(true);
    // F-05 (CHK-154): the user-edited filename is sanitized on export, not on
    // typing — the field stays permissive, but the actual export name is the
    // safe, normalized basename the browser will receive.
    const safeName = sanitizeFilename(filename.trim() || getDefaultFilename(projectHook.project.name || 'Untitled Pattern'));
    const suggestedPdf = safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`;
    // Detect if user applied a custom naming style and persist it
    const defaultName = getDefaultFilename(projectHook.project.name || 'Untitled Pattern');
    const namingStyle = detectNamingStyle(safeName, defaultName);
    // Persist settings
    setPdfDefaults({
      ...pdfDefaults,
      themeId: selectedTheme,
      accentColor,
      lastNamingTemplate: namingStyle,
      firstExportTipSeen: true,
      includeCover,
      includeGaugeSummary: includeGauge,
      includeNotes,
      customLogo,
    });
    const attempt = openPrintWindow(previewHtml, suggestedPdf);
    setShowTip(false);
    window.dispatchEvent(new CustomEvent('stitch-and-scale:pattern-exported'));
    if (!attempt.ok) {
      // Recoverable failure: popup blocked / no window / write threw.
      // Tell the user and re-enable the button immediately.
      setIsExporting(false);
      toast({
        title: labels.exportFailed,
        description: tc.unknownError,
        variant: 'destructive',
      });
      return;
    }
    // The print utility has accepted the handoff. The browser's print dialog
    // now owns the interaction, so this page must immediately leave its
    // preparation state. `openPrintWindow` retains its own in-flight lock and
    // afterprint cleanup independently of this UI state.
    setIsExporting(false);
  }, [previewHtml, filename, selectedTheme, accentColor, includeCover, includeGauge, includeNotes, customLogo, pdfDefaults, setPdfDefaults, projectHook?.project, publicationPreflight?.readyToPrint, labels.exportFailed, tc, toast]);

  if (!projectHook) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center max-w-md mx-auto min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <FileText className="w-8 h-8 text-muted-foreground/60" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-3">{ls.projectNotFound}</h2>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          {ls.recoveryImportDesc}
        </p>
        
        <div className="flex flex-col gap-3 w-full">
          <input
            ref={recoveryFileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          <Button 
            className="w-full gap-2 h-11" 
            onClick={() => recoveryFileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {ls.recoveryImportButton}
          </Button>
          
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-muted-foreground/40 bg-background px-2">OR</div>
          </div>

          <Button variant="outline" className="w-full h-11" onClick={() => setLocation('/')}>
            {labels.returnDashboard}
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 w-full">
          <h3 className="text-xs font-semibold text-foreground mb-2">{ls.recoveryLocalOnlyTitle}</h3>
          <p className="text-[11px] text-muted-foreground leading-normal">
            {ls.recoveryLocalOnlyDesc}
          </p>
        </div>
      </div>
    );
  }

  const { project } = projectHook;

  return (
    <div className="-m-4 sm:-m-6 md:-m-8 flex flex-col sm:flex-row min-h-[calc(100vh-4rem)]">

      {/* ── Left Panel (controls) ──────────────────────────────── */}
      <div className="w-full sm:w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col overflow-y-auto border-b sm:border-b-0 sm:border-r border-border/40 bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/40 px-5 py-3.5 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-1.5 h-8 min-h-11 px-2" onClick={() => setLocation(`/project/${project.id}`)}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{labels.back}</span>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="font-serif font-semibold text-sm leading-tight truncate">{project.name}</div>
            <div className="text-[11px] text-muted-foreground">{labels.pdfExport}</div>
          </div>
        </div>

        <div className="flex-1 px-5 py-5 space-y-6 overflow-y-auto">

          {/* First-time tip */}
          <AnimatePresence>
            {showTip && <FirstTimeTip onDismiss={handleDismissTip} />}
          </AnimatePresence>

          {/* ── Template Picker ── */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{labels.template}</h3>
            <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label={labels.pdfTemplate}>
              {THEMES.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  selected={selectedTheme === theme.id}
                  accentColor={accentColor}
                  onSelect={() => handleThemeSelect(theme.id)}
                  onAccentChange={setAccentColor}
                  labels={labels}
                />
              ))}
            </div>
            {accentColor && (
              <button
                type="button"
                className="text-[11px] text-muted-foreground hover:text-foreground mt-2 transition-colors"
                onClick={() => setAccentColor('')}
              >
                {labels.resetAccent}
              </button>
            )}
          </section>

          <Separator />

          {/* ── Branding ── */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{labels.branding}</h3>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoFileChange}
              className="hidden"
              data-testid="input-logo-file"
            />
            {customLogo ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
                <div className="w-10 h-10 rounded-md border border-border/40 bg-background flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={customLogo} alt={labels.yourLogo} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{labels.yourLogo}</p>
                  <p className="text-xs text-muted-foreground">{labels.replacesMark}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 min-h-11 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setCustomLogo(undefined)}
                  aria-label={labels.removeLogo}
                  data-testid="button-remove-logo"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isProcessingLogo}
                className="w-full flex items-center gap-3 rounded-xl border border-dashed border-border/60 p-3 text-left hover:border-primary/40 hover:bg-secondary/10 transition-colors disabled:opacity-70"
                data-testid="button-upload-logo"
              >
                <div className="w-10 h-10 rounded-md bg-muted/40 flex items-center justify-center shrink-0">
                  {isProcessingLogo ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <ImagePlus className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{isProcessingLogo ? labels.processing : labels.uploadLogo}</p>
                  <p className="text-xs text-muted-foreground">{labels.replacesMark}</p>
                </div>
              </button>
            )}
          </section>

          <Separator />

          {/* ── Export Options ── */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{labels.include}</h3>
            <div className="space-y-3">
              {[
                { label: labels.coverPage, value: includeCover, set: setIncludeCover, id: 'cover' },
                { label: labels.gaugeSummary, value: includeGauge, set: setIncludeGauge, id: 'gauge' },
                { label: 'Pattern Notes', value: includeNotes, set: setIncludeNotes, id: 'notes', disabled: !project.description },
              ].map(({ label, value, set, id, disabled }) => (
                <div key={id} className="flex items-center justify-between">
                  <Label htmlFor={`opt-${id}`} className={cn("text-sm cursor-pointer", disabled && "text-muted-foreground")}>
                    {label}
                    {disabled && <span className="text-xs text-muted-foreground/60 ml-1">({labels.noneAdded})</span>}
                  </Label>
                  <Switch
                    id={`opt-${id}`}
                    checked={value}
                    disabled={disabled}
                    onCheckedChange={set}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* ── Filename ── */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{labels.filename}</h3>
            <div className="flex gap-2 items-center">
              <Input
                value={filename}
                onChange={e => handleFilenameChange(e.target.value)}
                placeholder={labels.filenamePlaceholder}
                className="flex-1 text-sm h-9"
                aria-label={labels.exportFilename}
              />
              <span className="text-xs text-muted-foreground shrink-0">.pdf</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {pdfDefaults.lastNamingTemplate
                ? labels.usingSaved
                : labels.namingRemembered}
            </p>
            {/* F-05 (CHK-154): show the sanitized name that will actually be
                exported whenever the user's text would be normalized. */}
            {(() => {
              const finalName = sanitizeFilename(
                (filename.trim() || getDefaultFilename(projectHook?.project?.name || 'Untitled Pattern')),
              );
              const diverges = filename.trim() !== finalName;
              return diverges
                ? (
                  <p className="text-[11px] text-amber-600 mt-1">
                    {labels.finalFilename.replace('{name}', finalName)}
                  </p>
                )
                : null;
            })()}
          </section>

          {/* ── Publication preflight ── */}
          {publicationPreflight && (
            <section
              className={cn(
                'rounded-xl border p-3.5 text-sm',
                publicationPreflight.readyToPrint
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-destructive/30 bg-destructive/5',
              )}
              aria-live="polite"
              data-testid="publication-preflight"
            >
              <div className="flex items-start gap-2.5">
                {publicationPreflight.readyToPrint
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{labels.preflightTitle}</p>
                  <p className={cn('mt-0.5 text-xs font-medium', publicationPreflight.readyToPrint ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive')}>
                    {publicationPreflight.readyToPrint ? labels.preflightReady : labels.preflightBlocked}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {publicationPreflight.flags.filter(flag => flag.severity === 'error').length} errors
                  {' · '}
                  {publicationPreflight.flags.filter(flag => flag.severity === 'warn').length} warnings
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {publicationPreflight.readyToPrint
                  ? labels.preflightReadyDescription
                  : labels.preflightBlockedDescription(publicationPreflight.flags.filter(flag => flag.severity === 'error').length)}
              </p>
              {publicationPreflight.flags.length > 0 && (
                <ul className="mt-2.5 space-y-1.5 border-t border-border/40 pt-2.5" aria-label={labels.preflightTitle}>
                  {publicationPreflight.flags.slice(0, 4).map(flag => (
                    <li key={`${flag.code}-${flag.title}`} className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-mono text-[10px] text-foreground/70">{flag.code}</span> {flag.detail}
                    </li>
                  ))}
                  {publicationPreflight.flags.length > 4 && (
                    <li className="text-xs text-muted-foreground">+ {publicationPreflight.flags.length - 4} more</li>
                  )}
                </ul>
              )}
            </section>
          )}
        </div>

        {/* ── Export Button (sticky bottom) ── */}
        <div className="sticky bottom-0 bg-background border-t border-border/40 px-5 py-4">

          <Button
            className="w-full gap-2 h-10 font-semibold"
            onClick={handleExport}
            disabled={isExporting || !previewHtml || !publicationPreflight?.readyToPrint}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {labels.preparing}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {labels.exportPdf}
              </>
            )}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            {labels.printDialog}
          </p>
        </div>
      </div>

      {/* ── Right Panel (live preview) ─────────────────────────── */}
      <div className="flex-1 bg-muted/30 flex flex-col items-center justify-start pt-8 pb-8 overflow-auto">
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <Eye className="w-3.5 h-3.5" />
          <span>{labels.livePreview} · {labels.page} 1 / {1 + (gradingResult?.length ?? 0) + (includeGauge ? 1 : 0) + (gradingResult?.length > 0 ? 1 : 0)}</span>
        </div>

        {/* Paper shadow */}
        <div className="relative" style={{ width: 'min(calc(100vw - 32px), 560px)' }}>
          {previewHtml ? (
            <div
              className="shadow-2xl rounded-sm overflow-hidden"
              style={{
                // A4 is 794px wide. Scale to fit the container.
                width: '100%',
                aspectRatio: '1 / 1.4142', // A4 ratio
                position: 'relative',
              }}
            >
              <iframe
                key={previewHtml.slice(0, 100)} // remount on significant HTML change
                srcDoc={previewHtml}
                title={labels.pdfExport}
                sandbox="allow-same-origin"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 794,
                  height: 1123,
                  border: 'none',
                  transformOrigin: 'top left',
                  // Scale to fill container
                  transform: `scale(calc(min(calc(100vw - 32px), 560px) / 794))`,
                  // For browsers that don't support CSS calc in transform:
                  // we add an inline style via JS below
                }}
                onLoad={e => {
                  // Calculate and apply scale dynamically
                  const container = (e.target as HTMLIFrameElement).parentElement;
                  if (!container) return;
                  const scale = container.clientWidth / 794;
                  (e.target as HTMLIFrameElement).style.transform = `scale(${scale})`;
                  container.style.height = `${Math.round(1123 * scale)}px`;
                }}
              />
            </div>
          ) : (
            <div
              className="bg-background shadow-md rounded-sm flex flex-col items-center justify-center text-muted-foreground gap-3"
              style={{ aspectRatio: '1 / 1.4142' }}
            >
              <FileText className="w-10 h-10 opacity-25" />
              <span className="text-sm">
                {!projectHook ? labels.loading : labels.selectTemplate}
              </span>
            </div>
          )}
        </div>

        {/* Grading sections preview (small thumbnails) */}
        {gradingResult.length > 0 && (
          <div className="mt-4 flex gap-2 flex-wrap justify-center max-w-2xl">
            {gradingResult.slice(0, 5).map((s) => (
              <div
                key={s.sectionId}
                className="text-[10px] text-muted-foreground bg-background/80 border border-border/30 rounded px-2 py-1"
              >
                {s.sectionName} · {s.measurements.length} {labels.measurements}
              </div>
            ))}
            {gradingResult.length > 5 && (
              <div className="text-[10px] text-muted-foreground bg-background/80 border border-border/30 rounded px-2 py-1">
                +{gradingResult.length - 5} {labels.moreSections}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
