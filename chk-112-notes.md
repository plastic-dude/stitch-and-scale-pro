# CHK-112 cycle notes

## Inbox sweep result at HEAD d9dc820 (CHK-111)

#49, #51, #43, #48, #50, #52 are all fixed in flight by earlier CHKs but issues never closed. Engine-level fixes verified via existing tests (fmtMoney EUR/CHF + all currencies pinned in intl-pricing-lab.test.ts line 281+; release-timing card NumFields already display value*100 at line 144/145; giftcard resolvedEscheatTake used at lib lines 176/272; testknitlab present in workspace). Plan: fix #45 now (genuinely unfixed, correctness-adjacent), then close #49/#51/#43/#48 as fixed-in-flight with evidence at cycle end.

## Selected item: #45 — Consignment Re-Price Lab crowns $0.00 BEST step at zero sell-through

**Issue:** unitsSoldPerMonth=0 → every ladder step totalNetOnCurrentStock=0 (sellUnits=ceil(0×months)=0), bestStep crowned by sort[0] as "Light markdown (15% off)" BEST, verdict recommends it. Contradicts CR-04 critical flag (which already fires correctly).

**Fix plan (minimal, display-only, engine semantics untouched):**
1. lib `consignment-reprice-lab.ts`: add `zeroSellThrough: boolean` to RepriceResult (input.unitsSoldPerMonth === 0 && unitsAtShop > 0).
2. card `consignment-reprice-lab-card.tsx`: when zeroSellThrough, suppress the BEST badge + primary row highlight (badge shows "No step moves stock" chip), and show a zero-sell-through line under the ladder table: "No step moves stock at zero sell-through — pull back or destash."
3. Card already reads result — pass-through is trivial.
4. Regression tests in `lib/consignment-reprice-lab.test.ts`: zero-sell-through input → zeroSellThrough true; all ladder totals zero; verdict ladder behavior unchanged (CR-04 still fires).

## Key file locations
- lib: `src/lib/consignment-reprice-lab.ts` (bestStep at ~line 202, buildLadder ~321, CR-04 ~243, result interface ~75)
- card: `src/components/consignment-reprice-lab-card.tsx` (ladder render ~334-366, best badge ~348, bestStep rationale ~371)
- tests: `src/lib/consignment-reprice-lab.test.ts`

## Evidence to post at close
- #45: this fix.
- #49: CHK-079 (9d0011c) fmtMoney all currencies; pinned by tests (suite 1779 green).
- #51: CHK-084 (e71b85a) EUR/CHF compound key "€9.40 / CHF 9.40" test at test line 281-282; CHK-090 (05c7ce8) expanded symbols.
- #43: fixed-in-flight — card lines 144/145 show value*100 with % suffix.
- #48: fixed-in-flight — resolvedEscheatTake exported and consumed in analysis (lib lines 176, 272).
- #50: fixed-in-flight — testknitlab in workspace (lines 110, 205, 945).

## Gates (from CHK-110/111): tsc clean, 1,779 tests/114 files, build green — re-run after fix.

## Done
- Commit: 7139247 pushed to origin/main. Gates: tsc clean, 1784 tests/114 files, build green. Screenshot saved docs/screenshots/chk-112-reprice-zero-sellthrough.webp (ladder shows "$0.00 at zero sell-through" chip on top row, no BEST badge, footer "No step moves stock at zero sell-through...").
- Issue #45 to close with this evidence.
- Issues #43/#44/#48/#49/#50/#51 to close as fixed-in-flight with evidence lines:
  - #49: CHK-079 9d0011c; all 13+ currencies pinned by suite (fmtMoney coverage test).
  - #51: CHK-084 e71b85a; test "renders the EUR/CHF compound key" → "€9.40 / CHF 9.40".
  - #43: card release-timing-lab-card.tsx lines 144/145 display value*100 with % suffix.
  - #44: workshop-teaching-lab.ts uses Math.round(pct*100)+"%" (line 193) — rounded %, no raw fraction.
  - #48: giftcard-lab.ts resolvedEscheatTake consumed at lines 176 and 272.
  - #50: workspace project-workspace.tsx lines 110/205/945 carry testknitlab.
- Next backlog: #46 (bundle self-referencing copy, verify), #47 (podcast tab + magazine raw fraction, verify), then MAJORs S182/S251/S160.
