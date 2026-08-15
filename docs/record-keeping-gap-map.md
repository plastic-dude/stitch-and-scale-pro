# Record-Keeping as a Pain Point — Deep Research & Gap Map

Prepared for CHK-085 research cycle · Second, deeper pass treating record-keeping not as a feature wishlist but as a standalone pain point with real costs attached. Sources below.

## 1. The code audit (what we have today)

A full audit of all 78 workspace tabs and every storage seam confirms an uncomfortable fact: the Receipt Lab (CHK-083) is the **only** place in the app where anything is genuinely *recorded* rather than merely *calculated*. Every other lab persists exactly one thing — its current form state via `projectStorage<T>` — with no history, no archive, and no cross-pattern view.

| Record type | Status today | Where |
| --- | --- | --- |
| Sales ledger (sales, refunds, quotes, monthly P&L) | **Present**, per-pattern only | Receipt Lab |
| Pattern design data | Present as current state only — no history, no status life-cycle | Pattern project model |
| Pricing & income numbers | Calculated, never saved as history | Pricing / Income tabs |
| Sample cost | Calculated once, not persisted as a record | Sample & Launch Lab |
| Magazine submissions | Form inputs only; lost when the form closes | Magazine Lab |
| Wholesale pricing | Live pricelist only; no order history, no payment status | Wholesale Lab / Pricelist |
| Test-knit rounds | Inputs persist; no round archive or outcomes | Test Knit Lab |

## 2. The pain, in designers' own words

The deeper research surfaced first-person evidence that this is a chronic, money-leaking problem, not an organizational nicety.

**Margin blindness is the industry norm.** A designer shared her 2025 income report: $47k gross, roughly $43k in expenses, and just over **$3k kept for herself** — her assistant earned more than she did [1]. A four-year self-published designer in the same thread put it bluntly: "The amount of work needed to design, grade, knit, model, photograph, test knit, and promote a pattern is huge... The overwhelming majority of designers are not making minimum wage," having made roughly £3,000 profit across four years including two loss years [1]. Independent industry data puts the bottom decile of pattern earners at as little as $201 in pattern sales in a month [2]. The pattern is clear: most designers **do not know whether a given design earns or loses money**, because no one tracks the design's costs against its sales. That is precisely the margin-visibility gap the Design Ledger is built to close — and the $47k/$43k story is the case study: a ledger plus expense log would have surfaced that the margins were collapsing by month two, not at tax time.

**Cost fog per design.** The central bookkeeping question for pattern designers, per The Yarny Bookkeeper's designer training, is whether sample materials are inventory or expense, whether designer time counts, and how many pattern copies must sell to break even [3]. These questions are unanswerable without per-design cost records — which no tool in the category keeps, because no tool sees the sample, the tech edit, and the test-knit fees alongside the pattern itself.

**Tax paralysis.** The first-person phrasing on tax forums is striking: "self-employed with zero records/receipts. Paralyzed" [4]. In the US, three consecutive years of hobby-classified losses can trigger retroactive reclassification of prior years if no records exist [5]. Designers keep receipts on the Yarny Bookkeeper's advice [3], but "keeping receipts" with no system means shoeboxes. A ledger with an accountant-ready export converts the shoebox problem into a download.

**The spreadsheet graveyard.** The most repeated community pattern: someone builds a spreadsheet and abandons it. "I kinda created a basic one but no special formulas and haven't had a chance to try to keep up with it :(" [6]. Craft-fair sellers "use Square app, receipt books, or notebooks" [7]. A Ravelry user built a Google Sheet inventory "because Ravelry's 'tools' function is confusing and not as thorough as I would like" [8]. Ravelry, the category's dominant platform, is weak here — it tracks projects and stash, but not money, not samples in transit, not submissions.

**Wholesale accounts receivable is a documented nightmare.** A seller with 40 wholesale retailers on net-30 described chasing payments with a spreadsheet and manual reminder emails as "becoming a nightmare as we grow," finding the only in-platform app at $150/month and everything else requiring a separate fintech platform [9]. The consensus answer was exactly the awkward-middle observation that fits our users: "you're at that awkward middle stage where a spreadsheet is painful but most B2B apps are overpriced for your volume" [9]. Our Receipt Lab already issues the invoice surface; a small wholesale order log with status and overdue flags lands squarely in that gap.

**Sample shrinkage is invisible.** Trunk shows move a designer's physical sample garments from shop to shop for one-to-two-week tours [10]. Samples are loaned, shown, and occasionally sold at events — with no record of where each garment is. Nobody tracks sample location in this category; the record simply does not exist.

## 3. What the category benchmark covers (and does not)

Craftybase/Stocksmith, the handmade-category leader, covers the *maker* side well — materials inventory, recipe costing, automatic COGS, multi-channel order sync [11] — but none of the *designer* side: design status life-cycles, submission pipelines, sample tours, or test-knit round history. Conversely, Ravelry dominates projects and stash but not money. The seam between "the design" and "the business of the design" is where every incumbent leaves a gap. That seam is our home turf, because the grading engine already knows the design.

## 4. The pain chain and where the app attacks each link

| # | Pain | Cost if ignored | App attack (status) |
| --- | --- | --- | --- |
| 1 | Margin blindness per design | $43k expenses on $47k gross discovered a year late [1] | Pricing labs (built) + **Design Ledger** (proposed CHK-086) |
| 2 | Design cost fog (sample, edit, test-knit fees) | Break-even unknown; undercharging [3] | Design Ledger expense log, linked per pattern |
| 3 | No sales history across patterns | Cannot see which designs actually earn | Receipt Lab (built) → ledger rollup (proposed) |
| 4 | Tax-season scrambling | Penalties, hobby reclassification [4] [5] | Ledger export for accountant |
| 5 | Wholesale AR chasing | Cash trapped in unpaid net-30 [9] | Receipt Lab quotes/invoices + order status log |
| 6 | Sample shrinkage (trunk shows, loans) | Samples lost, unrecovered value | Sample tracker |
| 7 | Submission pipeline forgotten | Missed deadlines, dead calls [12] | Persisted submissions with deadlines |
| 8 | Spreadsheet fatigue | Abandoned tracking [6] | Local-first low-friction logging (already our pattern) |

## 5. Recommendation (unchanged, now with evidence)

The anchor build remains the **Design Ledger** — a central record room with design status life-cycle, per-design sales rollup, expense/COGS log feeding break-even math, and a monthly P&L across the pattern. The evidence above adds three load-bearing details for its design: (a) the pitch line is the $47k/$43k story, not "stay organized"; (b) the export must be accountant-ready, because "paralyzed at tax time" is the most emotionally charged failure mode in the research; (c) low-friction beats completeness — the abandoned-spreadsheet pattern argues for the fewest-possible-fields default row, consistent with the Receipt Lab's already-proven entry flow.

Follow-on tabs in evidence order: expense log (folded into the ledger engine), sample tracker, submission pipeline, wholesale order log. Customer list, test-knit round archive, and yarn inventory come after.

## References

[1]: https://www.reddit.com/r/craftsnark/comments/1qtdbuo/new_wave_knitting_annual_knitting_income_breakdown/ "r/craftsnark — New Wave Knitting annual income breakdown discussion (VictoriaKnits 4-year profit account)"
[2]: https://www.mediaperuana.com/blog1/designerincome "MediaPeruana — What are Knitting Pattern Designers Actually Earning?"
[3]: https://yarnybookkeeper.com/bookkeeping-for-designers/ "The Yarny Bookkeeper — Bookkeeping for Designers training"
[4]: https://www.reddit.com/r/tax/comments/gddz5w/selfemployed_with_zero_recordsreceipts_paralyzed/ "r/tax — self-employed with zero records/receipts, paralyzed"
[5]: https://www.reddit.com/r/tax/comments/1p9q6dd/can_a_tiny_side_business_lose_money_indefinitely/ "r/tax — hobby loss rule and retroactive reclassification"
[6]: https://www.reddit.com/r/crochet/comments/uwatzw/sellersentrepreneurs_any_spreadsheet_templates/ "r/crochet — sellers' spreadsheet template thread (abandonment comment)"
[7]: https://www.facebook.com/groups/craftyfungroup/posts/733222204016740/ "Facebook Crafty Fun Group — craft fair sales tracking practices"
[8]: https://www.reddit.com/r/knitting/comments/190a7pw/my_inventory_how_do_you_keep_track/ "r/knitting — inventory tracking thread (Ravelry tools criticism)"
[9]: https://www.reddit.com/r/shopify/comments/1tgo1ml/frustrated_how_do_you_track_which_wholesale/ "r/shopify — wholesale AR tracking pain (net-30, $150/mo app)"
[10]: https://www.crazyforewe.com/blogs/crazy-for-ewe/what-is-a-trunk-show-for-knitting-and-is-it-worth-attending "Crazy for Ewe — what a trunk show is for knitting"
[11]: https://craftybase.com/features/ "Craftybase — inventory and costing features for makers"
[12]: https://www.sistermountain.com/blog/knitting-pattern-design-submissions "Sister Mountain — how to submit knitting pattern designs"
