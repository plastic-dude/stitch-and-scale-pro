# QA Report — Cycle 28 · CHK-057 Pre-Order Campaign Lab + CHK-058 Listing Test Lab

**Author:** Manus QA (third staff) · **Date:** 2026-08-14
**Repo:** `plastic-dude/stitch-and-scale-pro` · **Reviewed range:** `e83b8e3` → `47e19bc` (CHK-057 code at `a46a413`, CHK-058 code + storage-lib debt at `7bff5e7`, playbook logs at `0d498da` and `47e19bc`)
**Files touched by CHK-057:** `src/lib/preorder-campaign-lab.ts` (~358 lines), `src/components/preorder-campaign-lab-card.tsx` (~450 lines), `src/lib/preorder-campaign-lab.test.ts` (+23 tests), `src/pages/project-workspace.tsx` (+9 lines for the 55th tab mount).
**Files touched by CHK-058:** `src/lib/listing-test-lab.ts` (317 lines), `src/components/listing-test-lab-card.tsx` (446 lines), `src/lib/listing-test-lab.test.ts` (+25 tests), `src/lib/storage-lib.ts` (issue #4 debt fix).
**Role:** QA (third staff). Nothing in `src/` was modified. All artifacts land on branch `qa/manus-2026-08-14-cycle28` only — `main` was not touched.

---

## 1. This report is addressed to the Reviewer

The Coder should not act on this report; the Reviewer should read it and decide whether to forward it to the Coder.

## 2. Baseline integrity

Before any browser work, the build baseline was re-verified against the fresh pull of `47e19bc`:

| Check | Result |
|---|---|
| `tsc --noEmit` | Clean, zero diagnostics |
| Vitest | **1065/1065 passing** across 58 test files (48 new lab tests: 23 Pre-Order + 25 Listing) |
| Production build (`vite build`) | OK, ~7.0 s |
| Dev server | Fresh restart after pull (`pnpm --filter stitch-and-scale dev --port 5173`), HTTP 200 |

The new engine tests cover campaign revenue/fees/profit/hours, every PC-01…PC-07 flag threshold, the four funding tiers, Miller's sample formula, detectability search, platform fee math, all LT-01…LT-06 flags, and the rewire/fix/test ladder — they pass, and the hand recomputes below confirm the engines are arithmetically correct, not just test-green.

## 3. Deep test — Pre-Order Campaign Lab (`preorder` tab, 55th)

### 3.1 Defaults (BEFORE any edits)

The card was opened on the sample Crew Neck Sweater project and every displayed number was recomputed by hand from the engine formulas and re-checked in Node.js against the actual module. All matched the UI exactly:

| Displayed value | Hand-computed | Match |
|---|---|---|
| Predicted orders (email · waitlist · social) | 57 (36 · 9 · 12) | Exact |
| Average revenue per order | $218.00 (0.6 × $198 + 0.4 × $248) | Exact |
| Net campaign revenue | $11,991 (gross $12,426 − 3.5% fees $434.91) | Exact |
| Cost per unit / safe cost | $110.70 / $143.91 (×1.3) | Exact |
| Buffer units / total units | 7 / 64 | Exact |
| Net profit | $2,360.85 | Exact |
| Margin | 19.0% | Exact |
| Knit + fulfill hours | 108.8 + 44.8 = 153.6 | Exact |
| $ per production hour | $15.37 | Exact |
| Platform fees | $435 | Exact |
| Minimum threshold / coverage | 40 units / 143% | Exact |

At defaults only PC-06 fires (fulfillment share 29% exceeds the 25% cap), which is correct: the campaign funds the fixed costs in 40 sales and covers them 143%. The verdict correctly lands in the fund tier:

> "Fund this drop: $2,361 profit at $15/production-hour clears the $15/hour floor, demand covers the threshold 143%…"

(See `qa-shots-cycle28/c28-01a-preorder-DEFAULT-before.png`.)

### 3.2 Flag and verdict sensitivity (AFTER edits)

**Scenario A — UNDERPAYS tier.** Edits: item price $248 → $189, campaign days 28 → 10, charge model deposit → upfront, buffer 12% → 5%. Expected cascade (recomputed independently): average revenue drops to $194.40, threshold rises to 45 units, coverage falls to 127%, buffer to 3 units, profit to $1,638.37, and the hourly rate to $11.38 — enough to cross the underpaid line while still funding. The UI fired exactly five flags — PC-02 (early-bird price is *above* full price: −5% gap), PC-03 (10-day campaign), PC-05 (70-day production lead with upfront charge), PC-06 (29% fulfillment share), and PC-07 (buffer below 10%) — and the verdict moved to "underpays work at $11/hour". All eight tiles matched the independent math to the cent. (See `qa-shots-cycle28/c28-01b-preorder-UNDERPAYS-edits.png`.)

**Scenario B — DON'T-FUND tier.** Edits: item price $170, early-bird $140, everything else at defaults. Expected: average revenue $152.00, threshold 57 units, coverage exactly 100% (so PC-01 stays quiet), net profit −$1,269.48. The UI showed exactly 57/100%, the −$1,269 loss, −14.7% margin, and −$8.26/hour, and the verdict moved to the do-not-fund tier with the correct price-floor guidance: the $140 early-bird is below the $144 safe-cost basis and should be raised to at least $164 (safe cost $143.91 rounded up with buffer — correct to the dollar). PC-06 was the only quiet-but-expected flag that stayed. (See `qa-shots-cycle28/c28-01c-preorder-DONTFUND-edits.png`.)

### 3.3 Phone view (375 px)

A dedicated mobile pass captured the tab at 375 px width. The card stacks into a single column, all three economics blocks and the flags/verdict render intact, and nothing overflows or clips. **PASS.** (See `qa-shots-cycle28/c28-03-phone-375-preorder.png`.)

## 4. Deep test — Listing Test Lab (`listing-test` tab, 56th)

### 4.1 Defaults (BEFORE any edits)

Engine hand-verified against the real TypeScript module via tsx (Evan Miller's two-proportion z-test, α 0.05, power 0.8):

| Displayed value | Hand-computed | Match |
|---|---|---|
| Required sample / variant | ≈3,825 visits (p₁ 2% → p₂ 3%) | Exact |
| Months to reach power | ≈191 (3,825 ÷ 20 visits/month split) | Exact |
| Smallest provable lift | ±53.4% (at 40 views/mo over a 2-month plan) | Exact |
| Net per sale (Ravelry $6) | $5.526 (display rounds to $6) | Exact |
| Baseline net / month | $4.42 (display $4) | Exact |
| Uplift gain / month | $2.21 (display $2) | Exact |
| Break-even | ≈45 months of uplift | Exact |
| Expected value (50% prior, peeking penalty none at 2 mo) | −$23.48 (display −$23) | Exact |

At defaults three flags fire correctly: LT-01 (a 1.0pt lift can never be proven at 40 views/month — only lifts of 53.4pt+ are provable), LT-05 (peeking risk: the required sample implies 192 months of running), and LT-06 (only 70% of Ravelry's 13 discovery slots used). The verdict correctly lands on "Fix the test" with the exact guidance text "prove a 53.4pt+ lift in 2 month(s)… or run the test long enough to power it (192 months)." (See `qa-shots-cycle28/c28-02a-listing-DEFAULT-before.png`.)

### 4.2 Flag and verdict sensitivity (AFTER edits)

**Scenario A — better traffic, still underpowered.** Edits: views 300/mo, hypothesized lift 0.05, duration 6 months, tags full (1.0), platform Etsy. Expected: sample ≈269, months to power ≈2, detectable floor ±28.6%, Etsy net per sale $5.13, baseline $31/mo, uplift +$77/mo, break-even ≈1 month, EV +$873. The UI matched every figure, LT-01 correctly stays on (5.0pt < 28.6pt), all other flags go quiet, and the listing-queue row updates live to "300 views/mo · Fix the test · EV $873/hr". (See `qa-shots-cycle28/c28-02b-listing-POWERED-edits.png`.)

**Scenario B — risky setup, all guards fire.** Edits: views back to 40, lift 0.01, duration 0.5 months, LoveCrafts, tags 70%, multi-variable checkbox on. Expected: detectable floor rises to ±20.1% (budget shrinks to 40 visits/variant at half a month), LoveCrafts nets $4.50, EV turns −$34.88 (the 0.3 early-peeking penalty applies below 1 month of planned duration — and the UI renders it exactly, −$35), break-even ≈56 months. The UI fired exactly five flags: LT-01, LT-02 (below one sales cycle), LT-03 (multiple variables), LT-05, LT-06 — the full guard matrix with LT-04 correctly absent (the variable is `photo`, not `price`). The queue row shows the correct EV per re-list hour (−$35/hr). (See `qa-shots-cycle28/c28-02c-listing-RISKY-edits.png`.)

LT-04 was additionally verified at engine level via tsx: it fires for `price` on Etsy/LoveCrafts and correctly stays quiet on Ravelry — the platform-conditioned guard works as documented.

### 4.3 Phone view (375 px)

The listing tab was captured at 375 px: single-column stack, queue section above the design form, all eight math tiles readable, warnings and verdict badge fully rendered, no clipping. **PASS.** (See `qa-shots-cycle28/c28-04-phone-375-listing.png`.)

### 4.4 Harness note (no app defect)

During testing, synthetic `change`-event dispatch on the "Changing several things at once" checkbox left the DOM checked while React's controlled state stayed false (LT-03 did not fire). A native Playwright click fixed it immediately and the flag behaved correctly — this is a QA-harness artifact, not an app bug. Recorded so future cycles use native clicks for this card's checkbox.

## 5. Defect found — ISSUE #41 (INFO)

Three information-grade copy/consistency defects in the new Listing Test Lab card, all confirmed in both source and the rendered UI:

> 1. **Missing space in the card intro:** the text renders as "…is this rewrite worth my hours?Enter one listing's real numbers…" — the two sentences run together.
> 2. **No "Verdict" label:** the verdict card shows only the colored badge ("Fix the test") and its note, while every other lab card in the app prefixes this section with a "Verdict" header — inconsistent with the established pattern and harder to scan.
> 3. **Mixed units for the same metric:** the "Smallest provable lift" tile displays "±53.4%" (the card's own formatter) while the verdict note renders the engine's string with point units — "prove a 53.4pt+ lift…". Two formatters, two unit conventions, for the same percentage figure.

Each is a one-line copy fix (the third is standardizing `fmtPct` in `src/lib/listing-test-lab.ts` on the card's percent formatter, or vice versa). No functional or mathematical defects were found: both engines are exact to the cent across all tiers tested, every flag fires at its documented threshold, and the new 48 tests exercise the same thresholds. CHK-057's card was clean — no defects at all.

## 6. Screenshot inventory (committed with this report)

| File | What it shows |
|---|---|
| `c28-01a-preorder-DEFAULT-before.png` | Pre-Order Lab at defaults: 57 orders, $218 avg, $11,991 net, $144 safe cost, $2,361 profit, $15.37/hr, 143% coverage, FUND verdict |
| `c28-01b-preorder-UNDERPAYS-edits.png` | After edits: five flags (PC-02/03/05/06/07), retiered UNDERPAYS verdict, $11/hr |
| `c28-01c-preorder-DONTFUND-edits.png` | After edits: DON'T-FUND tier, −$1,269 loss, price-floor guidance |
| `c28-02a-listing-DEFAULT-before.png` | Listing Lab at defaults: ≈3,825 sample, ≈191 mo, ±53.4%, EV −$23, flags LT-01/05/06 |
| `c28-02b-listing-POWERED-edits.png` | After edits: Etsy, 300 views/mo, EV +$873, only LT-01 remains |
| `c28-02c-listing-RISKY-edits.png` | After edits: LoveCrafts, 0.5-month plan, multi-variable — five flags, EV −$35 |
| `c28-03-phone-375-preorder.png` | 375 px mobile render of the Pre-Order Lab |
| `c28-04-phone-375-listing.png` | 375 px mobile render of the Listing Test Lab |

## 7. Verdict

**CHK-057 and CHK-058 both PASS for functionality and math.** Both engines are exact against independent hand recomputes across the fund/underpays/do-not-fund tiers and the rewire/fix/test ladder; all thirteen flags (PC-01…PC-07, LT-01…LT-06) fire at their documented thresholds; both tabs are phone-clean. One INFO issue (#41) is opened for the Reviewer regarding the Listing Test Lab copy and unit consistency. Previously opened issues were not re-opened; no unfixed regression was observed in surrounding tabs during navigation.
