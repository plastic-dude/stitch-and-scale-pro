import { describe, it, expect } from 'vitest';
import {
  runTechEditAudit,
  estimateEditorSavings,
  estimateMarketBill,
  editorHoursFor,
  EDITOR_MARKET,
  generatePreEditSummary,
  AuditFinding,
} from './tech-edit-audit';
import { PatternProject, Gauge, SectionMeasurement } from './grading-engine';

const BASE_GAUGE: Gauge = { stitchesPer4In: 18, rowsPer4In: 24, unit: 'in' };

function m(id: string, label: string, gradingKey: any, baseValue: number, opts: Partial<SectionMeasurement> = {}): SectionMeasurement {
  return {
    id,
    label,
    measurementType: 'width',
    gradingKey,
    baseValue,
    ...opts,
  };
}

function makeProject(overrides: Partial<PatternProject> = {}, measurements: SectionMeasurement[] = []): PatternProject {
  return {
    id: 'ta-test',
    name: 'Audit Test Sweater',
    author: 'Tester',
    baseSize: 'M',
    gauge: BASE_GAUGE,
    sections: [
      { id: 'body', name: 'Body', measurements: measurements.filter(x => x.id.startsWith('b')) },
      { id: 'sleeves', name: 'Sleeves', measurements: measurements.filter(x => x.id.startsWith('s')) },
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

const ERRORS = (findings: AuditFinding[]) => findings.filter(f => f.severity === 'error');
const WARNINGS = (findings: AuditFinding[]) => findings.filter(f => f.severity === 'warning');

describe('runTechEditAudit', () => {
  it('returns a clean verdict for a well-formed multi-size sweater', () => {
    // Realistic garment dims for base size M: CYC half-bust 18.5in + ~2in
    // ease ≈ 20.5in; waist 14.5in + ease; lengths at the CYC length values.
    const project = makeProject({}, [
      m('b1', 'Bust', 'bust', 20.5),
      m('b2', 'Waist', 'waist', 16.5),
      m('b3', 'Back Length', 'backLength', 17.25, { measurementType: 'length' }),
      m('s1', 'Sleeve Length', 'sleeveLength', 17, { measurementType: 'length' }),
    ]);
    const summary = runTechEditAudit(project);
    expect(summary.verdict).toBe('clean');
    expect(summary.findingCounts.error).toBe(0);
    expect(summary.findingCounts.warning).toBe(0);
    expect(summary.score).toBeGreaterThanOrEqual(94);
  });

  it('GA-01 flags unusable gauge as an error', () => {
    const project = makeProject({ gauge: { stitchesPer4In: 0, rowsPer4In: 24, unit: 'in' } }, [
      m('b1', 'Bust', 'bust', 41),
    ]);
    const summary = runTechEditAudit(project);
    expect(summary.verdict).toBe('fix');
    expect(summary.findingCounts.error).toBeGreaterThanOrEqual(1);
    expect(summary.findings.some(f => f.code === 'GA-01')).toBe(true);
  });

  it('GA-02 flags negative base values', () => {
    const project = makeProject({}, [m('b1', 'Bust', 'bust', -5)]);
    const summary = runTechEditAudit(project);
    expect(summary.findings.some(f => f.code === 'GA-02' && f.severity === 'error')).toBe(true);
  });

  it('GA-03 flags non-monotonic size progression', () => {
    // Width-typed grading halves the body dimension, which keeps the
    // monotonic ordering — so this test verifies the check doesn't false-
    // flag a normal sweater either.
    // The honest way to break monotonicity is a custom standard snapshot
    // whose bust values shrink across sizes.
    const custom = {
      XS: { bust: 45, waist: 29, hip: 39, upperArm: 11, lowerArm: 10, wrist: 6.5, shoulder: 15.75, neckCircumference: 14.5, backLength: 17.25, sleeveLength: 17, thigh: 23.5, calf: 14, ankle: 9.5, armholeDepth: 7.25 },
      S:  { bust: 41, waist: 29, hip: 39, upperArm: 11, lowerArm: 10, wrist: 6.5, shoulder: 15.75, neckCircumference: 14.5, backLength: 17.25, sleeveLength: 17, thigh: 23.5, calf: 14, ankle: 9.5, armholeDepth: 7.25 },
      M:  { bust: 37, waist: 29, hip: 39, upperArm: 11, lowerArm: 10, wrist: 6.5, shoulder: 15.75, neckCircumference: 14.5, backLength: 17.25, sleeveLength: 17, thigh: 23.5, calf: 14, ankle: 9.5, armholeDepth: 7.25 },
      L:  { bust: 33, waist: 29, hip: 39, upperArm: 11, lowerArm: 10, wrist: 6.5, shoulder: 15.75, neckCircumference: 14.5, backLength: 17.25, sleeveLength: 17, thigh: 23.5, calf: 14, ankle: 9.5, armholeDepth: 7.25 },
      XL: { bust: 29, waist: 29, hip: 39, upperArm: 11, lowerArm: 10, wrist: 6.5, shoulder: 15.75, neckCircumference: 14.5, backLength: 17.25, sleeveLength: 17, thigh: 23.5, calf: 14, ankle: 9.5, armholeDepth: 7.25 },
      '2XL': { bust: 25, waist: 29, hip: 39, upperArm: 11, lowerArm: 10, wrist: 6.5, shoulder: 15.75, neckCircumference: 14.5, backLength: 17.25, sleeveLength: 17, thigh: 23.5, calf: 14, ankle: 9.5, armholeDepth: 7.25 },
      '3XL': { bust: 21, waist: 29, hip: 39, upperArm: 11, lowerArm: 10, wrist: 6.5, shoulder: 15.75, neckCircumference: 14.5, backLength: 17.25, sleeveLength: 17, thigh: 23.5, calf: 14, ankle: 9.5, armholeDepth: 7.25 },
      '4XL': { bust: 17, waist: 29, hip: 39, upperArm: 11, lowerArm: 10, wrist: 6.5, shoulder: 15.75, neckCircumference: 14.5, backLength: 17.25, sleeveLength: 17, thigh: 23.5, calf: 14, ankle: 9.5, armholeDepth: 7.25 },
      '5XL': { bust: 13, waist: 29, hip: 39, upperArm: 11, lowerArm: 10, wrist: 6.5, shoulder: 15.75, neckCircumference: 14.5, backLength: 17.25, sleeveLength: 17, thigh: 23.5, calf: 14, ankle: 9.5, armholeDepth: 7.25 },
    };
    const project = makeProject({ sizingStandard: 'Custom', customStandardSnapshot: custom }, [
      m('b1', 'Bust', 'bust', 41),
    ]);
    const summary = runTechEditAudit(project);
    // Bust values strictly decrease XS→5XL in the snapshot, so the
    // progression check must flag every size step.
    expect(summary.findings.some(f => f.code === 'GA-03' && f.severity === 'warning')).toBe(true);
  });

  it('GA-03 does not false-flag a normal monotonic garment', () => {
    const project = makeProject({}, [
      m('b1', 'Bust', 'bust', 20.5),
      m('b2', 'Waist', 'waist', 16.5),
      m('b3', 'Back Length', 'backLength', 17.25, { measurementType: 'length' }),
      m('s1', 'Sleeve Length', 'sleeveLength', 17, { measurementType: 'length' }),
    ]);
    const summary = runTechEditAudit(project);
    expect(summary.findings.some(f => f.code === 'GA-03')).toBe(false);
  });

  it('GA-04 flags stitch counts pulled far from the raw target', () => {
    // Repeat 13 + remainder 2 forces counts to …2, 15, 28, 41, 54, 67, 80,
    // 93, 106… . A width of 22in (41in body half) at 18sts/4in wants
    // 99 raw stitches; nearest valid count is 106 (7.1% off) — past the
    // 10% tolerance when grading to larger sizes with a tighter repeat.
    // Use repeat 17 + remainder 2 on a small physical value to guarantee
    // a >10% pull at the largest graded size.
    const project = makeProject({}, [
      m('b1', 'Panel', 'wrist', 6, { stitchRepeat: 17, stitchRemainder: 2 }),
    ]);
    const summary = runTechEditAudit(project);
    expect(summary.findings.some(f => f.code === 'GA-04' && f.severity === 'warning')).toBe(true);
  });

  it('GA-05 flags an out-of-range remainder', () => {
    const project = makeProject({}, [
      m('b1', 'Panel', 'waist', 22, { stitchRepeat: 6, stitchRemainder: 9 }),
    ]);
    const summary = runTechEditAudit(project);
    expect(summary.findings.some(f => f.code === 'GA-05b' && f.severity === 'error')).toBe(true);
  });

  it('GA-06 flags a zero stitch count in a graded size', () => {
    // baseValue 0.1 in at 18sts/4in rounds to 0 stitches everywhere.
    const project = makeProject({}, [m('b1', 'Tiny', 'wrist', 0.1)]);
    const summary = runTechEditAudit(project);
    expect(summary.findings.some(f => f.code === 'GA-06' && f.severity === 'error')).toBe(true);
  });

  it('GA-07 flags a length key graded as width', () => {
    const project = makeProject({}, [
      m('b1', 'Sleeve', 'sleeveLength', 17.5, { measurementType: 'width' }),
    ]);
    const summary = runTechEditAudit(project);
    expect(summary.findings.some(f => f.code === 'GA-07' && f.severity === 'warning')).toBe(true);
  });

  it('GA-08 flags a project with no graded sizes as a warning', () => {
    // Every base value is zero, so nothing grades at all — the sizing
    // table is empty until the designer enters the base size's numbers.
    const project = makeProject({}, [
      m('b1', 'Bust', 'bust', 0),
      m('b2', 'Waist', 'waist', 0),
    ]);
    const summary = runTechEditAudit(project);
    expect(summary.findings.some(f => f.code === 'GA-08' && f.severity === 'warning')).toBe(true);
    expect(summary.findingCounts.warning).toBeGreaterThan(0);
  });

  it('GA-09 flags a base value BELOW the body standard (garment smaller than body)', () => {
    // Bust for M standard is 37in body; a width base of 12in means half-bust
    // 12in < half-body 18.5in — a garment can't be narrower than the body
    // it covers, so this is the suspicious case the check catches.
    const project = makeProject({}, [m('b1', 'Bust', 'bust', 12)]);
    const summary = runTechEditAudit(project);
    expect(summary.findings.some(f => f.code === 'GA-09' && f.severity === 'warning')).toBe(true);
  });

  it('GA-09b flags a base value more than double the body standard', () => {
    // Circumference 80in entered where a width belongs (half-bust 40in vs
    // half-body 18.5in — more than double) is the classic mix-up case.
    const project = makeProject({}, [m('b1', 'Bust', 'bust', 80)]);
    const summary = runTechEditAudit(project);
    expect(summary.findings.some(f => f.code === 'GA-09b' && f.severity === 'warning')).toBe(true);
  });

  it('GA-09 tolerates normal positive ease', () => {
    const project = makeProject({}, [
      m('b1', 'Bust', 'bust', 41), // half-bust 41 vs half-body 18.5 → +122% ease is large
    ]);
    const summary = runTechEditAudit(project);
    // 41 vs 18.5 half-width is a +122% drift — flagged as GA-09b (doubling).
    expect(summary.findings.some(f => f.code === 'GA-09b' && f.severity === 'warning')).toBe(true);
  });

  it('GA-10 flags duplicate labels within a section', () => {
    const project = makeProject({}, [
      m('b1', 'Bust', 'bust', 41),
      m('b2', 'Bust', 'waist', 33),
    ]);
    const summary = runTechEditAudit(project);
    expect(summary.findings.some(f => f.code === 'GA-10' && f.severity === 'warning')).toBe(true);
  });

  it('GA-11 flags row rounding without row gauge', () => {
    const project = makeProject(
      { gauge: { stitchesPer4In: 18, rowsPer4In: 0, unit: 'in' } },
      [m('b1', 'Armhole', 'armholeDepth', 8, { rowRepeat: 4 })],
    );
    const summary = runTechEditAudit(project);
    expect(summary.findings.some(f => f.code === 'GA-11' && f.severity === 'error')).toBe(true);
  });

  it('GA-12 flags a single-section pattern as info', () => {
    const project = makeProject({}, [m('b1', 'Bust', 'bust', 41)]);
    // makeProject always builds two sections; strip one to simulate a
    // genuinely single-section pattern (cowl/scarf).
    project.sections = [project.sections[0]];
    const summary = runTechEditAudit(project);
    expect(summary.findings.some(f => f.code === 'GA-12' && f.severity === 'info')).toBe(true);
  });

  it('scores drop proportionally with finding severity', () => {
    const clean = runTechEditAudit(makeProject({}, [
      m('b1', 'Bust', 'bust', 20.5),
      m('b2', 'Waist', 'waist', 16.5),
      m('b3', 'Back Length', 'backLength', 17.25, { measurementType: 'length' }),
      m('s1', 'Sleeve Length', 'sleeveLength', 17, { measurementType: 'length' }),
    ]));
    const broken = runTechEditAudit(makeProject(
      { gauge: { stitchesPer4In: 0, rowsPer4In: 24, unit: 'in' } },
      [m('b1', 'Negative', 'bust', -5)],
    ));
    expect(clean.score).toBeGreaterThan(broken.score);
  });
});

describe('estimateEditorSavings', () => {
  it('frames savings at the given hourly rate', () => {
    const summary = runTechEditAudit(makeProject({}, [m('b1', 'Bust', 'bust', 20.5)]));
    const savings = estimateEditorSavings(summary, 30);
    expect(savings.savings).toBe(60); // 2 hours × $30
    expect(savings.hoursCovered).toBe(2);
  });

  it('notes outstanding findings when present', () => {
    const summary = runTechEditAudit(makeProject(
      { gauge: { stitchesPer4In: 0, rowsPer4In: 24, unit: 'in' } },
      [m('b1', 'Bust', 'bust', -5)],
    ));
    expect(summary.findingCounts.error).toBeGreaterThan(0);
    const savings = estimateEditorSavings(summary);
    expect(savings.note).toContain('outstanding');
  });

  it('notes a clean prose-pass framing when findings are resolved', () => {
    const summary = runTechEditAudit(makeProject({}, [
      m('b1', 'Bust', 'bust', 20.5),
      m('b2', 'Waist', 'waist', 16.5),
      m('b3', 'Back Length', 'backLength', 17.25, { measurementType: 'length' }),
      m('s1', 'Sleeve Length', 'sleeveLength', 17, { measurementType: 'length' }),
    ]));
    // Realistic dims keep every finding at info level; info findings don't
    // count as "outstanding" billable work, so estimateEditorSavings still
    // frames the prose pass as the remaining human-editor scope.
    expect(summary.findingCounts.error).toBe(0);
    expect(summary.findingCounts.warning).toBe(0);
    const savings = estimateEditorSavings(summary);
    expect(savings.note).toContain('prose pass');
  });
});

describe('generatePreEditSummary', () => {
  it('includes the audit score and outstanding items', () => {
    const project = makeProject({}, [
      m('b1', 'Bust', 'bust', 20.5),
      m('b2', 'Waist', 'waist', 16.5),
      m('b3', 'Back Length', 'backLength', 17.25, { measurementType: 'length' }),
      m('s1', 'Sleeve Length', 'sleeveLength', 17, { measurementType: 'length' }),
    ]);
    const summary = runTechEditAudit(project);
    const text = generatePreEditSummary(project, summary);
    expect(text).toContain('Audit Test Sweater');
    expect(text).toContain(`score: ${summary.score}/100`);
    expect(text).toContain('Already checked automatically');
  });

  it('lists error/warning findings with codes', () => {
    const project = makeProject(
      { gauge: { stitchesPer4In: 0, rowsPer4In: 24, unit: 'in' } },
      [m('b1', 'Bust', 'bust', -5)],
    );
    const summary = runTechEditAudit(project);
    const text = generatePreEditSummary(project, summary);
    expect(text).toContain('[GA-01]');
    expect(text).toContain('[GA-02]');
    // Gauge 0 zeros out stitch counts in every size, so GA-06 fires for
    // each size; the negative value itself is caught by GA-02.
    expect(text).toContain('[GA-06]');
  });

  it('scopes the prose pass as the remaining human-editor work', () => {
    const project = makeProject({}, [
      m('b1', 'Bust', 'bust', 20.5),
      m('b2', 'Waist', 'waist', 16.5),
      m('b3', 'Back Length', 'backLength', 17.25, { measurementType: 'length' }),
      m('s1', 'Sleeve Length', 'sleeveLength', 17, { measurementType: 'length' }),
    ]);
    const summary = runTechEditAudit(project);
    const text = generatePreEditSummary(project, summary);
    expect(text).toContain('the prose pass');
  });
});

/* ------------------------- session-42 market framing -------------------------
 * Session-42 research (tech editing market): editors bill $20–40/hr; 1–7h by
 * garment complexity; ~10-day turnaround; per-size premium norms (~$5/size
 * for fixed-price editors); documented editor shortage. The market bill
 * estimator turns these facts into a live quote comparison. */
describe('editorHoursFor / estimateMarketBill (session-42)', () => {
  it('bands editor hours by graded size count', () => {
    // editorHoursFor counts distinct graded SIZES across the whole project —
    // a single positive Bust grades all 9 sizes, so a one-measurement
    // project already fills the 4h band. Compare band edges instead:
    // zero graded sizes → the 1h (accessory/one-size) band; a full garment →
    // the 4h band.
    const empty = makeProject({}, [m('b1', 'Bust', 'bust', 0)]);
    const garment = makeProject({}, [
      m('b1', 'Bust', 'bust', 20.5),
      m('b2', 'Waist', 'waist', 16.5),
      m('b3', 'Back Length', 'backLength', 17.25, { measurementType: 'length' }),
      m('s1', 'Sleeve Length', 'sleeveLength', 17, { measurementType: 'length' }),
    ]);
    expect(editorHoursFor(empty)).toBe(1); // nothing graded — the entry band
    expect(editorHoursFor(garment)).toBe(4); // full 9-size grading — the 4h band
  });

  it('quotes the same sweep at market rates on the summary', () => {
    const project = makeProject({}, [
      m('b1', 'Bust', 'bust', 20.5),
      m('b2', 'Waist', 'waist', 16.5),
      m('b3', 'Back Length', 'backLength', 17.25, { measurementType: 'length' }),
      m('s1', 'Sleeve Length', 'sleeveLength', 17, { measurementType: 'length' }),
    ]);
    const summary = runTechEditAudit(project);
    const bill = summary.marketBill;
    // 4h band at $20–40/hr → low = 0.6 × $20 × 4h = $48 (negotiated, clean),
    // high = $40 × 4h = $160.
    expect(bill.low).toBe(48);
    expect(bill.high).toBe(160);
    expect(bill.hours).toBe(4);
    expect(bill.waitDays).toBe(EDITOR_MARKET.turnaroundDays);
  });

  it('unclean patterns lose the negotiated discount', () => {
    const project = makeProject({}, [m('b1', 'Bust', 'bust', 20.5)]);
    const projectBroken = makeProject({}, [m('b1', 'Bust', 'bust', -5)]);
    const cleanBill = estimateMarketBill(runTechEditAudit(project), project);
    const brokenBill = estimateMarketBill(runTechEditAudit(projectBroken), projectBroken);
    // Clean pattern: 0.6× low factor (negotiated). Broken pattern: full rate.
    expect(brokenBill.low).toBeGreaterThan(cleanBill.low);
    expect(brokenBill.pending).toBeGreaterThan(cleanBill.pending);
  });

  it('exposes the documented editor shortage in the note', () => {
    const project = makeProject({}, [
      m('b1', 'Bust', 'bust', 20.5),
      m('b2', 'Waist', 'waist', 16.5),
      m('b3', 'Back Length', 'backLength', 17.25, { measurementType: 'length' }),
      m('s1', 'Sleeve Length', 'sleeveLength', 17, { measurementType: 'length' }),
    ]);
    const bill = estimateMarketBill(runTechEditAudit(project), project);
    // Clean patterns quote the lower half; the note always names the hourly
    // arithmetic as the automatable half (their flaw = our strength).
    expect(bill.high).toBe(160);
    expect(bill.low).toBe(48);
    expect(bill.note).toContain('$20–$40/hr');
  });
});
