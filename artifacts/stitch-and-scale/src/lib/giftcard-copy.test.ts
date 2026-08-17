import { describe, expect, it } from 'vitest';
import { GIFTCARD_COPY, giftCardFlagNote, giftCardFlagTitle, giftCardVerdictLabel, giftCardVerdictNote } from './giftcard-copy';

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
});
