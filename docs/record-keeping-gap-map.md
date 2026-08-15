# Record-Keeping as a Pain Point — Complete Research & Gap Map

Prepared for the CHK-085 research cycle · Three passes: (1) code audit of the app, (2) deep pain evidence, (3) wide pass covering commissions and drops, platform fragility, and why prior tools failed. Nineteen cited sources in total.

## 1. What we have today

A full audit of all 78 workspace tabs and every storage seam: the Receipt Lab (CHK-083) is the **only** place in the app where anything is genuinely *recorded* rather than *calculated*. Every other lab persists exactly one thing — its current form state via `projectStorage<T>` — with no history, no archive, and no cross-pattern view.

| Record type | Status today | Where |
| --- | --- | --- |
| Sales ledger (sales, refunds, quotes, monthly P&L) | **Present**, per-pattern only | Receipt Lab |
| Pattern design data | Current state only — no history, no status life-cycle | Pattern project model |
| Pricing & income numbers | Calculated, never saved as history | Pricing / Income tabs |
| Sample cost | Calculated once, not persisted as a record | Sample & Launch Lab |
| Magazine submissions | Form inputs only; lost when the form closes | Magazine Lab |
| Wholesale pricing | Live pricelist only; no order history, no payment status | Wholesale Lab / Pricelist |
| Test-knit rounds | Inputs persist; no round archive or outcomes | Test Knit Lab |

## 2. The pain, in designers' own words

**Margin blindness is the industry norm.** A designer shared her 2025 income report: $47k gross, roughly $43k in expenses, and just over **$3k kept for herself** — her assistant earned more than she did [1]. A four-year self-published designer in the same thread: "The amount of work needed to design, grade, knit, model, photograph, test knit, and promote a pattern is huge... The overwhelming majority of designers are not making minimum wage," having made roughly £3,000 profit across four years including two loss years [1]. Independent industry data puts the *average* Ravelry designer's pattern sales at just **$203**, with 72% of designers earning under $50, and only 93 designers in the entire dataset selling $3,000+ [13]. The overwhelming majority are hobby-level earners who cannot see whether a single design earns or loses money — because no records exist tying a design's costs to its sales. A ledger plus expense log would have surfaced the collapsing margins of the $47k/$43k story by month two, not at tax time.

**Cost fog per design.** The central bookkeeping question for pattern designers, per The Yarny Bookkeeper's designer training, is whether sample materials are inventory or expense, whether designer time counts, and how many pattern copies must sell to break even [3]. These are unanswerable without per-design cost records, which no tool in the category keeps because no tool sees the sample, the tech edit, and the test-knit fees alongside the pattern.

**The spreadsheet graveyard.** The most repeated community pattern: someone builds a spreadsheet and abandons it. "I kinda created a basic one but no special formulas and haven't had a chance to try to keep up with it :(" [6]. Craft-fair sellers "use Square app, receipt books, or notebooks" [7]. A Ravelry user built a Google Sheet inventory "because Ravelry's 'tools' function is confusing and not as thorough as I would like" [8]. One-of-one drop designers describe "a massive stockpile of knits in my room" with no inventory system [14].

**Tax paralysis.** The first-person phrasing on tax forums is striking: "self-employed with zero records/receipts. Paralyzed" [4]. In the US, three consecutive years of hobby-classified losses can trigger retroactive reclassification of prior years if no records exist [5].

**Wholesale accounts receivable is a documented nightmare.** A seller with 40 wholesale retailers on net-30 described chasing payments with a spreadsheet and manual reminder emails as "becoming a nightmare as we grow," finding the only in-platform app at $150/month and everything else requiring a separate fintech platform [9]. The consensus: "you're at that awkward middle stage where a spreadsheet is painful but most B2B apps are overpriced for your volume" [9]. Wholesale discipline requires minimum opening orders ($150–200 first, lower for reorders) and repeat-buyer tracking — "reorders can become the backbone of your business" [15] — yet no knit-designer tool tracks reorder status.

**Sample shrinkage is invisible.** Trunk shows move a designer's physical sample garments shop-to-shop on one-to-two-week tours [10]; samples are loaned, shown, and occasionally sold at events, with no record of where any garment is.

**Commissions and drops add their own records.** Designers run four business models — pattern sales, custom commissions, seasonal drops of one-of-ones, or combinations [14]. Commissions are time-limited custom orders needing a record of deposit, customer measurements, delivery date, and final price — the Receipt Lab's quote flow is already the front end of this. Drop designers accumulate physical stock with no tracking at all [14].

## 3. Why prior tools failed — and what that teaches us

**Platform fragility makes local-first a feature, not a default.** Designer Liz Corke documents designers withdrawing from Ravelry overnight during the 2020 controversy, scrambling to cover monthly costs through LoveCrafts and Payhip [12]. Making Things, Craftsy, and Patternfish — three platforms designers sold patterns on — all disappeared. When a platform dies, designers lose their data with it. Our IndexedDB local-first architecture is the direct answer: the designer owns the records, always. This should be stated explicitly in marketing copy.

**Subscription SaaS has a trust deficit in the craft space.** In the Craftybase evaluation thread, the recurring objection is: "I wouldn't want my financial data stored on their online servers, only to have them suddenly go out of business... I don't like software that you have to rent instead of buying" [16]. Users also found Craftybase "WAY confusing" and its pricing feature "the absolute backwards way" — pricing must be market-driven, with COGS for analysis only [16]. This validates our architecture: costs feed *analysis* (the ledger), market feeds *pricing* (the pricing labs), and everything stays local. It also validates a free local-first tier: Square's free reports suffice for small sellers because "free reports beat expensive software" [16], so the wedge is free-and-simple with paid tiers for power features.

**Ravelry is the giant with a business blind spot.** It dominates projects, stash, and pattern sales (3.5% commission plus PayPal fees [17]), but designers criticize its business tools explicitly [8], and it holds zero money-side records. The seam between "the design" and "the business of the design" is where every incumbent leaves a gap — and only a tool that already knows the pattern can fill it.

## 4. The pain chain and where the app attacks each link

| # | Pain | Cost if ignored | App attack (status) |
| --- | --- | --- | --- |
| 1 | Margin blindness per design | $43k expenses on $47k gross discovered a year late [1] [13] | Pricing labs (built) + **Design Ledger** (proposed CHK-086) |
| 2 | Design cost fog (sample, edit, test-knit fees) | Break-even unknown; undercharging [3] | Design Ledger expense log, linked per pattern |
| 3 | No sales history across patterns | Cannot see which designs actually earn | Receipt Lab (built) → ledger rollup (proposed) |
| 4 | Tax-season scrambling | Penalties, hobby reclassification [4] [5] | Ledger, accountant-ready export |
| 5 | Wholesale AR chasing | Cash trapped in unpaid net-30 [9] | Receipt Lab quotes/invoices + order status log |
| 6 | Sample shrinkage (trunk shows, loans) | Samples lost, unrecovered value [10] | Sample tracker |
| 7 | Submission pipeline forgotten | Missed deadlines, dead calls [18] | Persisted submissions with deadlines |
| 8 | Commission order chaos | Deposits, measurements, dates lost in DMs | Receipt Lab quote flow → commission tracker |
| 9 | Drop-stock invisibility | "Massive stockpile," no counts [14] | Later sequel tab (after ledger) |
| 10 | Platform fragility | Data dies with Ravelry/Craftsy/Patternfish [12] | Local-first IndexedDB (already our architecture) |
| 11 | Spreadsheet fatigue | Abandoned tracking [6] | Local-first low-friction logging (already our pattern) |

## 5. Is the research complete?

The picture is now complete at the *problem-definition* level: we have evidence across all eleven pain links — financial, operational, tax, trust, and platform — in designers' own words, with the income-distribution reality ($203 average, 72% under $50 [13]) that should shape the pricing tiers: free local-first for the hobby majority, paid tiers for the thin slice crossing ~$3,000/year. What cannot be solved with more research is execution detail — the exact field names, default views, and workflows testers actually reach for. That belongs to founding-tester feedback once the Design Ledger ships, not to another research pass. Perfectionism at the research layer has reached diminishing returns; the next perfectionism pass belongs to the *product*, where it produces real evidence.

**Recommendation holds**: build the **Design Ledger** as CHK-086 — design status life-cycle, per-design sales rollup, expense/COGS log feeding break-even, monthly P&L, accountant-ready export, fewest-possible-fields default row — followed by expense log integration, sample tracker, submission pipeline, and wholesale order log in that evidence order.

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
[12]: https://www.lizcorke.com/2020/07/31/disentangling-from-ravelry-as-a-designer/ "Liz Corke — Disentangling from Ravelry as a designer (platform fragility)"
[13]: https://www.mediaperuana.com/blog1/noonesgettingrich "MediaPeruana — No One's Getting Rich: Pattern Design ($203 average, 72% under $50)"
[14]: https://naptime.substack.com/p/tips-on-how-to-start-a-knitting-business "Kayla's Substack — starting a knitting business (interviews: Le Pull, Sea the Moonlight, Loupy Studio)"
[15]: https://craftybase.com/blog/pricing-handmade-products-wholesale "Craftybase — wholesale pricing, minimum orders and reorders"
[16]: https://community.ceramicartsdaily.org/topic/21377-has-anyone-tried-craftybase-for-accounting-and-inventory-software/ "Ceramic Arts Daily — Craftybase evaluation thread (trust, rent-vs-buy, COGS-pricing criticism)"
[17]: https://www.reddit.com/r/knitting/comments/1jz65ar/question_about_buying_patterns/ "r/knitting — Ravelry fees: 3.5% + PayPal 2.9%+$0.30"
[18]: https://www.sistermountain.com/blog/knitting-pattern-design-submissions "Sister Mountain — how to submit knitting pattern designs"
