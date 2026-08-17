# QA Cycle 50 — Visual Review Report

**Repo:** `plastic-dude/stitch-and-scale-pro` · **Artifact:** `artifacts/stitch-and-scale`
**Commit reviewed:** `b7781f144c0e76a9d9d679a3716ad743c6c82316` (CHK-098 i18n + branding)
**Cycle date:** 2026-08-17 · **QA:** Manus QA (`manus-qa@qa.local`)
**Branch:** `qa/manus-2026-08-14-cycle39` (report at `qa/cycle50/`)

> **This report is addressed to the Reviewer.** The Coder should not act on this report directly; it exists for the Reviewer to read, validate, and translate into review comments or fixes. The QA role never touches `src/` code.

## 1. What this cycle was

Cycle 50 was requested as a genuine **visual review pass**: not just clicking through panels, but actually looking at them — verifying that controls sit in the right place, values sit next to the correct labels, sections appear in the right order, and the phone-sized viewport renders the way a real iPhone user would see it. Every capture was taken from a real iPhone 14 portrait viewport (390×844, device scale factor 3, touch pointer events), with dark-mode spot checks on the same panels. This is honest disclosure: this cycle did **not** follow a new commit (origin/main is still `b7781f1`), so the deliverable is the visual verdict on the current build, not a change-triggered regression check.

## 2. Baseline

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | Clean, no errors |
| Vitest | **1,694 / 1,694 tests passing** (88 files) |
| Vite build | 8.02 s, succeeds |
| Dev server | HTTP 200 at `localhost:5173` |

Baseline was run after every seed change and before this report was written.

## 3. The big story: two $NaN sightings investigated to conclusion — NOT a product defect

In the seeded money-panel pass, Receipt Lab's monthly ledger showed `Revenue $NaN, Profit $NaN` and Brag Cards showed `$NaN in pattern sales`. I investigated this down to the code and resolved it honestly.

**Root cause, first sighting:** `sumItems()` in `lib/receipt-lab.ts` reads `it.unitPrice` per item, but my QA seed used the field name `price`. `clamp(undefined)` → `NaN` → every downstream figure (subtotal, gross, fees, net) became `NaN`. **Root cause, second sighting:** after fixing to `unitPrice`, Revenue came back correctly at `$90.00`, but Profit stayed `$NaN`. Digging in showed `analyzeReceiptFees` reads `f.shippingCost` and my seed omitted that field entirely — a missing field → `NaN` net-after-fees → `NaN` profit, while Revenue (which uses `grossTotal`) stayed correct.

**The critical question:** could a real user ever hit this? The answer is no with the current UI. `receipt-lab-card.tsx` builds its fees state with **all six fields including `shippingCost`** (state + memo at lines 109 and 140–149), and `saveSale()` persists that complete state object. A real saved row always carries `shippingCost`, so `analyzeReceiptFees` always computes clean numbers. Both $NaN sightings were **QA seed artifacts** (wrong field name, then a missing field), not bugs the app itself can produce. I verified this twice, independently:

1. A pinned vitest on the *correctly shaped* row (`unitPrice` items, complete fees) computes `subtotal 45 → netAfterFees 39.11` and monthly totals `revenue 90, feesPaid 11.78, profit 78.22` — all clean, no NaN.
2. Re-seeding the live app with a correctly shaped seed rendered exactly those numbers: Receipt Lab monthly ledger **Sales 2 / Revenue $90.00 / Profit (net fees) $78.22 / Months 1**, and Brag Cards hero **$90.00 · 2 sales · best month $78.22 · 100% profitable months**.

**Robustness lead for the Reviewer (not an observed bug):** `analyzeReceiptFees` never defensively defaults `f.shippingCost`. If legacy data or an external import ever produced a row without it, the panel would render Profit `$NaN` exactly as I observed. A one-line `f.shippingCost ?? 0` would make the aggregation immune. I am not claiming a defect — I am asking the Reviewer to weigh a defensive default.

## 4. New finding: Take-Rate War Lab — unit suffix overlaps the input value (iPhone width)

While genuinely looking at the Take-Rate panels, I found a real visual defect in the per-channel cards ("Units / month", "Avg price", "Offsite-Ads share"):

![Take-Rate channel cards — suffix overlapping input values, iPhone 14 portrait, light mode](qa-shots-cycle50-visual/05-channelcards-zoom.png)

The value digit renders **underneath** the absolutely-positioned suffix: Etsy "Units / month" reads like a struck-through "4/mo", Ravelry "2" collides with "/mo", and the "Avg price" fields render "6 ,$"/"7 ,$"/"8 ,$". The cause is in `components/marketplace-takerate-lab-card.tsx` — the `NumField` helper (lines 43–66) places its suffix `<span>` absolutely at `right-3 top-1/2 -translate-y-1/2`, directly over the Input's value text; the `pr-8` padding on the Input reserves space but the number-input's rendered text still extends under the suffix on the 390px width.

This reproduces **in both light and dark mode** on iPhone 14 portrait (see `dark-takerate-scroll-2.png` — all six channel cards show "4/mo", "2/mo", "1(/mo", "8/mo" overlays). The inputs still function; this is a visual-only defect, but at iPhone width a user reads every channel card as garbled. I believe this deserves a new issue — the Reviewer should confirm and the Coder fix it (e.g., render the suffix as a flex sibling rather than an absolute overlay, or increase right padding). This defect was **not** present in the portfolio-summary cards or the fee-leak leaderboard, which render cleanly.

## 5. Re-confirmed open issues (still unfixed at `b7781f1`)

**Issue #53 — Payback Lab fee-shape defect (third independent reproduction).** Seeded with two real-shape Etsy sales ($45.00 each, 9.5% commission + 2.9% + $0.30 processing — the exact input-shape fields the UI persists), the Payback Lab reads output-shape fields that never exist on persisted rows. Result on iPhone 14 portrait, light mode:

![Payback Lab seeded — fees ignored, net $0.00, needs ∞ sales](qa-shots-cycle50-visual/payback.png)

> Copies sold: 2 · Net earned: $0.00 · Avg net / sale: $0.00 · "Needs ∞ net sales at this average" · "No net on sales yet" · Still in deficit −$36.00 · Cost-only copies: ∞

The correct values are **net per sale $39.12, total net $78.24, patterns paid back 1/1**. The same defect was reproducible in cycle 47 and cycle 49 — the code at `payback-lab-card.tsx` has not changed. See the empty-state baseline capture for comparison (`09-payback-results.png` — correct empty-state layout when no data exists).

**Issue #54 — Take-Rate Lab duplicate React keys (TR-03/TR-05).** Confirmed reproducible again across the iPhone coverage in cycle 49; still present at this commit. No behavior change noted.

## 6. What passes (visually verified)

| Panel / View | Verdict | Notes |
|---|---|---|
| Take-Rate Lab — numbers | **PASS** | Revenue $824.00, fees $105.08, net $718.92, take 12.8% — hand-verified arithmetic; fee-leak leaderboard internally consistent; color coding correct (red/orange bad takes, green low takes) |
| Take-Rate Lab — dark mode | **PASS** (except §4 defect) | Identical numbers in dark; cards and leaderboard render with correct contrast (`dark-takerate-scroll-3.png`) |
| Receipt Lab — form + ledger | **PASS** (with correctly shaped data) | Monthly ledger grid: labels above values, 5-column layout, Sales 2 / Revenue $90.00 / Profit $78.22 (`receipt.png`) |
| Brag Cards | **PASS** | Navy card style, hero $90.00, accent circles, style chips all render; `$90.00 in pattern sales` correct (`bragcards.png`) |
| Preview / Grading Table | **PASS** | Body/Sleeve/Neckline sections, sts in dark green, rows in terracotta, labels left, values right-aligned; readable on iPhone SE 375px (`15-preview-se.png`, `01-preview.png`) |
| Payback Lab — empty state | **PASS** | Correct empty-state layout, label/value pairing (`09-payback-results.png`) |
| Workspace header / FAB | **PASS** | Icons, logo, floating + button all correctly placed on iPhone |

## 7. UX lead for the Reviewer (design, not defect)

On iPhone, tapping any lab tab in the 79-tab rail lands the panel's **heading near the bottom of the viewport**, with all results below — the user must scroll to find them (`05-takerate-lab.png` shows the "Take-Rate War Lab" heading at the very bottom of the screen right after the tap; `dark-takerate-aftertap.png` shows the identical behavior in dark mode). The same pattern repeats for every panel. A "jump to results" anchor or a scroll-to-panel-heading after tab selection would materially improve phone ergonomics. This is a review lead, not a defect.

## 8. Minor observations

A single transient 404 fired once during a Brag Cards capture and was **unreproducible in two reruns** — logged for transparency, not a defect. The Take-Rate section heading "Monthly units & average price per channel" wraps onto two lines awkwardly at 390px; the panel cards render their intro descriptions cleanly in both themes.

## 9. Evidence files (this cycle)

All captures are on the qa branch under `qa/cycle50/` and listed below with their on-disk locations in `qa-shots-cycle50-visual/` and `qa-shots-cycle50-money/`:

| File | What it shows |
|---|---|
| `05-takerate-results.png` | Take-Rate Lab in-viewport, light, iPhone 14 — portfolio summary + leaderboard PASS |
| `05-channelcards-zoom.png` | **New defect:** suffix/value overlap in channel cards (zoomed crop) |
| `dark-takerate-scroll-2.png` | Same defect reproduced in dark mode, all six channel cards |
| `dark-takerate-scroll-3.png` | Dark-mode portfolio summary + leaderboard — PASS |
| `dark-takerate-aftertap.png` | Dark tab-tap landing state — heading at viewport bottom (UX lead) |
| `05-takerate-lab.png` | Light tab-tap landing state — heading at viewport bottom (UX lead) |
| `09-payback-results.png` | Payback Lab empty state — PASS baseline |
| `payback.png` | **Issue #53 repro:** seeded Payback Lab, $0.00 net, Needs ∞ |
| `receipt.png` | Receipt Lab with correct-shape seed — PASS |
| `bragcards.png` | Brag Cards with correct-shape seed — PASS |
| `15-preview-se.png` | Grading table on iPhone SE — PASS |

## 10. Actions requested from the Reviewer

1. **Confirm and open a new issue for the Take-Rate suffix overlap** (§4) — visual defect, reproducible in both themes at iPhone width; suggested fix: render the NumField suffix as a flex sibling instead of an absolute overlay.
2. **Weigh the defensive-default robustness lead** (§3) for `analyzeReceiptFees` (`f.shippingCost ?? 0`) — no observed bug, but it would immunize the monthly aggregation against legacy/malformed rows.
3. **Close out or prioritize issue #53** — now reproduced three independent times (cycles 47, 49, 50) with zero code change; it silently tells paying users that their sales earned $0.00.
4. **Consider the UX lead** (§7) — anchor the panel heading after tab selection on mobile.

No pushes were made to `main`. No `src/` code was modified (two temporary diagnostic tests were created and removed during investigation to leave the codebase untouched).
