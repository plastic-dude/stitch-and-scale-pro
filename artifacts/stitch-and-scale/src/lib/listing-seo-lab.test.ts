import { describe, expect, it } from 'vitest';
import {
  guessItemType,
  scoreListing,
  netPerSale,
  buildListingKit,
  momentumTargets,
  type ListingInputs,
} from './listing-seo-lab';
import { SAMPLE_CREW_NECK_SWEATER } from './sample-projects';

function fullInputs(overrides: Partial<ListingInputs> = {}): ListingInputs {
  return {
    title: 'Demo Crewneck Sweater in Worsted',
    yarnWeight: 'worsted',
    sizeCount: 9,
    writtenAndCharted: true,
    sizeInclusive: true,
    listPrice: 8,
    photoCount: 6,
    tags: ['raglan', 'pullover', 'easy', 'quick knit', 'cozy', 'winter', 'gift', 'unisex'],
    descriptionWords: 180,
    teaserReady: true,
    emailListReady: true,
    ...overrides,
  };
}

describe('guessItemType', () => {
  it('recognizes a sweater from the project name', () => {
    expect(guessItemType(SAMPLE_CREW_NECK_SWEATER)).toBe('sweater');
  });

  it('falls back to other when nothing matches', () => {
    expect(guessItemType({ name: 'Mystery Object', sections: [] } as never)).toBe('other');
  });
});

describe('scoreListing', () => {
  it('scores a fully-prepared listing as Strong — publish with push', () => {
    const score = scoreListing(SAMPLE_CREW_NECK_SWEATER, fullInputs());
    expect(score.total).toBeGreaterThan(80);
    expect(score.verdict).toBe('Strong — publish with push');
    expect(score.total).toBeLessThanOrEqual(100);
  });

  it('gives 15 title points when title carries garment + weight + length', () => {
    const score = scoreListing(SAMPLE_CREW_NECK_SWEATER, fullInputs());
    const title = score.items.find((i) => i.key === 'title');
    expect(title?.points).toBe(15);
  });

  it('deducts title points when the weight keyword is missing', () => {
    const score = scoreListing(
      SAMPLE_CREW_NECK_SWEATER,
      fullInputs({ title: 'Demo Crewneck Sweater' }),
    );
    const title = score.items.find((i) => i.key === 'title');
    expect(title?.points).toBeLessThan(15);
    expect(title?.hint).toMatch(/yarn weight/);
  });

  it('deducts price points when priced outside the market band', () => {
    const low = scoreListing(SAMPLE_CREW_NECK_SWEATER, fullInputs({ listPrice: 2 }));
    const priceItem = low.items.find((i) => i.key === 'price');
    expect(priceItem?.points).toBeLessThan(15);
  });

  it('rewards size-inclusive 9+ sizes and penalizes a narrow range', () => {
    const narrow = scoreListing(SAMPLE_CREW_NECK_SWEATER, fullInputs({ sizeCount: 3, sizeInclusive: false }));
    const sizes = narrow.items.find((i) => i.key === 'sizes');
    expect(sizes?.points).toBe(4);
    const wide = scoreListing(SAMPLE_CREW_NECK_SWEATER, fullInputs());
    expect(wide.items.find((i) => i.key === 'sizes')?.points).toBe(15);
  });

  it('verdict steps down as preparedness drops', () => {
    const empty = scoreListing(SAMPLE_CREW_NECK_SWEATER, {
      title: '',
      yarnWeight: 'worsted',
      sizeCount: 1,
      writtenAndCharted: false,
      sizeInclusive: false,
      listPrice: 0,
      photoCount: 0,
      tags: [],
      descriptionWords: 0,
      teaserReady: false,
      emailListReady: false,
    });
    expect(empty.total).toBe(0);
    expect(empty.verdict).toBe('Not ready — hold the publish');
    const mid = scoreListing(SAMPLE_CREW_NECK_SWEATER, fullInputs({ tags: [], photoCount: 2, listPrice: 0 }));
    expect(mid.total).toBeGreaterThanOrEqual(35);
    expect(mid.total).toBeLessThan(60);
    expect(mid.verdict).toBe('Almost — a few fixes');
  });

  it('caps scores at 100', () => {
    const score = scoreListing(SAMPLE_CREW_NECK_SWEATER, fullInputs());
    expect(score.total).toBeLessThanOrEqual(100);
  });
});

describe('netPerSale', () => {
  it('shows Ravelry netting the most on a $6 pattern (documented fee facts)', () => {
    const nets = netPerSale(6);
    const ravelry = nets.find((n) => n.channel === 'Ravelry')!;
    const etsy = nets.find((n) => n.channel === 'Etsy')!;
    const love = nets.find((n) => n.channel === 'LoveCrafts')!;
    expect(ravelry.net).toBeCloseTo(5.526, 1); // (6 - 0.3) * 0.971
    expect(etsy.net).toBeLessThan(ravelry.net);
    expect(love.net).toBeCloseTo(4.5, 2); // 25% seller fee band
  });

  it('protects against negative prices', () => {
    for (const n of netPerSale(-5)) expect(n.net).toBeGreaterThanOrEqual(0);
  });
});

describe('buildListingKit', () => {
  it('generates a kit from project + inputs without inventing facts', () => {
    const kit = buildListingKit(SAMPLE_CREW_NECK_SWEATER, fullInputs());
    expect(kit.title).toBe('Demo Crewneck Sweater in Worsted');
    expect(kit.tags).toContain('knitting pattern');
    expect(kit.tags).toContain('worsted');
    expect(kit.tags).toContain('sweater');
    expect(kit.tags.split(',').length).toBeLessThanOrEqual(13);
    expect(kit.description).toMatch(/sizes XS–5XL \(size-inclusive\)/);
    expect(kit.description).toMatch(/Pattern romance/);
  });

  it('formula-builds a title when the supplied one is too short', () => {
    const kit = buildListingKit(SAMPLE_CREW_NECK_SWEATER, fullInputs({ title: 'Short' }));
    expect(kit.title).toContain('Sweater');
    expect(kit.title).toContain('Worsted');
    expect(kit.title.length).toBeGreaterThan(10);
  });
});

describe('momentumTargets', () => {
  it('raises targets for size-inclusive 9+ size patterns', () => {
    const t = momentumTargets(SAMPLE_CREW_NECK_SWEATER, fullInputs());
    expect(t.queues).toBe('30+ queues in the first week');
    const narrow = momentumTargets(SAMPLE_CREW_NECK_SWEATER, fullInputs({ sizeCount: 3, sizeInclusive: false }));
    expect(narrow.queues).toBe('10+ queues in the first week');
    expect(narrow.favourites).toBe('15+ favourites');
  });
});
