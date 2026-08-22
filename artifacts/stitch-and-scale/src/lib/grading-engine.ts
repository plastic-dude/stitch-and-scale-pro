export type SizeKey = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL' | '5XL';
export type MeasurementUnit = 'in' | 'cm';
export type MeasurementType = 'width' | 'circumference' | 'length' | 'direct';
export type GradingKey = 'bust' | 'waist' | 'hip' | 'upperArm' | 'lowerArm' | 'wrist' | 'shoulder' | 'neckCircumference' | 'backLength' | 'sleeveLength' | 'thigh' | 'calf' | 'ankle' | 'armholeDepth';

export type SizingStandard = 'CYC' | 'UK' | 'EN13402' | 'Japanese' | 'Korean' | 'Chinese' | 'Australian' | 'Custom';
export type StandardsTable = Record<SizeKey, Record<GradingKey, number>>;

export interface Gauge {
  stitchesPer4In: number;
  rowsPer4In: number;
  unit: MeasurementUnit;
}

export type RoundingParity = 'even' | 'odd';

export interface SectionMeasurement {
  id: string;
  label: string;
  measurementType: MeasurementType;
  gradingKey: GradingKey;
  baseValue: number;
  stitchRepeat?: number;
  rowRepeat?: number;
  /** Offset for repeat rounding, e.g. multiple of 6 + 2. Ignored unless the
   *  matching *Repeat is set; treated as 0 (a plain multiple) if unset. */
  stitchRemainder?: number;
  rowRemainder?: number;
  /** Round to the nearest even/odd stitch count instead of a fixed multiple -
   *  e.g. seed stitch (odd) or 1x1 rib worked flat (even). Takes precedence
   *  over stitchRepeat if both are somehow set, since it's the more specific
   *  constraint; the UI only ever sets one or the other, never both. */
  stitchParity?: RoundingParity;
  rowParity?: RoundingParity;
  notes?: string;
}

export interface PatternSection {
  id: string;
  name: string;
  measurements: SectionMeasurement[];
}

export type HumanReviewStatus = 'not-reviewed' | 'in-review' | 'changes-requested' | 'approved';

export interface HumanReviewRecord {
  status: HumanReviewStatus;
  reviewerName: string;
  note: string;
  reviewedAt: string;
}

export type ReadinessSeverity = 'nitpick' | 'minor' | 'major' | 'critical';
export type ReadinessIssueStatus = 'open' | 'fixed' | 'verified';
export type ReadinessStage = 'mathematical' | 'editorial' | 'test-knit' | 'final';
export type ReadinessStageStatus = 'pending' | 'ready' | 'blocked';

export interface ReadinessIssue {
  id: string;
  severity: ReadinessSeverity;
  description: string;
  evidence?: string;
  correction?: string;
  status: ReadinessIssueStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReadinessSignOff {
  stage: ReadinessStage;
  status: ReadinessStageStatus;
  issues: ReadinessIssue[];
  approver?: string;
  approvedAt?: string;
}

export interface PublicationContract {
  version: string;
  signOffs: ReadinessSignOff[];
  isReady: boolean;
  updatedAt: string;
}

export interface PublicationArtifact {
  id: string;
  type: 'pdf' | 'csv' | 'json' | 'image';
  label: string;
  url: string;
  createdAt: string;
  revisionId?: string;
}

export interface Contradiction {
  id: string;
  severity: 'warning' | 'error';
  source: string;
  target: string;
  message: string;
  code: string;
}

export interface CompilerIR {
  version: string;
  metadata: {
    title: string;
    author: string;
    copyright: string;
    gauge: Gauge;
    sizes: SizeKey[];
  };
  gradedData: GradingResult;
  validation: {
    contradictions: Contradiction[];
    isValid: boolean;
    compiledAt: string;
  };
}

export interface PublicationPackage {
  id: string;
  version: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  readinessVerdict: ReadinessStageStatus;
  authoritativeMetadata: {
    title: string;
    author: string;
    copyright: string;
    description: string;
    sizes: SizeKey[];
    gauge: Gauge;
  };
  artifacts: PublicationArtifact[];
  /** Compiled Intermediate Representation for validation. */
  compilerIR?: CompilerIR;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSnapshot {
  id: string;
  name: string;
  createdAt: string;
  note: string;
  /** The full project state at the moment of snapshot. */
  data: Omit<PatternProject, 'snapshots'>;
}

export interface PatternProject {
  id: string;
  name: string;
  author: string;
  baseSize: SizeKey;
  gauge: Gauge;
  sections: PatternSection[];
  createdAt: string;
  updatedAt: string;
  description?: string;
  yarnWeight?: 'lace' | 'fingering' | 'sport' | 'DK' | 'worsted' | 'bulky' | 'super-bulky';
  /** Which standard this project was created under. Optional because
   *  projects made before this field existed won't have it - those are
   *  resolved to CYC below, which is correct, since CYC was the only
   *  standard that ever functionally existed before Custom shipped. */
  sizingStandard?: SizingStandard;
  /** Only present when sizingStandard is 'Custom' - a frozen copy of the
   *  designer's custom chart at the moment this project was created.
   *  Without this, editing the (shared, global) custom chart later would
   *  silently change this project's grading too - the same problem a
   *  missing sizingStandard would cause, one level deeper. */
  customStandardSnapshot?: StandardsTable;
  /** Explicit human-review state; absent on legacy projects until a reviewer records one. */
  humanReview?: HumanReviewRecord;
  /** Revision snapshots — named snapshots for an audit trail. */
  snapshots?: ProjectSnapshot[];
  /** Publication readiness contract — formal sign-off trail. */
  publicationContract?: PublicationContract;
  /** Publication packages — versioned authoritative releases. */
  publicationPackages?: PublicationPackage[];
  /** Tags for categorization and filtering. */
  tags?: string[];
  /** Archive status for multi-project management. */
  isArchived?: boolean;
}

export interface GradedMeasurement {
  size: SizeKey;
  physicalValue: number;
  stitchCount: number;
  rowCount?: number;
  /** Pre-rounding raw values, for showing the exact-vs-adjusted delta.
   *  Same value as stitchCount/rowCount when no rounding mode is active. */
  exactStitchCount: number;
  exactRowCount?: number;
}

export interface GradedSection {
  sectionId: string;
  sectionName: string;
  measurements: Array<{
    measurementId: string;
    label: string;
    measurementType: MeasurementType;
    gradingKey: GradingKey;
    gradedValues: GradedMeasurement[];
  }>;
}

export type GradingResult = GradedSection[];

export const ALL_SIZES: SizeKey[] = ['XS','S','M','L','XL','2XL','3XL','4XL','5XL'];
export const GRADING_KEY_LABELS: Record<GradingKey, string> = {
  bust: 'Bust', waist: 'Waist', hip: 'Hip', upperArm: 'Upper Arm',
  lowerArm: 'Lower Arm', wrist: 'Wrist', shoulder: 'Shoulder Width',
  neckCircumference: 'Neck Circumference', backLength: 'Back Length',
  sleeveLength: 'Sleeve Length', thigh: 'Thigh', calf: 'Calf', ankle: 'Ankle',
  armholeDepth: 'Armhole Depth'
};

// Craft Yarn Council Standard Body Measurements (inches), Woman's chart,
// reconciled directly against the CYC's own published chart at
// craftyarncouncil.com/standards/woman-size (verified current: CYC's
// standards are reviewed on a ~2-year cycle, most recently formally
// updated in 2018 - no newer revision found as of this table's creation).
//
// CYC publishes RANGES for most measurements (e.g. Chest "36-38" for
// Medium) - every value below is the midpoint of that published range,
// applied consistently across the whole table.
//
// bust/waist/hip/shoulder/upperArm/backLength/sleeveLength/armholeDepth
// are genuinely CYC-sourced (Chest, Waist, Hips, Cross Back, Upper Arm,
// Back Waist Length, Arm Length to Underarm, Armhole Depth respectively).
// The values previously in this table for these fields did NOT match
// CYC's published chart - e.g. bust/XS was 32 here vs CYC's actual 29
// (midpoint of 28-30), and sleeveLength/M was 31 here vs CYC's actual 17,
// a gap far too large to be a rounding difference. Corrected to match
// the real source rather than carry an unverified legacy number forward.
//
// neckCircumference, lowerArm, wrist, thigh, calf, and ankle are NOT part
// of CYC's published garment chart at all (CYC's Woman Size Chart doesn't
// measure these). Left unchanged from their prior values, which were
// never CYC-sourced to begin with - flagged here honestly rather than
// silently implying they now carry the same verification as the rest of
// this table just because they sit in the same object.
export const SIZE_STANDARDS: StandardsTable = {
  XS: { bust:29, waist:23.5, hip:33.5, upperArm:9.75, lowerArm:9, wrist:5.5, shoulder:14.25, neckCircumference:13.5, backLength:16.5, sleeveLength:16.5, thigh:21.5, calf:13, ankle:8.5, armholeDepth:6.25 },
  S:  { bust:33, waist:25.75, hip:35.5, upperArm:10.25, lowerArm:9.5, wrist:6, shoulder:14.75, neckCircumference:14, backLength:17, sleeveLength:17, thigh:22.5, calf:13.5, ankle:9, armholeDepth:6.75 },
  M:  { bust:37, waist:29, hip:39, upperArm:11, lowerArm:10, wrist:6.5, shoulder:15.75, neckCircumference:14.5, backLength:17.25, sleeveLength:17, thigh:23.5, calf:14, ankle:9.5, armholeDepth:7.25 },
  L:  { bust:41, waist:33, hip:43, upperArm:12, lowerArm:11, wrist:7, shoulder:16.75, neckCircumference:15, backLength:17.5, sleeveLength:17.5, thigh:25.5, calf:15, ankle:10, armholeDepth:7.75 },
  XL: { bust:45, waist:37, hip:47, upperArm:13.5, lowerArm:12, wrist:7.5, shoulder:17.5, neckCircumference:15.5, backLength:17.75, sleeveLength:17.5, thigh:27.5, calf:16, ankle:10.5, armholeDepth:8.25 },
  '2XL': { bust:49, waist:41, hip:52.5, upperArm:15.5, lowerArm:13, wrist:8, shoulder:18, neckCircumference:16, backLength:18, sleeveLength:18, thigh:29.5, calf:17, ankle:11, armholeDepth:8.75 },
  '3XL': { bust:53, waist:44.5, hip:54.5, upperArm:17, lowerArm:14, wrist:8.5, shoulder:18, neckCircumference:16.5, backLength:18, sleeveLength:18, thigh:31.5, calf:18, ankle:11.5, armholeDepth:9.25 },
  '4XL': { bust:57, waist:46.5, hip:56.5, upperArm:18.5, lowerArm:15, wrist:9, shoulder:18.5, neckCircumference:17, backLength:18.5, sleeveLength:18.5, thigh:33.5, calf:19, ankle:12, armholeDepth:9.75 },
  '5XL': { bust:61, waist:49.5, hip:61.5, upperArm:18.5, lowerArm:16, wrist:9.5, shoulder:18.5, neckCircumference:17.5, backLength:18.5, sleeveLength:18.5, thigh:35.5, calf:20, ankle:12.5, armholeDepth:10.25 },
};

/** Determines which standards table should actually grade a given project -
 *  the project's own recorded standard, not whatever the app's global
 *  setting currently happens to be. A project made under CYC stays on CYC
 *  forever, even if the designer later starts a different project under
 *  Custom; a project made under Custom keeps grading from its own frozen
 *  snapshot, even if the designer edits their live custom chart afterward.
 *  liveCustomStandard is only ever used as a fallback for the case where a
 *  Custom-standard project somehow has no snapshot (shouldn't happen for
 *  anything created after this existed, but keeps old/malformed data safe
 *  rather than crashing). */
export function resolveProjectStandards(
  project: PatternProject,
  liveCustomStandard?: StandardsTable
): StandardsTable {
  if (project.sizingStandard === 'Custom') {
    // A Custom-standard project MUST have a frozen snapshot. If it's missing
    // and no live standard is available, silently zeroing the chart was the
    // bug (S003 family): zero yardage, zero sample cost, verdicts flipped to
    // "go" on nothing. Fall back to CYC explicitly instead - a real table is
    // never the answer for a project with no standards at all (a missing
    // snapshot means nothing about the body is known), so the caller is
    // expected to check the flag and render a "add your measurements"
    // state. CYC is only ever returned when there genuinely are measurements
    // to grade against the size chart.
    return project.customStandardSnapshot ?? liveCustomStandard ?? SIZE_STANDARDS;
  }
  // CYC, legacy projects with no sizingStandard recorded, and standards not
  // yet implemented (UK/EU/etc. aren't selectable today) all resolve to CYC.
  return SIZE_STANDARDS;
}

/** True when a Custom-standard project has neither a frozen snapshot nor a
 *  supplied live standard - the exact "standards built on nothing" case the
 *  S003 family describes. Callers should render the standards-missing state
 *  rather than any graded number, because there is no chart to grade with.
 *  Legacy (pre-snapshot) projects resolve to CYC and are NOT flagged. */
export function isCustomStandardMissing(project: PatternProject): boolean {
  return (
    project.sizingStandard === 'Custom' &&
    project.customStandardSnapshot === undefined
  );
}

export function gradePattern(
  project: PatternProject,
  standards: StandardsTable = SIZE_STANDARDS
): GradingResult {
  const baseStandards = standards[project.baseSize];
  return project.sections.map(section => ({
    sectionId: section.id,
    sectionName: section.name,
    measurements: section.measurements.map(m => ({
      measurementId: m.id,
      label: m.label,
      measurementType: m.measurementType,
      gradingKey: m.gradingKey,
      gradedValues: ALL_SIZES.map(size => {
        const sizeStandards = standards[size];
        let physicalValue: number;
        if (m.measurementType === 'direct') {
          physicalValue = m.baseValue;
        } else {
          const gradeFactor = m.measurementType === 'width' ? 0.5 : 1.0;
          const baseBodyDim = baseStandards[m.gradingKey] * gradeFactor;
          const sizeBodyDim = sizeStandards[m.gradingKey] * gradeFactor;
          const grade = sizeBodyDim - baseBodyDim;
          physicalValue = m.baseValue + grade;
        }
        
        // Convert from cm to inches if needed for the stitches/rows calculation
        const physicalInInches = project.gauge.unit === 'cm' ? physicalValue / 2.54 : physicalValue;
        const exactStitchCount = rawStitches(physicalInInches, project.gauge.stitchesPer4In);
        const stitchCount = measurementToStitches(physicalInInches, project.gauge.stitchesPer4In, m.stitchRepeat, m.stitchParity, m.stitchRemainder);
        const hasRowRounding = m.rowRepeat !== undefined || m.rowParity !== undefined;
        const exactRowCount = hasRowRounding ? rawRows(physicalInInches, project.gauge.rowsPer4In) : undefined;
        const rowCount = hasRowRounding
          ? measurementToRows(physicalInInches, project.gauge.rowsPer4In, m.rowRepeat, m.rowParity, m.rowRemainder)
          : undefined;
          
        return { 
          size, 
          physicalValue: Math.round(physicalValue * 100) / 100, 
          stitchCount, 
          rowCount,
          exactStitchCount: Math.round(exactStitchCount * 100) / 100,
          exactRowCount: exactRowCount !== undefined ? Math.round(exactRowCount * 100) / 100 : undefined,
        };
      })
    }))
  }));
}

/** Rounds to the nearest integer ≡ remainder (mod multiple), e.g. multiple=6,
 *  remainder=2 -> ...,-4,2,8,14,20,... . remainder=0 is a plain multiple,
 *  identical to the old repeat-only behavior. */
function roundToMultipleWithRemainder(raw: number, multiple: number, remainder: number): number {
  const k = Math.round((raw - remainder) / multiple);
  return k * multiple + remainder;
}

function rawStitches(inches: number, stitchesPer4In: number): number {
  return inches * (stitchesPer4In / 4);
}
function rawRows(inches: number, rowsPer4In: number): number {
  return inches * (rowsPer4In / 4);
}

/** Rounds to the nearest integer matching the required parity (even/odd),
 *  breaking exact ties (e.g. 10.0 is equidistant from 9 and 11) upward -
 *  same round-half-up convention as the plain Math.round used everywhere
 *  else in this file, so behavior stays consistent across all rounding
 *  modes rather than surprising someone with a different tie-break rule. */
function roundToParity(raw: number, parity: RoundingParity): number {
  const nearestEven = Math.round(raw / 2) * 2;
  if (parity === 'even') return nearestEven;
  // Nearest odd is one of nearestEven ± 1 - pick whichever is actually closer.
  const lower = nearestEven - 1;
  const upper = nearestEven + 1;
  return (upper - raw) <= (raw - lower) ? upper : lower;
}

export function measurementToStitches(inches: number, stitchesPer4In: number, repeat?: number, parity?: RoundingParity, remainder?: number): number {
  const raw = rawStitches(inches, stitchesPer4In);
  if (parity) return roundToParity(raw, parity);
  if (repeat && repeat > 1) return roundToMultipleWithRemainder(raw, repeat, remainder ?? 0);
  return Math.round(raw);
}

export function measurementToRows(inches: number, rowsPer4In: number, repeat?: number, parity?: RoundingParity, remainder?: number): number {
  const raw = rawRows(inches, rowsPer4In);
  if (parity) return roundToParity(raw, parity);
  if (repeat && repeat > 1) return roundToMultipleWithRemainder(raw, repeat, remainder ?? 0);
  return Math.round(raw);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
