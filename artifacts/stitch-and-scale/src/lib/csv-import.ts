import {
  PatternSection, SectionMeasurement, MeasurementType, GradingKey,
  RoundingParity, GRADING_KEY_LABELS, generateId,
} from './grading-engine';

// ─── CSV parsing ────────────────────────────────────────────────────────────
//
// Deliberately not a naive text.split(',').split('\n') - a designer editing
// this template in Excel or Google Sheets can easily end up with a comma
// inside a field (a label like "Sleeve, Long Cuff"), which any real
// spreadsheet app quotes automatically ("Sleeve, Long Cuff"). A naive split
// would silently corrupt that row instead of failing loudly, which is worse.
// This is a small, direct RFC4180-style parser: quoted fields, embedded
// commas inside quotes, and "" as an escaped quote character.

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  // Normalize line endings up front so \r\n from Excel/Windows and \n from
  // everything else behave identically.
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const next = normalized[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++; // skip the second quote of the escaped pair
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
  }
  // Final field/row, if the file doesn't end with a trailing newline
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop fully-blank trailing rows (a common artifact of spreadsheet exports)
  return rows.filter(r => r.some(cell => cell.trim().length > 0));
}

// ─── Template ───────────────────────────────────────────────────────────────

export const CSV_TEMPLATE_HEADERS = [
  'Section', 'Label', 'Type', 'Grading Key', 'Base Value',
  'Stitch Rounding', 'Stitch Multiple', 'Stitch Remainder',
  'Row Rounding', 'Row Multiple', 'Row Remainder',
] as const;

function csvField(value: string): string {
  // Quote any field that needs it (contains a comma, quote, or newline);
  // escape internal quotes by doubling them, per RFC4180.
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateCSVTemplate(): string {
  const exampleRows: string[][] = [
    ['Body', 'Bust Width', 'width', 'bust', '20', 'Exact', '', '', 'Exact', '', ''],
    ['Body', 'Waist Width', 'width', 'waist', '17', 'Exact', '', '', 'Exact', '', ''],
    ['Sleeve', 'Cuff Circumference', 'circumference', 'wrist', '8', 'Multiple', '6', '2', 'Exact', '', ''],
  ];
  const lines = [CSV_TEMPLATE_HEADERS.join(','), ...exampleRows.map(r => r.map(csvField).join(','))];
  return lines.join('\n');
}

// ─── Import validation ──────────────────────────────────────────────────────

export interface CSVImportRow {
  section: string;
  measurement: SectionMeasurement;
}

export interface CSVImportResult {
  rows: CSVImportRow[];
  errors: string[]; // one entry per row that failed, human-readable, references the row number
}

const VALID_TYPES: MeasurementType[] = ['width', 'circumference', 'length', 'direct'];
const VALID_GRADING_KEYS = Object.keys(GRADING_KEY_LABELS) as GradingKey[];
const VALID_ROUNDING_MODES = ['exact', 'multiple', 'even', 'odd'];

export function parseMeasurementsCSV(text: string): CSVImportResult {
  const allRows = parseCSV(text);
  const errors: string[] = [];

  if (allRows.length === 0) {
    return { rows: [], errors: ['The file is empty.'] };
  }

  const header = allRows[0].map(h => h.trim().toLowerCase());
  const expectedHeader = CSV_TEMPLATE_HEADERS.map(h => h.toLowerCase());
  const headerMatches = expectedHeader.every((h, i) => header[i] === h);
  if (!headerMatches) {
    return {
      rows: [],
      errors: [`Column headers don't match the template. Expected: ${CSV_TEMPLATE_HEADERS.join(', ')}`],
    };
  }

  const dataRows = allRows.slice(1);
  const result: CSVImportRow[] = [];

  dataRows.forEach((cells, idx) => {
    const rowNum = idx + 2; // +1 for header, +1 for 1-indexing
    const [section, label, typeRaw, keyRaw, baseValueRaw, stitchRoundRaw, stitchMultRaw, stitchRemRaw, rowRoundRaw, rowMultRaw, rowRemRaw] =
      cells.map(c => c.trim());

    if (!section) { errors.push(`Row ${rowNum}: missing Section.`); return; }
    if (!label) { errors.push(`Row ${rowNum}: missing Label.`); return; }

    const type = typeRaw.toLowerCase() as MeasurementType;
    if (!VALID_TYPES.includes(type)) {
      errors.push(`Row ${rowNum}: "${typeRaw}" isn't a valid Type. Use one of: ${VALID_TYPES.join(', ')}.`);
      return;
    }

    const gradingKey = keyRaw as GradingKey;
    if (type !== 'direct' && !VALID_GRADING_KEYS.includes(gradingKey)) {
      errors.push(`Row ${rowNum}: "${keyRaw}" isn't a valid Grading Key.`);
      return;
    }

    const baseValue = parseFloat(baseValueRaw);
    if (Number.isNaN(baseValue)) {
      errors.push(`Row ${rowNum}: "${baseValueRaw}" isn't a valid number for Base Value.`);
      return;
    }

    const parseRounding = (
      modeRaw: string, multRaw: string, remRaw: string, label: 'Stitch' | 'Row'
    ): { repeat?: number; parity?: RoundingParity; remainder?: number } | null => {
      const mode = (modeRaw || 'exact').toLowerCase();
      if (!VALID_ROUNDING_MODES.includes(mode)) {
        errors.push(`Row ${rowNum}: "${modeRaw}" isn't a valid ${label} Rounding. Use Exact, Multiple, Even, or Odd.`);
        return null;
      }
      if (mode === 'multiple') {
        const n = parseInt(multRaw, 10);
        if (!multRaw || Number.isNaN(n) || n < 1) {
          errors.push(`Row ${rowNum}: ${label} Rounding is "Multiple" but ${label} Multiple isn't a valid number.`);
          return null;
        }
        // Remainder is optional even in Multiple mode - blank means a plain
        // multiple (remainder 0), not an error.
        let remainder: number | undefined;
        if (remRaw) {
          remainder = parseInt(remRaw, 10);
          if (Number.isNaN(remainder) || remainder < 0 || remainder >= n) {
            errors.push(`Row ${rowNum}: ${label} Remainder must be a number from 0 to ${n - 1}.`);
            return null;
          }
        }
        return { repeat: n, remainder };
      }
      if (mode === 'even' || mode === 'odd') return { parity: mode as RoundingParity };
      return {};
    };

    const stitchRounding = parseRounding(stitchRoundRaw, stitchMultRaw, stitchRemRaw, 'Stitch');
    if (stitchRounding === null) return;
    const rowRounding = parseRounding(rowRoundRaw, rowMultRaw, rowRemRaw, 'Row');
    if (rowRounding === null) return;

    result.push({
      section,
      measurement: {
        id: generateId(),
        label,
        measurementType: type,
        gradingKey: type === 'direct' ? 'bust' : gradingKey, // gradingKey unused for 'direct', but the field is required by the type
        baseValue,
        stitchRepeat: stitchRounding.repeat,
        stitchParity: stitchRounding.parity,
        stitchRemainder: stitchRounding.remainder,
        rowRepeat: rowRounding.repeat,
        rowParity: rowRounding.parity,
        rowRemainder: rowRounding.remainder,
      },
    });
  });

  return { rows: result, errors };
}

/** Groups flat CSV rows into PatternSection[] in the order sections first appear. */
export function groupIntoSections(rows: CSVImportRow[]): PatternSection[] {
  const sectionOrder: string[] = [];
  const bySection = new Map<string, SectionMeasurement[]>();

  for (const { section, measurement } of rows) {
    if (!bySection.has(section)) {
      bySection.set(section, []);
      sectionOrder.push(section);
    }
    bySection.get(section)!.push(measurement);
  }

  return sectionOrder.map(name => ({
    id: generateId(),
    name,
    measurements: bySection.get(name)!,
  }));
}
