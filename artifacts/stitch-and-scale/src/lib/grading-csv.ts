import { ALL_SIZES, type GradingResult, type MeasurementUnit } from '@/lib/grading-engine';

function csvCell(value: string | number | undefined): string {
  const text = value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function quotedCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Serialize graded measurements without reconstructing values from display text. */
export function buildGradingCsv(
  results: GradingResult,
  unit: MeasurementUnit = 'in',
  copy?: { section: string; measurement: string; property: string; stitches: string; rows: string; physical: (u: string) => string }
): string {
  const c = copy || {
    section: 'Section',
    measurement: 'Measurement',
    property: 'Property',
    stitches: 'Stitches',
    rows: 'Rows',
    physical: (u) => `Physical (${u})`
  };

  const lines = [`${c.section},${c.measurement},${c.property},${ALL_SIZES.join(',')}`];

  for (const section of results) {
    for (const measurement of section.measurements) {
      const valueForSize = (size: typeof ALL_SIZES[number]) =>
        measurement.gradedValues.find((value) => value.size === size);
      const prefix = `${quotedCell(section.sectionName)},${quotedCell(measurement.label)}`;
      const stitches = ALL_SIZES.map((size) => csvCell(valueForSize(size)?.stitchCount)).join(',');
      lines.push(`${prefix},${c.stitches},${stitches}`);

      if (measurement.gradedValues.some((value) => value.rowCount !== undefined)) {
        const rows = ALL_SIZES.map((size) => csvCell(valueForSize(size)?.rowCount)).join(',');
        lines.push(`${prefix},${c.rows},${rows}`);
      }

      // Keep the numeric physicalValue from grading-engine as-is apart from its
      // existing model precision. Never parse or truncate the display label.
      const physical = ALL_SIZES.map((size) => csvCell(valueForSize(size)?.physicalValue)).join(',');
      lines.push(`${prefix},${c.physical(unit)},${physical}`);
    }
  }

  return `${lines.join('\n')}\n`;
}
