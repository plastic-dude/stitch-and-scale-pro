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
