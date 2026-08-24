import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(
  path.resolve(__dirname, 'release-draft-card.tsx'),
  'utf8',
);

describe('Release Draft review surface contracts', () => {
  it('shows the no-photo guidance once and keeps the artifact-only path explicit', () => {
    expect((source.match(/copy\.noPhoto/g) ?? []).length).toBe(1);
    expect(source).toContain('imageAssets.length === 0 ? (');
    expect(source).toContain('imageAssets.length === 0 ? null : (');
    expect(source).toContain('previewNoMedia');
  });

  it('makes artifact availability truthful and user-controlled instead of auto-selecting a zero-data preview', () => {
    expect(source).toContain('function hasBragCardSource(projectId: string): boolean');
    expect(source).toContain('const selectedArtifact = draft?.artifacts.some((artifact) => artifact.kind === \'brag-card\') ?? false;');
    expect(source).toContain('const toggleArtifact = (checked: boolean) =>');
    expect(source).toContain('disabled={isWithdrawn || (!bragCardAvailable && !selectedArtifact)}');
    expect(source).not.toContain('artifacts: [makeArtifact(project, copy.bragCardArtifact, now)]');
    expect(source).toContain('data-testid="release-draft-artifact-brag-card"');
  });

  it('exposes separate include and redact controls for every supported field', () => {
    expect(source).toContain('RELEASE_DRAFT_FIELDS.map((field) =>');
    expect(source).toContain('draft.selectedFields.includes(field)');
    expect(source).toContain('draft.redactedFields.includes(field)');
    expect(source).toContain('updateFieldMode(field, value === true ? \'include\' : \'omit\')');
    expect(source).toContain('updateFieldMode(field, value === true ? \'redact\' : \'omit\')');
    expect(source).toContain('aria-label={`${copy.includeField}: ${copy.fieldLabels[field]}`}');
    expect(source).toContain('aria-label={`${copy.redactField}: ${copy.fieldLabels[field]}`}');
  });

  it('keeps active-locale reviews separate and exposes the canonical five-language selector', () => {
    expect(source).toContain('LANGUAGE_OPTIONS.map((option)');
    expect(source).toContain('id="release-draft-locale"');
    expect(source).toContain('[draft.activeLocale]');
    expect(source).toContain('updateMetadata({ activeLocale: event.target.value as ReleaseDraftLocale })');
  });

  it('shows an exact included/omitted local preview with artifact provenance, field values, and media metadata', () => {
    expect(source).toContain('data-testid="release-draft-card"');
    expect(source).toContain('copy.previewArtifactSource');
    expect(source).toContain('copy.previewArtifactProvenance');
    expect(source).toContain('copy.previewFieldValue');
    expect(source).toContain('{asset.filename} · {asset.mimeType} · {asset.size} bytes');
    expect(source).toContain('media.byteSize} bytes');
    expect(source).toContain('copy.previewCaptionOmitted');
    expect(source).toContain('copy.previewRedacted');
  });

  it('gives every review and destructive control an explicit accessible name and touch target', () => {
    expect(source).toContain('aria-label={`${copy.altTextReview}: ${asset.label}`}');
    expect(source).toContain('aria-label={`${copy.redactLabel}: ${asset.label}`}');
    expect(source).toContain('aria-label={draft.review.status === \'reviewed\' ? copy.reviewed : copy.notReviewed}');
    expect(source).toContain('data-testid="release-draft-delete"');
    expect(source).toContain('className="min-h-11"');
    expect(source).toContain('DialogDescription>{copy.deleteDescription}</DialogDescription>');
  });

  it('keeps withdrawal terminal, separates local deletion, and avoids remote or platform write paths', () => {
    expect(source).toContain('const isWithdrawn = Boolean(draft?.withdrawnAt);');
    expect(source).toContain('disabled={!validation?.ok || isWithdrawn}');
    expect(source).toContain('disabled={isWithdrawn}');
    expect(source).toContain('{isWithdrawn ? copy.withdrawnHint : copy.reviewHint}');
    expect(source).toContain('projectHook.deleteReleaseDraft(draft.id);');
    expect(source).toContain('const withdraw = () =>');
    expect(source).not.toMatch(/fetch\s*\(/);
    expect(source).not.toMatch(/https?:\/\//);
    expect(source).not.toContain('MCP');
    expect(source).not.toContain('oauth');
  });
});
