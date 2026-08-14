import { describe, expect, it } from 'vitest';
import {
  analyzeChannel,
  analyzeFunnel,
  defaultChannelDeal,
  defaultFunnelInput,
  generateBoxPitch,
  CHANNEL_TYPE_LABELS,
} from './channel-funnel-planner';

describe('analyzeChannel (subscription box)', () => {
  it('approves a well-priced box deal with buffer and insert', () => {
    const d = defaultChannelDeal();
    d.designFee = 250;
    d.audienceReach = 400;
    d.profileVisitPct = 6;
    d.visitorConvertPct = 8;
    d.visitorSpend = 25;
    d.exclusivityMonths = 3;
    d.baselineSalesPerMonth = 5;
    d.patternPrice = 9;
    d.workHours = 30;
    d.hourlyRate = 12;
    d.deliveryBufferWeeks = 3;
    d.hasMarketingInsert = true;
    d.paidInWriting = true;
    d.designFee = 420; // fee per subscriber: 420/400 = $1.05
    const r = analyzeChannel(d);
    expect(r.channelIncome).toBe(420);
    // audience: 400*0.06 = 24 visitors/mo * 0.08 = 1.92 buyers/mo * 25 * 6 months
    expect(r.audienceIncome).toBeCloseTo(288);
    // lost self-sell: 5 * 9 * 0.95 * 3 = 128.25
    expect(r.lostSelfSell).toBeCloseTo(128.25);
    // labour = 30h * 12 = 360; net = 420+288+50.4-128.25-360 = 270.15 → $9.01/hr, under the bar
    expect(r.netProfit).toBeCloseTo(270.15);
    expect(r.deadlineRisk).toBe('low');
    expect(r.verdict).toBe('maybe');
    expect(r.notes.some((n) => n.includes('Cash-positive but under the hourly bar'))).toBe(true);
  });

  it('rejects a box deal with a thin deadline buffer', () => {
    const d = defaultChannelDeal();
    d.designFee = 200;
    d.deliveryBufferWeeks = 1;
    const r = analyzeChannel(d);
    expect(r.deadlineRisk).toBe('high');
    expect(r.verdict).toBe('no');
    expect(r.notes.some((n) => n.includes('assemble a month ahead'))).toBe(true);
  });

  it('warns about missing marketing insert and written terms', () => {
    const d = defaultChannelDeal();
    d.designFee = 300;
    d.audienceReach = 300;
    d.profileVisitPct = 6;
    d.visitorConvertPct = 8;
    d.visitorSpend = 25;
    d.workHours = 25;
    d.deliveryBufferWeeks = 4;
    const r = analyzeChannel(d);
    expect(r.notes.some((n) => n.includes('10% of box suppliers'))).toBe(true);
    expect(r.notes.some((n) => n.includes('in writing'))).toBe(true);
    expect(r.stabilityRisk).toBeCloseTo(0.13);
  });

  it('flags long exclusivity longer than magazine windows', () => {
    const d = defaultChannelDeal();
    d.designFee = 400;
    d.audienceReach = 350;
    d.profileVisitPct = 6;
    d.visitorConvertPct = 8;
    d.visitorSpend = 20;
    d.exclusivityMonths = 9;
    d.workHours = 30;
    d.deliveryBufferWeeks = 4;
    d.hasMarketingInsert = true;
    d.paidInWriting = true;
    const r = analyzeChannel(d);
    expect(r.notes.some((n) => n.includes('4–5 month windows'))).toBe(true);
    // go downgraded to maybe because exclusivity > 6 months
    expect(['maybe', 'no']).toContain(r.verdict);
  });

  it('rejects a box deal that does not cover hours', () => {
    const d = defaultChannelDeal();
    d.designFee = 60;
    d.workHours = 40;
    d.deliveryBufferWeeks = 4;
    const r = analyzeChannel(d);
    expect(r.verdict).toBe('no');
    expect(r.notes.some((n) => n.includes('$80–$140'))).toBe(true);
  });

  it('rejects underpaid magazine work', () => {
    const d = defaultChannelDeal();
    d.type = 'magazine';
    d.designFee = 50;
    d.workHours = 25;
    const r = analyzeChannel(d);
    expect(r.verdict).toBe('no');
    expect(r.notes.some((n) => n.includes('50–85 hours'))).toBe(true);
  });

  it('approves well-paid magazine work under the ceiling', () => {
    const d = defaultChannelDeal();
    d.type = 'magazine';
    d.designFee = 700;
    d.exclusivityMonths = 4;
    d.baselineSalesPerMonth = 2;
    d.patternPrice = 8;
    d.workHours = 30;
    d.hourlyRate = 12;
    const r = analyzeChannel(d);
    expect(r.channelIncome).toBe(700);
    // net = 700 + 144 + 25.2 - 68.4 - 360 + effect-months lead flow → 454.7 → $15.2/hr above the bar
    expect(r.netProfit).toBeCloseTo(454.7);
    expect(r.effectiveHourly).toBeGreaterThan(12);
    expect(r.verdict).toBe('go');
  });
});

describe('analyzeFunnel', () => {
  it('approves a healthy list funnel clearing the hourly bar', () => {
    const f = defaultFunnelInput();
    f.listSize = 800;
    f.freebieLeadInPerMonth = 40;
    f.launchConversionPct = 4;
    f.launchPrice = 12;
    f.maintenanceHoursPerMonth = 2;
    f.hourlyRate = 12;
    f.monthsTracked = 6;
    const r = analyzeFunnel(f);
    // launch: 800 * 0.04 = 32 buyers * 12 = 384
    expect(r.launchSales).toBe(32);
    expect(r.launchRevenue).toBeCloseTo(384);
    expect(r.netProfit).toBeGreaterThan(0);
    expect(r.effectiveHourly).toBeGreaterThan(12);
    expect(r.notes.some((n) => n.includes('clears the $12/hr bar'))).toBe(true);
  });

  it('leads with the launch-week insight', () => {
    const r = analyzeFunnel(defaultFunnelInput());
    expect(r.launchWeekInsight).toContain('launch week');
    expect(r.launchWeekInsight).toContain('release-day email');
  });

  it('flags a sub-100 list as the bottleneck', () => {
    const f = defaultFunnelInput();
    f.listSize = 60;
    f.freebieLeadInPerMonth = 0;
    const r = analyzeFunnel(f);
    expect(r.notes.some((n) => n.includes('sub-100 list'))).toBe(true);
    expect(r.notes.some((n) => n.includes('lead magnet feeding the list'))).toBe(true);
  });

  it('counts lead-flow value at the cited $0.35/month norm', () => {
    const f = defaultFunnelInput();
    f.listSize = 300;
    f.freebieLeadInPerMonth = 20;
    f.monthsTracked = 6;
    const r = analyzeFunnel(f);
    // 20 * 6 = 120 leads * 0.35 * 6 months = 252
    expect(r.leadFlowValue).toBeCloseTo(252);
  });

  it('applies platform fees to gross revenue', () => {
    const f = defaultFunnelInput();
    f.listSize = 500;
    f.launchConversionPct = 3;
    f.evergreenConversionPct = 0;
    f.postLaunchConversionPct = 0;
    f.platformFeeRate = 0.05;
    const r = analyzeFunnel(f);
    // launch: 15 * 12 = 180; fees = 9
    expect(r.launchRevenue).toBeCloseTo(180);
    expect(r.fees).toBeCloseTo(9);
  });

  it('loses money when maintenance hours eat a tiny list', () => {
    const f = defaultFunnelInput();
    f.listSize = 80;
    f.freebieLeadInPerMonth = 0;
    f.launchConversionPct = 1;
    f.maintenanceHoursPerMonth = 10;
    f.hourlyRate = 15;
    const r = analyzeFunnel(f);
    expect(r.netProfit).toBeLessThan(0);
  });
});

describe('generateBoxPitch', () => {
  it('includes fee, exclusivity and the insert promise', () => {
    const pitch = generateBoxPitch({
      designerName: 'Me',
      patternName: 'Harbour Henley',
      boxName: 'The Wool Parcels',
      audienceReach: 350,
      feeAsk: 250,
      exclusivityAskMonths: 3,
      insertPromise: true,
    });
    expect(pitch).toContain('$250');
    expect(pitch).toContain('3 months of exclusivity');
    expect(pitch).toContain('marketing card with a personal discount code');
    expect(pitch).toContain('assembly deadline');
  });

  it('drops the insert paragraph when not promised', () => {
    const pitch = generateBoxPitch({
      designerName: 'Me',
      patternName: 'Harbour Henley',
      boxName: 'The Wool Parcels',
      audienceReach: 350,
      feeAsk: 200,
      exclusivityAskMonths: 4,
      insertPromise: false,
    });
    expect(pitch).not.toContain('marketing card');
  });
});

describe('CHANNEL_TYPE_LABELS', () => {
  it('covers all four channel types', () => {
    expect(Object.keys(CHANNEL_TYPE_LABELS)).toHaveLength(4);
    expect(CHANNEL_TYPE_LABELS.subbox).toBe('Subscription box');
  });
});
