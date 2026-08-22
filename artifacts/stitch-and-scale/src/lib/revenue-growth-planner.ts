/**
 * Revenue & Growth Planner — evidence-led monetization hypotheses and
 * organic growth experiments for independent knitwear designers.
 *
 * WHY THIS EXISTS (Pricing Report, Aug 2026):
 * The most important strategic issue is customer identity. A hobbyist mother
 * (low-friction, project-based) and a professional designer (recurring
 * workflow) have different value profiles. This planner helps designers
 * choose a model based on their specific catalogue and audience.
 *
 * GUIDELINES:
 * 1. All figures are HYPOTHESES, not committed prices or forecasts.
 * 2. No payment processing, tax advice, or financial guarantees.
 * 3. Local-first: data stays in the browser.
 */

export interface PricingHypothesis {
  id: string;
  name: string;
  target: string;
  price: number;
  period: 'once' | 'month' | 'year';
  included: string[];
  rationale: string;
}

export const PRICING_MODELS: PricingHypothesis[] = [
  {
    id: 'free-maker',
    name: 'Free Maker',
    target: 'Hobbyist mother exploring',
    price: 0,
    period: 'once',
    included: ['Sample projects', '1 active personal project', 'Basic measurements', 'JSON backup'],
    rationale: 'Removes risk and lets users experience the workflow before committing.'
  },
  {
    id: 'project-pass',
    name: 'Project Pass',
    target: 'One-off project or export',
    price: 7.99,
    period: 'once',
    included: ['1 publishable project', 'Standard sizes', 'PDF export', '12 months re-downloads'],
    rationale: 'Matches irregular project use and avoids unwanted subscriptions.'
  },
  {
    id: 'hobbyist-annual',
    name: 'Hobbyist Annual',
    target: 'Active hobbyist',
    price: 39,
    period: 'year',
    included: ['Multiple personal projects', 'Project history', 'Basic templates'],
    rationale: 'Comparable to $6.50/project at 6 projects; no monthly commitment.'
  },
  {
    id: 'creator-pro',
    name: 'Creator Pro',
    target: 'Designer selling patterns',
    price: 19,
    period: 'month',
    included: ['Unlimited commercial exports', 'Advanced grading', 'Test-knit management', 'Economics'],
    rationale: 'Recurring value justified by repeated publishing and business use.'
  },
  {
    id: 'editor-studio',
    name: 'Editor/Studio',
    target: 'Technical editor or team',
    price: 49,
    period: 'month',
    included: ['Shared projects', 'Annotations', 'Client workspaces', 'Audit trails'],
    rationale: 'Monetizes professional workflow and expert-partner channels.'
  }
];

export interface GrowthPillar {
  title: string;
  content: string;
  cta: string;
}

export const GROWTH_PILLARS: GrowthPillar[] = [
  {
    title: 'Problem Education',
    content: 'Why grading one base size into nine sizes is harder than it looks.',
    cta: 'Comment or join tester list'
  },
  {
    title: 'Product Demonstration',
    content: 'Screen recording from sample project to grading table to PDF export.',
    cta: 'Try the private beta'
  },
  {
    title: 'Transparent Math',
    content: 'Show how gauge, measurements, ease, and rounding affect a result.',
    cta: 'Ask for designer review'
  },
  {
    title: 'Build in Public',
    content: 'What three testers found this week and what we changed.',
    cta: 'Apply for next cohort'
  },
  {
    title: 'Designer Economics',
    content: 'Explain hours, tech editing, test knitting, and marketplace fees.',
    cta: 'Join workflow interview'
  }
];

export interface BetaMetric {
  label: string;
  target: string;
  insight: string;
}

export const BETA_METRICS: BetaMetric[] = [
  { label: 'Workflow Completion', target: '70%', insight: 'Onboarding/navigation health' },
  { label: 'First Useful Result', target: '1 session', insight: 'Time-to-value acceptability' },
  { label: 'Trust Score', target: '8/10', insight: 'Professional confidence' },
  { label: 'Repeat Intent', target: '60%', insight: 'Recurring value potential' },
  { label: 'Conversion to Real', target: '30%', insight: 'Demo vs real-world utility' }
];

/** Calculate projected revenue for a specific model based on volume. */
export function projectRevenue(price: number, volume: number): number {
  return price * volume;
}

/** 
 * Calculate contribution margin hypothesis. 
 * Assumes 5% platform fee + $0.30 transaction (standard digital goods estimate).
 */
export function estimateContributionMargin(price: number, volume: number): number {
  if (price <= 0) return 0;
  const gross = price * volume;
  const fees = (gross * 0.05) + (volume * 0.30);
  return Math.max(0, gross - fees);
}
