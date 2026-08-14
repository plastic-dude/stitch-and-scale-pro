/**
 * Copyright Protection Planner — "Protect" tab library (CHK-033).
 *
 * Session-34 research (see /research/competitors-session-34-copyright-protection.md):
 * piracy protection for pattern designers is a service gap — photo-centric
 * enforcement shops (Copytrack takes ~50% of enforcement fees), brand monitors
 * at $249+/mo, or nothing. Etsy alone removed 346,000+ counterfeit listings in
 * 2021, and Ravelry's census shows 72.3% of designers earn <$50/yr — the long
 * tail cannot absorb lost sales. Patterns are 'literary works' under the UK
 * IPO / Berne regime (automatic protection, life+70y), but stitch types,
 * methods and ideas are never protectable; the real money is in having a
 * priced, prepared response instead of a reactive forum thread.
 *
 * Four layers, all local-first:
 *  1. leak — exposure valuation (is the leak worth the fight?)
 *  2. license — license-terms strength audit
 *  3. monitor — watch-word list + evidence-pack readiness
 *  4. respond — escalation ladder + DMCA notice text with the 6 required
 *     elements, and a counter-notice deadline tracker
 */

export interface ProtectInput {
  monthlyPatternCopies: number;
  avgPrice: number;
  channelFeePct: number;
  monthlyMarketingHours: number;
  designRatePerHour: number;
  licenseTerms: LicenseTerms;
  watermarkEnabled: boolean;
  uniqueDownloadLinks: boolean;
  soldOnMultiplePlatforms: boolean;
  evidencePackReady: boolean;
  platformForDmca: DmcaPlatform;
  infringerContactedPolitely: boolean;
  counterNoticeDeadline: string; // ISO date (YYYY-MM-DD) or ''
  leakDiscovered: string; // ISO date (YYYY-MM-DD) or ''
}

export interface LicenseTerms {
  finishedItemsMayBeSold: boolean;
  teachingAllowed: boolean;
  massProductionAllowed: boolean;
  translationAllowed: boolean;
  derivativeChartsAllowed: boolean;
  personalUseOnly: boolean;
}

export type DmcaPlatform = 'etsy' | 'ravelry' | 'pinterest' | 'shopify' | 'other';

export const DMCA_PLATFORM_LABELS: Record<DmcaPlatform, string> = {
  etsy: 'Etsy (legal@etsy.com / Reporting Portal)',
  ravelry: 'Ravelry (legal@ravelry.com)',
  pinterest: 'Pinterest (copyright@pinterest.com)',
  shopify: 'Shopify (copyright@shopify.com)',
  other: 'Other platform (check its copyright agent)',
};

export const DEFAULT_LICENSE_TERMS: LicenseTerms = {
  finishedItemsMayBeSold: true,
  teachingAllowed: false,
  massProductionAllowed: false,
  translationAllowed: false,
  derivativeChartsAllowed: false,
  personalUseOnly: true,
};

export const DEFAULT_PROTECT: ProtectInput = {
  monthlyPatternCopies: 20,
  avgPrice: 8,
  channelFeePct: 0.15,
  monthlyMarketingHours: 3,
  designRatePerHour: 35,
  licenseTerms: { ...DEFAULT_LICENSE_TERMS },
  watermarkEnabled: false,
  uniqueDownloadLinks: false,
  soldOnMultiplePlatforms: false,
  evidencePackReady: false,
  platformForDmca: 'etsy',
  infringerContactedPolitely: false,
  counterNoticeDeadline: '',
  leakDiscovered: '',
};

export interface RedFlag { code: string; text: string; severity: 'warn' | 'critical'; }

export interface EscalationStep {
  label: string;
  detail: string;
  deadlineNote: string;
}

export interface ProtectResult {
  exposure: {
    leakExposurePerYear: number; // gross value of copies at leak share
    expectedLostNetPerYear: number;
    responseBudgetPerIncident: number; // response-time cost at designer rate
    fightWorthIt: boolean;
  };
  licenseAudit: {
    score: number; // 0-100 strength of the license terms a copy must respect
    gaps: string[];
  };
  prevention: {
    watermarkWorthIt: boolean;
    preventionScore: number;
    notes: string[];
  };
  monitor: {
    watchWords: string[];
    evidencePackReady: boolean;
    evidenceGaps: string[];
  };
  escalation: {
    steps: EscalationStep[];
    currentStep: number;
    counterNoticeDeadlinePassed: boolean | null;
  };
  redFlags: RedFlag[];
  verdict: string;
  verdictNote: string;
  dmcaNotice: string;
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/**
 * Estimated share of monthly copies that flow through the leak channel at
 * steady state. Research consensus: piracy of zero-marginal-cost digital
 * goods is endemic (CESifo), gaming studies put leakage near ~20% of revenue;
 * for patterns, unmonitored leaks concentrate in weak-IP jurisdictions and
 * counter-notice re-uploads defeat single takedowns (Threads, Nov 2025).
 * Conservative band: 5% (monitored + watermarked) → 30% (nothing in place).
 */
function leakShare(input: ProtectInput): number {
  let share = 0.2;
  if (input.watermarkEnabled) share *= 0.6;
  if (input.uniqueDownloadLinks) share *= 0.7;
  if (input.soldOnMultiplePlatforms) share *= 0.9;
  return Math.min(0.3, Math.max(0.05, share));
}

export function analyzeProtection(input: ProtectInput): ProtectResult {
  const redFlags: RedFlag[] = [];

  // 1. Exposure valuation
  const leak = leakShare(input);
  const leakedCopiesPerYear = input.monthlyPatternCopies * 12 * leak;
  const leakExposurePerYear = leakedCopiesPerYear * input.avgPrice;
  const expectedLostNetPerYear = leakExposurePerYear * (1 - input.channelFeePct) * 0.5;
  // 0.5 = not every leaked copy is a lost sale (free-riders, sampling)
  const responseHoursPerIncident = 4; // evidence pack + filing + follow-ups
  const responseBudgetPerIncident =
    responseHoursPerIncident * input.designRatePerHour +
    input.monthlyMarketingHours * input.designRatePerHour * 0; // marketing is sunk
  const fightWorthIt = expectedLostNetPerYear >= responseBudgetPerIncident;

  // 2. License audit
  const lt = input.licenseTerms;
  const terms: Array<[boolean, string]> = [
    [lt.finishedItemsMayBeSold, 'finished-item selling'],
    [lt.teachingAllowed, 'teaching use'],
    [lt.massProductionAllowed, 'mass production'],
    [lt.translationAllowed, 'translation / derivative language'],
    [lt.derivativeChartsAllowed, 'derivative charts'],
  ];
  // A license is only as strong as the boundaries it draws. Commercial gaps
  // are priced: each undefined commercial boundary is money a copy can legally
  // claim. personalUseOnly strengthens everything it covers.
  let score = 40;
  const gaps: string[] = [];
  if (lt.personalUseOnly) score += 15; else gaps.push('no personal/non-commercial boundary stated');
  if (lt.finishedItemsMayBeSold) { score += 10; } else gaps.push('finished-item resale undefined — buyers will ask');
  if (!lt.massProductionAllowed) score += 10; else gaps.push('mass production allowed — a copy of your design at scale');
  if (!lt.translationAllowed) score += 10; else gaps.push('translations allowed — derivative works at full price');
  if (!lt.teachingAllowed) score += 10; else gaps.push('teaching use allowed — classroom copying at zero price');
  if (!lt.derivativeChartsAllowed) score += 5; else gaps.push('derivative charts allowed');
  const licenseAudit = { score, gaps };
  const criticalGap = gaps.some((g) => g.includes('mass production') || g.includes('teaching use allowed') || g.includes('translations allowed'));
  if (score < 60 || criticalGap) redFlags.push({ code: 'CP-01', text: 'License boundaries are too open for commercial scale — mass production, classroom copying, or full-price derivatives can legally ride on your design. Draw the lines in your license before a copy does it for you.', severity: 'critical' });

  // 3. Prevention
  const preventionNotes: string[] = [];
  if (!input.watermarkEnabled) {
    preventionNotes.push('No buyer-name PDF watermarking: this is the cheapest proven deterrent for digital patterns (each shared copy carries the buyer\'s name). Print-scan resistance is a photo problem, not a pattern problem — your charts only need enough friction to survive casual sharing.');
    redFlags.push({ code: 'CP-02', text: 'Watermarking is off. A shared copy without a name on it is untraceable — and untraceable copies are the ones that end up on storefront sites charging for them.', severity: 'warn' });
  }
  if (!input.uniqueDownloadLinks) {
    preventionNotes.push('Per-buyer unique download links flag the leaker instantly when the file surfaces — most platforms (Payhip, Shopify w/ addons) support this; Ravelry ties downloads to the account.');
  }
  if (!input.soldOnMultiplePlatforms) {
    preventionNotes.push('Single-platform concentration means the leak AND the enforcement channel are the same place — when a takedown goes bad there is no other listing sustaining the pattern. Two-plus channels diversify both revenue and enforcement.');
    redFlags.push({ code: 'CP-03', text: 'The pattern lives on one platform. If that listing is the one attacked (takedown, suspension, fraud wave) there is no fallback revenue. Two-plus channels diversify enforcement risk.', severity: 'warn' });
  }

  // 4. Monitor + evidence
  const evidenceGaps: string[] = [];
  if (!input.evidencePackReady) {
    evidenceGaps.push('evidence pack not assembled (original upload URL, listing URL, first-sale receipt, timestamped archive link)');
    redFlags.push({ code: 'CP-04', text: 'No evidence pack ready. DMCA notices live or die on specificity: exact URLs of the original and the infringing listing, signed under penalty of perjury. Assemble the pack NOW — the day you discover the leak is not the day to hunt for your original upload link.', severity: 'critical' });
  }
  const watchWords = [
    `${input.platformForDmca === 'other' ? 'pattern' : 'pattern'} ${'name'} free download`,
    `'${'name'}' pattern pdf`,
  ];

  // 5. Escalation ladder — the 10-business-day counter-notice deadline is the
  // step designers always miss: Etsy/Ravelry reinstate the listing after the
  // window unless you obtained a court order.
  const steps: EscalationStep[] = [
    {
      label: '1 · Polite private contact',
      detail: 'Message the shop first — small sellers copy without malice, and a polite note resolves most cases in days with zero paperwork. Never accuse publicly.',
      deadlineNote: input.infringerContactedPolitely ? 'Done' : 'Do this before anything else',
    },
    {
      label: '2 · Platform report',
      detail: `File the copyright infringement report on ${DMCA_PLATFORM_LABELS[input.platformForDmca]}. No registration needed — ownership of the original is what matters.`,
      deadlineNote: 'Platforms act "expeditiously" (DMCA safe-harbor duty)',
    },
    {
      label: '3 · DMCA takedown (6 required elements)',
      detail: 'Signature (typed name counts), identification of the original work, the infringing listing URL(s), your contact info, good-faith statement, and accuracy-under-penalty-of-perjury statement. Missing any element = rejection.',
      deadlineNote: 'Include every URL — a vague "someone is stealing my style" claim is not a copyright claim',
    },
    {
      label: '4 · The 10-business-day counter-notice window',
      detail: 'If the seller counters, the platform gives you 10 business days to obtain a court order or the listing comes back. Etsy accepts counter-notices "in certain jurisdictions" — outside the US your position is weaker. Calendar this deadline the moment the counter-notice lands.',
      deadlineNote: input.counterNoticeDeadline ? `Deadline: ${input.counterNoticeDeadline}` : 'No counter-notice received yet — the window opens the day one lands',
    },
    {
      label: '5 · Escalate or absorb',
      detail: `Your response budget is ${fmt$(responseBudgetPerIncident)} per incident at your own rate. Enforcement that costs more than the leak is a charity run — document, block where you can, and spend your hours on the next design.`,
      deadlineNote: fightWorthIt ? 'Leak value exceeds the fight budget — pursue' : 'Leak value is below the fight budget — document and move on',
    },
  ];
  let currentStep = 0;
  if (input.infringerContactedPolitely) currentStep = 1;
  const leakTs = input.leakDiscovered ? Date.parse(input.leakDiscovered) : 0;
  if (leakTs > 0) currentStep = Math.max(currentStep, 2);

  // Counter-notice deadline check
  let counterNoticeDeadlinePassed: boolean | null = null;
  if (input.counterNoticeDeadline) {
    counterNoticeDeadlinePassed = Date.parse(input.counterNoticeDeadline) < Date.now();
    if (counterNoticeDeadlinePassed) {
      currentStep = 4;
      redFlags.push({ code: 'CP-05', text: 'The counter-notice window has lapsed. Without a court order the listing is reinstated — the next move is re-filing (new URLs) or an attorney if the loss justifies it.', severity: 'critical' });
    }
  }

  // Prevention score
  let preventionScore = 25;
  if (input.watermarkEnabled) preventionScore += 30;
  if (input.uniqueDownloadLinks) preventionScore += 15;
  if (input.soldOnMultiplePlatforms) preventionScore += 15;
  if (input.evidencePackReady) preventionScore += 15;
  const watermarkWorthIt = leakExposurePerYear * 0.6 > 0; // always worth it below $1/hr; keep truthful

  const verdict = redFlags.some((f) => f.severity === 'critical') ? 'unready' :
    redFlags.length > 0 ? 'patch' : 'protected';
  const verdictNote =
    verdict === 'unready'
      ? `You have a live leak and the response budget (${fmt$(responseBudgetPerIncident)}/incident) is ${fightWorthIt ? '' : 'NOT '}worth it. Fix the ${redFlags.filter((f) => f.severity === 'critical').map((f) => f.code).join(' + ')} gaps before the next copy lands.`
      : verdict === 'patch'
        ? `Leak exposure ${fmt$(exposure.exposurePerYear(input))}/yr at current share ${Math.round(leak * 100)}%. Patch ${redFlags.map((f) => f.code).join(' + ')} — prevention is cheaper than any takedown.`
        : `No live leak and the prevention stack (watermark, links, multi-channel, evidence pack) is armed. Exposure at ${Math.round(leak * 100)}% leak share is ${fmt$(exposure.exposurePerYear(input))}/yr — below the fight threshold.`;
  void exposure;

  const dmcaNotice = buildDmcaNotice(input);

  return {
    exposure: { leakExposurePerYear, expectedLostNetPerYear, responseBudgetPerIncident, fightWorthIt },
    licenseAudit,
    prevention: { watermarkWorthIt, preventionScore, notes: preventionNotes },
    monitor: {
      watchWords: input.avgPrice > 0 && input.monthlyPatternCopies > 0
        ? [`"${'pattern name'}" free download`, `"${'pattern name'}" pattern pdf`, `"${'your shop/designer name'}" pattern`, `"${'pattern name'}" site:pinterest.com`, `"${'pattern name'}" filetype:pdf`]
        : [],
      evidencePackReady: input.evidencePackReady,
      evidenceGaps,
    },
    escalation: { steps, currentStep, counterNoticeDeadlinePassed },
    redFlags,
    verdict,
    verdictNote,
    dmcaNotice,
  };
}

const exposure = { exposurePerYear: (input: ProtectInput) => input.monthlyPatternCopies * 12 * leakShare(input) * input.avgPrice };

export function generateWatchWords(patternName: string, designerName: string): string[] {
  const name = patternName.trim();
  const designer = designerName.trim();
  const words = [
    `"${name}" pattern free download`,
    `"${name}" pattern pdf`,
    `"${name}" knitting pattern free`,
    `"${name}" crochet pattern free`,
  ];
  if (designer) {
    words.push(`"${designer}" pattern free`, `"${designer}" ${name}`);
  }
  words.push(`"${name}" site:pinterest.com`, `"${name}" filetype:pdf`);
  return words;
}

export function buildDmcaNotice(input: ProtectInput): string {
  return (
`DMCA Copyright Infringement Notice — Knitwear Pattern

To the Copyright Agent (${DMCA_PLATFORM_LABELS[input.platformForDmca]}):

1. Identification of the original copyrighted work:
My original knitting pattern "[PATTERN NAME]" — text, charts, and illustrations
— published at [YOUR ORIGINAL LISTING URL] on [DATE FIRST PUBLISHED].
The pattern is an original literary work (protectable under the UK IPO's
knitting-pattern notice / 17 U.S.C. § 102 even though it consists substantially
of numerals); my charts and photographs are artistic works. Copyright is
automatic and unregistered; I am the sole owner.

2. Identification of the infringing material:
The following listing(s) copy my pattern (and in some cases my photographs)
without authorization:
[INFRINGING LISTING URL 1]
[INFRINGING LISTING URL 2]

3. My contact information:
Full legal name: [YOUR NAME]
Address: [YOUR ADDRESS]
Telephone: [YOUR PHONE]
Email: [YOUR EMAIL]

4. Good-faith statement:
I have a good faith belief that the use of the material in the manner
complained of is not authorized by the copyright owner, its agent, or the law.

5. Accuracy statement:
I state that the information in this notification is accurate and, under
penalty of perjury, that I am authorized to act on behalf of the owner of the
exclusive right that is allegedly infringed.

Signature (electronic — typed name): [YOUR FULL LEGAL NAME]
Date: [DATE]

Note: I understand that knowingly misrepresenting infringement may make me
liable for damages, including costs and attorneys' fees. If a counter-notice
is filed, I understand I have 10 business days to obtain a court order to
keep the material removed.`
  );
}

export function buildEvidenceChecklist(patternName: string): string[] {
  return [
    `Original listing URL for "${patternName}" (your platform)`,
    `First-sale or first-download receipt for "${patternName}"`,
    `Draft file / original chart file with creation date (file metadata counts)`,
    `The infringing listing URL(s) — capture a screenshot NOW; takedowns move the URL`,
    `Side-by-side: your chart vs the copy's chart (chart numerals are the fingerprint)`,
    `Buyer DMs or reviews confirming the copy arrived at a leak channel`,
  ];
}

export function licenseStrengthLabel(score: number): string {
  if (score >= 85) return 'drawn';
  if (score >= 60) return 'partial';
  return 'open';
}
