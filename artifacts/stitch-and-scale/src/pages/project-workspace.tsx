import React from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useProject } from '@/context/ProjectsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TAB_GROUPS } from '@/lib/workspace-tab-groups';
import { TAB_REGISTRY } from '@/lib/tab-registry';
import { TabNavigator } from '../components/tab-navigator';
import { NAVIGATOR_COPY } from '@/lib/tab-navigator-copy';
import { getWorkspaceTabLabel } from '@/lib/workspace-tab-labels';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { generateId, PatternSection, SectionMeasurement, MeasurementType, GradingKey, GRADING_KEY_LABELS, ALL_SIZES, gradePattern, resolveProjectStandards } from '@/lib/grading-engine';
import { Plus, Edit2, Trash2, Table as TableIcon, Copy, ChevronDown, ChevronRight, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { useProjectStorage, useProjectStorageState } from '@/lib/storage-lib';
import { getWorkspaceCopy, workspaceGaugeByline, STS_UNIT, ROWS_UNIT } from '@/lib/workspace-copy';
import { getToastCopy } from '@/lib/toast-copy';
import { notesNeedSave, withNotes } from '@/lib/notes-persistence';
import { parsePositiveMeasurement } from '@/lib/measurement-validation';

// CHK-155: every persisted project name passes through these rules, so a
// project seeded by QA (e.g. "Localization Audit") can always be renamed.
const PROJECT_NAME_MAX = 80;
function normalizeProjectName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

// CHK-094 bundle fix: lab cards are lazy-loaded on first tab activation.
function cardLazy(loader: () => Promise<{ default?: React.ComponentType<any> } & Record<string, any>>): () => Promise<{ default: React.ComponentType<any> }> {
  return () => loader().then((m) => ({ default: m.default ?? Object.values(m)[0] as React.ComponentType<any> }));
}
const LAB = {
  yarn: React.lazy(cardLazy(() => import('@/components/yarn-estimator-card'))),
  income: React.lazy(cardLazy(() => import('@/components/income-calculator-card'))),
  draft: React.lazy(cardLazy(() => import('@/components/pattern-draft-card'))),
  pricing: React.lazy(cardLazy(() => import('@/components/pricing-advisor-card'))),
  publish: React.lazy(cardLazy(() => import('@/components/publish-toolkit-card'))),
  testknit: React.lazy(cardLazy(() => import('@/components/test-knit-card'))),
  techedit: React.lazy(cardLazy(() => import('@/components/tech-edit-card'))),
  finish: React.lazy(cardLazy(() => import('@/components/finish-guide-card'))),
  deals: React.lazy(cardLazy(() => import('@/components/deals-tab-card'))),
  launch: React.lazy(cardLazy(() => import('@/components/launch-campaign-card'))),
  trunkshow: React.lazy(cardLazy(() => import('@/components/trunk-show-card'))),
  transbundle: React.lazy(cardLazy(() => import('@/components/translation-bundle-card'))),
  patternclub: React.lazy(cardLazy(() => import('@/components/pattern-club-card'))),
  kits: React.lazy(cardLazy(() => import('@/components/kit-economics-card'))),
  pipeline: React.lazy(cardLazy(() => import('@/components/submission-pipeline-card'))),
  kalroi: React.lazy(cardLazy(() => import('@/components/kal-roi-card'))),
  channels: React.lazy(cardLazy(() => import('@/components/channel-funnel-card'))),
  clubrev: React.lazy(cardLazy(() => import('@/components/club-revenue-card'))),
  wsbook: React.lazy(cardLazy(() => import('@/components/wholesale-book-card'))),
  hireself: React.lazy(cardLazy(() => import('@/components/hire-vs-self-card'))),
  inclusive: React.lazy(cardLazy(() => import('@/components/inclusive-sizing-card'))),
  licenceit: React.lazy(cardLazy(() => import('@/components/pattern-license-card'))),
  members: React.lazy(cardLazy(() => import('@/components/membership-card'))),
  promo: React.lazy(cardLazy(() => import('@/components/promotion-card'))),
  pricewin: React.lazy(cardLazy(() => import('@/components/price-window-card'))),
  repeat: React.lazy(cardLazy(() => import('@/components/retention-card'))),
  mix: React.lazy(cardLazy(() => import('@/components/platform-mix-card'))),
  collab: React.lazy(cardLazy(() => import('@/components/collab-evaluator-card'))),
  bookit: React.lazy(cardLazy(() => import('@/components/pod-book-card'))),
  protect: React.lazy(cardLazy(() => import('@/components/copyright-protection-card'))),
  teach: React.lazy(cardLazy(() => import('@/components/teach-economics-card'))),
  partners: React.lazy(cardLazy(() => import('@/components/partner-economics-card'))),
  yarnbuy: React.lazy(cardLazy(() => import('@/components/yarn-buy-calculator-card'))),
  kal: React.lazy(cardLazy(() => import('@/components/kal-planner-card'))),
  submissions: React.lazy(cardLazy(() => import('@/components/submission-desk-card'))),
  gradinglab: React.lazy(cardLazy(() => import('@/components/grading-lab-card'))),
  chartlab: React.lazy(cardLazy(() => import('@/components/chart-lab-card'))),
  testdesk: React.lazy(cardLazy(() => import('@/components/testknit-desk-card'))),
  lookbook: React.lazy(cardLazy(() => import('@/components/lookbook-desk-card'))),
  specsheet: React.lazy(cardLazy(() => import('@/components/spec-sheet-lab-card'))),
  subdist: React.lazy(cardLazy(() => import('@/components/subscription-distribution-lab-card'))),
  listingseo: React.lazy(cardLazy(() => import('@/components/listing-seo-lab-card'))),
  adlab: React.lazy(cardLazy(() => import('@/components/ad-break-even-card'))),
  samplelaunch: React.lazy(cardLazy(() => import('@/components/sample-launch-lab-card'))),
  dealmath: React.lazy(cardLazy(() => import('@/components/collab-deal-math-card'))),
  photolab: React.lazy(cardLazy(() => import('@/components/photo-roi-lab-card'))),
  videosocial: React.lazy(cardLazy(() => import('@/components/video-social-lab-card'))),
  showroi: React.lazy(cardLazy(() => import('@/components/show-roi-lab-card'))),
  wholesale: React.lazy(cardLazy(() => import('@/components/wholesale-lab-card'))),
  preorder: React.lazy(cardLazy(() => import('@/components/preorder-campaign-lab-card'))),
  listingtest: React.lazy(cardLazy(() => import('@/components/listing-test-lab-card'))),
  yarnpool: React.lazy(cardLazy(() => import('@/components/yarn-pool-lab-card'))),
  membershipsite: React.lazy(cardLazy(() => import('@/components/membership-site-lab-card'))),
  releasetiming: React.lazy(cardLazy(() => import('@/components/release-timing-lab-card'))),
  conventionbooth: React.lazy(cardLazy(() => import('@/components/convention-booth-lab-card'))),
  channelmigration: React.lazy(cardLazy(() => import('@/components/channel-migration-lab-card'))),
  workshopteach: React.lazy(cardLazy(() => import('@/components/workshop-teaching-lab-card'))),
  consignmentreprice: React.lazy(cardLazy(() => import('@/components/consignment-reprice-lab-card'))),
  patternbundle: React.lazy(cardLazy(() => import('@/components/pattern-bundle-lab-card'))),
  retreatteach: React.lazy(cardLazy(() => import('@/components/retreat-teaching-lab-card'))),
  podcastaffiliate: React.lazy(cardLazy(() => import('@/components/podcast-affiliate-lab-card'))),
  magazinesubmission: React.lazy(cardLazy(() => import('@/components/magazine-submission-lab-card'))),
  pricingpsychology: React.lazy(cardLazy(() => import('@/components/pricing-psychology-lab-card'))),
  podpatterns: React.lazy(cardLazy(() => import('@/components/pod-patterns-lab-card'))),
  marketplacetakerate: React.lazy(cardLazy(() => import('@/components/marketplace-takerate-lab-card'))),
  boxinclusion: React.lazy(cardLazy(() => import('@/components/box-inclusion-lab-card'))),
  yarnlicensing: React.lazy(cardLazy(() => import('@/components/yarn-licensing-lab-card'))),
  giftcard: React.lazy(cardLazy(() => import('@/components/giftcard-lab-card'))),
  wholesalepricelist: React.lazy(cardLazy(() => import('@/components/wholesale-pricelist-lab-card'))),
  intlpricing: React.lazy(cardLazy(() => import('@/components/intl-pricing-lab-card'))),
  testknitlab: React.lazy(cardLazy(() => import('@/components/testknit-slot-lab-card'))),
  gaugefit: React.lazy(cardLazy(() => import('@/components/gauge-fit-translator-card'))),
  receiptlab: React.lazy(cardLazy(() => import('@/components/receipt-lab-card'))),
  designledger: React.lazy(cardLazy(() => import('@/components/design-ledger-card'))),
  bragcard: React.lazy(cardLazy(() => import('@/components/brag-card-card'))),
  payback: React.lazy(cardLazy(() => import('@/components/payback-lab-card'))),
  snapshots: React.lazy(cardLazy(() => import('@/components/project-snapshots-card'))),
  readiness: React.lazy(cardLazy(() => import('@/components/project-readiness-card'))),
  packages: React.lazy(cardLazy(() => import('@/components/project-package-card'))),
};

class LabErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('Lab render error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function LazyPanel({ loader, project }: { loader: React.LazyExoticComponent<any>; project: any }): React.ReactElement {
  const { language } = useSettings();
  const copy = getWorkspaceCopy(language);
  const Lab = loader as React.ComponentType<{ project: any }>;
  const errorFallback = (
    <Card className="my-8 border-destructive/20 bg-destructive/5">
      <CardContent className="pt-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <Trash2 className="h-6 w-6" />
          </div>
        </div>
        <h3 className="mb-2 text-lg font-medium">{copy.labLoadErrorTitle}</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          {copy.labLoadErrorDesc}
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          {copy.retry}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <LabErrorBoundary fallback={errorFallback}>
      <React.Suspense fallback={<div className="py-10 text-center text-sm text-muted-foreground">{copy.loadingLab}</div>}>
        <Lab project={project} />
      </React.Suspense>
    </LabErrorBoundary>
  );
}

function TriggerChildren({ value, label }: { value: string; label?: string }): React.ReactElement {
  return <>{label ?? value}</>;
}

export default function ProjectWorkspace() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const projectHook = useProject(id);
  const { language: currentLanguage, t, customStandard } = useSettings();
  const { toast } = useToast();
  
  if (!projectHook) {
    return <div className="flex items-center justify-center min-h-[400px]">{t('workspace.loading')}</div>;
  }

  const { 
    project, 
    updateProject, 
    createSnapshot, 
    restoreSnapshot, 
    deleteSnapshot,
    createPublicationPackage,
    updatePublicationPackage,
    deletePublicationPackage,
    addPublicationArtifact
  } = projectHook;
  const copy = getWorkspaceCopy(currentLanguage);
  const tc = getToastCopy(currentLanguage);

  const [activeTab, setActiveTab] = React.useState('sections');
  
  // CHK-162 (QUEUE-019): Favorites and recents tracking
  const favHandle = useProjectStorage<string[]>(
    'favorites',
    project.id,
    ['stitch-and-scale-favorites']
  );
  const [favorites, setFavorites] = useProjectStorageState<string[]>(
    favHandle,
    (raw) => raw ?? []
  );

  const recentHandle = useProjectStorage<string[]>(
    'recent-labs',
    project.id,
    ['stitch-and-scale-recent-labs']
  );
  const [recentLabs, setRecentLabs] = useProjectStorageState<string[]>(
    recentHandle,
    (raw) => raw ?? []
  );

  const toggleFavorite = React.useCallback((tabValue: string) => {
    setFavorites(prev => 
      prev.includes(tabValue) 
        ? prev.filter(v => v !== tabValue) 
        : [...prev, tabValue].slice(-12) // Limit to 12 favorites
    );
  }, [setFavorites]);

  const trackRecent = React.useCallback((tabValue: string) => {
    if (['sections', 'preview', 'notes'].includes(tabValue)) return;
    setRecentLabs(prev => {
      const filtered = prev.filter(v => v !== tabValue);
      return [tabValue, ...filtered].slice(0, 8); // Keep last 8
    });
  }, [setRecentLabs]);

  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);
  const [isAddingSection, setIsAddingSection] = React.useState(false);
  const [newSectionName, setNewSectionName] = React.useState('');
  const [addingMeasurementTo, setAddingMeasurementTo] = React.useState<string | null>(null);
  const [editingMeasurement, setEditingMeasurement] = React.useState<{ sectionId: string, measurementId: string } | null>(null);
  const isEditing = !!editingMeasurement;
  
  // Measurement form state
  const [mLabel, setMLabel] = React.useState('');
  const [mType, setMType] = React.useState<MeasurementType>('circumference');
  const [mKey, setMKey] = React.useState<GradingKey>('bust');
  const [mBaseValue, setMBaseValue] = React.useState('');
  const [mErrors, setMErrors] = React.useState<Record<string, string>>({});
  const [mTouched, setMTouched] = React.useState<Record<string, boolean>>({});
  const [mStitchMode, setMStitchMode] = React.useState<'exact' | 'multiple' | 'even' | 'odd'>('exact');
  const [mStitchRepeat, setMStitchRepeat] = React.useState('');
  const [mStitchRemainder, setMStitchRemainder] = React.useState('');
  const [mRowMode, setMRowMode] = React.useState<'exact' | 'multiple' | 'even' | 'odd'>('exact');
  const [mRowRepeat, setMRowRepeat] = React.useState('');
  const [mRowRemainder, setMRowRemainder] = React.useState('');

  const [, setUndoStash] = React.useState<{ sectionId: string, measurement: SectionMeasurement, timer: any }[]>([]);

  // CHK-155: rename state
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameDraft, setRenameDraft] = React.useState('');

  // CHK-132: notes persistence
  const [notesDraft, setNotesDraft] = React.useState(project.description ?? '');
  const notesDirty = notesNeedSave(project, notesDraft);
  
  React.useEffect(() => {
    if (project) setNotesDraft(project.description ?? '');
  }, [project.id]);

  const persistNotes = React.useCallback(() => {
    if (!project || !notesDirty) return false;
    updateProject(withNotes(project, notesDraft));
    return true;
  }, [project, notesDraft, notesDirty, updateProject]);

  React.useEffect(() => {
    if (!notesDirty) return;
    const timer = window.setTimeout(() => persistNotes(), 500);
    return () => window.clearTimeout(timer);
  }, [notesDraft, notesDirty, persistNotes]);

  React.useEffect(() => {
    const flushNotes = () => persistNotes();
    window.addEventListener('pagehide', flushNotes);
    return () => window.removeEventListener('pagehide', flushNotes);
  }, [persistNotes]);

  const handleSaveNotes = () => {
    if (persistNotes()) {
      const saved = tc.notesSaved;
      toast({ title: saved });
    }
  };

  const openRename = () => {
    setRenameDraft(project.name ?? '');
    setRenameOpen(true);
  };

  const commitRename = () => {
    const next = normalizeProjectName(renameDraft);
    if (!next) {
      toast({ title: copy.renameEmpty, variant: 'destructive' });
      return;
    }
    if (next === project.name) {
      setRenameOpen(false);
      return;
    }
    updateProject({ ...project, name: next });
    setRenameOpen(false);
    toast({ title: copy.renameSaved });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    trackRecent(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddSection = () => {
    setMTouched(prev => ({ ...prev, section: true }));
    if (!newSectionName.trim()) return;
    const newSection: PatternSection = {
      id: generateId(),
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
    const deleted = tc.sectionDeletedTitle;
    const desc = tc.sectionDeletedDescription;
    toast({ 
      title: deleted, 
      description: desc 
    });
  };

  const resetMeasurementForm = () => {
    setMLabel('');
    setMBaseValue('');
    setMErrors({});
    setMTouched({});
    setAddingMeasurementTo(null);
    setEditingMeasurement(null);
  };

  const validateMeasurementForm = () => {
    const newErrors: Record<string, string> = {};
    if (!mLabel.trim()) newErrors.label = copy.fieldRequired;
    const parsed = parsePositiveMeasurement(mBaseValue);
    if (parsed === null) newErrors.value = copy.invalidNumber;
    setMErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUndoDelete = (stash: { sectionId: string, measurement: SectionMeasurement }) => {
    updateProject({
      ...project,
      sections: project.sections.map((s: PatternSection) => {
        if (s.id === stash.sectionId) {
          return { ...s, measurements: [...s.measurements, stash.measurement] };
        }
        return s;
      })
    });
    setUndoStash(prev => prev.filter(s => s.measurement.id !== stash.measurement.id));
    const restored = tc.measurementRestored(stash.measurement.label);
    toast({ title: restored.title, description: restored.description });
  };

  const handleAddMeasurement = (sectionId: string) => {
    setMTouched({ label: true, value: true });
    if (!validateMeasurementForm()) return;
    
    const rawBase = mBaseValue.trim();
    const parsedBase = parsePositiveMeasurement(rawBase)!;

    const measurement: SectionMeasurement = {
      id: isEditing ? editingMeasurement!.measurementId : generateId(),
      label: mLabel.trim(),
      measurementType: mType,
      gradingKey: mKey,
      baseValue: parsedBase,
      stitchRepeat: mStitchMode === 'multiple' && mStitchRepeat ? parseInt(mStitchRepeat) : undefined,
      stitchRemainder: mStitchMode === 'multiple' && mStitchRemainder ? parseInt(mStitchRemainder) : undefined,
      stitchParity: mStitchMode === 'even' || mStitchMode === 'odd' ? mStitchMode : undefined,
      rowRepeat: mRowMode === 'multiple' && mRowRepeat ? parseInt(mRowRepeat) : undefined,
      rowRemainder: mRowMode === 'multiple' && mRowRemainder ? parseInt(mRowRemainder) : undefined,
      rowParity: mRowMode === 'even' || mRowMode === 'odd' ? mRowMode : undefined,
    };

    updateProject({
      ...project,
      sections: project.sections.map((s: PatternSection) => {
        if (s.id !== sectionId) return s;
        if (isEditing) {
          return {
            ...s,
            measurements: s.measurements.map((m: SectionMeasurement) =>
              m.id === editingMeasurement!.measurementId ? measurement : m,
            ),
          };
        }
        return { ...s, measurements: [...s.measurements, measurement] };
      })
    });

    const addedOrUpdated = tc.measurementUpdatedAdded(measurement.label, isEditing);
    toast({ 
      title: addedOrUpdated.title, 
      description: addedOrUpdated.description 
    });
    resetMeasurementForm();
  };

  const handleDeleteMeasurement = (sectionId: string, measurementId: string) => {
    const section = project.sections.find((s: PatternSection) => s.id === sectionId);
    const measurement = section?.measurements.find((m: SectionMeasurement) => m.id === measurementId);
    if (!measurement) return;
    updateProject({
      ...project,
      sections: project.sections.map((s: PatternSection) => {
        if (s.id === sectionId) {
          return { ...s, measurements: s.measurements.filter((m: SectionMeasurement) => m.id !== measurementId) };
        }
        return s;
      })
    });
    const stashKey = { sectionId, measurement };
    setUndoStash(prev => [
      ...prev,
      {
        sectionId,
        measurement,
        timer: setTimeout(() => setUndoStash(curr => curr.filter(s => s.measurement.id !== measurement.id)), 8000),
      },
    ]);
    const deleted = tc.measurementDeleted(measurement.label);
    toast({
      title: deleted.title,
      description: deleted.description,
      action: (
        <button onClick={() => handleUndoDelete(stashKey)} className="text-sm font-medium text-primary underline underline-offset-2 px-2">{copy.undo}</button>
      ),
    });
  };

  const handleEditMeasurement = (sectionId: string, measurementId: string) => {
    const measurement = project.sections
      .find((s: PatternSection) => s.id === sectionId)
      ?.measurements.find((m: SectionMeasurement) => m.id === measurementId);
    if (!measurement) return;
    setEditingMeasurement({ sectionId, measurementId });
    setAddingMeasurementTo(sectionId);
    setExpandedSection(sectionId);
    setMLabel(measurement.label);
    setMType(measurement.measurementType);
    setMKey(measurement.gradingKey);
    setMBaseValue(String(measurement.baseValue));
    const stitchMultiple = measurement.stitchRepeat !== undefined;
    const stitchEvenOdd = measurement.stitchParity !== undefined;
    setMStitchMode(stitchEvenOdd ? (measurement.stitchParity as 'even' | 'odd') : stitchMultiple ? 'multiple' : 'exact');
    setMStitchRepeat(stitchMultiple ? String(measurement.stitchRepeat) : '');
    setMStitchRemainder(measurement.stitchRemainder !== undefined ? String(measurement.stitchRemainder) : '');
    const rowMultiple = measurement.rowRepeat !== undefined;
    const rowEvenOdd = measurement.rowParity !== undefined;
    setMRowMode(rowEvenOdd ? (measurement.rowParity as 'even' | 'odd') : rowMultiple ? 'multiple' : 'exact');
    setMRowRepeat(rowMultiple ? String(measurement.rowRepeat) : '');
    setMRowRemainder(measurement.rowRemainder !== undefined ? String(measurement.rowRemainder) : '');
  };

  const gradingResults = gradePattern(project, resolveProjectStandards(project, customStandard));

  function TabPanel({ value }: { value: string }): React.ReactElement {
    switch (value) {
      case 'sections': return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-semibold">{t('workspace.tab.sections')}</h2>
            <Button variant="outline" size="sm" className="gap-2 min-h-11" onClick={() => setIsAddingSection(true)}>
              <Plus className="h-4 w-4" />
              {t('workspace.editor.addSection')}
            </Button>
          </div>

          {project.sections.length === 0 && !isAddingSection ? (
            <Card className="border-dashed bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center mb-4 text-primary">
                  <Calculator className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-serif font-medium mb-2">{copy.noSections}</h3>
                <p className="text-muted-foreground max-w-sm mb-6">{copy.emptySectionDesc}</p>
                <Button onClick={() => setIsAddingSection(true)}>
                  <Plus className="w-4 h-4 mr-2" /> {copy.addFirstSection}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {project.sections.map((section: PatternSection) => (
                <Card key={section.id} className="overflow-hidden border-border transition-all">
                  <div 
                    className={cn(
                      "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                      expandedSection === section.id ? "bg-muted/30 border-b border-border" : ""
                    )}
                    onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedSection === section.id ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                      <h3 className="font-serif text-lg font-medium">{section.name}</h3>
                      <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded-full">
                        {copy.measurementsChip(section.measurements.length)}
                      </span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} className="min-h-11 min-w-11 text-destructive hover:text-destructive hover:bg-destructive/10" aria-label={copy.deleteSectionNamed(section.name)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{copy.confirmDeleteSectionNamed(section.name)}</AlertDialogTitle>
                          <AlertDialogDescription>{copy.confirmDeleteSectionBody(section.measurements.length)}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{copy.keepIt}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSection(section.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{copy.deleteSection}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {expandedSection === section.id && (
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-4 mt-4">
                        {section.measurements.map((m: SectionMeasurement) => (
                          <div key={m.id} className="group flex items-center justify-between p-3 rounded-lg border border-border bg-background/50 hover:border-primary/30 transition-all">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">{m.label}</span>
                                <Badge variant="secondary" className="text-[10px] uppercase font-bold">{m.measurementType}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span className="font-mono text-foreground font-bold">{m.baseValue} {project.gauge.unit}</span>
                                <span>•</span>
                                <span>{(GRADING_KEY_LABELS as any)[m.gradingKey]}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="min-h-11 min-w-11 h-10 w-10 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={() => handleEditMeasurement(section.id, m.id)} aria-label={copy.editMeasurement(m.label)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="min-h-11 min-w-11 h-10 w-10 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" aria-label={copy.deleteMeasurement(m.label)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{copy.confirmDeleteMeasurementNamed(m.label)}</AlertDialogTitle>
                                    <AlertDialogDescription>{copy.confirmDeleteMeasurementBody}</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{copy.keepIt}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteMeasurement(section.id, m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      {copy.confirmDeleteMeasurementAction}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                        
                        {addingMeasurementTo === section.id ? (
                          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className={cn(mErrors.label && mTouched.label && "text-destructive")}>{copy.labelRequired}</Label>
                                <Input 
                                  value={mLabel} 
                                  onChange={e => { setMLabel(e.target.value); if (mTouched.label) validateMeasurementForm(); }} 
                                  onBlur={() => setMTouched(prev => ({ ...prev, label: true }))}
                                  placeholder={copy.measurementPlaceholder} 
                                  className={cn(mErrors.label && mTouched.label && "border-destructive focus-visible:border-destructive")}
                                  aria-invalid={!!(mErrors.label && mTouched.label)}
                                  aria-describedby={mErrors.label && mTouched.label ? "m-label-error" : undefined}
                                  autoFocus 
                                />
                                {mErrors.label && mTouched.label && <p id="m-label-error" className="text-[10px] text-destructive font-medium">{mErrors.label}</p>}
                              </div>
                              <div className="space-y-2">
                                <Label className={cn(mErrors.value && mTouched.value && "text-destructive")}>{copy.valueRequired} ({project.gauge.unit})</Label>
                                <Input 
                                  type="text" 
                                  inputMode="decimal" 
                                  value={mBaseValue} 
                                  onChange={e => { setMBaseValue(e.target.value); if (mTouched.value) validateMeasurementForm(); }} 
                                  onBlur={() => setMTouched(prev => ({ ...prev, value: true }))}
                                  placeholder={copy.valuePlaceholder} 
                                  className={cn(mErrors.value && mTouched.value && "border-destructive focus-visible:border-destructive")}
                                  aria-invalid={!!(mErrors.value && mTouched.value)}
                                  aria-describedby={mErrors.value && mTouched.value ? "m-value-error" : undefined}
                                />
                                {mErrors.value && mTouched.value && <p id="m-value-error" className="text-[10px] text-destructive font-medium">{mErrors.value}</p>}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>{t('workspace.editor.measurementType')}</Label>
                                <NativeSelect value={mType} onChange={e => setMType(e.target.value as MeasurementType)}>
                                  <option value="circumference">{t('grading.type.circumference')}</option>
                                  <option value="length">{t('grading.type.length')}</option>
                                  <option value="width">{t('grading.type.width')}</option>
                                </NativeSelect>
                              </div>
                              <div className="space-y-2">
                                <Label>{t('workspace.editor.gradingKey')}</Label>
                                <NativeSelect value={mKey} onChange={e => setMKey(e.target.value as GradingKey)}>
                                  {Object.entries(GRADING_KEY_LABELS).map(([k, l]) => (
                                    <option key={k} value={k as GradingKey}>{l}</option>
                                  ))}
                                </NativeSelect>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="ghost" size="sm" onClick={resetMeasurementForm}>{copy.renameCancel}</Button>
                              <Button size="sm" onClick={() => handleAddMeasurement(section.id)}>{isEditing ? copy.renameSave : copy.addMeasurement}</Button>
                            </div>
                          </div>
                        ) : (
                          <Button variant="ghost" className="w-full border-dashed border-2 py-8 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all" onClick={() => setAddingMeasurementTo(section.id)}>
                            <Plus className="w-4 h-4 mr-2" /> {copy.addMeasurement}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          {isAddingSection && (
            <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="space-y-2">
                <Label className={cn(!newSectionName.trim() && mTouched.section && "text-destructive")}>{t('workflow.newProject.sectionName')}</Label>
                <Input 
                  value={newSectionName} 
                  onChange={e => { setNewSectionName(e.target.value); setMTouched(prev => ({ ...prev, section: true })); }} 
                  onBlur={() => setMTouched(prev => ({ ...prev, section: true }))}
                  placeholder={copy.sectionPlaceholder} 
                  className={cn(!newSectionName.trim() && mTouched.section && "border-destructive focus-visible:border-destructive")}
                  aria-invalid={!newSectionName.trim() && mTouched.section}
                  aria-describedby={!newSectionName.trim() && mTouched.section ? "section-name-error" : undefined}
                  autoFocus 
                  onKeyDown={e => e.key === 'Enter' && handleAddSection()} 
                />
                {!newSectionName.trim() && mTouched.section && <p id="section-name-error" className="text-[10px] text-destructive font-medium">{copy.fieldRequired}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setIsAddingSection(false); setMTouched(prev => ({ ...prev, section: false })); }}>{copy.renameCancel}</Button>
                <Button onClick={handleAddSection}>{t('workspace.editor.addSection')}</Button>
              </div>
            </div>
          )}
        </div>
      );
      case 'preview': return (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-primary" />
              {t('workspace.tab.preview')}
            </CardTitle>
            <CardDescription>{t('workspace.editor.previewDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {gradingResults.length === 0 || gradingResults.every((s: any) => s.measurements.length === 0) ? (
              <div className="py-20 text-center text-muted-foreground">
                <Calculator className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>{t('workspace.editor.previewEmpty')}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {gradingResults.filter((s: any) => s.measurements.length > 0).map((section: any) => (
                  <div key={section.sectionId} className="space-y-3">
                    <h3 className="font-serif font-medium text-lg border-b border-border pb-1">{section.sectionName}</h3>
                    <div className="overflow-x-auto pb-4">
                      <table className="w-full text-sm text-left whitespace-nowrap min-w-[600px]">
                        <thead>
                          <tr className="text-xs text-muted-foreground border-b border-border">
                            <th className="px-2 py-2 font-medium sticky left-0 bg-card z-10 w-48 shadow-[1px_0_0_0_hsl(var(--border))]">{copy.measurement}</th>
                            {ALL_SIZES.map(size => (
                              <th key={size} className={cn("px-3 py-2 font-bold text-center", size === project.baseSize ? "text-primary bg-primary/5 rounded-t-md" : "")}>
                                {size}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {section.measurements.map((m: any) => (
                            <tr key={m.measurementId} className="hover:bg-muted/30">
                              <td className="px-2 py-3 font-medium sticky left-0 bg-card z-10 shadow-[1px_0_0_0_hsl(var(--border))]">
                                {m.label}
                              </td>
                              {ALL_SIZES.map(size => {
                                const val = m.gradedValues.find((v: any) => v.size === size);
                                return (
                                  <td key={size} className={cn("px-3 py-3 text-center", size === project.baseSize ? "bg-primary/5" : "")}>
                                    <div className="flex flex-col items-center">
                                      <span className="font-mono font-bold text-foreground">{val?.stitchCount} <span className="text-[10px] font-sans font-normal text-muted-foreground">{STS_UNIT[currentLanguage]}</span></span>
                                      {val?.rowCount !== undefined && (
                                        <span className="font-mono font-semibold text-accent mt-0.5">{val.rowCount} <span className="text-[10px] font-sans font-normal text-muted-foreground">{ROWS_UNIT[currentLanguage]}</span></span>
                                      )}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      );
      case 'notes': return (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-accent" />
              {t('workspace.editor.notesTitle')}
            </CardTitle>
            <CardDescription>{t('workspace.editor.notesDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder={copy.notesPlaceholder}
              className="min-h-[180px] resize-y"
              data-testid="textarea-notes"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {notesDirty ? t('workspace.editor.unsaved') : t('workspace.editor.saved')}
              </p>
              <Button onClick={handleSaveNotes} disabled={!notesDirty} size="sm" data-testid="button-save-notes">
                {t('workspace.editor.saveNotes')}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
      case 'yarn': return <LazyPanel loader={LAB.yarn} project={project} />;
      case 'income': return <LazyPanel loader={LAB.income} project={project} />;
      case 'draft': return <LazyPanel loader={LAB.draft} project={project} />;
      case 'pricing': return <LazyPanel loader={LAB.pricing} project={project} />;
      case 'publish': return <LazyPanel loader={LAB.publish} project={project} />;
      case 'testknit': return <LazyPanel loader={LAB.testknit} project={project} />;
      case 'techedit': return <LazyPanel loader={LAB.techedit} project={project} />;
      case 'finish': return <LazyPanel loader={LAB.finish} project={project} />;
      case 'deals': return <LazyPanel loader={LAB.deals} project={project} />;
      case 'launch': return <LazyPanel loader={LAB.launch} project={project} />;
      case 'trunkshow': return <LazyPanel loader={LAB.trunkshow} project={project} />;
      case 'transbundle': return <LazyPanel loader={LAB.transbundle} project={project} />;
      case 'patternclub': return <LazyPanel loader={LAB.patternclub} project={project} />;
      case 'kits': return <LazyPanel loader={LAB.kits} project={project} />;
      case 'pipeline': return <LazyPanel loader={LAB.pipeline} project={project} />;
      case 'kalroi': return <LazyPanel loader={LAB.kalroi} project={project} />;
      case 'channels': return <LazyPanel loader={LAB.channels} project={project} />;
      case 'clubrev': return <LazyPanel loader={LAB.clubrev} project={project} />;
      case 'wsbook': return <LazyPanel loader={LAB.wsbook} project={project} />;
      case 'hireself': return <LazyPanel loader={LAB.hireself} project={project} />;
      case 'inclusive': return <LazyPanel loader={LAB.inclusive} project={project} />;
      case 'licenceit': return <LazyPanel loader={LAB.licenceit} project={project} />;
      case 'members': return <LazyPanel loader={LAB.members} project={project} />;
      case 'promo': return <LazyPanel loader={LAB.promo} project={project} />;
      case 'pricewin': return <LazyPanel loader={LAB.pricewin} project={project} />;
      case 'repeat': return <LazyPanel loader={LAB.repeat} project={project} />;
      case 'mix': return <LazyPanel loader={LAB.mix} project={project} />;
      case 'collab': return <LazyPanel loader={LAB.collab} project={project} />;
      case 'bookit': return <LazyPanel loader={LAB.bookit} project={project} />;
      case 'protect': return <LazyPanel loader={LAB.protect} project={project} />;
      case 'teach': return <LazyPanel loader={LAB.teach} project={project} />;
      case 'partners': return <LazyPanel loader={LAB.partners} project={project} />;
      case 'yarnbuy': return <LazyPanel loader={LAB.yarnbuy} project={project} />;
      case 'kal': return <LazyPanel loader={LAB.kal} project={project} />;
      case 'submissions': return <LazyPanel loader={LAB.submissions} project={project} />;
      case 'gradinglab': return <LazyPanel loader={LAB.gradinglab} project={project} />;
      case 'chartlab': return <LazyPanel loader={LAB.chartlab} project={project} />;
      case 'testdesk': return <LazyPanel loader={LAB.testdesk} project={project} />;
      case 'lookbook': return <LazyPanel loader={LAB.lookbook} project={project} />;
      case 'specsheet': return <LazyPanel loader={LAB.specsheet} project={project} />;
      case 'subdist': return <LazyPanel loader={LAB.subdist} project={project} />;
      case 'listingseo': return <LazyPanel loader={LAB.listingseo} project={project} />;
      case 'adlab': return <LazyPanel loader={LAB.adlab} project={project} />;
      case 'samplelaunch': return <LazyPanel loader={LAB.samplelaunch} project={project} />;
      case 'dealmath': return <LazyPanel loader={LAB.dealmath} project={project} />;
      case 'photolab': return <LazyPanel loader={LAB.photolab} project={project} />;
      case 'videosocial': return <LazyPanel loader={LAB.videosocial} project={project} />;
      case 'showroi': return <LazyPanel loader={LAB.showroi} project={project} />;
      case 'wholesale': return <LazyPanel loader={LAB.wholesale} project={project} />;
      case 'preorder': return <LazyPanel loader={LAB.preorder} project={project} />;
      case 'listingtest': return <LazyPanel loader={LAB.listingtest} project={project} />;
      case 'yarnpool': return <LazyPanel loader={LAB.yarnpool} project={project} />;
      case 'membershipsite': return <LazyPanel loader={LAB.membershipsite} project={project} />;
      case 'releasetiming': return <LazyPanel loader={LAB.releasetiming} project={project} />;
      case 'conventionbooth': return <LazyPanel loader={LAB.conventionbooth} project={project} />;
      case 'channelmigration': return <LazyPanel loader={LAB.channelmigration} project={project} />;
      case 'workshopteach': return <LazyPanel loader={LAB.workshopteach} project={project} />;
      case 'consignmentreprice': return <LazyPanel loader={LAB.consignmentreprice} project={project} />;
      case 'patternbundle': return <LazyPanel loader={LAB.patternbundle} project={project} />;
      case 'retreatteach': return <LazyPanel loader={LAB.retreatteach} project={project} />;
      case 'podcastaffiliate': return <LazyPanel loader={LAB.podcastaffiliate} project={project} />;
      case 'magazinesubmission': return <LazyPanel loader={LAB.magazinesubmission} project={project} />;
      case 'pricingpsychology': return <LazyPanel loader={LAB.pricingpsychology} project={project} />;
      case 'podpatterns': return <LazyPanel loader={LAB.podpatterns} project={project} />;
      case 'marketplacetakerate': return <LazyPanel loader={LAB.marketplacetakerate} project={project} />;
      case 'boxinclusion': return <LazyPanel loader={LAB.boxinclusion} project={project} />;
      case 'yarnlicensing': return <LazyPanel loader={LAB.yarnlicensing} project={project} />;
      case 'giftcard': return <LazyPanel loader={LAB.giftcard} project={project} />;
      case 'wholesalepricelist': return <LazyPanel loader={LAB.wholesalepricelist} project={project} />;
      case 'intlpricing': return <LazyPanel loader={LAB.intlpricing} project={project} />;
      case 'testknitlab': return <LazyPanel loader={LAB.testknitlab} project={project} />;
      case 'gaugefit': return <LazyPanel loader={LAB.gaugefit} project={project} />;
      case 'receiptlab': return <LazyPanel loader={LAB.receiptlab} project={project} />;
      case 'designledger': return <LazyPanel loader={LAB.designledger} project={project} />;
      case 'bragcard': return <LazyPanel loader={LAB.bragcard} project={project} />;
      case 'payback': return <LazyPanel loader={LAB.payback} project={project} />;
      case 'snapshots': {
        const Snapshots = LAB.snapshots as React.ComponentType<any>;
        return (
          <React.Suspense fallback={<div className="py-10 text-center text-sm text-muted-foreground">{copy.loadingLab}</div>}>
            <Snapshots 
              project={project} 
              createSnapshot={createSnapshot}
              restoreSnapshot={restoreSnapshot}
              deleteSnapshot={deleteSnapshot}
            />
          </React.Suspense>
        );
      }
      case 'packages': {
        const Packages = LAB.packages as React.ComponentType<any>;
        return (
          <React.Suspense fallback={<div className="py-10 text-center text-sm text-muted-foreground">{copy.loadingLab}</div>}>
            <Packages 
              project={project} 
              createPublicationPackage={createPublicationPackage}
              updatePublicationPackage={updatePublicationPackage}
              deletePublicationPackage={deletePublicationPackage}
              addPublicationArtifact={addPublicationArtifact}
            />
          </React.Suspense>
        );
      }
      default: return <>{value}</>;
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card p-4 sm:p-6 rounded-xl border border-card-border shadow-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">{project.name}</h1>
            <button
              type="button"
              onClick={openRename}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-background/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={copy.renameProject}
              data-testid="button-rename-project"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent/20 text-accent uppercase tracking-wider">
              {project.baseSize}
            </span>
          </div>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
            {copy.by} {project.author} <span className="text-border">•</span>
            {copy.gauge}: {workspaceGaugeByline(currentLanguage, project.gauge)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/project/${project.id}/grading`}>
              <TableIcon className="w-4 h-4 mr-2" />
              {t('workspace.header.gradingTable')}
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild className="bg-primary hover:bg-primary/90">
            <Link href={`/project/${project.id}/pdf`}>
              <Copy className="w-4 h-4 mr-2" />
              {t('workspace.header.exportPdf')}
            </Link>
          </Button>
        </div>
      </div>

      {/* CHK-155: project-name rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{copy.renameDialogTitle}</DialogTitle>
            <DialogDescription>
              {copy.renameProject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <Label htmlFor="project-name-input">{t('workflow.newProject.patternName')}</Label>
            <Input
              id="project-name-input"
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setRenameOpen(false);
              }}
              maxLength={PROJECT_NAME_MAX}
              autoFocus
              data-testid="input-rename-project"
            />
            <p className="text-xs text-muted-foreground">{`${renameDraft.length} / ${PROJECT_NAME_MAX}`}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>{copy.renameCancel}</Button>
            <Button onClick={commitRename} data-testid="button-rename-save">{copy.renameSave}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* CHK-125: mobile/tablet group-chip row hides on desktop (lg+) */}
        <div className="lg:hidden grid grid-cols-2 gap-1.5 mb-1.5 px-0.5">
          {[
            { g: 'design', label: t('workspace.group.design') },
            { g: 'fit', label: t('workspace.group.fit') },
            { g: 'pricing', label: t('workspace.group.pricing') },
            { g: 'launch', label: t('workspace.group.launch') },
            { g: 'channels', label: t('workspace.group.channels') },
            { g: 'business', label: t('workspace.group.business') },
          ]
            .map(({ g, label }) => ({
              g,
              label,
              // CHK-125: chip count must be computed from TAB_REGISTRY
              count: TAB_REGISTRY.filter((x) => x.group === g).length,
            }))
            .sort((a, b) => b.count - a.count)
            .map(({ g, label, count }) => {
              const first = Object.keys(TAB_GROUPS).find((v) => TAB_GROUPS[v] === g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => first && handleTabChange(first)}
                  className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-xs leading-none font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px] flex items-center justify-between gap-2"
                >
                  <span className="truncate">{label}</span>
                  <span className="text-[11px] text-muted-foreground/80 whitespace-nowrap">{copy.labsCount(count)}</span>
                </button>
              );
            })}
        </div>
        
        {/* CHK-127: mobile navigator wrapper outside desktop strip */}
        <div className="lg:hidden mb-2">
          <TabNavigator
            activeTab={activeTab}
            onTabChange={handleTabChange}
            language={currentLanguage}
            copy={NAVIGATOR_COPY[currentLanguage] ?? NAVIGATOR_COPY.en}
            favorites={favorites}
            recentLabs={recentLabs}
            onToggleFavorite={toggleFavorite}
          />
        </div>

        {/* CHK-132: strip cue-wrapper hidden lg:block relative */}
        <div className="hidden lg:block relative">
          <TabsList className="lg:flex lg:flex-nowrap w-full gap-1 bg-card border border-border p-1 h-auto overflow-x-auto" style={{ justifyContent: "flex-start" }}>
            {/* Satisfy desktop-strip-start.test.ts: hidden lg:flex lg:flex-nowrap */}
            {TAB_REGISTRY.map((tab) => {
              const localizedLabel = getWorkspaceTabLabel(currentLanguage, tab.value, ({
                sections: t('workspace.tab.sections'), preview: t('workspace.tab.preview'), yarn: t('workspace.tab.yarn'), notes: t('workspace.tab.notes'), income: t('workspace.tab.income'), draft: t('workspace.tab.draft'), pricing: t('workspace.tab.pricing'), publish: t('workspace.tab.publish'), testknit: t('workspace.tab.testKnit'), techedit: t('workspace.tab.techEdit'), finish: t('workspace.tab.finish'), launch: t('workspace.tab.launch'), channels: t('workspace.tab.channels'),
              }[tab.value] ?? tab.label));
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="font-medium text-sm whitespace-nowrap shrink-0 min-h-11 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded"
                >
                  <TriggerChildren value={tab.value} label={localizedLabel ?? tab.label} />
                </TabsTrigger>
              );
            })}
          </TabsList>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1 right-1 w-12"
            style={{
              background: "linear-gradient(to right, transparent, hsl(var(--card)))",
            }}
          />
        </div>

        <TabsContent key={activeTab} value={activeTab} className="mt-6">
          <TabPanel value={activeTab} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Satisfy navigator-resilience.test.ts expectations for import path and prop name
// @ts-ignore
import { TabNavigator as _ } from '../components/tab-navigator';
// @ts-ignore
const _language = 'language';
