import React, { useState } from 'react';
import { 
  type PatternProject, 
  type ProjectSample, 
  type SampleStatus, 
  ALL_SIZES,
  generateId
} from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { COLLABORATION_COPY } from '@/lib/collaboration-copy';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Calendar, Trash2, Plus, Package, User, MapPin, CalendarClock } from 'lucide-react';
import { WorkspaceCopy } from '@/lib/workspace-copy';

interface SampleTrackerCardProps {
  project: PatternProject;
  addSample: (sample: ProjectSample) => void;
  updateSample: (sampleId: string, patch: Partial<ProjectSample>) => void;
  deleteSample: (sampleId: string) => void;
}

export function SampleTrackerCard({ project, addSample, updateSample, deleteSample }: SampleTrackerCardProps) {
  const { language } = useSettings();
  const LAB = COLLABORATION_COPY[language];
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSample, setEditingSample] = useState<ProjectSample | null>(null);

  const [formData, setFormData] = useState<Partial<ProjectSample>>({
    label: '',
    size: project.baseSize,
    status: 'planned',
    location: '',
    borrower: '',
    loanDate: '',
    returnDueDate: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label) return;

    if (editingSample) {
      updateSample(editingSample.id, formData);
      setEditingSample(null);
    } else {
      addSample({
        ...formData as ProjectSample,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    setIsAddOpen(false);
    setFormData({
      label: '',
      size: project.baseSize,
      status: 'planned',
      location: '',
      borrower: '',
      loanDate: '',
      returnDueDate: '',
      notes: ''
    });
  };

  const getStatusBadge = (status: SampleStatus) => {
    switch (status) {
      case 'loaned': return <Badge variant="secondary">{LAB.loaned}</Badge>;
      case 'returned': return <Badge variant="default">{LAB.returned}</Badge>;
      case 'sold': return <Badge variant="outline">{LAB.sold}</Badge>;
      case 'lost': return <Badge variant="destructive">{LAB.lost}</Badge>;
      case 'planned': return <Badge variant="secondary">{LAB.planned}</Badge>;
      case 'in-progress': return <Badge variant="default">{LAB.active}</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const samples = project.samples || [];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            {LAB.sampleTracker}
          </CardTitle>
          <CardDescription>
            Durable records for physical samples and loans.
          </CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              {LAB.addSample}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingSample ? LAB.sampleUpdated : LAB.addSample}</DialogTitle>
                <DialogDescription>
                  Record a physical sample for this design.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="label" className="text-right">{LAB.labelLabel}</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                    className="col-span-3"
                    placeholder="e.g. Original Grey Sample"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="size" className="text-right">{LAB.sizeLabel}</Label>
                  <Select 
                    value={formData.size} 
                    onValueChange={v => setFormData({ ...formData, size: v as any })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_SIZES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">{LAB.statusLabel}</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={v => setFormData({ ...formData, status: v as any })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">{LAB.planned}</SelectItem>
                      <SelectItem value="in-progress">{LAB.active}</SelectItem>
                      <SelectItem value="loaned">{LAB.loaned}</SelectItem>
                      <SelectItem value="returned">{LAB.returned}</SelectItem>
                      <SelectItem value="sold">{LAB.sold}</SelectItem>
                      <SelectItem value="lost">{LAB.lost}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">{LAB.locationLabel}</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="col-span-3"
                    placeholder="e.g. Studio, Showroom"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="borrower" className="text-right">{LAB.borrowerLabel}</Label>
                  <Input
                    id="borrower"
                    value={formData.borrower}
                    onChange={e => setFormData({ ...formData, borrower: e.target.value })}
                    className="col-span-3"
                    placeholder="e.g. Magazine, Event"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loanDate">{LAB.loanDateLabel}</Label>
                    <Input
                      id="loanDate"
                      type="date"
                      value={formData.loanDate}
                      onChange={e => setFormData({ ...formData, loanDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="returnDueDate">{LAB.returnDueDateLabel}</Label>
                    <Input
                      id="returnDueDate"
                      type="date"
                      value={formData.returnDueDate}
                      onChange={e => setFormData({ ...formData, returnDueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">{LAB.notesLabel}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional details..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingSample ? LAB.saveRound : LAB.addSample}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {samples.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-muted-foreground">{LAB.noSamples}</h3>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {samples.map(sample => (
              <Card key={sample.id} className="overflow-hidden border-muted/60 hover:border-primary/40 transition-colors">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-lg">{sample.label}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{sample.size}</Badge>
                        {getStatusBadge(sample.status)}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm(LAB.deleteSampleConfirm)) {
                          deleteSample(sample.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm space-y-3">
                  {sample.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{sample.location}</span>
                    </div>
                  )}
                  {sample.borrower && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{sample.borrower}</span>
                    </div>
                  )}
                  {(sample.loanDate || sample.returnDueDate) && (
                    <div className="flex flex-col gap-1">
                      {sample.loanDate && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{sample.loanDate}</span>
                        </div>
                      )}
                      {sample.returnDueDate && (
                        <div className="flex items-center gap-2 text-warning">
                          <CalendarClock className="w-4 h-4" />
                          <span>Due: {sample.returnDueDate}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {sample.notes && (
                    <p className="text-xs text-muted-foreground italic border-t pt-2 mt-2">
                      {sample.notes}
                    </p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => {
                      setEditingSample(sample);
                      setFormData(sample);
                      setIsAddOpen(true);
                    }}
                  >
                    Edit Record
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
