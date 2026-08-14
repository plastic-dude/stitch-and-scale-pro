/**
 * Convention Booth Lab — should this show be worth the table fee, the travel,
 * and the inventory hours? A pre-commitment decision tool (unlike craft-show
 * trackers that only log sales afterwards).
 *
 * Model: projected customers = daily shoppers × days × conversion (worst/
 * realistic/best band, 1-2% average per MadeUrban). Revenue = customers ×
 * blended avg ticket across the product mix. Costs = show fixed costs
 * (booth + application + travel/lodging + display share) + card fees +
 * inventory production cost (units × hours per unit × opportunity rate).
 * Email captures add long-tail EV (fraction of signups who buy later at the
 * same ticket, within ~60 days — the "long tail" every craft-fair guide
 * mentions but no tool models).
 *
 * Benchmarks: booth fees run ~$180-300 for mid-size fairs, $240-715 for wool
 * festivals (with tent rental), $625 for premium NY fiber events (Indie
 * Untangled). Industry folklore: sell ~7x the booth fee ("7x rule");
 * experienced vendors say 10x is "pretty profitable"; real earnings range
 * $32-$2,600 per day (Chanamon, 15 show-days in one year).
 */

export interface ShowCosts {
  boothFee: number;
  applicationFee: number;
  travelLodging: number;
  displayPackingCost: number;
}

export interface ProductMixItem {
  label: string;
  price: number;
  share: number; // 0-100, share of transactions
  hoursPerUnit: number; // knitting/production hours per unit sold
}

export interface ConventionBoothInput {
  showCosts: ShowCosts;
  days: number;
  shoppersPerDay: number;
  conversionWorst: number;
  conversionRealistic: number;
  conversionBest: number;
  avgTicket: number;
  mix: ProductMixItem[];
  unitsAvailable: number; // total inventory units ready to bring
  hourlyRate: number;
  prepSetupTeardownHours: number; // hours spent preparing + setting up + selling + teardown
  cardFeePct: number;
  emailCaptures: number;
  followupConversionPct: number; // % of email signups who buy within ~60 days
}

export interface BoothFlag {
  code: string;
  title: string;
  detail: string;
}

export interface ShowOutcome {
  label: string;
  shoppers: number;
  customers: number;
  demandUnits: number;
  sellableUnits: number;
  revenue: number;
  cardFees: number;
  productionCost: number;
  emailLongTail: number;
  netProfit: number;
  effectiveHourly: number;
}

export interface ConventionBoothResult {
  scenarios: ShowOutcome[];
  fixedCosts: number;
  perHourFixedCost: number;
  breakEvenUnits: number;
  breakEvenCustomers: number;
  sevenXMultiple: number;
  flags: BoothFlag[];
  verdict: string;
  verdictNote: string;
}

export const DEFAULT_BOOTH: ConventionBoothInput = {
  showCosts: { boothFee: 300, applicationFee: 30, travelLodging: 150, displayPackingCost: 50 },
  days: 2,
  shoppersPerDay: 2000,
  conversionWorst: 1,
  conversionRealistic: 1.5,
  conversionBest: 2,
  avgTicket: 42,
  mix: [
    { label: 'Garments', price: 180, share: 25, hoursPerUnit: 20 },
    { label: 'Accessories', price: 55, share: 45, hoursPerUnit: 4 },
    { label: 'Pattern cards', price: 12, share: 30, hoursPerUnit: 0 },
  ],
  unitsAvailable: 40,
  hourlyRate: 25,
  prepSetupTeardownHours: 30,
  cardFeePct: 2.7,
  emailCaptures: 40,
  followupConversionPct: 12,
};

export const SHOW_SIZE_HINTS: Record<string, string> = {
  small: 'Local market, <50 vendors — roughly 300+ shoppers/day',
  medium: 'Regional show, ~100 vendors — roughly 2,000+ shoppers/day',
  large: 'National fiber event, hundreds of vendors — roughly 10,000+ shoppers/day',
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function blendedTicket(input: ConventionBoothInput): number {
  const totalShare = input.mix.reduce((s, m) => s + m.share, 0);
  if (totalShare <= 0) return input.avgTicket;
  let blended = 0;
  for (const m of input.mix) blended += m.price * (m.share / totalShare);
  return blended;
}

function blendedHoursPerUnit(input: ConventionBoothInput): number {
  const totalShare = input.mix.reduce((s, m) => s + m.share, 0);
  if (totalShare <= 0) return 0;
  let hrs = 0;
  for (const m of input.mix) hrs += m.hoursPerUnit * (m.share / totalShare);
  return hrs;
}

function scenario(label: string, conversionPct: number, input: ConventionBoothInput): ShowOutcome {
  const conv = clamp01(conversionPct / 100);
  const shoppers = input.shoppersPerDay * Math.max(1, input.days);
  const customers = shoppers * conv;
  const ticket = blendedTicket(input);
  const hrsPerUnit = blendedHoursPerUnit(input);

  // Demand units = customers × units-per-transaction proxy.
  // A pattern-card transaction is 1 unit; a $42+ garment purchase is 1 unit.
  // Use 1.2 units/transaction as a conservative average (some multi-item baskets).
  const demandUnits = Math.ceil(customers * 1.2);
  const sellableUnits = Math.min(demandUnits, Math.max(1, input.unitsAvailable));
  // Unsold demand loses revenue; sellable units capped by inventory.
  const revenue = sellableUnits * ticket;

  const fixed =
    input.showCosts.boothFee +
    input.showCosts.applicationFee +
    input.showCosts.travelLodging +
    input.showCosts.displayPackingCost;
  const cardFees = revenue * clamp01(input.cardFeePct / 100);
  const productionCost = sellableUnits * hrsPerUnit * input.hourlyRate;
  const followups = input.emailCaptures * clamp01(input.followupConversionPct / 100);
  const emailLongTail = followups * ticket * 0.55; // ~half the basket vs in-person

  const totalHours = input.prepSetupTeardownHours + sellableUnits * hrsPerUnit;
  const netProfit = revenue - fixed - cardFees - productionCost + emailLongTail;
  const effectiveHourly = totalHours > 0 ? netProfit / totalHours : netProfit;
  return {
    label, shoppers, customers, demandUnits, sellableUnits, revenue, cardFees,
    productionCost, emailLongTail, netProfit, effectiveHourly,
  };
}

export function analyzeConventionBooth(input: ConventionBoothInput): ConventionBoothResult {
  const realistic = scenario('realistic', input.conversionRealistic, input);
  const worst = scenario('worst', input.conversionWorst, input);
  const best = scenario('best', input.conversionBest, input);

  const ticket = blendedTicket(input);
  const hrsPerUnit = blendedHoursPerUnit(input);
  const fixed =
    input.showCosts.boothFee +
    input.showCosts.applicationFee +
    input.showCosts.travelLodging +
    input.showCosts.displayPackingCost;

  // Break-even in units sold (ignoring production cost is wrong — each sold
  // unit costs hrsPerUnit×rate in production time). Solve net = 0:
  // units×ticket − fixed − units×ticket×cardFee − units×hrs×rate = 0
  // units = fixed ÷ (ticket×(1−cardFee) − hrs×rate)
  const netPerUnit = ticket * (1 - clamp01(input.cardFeePct / 100)) - hrsPerUnit * input.hourlyRate;
  const breakEvenUnits = netPerUnit > 0 ? Math.ceil(fixed / netPerUnit) : Infinity;
  // Break-even customers: demand units = customers × 1.2 blended basket,
  // so customers = units ÷ 1.2.
  const breakEvenCustomersFromFixed: number =
    netPerUnit > 0 ? Math.ceil(fixed / netPerUnit / 1.2) : Infinity;
  const sevenXMultiple = realistic.revenue / Math.max(1, input.showCosts.boothFee);

  const flags: BoothFlag[] = [];

  if (input.shoppersPerDay <= 0 || input.days <= 0) {
    flags.push({
      code: 'CB-01',
      title: 'Missing show traffic — can\'t estimate',
      detail: 'Ask the organizer for expected footfall; without shoppers/day there is no projection. A medium regional show (~100 vendors) draws roughly 2,000 shoppers/day.',
    });
  } else if (input.shoppersPerDay < 250) {
    flags.push({
      code: 'CB-01',
      title: 'Very low-traffic show',
      detail: `At ${input.shoppersPerDay} shoppers/day even a 5% conversion is under 13 customers per day. Low fees can still make this work — check the fixed-cost line, but don't expect volume.`,
    });
  }

  if (realistic.netProfit < 0) {
    const gap = Math.abs(realistic.netProfit);
    flags.push({
      code: 'CB-02',
      title: 'Realistic case loses money',
      detail: `At a ${input.conversionRealistic}% conversion the show loses $${gap.toFixed(0)} once inventory hours are priced in. The only exception: email-list value you haven't modeled.`,
    });
  }

  if (sevenXMultiple < 7 && realistic.revenue > 0) {
    flags.push({
      code: 'CB-03',
      title: 'Under the 7x rule',
      detail: `Revenue is ${sevenXMultiple.toFixed(1)}x the booth fee; the industry's working folklore is ~7x minimum ($${(input.showCosts.boothFee * 7).toLocaleString('en-US')} target) and ~10x for a truly profitable day.`,
    });
  }

  if (best.sellableUnits >= input.unitsAvailable && realistic.sellableUnits >= input.unitsAvailable * 0.9) {
    flags.push({
      code: 'CB-04',
      title: 'Inventory risk — you may sell out',
      detail: `Even the worst case nearly exhausts your ${input.unitsAvailable} units. Every unit you didn't bring is revenue left on the table — knit the slow sellers ahead, or raise prices at the booth.`,
    });
  }

  const totalHours = input.prepSetupTeardownHours + realistic.sellableUnits * hrsPerUnit;
  if (totalHours > 0 && realistic.effectiveHourly < input.hourlyRate) {
    flags.push({
      code: 'CB-05',
      title: 'Hours underpay vs online selling',
      detail: `The show pays $${realistic.effectiveHourly.toFixed(2)}/hr across ${totalHours.toFixed(0)} total hours (prep + setup + selling + teardown + knitting inventory) — below your $${input.hourlyRate}/hr. Those same hours shipping patterns or finishing test-knit work would pay more.`,
    });
  }

  if (input.emailCaptures <= 0) {
    flags.push({
      code: 'CB-06',
      title: 'No email capture modeled',
      detail: 'Every craft-show guide agrees: the list you build is the long-tail revenue. Bring a QR-code sign-up and an incentive — even 12% of 40 signups buying later at half a basket adds real EV.',
    });
  }

  let verdict: string;
  let verdictNote: string;

  if (input.shoppersPerDay <= 0 || input.days <= 0) {
    verdict = 'No traffic data — get the organizer\'s numbers first';
    verdictNote = 'Ask expected footfall before paying the application fee. Compare against the size classes: small local ~300 shoppers/day, medium regional ~2,000/day, national fiber events ~10,000/day. Re-run once you have a number.';
  } else if (best.netProfit < 0) {
    verdict = 'Skip — even the best case loses money';
    verdictNote = `At a ${input.conversionBest}% conversion you'd still be $${Math.abs(best.netProfit).toFixed(0)} short. The fee, travel, and inventory hours outweigh demand at this traffic level. Either pick a higher-traffic show or sell online instead.`;
  } else if (realistic.netProfit < 0) {
    const emailOnly = realistic.revenue - fixed - realistic.cardFees - realistic.productionCost;
    if (emailOnly >= 0) {
      verdict = 'Only as marketing — email list carries the show';
      verdictNote = `At-show profit is $${emailOnly.toFixed(0)}, but the ${input.emailCaptures}-signup list (≈${Math.round(input.emailCaptures * clamp01(input.followupConversionPct / 100))} follow-up buyers) is what turns this show green. Run it if you'll actually work that list within 60 days.`;
    } else {
      verdict = 'Skip — realistic case loses money';
      verdictNote = `At ${input.conversionRealistic}% conversion the show loses $${Math.abs(realistic.netProfit).toFixed(0)}. You'd need ${(breakEvenCustomersFromFixed === Infinity ? '∞' : breakEvenCustomersFromFixed.toLocaleString('en-US'))} customers just to break even, but ${realistic.customers.toFixed(0)} are realistic. Save the weekend.`;
    }
  } else if (realistic.effectiveHourly < input.hourlyRate) {
    verdict = 'Borderline — runs at a discount to your rate';
    verdictNote = `The show nets $${realistic.netProfit.toFixed(0)} but works out to $${realistic.effectiveHourly.toFixed(2)}/hr over ${totalHours.toFixed(0)} hours — less than your $${input.hourlyRate}/hr. It's a marketing weekend: booth presence, list-building, brand visibility. Run it when the intangibles are worth the discount.`;
  } else if (sevenXMultiple < 7) {
    verdict = 'Break-even positive, but below the 7x rule';
    verdictNote = `The show pays $${realistic.effectiveHourly.toFixed(2)}/hr and clears $${realistic.netProfit.toFixed(0)}, but revenue is only ${sevenXMultiple.toFixed(1)}x the booth fee. Vendors who consistently hit ~10x call those shows "pretty profitable." This one pays — just not generously. Price up the booth with higher-ticket items to push the multiple.`;
  } else {
    verdict = 'Run it — this show pays';
    verdictNote = `At ${input.conversionRealistic}% conversion you net $${realistic.netProfit.toFixed(0)} at $${realistic.effectiveHourly.toFixed(2)}/hr — ${sevenXMultiple.toFixed(1)}x the booth fee, which clears the 7x folklore and approaches the 10x experienced-vendor benchmark. Stock ${(breakEvenUnits === Infinity ? '∞' : breakEvenUnits)} units to break even on fixed costs, keep inventory above demand (${realistic.sellableUnits} units at realistic conversion), and work the email list.`;
  }

  return {
    scenarios: [worst, realistic, best],
    fixedCosts: fixed,
    perHourFixedCost: input.prepSetupTeardownHours > 0 ? fixed / input.prepSetupTeardownHours : fixed,
    breakEvenUnits,
    breakEvenCustomers: breakEvenCustomersFromFixed,
    sevenXMultiple,
    flags,
    verdict,
    verdictNote,
  };
}

export function fmt$(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
