import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/context/SettingsContext';
import { ASSETS_COPY } from '@/lib/assets-copy';
import { type PatternProject, type ProjectAsset, generateId } from '@/lib/grading-engine';
import { Image, FileText, File, Trash2, Plus, Download, Eye, Paperclip, ImageIcon, Camera, Star, FileCheck2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AssetsPanelProps {
  project: PatternProject;
  addAsset: (asset: ProjectAsset) => void;
  deleteAsset: (assetId: string) => void;
  updateAsset: (assetId: string, patch: Partial<ProjectAsset>) => void;
}

export default function AssetsPanel({ project, addAsset, deleteAsset, updateAsset }: AssetsPanelProps) {
  const { language } = useSettings();
  const copy = ASSETS_COPY[language];
  const { toast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<ProjectAsset>>({
    category: 'photo',
    label: '',
  });
  const [fileData, setFileData] = useState<{ name: string; size: number; type: string; dataUrl: string } | null>(null);

  const assets = project.assets || [];
  const finishedWorkPhotos = assets.filter((asset) => asset.type === 'image' && asset.category === 'photo' && asset.isFinishedWork);
  const referenceAssets = assets.filter((asset) => !finishedWorkPhotos.some((photo) => photo.id === asset.id));
  const isFinishedPhoto = newAsset.isFinishedWork === true;

  const startAdd = (finishedWork: boolean) => {
    setIsAdding(true);
    setNewAsset({
      category: 'photo',
      label: '',
      caption: '',
      isFinishedWork: finishedWork,
      includeInPdf: finishedWork,
    });
    setFileData(null);
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewAsset({ category: 'photo', label: '' });
    setFileData(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: copy.assetLimit,
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileData({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: event.target?.result as string,
      });
      if (!newAsset.label) {
        setNewAsset((prev) => ({ ...prev, label: file.name.split('.')[0] }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!fileData || !newAsset.label) return;

    const asset: ProjectAsset = {
      id: generateId(),
      type: fileData.type.startsWith('image/') ? 'image' : fileData.type === 'application/pdf' ? 'document' : 'other',
      label: newAsset.label,
      filename: fileData.name,
      mimeType: fileData.type,
      size: fileData.size,
      dataUrl: fileData.dataUrl,
      category: (newAsset.category as ProjectAsset['category']) || 'photo',
      createdAt: new Date().toISOString(),
      caption: newAsset.caption?.trim() || undefined,
      isFinishedWork: isFinishedPhoto,
      includeInPdf: isFinishedPhoto ? newAsset.includeInPdf !== false : undefined,
    };

    addAsset(asset);
    cancelAdd();
  };

  const handleFeatureChange = (assetId: string, featured: boolean) => {
    // A project has one intentional hero view. Updating all finished images keeps
    // the gallery and export deterministic without introducing another data store.
    finishedWorkPhotos.forEach((photo) => {
      updateAsset(photo.id, { isFeatured: featured ? photo.id === assetId : false });
    });
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      default: return <File className="h-5 w-5" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Paperclip className="h-6 w-6 text-primary" />
              {copy.assetsTitle}
            </CardTitle>
            <CardDescription>{copy.assetsDescription}</CardDescription>
          </div>
          <Button onClick={() => startAdd(false)} className="gap-2 min-h-11 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            {copy.addAsset}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-0 space-y-8">
        <section className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 sm:p-5" data-testid="finished-work-gallery">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Camera className="h-5 w-5 text-primary" aria-hidden="true" />
                {copy.finishedWorkTitle}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{copy.finishedWorkDescription}</p>
            </div>
            <Button variant="secondary" onClick={() => startAdd(true)} className="gap-2 min-h-11 shrink-0">
              <Image className="h-4 w-4" />
              {copy.addFinishedPhoto}
            </Button>
          </div>

          {finishedWorkPhotos.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-primary/25 bg-background/70 px-5 py-8 text-center">
              <Star className="mx-auto h-7 w-7 text-primary/60" aria-hidden="true" />
              <p className="mt-3 font-medium">{copy.finishedEmpty}</p>
              <p className="mx-auto mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">{copy.finishedEmptyBody}</p>
              <Button onClick={() => startAdd(true)} className="mt-4 min-h-11 gap-2">
                <Plus className="h-4 w-4" />
                {copy.addFinishedPhoto}
              </Button>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {finishedWorkPhotos.map((asset) => (
                <article key={asset.id} className={cn('overflow-hidden rounded-xl border bg-background shadow-sm', asset.isFeatured && 'border-primary ring-1 ring-primary/20')}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                    <img src={asset.dataUrl} alt={asset.caption || asset.label} className="h-full w-full object-cover" />
                    {asset.isFeatured && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">
                        <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                        {copy.featured}
                      </span>
                    )}
                    <div className="absolute right-2 top-2 flex gap-1">
                      <Button size="icon" variant="secondary" className="h-9 w-9 min-h-11 min-w-11 rounded-full shadow" aria-label={copy.viewAsset} onClick={() => window.open(asset.dataUrl, '_blank', 'noopener,noreferrer')}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <a href={asset.dataUrl} download={asset.filename} aria-label={copy.downloadAsset}>
                        <Button size="icon" variant="secondary" className="h-9 w-9 min-h-11 min-w-11 rounded-full shadow" aria-label={copy.downloadAsset}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate font-semibold text-sm">{asset.label}</h4>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{formatSize(asset.size)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 min-h-11 min-w-11 shrink-0 text-muted-foreground hover:text-destructive" aria-label={copy.deleteAsset} onClick={() => { if (confirm(copy.confirmDelete)) deleteAsset(asset.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Textarea
                      defaultValue={asset.caption || ''}
                      placeholder={copy.captionPlaceholder}
                      aria-label={`${copy.caption}: ${asset.label}`}
                      className="min-h-16 resize-y text-sm"
                      onBlur={(event) => updateAsset(asset.id, { caption: event.target.value.trim() || undefined })}
                    />
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <Label htmlFor={`feature-${asset.id}`} className="flex cursor-pointer items-center gap-2">
                          <Star className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          {asset.isFeatured ? copy.unmarkFeatured : copy.markFeatured}
                        </Label>
                        <Switch id={`feature-${asset.id}`} checked={Boolean(asset.isFeatured)} onCheckedChange={(checked) => handleFeatureChange(asset.id, checked)} aria-label={asset.isFeatured ? copy.unmarkFeatured : copy.markFeatured} />
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <Label htmlFor={`pdf-${asset.id}`} className="flex cursor-pointer items-center gap-2">
                          <FileCheck2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          {copy.includeInPdf}
                        </Label>
                        <Switch id={`pdf-${asset.id}`} checked={asset.includeInPdf !== false} onCheckedChange={(checked) => updateAsset(asset.id, { includeInPdf: checked })} aria-label={copy.includeInPdf} />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {isAdding && (
          <div className="space-y-4 rounded-xl border-2 border-dashed bg-accent/5 p-4 animate-in fade-in zoom-in-95 duration-200" data-testid="asset-upload-form">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{isFinishedPhoto ? copy.addFinishedPhoto : copy.addAsset}</h3>
                {isFinishedPhoto && <p className="mt-1 text-xs text-muted-foreground">{copy.finishedWorkDescription}</p>}
              </div>
              <Button variant="ghost" className="min-h-11" onClick={cancelAdd}>{copy.cancel}</Button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="asset-label">{copy.assetLabel}</Label>
                <Input id="asset-label" value={newAsset.label || ''} onChange={(e) => setNewAsset((prev) => ({ ...prev, label: e.target.value }))} placeholder={isFinishedPhoto ? copy.captionPlaceholder : 'e.g. Swatch A'} />
              </div>
              {!isFinishedPhoto && (
                <div className="space-y-2">
                  <Label>{copy.assetCategory}</Label>
                  <Select value={newAsset.category} onValueChange={(v) => setNewAsset((prev) => ({ ...prev, category: v as ProjectAsset['category'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photo">{copy.categoryPhoto}</SelectItem>
                      <SelectItem value="swatch">{copy.categorySwatch}</SelectItem>
                      <SelectItem value="schematic">{copy.categorySchematic}</SelectItem>
                      <SelectItem value="evidence">{copy.categoryEvidence}</SelectItem>
                      <SelectItem value="other">{copy.categoryOther}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {isFinishedPhoto && (
              <div className="space-y-2">
                <Label htmlFor="asset-caption">{copy.caption}</Label>
                <Textarea id="asset-caption" value={newAsset.caption || ''} onChange={(e) => setNewAsset((prev) => ({ ...prev, caption: e.target.value }))} placeholder={copy.captionPlaceholder} className="min-h-20 resize-y" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="asset-file">{copy.assetFile}</Label>
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                <Input id="asset-file" type="file" onChange={handleFileChange} accept={isFinishedPhoto ? 'image/*' : 'image/*,application/pdf,.doc,.docx,.txt'} className="cursor-pointer" />
                {fileData && <span className="text-xs text-muted-foreground">{formatSize(fileData.size)}</span>}
              </div>
              <p className="text-[10px] italic text-muted-foreground">{copy.assetLimit}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" className="min-h-11" onClick={cancelAdd}>{copy.cancel}</Button>
              <Button className="min-h-11" onClick={handleSave} disabled={!fileData || !newAsset.label}>{copy.save}</Button>
            </div>
          </div>
        )}

        {referenceAssets.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <File className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <div>
                <h3 className="font-semibold">{copy.assetsTitle}</h3>
                <p className="text-sm text-muted-foreground">{copy.assetsDescription}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {referenceAssets.map((asset) => (
                <div key={asset.id} className="group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                  {asset.type === 'image' ? (
                    <div className="relative aspect-video overflow-hidden bg-accent/5">
                      <img src={asset.dataUrl} alt={asset.label} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100">
                        <Button size="icon" variant="secondary" className="h-8 w-8 min-h-11 min-w-11 rounded-full" aria-label={copy.viewAsset} onClick={() => window.open(asset.dataUrl, '_blank', 'noopener,noreferrer')}><Eye className="h-4 w-4" /></Button>
                        <a href={asset.dataUrl} download={asset.filename} aria-label={copy.downloadAsset}><Button size="icon" variant="secondary" className="h-8 w-8 min-h-11 min-w-11 rounded-full" aria-label={copy.downloadAsset}><Download className="h-4 w-4" /></Button></a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-accent/10"><div className="rounded-xl bg-white p-3 shadow-sm">{getAssetIcon(asset.type)}</div><span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{asset.mimeType.split('/')[1]}</span></div>
                  )}
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5"><h4 className="line-clamp-1 text-sm font-semibold">{asset.label}</h4><p className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="rounded bg-accent/20 px-1.5 py-0.5 font-medium text-accent-foreground">{asset.category}</span><span>•</span><span>{formatSize(asset.size)}</span></p></div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 min-h-11 min-w-11 shrink-0 text-muted-foreground hover:text-destructive" aria-label={copy.deleteAsset} onClick={() => { if (confirm(copy.confirmDelete)) deleteAsset(asset.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
