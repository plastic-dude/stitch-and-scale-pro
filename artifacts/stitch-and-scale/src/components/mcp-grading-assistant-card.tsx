import React from 'react';
import { Copy, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/clipboard';
import { getToastCopy } from '@/lib/toast-copy';
import { MCP_ASSISTANT_COPY } from '@/lib/mcp-assistant-copy';
import { isMcpGradeOutput, runMcpGrading, type McpGradeOutput } from '@/lib/mcp-contract';
import type { LanguageCode } from '@/lib/i18n';
import type { PatternProject } from '@/lib/grading-engine';

interface McpGradingAssistantCardProps {
  project: PatternProject;
  language: LanguageCode;
  hasData: boolean;
  customStandard?: PatternProject['customStandardSnapshot'];
}

function briefFromGrade(grade: McpGradeOutput): string {
  const measurementCount = grade.sections.reduce((total, section) => total + section.measurements.length, 0);
  const warnings = grade.warnings.length ? grade.warnings : ['No calculation warnings were reported.'];
  return [
    'You are a careful, age-appropriate knitwear grading tutor.',
    'Use only the deterministic facts below. Do not invent measurements, recalculate the grade, diagnose fit on a person, or make project changes.',
    'Explain uncertainty plainly and ask the designer to verify the source measurement before acting on a suggestion.',
    '',
    'STITCH & SCALE — READ-ONLY GRADING BRIEF',
    `Contract: MCP ${grade.schemaVersion}; calculation: ${grade.calculationVersion}; grading lab: ${grade.gradingLabVersion}`,
    `Project: ${grade.projectId}`,
    `Revision: ${grade.projectRevision}`,
    `Base size: ${grade.sections.length ? 'see project snapshot supplied by the caller' : 'unknown'}`,
    `Gauge: ${grade.gauge.stitchesPer4In} stitches × ${grade.gauge.rowsPer4In} rows / 4 ${grade.gauge.unit}`,
    `Sections: ${grade.sections.length}; measurements: ${measurementCount}; graded sizes: ${grade.analysis.gradedSizeCount}`,
    `Verdict: ${grade.analysis.verdict}`,
    `Verdict reason: ${grade.analysis.verdictReason}`,
    `Standards source: ${grade.standardsSource}`,
    '',
    'WARNINGS',
    ...warnings.map((warning) => `- ${warning}`),
    '',
    'CALCULATED TABLE',
    JSON.stringify(grade.sections, null, 2),
    '',
    'SAFE RESPONSE RULES',
    '- Separate calculated facts from teaching suggestions.',
    '- Never claim that the garment will fit a particular body without a proper fit review.',
    '- Keep the explanation supportive, concrete, and suitable for a young learner.',
    '- Ask before proposing any change to the project.',
  ].join('\n');
}

export function McpGradingAssistantCard({ project, language, hasData, customStandard }: McpGradingAssistantCardProps) {
  const copy = MCP_ASSISTANT_COPY[language] ?? MCP_ASSISTANT_COPY.en;
  const { toast } = useToast();
  const toastCopy = getToastCopy(language);
  const [brief, setBrief] = React.useState('');

  const prepareBrief = () => {
    if (!hasData) return;
    const snapshot: PatternProject = customStandard
      ? { ...project, sizingStandard: 'Custom', customStandardSnapshot: customStandard }
      : project;
    const result = runMcpGrading(snapshot);
    if (!isMcpGradeOutput(result)) {
      setBrief(JSON.stringify(result, null, 2));
      return;
    }
    setBrief(briefFromGrade(result));
  };

  const handleCopy = async () => {
    const result = await copyToClipboard(brief);
    toast(result.ok
      ? { title: copy.copied, description: toastCopy.tableCopiedDescription }
      : { title: copy.copyFailed, description: copy.copyFailed });
  };

  return (
    <Card className="mt-6 border-primary/20 bg-primary/[0.03] print:hidden" data-testid="card-mcp-grading-assistant">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
	          <div className="rounded-xl bg-primary/10 p-2 text-primary" aria-hidden="true">
	            <Sparkles className="h-5 w-5" />
	          </div>
          <div className="min-w-0">
            <CardTitle className="font-serif text-xl">{copy.title}</CardTitle>
            <CardDescription className="mt-1">{copy.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 bg-background/70 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />{copy.privacyTitle}</div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{copy.privacyBody}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background/70 p-3">
            <div className="text-sm font-semibold">{copy.mathTitle}</div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{copy.mathBody}</p>
          </div>
        </div>
        <p className="text-xs font-medium text-muted-foreground">{copy.optional}</p>
        {!hasData ? (
          <p className="text-sm text-muted-foreground" data-testid="text-mcp-assistant-disabled">{copy.disabledForIncomplete}</p>
        ) : (
          <Button type="button" variant="outline" onClick={prepareBrief} className="min-h-11" data-testid="button-prepare-ai-brief">
            <Sparkles className="mr-2 h-4 w-4" />{copy.prepare}
          </Button>
        )}
        {brief && (
          <div className="space-y-3" data-testid="mcp-assistant-result">
            <div>
              <p className="text-sm font-semibold">{copy.preparedTitle}</p>
              <p className="text-xs text-muted-foreground">{copy.preparedBody}</p>
            </div>
            <Textarea value={brief} readOnly rows={12} aria-label={copy.preparedTitle} className="font-mono text-xs leading-relaxed" />
            <Button type="button" onClick={handleCopy} className="min-h-11" data-testid="button-copy-ai-brief">
              <Copy className="mr-2 h-4 w-4" />{copy.copyBrief}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
