// CHK-080 — Workspace tab classification.
//
// The reviewer flagged that 70+ tabs on an unclassified strip feel less
// professional. This module assigns every workspace tab value to one of
// six groups so the strip can render small group dividers while keeping
// the existing flex-wrap strip layout (reviewer requirement: never break
// the strip).
//
// Adding a new tab: add its value + group here, nothing else needed for
// classification. New tabs default to "business" if omitted (logged by
// the caller via groupFor).

export type TabGroup =
  | "design"
  | "fit"
  | "pricing"
  | "launch"
  | "channels"
  | "business";

export const TAB_GROUP_LABELS: Record<TabGroup, string> = {
  design: "Design & Pattern",
  fit: "Sizing & Fit",
  pricing: "Pricing & Income",
  launch: "Launch & Marketing",
  channels: "Selling Channels",
  business: "Business & Community",
};

export const TAB_GROUPS: Record<string, TabGroup> = {
  // Design & Pattern
  sections: "design",
  preview: "design",
  draft: "design",
  finish: "design",
  gradinglab: "design",
  chartlab: "design",
  testdesk: "design",
  specsheet: "design",
  lookbook: "design",
  yarn: "design",
  notes: "design",
  snapshots: "design",
  readiness: "design",
  packages: "design",
  "yarn-licensing": "design",
  compiler: "design",
  // Sizing & Fit
  testknit: "fit",
  techedit: "fit",
  testknitlab: "fit",
  submissions: "fit",
  gaugefit: "fit",
  inclusive: "fit",
  collaboration: "fit",
  // Pricing & Income
  income: "pricing",
  pricing: "pricing",
  pricewin: "pricing",
  "pricing-psychology": "pricing",
  "intl-pricing": "pricing",
  mix: "pricing",
  repeat: "pricing",
  "marketplace-takerate": "pricing",
  adlab: "pricing",
  dealmath: "pricing",
  "giftcard": "pricing",
  receiptlab: "pricing",
  "consignment-reprice": "pricing",
  "pattern-bundle": "pricing",
  // Launch & Marketing
  launch: "launch",
  samplelaunch: "launch",
  promo: "launch",
  listingseo: "launch",
  "listing-test": "launch",
  videosocial: "launch",
  photolab: "launch",
  "release-timing": "launch",
  preorder: "launch",
  transbundle: "launch",
  "box-inclusion": "fit",
  "magazine-submission": "launch",
  // Selling Channels
  publish: "channels",
  channels: "channels",
  wholesale: "channels",
  "wholesale-pricelist": "channels",
  wsbook: "channels",
  "channel-migration": "channels",
  subdist: "channels",
  "convention-booth": "channels",
  trunkshow: "channels",
  // Business & Community
  deals: "business",
  collab: "business",
  partners: "business",
  protect: "business",
  licenceit: "business",
  "yarn-pool": "business",
  yarnbuy: "business",
  hireself: "business",
  members: "business",
  patternclub: "business",
  clubrev: "business",
  kalroi: "business",
  kal: "business",
  pipeline: "business",
  kits: "business",
  bookit: "business",
  "membership-site": "business",
  "retreat-teach": "business",
  "workshop-teach": "business",
  teach: "business",
  showroi: "business",
  "pod-patterns": "channels",
  "podcast-affiliate": "launch",
  // Record room — the ledger that every future record tab plugs into.
  designledger: "business",
  // CHK-091 — Brag Cards: shareable stat cards, launch group.
  bragcard: "launch",
  payback: "pricing",
};

export function groupFor(tabValue: string): TabGroup {
  return TAB_GROUPS[tabValue] ?? "business";
}

/** Visual order of groups on the strip. */
export const GROUP_ORDER: TabGroup[] = [
  "design",
  "fit",
  "pricing",
  "launch",
  "channels",
  "business",
];
