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
