import React from 'react';
import { useLocation, Link } from 'wouter';
import { useProjects } from '@/context/ProjectsContext';
import { useSettings } from '@/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ALL_SIZES, SizeKey, Gauge, generateId, PatternProject, GRADING_KEY_LABELS,
} from '@/lib/grading-engine';
import { parseMeasurementsCSV, groupIntoSections, generateCSVTemplate, CSVImportResult } from '@/lib/csv-import';
import { ArrowLeft, Upload, Download, AlertCircle, CheckCircle2, Loader2, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { IMPORT_CSV_COPY } from '@/lib/import-csv-copy';

export default function ImportCSV() {
  const [, setLocation] = useLocation();
  const { createProject } = useProjects();
  const { unit: defaultUnit, sizingStandard, customStandard, language } = useSettings();
  const copy = IMPORT_CSV_COPY[language];
  const interpolate = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isReading, setIsReading] = React.useState(false);
  const [result, setResult] = React.useState<CSVImportResult | null>(null);
  const [fileName, setFileName] = React.useState('');

  const [name, setName] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const [baseSize, setBaseSize] = React.useState<SizeKey>('M');
  const [gauge, setGauge] = React.useState<Gauge>({ stitchesPer4In: 20, rowsPer4In: 28, unit: defaultUnit });

  const handleDownloadTemplate = () => {
    const blob = new Blob([generateCSVTemplate()], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stitch-and-scale-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsReading(true);
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = parseMeasurementsCSV(text);
        setResult(parsed);
        if (parsed.rows.length > 0 && !name.trim()) {
          // Give the project a sensible default name from the filename,
          // designer can still change it below before importing.
          setName(file.name.replace(/\.csv$/i, '').replace(/[-_]/g, ' '));
        }
      } catch {
        setResult({ rows: [], errors: [copy.fileReadText] });
      } finally {
        setIsReading(false);
      }
    };
    reader.onerror = () => {
      setResult({ rows: [], errors: [copy.readError] });
      setIsReading(false);
    };
    reader.readAsText(file);
  };

  const sections = result?.rows.length ? groupIntoSections(result.rows) : [];
  const canImport = sections.length > 0 && name.trim() && gauge.stitchesPer4In > 0 && gauge.rowsPer4In > 0;

  const handleImport = () => {
    if (!canImport) return;
    const newProject: PatternProject = {
      id: generateId(),
      name: name.trim(),
      author: author.trim() || 'Unknown',
      baseSize,
      gauge,
      sections,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sizingStandard,
      customStandardSnapshot: sizingStandard === 'Custom' ? JSON.parse(JSON.stringify(customStandard)) : undefined,
    };
    createProject(newProject);
    toast({ title: copy.imported, description: interpolate(copy.importedDescription, { measurements: sections.reduce((n, s) => n + s.measurements.length, 0), sections: sections.length }) });
    setLocation(`/project/${newProject.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto w-full pt-6 pb-20">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> {copy.back}
      </Link>

      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-serif font-medium mb-3 text-foreground tracking-tight">
          {copy.title}
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          {copy.description}
        </p>
      </div>

      {/* Template download - shown always, so a designer knows the expected
          shape before they try to force their own spreadsheet into it. */}
      <button
        onClick={handleDownloadTemplate}
        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors mb-8 py-2"
        data-testid="button-download-template"
      >
        <Download className="w-4 h-4" />
        {copy.template}
      </button>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="p-6 sm:p-10 space-y-8">
          {/* File picker */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-csv-file"
            />
            <button
              onClick={handleFileClick}
              disabled={isReading}
              className={cn(
                'w-full border-2 border-dashed rounded-xl py-10 flex flex-col items-center gap-3 transition-colors',
                result?.rows.length ? 'border-primary/40 bg-primary/5' : 'border-border/60 hover:border-primary/40 hover:bg-secondary/10'
              )}
              data-testid="button-choose-csv"
            >
              {isReading ? (
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              ) : (
                <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
              )}
              <span className="text-sm font-medium text-foreground">
                {isReading ? copy.reading : fileName || copy.choose}
              </span>
              {!fileName && !isReading && (
                <span className="text-xs text-muted-foreground">{copy.templateHint}</span>
              )}
            </button>
          </div>

          {/* Errors */}
          {result && result.errors.length > 0 && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
                <AlertCircle className="w-4 h-4" />
                {result.rows.length > 0
                  ? `${result.errors.length} ${copy.rowsSkipped}`
                  : copy.nothingImported}
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 pl-6 list-disc">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {/* Preview + metadata form, only once we have something valid to import */}
          <AnimatePresence>
            {sections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-8 overflow-hidden"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CheckCircle2 className="w-4 h-4" />
                  {interpolate(copy.foundMeasurements, { measurements: sections.reduce((n, s) => n + s.measurements.length, 0), sections: sections.length })}
                </div>

                <div className="rounded-xl border border-border/50 divide-y divide-border/40 overflow-hidden">
                  {sections.map(section => (
                    <div key={section.id} className="p-4">
                      <div className="text-sm font-semibold text-foreground mb-2">{section.name}</div>
                      <div className="space-y-1">
                        {section.measurements.map(m => (
                          <div key={m.id} className="flex justify-between text-xs text-muted-foreground">
                            <span>{m.label} <span className="opacity-60">({GRADING_KEY_LABELS[m.gradingKey]})</span></span>
                            <span className="font-mono">{m.baseValue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="import-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{copy.patternName}</Label>
                    <Input id="import-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={copy.patternPlaceholder} data-testid="input-import-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="import-author" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{copy.designer}</Label>
                    <Input id="import-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={copy.designerPlaceholder} data-testid="input-import-author" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{copy.baseSize}</Label>
                    <p className="text-xs text-muted-foreground -mt-1 mb-1">{copy.baseSizeHint}</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {ALL_SIZES.map((size) => (
                        <button
                          key={size}
                          onClick={() => setBaseSize(size)}
                          className={cn(
                            'py-2.5 rounded-lg font-medium text-sm border-2 transition-all',
                            baseSize === size ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border/60 hover:border-primary/40'
                          )}
                          data-testid={`button-import-size-${size}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="import-sts" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{copy.stitches} / 4{gauge.unit}</Label>
                      <Input id="import-sts" type="number" min="1" step="0.25" value={gauge.stitchesPer4In || ''} onChange={(e) => setGauge({ ...gauge, stitchesPer4In: parseFloat(e.target.value) || 0 })} data-testid="input-import-stitches" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="import-rows" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{copy.rows} / 4{gauge.unit}</Label>
                      <Input id="import-rows" type="number" min="1" step="0.25" value={gauge.rowsPer4In || ''} onChange={(e) => setGauge({ ...gauge, rowsPer4In: parseFloat(e.target.value) || 0 })} data-testid="input-import-rows" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-muted/20 border-t border-border/60 flex justify-end">
          <Button
            onClick={handleImport}
            disabled={!canImport}
            className="font-medium px-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
            data-testid="button-confirm-import"
          >
            <Upload className="w-4 h-4 mr-2" /> {copy.importPattern}
          </Button>
        </div>
      </div>
    </div>
  );
}
