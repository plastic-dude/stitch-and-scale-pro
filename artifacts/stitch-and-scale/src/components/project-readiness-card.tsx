import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/context/SettingsContext';
import { useWorkspaceCopy } from '@/lib/workspace-copy';
import { CheckCircle2, AlertCircle, Clock, Plus, Trash2, ShieldCheck, UserCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de, fr, es, ptBR } from 'date-fns/locale';
import { 
  type PatternProject, 
  type PublicationContract, 
  type ReadinessStage, 
  type ReadinessSeverity,
  type ReadinessIssue,
  type ReadinessStageStatus,
  generateId 
} from '@/lib/grading-engine';

const dateLocales = { de, fr, es, pt: ptBR, en: undefined };

interface ProjectReadinessCardProps {
  project: PatternProject;
  updateContract: (contract: PublicationContract) => void;
}

export function ProjectReadinessCard({ project, updateContract }: ProjectReadinessCardProps) {
  const { language } = useSettings();
  const copy = useWorkspaceCopy(language);
  const { toast } = useToast();

  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [activeStage, setActiveStage] = useState<ReadinessStage | null>(null);
  
  // Issue Form State
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<ReadinessSeverity>('minor');
  const [issueEvidence, setIssueEvidence] = useState('');

  const contract: PublicationContract = project.publicationContract || {
    version: '1.0.0',
    signOffs: [
      { stage: 'mathematical', status: 'pending', issues: [] },
      { stage: 'editorial', status: 'pending', issues: [] },
      { stage: 'test-knit', status: 'pending', issues: [] },
      { stage: 'final', status: 'pending', issues: [] },
    ],
    isReady: false,
    updatedAt: new Date().toISOString(),
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'PPp', { locale: dateLocales[language as keyof typeof dateLocales] });
    } catch {
      return dateStr;
    }
  };

  const handleAddIssue = () => {
    if (!activeStage || !issueDescription.trim()) return;

    const newIssue: ReadinessIssue = {
      id: generateId(),
      severity: issueSeverity,
      description: issueDescription,
      evidence: issueEvidence || undefined,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newSignOffs = contract.signOffs.map(s => {
      if (s.stage === activeStage) {
        return {
          ...s,
          issues: [...s.issues, newIssue],
          status: 'blocked' as const,
        };
      }
      return s;
    });

    const newContract: PublicationContract = {
      ...contract,
      signOffs: newSignOffs,
      isReady: false,
      updatedAt: new Date().toISOString(),
    };

    updateContract(newContract);
    setIssueDescription('');
    setIssueEvidence('');
    setIssueSeverity('minor');
    setIsIssueDialogOpen(false);
    toast({ title: copy.readinessContractUpdated });
  };

  const handleToggleIssueStatus = (stage: ReadinessStage, issueId: string) => {
    const newSignOffs = contract.signOffs.map(s => {
      if (s.stage === stage) {
        const newIssues = s.issues.map(i => {
          if (i.id === issueId) {
            const nextStatus: any = i.status === 'open' ? 'fixed' : i.status === 'fixed' ? 'verified' : 'open';
            return { ...i, status: nextStatus, updatedAt: new Date().toISOString() };
          }
          return i;
        });
        
        // Auto-update stage status based on issues
        const allResolved = newIssues.every(i => i.status === 'verified');
        const nextStatus: ReadinessStageStatus = allResolved ? (s.approver ? 'ready' : 'pending') : 'blocked';
        return {
          ...s,
          issues: newIssues,
          status: nextStatus,
        };
      }
      return s;
    });

    updateContract({
      ...contract,
      signOffs: newSignOffs,
      isReady: newSignOffs.every(s => s.status === 'ready'),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSignOff = (stage: ReadinessStage) => {
    const newSignOffs = contract.signOffs.map(s => {
      if (s.stage === stage) {
        const allVerified = s.issues.every(i => i.status === 'verified');
        if (!allVerified) return s;

        return {
          ...s,
          status: 'ready' as const,
          approver: project.author || 'Designer',
          approvedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    updateContract({
      ...contract,
      signOffs: newSignOffs,
      isReady: newSignOffs.every(s => s.status === 'ready'),
      updatedAt: new Date().toISOString(),
    });
  };

  const getStageLabel = (stage: ReadinessStage) => {
    switch (stage) {
      case 'mathematical': return copy.readinessStageMathematical;
      case 'editorial': return copy.readinessStageEditorial;
      case 'test-knit': return copy.readinessStageTestKnit;
      case 'final': return copy.readinessStageFinal;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready': return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200 shadow-none"><CheckCircle2 className="h-3 w-3 mr-1" />{copy.readinessStatusReady}</Badge>;
      case 'blocked': return <Badge variant="destructive" className="shadow-none"><AlertCircle className="h-3 w-3 mr-1" />{copy.readinessStatusBlocked}</Badge>;
      default: return <Badge variant="secondary" className="shadow-none"><Clock className="h-3 w-3 mr-1" />{copy.readinessStatusPending}</Badge>;
    }
  };

  const getSeverityColor = (severity: ReadinessSeverity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-100';
      case 'major': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'minor': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'nitpick': return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {copy.readinessTitle}
          </CardTitle>
          <CardDescription>{copy.readinessDescription}</CardDescription>
        </div>
        {contract.isReady && (
          <Badge className="bg-green-600 text-white animate-pulse">
            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
            PUBLICATION READY
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto min-h-[400px] pt-4 space-y-6">
        {contract.signOffs.map((signOff) => (
          <div key={signOff.stage} className="space-y-3 p-4 border rounded-xl bg-accent/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-base">{getStageLabel(signOff.stage)}</h4>
                {getStatusBadge(signOff.status)}
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1.5"
                  onClick={() => {
                    setActiveStage(signOff.stage);
                    setIsIssueDialogOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {copy.readinessAddIssue}
                </Button>
                
                {signOff.status !== 'ready' && signOff.issues.every(i => i.status === 'verified') && (
                  <Button 
                    size="sm" 
                    className="h-8 bg-primary/90 hover:bg-primary"
                    onClick={() => handleSignOff(signOff.stage)}
                  >
                    {copy.readinessSignOff}
                  </Button>
                )}
              </div>
            </div>

            {signOff.approver && (
              <p className="text-[10px] text-muted-foreground italic">
                {copy.readinessApprovedBy(signOff.approver, formatDate(signOff.approvedAt!))}
              </p>
            )}

            <div className="space-y-2 mt-2">
              {signOff.issues.length === 0 ? (
                <p className="text-xs text-muted-foreground opacity-60 italic">{copy.readinessNoIssues}</p>
              ) : (
                signOff.issues.map((issue) => (
                  <div 
                    key={issue.id} 
                    className={`flex items-start justify-between p-2.5 border rounded-lg bg-white shadow-sm transition-all cursor-pointer hover:border-primary/30 ${issue.status === 'verified' ? 'opacity-50 grayscale' : ''}`}
                    onClick={() => handleToggleIssueStatus(signOff.stage, issue.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 p-1 rounded-md border ${getSeverityColor(issue.severity)}`}>
                        <AlertCircle className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-1">
                        <p className={`text-sm leading-tight ${issue.status === 'verified' ? 'line-through' : ''}`}>
                          {issue.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-tighter">
                            {issue.status}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground">
                            {formatDate(issue.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{copy.readinessAddIssue}</DialogTitle>
              <DialogDescription>
                Report a finding or blocker for the {activeStage && getStageLabel(activeStage)} stage.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="issue-desc">Description</Label>
                <Input
                  id="issue-desc"
                  placeholder="e.g. Grading error in XL sleeve cap"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Severity</Label>
                <Select value={issueSeverity} onValueChange={(v: any) => setIssueSeverity(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nitpick">{copy.readinessIssueSeverityNitpick}</SelectItem>
                    <SelectItem value="minor">{copy.readinessIssueSeverityMinor}</SelectItem>
                    <SelectItem value="major">{copy.readinessIssueSeverityMajor}</SelectItem>
                    <SelectItem value="critical">{copy.readinessIssueSeverityCritical}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issue-evidence">Evidence (optional)</Label>
                <Textarea
                  id="issue-evidence"
                  placeholder="Paste relevant stitch counts or measurements..."
                  value={issueEvidence}
                  onChange={(e) => setIssueEvidence(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsIssueDialogOpen(false)}>
                {copy.renameCancel}
              </Button>
              <Button onClick={handleAddIssue} disabled={!issueDescription.trim()}>
                {copy.renameSave}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
