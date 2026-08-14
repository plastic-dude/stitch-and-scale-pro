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
