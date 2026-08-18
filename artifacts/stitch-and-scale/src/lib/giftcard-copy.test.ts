import { describe, expect, it } from 'vitest';
import { GIFTCARD_COPY, giftCardComplianceNote, giftCardEscheatOption, giftCardFlagNote, giftCardFlagTitle, giftCardInputHint, giftCardInputLabel, giftCardVerdictLabel, giftCardVerdictNote } from './giftcard-copy';

describe('Gift Card copy catalogue', () => {
  it('contains the primary visible vocabulary in all supported locales', () => {
    const keys = Object.keys(GIFTCARD_COPY.en) as Array<keyof typeof GIFTCARD_COPY.en>;
    expect(Object.keys(GIFTCARD_COPY)).toHaveLength(5);
    for (const locale of Object.values(GIFTCARD_COPY)) {
      for (const key of keys) expect(locale[key], key).toBeTruthy();
    }
    expect(GIFTCARD_COPY.de.intro).not.toBe(GIFTCARD_COPY.en.intro);
    expect(GIFTCARD_COPY.fr.intro).not.toBe(GIFTCARD_COPY.en.intro);
    expect(GIFTCARD_COPY.es.intro).not.toBe(GIFTCARD_COPY.en.intro);
    expect(GIFTCARD_COPY.pt.intro).not.toBe(GIFTCARD_COPY.en.intro);
    const verdict = 'Do not sell cards — liability exceeds float';
    for (const language of ['de', 'fr', 'es', 'pt'] as const) {
      expect(giftCardVerdictLabel(language, verdict)).not.toBe(verdict);
      expect(giftCardFlagTitle(language, 'GC-01', 'fallback')).not.toBe('fallback');
    }
  });

  it('localizes flag notes while preserving dynamic accounting values', () => {
    const values = {
      refunds: '$30.00',
      sales: '$100.00',
      refundSharePct: '30',
      escheatPct: '60',
      dormancyYears: '3',
      cashBackThreshold: '$10.00',
      netProfit: '$420.00',
      horizonMonths: '12',
      redemptionPct: '65',
      redeemedCostPct: '40',
      peakLiability: '$900.00',
      monthlySales: '9',
      breakagePct: '30',
      totalEscheat: '$500.00',
    };
    const fallback = 'Original analyzer note: $30.00';
    for (const language of ['de', 'fr', 'es', 'pt'] as const) {
      const note = giftCardFlagNote(language, 'GC-02', values, fallback);
      expect(note).not.toBe(fallback);
      expect(note).toContain('$30.00');
      expect(note).toContain('30');
    }
    expect(giftCardFlagNote('en', 'GC-06', values, fallback)).toContain('$420.00');
    expect(giftCardFlagNote('de', 'unknown-flag', values, fallback)).toBe(fallback);
  });

  it('localizes verdict detail while preserving dynamic accounting values', () => {
    const verdict = 'Worth running — float + breakage beat the cost of the liability';
    const values = {
      refunds: '$25.00',
      sales: '$100.00',
      netProfit: '$420.00',
      horizonMonths: '12',
      upliftValue: '$80.00',
      hasRefundCredit: true,
    };
    const fallback = 'Recognized profit $420.00 over 12 months.';
    for (const language of ['de', 'fr', 'es', 'pt'] as const) {
      const note = giftCardVerdictNote(language, verdict, values, fallback);
      expect(note).not.toBe(fallback);
      expect(note).toContain('$420.00');
      expect(note).toContain('12');
    }
    expect(giftCardVerdictNote('en', verdict, values, fallback)).toContain('$420.00');
    expect(giftCardVerdictNote('de', 'unknown verdict', values, fallback)).toBe(fallback);
  });

  it('localizes input labels for every supported non-English locale', () => {
    const labelCodes = ['cash-back', 'processing', 'redeemed-cost', 'breakage-assumption', 'admin-hours', 'hourly-rate', 'fee-income', 'horizon', 'refund-credit-liability', 'cash-back-payouts', 'stabilization'];
    for (const code of labelCodes) {
      for (const language of ['de', 'fr', 'es', 'pt'] as const) {
        expect(giftCardInputLabel(language, code, code), `${language}:${code}`).not.toBe(code);
      }
      expect(giftCardInputLabel('en', code, code)).toBe(code);
    }
  });

  it('localizes input hints for every supported non-English locale', () => {
    const hintCodes = ['card-sales', 'refund-credit', 'redemption', 'uplift', 'lag', 'dormancy', 'escheat-explain', 'cash-back', 'processing', 'redeemed-cost', 'breakage', 'admin-hours', 'fee-income', 'horizon', 'stat-cash', 'stat-uplift', 'stat-escheat', 'stat-peak', 'stat-margin', 'stat-pure-liability', 'stat-cash-back', 'stat-stabilize'];
    for (const code of hintCodes) {
      for (const language of ['de', 'fr', 'es', 'pt'] as const) {
        expect(giftCardInputHint(language, code, code), `${language}:${code}`).not.toBe(code);
      }
      expect(giftCardInputHint('en', code, code)).toBe(code);
    }
    expect(giftCardInputHint('en', 'unknown-hint', 'english fallback')).toBe('english fallback');
  });

  it('localizes escheat options while keeping values stable for calculation wiring', () => {
    const values = ['none', 'partial60', 'full'];
    const expected: Record<string, string> = {
      none: 'Exempt (merchandise-credit state)',
      partial60: '60% of face value',
      full: '100% of face value',
    };
    for (const value of values) {
      for (const language of ['de', 'fr', 'es', 'pt'] as const) {
        const label = giftCardEscheatOption(language, value, expected[value]);
        expect(label).not.toBe(expected[value]);
      }
      expect(giftCardEscheatOption('en', value, expected[value])).toBe(expected[value]);
      expect(giftCardEscheatOption('de', 'unknown-mode', 'fallback mode')).toBe('fallback mode');
    }
  });

  it('localizes the compliance checklist note and keeps English intact', () => {
    const fallback = 'Checklist the books do not print in any language.';
    for (const language of ['de', 'fr', 'es', 'pt'] as const) {
      const note = giftCardComplianceNote(language, fallback);
      expect(note).not.toBe(fallback);
      expect(note).toContain('H&M');
    }
    expect(giftCardComplianceNote('en', fallback)).toBe(fallback);
  });
});
