import React, { useState } from 'react';
import { Plus, Trash2, Calendar, LayoutGrid, CheckCircle2, XCircle, Clock, Undo2, Edit2 } from 'lucide-react';
import { type PatternProject, type ProjectSubmission, type SubmissionStatus, generateId } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { COLLABORATION_COPY } from '@/lib/collaboration-copy';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SubmissionPipelineCardProps {
  project: PatternProject;
  addSubmission: (submission: ProjectSubmission) => void;
  updateSubmission: (submissionId: string, patch: Partial<ProjectSubmission>) => void;
  deleteSubmission: (submissionId: string) => void;
}

export function SubmissionPipelineCard({
  project,
  addSubmission,
  updateSubmission,
  deleteSubmission
}: SubmissionPipelineCardProps) {
  const { language } = useSettings();
  const LAB = COLLABORATION_COPY[language];
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ProjectSubmission>>({
    outlet: '',
    outcome: 'planned',
    notes: ''
  });

  const handleOpenAdd = () => {
    setFormData({ outlet: '', outcome: 'planned', notes: '' });
    setEditingId(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (submission: ProjectSubmission) => {
    setFormData({ ...submission });
    setEditingId(submission.id);
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!formData.outlet) {
      toast.error(LAB.outletLabel + ' is required');
      return;
    }

    if (editingId) {
      updateSubmission(editingId, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      toast.success(LAB.submissionUpdated);
    } else {
      const submission: ProjectSubmission = {
        id: generateId(),
        outlet: formData.outlet,
        deadline: formData.deadline,
        submittedDate: formData.submittedDate,
        outcome: formData.outcome as SubmissionStatus,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      addSubmission(submission);
      toast.success(LAB.submissionUpdated);
    }
    setIsAdding(false);
  };

  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case 'planned': return <Clock className="h-4 w-4 text-slate-400" />;
      case 'submitted': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'accepted': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'withdrawn': return <Undo2 className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusLabel = (status: SubmissionStatus) => {
    switch (status) {
      case 'planned': return LAB.planned;
      case 'submitted': return LAB.submitted;
      case 'accepted': return LAB.active;
      case 'rejected': return LAB.cancelled;
      case 'withdrawn': return LAB.withdrawn;
    }
  };

  const submissions = project.submissions || [];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-indigo-500" />
            {LAB.submissionPipeline}
          </CardTitle>
          <CardDescription>
            Durable local-first records for pattern submissions.
          </CardDescription>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4" />
              {LAB.addSubmission}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? LAB.editSubmission : LAB.addSubmission}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update this submission record.' : 'Record a new submission for this design.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="outlet">{LAB.outletLabel}</Label>
                <Input
                  id="outlet"
                  value={formData.outlet}
                  onChange={e => setFormData(prev => ({ ...prev, outlet: e.target.value }))}
                  placeholder="e.g. Knitty, Pom Pom, Ravelry"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="deadline">{LAB.deadlineLabel}</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline || ''}
                    onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="submittedDate">{LAB.submittedDateLabel}</Label>
                  <Input
                    id="submittedDate"
                    type="date"
                    value={formData.submittedDate || ''}
                    onChange={e => setFormData(prev => ({ ...prev, submittedDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="outcome">{LAB.outcomeLabel}</Label>
                <Select
                  value={formData.outcome}
                  onValueChange={v => setFormData(prev => ({ ...prev, outcome: v as SubmissionStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">{LAB.planned}</SelectItem>
                    <SelectItem value="submitted">{LAB.submitted}</SelectItem>
                    <SelectItem value="accepted">{LAB.active}</SelectItem>
                    <SelectItem value="rejected">{LAB.cancelled}</SelectItem>
                    <SelectItem value="withdrawn">{LAB.withdrawn}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">{LAB.notesLabel}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Submission requirements, moodboard links, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdding(false)}>{LAB.cancel}</Button>
              <Button onClick={handleSave}>{editingId ? LAB.editSubmission : LAB.addSubmission}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
            <LayoutGrid className="h-12 w-12 mb-2 opacity-20" />
            <p>{LAB.noSubmissions}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map(submission => (
              <div
                key={submission.id}
                className="flex items-start justify-between p-4 border rounded-lg bg-white shadow-sm hover:border-indigo-200 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900">{submission.outlet}</h4>
                    <Badge variant="secondary" className="gap-1 font-normal">
                      {getStatusIcon(submission.outcome)}
                      {getStatusLabel(submission.outcome)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
                    {submission.deadline && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {LAB.deadlineLabel}: {submission.deadline}
                      </div>
                    )}
                    {submission.submittedDate && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {LAB.submittedDateLabel}: {submission.submittedDate}
                      </div>
                    )}
                  </div>
                  {submission.notes && (
                    <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded italic">
                      {submission.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                    onClick={() => handleOpenEdit(submission)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                    onClick={() => {
                      if (confirm(LAB.deleteSubmissionConfirm)) {
                        deleteSubmission(submission.id);
                        toast.success('Submission deleted');
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
