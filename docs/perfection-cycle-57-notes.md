# Perfection cycle — issue #57 (MAJOR regression, validated by Reviewer)

## Inbox sweep 2026-08-17 06:05 (at HEAD a70669b)
- #57 [MAJOR regression-class, validated TRUE by Reviewer, ledger S273]: CHK-105 Payback fee fix makes real UI-saved sales show NEGATIVE net because `SavedSale` (receipt-lab.ts ~139-158) has NO `grossTotal` field; Payback's readReceipts fallback computes gross=eff*0 → $0; with real fees (~$9.61 per $45 sale) net goes negative.
  - Reviewer fix direction: same pattern as `resolveStoredReceiptFees` — derive gross from items when row.grossTotal missing: `grossTotal = subtotal + tax + shippingCharged` (analyzeReceiptFees already computes this from those fields). Apply symmetrically to the Design Ledger adapter (S272). Add regression test: two $45 sales → net +$78.22.
- #58 [QA cycle 52]: language persistence lost on reload — Reviewer triage: NOT REPRODUCIBLE at current code; no action needed.
- #59 [INFO]: Take-Rate TR-03/TR-05 duplicate React keys — lower severity, queue after #57.
- #56 stays open for 51-A workspace cards (next localization target).
- #54 duplicate React keys (queued).

## Fix state — implemented (2026-08-17 06:15)
- Added `resolveStoredReceiptGross(row: ReceiptStoredRow)` in payback-lab-card.tsx (uses local `paybackTwoDec`/`paybackClamp` helpers — no cross-lib import needed). Derives gross = subtotal + tax + shippingCharged when row.grossTotal missing (matches analyzeReceiptFees in receipt-lab.ts:273-277). Refund path inherits sign via `eff` multiplier at sales.push.
- `readReceipts` now calls `resolveStoredReceiptGross(row)` instead of `typeof row.grossTotal === "number" ? row.grossTotal : eff * 0`.
- Expected behavior: two $45 sales (qty 1 unitPrice 45, 0 tax, default fees incl. shippingCharged=0) → gross 90, fees ≈ 2*9.61 → net ≈ +$78.22 per Reviewer repro. NOTE: verify actual default DEFAULT_FEES values to match the $78.22 figure exactly before writing the regression assertion (grep DEFAULT_FEES in receipt-lab.ts).
- Still TODO: (1) check default fees, (2) write regression test payback-gross-regression.test.ts (assert 2x$45 sales → net +78.22; also assert explicit grossTotal rows still honored; refund row gross derived symmetrically), (3) tsc, vitest, build, localhost visual Payback tab on :5000, (4) commit CHK-108 scoped files: src/components/payback-lab-card.tsx + new test + this notes file? (exclude notes from commit; commit only payback-lab-card.tsx + test), (5) comment evidence on #57 and close it (#58 is NOT reproducible — Reviewer already triaged; leave open), (6) report: commit hash, gates, next backlog item (51-A workspace cards / #54 dup keys / long MAJORs S182 S251).
- gh auth done via remote token; repo plastic-dude/stitch-and-scale-pro.

## Fix plan
1. Payback: in `payback-lab-card.tsx` readReceipts fallback, derive grossTotal from row items (subtotal + tax + shippingCharged) matching SavedSale shape; keep resolveStoredReceiptFees semantics.
2. Design Ledger adapter: apply symmetric gross derivation (S272).
3. Regression test: two $45 sales with real fees → net +$78.22 (per reviewer's repro).
4. Gates: tsc, vitest full, build, localhost visual Payback tab.
5. Commit CHK-108, push, comment on #57 (close), report.
