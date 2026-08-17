import React from 'react';
import { useProjects } from '@/context/ProjectsContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useLocation } from 'wouter';
import { Search, Plus, Calendar, Scissors, Layers, ChevronRight, PenTool, Info, X, MoreVertical, Copy, Download, Upload, Trash2, CheckCircle2, Loader2, FileSpreadsheet } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale/de';
import { es } from 'date-fns/locale/es';
import { fr } from 'date-fns/locale/fr';
import { pt } from 'date-fns/locale/pt';
import { enUS } from 'date-fns/locale/en-US';
import { motion, type Variants } from 'framer-motion';
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
import { useToast } from '@/hooks/use-toast';
import type { PatternProject } from '@/lib/grading-engine';
import { useSettings } from '@/context/SettingsContext';
import { DASHBOARD_COPY } from '@/lib/dashboard-copy';

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
  const { projects, duplicateProject, deleteProject, importProject } = useProjects();
  const { toast } = useToast();
  const { language } = useSettings();
  const copy = DASHBOARD_COPY[language];
  const dateLocaleMap = { de, es, fr, pt };
  const dateLocale = (dateLocaleMap as Record<string, typeof enUS>)[language] ?? enUS;
  const [search, setSearch] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<PatternProject | null>(null);
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

  const handleDuplicate = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    duplicateProject(id);
    toast({ title: copy.duplicate, description: `"${name} (Copy)" was added to your patterns.` });
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
    toast({ title: copy.exported, description: `${project.name}.json downloaded.` });
  };

  const handleDeleteConfirmed = () => {
    if (!deleteTarget) return;
    deleteProject(deleteTarget.id);
    toast({ title: copy.deleted, description: `"${deleteTarget.name}" was removed.` });
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
        toast({ title: copy.imported, description: `"${parsed.name}" was added to your patterns.` });
      } catch (err) {
        toast({
          title: copy.importFailed,
          description: err instanceof Error ? err.message : 'The file could not be read.',
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

  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-full space-y-10">
      
            {showStorageWarning && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-start gap-4 relative"
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
        </motion.div>
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
        <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-end">
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-semibold text-foreground tracking-tight">{copy.patterns}</h1>
            <p className="text-muted-foreground text-sm font-medium tracking-wide">
              {projects.length} {projects.length === 1 ? copy.project : copy.projects} {copy.inWorkspace}
            </p>
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
      )}

      {projects.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center py-32 text-center px-4 max-w-xl mx-auto"
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
        </motion.div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredProjects.map((project) => (
            <motion.div key={project.id} variants={item} className="h-full">
              <Link href={`/project/${project.id}`}>
                <Card className="relative h-full cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary/30 bg-card overflow-hidden group flex flex-col border-border/60" data-testid={`card-project-${project.id}`}>
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
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 opacity-70" />
                      <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: dateLocale })}</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            </motion.div>
          ))}
          
          <motion.div variants={item}>
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
          </motion.div>
        </motion.div>
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
    </div>
  );
}
