import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { generateId, type PatternProject } from './grading-engine';
import { prepareMcpBragCardExport, prepareMcpProjectBookExport } from './mcp-artifact-workflow';

function project(name: string): PatternProject {
  return {
    id: generateId(), name, author: 'Designer', baseSize: 'M',
    gauge: { stitchesPer4In: 18, rowsPer4In: 24, unit: 'in' },
    sections: [{ id: 'body', name: 'Body', measurements: [{ id: 'bust', label: 'Bust', measurementType: 'circumference', gradingKey: 'bust', baseValue: 39 }] }],
    createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(), description: 'A supplied project snapshot.',
  };
}

describe('MCP artifact workflow', () => {
  it('requires approval before creating a combined Project Book', async () => {
    const result = await prepareMcpProjectBookExport({ projects: [project('Week 1'), project('Week 2')], filename: '../year?.pdf' });
    expect(result).toMatchObject({ ready: false, requiresUserApproval: true, projectCount: 2 });
    expect(JSON.stringify(result)).not.toContain('base64');
  });

  it('creates one parseable PDF with explicit project provenance after approval', async () => {
    const first = project('Week 1');
    const second = project('Week 2');
    const result = await prepareMcpProjectBookExport({ projects: [first, second], userApproved: true, title: '52 Week Catalogue', filename: '../52 Weeks?.PDF', locale: 'en' });
    expect(result.ready).toBe(true);
    if (!result.ready) throw new Error('Project Book was not returned');
    expect(result.artifact.filename).toBe('52-weeks.pdf');
    expect(result.artifact.projectIds).toEqual([first.id, second.id]);
    expect(result.artifact.projectRevisions).toEqual([first.updatedAt, second.updatedAt]);
    expect(Buffer.from(result.data, 'base64').byteLength).toBe(result.artifact.byteLength);
    const parsed = await PDFDocument.load(Buffer.from(result.data, 'base64'));
    expect(parsed.getPageCount()).toBeGreaterThan(2);
  });

  it('rejects missing project lists before artifact generation', async () => {
    const result = await prepareMcpProjectBookExport({ projects: [], userApproved: true });
    expect('valid' in result).toBe(true);
    if ('valid' in result) expect(result.valid).toBe(false);
  });

  it('computes Brag Card facts from the supplied ledger and returns a branded SVG only after approval', async () => {
    const card = { studioName: 'Moss Studio', currency: 'USD', publishedCount: 4, salesCount: 3, template: 'income', style: 'editorial', ledger: [{ month: '2026-01', revenue: 100, salesCount: 2, profit: 60 }, { month: '2026-02', revenue: 50, salesCount: 1, profit: 20 }] };
    const pending = await prepareMcpBragCardExport({ card, filename: 'moss?.svg' });
    expect(pending).toMatchObject({ ready: false, requiresUserApproval: true });
    const result = await prepareMcpBragCardExport({ card, userApproved: true, filename: 'moss?.svg', accent: '#b65b50', branding: { studioName: 'Moss Studio', copyrightNotice: '© Moss' }, locale: 'en' });
    expect(result.ready).toBe(true);
    if (!result.ready) throw new Error('Brag Card was not returned');
    expect(result.artifact.filename).toBe('moss.svg');
    expect(result.artifact.calculatedFacts).toMatchObject({ totalRevenue: 150, totalSales: 3, totalProfit: 80, publishedCount: 4 });
    const svg = Buffer.from(result.data, 'base64').toString('utf8');
    expect(svg).toContain('Moss Studio');
    expect(svg).toContain('<svg');
  });
});
