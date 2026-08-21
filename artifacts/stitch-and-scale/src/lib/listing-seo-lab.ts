import { advisePrice, ITEM_TYPE_LABELS, type ItemType } from './pattern-pricing-advisor';
import type { PatternProject } from './grading-engine';

/**
 * Listing SEO Lab — per-pattern listing readiness before it goes live.
 *
 * Market reality (session-48 research): Ravelry charges 0% commission
 * (~2.9% + $0.30 processing) vs Etsy's layered fees ($6 pattern: ~$5.70
 * Ravelry net vs ~$5.10 Etsy) and LoveCrafts' 25% seller fee in the
 * $40–$1,900/month band (~$4.20). Discovery on Ravelry is filter-driven
 * (attributes, tags, title text) plus momentum signals (queues, favourites,
 * projects, HRN) — not paid placement. Nobody gives designers a pre-publish
 * listing audit; generic Etsy SEO tools ignore the knitting taxonomy.
 * Our strength: the app already knows the pattern — score the listing and
 * generate the paste-ready listing kit in one click.
 */

export type SkillLevelLabel = 'Beginner' | 'Easy' | 'Intermediate' | 'Advanced' | 'Expert';

export interface ListingInputs {
  /** Listing title the designer plans to use (e.g. "Willow Raglan Sweater"). */
  title: string;
  /** Yarn weight the listing will advertise. */
  yarnWeight: string;
  /** Number of sizes the listing will advertise. */
  sizeCount: number;
  /** Whether the listing shows written + charted instructions. */
  writtenAndCharted: boolean;
  /** Whether the listing advertises size-inclusive range (XS–5XL style). */
  sizeInclusive: boolean;
  /** Planned listing price in USD. */
  listPrice: number;
  /** Photo assets ready (0 = none photographed yet). */
  photoCount: number;
  /** Listing tags the designer plans to use. */
  tags: string[];
  /** Description drafted (word count proxy). */
  descriptionWords: number;
  /** Teaser/announcement channel links ready. */
  teaserReady: boolean;
  /** Email list exists for the launch announcement. */
  emailListReady: boolean;
}

export interface ListingItem {
  key: string;
  label: string;
  /** 0–15 earned points. */
  points: number;
  max: number;
  /** Actionable hint when points < max. */
  hint: string;
}

export interface ListingScore {
  total: number; // 0–100
  items: ListingItem[];
  verdict: 'Not ready — hold the publish' | 'Almost — a few fixes' | 'Ready to publish' | 'Strong — publish with push';
}

const WEIGHT_KEYWORDS: Record<string, string[]> = {
  lace: ['lace', 'laceweight', 'fine'],
  fingering: ['fingering', 'sock yarn', 'sock-weight'],
  sport: ['sport', 'sportweight'],
  DK: ['dk', 'double knit', 'light worsted'],
  worsted: ['worsted', 'afghan', 'araman'],
  bulky: ['bulky', 'chunky'],
  'super-bulky': ['super bulky', 'jumbo', 'roving'],
};

/** Is the planned title keyword-carrying for the yarn-weight search surface? */
function titleCarriesWeight(title: string, weight: string): boolean {
  const t = title.toLowerCase();
  const kws = WEIGHT_KEYWORDS[weight] ?? [];
  return kws.some((k) => t.includes(k));
}

/** Does the title name the garment type the design actually is? */
function titleNamesGarment(title: string, project: PatternProject): boolean {
  const t = title.toLowerCase();
  const guess = guessItemType(project);
  if (guess === 'other') return t.length >= 10; // unguessable garment: require a descriptive title
  const forms: Record<string, string[]> = {
    sweater: ['sweater', 'pullover', 'jumper'],
    cardigan: ['cardigan'],
    shawl: ['shawl', 'wrap', 'stole'],
    hat: ['hat', 'beanie', 'toque', 'beret'],
    scarf: ['scarf', 'cowl', 'snood'],
    socks: ['sock', 'socks', 'stocking'],
    mitts: ['mitten', 'mitts', 'fingerless'],
  };
  return (forms[guess] ?? []).some((f) => t.includes(f));
}

export function guessItemType(project: PatternProject): ItemType {
  const name = (project.name || '').toLowerCase();
  const sections = (project.sections || []).map((s) => (s.name || '').toLowerCase());
  const all = [name, ...sections].join(' ');
  if (/sweater|pullover|jumper|top/.test(all)) return 'sweater' as ItemType
  if (/cardigan/.test(all)) return 'cardigan' as ItemType
  if (/shawl|wrap|stole/.test(all)) return 'shawl' as ItemType
  if (/hat|beanie|toque|beret/.test(all)) return 'hat' as ItemType
  if (/scarf|cowl|snood/.test(all)) return 'scarf' as ItemType
  if (/sock|stocking/.test(all)) return 'socks' as ItemType
  if (/mit|fingerless/.test(all)) return 'mitts' as ItemType
  return 'other' as ItemType
}

export function scoreListing(project: PatternProject, inputs: ListingInputs): ListingScore {
  const items: ListingItem[] = [];
  const hasWeight = titleCarriesWeight(inputs.title, inputs.yarnWeight);
  const namesGarment = titleNamesGarment(inputs.title, project);
  const titleLenOk = inputs.title.trim().length >= 10 && inputs.title.trim().length <= 70;
  const titlePoints = (hasWeight ? 6 : 0) + (namesGarment ? 5 : 0) + (titleLenOk ? 4 : 0);
  items.push({
    key: 'title', label: 'Title keywords', points: titlePoints, max: 15,
    hint: !titleLenOk
      ? 'Titles rank best between 10 and 70 characters. Yours is ' + inputs.title.trim().length + '.'
      : !namesGarment
      ? 'Name the garment type in the title (e.g. "sweater", "cardigan") — it is the first thing Ravelry filters match.'
      : !hasWeight
      ? `Add the yarn weight to the title ("…in Worsted", "a Fingering-Weight …") — weight is the top search attribute on Ravelry.`
      : 'Title carries garment type, weight, and sits in the rank-friendly length band.',
  });

  const maxTags = 13; // Ravelry's practical tag ceiling per listing; the market convention
  const tagPoints = Math.min(15, Math.round((inputs.tags.length / maxTags) * 15));
  items.push({
    key: 'tags', label: 'Listing tags', points: tagPoints, max: 15,
    hint: inputs.tags.length < maxTags
      ? `Use all 13 tag slots — every tag is a free filter match. ${inputs.tags.length}/13 used.`
      : 'All 13 slots used — check they span yarn weight, garment, technique, and skill keywords.',
  });

  const photoPoints = Math.min(15, Math.round((inputs.photoCount / 7) * 15));
  items.push({
    key: 'photos', label: 'Photos', points: photoPoints, max: 15,
    hint: inputs.photoCount < 6
      ? `Listings with 6–8 photos outperform — front, worn, stitch detail, flat schematic, WIP/process, personal shot. You have ${inputs.photoCount}.`
      : 'Photo set meets the 6–8 best-practice band.',
  });

  // Price vs the market band from advisePrice (reuses the verified pricing seam).
  const itemType = guessItemType(project);
  const priceAdvice = advisePrice({
    itemType, skillLevel: 'intermediate', sizeCount: Math.max(1, inputs.sizeCount),
    techEdited: true, testKnitted: false, hoursWorked: 0, hourlyRate: 0,
    currentPrice: inputs.listPrice, marketTarget: 'standard',
  });
  const band = priceAdvice.bands.find((b) => b.label === 'Market') ?? priceAdvice.bands[0];
  const inBand = inputs.listPrice >= band.low && inputs.listPrice <= band.high;
  const nearBand = !inBand && inputs.listPrice >= band.low * 0.75 && inputs.listPrice <= band.high * 1.5 && inputs.listPrice > 0;
  const pricePoints = inBand ? 15 : nearBand ? 7 : inputs.listPrice > 0 ? 2 : 0;
  const typeLabel = ITEM_TYPE_LABELS[itemType];
  items.push({
    key: 'price', label: 'Listing price vs band', points: pricePoints, max: 15,
    hint: inputs.listPrice <= 0
      ? 'Set a listing price — unpriced patterns stall in filter flows.'
      : inBand
      ? `Price $${inputs.listPrice} sits inside the documented ${typeLabel} market band ($${band.low}–$${band.high}).`
      : `Consider $${band.low}–$${band.high} for ${typeLabel} — HRN data shows the paid sweet spot at $5–6 overall; priced away from the band loses filter comparisons.`
  });

  // Size-range callout: size-inclusive range is a documented listing premium-justifier.
  const sizePoints = inputs.sizeCount >= 9 && inputs.sizeInclusive
    ? 15
    : inputs.sizeCount >= 5
    ? 9
    : inputs.sizeCount >= 2 ? 4 : 0;
  items.push({
    key: 'sizes', label: 'Size-range callout', points: sizePoints, max: 15,
    hint: inputs.sizeCount < 9 || !inputs.sizeInclusive
      ? inputs.sizeCount < 5
        ? 'Advertise the size count in the first line of the listing ("sizes XS–5XL" beats "multiple sizes").'
        : `Only ${inputs.sizeCount} sizes — the highest-ranking garment patterns ship 9+ sizes; size-inclusive callouts lift conversion.`
      : '9+ sizes advertised as inclusive (e.g. XS–5XL) — the strongest documented callout.',
  });

  const instructionsPoints = inputs.writtenAndCharted ? 10 : 0;
  items.push({
    key: 'instructions', label: 'Written + charted', points: instructionsPoints, max: 10,
    hint: inputs.writtenAndCharted
      ? 'Both written and charted instructions advertised — the intersection of the largest instruction-sub-categories.'
      : 'Advertise "written instructions + charts" in the listing — filters surface it and knitters search for it.',
  });

  const channelPoints = (inputs.teaserReady ? 5 : 0) + (inputs.emailListReady ? 5 : 0);
  items.push({
    key: 'channels', label: 'Announcement channels', points: channelPoints, max: 10,
    hint: !inputs.emailListReady && !inputs.teaserReady
      ? 'Queue your announcement channels: a teaser post and an email-list blast are the two strongest HRN drivers.'
      : !inputs.emailListReady ? 'Add an email-list announcement — newsletters outperform social for craft purchases.' : !inputs.teaserReady ? 'Add a teaser/announcement link — new-release visibility is a documented HRN driver.' : 'Teaser + email channels both ready.',
  });

  const total = Math.round(items.reduce((s, i) => s + i.points, 0));
  let verdict: ListingScore['verdict'];
  if (total >= 80) verdict = 'Strong — publish with push';
  else if (total >= 60) verdict = 'Ready to publish';
  else if (total >= 35) verdict = 'Almost — a few fixes';
  else verdict = 'Not ready — hold the publish';
  return { total, items, verdict };
}

/** Net revenue per sale by channel — documented fee facts (session-48 research). */
export function netPerSale(price: number): { channel: string; net: number; feeNote: string }[] {
  const p = Math.max(0, Number.isFinite(price) ? price : 0);
  return [
    { channel: 'Ravelry', net: Math.round(Math.max(p - 0.3, 0) * 0.971 * 100) / 100, feeNote: '0% commission, ~2.9% + $0.30 payment processing' },
    { channel: 'Etsy', net: Math.round(Math.max((p - 0.2) * 0.9 - 0.25 - Math.max(p * 0.03 + 0.25, 0), 0) * 100) / 100, feeNote: '$0.20 listing (4 months) + 6.5% transaction + 3% + $0.25 payment' },
    { channel: 'LoveCrafts', net: Math.round(Math.max(p * 0.75, 0) * 100) / 100, feeNote: '25% seller fee in the $40–$1,900/month band (free above)' },
  ];
}

/** Paste-ready listing kit generated strictly from the project + inputs. */
export interface ListingKit {
  /** Formula-built title (garment + weight + hook). */
  title: string;
  /** 13-tag block ready to paste. */
  tags: string;
  /** Description skeleton with romance copy placeholder spots, no invented facts. */
  description: string;
  /** quarantined if title or description is missing or too short */
  isComplete: boolean;
}

export function buildListingKit(project: PatternProject, inputs: ListingInputs): ListingKit {
  const garment = guessItemType(project);
  const weight = inputs.yarnWeight || 'worsted';
  const weightLabel = weight === 'super-bulky' ? 'Super Bulky' : weight.charAt(0).toUpperCase() + weight.slice(1);
  const title = inputs.title.trim().length >= 10 && titleNamesGarment(inputs.title, project)
    ? inputs.title.trim()
    : garment
    ? `${project.name || 'Pattern'} ${garment.charAt(0).toUpperCase() + garment.slice(1)} in ${weightLabel} — ${inputs.sizeInclusive ? 'sizes XS–5XL' : `${inputs.sizeCount} sizes`}`
    : `${project.name || 'Pattern'} in ${weightLabel}`;
  const sizeLine = inputs.sizeInclusive ? 'sizes XS–5XL (size-inclusive)' : `${inputs.sizeCount} sizes`;
  const instLine = inputs.writtenAndCharted ? 'written instructions + charts' : `${inputs.sizeCount} sizes`;
  const tags = [
    'knitting pattern', weight, garment || 'knitwear', 'handmade', instLine,
    ...inputs.tags.filter((t, i) => i < 8),
  ].slice(0, 13).join(', ');
  const description = [
    `**${title}** — ${sizeLine}.`,
    '',
    `Knit in ${weightLabel}-weight yarn${inputs.writtenAndCharted ? ', with both written instructions and charts' : ''}.`,
    '',
    '[Pattern romance: the design story — what inspired it, what the fabric feels like, when you will reach for it. 2–3 sentences, no invented claims.]',
    '',
    `What you get: the full pattern PDF for ${sizeLine}${inputs.writtenAndCharted ? ' (written + charts)' : ''}.`,
    'Always check gauge — and always list your own swatch numbers.',
  ].join('\n');
  
  const score = scoreListing(project, inputs);
  const isComplete = title.length > 5 && description.length > 20 && score.total >= 35;

  return { title, tags, description, isComplete };
}

/** HRN momentum targets: queue/favourite thresholds that drive the "recently popular" sort. */
export function momentumTargets(project: PatternProject, inputs: ListingInputs): {
  queues: string; favourites: string; projects: string;
} {
  const sizeCount = Math.max(1, inputs.sizeCount);
  const wide = sizeCount >= 9 && inputs.sizeInclusive;
  const queues = wide ? '30+ queues in the first week' : sizeCount >= 5 ? '15+ queues in the first week' : '10+ queues in the first week';
  const favourites = wide ? '40+ favourites' : sizeCount >= 5 ? '25+ favourites' : '15+ favourites';
  const projects = wide ? '5+ projects in the first month' : '3+ projects in the first month';
  return { queues, favourites, projects };
}
