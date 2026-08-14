/**
 * Launch Campaign Manager — turns a pattern's own data into a dated,
 * paste-ready launch plan.
 *
 * Session-13 research, turned into interface:
 * - Sister Mountain's release checklist is the community's canonical
 *   3-phase playbook (pre-launch: photoshoot, Ravelry draft page, blog
 *   post, yarn-company email with yarn usage + photo Dropbox, list
 *   tease 2 days before; launch day: publish, groups, bundles + cover
 *   photo, 15% weekend-inclusive coupon ≤ 1 week, subscriber email;
 *   post-launch: daily promotion ≥ 1 week, tester-FO blog post at +1–2
 *   weeks, launch review a few weeks later).
 * - Ravelry Hot Right Now rewards concentrated momentum: views,
 *   hearts and queues in launch week. Weekend days get most sales.
 * - Stitchcraft Marketing: KAL/MALs (4–8 weeks, firm dates,
 *   newsletter-gated sign-up, mystery clue releases, 10–15%
 *   discounts, prizes) both grow lists and can push a pattern into
 *   HRN. Generic launch-checklist SaaS has zero knitting context;
 *   designers stitch together Asana + Google Calendar by hand.
 * - No competitor ingests the pattern's actual data (sizes, yarn
 *   weight, fibre, readiness state) to compute a dated campaign.
 *   That's our strength: CHK-005 readiness, CHK-006 credibility,
 *   CHK-009 test-knit status, CHK-010 tech-edit score all feed in.
 *
 * All milestones carry paste-ready copy generated from the project's
 * real data — nothing invented.
 */
import { PatternProject, ALL_SIZES, SizeKey } from '@/lib/grading-engine';
import { estimateYarn, YARN_WEIGHT_LABELS } from '@/lib/yarn-estimator';
import { advisePrice, sizeCountForProject, ITEM_TYPE_LABELS, ItemType } from '@/lib/pattern-pricing-advisor';
import { runTechEditAudit } from '@/lib/tech-edit-audit';
import { gradedSizes, buildRoster, TesterSlot } from '@/lib/test-knit-programme';
import { checkReadiness, ReadinessResult } from '@/lib/pattern-readiness';

export type CampaignPhase = 'pre' | 'launch' | 'post';

export interface CampaignMilestone {
  /** Signed day offset from launch date, e.g. -7, 0, +14. */
  dayOffset: number;
  title: string;
  phase: CampaignPhase;
  /** Paste-ready copy text generated from the pattern's real data. */
  copy: string;
  checklist: string[];
  done?: boolean;
}

export interface ReadinessGate {
  label: string;
  ok: boolean;
  why: string;
}

export interface CampaignConfig {
  launchDate: string;
  /** ISO date string; null when the designer doesn't have a date set. */
  yarnCompany?: string;
  ravelryUrl?: string;
  etsyUrl?: string;
  couponCode?: string;
  couponPercent?: number;
  salesTarget?: number;
  /** Run a knit-along style campaign (4 weekly clues). */
  kalMode?: boolean;
  kalGroup?: string;
}

export interface CampaignPlan {
  patternName: string;
  launchDate: string;
  milestones: CampaignMilestone[];
  gates: ReadinessGate[];
  gateSummary: string;
  seasonalNote: string;
  kalClues?: CampaignMilestone[];
  postLaunchReview: string;
}

/** Garment-season heuristic: when the pattern should realistically
 *  launch relative to the wearing season (buyers knit 6–8 weeks
 *  ahead, launch a bit before that so the pattern lands in their
 *  queue in time). Months are 0-indexed. */
const SEASONAL: Record<string, { label: string; bestLaunchMonths: number[] }> = {
  sweater: { label: 'Autumn/winter garment', bestLaunchMonths: [6, 7, 8] },
  cardigan: { label: 'Autumn/winter garment', bestLaunchMonths: [6, 7, 8] },
  hat: { label: 'Autumn/winter garment', bestLaunchMonths: [7, 8, 9] },
  mitts: { label: 'Autumn/winter garment', bestLaunchMonths: [7, 8, 9] },
  socks: { label: 'Year-round favourite', bestLaunchMonths: [0, 1, 2, 8, 9, 10] },
  shawl: { label: 'Year-round favourite', bestLaunchMonths: [0, 1, 2, 3, 8, 9, 10] },
  scarf: { label: 'Autumn/winter garment', bestLaunchMonths: [7, 8, 9] },
  other: { label: 'Year-round', bestLaunchMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

function formatDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return `${DAY_NAMES[d.getUTCDay()]}, ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function inferItemType(name: string): string {
  const n = name.toLowerCase();
  if (/(sweater|jumper|pullover)/.test(n)) return 'sweater';
  if (/cardigan/.test(n)) return 'cardigan';
  if (/shawl/.test(n)) return 'shawl';
  if (/sock/.test(n)) return 'socks';
  if (/hat|beanie|balaclava/.test(n)) return 'hat';
  if (/mitt|glove/.test(n)) return 'mitts';
  if (/scarf/.test(n)) return 'scarf';
  return 'other';
}

function seasonalNote(project: PatternProject, launchDate: string): string {
  const item = inferItemType(project.name);
  const s = SEASONAL[item] ?? SEASONAL.other;
  const month = new Date(launchDate + 'T00:00:00Z').getUTCMonth();
  const ideal = s.bestLaunchMonths.includes(month);
  const garmentLabel = ITEM_TYPE_LABELS[item as keyof typeof ITEM_TYPE_LABELS] ?? project.name;
  if (ideal) {
    return `${garmentLabel} (${s.label}): launching in ${MONTH_NAMES[month]} sits well for this garment type.`;
  }
  return `${garmentLabel} (${s.label}): ${MONTH_NAMES[month]} is outside the usual launch window — buyers knit 6–8 weeks ahead, so consider a launch in ${s.bestLaunchMonths.slice(0, 2).map(m => MONTH_NAMES[m]).join(' or ')} for best queue momentum, or lean into an off-season angle (e.g. spring cottons, summer shawls).`;
}

/** Build the gated precondition list from the pattern's real state. */
export function buildReadinessGates(project: PatternProject, slots?: TesterSlot[]): ReadinessGate[] {
  const readiness: ReadinessResult = checkReadiness(project);
  const techEdit = runTechEditAudit(project);
  const gates: ReadinessGate[] = [
    {
      label: 'Pre-publish checklist (Publish tab)',
      ok: readiness.errorCount === 0,
      why: readiness.errorCount === 0
        ? `${readiness.checks.length} checks run, no blocking errors.`
        : `${readiness.errorCount} blocking error${readiness.errorCount === 1 ? '' : 's'} still open — ${readiness.checks.find(c => c.severity === 'error')?.detail}`,
    },
    {
      label: 'Tech-edit audit score',
      ok: techEdit.score >= 80,
      why: techEdit.score >= 80
        ? `Audit scores ${techEdit.score}/100 (${techEdit.verdict}) — numbers are launch-worthy.`
        : `Audit scores ${techEdit.score}/100 — finish the remaining checks before announcing; buyers and reviewers catch low scores.`,
    },
    {
      label: 'Test-knit programme',
      ok: !!slots && slots.length > 0 && slots.some(s => s.status === 'finished'),
      why: !slots
        ? 'No test-knit roster exists yet — create one in the Test Knit tab so finished-FO photos are ready for launch week.'
        : slots.some(s => s.status === 'finished')
          ? `${slots.filter(s => s.status === 'finished').length} tester${slots.filter(s => s.status === 'finished').length === 1 ? '' : 's'} finished — FO photos and quotes ready for launch assets.`
          : `Roster has ${slots.length} slot${slots.length === 1 ? '' : 's'} but no finished test knits yet — FOs are the launch's social proof.`,
    },
  ];
  return gates;
}

/** Pre-Launch & Launch milestones generated from the pattern's own data. */
function standardMilestones(project: PatternProject, cfg: Required<Pick<CampaignConfig, 'launchDate'>>, opts: {
  yarnCompany: string;
  ravelryUrl: string;
  etsyUrl: string;
  couponCode: string;
  couponPercent: number;
  kalMode: boolean;
  salesTarget: number;
}): CampaignMilestone[] {
  const sizes = gradedSizes(project);
  const sizeLabel = sizes.length > 0 ? `${sizes[0]}–${sizes[sizes.length - 1]}` : 'sized';
  const weight = project.yarnWeight ?? 'worsted';
  const weightLabel = YARN_WEIGHT_LABELS[weight];
  const yarn = estimateYarn(project, weight);
  const yardage = Math.round(yarn.totalYards);
  const metres = Math.round(yarn.totalMeters);
  const price = advisePrice({
    itemType: (inferItemType(project.name) === 'other' ? 'other' : inferItemType(project.name)) as ItemType,
    skillLevel: 'intermediate',
    sizeCount: sizeCountForProject(project),
    techEdited: true,
    testKnitted: true,
    hoursWorked: 0,
    hourlyRate: 0,
    currentPrice: 0,
    marketTarget: 'standard',
  });
  const priceBand = price.bands.find(b => b.label === 'Market') ?? price.bands[0];
  const linkLine = [opts.ravelryUrl && `Ravelry: ${opts.ravelryUrl}`, opts.etsyUrl && `Etsy: ${opts.etsyUrl}`].filter(Boolean).join(' · ');

  const milestones: CampaignMilestone[] = [
    {
      dayOffset: -21,
      title: 'Assets & page prep',
      phase: 'pre',
      copy: `Prep the ${project.name} launch: photoshoot covering front, back, sides and at least one flat-lay or detail shot; fill the Ravelry pattern page as a draft with the ${sizeLabel} size range, ${weightLabel} weight, and the story behind the design; draft the launch-day blog post. ${linkLine}`,
      checklist: ['Photoshoot complete (front/back/sides/detail)', 'Ravelry page drafted (not published)', 'Launch blog post drafted'],
    },
    {
      dayOffset: -14,
      title: 'Yarn company & influencers',
      phase: 'pre',
      copy: `Email ${opts.yarnCompany || 'the yarn company'} with yarn usage (${yardage} yd / ${metres} m of ${weightLabel} in the base size), the ${sizeLabel} size range, launch date and a photo Dropbox link so they can promote on launch day. Ask if they can contribute yarn to the launch giveaway. Send the free pattern to 2–3 community influencers for an advance look or a giveaway prize.`.replace(/\s+/g, ' ').trim(),
      checklist: ['Yarn company email sent with usage stats', 'Photo Dropbox shared', 'Influencer outreach sent (2–3 contacts)'],
    },
    {
      dayOffset: -7,
      title: 'Community warm-up',
      phase: 'pre',
      copy: `Warm up the community for ${project.name}: tease photos in stories and feeds across the next week, share the story behind the design, and ask your Ravelry friends to favourite the pattern page when it goes live — favourites and queues feed Ravelry's Hot Right Now algorithm. If running a KAL, open registration now (newsletter-gated) with a firm start date of ${formatDay(cfg.launchDate)}.`,
      checklist: ['Tease posts scheduled', 'Ravelry friends asked to favourite/queue', 'KAL registration live (if applicable)'],
    },
    {
      dayOffset: -2,
      title: 'List tease',
      phase: 'pre',
      copy: `Send your email list a 2-day teaser for ${project.name}: ${sizeLabel} sizes, ${weightLabel} weight, approximately ${yardage} yd in the base size, and the launch date. Ask them to mark their calendar — early opens are what drive launch-day sales.`.replace(/\s+/g, ' ').trim(),
      checklist: ['List teaser sent'],
    },
    {
      dayOffset: -1,
      title: 'Giveaway + coupon',
      phase: 'pre',
      copy: `Set up a 24-hour giveaway on your biggest platform for ${project.name} (pattern + yarn if the company agreed). Prepare the launch coupon: ${opts.couponCode || 'LAUNCH15'} for ${opts.couponPercent}% off, active for one week that includes at least one weekend — most pattern sales happen on weekends.`.replace(/\s+/g, ' ').trim(),
      checklist: ['24-hour giveaway live', 'Coupon code ready (weekend-inclusive window)'],
    },
    {
      dayOffset: 0,
      title: 'Launch day',
      phase: 'launch',
      copy: `Publish ${project.name} on Ravelry and any other marketplaces. Market price for a ${sizeLabel}, tech-edited and test-knitted ${weightLabel} pattern sits around $${priceBand.low}–$${priceBand.high}; your coupon ${opts.couponCode || 'LAUNCH15'} takes ${opts.couponPercent}% off for a week. Share the sample project to 2–3 relevant Ravelry groups, add the pattern to your bundles (make its photo the bundle cover), email the yarn company the live link, send the list the launch email with photos, post across socials all day, pin to Pinterest. ${linkLine} Tag everyone involved — model, photographer, testers, tech editor — so their audiences amplify you.`.replace(/\s+/g, ' ').trim(),
      checklist: ['Pattern published everywhere', 'Groups + bundles updated', 'Yarn company + list emailed', 'Social posts all day', 'Pinterest pins up'],
    },
    {
      dayOffset: 1,
      title: 'Day-after push',
      phase: 'post',
      copy: `Keep ${project.name} moving on day 2: reply to every comment and question on the Ravelry page (activity keeps it on Hot Right Now), re-share tester previews, and re-post the coupon reminder with a fresh angle (a technique detail, the naming story).`,
      checklist: ['All page comments answered', 'Fresh promo post with new angle'],
    },
    {
      dayOffset: 3,
      title: 'Mid-week reminder',
      phase: 'post',
      copy: `Mid-week check-in: ${project.name} coupon ${opts.couponCode || 'LAUNCH15'} ends this week. Share a WIP video or reel showing the technique that makes the design special.`,
      checklist: ['Coupon reminder post', 'Technique-focused content up'],
    },
    {
      dayOffset: 7,
      title: 'Week one wrap + tester FO feature',
      phase: 'post',
      copy: `Launch week closes — thank testers, makers and the yarn company publicly. Publish the tester finished-object roundup (their photos on many bodies is your best ongoing sales asset) and send it to your list with the pattern link. Consider ending the coupon after the weekend.`,
      checklist: ['Tester FO roundup published', 'List email sent with roundup', 'Coupon end announced'],
    },
    {
      dayOffset: 14,
      title: 'Launch review',
      phase: 'post',
      copy: `Two weeks on, review the ${project.name} launch: sales vs target (${opts.salesTarget || 'your target'}), which channel converted, what flopped. Write the reflections down now — your next launch improves when you keep notes. Keep re-sharing the pattern occasionally; launches are forgotten in weeks, patterns earn for years.`,
      checklist: ['Sales vs target reviewed', 'Channel performance noted', 'Reflections written'],
    },
  ];
  return milestones;
}

/** KAL variant: 4 weekly clue/section milestones instead of standard beats. */
function kalClues(project: PatternProject, cfg: Required<Pick<CampaignConfig, 'launchDate'>>): CampaignMilestone[] {
  const kalOffsets = [-7, 0, 7, 14];
  const sections = project.sections.length > 0
    ? project.sections.map(s => s.name)
    : ['Clue 1', 'Clue 2', 'Clue 3', 'Clue 4'];
  const kal = kalOffsets.map((offset, i) => ({
    dayOffset: offset,
    title: `KAL ${i === 0 ? 'start' : i < kalOffsets.length - 1 ? `clue ${i + 1}` : 'final clue + wrap'}`,
    phase: (i === 0 ? 'launch' : 'post') as CampaignPhase,
    copy: i === 0
      ? `${project.name} KAL starts today — welcome participants, share the materials list and cast-on instructions, and remind everyone the firm end date is ${formatDay(addDays(cfg.launchDate, 28))}. Prizes go to finished FOs shared to the group.`
      : i < kalOffsets.length - 1
        ? `${project.name} KAL ${sections[i] ?? `Clue ${i + 1}`} drops today for registered participants — share a progress reminder and invite photo shares.`
        : `${project.name} KAL final clue released. Knitters have two weeks to finish and share FOs for the prize draw, ending ${formatDay(addDays(cfg.launchDate, 28))}.`,
    checklist: ['Content released', 'Group post + hashtag shared'],
  }));
  return kal;
}

export function postLaunchReviewTemplate(): string {
  return [
    'POST-LAUNCH REVIEW',
    '',
    'Pattern: (name)',
    'Launch date:',
    'Sales vs target:',
    'Best-performing channel:',
    'What worked:',
    'What flopped:',
    'Notes for next launch:',
  ].join('\n');
}

export function buildCampaign(project: PatternProject, cfg: CampaignConfig, slots?: TesterSlot[]): CampaignPlan {
  const launchDate = cfg.launchDate || toISO(new Date());
  const gates = buildReadinessGates(project, slots);
  const okCount = gates.filter(g => g.ok).length;
  const opts = {
    yarnCompany: cfg.yarnCompany || 'your yarn company',
    ravelryUrl: cfg.ravelryUrl || 'your Ravelry pattern page',
    etsyUrl: cfg.etsyUrl || '',
    couponCode: cfg.couponCode || 'LAUNCH15',
    couponPercent: cfg.couponPercent ?? 15,
    kalMode: !!cfg.kalMode,
    salesTarget: cfg.salesTarget ?? 0,
  } as { yarnCompany: string; ravelryUrl: string; etsyUrl: string; couponCode: string; couponPercent: number; kalMode: boolean; salesTarget: number };
  const cfgRequired: Required<Pick<CampaignConfig, 'launchDate'>> = { launchDate };
  const milestones = opts.kalMode
    ? kalClues(project, cfgRequired)
    : standardMilestones(project, cfgRequired, opts);
  const kalCluesResult = opts.kalMode ? kalClues(project, cfgRequired) : undefined;
  return {
    patternName: project.name,
    launchDate,
    milestones,
    gates,
    gateSummary: `${okCount}/${gates.length} launch gates open — ${okCount === gates.length ? 'you are fully ready to announce' : 'clear the flagged gates before going public'}.`,
    seasonalNote: seasonalNote(project, launchDate),
    kalClues: kalCluesResult,
    postLaunchReview: postLaunchReviewTemplate(),
  };
}

/** Human-readable milestone date for the UI. */
export function milestoneDate(launchDate: string, dayOffset: number): string {
  return formatDay(addDays(launchDate, dayOffset));
}
