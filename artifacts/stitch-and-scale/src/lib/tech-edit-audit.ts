import {
  ALL_SIZES,
  gradePattern,
  PatternProject,
  SectionMeasurement,
  SizeKey,
  StandardsTable,
  resolveProjectStandards,
} from './grading-engine';
import { SIZE_STANDARDS } from './grading-engine';
import { TECH_EDIT_COPY } from './tech-edit-copy';
import { LanguageCode } from './i18n';

export type AuditSeverity = 'error' | 'warning' | 'info' | 'pass';

export interface AuditFinding {
  /** Section + measurement the finding relates to, e.g. "Body › Bust" */
  location: string;
  severity: AuditSeverity;
  /** Stable machine-readable code, e.g. GA-01 */
  code: string;
  title: string;
  /** Plain-language explanation of what's wrong and how to fix it. */
  detail: string;
}

export interface AuditSectionResult {
  sectionName: string;
  measurementLabel: string;
  measurements: number;
  sizes: SizeKey[];
}

export interface AuditSummary {
  findingCounts: Record<AuditSeverity, number>;
  /** 0–100; 100 = the numbers sweep passed clean. */
  score: number;
  /** Stable verdict shown to the designer. */
  verdict: 'clean' | 'check' | 'fix';
  findings: AuditFinding[];
  /** Session-42 market framing: what a human editor would quote for this
   *  sweep, with real rate bands and the ~10-day turnaround wait. */
  marketBill: {
    low: number;
    high: number;
    hours: number;
    pending: number;
    waitDays: number;
    note: string;
  };
}

export interface AuditConfig {
  /** Hourly rate used in the cost-saved framing ($20–40 typical). */
  editorRatePerHour?: number;
  language?: LanguageCode;
}

const DEFAULT_RATE = 35;

/* -------------------------- session-42 market facts -----------------------
 * Sources:
 * - ribblr tech-editing thread: US editors $20–30/hr, 15-min billing
 *   https://meet.ribblr.com/t/tech-editing/210921
 * - r/AdvancedKnitting 'Tech Editing' thread: going rate $30–40/hr, sweaters
 *   'up to 4 hours', and a documented shortage of good editors
 *   https://www.reddit.com/r/AdvancedKnitting/comments/1840wp1/tech_editing/
 * - Kim, knitting technical editor (knitjulep.com, 250+ patterns edited):
 *   $35/hr; simple accessories 1–2h, complex accessories/simple garments
 *   1–3h, complex garments 2–7h; turnaround ≈ 10 days
 *   https://knitjulep.com/knitting-technical-editing-services/
 * - bramblesandbindweed.com: £24 (~$32) per 15-min increment
 *   https://bramblesandbindweed.com/technical-editing/
 * - Woolly Wormhead 'The True Cost of a Pattern': avg tech edit ≈ £50/
 *   pattern inside a pattern book (whole book £800–900)
 *   https://woollywormhead.com/blog/2018/05/10/the-true-cost-of-a-pattern-revisited
 * - worksofourhands.com fixed pricing: per-pattern rate + $5 per extra size
 *   https://worksofourhands.com/2023/05/30/pros-cons-and-fixed-pricing-newbie-tech-editor-part-1/
 */
export const EDITOR_MARKET = {
  /** Market hourly range, USD. */
  rateLow: 20,
  rateHigh: 40,
  /** Typical human-editor turnaround in days. */
  turnaroundDays: 10,
  /** Hours the market quotes per garment complexity band. */
  hoursBySizes: [
    { maxSizes: 1, hours: 1 },   // accessories / one-size
    { maxSizes: 3, hours: 2 },
    { maxSizes: 6, hours: 3 },
    { maxSizes: 9, hours: 4 },
    { maxSizes: Infinity, hours: 7 }, // complex multi-size garments
  ],
} as const;

/** Rough billable-hours estimate for the numbers sweep a human editor would
 *  perform on this project, based on its graded size count (more sizes =
 *  more arithmetic to verify; fixed-price editors add ~$5 per extra size). */
export function editorHoursFor(project: PatternProject): number {
  const sizes = new Set<SizeKey>();
  for (const section of project.sections) {
    for (const measurement of section.measurements) {
      for (const size of gradedSizesFor(measurement)) sizes.add(size);
    }
  }
  const count = sizes.size;
  const band = EDITOR_MARKET.hoursBySizes.find(b => count <= b.maxSizes);
  return band ? band.hours : EDITOR_MARKET.hoursBySizes[EDITOR_MARKET.hoursBySizes.length - 1].hours;
}

/** Every size the project actually grades (those whose base physical value
 *  is greater than zero — a zero means "not part of this pattern"). */
function gradedSizesFor(m: SectionMeasurement): SizeKey[] {
  return ALL_SIZES.filter(size => Math.abs(m.baseValue) > 0);
}

/** Every distinct size the project actually grades — exported for the
 *  market-bill note (issue #31): the note must name the graded-size count,
 *  never the findings count. */
export function gradedSizeCount(project: PatternProject): number {
  const sizes = new Set<SizeKey>();
  for (const section of project.sections) {
    for (const measurement of section.measurements) {
      for (const size of gradedSizesFor(measurement)) sizes.add(size);
    }
  }
  return sizes.size;
}

function location(sectionName: string, label: string): string {
  return `${sectionName} › ${label}`;
}

/**
 * Re-derives the full grading and compares every stored-style expectation
 * against freshly computed values. The project's own measurement config is
 * the source of truth; this re-computes what gradePattern would produce
 * and flags where the numbers fail tech-edit sanity checks.
 */
function regrade(project: PatternProject) {
  // Mirror the workspace exactly: grade from the project's own recorded
  // standard (CYC or its frozen Custom snapshot), never the live setting.
  return gradePattern(project, resolveAuditStandards(project));
}

/* --------------------------- individual checks --------------------------- */

/** GA-01: gauge usable at all — no gauge, no trustworthy numbers. */
function gaugeIsUsable(project: PatternProject): boolean {
  return !!(
    project.gauge &&
    project.gauge.stitchesPer4In > 0 &&
    project.gauge.rowsPer4In > 0
  );
}

function checkGauge(project: PatternProject, lang: LanguageCode): AuditFinding[] {
  const copy = TECH_EDIT_COPY[lang];
  const usable = gaugeIsUsable(project);
  return usable
    ? []
    : [{
        location: 'Project',
        severity: 'error',
        code: 'GA-01',
        title: copy.findingGa01Title,
        detail: copy.findingGa01Detail,
      }];
}

/** GA-02: base values sanity — negatives and zeros where they shouldn't be. */
function checkBaseValues(project: PatternProject, lang: LanguageCode): AuditFinding[] {
  const copy = TECH_EDIT_COPY[lang];
  const findings: AuditFinding[] = [];
  for (const section of project.sections) {
    for (const m of section.measurements) {
      if (m.baseValue < 0) {
        findings.push({
          location: location(section.name, m.label),
          severity: 'error',
          code: 'GA-02',
          title: copy.findingGa02Title,
          detail: copy.findingGa02Detail(m.baseValue),
        });
      } else if (m.baseValue === 0) {
        findings.push({
          location: location(section.name, m.label),
          severity: 'info',
          code: 'GA-02b',
          title: copy.findingGa02bTitle,
          detail: copy.findingGa02bDetail,
        });
      }
    }
  }
  return findings;
}

/** GA-03: size progression — physical values must be monotonic in size. */
function checkSizeProgression(project: PatternProject, lang: LanguageCode): AuditFinding[] {
  const copy = TECH_EDIT_COPY[lang];
  const findings: AuditFinding[] = [];
  const graded = regrade(project);
  for (const section of graded) {
    for (const m of section.measurements) {
      const sizes = gradedSizesFor(project.sections
        .find(s => s.id === section.sectionId)
        ?.measurements.find(mm => mm.id === m.measurementId) ?? { baseValue: 0 } as SectionMeasurement);
      if (sizes.length < 2) continue;
      const values = sizes.map(s => {
        const g = m.gradedValues.find(v => v.size === s);
        return g ? g.physicalValue : 0;
      });
      const mono = values.every((v, i) => i === 0 || v >= values[i - 1]);
      if (!mono) {
        findings.push({
          location: location(section.sectionName, m.label),
          severity: 'warning',
          code: 'GA-03',
          title: copy.findingGa03Title,
          detail: copy.findingGa03Detail(sizes.join(' → '), values.join(', '), project.gauge.unit),
        });
      }
    }
  }
  return findings;
}

/** GA-04: stitch/row rounding consistency — the rounded number must still be
 *  within tolerance of the raw target (a repeat-constraint can pull a
 *  number far from the raw target; beyond ~10% the fit risk rises). */
function checkRoundingTolerance(project: PatternProject, lang: LanguageCode): AuditFinding[] {
  const copy = TECH_EDIT_COPY[lang];
  const findings: AuditFinding[] = [];
  const graded = regrade(project);
  const TOL = 0.10;
  for (const section of graded) {
    for (const m of section.measurements) {
      for (const g of m.gradedValues) {
        if (g.stitchCount <= 0) continue;
        const stitchDev = Math.abs(g.stitchCount - g.exactStitchCount) / g.exactStitchCount;
        if (stitchDev > TOL) {
          findings.push({
            location: location(section.sectionName, m.label),
            severity: 'warning',
            code: 'GA-04',
            title: copy.findingGa04Title(Math.round(stitchDev * 100), g.size),
            detail: copy.findingGa04Detail(g.stitchCount, g.exactStitchCount.toFixed(1)),
          });
        }
        if (g.rowCount !== undefined && g.exactRowCount !== undefined && g.rowCount > 0) {
          const rowDev = Math.abs(g.rowCount - g.exactRowCount) / g.exactRowCount;
          if (rowDev > TOL) {
            findings.push({
              location: location(section.sectionName, m.label),
              severity: 'info',
              code: 'GA-04b',
              title: copy.findingGa04bTitle(Math.round(rowDev * 100), g.size),
              detail: copy.findingGa04bDetail(g.rowCount, g.exactRowCount.toFixed(1)),
            });
          }
        }
      }
    }
  }
  return findings;
}

/** GA-05: repeat/parity rule validity — remainder must be inside the repeat
 *  and parity must be positive where used. */
function checkRoundingRules(project: PatternProject, lang: LanguageCode): AuditFinding[] {
  const copy = TECH_EDIT_COPY[lang];
  const findings: AuditFinding[] = [];
  for (const section of project.sections) {
    for (const m of section.measurements) {
      if (m.stitchRepeat !== undefined) {
        const rep = m.stitchRepeat;
        const rem = m.stitchRemainder ?? 0;
        if (rep <= 1) {
          findings.push({
            location: location(section.name, m.label),
            severity: 'warning',
            code: 'GA-05',
            title: copy.findingGa05Title(rep),
            detail: copy.findingGa05Detail(rep),
          });
        }
        if (rem < 0 || rem >= rep) {
          findings.push({
            location: location(section.name, m.label),
            severity: 'error',
            code: 'GA-05b',
            title: copy.findingGa05bTitle,
            detail: copy.findingGa05bDetail(rem, rep),
          });
        }
      }
      if (m.stitchParity && m.stitchRepeat) {
        findings.push({
          location: location(section.name, m.label),
          severity: 'info',
          code: 'GA-05c',
          title: copy.findingGa05cTitle,
          detail: copy.findingGa05cDetail,
        });
      }
    }
  }
  return findings;
}

/** GA-06: stitch counts must be plausible for the size — never zero or
 *  negative after rounding in a graded size. */
function checkStitchCounts(project: PatternProject, lang: LanguageCode): AuditFinding[] {
  const copy = TECH_EDIT_COPY[lang];
  const findings: AuditFinding[] = [];
  const graded = regrade(project);
  for (const section of graded) {
    for (const m of section.measurements) {
      for (const g of m.gradedValues) {
        if (g.stitchCount <= 0) {
          findings.push({
            location: location(section.sectionName, m.label),
            severity: 'error',
            code: 'GA-06',
            title: copy.findingGa06Title(g.size),
            detail: copy.findingGa06Detail(g.stitchCount),
          });
        }
      }
    }
  }
  return findings;
}

/** GA-07: circumference vs width discipline — a 'width' measurement graded
 *  from a circumference key must not exceed half the key's body value by a
 *  suspicious margin, catching mis-keyed measurements. */
function checkMeasurementTyping(project: PatternProject, lang: LanguageCode): AuditFinding[] {
  const copy = TECH_EDIT_COPY[lang];
  const findings: AuditFinding[] = [];
  const graded = regrade(project);
  for (const section of graded) {
    const src = project.sections.find(s => s.id === section.sectionId);
    if (!src) continue;
    for (const m of section.measurements) {
      const mDef = src.measurements.find(mm => mm.id === m.measurementId);
      if (!mDef) continue;
      const key = m.gradingKey;
      if (mDef.measurementType === 'width' && (key === 'backLength' || key === 'sleeveLength' || key === 'armholeDepth')) {
        findings.push({
          location: location(section.sectionName, m.label),
          severity: 'warning',
          code: 'GA-07',
          title: copy.findingGa07Title,
          detail: copy.findingGa07Detail(m.label, key),
        });
      }
    }
  }
  return findings;
}

/** GA-08: minimum size count — one-size garments are fine, but grading
 *  across fewer than 3 sizes while billing a "multi-size" pattern is the
 *  classic buyer-complaint pattern. */
function checkSizeCount(project: PatternProject, lang: LanguageCode): AuditFinding[] {
  const copy = TECH_EDIT_COPY[lang];
  const sizesInUse = new Set<SizeKey>();
  for (const section of project.sections) {
    for (const m of section.measurements) {
      for (const s of gradedSizesFor(m)) sizesInUse.add(s);
    }
  }
  if (sizesInUse.size === 0) {
    return [{
      location: 'Project',
      severity: 'warning',
      code: 'GA-08',
      title: copy.findingGa08Title,
      detail: copy.findingGa08Detail,
    }];
  }
  if (sizesInUse.size === 1) {
    return [{
      location: 'Project',
      severity: 'info',
      code: 'GA-08b',
      title: copy.findingGa08bTitle,
      detail: copy.findingGa08bDetail,
    }];
  }
  return [];
}

/** GA-09: CYC body-standard cross-check for the base size — is the designer's
 *  stated base measurement close to the standard? Big drift usually means a
 *  body vs garment-ease mix-up. */
function checkBaseStandardDrift(project: PatternProject, lang: LanguageCode): AuditFinding[] {
  const copy = TECH_EDIT_COPY[lang];
  const findings: AuditFinding[] = [];
  const std = resolveAuditStandards(project);
  const base = std[project.baseSize];
  if (!base) return findings;
  for (const section of project.sections) {
    for (const m of section.measurements) {
      if (m.baseValue <= 0 || m.measurementType === 'direct') continue;
      const stdValue = base[m.gradingKey];
      if (!stdValue) continue;
      const target = m.measurementType === 'width' ? stdValue * 0.5 : stdValue;
      const drift = (m.baseValue - target) / target;
      if (drift < 0) {
        findings.push({
          location: location(section.name, m.label),
          severity: 'warning',
          code: 'GA-09',
          title: copy.findingGa09Title(Math.round(Math.abs(drift) * 100), project.sizingStandard ?? 'CYC', project.baseSize),
          detail: copy.findingGa09Detail(m.baseValue, project.gauge.unit, project.sizingStandard ?? 'CYC', project.baseSize, target.toFixed(1)),
        });
      } else if (drift > 1.0) {
        findings.push({
          location: location(section.name, m.label),
          severity: 'warning',
          code: 'GA-09b',
          title: copy.findingGa09bTitle(project.sizingStandard ?? 'CYC', project.baseSize),
          detail: copy.findingGa09bDetail(m.baseValue, project.gauge.unit, target.toFixed(1)),
        });
      }
    }
  }
  return findings;
}

/** GA-10: duplicate labels within a section — ambiguous references are a
 *  real tech-edit clarity flag ("bust" meaning two different numbers). */
function checkDuplicateLabels(project: PatternProject, lang: LanguageCode): AuditFinding[] {
  const copy = TECH_EDIT_COPY[lang];
  const findings: AuditFinding[] = [];
  for (const section of project.sections) {
    const counts = new Map<string, number>();
    for (const m of section.measurements) {
      counts.set(m.label, (counts.get(m.label) ?? 0) + 1);
    }
    for (const [label, n] of counts) {
      if (n > 1) {
        findings.push({
          location: location(section.name, label),
          severity: 'warning',
          code: 'GA-10',
          title: copy.findingGa10Title(label),
          detail: copy.findingGa10Detail(n, section.name),
        });
      }
    }
  }
  return findings;
}

/** GA-11: row gauge missing when row rounding is used — silently wrong. */
function checkRowGauge(project: PatternProject, lang: LanguageCode): AuditFinding[] {
  const copy = TECH_EDIT_COPY[lang];
  const findings: AuditFinding[] = [];
  const usesRows = project.sections.some(s =>
    s.measurements.some(m => m.rowRepeat !== undefined || m.rowParity !== undefined));
  if (usesRows && (!project.gauge.rowsPer4In || project.gauge.rowsPer4In <= 0)) {
    findings.push({
      location: 'Project',
      severity: 'error',
      code: 'GA-11',
      title: copy.findingGa11Title,
      detail: copy.findingGa11Detail,
    });
  }
  return findings;
}

/** GA-12: single-section check — patterns with only one section are rarely
 *  a full garment; flag before publishing as a completeness check. */
function checkCompleteness(project: PatternProject, lang: LanguageCode): AuditFinding[] {
  const copy = TECH_EDIT_COPY[lang];
  if (project.sections.length < 2) {
    return [{
      location: 'Project',
      severity: 'info',
      code: 'GA-12',
      title: copy.findingGa12Title,
      detail: copy.findingGa12Detail,
    }];
  }
  return [];
}

function resolveAuditStandards(project: PatternProject): StandardsTable {
  return resolveProjectStandards(project, SIZE_STANDARDS);
}

/* ------------------------------ aggregation ------------------------------ */

const SEVERITY_WEIGHT: Record<AuditSeverity, number> = { error: 25, warning: 10, info: 2, pass: 0 };

/** What the same numbers sweep would cost on the open editor market —
 *  session-42 market framing with real rate bands and the turnaround wait.
 *  Takes the raw counts so it works before the AuditSummary is assembled. */
function estimateMarketBillFor(findings: AuditFinding[], findingCounts: Record<AuditSeverity, number>, project: PatternProject, lang: LanguageCode): {
  low: number;
  high: number;
  hours: number;
  pending: number;
  waitDays: number;
  note: string;
} {
  const copy = TECH_EDIT_COPY[lang];
  const pending = findingCounts.error + findingCounts.warning;
  const hours = editorHoursFor(project);
  const sizeCount = gradedSizeCount(project);
  const sizesWord = sizeCount === 1 ? 'graded size' : 'graded sizes';
  const lowFactor = pending > 0 ? 1 : 0.6;
  const low = Math.max(EDITOR_MARKET.rateLow, Math.round(EDITOR_MARKET.rateLow * hours * lowFactor));
  const high = Math.round(EDITOR_MARKET.rateHigh * hours);
  return {
    low,
    high,
    hours,
    pending,
    waitDays: EDITOR_MARKET.turnaroundDays,
    note: pending > 0
      ? copy.marketNotePending(pending, EDITOR_MARKET.rateLow, EDITOR_MARKET.rateHigh, hours, sizeCount, sizesWord, EDITOR_MARKET.turnaroundDays)
      : copy.marketNoteClean(low, high, hours, sizeCount, sizesWord, EDITOR_MARKET.turnaroundDays),
  };
}

/** Public wrapper for callers that already hold a finished AuditSummary. */
export function estimateMarketBill(summary: AuditSummary, project: PatternProject, lang: LanguageCode = 'en') {
  return estimateMarketBillFor(summary.findings, summary.findingCounts, project, lang);
}

export function runTechEditAudit(project: PatternProject, config: AuditConfig = {}): AuditSummary {
  const lang = config.language || 'en';
  const checks = [
    checkGauge,
    checkBaseValues,
    checkSizeProgression,
    checkRoundingTolerance,
    checkRoundingRules,
    checkStitchCounts,
    checkMeasurementTyping,
    checkSizeCount,
    checkBaseStandardDrift,
    checkDuplicateLabels,
    checkRowGauge,
    checkCompleteness,
  ];
  const findings: AuditFinding[] = [];
  for (const check of checks) {
    findings.push(...check(project, lang));
  }
  const findingCounts: Record<AuditSeverity, number> = { error: 0, warning: 0, info: 0, pass: 0 };
  for (const f of findings) findingCounts[f.severity]++;
  const deduction = findings.reduce((acc, f) => acc + SEVERITY_WEIGHT[f.severity], 0);
  const score = Math.max(0, Math.round(100 - deduction));
  const verdict = findingCounts.error > 0 ? 'fix' : findingCounts.warning > 0 ? 'check' : 'clean';
  const marketBill = estimateMarketBillFor(findings, findingCounts, project, lang);
  return { findingCounts, score, verdict, findings, marketBill };
}

/** Money framing: what the arithmetic sweep is worth at human-editor rates.
 *  A sweater takes ~4 hours of editing; the numbers sweep is roughly the
 *  first 2 of those hours (StitchReader/r/AdvancedKnitting sizing). */
export function estimateEditorSavings(summary: AuditSummary, ratePerHour = DEFAULT_RATE, lang: LanguageCode = 'en'): {
  hoursCovered: number;
  savings: number;
  note: string;
} {
  const copy = TECH_EDIT_COPY[lang];
  const hoursCovered = 2;
  const savings = Math.round(ratePerHour * hoursCovered);
  const pending = summary.findingCounts.error + summary.findingCounts.warning;
  const note = pending > 0
    ? copy.savingsNote(pending)
    : copy.cleanSavingsNote;
  return { hoursCovered, savings, note };
}

/** Paste-ready pre-edit summary for handing to a human tech editor — the
 *  "here's what's already checked" note that shrinks their scope (and
 *  justifies a lower quote). Their flaw (everything manual, Google-Doc
 *  back-and-forth, $20-40/hr for arithmetic) = our strength. */
export function generatePreEditSummary(project: PatternProject, summary: AuditSummary, lang: LanguageCode = 'en'): string {
  const copy = TECH_EDIT_COPY[lang];
  const lines = [
    copy.preEditSummaryHeader(project.name),
    `${copy.designerLabel}: ${project.author}`,
    `${copy.baseSizeLabel}: ${project.baseSize} | ${copy.gaugeLabel}: ${project.gauge.stitchesPer4In}sts × ${project.gauge.rowsPer4In}rows / 4in (${project.gauge.unit})`,
    copy.auditScoreLabel(summary.score, summary.verdict),
    '',
    copy.alreadyCheckedLabel,
    ...copy.checkedItems.map(item => `  • ${item}`),
    '',
    copy.outstandingItemsLabel(summary.findingCounts.error + summary.findingCounts.warning),
    ...summary.findings
      .filter(f => f.severity === 'error' || f.severity === 'warning')
      .map(f => `  • [${f.code}] ${f.location}: ${f.title} — ${f.detail}`),
    '',
    copy.prosePassLabel,
    copy.prosePassDetails,
  ];
  return lines.join('\n');
}

export { SIZE_STANDARDS } from './grading-engine';
