import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCopy, FileText, ImageOff, Lock, RotateCcw, Send, ShieldOff, Trash2 } from 'lucide-react';
import { useProject } from '@/context/ProjectsContext';
import { useSettings } from '@/context/SettingsContext';
import type { PatternProject } from '@/lib/grading-engine';
import { projectStorage } from '@/lib/storage-lib';
import type { SavedSale } from '@/lib/receipt-lab';
import { computeMonthlyLedgerRows } from '@/lib/receipt-lab';
import {
  RELEASE_DRAFT_FIELDS,
  buildReleaseDraftHandoffText,
  createReleaseDraft,
  recordReleaseHandoff,
  resolveLocalMediaSelection,
  setReleaseDraftReview,
  validateReleaseDraft,
  withdrawReleaseDraft,
  type ReleaseDraft,
  type ReleaseDraftAudience,
  type ReleaseDraftField,
  type ReleaseDraftLocale,
  type ReleaseDraftPurpose,
} from '@/lib/release-draft';
import { getReleaseDraftCopy } from '@/lib/release-draft-copy';
import { LANGUAGE_OPTIONS } from '@/lib/i18n';
import { copyTextOrThrow } from '@/lib/clipboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const PURPOSES: readonly ReleaseDraftPurpose[] = ['portfolio', 'pattern-preview', 'finished-work', 'private-review'];
const AUDIENCES: readonly ReleaseDraftAudience[] = ['private', 'trusted-reviewer', 'public'];
const RECEIPT_KEY = 'stitch-and-scale-receipt-v1';
const LEDGER_KEY = 'stitch-and-scale-designledger-v1';

type ReceiptStored = { ledger?: SavedSale[]; ts?: number };
type LedgerStored = { designs?: { status?: string }[]; ts?: number };

type FieldValues = Record<ReleaseDraftField, string>;

function hasBragCardSource(projectId: string): boolean {
  try {
    const receipt = projectStorage<ReceiptStored>('receipt', projectId, [RECEIPT_KEY]).read();
    const hasSales = Boolean(receipt?.ts && Array.isArray(receipt.ledger) && computeMonthlyLedgerRows(receipt.ledger).length > 0);
    const ledger = projectStorage<LedgerStored>('designledger', projectId, [LEDGER_KEY]).read();
    const publishedCount = ledger?.ts && Array.isArray(ledger.designs)
      ? ledger.designs.filter((design) => design?.status === 'published').length
      : 0;
    return hasSales || publishedCount > 0;
  } catch {
    return false;
  }
}

function countMeasurements(project: PatternProject): number {
  return (project.sections ?? []).reduce((total, section) => total + (section.measurements?.length ?? 0), 0);
}

function buildFieldValues(project: PatternProject, notRecorded: string): FieldValues {
  const gauge = project.gauge;
  const sectionCount = project.sections?.length ?? 0;
  const measurementCount = countMeasurements(project);
  const description = project.description?.trim();
  return {
    title: project.name?.trim() || notRecorded,
    description: description || notRecorded,
    author: project.author?.trim() || notRecorded,
    gauge: `${gauge.stitchesPer4In} stitches × ${gauge.rowsPer4In} rows / 4 ${gauge.unit}`,
    sizes: project.baseSize || notRecorded,
    'grading-summary': `${sectionCount} local section${sectionCount === 1 ? '' : 's'}; ${measurementCount} recorded measurement${measurementCount === 1 ? '' : 's'}`,
    notes: notRecorded,
    'stitch-identity': notRecorded,
  };
}

function hasFieldValue(project: PatternProject, field: ReleaseDraftField): boolean {
  if (field === 'title') return Boolean(project.name?.trim());
  if (field === 'description') return Boolean(project.description?.trim());
  if (field === 'author') return Boolean(project.author?.trim());
  if (field === 'notes' || field === 'stitch-identity') return false;
  return true;
}

function makeArtifact(project: PatternProject, label: string, selectedAt: string) {
  return {
    id: `brag-card-${project.id}`,
    kind: 'brag-card' as const,
    sourceId: `brag-card:${project.id}`,
    label,
    provenance: 'Existing local Brag Card preview from Receipt Lab and Design Ledger source data; no platform delivery is claimed.',
    availability: 'available' as const,
    selectedAt,
  };
}

export function ReleaseDraftCard({ project }: { project: PatternProject }) {
  const projectHook = useProject(project.id);
  const { language } = useSettings();
  const { toast } = useToast();
  const copy = getReleaseDraftCopy(language as ReleaseDraftLocale);
  const liveProject = projectHook?.project ?? project;
  const drafts = liveProject.releaseDrafts ?? [];
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(drafts[0]?.id ?? null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const draft = drafts.find((item) => item.id === selectedDraftId) ?? null;
  const bragCardAvailable = useMemo(() => hasBragCardSource(liveProject.id), [liveProject.id, liveProject.releaseDrafts]);
  const effectiveDraft = useMemo(() => {
    if (!draft || bragCardAvailable) return draft;
    return {
      ...draft,
      artifacts: draft.artifacts.map((artifact) => artifact.kind === 'brag-card' ? { ...artifact, availability: 'missing' as const } : artifact),
    };
  }, [draft, bragCardAvailable]);
  const validation = useMemo(() => (effectiveDraft ? validateReleaseDraft(effectiveDraft) : null), [effectiveDraft]);
  const isWithdrawn = Boolean(draft?.withdrawnAt);
  const imageAssets = useMemo(
    () => (liveProject.assets ?? []).filter((asset) => asset?.type === 'image' && asset.mimeType?.toLowerCase().startsWith('image/') && typeof asset.dataUrl === 'string' && asset.dataUrl.startsWith('data:')),
    [liveProject.assets],
  );
  const fieldValues = useMemo(() => buildFieldValues(liveProject, copy.notRecorded), [liveProject, copy.notRecorded]);
  const fieldAvailability = useMemo(
    () => Object.fromEntries(RELEASE_DRAFT_FIELDS.map((field) => [field, hasFieldValue(liveProject, field)])) as Record<ReleaseDraftField, boolean>,
    [liveProject],
  );

  const saveDraft = (next: ReleaseDraft) => {
    projectHook?.updateReleaseDraft(next);
  };

  const startDraft = () => {
    const now = new Date().toISOString();
    const base = createReleaseDraft({
      id: `release-draft-${project.id}-${Date.now()}`,
      projectId: project.id,
      title: `${project.name} release`,
      activeLocale: language as ReleaseDraftLocale,
      purpose: 'private-review',
      audience: 'private',
      now,
    });
    if (!base || !projectHook) return;
    const next = { ...base, selectedFields: ['title' as const] };
    projectHook.createReleaseDraft(next);
    setSelectedDraftId(next.id);
  };

  const updateMetadata = (patch: Partial<Pick<ReleaseDraft, 'title' | 'purpose' | 'audience' | 'activeLocale'>>) => {
    if (!draft || isWithdrawn) return;
    const next = { ...draft, ...patch, review: { status: 'not-reviewed' as const }, updatedAt: new Date().toISOString() };
    saveDraft(next);
  };

  const toggleArtifact = (checked: boolean) => {
    if (!draft || isWithdrawn) return;
    const now = new Date().toISOString();
    const selected = draft.artifacts.some((artifact) => artifact.kind === 'brag-card');
    if (checked && !selected && bragCardAvailable) {
      saveDraft({ ...draft, artifacts: [...draft.artifacts, makeArtifact(liveProject, copy.bragCardArtifact, now)], review: { status: 'not-reviewed' }, updatedAt: now });
    } else if (!checked && selected) {
      saveDraft({ ...draft, artifacts: draft.artifacts.filter((artifact) => artifact.kind !== 'brag-card'), review: { status: 'not-reviewed' }, updatedAt: now });
    }
  };

  const toggleMedia = (assetId: string, checked: boolean) => {
    if (!draft || isWithdrawn) return;
    const now = new Date().toISOString();
    if (checked) {
      const selected = resolveLocalMediaSelection(liveProject, [assetId], now).selected[0];
      if (!selected) return;
      saveDraft({ ...draft, media: [...draft.media.filter((item) => item.assetId !== assetId), selected], review: { status: 'not-reviewed' }, updatedAt: now });
      return;
    }
    saveDraft({ ...draft, media: draft.media.filter((item) => item.assetId !== assetId), review: { status: 'not-reviewed' }, updatedAt: now });
  };

  const updateMedia = (mediaId: string, patch: Partial<ReleaseDraft['media'][number]>) => {
    if (!draft || isWithdrawn) return;
    const next = {
      ...draft,
      media: draft.media.map((item) => item.id === mediaId ? { ...item, ...patch } : item),
      review: { status: 'not-reviewed' as const },
      updatedAt: new Date().toISOString(),
    };
    saveDraft(next);
  };

  const updateAltText = (mediaId: string, text: string) => {
    if (!draft || isWithdrawn) return;
    const media = draft.media.find((item) => item.id === mediaId);
    if (!media) return;
    updateMedia(mediaId, {
      altTextByLocale: {
        ...media.altTextByLocale,
        [draft.activeLocale]: { text, reviewed: false },
      },
    });
  };

  const markAltReviewed = (mediaId: string, reviewed: boolean) => {
    if (!draft || isWithdrawn) return;
    const media = draft.media.find((item) => item.id === mediaId);
    if (!media) return;
    const existing = media.altTextByLocale[draft.activeLocale];
    updateMedia(mediaId, {
      altTextByLocale: {
        ...media.altTextByLocale,
        [draft.activeLocale]: { ...existing, reviewed, reviewedAt: reviewed ? new Date().toISOString() : undefined },
      },
    });
  };

  const updateFieldMode = (field: ReleaseDraftField, mode: 'include' | 'redact' | 'omit') => {
    if (!draft || isWithdrawn) return;
    const selected = new Set(draft.selectedFields);
    const redacted = new Set(draft.redactedFields);
    selected.delete(field);
    redacted.delete(field);
    if (mode === 'include') selected.add(field);
    if (mode === 'redact') redacted.add(field);
    saveDraft({
      ...draft,
      selectedFields: [...selected],
      redactedFields: [...redacted],
      review: { status: 'not-reviewed' },
      updatedAt: new Date().toISOString(),
    });
  };

  const copyHandoff = async () => {
    if (!draft || !validation?.ok) return;
    const text = buildReleaseDraftHandoffText(draft, {
      purpose: copy.purposeLabel,
      audience: copy.audienceLabel,
      artifacts: `${copy.artifactsLabel}:`,
      fields: `${copy.fieldsLabel}:`,
      fieldLabel: (field) => copy.fieldLabels[field],
      reviewedMedia: `${copy.altTextLabel}:`,
      preparedNote: copy.handoffPrepared,
    }, fieldValues);
    try {
      await copyTextOrThrow(text);
      saveDraft(recordReleaseHandoff(draft, 'clipboard', 'resolved', new Date().toISOString(), copy.handoffPrepared));
      toast({ title: copy.handoffLabel, description: copy.handoffPrepared });
    } catch {
      saveDraft(recordReleaseHandoff(draft, 'clipboard', 'unknown', new Date().toISOString(), copy.clipboardUnavailable));
      toast({ title: copy.handoffLabel, description: copy.clipboardUnavailable, variant: 'destructive' });
    }
  };

  const withdraw = () => {
    if (!draft || isWithdrawn) return;
    saveDraft(withdrawReleaseDraft(draft));
  };

  const deleteDraft = () => {
    if (!draft || !projectHook) return;
    projectHook.deleteReleaseDraft(draft.id);
    setDeleteOpen(false);
    setSelectedDraftId(null);
    toast({ title: copy.deleteSuccess });
  };

  const selectedArtifact = draft?.artifacts.some((artifact) => artifact.kind === 'brag-card') ?? false;
  const includedArtifacts = draft?.artifacts.filter((artifact) => artifact.availability === 'available' && (artifact.kind !== 'brag-card' || bragCardAvailable)) ?? [];

  return (
    <Card className="w-full max-w-4xl mx-auto" data-testid="release-draft-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Send className="h-4 w-4" aria-hidden="true" />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.privateDefault}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!draft ? (
          <div className="rounded-lg border border-dashed p-4 space-y-3">
            <p className="text-sm text-muted-foreground">{copy.noDraft}</p>
            <Button type="button" className="min-h-11" onClick={startDraft} data-testid="release-draft-start">
              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
              {copy.create}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="release-draft-title">{copy.titleLabel}</Label>
                <Input id="release-draft-title" value={draft.title} disabled={isWithdrawn} onChange={(event) => updateMetadata({ title: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="release-draft-purpose">{copy.purposeLabel}</Label>
                <NativeSelect id="release-draft-purpose" className="min-h-11" value={draft.purpose} disabled={isWithdrawn} onChange={(event) => updateMetadata({ purpose: event.target.value as ReleaseDraftPurpose })}>
                  {PURPOSES.map((purpose) => <option key={purpose} value={purpose}>{copy.purposeOptions[purpose]}</option>)}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="release-draft-audience">{copy.audienceLabel}</Label>
                <NativeSelect id="release-draft-audience" className="min-h-11" value={draft.audience} disabled={isWithdrawn} onChange={(event) => updateMetadata({ audience: event.target.value as ReleaseDraftAudience })}>
                  {AUDIENCES.map((audience) => <option key={audience} value={audience}>{copy.audienceOptions[audience]}</option>)}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="release-draft-locale">{copy.localeLabel}</Label>
                <NativeSelect id="release-draft-locale" className="min-h-11" value={draft.activeLocale} disabled={isWithdrawn} onChange={(event) => updateMetadata({ activeLocale: event.target.value as ReleaseDraftLocale })}>
                  {LANGUAGE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.nativeLabel}</option>)}
                </NativeSelect>
              </div>
            </div>

            <section className="rounded-lg border p-3 space-y-2" aria-labelledby="release-draft-artifact-heading">
              <h3 id="release-draft-artifact-heading" className="text-sm font-semibold">{copy.artifactsLabel}</h3>
              <label className="flex min-h-11 items-start gap-2 rounded-md p-1 text-sm">
                <Checkbox
                  checked={selectedArtifact}
                  disabled={isWithdrawn || (!bragCardAvailable && !selectedArtifact)}
                  onCheckedChange={(value) => toggleArtifact(value === true)}
                  aria-label={copy.artifactSelect}
                  data-testid="release-draft-artifact-brag-card"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{copy.bragCardArtifact}</span>
                  <span className="block text-xs text-muted-foreground">
                    {bragCardAvailable ? (selectedArtifact ? copy.artifactSelected : copy.artifactAvailable) : copy.artifactNeedsSource}
                  </span>
                </span>
                {selectedArtifact ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /> : <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
              </label>
              {draft.artifacts.filter((artifact) => artifact.kind !== 'brag-card').map((artifact) => (
                <p key={artifact.id} className="text-xs text-amber-700 dark:text-amber-300">{artifact.label}: {copy.artifactMissing}</p>
              ))}
              {!selectedArtifact ? <p className="text-xs text-muted-foreground">{copy.noArtifactsSelected}</p> : null}
            </section>

            <section className="rounded-lg border p-3 space-y-3" aria-labelledby="release-draft-fields-heading">
              <div>
                <h3 id="release-draft-fields-heading" className="text-sm font-semibold">{copy.fieldsLabel}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{copy.previewDescription}</p>
              </div>
              <div className="space-y-2">
                {RELEASE_DRAFT_FIELDS.map((field) => {
                  const included = draft.selectedFields.includes(field);
                  const redacted = draft.redactedFields.includes(field);
                  const available = fieldAvailability[field];
                  return (
                    <div key={field} className="grid grid-cols-1 gap-2 rounded-md border p-2.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{copy.fieldLabels[field]}</p>
                        <p className="truncate text-xs text-muted-foreground">{available ? fieldValues[field] : copy.fieldUnavailable}</p>
                      </div>
                      <label className="flex min-h-11 items-center gap-2 text-xs">
                        <Checkbox checked={included} disabled={isWithdrawn || !available} onCheckedChange={(value) => updateFieldMode(field, value === true ? 'include' : 'omit')} aria-label={`${copy.includeField}: ${copy.fieldLabels[field]}`} />
                        <span>{copy.includeField}</span>
                      </label>
                      <label className="flex min-h-11 items-center gap-2 text-xs">
                        <Checkbox checked={redacted} disabled={isWithdrawn || !available} onCheckedChange={(value) => updateFieldMode(field, value === true ? 'redact' : 'omit')} aria-label={`${copy.redactField}: ${copy.fieldLabels[field]}`} />
                        <span>{copy.redactField}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg border p-3 space-y-3" aria-labelledby="release-draft-media-heading">
              <div>
                <h3 id="release-draft-media-heading" className="text-sm font-semibold">{copy.mediaLabel}</h3>
                {imageAssets.length === 0 ? (
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground"><ImageOff className="mt-0.5 h-3.5 w-3.5" aria-hidden="true" />{copy.noPhoto}</p>
                ) : null}
              </div>
              {imageAssets.length === 0 ? null : (
                <div className="space-y-2">
                  {imageAssets.map((asset) => {
                    const media = draft.media.find((item) => item.assetId === asset.id);
                    return (
                      <div key={asset.id} className="rounded-md border p-2.5 space-y-2">
                        <label className="flex min-h-11 items-center gap-2 text-sm">
                          <Checkbox checked={Boolean(media)} disabled={isWithdrawn} onCheckedChange={(value) => toggleMedia(asset.id, value === true)} aria-label={`${copy.mediaLabel}: ${asset.label}`} />
                          <span className="min-w-0 flex-1 truncate">{asset.label}</span>
                          {media?.redacted ? <span className="text-xs text-muted-foreground">{copy.previewRedacted}</span> : null}
                        </label>
                        {media ? (
                          <div className="ml-7 space-y-2">
                            <p className="break-all text-xs text-muted-foreground">{asset.filename} · {asset.mimeType} · {asset.size} bytes</p>
                            <div className="space-y-1.5">
                              <Label htmlFor={`release-caption-${media.id}`}>{copy.captionLabel}</Label>
                              <Textarea id={`release-caption-${media.id}`} value={media.caption} disabled={isWithdrawn} onChange={(event) => updateMedia(media.id, { caption: event.target.value })} className="min-h-16" />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor={`release-alt-${media.id}`}>{copy.altTextLabel} ({draft.activeLocale})</Label>
                              <Textarea id={`release-alt-${media.id}`} value={media.altTextByLocale[draft.activeLocale]?.text ?? ''} disabled={isWithdrawn} onChange={(event) => updateAltText(media.id, event.target.value)} className="min-h-16" />
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <label className="flex min-h-11 items-center gap-2 text-sm">
                                <Checkbox aria-label={`${copy.altTextReview}: ${asset.label}`} checked={media.altTextByLocale[draft.activeLocale]?.reviewed === true} disabled={isWithdrawn} onCheckedChange={(value) => markAltReviewed(media.id, value === true)} />
                                <span>{copy.altTextReview}</span>
                              </label>
                              <label className="flex min-h-11 items-center gap-2 text-sm">
                                <Checkbox aria-label={`${copy.redactLabel}: ${asset.label}`} checked={media.redacted} disabled={isWithdrawn} onCheckedChange={(value) => updateMedia(media.id, { redacted: value === true })} />
                                <ShieldOff className="h-4 w-4" aria-hidden="true" />
                                <span>{copy.redactLabel}</span>
                              </label>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-lg border p-3 space-y-3" aria-labelledby="release-draft-preview-heading">
              <div>
                <h3 id="release-draft-preview-heading" className="text-sm font-semibold">{copy.previewLabel}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{copy.previewDescription}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-md bg-emerald-500/5 p-3 text-sm">
                  <h4 className="font-medium">{copy.previewIncluded}</h4>
                  <dl className="mt-2 space-y-2 text-xs">
                    <div><dt className="font-medium">{copy.previewPurpose}</dt><dd>{copy.purposeOptions[draft.purpose]}</dd></div>
                    <div><dt className="font-medium">{copy.previewAudience}</dt><dd>{copy.audienceOptions[draft.audience]}</dd></div>
                    {includedArtifacts.map((artifact) => (
                      <div key={artifact.id} className="border-t pt-2"><dt className="font-medium">{copy.artifactsLabel}: {artifact.label}</dt><dd className="break-all">{copy.previewArtifactSource}: {artifact.sourceId}<br />{copy.previewArtifactProvenance}: {artifact.provenance}</dd></div>
                    ))}
                    {draft.selectedFields.length > 0 ? draft.selectedFields.map((field) => (
                      <div key={field} className="border-t pt-2"><dt className="font-medium">{copy.fieldLabels[field]}</dt><dd>{copy.previewFieldValue}: {fieldValues[field]}</dd></div>
                    )) : <div className="border-t pt-2"><dd>{copy.previewNoFields}</dd></div>}
                    {draft.media.filter((media) => !media.redacted).map((media) => {
                      const review = media.altTextByLocale[draft.activeLocale];
                      return <div key={media.id} className="border-t pt-2"><dt className="font-medium">{copy.previewMediaDetails}: {media.label}</dt><dd className="break-all">{media.filename} · {media.mimeType} · {media.byteSize} bytes<br />{copy.previewAltText}: {review?.text || copy.notRecorded}<br />{copy.previewCaptionOmitted}</dd></div>;
                    })}
                    {draft.media.filter((media) => !media.redacted).length === 0 ? <div className="border-t pt-2"><dd>{copy.previewNoMedia}</dd></div> : null}
                  </dl>
                </div>
                <div className="rounded-md bg-muted/40 p-3 text-sm">
                  <h4 className="font-medium">{copy.previewOmitted}</h4>
                  <ul className="mt-2 space-y-2 text-xs">
                    {draft.artifacts.filter((artifact) => !includedArtifacts.some((included) => included.id === artifact.id)).map((artifact) => (
                      <li key={artifact.id}>{artifact.label}: {bragCardAvailable ? copy.previewNotSelected : copy.artifactNeedsSource}</li>
                    ))}
                    {RELEASE_DRAFT_FIELDS.filter((field) => !draft.selectedFields.includes(field)).map((field) => (
                      <li key={field}>{copy.fieldLabels[field]}: {draft.redactedFields.includes(field) ? copy.previewRedacted : fieldAvailability[field] ? copy.previewNotSelected : copy.fieldUnavailable}</li>
                    ))}
                    {imageAssets.filter((asset) => !draft.media.some((media) => media.assetId === asset.id)).map((asset) => (
                      <li key={asset.id}>{asset.filename} · {asset.mimeType} · {asset.size} bytes: {copy.previewNotSelected}</li>
                    ))}
                    {draft.media.filter((media) => media.redacted).map((media) => (
                      <li key={media.id}>{media.filename} · {media.mimeType} · {media.byteSize} bytes: {copy.previewRedacted}</li>
                    ))}
                    {draft.media.filter((media) => !media.redacted).length > 0 ? <li>{copy.previewCaptionOmitted}</li> : null}
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-lg border p-3 space-y-3" aria-labelledby="release-draft-review-heading">
              <div className="flex items-center justify-between gap-2">
                <h3 id="release-draft-review-heading" className="text-sm font-semibold">{copy.reviewLabel}</h3>
                <span className="text-xs text-muted-foreground">{isWithdrawn ? copy.withdrawn : draft.status === 'handed-off' ? copy.handoffPrepared : draft.status === 'unknown' ? copy.handoffUnknown : copy.notReviewed}</span>
              </div>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <Checkbox aria-label={draft.review.status === 'reviewed' ? copy.reviewed : copy.notReviewed} checked={draft.review.status === 'reviewed'} disabled={isWithdrawn} onCheckedChange={(value) => saveDraft(setReleaseDraftReview(draft, value === true))} />
                <span>{draft.review.status === 'reviewed' ? copy.reviewed : copy.notReviewed}</span>
              </label>
              <p className="text-xs text-muted-foreground">{isWithdrawn ? copy.withdrawnHint : copy.reviewHint}</p>
            </section>

            <div className={`rounded-lg border p-3 text-sm ${validation?.ok ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5'}`} aria-live="polite">
              <div className="flex items-start gap-2">
                {validation?.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" aria-hidden="true" />}
                <div>
                  <p className="font-medium">{copy.validateLabel}: {validation?.ok ? copy.ready : copy.needsReview}</p>
                  {!validation?.ok && <p className="mt-1 break-words text-xs text-muted-foreground">{validation?.issues.join(' · ')}</p>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" className="min-h-11" onClick={copyHandoff} disabled={!validation?.ok || isWithdrawn} data-testid="release-draft-copy-handoff">
                <ClipboardCopy className="mr-2 h-4 w-4" aria-hidden="true" />
                {copy.copyHandoff}
              </Button>
              <Button type="button" variant="outline" className="min-h-11" onClick={withdraw} disabled={isWithdrawn} data-testid="release-draft-withdraw">
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                {copy.withdraw}
              </Button>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <Button type="button" variant="outline" className="min-h-11 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)} data-testid="release-draft-delete">
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  {copy.delete}
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{copy.deleteTitle}</DialogTitle>
                    <DialogDescription>{copy.deleteDescription}</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button type="button" variant="outline" className="min-h-11" onClick={() => setDeleteOpen(false)}>{copy.deleteCancel}</Button>
                    <Button type="button" variant="destructive" className="min-h-11" onClick={deleteDraft}>{copy.deleteConfirm}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {draft.withdrawnAt ? <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />{copy.withdrawn}</p> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
