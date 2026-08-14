import React from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useProject } from '@/context/ProjectsContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateId, PatternSection, SectionMeasurement, MeasurementType, GradingKey, GRADING_KEY_LABELS, ALL_SIZES, gradePattern, resolveProjectStandards } from '@/lib/grading-engine';
import { Plus, Edit2, Trash2, ArrowRight, Table as TableIcon, Copy, Settings, ChevronDown, ChevronRight, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { YarnEstimatorCard } from '@/components/yarn-estimator-card';
import { IncomeCalculatorCard } from '@/components/income-calculator-card';
import { PatternDraftCard } from '@/components/pattern-draft-card';
import { PricingAdvisorCard } from '@/components/pricing-advisor-card';
import { PublishToolkitCard } from '@/components/publish-toolkit-card';
import { DealsTabCard } from '@/components/deals-tab-card';
import { TestKnitCard } from '@/components/test-knit-card';
import { TechEditCard } from '@/components/tech-edit-card';
import { FinishGuideCard } from '@/components/finish-guide-card';
import { LaunchCampaignCard } from '@/components/launch-campaign-card';
import { TrunkShowCard } from '@/components/trunk-show-card';
import { TranslationBundleCard } from '@/components/translation-bundle-card';
import { PatternClubCard } from '@/components/pattern-club-card';
import { KitEconomicsCard } from '@/components/kit-economics-card';
import { SubmissionPipelineCard } from '@/components/submission-pipeline-card';
import { KalRoiCard } from '@/components/kal-roi-card';
import { ChannelFunnelCard } from '@/components/channel-funnel-card';
import { ClubRevenueCard } from '@/components/club-revenue-card';
import { WholesaleBookCard } from '@/components/wholesale-book-card';
import { HireVsSelfCard } from '@/components/hire-vs-self-card';
import { InclusiveSizingCard } from '@/components/inclusive-sizing-card';
import { PatternLicensePlannerCard } from '@/components/pattern-license-card';

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
  const { customStandard } = useSettings();

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

  const resetMeasurementForm = () => {
    setMLabel('');
    setMBaseValue('');
    setMStitchRepeat('');
    setMStitchRemainder('');
    setMRowRepeat('');
    setMRowRemainder('');
    setMStitchMode('exact');
    setMRowMode('exact');
  };

  if (!projectHook) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-serif font-bold mb-4">Project Not Found</h2>
        <Button onClick={() => setLocation('/')}>Return to Dashboard</Button>
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
    if (!confirm('Are you sure you want to delete this section and all its measurements?')) return;
    updateProject({
      ...project,
      sections: project.sections.filter(s => s.id !== sectionId)
    });
  };

  const handleAddMeasurement = (sectionId: string) => {
    if (!mLabel.trim() || !mBaseValue) return;
    
    const measurement: SectionMeasurement = {
      id: generateId(),
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
    };

    updateProject({
      ...project,
      sections: project.sections.map(s => {
        if (s.id === sectionId) {
          return { ...s, measurements: [...s.measurements, measurement] };
        }
        return s;
      })
    });

    // Deliberately NOT closing the form here. A section almost always
    // needs more than one measurement (every real example in this app's
    // own audits had 2-3 per section), and the old behavior closed the
    // panel after every single save - meaning adding 3 measurements took
    // 3 separate re-opens of the same form. Type and Grading Key are left
    // untouched on purpose too, since consecutive measurements in one
    // section usually share both.
    toast({ title: `"${measurement.label}" added`, description: 'Add another, or hit Close when done.' });
    resetMeasurementForm();
  };

  const handleDeleteMeasurement = (sectionId: string, measurementId: string) => {
    updateProject({
      ...project,
      sections: project.sections.map(s => {
        if (s.id === sectionId) {
          return { ...s, measurements: s.measurements.filter(m => m.id !== measurementId) };
        }
        return s;
      })
    });
  };

  const gradingResults = gradePattern(project, resolveProjectStandards(project, customStandard));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card p-6 rounded-xl border border-card-border shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-serif font-bold text-foreground">{project.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent/20 text-accent uppercase tracking-wider">
              {project.baseSize}
            </span>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            By {project.author} <span className="text-border">•</span> 
            Gauge: {project.gauge?.stitchesPer4In ?? "—"}sts × {project.gauge?.rowsPer4In ?? "—"}rows / 4{project.gauge?.unit ?? "in"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/project/${project.id}/grading`}>
              <TableIcon className="w-4 h-4 mr-2" />
              Full Grading Table
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild className="bg-primary hover:bg-primary/90">
            <Link href={`/project/${project.id}/pdf`}>
              <Copy className="w-4 h-4 mr-2" />
              Export PDF
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap md:flex-nowrap w-full gap-1 bg-card border border-border p-1 h-auto overflow-x-auto">
          <TabsTrigger value="sections" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Sections
          </TabsTrigger>
          <TabsTrigger value="preview" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Preview
          </TabsTrigger>
          <TabsTrigger value="yarn" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Yarn
          </TabsTrigger>
          <TabsTrigger value="notes" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Notes
          </TabsTrigger>
          <TabsTrigger value="income" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Income
          </TabsTrigger>
          <TabsTrigger value="draft" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Draft
          </TabsTrigger>
          <TabsTrigger value="pricing" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Pricing
          </TabsTrigger>
          <TabsTrigger value="publish" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Publish
          </TabsTrigger>
          <TabsTrigger value="testknit" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Test Knit
          </TabsTrigger>
          <TabsTrigger value="techedit" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Tech Edit
          </TabsTrigger>
          <TabsTrigger value="finish" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Finish
          </TabsTrigger>
          <TabsTrigger value="deals" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Deals
          </TabsTrigger>
          <TabsTrigger value="launch" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Launch
          </TabsTrigger>
          <TabsTrigger value="trunkshow" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Trunk Show
          </TabsTrigger>
          <TabsTrigger value="transbundle" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Trans & Bundle
          </TabsTrigger>
          <TabsTrigger value="patternclub" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Pattern Club
          </TabsTrigger>
          <TabsTrigger value="kits" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Kits
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="kalroi" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            KAL &amp; Collab
          </TabsTrigger>
          <TabsTrigger value="channels" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Channels
          </TabsTrigger>
          <TabsTrigger value="clubrev" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Club Rev
          </TabsTrigger>
          <TabsTrigger value="wsbook" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Wholesale &amp; Book
          </TabsTrigger>
          <TabsTrigger value="hireself" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Hire vs Self
          </TabsTrigger>
          <TabsTrigger value="inclusive" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Inclusive
          </TabsTrigger>
          <TabsTrigger value="licenceit" className="font-medium text-sm whitespace-nowrap shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">
            Licence It
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="mt-6 space-y-6">
          {project.sections.length === 0 && !isAddingSection ? (
            <Card className="border-dashed bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center mb-4 text-primary">
                  <Calculator className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-serif font-medium mb-2">No Sections Yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Divide your pattern into logical sections (e.g. Back, Front, Sleeves) to start adding measurements.
                </p>
                <Button onClick={() => setIsAddingSection(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add First Section
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
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }} className="text-destructive hover:text-destructive hover:bg-destructive/10" aria-label={`Delete section "${section.name}"`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {expandedSection === section.id && (
                    <div className="p-0">
                      {section.measurements.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground bg-muted/30 border-b border-border">
                              <tr>
                                <th className="px-4 py-3 font-medium">Measurement</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Grading Base</th>
                                <th className="px-4 py-3 font-medium">Value ({project.gauge?.unit ?? "in"})</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
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
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteMeasurement(section.id, m.id)} aria-label={`Delete measurement "${m.label}"`}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
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
                            <Plus className="w-4 h-4" /> Add Measurement
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Label</Label>
                              <Input placeholder="e.g. Back Width" value={mLabel} onChange={(e) => setMLabel(e.target.value)} className="h-10" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Type</Label>
                              <NativeSelect value={mType} onChange={(e) => setMType(e.target.value as MeasurementType)}>
                                <option value="circumference">Circumference (Full)</option>
                                <option value="width">Width (Half)</option>
                                <option value="length">Length</option>
                                <option value="direct">Direct (No Grading)</option>
                              </NativeSelect>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Grading Key</Label>
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
                                  ? 'Add a label and a base value to save'
                                  : !mLabel.trim()
                                  ? 'Add a label to save'
                                  : 'Add a base value to save'}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => { setAddingMeasurementTo(null); resetMeasurementForm(); }}>Close</Button>
                              <Button size="sm" onClick={() => handleAddMeasurement(section.id)} disabled={!mLabel.trim() || !mBaseValue}>Save Measurement</Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-muted/10 border-t border-border flex justify-center">
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary w-full max-w-sm" onClick={() => setAddingMeasurementTo(section.id)}>
                            <Plus className="w-4 h-4 mr-2" /> Add Measurement to {section.name}
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
                      placeholder="Section Name (e.g., Sleeves)" 
                      value={newSectionName} 
                      onChange={(e) => setNewSectionName(e.target.value)}
                      autoFocus
                    />
                    <Button onClick={handleAddSection}>Save</Button>
                    <Button variant="ghost" onClick={() => setIsAddingSection(false)}>Cancel</Button>
                  </div>
                </Card>
              ) : (
                <Button variant="outline" className="w-full border-dashed" onClick={() => setIsAddingSection(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add New Section
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Calculator className="w-5 h-5 text-accent" />
                Grading Preview
              </CardTitle>
              <CardDescription>
                A quick look at your stitch and row counts. Go to the Full Grading Table for export.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gradingResults.length === 0 || gradingResults.every(s => s.measurements.length === 0) ? (
                 <div className="text-center py-8 text-muted-foreground">
                   Add sections and measurements first to see grading results.
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
                              <th className="px-2 py-2 font-medium sticky left-0 bg-card z-10 w-48 shadow-[1px_0_0_0_hsl(var(--border))]">Measurement</th>
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
                                        <span className="font-mono font-bold text-foreground">{val?.stitchCount} <span className="text-[10px] font-sans font-normal text-muted-foreground">sts</span></span>
                                        {val?.rowCount !== undefined && (
                                          <span className="font-mono font-semibold text-accent mt-0.5">{val.rowCount} <span className="text-[10px] font-sans font-normal text-muted-foreground">rows</span></span>
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
        </TabsContent>

        <TabsContent value="yarn" className="mt-6">
          <YarnEstimatorCard project={project} />
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          <IncomeCalculatorCard project={project} />
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          <PatternDraftCard project={project} />
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <PricingAdvisorCard project={project} />
        </TabsContent>
        <TabsContent value="publish" className="mt-6">
          <PublishToolkitCard project={project} onUpdateProject={updateProject} />
        </TabsContent>
        <TabsContent value="testknit" className="mt-6">
          <TestKnitCard project={project} />
        </TabsContent>
        <TabsContent value="techedit" className="mt-6">
          <TechEditCard project={project} />
        </TabsContent>
        <TabsContent value="finish" className="mt-6">
          <FinishGuideCard project={project} />
        </TabsContent>
        <TabsContent value="deals" className="mt-6">
          <DealsTabCard project={project} />
        </TabsContent>
        <TabsContent value="launch" className="mt-6">
          <LaunchCampaignCard project={project} />
        </TabsContent>
        <TabsContent value="trunkshow" className="mt-6">
          <TrunkShowCard project={project} />
        </TabsContent>
        <TabsContent value="transbundle" className="mt-6">
          <TranslationBundleCard project={project} />
        </TabsContent>
        <TabsContent value="patternclub" className="mt-6">
          <PatternClubCard project={project} />
        </TabsContent>
        <TabsContent value="kits" className="mt-6">
          <KitEconomicsCard project={project} />
        </TabsContent>
        <TabsContent value="pipeline" className="mt-6">
          <SubmissionPipelineCard project={project} />
        </TabsContent>

        <TabsContent value="kalroi" className="mt-6">
          <KalRoiCard project={project} />
        </TabsContent>

        <TabsContent value="channels" className="mt-6">
          <ChannelFunnelCard project={project} />
        </TabsContent>

        <TabsContent value="clubrev" className="mt-6">
          <ClubRevenueCard project={project} />
        </TabsContent>

        <TabsContent value="wsbook" className="mt-6">
          <WholesaleBookCard project={project} />
        </TabsContent>

        <TabsContent value="hireself" className="mt-6">
          <HireVsSelfCard project={project} />
        </TabsContent>
        <TabsContent value="inclusive" className="mt-6">
          <InclusiveSizingCard project={project} />
        </TabsContent>
        <TabsContent value="licenceit" className="mt-6">
          <PatternLicensePlannerCard project={project} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-accent" />
                Pattern Notes
              </CardTitle>
              <CardDescription>
                Designer notes, construction reminders, or anything worth remembering about this pattern. These can be included on the PDF cover page — see Export PDF.
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
                  {notesDirty ? 'Unsaved changes' : 'Saved'}
                </p>
                <Button onClick={handleSaveNotes} disabled={!notesDirty} size="sm" data-testid="button-save-notes">
                  Save Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
