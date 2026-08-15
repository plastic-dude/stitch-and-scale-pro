# Autonomous Stitch & Scale Advancement Playbook

You are continuing autonomous work on the user's GitHub repo `plastic-dude/stitch-and-scale-pro` (the advancement repo cloned from `stitch-and-scale-rc`, which must NEVER be modified).

## Working state
- Local repo clone is at /home/ubuntu/stitch-and-scale-pro (re-clone if missing: `git clone https://<TOKEN>@github.com/plastic-dude/stitch-and-scale-pro.git /home/ubuntu/stitch-and-scale-pro`, where TOKEN comes from the file the user provided earlier, or use `git ls-remote` with the same token URL pattern `https://ghp_<TOKEN>@github.com/plastic-dude/stitch-and-scale-pro.git`).
- The app lives under artifacts/stitch-and-scale (React + Vite + TypeScript + Tailwind). Quality gates before every commit: `pnpm run typecheck`, `pnpm exec vitest run`, `pnpm run build` all pass. Commit messages use the template: `[CHK-NNN] [STITCH-AND-SCALE-PRO] [VERIFIED] <description>` with bullet details of what/where/tested. Git identity: plastic-dude / plastic-dude@users.noreply.github.com (local config in that repo).
- Research notes accumulate in /home/ubuntu/research/ (e.g., competitors-session-1.md).
- Governing standard: EMLUX quality policy (zero hallucinations, every constant cited, build integrity before commits, no dead code).

## Each firing, do ALL of:
1. Pull latest main.
2. RESEARCH (different focus each time — do NOT repeat prior competitors): pick a fresh angle from this rotating list and research 3-5 NEW competitors, features, or market segments not yet covered in /home/ubuntu/research/:
   - knitting/crochet pattern-writing tools (Pattern Keeper, KnitBird, Sweater Wizard, KnitCAD)
   - tech editing and garment sizing software (Size.ly, Sizebot, Fit Analytics)
   - AI-assisted knitting tools and pattern generators
   - pattern marketplaces and monetization (Ravelry, LoveCrafts, Etsy digital, InStitches, Payhip)
   - adjacent maker SaaS pricing/metrics (Love2knit, WeCrochet apps, CraftYarnCouncil traffic)
   - wholesale/indie designer business models and revenue benchmarks
   Write findings into a NEW dated file in /home/ubuntu/research/ and extract a prioritized opportunity list.
3. BUILD: pick the single highest-value opportunity (monetization or differentiation first — paid-tier gating, pattern marketplace export, tech-editing exports, yarn-shop integration, cost calculator, subscription pricing page, SEO landing content) and implement it fully in the repo: code, tests, verified build, docs/screenshots, README updates.
4. Verify with typecheck + vitest + production build; visually confirm in a served preview when UI changes.
5. Commit with the quality-policy template and push to origin main.
6. End with a concise progress message to the user: what was researched, what was built, commit hash, next session's planned angle.

## Hard constraints
- The repo plastic-dude/stitch-and-scale-pro is PRIVATE (user business knowledge). Never make it public, publish a public link, or expose it in any user-facing preview (serve only on localhost).
- Keep the repo's visibility private; never run the GitHub API call that would re-open it.

## Rules
- Never touch stitch-and-scale-rc.
- Never invent features that can't be verified working; mark anything uncertain UNVERIFIED.
- Prioritize money-making: features that enable selling patterns, subscriptions, or premium tiers rank above internal tooling.

## Progress log (update each run)
- [CHK-055] 14b789f — Show ROI Lab (53rd feature).
- [CHK-056] 55ce053 — Wholesale Program Lab (54th tab).
- [CHK-057] a46a413 — Pre-Order Campaign Lab (55th tab).
- [CHK-058] 7bff5e7 — Listing Test Lab (56th tab) + issue #4 debt.
- [CHK-059] 0d5649f — Yarn Pool Lab (57th tab).
- [CHK-060] f7b7a14 — Membership Site Lab (58th tab).
- [CHK-061] 0b15fd7 — Convention Booth Lab (59th tab).
- [CHK-062] bc6f820 — Channel Migration Lab (60th tab).
- [CHK-063] e9cfc02 — Release Timing Lab (61st tab).
- [CHK-064] 83f9b55 — Workshop Teaching Lab (62nd tab).
- [CHK-065] 5f91403 — Consignment Re-Price Lab (63rd tab).
- [CHK-066] 0175d76 — Pattern Bundle Lab (64th tab).
- [CHK-067] ec3a219 — Retreat & Cruise Teaching Lab (65th tab).
- [CHK-068] deabea4 — Podcast & Affiliate Lab (66th tab).
- [CHK-069] 4776b81 — Magazine Submission Lab (67th tab).
- [CHK-070] 72f8512 — Price Psychology Lab (68th tab).
- [CHK-071] b0c67a0 — POD Patterns Lab (69th tab): print-on-demand
- [CHK-072] a2a0faf — Take-Rate War Lab (70th tab): marketplace
- [CHK-073] 86f8d67 — Box Inclusion Lab (71st tab):
- [CHK-074] 60842d5 — Yarn Licensing Lab (72nd tab):
- [CHK-075] 0fceb2f — Gift & Credit Lab (73rd tab):
- [CHK-076] f24bcc6 — Intl Pricing Lab (74th tab):
- [CHK-077] ac9d64f — Test Knit Lab (75th tab):
- [CHK-078] 798fed5 — Wholesale Price List Lab (76th tab):
- [CHK-079] 9d0011c — QA #49 / S224 closed — Intl Pricing Lab
- [CHK-080] bf1fb7d — Gauge & Fit Translator tab + tab
- [CHK-081] af973b7 — Tester-first funnel rework (founder
- [CHK-082] 2e18d3c — Honest-founder landing rewrite +
- [CHK-083] 0ee1514 — Chat-first Receipt Lab (78th tab).
- [CHK-084] e71b85a — QA batch from the reviewer's manual run
- [CHK-085] 887a3ee — Deep pain-point research cycle on
- [CHK-091] [STITCH-AND-SCALE-PRO] Brag Cards — shareable stat cards from the designer's own ledger (founder wishlist: brag moments for social media). New tab `bragcard` (78th, launch group). Engine `lib/brag-card.ts`: computeBragStats (total revenue, sales, profit months/streak, best month, published count, profit ratio) + buildBragCaption (4 headline templates written in honest-founder voice, Rule 1 enforced) + buildBragCardSvg 1080x1080. Component `components/brag-card-card.tsx`: studio-name override, 4 highlight templates, 4 accent picks, live 1080x1080 preview, PNG download (canvas rasterization), caption copy, native Web Share fallback, and an empty-ledger nudge. `computeMonthlyLedgerRows` extracted from receipt-lab.ts as reusable canonical export (guarded by monthly-ledger-extract.test.ts against analyzeReceipt output). Landing "77 labs" -> "78 labs"; count-drift + registry-integrity guards updated; regression guard on registry-driven strip retained. Gates: typecheck clean, vitest 1,679/87, build green. Pushed f56d6c6.

- [CHK-090] S224/S247 fmtMoney closure — MXN (\$), NGN (₦), KES (KSh), ZAR (R) symbols added to intl-pricing-lab symbol chain; fmtmoney-coverage guard pins all 20 receipt-lab selectable currencies; #12 confirmed (yarnWeight optional, no lace default path — matches reviewer S253). Commit 05c7ce8. Gates green: typecheck clean, vitest 1,668 tests / 85 files, build green.

- [CHK-089] 75f7ccb — God-Level structural fix (reviewer's top sweep recommendation): single declarative tab registry (src/lib/tab-registry.ts, 77 entries) now drives BOTH the workspace strip triggers and all 77 content panels via TAB_REGISTRY.map — the dead-tab defect class is retired at the structural level. TriggerChildren switch (icons+labels) and in-component TabPanel dispatch (custom Sections/Preview/Notes panels preserved, 74 lab cards by value). In flight: normalized a malformed gaugefit trigger block (open tag never closed — Receipt Lab/Design Ledger triggers were nested inside it). Structural guard added to count-drift.test.ts forbidding any hand-written TabsTrigger/TabsContent value blocks from ever returning. Gates: typecheck clean, vitest 1,664 / 84, build green; verified in browser (all 77 tabs, Gauge & Fit + Design Ledger panels working).
- [CHK-088] Reviewer MAJOR sweep. S251/S123 (collab deal math) — yarn-support value removed from cash in full-buyout / exclusive-flat / advance-royalty branches; yarn is a cost offset only. 2 regression tests. S182 (podcast affiliate lab) — affiliate cut now weights by conversion rate x episodes per month on the same converted base as affiliate gross. 1 regression test. S160 (channel migration) — added migratedSalesPerMonth input (default 0); delta net = added sales x target net + migrated x per-sale spread − new monthly fee; card gained the new field. 3 regression tests. Fee registry (src/lib/fee-registry.ts) created as single source of truth for marketplace take rates (Etsy, Ravelry, LoveCrafts, Ribblr, Payhip, own site) — killed the Infinity-ceiling trap (commissionActiveFor helper) and ended doc drift S250 (partner-economics comment cites fee registry; club planner PLATFORM_NET_PCT 0.95→0.96 with tests resynced). Gates: typecheck clean, vitest 1,659 / 83, build green.
- [CHK-087] 1d414d5 — Count-drift fix. Measured the actual
  workspace tab count: 77 unique TabsTrigger/TabsContent pairs
  in project-workspace.tsx and 77 TAB_GROUPS entries — the
  inherited "79 tabs" assumption was itself off by two (landing
  said 78, context claimed 79). Landing STATS now 77 labs /
  1,640+ tests; brand-voice-brief.md + archive-digest.md synced
  (record-keeping-gap-map.md left as historical audit note).
  New regression guard count-drift.test.ts pins the landing
  claim to the TAB_GROUPS registry count so the build fails
  before marketing copy ever diverges again. Gates: typecheck
  clean, vitest 1,643 tests / 82 files, build green.

- [CHK-086] 70b1b4d — Design Ledger, the record room
  (79th tab, Business & Community ·23 now).
  Engine design-ledger.ts + card + 17 tests: (1) design
  pipeline tracker Concept→In Progress→Sampled→Published→
  Archived with per-design revenue/sales/cost/profit
  rollup, including automatic attribution of Receipt Lab
  sales by pattern-name match and break-even copies math;
  (2) cost log with 10 expense categories, optional
  per-design link, monthly P&L; (3) studio settings
  (name, 13 currencies); (4) accountant-ready CSV export
  (designs + costs + sales); (5) auth-bridge field
  placeholder 'not signed in yet' — the Neon/Supabase
  seam: when sign-in arrives, testers' account ids link
  local-first data to the cloud copy with no
  re-creation. Bugged out twice and fixed: rollup
  monthly-P&L missing attributed revenue (all sales now
  contribute to monthly rows, refunds subtract, quotes
  excluded), and a draft rehydration double-count in
  receipt analysis (effective-sale guard). Quality:
  typecheck clean, 1,641 tests / 81 files, build green;
  verified live — design added, cost recorded, Receipt
  Lab sale auto-attributed, monthly P&L correct.
  record-keeping (docs/record-keeping-gap-map.md).
  19 sources; found five money-leaking failures: (1) margin
  blindness — a designer made $47k gross / $43k expenses and
  kept $3k; (2) the spreadsheet graveyard — trackers built
  and abandoned everywhere; (3) tax paralysis incl. US
  hobby-loss rule — accountant-ready export needed; (4) the
  wholesale AR nightmare (40 net-30 retailers, $150/mo app
  alternative); (5) sample shrinkage on trunk shows. Bonus:
  2020 Ravelry exodus + dead platforms prove local-first is
  a marketing headline ('your records live on your
  machine'); Craftybase trust objection validates our
  local-first wedge + the costs-vs-market split
  architecture; avg Ravelry designer earns $203 (72% under
  $50) — free tier for the hobby majority, paid for the
  top slice. Verdict: build the Design Ledger.
  report. Issue #51 (S247) fmtMoney EUR/CHF compound key:
  the Intl Pricing Lab's 'Nordics & Switzerland' row was
  rendering bare numbers — now shows e.g. 'EUR9.40 / CHF
  9.40' with both symbols; engine refactored to a shared
  symbolOf() map; 4 new tests. S248 raw-fraction % fix:
  6 labs (Release Timing, Workshop, Bundle, Podcast,
  Magazine, Price Psych) showed fraction values like
  '0.1 %' in percent fields — now '10 %' with min/max
  bounds; engine state unchanged, display converted at the
  field. S249 count drift: landing + docs now say 78 labs.
  Quality: typecheck clean, 1,627 tests / 80 files, build
  green; EUR/CHF row + percent fields verified live.
  Research (session 83): Etsy never issues buyer
  invoices; craft-fair sellers still handwrite receipts
  or keep yellow-highlighted spreadsheets; custom-knit
  sellers run their funnel through Instagram DMs into
  WhatsApp — chat receipts hit ~98% open rate vs ~20%
  email. Competitors (QuickBooks/Wave invoice-scariness,
  Square payments-gating, one-off generators with no
  memory) all miss the knitting niche entirely. Build:
  Receipt Lab: receipt / order-quote / refund-note
  kinds with auto doc numbering (REC-/QUO-/REF-),
  per-item pricing, tax/platform/processing fees,
  shipping and materials cost → per-sale profit math
  (the niche differentiator no generic tool has), a
  chat-sized branded receipt card with Copy/Share,
  Save-as-image and Print/PDF paths, plus a text copy
  for plain-text messengers, a monthly P&L ledger (with
  an effective-sale guard so a rehydrated empty draft
  never double-counts totals), and per-project brand
  settings. STORAGE_KEY stitch-and-scale-receipt-v1,
  projectStorage prefix 'receipt'. +9 engine tests;
  QA issue #52 re-audited while registering the tab
  (76 triggers, 0 unmapped/phantom). Screenshots
  docs/screenshots/receipt-lab-*.webp; research
  research/competitors-session-83-chat-receipt.md.
  Quality: typecheck + vitest (1,623 tests) + build
  green; verified live (REC-001 saved, ledger and
  monthly P&L correct).
  decision: no paid spend until demand proven via the
  early-access list). Landing page rewritten around the
  FOUNDING TESTER ask: hero 'You can knit anything.
  Can you price it?', first-person founder voice per
  docs/brand-voice-brief.md (distilled from David's public
  profile — terminal-poster ambition + outsider wit),
  'Join as a founding tester' cohort CTA (shape the tool
  and its pricing; no fee, no spam), founder attribution
  in footer. docs/founding-tester-posts.md: platform
  drafts (Ravelry, FB groups, IG/X, warm-list/DM) in
  founder voice, demo link + tester link, and the
  'the testers decide the pricing' reply for 'how much?'
  TAB_GROUPS fix: removed 6 phantom entries, explicitly
  classified 20 previously-unmapped tabs (defaulted
  silently to 'business' — wrong for giftcard,
  consignment-reprice, pattern-bundle, etc.). All 75
  triggers now mapped.
  Quality: typecheck + vitest (1,614 tests / 79 files)
  + build green; /landing verified live, 2 screenshots.
- [CHK-080] bf1fb7d — Gauge & Fit Translator tab + tab
  classification + landing page (the first revenue-facing
  surface).
  Gauge & Fit Translator: weakness-conversion from
  stitchscale.app (their single gauge-matching page owns
  the name and has 0 persistence, 0 designer economics).
  Our version ties to the project's real grading table:
  per-test-knitter swatch gauges translate every graded
  size in both directions (stitch ratio for
  circumferences, row ratio for lengths), per-tester
  recommended size, GF-01 severe (>=10%) / GF-02 drift
  (5-10%) flags, optional target-circumference fit check.
  Works even pre-grading with placeholder XS-XL.
  STORAGE_KEY stitch-and-scale-gaugefit-v1, projectStorage
  prefix 'gaugefit'. +15 lib tests.
  QA #50 fixed: the duplicate trigger had killed the Test
  Knit Lab tab; renamed to testknitlab.
  76 workspace tabs now classified into 6 groups
  (design/fit/pricing/launch/channels/business) via
  workspace-tab-groups.ts + clickable legend chips with
  counts; strip order preserved (muscle memory).
  /landing page: hero, capability grid (6 labs), stats
  row, live demo CTA to the real demo project
  (mss5osqd88j6fdyvtdu, no signup), early-access email
  queue (localStorage queue until Supabase wires in),
  onboarding overlay gated off /landing and /project/*
  so cold visitors see marketing, not app onboarding.
  Domain research: stitchandscale.app AVAILABLE (also
  .net/.io, stitchnscale.app, stitchscale.tools); plain
  stitchscale.com is parked/gambling squatter — avoid.
  Quality: typecheck + vitest (1,614 tests / 79 files)
  + build green; 3 screenshots in docs/screenshots.
  classification + landing page (the first revenue-facing
  surface).
  Gauge & Fit Translator: weakness-conversion from
  stitchscale.app (their single gauge-matching page owns
  the name and has 0 persistence, 0 designer economics).
  Our version ties to the project's real grading table:
  per-test-knitter swatch gauges translate every graded
  size in both directions (stitch ratio for
  circumferences, row ratio for lengths), per-tester
  recommended size, GF-01 severe (>=10%) / GF-02 drift
  (5-10%) flags, optional target-circumference fit check.
  Works even pre-grading with placeholder XS-XL.
  STORAGE_KEY stitch-and-scale-gaugefit-v1, projectStorage
  prefix 'gaugefit'. +15 lib tests.
  QA #50 fixed: the duplicate trigger had killed the Test
  Knit Lab tab; renamed to testknitlab.
  76 workspace tabs now classified into 6 groups
  (design/fit/pricing/launch/channels/business) via
  workspace-tab-groups.ts + clickable legend chips with
  counts; strip order preserved (muscle memory).
  /landing page: hero, capability grid (6 labs), stats
  row, live demo CTA to the real demo project
  (mss5osqd88j6fdyvtdu, no signup), early-access email
  queue (localStorage queue until Supabase wires in),
  onboarding overlay gated off /landing and /project/*
  so cold visitors see marketing, not app onboarding.
  Domain research: stitchandscale.app AVAILABLE (also
  .net/.io, stitchnscale.app, stitchscale.tools); plain
  stitchscale.com is parked/gambling squatter — avoid.
  Quality: typecheck + vitest (1,614 tests / 79 files)
  + build green; 3 screenshots in docs/screenshots.
  fmtMoney dead-currency display fix: the select already offered
  CHF/BRL/INR/NOK/SEK/DKK/ISK (added in CHK-077) but every number
  on screen still hard-coded '$'. Now: fmtMoney exported and
  covers all 13 select currencies (CHF prefix, R\$, ₹, kr suffix
  NOK/SEK/DKK/ISK, ¥ for JPY/CNY/KRW); the four stat boxes use
  engine-computed formatted fields; the markets table's
  net-now/net-parity columns render each market's own currency
  (+7 fmt fields on IntlPricingResult).
  +19 tests (suite 1,599 / 78 files); typecheck + vitest +
  build green; verified in browser (Nordics row shows
  '9.00 kr', BRL 'R\$ 4.50', INR '₹10.00').
  Screenshot: docs/screenshots/intl-pricing-fmtmoney-fix.webp.
- [CHK-078] 798fed5 — Wholesale Price List Lab (76th tab):
  builds & stress-tests the indie wholesale line sheet for
  LYS/boutique sales — the side of the business nobody
  prices honestly. Keystone discipline (retail ÷ keystone
  floor, COGS×4 ≤ retail gate), order-value discount rungs
  with margin after marketplace fees, per-order admin
  (packaging/freight/invoicing), Net 30 working-capital
  drag, Faire-style 15% + $10 first-customer channel
  economics, minimum-order gate (must net positive after
  admin, not just product), break-even order volume vs
  reality, WL-01..WL-08 watch-out flags, 5-rung verdict
  ladder (wholesale-ready / pricing-fails / min-order /
  terms / thin margins) with quoted playbooks for each.
  Research lens: Faire's commission walls + Etsy Wholesale
  shutdown (2017) → the own line sheet is the durable
  asset; quote marketplaces for discovery, route reorders
  direct at 0% channel.
  +24 lib tests; suite 1,580 tests / 78 files;
  typecheck + vitest + build green. Screenshots:
  docs/screenshots/wholesale-pricelist-lab-{tab,card}.webp.
  Research: research/competitors-session-78-wholesale-
  pricelist.md.
  Note: deferred issue #49 (QA cycle 43, MINOR) — Intl
  Pricing Lab fmtMoney dead currencies (CHF/SEK/NOK/DKK/
  BRL/INR show bare numbers) — display-only fix, parked.
  builds & stress-tests the indie wholesale line sheet for
  LYS/boutique sales — the side of the business nobody
  prices honestly. Keystone discipline (retail ÷ keystone
  floor, COGS×4 ≤ retail gate), order-value discount rungs
  with margin after marketplace fees, per-order admin
  (packaging/freight/invoicing), Net 30 working-capital
  drag, Faire-style 15% + $10 first-customer channel
  economics, minimum-order gate (must net positive after
  admin, not just product), break-even order volume vs
  reality, WL-01..WL-08 watch-out flags, 5-rung verdict
  ladder (wholesale-ready / pricing-fails / min-order /
  terms / thin margins) with quoted playbooks for each.
  Research lens: Faire's commission walls + Etsy Wholesale
  shutdown (2017) → the own line sheet is the durable
  asset; quote marketplaces for discovery, route reorders
  direct at 0% channel.
  +24 lib tests; suite 1,580 tests / 78 files;
  typecheck + vitest + build green. Screenshots:
  docs/screenshots/wholesale-pricelist-lab-{tab,card}.webp.
  Research: research/competitors-session-78-wholesale-
  pricelist.md.
  Note: deferred issue #49 (QA cycle 43, MINOR) — Intl
  Pricing Lab fmtMoney dead currencies (CHF/SEK/NOK/DKK/
  BRL/INR show bare numbers) — display-only fix, parked.
  prices test-knit programs against the free pool's
  hidden costs. Unpaid testing is never free — documented
  ghost rate 15-25% (Yarnpond: testers grab the pattern
  and disappear), size coverage gaps ship unverified
  sizes, and tester-side red flags (mini-deadlines,
  mandatory yarn purchases, fines) repel the best
  knitters. Compensation norms researched: flat cash
  £35-70/pattern (Woolly Wormhead ~£35 with 2 testers),
  per-yard sample rates $0.15-0.30/yd (TenDyke $0.12
  knit / $0.10 crochet), yarn support as the emerging
  norm (free pattern + credit, or whole/partial skeins
  at wholesale discount), tester FO photos add 5-15%
  launch-revenue social-proof lift.
  Test Knit Lab tab: pattern yardage, graded sizes, slots
  per size, test duration (~1wk per 200yd), share of slots
  to pay, flat fee, per-yard rate, yarn cost/skeins,
  wholesale discount, ghost rate, paid retention, your
  management hours + hourly rate, launch baseline +
  social-proof lift, tech-edit score, per-error catch
  value, sample-knitter toggle. Compares 7 models on net
  outcome = proof value + error-catch − cash − yarn −
  your time: free pool, full yarn, wholesale yarn, extra
  pattern copy, flat cash, per-yard sample (+ optional
  sample-knitter row). Stat boxes (free net, best paid
  net, size coverage, errors caught, time cost, paid
  slots), model comparison table with ghost-churned
  slots, verdict ladder, TK-01..TK-08 flags (ghosting,
  underpriced support, paid-tier money-losers, thin
  coverage, time domination).
  Also fixed reviewer issue #48 (QA cycle 42, HIGH): the
  Gift & Credit Lab's State escheat-treatment select was
  dead — math stayed frozen at the 60% default. Wired the
  mode into the engine (full=100%, none=0%, partial uses
  the percent field, mode governs absolutely) and added 3
  escheat-mode tests.
  +23 lib tests; suite 1,556 tests / 77 files;
  typecheck + vitest + build green. Screenshots:
  docs/screenshots/testknit-lab-header.webp +
  testknit-lab-results.webp.
  Research: research/competitors-session-77-testknit-
  economics.md.
  regional PPP pricing tiers vs Ravelry's flat USD — your
  single USD price is an international price everyone sees
  converted. Ravelry audience is 61.6% US / 11.7% rest of
  world with zero tiers; LoveCrafts picks one of GBP/USD/
  EUR and converts; Stripe FX drag ~+1% conversion +1.5%
  cross-border; PayPal 3.5-4% cross-border; parity-priced
  digital sellers report +5-15% revenue uplift. The lab
  prices one pattern across markets with PPP-indexed
  parity tiers (UK £7.75, EU €7, India ₹10), nets out
  platform fees per lane, and quantifies the FX leak.
  Competitor flaw: every major pattern platform ships one
  flat currency and bills you for converting it back —
  the designer carries both the price-out of weak-PPP
  buyers and the FX spread. Parity tiers turn that leak
  into near-pure profit (digital patterns have ~0 marginal
  cost).
  Intl Pricing Lab tab: anchor price, monthly revenue,
  platform fee ladder (Ravelry 5% / Etsy 6.5% /
  LoveCrafts 15% / Gumroad-Payhip 10%), hosting-platform
  picker with tier-capability notes, elasticity 0-1
  (indie-parity midpoint 0.75, documented 0.6-0.8 range),
  coupon-abuse rate, and an editable markets table (PPP
  index, audience share, FX fee, parity price, net now vs
  net parity per market, add/remove rows). Stat boxes
  (revenue now, parity revenue + lift%, annual lift, FX
  leak/mo), verdict ladder from 'Skip — nearly all
  domestic' to 'Enable parity tiers', IP-01..IP-05 flags
  (domestic audience, FX leak, wrong-market anchor,
  undercharging strong-PPP buyers, pricing out
  weak-PPP buyers).
  +25 lib tests; suite 1,530 tests / 76 files;
  typecheck + vitest + build green. Screenshots:
  docs/screenshots/intlpricing-lab-inputs.webp +
  intlpricing-lab-results.webp.
  Also fixed reviewer issue #47 (QA cycle 37, HIGH):
  Podcast Lab tab was a dead tab — the <TabsContent
  value="podcast-affiliate"> mount was dropped by the
  CHK-069 tab insertion. Restored and visually verified;
  podcast mount now renders; screenshot:
  docs/screenshots/podcast-lab-restore-fix.webp.
  gift-card / store-credit program economics — the honest
  accounting: cash-in float vs the liability behind it,
  ASC 606 proportionate breakage recognition (10-19%
  measured breakage), state escheat takes (100% or 60% of
  face value; many states exempt merchandise-only retail
  credits), federal <$10 and California <$15 (Apr 2026)
  small-balance cash-back laws, the refund-credit loop
  that silently eats the float (issue store credit for
  returns = liability with no cash ever arriving), and
  the measured 20-30% spend uplift when redeeming — a real
  revenue line most sellers never count. H&M paid NY $36M
  for holding onto unused card funds it miscounted as
  breakage.
  Competitor flaw: every gift-card vendor markets the
  'free money' float and never prices the cash-back
  liability, escheat surrender, or refund-credit drag —
  sellers see a bright cash dashboard while a liability
  stacks up behind it. Gift & Credit Lab nets the whole
  program on a recognized basis and prints the 'what you
  owe if you closed tomorrow' number.
  Gift & Credit Lab tab: monthly card sales, refund-credit
  issuance, redemption rate / lag / dormancy, escheat mode
  (exempt / 60% / 100%), cash-back threshold, processing
  and admin costs, fee income gating (only where expiry/
  dormancy fees are legal), breakage assumption, view
  horizon; stat boxes (cash collected, expected redemptions
  + uplift, kept breakage vs escheat surrender, ending and
  peak liability, recognized profit + margin, refund-credit
  liability, cash-back payouts, stabilization months),
  GC-01..GC-11 flags (refund loop >30% of float, escheat
  exposure, cash-back law, fee illegality, liability
  stacking, program-loss on recognized basis, expiry-law
  trap, admin burden...), verdict ladder from 'Strong
  program — uplift alone justifies it' to 'Don't launch —
  the refund-credit loop dominates'.
  +22 lib tests; suite 1,527 tests / 76 files;
  typecheck + vitest + build green. Screenshots:
  docs/screenshots/giftcard-lab-default-mode.webp +
  giftcard-lab-refundcredit-mode.webp.
  licensing patterns to yarn companies — flat fee vs royalty
  vs hybrid, priced against the designer's own-shop baseline.
  Session-74 facts (verified Aug 2026): Farm & Fiber Knits
  pays $200-400 for accessories and $400-750 for garments
  with a 1-year exclusive; Knit Picks IDP takes 15% of the
  designer's sale price; Interweave flats $200-600 plus
  20-40% royalties after exclusivity, rights reverting at
  10-12 months; kit royalties run 5-15% of kit price;
  full-category exclusivity ≈ 2× the non-exclusive fee;
  Malabrigo still issues unpaid 'exposure' pattern calls;
  full buyouts are the trend designers now refuse; real
  publisher missed royalty payments (F+W, late 2018) are why
  a brand-size risk haircut belongs in the royalty stream;
  Ravelry's 2019 data: most pattern sellers earn under
  $50/month — the long tail given away for a low flat is
  rarely worth it.
  Competitor flaw: brands anchor to a low flat or a
  headline royalty while hiding the exclusivity drag,
  perpetual terms, no-attribution zero brand lift, and
  copyright buyout grabs — designers have no calculator that
  nets the deal against their own shop's same-window revenue.
  Yarn Licensing Lab tab: brand reach tier (1-5) driving the
  royalty risk haircut, flat + royalty + yarn-goods +
  brand-paid services EV vs time cost + exclusivity drag,
  min flat / min royalty to say yes, baseline years-of-
  earnings, YL-01..YL-09 flags (exposure-only, weak royalty
  stream, perpetual term, full-catalog scoop, buyout grab,
  below-time flat, small-brand royalty bet), verdict ladder
  from 'Skip — below your baseline' to 'Flat + royalty
  hybrid — worth it'.
  +23 lib tests; suite 1,483 tests / 74 files;
  typecheck + vitest + build green. Screenshots:
  docs/screenshots/yarnlicensing-lab-default-mode.webp +
  yarnlicensing-lab-hybrid-mode.webp.
  subscription-box designer-inclusion economics for knitwear
  pattern designers. No tool on the market models the
  designer-side expected value of a box feature.
  Session-73 facts (verified Aug 2026): KnitCrate — the
  biggest US knit box — paid contributing makers a MAX of
  $3/item, demanded ~85% wholesale discounts, and closed
  Nov 2022 owing $1.45M senior + $1.5M junior debt; Hooks &
  Needles ($34.97/box) hires anonymous designers with no
  byline; boxes run $10-$225/mo (avg US box ~$43); churn
  10-12%/mo (well-run <5%); CAC $70-135/subscriber
  (sustainable ≤25-35% of CLTV); gross margin must stay
  ≥40-50% per box (3PL $1.50-4/box); KnitCrate's own value
  sheet priced patterns at $3-5 each.
  Competitor flaw: boxes sell featured-designer slots as
  'exposure' while paying nothing and eating exclusivity
  windows — designers have no way to price the mortality
  risk or the opportunity cost of the lock.
  Box Inclusion Lab tab: box spec + fee + royalty per box +
  exclusivity lock vs designer time cost, self-publish
  baseline, exposure funnel (2-8% signup, 3-10% list-to-sale),
  box-health mortality weighting (subscriber lifetime 5-20
  mo), break-even fee, fair floor fee (6% of retail),
  BI-01..BI-09 flags (exposure-only trap, KnitCrate-floor
  fee, rights assignment, margin death spiral, anonymous
  hire), verdict ladder from 'Skip — exposure-only trap' to
  'Negotiate — fee + royalties'.
  +29 lib tests; suite 1,460 tests / 73 files;
  typecheck + vitest + build green. Screenshots:
  docs/screenshots/boxincl-lab-default-mode.webp +
  boxincl-lab-frail-box-mode.webp.
  fee-take war economics for pattern designers (never
  covered in sessions 1-71). Cleanup commit 1fde947 removed a
  debug scratch file; both pushed (HEAD 1fde947).
  Inbox swept: no new reviewer proposals (all open issues
  remain reviewer-directed QA notes; no open PRs; no
  non-plastic-dude comments).
  Session-72 facts (verified Aug 2026): Etsy $0.20 listing +
  6.5% transaction + 0.21% regulatory + 3% + $0.25 processing
  + Offsite Ads 12-15%; Ravelry 3.5% commission ONLY between
  $30 and $1,500/mo with PayPal-only payouts (2.9% + $0.30);
  LoveCrafts 2% + $0.20 base plus extra 5% between
  $40-$1,500/mo, paid a month in arrears (45-day lag) and has
  culled libraries; Ribblr 4% with a $0.25 floor per sale +
  Stripe 2.9% + $0.30; Payhip free tier 5% + Stripe;
  own-site Stripe-only (2.9% + $0.30) but no discovery.
  Fee history: Etsy 5%->6.5% (2022), Gumroad 3.5%->10%
  (2023).
  Competitor flaw: no tool computes the honest per-sale take
  incl. fixed tolls (a $3.84 pattern on Ribblr pays 6.5%, a
  $1.99 one 12.6%), threshold cliffs (Ravelry commission
  disappears above $1,500/mo), Offsite Ads trap, payout lag
  and delisting exposure — designers choose channels on
  sticker % and get squeezed.
  Take-Rate Lab tab: 6 channels incl. Offsite Ads rate, PayPal
  settings and Ravelry high-tier; per-channel keeps/cent-per
  $, fee-leak leaderboard, threshold alerts, TR-01..TR-11
  watch-outs, concentration verdict (move revenue / too
  dependent / balanced / trim the middle).
  +22 lib tests; suite 1,431 tests / 72 files;
  typecheck + vitest + build green. Screenshots:
  docs/screenshots/takerate-lab-default-mode.webp +
  takerate-lab-median-price-mode.webp.
  physical pattern economics for knitwear designers (never
  covered in sessions 1-70). Cleanup commit 6f71704 removed a
  scratch file; both pushed (HEAD 6f71704).
  Inbox swept: no new reviewer proposals (13 open issues
  remain reviewer-directed INFO notes; no open PRs; no
  non-plastic-dude comments).
  Session-71 facts: KDP B&W print cost is a flat $2.30/copy
  for 24-110 pages (+$0.012/page above); hardcover base
  $5.65; color ink $0.065/page; 60% royalty band at $9.99+
  list (50% below); paperback minimum 24 pages across KDP,
  IngramSpark, Lulu; IngramSpark ~55% wholesale discount
  leaves ~list × 5% for direct sales vs Lulu direct ~20% cut;
  Etsy ≈ 11% blended fees plus self-ship labor (15-25
  min/copy); documented case of a designer's KDP account
  closed for pattern books misread as knitted items.
  Competitor flaw: no tool prices a POD booklet spec against
  a designer's digital PDF baseline — page-count math, the
  60% band floor, the channel commission trap (IngramSpark
  direct vs Lulu direct), and the cannibalization drag.
  POD Patterns Lab tab: print cost, net/copy, cannibal drag,
  monthly net, break-even units, physical-vs-digital ratio,
  5 channels (KDP amazon/expanded, IngramSpark, Lulu, Etsy
  self-ship), color/hardcover, min-list (60% band), and the
  hybrid-color fix (color cover + B&W charts).
  PD-01..PD-09 flags (below 24-page minimum, color blowout,
  physical earns less than PDF, IngramSpark trap, below
  break-even, ratio too low/high, metadata-ban risk, self-
  ship labor). Verdict ladder: do not print → below
  break-even → switch channels → hybrid color → worth
  printing → marginal.
  +29 lib tests; suite 1,409 tests / 71 files;
  typecheck + vitest + build green. Screenshots:
  docs/screenshots/pod-lab-default-mode.webp +
  pod-lab-color-mode.webp.
  Inbox swept: no new reviewer proposals (13 open issues
  remain reviewer-directed INFO notes; no open PRs; no
  non-plastic-dude comments).
  Research angle: pattern pricing psychology for knitwear
  designers (never covered in sessions 1-69) —
  session-70 facts: Sori & Widjaja (2013) field experiment
  — identical garments re-priced with nine-endings ($34/$39)
  outsold rounded prices by ~8% at ZERO discount; Schindler
  & Kibarian — nine-ending apparel prices lifted demand
  10-30% vs rounded equivalents in catalog trials; Buynomics
  evidence — the effect FLIPS at higher price points where
  .99 endings damage perceived quality ($59.95 > $59.99);
  Wilkie/Manning/Sprott (2015) — even prices read premium,
  odd prices read bargain, buyer motivation decides;
  Lynn/Flynn/Helion (2013) — 0/5 endings process easier
  and signal quality; Baumgartner & Hahnchen (2016) —
  bundles sell best with even component prices and an odd
  bundle total; anchoring — the highest first price sets
  the reference for everything below it.
  Competitor flaw: PriceWin and pricing tools optimize the
  price LEVEL, but no tool models the price PSYCHOLOGY for
  the pattern market — the left-digit effect, the
  charm-vs-premium flip, decoy placement inside a designer's
  own shop, and the bundle-endings rule.
  Price Psychology Lab in a new tab: current vs candidate
  price with left-digit barrier crossing (+3%/digit lift),
  ending-effect modifiers (8-12% charm lift low price,
  3% mainstream mid, -4% premium drag), tier positioning
  (bargain/mainstream/premium), shop-tier anchor/decoy
  analysis, bundle singles-vs-bundle net with the
  even-components/odd-total rule, recommended ending, and
  barriers above/below.
  PP-01..PP-09 flags (price on a left-digit barrier,
  premium design with bargain ending, price below
  floor-tier anchor, inconsistent endings across tiers,
  bundle total not ending odd, components not ending even,
  charm drag above the flip price, candidate inside 20% of
  another tier, no volume entered).
  Verdict ladder: cross-the-barrier / raise the volume /
  costs-you-money (candidate < 0.97x no-lift baseline) /
  marginal / keep-the-price.
  +30 lib tests; suite 1,380 tests / 70 files;
  typecheck + vitest + build green. Screenshots:
  docs/screenshots/price-psych-lab-default-mode.webp +
  price-psych-lab-premium-mode.webp.
  Inbox swept: no new reviewer proposals (13 open issues
  remain reviewer-directed INFO notes; no open PRs; no
  non-plastic-dude comments).
  Research angle: magazine submission fee/rate economics for
  knitwear designers (never covered in sessions 1-68) —
  session-69 facts: Knitty pays $250-350 with ~3-month
  exclusivity (Knitty submission guidelines, Sandi Rosner
  commissioned-vs-independent piece); Making Stories
  EUR100-550 with 4-month exclusivity; Laine pays on
  completion with a 5-month window; Who Pays Knitters
  survey average $246 flat fee (range $40-700); designers
  have been paid as little as $30 to lease a design;
  exclusivity windows run 3-12 months; kill-fee protection
  sits at ~50% of the contracted fee; 3-10% royalties on
  print revenue are common where magazines offer royalty
  deals at all.
  Competitor flaw: no tool compares a magazine deal
  structure (flat / royalty / fee+royalty / lease /
  outright sale) against the designer's own self-publish
  baseline including the lock-up opportunity cost, coverage
  value (tech edit, photography, test knit, yarn), payment
  lag, and the post-window prestige uplift.
  Magazine Submission Lab in a new tab: five deal models
  including royalty stream (copies printed, sell-through,
  royalty rate, revenue per copy, digital/archive royalty),
  publisher coverage absorbed, lock-up opportunity cost
  (foregone self-sales during window + payment-lag erosion),
  post-window prestige uplift, deal net vs self-publishing,
  effective $/hr, royalty break-even copies; MS-01..MS-09
  flags (below-band fee, royalty below flat-fee equivalent,
  no copy floor, kill fee below 50% norm, window above
  12 months, underpriced outright sale, payment lag above
  6 months, uncovered tech edit/photography, zero prestige
  on short windows), verdict ladder (decline / weak deal /
  fair deal / strong deal).
  +27 lib tests; suite 1,350 tests / 69 files;
  typecheck + vitest + build green. Screenshots:
  docs/screenshots/magazine-lab-flat-mode.webp +
  magazine-lab-royalty-mode.webp.
  Inbox swept: no new reviewer proposals (13 open issues
  remain reviewer-directed INFO notes; no open PRs; no
  non-plastic-dude comments).
  Research angle: podcast sponsorship & affiliate
  marketing economics for knitwear designers (never covered
  in sessions 1-67) — session-68 facts: industry CPM
  standards $18 for 30-sec pre-roll / $25 for 60-sec
  mid-roll (Buzzsprout), host-read mid-rolls at niche
  fiber-arts shows trade $25-50 (craft audience is a
  targeting premium); LoveCrafts affiliate 15-30%, Knit
  Picks and Crochet.com 10%; network cuts ~30%, marketplaces
  10-20% (Podcorn 10%, Gumball 20%); CPM pitches not worth
  it below ~200 downloads/episode and CPM deals only work
  from ~5,000 downloads/episode; keep ad reads 30-60s and
  under ~10% of episode length (Buzzsprout sponsor guides,
  Knitgrammer affiliate roundup, Podcorn/Gumball listings).
  Competitor flaw: no tool models the CPM/CPA math for a
  fiber-arts podcast sponsorship or the affiliate
  commission economics of yarn/pattern links.
  Podcast & Affiliate Lab in a new tab: downloads per
  episode, episode cadence, production hours vs opportunity
  rate, setup + recurring costs; three lanes modeled side
  by side — CPM sponsorship (quoted CPM, slots, network
  cut, fill rate), flat-fee reads, and multiple affiliate
  programs (commission, clicks, conversion, AOV, platform
  cut) — each with gross/net monthly, hours, effective
  $/hr; CPM benchmark band $18-50, fair flat-fee equivalent
  re-quote, CPM break-even audience (scales with hourly
  rate and production hours); PA-01..PA-09 flags (tiny
  audience, below-band CPM, underpriced flat fee, low
  conversion, low commission vs top programs, excessive
  network cut, underpaid show hours, nothing monetized,
  ad-load above 10% norm), verdict ladder (audience is an
  asset / growing / small-audience affiliate-only / monetize
  at all / show costs you money).
  +29 lib tests; suite 1,323 tests / 68 files;
  typecheck + vitest + build green. Screenshots:
  docs/screenshots/podcast-lab-default-mode.webp +
  podcast-lab-large-audience-mode.webp.
  Inbox swept: no new reviewer proposals (11 open
  issues remain reviewer-directed INFO notes; QA cycles
  32/33 copy/consistency INFO; no open PRs).
  Research angle: retreat & cruise teaching economics
  (distinct from session 35 online teaching and session 64
  festival/LYS workshops) — session-67 facts: top-of-market
  guest rate is $125/class-hr plus travel and lodging, and
  even that still nets only $25-30/hr once the 5-40 hrs of
  class development per class is priced in; host retreats
  price to a $100/person/day profit floor against minimum
  attendance; market tuition runs $235 weekend-with-meals
  to $1,075 tuition-only 3-day to $2,999 all-inclusive
  destination formats; shop/class pay norms $25-60/hr; LYS
  typically reimburse teachers within a ~1.5-hr radius,
  beyond that travel is on the teacher (Abby's Yarns,
  Yarn Harlot, wanderlustentrepreneur, Reddit r/knitting
  shop-pay threads, Knit & Crochet Guild Retreats).
  Retreat & Cruise Teaching Lab in a new tab: pick guest /
  cruise-featured / host role, trip length, minimum cancel
  line vs realistic vs best-case attendance, opportunity
  rate, travel + prep + extra working hours, per-class
  contact and development hours; guest side models cash
  fee vs comp package vs the $125 benchmark with travel
  reimbursement, cruise-design pattern sales and alumni
  conversion value priced in; host side models tuition,
  materials fee vs cost, variable per-student cost and
  fixed costs with break-even/target attendance and
  three-scenario net cash + effective $/hr; RT-01..RT-09
  flags (underpaid dev, below-benchmark fee, exposure
  comp, travel unreimbursed, break-even above minimum,
  low daily floor, thin attendance, dev-hour overload,
  cancellation unpriced), verdict ladder (walk away / not
  worth it / host-only if they cover travel / take it as
  marketing / worth it — sign the dates).
  +32 lib tests; suite 1,294 tests / 67 files;
  typecheck + vitest + build green. Screenshots:
  docs/screenshots/retreat-lab-guest-mode.webp +
  retreat-lab-host-mode.webp.
  Inbox swept: no new reviewer proposals (11 open
  issues remain reviewer-directed INFO notes; QA cycles
  32/33 branches copy/consistency INFO; no open PRs).
  Research angle: designer-run multi-designer pattern
  bundle launch economics (distinct from session 27's
  yarn-company bundles) — session-66 facts: a $25 bundle
  at 200 sales is $5,000 gross — the fastest revenue spike
  a long-tail designer gets (top-10% designers clear
  ~$201/mo per mediaperuana top-10 benchmark); bundle hosts
  charge 10-25% commissions (median ~20%) with opaque
  per-designer splits; the deal norm is 40-60% off the sum
  of standalone prices; weighted-by-price splits are the
  market norm vs equal splits; bundle launches stack every
  designer's email list and the first-year value of a new
  lead is ~$2.50/lead; bundles that discount without adding
  volume lose every designer money; sources gosadi.com
  where-to-sell-knitting-patterns, mediaperuana.com/blog1
  /designerincome, facebook Stranded Knits group
  7401281806589696, help.ravelry.com bundle search.
  Pattern Bundle Lab in a new tab: add/remove your patterns
  (price + realistic solo sales per month each), bundle
  price, host commission vs the 10-25% norm, weighted vs
  equal split modes, launch window, worst/realistic/best
  sales scenarios with your share %, gross, net (promo
  labor and lead value priced in), solo-window baseline,
  gain/loss per scenario, effective $/hr, discount depth vs
  the 40-60% norm, break-even and host-floor sales, email
  capture value, PB-01..PB-08 flags (shallow discount,
  deep discount, host commission above band, below-floor
  launch, underpaid promo labor, heavy promo load,
  small-audience risk, floor demand miss), verdict ladder
  (skip/re-negotiate/host-carry/host it/teach it).
  +24 lib tests; suite 1,268 tests / 66 files;
  typecheck + vitest + build green. Screenshot:
  docs/screenshots/pattern-bundle-lab.webp.
  Inbox swept: no new reviewer proposals (11 open
  issues remain reviewer-directed INFO notes; QA cycle
  32 branch copy/consistency INFO; no open PRs).
  Research angle: LYS consignment re-pricing & shelf-life
  economics for print leaflets/patterns (session 18 covered
  consignment kits, not re-pricing) — session-65 facts:
  Ravelry In-Store covers 2,300+ yarn shops, 60/40
  designer/shop split with the shop keeping a flat $1.00 at
  retail $2.49 or below, monthly PayPal invoicing;
  TNNA keystone puts retail at 2x designer wholesale cost;
  hand-dyer wholesale is ~50% of retail and consignment
  shops take 40-60% of the retail; destash buyers expect
  ~50% off but accept 65-70% for current stock; buyers
  read deep markdowns (<50% retail) as 'clearing out' and
  will wait; sources ravelry.com/wiki/pages/InStoreSales,
  blog.ravelry.com, smallbusiness.chron.com, reddit
  r/dyeing 6f9b72, r/Yarn 1som5oq, woollywormhead.com/
  wholesale.
  Consignment Re-Price Lab in a new tab: channel net table
  (Ravelry In-Store 60/40, direct consignment 45/55,
  own shop/online 97/3) at the current retail, net per
  unit now, months-of-stock and dead-stock sunk print
  cost, a 6-step re-price ladder (hold, 15/30/45% off,
  50% destash floor, pull-back-to-online discount) each
  with net/unit, months-to-clear and total net on current
  stock, best-step highlight, season-band drag, CR-01..
  CR-08 flags (low-margin split, negative net, dead stock,
  deep-stock over 6 months, destash-read markdown, below
  floor, heavy re-price labor, seasonal miss), verdict.
  +27 lib tests; suite 1,244 tests / 65 files;
  typecheck + vitest + build green. Screenshot:
  docs/screenshots/consignment-reprice-lab.webp.
  Inbox swept: no new reviewer proposals (10 open
  issues remain reviewer-directed INFO notes; QA cycle
  30/31 branches are copy/consistency INFO; no open PRs).
  Research angle: live in-person workshop & teaching pay
  economics at fiber festivals and LYS events (never
  covered — prior teaching work was online courses only)
  — session-64 facts: KY Sheep & Fiber pays teachers
  $45/student half-day and $90/student full-day; the
  pre-2017 Interweave standard was a per-hour guarantee
  ($50/75/100) plus a $250/day stipend; post-#FairFiber-
  Wage the norm is per-student pay with NO floor and the
  teacher funding own travel; hotel rooms at venues run
  $170+/night; LYS classes run $25-60 with teachers
  keeping 50-80% of tickets; worst cases at minimum
  enrollment can literally lose money; prep runs 2-4x the
  class hours; attendee pattern attach is typically 10-30%.
  Workshop Teaching Lab in a new tab: deal inputs (fee
  per student, venue cut, guarantee floor, travel,
  materials), min/realistic/max enrollment scenarios
  (gross tickets, deal net, pattern attach, total value,
  effective $/hr), break-even students and students-to-
  clear-your-rate thresholds, travel-burden share,
  opportunity-gap vs hours at your rate, WT-01..WT-08
  flags (below-min enrollment, underpaid hourly, travel
  >40%, no attach modeled, overlarge class, cut above
  market, no floor, worst-case negative), verdict ladder
  (decline as written / hold travel money / teach for
  audience / borderline / worth teaching / great deal).
  +25 lib tests; suite 1,217 tests / 64 files;
  typecheck + vitest + build green. Screenshot:
  docs/screenshots/workshop-teaching-lab.webp.
  Inbox swept: no new reviewer proposals (9 open
  issues remain reviewer-directed INFO notes; QA cycle
  29 items are copy/consistency INFO; no open PRs).
  Research angle: pattern release-timing & seasonal
  demand economics (never covered) — session-63 facts:
  Oct-Dec holiday push peaks ~+40% demand, spring surge
  Jan-Mar (+10-20%), Jun-Aug is the lull (-15-25%),
  knitters shift to fall in August; designers plan
  backward with 3-4 months of lead time minimum; launch
  promo consensus is <=15% off, <=1 week, always include
  a weekend; same-week competitor drops cut exposure
  ~20%.
  Release Timing Lab in a new tab: month-by-month window
  scoring (season band x category affinity x competing-
  drop drag), backward-planning lead-time pricing, best
  launch month with rank, 12-mo revenue at best window
  vs as-soon-as-ready, mistiming cost, promo break-even
  (promo net vs full-price net + promo adds revenue?),
  RT-01..RT-08 flags (window straddles swing, long lead,
  deep discount, weekend miss, competitor week, sunk
  hours reminder, on-schedule confirmation, unreachable
  gifting window), verdict ladder (release as soon as
  ready / hold for window / ship when ready / no clear
  edge / season gone ship-now-or-hold).
  +29 lib tests; suite 1,192 tests / 63 files;
  typecheck + vitest + build green. Screenshot:
  docs/screenshots/release-timing-lab.webp.
  Inbox swept: no new reviewer proposals (8 open
  issues remain reviewer-directed INFO notes; no
  open PRs).
  Research angle: multi-channel listing & migration
  economics (never covered) — session-62 facts: Etsy
  fee stack 6.5% transaction + 3% + $0.25 processing +
  $0.20 listing every 4 months + ~1.5% regulatory fee;
  Ravelry 3.5% + $0.30 + 2.9%; LoveCrafts 2% + $0.20;
  own site (Payhip/Stripe) ~2.9% + $0.30, highest net
  at scale and the only channel owning the customer
  email list; Pattern by Etsy 6.5% + processing; Etsy
  renewals drain $0.60/yr per unsold listing; audiences
  on Etsy vs Ravelry barely overlap, so copying beats
  migrating in most cases.
  Channel Lab in a new tab: per-sale net and fee share
  across 5 channels, listing-renewal drag, relisting
  hours priced at opportunity rate, added-sales payback
  (monthly delta, payback months, year-one delta),
  CM-01..CM-08 flags (pure migration, Etsy renewal drag,
  >1yr payback, zero-review target, >$1 price spread,
  high ads share, own-site opportunity, bloated hours),
  verdict ladder (stay put / migrate-if-audience-follows /
  batch later / marginal / copy it). Target is picked as
  the best alternative channel by net per sale.
  32 new lib tests; suite 1,163 tests / 62 files;
  typecheck + vitest + build green. Screenshot:
  docs/screenshots/channel-migration-lab.webp.
  Inbox swept: no new reviewer proposals (7 open
  issues remain reviewer-directed INFO notes;
  remote also carried QA cycle 28 fixes #41 by the
  other staff — intro spacing, Verdict label, % units).
  Research angle: convention/vendor booth ROI
  (never covered) — session-61 facts: table fees run
  $200-1,500 plus application, travel, display costs;
  per-vendor conversion averages 1-2% of show
  footfall; traffic heuristics ~300 (local), ~2,000
  (regional), ~10,000 (national) shoppers/day; the
  classic 7x rule (sales >= 7x booth fee) and
  vendor earnings benchmarks ~$200-1,000/day at craft
  fairs, with inventory overproduction the top loss.
  Booth Lab in a new tab: traffic x conversion x days
  across worst/realistic/best, fixed-cost stack,
  inventory hours priced at opportunity rate, blended
  product mix editor (add/remove lines), email-list
  long-tail EV (captures x follow-up conv x 55% of
  ticket), break-even units/customers, 7x multiple,
  CB-01..CB-06 flags (no traffic, negative net, <7x,
  inventory sellout, hours underpay, no email capture),
  verdict ladder (skip-best-losses / skip-realistic /
  borderline-hours / below-7x / run-it).
  24 new lib tests; suite 1,131 tests; typecheck +
  vitest + build green. Screenshot:
  docs/screenshots/convention-booth-lab.webp.
  Inbox swept: no new reviewer proposals (7 open
  issues remain reviewer-directed INFO notes; newest
  is QA #27 issue #40; issue #4 closed previously).
  Research angle: membership pattern site / paywall
  economics (never covered) — session-60 facts: no
  tool answers pre-launch membership questions;
  median free-to-paid newsletter conversion is just
  0.62%, freemium 3-5% is good and 6-8% great,
  structured paid communities hit 5-12% (8% sweet
  spot) only with onboarding; avg monthly churn 5.3%
  (LTV = ARPU/churn; $7/mo at 5% churn = $140/member);
  real clubs charge $7-17/mo (Double The Stitches
  $7, Twin Stitches $17CAD with weekly Zooms);
  fee stacks: Payhip free 5%+PayPal 3.49%+$0.49,
  Payhip Plus $29/mo 2%+card, Wix/Stripe 2.9%+$0.30,
  Patreon 8%, Ravelry gift codes 3.5%+PayPal; per-
  transaction fees hit $7 plans hardest.
  Membership Site Lab in a new tab: conversion band
  (worst/realistic/best), blended monthly/annual
  pricing with annual-share, churn-capped LTV, real
  fee-stack select, break-even audience, content-
  treadmill vs opportunity-cost inequality, scenario
  table (members/gross/fees/net/LTV), MS-01..MS-07
  flags (audience too small, rosy conversion,
  churn erodes LTV, fees>10%, treadmill underpays,
  steep annual discount, missing support hours),
  verdict ladder (not ready / pays less than hours /
  borderline / treadmill bites / fund the club).
  21 new lib tests; suite 1,107 tests; typecheck +
  vitest + build green. Screenshot:
  docs/screenshots/membership-site-lab.webp.
  Inbox swept: no new reviewer proposals (all open
  issues remain reviewer-directed INFO notes; issue #4
  already closed with evidence in CHK-058).
  Research angle: yarn collective buying economics
  (never covered) — session-59 facts: every tool says
  'buy wholesale' but none answers what to order or
  whether locked cash is worth it; mills want 10-50
  kg/colorway vs an indie's 2-5 kg; dealer wholesale
  floors run ~$250 order value; bulk programs need ~1
  kg minimum; buying 2.5 kg at mill-direct $24/kg is
  impossible without pooling — MOQ amortization is the
  whole game; cash locked in yarn can't pay
  test-knitters next month; dye lots mean one order per
  colorway, never split.
  Yarn Pool Lab in a new tab: demand pooling across
  patterns and pool members (up to 8), retail-to-mill
  price ladder per colorway (retail/retail-bulk/
  wholesale dealer/mill-direct), per-colorway MOQ
  amortization (20 kg/colorway mill MOQ default,
  $250 dealer minimum), cash-locked months vs
  production runway, YP-01..YP-07 flags (near-MOQ,
  cash lock-up vs runway, retail-only, dye-lot order,
  stash offset, members over-ask), verdict ladder
  (nothing/pool-too-small/pool-it/mill-it). 21 new
  lib tests; suite 1,086 tests; typecheck + vitest +
  build green. Screenshot:
  docs/screenshots/yarn-pool-lab.webp.
  Inbox swept: no new reviewer proposals; the standing
  reviewer proposal in issue #4 was actioned as the debt
  fix (see below).
  Debt (issue #4): trunk-show and translation-bundle cards
  migrated off bare flat keys onto the projectStorage seam;
  pattern-club planner (S036) now persists via the seam;
  storage-lib gained a partitioned-legacy migration variant
  (projectId-map blobs folded per-project into scoped keys)
  with its own tests. All six legacy islands now migrated.
  Research angle: listing A/B testing & conversion economics
  (never covered) — session-58 facts: competitor tools
  (Alura etc.) assume ~30k visitors/variant, impossible for
  a single pattern listing; none answers whether the
  rewrite pays. Evan Miller's normal-approximation formula
  gives required sample (2%->3% needs ~3,825/variant at
  alpha 0.05/power 0.8); only ~6x conversion improvements
  are detectable at low traffic; Etsy conversion avg 1-3%
  with +23% organic ranking within 60 days for systematic
  converters; platform fees differ (Ravelry 0% commission,
  Etsy ~$5.10/$6, LoveCrafts 25%, Payhip 5%); one variable
  per test, run >=1 full month; Ravelry 13 tags + attributes
  drive discovery. Listing Test Lab in a new tab: listing
  queue ranked by EV/re-list-hour, test designer (platform,
  views, conversion, price, variable, lift hypothesis,
  effort hours, rate, duration, uplift horizon, multi-var
  toggle, tags completeness), results grid (required sample,
  months to power, smallest provable lift, net per sale,
  baseline/uplift net, break-even, peeking-penalized EV),
  LT-01..LT-06 flags, verdict ladder (rewire / fix the
  test / test it). 25 new lib tests; suite 1065 tests;
  typecheck + vitest + build green. Screenshot:
  docs/screenshots/listing-test-lab.webp.
  Inbox swept: QA cycles 21-24 PASS with no delegation;
  no new reviewer proposals in open issues (#11-#16 remain
  reviewer-directed INFO notes; #25/#26 already fixed at
  HEAD by CHK-038).
  Research angle: pre-order campaign economics (never
  covered) — session-57 facts: pre-orders convert demand
  into production capital (sell then make) and remove the
  dead-stock risk that kills small clothing brands; the
  all-or-nothing threshold formula (fixed costs + predicted
  units x safe cost basis, then / net price) makes the
  campaign a legally clean conditional sale; first-campaign
  discipline sets the bar at 60-70% of predicted sales;
  early-bird gap of 15-25% minimum (+30-50% conversion);
  21-35 day sweet spot (under 14 no word-of-mouth runway,
  past 45 conversion drops ~40%); charge-later/deposit
  models carry 43.8% of listings (5.4% average
  cancellation); fulfillment-hour overwhelm is the top
  documented drop failure; small-run knitwear $35-85/unit
  at 50-100 MOQ — the pre-order funds the $8-10k run;
  10-15% buffer units for press and the in-stock bridge.
  Pre-Order Campaign Lab in a new workspace tab: campaign
  setup (prices, early-bird share, platform fee, campaign
  days, lead time, charge model), cost basis (materials,
  knit hours, labor rate, fixed series costs, fulfillment
  hours, shipping, safety margin, buffer), demand basis
  (email list, waitlist, social), threshold with coverage
  badge; results grid with predicted orders by source,
  net revenue, safe cost/unit, profit, margin, hours, and
  $/production-hour; PC-01..PC-07 flags; demand-first
  verdict ladder (skip -> borderline -> don't fund ->
  fund -> underpays); storage seam
  projectStorage<PreorderCampaignInput>('preorder',
  ...). 23 new lib tests; suite 1037 tests; typecheck +
  vitest + build green. Screenshot:
  docs/screenshots/preorder-campaign-lab.webp.
  Inbox swept: QA cycles 21-24 PASS with no delegation;
  issues #23/#24 closed with counter-evidence — both were
  already fixed at HEAD by CHK-038 (7939fa0).
  Research angle: wholesale line-sheet & minimum-order
  economics (never covered) — session-56 facts: keystone
  wholesale = 2x COGS (COGS = (materials + labor) x 1.1-1.15
  overhead); processing/order (packing, invoicing, insurance)
  must stay under 10% of order value; the $200 first-order
  minimum is the market's standard test case; Faire charges
  15% on introduced orders; for makers with under ~200
  stockists the line sheet is the entire sales pitch; the
  common mistakes: no minimum order, no repeat minimum,
  discounting below keystone, net terms without deposits.
  Wholesale Program Lab in a new workspace tab: editable
  3-SKU line with COGS, keystone, under-keystone badges and
  margin-per-hour; order economics (net/order, processing
  share, suggested minimum, net/stockist/yr); annual net
  after COGS capped by reorder-driven demand inside the
  knit-hour budget; a per-wholesale-hour ladder against the
  $30/hr floor with a direct-retail reference; WL-01..WL-08
  flags. 27 new lib tests; suite 1014 tests; typecheck +
  vitest + build green. Screenshot:
  docs/screenshots/wholesale-lab.webp.
  Inbox swept: QA cycles 21-24 all PASS with no reviewer
  delegation; issues #23/#24 open but untouched by the
  reviewer — unactionable per the reviewer-first rule.
  Research angle: in-person show & market-event economics
  (never covered) — session-55 facts: booth fees cluster in
  four tiers (pop-ups $25-75 under 500 people, standard
  $75-300 with 500-2,000, featured/juried $300-700 with
  2,000-5,000, premium expos $700-2,000+ with 5,000-25,000);
  the craft-circles 7x rule ($200 fee -> $1,400 target);
  conversion 1-3% browse, 3-8% high-intent; hidden costs
  (application, $1M liability insurance, canopy, permits,
  power) add 20-30% over the headline fee; hand-knit
  commodity hats cap at ~2-3x the $15-20 retail equivalent,
  pro knitting prices per yard ($0.10-0.20), not per hour;
  card processing 2.75% (Square) is a real margin leak.
  Show ROI Lab in a new workspace tab: four booth tiers with
  documented defaults, attendance x conversion x avg-ticket
  funnel capped at units brought, full cost stack, net per
  show-hour, follow-up list value, and the killer comparison
  — knit the same hours at home vs the booth fee and the
  commute. SH-01..SH-08 flags (hidden-cost burn, low-ticket
  without list capture, below-floor conversion, premium tier
  caution, hand-knit pricing ceiling, zero list capture,
  inventory-vs-hours mismatch, premium-fee/low-traffic
  mismatch), five verdict branches, per-product breakdown.
  Inputs persist via the projectStorage seam. 22 new lib
  tests; suite 987 tests; typecheck + vitest + build green.
  Screenshot: docs/screenshots/show-roi-lab.webp.
- [CHK-054] d2e8062 — Video & Social ROI Lab (52nd feature).
  Inbox swept: reviewer issues #36, #37, #38 closed with
  counter-evidence (all already fixed at HEAD or standing
  design decisions); no new actionable proposals.
  Research angle: organic video & social economics (never
  covered) — session-54 facts: video/social drives ~30% of
  fashion e-commerce discovery; shoppable video converts
  2-4% vs 1-2% static; <60s clips outperform (TikTok under
  10s averages ~19k views); message in first 3 seconds lifts
  breakthrough +13%; ~26s is IG's engagement sweet spot;
  decay curves diverge hard — IG nearly all value within a
  week, TikTok slow-burn ~7 days, Pinterest barely 1% in
  week one and evergreen for months; email/DM-adjacent
  audiences buy patterns first and convert at ~12% click-rate;
  4-7% engagement benchmark, 3-4 posts/week not more.
  Video & Social ROI Lab in a new workspace tab: five
  channels (IG Reels/TikTok/Pinterest/YouTube Shorts/email
  list) with documented decay curves, views-per-follower
  brackets, click-rate and conversion funnels to attributable
  monthly sales, net-per-content-hour ranking (email list
  flagged as best earner), VS-01..VS-07 quality flags
  (burnout volume, >60s underconversion, missing 3s hook,
  dead-end posts, 2h/post creep, list out-earning check,
  missing CTA ~15% conversion cost), plus verdict and
  batching suggestion. Inputs persist via the projectStorage
  seam. 23 new lib tests; suite 965 tests; typecheck +
  vitest + build green. Screenshot:
  docs/screenshots/video-social-lab.webp.
- [CHK-053] 746a93f — Issue #39 fix + Pattern Photo ROI Lab
  (51st feature). Inbox swept at 2d42899: new reviewer issue
  #39 forwarded by the reviewer — Platform Compare minutes-royalty
  defaults made the pool row 37.5x unrealistic ($5M pool x
  0.005 = $7,500/mo vs ~$200/mo Skillshare average). Fixed:
  defaults pinned to the documented average ($8M pool x 0.00013
  ≈ $312/mo) and engine now raises P-11 when the monthly
  projection exceeds 2x the ~$200/mo average. Test updated.
  Research angle: pattern photography economics (never covered) —
  session-53 facts: WKW true cost ~£130/pattern with 49 full-price
  copies to break even; DIY ~2.5h/pattern (shoot + editing); gear
  stack £1,500+ never stops depreciating; pro rates $25-100/hr
  amateur, $200-500/hr experienced, $5-10k/day top tier; per-image
  tiered pricing most common; half-day lifestyle batches beat
  day rates; hands/props/retouch add ~2x per image; Ravelry first
  photo is the search thumbnail; Etsy's top earners name
  photography their #1 driver.
  Photo ROI Lab in a new workspace tab: three shoot options (DIY
  time+gear+model, per-image catalog, half-day lifestyle) with
  break-even copies at the designer's net price, cash/time split,
  PR-01-PR-08 clause flags (oversized DIY blocks, gear amortization,
  suspicious low quotes, image-count bloat, batching), and
  thumbnail-CTR-lift revenue over a configurable runway. Engine
  bug-fix: half-day rate divides across the actual batch size,
  not shoot capacity. Inputs persist via the projectStorage seam.
  13 new lib tests; suite 942 tests; typecheck + vitest + build
  green. Screenshot: docs/screenshots/photo-roi-lab.webp.
- [CHK-052] 86c72d6 — Inbox sweep + Collab Deal Math
  (50th feature). Inbox swept at 69b99c4: nothing new actionable
  (all prior fixes already at HEAD; no new issues/PRs).
  Research angle: yarn-company collab contract economics (never
  covered) — session-52 facts: WPK accessory-pattern rates
  $40-700 (avg $246); sample knitting $0.25/yard; pro photography
  $150-200/hr; Vogue paid $500 flat; the three rights structures
  brands use: full buyout / flat-fee exclusivity (6-12mo) /
  advance + royalty, plus yarn-support-only; 72% of designers
  earn at most $50 in their best Ravelry month (census lens).
  Collab Deal Math in a new workspace tab: prices the three rights
  structures (+yarn-support-only) against the designer's own
  channel and hourly floor; full-buyout perpetuity lockout math
  (exclusivity + tail absorbed); DM-01-DM-04 clause flags
  (perpetuity, sole-recommended-yarn, exclusivity lockout,
  underpaid yarn-support); best-structure ranking; paste-ready
  counter-offer letter with copy button. Yarn support treated as
  cost offset, never revenue. Inputs persist via the projectStorage
  seam. 19 new lib tests; suite 929 tests; typecheck + vitest +
  build green. Screenshot: docs/screenshots/collab-deal-math.webp.
- [CHK-051] 3a10108 — Inbox sweep + Sample & Launch Window Lab
  (49th feature). Inbox swept at 3a9e677: three new issues #36-#38.
  #36 (distribution share span overflow on narrow widths) fixed by
  dropping shrink-0 so the span truncates gracefully. #38 (Listing
  SEO footnote wording vs rounded live tiles) fixed by aligning the
  disclosure to the rounded numbers actually shown. #37 (declining
  tab-strip change) is a standing design decision, not a defect —
  triage comment posted, closed. All three closed.
  Research angle: sample & launch-window economics (never covered)
  — session-51 facts: a sweater sample is the largest single cost
  block of a pattern (~30 knit hours + $75 yarn = ~$525 at $15/hr);
  boutique consignment takes ~40% (30-50% band); craft-fair booth
  $60-350/day amortized; Westknits-style flash drops ~10% cut with
  demand concentrated in the drop window; a well-timed launch
  caught Ravelry Hot Right Now and sold 76 copies in under 5 days
  vs 109 in a whole month for the previous best; a fall design
  timed for knitters dreaming of fall pulled ~60-70% of month-1
  sales into the first week.
  Sample & Launch Window Lab in a new workspace tab: prices the
  sample across four sale channels (Etsy, flash online drop,
  boutique consignment 40%, craft fair w/ booth amortization) vs
  the yarn+knit-hours cost basis with a keep-vs-sell note; prices
  the launch-week burst (68% of month-1 sales in week one at season
  peak vs 25% off-season; deep 45%+ discounts also trigger the
  burst multiple) with a per-month season factor. Inputs persist
  via the projectStorage seam. 14 new lib tests; suite 910 tests;
  typecheck + vitest + build green. Screenshot:
  docs/screenshots/sample-launch-lab.webp.
- [CHK-049] 7e44abc — Inbox sweep + Platform Compare in Teach tab
  (47th feature). Inbox swept at f08f9cc: two new issues #25-#26
  (pricing tier label, KAL revenue overflow). Both stale: fixes
  already at HEAD (CHK-038, 7939fa0); counter-evidence posted,
  both closed.
  Research angle: course-platform economics (never covered) —
  session-49 facts: School of Stitchery $24/mo library, 115+
  courses; Craftsy quarterly royalties, no teacher dashboard;
  Udemy teacher share eroded 37% -> 20% -> 15-20% by 2026, coupons
  never teacher-controlled; Skillshare 30% minutes pool, avg~
  $200/mo per teacher; Domestika advance+royalty; hosted guild days
  $300-1,000/day; LYS class ~$85/3h; UK shop rates £175-200/6h.
  Platform Compare section in Teach tab: five teaching-income
  models (self-hosted ~95% keep flat tooling, flat-fee day,
  per-seat class, minutes-royalty pool, coupon-eroded rev share)
  normalized to effective net $/teacher-hour against the pattern
  hourly rate, winner highlighted in emerald, per-model verdicts
  citing documented market data (Udemy erosion band, $300 market
  floor, UK rates, SOS/Skillshare pool facts). Inputs persist via
  the projectStorage seam. 15 new lib tests; suite 874 tests;
  typecheck + vitest + build green. Screenshot:
  docs/screenshots/platform-compare.webp.
- [CHK-048] f08f9cc — Inbox sweep + Listing SEO Lab (46th
  feature). Inbox swept at 8bf2a24: three new issues #27-#29
  (yarn-buy swatch switch no-op, buffer label precision,
  teach ticket ladder in flat-fee modes). All three turned out
  stale: the fixes already landed at HEAD (CHK-039 cycle, d314a5f);
  live counter-evidence posted on each issue and all three closed.
  Also re-verified tech debts (a)(b)(c) from staff prompt — all
  fixed at HEAD (royalty double-count fixed marker, standards
  guard, partner collection).
  Research angle: pattern listing SEO / discoverability market
  (never covered) — session-48 facts: Ravelry search ranks by
  title keywords + tags, 13 tag slots per listing; listings with
  6-8 photos (front, worn, detail, schematic, WIP, personal)
  outperform; 9+ size ranges advertised as 'size-inclusive' are
  the strongest documented callout; written+charted is a filter
  keyword; HRN ('recently popular') responds to queues, favourites,
  new-release announcements and KALs (Stitchcraft HRN analysis);
  Ravelry sweet spot $5-6 paid; Etsy $0.20 listing/4mo + 6.5%
  transaction + 3% + $0.25 payment; LoveCrafts 25% seller fee in
  the $40-1,900/mo band.
  Listing SEO Lab tab: pre-publish 0-100 scorecard across 7 items
  (title keywords 15, tags 15, photos 15, price-vs-band 15,
  size-range callout 15, written+charted 10, announcement
  channels 10) with per-item hints; planned-listing form;
  net-per-sale tiles for Ravelry/Etsy/LoveCrafts using platformNet
  seams and documented fees; paste-ready listing kit (title,
  tags, description with romance placeholder) with copy button;
  first-week momentum targets (queues/favourites/projects) and the
  sweet-spot price band. All settings persist via the
  projectStorage seam. 14 new lib tests; suite 859 tests;
  typecheck + vitest + build green. Found and fixed a React 18
  batching race in the tag-draft onChange (double patch lost the
  draft). Screenshot:
  docs/screenshots/listing-seo-lab.webp.
- [CHK-047] 4600ffd — QA sweep + Launch Readiness Lab (Launch tab
  upgrade, 45th feature). Inbox swept first: 4 new reviewer
  issues (#32-#35). Fixed in severity order: #33 MAJOR skip-setup
  deep-link dead-end (seeds samples, routes to /project/new), #32
  MAJOR Members tier table overflow at <=340px (flex-wrap fluid
  columns), #34 root 330px overflow at 320px (wrap hero/badges/
  buttons), #35 KAL Planner + Tech Edit rows overflow at 375px
  (flex-wrap). All commented + closed on GitHub, commit ed0311d.
  Research angle: pattern-launch marketing market (never covered)
  - session-47 facts: 400k+ patterns on Ravelry (discovery
  'black hole'), 72% of designers earn <=$50/mo, top-10% at
  $201/mo (MediaPeruana Ravelry census); 59% of buyers respond
  to marketing email vs 17% delete unread (SaleCycle); launch
  coupon max 15% off for max 1 week incl. a weekend (Sister
  Mountain); favourites+queues feed Hot Right Now; Ravelry
  Group Forum Banner ads ~$1.50/1k impressions (cheapest PPC
  in the niche).
  Launch Readiness Lab inside the existing Launch tab: 0-100
  readiness scorecard across 9 weighted items (email list 25,
  finished testers 15, photos 10, publish checklist 10,
  tech-edit 10, coupon guardrail 10, teaser 8, channel links
  7, market price 5) with per-item progress bars and hints;
  email revenue projection at 1-3% launch-week conversion
  scaled by the pattern's real advisePrice band; discount
  guardrail banner (warns >15% or >7 days); Ravelry banner
  break-even calculator ($1.50/1k CPM, 0.5% CTR); Hot Right
  Now momentum targets (queue/favourite benchmarks vs sales
  target); new funnel settings (list size, photo count,
  coupon window, teaser flag, banner budget) persisting via
  the projectStorage seam. 20 new lib tests; suite 845 tests;
  typecheck + vitest + build green. Screenshot:
  docs/screenshots/launch-readiness-lab.webp.
- [CHK-046] 6a61b39 — Subscription & Distribution Lab (44th tab)
  (session-46 pattern-distribution / subscription-library
  market research). GoSadi syncs listings without economics;
  LoveCrafts, Ribblr and the libraries are storefronts, not
  planners. New lab tab prices the whole portfolio on one page:
  per-channel net math for 6 sale channels (Ravelry, Etsy,
  Ribblr, Payhip, LoveCrafts 2%+$0.20 +3.5% band, own-store
  Stripe), additive royalty channels (subscription library
  $0.01-0.45/dl, own pattern club vs library breakeven),
  share sliders with re-normalization, concentration risk
  (HHI dominant-share flags), lifetime net and months to
  recover build cost, D-01..D-04 flags (cliff, brutal cut,
  fixed-fee bite, recovery). 27 new lib tests, full suite
  825 tests; typecheck + vitest + build green. Screenshot:
  docs/screenshots/subscription-distribution-lab.webp.
  Inbox sweep: no new proposals (#26 Teach headline remains
  MEDIUM open).
- [CHK-045] dea36d8 — Spec Sheet Lab (43rd tab)
  (session-45 spec-sheet / pattern-company production
  documentation market research). Designers hand-drawing factory
  spec sheets hit tech-pack tools that charge $35-95/user/mo
  (Techpacker) for fashion-generic packs with no knit logic,
  freelancers at $100-300/pack, and AI generators that are only
  50-70% complete ($3-5/pack). New lab tab turns the project's
  own grading table into a quote-ready sheet: POM points with
  graded values across all 9 sizes, tolerance bands (norm +/-
  0.25in), yarn bill (fibre + derived yardage), machine-gauge
  block (7-14 gauge flat-bed, CottonWorks), colourway depth, and
  an S-01..S-06 quote-readiness score (0-6) with
  ready/review/blocked verdict. 31 new lib tests, full suite 798
  tests; typecheck + vitest + build green. Screenshot:
  docs/screenshots/spec-sheet-lab.webp. Inbox sweep: no new
  proposals (#26 Teach headline remains MEDIUM open).
- [CHK-044] 1883ec9 — Lookbook Desk (42nd tab)
  (session-44 pattern-photography market research). Designers
  self-shoot with a phone or hire at mate's rates to pro half-day
  rates; photo sessions are 8-10h of a sweater's 55h build
  (MediaPeruana) and the dominant selling tool per
  Sister Mountain/Laine. New desk tab prices the shoot before it
  happens against the project's own data: construction-derived
  hours budget (base 9h + sizes/texture/yardage), three cost tiers
  (DIY / friend / pro), trait-driven shot list from the graded
  sections, platform gallery minimums, budget-vs-revenue guard,
  and L-01..L-06 flags with go/revise/blocked verdict; 21 new lib
  tests, full suite 765 tests / 44 files; typecheck + vitest +
  build green. Screenshot: docs/screenshots/lookbook-desk.webp.
  64bc1ee — same run: fix #30 (Test Knit Desk registered with
  duplicate tab value "testknit" — Desk now "testdesk", label
  "Test Knit Desk", verified live) and fix #31 (Tech Edit
  market-bill note used the audit-findings count instead of the
  project's graded-size count; new exported gradedSizeCount() and
  correct singular/plural; 2 regression tests). Closing comments
  posted on GitHub #30 and #31. Inbox sweep: no other new
  proposals (#26 Teach headline remains MEDIUM open).
- [CHK-043] 0f09016 — Test Knit Desk (41st tab)
  (session-43 test-knit market research). Test knits run on a
  Google-sheets/Instagram patchwork; Yarnpond (2018) is the only
  dedicated coordinator and its own users report testers ghosting;
  Ribblr locks patterns into its format. New desk tab prices the
  call for testers before posting: size coverage vs the project's
  graded sizes (2XL+ double-coverage per FatTestKnits practice),
  the documented $0.10-0.40/yard band with a $0.18 fair floor,
  unpaid-reward fairness, sample-knitter surrender cost, deadline
  and pre-launch audit readiness; verdict ready/revise/blocked and
  R-01..R-06 flags; 17 new lib tests, full suite 744 tests / 43
  files; typecheck + vitest + build green. Screenshot:
  docs/screenshots/testknit-desk.webp.
  Inbox sweep: no new reviewer proposals this run (issues
  #27/#28/#29 all addressed previously).
- [CHK-042] 775afa6 — Tech Edit market-bill tile
  (session-42 tech editing market research). Editors bill
  $20-40/hr at ~10-day turnaround with a documented shortage;
  no automated self-editing tool exists. Extend the self
  tech-edit audit: EDITOR_MARKET constants (cited rates,
  hours-by-size bands, wait), editorHoursFor() bands billable
  hours by graded size count, estimateMarketBill() quotes the
  same sweep at market rates ($48-160 for a clean 4h garment)
  and names the automatable arithmetic. Card shows a green
  'Market quote for this sweep' tile with editor hours, wait
  time and per-finding negotiation guidance; description now
  cites the rate/wait. 4 new tests (27/27 tech-edit-audit),
  full suite 727 tests / 42 files; typecheck + build green.
  Screenshot: docs/screenshots/tech-edit-audit-v2.webp.
  Inbox sweep: no new reviewer proposals this run (issues
  #27/#28/#29 all addressed previously).
- [CHK-041] 8ffe941 — Chart Lab (40th tab 'Chart Lab')
  + reviewer fix #29 residual (Teach flat-fee blending):
  No tool connects a chart desk to grading and costing.
  Chart Lab lives inside the project, keyed to the graded
  table: CYC standard symbol palette (13 symbols with
  stitch costs), per-row repeat/selvedge editor with live
  row-total accounting (n x block + before/after), drift vs
  the graded base stitch count per row, and pattern-prose
  drafting (Row N: (block) x K + selvedges, copy-to-clipboard).
  7 lab flags C-01..C-07: empty repeat block, repeat < 1,
  unknown symbol, negative budget, row-budget mismatch,
  empty chart, missing graded count; verdict
  ready/review/blocked. Sources anchored in the card and lib.
  18 new tests (chart-lab), 723 total (42 files).
  Research session 41 (chart-writing market): Stitchmastery
  is a GBP-60 desktop-only app whose chart-to-text emits
  raw per-row code; Stitch Fiddle flat charts cannot express
  repeats or multi-size and its free export is too low-res
  to publish; Chart Minder basic; EnvisioKnit text-to-chart
  only. CYC symbols are the industry standard; no player
  binds row budgets to the graded count - that is the moat.
  Fix (residual, proposed by reviewer on #29): guild flat-fee
  and LYS class gross used the blended ticket ladder; now
  the raw contract day fee is the gross input (usesBlendedTicket
  flag in computeTickets). 3 regression tests added; 31/31
  teach tests green.
  Typecheck + 723 tests + build green; verified in-browser
  (Chart Lab: ready at graded 6 st; C-05 + 178 st drift at 184).
- [CHK-040] fdb8305 — Grading Lab (39th tab 'Grading Lab')
  + reviewer fix #29 on Teach:
  New grading-lab.ts grades every size in one pass, then runs
  tech-editor sanity checks the market charges $15-25/size
  ($125-250 min jobs) for: ease drift between neighbouring
  sizes (G-01), repeat misalignment (G-02), missing bust /
  arm keys (G-03), decreasing stitch counts (G-04), inelastic
  oversized drape (G-05), unreal gauge (G-06), <5 sizes
  (G-07), cm/inch confusion (G-08). Ease conformance against
  the industry ease guide (very fitted <= -5cm ... oversized
  >= +15cm at bust); freelance-cost-saved KPI ($135-225 for
  a 9-size set); per-size walk table (bust cm, stitches, step);
  verdict ready/review/blocked with unit-safe cm math on
  both cm and in projects.
  14 new tests (grading-lab), 702 total (41 files).
  Research session 40 (grading & sizing market): grading is
  the #1 publishing blocker; alternatives are manual sheets,
  freelance jobs $125-250 (fashion-incubator) / $35/hr (Midnight
  Purl), and single-fit AI generators that produce no graded
  sets; ease-guide workshop by sistermountain; 2in bust grade
  rule; XS-5XL inclusive practice widens buyer pool.
  Fix: #29 ticket-ladder sliders hidden in guild flat-fee and
  LYS class modes (now gated on isCourse; ladder, early-bird /
  installment sliders, and tier copy only render for courses).
  Typecheck + 702 tests + build green; verified in-browser
  (Demo Crewneck: ready, 9 sizes, +18 sts/step, 12.7cm ease).
- [CHK-039] d314a5f — Submissions (38th tab 'Submissions')
  + reviewer fixes #27/#28 on Yarn Buy:
  New submission-desk.ts prices magazine / box / book
  calls-for-submissions against self-publishing: net outcome
  (fee + yarn support + rights-return 8-week ramp), effective
  hourly vs the designer's own rate floor, exclusivity
  dead-loss (price x weekly sales x months x 4.33 wks),
  break-even fee (self-publish earnings net of costs/tail),
  red flags S-01..S-07 (fee under labour floor, exposure-only,
  exclusivity >5 months, uncompensated sample, book rights,
  box-channel concentration/KnitCrate, yarn support <$75).
  Presets: Laine-style $900 sweater / $0 box deal /
  anthology. Storage via projectStorage 'submissions'.
  21 new tests (submission-desk), 688 total (40 files).
  Research session 39 (yarn-box economics): ~25 active boxes
  $10-90/mo; KnitCrate collapsed Dec 2022 ($2.95M lenders,
  owed designers Dec pay, $3/item max, 85% discount demands);
  Laine pays up to $900 for sweaters (50-85 hrs), 5-month
  exclusivity, designer knits sample + test knit;
  cost stack $40 tech edit / $40 model / $75 yarn.
  Fixes: #27 swatch switch now actually lowers the buffer
  to the 10% floor (bufferFor pct = BASE_BUFFER when
  swatchConfirmed); #28 buffer displays 12.5% not 13%
  (fmtPct one-decimal helper on both labels).
  Typecheck + 688 tests + build green; verified in-browser
  (default $500 fee -> NO, $422 dead-loss, $1,634 break-even).
- [CHK-038] 7939fa0 — KAL Planner (37th tab 'KAL Planner')
  + reviewer fixes #14/#25/#26:
  New kal-planner.ts models the four KAL formats (launch /
  mystery / guild / seasonal): P&L incl. designer hours,
  launch-window uplift (2-4x, decaying), 8-week afterglow,
  prize+sponsor offset, prize-recovery copies/weeks, 4-week
  mystery clue calendar, fee income, and red flags K-01..K-06
  (prizes outrun revenue, <$10 prizes, squeezed mystery
  schedule, unpaid labour, no sample budget, fee-free
  guild/seasonal). Storage via projectStorage 'kalplanner'.
  14 new tests (kal-planner), 665 total (39 files).
  Research session 38 (KAL economics): Ravelry's best-ever
  January averaged $203/designer (72% under $50);
  sweater pattern = 55 hrs + $155 direct costs; typical KAL
  prizes $10-50 with yarn-company sponsors (Malabrigo,
  Hobbii); mystery KALs = 4 weekly clues (Westknits MSKAL);
  Ravelry offers only calendar+group — no P&L tooling.
  Fixes: #14 promo 'Projected net +$-282' sign bug
  (signed$ formatter in promotion-planner); #25 Teach tab
  flat-fee formats (hide EB/installment/ladder/seat-break-even
  in guild/workshop/day-rate, show day-rate economics);
  #26 hosted quick-check denominator (used prepHours instead
  of totalHours; added hostedHoursPerSession/
  hostedSessions fields).
  Typecheck + 665 tests + build green; verified in-browser
  (launch KAL demo: net -$332, K-04 unpaid-labour flag).
- [CHK-037] 396c1c9 — Storage-seam sweep + fixes + Yarn Buy
  Calculator (36th tab 'Yarn Buy'):
  Storage seam: projectStorage<T> helper in storage-lib.ts
  (scoped keys stitch-and-scale-{tab}-{projectId},
  legacy-key migration) + 20 bare-key cards converted
  (submission pipeline, KAL ROI, channels, retention, promo,
  membership, price window, license, hire-vs-self,
  wholesale book, club rev, inclusive sizing, platform mix,
  test knit, tech edit, translation, trunk show, finish
  guide, launch campaign, teach economics).
  Fixes: #11 CYC yardage/gauge table to true midpoints
  (lace 450->600 yd, gauge refs per-inch); #12 portfolio
  'lace' inference (STS/4in now divided by 4, correct
  per-inch CYC refs); reviewer royalty double-count in
  yarn-company-deal (base already nets time/fixed costs);
  publishing-system proposal P0: PDF provenance footer
  (pattern name, sizing std, template id, renderer ver,
  date, locale).
  Yarn Buy Calculator: dye-lot buy list w/ documented
  10-15% risk buffer (+2.5% fine yarn, +2.5% 4+ sizes,
  floor held when swatch confirmed), whole-skein ceiling,
  stash offset (whole skeins), insurance-skein rec,
  per-size-grade cost spread, market-standard yarn
  quick-loads (Cascade 220, Shibui Silk Cloud, etc.).
  Research: dye lots are non-reorderable (Lion Brand);
  buy 10-15% extra (Mary Maxim 2026); stash apps exist
  but none pattern-aware (Yarnventory/YarnBuddy); YarnSub
  not pattern-aware.
  646 tests (38 files), typecheck + build green; verified
  in-browser (1,903 yd base, 13% buffer, 10 skeins @ $14.99
  = $150, $90-$150 across grades).
- [CHK-036] 0c0aff0 — Partners — Yarn Partners & Deal Evaluator
  (35th workspace tab, 'Partners'):
  Session-36 research (see research/competitors-session-36-
  yarn-partnerships.md): yarn companies pay for design work
  in many currencies — Knit Picks IDP keeps a flat 15%
  (designer sets price, keeps 85%, yarn support on approval);
  Who Pays Knitters records accessory design rates of
  $40-$700 averaging $246 (garments higher); rights models
  run keep-all / 6-12 mo exclusivity / shared-royalty /
  full-transfer; indie dyer collabs hinge on concept brief,
  yarn spec, timeline, and a marketing plan in the first
  email; LYS Day (late April) is the biggest coordinated
  traffic day in indie yarn retail.
  Library partner-economics.ts: analyzePartnerDeal — 6 deal
  types (yarn support, IDP-style listing, lump sum,
  exclusivity window, LYS Day exclusive, KAL host) priced
  against the self-publish runway (15% marketplace net)
  with rights-surrender math (window/unlocked/royalty/
  3-yr full-transfer); $30/hr pattern-design benchmark
  verdict ladder (great/good/hold/rethink/skip); red flags
  YP-01..06 ($246 accessory floor, 15% IDP norm, 12-mo
  exclusivity cap, yarn-only underpay, <$10/hr, sub-floor
  lump sums); scorePitch + computePitchGaps (brief,
  sketches, yarn spec, timeline, marketing plan, portfolio,
  audience stats); summarizePipeline — statuses, cash in
  flight, avg deadline; 6-item signed-agreement checklist
  with nullification clause.
  UI: partner-economics-card.tsx — deal type + rights
  selects, conditional deal-type fields (IDP fee %, window
  months, LYS Day days, KAL followers), verdict banner,
  money tiles (cash value, self-publish runway, rights
  surrendered, net /hr), red-flag rail, copyable agreement
  draft, pitch-readiness score + named gaps, pitch pipeline
  table (add/update status/amount/notes, delete).
  Storage-seam key stitch-and-scale-partners-{projectId}.
  34 new tests; gates: 623/623 (37 files) + typecheck +
  build green; tab visually verified in-browser.
- [CHK-034] 4548a0c — Teach It — Teaching Economics
  (34th workspace tab, 'Teach'):
  Session-35 research (see research/competitors-session-35-
  teaching-monetization.md): teaching is the growth lever
  for designers — fewer than 100 Ravelry designers clear
  $3k/mo from patterns alone. Flagship self-paced courses
  cluster at $500-600 (Pip & Pin $548 / $99x6; Kneedles &
  Life $99-125); hosted workshops pay teachers $300-1,000/day
  flat, tickets $75-150/day, break-even ~8 students; the
  graduated per-hour model ($50/75/100 by 1-8/9-16/17+ seats)
  is the standard guild ask; list enrollment realistically
  runs 1-3%.
  Library teach-economics.ts: analyzeTeachingOffer — 5 offer
  formats (self-paced course, cohort, Zoom series, guild
  flat-fee day, LYS class), blended tier ladder with
  early-bird/installment share clamping, break-even seats,
  production payback (weeks), effective $/hr vs the
  pattern-selling alternative (verdict skip/hold/launch),
  fill ratio against full-house capacity, T-01..T-05 red
  flags (seats miss break-even, platform costs dominate,
  below market floor, big build small audience, flat fee
  under floor); analyzeHostedOffer — flat/graduated/
  per-student gig pricing; buildPricingLadder — anchor
  ~60% of price, early bird -15%, installments +12%.
  UI: teach-economics-card.tsx — format selector, 16 inputs
  (4 sliders for the tier ladder), verdict rail, money
  tiles (students, gross, net, $/hr multiple), break-even +
  payback + blended ticket, hosted-offer quick-check panel
  with grassroots toggle, red-flag rail, engineered price
  ladder grid, copy-paste tier copy.
  Storage-seam key stitch-and-scale-teach-v1.
  23 new tests; gates: 585/585 (36 files) + typecheck +
  build green; tab visually verified in-browser.
  Reviewer: issue #8 fixed and closed (commit 5fc0355) —
  gauge-plausibility band was computed in sts/cm against a
  sts-per-4in project gauge; CYC refs converted to sts/4in
  (x10.16), warning dual-labeled, realistic 20x28 fixture.
  Also noted #4/#14/#10/#9 as seen/queued on GitHub.
- [CHK-033] 8b212e6 — Protect — Copyright Protection
  Planner (33rd workspace tab, 'Protect'):
  Session-34 research (see research/competitors-session-34-
  copyright-protection.md): piracy protection for pattern
  designers is a service gap — photo-centric enforcement
  shops take ~50% of fees, brand monitors run $249+/mo, and
  72.3% of Ravelry designers earn <$50/yr. Etsy removed
  346,000+ counterfeit listings in one year. Patterns are
  protectable literary/artistic works (automatic copyright,
  life+70); stitch types/methods never are — the license and
  the URL evidence are the fence.
  Library copyright-protection.ts: analyzeProtection —
  leak-exposure valuation (5-30% leak-share band: watermark
  x0.6, unique links x0.7, multi-platform x0.9), lost-net
  and response-budget-per-incident (designer rate),
  fight-worth-it call; license-terms strength audit (0-100
  score, priced gaps, CP-01 on open commercial boundaries);
  prevention score; watch-word generator (pattern + designer
  name, Pinterest/filetype queries); 6-item evidence pack;
  5-step escalation ladder with the 10-business-day
  counter-notice deadline (CP-05 on lapse); buildDmcaNotice
  with all 6 required DMCA elements for Etsy/Ravelry/
  Pinterest/Shopify.
  UI: copyright-protection-card.tsx — verdict + exposure +
  license-strength + prevention-score tiles, red-flag rail,
  leak-pricing inputs, prevention stack, license boundary
  toggles with gap notes, watch-word copy buttons, evidence
  checklist, date-tracked escalation ladder, copyable DMCA
  notice. Storage-seam key stitch-and-scale-protect-{id}.
  15 tests; gates: 561/561 (35 files) + typecheck + build
  green; tab visually verified in-browser; issue #17
  commented + closed; #4 seen/deferred to CHK-034.
- [CHK-032] 3393aad — Reviewer fix #5 S030 + Book It — PoD Book
  Builder (32nd workspace tab, 'Book It'):
  Fix first (MAJOR S030): the bundle planner UI now collects
  partner patterns — up to 3 rows, each with pattern name /
  partner retail / solo-window copies — persisted under the
  project-scoped storage seam; named rows flow into planBundle
  and generateBundlePitch (verified in-browser: pitch went
  '0 designers, 1 pattern' -> '1 designer, 2 patterns',
  discount depth & my share recomputed). 3 new coalition
  tests (equal split, retail-weight split, pitch wording).
  Feature: session-33 research (2026 KDP vs Lulu vs
  IngramSpark PoD economics, KDP 60% royalty with $3.40/200pp
  B&W print and ~60d payout, Lulu direct 80% w/ ~$10/200pp,
  IngramSpark 70%, color pages 6-8x B&W marginal cost, UK
  precedent 10-pattern collections, KnitPicks IDP 15% fee)
  — indie designers price books on headline royalties and get
  burned by print cost + color pages + discovery.
  Library pod-book-planner.ts: analyzePodBook — 6-channel
  table (KDP/Lulu direct/Lulu retail/IngramSpark/direct
  storefront/self-fulfilled) each with real net/copy,
  break-even copies, payout delay; production budget +
  marketing spend; PDF-baseline comparison (is the book even
  better than selling the patterns solo as PDFs?); color-page
  watch-outs; 6-item production pre-flight checklist
  (tech edit ~$100/pattern, photos locked pre-layout, proof
  copy at home gauge, launch list); copyable launch summary.
  UI: pod-book-card.tsx; storage-seam key; 14 tests; gates:
  546/546 + typecheck + build green; both tabs visually
  verified in-browser; issue #5 commented + closed.
- [CHK-031] 143e430 — Reviewer-issue fixes + Collab & Exposure
  Evaluator (31st workspace tab, 'Collab'):
  Reviewer triage swept first (staff working prompt rule):
  #6 CRITICAL fixed — section & measurement deletes now confirm
  via AlertDialog + 8s undo stash in a toast; #7 MAJOR fixed —
  measurements gain an in-place edit (form pre-fills, id
  preserved); #3 MAJOR S003 fixed — empty-standards fallback
  now loud: customStandardMissing flag surfaced across the 6
  module families (readiness/yarn/credibility/sections/kits/
  listings) with 8 new tests; #2 S015 resolved with counter-
  evidence — Making Stories publishes 30% of NET, so royalty
  base is now an explicit adjustable field (net|gross, default
  net) in both deal evaluators instead of silently flipped.
  Feature: session-32 research (Ravelry Jan-2019 census 72.3%
  under $50; WhoPaysKnitters rate database; Making Stories 30%
  net royalties; 2026 unpaid-collab backlash articles; UK IPO
  patterns-as-literary-works) on the collab/exposure angle
  nobody prices honestly. Library collab-evaluator.ts:
  analyzeCollab — fair-fee floor at the designer's own rate
  (hours + sample + ~1.5h per demanded post), cash-only
  verdict ladder (take >= 0.8x floor, counter >= 0.5x, walk
  below — exposure can NEVER promote a deal), honest exposure
  cap (followers x 0.5% conversion, floored at $50),
  locked-out value during exclusivity, CE-01..05 red flags
  (unpaid work w/ requirements, copyright grab < 2x floor,
  reputation play, license below locked-out, repeated unpaid
  posts), and paste-ready walk/counter/accept letters.
  UI: collab-evaluator-card.tsx; project-scoped storage key
  stitch-and-scale-collab-{projectId}; 16 tests; gates: 529/529
  + typecheck + build green; 4 issues commented & closed with
  commit hash and evidence.
- [CHK-030] 28910b3 (rebased to 8322ab8) — Platform Mix Planner (30th
  workspace tab, 'Mix'):
  16 tests; 504/504 overall green; typecheck + build pass.
  Session-31 research (Ravelry's Jan-2019 census showing ~70% of
  designers sell from 1-2 platforms and Ravelry dwarfs all others;
  LoveCrafts/Interweave shutdown proving platform risk; KnitPicks
  IDP at 85%; Etsy 15% offsite ads mandatory above $10k/yr;
  Makerist.fr for FR-only patterns; Ribblr auto-translate + VAT
  handling; Payhip free tier + VAT handling) finds every platform
  is a maintenance bill and designers can't see which mix actually
  earns. Library platform-mix-planner.ts: analyzePlatformMix —
  per-platform net after that platform's full fee stack shared
  through platformNet, Etsy 15% offsite-ads haircut, monthly
  maintenance-hours cost at the designer's own rate, VAT-handling
  value, single-platform concentration risk, dormant-platform
  recommendation, and watch-outs.
  UI: platform-mix-card.tsx — monthly sales, price, design rate,
  marketing hours, international %, offsite-ads toggle, per-platform
  enable + share sliders; gross/fees/maintenance/net summary;
  per-platform cards with net, maintenance, offsite-ads line items;
  watch-outs and copyable recommendation; localStorage key pmpx-v1.
- [CHK-029] 2792399 — Repeat Buyer & Retention Planner (29th
  workspace tab, 'Repeat'):
  19 tests; 488/488 overall green; typecheck + build pass.
  Session-30 research (new customers cost 5-10x more than keeping
  existing ones; craft email open rates vs 17% deleted unread;
  ~5% of an engaged list buys each release; warm lists repeat at
  20%+; Sister Mountain/Flora & Henriette retention playbooks;
  tooling tiers from free to $150/mo) finds designers grow
  audiences blindly while ignoring what the list is worth net.
  Library retention-planner.ts: analyzeRetention — monthly buyers,
  list revenue and profit net of the shared platformNet fee seam
  and tooling cost; retained-vs-acquired per-sale cost gap; repeat
  ladder (first purchase through loyal 4+); 12-month projection
  with churn and signup growth vs cold-acquisition cost of the
  same buyers; five watch-outs (optimistic purchase rate, weak
  repeat, over-release vs knit capacity, tooling overhead,
  underwater acquisition cost); paste-ready welcome and
  next-release emails.
  UI: retention-card.tsx — list size, active %, purchase %, repeat
  %, releases/mo, price, signup growth, consumption base, platform,
  tooling-tier and fan-acquisition-cost inputs; verdict banner;
  monthly summary, retention-advantage block, ladder, 12-month
  projection, watch-outs, copyable email templates; localStorage
  key rtpl-v1.
- [CHK-028] 814443a — Price Window & Discount Optimizer (28th workspace
  tab, 'PriceWin'):
  14 tests; 469/469 overall green; typecheck + build pass.
  Session-29 research (knitting patterns historically underpriced as
  yarn-company loss leaders vs sewing patterns as standalone
  products; a Jan 2019 Ravelry snapshot found fewer than 100
  designers clearing $3k/month in pattern sales; launch discounts
  buy Ravelry promo-thread placement and give the fave queue a
  buy-now reason; 15-20% is the standard launch band; deep or
  open-ended sales train buyers to wait for the next deal and
  decay full-price baseline volume; price by complexity, not by
  insecurity) finds designers plan launch sales on gut feel,
  never against their own fave queue, season, and fee stack.
  Library price-window-optimizer.ts: analyzePriceWindow — three
  modeled paths net of the shared platformNet fee seam (full price
  with queue dribbling ~2%/wk; launch-window sale with queue
  conversion at discount uplift and blended price; forever-sale
  trap with trained-to-wait baseline decay); season demand map
  (Nov-Dec 1.75x peak to Jul 0.60x trough); discount-train trap
  audit (depth >25% or >4 weeks flagged); paste-ready launch
  listing copy.
  UI: price-window-card.tsx — price/platform/baseline/fave-queue
  inputs, discount and duration sliders, launch-month season chip
  selector, advanced conversion settings, verdict-badged path rows,
  trap warnings, season map, copyable launch copy; localStorage
  key prcw-v1.
- [CHK-027] 838b2fc — Promotion Budget Planner (27th workspace tab, 'Promo'):
  13 tests; 455/455 overall green; typecheck + build pass.
  Session-28 research (Etsy onsite PPC needs ~3x revenue ROAS to
  breakeven at \$6-9 pattern price points once the full fee stack —
  6.5% transaction, ~3% + \$0.25 processing, offsite commission
  12-15% — is subtracted; offsite ads are pay-only-on-sale so they
  are the only paid channel with positive math at low conversion;
  newsletter launch email = highest conversion of any channel;
  free-pattern funnel = cheapest fan acquisition; the '\$182
  seller' pattern of spending on clicks before listing conversion
  supports it) finds designers promo-budget on gut feel, never
  against net margin per sale.
  Library promotion-planner.ts: analyzePromotion — 5 channels
  (Etsy onsite/offsite, Pinterest, newsletter, free-pattern
  funnel); per-channel clicks/sales/expected profit; break-even
  CPC and required conversion rate; revenue ROAS; kill rule
  (spend threshold with 0 orders -> pause); budget split ranked
  by profit-per-dollar/hour; 30-day test protocol; go/maybe/kill/no
  verdicts. Reuses the shared platformNet fee seam so promo math is
  always net of platform fees.
  UI: promotion-card.tsx — per-channel rows with toggle switches,
  inputs (daily budget/CPC/conv %, commission rate, hours/rate/
  clicks-per-hour/conv %), verdict badges, suggested order, fee-
  stack reminder, copyable test plan; localStorage key promo-v1.
- [CHK-026] 93f220c — Membership Planner (26th workspace tab, 'Members'):
  15 tests; 442/442 overall green; typecheck + build pass.
  Session-27 research (Patreon 10% standard fee + ~5% processing —
  a \$5 tier nets ~\$4.15; avg patron support \$5.40→\$6.10 Q1'25→2026;
  bottom \$3 tier ≈ 90% of members; members join-for-one-pattern-then-
  cancel churn; MediaPeruana pattern cost base \$155 — tech edit
  \$40, model \$40, yarn \$75; New Wave Knitting \$47k gross/\$43k
  spend/\$3k kept; avg Patreon creator \$315–1,575/mo) finds
  designers launch memberships on vibes while the fee stack and the
  monthly pattern production cost silently eat the profit. We model
  the whole business net before launch.
  Library membership-planner.ts: analyzeMembership — 1-5 tiers with
  price/members/churn/perks; per-tier net after platform +
  processing fees; production cost per exclusive pattern (materials
  + hours × design rate labour floor); profit/mo; breakeven member
  count from weighted net per member; churn volume flags; four
  watch-outs (bottom-tier churn trap >80%, under-\$2 net member,
  platform rate >12%, deliverables outrun the base); cannibalization
  check via the shared platformNet seam — parked pattern's lost
  standalone sales vs membership profit (worth it / thin / net
  loss); go/maybe/no verdict; paste-ready tier page copy.
  UI: membership-card.tsx — tier editor (add/remove 1-5), perks
  textarea, economics grid (platform, ramp, rates, exclusive
  pattern cost/hours, parked-pattern fields), verdict badge with
  fee/production/profit rows, watch-out cards, tier-copy copy
  button; localStorage key mspl-v1.
- [CHK-025] 88fd2f6 — Pattern License Planner (25th workspace tab,
  'Licence It'):
  17 tests; 427/427 overall green; typecheck + build pass.
  Session-26 research (The Pattern Cloud licence tiers — non-exclusive,
  extended commercial-use, exclusive = permanent worldwide buyout
  removed from the designer's shop; Stitchcraft Marketing's 3 yarn-
  company contract models — royalties/no exclusivity, royalties +
  3-12 month window, non-exclusive licence purchase; designers
  rejecting outright buyouts; Vogue Knitting \$500 flat + yarn support;
  \$0.25/yd sample rate; buyout red flags: buyout-vs-exclusivity
  confusion, royalty-only-no-fee trap, >12mo windows, territory
  ambiguity, derivative/grading rights transfer, no reversion)
  finds competitors expect designers to licence on gut feel — nobody
  tools the decision against the pattern's projected self-sell
  baseline. We make the rights decision a priced, audited choice.
  Library pattern-license-planner.ts: analyzeLicenseOffer — five deal
  structures (non-exclusive, extended, royalty non-exclusive,
  royalty + window, full buyout); self-sell window value via the
  shared platformNet seam; royalty leg with 10% reporting-lag
  haircut; production-cost drag when the licensor doesn't cover
  sample/photo/tech edit; buyout premium at 4x the window value
  (surface-design multiple); 8-point rights audit (fee/royalty
  structure, 12-month window cap, buyout multiple, territory,
  derivative retention, credit/promo rights, payment lag,
  production coverage); go/maybe/no verdict vs the labour floor;
  24-month keep-vs-sell comparison; paste-ready counteroffer or
  acceptance letter. keepVsLicense helper.
  UI: pattern-license-card.tsx — baseline inputs (weight, platform,
  price, sales, rate, hours, horizon), deal-structure selector with
  conditional royalty/fee fields, rights switches, verdict badge,
  rights audit cards, reply letter with copy button;
  localStorage key pslc-v1.
- [CHK-024] fc3f1bb — Inclusive Sizing & Adaptive Grading Analyzer
  (24th workspace tab, 'Inclusive'):
  13/13 tests; 410/410 overall green; typecheck + build pass.
  Session-25 research (Jill Wolcott 'Hard Magic of Inclusive Sizing' —
  grading costs exceed market price, effort steepens past ~6 sizes;
  craftsnark poor-grading thread — buyers litmus-test 'size
  inclusive' claims before buying, a 2XL sweater ~\$147 of yarn/time;
  Ysolda 2026 chart XXS-7XL with 2\" grade rule, cup options, broad
  shoulders; Iowa State adaptive-apparel OER — seated-fit grading,
  magnetic closures, sensory-flat seams, thigh pockets, donning
  loops) finds competitors treat inclusive sizing as charity or a
  checkbox — we price the consulting effort it really is.
  Library inclusive-sizing-analyzer.ts: analyzeInclusiveSizing (6-point
  audit with genuinely-inclusive/partial/naive-scaling/not-inclusive
  verdict; grading-hours = measurements x (1.5 + extra sizes x 0.45);
  yardage re-estimate 0.5h/extra size; test-knit 1.5h/size + 2.5h per
  plus-size band; \$5/extra-size tech edit; Wolcott 'hard magic' flag;
  per-size yardage from the shared yardage seam with plus-size growth
  warnings; shortfall vs launch-week platform net); buildInclusivePack
  (pricing strategy + paste-ready launch copy); 8 adaptive-mod
  consulting quotes at the design rate.
  UI: inclusive-sizing-card.tsx — size-range editor with cup/broad-
  shoulder flags, adaptive-mod switches with live \$ quotes, audit
  checklist, per-size yardage chips; localStorage key snsp-v1.
- [CHK-023] d9191b2 — Hire-vs-Self Analyzer (23rd workspace tab,
  'Hire vs Self'):
  21/21 tests; 397/397 overall green; typecheck + build pass.
  Session-24 research (Tendyke \$0.12/yd knit / \$0.10 crochet sample
  pay; Sloan & Ford 12p/metre with designer-paid return shipping;
  craftsnark ~\$80/sweater flat fee; tech editing \$30-40/hr with
  sweaters at ~4 hours; fixed-rate editors \$30 hats / \$50 garments
  +\$5 per extra size; Storta \$36 base; test knits usually
  unpaid-with-credit) finds designers outsource on gut feel without
  pricing their own opportunity cost — the sample-knit hours they
  donate are design/marketing hours their releases actually sell on.
  Library hire-vs-self-analyzer.ts: analyzeHireDecision (sample leg
  from shared yardage seam +10% swatch allowance at 30yd/hr, per-yard
  vs flat-fee pay model, opportunity cost at default \$25/hr design
  rate; edit leg with auto scope from section measurement counts at
  the \$30 market low; blind-spot rules — any 4h+ edit hires, designer
  self-editing her own maths always flagged; go/maybe/no on
  outsourcing both legs vs hours-freed income potential); buildHiringPack
  (8-item checklist with red flags + paste-ready sample-knitter
  listing in the Sloan contract style: blocking standards, timescale
  in writing, pre-release discretion).
  UI: hire-vs-self-card.tsx, rate inputs, verdicts with per-leg
  badges, reasoning notes, checklist, listing toggle; localStorage
  key kskhirevsself-v1.
  Self-audit fix: removed a non-existent garmentType field usage
  caught by typecheck; edit scope now derives from real measurement
  counts.
- [CHK-022] d8eb5f9 — Wholesale & Book-deal Analyzer (22nd workspace
  tab, 'Wholesale & Book'):
  21/21 tests; 376/376 overall green; typecheck + build pass.
  Session-23 research (keystone wholesale = half retail per
  Craftybase; Woolly Wormhead's ~\$130 direct cost and 34.5 hours
  per professionally produced pattern; trad book deals 10% hardcover
  / 8% paperback / 25% ebook royalties of cover per Writers Block
  Party, advances in 2-4 installments, first statement ~6 months
  post-release, 15% agent + ~35% tax; GoSadi Nov 2025 platform
  fees: Ravelry 0% (~\$5.70 net on \$6), Etsy ~\$5.10, LoveCrafts
  25% until \u00a31,500/mo) finds designers price wholesale and book
  deals on instinct, never against same-volume self-selling.
  Library wholesale-book-analyzer.ts: analyzeWholesaleDeal (wholesale
  net vs direct equivalent, volume breakeven copies, repeat-order
  uplift, effective hourly vs the \$12 floor, keystone anchoring
  notes, go/maybe/no verdicts); analyzeBookDeal (earn-out copies,
  installment timeline, 15% agent + 35% tax netting, royalty-band
  counter flags, ~2-yr cash lag, self-publish baseline); build
  WholesalePack (6-item red-flag checklist + paste-ready counter
  reply with deposit terms and reorder-rate lock).
  UI: wholesale-book-card.tsx, wholesale inputs and readouts, bulk
  checklist, counteroffer copy button, book-deal section behind a
  switch; localStorage key kskwsb-v1.
  Self-audit fix: the choked 21-tab single-row strip (labels
  overlapping) is now a flex-wrap scrollable tab row with nowrap
  labels — every tab readable at normal screen widths.
- [CHK-021] 41f25d4 — Club Revenue Model (21st workspace tab,
  'Club Rev'):
  23/23 tests; 355/355 overall green; typecheck + build pass.
  Session-22 research (Patreon-style retention bars: 65% retained
  at 3 months = good, 78% = great per Bonjoro's creator analysis;
  small creators commonly churn 25-35% a year per market.us;
  Double The Stitches Pattern Club — \$7/mo or \$77/yr founding
  price lock, 10-day cancellation notice, no annual refunds,
  2-tier ladder with Stitch Society premium; mediaperuana cost
  model 55 hours / \$155 direct costs per pattern / \$67/mo
  overhead) finds designers price clubs on copycat numbers with
  no churn, breakeven or premium-tier math.
  Library club-revenue-planner.ts: modelClub (12-month churn /
  signup simulation, churn verdict healthy/typical/bleeding vs
  the cited bars, breakeven members, member LTV and marketing
  payback, effective hourly vs the \$12 bar, premium-tier verdict
  worth/add-more/cut/skip against a self-publishing comparison,
  policy checks — 10-day notice, no-refund chargeback risk,
  price-lock anchoring, lifetime access as retention lever — and
  a day-0/30/60/90 retention calendar); auditPremiumTier (6 core
  perks, score/6 with per-gap notes); generateFoundingOfferEmail
  (price-lock founding cohort email).
  UI: club-revenue-card.tsx, membership/churn inputs with live
  MRR/projection/LTV/payback readouts, premium audit panel,
  retention calendar, launch email and 12-month table behind
  switches; localStorage key kskclubrev-v1.
- [CHK-020] 3f1855e — Channel & Funnel Planner (20th workspace tab,
  'Channels'):
  16/16 tests; 332/332 overall green; typecheck + build pass.
  Session-21 research (Craft Industry Alliance subscription-box
  economics — \$35-65/box, 200-400 monthly subscribers typical,
  ~13% of tracked boxes defunct, designers featured at most once
  a year, boxes assemble a month ahead with hard delivery dates,
  only ~10% of suppliers include a marketing card; Ravelry data
  \$203 average best month / 72% under \$50; sweater 50-85 hours;
  indie-mag ceiling ~\$900) finds designers accept box and collab
  deals without pricing the audience effect or deadline risk.
  Library channel-funnel-planner.ts: analyzeChannel (subscription
  box / brand collab / magazine / other — fee + audience funnel
  income + \$0.35/mo exposure lead value vs lost exclusivity
  self-sell and labour at the \$12/hr bar, deadline-risk bands,
  stability haircut, go/maybe/no verdict with cited notes);
  analyzeFunnel (list size, freebie lead-in, launch-week share,
  evergreen and post-launch conversions, fees, maintenance
  hours, net and hourly); generateBoxPitch (paste-ready pitch
  with fee ask, exclusivity term and insert-card promise).
  UI: channel-funnel-card.tsx, channel offer inputs with live
  verdict badge, newsletter funnel with net readout, pitch and
  income-breakdown panels behind switches.
- [CHK-019] 7984c0f — KAL & Collab ROI planner (19th workspace tab,
  'KAL & Collab'):
  23/23 tests; 316/316 overall green; typecheck + build pass.
  Session-20 research (Ravelry Jan-2019 income distribution — top
  10% earn >= USD 201/mo and only 3% clear USD 1,000/mo;
  emmaknitty.com Working with Brands — small-design fee band
  EUR 80-140, yarn-only pay for sized garments flagged, lump-sum
  deals often transfer rights or impose resale price floors;
  Knit Picks 10% affiliate with no posting requirements;
  GAL free to join with self-set discount) finds designers run
  KALs, giveaways and collabs on vibes with no revenue math.
  Library kal-roi-planner.ts: analyzeKal (free/paid/sponsored KAL,
  giveaway, sale-event formats — event sales + visibility tail +
  cross-sell + affiliate + lead value vs platform fees, prize
  costs and real hours, cited USD 12/hr bar); rightsChecklist
  (rights transfer, self-resell, price floor, exclusivity window,
  deliverable scope, yarn-only-for-sized-garment red flag);
  estimateCollabFee (USD 80-140 base, +50% multi-size grading,
  x2 for rights transfer, +15%/deliverable above 5);
  generateCollabPitch (paste-ready brand outreach with KPIs).
  UI: kal-roi-card.tsx, campaign/affiliate/costs inputs, live
  verdict banner with net profit and effective hourly, rights
  check and fee estimator behind switches, copy-ready pitch.
- [CHK-018] d1048b3 — Submission Pipeline manager (18th workspace tab,
  'Pipeline'):
  14/14 tests; 293/293 overall green; typecheck + build pass.
  Session-19 research (Making Stories EUR 100-550 paid
  submissions with 4-month exclusivity, Laine 5-month window,
  Knitty USD 250-350 with no exclusivity, Who Pays Knitters avg
  USD 246, Paper Moon Knits 6-part submission pack) finds no tool
  tracks magazine/anthology calls against real production hours.
  Library submission-pipeline.ts: buildPipeline (deadline/decision/
  pattern/sample/launch dates with days-from-now deadline states
  and production-feasibility math from the shared yardage model at
  30yd/hr sample knitting), scoreOffer (accepted-fee vs solo
  baseline in the exclusivity window with the cited USD 12/hr bar),
  submissionPackChecklist (6-part pack incl. schematic, schematics
  PDF, tech-edited draft, sample photos, yarn support note),
  generateSubmissionLetter (copy-ready cover letter).
  UI: submission-pipeline-card.tsx, calls list with
  add/edit/delete, call details form, production rates inputs,
  milestones timeline, offer verdict, checklist, letter tabs.
- [CHK-017] c054126 — Kit Economics planner (17th workspace tab,
  'Kits'):
  18/18 tests; 279/279 overall green; typecheck + build pass.
  Session-18 research (Puppet Vendors 60/40 consignment norm,
  Ravelry in-store pattern-sales 60% designer/40% shop, Craftybase
  keystone COGS x 2 = wholesale / COGS x 4 = retail capacity test,
  Faire 15% new-retailer fee, MOQs $150-$200, COGS must include
  designer labour) finds kit economics is spreadsheet math — no
  tool models it. Library kit-economics.ts: buildKitCogs (yarn
  COGS from the shared yardage model + notions/packaging/labour
  /overhead), analyzeKitChannels (self-sell via shared platformNet
  seam, LYS consignment with processor fee off the top then the
  cited 60/40 split, keystone wholesale), keystone-capacity and
  convenience-premium sanity checks, consignmentClauseChecklist
  (6 protections incl. copyright of the pattern insert), and
  generateKitProposal (paste-ready shop outreach).
  UI: kit-economics-card.tsx, full input panel, 4 KPI cards,
  verdict badges, copy buttons.
- [CHK-016] c66bcf2 — Pattern Club & Magazine Lockout Planner (16th workspace
  tab, 'Pattern Club'):
  25/25 tests; 261/261 overall green; typecheck + build pass. Session-17
  research (Double The Stitches $7/$77 club pricing, Crochet Spot $10,
  Nicki's trials, Knitty $200-300 honorarium with ~3-month exclusive
  window, Farm & Fiber 12-month exclusivity, Laine 5 months,
  Sandi Rosner commissioned-vs-independent economics) finds club and
  magazine-lockout economics are handshake math — no tool models
  either. Library pattern-club-planner.ts: planClub (12-month member
  cohort model with churn, paid-equivalent annual members, gift-code
  fulfilment, production cost, channel fees, solo-baseline opportunity
  cost via the shared platformNet seam, steady-state break-even member
  count, go/review/skip verdict) and compareMagazine (fee minus
  designer-borne production vs income lost in the exclusive window,
  minimum worthwhile fee, effective hourly rate bar, cited window
  norms), plus generateClubFaq and generateMagazineResponse
  (copyright/AI-policy/payment protection questions).
  UI: pattern-club-card.tsx with Pattern Club / Magazine Offer inner
  tabs, paste-ready copy with Copy buttons.
- [CHK-015] 40f7225 — Translation & Bundle Revenue Planner (15th workspace tab):
  19/19 tests; 236/236 overall green; typecheck + build pass. Session-16
  research (Knit for Me 2020 coalition bundle: 56 patterns $27,
  Knitlingo $0.01/word, Finnished Knits repeat-section discount,
  Ravelry translations-as-derivative-works rule) finds both channels
  have zero tooling — economics live on blog posts and handshake
  emails. Library translation-bundle-planner.ts: planTranslations
  (per-language translator cost with repeat-section discount, added
  copies from uplift x demand share, payback months, 24-month worthIt
  flag, fastest-payback priority ranking) and planBundle (discount
  depth vs sum-of-parts, equal/perPattern splits, host fees, verdict
  against the designer's own solo window baseline — bundling only
  recommended when it beats going solo), plus generateBundlePitch.
  UI: translation-bundle-card.tsx as 'Trans & Bundle' tab after Trunk
  Show.
- [CHK-014] 45504af — Trunk Show & License Planner (14th workspace tab):
  20/20 tests; 217/217 overall green; typecheck + build pass. Session-15
  research (Ravelry in-store channel, cottage-license market norms,
  trunk-show LYS guides) finds the in-person channel has zero tooling —
  economics live in owner FAQs and handshake deals. Library
  trunk-show-planner.ts: analyzeTrunkShow (traffic x trunk days x
  try-on x conversion, shop split + channel fee, yarn attach income,
  time-costed samples at 30 yd/hr, go/review/skip verdict), dated
  task list, proposal letter + kick-off pitch; priceLicenses on the
  published 6-tier cottage-license market norms ($20–$750) with
  annualization, bulk rates, renewals; license terms + offer letter.
  UI: trunk-show-card.tsx as 'Trunk Show' tab after Launch.
- [CHK-013] aafa9c3 — Design Offer Evaluator (Deals tab extension): 18/18 tests;
  197/197 overall green; typecheck + build pass. Session-14 research
  (Who Pays Knitters, Making Stories royalties, Quince fairness norms,
  WPK flat-fee survey data, Stitchcraft Marketing exclusivity windows)
  finds designers evaluate yarn-company offers with no tools at all —
  deal-comparators are company-side, nobody models the offer from the
  designer's side. Library design-offer-evaluator.ts: evaluateOffer
  (5 offer types: flat fee / royalty / royalty+exclusivity /
  non-exclusive license / yarn support), 20 cited checks (DO-01..20)
  covering WPK accessory flat-fee avg, tech-edit/photo coverage,
  effective-rate vs designer's hourly rate, own-channel baseline,
  exclusivity window norms, rights retention; verdicts
  take/review/walk-away; generateOfferResponse (copy-ready counter).
  UI: DesignOfferSection in deals-tab-card.tsx, same conventions.
- [CHK-012] 7a58b82 — Launch Campaign Manager: 13th project-workspace tab built
  from session-13 research (Sister Mountain 3-phase release playbook,
  Ravelry Hot Right Now weekend-momentum mechanics, Stitchcraft
  Marketing KAL/make-along guides; competitors all offer undated
  checklists or generic newsletter advice — nobody converts the
  pattern's own data into a dated, paste-ready campaign). Library
  launch-campaign.ts: buildCampaign (10 dated milestones -21..+14 with
  yardage/size/price-band/URL/coupon variables), kalClues mode (4 weekly
  clues using the pattern's sections), buildReadinessGates (Publish
  checklist + tech-edit score + finished test knits), seasonal note
  (buyers knit 6-8 weeks ahead, sweaters launch Jul-Aug); 17/17 tests;
  179/179 overall green; typecheck + build pass.
- [CHK-011] 461bc0a — Pattern Finish & Care Guide: 12th project-workspace tab built
  from session-12 research (YarnSub, TKGA, Estako, Purl Soho, Provenance
  Craft; YarnSub is knitter-facing and never appears inside a designer's
  pattern — the substitution/blocking/wash/dry/store 'last page' is
  hand-written boilerplate, often fibre-wrong). Library
  pattern-finish-guide.ts: classifyFibreBehavior for 11 fibre classes
  (blend follows most delicate fibre), recommendBlocking (wet/steam/
  spritz, superwash pin-to-final warning), generateSubstituteLine with
  YarnSub ply table (metres/100g bands per CYC weight + swatch
  instruction), generateFinishGuide assembles the copy-ready pattern
  section; 18/18 tests; 162/162 overall green; typecheck + build pass.
- [CHK-010] 8021de8 — Self Tech-Edit Audit: 11th project-workspace tab built
  from session-11 research (Tech Editor Hub, Marina Skua, Stitch Reader;
  human tech editors bill $20–40/hr, ~4hrs/sweater; Size.ly/Fit Analytics are
  retail-fit widgets, KnitBird chart-only, nobody audits the designer's own
  graded table). 12 automated numbers checks (GA-01..12: gauge validity,
  progression monotonicity, stitch/row rounding vs repeats, zero counts,
  key-vs-type consistency, base-vs-CYC-standard drift, duplicates,
  single-size/single-section notes), editor-bill savings calculator
  ($/hr × ~2hrs), paste-ready pre-edit summary that shrinks the paid
  editor's scope to the prose pass; 23/23 tests; 144/144 overall green;
  typecheck + build pass.
- [CHK-009] a6bdfd7 — Test-Knit Programme Manager: 10th project-workspace tab built
  from session-10 research (A Bee in the Bonnet, Nest Creative Works, The Fairythorn;
  ~2 testers/size, 10-week lead, Google-Sheets-spreadsheet pain = our strength).
  Roster from graded sizes (2/slot default), yardage validation vs estimator
  (±15% bust-share), paste-ready tester call, pool-health dropout checks,
  timeline guidance; 18 lib tests; 121/121 overall green; typecheck + build pass.
- [CHK-008] a7f70b5 — Deal Comparator tab: yarn-company collaboration deal modelling
  (flat fee / royalty / exclusive) with take/counter/walk_away verdicts vs self-publish
  baseline + paste-ready terms response; session-9 research: Stitchcraft Marketing,
  Who Pays Knitters ~GBP60-100 flat fees, Making Stories ~30% net royalties.
- [CHK-007] 2e89a50 — Credibility Report: AI-era buyer-trust score (earned 0-100 from own grading
  math, yardage estimate, tech-edit checklist, notes depth) + paste-ready listing credibility
  statement in Publish tab; also fixed gaugeUsable rows ceiling.
- [CHK-001] a9cd394 — Yarn Requirement Estimator (CYC 7-weight model, tests 6/6)
- [CHK-002] 4c50cc7 — Pattern Income Planner (Ravelry/Etsy/Ribblr/Payhip fee model, breakeven, tests 9/9); repo set PRIVATE at user request
- [CHK-003] 23ad668 — Standing playbook committed (`playbook-schedule.md`)
- [CHK-004] 046c700 — Pattern Pricing Advisor (cited market bands $5–10/$12–18, underpricing flag, volume scenarios, 18/18 tests)
- Sessions research files: /home/ubuntu/research/competitors-session-1.md (grading tools + yarn ecosystem), competitors-session-2-marketplace-monetization.md (marketplace fees + income benchmarks)

- 2026-08-14 ~01:35 UTC — CHK-005 (0ef52e4): Pre-Publish Toolkit — 12-check readiness report + marketplace listing generator; 74/74 tests.

- 2026-08-14 ~02:05 UTC — CHK-006 (1ee91d7): Release Portfolio dashboard — catalogue launch ranking, same-weight bundle candidates (71% of sum-of-parts), monthly cadence benchmark; 85/85 tests.
