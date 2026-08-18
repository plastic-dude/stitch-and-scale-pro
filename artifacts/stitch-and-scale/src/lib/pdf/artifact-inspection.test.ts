import { describe, expect, it } from 'vitest';
import { inspectPublicationArtifact } from './artifact-inspection';

describe('publication artifact inspection', () => {
  it('blocks an empty rendered artifact', () => {
    const result = inspectPublicationArtifact('');
    expect(result.readyForReview).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'A-001' && issue.severity === 'error')).toBe(true);
  });

  it('accepts a titled structured artifact for review', () => {
    const html = '<title>Pattern</title><h1>Pattern</h1><h2>Gauge</h2><table><tr><th>Size</th></tr></table><img alt="Logo">';
    const result = inspectPublicationArtifact(html);
    expect(result.readyForReview).toBe(true);
    expect(result.headingCount).toBe(2);
    expect(result.tableCount).toBe(1);
    expect(result.imagesMissingAlt).toBe(0);
  });

  it('keeps image-alt and pagination findings visible as review issues', () => {
    const result = inspectPublicationArtifact('<h1>Pattern</h1><h2>Notes</h2><img src="logo.png">');
    expect(result.readyForReview).toBe(true);
    expect(result.issues.some((issue) => issue.code === 'A-004' && issue.severity === 'warn')).toBe(true);
    expect(result.issues.some((issue) => issue.code === 'A-006' && issue.severity === 'info')).toBe(true);
  });
});
