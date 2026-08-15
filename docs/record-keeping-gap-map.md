# Record-Keeping Gap Map — "Do we have a record space for everything?"

Prepared for CHK-085 research cycle · Sources: code audit of all 78 labs (Aug 2026), Purl & Publish financial tracking playbook, The Yarny Bookkeeper designer bookkeeping training, Craftybase/Stocksmith feature benchmark, industry submission-practice guides (Sister Mountain, Knitty, Laine, Sandi Rosner).

## 1. What the app currently records

The honest answer is **no — we do not have a record space for everything**. The Receipt Lab (CHK-083) was the first and so far only place in the entire app where anything is genuinely *recorded* rather than merely *calculated*. A code audit of every lab and every storage seam confirms the picture below.

| Record type | Status today | Where |
| --- | --- | --- |
| Sales ledger (sales, refunds, quotes, monthly P&L) | **Present** — but per-pattern only | Receipt Lab (`SavedSale[]`, `MonthlyLedgerRow[]`) |
| Pattern design data (measurements, grading table, yarn, notes) | **Present** as current state only — no history, no archive view | Pattern project model + Sections/Notes/Yarn tabs |
| Pricing & income numbers | Calculated, never saved as history | Pricing/Income tabs (single live state) |
| Sample cost calculation | Calculated once, not persisted as a record | Sample & Launch Lab |
| Magazine submission inputs | Form only; nothing persisted when sent | Magazine Lab |
| Wholesale pricing | Live pricelist only; no order history | Wholesale Lab / Wholesale Pricelist |
| Test-knit rounds | Inputs persist; no round archive or outcomes log | Test Knit Lab |

The structural reason: 77 of the 78 labs persist exactly one thing — the **current input state** of their form via `projectStorage<T>(key, projectId)`. There is no multi-entry record anywhere except the Receipt Lab's ledger, no cross-pattern rollup anywhere at all, and nothing that behaves like a business archive.

## 2. What a professional knitwear business actually tracks

Independent designers running this as a business keep nine distinct kinds of record, per the financial-tracking playbooks (Purl & Publish, Yarny Bookkeeper) and the submission-practice literature:

1. **Design portfolio** — every design with a status life-cycle: concept → drafted → sampled → tech-edited → published → licensed → discontinued. Designers maintain this in spreadsheets today.
2. **Sales ledger** — per-pattern and overall, split by channel (Ravelry / Etsy / own site / custom), because each channel has different fee structures.
3. **Expense / COGS log** — yarn and materials for samples, tech editing and test-knit fees, photography, platform fees, marketing. Designers need this for break-even math per pattern ("how many copies to cover the sample?") and for tax season.
4. **Sample tracker** — samples made, samples loaned out to trunk shows, samples sold; the Yarny Bookkeeper explicitly lists trunk-show sample tracking as its own bookkeeping problem.
5. **Submission pipeline** — designers work several simultaneous submissions to magazines and yarn companies, each with its own call, deadline, requirements (swatch, sketch, 1-page PDF), and outcome. Sandi Rosner and Sister Mountain both describe spreadsheet pipelines as the norm.
6. **Customer list** — repeat buyers and custom-order clients, especially since custom work runs through DMs → WhatsApp (per our own CHK-083 research).
7. **Wholesale order log** — orders against the wholesale pricelist, net-30 records, payment status.
8. **Yarn / material inventory** — what is in the stash, what was spent per pattern.
9. **Test-knit round history** — past rounds, tester rosters, fix logs, re-release versions.

The benchmark product in the handmade category, Craftybase/Stocksmith, covers #2, #3 and #8 well (materials inventory, recipe costing, automatic COGS, multi-channel order sync) but covers **none** of the knit-designer-specific records (#1, #4, #5, #9). That asymmetry is our opening: no tool combines the designer-side records with the maker-side records.

## 3. The gap and the recommended build

The biggest single gap is not any individual log — it is the absence of a **central record space** that ties the pattern (the asset) to the money (the result). Right now a designer's sales live in the Receipt Lab of one pattern, their samples are invisible, their submissions are forgotten the moment the form closes, and there is no page that answers "how is my business doing overall?"

Recommended sequence, in order of value-to-effort:

| Priority | Build | Fills records | Why first |
| --- | --- | --- | --- |
| 1 | **Design Ledger tab** — a central record room: design status tracker (concept → published → archived), per-design sales rollup feeding from every Receipt Lab, design cost rollup, and a running monthly P&L across the whole pattern | #1, #2, #3 | Highest frequency of use; turns the app from "calculator collection" into a business hub; local-first, one storage seam, no new infrastructure |
| 2 | **Expense & COGS log** (rows: date, category, amount, linked pattern) — can be folded into #1's engine | #3 | Tax-season proof; feeds per-pattern break-even |
| 3 | **Sample & trunk-show tracker** — sample status, location (home / loaned / show / sold) | #4 | Yarny Bookkeeper-identified pain; small and differentiating |
| 4 | **Submission pipeline tracker** — persisted submissions with status, deadline, outcome, payment | #5 | Magazine Lab already computes the math; persisting the pipeline is a natural extension |
| 5 | Customer list, wholesale order log, test-knit round archive, yarn inventory | #6–#9 | Sequel tabs once the core ledger exists |

The Design Ledger (#1) is the anchor: it is the "record space for everything" the product needs today, it reuses the Receipt Lab engine already built, and every later record tab plugs into it.

## 4. Honesty notes

- Two caveats on the audit: the audit covers the workspace's record structures; core storage seam (`storage-lib.ts`) keeps a 20-entry backup log, which is infrastructure bookkeeping, not business records.
- This is business-records research, not financial advice; the designer-facing copy should stay tooling-flavored ("see your numbers") not advisory-flavored.
