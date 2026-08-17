import { describe, expect, it } from 'vitest';
import {
  MEMBERSHIP_SITE_COPY,
  getMembershipFeeStackLabel,
  getMembershipFlagTitle,
  getMembershipScenarioLabel,
  getMembershipVerdict,
  getMembershipVerdictNote,
} from './membership-site-copy';

describe('Membership Site dynamic copy', () => {
  it('keeps a complete five-locale shell and translates scenario and fee labels', () => {
    expect(Object.keys(MEMBERSHIP_SITE_COPY).sort()).toEqual(['de', 'en', 'es', 'fr', 'pt']);
    expect(getMembershipScenarioLabel('de', 'worst', 'worst')).toBe('Konservativ');
    expect(getMembershipScenarioLabel('fr', 'best', 'best')).toBe('Meilleur cas');
    expect(getMembershipFeeStackLabel('es', 'patreon', 'fallback')).toContain('Patreon');
    expect(getMembershipFeeStackLabel('pt', 'unknown', 'fallback')).toBe('fallback');
  });

  it('translates known flag and verdict labels while preserving unknown fallbacks', () => {
    expect(getMembershipFlagTitle('de', 'MS-03', 'fallback')).toBe('Abwanderung vernichtet den Mitgliedswert');
    expect(getMembershipFlagTitle('fr', 'MS-99', 'fallback')).toBe('fallback');
    expect(getMembershipVerdict('es', 'Not ready — grow the audience first')).toBe('Aún no — aumenta primero la audiencia');
    expect(getMembershipVerdict('pt', 'Future analyzer verdict')).toBe('Future analyzer verdict');
  });

  it('interpolates locale-aware verdict notes without changing the analyzer inputs', () => {
    const values = {
      audience: 1500,
      realisticConversion: 0.03,
      members: 45,
      net: 220,
      monthlyCost: 625,
      hours: 25,
      rate: 25,
      breakEven: 4200,
      treadmillGap: -405,
      blended: 8.8,
      feeShare: 0.09,
      ltv: 176,
    };
    const note = getMembershipVerdictNote('de', 'Club pays less than your hours — launch for love, not money', values);
    expect(note).toContain('220');
    expect(note).not.toContain('At realistic conversion');
    expect(getMembershipVerdictNote('en-US', 'Unknown verdict', values)).toBe('Unknown verdict');
  });
});
