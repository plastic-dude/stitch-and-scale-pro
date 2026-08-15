# QA Report — Cycle 47 (2026-08-15)

**Scope:** Commits since CHK-080 (`2d1f4ad`) — CHK-081 through CHK-094 (9 new-code commits: honest-founder landing, tab classification, Record QA batch, Design Ledger, Receipt Lab record-keeping research, Design Ledger implementation, count-drift fix, MAJOR reviewer fixes incl. fee registry, Payback Lab, Brag Cards tab + designer-grade redesign).

**Baseline at cycle start:** HEAD `d7b37f4` (CHK-094). tsc clean; vitest **1,694 / 1,694** across 88 files; production build green (8.20 s); dev server fresh HTTP 200. TAB_REGISTRY = 79 entries, TAB_GROUPS = 79 entries, integrity assertion + lockstep test passing. Landing STATS: "79 business labs in one workspace / 1,694+ verified tests / 13 currencies / 100% local-first".

**New QA-skill abilities folded into this cycle (7-pass methodology):** Pass 1 functional stress-tests, Pass 3 measured visual checks (computed styles / 8px grid / touch targets), Pass 7 dark-pattern scan, plus double-verification discipline on every finding.

## Pass summary

| Pass | Coverage this cycle | Result |
|---|---|---|
| P1 Functional | Payback Lab (defaults, seeded oracle comparison, hourly-rate change, what-if repricing), Brag Cards (3 templates × 6 styles, template switch), Receipt Lab monthly ledger, Intl Pricing Lab (EUR/CHF compound market) | 1 defect found (MAJOR), 1 false positive fully resolved |
| P2 Usability | Email capture, form empty-submits, tab switching latency, responsive 375 px | Clean |
| P3 Visual/measured | Computed padding, 8px-grid check, touch-target audit on the workspace | Polish leads only |
| P4 Accessibility | Keyboard-able tab list, focus ring on TabTrigger, labels present | Clean (spot-check) |
| P5 Performance | Headless-lab caveat: load sub-1s, no layout-shift visible | Clean |
| P7 Dark patterns | Landing copy audit, email capture flow | Clean — "No fee, no spam", honest-founder disclosure |

## 1. MAJOR defect found — Payback Lab ignores marketplace fees from real stored sales (#53)

**What happens:** Payback Lab reads persisted sale rows using **output-shape** fee fields (`platformFee`, `processingFee`, `taxAmount`, `shippingCost`), while the Receipt Lab UI persists fees in **input-shape** (`platformCommissionPct`, `processingPct` + flat, `taxPct`). For every real user with saved sales, `readLedger` in `payback-lab-card.tsx` sums `undefined ?? 0` for every fee — fees count as **$0**, net-per-sale is overstated by the fee amount, and the "recoup in N copies" number is optimistic.

**Evidence (verified twice, distinct seeds):**
- Seed A (output-shape fees): Net earned **$40.57**, recoup 5 copies — math correct, but this shape is never what the real UI stores.
- Seed B (real UI input-shape fees, 6.5 % platform + 2.9 % + $0.30 processing on $45 gross → fees $4.54/sale → net $40.46): Payback Lab shows **Net earned $90.00 / Avg net $45.00**, fees $0 — and reports "recoup in 5" when the true answer is **6** copies (⌈$205 / $40.46⌉).

![Payback Lab ignores fees from real stored sales](qa-shots-cycle47/c47-20-payback-ui-feeshape.png)

**Suggested fix direction for the Coder:** make Payback Lab fee-reading shape-agnostic — compute fees from the pct input fields when literal fields are absent (mirror `analyzeReceiptFees`), or normalize the stored row shape on read. The contract fragility is itself worth a code comment: two labs persist/consume the same entity in two different shapes.

## 2. False positive investigated and resolved — Brag Cards "$NaN in pattern sales"

Initial sweep showed the card preview rendering `$NaN` as the hero number (`c47-10`, `c47-10b`). Investigation traced the seed rows carrying **output-shape** fees through `analyzeReceiptFees`, which reads input-shape pct fields — `clamp(undefined)` propagates `NaN` into every monthly ledger row and the preview. With a **real UI-shaped** seed the same card renders correctly: "$45.00 in pattern sales / 2 sales · best month: $40.46 / 2 published designs · 2 sales · 50% profitable months".

![Brag Cards render correctly with real data](qa-shots-cycle47/c47-21-bragcards-real-feeshape.png)

**Conclusion:** not an app bug — an artifact of the QA seed. No issue opened for it, but the same shape contract exposed the real Payback Lab defect above, so it is documented here as a **maintenance-risk observation**: any future writer storing output-shape fees would silently break Brag Cards, Receipt Lab aggregates, and Payback Lab simultaneously. The fix for #53 should normalize the row shape in one place.

## 3. Feature verification — new labs work end-to-end

**Payback Lab** (CHK-091): every number independently verified against a hand-built oracle — Costless Cardigan invested $25.00 / deficit −$25.00 / ∞ copies; Mossy Yoke invested $180 / net $40.57 / recoup 5 / cost-copies 4 / months since last sale 2 / +10 % net → 5 copies, +20 % → 4 copies. Hourly-rate change to $20 recomputes time costs without touching net math; empty-ledger empty state renders cleanly.

![Payback Lab with seeded project data](qa-shots-cycle47/c47-07-payback-SEEDED-before.png)

![Payback Lab after hourly-rate change to $20](qa-shots-cycle47/c47-08-payback-RATE20-after.png)

![Payback Lab on a 375 px phone](qa-shots-cycle47/c47-15-payback-375px-phone.png)

**Brag Cards** (CHK-091): template switch (Sales / Income / other templates) re-renders the preview and caption; all 6 styles present; download button present; editorial style applies its cream palette and inset border; phone layout stacks cleanly.

![Brag Cards Sales template](qa-shots-cycle47/c47-11-bragcards-SALES-after.png)

![Brag Cards Editorial style](qa-shots-cycle47/c47-12-bragcards-EDITORIAL-after.png)

**Receipt Lab** monthly ledger with real fee data: Sales 2 / Revenue $90.00 / Refunds $45.00 / Profit (net of fees) $40.46 / 2 months — matches the oracle.

![Receipt Lab monthly ledger](qa-shots-cycle47/c47-22-receiptlab-real-feeshape.png)

## 4. Previously-open issues — status after this cycle

| Issue | Status in new code | QA verdict |
|---|---|---|
| #48 escheat dead state | Fix shipped earlier (cycle 44); no regression | Recommend Reviewer close (verified cycles 44+) |
| #49 fmtMoney dead currencies (CHF/SEK/NOK/DKK/BRL/MXN/JPY/INR) | CHK-084 added symbol coverage incl. MXN/NGN/KES/ZAR | Recommend Reviewer close (verified code + prior cycle) |
| #50 duplicate tab value "testknit" | CHK-087 retired the class structurally; TAB_REGISTRY lockstep test; `testknit`/`testknitlab`/`gaugefit` all distinct | Recommend Reviewer close (verified cycle 46, re-confirmed this cycle) |
| #51 fmtMoney dead compound key "EUR/CHF" | CHK-084: `fmtMoney` renders compound keys; visually verified: parity column shows `€9.00 / CHF 9.00`, GBP `$£7.75`, USD `$9.00` all with correct symbols | **VERIFIED FIXED — recommend Reviewer close** |
| #52 stale legend chips + 20 unclassified tabs | CHK-087/091: single TAB_REGISTRY drives triggers + panels via `.map`; `assertTabRegistryIntegrity` runtime + lockstep test; legend chips derive from registry; landing count pinned with drift-regression test | **VERIFIED FIXED — recommend Reviewer close** |

![Intl Pricing Lab compound key EUR/CHF verified](qa-shots-cycle47/c47-23-intlpricing-EURCHF.png)

## 5. Landing / funnel sweep (new 7-pass abilities)

The redesigned honest-founder landing (CHK-081/082) was audited under the new methodology. The hero, "Who built this?" disclosure ("I don't know how to knit"), founding-tester email capture, and STATS block all render correctly at 1280 px and 375 px. Email capture queues to the early-access store without navigation loss. Dark-pattern scan (Pass 7): no confirmshaming, no hidden costs, no forced continuity — the "No fee, no spam — just honest answers" copy is honest and verifiable against the code (queue writes to a single localStorage key, nothing posts anywhere). Console error count: 0 across all sweeps.

![Landing STATS block](qa-shots-cycle47/c47-03-landing-stats.png)

![Founding tester email capture](qa-shots-cycle47/c47-05-email-after.png)

![Landing on a 375 px phone](qa-shots-cycle47/c47-14-landing-375px-phone.png)

## 6. Measured visual audit (Pass 3)

Computed-style measurement of the workspace tabs: **25 sub-44 px touch targets** (legend count chips and lab chips — desktop-first design, low severity), **25 elements** with heights/paddings not on the 8 px grid (polish lead only). Legend chip counts now match reality (Design & Pattern · 12 / Sizing & Fit · 7 / Pricing & Income · 15 / Launch & Marketing · 13 / Selling Channels · 10 / Business & Community · 22 — sum 79 = TAB_REGISTRY).

## 7. Verification discipline note

Every defect claim in this report was verified by two independent methods (distinct seeds or distinct read paths). The $NaN finding was initially classified as a defect, downgraded to a seed artifact after the third independent probe, and converted into the #53 maintenance observation only after the real Payback Lab defect was separately confirmed. Diagnostic test files were added temporarily under `src/__tests__/` during investigation and **deleted before delivery** — no QA artifacts left in `src/`.
