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
import { useProject } from '@/context/ProjectsContext';
import { CheckCircle2, AlertCircle, Clock, Plus, Trash2, ShieldCheck, UserCheck, MessageSquare, Send, Calendar, MapPin, User, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { COLLABORATION_COPY } from '@/lib/collaboration-copy';
import { ReadinessComment, ReadinessIssueStatus } from '@/lib/grading-engine';
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
  const [issueLocation, setIssueLocation] = useState('');
  const [issueAssignee, setIssueAssignee] = useState('');
  const [issueDueDate, setIssueDueDate] = useState('');
  const [issueAffectedSizes, setIssueAffectedSizes] = useState<string[]>([]);
  const [issueReproduction, setIssueReproduction] = useState('');
  const [issueDisposition, setIssueDisposition] = useState<'accepted' | 'rejected' | 'deferred'>('accepted');
  const [issueResolutionNote, setIssueResolutionNote] = useState('');
  const [issueSourceRunId, setIssueSourceRunId] = useState('');

  const [commentText, setCommentText] = useState('');
  const [activeIssue, setActiveIssue] = useState<{ stage: ReadinessStage; issueId: string } | null>(null);
  const colCopy = COLLABORATION_COPY[language];

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

  const projectDispatchers = useProject(project.id);

  const handleAddIssue = () => {
    if (!activeStage || !issueDescription.trim() || !projectDispatchers) return;

    const newIssue: ReadinessIssue = {
      id: generateId(),
      severity: issueSeverity,
      description: issueDescription,
      evidence: issueEvidence || undefined,
      location: issueLocation || undefined,
      affectedSizes: issueAffectedSizes.length > 0 ? issueAffectedSizes as any : undefined,
      reproductionState: issueReproduction || undefined,
      disposition: issueDisposition,
      resolutionNote: issueResolutionNote || undefined,
      sourceRunId: issueSourceRunId || undefined,
      assignee: issueAssignee || undefined,
      dueDate: issueDueDate || undefined,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: []
    };

    projectDispatchers.addReadinessIssue(activeStage, newIssue);
    setIssueDescription('');
    setIssueEvidence('');
    setIssueLocation('');
    setIssueAffectedSizes([]);
    setIssueReproduction('');
    setIssueDisposition('accepted');
    setIssueResolutionNote('');
    setIssueSourceRunId('');
    setIssueAssignee('');
    setIssueDueDate('');
    setIssueSeverity('minor');
    setIsIssueDialogOpen(false);
    toast({ title: copy.readinessContractUpdated });
  };

  const handleAddComment = (stage: ReadinessStage, issueId: string) => {
    if (!commentText.trim() || !projectDispatchers) return;
    const comment: ReadinessComment = {
      id: generateId(),
      author: 'Designer',
      text: commentText,
      createdAt: new Date().toISOString()
    };
    
    projectDispatchers.addIssueComment(stage, issueId, comment);
    setCommentText('');
  };

  const handleToggleIssueStatus = (stage: ReadinessStage, issueId: string) => {
    if (!projectDispatchers) return;
    const signOff = contract.signOffs.find(s => s.stage === stage);
    const issue = signOff?.issues.find(i => i.id === issueId);
    if (!issue) return;

    let nextStatus: ReadinessIssueStatus;
    switch (issue.status) {
      case 'open': nextStatus = 'fixed'; break;
      case 'fixed': nextStatus = 'verified'; break;
      case 'verified': nextStatus = 'needs-test-knit'; break;
      case 'needs-test-knit': nextStatus = 'open'; break;
      default: nextStatus = 'open';
    }
    projectDispatchers.updateReadinessIssue(stage, issueId, { status: nextStatus });
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

  const getIssueStatusBadge = (status: ReadinessIssueStatus) => {
    switch (status) {
      case 'verified': return <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-tighter bg-green-50 text-green-700 border-green-200">{copy.readinessStatusVerified}</Badge>;
      case 'fixed': return <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-tighter bg-blue-50 text-blue-700 border-blue-200">{copy.readinessStatusFixed}</Badge>;
      case 'needs-test-knit': return <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-tighter bg-purple-50 text-purple-700 border-purple-200">{colCopy.statusNeedsTestKnit}</Badge>;
      default: return <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-tighter">{copy.readinessStatusOpen}</Badge>;
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
            {copy.readinessPublicationReady}
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
                  <React.Fragment key={issue.id}>
                    <div 
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
                          <div className="flex flex-wrap items-center gap-2">
                            {getIssueStatusBadge(issue.status)}
                            {issue.affectedSizes && issue.affectedSizes.length > 0 && (
                              <Badge variant="outline" className="text-[8px] px-1 h-3.5 bg-accent/10 border-accent/20">
                                {issue.affectedSizes.join(', ')}
                              </Badge>
                            )}
                            {issue.disposition && issue.disposition !== 'accepted' && (
                              <Badge variant="outline" className="text-[8px] px-1 h-3.5 bg-orange-50 text-orange-700 border-orange-200 uppercase tracking-tighter">
                                {issue.disposition === 'rejected' ? copy.readinessDispositionRejected : copy.readinessDispositionDeferred}
                              </Badge>
                            )}
                            {issue.location && (
                              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="h-2 w-2" /> {issue.location}
                              </span>
                            )}
                            {issue.assignee && (
                              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                <User className="h-2 w-2" /> {issue.assignee}
                              </span>
                            )}
                            {issue.dueDate && (
                              <span className="text-[9px] text-amber-600 font-medium flex items-center gap-0.5">
                                <Calendar className="h-2 w-2" /> {issue.dueDate}
                              </span>
                            )}
                            <span className="text-[9px] text-muted-foreground">
                              {formatDate(issue.updatedAt)}
                            </span>
                            {issue.sourceRunId && (
                              <Badge variant="outline" className="text-[8px] px-1 h-3.5 bg-blue-50/50 text-blue-600 border-blue-100 font-mono">
                                RUN: {issue.sourceRunId}
                              </Badge>
                            )}
                          </div>
                          {(issue.evidence || issue.reproductionState || issue.resolutionNote) && (
                            <div className="mt-2 space-y-1.5 border-t pt-1.5">
                              {issue.evidence && (
                                <div className="text-[10px] text-muted-foreground">
                                  <span className="font-semibold text-[9px] uppercase tracking-wider text-primary/70 mr-1">{colCopy.evidenceLabel}:</span>
                                  {issue.evidence}
                                </div>
                              )}
                              {issue.reproductionState && (
                                <div className="text-[10px] text-muted-foreground">
                                  <span className="font-semibold text-[9px] uppercase tracking-wider text-primary/70 mr-1">{colCopy.reproductionLabel}:</span>
                                  {issue.reproductionState}
                                </div>
                              )}
                              {issue.resolutionNote && (
                                <div className="text-[10px] text-green-700 font-medium bg-green-50/50 p-1 rounded">
                                  <span className="font-semibold text-[9px] uppercase tracking-wider mr-1">{colCopy.resolutionLabel}:</span>
                                  {issue.resolutionNote}
                                </div>
                              )}
                            </div>
                          )}
                          {issue.disposition && issue.disposition !== 'accepted' && (
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="text-[9px] font-bold uppercase text-amber-600 bg-amber-50 px-1 rounded border border-amber-100">
                                {issue.disposition}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveIssue(activeIssue?.issueId === issue.id ? null : { stage: signOff.stage, issueId: issue.id });
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        {issue.comments && issue.comments.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] rounded-full h-3 w-3 flex items-center justify-center">
                            {issue.comments.length}
                          </span>
                        )}
                      </Button>
                    </div>

                    {activeIssue?.issueId === issue.id && (
                      <div className="ml-8 mt-2 space-y-2 border-l-2 border-muted pl-3 pb-2 animate-in slide-in-from-top-1 duration-200">
                        {(issue.comments || []).map(comment => (
                          <div key={comment.id} className="text-[11px] space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{comment.author}</span>
                              <span className="text-[9px] text-muted-foreground">{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-muted-foreground">{comment.text}</p>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 pt-1">
                          <Input 
                            placeholder={colCopy.commentPlaceholder} 
                            className="h-7 text-[11px]" 
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddComment(signOff.stage, issue.id)}
                          />
                          <Button 
                            size="icon" 
                            className="h-7 w-7 shrink-0" 
                            onClick={() => handleAddComment(signOff.stage, issue.id)}
                            disabled={!commentText.trim()}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
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
              {activeStage && copy.readinessDialogDescription(getStageLabel(activeStage))}
            </DialogDescription>
          </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid gap-2">
                <Label htmlFor="issue-desc">{copy.readinessIssueDescription}</Label>
                <Input
                  id="issue-desc"
                  placeholder={copy.readinessIssuePlaceholderDesc}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>{copy.readinessIssueSeverity}</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="issue-location">{colCopy.locationLabel}</Label>
                  <Input
                    id="issue-location"
                    placeholder="e.g. Body › Bust"
                    value={issueLocation}
                    onChange={(e) => setIssueLocation(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="issue-assignee">{colCopy.assigneeLabel}</Label>
                  <Input
                    id="issue-assignee"
                    placeholder="e.g. Jane Doe"
                    value={issueAssignee}
                    onChange={(e) => setIssueAssignee(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="issue-due">{colCopy.dueDateLabel}</Label>
                  <Input
                    id="issue-due"
                    type="date"
                    value={issueDueDate}
                    onChange={(e) => setIssueDueDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{colCopy.dispositionLabel}</Label>
                  <Select value={issueDisposition} onValueChange={(v: any) => setIssueDisposition(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accepted">{copy.readinessDispositionAccepted}</SelectItem>
                      <SelectItem value="rejected">{copy.readinessDispositionRejected}</SelectItem>
                      <SelectItem value="deferred">{copy.readinessDispositionDeferred}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{copy.readinessIssueAffectedSizes}</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/20">
                  {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].map((size: string) => (
                    <div key={size} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id={`size-${size}`}
                        checked={issueAffectedSizes.includes(size)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setIssueAffectedSizes(prev => [...prev, size]);
                          } else {
                            setIssueAffectedSizes(prev => prev.filter(s => s !== size));
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor={`size-${size}`} className="text-xs font-normal cursor-pointer">{size}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issue-reproduction">{colCopy.reproductionLabel}</Label>
                <Input
                  id="issue-reproduction"
                  placeholder={copy.readinessIssuePlaceholderReproduction}
                  value={issueReproduction}
                  onChange={(e) => setIssueReproduction(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issue-evidence">{colCopy.evidenceLabel} ({copy.readinessIssueOptional})</Label>
                <Textarea
                  id="issue-evidence"
                  placeholder={copy.readinessIssuePlaceholderEvidence}
                  value={issueEvidence}
                  onChange={(e) => setIssueEvidence(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issue-resolution">{colCopy.resolutionLabel} ({copy.readinessIssueOptional})</Label>
                <Input
                  id="issue-resolution"
                  placeholder={copy.readinessIssuePlaceholderResolution}
                  value={issueResolutionNote}
                  onChange={(e) => setIssueResolutionNote(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issue-source-run">{copy.readinessIssueSourceRun} ({copy.readinessIssueOptional})</Label>
                <Input
                  id="issue-source-run"
                  placeholder={copy.readinessIssuePlaceholderSourceRun}
                  value={issueSourceRunId}
                  onChange={(e) => setIssueSourceRunId(e.target.value)}
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
