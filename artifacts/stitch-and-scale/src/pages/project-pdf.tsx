import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { useProject } from '@/context/ProjectsContext';
import { useSettings } from '@/context/SettingsContext';
import { gradePattern, resolveProjectStandards } from '@/lib/grading-engine';
import { THEMES, resolveTheme, type ThemeId } from '@/lib/pdf/themes';
import { renderDocument } from '@/lib/pdf/renderer';
import { openPrintWindow, getDefaultFilename, detectNamingStyle, applyNamingTemplate } from '@/lib/pdf/print-utils';
import { compressImageToDataUrl } from '@/lib/image-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, FileText, Eye, Info, X, Loader2, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Theme Card ───────────────────────────────────────────────────────────────

function ThemeCard({
  theme,
  selected,
  accentColor,
  onSelect,
  onAccentChange,
}: {
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
          Sample Knitwear Pattern
        </div>
        <div style={{ fontSize: 8, color: theme.mutedTextColor }}>by Designer</div>
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
            title="Change accent color"
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
              aria-label="Pick accent color"
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
  const { pdfDefaults, setPdfDefaults, customStandard } = useSettings();

  // Template / accent
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(pdfDefaults.themeId);
  const [accentColor, setAccentColor] = useState<string>(pdfDefaults.accentColor);

  // Custom logo
  const [customLogo, setCustomLogo] = useState<string | undefined>(pdfDefaults.customLogo);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsProcessingLogo(true);
    const { dataUrl, error } = await compressImageToDataUrl(file);
    setIsProcessingLogo(false);

    if (error || !dataUrl) {
      toast({ title: 'Could not use this image', description: error ?? 'Unknown error.', variant: 'destructive' });
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
      locale: 'en',
      templateId: selectedTheme,
    });
  }, [selectedTheme, accentColor, includeCover, includeGauge, includeNotes, customLogo, projectHook?.project, gradingResult]);

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

  const handleExport = useCallback(() => {
    if (!previewHtml || !projectHook?.project) return;
    setIsExporting(true);

    const safeName = filename.trim() || getDefaultFilename(projectHook.project.name || 'Untitled Pattern');
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

    openPrintWindow(previewHtml, suggestedPdf);
    setShowTip(false);
    window.dispatchEvent(new CustomEvent('stitch-and-scale:pattern-exported'));

    // Reset exporting state after a moment
    setTimeout(() => setIsExporting(false), 1500);
  }, [previewHtml, filename, selectedTheme, accentColor, includeCover, includeGauge, includeNotes, customLogo, pdfDefaults, setPdfDefaults, projectHook?.project]);

  if (!projectHook) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">Project Not Found</h2>
        <Button onClick={() => setLocation('/')}>Return to Dashboard</Button>
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
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-1.5 h-8 px-2" onClick={() => setLocation(`/project/${project.id}`)}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="font-serif font-semibold text-sm leading-tight truncate">{project.name}</div>
            <div className="text-[11px] text-muted-foreground">PDF Export</div>
          </div>
        </div>

        <div className="flex-1 px-5 py-5 space-y-6 overflow-y-auto">

          {/* First-time tip */}
          <AnimatePresence>
            {showTip && <FirstTimeTip onDismiss={handleDismissTip} />}
          </AnimatePresence>

          {/* ── Template Picker ── */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Template</h3>
            <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="PDF template">
              {THEMES.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  selected={selectedTheme === theme.id}
                  accentColor={accentColor}
                  onSelect={() => handleThemeSelect(theme.id)}
                  onAccentChange={setAccentColor}
                />
              ))}
            </div>
            {accentColor && (
              <button
                type="button"
                className="text-[11px] text-muted-foreground hover:text-foreground mt-2 transition-colors"
                onClick={() => setAccentColor('')}
              >
                Reset accent to theme default
              </button>
            )}
          </section>

          <Separator />

          {/* ── Branding ── */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Branding</h3>
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
                  <img src={customLogo} alt="Your logo" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Your logo</p>
                  <p className="text-xs text-muted-foreground">Replaces the Stitch & Scale mark on the cover</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setCustomLogo(undefined)}
                  aria-label="Remove custom logo"
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
                  <p className="text-sm font-medium text-foreground">{isProcessingLogo ? 'Processing…' : 'Upload your logo'}</p>
                  <p className="text-xs text-muted-foreground">Replaces the Stitch & Scale mark on the cover</p>
                </div>
              </button>
            )}
          </section>

          <Separator />

          {/* ── Export Options ── */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Include</h3>
            <div className="space-y-3">
              {[
                { label: 'Cover Page', value: includeCover, set: setIncludeCover, id: 'cover' },
                { label: 'Gauge Summary', value: includeGauge, set: setIncludeGauge, id: 'gauge' },
                { label: 'Pattern Notes', value: includeNotes, set: setIncludeNotes, id: 'notes', disabled: !project.description },
              ].map(({ label, value, set, id, disabled }) => (
                <div key={id} className="flex items-center justify-between">
                  <Label htmlFor={`opt-${id}`} className={cn("text-sm cursor-pointer", disabled && "text-muted-foreground")}>
                    {label}
                    {disabled && <span className="text-xs text-muted-foreground/60 ml-1">(none added)</span>}
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
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Filename</h3>
            <div className="flex gap-2 items-center">
              <Input
                value={filename}
                onChange={e => handleFilenameChange(e.target.value)}
                placeholder="Pattern filename…"
                className="flex-1 text-sm h-9"
                aria-label="Export filename"
              />
              <span className="text-xs text-muted-foreground shrink-0">.pdf</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {pdfDefaults.lastNamingTemplate
                ? 'Using your saved naming style.'
                : 'Your naming style will be remembered after the first export.'}
            </p>
          </section>
        </div>

        {/* ── Export Button (sticky bottom) ── */}
        <div className="sticky bottom-0 bg-background border-t border-border/40 px-5 py-4">
          <Button
            className="w-full gap-2 h-10 font-semibold"
            onClick={handleExport}
            disabled={isExporting || !previewHtml}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Preparing your PDF…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export PDF
              </>
            )}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            A print dialog will open — choose "Save as PDF" there to finish
          </p>
        </div>
      </div>

      {/* ── Right Panel (live preview) ─────────────────────────── */}
      <div className="flex-1 bg-muted/30 flex flex-col items-center justify-start pt-8 pb-8 overflow-auto">
        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
          <Eye className="w-3.5 h-3.5" />
          <span>Live preview · Page 1 of {1 + (gradingResult?.length ?? 0) + (includeGauge ? 1 : 0) + (gradingResult?.length > 0 ? 1 : 0)}</span>
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
                title="PDF Preview"
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
                {!projectHook ? 'Loading…' : 'Select a template to preview'}
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
                {s.sectionName} · {s.measurements.length} measurements
              </div>
            ))}
            {gradingResult.length > 5 && (
              <div className="text-[10px] text-muted-foreground bg-background/80 border border-border/30 rounded px-2 py-1">
                +{gradingResult.length - 5} more sections
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
