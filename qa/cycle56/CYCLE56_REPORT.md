# QA Cycle 56 — CHK-112 / CHK-113 Verification (#45, #46)

**Date:** August 17, 2026 · **Role:** Third-staff QA · **Addressed to:** The Reviewer

> This report is addressed to the Reviewer. The Coder should not act on this report directly — please triage, decide on closure, and route any required fixes through the normal process.

## Reviewed commits

| Commit | Check | What it addresses |
|---|---|---|
| `7139247` | CHK-112 | Consignment Re-Price Lab: zero sell-through no longer crowns a $0.00 BEST step (QA issue #45) |
| `0cb8b00` | CHK-113 | Pattern Bundle Lab: renegotiate verdict no longer restates the current price as an inert lift lever (QA issue #46) |

Baseline: TypeScript clean, **vitest 1,786/1,786 (114 files)**, production build 8.16 s, fresh dev server after pull (HTTP 200). Both commits add 7 new regression tests (5 in the re-price lab file, 2 in the bundle lab file), all green.

## Verification 1 — Issue #45: zero sell-through in the Re-Price Lab (CHK-112)

Scenario seeded in the live UI on iPhone 14 portrait (390×844, iOS Safari UA, DSF 3): Retail $8, Ravelry In-Store, print cost $1.50, **60 units at shop, 0 units sold/month**, winter season.

Expected after CHK-112: no BEST badge on any ladder row, a disclosure chip on the best row, a footer that says no step moves stock, and CR-04 preserved.

Actual, captured visually in **both light and dark mode**:

- **No BEST badge anywhere** — the badge count in the active panel text is 0 (before the fix every zero-sell step was still crowned)
- Disclosure chip **"$0.00 at zero sell-through"** rendered on the best row
- Footer rendered exactly: *"No step moves stock at zero sell-through — every row clears $0.00. Pull the unsold copies back to your own shop at a promo price, fold them into a bundle, or destash."*
- **CR-04 critical flag preserved** in red: "No current sell-through — units are not moving… 60 units is more than a year of inventory worth $90.00 in sunk print cost. Markdown or pull-back now."
- CR-07 green info card and the Verdict ("Light markdown (15% off) — the critical flags say the current setup is losing money or shelf life. Re-price rather than hope.") all intact

![Re-Price Lab bottom — zero sell-through, light](qa-shots-cycle56/reprice2-light-bottom.png)

Both themes pass identically (same probe set against the dark-mode capture). **Result: #45 VERIFIED FIXED.**

## Verification 2 — Issue #46: bundle renegotiate verdict at the 50%-of-sum floor (CHK-113)

To exercise the renegotiate branch the bundle must be *underwater* while sitting exactly at the floor, so I seeded: standalone prices **$10 / $8 / $10 (sum $28 → 50% floor $14 = bundle price $14)**, host commission **45%**, realistic sales **15/mo** (worst 20, best 120).

The verdict card now reads exactly the corrected wording:

> *"Realistic sales of 15 net you $41 vs $56 solo — $16 underwater. Fix one lever: **the $14 price already sits at the 50%-of-sum floor — skip it**, cut host commission under 25%, or demand a host-floor of ≈17 sales. The bundle then flips to +$1 territory."*

All four probes true: floor acknowledgement, "skip it", the host-commission lever, and the host-floor lever named. The old inert "$14 as a lift suggestion" wording no longer appears anywhere in the panel text. The pattern-by-pattern table correctly shows red losses (−$16, −$5) and watch-outs PB-03/PB-04/PB-06 fire as expected.

![Bundle Lab renegotiate verdict at the floor](qa-shots-cycle56/bundle-underwater-verdict.png)

For contrast, the default inputs still produce the healthy "Host this launch" branch ("$637 net vs $45 solo… At $14 from $21 of value the deal is real") — confirming the fix only affects the renegotiate branch, not the positive verdict.

![Bundle Lab default "Host this launch" verdict](qa-shots-cycle56/bundle-light-verdict-scroll.png)

**Result: #46 VERIFIED FIXED.**

## New finding opened — Issue #60 (controlled/uncontrolled input flip in Re-Price Lab)

During the zero-sold verification both themes emitted two console errors: *"A component is changing a controlled input to be uncontrolled (…value changing from a defined to undefined value…)"*. Code review of `consignment-reprice-lab-card.tsx` shows every input value derives from `stored.*` defaults that are all defined, so the flip must occur through the `setState` merge path in a dependent field — reproducing requires the exact sequence from the seeded zero-sold scenario and is filed for the Reviewer with both screenshots of the error in this cycle's evidence. This is the first real console *error* (not warning) logged on a pricing lab this cycle.

## Standing observations (pre-existing, no action)

The two pre-existing cosmetic notes (watchout badge text truncation at 390 px, card label mid-word wrap) from cycle 55 remain unchanged and are not filed again.

## Evidence

| File | Purpose |
|---|---|
| `reprice2-light-bottom.png` | Re-Price ladder + footer, zero sell-through, light |
| `reprice2-dark-bottom.png` | Same, dark |
| `reprice2-light-inputs.png` | Inputs AFTER zero-sold, light |
| `bundle-underwater-verdict.png` | Renegotiate verdict at the 50%-of-sum floor |
| `bundle-floor-inputs.png` | Bundle inputs that trigger the floor |
| `bundle-light-verdict-scroll.png` | Default healthy "Host this launch" verdict (contrast) |

## Repository delivery

Committed to **`qa/manus-2026-08-14-cycle42`** (qa/cycle56/ + qa-shots-cycle56/), QA identity, main untouched, no `src/` modifications. Verification comments posted on issues #45 and #46, both explicitly addressed to the Reviewer and left open for closure. New issue #60 opened (controlled/uncontrolled input flip, qa-report label).
