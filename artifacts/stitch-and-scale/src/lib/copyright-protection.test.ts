import { describe, expect, it } from 'vitest';
import {
  analyzeProtection,
  DEFAULT_PROTECT,
  DEFAULT_LICENSE_TERMS,
  generateWatchWords,
  buildDmcaNotice,
  buildEvidenceChecklist,
  licenseStrengthLabel,
  type ProtectInput,
} from './copyright-protection';

function prot(overrides: Partial<ProtectInput>): ProtectInput {
  return { ...DEFAULT_PROTECT, ...overrides };
}

describe('copyright-protection (CHK-033)', () => {
  it('uses defaults without crashing', () => {
    const r = analyzeProtection(DEFAULT_PROTECT);
    expect(r.exposure.leakExposurePerYear).toBeGreaterThan(0);
    expect(r.verdict).toBeTruthy();
  });

  it('leak share drops with watermark + unique links + multi-channel', () => {
    const baseline = analyzeProtection(prot({ watermarkEnabled: false, uniqueDownloadLinks: false }));
    const armed = analyzeProtection(prot({ watermarkEnabled: true, uniqueDownloadLinks: true, soldOnMultiplePlatforms: true }));
    // Same inputs otherwise → armed exposure is materially lower
    expect(armed.exposure.leakExposurePerYear).toBeLessThan(baseline.exposure.leakExposurePerYear);
    expect(armed.exposure.leakExposurePerYear).toBeLessThan(baseline.exposure.leakExposurePerYear * 0.5);
  });

  it('leak share is capped in the researched 5–30% band', () => {
    for (const armed of [
      { watermarkEnabled: true, uniqueDownloadLinks: true },
      { watermarkEnabled: false, uniqueDownloadLinks: false },
    ]) {
      const r = analyzeProtection(prot(armed));
      const share = r.exposure.leakExposurePerYear / (DEFAULT_PROTECT.monthlyPatternCopies * 12 * DEFAULT_PROTECT.avgPrice);
      expect(share).toBeGreaterThanOrEqual(0.05);
      expect(share).toBeLessThanOrEqual(0.3);
    }
  });

  it('license audit: open boundaries score low and CP-01 fires', () => {
    const r = analyzeProtection(prot({ licenseTerms: { ...DEFAULT_LICENSE_TERMS, personalUseOnly: false, massProductionAllowed: true } }));
    // base 40, +10 (finishedItems), no +15 (personal boundary missing), no +10 (mass production allowed), +10 (translation allowed gap), +10 (teaching allowed gap), +5 (derivative charts allowed gap) = 75 — critical gaps exist and CP-01 fires on gaps while score reflects the boundary arithmetic
    expect(r.licenseAudit.score).toBeLessThan(80);
    expect(r.licenseAudit.gaps.length).toBe(2);
    expect(r.redFlags.some((f) => f.code === 'CP-01')).toBe(true);
    expect(r.licenseAudit.gaps.some((g) => g.includes('mass production'))).toBe(true);
  });

  it('license audit: drawn boundaries score high and CP-01 stays quiet', () => {
    const r = analyzeProtection(prot({
      licenseTerms: { ...DEFAULT_LICENSE_TERMS, massProductionAllowed: false, translationAllowed: false, teachingAllowed: false, derivativeChartsAllowed: false },
    }));
    expect(r.licenseAudit.score).toBeGreaterThanOrEqual(80);
    expect(r.redFlags.some((f) => f.code === 'CP-01')).toBe(false);
  });

  it('missing evidence pack raises CP-04 critical', () => {
    const r = analyzeProtection(prot({ evidencePackReady: false }));
    expect(r.redFlags.some((f) => f.code === 'CP-04' && f.severity === 'critical')).toBe(true);
    expect(r.monitor.evidencePackReady).toBe(false);
  });

  it('armed prevention stack clears the critical flags', () => {
    const r = analyzeProtection(prot({
      watermarkEnabled: true,
      soldOnMultiplePlatforms: true,
      evidencePackReady: true,
      licenseTerms: { ...DEFAULT_LICENSE_TERMS, massProductionAllowed: false, translationAllowed: false, teachingAllowed: false },
    }));
    expect(r.redFlags.every((f) => f.severity !== 'critical')).toBe(true);
    expect(r.prevention.preventionScore).toBeGreaterThanOrEqual(80);
  });

  it('exposure valuation: 20 copies/mo @ $8 with defaults ≈ 384/yr gross at base 20% share', () => {
    const r = analyzeProtection(DEFAULT_PROTECT);
    // defaults: no watermark/links/multi-channel → leak share = base 0.2; 20 × 12 × 8 × 0.2 = 384
    expect(r.exposure.leakExposurePerYear).toBeCloseTo(384, 0);
    expect(r.exposure.responseBudgetPerIncident).toBe(4 * 35);
    // defaults: 20*12*0.2*8 = 384; lost net = 384*0.85*0.5
    expect(r.exposure.expectedLostNetPerYear).toBeCloseTo(384 * 0.85 * 0.5, 0);
  });

  it('counter-notice deadline in the past fires CP-05 and advances to step 5', () => {
    const r = analyzeProtection(prot({ counterNoticeDeadline: '2020-01-01', infringerContactedPolitely: true, leakDiscovered: '2026-08-01' }));
    expect(r.escalation.counterNoticeDeadlinePassed).toBe(true);
    expect(r.escalation.currentStep).toBe(4);
    expect(r.redFlags.some((f) => f.code === 'CP-05')).toBe(true);
  });

  it('fresh leak moves to the platform-report step', () => {
    const r = analyzeProtection(prot({ leakDiscovered: '2026-08-14' }));
    expect(r.escalation.currentStep).toBeGreaterThanOrEqual(2);
  });

  it('no counter-notice yet → deadline unknown, not failed', () => {
    const r = analyzeProtection(prot({ infringerContactedPolitely: true }));
    expect(r.escalation.counterNoticeDeadlinePassed).toBeNull();
    expect(r.redFlags.some((f) => f.code === 'CP-05')).toBe(false);
  });

  it('DMCA notice contains all 6 required elements', () => {
    const text = buildDmcaNotice(prot({ platformForDmca: 'ravelry' }));
    expect(text).toContain('legal@ravelry.com');
    expect(text).toContain('good faith belief');
    expect(text).toMatch(/penalty of perjury/i);
    expect(text).toContain('original copyrighted work');
    expect(text).toContain('infringing material');
    expect(text).toMatch(/signature/i);
    expect(text).toContain('10 business days');
  });

  it('watch-word generator produces platform-agnostic search strings', () => {
    const words = generateWatchWords('Calyx Pullover', 'Stitch & Scale Demo');
    expect(words.length).toBeGreaterThanOrEqual(6);
    expect(words.some((w) => w.includes('free download'))).toBe(true);
    expect(words.some((w) => w.includes('site:pinterest.com'))).toBe(true);
    expect(words.some((w) => w.includes('filetype:pdf'))).toBe(true);
  });

  it('evidence checklist has the six research-grounded items', () => {
    expect(buildEvidenceChecklist('Calyx Pullover').length).toBe(6);
  });

  it('license strength labels map to score bands', () => {
    expect(licenseStrengthLabel(90)).toBe('drawn');
    expect(licenseStrengthLabel(70)).toBe('partial');
    expect(licenseStrengthLabel(45)).toBe('open');
  });
});
