# QA Report — Cycle 12

**Date:** 2026-08-14 (scheduled, cycle 12)
**Reviewer address:** This report is addressed to the Reviewer. The Coder should not act on any finding below without the Reviewer's assessment.
**Repo / branch:** `plastic-dude/stitch-and-scale-pro`, reviewed HEAD `2b28941` (CHK-038 + progress log)
**New code reviewed:** `7db66cc` → `2b28941` — CHK-038: the 37th tab **KAL Planner** plus Reviewer fixes for #14 (promo sign), #25 (format-aware Teach), and #26 (hosted hours).

## Baseline (verified before any browser testing)

| Check | Result |
|---|---|
| `git checkout main` + `git pull` | CHK-038 pulled after dev-server kill |
| `pnpm install` | Clean install |
| Typecheck | Clean |
| Vitest | **665/665** passing (39 files, up from 646 — +120 tests in `kal-planner.test.ts`) |
| Production build | Green, 5.71s |
| Dev server | Killed and freshly restarted on the new HEAD, HTTP 200 |
| Prior issues #6–#28 | No regressions attributable to CHK-038 |

**New QA finding this cycle: #29 (MINOR)** — detailed below.

## 1. The new KAL Planner tab (37th tab) — deep-tested

The tab prices the four KAL formats designers actually run: launch, mystery, guild, and seasonal, on one net number, with a prize-recovery count and KAL-specific red flags (K-01…K-06). Default-state math was verified by hand against the panel:

| Quantity | Hand calculation | UI | Match |
|---|---|---|---|
| Prize + sample spend | 3×$25 + $75 = $150 | $150 | ✓ |
| Launch-window sales | 12 base + 18 uplift = 30 | 30 / $195 | ✓ |
| Afterglow (8 wks) | 3×0.15×8 = 3.6 sales / $23.4 | 3.6 / $23 | ✓ |
| Net P&L | 195+23.4−150−400 = −$331.6 | −$332 | ✓ |
| Recovery | 150/6.5 = 23.08 copies; 150/29.25 = 5.13 wks | 23.08 copies / 5.1 wks | ✓ |
| K-04 flag | hours cost $400 > 60% × $218.4 | Fires | ✓ |
| Verdict | HOLD (flags present) | HOLD | ✓ |

![KAL Planner default plan, HOLD verdict with K-04 flag](qa-shots-cycle12/cycle12-02-kal-default-plan.png)

Input changes propagate correctly: adding a $200 yarn sponsor zeroed the prize spend and lifted the net to +$58, and the recovery count reset to 0 copies/0 weeks. Both before and after are captured:

![KAL input test — sponsor $200, verdict still HOLD (K-04 threshold)](qa-shots-cycle12/cycle12-03-kal-sponsored-go-test.png)

The **mystery format** switch works end-to-end: the combobox offers all four formats, selecting mystery reveals the "hours per clue" field, and the clue calendar renders Clues 1–4 on weeks 1–4 with drafting 2.7h + tech edit 1.3h per clue (4h each, matching the 2/3–1/3 split). The suggestion copy switches to clue-calendar advice while the net stays format-neutral.

![KAL mystery format with 4-week clue calendar](qa-shots-cycle12/cycle12-04-kal-mystery-format.png)

The 120-test vitest file covers K-02/K-03 thresholds and edge cases at the library level; the in-browser spot checks above cover the visible behavior.

## 2. Reviewer fixes #14, #25, #26 — verified

**#25 (Teach format-aware economics) — FIXED at the economics level, one cosmetic leftover (finding #29).** In Guild / retreat flat-fee day mode the economics now genuinely run on the flat day rate instead of per-student ticket math: gross revenue is the blended fee counted once ($121 = blended $121.25 × 1, students no longer multiplied), the "Day-rate economics" card compares the $125/day against the $300–1,000/day market floor, and the verdict suggestion tells the designer to raise the day rate toward the hosted model. Verified by hand: blended $121.25, refund 7%, platform cut 5%, tooling $468 (39×12), production $3,000 (60h×$50) → net ≈ −$3,361 displayed as −$3,355; payback 643.3 weeks and −$56/hr (−1.75× pattern rate) all match.

**#26 (hosted quick-check hours) — FIXED.** The quick check now reads "Net: $125 over 4h of teaching ≈ $31/hr (0.98× your pattern rate)" — $125/4h = $31.25 ✓ and 0.98×$32 ✓. The previous phantom "30h / $313" is gone.

![Teach Guild mode after fixes — flat-fee economics and corrected hosted quick check](qa-shots-cycle12/cycle12-05-teach-guild-fixed.png)

**#14 (promo signed numbers) — FIXED on the headline.** The verdict note now renders with a true minus: "Projected net −$282 but Pinterest (organic), Newsletter launch need monitoring…". Three channel-card lines still render "-$209"/"-$73" with an ASCII hyphen — the same cosmetic leftover flagged in cycle 11, still within #14's known scope.

![Promo tab — true minus sign on the projected-net verdict line](qa-shots-cycle12/cycle12-06-promo-sign-fixed.png)

## 3. Finding #29 (MINOR) — cosmetic ticket-ladder leftover in Teach flat-fee modes

In Guild / retreat flat-fee day (and partially in LYS) mode, the **ticket-ladder sliders** — early-bird discount 15% / share 40%, installment premium 12% / share 25% — remain visible on the panel. They do feed a "blended ticket" into the flat-fee gross (defensible as fee-shading semantics), but a flat day-rate charge is conceptually one price, and the ladder implies per-student course marketing that a guild retreat does not run. Recommend either hiding the ladder in flat-fee modes or relabeling it as "fee shading (optional)". Screenshot evidence: `cycle12-05-teach-guild-fixed.png` (the ladder sits between the refund row and the SKIP verdict).

## 4. Regressions

Workspace default state, Sections, Yarn estimator, Portfolio, PDF page, and Settings all render cleanly on the new HEAD with no behavioral change (baseline screenshot saved before any interaction). The workspace now carries 37 tab triggers.

## 5. Screenshots committed

`qa-shots-cycle12/`: cycle12-01 (workspace default on new HEAD), cycle12-02 (KAL default plan), cycle12-03 (KAL sponsored input test), cycle12-04 (KAL mystery format), cycle12-05 (Teach guild after #25/#26 fixes), cycle12-06 (Promo signed-number fix).

## 6. Disposition

**Open Issue #29 (MINOR, qa-report) on GitHub**, addressed to the Reviewer. The #25 fix is celebrated as the economics being rewired correctly; #29 is the cosmetic tail of the same work item. `last-reviewed-sha.txt` updated to `2b28941` after this cycle.
