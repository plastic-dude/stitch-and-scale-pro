import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '@/context/SettingsContext';
import { ASSETS_COPY } from '@/lib/assets-copy';
import { type PatternProject, type ProjectAsset, generateId } from '@/lib/grading-engine';
import { Image, FileText, File, Trash2, Plus, Download, Eye, Paperclip, ImageIcon, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AssetsPanelProps {
  project: PatternProject;
  addAsset: (asset: ProjectAsset) => void;
  deleteAsset: (assetId: string) => void;
}

export default function AssetsPanel({ project, addAsset, deleteAsset }: AssetsPanelProps) {
  const { language } = useSettings();
  const copy = ASSETS_COPY[language];
  const { toast } = useToast();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<ProjectAsset>>({
    category: 'photo',
    label: ''
  });
  const [fileData, setFileData] = useState<{ name: string; size: number; type: string; dataUrl: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: copy.assetLimit,
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileData({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: event.target?.result as string
      });
      if (!newAsset.label) {
        setNewAsset(prev => ({ ...prev, label: file.name.split('.')[0] }));
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
      category: (newAsset.category as any) || 'photo',
      createdAt: new Date().toISOString()
    };

    addAsset(asset);
    setIsAdding(false);
    setNewAsset({ category: 'photo', label: '' });
    setFileData(null);
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

  const assets = project.assets || [];

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Paperclip className="h-6 w-6 text-primary" />
              {copy.assetsTitle}
            </CardTitle>
            <CardDescription>{copy.assetsDescription}</CardDescription>
          </div>
          <Button onClick={() => setIsAdding(true)} className="gap-2 min-h-11">
            <Plus className="h-4 w-4" />
            {copy.addAsset}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-0 space-y-6">
        {isAdding && (
          <div className="p-4 border-2 border-dashed rounded-xl bg-accent/5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{copy.assetLabel}</Label>
                <Input 
                  value={newAsset.label} 
                  onChange={e => setNewAsset(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g. Front View, Swatch A"
                />
              </div>
              <div className="space-y-2">
                <Label>{copy.assetCategory}</Label>
                <Select 
                  value={newAsset.category} 
                  onValueChange={v => setNewAsset(prev => ({ ...prev, category: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photo">{copy.categoryPhoto}</SelectItem>
                    <SelectItem value="swatch">{copy.categorySwatch}</SelectItem>
                    <SelectItem value="schematic">{copy.categorySchematic}</SelectItem>
                    <SelectItem value="evidence">{copy.categoryEvidence}</SelectItem>
                    <SelectItem value="other">{copy.categoryOther}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{copy.assetFile}</Label>
              <div className="flex items-center gap-4">
                <Input 
                  type="file" 
                  onChange={handleFileChange} 
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                  className="cursor-pointer"
                />
                {fileData && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatSize(fileData.size)}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground italic">{copy.assetLimit}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" className="min-h-11" onClick={() => setIsAdding(false)}>{copy.cancel}</Button>
              <Button className="min-h-11" onClick={handleSave} disabled={!fileData || !newAsset.label}>{copy.save}</Button>
            </div>
          </div>
        )}

        {assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed rounded-3xl opacity-60">
            <div className="p-4 rounded-full bg-accent/10">
              <Camera className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">{copy.noAssets}</p>
              <p className="text-sm text-muted-foreground">Attach photos or reference files to your project.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map(asset => (
              <div key={asset.id} className="group relative flex flex-col border rounded-2xl bg-white shadow-sm overflow-hidden hover:shadow-md transition-all hover:border-primary/20">
                {asset.type === 'image' ? (
                  <div className="aspect-video bg-accent/5 relative overflow-hidden">
                    <img 
                      src={asset.dataUrl} 
                      alt={asset.label} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="icon" variant="secondary" className="h-8 w-8 min-h-11 min-w-11 rounded-full" aria-label={copy.viewAsset} onClick={() => window.open(asset.dataUrl)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <a href={asset.dataUrl} download={asset.filename} aria-label={copy.downloadAsset}>
                        <Button size="icon" variant="secondary" className="h-8 w-8 min-h-11 min-w-11 rounded-full" aria-label={copy.downloadAsset}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-accent/10 flex flex-col items-center justify-center gap-2">
                    <div className="p-3 rounded-xl bg-white shadow-sm">
                      {getAssetIcon(asset.type)}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{asset.mimeType.split('/')[1]}</span>
                  </div>
                )}
                
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-sm leading-tight line-clamp-1">{asset.label}</h4>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent-foreground font-medium">{asset.category}</span>
                        <span>•</span>
                        <span>{formatSize(asset.size)}</span>
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 min-h-11 min-w-11 text-muted-foreground hover:text-destructive shrink-0"
                      aria-label={copy.deleteAsset}
                      onClick={() => {
                        if (confirm(copy.confirmDelete)) deleteAsset(asset.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
