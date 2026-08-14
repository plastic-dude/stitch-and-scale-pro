/**
 * CHK-054 — Video & Social ROI Lab engine.
 *
 * Prices a knitwear designer's organic video & social content effort across platforms,
 * with documented per-platform decay curves, funnel math (views → clicks → sales),
 * hourly "reach dollars" against the designer's knitting rate, and quality flags.
 *
 * Sources (session-54 research, see /home/ubuntu/research/competitors-session-54-video-economics.md):
 * - Social media fuels ~30% of fashion e-commerce; shoppable posts convert 2-4% (knitwise, Aug 2025)
 * - Videos <60s: higher CTR and purchases on TikTok/IG Reels; <90s retain ~50%;
 *   message in first 3s: +13% breakthrough; 81% of marketers say video directly raised sales (Firework)
 * - TikTok <10s clips average ~19k views; IG users engage most with ~26s videos
 * - Pinterest pins are evergreen (months/years) vs hours-lived IG feed posts
 * - KPI benchmarks: engagement 4-7%, CTR 2-3%, conversion 1-4% (knitwear niche)
 * - Designer admissions: follower growth slowed; DMs and email list are the money signals
 *   (kneedlesandlife.com)
 */

export type Platform = 'instagram' | 'tiktok' | 'pinterest' | 'youtube' | 'email';

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram Reels',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  youtube: 'YouTube Shorts',
  email: 'Email list',
};

export const PLATFORM_DESCRIPTIONS: Record<Platform, string> = {
  instagram: '26-second sweet spot; feed posts live hours, Reels linger days; carousels 1.5x engagement.',
  tiktok: '<60s clips (under 10s avg ~19k views); trend audio + first-3s hooks carry reach.',
  pinterest: 'Visual search engine — pins drive traffic for months or years, the evergreen sleeper.',
  youtube: 'Shorts behave like Reels; long-form tutorials compound search traffic.',
  email: 'The money channel — DM-adjacent quality signal; highest-quality buyers.',
};

/** Median daily views one average-quality post earns at this follower count, by platform.
 *  Documented: follower counts no longer predict sales, but median per-post views still
 *  cluster; TikTok has the highest discovery ceiling for small accounts. */
export const POST_VIEWS_BY_FOLLOWERS: Record<Platform, [number, number]> = {
  // [views at <5k followers, views at 25k+ followers] — median per post, single video
  instagram: [150, 900],
  tiktok: [1200, 6000],
  pinterest: [90, 450],
  youtube: [80, 500],
  email: [300, 3000],
};

/** Fraction of a post's total lifetime views/opens already delivered by day d.
 *  IG feed: nearly all by day 2. TikTok: most by day 7 (slow burn + trend tail).
 *  Pinterest: barely any by day 7 — pin lives for months. */
export function decayDeliveredBy(platform: Platform, days: number): number {
  switch (platform) {
    case 'instagram':
      return Math.min(1, 0.9 * (1 - Math.exp(-1.2 * days)));
    case 'tiktok':
      return Math.min(1, 0.92 * (1 - Math.exp(-0.35 * days)));
    case 'pinterest':
      return Math.min(1, 0.05 * (1 - Math.exp(-0.03 * days)));
    case 'youtube':
      return Math.min(1, 0.55 * (1 - Math.exp(-0.25 * days)) + 0.05 * (1 - Math.exp(-0.02 * days)));
    case 'email':
      return Math.min(1, 0.85 * (1 - Math.exp(-0.8 * days)));
  }
}

export interface VideoLabInput {
  followersByPlatform: Record<Platform, number>;
  postsPerMonth: number;
  minutesPerPost: number; // creation time per video/post including filming + editing
  videoLengthSec: number;
  hookStrong: boolean; // message in first 3 seconds
  videoUnderSixtySec: boolean;
  hasCallToAction: boolean;
  linkDestination: 'pattern_page' | 'list_building' | 'none';
  monthlyPatternSales: number;
  patternPrice: number;
  platformFeePct: number; // e.g. 0.15
  listSize: number;
  listGrowthPerMonth: number;
  emailSalesPerMonth: number;
  patternPriceEmail: number; // net per email-sale
}

export const VIDEO_LAB_DEFAULTS: VideoLabInput = {
  followersByPlatform: { instagram: 3200, tiktok: 800, pinterest: 500, youtube: 200, email: 450 },
  postsPerMonth: 10,
  minutesPerPost: 45,
  videoLengthSec: 26,
  hookStrong: true,
  videoUnderSixtySec: true,
  hasCallToAction: true,
  linkDestination: 'pattern_page',
  monthlyPatternSales: 25,
  patternPrice: 8,
  platformFeePct: 0.15,
  listSize: 450,
  listGrowthPerMonth: 60,
  emailSalesPerMonth: 8,
  patternPriceEmail: 7.8,
};

export interface PlatformScore {
  platform: Platform;
  monthlyViews: number;
  monthlyClicks: number;
  attributableSales: number;
  attributableNet: number;
  monthlyHours: number;
  netPerHour: number;
  decayNote: string;
}

export interface QualityFlag {
  id: string;
  detail: string;
}

export interface VideoLabResult {
  platforms: PlatformScore[];
  totalHours: number;
  totalAttributableNet: number;
  netPerHour: number;
  flagCompare: { label: string; netPerHour: number }[]; // knit rate + alternatives for context
  flags: QualityFlag[];
  verdict: string;
  suggestion: string;
}

const CTR_BY_PLATFORM: Record<Platform, number> = {
  instagram: 0.02,
  tiktok: 0.015,
  pinterest: 0.025,
  youtube: 0.02,
  email: 0.12, // list clicks per send; applied below differently
};

const CONV_CLICK_TO_SALE: Record<Platform, number> = {
  instagram: 0.02, // 2% benchmark floor for fashion; pattern pages convert lower-end
  tiktok: 0.015,
  pinterest: 0.025,
  youtube: 0.02,
  email: 1, // handled separately: emailSalesPerMonth directly
};

function followerViews(platform: Platform, followers: number): number {
  const [lo, hi] = POST_VIEWS_BY_FOLLOWERS[platform];
  if (followers <= 5000) return lo;
  if (followers >= 25000) return hi;
  return lo + ((followers - 5000) / 20000) * (hi - lo);
}

/** Views multiplier for under-60s videos with strong first-3s hooks (documented effects). */
function videoMultiplier(input: VideoLabInput): number {
  let m = 1;
  if (input.videoUnderSixtySec) m *= 1.2; // <60s outperform on TikTok/Reels
  if (input.hookStrong) m *= 1.13; // first-3s message +13% breakthrough
  return m;
}

/** How effectively views convert for this creator: list-building posts earn delayed value. */
function linkBoost(input: VideoLabInput): number {
  switch (input.linkDestination) {
    case 'pattern_page':
      return input.hasCallToAction ? 1.15 : 1;
    case 'list_building':
      return 0.3; // immediate sales lower, but list value is tallied separately
    case 'none':
      return 0;
  }
}

function clampNonNegative(n: number): number {
  return Math.max(0, n);
}

export function analyzeVideoSocial(input: VideoLabInput): VideoLabResult {
  const vm = videoMultiplier(input);
  const lb = linkBoost(input);
  const netPerSale = clampNonNegative(input.patternPrice * (1 - input.platformFeePct));

  const platforms: PlatformScore[] = (Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => {
    const followers = input.followersByPlatform[p];
    // Distribute content posts across social platforms evenly; email is always 1 send/month slot.
    const socialPlatforms = ['instagram', 'tiktok', 'pinterest', 'youtube'] as Platform[];
    const socialPosts = p === 'email' ? 1 : input.postsPerMonth / socialPlatforms.length;
    const perPostViews = followerViews(p, followers) * (p === 'email' ? 1 : vm);
    let monthlyViews = perPostViews * socialPosts;
    // Email: views ≈ list opens; use listSize * open-rate proxy 40% per send.
    if (p === 'email') monthlyViews = input.listSize * 0.4 * socialPosts;

    const ctr = p === 'email' ? Math.min(0.4, input.listSize > 0 ? 0.4 : 0) : CTR_BY_PLATFORM[p];
    let monthlyClicks = monthlyViews * ctr;
    if (p !== 'email') monthlyClicks *= lb;

    const attributableSales =
      p === 'email'
        ? input.emailSalesPerMonth
        : monthlyClicks * CONV_CLICK_TO_SALE[p];
    const attributableNet =
      p === 'email'
        ? input.emailSalesPerMonth * input.patternPriceEmail
        : attributableSales * netPerSale;

    // Time: email send ≈ 30 min; social posts use minutesPerPost.
    const hoursPerPost = p === 'email' ? 0.5 : input.minutesPerPost / 60;
    const monthlyHours = hoursPerPost * socialPosts;

    // Decay note: share of lifetime value already delivered in the first week.
    const firstWeekShare =
      p === 'email'
        ? decayDeliveredBy(p, 7)
        : decayDeliveredBy(p, 7);
    const decayNote =
      firstWeekShare >= 0.8
        ? `Nearly all value (${(firstWeekShare * 100).toFixed(0)}%) delivered within a week — repostable formats pay back faster.`
        : firstWeekShare >= 0.3
          ? `Roughly ${(firstWeekShare * 100).toFixed(0)}% of lifetime value in the first week; keep expecting trickle traffic.`
          : `Only ${(firstWeekShare * 100).toFixed(0)}% of lifetime value in the first week — this channel compounds for months.`;

    return {
      platform: p,
      monthlyViews,
      monthlyClicks,
      attributableSales,
      attributableNet,
      monthlyHours,
      netPerHour: monthlyHours > 0 ? attributableNet / monthlyHours : 0,
      decayNote,
    };
  });

  const totalHours = platforms.reduce((s, p) => s + p.monthlyHours, 0);
  const totalAttributableNet = platforms.reduce((s, p) => s + p.attributableNet, 0);
  const netPerHour = totalHours > 0 ? totalAttributableNet / totalHours : 0;

  const flags: QualityFlag[] = [];
  if (input.postsPerMonth >= 30)
    flags.push({ id: 'VS-01', detail: '30+ posts/month is documented burnout territory — engagement is down platform-wide; 3-4/week per platform is the benchmark, not more.' });
  if (!input.videoUnderSixtySec && input.postsPerMonth > 0)
    flags.push({ id: 'VS-02', detail: 'Videos over 60 seconds measurably underconvert on Reels and TikTok — cut to the strongest minute.' });
  if (!input.hookStrong && input.postsPerMonth > 0)
    flags.push({ id: 'VS-03', detail: 'No hook in the first 3 seconds costs ~13% of breakthrough — the message must land before the knit shot.' });
  if (input.linkDestination === 'none' && input.postsPerMonth > 0)
    flags.push({ id: 'VS-04', detail: 'Posts with no destination capture zero clicks — even a list-building link out-earns a dead-end post.' });
  if (input.postsPerMonth > 0 && totalAttributableNet > 0 && netPerHour > 0 && input.minutesPerPost >= 120)
    flags.push({ id: 'VS-05', detail: 'Two hours per post puts content ROI below most creators\' knitting rate — batch filming to shrink per-post minutes.' });
  const top = platforms.reduce((a, b) => (b.attributableNet > a.attributableNet ? b : a));
  const socialHours = platforms.filter((p) => p.platform !== 'email').reduce((s, p) => s + p.monthlyHours, 0);
  if (top.platform !== 'email' && input.listSize >= 100 && input.postsPerMonth > 0)
    flags.push({ id: 'VS-06', detail: 'Your email list is not your top earner per dollar — documented: DM/email-adjacent audiences buy patterns first. Repost your best reel to the list.' });
  if (input.postsPerMonth > 0 && !input.hasCallToAction)
    flags.push({ id: 'VS-07', detail: 'No call to action costs roughly 15% of pattern-page conversion on average.' });

  const listValuePerSub = input.listSize > 0 ? input.emailSalesPerMonth / input.listSize : 0;
  const verdict =
    socialHours === 0
      ? 'No content planned — every pattern launch starts with no one watching. Even one monthly video beats zero.'
      : netPerHour <= 0
        ? `Social effort earns nothing traceable at current settings — ${flags[0]?.detail ?? 'check the destination link.'}`
        : `Social content earns ${netPerHour.toFixed(2)}/hr against documented benchmarks — the best channel is ${PLATFORM_LABELS[top.platform]} at ${top.netPerHour.toFixed(2)}/hr.`;

  const suggestion =
    input.linkDestination === 'list_building'
      ? `List-building posts convert slower but compound: ${(input.listGrowthPerMonth * listValuePerSub || 0).toFixed(2)}$/mo of future value per month of growth at your list's sale rate. Keep the list above everything else.`
      : totalHours > 40
        ? 'At 40+ hrs/month the content engine costs more hours than the knit itself — cut to 10-12 posts and batch-film everything in one session.'
        : 'Batch one filming session per design cycle, cut to 26 seconds, hook in the first 3 seconds, and link every post to a pattern page or the list.';

  return {
    platforms,
    totalHours,
    totalAttributableNet,
    netPerHour,
    flagCompare: [{ label: 'Best channel', netPerHour: top.netPerHour }],
    flags,
    verdict,
    suggestion,
  };
}
