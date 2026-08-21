import { describe, expect, it } from 'vitest';
import { renderProjectBookDocument } from '@/lib/project-book-export';
import { buildPortfolio, type PortfolioSummary } from '@/lib/release-portfolio';
import type { PatternProject } from '@/lib/grading-engine';

function project(id: string, name: string, baseValue = 40): PatternProject {
  return {
    id,
    name,
    author: 'A Designer',
    baseSize: 'M',
    gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' },
    sections: [{
      id: `${id}-section`,
      name: 'Body',
      measurements: [{
        id: `${id}-measurement`, label: 'Bust', measurementType: 'circumference', gradingKey: 'bust', baseValue,
      }],
    }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-21T00:00:00.000Z',
    description: 'A tested pattern description.',
    yarnWeight: 'worsted',
  };
}

function summaryFor(projects: PatternProject[]): PortfolioSummary {
  return buildPortfolio(projects, {
    itemType: 'sweater', skillLevel: 'intermediate', marketTarget: 'standard',
    hoursWorked: 20, hourlyRate: 25, currentPrice: 8,
  });
}

describe('renderProjectBookDocument', () => {
  it('renders every project and preserves physical values in one print document', () => {
    const projects = [project('one', 'Forty Inch <Card>'), project('two', 'Second Pattern', 32)];
    const html = renderProjectBookDocument({
      title: 'My 2026 Project Book', projects, portfolio: summaryFor(projects),
      studio: { designerName: 'A Designer', studioName: 'North Loop Studio', website: '', socialHandle: '@northloop', copyrightNotice: '© 2026 North Loop' },
      locale: 'en', exportedAt: new Date('2026-08-21T00:00:00.000Z'),
    });

    expect(html).toContain('My 2026 Project Book');
    expect(html).toContain('Forty Inch &lt;Card&gt;');
    expect(html).toContain('Second Pattern');
    expect(html).toContain('40 in');
    expect(html).toContain('North Loop Studio');
    expect(html).toContain('@northloop');
    expect(html).toContain('2026');
    expect(html.match(/<section class="page project-page">/g)?.length).toBe(2);
  });

  it('escapes title, description, and identifiers instead of injecting markup', () => {
    const p = project('id-<unsafe>', '<script>alert(1)</script>');
    p.description = 'Description <strong>must remain text</strong>';
    const html = renderProjectBookDocument({ title: 'Book & <unsafe>', projects: [p], portfolio: summaryFor([p]) });

    expect(html).toContain('Book &amp; &lt;unsafe&gt;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('Description &lt;strong&gt;must remain text&lt;/strong&gt;');
  });
});
