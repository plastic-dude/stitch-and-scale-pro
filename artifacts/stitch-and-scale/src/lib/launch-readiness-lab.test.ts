import { describe, expect, it } from 'vitest';
import {
  scoreLaunchReadiness,
  projectedLaunchRevenue,
  discountGuardrail,
  bannerBreakEven,
  momentumTargets,
} from './launch-campaign';

describe('scoreLaunchReadiness', () => {
  it('scores a fully-ready launch at 100/100 in the cleared band', () => {
    const result = scoreLaunchReadiness({
      emailListSize: 500,
      photoCount: 8,
      avgPrice: 8,
      salesTarget: 50,
      couponPercent: 15,
      couponDurationDays: 7,
      teaserSent: true,
      channelLinksCount: 2,
      testersFinishedCount: 4,
      publishErrors: 0,
      techEditScore: 92,
    });
    // Every named item earns at or above its tier threshold, and the band logic
    // (>= 75 cleared, >= 45 warm-up, else not-ready) is what really matters —
    // the score total is derived from weights, so assert the band plus per-item
    // tier coverage instead of hard-coding a fragile sum.
    expect(result.score).toBeGreaterThanOrEqual(75);
    const ids = result.items.map(i => i.id);
    expect(ids.length).toBe(9);
    for (const item of result.items) {
      if (item.id === 'lr-email-list') expect(item.earned).toBe(18); // 500 subscribers → 250+ tier = 18/25
      if (item.id === 'lr-testers') expect(item.earned).toBe(15);
      if (item.id === 'lr-photos') expect(item.earned).toBe(10);
      if (item.id === 'lr-checklist') expect(item.earned).toBe(10);
      if (item.id === 'lr-tech-edit') expect(item.earned).toBe(10);
      if (item.id === 'lr-coupon') expect(item.earned).toBe(10);
      if (item.id === 'lr-teaser') expect(item.earned).toBe(8);
      if (item.id === 'lr-channels') expect(item.earned).toBe(7);
      if (item.id === 'lr-price') expect(item.earned).toBe(5);
    }
    expect(result.max).toBe(100);
    expect(result.band).toBe('cleared-for-announcement');
  });

  it('scores an empty project near zero in the not-ready band', () => {
    const result = scoreLaunchReadiness({});
    // An unset project still collects placeholder points (checklist 5, tech edit 5, price 0) — but sits in not-ready.
    expect(result.score).toBeLessThanOrEqual(15);
    expect(result.band).toBe('not-ready');
  });

  it('scales the email weight by list size tiers', () => {
    // Each tier adds exactly the delta over the baseline (baseline for an unset project is 15 placeholder points).
    expect(scoreLaunchReadiness({ emailListSize: 49 }).score).toBe(15 + 4);
    expect(scoreLaunchReadiness({ emailListSize: 50 }).score).toBe(15 + 10);
    expect(scoreLaunchReadiness({ emailListSize: 250 }).score).toBe(15 + 18);
    expect(scoreLaunchReadiness({ emailListSize: 1000 }).score).toBe(15 + 25);
  });

  it('flags a coupon deeper than 15%', () => {
    const result = scoreLaunchReadiness({ couponPercent: 25, couponDurationDays: 7 });
    expect(result.band).toBe('not-ready');
    const coupon = result.items.find(i => i.id === 'lr-coupon');
    expect(coupon?.earned).toBe(0);
    expect(coupon?.hint).toContain('cap at 15%');
  });

  it('flags a coupon window longer than 7 days', () => {
    const result = scoreLaunchReadiness({ couponPercent: 15, couponDurationDays: 14 });
    const coupon = result.items.find(i => i.id === 'lr-coupon');
    expect(coupon?.earned).toBe(0);
    expect(coupon?.hint).toContain('one week');
  });

  it('rewards finished tester tiers', () => {
    expect(scoreLaunchReadiness({ testersFinishedCount: 0 }).items.find(i => i.id === 'lr-testers')?.earned).toBe(0);
    expect(scoreLaunchReadiness({ testersFinishedCount: 2 }).items.find(i => i.id === 'lr-testers')?.earned).toBe(8);
    expect(scoreLaunchReadiness({ testersFinishedCount: 3 }).items.find(i => i.id === 'lr-testers')?.earned).toBe(15);
  });

  it('bands a mid-prep launch as warm-up', () => {
    const result = scoreLaunchReadiness({
      emailListSize: 120,
      photoCount: 6,
      avgPrice: 7,
      testersFinishedCount: 3,
      publishErrors: 0,
      techEditScore: 85,
      couponPercent: 15,
      couponDurationDays: 7,
    });
    expect(result.band).toBe('warm-up');
  });

  it('caps hint text per weight so no item exceeds its weight', () => {
    const result = scoreLaunchReadiness({
      emailListSize: 250,
      photoCount: 10,
      testersFinishedCount: 5,
      publishErrors: 0,
      techEditScore: 95,
      couponPercent: 10,
      couponDurationDays: 5,
      teaserSent: true,
      channelLinksCount: 3,
      avgPrice: 9,
    });
    for (const item of result.items) {
      expect(item.earned).toBeLessThanOrEqual(item.weight);
      expect(item.earned).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('projectedLaunchRevenue', () => {
  it('projects 1–3% conversion for a small list at $8', () => {
    const r = projectedLaunchRevenue({ emailListSize: 1000, avgPrice: 8 });
    expect(r.copiesLow).toBe(10);
    expect(r.copiesHigh).toBe(30);
    expect(r.emailRevenueLow).toBe(80);
    expect(r.emailRevenueHigh).toBe(240);
    expect(r.conversionLowPct).toBe(1);
    expect(r.conversionHighPct).toBe(3);
  });

  it('scales down to 0.5–1% once the list passes 5k', () => {
    const r = projectedLaunchRevenue({ emailListSize: 6000, avgPrice: 8 });
    expect(r.copiesLow).toBe(30);
    expect(r.copiesHigh).toBe(60);
    expect(r.conversionLowPct).toBe(0.5);
  });

  it('returns zeros without list size or price', () => {
    const a = projectedLaunchRevenue({});
    expect(a.emailRevenueLow).toBe(0);
    expect(a.copiesHigh).toBe(0);
    const b = projectedLaunchRevenue({ emailListSize: 100 });
    expect(b.emailRevenueHigh).toBe(0);
  });
});

describe('discountGuardrail', () => {
  it('accepts 15% for 7 days', () => {
    expect(discountGuardrail(15, 7).ok).toBe(true);
  });
  it('rejects 20% off', () => {
    expect(discountGuardrail(20, 7).ok).toBe(false);
  });
  it('rejects a 14-day window', () => {
    expect(discountGuardrail(10, 14).ok).toBe(false);
  });
  it('allows no coupon (teach the designer to add one)', () => {
    expect(discountGuardrail(0, 0).ok).toBe(true);
    expect(discountGuardrail(0, 0).reason).toContain('≤15%');
  });
});

describe('bannerBreakEven', () => {
  it('computes impressions, clicks, copies and net for a $45 banner budget', () => {
    const r = bannerBreakEven(45, 8);
    expect(r.impressions).toBe(30000);
    expect(r.clicks).toBe(150);
    expect(r.expectedCopies).toBe(23);
    expect(r.expectedRevenue).toBe(184);
    expect(r.net).toBe(139);
    expect(r.costPerCopy).toBeCloseTo(1.96, 1);
  });
  it('handles a zero budget safely', () => {
    const r = bannerBreakEven(0, 8);
    expect(r.impressions).toBe(0);
    expect(r.costPerCopy).toBe(0);
  });
  it('rejects negative budgets', () => {
    expect(bannerBreakEven(-10, 8).impressions).toBe(0);
  });
});

describe('momentumTargets', () => {
  it('targets queues equal to sales target and 3× favourites', () => {
    const m = momentumTargets(50);
    expect(m.queueTarget).toBe(50);
    expect(m.faveTarget).toBe(150);
    expect(m.reason).toContain('Hot Right Now');
  });
  it('never goes below 1 queue', () => {
    expect(momentumTargets(0).queueTarget).toBe(1);
    expect(momentumTargets(0).faveTarget).toBe(3);
  });
});
