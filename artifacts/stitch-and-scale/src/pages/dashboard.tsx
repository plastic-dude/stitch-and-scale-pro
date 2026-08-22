import React from 'react';
import { useProjects } from '@/context/ProjectsContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useLocation } from 'wouter';
import { Search, Plus, Calendar, Scissors, Layers, ChevronRight, PenTool, Info, X, MoreVertical, Copy, Download, Upload, Trash2, CheckCircle2, Loader2, FileSpreadsheet } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
// CHK-155: rename validation mirrors the workspace + wizard so a stuck name
// can never survive a save through any surface.
const DASHBOARD_NAME_MAX = 80;
function dashboardNormalizeName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}
import { de } from 'date-fns/locale/de';
import { es } from 'date-fns/locale/es';
import { fr } from 'date-fns/locale/fr';
import { pt } from 'date-fns/locale/pt';
import { enUS } from 'date-fns/locale/en-US';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { DASHBOARD_COPY } from '@/lib/dashboard-copy';
import { getToastCopy } from '@/lib/toast-copy';

// A project is "Graded" once it has at least one real measurement to grade —
// that's the point where the grading table actually produces output.
// Everything before that is still a "Draft": no fabricated in-between state,
// just an honest reflection of whether there's anything to show yet.
function isProjectGraded(project: { sections?: Array<{ measurements?: unknown[] }> }): boolean {
  return (project.sections ?? []).some(
    (section) => (section.measurements?.length ?? 0) > 0
  );
}

export default function Dashboard() {
  const { 
    projects, createProject, duplicateProject, updateProject, deleteProject, importProject,
    batchDelete, batchArchive, batchTag
  } = useProjects();
  const { toast } = useToast();
  const { language } = useSettings();
  const copy = DASHBOARD_COPY[language];
  const tc = getToastCopy(language);
  const dateLocaleMap = { de, es, fr, pt };
  const dateLocale = (dateLocaleMap as Record<string, typeof enUS>)[language] ?? enUS;
  
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = React.useState(false);
  const [tagFilter, setTagFilter] = React.useState<string | null>(null);
  
  const [deleteTarget, setDeleteTarget] = React.useState<PatternProject | null>(null);
  const [batchDeleteTarget, setBatchDeleteTarget] = React.useState<string[] | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showStorageWarning, setShowStorageWarning] = React.useState(() => {
    return localStorage.getItem('hide-storage-warning') !== 'true';
  });

  const dismissWarning = () => {
    setShowStorageWarning(false);
    localStorage.setItem('hide-storage-warning', 'true');
  };
  const [, setLocation] = useLocation();

  // CHK-155: per-card rename so any persisted name (QA-seeded or not) is
  // editable right from the dashboard card menu.
  const [renameTarget, setRenameTarget] = React.useState<PatternProject | null>(null);
  const [renameDraftName, setRenameDraftName] = React.useState('');
  const openRenameCard = (e: React.MouseEvent, project: PatternProject) => {
    e.preventDefault();
    e.stopPropagation();
    setRenameDraftName(project.name);
    setRenameTarget(project);
  };
  const commitRenameCard = () => {
    if (!renameTarget) return;
    const next = dashboardNormalizeName(renameDraftName);
    if (!next) {
      toast({ title: copy.renameFailed, description: copy.renameEmpty });
      return;
    }
    if (next === renameTarget.name) {
      setRenameTarget(null);
      return;
    }
    if (next.length > DASHBOARD_NAME_MAX) {
      toast({ title: copy.renameFailed, description: `Max ${DASHBOARD_NAME_MAX} characters` });
      return;
    }
    const live = projects.find(p => p.id === renameTarget.id);
    if (!live) {
      setRenameTarget(null);
      return;
    }
    try {
      updateProject({ ...live, name: next, updatedAt: new Date().toISOString() });
      toast({ title: copy.renameSaved, description: next });
      setRenameTarget(null);
    } catch {
      toast({ title: copy.renameFailed });
    }
  };

  const handleDuplicate = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    duplicateProject(id);
    toast({ title: copy.duplicate, description: tc.projectDuplicateDescription(name) });
  };

  const handleExport = (e: React.MouseEvent, project: PatternProject) => {
    e.preventDefault();
    e.stopPropagation();
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9]+/gi, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: copy.exported, description: tc.projectExportedDescription(project.name) });
  };

  const handleDeleteConfirmed = () => {
    if (!deleteTarget) return;
    deleteProject(deleteTarget.id);
    toast({ title: copy.deleted, description: tc.projectDeletedDescription(deleteTarget.name) });
    setDeleteTarget(null);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file next time
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        // Loose validation — a real pattern export always has these fields
        if (!parsed || typeof parsed.name !== 'string' || !Array.isArray(parsed.sections)) {
          throw new Error('This file doesn\'t look like a Stitch & Scale pattern export.');
        }
        importProject(parsed as PatternProject);
        toast({ title: copy.imported, description: tc.projectImportedDescription(parsed.name) });
      } catch (err) {
        toast({
          title: copy.importFailed,
          description: err instanceof Error ? err.message : tc.fileCouldNotBeRead,
          variant: 'destructive',
        });
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      toast({ title: copy.importFailed, description: copy.backupRead, variant: 'destructive' });
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const allTags = Array.from(new Set(projects.flatMap(p => p.tags || []))).sort();
  
  const filteredProjects = projects
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase());
      const matchesArchive = showArchived ? p.isArchived : !p.isArchived;
      const matchesTag = !tagFilter || (p.tags || []).includes(tagFilter);
      return matchesSearch && matchesArchive && matchesTag;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredProjects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const handleBatchArchive = (archived: boolean) => {
    const ids = Array.from(selectedIds);
    batchArchive(ids, archived);
    toast({ title: copy.batchComplete(ids.length) });
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    const ids = Array.from(selectedIds);
    batchDelete(ids);
    toast({ title: copy.batchComplete(ids.length) });
    setSelectedIds(new Set());
    setBatchDeleteTarget(null);
  };

  const handleBatchExport = () => {
    const ids = Array.from(selectedIds);
    const selectedProjects = projects.filter(p => ids.includes(p.id));
    const blob = new Blob([JSON.stringify(selectedProjects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stitch-and-scale-batch-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: copy.exported, description: copy.batchComplete(ids.length) });
  };

  return (
    <div className="w-full space-y-10">
      
            {showStorageWarning && (
        <div
          className="sts-dashboard-enter bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-start gap-4 relative"
        >
          <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1 pr-6">
            <h3 className="text-sm font-semibold text-accent-foreground mb-1">{copy.notice}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {copy.noticeBody}
            </p>
          </div>
          <button 
            onClick={dismissWarning}
            aria-label={copy.dismiss}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImportFile}
        className="hidden"
        data-testid="input-import-file"
      />

      {projects.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-end">
            <div className="space-y-2">
              <h1 className="text-4xl font-serif font-semibold text-foreground tracking-tight">{copy.patterns}</h1>
              <div className="flex items-center gap-3">
                <p className="text-muted-foreground text-sm font-medium tracking-wide">
                  {projects.length} {projects.length === 1 ? copy.project : copy.projects} {copy.inWorkspace}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs px-2"
                  onClick={() => setShowArchived(!showArchived)}
                >
                  {showArchived ? copy.hideArchived : copy.showArchived}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input 
                  placeholder={copy.search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 bg-card/50 border-border/60 focus-visible:bg-card focus-visible:ring-accent rounded-full transition-all text-ellipsis"
                  data-testid="input-search"
                />
              </div>
              
              {allTags.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-full px-4 gap-2">
                      <Layers className="h-4 w-4" />
                      {tagFilter || copy.allTags}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTagFilter(null)}>
                      {copy.allTags}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {allTags.map(tag => (
                      <DropdownMenuItem key={tag} onClick={() => setTagFilter(tag)}>
                        {tag}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full shrink-0"
                onClick={() => setLocation('/project/import-csv')}
                title={copy.spreadsheet}
                aria-label={copy.spreadsheet}
                data-testid="button-import-csv"
              >
                <FileSpreadsheet className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full shrink-0"
                onClick={handleImportClick}
                disabled={isImporting}
                title={copy.restore}
                aria-label={copy.restore}
                data-testid="button-import"
              >
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-accent/5 border border-accent/20 rounded-xl p-3 px-4 sts-dashboard-enter">
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-accent-foreground">
                  {copy.batchSelection(selectedIds.size)}
                </p>
                <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-8">
                  {selectedIds.size === filteredProjects.length ? copy.batchDeselectAll : copy.batchSelectAll}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleBatchExport}>
                  <Download className="h-3.5 w-3.5" />
                  {copy.batchExport}
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => handleBatchArchive(!showArchived)}>
                  <Layers className="h-3.5 w-3.5" />
                  {showArchived ? copy.batchUnarchive : copy.batchArchive}
                </Button>
                <Button variant="destructive" size="sm" className="h-8 gap-2" onClick={() => setBatchDeleteTarget(Array.from(selectedIds))}>
                  <Trash2 className="h-3.5 w-3.5" />
                  {copy.batchDelete}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {projects.length === 0 ? (
        <div
          className="sts-dashboard-enter flex flex-col items-center justify-center py-32 text-center px-4 max-w-xl mx-auto"
        >
          <div className="w-24 h-24 rounded-2xl bg-secondary/40 flex items-center justify-center mb-8 text-primary/80 ring-1 ring-border/50 shadow-sm rotate-3">
            <Layers className="w-10 h-10 -rotate-3" />
          </div>
          <h2 className="text-3xl font-serif font-medium mb-4 text-foreground tracking-tight">{copy.blank}</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed text-[15px]">
            {copy.blankBody}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button size="lg" className="rounded-full px-8 h-12 font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" onClick={() => setLocation('/project/new')} data-testid="button-create-first">
              <Plus className="mr-2 h-5 w-5" />
              {copy.newPattern}
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12 font-medium" onClick={() => setLocation('/project/import-csv')} data-testid="button-import-csv-empty">
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              {copy.importSpreadsheet}
            </Button>
          </div>
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="mt-5 text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 disabled:opacity-70"
            data-testid="button-import-empty"
          >
            {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {isImporting ? copy.restoring : copy.orRestore}
          </button>
          <div className="mt-6 max-w-md rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-left">
            <p className="text-xs leading-relaxed text-muted-foreground">{copy.migrationHint}</p>
            <Button
              variant="link"
              className="h-auto p-0 mt-2 text-sm font-medium"
              onClick={() => setLocation('/settings')}
              data-testid="button-origin-migration"
            >
              {copy.migrationAction}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="sts-dashboard-item h-full relative group">
              <div className="absolute top-4 left-4 z-20">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleSelect(project.id);
                  }}
                  className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                    selectedIds.has(project.id)
                      ? 'bg-accent border-accent text-accent-foreground'
                      : 'bg-card border-border group-hover:border-accent/50 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {selectedIds.has(project.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              </div>
              <Link href={`/project/${project.id}`}>
                <Card className={`relative h-full cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary/30 bg-card overflow-hidden group flex flex-col border-border/60 ${selectedIds.has(project.id) ? 'ring-2 ring-accent border-accent' : ''}`} data-testid={`card-project-${project.id}`}>
                  <div className="h-1.5 w-full bg-gradient-to-r from-secondary to-secondary group-hover:from-primary group-hover:to-accent transition-all duration-500" />

                  <div className="absolute top-3 right-3 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          className="p-1.5 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-background/80 transition-colors opacity-100 [@media(pointer:fine)]:opacity-0 [@media(pointer:fine)]:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          aria-label={`${copy.duplicateAction} ${project.name}`}
                          data-testid={`button-card-menu-${project.id}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={(e) => handleDuplicate(e, project.id, project.name)} data-testid={`menuitem-duplicate-${project.id}`}>
                          <Copy className="w-4 h-4 mr-2" />
                          {copy.duplicateAction}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleExport(e, project)} data-testid={`menuitem-export-${project.id}`}>
                          <Download className="w-4 h-4 mr-2" />
                          {copy.exportJson}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => openRenameCard(e, project)} data-testid={`menuitem-rename-${project.id}`}>
                          <PenTool className="w-4 h-4 mr-2" />
                          {copy.renameAction}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(project); }}
                          className="text-destructive focus:text-destructive"
                          data-testid={`menuitem-delete-${project.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {copy.deleteAction}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardHeader className="pb-4 pt-6 px-6">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1 pr-6 group-hover:text-primary transition-colors text-xl font-serif leading-tight">
                        {project.name}
                      </CardTitle>
                      {isProjectGraded(project) ? (
                        <span
                          className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary"
                          data-testid={`status-graded-${project.id}`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {copy.graded}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/50"
                          data-testid={`status-draft-${project.id}`}
                        >
                          <PenTool className="w-3 h-3" />
                          {copy.draft}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground font-medium">
                      <Scissors className="w-3.5 h-3.5 opacity-70" />
                      <span className="line-clamp-1">{project.author}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 px-6 flex-grow">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary">
                        {copy.sizeLabel.replace('{0}', String(project.baseSize))}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted/60 text-muted-foreground border border-border/50">
                        {project.gauge?.stitchesPer4In ?? "—"} m / {project.gauge?.rowsPer4In ?? "—"} r
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="px-6 py-4 border-t border-border/40 bg-muted/10 flex justify-between items-center text-xs text-muted-foreground mt-auto">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 opacity-70" />
                      <span>{project.sections?.length || 0} {(project.sections?.length || 0) === 1 ? copy.sectionsLabel : `${copy.sectionsLabel}s`}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      <span className="line-clamp-1">
                        {copy.created} {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: dateLocale })}
                        {project.updatedAt && new Date(project.updatedAt).getTime() - new Date(project.createdAt).getTime() > 24 * 3600_000
                          ? ` · ${copy.lastEdited} ${formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: dateLocale })}`
                          : ''}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            </div>
          ))}
          
          <div className="sts-dashboard-item">
            <Card 
              className="h-full min-h-[240px] cursor-pointer border-dashed border-2 border-border/60 hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300 flex flex-col items-center justify-center text-muted-foreground hover:text-primary group rounded-xl shadow-none"
              onClick={() => setLocation('/project/new')}
              data-testid="button-new-project-card"
            >
              <div className="w-14 h-14 rounded-full bg-background border border-border/50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-sm">
                <PenTool className="w-6 h-6 text-primary/70 group-hover:text-primary" />
              </div>
              <p className="font-serif font-medium text-lg text-foreground group-hover:text-primary transition-colors">{copy.startNewPattern}</p>
              <span className="text-sm mt-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                {copy.setUpBase} <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </Card>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteTitle.replace('{0}', deleteTarget?.name ?? '')}</AlertDialogTitle>
            <AlertDialogDescription>{copy.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {copy.deleteAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!batchDeleteTarget} onOpenChange={(open) => !open && setBatchDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmBatchDelete(batchDeleteTarget?.length || 0)}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.confirmBatchDeleteBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {copy.batchDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
