import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/context/SettingsContext';
import { getWorkspaceCopy } from '@/lib/workspace-copy';
import { FileSearch, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { normalizeArtifactInspectionReport } from '@/lib/artifact-inspection';
import { 
  type PatternProject,
  type PublicationArtifact,
  type ArtifactInspectionReport 
} from '@/lib/grading-engine';

interface ProjectArtifactInspectionCardProps {
  project: PatternProject;
  packageId: string;
  artifact: PublicationArtifact;
  onInspect: (report: ArtifactInspectionReport) => void;
  onClose: () => void;
}

export function ProjectArtifactInspectionCard({ 
  project, 
  packageId, 
  artifact, 
  onInspect,
  onClose
}: ProjectArtifactInspectionCardProps) {
  const { language } = useSettings();
  const copy = getWorkspaceCopy(language);
  const { toast } = useToast();

  const [pageCount, setPageCount] = useState<number>(artifact.inspectionReport?.pageCount ?? 0);
  const [hasBlankPages, setHasBlankPages] = useState<boolean>(artifact.inspectionReport?.hasBlankPages ?? false);
  const [hasTitle, setHasTitle] = useState<boolean>(artifact.inspectionReport?.hasTitle ?? false);
  const [hasHeadings, setHasHeadings] = useState<boolean>(artifact.inspectionReport?.hasHeadings ?? false);
  const [hasTableContinuity, setHasTableContinuity] = useState<boolean>(artifact.inspectionReport?.hasTableContinuity ?? false);
  const [hasCharts, setHasCharts] = useState<boolean>(artifact.inspectionReport?.hasCharts ?? false);
  const [hasSchematics, setHasSchematics] = useState<boolean>(artifact.inspectionReport?.hasSchematics ?? false);
  const [verdict, setVerdict] = useState<'pass' | 'fail' | 'warning'>(artifact.inspectionReport?.verdict ?? 'warning');
  const [notes, setNotes] = useState<string>(artifact.inspectionReport?.notes ?? '');
  const effectiveVerdict = normalizeArtifactInspectionReport({
    pageCount,
    hasBlankPages,
    hasTitle,
    hasHeadings,
    hasTableContinuity,
    hasCharts,
    hasSchematics,
    rendererVersion: '1.0.0',
    templateId: 'standard-v1',
    locale: language,
    inspectedAt: '',
    inspector: 'human',
    verdict,
  }).verdict;

  const handleSave = () => {
    const report: ArtifactInspectionReport = {
      pageCount,
      hasBlankPages,
      hasTitle,
      hasHeadings,
      hasTableContinuity,
      hasCharts,
      hasSchematics,
      rendererVersion: '1.0.0', // Current internal version
      templateId: 'standard-v1',
      locale: language,
      inspectedAt: new Date().toISOString(),
      inspector: 'human',
      verdict: effectiveVerdict,
      notes: notes.trim() || undefined,
    };

    onInspect(report);
    toast({ title: copy.inspectionReportSaved });
    onClose();
  };

  const getVerdictLabel = (v: string) => {
    switch (v) {
      case 'pass': return copy.inspectionVerdictPass;
      case 'warning': return copy.inspectionVerdictWarning;
      case 'fail': return copy.inspectionVerdictFail;
      default: return v;
    }
  };

  return (
    <Card className="w-full border-primary/20 shadow-lg">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>{copy.inspectionTitle}</CardTitle>
              <CardDescription>{artifact.filename}</CardDescription>
            </div>
          </div>
          <Badge variant={effectiveVerdict === 'pass' ? 'default' : effectiveVerdict === 'fail' ? 'destructive' : 'outline'} className="capitalize">
            {getVerdictLabel(effectiveVerdict)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="page-count">{copy.inspectionPageCount}</Label>
              <Input 
                id="page-count" 
                type="number" 
                value={pageCount} 
                onChange={e => setPageCount(parseInt(e.target.value) || 0)} 
              />
            </div>
            
            <div className="flex items-center justify-between p-2 rounded border bg-muted/30">
              <Label htmlFor="blank-pages" className="cursor-pointer">{copy.inspectionBlankPages}</Label>
              <Switch id="blank-pages" checked={hasBlankPages} onCheckedChange={setHasBlankPages} />
            </div>

            <div className="flex items-center justify-between p-2 rounded border bg-muted/30">
              <Label htmlFor="has-title" className="cursor-pointer">{copy.inspectionTitlePresent}</Label>
              <Switch id="has-title" checked={hasTitle} onCheckedChange={setHasTitle} />
            </div>

            <div className="flex items-center justify-between p-2 rounded border bg-muted/30">
              <Label htmlFor="has-headings" className="cursor-pointer">{copy.inspectionHeadingsCorrect}</Label>
              <Switch id="has-headings" checked={hasHeadings} onCheckedChange={setHasHeadings} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 rounded border bg-muted/30">
              <Label htmlFor="table-cont" className="cursor-pointer">{copy.inspectionTableContinuity}</Label>
              <Switch id="table-cont" checked={hasTableContinuity} onCheckedChange={setHasTableContinuity} />
            </div>

            <div className="flex items-center justify-between p-2 rounded border bg-muted/30">
              <Label htmlFor="has-charts" className="cursor-pointer">{copy.inspectionChartsPresent}</Label>
              <Switch id="has-charts" checked={hasCharts} onCheckedChange={setHasCharts} />
            </div>

            <div className="flex items-center justify-between p-2 rounded border bg-muted/30">
              <Label htmlFor="has-schem" className="cursor-pointer">{copy.inspectionSchematicsPresent}</Label>
              <Switch id="has-schem" checked={hasSchematics} onCheckedChange={setHasSchematics} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="verdict">{copy.inspectionFinalVerdict}</Label>
              <Select value={effectiveVerdict} onValueChange={(v: 'pass' | 'fail' | 'warning') => setVerdict(v)}>
                <SelectTrigger id="verdict">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">{copy.inspectionVerdictPass}</SelectItem>
                  <SelectItem value="warning">{copy.inspectionVerdictWarning}</SelectItem>
                  <SelectItem value="fail">{copy.inspectionVerdictFail}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">{copy.inspectionNotes}</Label>
          <Textarea 
            id="notes" 
            placeholder={copy.inspectionNotesPlaceholder}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>{copy.renameCancel}</Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            {copy.inspectionSaveReport}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
