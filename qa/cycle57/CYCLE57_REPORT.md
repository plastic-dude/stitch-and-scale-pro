# QA Cycle 57 — CHK-114 / CHK-115 Verification (#40, #42)

**Date:** August 17, 2026 · **Role:** Third-staff QA · **Addressed to:** The Reviewer

> This report is addressed to the Reviewer. The Coder should not act on this report directly — please triage, decide on closure, and route any required fixes through the normal process.

## Reviewed commits

| Commit | Check | What it addresses |
|---|---|---|
| `e741d6b` | CHK-114 | Wholesale Lab keystone suggestion strings: double-dollar signs retired (QA #40) |
| `ce1f185` | CHK-115 | Listing Test Lab queue ranked by true EV per re-list hour (QA #42 item 3); Yarn Pool caption wording corrections |

Baseline: TypeScript clean, **vitest 1,790/1,790 (114 files, +4 new regression tests)**, production build 8.60 s, fresh dev server after pull (HTTP 200).

## Verification 1 — Issue #40: keystone double-dollar sign (CHK-114)

The two affected suggestion strings used a raw `$$` template (`($${avgKeystoneWholesale.toFixed(0)})`), which rendered a literal `$$` in the verdict panel (e.g. "push prices toward keystone ($$48)"). The fix interpolates the dollar amount so only a single `$` reaches the screen.

I opened the Wholesale Lab in the live UI on iPhone 14 portrait (390×844, iOS Safari UA, DSF 3) and scanned the **entire rendered panel text** for `$$` — zero occurrences in both light and dark mode, while every keystone reference still renders a single `$` ("Keystone = 2x COGS…", the "COGS / Keystone / Wholesale / Retail / $ margin/hr" SKU table, and the keystone suggestion strings themselves). Console clean in both themes.

**Result: #40 VERIFIED FIXED.**

## Verification 2 — Issue #42 item 3: queue ranked by EV per re-list hour (CHK-115)

Before the fix, `rankListingQueue` sorted and displayed the raw total expected value while the card's hint claimed "ranked by expected value per re-list hour" — a total of $-23 over 4 h is $-5.75/hr, not $-23/hr.

To verify the sort genuinely changed, I seeded two listings whose raw EV and EV/hr order disagree:

| Listing | Views/mo | Price | Effort | Raw EV (larger) | EV/hr (larger) |
|---|---|---|---|---|---|
| A — My Lace Shrug | 4,000 | $40 | **24 h** | ✓ | ✗ |
| B — Listing name 2 | 3,000 | $30 | 4 h | ✗ | ✓ (≈ 3.4× A) |

Observed queue order, captured in **both themes**:

1. **Listing name 2 — EV $2,582/hr** (ranked first)
2. My Lace Shrug — EV $758/hr (ranked second)

The smaller-total-EV listing wins because it wins per-hour — exactly the corrected behavior. The EV column now displays `EV $X/hr` with the `/hr` suffix (the new `evPerHour` field), and the hint "Ranked by expected value per re-list hour. Listings at the bottom are catalog-refresh candidates…" is preserved. Console clean in both themes.

![Listing Test Lab queue — ranked by EV/hr, light](qa-shots-cycle57/listing-light-queue.png)

**Result: #42 VERIFIED FIXED.**

## Verification 3 — Yarn Pool caption wording (CHK-115)

Spot-checked the Yarn Pool Lab in English, both themes: the tier note now admits its assumptions ("Mill tiers default to 20 kg/colorway MOQ, $250 dealer minimum, and 1 kg bulk minimum — **the current build uses engine defaults for these**" — the phantom "advanced fields" claim is gone), and the member note no longer overstates tier mechanics ("Members are counted for the YP-07 audit — the tier ladder itself unlocks on the colorway's total grams"). Default scenario renders "Pool it — retail bulk tier unlocked" with the YP-07 audit firing. Console clean.

## Evidence

| File | Purpose |
|---|---|
| `listing-light-queue.png` / `listing-dark-queue.png` | Queue order: $2,582/hr before $758/hr, light + dark |
| `listing-light-inputs.png` / `listing-dark-inputs.png` | Inputs BEFORE queue capture |
| `wholesale-light-before/after.png`, `wholesale-dark-before/after.png` | Wholesale Lab panel scans (0 occurrences of `$$`), light + dark |
| `yarnpool-light.png` / `yarnpool-dark.png` | Yarn Pool caption wording, light + dark |

## Repository delivery

Committed to **`qa/manus-2026-08-14-cycle43`** (qa/cycle57/ + qa-shots-cycle57/), QA identity, main untouched, no `src/` modifications. Verification comments posted on issues #40 and #42, both explicitly addressed to the Reviewer and left open for closure. Last-reviewed SHA updated to `ce1f185`.
