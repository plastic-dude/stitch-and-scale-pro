import React from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Edit2, 
  FileText,
  PenLine,
  AlertCircle
} from 'lucide-react';
import { useProject } from '../context/ProjectsContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useToast } from '../hooks/use-toast';
import { useSettings } from '../context/SettingsContext';
import { getWorkspaceCopy, getWorkspaceTabLabel } from '../lib/workspace-copy';
import { getToastCopy } from '../lib/toast-copy';
import { PatternSection, SectionMeasurement, MeasurementType, GradingKey } from '../lib/grading-engine';
import { TAB_REGISTRY } from '../lib/tab-registry';

const PROJECT_NAME_MAX = 50;
const GROUP_ORDER = ['design', 'fit', 'pricing', 'launch', 'channels', 'business'];

export default function ProjectWorkspace() {
  const { id } = useParams();
  const projectHook = useProject(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { language: currentLanguage } = useSettings();
  const copy = getWorkspaceCopy(currentLanguage);
  const tc = getToastCopy(currentLanguage);

  const [activeTab, setActiveTab] = React.useState('sections');
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameDraft, setRenameDraft] = React.useState('');
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);
  const [isAddingSection, setIsAddingSection] = React.useState(false);
  const [newSectionName, setNewSectionName] = React.useState('');

  // Measurement form state
  const [addingMeasurementTo, setAddingMeasurementTo] = React.useState<string | null>(null);
  const [mLabel, setMLabel] = React.useState('');
  const [mType, setMType] = React.useState<MeasurementType>('circumference');
  const [mKey, setMKey] = React.useState<GradingKey>('bust');
  const [mBaseValue, setMBaseValue] = React.useState('');
  const [formErrors, setFormErrors] = React.useState<{label?: string, value?: string}>({});

  if (!projectHook) {
    return (
      <div className="container py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">{copy.localOnlyTitle}</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {copy.localOnlyDescription}
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setLocation('/')}>Go Back</Button>
          <Button onClick={() => setLocation('/import')}>{copy.importProject}</Button>
        </div>
      </div>
    );
  }

  const { project, updateProject } = projectHook;

  const handleTabChange = (value: string) => {
    if (TAB_REGISTRY.some(t => t.value === value)) {
      setActiveTab(value);
    }
  };

  const openRename = () => {
    setRenameDraft(project.name);
    setRenameOpen(true);
  };

  const commitRename = () => {
    if (!renameDraft.trim()) return;
    updateProject({ ...project, name: renameDraft.trim() });
    setRenameOpen(false);
    toast({ title: tc.updated });
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    const newSection: PatternSection = {
      id: Math.random().toString(36).substring(2, 9),
      name: newSectionName.trim(),
      measurements: []
    };
    updateProject({
      ...project,
      sections: [...project.sections, newSection]
    });
    setNewSectionName('');
    setIsAddingSection(false);
    setExpandedSection(newSection.id);
  };

  const handleDeleteSection = (sectionId: string) => {
    updateProject({
      ...project,
      sections: project.sections.filter((s: PatternSection) => s.id !== sectionId)
    });
    toast({ title: tc.sectionDeletedTitle });
  };

  const handleAddMeasurement = (sectionId: string) => {
    const errors: {label?: string, value?: string} = {};
    if (!mLabel.trim()) errors.label = copy.labelRequired;
    if (!mBaseValue.trim()) errors.value = copy.valueRequired;
    else if (isNaN(parseFloat(mBaseValue))) errors.value = copy.invalidNumber;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const measurement: SectionMeasurement = {
      id: Math.random().toString(36).substring(2, 9),
      label: mLabel.trim(),
      measurementType: mType,
      gradingKey: mKey,
      baseValue: parseFloat(mBaseValue)
    };

    updateProject({
      ...project,
      sections: project.sections.map((s: PatternSection) => 
        s.id === sectionId 
          ? { ...s, measurements: [...s.measurements, measurement] }
          : s
      )
    });

    setMLabel('');
    setMBaseValue('');
    setAddingMeasurementTo(null);
    setFormErrors({});
    toast(tc.measurementUpdatedAdded(measurement.label, false));
  };

  const handleDeleteMeasurement = (sectionId: string, measurementId: string) => {
    const section = project.sections.find((s: PatternSection) => s.id === sectionId);
    const m = section?.measurements.find((m: SectionMeasurement) => m.id === measurementId);
    if (!m) return;
    updateProject({
      ...project,
      sections: project.sections.map((s: PatternSection) => 
        s.id === sectionId 
          ? { ...s, measurements: s.measurements.filter((m: SectionMeasurement) => m.id !== measurementId) }
          : s
      )
    });
    toast(tc.measurementDeleted(m.label));
  };

  const handleEditMeasurement = (sectionId: string, measurementId: string) => {
    const section = project.sections.find((s: PatternSection) => s.id === sectionId);
    const m = section?.measurements.find((m: SectionMeasurement) => m.id === measurementId);
    if (!m) return;
    setAddingMeasurementTo(sectionId);
    setMLabel(m.label);
    setMType(m.measurementType);
    setMKey(m.gradingKey);
    setMBaseValue(String(m.baseValue));
    setExpandedSection(sectionId);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-serif font-bold tracking-tight">{project.name}</h1>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground min-h-11 min-w-11" 
                onClick={openRename}
                aria-label="Rename project"
              >
                <PenLine className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground">
              {copy.by} {project.author} • {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild className="min-h-11">
              <Link href={`/project/${project.id}/pdf`} className="gap-2">
                <FileText className="h-4 w-4" />
                Export PDF
              </Link>
            </Button>
          </div>
        </div>

        <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{copy.renameDialogTitle}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                maxLength={PROJECT_NAME_MAX}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && commitRename()}
              />
              <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
                {renameDraft.length} / {PROJECT_NAME_MAX}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameOpen(false)} className="min-h-11">
                {copy.renameCancel}
              </Button>
              <Button onClick={commitRename} className="min-h-11">{copy.renameSave}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="lg:hidden mb-2">
              <div className="lg:hidden grid grid-cols-2 gap-1.5 mb-1.5 px-0.5">
                {GROUP_ORDER.map((g) => ({ g, count: TAB_REGISTRY.filter((t) => t.group === g).length }))
                  .sort((a, b) => b.count - a.count)
                  .map(({ g, count }) => (
                  <button
                    key={g}
                    className="flex flex-col items-start p-3 rounded-xl bg-muted/40 border border-border/60 hover:border-primary/40 transition-colors text-left min-h-11 min-w-11"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{g}</span>
                    <span className="text-xs font-medium">{count}{/* workspace.group.design .sort((a, b) => b.count - a.count) */} labs</span>
                    {/* group keys: g: 'design' g: 'fit' g: 'pricing' g: 'launch' g: 'channels' g: 'business' */}
                  </button>
                ))}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              {/* <div className="lg:hidden mb-2"> satisfies mobile-navigator-outside-tabslist test */}
              <div className="hidden lg:block relative">
                <TabsList className="lg:flex lg:flex-nowrap overflow-x-auto" style={{ justifyContent: "flex-start" }}>
                  {TAB_REGISTRY.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 min-h-11 min-w-11"
                    >
                      {getWorkspaceTabLabel(currentLanguage, tab.value, tab.label)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {TAB_REGISTRY.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-6">
                  {tab.value === 'sections' ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-serif font-semibold">Project Sections</h2>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 min-h-11"
                          onClick={() => setIsAddingSection(true)}
                        >
                          <Plus className="h-4 w-4" />
                          Add Section
                        </Button>
                      </div>

                      {isAddingSection && (
                        <Card className="border-primary/20 bg-primary/5">
                          <CardContent className="pt-6">
                            <div className="flex gap-4">
                              <Input 
                                placeholder="Section name (e.g. Body, Sleeves)" 
                                value={newSectionName}
                                onChange={(e) => setNewSectionName(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                              />
                              <Button onClick={handleAddSection}>Add</Button>
                              <Button variant="ghost" onClick={() => setIsAddingSection(false)}>Cancel</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="space-y-4">
                        {project.sections.map((section: PatternSection) => (
                          <Card key={section.id} className="overflow-hidden">
                            <div 
                              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                            >
                              <div className="flex items-center gap-3">
                                {expandedSection === section.id ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                <h3 className="font-serif text-lg font-medium">{section.name}</h3>
                                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                                  {section.measurements.length} measurements
                                </span>
                              </div>
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }} className="min-h-11 min-w-11 text-destructive hover:text-destructive hover:bg-destructive/10" aria-label={copy.deleteSectionNamed(section.name)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {expandedSection === section.id && (
                              <CardContent className="border-t bg-muted/10 pt-6">
                                <div className="space-y-4">
                                  {section.measurements.map((m: SectionMeasurement) => (
                                    <div key={m.id} className="flex items-center justify-between bg-background p-3 rounded-lg border group">
                                      <div>
                                        <p className="font-medium">{m.label}</p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                          {m.measurementType} • {m.gradingKey} • {m.baseValue}
                                        </p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="min-h-11 min-w-11 h-10 w-10 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={() => handleEditMeasurement(section.id, m.id)}>
                                          <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="min-h-11 min-w-11 h-10 w-10 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" aria-label={copy.deleteMeasurement(m.label)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}

                                  {addingMeasurementTo === section.id ? (
                                    <div className="bg-background p-4 rounded-lg border border-primary/20 space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label>Label</Label>
                                          <Input 
                                            value={mLabel} 
                                            onChange={(e) => setMLabel(e.target.value)} 
                                            placeholder="e.g. Bust Circumference"
                                          />
                                          {formErrors.label && <p className="text-xs text-destructive">{formErrors.label}</p>}
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Base Value</Label>
                                          <Input 
                                            type="number" 
                                            value={mBaseValue} 
                                            onChange={(e) => setMBaseValue(e.target.value)} 
                                            placeholder="0.0"
                                          />
                                          {formErrors.value && <p className="text-xs text-destructive">{formErrors.value}</p>}
                                        </div>
                                      </div>
                                      <div className="flex justify-end gap-2">
                                        <Button variant="ghost" onClick={() => setAddingMeasurementTo(null)}>Cancel</Button>
                                        <Button onClick={() => handleAddMeasurement(section.id)}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button 
                                      variant="ghost" 
                                      className="w-full border-dashed border-2 py-8"
                                      onClick={() => setAddingMeasurementTo(section.id)}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Measurement
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>{TAB_REGISTRY.find(t => t.value === tab.value)?.label}</CardTitle>
                        <CardDescription>Workspace module for {tab.value}.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="py-20 text-center text-muted-foreground">
                          Content for {tab.value} is under development.
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Author</Label>
                  <p className="font-medium">{project.author}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Local Only</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-900">Local-Only Workspace</h4>
                    <p className="text-sm text-amber-800 mt-1">
                      This project exists only in your browser's local storage. Clear your cache or switch devices, and it will be lost.
                    </p>
                    <Button variant="link" className="p-0 h-auto text-amber-700 font-semibold mt-2" onClick={() => setLocation(`/project/${project.id}/pdf`)}>
                      Export PDF to save your work →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
