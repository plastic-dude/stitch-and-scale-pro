import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/context/SettingsContext';
import { getWorkspaceCopy } from '@/lib/workspace-copy';
import { type PatternProject, type MakerReleaseDraftV1, generateId } from '@/lib/grading-engine';
import { Send, Plus, Trash2, Camera, FileText, CheckCircle2, AlertCircle, ExternalLink, History, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ReleaseDraftsPanelProps {
  project: PatternProject;
  addReleaseDraft: (draft: MakerReleaseDraftV1) => void;
  updateReleaseDraft: (draftId: string, patch: Partial<MakerReleaseDraftV1>) => void;
  deleteReleaseDraft: (draftId: string) => void;
}

export default function ReleaseDraftsPanel({ 
  project, 
  addReleaseDraft, 
  updateReleaseDraft, 
  deleteReleaseDraft 
}: ReleaseDraftsPanelProps) {
  const { language } = useSettings();
  const copy = getWorkspaceCopy(language);
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const drafts = project.releaseDrafts || [];
  const assets = project.assets || [];
  const packages = project.publicationPackages || [];

  const startCreate = () => {
    const newDraft: MakerReleaseDraftV1 = {
      id: generateId(),
      projectId: project.id,
      selectedArtifactIds: [],
      selectedAssetIds: [],
      caption: '',
      audience: '',
      purpose: '',
      redactedPaths: [],
      handoffStatus: 'prepared',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addReleaseDraft(newDraft);
    setEditingId(newDraft.id);
    setIsCreating(true);
  };

  const handleHandoff = async (draft: MakerReleaseDraftV1) => {
    // CHK-094/Q070: This is a "Browser Handoff" point.
    // In a local-first app, we don't post to APIs. Instead, we prepare the 
    // social payload and trigger a browser event that the user can use to 
    // copy/paste or (if a browser extension were present) auto-fill.
    try {
      updateReleaseDraft(draft.id, { 
        handoffStatus: 'handed-off',
        lastHandoffAt: new Date().toISOString()
      });
      
      toast({
        title: copy.releaseHandoff,
        description: copy.releaseDraftHandedOff,
      });
    } catch (err) {
      toast({
        title: copy.releaseDraftUnknown,
        description: String(err),
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Send className="h-6 w-6 text-primary" />
              {copy.releaseDraftsTitle}
            </CardTitle>
            <CardDescription>{copy.releaseDraftsDescription}</CardDescription>
          </div>
          <Button onClick={startCreate} className="gap-2 min-h-11 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            {copy.releaseCreateDraft}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-0 space-y-6">
        {drafts.length === 0 && !isCreating ? (
          <div className="rounded-xl border border-dashed border-primary/25 bg-background/70 px-5 py-12 text-center">
            <Send className="mx-auto h-10 w-10 text-primary/40" aria-hidden="true" />
            <p className="mt-4 font-medium text-muted-foreground">{copy.releaseNoDrafts}</p>
            <Button onClick={startCreate} variant="outline" className="mt-6 min-h-11 gap-2">
              <Plus className="h-4 w-4" />
              {copy.releaseCreateDraft}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {drafts.map((draft) => (
              <ReleaseDraftCard 
                key={draft.id}
                draft={draft}
                assets={assets}
                packages={packages}
                isEditing={editingId === draft.id}
                onEdit={() => setEditingId(draft.id)}
                onCancel={() => { setEditingId(null); setIsCreating(false); }}
                onSave={(patch) => { updateReleaseDraft(draft.id, patch); setEditingId(null); setIsCreating(false); }}
                onDelete={() => deleteReleaseDraft(draft.id)}
                onHandoff={() => handleHandoff(draft)}
                copy={copy}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReleaseDraftCard({ 
  draft, 
  assets, 
  packages, 
  isEditing, 
  onEdit, 
  onCancel, 
  onSave, 
  onDelete,
  onHandoff,
  copy 
}: { 
  draft: MakerReleaseDraftV1; 
  assets: any[]; 
  packages: any[]; 
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (patch: Partial<MakerReleaseDraftV1>) => void;
  onDelete: () => void;
  onHandoff: () => void;
  copy: any;
}) {
  const [form, setForm] = useState<Partial<MakerReleaseDraftV1>>(draft);

  if (isEditing) {
    return (
      <Card className="border-primary/20 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        <CardHeader className="bg-primary/[0.02] border-b border-primary/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">{copy.releaseCreateDraft}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>{copy.cancel}</Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{copy.releaseAudience}</Label>
                <Input 
                  value={form.audience || ''} 
                  onChange={e => setForm({...form, audience: e.target.value})}
                  placeholder="e.g. Instagram Followers, Ravelry"
                />
              </div>
              <div className="space-y-2">
                <Label>{copy.releasePurpose}</Label>
                <Input 
                  value={form.purpose || ''} 
                  onChange={e => setForm({...form, purpose: e.target.value})}
                  placeholder="e.g. Pattern Launch, Test Knit Call"
                />
              </div>
              <div className="space-y-2">
                <Label>{copy.releaseCaption}</Label>
                <Textarea 
                  value={form.caption || ''} 
                  onChange={e => setForm({...form, caption: e.target.value})}
                  placeholder="Write your social media caption..."
                  className="min-h-[120px]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{copy.publicationArtifacts}</Label>
                <div className="rounded-lg border bg-muted/20 p-3 max-h-[150px] overflow-y-auto space-y-2">
                  {packages.flatMap(p => p.artifacts || []).map((art: any) => (
                    <div key={art.id} className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox"
                        checked={form.selectedArtifactIds?.includes(art.id)}
                        onChange={e => {
                          const ids = form.selectedArtifactIds || [];
                          setForm({
                            ...form, 
                            selectedArtifactIds: e.target.checked 
                              ? [...ids, art.id] 
                              : ids.filter(id => id !== art.id)
                          });
                        }}
                        className="h-4 w-4 rounded border-primary/30"
                      />
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{art.label || art.filename}</span>
                    </div>
                  ))}
                  {packages.length === 0 && <p className="text-xs text-muted-foreground italic">{copy.publicationNoPackages}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{copy.finishedWorkTitle}</Label>
                <div className="rounded-lg border bg-muted/20 p-3 max-h-[150px] overflow-y-auto grid grid-cols-2 gap-2">
                  {assets.filter(a => a.type === 'image').map((asset: any) => (
                    <div 
                      key={asset.id} 
                      onClick={() => {
                        const ids = form.selectedAssetIds || [];
                        setForm({
                          ...form, 
                          selectedAssetIds: ids.includes(asset.id)
                            ? ids.filter(id => id !== asset.id)
                            : [...ids, asset.id]
                        });
                      }}
                      className={cn(
                        "relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all",
                        form.selectedAssetIds?.includes(asset.id) ? "border-primary" : "border-transparent opacity-60"
                      )}
                    >
                      <img src={asset.dataUrl} alt={asset.label} className="h-full w-full object-cover" />
                      {form.selectedAssetIds?.includes(asset.id) && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <CheckCircle2 className="h-6 w-6 text-primary bg-background rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                  {assets.filter(a => a.type === 'image').length === 0 && (
                    <p className="col-span-2 text-xs text-muted-foreground italic py-2">{copy.finishedEmpty}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/5 min-h-11 gap-2">
                  <Trash2 className="h-4 w-4" />
                  {copy.releaseDeleteDraft}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{copy.releaseDeleteDraft}</AlertDialogTitle>
                  <AlertDialogDescription>{copy.releaseConfirmDeleteDraft}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {copy.batchDelete}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <div className="flex gap-2">
              <Button variant="outline" className="min-h-11" onClick={onCancel}>{copy.cancel}</Button>
              <Button className="min-h-11 px-8" onClick={() => onSave(form)}>{copy.save}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedAssets = assets.filter(a => draft.selectedAssetIds?.includes(a.id));
  const selectedArtifacts = packages.flatMap(p => p.artifacts || []).filter(a => draft.selectedArtifactIds?.includes(a.id));

  return (
    <Card className="border shadow-sm hover:border-primary/30 transition-colors group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{draft.purpose || copy.releaseDraftsTitle}</h3>
              <Badge variant={draft.handoffStatus === 'handed-off' ? 'default' : 'secondary'} className="h-5">
                {draft.handoffStatus === 'handed-off' ? copy.releaseDraftHandedOff : copy.releaseDraftPrepared}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              {new Date(draft.updatedAt).toLocaleDateString()} · {draft.audience || 'General Audience'}
            </p>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="min-h-11 w-11 p-0" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {draft.caption && (
          <div className="rounded-lg bg-muted/30 p-4 border border-muted text-sm italic text-muted-foreground line-clamp-3">
            "{draft.caption}"
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          {selectedAssets.length > 0 && (
            <div className="flex -space-x-2">
              {selectedAssets.slice(0, 3).map(asset => (
                <div key={asset.id} className="h-10 w-10 rounded-full border-2 border-background overflow-hidden bg-muted">
                  <img src={asset.dataUrl} alt={asset.label} className="h-full w-full object-cover" />
                </div>
              ))}
              {selectedAssets.length > 3 && (
                <div className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                  +{selectedAssets.length - 3}
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {selectedArtifacts.map(art => (
              <Badge key={art.id} variant="outline" className="gap-1.5 py-1">
                <FileText className="h-3 w-3 text-primary" />
                {art.label || art.filename}
              </Badge>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            {draft.handoffStatus === 'handed-off' 
              ? `${copy.releaseDraftHandedOff}: ${new Date(draft.lastHandoffAt!).toLocaleString()}`
              : copy.releaseDraftPrepared
            }
          </div>
          <Button onClick={onHandoff} className="gap-2 min-h-11">
            <ExternalLink className="h-4 w-4" />
            {copy.releaseHandoff}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Edit2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}
