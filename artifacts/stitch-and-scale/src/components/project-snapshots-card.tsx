import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/context/SettingsContext';
import { useWorkspaceCopy } from '@/lib/workspace-copy';
import { History, Save, RotateCcw, Trash2, Clock, FileText } from 'lucide-react';
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

const dateLocales = { de, fr, es, pt: ptBR, en: undefined };

interface ProjectSnapshotsCardProps {
  project: any;
  createSnapshot: (name: string, note: string) => void;
  restoreSnapshot: (snapshotId: string) => void;
  deleteSnapshot: (snapshotId: string) => void;
}

export function ProjectSnapshotsCard({ project, createSnapshot, restoreSnapshot, deleteSnapshot }: ProjectSnapshotsCardProps) {
  const { language } = useSettings();
  const copy = useWorkspaceCopy(language);
  const { toast } = useToast();
  
  const [newName, setNewName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createSnapshot(newName, newNote);
    setNewName('');
    setNewNote('');
    setIsCreateOpen(false);
    toast({ title: copy.snapshotCreated });
  };

  const handleRestore = (id: string, name: string) => {
    restoreSnapshot(id);
    setIsRestoreOpen(null);
    toast({ title: copy.snapshotRestored });
  };

  const handleDelete = (id: string, name: string) => {
    deleteSnapshot(id);
    setIsDeleteOpen(null);
    toast({ title: copy.snapshotDeleted });
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'PPp', { locale: dateLocales[language as keyof typeof dateLocales] });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {copy.snapshotsTitle}
          </CardTitle>
          <CardDescription>{copy.snapshotsDescription}</CardDescription>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              {copy.createSnapshot}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{copy.createSnapshot}</DialogTitle>
              <DialogDescription>
                {copy.snapshotsDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="snapshot-name">{copy.snapshotName}</Label>
                <Input
                  id="snapshot-name"
                  placeholder={copy.snapshotPlaceholder}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="snapshot-note">{copy.snapshotNote}</Label>
                <Textarea
                  id="snapshot-note"
                  placeholder={copy.notesPlaceholder}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {copy.renameCancel}
              </Button>
              <Button onClick={handleCreate} disabled={!newName.trim()}>
                {copy.renameSave}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto min-h-[200px] pt-4">
        {(!project.snapshots || project.snapshots.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mb-2 opacity-20" />
            <p className="text-sm">{copy.noSnapshots}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {project.snapshots.map((snapshot: any) => (
              <div key={snapshot.id} className="flex flex-col gap-2 p-3 border rounded-lg bg-accent/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {snapshot.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      {formatDate(snapshot.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Dialog open={isRestoreOpen === snapshot.id} onOpenChange={(open) => setIsRestoreOpen(open ? snapshot.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <RotateCcw className="h-4 w-4" />
                          <span className="sr-only">{copy.restoreSnapshot}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{copy.confirmRestoreSnapshot(snapshot.name)}</DialogTitle>
                          <DialogDescription>
                            {copy.confirmRestoreSnapshotBody}
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsRestoreOpen(null)}>
                            {copy.renameCancel}
                          </Button>
                          <Button onClick={() => handleRestore(snapshot.id, snapshot.name)}>
                            {copy.restoreSnapshot}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isDeleteOpen === snapshot.id} onOpenChange={(open) => setIsDeleteOpen(open ? snapshot.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{copy.deleteSnapshot}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{copy.confirmDeleteSnapshot(snapshot.name)}</DialogTitle>
                          <DialogDescription>
                            {copy.confirmDeleteSnapshotBody}
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsDeleteOpen(null)}>
                            {copy.renameCancel}
                          </Button>
                          <Button variant="destructive" onClick={() => handleDelete(snapshot.id, snapshot.name)}>
                            {copy.deleteSnapshot}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                {snapshot.note && (
                  <p className="text-xs text-muted-foreground border-t pt-2 mt-1">
                    {snapshot.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
