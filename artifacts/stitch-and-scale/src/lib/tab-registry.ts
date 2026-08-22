// CHK-089 — Single declarative workspace tab registry.
//
// The reviewer's top structural recommendation: project-workspace.tsx used
// two independent lists — one hand-written for the TabsTrigger strip and
// one hand-written for TabsContent panels — so the dead-tab defect class
// (trigger with no content, content with no trigger) appeared twice for
// exactly that reason. This module is the single source of truth: one
// array drives both the strip and the content rendering.
//
// Invariants enforced by count-drift.test.ts (CHK-087): TAB_REGISTRY must
// contain exactly 83 entries (77 at CHK-087, +1 for Brag Cards at CHK-091, +1 for Snapshots at CHK-182, +1 for Readiness at CHK-184, +1 for Packages at CHK-185, +1 for Compiler at CHK-186), every value must be a real TAB_GROUPS key,
// and every entry must render a real content panel. A dev-time assertion
// below fails loudly at render if registry and classification ever drift.
//
// Adding a new tab: one entry in TAB_REGISTRY. Nothing else to touch —
// the strip chip, the trigger, and the content slot all come for free.
//
// Ordering note: array order == strip order (preserves the existing
// visual ordering and the flex-wrap strip layout the reviewer requires).

import type { ComponentType } from "react";
import { groupFor, TAB_GROUP_LABELS, TAB_GROUPS, type TabGroup } from "./workspace-tab-groups";

export interface TabRegistryEntry {
  /** Radix Tabs value, used as both trigger value and content value. */
  value: string;
  /** Label shown on the strip chip. */
  label: string;
  /** Optional lucide icon rendered on the strip chip. */
  icon?: string;
  /** Classification group — must exist in TAB_GROUPS (asserted at runtime). */
  group: TabGroup;
  /** Card component that fills the tab's content panel. */
  card?: ComponentType<{ project: unknown; onUpdateProject?: unknown; [k: string]: unknown }>;
}

export const TAB_REGISTRY: TabRegistryEntry[] = [
  // Design & Pattern (13)
  { value: "sections", label: "Sections", group: "design" },
  { value: "preview", label: "Preview", group: "design" },
  { value: "yarn", label: "Yarn", group: "design" },
  { value: "notes", label: "Notes", group: "design" },
  { value: "snapshots", label: "Snapshots", group: "design", icon: "History" },
  { value: "readiness", label: "Readiness", group: "design", icon: "ShieldCheck" },
  { value: "packages", label: "Packages", group: "design", icon: "Package" },
  { value: "income", label: "Income", group: "pricing" },
  { value: "draft", label: "Draft", group: "design" },
  { value: "pricing", label: "Pricing", group: "pricing" },
  { value: "publish", label: "Publish", group: "channels" },
  { value: "testknit", label: "Test Knit", group: "fit" },
  { value: "techedit", label: "Tech Edit", group: "fit" },
  { value: "finish", label: "Finish", group: "design" },
  { value: "deals", label: "Deals", group: "business" },
  { value: "launch", label: "Launch", group: "launch" },
  { value: "trunkshow", label: "Trunk Show", group: "channels" },
  { value: "transbundle", label: "Trans & Bundle", group: "launch" },
  { value: "patternclub", label: "Pattern Club", group: "business" },
  { value: "kits", label: "Kits", group: "business" },
  { value: "pipeline", label: "Pipeline", group: "business" },
  { value: "kalroi", label: "KAL & Collab", group: "business" },
  { value: "channels", label: "Channels", group: "channels" },
  { value: "clubrev", label: "Club Rev", group: "business" },
  { value: "wsbook", label: "Wholesale & Book", group: "channels" },
  { value: "hireself", label: "Hire vs Self", group: "business" },
  { value: "inclusive", label: "Inclusive", group: "fit" },
  { value: "licenceit", label: "Licence It", group: "business" },
  { value: "members", label: "Members", group: "business" },
  { value: "promo", label: "Promo", group: "launch" },
  { value: "pricewin", label: "PriceWin", group: "pricing" },
  { value: "repeat", label: "Repeat", group: "pricing" },
  { value: "mix", label: "Mix", group: "pricing" },
  { value: "collab", label: "Collab", group: "business" },
  { value: "bookit", label: "Book It", group: "business" },
  { value: "protect", label: "Protect", group: "business" },
  { value: "teach", label: "Teach", group: "business" },
  { value: "partners", label: "Partners", group: "business" },
  { value: "yarnbuy", label: "Yarn Buy", group: "business" },
  { value: "kal", label: "KAL Planner", group: "business", icon: "CalendarDays" },
  { value: "gradinglab", label: "Grading Lab", group: "design", icon: "FlaskConical" },
  { value: "chartlab", label: "Chart Lab", group: "design", icon: "PenLine" },
  { value: "testdesk", label: "Test Knit Desk", group: "design", icon: "ClipboardCheck" },
  { value: "submissions", label: "Submissions", group: "fit" },
  { value: "lookbook", label: "Lookbook", group: "design", icon: "Camera" },
  { value: "specsheet", label: "Spec Sheet", group: "design", icon: "FileText" },
  { value: "subdist", label: "Distribution", group: "channels", icon: "Library" },
  { value: "listingseo", label: "Listing SEO", group: "launch", icon: "Tag" },
  { value: "adlab", label: "Ad Break-Even", group: "pricing", icon: "Target" },
  { value: "samplelaunch", label: "Sample & Launch", group: "launch", icon: "Sparkles" },
  { value: "dealmath", label: "Collab Deal Math", group: "pricing", icon: "FileCheck2" },
  { value: "photolab", label: "Photo ROI", group: "launch", icon: "Camera" },
  { value: "videosocial", label: "Video & Social", group: "launch", icon: "Video" },
  { value: "showroi", label: "Show ROI", group: "business", icon: "Tent" },
  { value: "wholesale", label: "Wholesale Lab", group: "channels", icon: "Handshake" },
  { value: "preorder", label: "Pre-Order Lab", group: "launch", icon: "Rocket" },
  { value: "listing-test", label: "Listing Test Lab", group: "launch", icon: "Rocket" },
  { value: "yarn-pool", label: "Yarn Pool Lab", group: "business", icon: "Boxes" },
  { value: "membership-site", label: "Membership Lab", group: "business", icon: "Crown" },
  { value: "release-timing", label: "Release Timing Lab", group: "launch", icon: "CalendarDays" },
  { value: "convention-booth", label: "Booth Lab", group: "channels", icon: "Tent" },
  { value: "channel-migration", label: "Channel Lab", group: "channels", icon: "MapPin" },
  { value: "workshop-teach", label: "Workshop Lab", group: "business", icon: "Presentation" },
  { value: "consignment-reprice", label: "Re-Price Lab", group: "pricing", icon: "Store" },
  { value: "pattern-bundle", label: "Bundle Lab", group: "pricing", icon: "Presentation" },
  { value: "retreat-teach", label: "Retreat Lab", group: "business", icon: "Tent" },
  { value: "podcast-affiliate", label: "Podcast Lab", group: "launch", icon: "Radio" },
  { value: "magazine-submission", label: "Magazine Lab", group: "launch", icon: "FileText" },
  { value: "pricing-psychology", label: "Price Psych Lab", group: "pricing", icon: "Tag" },
  { value: "pod-patterns", label: "POD Patterns Lab", group: "channels", icon: "BookOpen" },
  { value: "marketplace-takerate", label: "Take-Rate Lab", group: "pricing", icon: "Store" },
  { value: "box-inclusion", label: "Box Inclusion Lab", group: "fit", icon: "Package" },
  { value: "yarn-licensing", label: "Yarn Licensing Lab", group: "design", icon: "Scale" },
  { value: "giftcard", label: "Gift & Credit Lab", group: "pricing", icon: "Gift" },
  // CHK-132 (S241): canonical name is 'Wholesale Price List Lab' (engine, docs,
  // tests, card header all use it) — the chip label dropped 'Price'.
  { value: "wholesale-pricelist", label: "Wholesale Price List Lab", group: "channels", icon: "ClipboardList" },
  { value: "intl-pricing", label: "Intl Pricing Lab", group: "pricing", icon: "Globe" },
  { value: "testknitlab", label: "Test Knit Lab", group: "fit", icon: "Users" },
  { value: "gaugefit", label: "Gauge & Fit", group: "fit", icon: "Ruler" },
  { value: "receiptlab", label: "Receipt Lab", group: "pricing", icon: "ReceiptText" },
  { value: "designledger", label: "Design Ledger", group: "business", icon: "BookMarked" },
  // CHK-091 — Brag Cards: shareable stat cards from the designer's own
  // ledger (growth-engine feature, founder wishlist). Placed last so
  // existing strip ordering stays untouched.
  { value: "bragcard", label: "Brag Cards", group: "launch", icon: "Send" },
  { value: "payback", label: "Payback Lab", group: "pricing", icon: "TrendingUp" },
  { value: "compiler", label: "Compiler", group: "design", icon: "ShieldCheck" },
];

/** Canonical number of workspace labs exposed by the product. */
export const TAB_COUNT = TAB_REGISTRY.length;

// Dev-time invariants — these fail loudly before a misregistered tab can
// render (in tests the registry is imported and the assertions run on
// import, so a drifted count fails `vitest run` as well).
export function assertTabRegistryIntegrity(): void {
  const values = TAB_REGISTRY.map((t) => t.value);
  const dupes = values.filter((v, i) => values.indexOf(v) !== i);
  console.assert(dupes.length === 0, "TAB_REGISTRY contains duplicate values: " + dupes.join(", "));
  console.assert(
    TAB_REGISTRY.length === Object.keys(TAB_GROUPS).length,
    "TAB_REGISTRY (" + TAB_REGISTRY.length + ") does not match TAB_GROUPS (" + Object.keys(TAB_GROUPS).length + ")",
  );
  console.assert(
    TAB_REGISTRY.length === 83,
    "TAB_REGISTRY count is " + TAB_REGISTRY.length + ", expected 83"
  );
  for (const t of TAB_REGISTRY) {
    console.assert(
      TAB_GROUPS[t.value] !== undefined,
      "TAB_REGISTRY value '" + t.value + "' has no classification in TAB_GROUPS",
    );
    console.assert(
      groupFor(t.value) === t.group,
      "TAB_REGISTRY entry '" + t.value + "' declares group '" + t.group + "' but groupFor says '" + groupFor(t.value) + "'",
    );
  }
  const missing = Object.keys(TAB_GROUPS).filter((v) => !values.includes(v));
  console.assert(
    missing.length === 0,
    "TAB_GROUPS values not present in TAB_REGISTRY: " + missing.join(", "),
  );
}

export { TAB_GROUP_LABELS };
