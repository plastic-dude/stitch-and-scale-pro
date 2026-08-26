import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useProject, useProjects } from '@/context/ProjectsContext';
import { ALL_SIZES, gradePattern, resolveProjectStandards, type PatternProject } from '@/lib/grading-engine';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Download, Printer, FileCheck2, Upload, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { getLabStatCopy, type LabStatCopy } from '@/lib/lab-stat-copy';
import { getGradingCopy } from '@/lib/grading-copy';
import { checkReadiness } from '@/lib/pattern-readiness';
import { runTechEditAudit } from '@/lib/tech-edit-audit';
import { HumanReviewCard } from '@/components/human-review-card';
import { getToastCopy } from '@/lib/toast-copy';
import { BodySchematic } from '@/components/body-schematic';
import { buildGradingCsv } from '@/lib/grading-csv';
import { copyTextOrThrow } from '@/lib/clipboard';
import { downloadJsonFile } from '@/lib/storage-lib';
import { buildHandoffEvidence } from '@/lib/handoff-evidence';
import { getHandoffCopy } from '@/lib/handoff-copy';
import { McpGradingAssistantCard } from '@/components/mcp-grading-assistant-card';

export default function ProjectGrading() {
  const params = useParams();
  const id = params.id;
  const projectHook = useProject(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { customStandard, language } = useSettings();
  const ls: LabStatCopy = getLabStatCopy(language);
  const gradingCopy = getGradingCopy(language);
  const tc = getToastCopy(language);
  const handoffCopy = getHandoffCopy(language);
  const { importProject } = useProjects();
  const [isImporting, setIsImporting] = React.useState(false);
  const recoveryFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (recoveryFileInputRef.current) recoveryFileInputRef.current.value = '';
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.name || !parsed.sections) throw new Error('Invalid format');
        importProject(parsed as PatternProject);
        toast({ title: tc.projectImportedDescription(parsed.name) });
      } catch (err) {
        toast({ title: ls.projectNotFound, description: tc.fileCouldNotBeRead, variant: 'destructive' });
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

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
          </div>

          <Button variant="outline" className="w-full h-11" onClick={() => setLocation('/')}>
            {ls.returnToDashboard}
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

  const { project, updateProject } = projectHook;
  const gradingResults = gradePattern(project, resolveProjectStandards(project, customStandard));
  const readiness = checkReadiness(project, customStandard);
  const audit = runTechEditAudit(project);
  const hasData = gradingResults.some(s => s.measurements.length > 0);
  const usedGradingKeys = Array.from(
    new Set(gradingResults.flatMap(s => s.measurements.map(m => m.gradingKey)))
  );

  const handleCopyTable = () => {
    let tsv = `${gradingCopy.measurementHeader}\t${ALL_SIZES.join('\t')}\n`;
    gradingResults.forEach(section => {
      tsv += `${section.sectionName.toUpperCase()}\n`;
      section.measurements.forEach(m => {
        const rowData = ALL_SIZES.map(size => {
          const val = m.gradedValues.find(v => v.size === size);
          let str = `${val?.stitchCount} ${gradingCopy.stitches.toLowerCase()}`;
          if (val?.rowCount !== undefined) str += ` / ${val.rowCount} ${gradingCopy.rowsLabel.toLowerCase()}`;
          return str;
        });
        tsv += `${m.label}\t${rowData.join('\t')}\n`;
      });
      tsv += '\n';
    });

    copyTextOrThrow(tsv).then(() => {
      toast({ title: tc.tableCopied, description: tc.tableCopiedDescription });
    }).catch(() => {
      toast({ title: tc.copyFailed, description: tc.copyFailedSelectManually });
    });
  };

  const handleDownloadCSV = () => {
    const csv = buildGradingCsv(gradingResults, project.gauge?.unit || 'in', {
      section: gradingCopy.csvSection,
      measurement: gradingCopy.csvMeasurement,
      property: gradingCopy.csvProperty,
      stitches: gradingCopy.stitches,
      rows: gradingCopy.rowsLabel,
      physical: gradingCopy.csvPhysical
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `${project.name.replace(/\s+/g, '-').toLowerCase()}-grading.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => window.print();

  const handleDownloadHandoff = () => {
    const evidence = buildHandoffEvidence(project, readiness, audit);
    const filename = `${project.name.replace(/\s+/g, '-').toLowerCase()}-technical-handoff.json`;
    downloadJsonFile(evidence, filename);
    toast({ title: handoffCopy.downloadRequested, description: handoffCopy.downloadRequestedDescription });
  };

  return (
    <div id="sas-print-sheet" className="animate-in fade-in duration-500 mx-auto pb-24 print:pb-0 print:m-0 print:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 print:hidden">
        <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground self-start" onClick={() => setLocation(`/project/${project.id}`)} data-testid="button-back-to-project">
          <ArrowLeft className="w-4 h-4 mr-2" /> {gradingCopy.backToProject}
        </Button>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleCopyTable} disabled={!hasData} className="rounded-full bg-background min-h-11" data-testid="button-copy-table">
            <Copy className="w-4 h-4 mr-2" /> {gradingCopy.copyTsv}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={!hasData} className="rounded-full bg-background min-h-11" data-testid="button-download-csv">
            <Download className="w-4 h-4 mr-2" /> {gradingCopy.downloadCsv}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadHandoff} disabled={!hasData} className="rounded-full bg-background min-h-11" data-testid="button-download-handoff">
            <FileCheck2 className="w-4 h-4 mr-2" /> {handoffCopy.download}
          </Button>
          <Button size="sm" onClick={handlePrint} disabled={!hasData} className="bg-primary hover:bg-primary/90 rounded-full px-6 shadow-sm min-h-11" data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" /> {gradingCopy.printSheet}
          </Button>
        </div>
      </div>

      {hasData && (
        <div className="mt-6 print:hidden">
          <BodySchematic usedKeys={usedGradingKeys} />
        </div>
      )}

      <HumanReviewCard
        project={project}
        updateProject={updateProject}
        readiness={readiness}
        audit={audit}
      />

      <div className="bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border overflow-hidden print:shadow-none print:border-none print:p-0 print:bg-white">
        <div className="p-8 sm:p-12 border-b border-border bg-gradient-to-br from-background to-secondary/10 print:from-white print:to-white">
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground mb-4 tracking-tight print:text-black">{project.name}</h1>
            <p className="text-xl text-muted-foreground mb-8 font-medium print:text-gray-600">{gradingCopy.draftedBy} {project.author}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg print:border-gray-300 print:text-black">
                <span className="opacity-70 text-xs uppercase tracking-wider block mb-0.5">{gradingCopy.baseSize}</span>
                <span className="font-bold text-lg">{project.baseSize}</span>
              </div>
              <div className="bg-background border border-border px-4 py-2 rounded-lg shadow-sm print:border-gray-300 print:shadow-none">
                <span className="opacity-70 text-xs uppercase tracking-wider block mb-0.5 text-muted-foreground">Gauge</span>
                <span className="font-mono text-base font-semibold text-foreground print:text-black">{project.gauge?.stitchesPer4In ?? "—"}sts × {project.gauge?.rowsPer4In ?? "—"}rws</span> 
                <span className="text-muted-foreground ml-1">/ 4{(project.gauge?.unit || "in")}</span>
              </div>
            </div>
          </div>
        </div>

        {!hasData ? (
          <div className="text-center py-20 text-muted-foreground">
            {gradingCopy.gradingEmptyState}
          </div>
        ) : (
          <div className="p-0">
            {gradingResults.filter(s => s.measurements.length > 0).map((section, sIdx) => (
              <div key={section.sectionId} className={cn("border-b border-border last:border-b-0", sIdx % 2 === 1 ? "bg-muted/5 print:bg-white" : "bg-card print:bg-white")}>
                <div className="px-8 sm:px-12 py-5 bg-secondary/30 border-b border-border/50 print:bg-gray-100 print:border-gray-300">
                  <h3 className="font-serif font-bold text-2xl text-foreground tracking-tight print:text-black">
                    {section.sectionName}
                  </h3>
                </div>
                
                  <div className="grading-table-region overflow-x-auto print:overflow-visible" role="region" tabIndex={0} aria-describedby={`grading-table-hint-${section.sectionId}`}>
                  <div id={`grading-table-hint-${section.sectionId}`} className="flex items-center justify-between gap-4 px-8 sm:px-12 py-2 bg-muted/10 border-b border-border/30 text-[11px] leading-relaxed text-muted-foreground print:hidden">
                    <span>{gradingCopy.tableScrollHint}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider">XS–5XL</span>
                  </div>
                  <table className="grading-table w-full min-w-[1050px] text-left border-collapse print:text-black">
                    <thead className="bg-muted/20 text-muted-foreground print:bg-white print:text-gray-600">
                      <tr>
                        <th className="sticky left-0 z-20 bg-muted/20 p-4 sm:px-12 py-4 font-semibold border-r border-border/50 w-72 min-w-[240px] text-xs uppercase tracking-wider align-bottom print:static print:bg-white print:border-gray-300" scope="col">
                          {gradingCopy.measurementHeader}
                        </th>
                        {ALL_SIZES.map(size => (
                          <th key={size} className={cn(
                            "p-4 py-4 font-bold text-center border-r border-border/50 min-w-[90px] align-bottom print:border-gray-300", 
                            size === project.baseSize ? "bg-primary text-primary-foreground print:bg-black print:text-white" : "text-foreground print:text-black"
                          )} scope="col">
                            <div className="text-lg">{size}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 print:divide-gray-300">
                      {section.measurements.map((m) => {
                        const hasRows = m.gradedValues.some(v => v.rowCount !== undefined);
                        return (
                          <React.Fragment key={m.measurementId}>
                            <tr className="hover:bg-muted/5 transition-colors border-t border-border/40 first:border-t-0">
                              <td className="sticky left-0 z-10 bg-card p-4 sm:px-12 py-5 border-r border-border/50 print:static print:bg-white print:border-gray-300" rowSpan={hasRows ? 2 : 1}>
                                <div className="font-serif text-lg font-bold text-foreground print:text-black leading-tight">{m.label}</div>
                                <div className="text-[11px] font-medium text-muted-foreground mt-1.5 uppercase tracking-wider flex items-center gap-1.5 print:text-gray-500">
                                  <span>{gradingCopy.gradingKeys[m.gradingKey] || m.gradingKey}</span>
                                  <span className="w-1 h-1 rounded-full bg-border"></span>
                                  <span>{m.measurementType}</span>
                                </div>
                              </td>
                              {ALL_SIZES.map(size => {
                                const val = m.gradedValues.find(v => v.size === size);
                                const isBase = size === project.baseSize;
                                return (
                                  <td key={size} className={cn(
                                    "p-3 border-r border-border/50 text-center align-middle print:border-gray-300", 
                                    isBase ? "bg-primary/[0.04] print:bg-gray-50" : ""
                                  )}>
                                    <div className="flex flex-col items-center justify-center">
                                      <div className={cn("font-mono text-xl sm:text-2xl font-bold", isBase ? "text-primary" : "text-foreground print:text-black")}>
                                        {val?.stitchCount} <span className="text-[10px] sm:text-xs font-sans font-medium text-muted-foreground -ml-0.5 print:text-gray-500">{gradingCopy.stitches.toLowerCase()}</span>
                                      </div>
                                      {val && val.stitchCount !== val.exactStitchCount && (
                                        <div className="text-[9px] text-muted-foreground/60 font-mono" title={gradingCopy.exactValueTooltip}>
                                          {val.exactStitchCount}
                                        </div>
                                      )}
                                      <div className="mt-1.5">
                                        <div className="text-[10px] text-muted-foreground/70 font-mono bg-muted/30 border border-border/20 px-1.5 py-0.5 rounded shadow-sm inline-block print:border-gray-200 print:text-gray-400">
                                          {val?.physicalValue.toFixed(2)} {(project.gauge?.unit || "in")}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                            {hasRows && (
                              <tr className="hover:bg-muted/5 transition-colors bg-muted/5 print:bg-white">
                                {ALL_SIZES.map(size => {
                                  const val = m.gradedValues.find(v => v.size === size);
                                  const isBase = size === project.baseSize;
                                  return (
                                    <td key={size} className={cn(
                                      "p-2 border-r border-border/50 text-center align-middle print:border-gray-300", 
                                      isBase ? "bg-primary/[0.02] print:bg-gray-50" : ""
                                    )}>
                                      <div className="flex flex-col items-center justify-center">
                                        <div className="font-mono text-sm font-semibold text-accent print:text-gray-700">
                                          {val?.rowCount} <span className="text-[9px] font-sans font-medium text-muted-foreground/70 -ml-0.5 print:text-gray-500">{gradingCopy.rowsLabel.toLowerCase()}</span>
                                        </div>
                                        {val?.rowCount !== undefined && val.exactRowCount !== undefined && val.rowCount !== val.exactRowCount && (
                                          <div className="text-[9px] text-muted-foreground/50 font-mono" title={gradingCopy.exactValueTooltip}>
                                            {val.exactRowCount}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <McpGradingAssistantCard
        project={project}
        language={language}
        hasData={hasData}
        customStandard={customStandard}
      />
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: landscape; margin: 1cm; }
          .min-h-[100dvh] { min-height: auto; }
          header, nav, footer { display: none !important; }
          #sas-print-sheet, #sas-print-sheet * {
            background: white !important;
            color: black !important;
            border-color: #d1d5db !important;
            text-shadow: none !important;
            box-shadow: none !important;
          }
            #sas-print-sheet .grading-table-region { overflow: visible !important; }
            #sas-print-sheet .grading-table { min-width: 0 !important; width: 100% !important; table-layout: fixed; }
            #sas-print-sheet tr { break-inside: avoid; page-break-inside: avoid; }
            #sas-print-sheet [data-testid="button-print"] { display: none; }
            #sas-print-sheet th.print\\3a bg-black { background: #000 !important; color: #fff !important; }
        }
      `}} />
    </div>
  );
}
