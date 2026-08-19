import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useProject } from '@/context/ProjectsContext';
import { GRADING_KEY_LABELS, ALL_SIZES, gradePattern, resolveProjectStandards } from '@/lib/grading-engine';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Download, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { getGradingCopy } from '@/lib/grading-copy';
import { getToastCopy } from '@/lib/toast-copy';
import { BodySchematic } from '@/components/body-schematic';

export default function ProjectGrading() {
  const params = useParams();
  const id = params.id;
  const projectHook = useProject(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { customStandard, language } = useSettings();
  const gradingCopy = getGradingCopy(language);
  const tc = getToastCopy(language);

  if (!projectHook) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">Project Not Found</h2>
        <Button onClick={() => setLocation('/')}>Return to Dashboard</Button>
      </div>
    );
  }

  const { project } = projectHook;
  const gradingResults = gradePattern(project, resolveProjectStandards(project, customStandard));
  const hasData = gradingResults.some(s => s.measurements.length > 0);
  const usedGradingKeys = Array.from(
    new Set(gradingResults.flatMap(s => s.measurements.map(m => m.gradingKey)))
  );

  const handleCopyTable = () => {
    let tsv = `Measurement\t${ALL_SIZES.join('\t')}\n`;
    gradingResults.forEach(section => {
      tsv += `${section.sectionName.toUpperCase()}\n`;
      section.measurements.forEach(m => {
        const rowData = ALL_SIZES.map(size => {
          const val = m.gradedValues.find(v => v.size === size);
          let str = `${val?.stitchCount} sts`;
          if (val?.rowCount !== undefined) str += ` / ${val.rowCount} rows`;
          return str;
        });
        tsv += `${m.label}\t${rowData.join('\t')}\n`;
      });
      tsv += '\n';
    });

    navigator.clipboard.writeText(tsv).then(() => {
      toast({ title: tc.tableCopied, description: tc.tableCopiedDescription });
    });
  };

  const handleDownloadCSV = () => {
    let csv = `Section,Measurement,Property,${ALL_SIZES.join(',')}\n`;
    gradingResults.forEach(section => {
      section.measurements.forEach(m => {
        const stsRow = ALL_SIZES.map(size => m.gradedValues.find(v => v.size === size)?.stitchCount).join(',');
        csv += `"${section.sectionName}","${m.label}",Stitches,${stsRow}\n`;
        
        const hasRows = m.gradedValues.some(v => v.rowCount !== undefined);
        if (hasRows) {
          const rowsRow = ALL_SIZES.map(size => m.gradedValues.find(v => v.size === size)?.rowCount || '').join(',');
          csv += `"${section.sectionName}","${m.label}",Rows,${rowsRow}\n`;
        }
        
        const physRow = ALL_SIZES.map(size => m.gradedValues.find(v => v.size === size)?.physicalValue).join(',');
        csv += `"${section.sectionName}","${m.label}",Physical (${(project.gauge?.unit || "in")}),${physRow}\n`;
      });
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

  return (
    <div id="sas-print-sheet" className="animate-in fade-in duration-500 mx-auto pb-24 print:pb-0 print:m-0 print:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 print:hidden">
        <Button variant="ghost" className="pl-0 text-muted-foreground hover:text-foreground self-start" onClick={() => setLocation(`/project/${project.id}`)} data-testid="button-back-to-project">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project
        </Button>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleCopyTable} disabled={!hasData} className="rounded-full bg-background" data-testid="button-copy-table">
            <Copy className="w-4 h-4 mr-2" /> Copy TSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={!hasData} className="rounded-full bg-background" data-testid="button-download-csv">
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button size="sm" onClick={handlePrint} disabled={!hasData} className="bg-primary hover:bg-primary/90 rounded-full px-6 shadow-sm" data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" /> Print Sheet
          </Button>
        </div>
      </div>

      {hasData && (
        <div className="mt-6 print:hidden">
          <BodySchematic usedKeys={usedGradingKeys} />
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border overflow-hidden print:shadow-none print:border-none print:p-0 print:bg-white">
        <div className="p-8 sm:p-12 border-b border-border bg-gradient-to-br from-background to-secondary/10 print:from-white print:to-white">
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground mb-4 tracking-tight print:text-black">{project.name}</h1>
            <p className="text-xl text-muted-foreground mb-8 font-medium print:text-gray-600">Drafted by {project.author}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg print:border-gray-300 print:text-black">
                <span className="opacity-70 text-xs uppercase tracking-wider block mb-0.5">Base Size</span>
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
                
                <div className="overflow-x-auto" style={{ contain: 'layout inline-size' }}>
                  <table className="w-full text-left border-collapse print:text-black">
                    <thead className="bg-muted/20 text-muted-foreground print:bg-white print:text-gray-600">
                      <tr>
                        <th className="p-4 sm:px-12 py-4 font-semibold border-r border-border/50 w-72 min-w-[240px] text-xs uppercase tracking-wider align-bottom print:border-gray-300">
                          Measurement
                        </th>
                        {ALL_SIZES.map(size => (
                          <th key={size} className={cn(
                            "p-4 py-4 font-bold text-center border-r border-border/50 min-w-[90px] align-bottom print:border-gray-300", 
                            size === project.baseSize ? "bg-primary text-primary-foreground print:bg-black print:text-white" : "text-foreground print:text-black"
                          )}>
                            <div className="text-lg">{size}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 print:divide-gray-300">
                      {section.measurements.map((m) => (
                        <tr key={m.measurementId} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4 sm:px-12 py-6 border-r border-border/50 print:border-gray-300">
                            <div className="font-serif text-lg font-medium text-foreground print:text-black leading-tight">{m.label}</div>
                            <div className="text-[11px] font-medium text-muted-foreground mt-1.5 uppercase tracking-wider flex items-center gap-1.5 print:text-gray-500">
                              <span>{m.measurementType}</span>
                              <span className="w-1 h-1 rounded-full bg-border"></span>
                              <span>{GRADING_KEY_LABELS[m.gradingKey]}</span>
                            </div>
                          </td>
                          {ALL_SIZES.map(size => {
                            const val = m.gradedValues.find(v => v.size === size);
                            return (
                              <td key={size} className={cn(
                                "p-3 border-r border-border/50 text-center align-top print:border-gray-300", 
                                size === project.baseSize ? "bg-primary/[0.04] print:bg-gray-50" : ""
                              )}>
                                <div className="flex flex-col items-center justify-center gap-2 pt-2 h-full">
                                  <div className="font-mono text-xl sm:text-2xl font-bold text-foreground print:text-black">
                                    {val?.stitchCount} <span className="text-[10px] sm:text-xs font-sans font-medium text-muted-foreground -ml-0.5 print:text-gray-500">sts</span>
                                  </div>
                                  {val && val.stitchCount !== val.exactStitchCount && (
                                    <div className="text-[9px] text-muted-foreground/70 font-mono -mt-1.5" title="Exact value before rounding to fit the pattern repeat">
                                      exact: {val.exactStitchCount}
                                    </div>
                                  )}
                                  {val?.rowCount !== undefined && (
                                    <div className="font-mono text-sm font-semibold text-accent print:text-gray-700">
                                      {val.rowCount} <span className="text-[9px] font-sans font-medium text-muted-foreground/70 -ml-0.5 print:text-gray-500">rws</span>
                                    </div>
                                  )}
                                  {val?.rowCount !== undefined && val.exactRowCount !== undefined && val.rowCount !== val.exactRowCount && (
                                    <div className="text-[9px] text-muted-foreground/70 font-mono -mt-1.5" title="Exact value before rounding to fit the pattern repeat">
                                      exact: {val.exactRowCount}
                                    </div>
                                  )}
                                  <div className="mt-auto pt-3">
                                    <div className="text-[10px] text-muted-foreground/70 font-mono bg-background border border-border/40 px-1.5 py-0.5 rounded shadow-sm inline-block print:border-gray-200 print:text-gray-400">
                                      {val?.physicalValue.toFixed(2)} {(project.gauge?.unit || "in")}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
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
            #sas-print-sheet td, #sas-print-sheet th { break-inside: avoid; }
            #sas-print-sheet [data-testid="button-print"] { display: none; }
            #sas-print-sheet th.print\\3a bg-black { background: #000 !important; color: #fff !important; }
        }
      `}} />
    </div>
  );
}
