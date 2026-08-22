import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getWorkspaceCopy } from './workspace-copy';

const cardSource = readFileSync(new URL('../components/project-package-card.tsx', import.meta.url), 'utf8');
const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

describe('Publication Package artifact download contract', () => {
  it('does not present an unconditional or fabricated download action', () => {
    expect(cardSource).toContain('function getArtifactDownloadUrl(artifact: PublicationArtifact): string | null');
    expect(cardSource).toContain('download={art.filename}');
    expect(cardSource).toContain('disabled');
    expect(cardSource).toContain('publicationArtifactDownloadUnavailableDescription');
    expect(cardSource).toContain('publicationArtifactDownloadRequestedDescription');
    expect(cardSource).toContain('/^(?:blob:|data:|https?:)/i.test(url)');
  });

  it('keeps download request and unavailable-state copy complete in every locale', () => {
    const keys = [
      'publicationArtifactDownload',
      'publicationArtifactDownloadUnavailable',
      'publicationArtifactDownloadUnavailableDescription',
      'publicationArtifactDownloadRequested',
      'publicationArtifactDownloadRequestedDescription',
    ] as const;

    for (const locale of locales) {
      const copy = getWorkspaceCopy(locale);
      for (const key of keys) expect(copy[key], `${locale}.${key}`).toBeTruthy();
    }

    expect(getWorkspaceCopy('en').publicationArtifactDownloadUnavailableDescription).toContain('metadata only');
    expect(getWorkspaceCopy('en').publicationArtifactDownloadRequestedDescription).toContain('Check your downloads');
  });
});
