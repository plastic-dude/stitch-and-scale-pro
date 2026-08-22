import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/context/SettingsContext';
import { useProject } from '@/context/ProjectsContext';
import { Archive, Plus, Trash2, Calendar, User, Ruler, Activity, MessageSquare, CheckCircle2, Clock, XCircle, Ghost } from 'lucide-react';
import { COLLABORATION_COPY } from '@/lib/collaboration-copy';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de, fr, es, ptBR } from 'date-fns/locale';
import { 
  type PatternProject, 
  type TestKnitRound,
  type TestKnitStatus,
  type SizeKey,
  ALL_SIZES,
  generateId 
} from '@/lib/grading-engine';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const dateLocales = { de, fr, es, pt: ptBR, en: undefined };

interface TestKnitArchiveCardProps {
  project: PatternProject;
}

export function TestKnitArchiveCard({ project }: TestKnitArchiveCardProps) {
  const { language } = useSettings();
  const { toast } = useToast();
  const colCopy = COLLABORATION_COPY[language];
  const projectDispatchers = useProject(project.id);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<TestKnitRound | null>(null);

  // Form State
  const [testerName, setTesterName] = useState('');
  const [size, setSize] = useState<SizeKey>(project.baseSize || 'M');
  const [yarn, setYarn] = useState('');
  const [status, setStatus] = useState<TestKnitStatus>('planned');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [observations, setObservations] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [stitchesPer4In, setStitchesPer4In] = useState<string>('');
  const [rowsPer4In, setRowsPer4In] = useState<string>('');

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'PP', { locale: dateLocales[language as keyof typeof dateLocales] });
    } catch {
      return dateStr;
    }
  };

  const handleOpenDialog = (round?: TestKnitRound) => {
    if (round) {
      setEditingRound(round);
      setTesterName(round.testerName);
      setSize(round.size);
      setYarn(round.yarn || '');
      setStatus(round.status);
      setStartDate(round.startDate || '');
      setEndDate(round.endDate || '');
      setObservations(round.observations || '');
      setFollowUp(round.followUp || '');
      setStitchesPer4In(round.gauge?.stitchesPer4In?.toString() || '');
      setRowsPer4In(round.gauge?.rowsPer4In?.toString() || '');
    } else {
      setEditingRound(null);
      setTesterName('');
      setSize(project.baseSize || 'M');
      setYarn('');
      setStatus('planned');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setObservations('');
      setFollowUp('');
      setStitchesPer4In('');
      setRowsPer4In('');
    }
    setIsDialogOpen(true);
  };

  const handleSaveRound = () => {
    if (!testerName.trim() || !projectDispatchers) return;

    const gauge = stitchesPer4In && rowsPer4In ? {
      stitchesPer4In: parseFloat(stitchesPer4In),
      rowsPer4In: parseFloat(rowsPer4In),
      unit: project.gauge.unit
    } : undefined;

    if (editingRound) {
      projectDispatchers.updateTestKnitRound(editingRound.id, {
        testerName,
        size,
        yarn: yarn || undefined,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        observations: observations || undefined,
        followUp: followUp || undefined,
        gauge
      });
    } else {
      const newRound: TestKnitRound = {
        id: generateId(),
        testerName,
        size,
        yarn: yarn || undefined,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        observations: observations || undefined,
        followUp: followUp || undefined,
        gauge,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      projectDispatchers.addTestKnitRound(newRound);
    }

    setIsDialogOpen(false);
    toast({ title: colCopy.roundUpdated });
  };

  const handleDeleteRound = (roundId: string) => {
    if (!projectDispatchers || !window.confirm(colCopy.deleteRoundConfirm)) return;
    projectDispatchers.deleteTestKnitRound(roundId);
  };

  const getStatusBadge = (status: TestKnitStatus) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/10 text-green-600 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />{colCopy.completed}</Badge>;
      case 'in-progress': return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200"><Activity className="h-3 w-3 mr-1" />{colCopy.active}</Badge>;
      case 'ghosted': return <Badge className="bg-red-500/10 text-red-600 border-red-200"><Ghost className="h-3 w-3 mr-1" />{colCopy.ghosted}</Badge>;
      case 'cancelled': return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />{colCopy.cancelled}</Badge>;
      default: return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{colCopy.invited}</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center gap-2">
            <Archive className="h-5 w-5 text-primary" />
            {colCopy.testKnitArchive}
          </CardTitle>
          <CardDescription>{colCopy.testKnitArchiveDescription}</CardDescription>
        </div>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          {colCopy.addRound}
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto pt-4 space-y-4">
        {!project.testKnitRounds || project.testKnitRounds.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl opacity-50">
            <Archive className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm">{colCopy.noRounds}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {project.testKnitRounds.map((round) => (
              <div key={round.id} className="p-4 border rounded-xl bg-accent/5 hover:bg-accent/10 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{round.testerName}</h4>
                      {getStatusBadge(round.status)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Ruler className="h-3 w-3" /> {round.size}</span>
                      {round.yarn && <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {round.yarn}</span>}
                      {round.startDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(round.startDate)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(round)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteRound(round.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {round.observations && (
                  <div className="mb-2 p-2 rounded bg-white border text-xs italic">
                    <MessageSquare className="h-3 w-3 inline mr-1 text-primary" />
                    {round.observations}
                  </div>
                )}

                {round.followUp && (
                  <div className="text-[10px] text-primary font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {colCopy.followUpLabel}: {round.followUp}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRound ? colCopy.testKnitArchive : colCopy.addRound}</DialogTitle>
              <DialogDescription>{colCopy.recordRoundDescription}</DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tester">{colCopy.testerLabel}</Label>
                  <Input id="tester" value={testerName} onChange={(e) => setTesterName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="size">{colCopy.sizeLabel}</Label>
                  <Select value={size} onValueChange={(v) => setSize(v as SizeKey)}>
                    <SelectTrigger id="size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="yarn">{colCopy.yarnLabel}</Label>
                  <Input id="yarn" value={yarn} onChange={(e) => setYarn(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">{colCopy.statusLabel}</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as TestKnitStatus)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">{colCopy.invited}</SelectItem>
                      <SelectItem value="in-progress">{colCopy.active}</SelectItem>
                      <SelectItem value="completed">{colCopy.completed}</SelectItem>
                      <SelectItem value="ghosted">{colCopy.ghosted}</SelectItem>
                      <SelectItem value="cancelled">{colCopy.cancelled}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-date">{colCopy.startDateLabel}</Label>
                  <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-date">{colCopy.endDateLabel}</Label>
                  <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="gauge-st">{colCopy.gaugeLabel} (St/4")</Label>
                  <Input id="gauge-st" type="number" value={stitchesPer4In} onChange={(e) => setStitchesPer4In(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gauge-row">{colCopy.gaugeLabel} (Rows/4")</Label>
                  <Input id="gauge-row" type="number" value={rowsPer4In} onChange={(e) => setRowsPer4In(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="observations">{colCopy.observationsLabel}</Label>
                <Textarea id="observations" value={observations} onChange={(e) => setObservations(e.target.value)} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="follow-up">{colCopy.followUpLabel}</Label>
                <Input id="follow-up" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveRound} disabled={!testerName.trim()}>{colCopy.saveRound}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
