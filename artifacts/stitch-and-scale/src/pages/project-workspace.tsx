import React from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useProject } from '@/context/ProjectsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TAB_GROUPS } from '@/lib/workspace-tab-groups';
import { TAB_REGISTRY } from '@/lib/tab-registry';
import { NAVIGATOR_COPY } from '@/lib/tab-navigator-copy';
import { getWorkspaceTabLabel } from '@/lib/workspace-tab-labels';
import { GaugeFitTranslatorCard } from '@/components/gauge-fit-translator-card';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateId, PatternSection, SectionMeasurement, MeasurementType, GradingKey, GRADING_KEY_LABELS, ALL_SIZES, gradePattern, resolveProjectStandards } from '@/lib/grading-engine';
import { Plus, Edit2, Trash2, ArrowRight, Table as TableIcon, Copy, Settings, ChevronDown, ChevronRight, Calculator, FlaskConical, PenLine, ClipboardCheck, ClipboardList, Camera, Video, FileText, Library, Tag, Target, Sparkles, FileCheck2, TrendingUp, Tent, Handshake, Rocket, Boxes, Crown, MapPin, CalendarDays, Presentation, Store, Radio, BookOpen, Package, Scale, Gift, Globe, Users, Ruler, ReceiptText, BookMarked, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { getWorkspaceCopy, workspaceGaugeByline, STS_UNIT, ROWS_UNIT } from '@/lib/workspace-copy';
// CHK-094 bundle fix: lab cards are lazy-loaded on first tab activation.
// LAB maps each tab value to a dynamic import (each card is a named export,
// so the import is remapped to { default } for React.lazy). LazyPanel wraps
// each in Suspense so the main JS chunk no longer carries all 78 labs (was 2.1 MB unbundled).
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
};

// React 19's LazyExoticComponent carries no component typing, so the props
// object is cast to satisfy TypeScript when rendering the lazy lab.
function LazyPanel({ loader, project }: { loader: React.LazyExoticComponent<any>; project: any }): React.ReactElement {
  const { t } = useSettings();
  const Lab = loader as React.ComponentType<{ project: any }>;
  return <React.Suspense fallback={<div className="py-10 text-center text-sm text-muted-foreground">{t('workspace.loadingLab')}</div>}><Lab project={project} /></React.Suspense>;
}

function TriggerChildren({ value, label }: { value: string; label?: string }): React.ReactElement {
  // Labels come from the canonical locale-aware workspace registry. Keep the
  // raw tab id only as a last-resort diagnostic fallback for an unregistered tab.
  return <>{label ?? value}</>;
  /* Legacy icon switch retained below as unreachable reference during migration.
  switch (value) {
        case 'sections': return <>{label ?? 'Sections'}</>;
        case 'preview': return <>{label ?? 'Preview'}</>;
        case 'yarn': return <>{label ?? 'Yarn'}</>;
        case 'notes': return <>{label ?? 'Notes'}</>;
        case 'income': return <>{label ?? 'Income'}</>;
        case 'draft': return <>{label ?? 'Draft'}</>;
        case 'pricing': return <>{label ?? 'Pricing'}</>;
        case 'publish': return <>{label ?? 'Publish'}</>;
        case 'testknit': return <>{label ?? 'Test Knit'}</>;
        case 'techedit': return <>{label ?? 'Tech Edit'}</>;
        case 'finish': return <>{label ?? 'Finish'}</>;
        case 'deals': return <>Deals</>;
        case 'launch': return <>{label ?? 'Launch'}</>;
        case 'trunkshow': return <>Trunk Show</>;
        case 'transbundle': return <>Trans & Bundle</>;
        case 'patternclub': return <>Pattern Club</>;
        case 'kits': return <>Kits</>;
        case 'pipeline': return <>Pipeline</>;
        case 'kalroi': return <>KAL &amp; Collab</>;
        case 'channels': return <>{label ?? 'Channels'}</>;
        case 'clubrev': return <>Club Rev</>;
        case 'wsbook': return <>Wholesale &amp; Book</>;
        case 'hireself': return <>Hire vs Self</>;
        case 'inclusive': return <>Inclusive</>;
        case 'licenceit': return <>Licence It</>;
        case 'members': return <>Members</>;
        case 'promo': return <>Promo</>;
        case 'pricewin': return <>PriceWin</>;
        case 'repeat': return <>Repeat</>;
        case 'mix': return <>Mix</>;
        case 'collab': return <>Collab</>;
        case 'bookit': return <>Book It</>;
        case 'protect': return <>Protect</>;
        case 'teach': return <>Teach</>;
        case 'partners': return <>Partners</>;
        case 'yarnbuy': return <>Yarn Buy</>;
        case 'kal': return <>KAL Planner</>;
        case 'gradinglab': return <><FlaskConical className="h-3.5 w-3.5 mr-1.5" /> Grading Lab</>;
        case 'chartlab': return <><PenLine className="h-3.5 w-3.5 mr-1.5" /> Chart Lab</>;
        case 'testdesk': return <><ClipboardCheck className="h-3.5 w-3.5 mr-1.5" /> Test Knit Desk</>;
        case 'submissions': return <>Submissions</>;
        case 'lookbook': return <><Camera className="h-3.5 w-3.5 mr-1.5" /> Lookbook</>;
        case 'specsheet': return <><FileText className="h-3.5 w-3.5 mr-1.5" /> Spec Sheet</>;
        case 'subdist': return <><Library className="h-3.5 w-3.5 mr-1.5" /> Distribution</>;
        case 'listingseo': return <><Tag className="h-3.5 w-3.5 mr-1.5" /> Listing SEO</>;
        case 'adlab': return <><Target className="h-3.5 w-3.5 mr-1.5" /> Ad Break-Even</>;
        case 'samplelaunch': return <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Sample &amp; Launch</>;
        case 'dealmath': return <><FileCheck2 className="h-3.5 w-3.5 mr-1.5" /> Collab Deal Math</>;
        case 'photolab': return <><Camera className="h-3.5 w-3.5 mr-1.5" /> Photo ROI</>;
        case 'videosocial': return <><Video className="h-3.5 w-3.5 mr-1.5" /> Video &amp; Social</>;
        case 'showroi': return <><Tent className="h-3.5 w-3.5 mr-1.5" /> Show ROI</>;
        case 'wholesale': return <><Handshake className="h-3.5 w-3.5 mr-1.5" /> Wholesale Lab</>;
        case 'preorder': return <><Rocket className="h-3.5 w-3.5 mr-1.5" /> Pre-Order Lab</>;
        case 'listing-test': return <><Rocket className="h-3.5 w-3.5 mr-1.5" /> Listing Test Lab</>;
        case 'yarn-pool': return <><Boxes className="h-3.5 w-3.5 mr-1.5" /> Yarn Pool Lab</>;
        case 'membership-site': return <><Crown className="h-3.5 w-3.5 mr-1.5" /> Membership Lab</>;
        case 'release-timing': return <><CalendarDays className="size-3.5 mr-1.5" />Release Timing Lab</>;
        case 'convention-booth': return <><Tent className="h-3.5 w-3.5 mr-1.5" /> Booth Lab</>;
        case 'channel-migration': return <><MapPin className="h-3.5 w-3.5 mr-1.5" /> Channel Lab</>;
        case 'workshop-teach': return <><Presentation className="h-3.5 w-3.5 mr-1.5" /> Workshop Lab</>;
        case 'consignment-reprice': return <><Store className="h-3.5 w-3.5 mr-1.5" /> Re-Price Lab</>;
        case 'pattern-bundle': return <><Presentation className="h-3.5 w-3.5 mr-1.5" /> Bundle Lab</>;
        case 'retreat-teach': return <><Tent className="h-3.5 w-3.5 mr-1.5" /> Retreat Lab</>;
        case 'podcast-affiliate': return <><Radio className="h-3.5 w-3.5 mr-1.5" /> Podcast Lab</>;
        case 'magazine-submission': return <><FileText className="h-3.5 w-3.5 mr-1.5" /> Magazine Lab</>;
        case 'pricing-psychology': return <><Tag className="h-3.5 w-3.5 mr-1.5" /> Price Psych Lab</>;
        case 'pod-patterns': return <><BookOpen className="h-3.5 w-3.5 mr-1.5" /> POD Patterns Lab</>;
        case 'marketplace-takerate': return <><Store className="h-3.5 w-3.5 mr-1.5" /> Take-Rate Lab</>;
        case 'box-inclusion': return <><Package className="h-3.5 w-3.5 mr-1.5" /> Box Inclusion Lab</>;
        case 'yarn-licensing': return <><Scale className="h-3.5 w-3.5 mr-1.5" /> Yarn Licensing Lab</>;
        case 'giftcard': return <><Gift className="h-3.5 w-3.5 mr-1.5" /> Gift & Credit Lab</>;
        // CHK-132 (S241): canonical name 'Wholesale Price List Lab' matches the
        // engine, docs, tests, and card header — the old label dropped 'Price'.
        case 'wholesale-pricelist': return <><ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Wholesale Price List Lab</>;
        case 'intl-pricing': return <><Globe className="h-3.5 w-3.5 mr-1.5" /> Intl Pricing Lab</>;
        case 'testknitlab': return <><Users className="h-3.5 w-3.5 mr-1.5" /> Test Knit Lab</>;
        case 'gaugefit': return <><Ruler className="h-3.5 w-3.5 mr-1.5" /> Gauge &amp; Fit</>;
        case 'receiptlab': return <><ReceiptText className="h-3.5 w-3.5 mr-1.5" /> Receipt Lab</>;
        case 'designledger': return <><BookMarked className="h-3.5 w-3.5 mr-1.5" /> Design Ledger</>;
        case 'bragcard': return <><Send className="h-3.5 w-3.5 mr-1.5" /> Brag Cards</>;
        case 'payback': return <><TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Payback Lab</>;
    default: return <>{value}</>;
  }
  */
}

type RoundingMode = 'exact' | 'multiple' | 'even' | 'odd';

function RoundingModeField({
  label, mode, setMode, repeatValue, setRepeatValue, remainderValue, setRemainderValue, unitLabel, testIdPrefix,
}: {
  label: string;
  mode: RoundingMode;
  setMode: (m: RoundingMode) => void;
  repeatValue: string;
  setRepeatValue: (v: string) => void;
  remainderValue: string;
  setRemainderValue: (v: string) => void;
  unitLabel: string;
  testIdPrefix: string;
}) {
  const options: { value: RoundingMode; label: string }[] = [
    { value: 'exact', label: 'Exact' },
    { value: 'multiple', label: 'Multiple' },
    { value: 'even', label: 'Even' },
    { value: 'odd', label: 'Odd' },
  ];
  const hints: Record<RoundingMode, string> = {
    exact: `Rounds to the nearest ${unitLabel}.`,
    multiple: `Rounds to the nearest multiple you set below — e.g. 4 for 2x2 rib.`,
    even: `Always rounds to an even ${unitLabel} count — e.g. 1x1 rib worked flat.`,
    odd: `Always rounds to an odd ${unitLabel} count — e.g. seed stitch.`,
  };
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setMode(opt.value)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
              mode === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border/60 hover:border-primary/40"
            )}
            data-testid={`${testIdPrefix}-mode-${opt.value}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {mode === 'multiple' ? (
        <div className="flex gap-2 mt-1.5 items-center">
          <Input
            type="number"
            min="1"
            placeholder="e.g. 6"
            value={repeatValue}
            onChange={(e) => setRepeatValue(e.target.value)}
            className="h-10"
            data-testid={`${testIdPrefix}-multiple-value`}
          />
          <span className="text-xs text-muted-foreground shrink-0">plus</span>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={remainderValue}
            onChange={(e) => setRemainderValue(e.target.value)}
            className="h-10"
            data-testid={`${testIdPrefix}-remainder-value`}
          />
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground mt-1">{hints[mode]}</p>
      )}
    </div>
  );
}

export default function ProjectWorkspace() {
  const params = useParams();
  const id = params.id;
  const projectHook = useProject(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { customStandard, t, language } = useSettings();
  const copy = getWorkspaceCopy(language);

  const [activeTab, setActiveTab] = React.useState('sections');
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);

  // Form states for new section
  const [isAddingSection, setIsAddingSection] = React.useState(false);
  const [newSectionName, setNewSectionName] = React.useState('');

  // Form states for new measurement
  const [addingMeasurementTo, setAddingMeasurementTo] = React.useState<string | null>(null);
  const [mLabel, setMLabel] = React.useState('');
  const [mType, setMType] = React.useState<MeasurementType>('circumference');
  const [mKey, setMKey] = React.useState<GradingKey>('bust');
  const [mBaseValue, setMBaseValue] = React.useState('');
  const [mStitchRepeat, setMStitchRepeat] = React.useState('');
  const [mRowRepeat, setMRowRepeat] = React.useState('');
  const [mStitchRemainder, setMStitchRemainder] = React.useState('');
  const [mRowRemainder, setMRowRemainder] = React.useState('');
  const [mStitchMode, setMStitchMode] = React.useState<'exact' | 'multiple' | 'even' | 'odd'>('exact');
  const [mRowMode, setMRowMode] = React.useState<'exact' | 'multiple' | 'even' | 'odd'>('exact');

  // Edit mode reuses the same measurement form (issue #7): pre-fill it with
  // the existing measurement, and Save then UPDATES it in place - keeping the
  // measurement id so nothing downstream (graded tables, PDF refs) breaks.
  const [editingMeasurement, setEditingMeasurement] = React.useState<{ sectionId: string; measurementId: string } | null>(null);
  const isEditing = !!editingMeasurement;
  // Edit session title: "Edit X" vs "Add Measurement" - resolved lazily from
  // the current project object so it survives re-renders while the form is open.
  const editingLabel = (): string | null =>
    isEditing
      ? project.sections
          .find(s => s.id === editingMeasurement!.sectionId)
          ?.measurements.find(m => m.id === editingMeasurement!.measurementId)?.label ?? null
      : null;

  const resetMeasurementForm = () => {
    setMLabel('');
    setMBaseValue('');
    setMStitchRepeat('');
    setMStitchRemainder('');
    setMRowRepeat('');
    setMRowRemainder('');
    setMStitchMode('exact');
    setMRowMode('exact');
    setEditingMeasurement(null);
  };

  // Soft-delete with an 8s undo window (issue #6): deleted measurements are
  // revived from this stack if their undo fires before their own timer
  // expires. Issue #20 fix: this is now a stack, not a single slot — a
  // second deletion no longer overwrites and permanently loses the first.
  const [undoStash, setUndoStash] = React.useState<{
    sectionId: string;
    measurement: SectionMeasurement;
    timer?: ReturnType<typeof setTimeout>;
  }[]>([]);

  const handleUndoDelete = (target: { sectionId: string; measurement: SectionMeasurement }) => {
    setUndoStash(prev => {
      const item = prev.find(
        s => s.sectionId === target.sectionId && s.measurement.id === target.measurement.id,
      );
      if (!item) return prev;
      if (item.timer) clearTimeout(item.timer);
      return prev.filter(s => s !== item);
    });
    const { sectionId, measurement } = target;
    updateProject({
      ...project,
      sections: project.sections.map(s =>
        s.id === sectionId
          ? { ...s, measurements: [...s.measurements, measurement] }
          : s,
      ),
    });
    toast({ title: `"${measurement.label}" restored`, description: 'Back in the section, nothing else changed.' });
  };

  if (!projectHook) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">{copy.projectNotFound}</h2>
        <Button onClick={() => setLocation('/')}>{copy.returnDashboard}</Button>
      </div>
    );
  }

  const { project, updateProject } = projectHook;

  const [notesDraft, setNotesDraft] = React.useState(project.description || '');
  const notesDirty = notesDraft !== (project.description || '');

  const handleSaveNotes = () => {
    updateProject({ ...project, description: notesDraft.trim() || undefined });
    toast({ title: 'Notes saved' });
  };

  const handleAddSection = () => {
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
      sections: project.sections.filter(s => s.id !== sectionId)
    });
    toast({ title: 'Section deleted', description: 'If that was a misclick, it is saved in your last export.' });
  };

  const handleAddMeasurement = (sectionId: string) => {
    if (!mLabel.trim() || !mBaseValue) return;

    const measurement = updatedMeasurement();

    updateProject({
      ...project,
      sections: project.sections.map(s => {
        if (s.id !== sectionId) return s;
        if (isEditingThisSection) {
          // Edit in place: same id, new values (issue #7). Graded tables,
          // PDF references, and any stored id keep working without changes.
          return {
            ...s,
            measurements: s.measurements.map(m =>
              m.id === editingMeasurement!.measurementId ? measurement : m,
            ),
          };
        }
        return { ...s, measurements: [...s.measurements, measurement] };
      })
    });

    // Deliberately NOT closing the form here. A section almost always
    // needs more than one measurement (every real example in this app's
    // own audits had 2-3 per section), and the old behavior closed the
    // panel after every single save - meaning adding 3 measurements took
    // 3 separate re-opens of the same form. Type and Grading Key are left
    // untouched on purpose too, since consecutive measurements in one
    // section usually share both.
    toast({
      title: isEditingThisSection ? `"${measurement.label}" updated` : `"${measurement.label}" added`,
      description: isEditingThisSection
        ? 'Saved with its original id intact - nothing downstream breaks.'
        : 'Add another, or hit Close when done.',
    });
    resetMeasurementForm();
  };

  const handleDeleteMeasurement = (sectionId: string, measurementId: string) => {
    const section = project.sections.find(s => s.id === sectionId);
    const measurement = section?.measurements.find(m => m.id === measurementId);
    if (!measurement) return;
    updateProject({
      ...project,
      sections: project.sections.map(s => {
        if (s.id === sectionId) {
          return { ...s, measurements: s.measurements.filter(m => m.id !== measurementId) };
        }
        return s;
      })
    });
    // 8-second undo window: the measurement survives in the stash until
    // either undo fires or its own timer removes it for real (issue #6).
    const stashKey = { sectionId, measurement };
    setUndoStash(prev => {
      if (prev.some(s => s.sectionId === sectionId && s.measurement.id === measurement.id)) {
        return prev;
      }
      return [
        ...prev,
        {
          sectionId,
          measurement,
          timer: setTimeout(
            () =>
              setUndoStash(curr =>
                curr.filter(
                  s => !(s.sectionId === sectionId && s.measurement.id === measurement.id),
                ),
              ),
            8000,
          ),
        },
      ];
    });
    toast({
      title: `"${measurement.label}" deleted`,
      description: 'One click is never final: hit Undo within 8s to get it back.',
      action: (
        <button onClick={() => handleUndoDelete(stashKey)} className="text-sm font-medium text-primary underline underline-offset-2 px-2">{copy.undo}</button>
      ),
    });
  };

  // Edit flow (issue #7): load an existing measurement into the add form.
  const handleEditMeasurement = (sectionId: string, measurementId: string) => {
    const measurement = project.sections
      .find(s => s.id === sectionId)
      ?.measurements.find(m => m.id === measurementId);
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

  // Save then either adds (new) or updates in place (edit) - the measurement
  // id is preserved in edit mode so graded tables and PDF references survive.
  const isEditingThisSection = isEditing && editingMeasurement!.sectionId === (addingMeasurementTo ?? '');
  const updatedMeasurement = (): SectionMeasurement => ({
    id: isEditingThisSection ? editingMeasurement!.measurementId : generateId(),
    label: mLabel.trim(),
    measurementType: mType,
    gradingKey: mKey,
    baseValue: parseFloat(mBaseValue) || 0,
    stitchRepeat: mStitchMode === 'multiple' && mStitchRepeat ? parseInt(mStitchRepeat) : undefined,
    stitchRemainder: mStitchMode === 'multiple' && mStitchRemainder ? parseInt(mStitchRemainder) : undefined,
    stitchParity: mStitchMode === 'even' || mStitchMode === 'odd' ? mStitchMode : undefined,
    rowRepeat: mRowMode === 'multiple' && mRowRepeat ? parseInt(mRowRepeat) : undefined,
    rowRemainder: mRowMode === 'multiple' && mRowRemainder ? parseInt(mRowRemainder) : undefined,
    rowParity: mRowMode === 'even' || mRowMode === 'odd' ? mRowMode : undefined,
  });

  const gradingResults = gradePattern(project, resolveProjectStandards(project, customStandard));

  function TabPanel({ value }: { value: string }): React.ReactElement {
    switch (value) {
      case 'sections': return <>{project.sections.length === 0 && !isAddingSection ? (
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
              {project.sections.map(section => (
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
                        {section.measurements.length} measurements
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
                          <AlertDialogAction onClick={() => handleDeleteSection(section.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {copy.confirmDeleteSectionAction}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {expandedSection === section.id && (
                    <div className="p-0">
                      {section.measurements.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground bg-muted/30 border-b border-border">
                              <tr>
                                <th className="px-4 py-3 font-medium">{copy.measurement}</th>
                                <th className="px-4 py-3 font-medium">{copy.type}</th>
                                <th className="px-4 py-3 font-medium">{copy.gradingBase}</th>
                                <th className="px-4 py-3 font-medium">Value ({project.gauge?.unit ?? "in"})</th>
                                <th className="px-4 py-3 font-medium text-right">{copy.actions}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {section.measurements.map(m => (
                                <tr key={m.id} className="hover:bg-muted/10 transition-colors group">
                                  <td className="px-4 py-3 font-medium text-foreground">{m.label}</td>
                                  <td className="px-4 py-3 text-muted-foreground capitalize">{m.measurementType}</td>
                                  <td className="px-4 py-3 text-muted-foreground">{GRADING_KEY_LABELS[m.gradingKey]}</td>
                                  <td className="px-4 py-3 font-mono">{m.baseValue}</td>
                                  <td className="px-4 py-3 text-right">
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
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {addingMeasurementTo === section.id ? (
                        <div className="p-4 bg-muted/20 border-t border-border space-y-4">
                          <h4 className="font-medium text-sm text-primary flex items-center gap-2">
                            {isEditingThisSection ? (
                              <>
                                <Edit2 className="w-4 h-4" /> Edit Measurement — {editingLabel() ?? '…'}
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" /> Add Measurement
                              </>
                            )}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs">{copy.label}</Label>
                              <Input placeholder="e.g. Back Width" value={mLabel} onChange={(e) => setMLabel(e.target.value)} className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">{copy.typeLabel}</Label>
                              <NativeSelect value={mType} onChange={(e) => setMType(e.target.value as MeasurementType)}>
                                <option value="circumference">{copy.circumferenceFull}</option>
                                <option value="width">{copy.widthHalf}</option>
                                <option value="length">{copy.length}</option>
                                <option value="direct">{copy.directNoGrading}</option>
                              </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">{copy.gradingKey}</Label>
                              <NativeSelect value={mKey} onChange={(e) => setMKey(e.target.value as GradingKey)} disabled={mType === 'direct'}>
                                {Object.entries(GRADING_KEY_LABELS).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Base Value ({project.gauge?.unit ?? "in"})</Label>
                              <Input type="number" step="0.125" placeholder="0.0" value={mBaseValue} onChange={(e) => setMBaseValue(e.target.value)} className="h-10" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <RoundingModeField
                                label="Stitch Rounding"
                                mode={mStitchMode}
                                setMode={setMStitchMode}
                                repeatValue={mStitchRepeat}
                                setRepeatValue={setMStitchRepeat}
                                remainderValue={mStitchRemainder}
                                setRemainderValue={setMStitchRemainder}
                                unitLabel="stitch"
                                testIdPrefix="stitch"
                             />
                             <RoundingModeField
                                label="Row Rounding"
                                mode={mRowMode}
                                setMode={setMRowMode}
                                repeatValue={mRowRepeat}
                                setRepeatValue={setMRowRepeat}
                                remainderValue={mRowRemainder}
                                setRemainderValue={setMRowRemainder}
                                unitLabel="row"
                                testIdPrefix="row"
                             />
                          </div>
                          <div className="flex flex-col items-end gap-1.5 pt-2">
                            {(!mLabel.trim() || !mBaseValue) && (
                              <p className="text-xs text-muted-foreground" data-testid="text-save-requirement">
                                {!mLabel.trim() && !mBaseValue
                                  ? t('workspace.editor.addLabelAndBase')
                                  : !mLabel.trim()
                                  ? t('workspace.editor.addLabel')
                                  : t('workspace.editor.addBase')}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => { setAddingMeasurementTo(null); resetMeasurementForm(); }}>
                                {isEditingThisSection ? t('workspace.editor.cancel') : t('workspace.editor.close')}
                              </Button>
                              <Button size="sm" onClick={() => handleAddMeasurement(section.id)} disabled={!mLabel.trim() || !mBaseValue}>
                                {isEditingThisSection ? t('workspace.editor.saveChanges') : t('workspace.editor.saveMeasurement')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-muted/10 border-t border-border flex justify-center">
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary w-full max-w-sm" onClick={() => setAddingMeasurementTo(section.id)}>
                            <Plus className="w-4 h-4 mr-2" /> {t('workspace.editor.addMeasurement', { section: section.name })}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}

              {isAddingSection ? (
                <Card className="p-4 border-primary">
                  <div className="flex items-center gap-4">
                    <Input 
                      placeholder={t('workspace.editor.sectionPlaceholder')}
                      value={newSectionName} 
                      onChange={(e) => setNewSectionName(e.target.value)}
                      autoFocus
                    />
                    <Button onClick={handleAddSection}>{t('workspace.editor.save')}</Button>
                    <Button variant="ghost" onClick={() => setIsAddingSection(false)}>{t('workspace.editor.close')}</Button>
                  </div>
                </Card>
              ) : (
                <Button variant="outline" className="w-full border-dashed" onClick={() => setIsAddingSection(true)}>
                  <Plus className="w-4 h-4 mr-2" /> {t('workspace.editor.newSection')}
                </Button>
              )}
            </div>
          )}</>;
      case 'preview': return <><Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Calculator className="w-5 h-5 text-accent" />
                {t('workspace.editor.previewTitle')}
              </CardTitle>
              <CardDescription>
                {t('workspace.editor.previewDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gradingResults.length === 0 || gradingResults.every(s => s.measurements.length === 0) ? (
                 <div className="text-center py-8 text-muted-foreground">
                   {t('workspace.editor.emptyPreview')}
                 </div>
              ) : (
                <div className="space-y-8">
                  {gradingResults.filter(s => s.measurements.length > 0).map(section => (
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
                            {section.measurements.map(m => (
                              <tr key={m.measurementId} className="hover:bg-muted/30">
                                <td className="px-2 py-3 font-medium sticky left-0 bg-card z-10 shadow-[1px_0_0_0_hsl(var(--border))]">
                                  {m.label}
                                </td>
                                {ALL_SIZES.map(size => {
                                  const val = m.gradedValues.find(v => v.size === size);
                                  return (
                                    <td key={size} className={cn("px-3 py-3 text-center", size === project.baseSize ? "bg-primary/5" : "")}>
                                      <div className="flex flex-col items-center">
                                        <span className="font-mono font-bold text-foreground">{val?.stitchCount} <span className="text-[10px] font-sans font-normal text-muted-foreground">{STS_UNIT[language]}</span></span>
                                        {val?.rowCount !== undefined && (
                                          <span className="font-mono font-semibold text-accent mt-0.5">{val.rowCount} <span className="text-[10px] font-sans font-normal text-muted-foreground">{ROWS_UNIT[language]}</span></span>
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
          </Card></>;
      case 'notes': return <><Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-accent" />
                {t('workspace.editor.notesTitle')}
              </CardTitle>
              <CardDescription>
                {t('workspace.editor.notesDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="e.g. Worked flat, seamed at the side. Blocks generously — swatch and block before committing to a size."
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
          </Card></>;
      // CHK-094 bundle fix: every heavy lab card loads on demand via React.lazy.
      // TabsContent mounts content lazily, so the initial page stays light
      // (the static + dynamic import warnings Vite emitted are retired too).
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
      case 'listing-test': return <LazyPanel loader={LAB.listingtest} project={project} />;
      case 'yarn-pool': return <LazyPanel loader={LAB.yarnpool} project={project} />;
      case 'membership-site': return <LazyPanel loader={LAB.membershipsite} project={project} />;
      case 'release-timing': return <LazyPanel loader={LAB.releasetiming} project={project} />;
      case 'convention-booth': return <LazyPanel loader={LAB.conventionbooth} project={project} />;
      case 'channel-migration': return <LazyPanel loader={LAB.channelmigration} project={project} />;
      case 'workshop-teach': return <LazyPanel loader={LAB.workshopteach} project={project} />;
      case 'consignment-reprice': return <LazyPanel loader={LAB.consignmentreprice} project={project} />;
      case 'pattern-bundle': return <LazyPanel loader={LAB.patternbundle} project={project} />;
      case 'retreat-teach': return <LazyPanel loader={LAB.retreatteach} project={project} />;
      case 'podcast-affiliate': return <LazyPanel loader={LAB.podcastaffiliate} project={project} />;
      case 'magazine-submission': return <LazyPanel loader={LAB.magazinesubmission} project={project} />;
      case 'pricing-psychology': return <LazyPanel loader={LAB.pricingpsychology} project={project} />;
      case 'pod-patterns': return <LazyPanel loader={LAB.podpatterns} project={project} />;
      case 'marketplace-takerate': return <LazyPanel loader={LAB.marketplacetakerate} project={project} />;
      case 'box-inclusion': return <LazyPanel loader={LAB.boxinclusion} project={project} />;
      case 'yarn-licensing': return <LazyPanel loader={LAB.yarnlicensing} project={project} />;
      case 'giftcard': return <LazyPanel loader={LAB.giftcard} project={project} />;
      case 'wholesale-pricelist': return <LazyPanel loader={LAB.wholesalepricelist} project={project} />;
      case 'intl-pricing': return <LazyPanel loader={LAB.intlpricing} project={project} />;
      case 'testknitlab': return <LazyPanel loader={LAB.testknitlab} project={project} />;
      case 'gaugefit': return <LazyPanel loader={LAB.gaugefit} project={project} />;
      case 'receiptlab': return <LazyPanel loader={LAB.receiptlab} project={project} />;
      case 'designledger': return <LazyPanel loader={LAB.designledger} project={project} />;
      case 'bragcard': return <LazyPanel loader={LAB.bragcard} project={project} />;
      case 'payback': return <LazyPanel loader={LAB.payback} project={project} />;
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent/20 text-accent uppercase tracking-wider">
              {project.baseSize}
            </span>
          </div>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
            {copy.by} {project.author} <span className="text-border">•</span>
            {copy.gauge}: {workspaceGaugeByline(language, project.gauge)}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* MOBILE & DESKTOP: Dual-tier Navigation */}
        <div className="flex flex-col gap-1 mb-4">
          
          {/* TIER 1: Group Selector (Horizontal scrolling pills) */}
          <div className="flex overflow-x-auto gap-2 py-1 px-1 -mx-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
            {[
              { g: 'design', label: t('workspace.group.design') },
              { g: 'fit', label: t('workspace.group.fit') },
              { g: 'pricing', label: t('workspace.group.pricing') },
              { g: 'launch', label: t('workspace.group.launch') },
              { g: 'channels', label: t('workspace.group.channels') },
              { g: 'business', label: t('workspace.group.business') },
            ].map(({ g, label }) => {
              const isActive = (TAB_GROUPS[activeTab] || 'design') === g;
              const firstTab = Object.keys(TAB_GROUPS).find((v) => TAB_GROUPS[v] === g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => firstTab && setActiveTab(firstTab)}
                  className={`shrink-0 snap-start px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20' 
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/40'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* TIER 2: Lab Selector (Horizontal scrolling underlined tabs) */}
          <div className="relative">
            <TabsList className="flex flex-nowrap w-full gap-2 bg-transparent border-b border-border/40 p-0 h-auto overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ justifyContent: "flex-start" }}>
              {TAB_REGISTRY.map((tab) => {
                const isVisible = TAB_GROUPS[tab.value] === (TAB_GROUPS[activeTab] || 'design');
                if (!isVisible) {
                  // Radix requires TabsTrigger to be present, but we can hide it.
                  // We must ensure the component returns valid JSX for hidden tabs.
                  return (
                    <TabsTrigger key={tab.value} value={tab.value} className="hidden">
                      <span />
                    </TabsTrigger>
                  );
                }
                
                const localizedLabel = getWorkspaceTabLabel(language, tab.value, ({
                  sections: t('workspace.tab.sections'), preview: t('workspace.tab.preview'), yarn: t('workspace.tab.yarn'), notes: t('workspace.tab.notes'), income: t('workspace.tab.income'), draft: t('workspace.tab.draft'), pricing: t('workspace.tab.pricing'), publish: t('workspace.tab.publish'), testknit: t('workspace.tab.testKnit'), techedit: t('workspace.tab.techEdit'), finish: t('workspace.tab.finish'), launch: t('workspace.tab.launch'), channels: t('workspace.tab.channels'),
                }[tab.value] ?? tab.label));

                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="font-medium text-[13.5px] whitespace-nowrap shrink-0 min-h-[44px] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent rounded-none px-3 py-2 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center data-[state=active]:shadow-none"
                  >
                    <TriggerChildren value={tab.value} label={localizedLabel ?? tab.label} />
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {/* Right-edge scroll fade cue */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-8"
              style={{
                background: "linear-gradient(to right, transparent, hsl(var(--background)))",
              }}
            />
          </div>
        </div>

        {TAB_REGISTRY.map((t) => {
           // To avoid rendering 79 heavy components, we only mount the active group
           // (or we can just let Radix handle it, but for performance, wrapping in a check helps).
           // Actually Radix TabsContent handles mounting/unmounting automatically unless forceMount is used.
           return (
             <TabsContent key={t.value} value={t.value} className="mt-4 focus-visible:outline-none focus-visible:ring-0">
               <TabPanel value={t.value} />
             </TabsContent>
           );
        })}
      </Tabs>
    </div>
  );
}
