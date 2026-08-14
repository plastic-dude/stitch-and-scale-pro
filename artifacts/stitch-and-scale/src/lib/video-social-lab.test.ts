import { describe, expect, it } from 'vitest';
import {
  VIDEO_LAB_DEFAULTS,
  analyzeVideoSocial,
  decayDeliveredBy,
} from './video-social-lab';

const defaults = (): typeof VIDEO_LAB_DEFAULTS => ({ ...VIDEO_LAB_DEFAULTS });

describe('decayDeliveredBy', () => {
  it('IG feed delivers ~82% of lifetime views within a week (hours-lived feed)', () => {
    expect(decayDeliveredBy('instagram', 7)).toBeGreaterThan(0.8);
  });
  it('Pinterest delivers almost nothing within a week (evergreen pin)', () => {
    expect(decayDeliveredBy('pinterest', 7)).toBeLessThan(0.02);
  });
  it('Pinterest still only delivers a fraction after a full month', () => {
    expect(decayDeliveredBy('pinterest', 30)).toBeLessThan(0.1);
  });
  it('TikTok slow-burn: most views within a week but still trailing after day 1', () => {
    const d7 = decayDeliveredBy('tiktok', 7);
    expect(d7).toBeGreaterThan(0.7);
    expect(decayDeliveredBy('tiktok', 1)).toBeLessThan(d7);
  });
  it('decay is monotonic and bounded at 1', () => {
    expect(decayDeliveredBy('youtube', 90)).toBeLessThanOrEqual(1);
    expect(decayDeliveredBy('email', 7)).toBeGreaterThan(decayDeliveredBy('email', 1));
  });
});

describe('analyzeVideoSocial', () => {
  it('returns five channel scores including email', () => {
    const r = analyzeVideoSocial(defaults());
    expect(r.platforms.map((p) => p.platform)).toEqual([
      'instagram', 'tiktok', 'pinterest', 'youtube', 'email',
    ]);
  });

  it('email sales flow through directly at the email price, not the channel rate', () => {
    const r = analyzeVideoSocial(defaults());
    const email = r.platforms.find((p) => p.platform === 'email')!;
    expect(email.attributableSales).toBe(8);
    expect(email.attributableNet).toBeCloseTo(8 * 7.8, 2);
  });

  it('the funnel compounds views → clicks → sales on social channels', () => {
    const r = analyzeVideoSocial(defaults());
    for (const p of r.platforms) {
      if (p.platform === 'email') continue;
      expect(p.monthlyClicks).toBeLessThanOrEqual(p.monthlyViews);
      expect(p.attributableSales).toBeLessThanOrEqual(p.monthlyClicks);
    }
  });

  it('default inputs: email is the top earner per hour (documented buyer channel) and the verdict names it', () => {
    const r = analyzeVideoSocial(defaults());
    expect(r.flagCompare[0].label).toBe('Best channel');
    expect(r.flagCompare[0].netPerHour).toBeGreaterThan(100);
    expect(r.verdict).toContain('Email list');
  });

  it('default inputs: TikTok earns the highest net among purely social channels', () => {
    const r = analyzeVideoSocial(defaults());
    const social = r.platforms.filter((p) => p.platform !== 'email');
    const best = social.reduce((a, b) => (b.attributableNet > a.attributableNet ? b : a));
    expect(best.platform).toBe('tiktok');
  });

  it('posts with no destination capture zero clicks (VS-04)', () => {
    const r = analyzeVideoSocial({ ...defaults(), linkDestination: 'none' });
    expect(r.platforms.filter((p) => p.platform !== 'email').every((p) => p.monthlyClicks === 0)).toBe(true);
    expect(r.flags.some((f) => f.id === 'VS-04')).toBe(true);
  });

  it('VS-02 fires for videos over 60 seconds', () => {
    const r = analyzeVideoSocial({ ...defaults(), videoUnderSixtySec: false });
    expect(r.flags.some((f) => f.id === 'VS-02')).toBe(true);
  });

  it('VS-03 fires without a first-3-seconds hook', () => {
    const r = analyzeVideoSocial({ ...defaults(), hookStrong: false });
    expect(r.flags.some((f) => f.id === 'VS-03')).toBe(true);
  });

  it('VS-05 fires when each post costs 2+ hours', () => {
    const r = analyzeVideoSocial({ ...defaults(), minutesPerPost: 150 });
    expect(r.flags.some((f) => f.id === 'VS-05')).toBe(true);
  });

  it('VS-06 fires when a real list exists but email is not the top earner', () => {
    const r = analyzeVideoSocial({ ...defaults(), emailSalesPerMonth: 1, patternPriceEmail: 5 });
    const emailNet = r.platforms.find((p) => p.platform === 'email')!.attributableNet;
    const tiktokNet = r.platforms.find((p) => p.platform === 'tiktok')!.attributableNet;
    expect(emailNet).toBeLessThan(tiktokNet);
    expect(r.flags.some((f) => f.id === 'VS-06')).toBe(true);
  });

  it('VS-06 does not fire when email is the top earner', () => {
    const r = analyzeVideoSocial(defaults());
    expect(r.flags.some((f) => f.id === 'VS-06')).toBe(false);
  });

  it('VS-06 does not fire without a list', () => {
    const r = analyzeVideoSocial({ ...defaults(), emailSalesPerMonth: 0, listSize: 0 });
    expect(r.flags.some((f) => f.id === 'VS-06')).toBe(false);
  });

  it('no flags at healthy inputs except VS-06-relevant conditions', () => {
    const r = analyzeVideoSocial({
      ...defaults(),
      postsPerMonth: 12,
      minutesPerPost: 40,
      videoUnderSixtySec: true,
      hookStrong: true,
      hasCallToAction: true,
      linkDestination: 'pattern_page',
    });
    expect(r.flags.filter((f) => f.id !== 'VS-06').length).toBe(0);
  });

  it('zero content (no posts anywhere) returns the zero-content verdict', () => {
    const r = analyzeVideoSocial({ ...defaults(), postsPerMonth: 0, listSize: 0, emailSalesPerMonth: 0 });
    expect(r.verdict).toContain('Even one monthly video beats zero');
  });

  it('list-building destination compounds future value via list growth', () => {
    const r = analyzeVideoSocial({ ...defaults(), linkDestination: 'list_building' });
    expect(r.suggestion).toContain('compound');
  });

  it('under-60s + strong hook multiply views above base', () => {
    const base = analyzeVideoSocial({ ...defaults(), videoUnderSixtySec: false, hookStrong: false });
    const boosted = analyzeVideoSocial({ ...defaults() });
    const ttBase = base.platforms.find((p) => p.platform === 'tiktok')!.monthlyViews;
    const ttBoosted = boosted.platforms.find((p) => p.platform === 'tiktok')!.monthlyViews;
    expect(ttBoosted).toBeGreaterThan(ttBase * 1.3);
  });

  it('CTA absence costs conversion on pattern-page links', () => {
    const withCta = analyzeVideoSocial({ ...defaults(), hasCallToAction: true });
    const withoutCta = analyzeVideoSocial({ ...defaults(), hasCallToAction: false });
    const w = withCta.platforms.find((p) => p.platform === 'tiktok')!.monthlyClicks;
    const wo = withoutCta.platforms.find((p) => p.platform === 'tiktok')!.monthlyClicks;
    expect(wo).toBeLessThan(w);
  });

  it('total net equals the sum of per-channel nets', () => {
    const r = analyzeVideoSocial(defaults());
    expect(r.totalAttributableNet).toBeCloseTo(
      r.platforms.reduce((s, p) => s + p.attributableNet, 0),
      6,
    );
  });
});
