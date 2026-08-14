# QA Report — Stitch & Scale Pro (Scheduled cycle 3, 2026-08-14)

**Trigger:** 5 new commits on `main` since the last reviewed SHA (`90090a7`): **CHK-028** Price Window & Discount Optimizer (tab 28, "PriceWin"), **CHK-029** Repeat Buyer & Retention Planner (tab 29, "Repeat"), plus playbook progress logs and a docs commit updating the staff working prompt.
**Baseline at HEAD `e6b923c`:** `pnpm install` clean · typecheck passes · **vitest 488/488 pass** (commit claim of 469 was already superseded by later work; tests remain fully green) · production build passes (6.07s).

## What was tested

The two new tabs were opened and exercised in full on the sample project: every input, slider, verdict line, and reactive update was captured and sanity-checked, with one full interaction loop (35% discount → nets update → restore) and keyboard roving navigation across the now 29-tab strip. Dashboard, localStorage persistence, and post-session baseline all verified. No code was modified under `src/`.

| Area | Result |
| --- | --- |
| PriceWin (Price Window & Discount Optimizer) | Inputs ($8 price, Ravelry venue, 10 baseline sales/mo, 60 faves, 2-wk window), launch-discount slider (20%), season demand map (Nov–Dec 1.75× … Jul 0.60×) with the current month's multiplier applied, three-path verdicts (full price $389 / launch window $388 / forever-sale trap $360 net over the window), competitive-band warning present. Interaction test: slider 20% → 35% via keyboard updated nets to $389/$375/$292, and restoring to 20% reverted cleanly. Verdicts internally consistent (launch −$1 vs full price; forever trap −$29). **PASS** |
| Repeat (Repeat Buyer & Retention Planner) | List-size and engagement inputs, tooling-tier suggestions, benchmark lines (~5% engaged-list buy rate, 20%+ warm repeat), verdict "retention motion nets $84/mo", buyers/month 17.6 = consistent with $129/mo list revenue, repeat ladder 17.6 → 3.5 → 0.7 → 0.1 buyers, 12-month net $788 vs cold-acquisition cost $524, welcome + release email templates render. **PASS** |
| Dashboard regression | 3 projects intact, including the QA session's "QA Auto-Test Vest" — no data loss across the update. **PASS** |
| Post-session baseline | typecheck pass · 488/488 tests · build pass · working tree clean. |

## Findings in this cycle

| # | Severity | Finding | Addressed to |
| --- | --- | --- | --- |
| 16 | INFO | While serving the repo through the **Vite dev server started before a `git pull`**, opening a project with the new PriceWin tab crashed with `Cannot read properties of null (reading 'useState')` at `price-window-card.tsx:83`. The crash disappeared entirely after restarting the dev server, confirming it is a **stale module graph** artifact — no code defect (tests, build, and fresh-server run all green). Staff who develop locally should restart the dev server after pulling. | Reviewer |

No functional defects were found in the new tabs. The previously reported critical items (**#6** instant measurement delete, **#7** no edit path) remain **unresolved** in this build; their code paths are unchanged and did not regress.

*No code was modified. Report committed only to a `qa/` branch; `main` untouched. Prepared by Manus AI (QA role).*
