import { describe, expect, it } from 'vitest';
import type { PatternProject } from './grading-engine';
import {
  RELEASE_DRAFT_LOCALES,
  buildReleaseDraftHandoffText,
  createReleaseDraft,
  normalizeReleaseDraft,
  recordReleaseHandoff,
  resolveLocalMediaSelection,
  setReleaseDraftReview,
  validateReleaseDraft,
  withdrawReleaseDraft,
  type ReleaseDraft,
} from './release-draft';

const now = '2026-08-24T12:00:00.000Z';

function makeDraft(): ReleaseDraft {
  const draft = createReleaseDraft({
    id: 'draft-1',
    projectId: 'project-1',
    title: 'A quiet cardigan release',
    activeLocale: 'en',
    purpose: 'portfolio',
    audience: 'private',
    now,
  });
  if (!draft) throw new Error('test fixture should create');
  return draft;
}

function makeProject(): PatternProject {
  return {
    id: 'project-1',
    name: 'A quiet cardigan',
    author: 'Maker',
    baseSize: 'M',
    gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' },
    sections: [],
    createdAt: now,
    updatedAt: now,
    assets: [
      {
        id: 'photo-1',
        type: 'image',
        label: 'Front view',
        filename: 'front.webp',
        mimeType: 'image/webp',
        size: 2048,
        dataUrl: 'data:image/webp;base64,AAAA',
        category: 'photo',
        createdAt: now,
        caption: 'The cardigan on a wooden chair',
      },
      {
        id: 'doc-1',
        type: 'document',
        label: 'Reference notes',
        filename: 'notes.txt',
        mimeType: 'text/plain',
        size: 12,
        dataUrl: 'data:text/plain;base64,AAAA',
        category: 'evidence',
        createdAt: now,
      },
    ],
  };
}

function reviewedDraft(): ReleaseDraft {
  const selection = resolveLocalMediaSelection(makeProject(), ['photo-1'], now);
  const media = selection.selected[0];
  if (!media) throw new Error('test fixture should select media');
  media.altTextByLocale.en = { text: 'A cream cardigan shown from the front on a chair.', reviewed: true, reviewedAt: now };
  const draft = {
    ...makeDraft(),
    artifacts: [{
      id: 'artifact-1',
      kind: 'brag-card' as const,
      sourceId: 'brag-card:project-1',
      label: 'Brag Card',
      provenance: 'Receipt Lab and Design Ledger for project-1',
      availability: 'available' as const,
      selectedAt: now,
    }],
    media: [media],
    selectedFields: ['title' as const],
  };
  return setReleaseDraftReview(draft, true, now);
}

describe('QUEUE-070 local release-draft contract', () => {
  it('keeps the no-photo path valid once an explicitly selected artifact is reviewed', () => {
    const draft = setReleaseDraftReview({
      ...makeDraft(),
      artifacts: [{
        id: 'artifact-1',
        kind: 'project-book',
        sourceId: 'project-book:project-1',
        label: 'Project Book',
        provenance: 'Selected project-book preview for project-1',
        availability: 'available',
        selectedAt: now,
      }],
      selectedFields: ['title'],
    }, true, now);

    const result = validateReleaseDraft(draft);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(draft.media).toHaveLength(0);
  });

  it('resolves only explicit local image selections and omits data URLs from the draft', () => {
    const result = resolveLocalMediaSelection(makeProject(), ['photo-1', 'doc-1', 'missing', 'photo-1'], now);

    expect(result.selected).toHaveLength(1);
    expect(result.selected[0]).toMatchObject({ assetId: 'photo-1', filename: 'front.webp', byteSize: 2048 });
    expect(result.selected[0]).not.toHaveProperty('dataUrl');
    expect(result.omitted).toEqual([
      { assetId: 'doc-1', code: 'not-local-image' },
      { assetId: 'missing', code: 'not-found' },
    ]);
  });

  it('requires separate user-reviewed alt text in the active locale for non-redacted media', () => {
    const draft = reviewedDraft();
    draft.activeLocale = 'de';
    const result = validateReleaseDraft(draft);

    expect(result.ok).toBe(false);
    expect(result.issues).toContain('media-alt-text-needs-review:photo-1:de');
  });

  it('does not require alt text for a deliberately redacted image and keeps source data untouched', () => {
    const project = makeProject();
    const draft = reviewedDraft();
    draft.media[0].redacted = true;
    const result = validateReleaseDraft(draft);

    expect(result.ok).toBe(true);
    expect(project.assets?.[0].dataUrl).toBe('data:image/webp;base64,AAAA');
    expect(draft.media[0].redacted).toBe(true);
  });

  it('fills missing locale review entries as unreviewed and has exact five-locale coverage', () => {
    const draft = normalizeReleaseDraft({
      ...reviewedDraft(),
      media: [{
        ...reviewedDraft().media[0],
        altTextByLocale: { en: { text: 'Reviewed in English', reviewed: true, reviewedAt: now } },
      }],
    });

    expect(draft).not.toBeNull();
    expect(Object.keys(draft!.media[0].altTextByLocale).sort()).toEqual([...RELEASE_DRAFT_LOCALES].sort());
    expect(draft!.media[0].altTextByLocale.fr).toEqual({ text: '', reviewed: false, reviewedAt: undefined });
  });

  it('fails closed for unknown versions, malformed artifacts, and external references', () => {
    expect(normalizeReleaseDraft({ ...makeDraft(), version: 2 })).toBeNull();
    expect(validateReleaseDraft({
      ...reviewedDraft(),
      artifacts: [{ ...reviewedDraft().artifacts[0], sourceId: 'https://example.invalid/card.png' }],
    }).issues).toContain('external-artifact-reference');
    expect(normalizeReleaseDraft({ ...makeDraft(), artifacts: [{}] })).toBeNull();
  });

  it('rejects conflicting selected and redacted fields rather than silently choosing one', () => {
    const result = validateReleaseDraft(setReleaseDraftReview({
      ...reviewedDraft(),
      redactedFields: ['title'],
    }, true, now));

    expect(result.ok).toBe(false);
    expect(result.issues).toContain('selected-field-redacted');
  });

  it('rejects an artifact that is only needs-review or missing instead of treating it as handoff-ready', () => {
    const draft = setReleaseDraftReview({
      ...reviewedDraft(),
      artifacts: [{ ...reviewedDraft().artifacts[0], availability: 'needs-review' }],
    }, true, now);
    const result = validateReleaseDraft(draft);

    expect(result.ok).toBe(false);
    expect(result.issues).toContain('artifact-needs-review');
  });

  it('includes selected field values in the handoff payload and does not include unselected or redacted fields', () => {
    const draft = setReleaseDraftReview({
      ...reviewedDraft(),
      selectedFields: ['title', 'gauge'],
      redactedFields: ['author'],
    }, true, now);
    const text = buildReleaseDraftHandoffText(draft, {
      purpose: 'Purpose',
      audience: 'Audience',
      artifacts: 'Artifacts:',
      fields: 'Fields:',
      fieldLabel: (field) => field,
      reviewedMedia: 'Media:',
      preparedNote: 'Prepared locally.',
    }, {
      title: 'A quiet cardigan',
      gauge: '20 stitches × 28 rows / 4 in',
      author: 'Maker',
    });

    expect(text).toContain('Fields:');
    expect(text).toContain('- title: A quiet cardigan');
    expect(text).toContain('- gauge: 20 stitches × 28 rows / 4 in');
    expect(text).not.toContain('Maker');
  });

  it('records resolved clipboard/share outcomes as handoff and cancelled or denied outcomes as unknown', () => {
    const prepared = reviewedDraft();
    const handedOff = recordReleaseHandoff(prepared, 'clipboard', 'resolved', now, 'Clipboard request resolved.');
    expect(handedOff.status).toBe('handed-off');
    expect(handedOff.handoffs.clipboard?.state).toBe('handed-off');

    const unknown = recordReleaseHandoff(handedOff, 'native-share', 'cancelled', now, 'The share sheet was cancelled.');
    expect(unknown.status).toBe('unknown');
    expect(unknown.handoffs['native-share']?.state).toBe('unknown');
  });

  it('treats download and print requests as unknown rather than saved or published', () => {
    const draft = reviewedDraft();
    const afterPrint = recordReleaseHandoff(draft, 'print', 'resolved', now, 'Print dialog requested; save result is not observable.');
    expect(afterPrint.status).toBe('handed-off');

    const afterDownload = recordReleaseHandoff(afterPrint, 'download', 'unknown', now, 'Download request outcome is not observable.');
    expect(afterDownload.status).toBe('unknown');
    expect(afterDownload.handoffs.download?.note).toContain('not observable');
  });

  it('marks local withdrawal as unknown and requires a new review before a future handoff', () => {
    const withdrawn = withdrawReleaseDraft(reviewedDraft(), now);
    expect(withdrawn.withdrawnAt).toBe(now);
    expect(withdrawn.status).toBe('unknown');
    expect(validateReleaseDraft(withdrawn).issues).toContain('draft-withdrawn');
  });

  it('formats only reviewed, non-redacted local content for explicit clipboard handoff', () => {
    const draft = reviewedDraft();
    draft.media[0].caption = 'Private caption that is not copied yet';
    const text = buildReleaseDraftHandoffText(draft);

    expect(text).toContain('A quiet cardigan release');
    expect(text).toContain('Brag Card');
    expect(text).toContain('A cream cardigan shown from the front on a chair.');
    expect(text).not.toContain('Private caption that is not copied yet');
    expect(text).toContain('no platform delivery is claimed');

    draft.media[0].redacted = true;
    expect(buildReleaseDraftHandoffText(draft)).not.toContain('A cream cardigan shown from the front on a chair.');
  });
});
