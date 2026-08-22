import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/context/SettingsContext';
import { getWorkspaceCopy, workspaceGaugeByline, type LanguageCode } from '@/lib/workspace-copy';
import { Package, Plus, Trash2, FileText, Download, ShieldCheck, History, CheckCircle2, AlertTriangle, Clock, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProjectArtifactInspectionCard } from './project-artifact-inspection-card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de, fr, es, ptBR } from 'date-fns/locale';
import {
  type PatternProject,
  type PublicationPackage,
  type PublicationArtifact,
  generateId,
} from '@/lib/grading-engine';
import { canClaimPublicationReady } from '@/lib/publication-integrity';

const dateLocales = { de, fr, es, pt: ptBR, en: undefined };

function getArtifactDownloadUrl(artifact: PublicationArtifact): string | null {
  const url = artifact.url?.trim();
  return url && /^(?:blob:|data:|https?:)/i.test(url) ? url : null;
}

interface ProjectPackageCardProps {
  project: PatternProject;
  createPublicationPackage: (pkg: PublicationPackage) => void;
  updatePublicationPackage: (pkg: PublicationPackage) => void;
  deletePublicationPackage: (packageId: string) => void;
  addPublicationArtifact: (packageId: string, artifact: PublicationArtifact) => void;
  inspectArtifact: (packageId: string, artifactId: string, report: any) => void;
}

export function ProjectPackageCard({ 
  project, 
  createPublicationPackage, 
  updatePublicationPackage, 
  deletePublicationPackage,
  addPublicationArtifact,
  inspectArtifact
}: ProjectPackageCardProps) {
  const { language } = useSettings();
  const copy = getWorkspaceCopy(language);
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [packageName, setPackageName] = useState('');
  const [packageVersion, setPackageVersion] = useState('1.0.0');
  const [inspectingArtifact, setInspectingArtifact] = useState<{ pkgId: string, artifact: PublicationArtifact } | null>(null);

  const packages = project.publicationPackages || [];

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'PPp', { locale: dateLocales[language as keyof typeof dateLocales] });
    } catch {
      return dateStr;
    }
  };

  const handleCreatePackage = () => {
    if (!packageName.trim()) return;

    const newPackage: PublicationPackage = {
      id: generateId(),
      version: packageVersion,
      status: 'draft',
      readinessVerdict: canClaimPublicationReady(project) ? 'ready' : 'pending',
      authoritativeMetadata: {
        title: packageName,
        author: project.author || 'Unknown',
        copyright: `© ${new Date().getFullYear()} ${project.author || 'Designer'}`,
        description: project.description || '',
        sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'], // All sizes by default
        gauge: { ...project.gauge },
      },
      artifacts: [], // Artifacts will be added after generation
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    createPublicationPackage(newPackage);
    setPackageName('');
    setPackageVersion('1.0.0');
    setIsCreateDialogOpen(false);
    toast({ title: copy.publicationPackageCreated });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200 shadow-none uppercase text-[10px]">{copy.publicationStatusPublished}</Badge>;
      case 'review': return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200 shadow-none uppercase text-[10px]">{copy.publicationStatusReview}</Badge>;
      case 'archived': return <Badge variant="secondary" className="shadow-none uppercase text-[10px]">{copy.publicationStatusArchived}</Badge>;
      default: return <Badge variant="outline" className="shadow-none uppercase text-[10px]">{copy.publicationStatusDraft}</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      {inspectingArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl">
            <ProjectArtifactInspectionCard 
              project={project}
              packageId={inspectingArtifact.pkgId}
              artifact={inspectingArtifact.artifact}
              onInspect={(report) => inspectArtifact(inspectingArtifact.pkgId, inspectingArtifact.artifact.id, report)}
              onClose={() => setInspectingArtifact(null)}
            />
          </div>
        </div>
      )}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {copy.publicationPackageTitle}
          </CardTitle>
          <CardDescription>{copy.publicationPackageDescription}</CardDescription>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {copy.publicationCreatePackage}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{copy.publicationCreatePackage}</DialogTitle>
              <DialogDescription>
                {copy.publicationPackageDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="pkg-name">{copy.publicationPackageName}</Label>
                <Input
                  id="pkg-name"
                  placeholder={project.name}
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pkg-version">{copy.publicationPackageVersion}</Label>
                <Input
                  id="pkg-version"
                  placeholder="1.0.0"
                  value={packageVersion}
                  onChange={(e) => setPackageVersion(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {copy.renameCancel}
              </Button>
              <Button onClick={handleCreatePackage} disabled={!packageName.trim()}>
                {copy.renameSave}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto min-h-[400px] pt-4 space-y-4">
        {packages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-60">
            <History className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground max-w-[200px]">
              {copy.publicationNoPackages}
            </p>
          </div>
        ) : (
          packages.map((pkg) => (
            <Card key={pkg.id} className="bg-accent/5 border-dashed overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm">{pkg.authoritativeMetadata.title}</h4>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1 shadow-none font-mono">
                      v{pkg.version}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(pkg.status)}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        deletePublicationPackage(pkg.id);
                        toast({ title: copy.publicationPackageDeleted });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(pkg.createdAt)}
                  </span>
                  {pkg.stale ? (
                    <Badge variant="outline" className="border-amber-300 bg-amber-500/10 text-amber-700 text-[9px] h-4 px-1 shadow-none" title={pkg.staleReason}>
                      <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                      {copy.publicationPackageStale}
                    </Badge>
                  ) : pkg.readinessVerdict === 'ready' && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-200 text-[9px] h-4 px-1 shadow-none">
                      <ShieldCheck className="h-2.5 w-2.5 mr-1" />
                      {copy.healthReady.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <div className="space-y-1">
                    <p className="text-muted-foreground uppercase tracking-wider font-semibold">{copy.publicationMetadataAuthor}</p>
                    <p>{pkg.authoritativeMetadata.author}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground uppercase tracking-wider font-semibold">{copy.publicationMetadataCopyright}</p>
                    <p>{pkg.authoritativeMetadata.copyright}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-muted-foreground uppercase tracking-wider font-semibold">{copy.publicationMetadataGauge}</p>
                    <p className="font-mono">
                      {workspaceGaugeByline(language, pkg.authoritativeMetadata.gauge)}
                    </p>
                  </div>
                </div>

                {pkg.artifacts.length > 0 && (
                  <div className="pt-2 border-t space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{copy.publicationArtifacts}</p>
                    <div className="space-y-1.5">
                      {pkg.artifacts.map((art) => (
                        <div key={art.id} className="flex items-center justify-between p-2 rounded-lg bg-white border shadow-sm hover:bg-muted/10 transition-colors">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className={cn(
                              "w-7 h-7 rounded flex items-center justify-center shrink-0",
                              art.type === 'pdf' ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                            )}>
                              <FileText className="h-3.5 w-3.5" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-xs font-medium truncate">{art.label}</div>
                              <div className="text-[9px] text-muted-foreground flex items-center gap-1.5">
                                <Clock className="h-2.5 w-2.5" />
                                {formatDate(art.timestamp)}
                                {art.qualitySnapshot && (
                                  <>
                                    <span className="text-border">|</span>
                                    {art.qualitySnapshot === 'pass' ? (
                                      <span className="text-green-600 flex items-center gap-0.5">
                                        <CheckCircle2 className="h-2.5 w-2.5" />
                                      </span>
                                    ) : (
                                      <span className="text-amber-600 flex items-center gap-0.5">
                                        <AlertTriangle className="h-2.5 w-2.5" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-muted-foreground hover:text-primary"
                              onClick={() => setInspectingArtifact({ pkgId: pkg.id, artifact: art })}
                            >
                              <FileSearch className="h-3 w-3" />
                            </Button>
                            {(() => {
                              const downloadUrl = getArtifactDownloadUrl(art);
                              const label = downloadUrl
                                ? `${copy.publicationArtifactDownload}: ${art.label}`
                                : `${copy.publicationArtifactDownloadUnavailable}: ${art.label}`;
                              return downloadUrl ? (
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                >
                                  <a
                                    href={downloadUrl}
                                    download={art.filename}
                                    aria-label={label}
                                    onClick={() => toast({
                                      title: copy.publicationArtifactDownloadRequested,
                                      description: copy.publicationArtifactDownloadRequestedDescription,
                                    })}
                                  >
                                    <Download className="h-3 w-3" />
                                  </a>
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground/40"
                                  disabled
                                  aria-label={label}
                                  title={copy.publicationArtifactDownloadUnavailableDescription}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              );
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}
