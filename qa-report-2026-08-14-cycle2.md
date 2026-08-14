# QA Report — Stitch & Scale Pro (Scheduled cycle, 2026-08-14)

**Cycle time:** ~04:00 UTC (Africa/Lagos timezone) · **Trigger:** 8 new commits on `main` since the last reviewed SHA (`16f8cc8`).
**Commits reviewed:** CHK-024 Inclusive Sizing & Adaptive Grading Analyzer (tab 24, "Inclusive"), CHK-025 Pattern License Planner (tab 25, "Licence It"), CHK-026 Membership Planner (tab 26, "Members"), CHK-027 Promotion Budget Planner (tab 27, "Promo"), plus four playbook progress-log commits.
**Baseline at HEAD `90090a7`:** `pnpm install` clean · typecheck passes on all packages · **vitest 455/455 pass** (up from 397; consistent with commit claims of 410 → 427 → 442 → 455) · production build passes (5.39s).

## What was tested

The four new workspace tabs were activated and inspected in full on the sample project, alongside a regression check of the dashboard, localStorage persistence, and tab-strip navigation at 27 tabs total. Baseline verification ran before and after the browser session with zero code changes made anywhere under `src/`.

| Area | Result |
| --- | --- |
| Licence It (Pattern License Planner) | Renders inputs (venue select, price, sales, rate, hours, horizon, fee, royalty, exclusivity window, production, payment lag, rights checkboxes), 8/8 rights audit renders with pass notes, counteroffer letter renders. Fee input at $120 shows "Fee of $120 sits far below your $1000 labour floor"; changing fee to $600 reacts instantly to "Fee of $600 sits far below your $1000 labour floor ($15/hr…)" with Total offer value updating to $600; restoring to $120 reverts cleanly. Math internally consistent: Self-sell window $1,757 = $7.32 × 10/mo × 24 mo; Sell-now $1,877 = $1,757 + $120. **PASS** |
| Inclusive (Inclusive Sizing & Adaptive Grading) | Renders Wolcott-quote intro, pricing inputs, platform select, cup-shape options, petite/tall lengths, release size-range matrix with Add-size control, and eight adaptive-modification consulting quotes ($19–$75). **PASS** |
| Members (Membership Planner) | Tier builder (name/price/churn/perks), Add-tier control, exclusive mini-pattern and parked-pattern cost modeling render as real interactive rows. **PASS** |
| Promo (Promotion Budget Planner) | Venue select (Ravelry/Etsy/Ribblr/Payhip), channel-by-channel outputs with kill rules and suggested-order ranking render. Default scenario computes Total spend $350 · projected net −$282 on a $204 baseline. Headline sentence reads `Projected net +$-282` — mixed sign formatting. **PASS with 1 minor cosmetic flag** |
| Dashboard after pull | 3 projects intact including the QA session's "QA Auto-Test Vest" — localStorage data preserved across the code update. **PASS** |
| Tab navigation | 27-tab strip wraps to two rows; keyboard roving (ArrowLeft/Right) navigates reliably. Synthetic-click QA infra note documented (user-facing clicks behave normally). **PASS** |
| Known issues #6–#13 | Unchanged code paths; nothing regressed and nothing fixed silently. |

## Findings in this cycle

| # | Severity | Finding | Addressed to |
| --- | --- | --- | --- |
| 14 | MINOR | Promotion Budget Planner summary sentence renders `Projected net +$-282` — a positive-sign prefix paired with a negative value. Cosmetic string-formatting bug in `promotion-card.tsx`. | Reviewer |
| 15 | INFO | Tab strip has reached 27 tabs and now wraps into two rows; horizontal scrolling still works and roving keyboard navigation was verified. Worth watching for further wrap crowding as tabs are added. | Reviewer |

Both are non-blocking. The previously reported critical items (#6 instant measurement delete, #7 no edit path) remain **unresolved** in this build; their code paths are unchanged and were confirmed not to regress.

*No code was modified. Report committed only to a `qa/` branch; `main` untouched. Prepared by Manus AI (QA role).*
