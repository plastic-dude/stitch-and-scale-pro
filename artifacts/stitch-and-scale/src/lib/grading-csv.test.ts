import { describe, expect, it } from 'vitest';
import { buildGradingCsv } from './grading-csv';
import type { GradingResult } from './grading-engine';

const result: GradingResult = [
  {
    sectionId: 'body',
    sectionName: 'Body, main',
    measurements: [
      {
        measurementId: 'bust',
        label: 'Chest circumference',
        measurementType: 'circumference',
        gradingKey: 'bust',
        gradedValues: [
          { size: 'XS', physicalValue: 36, stitchCount: 108, exactStitchCount: 108 },
          { size: 'S', physicalValue: 40, stitchCount: 120, rowCount: 180, exactStitchCount: 120, exactRowCount: 180 },
          { size: 'M', physicalValue: 42.25, stitchCount: 127, rowCount: 190, exactStitchCount: 127, exactRowCount: 190 },
        ],
      },
    ],
  },
];

describe('buildGradingCsv', () => {
  it('preserves a 40-inch physical measurement in the exported row', () => {
    const csv = buildGradingCsv(result, 'in');
    const physicalLine = csv.split('\n').find((line) => line.includes('Physical (in)'));
    expect(physicalLine).toContain(',36,40,42.25,');
    expect(physicalLine).not.toContain(',4,');
  });

  it('escapes section and measurement labels and emits rows when present', () => {
    const csv = buildGradingCsv(result, 'in');
    expect(csv).toContain('"Body, main","Chest circumference",Stitches');
    expect(csv).toContain('"Body, main","Chest circumference",Rows');
  });
});
