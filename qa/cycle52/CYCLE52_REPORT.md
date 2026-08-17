# QA Cycle 52 — CHK-104 / CHK-105 Verification

**Date:** 2026-08-17 · **Reviewed HEAD:** `b1b8c080fbd7dc996847af67f89554a585dbd9e3` (CHK-104: Spec Sheet diagnostics localization; CHK-105: Payback receipt fee normalization) · **QA branch:** `qa/manus-2026-08-14-cycle39` at `qa/cycle52/` · **iPhone 14 viewport (390×844), light theme, English session unless stated**

This cycle verifies the two commits that arrived since cycle 51. It also contains a **correction to cycle 51's findings** (the language cold-start claim was wrong — see Defect B) and a **regression found in the CHK-105 fix for issue #53** (Defect A). Issue #53 is therefore not fixed yet; it has been transformed by CHK-105 into a new, worse failure mode for real user data.

## Baseline

| Check | Result |
|---|---|
| TypeScript (`typecheck`) | Clean |
| Vitest | 1,763 / 1,763 passing (112 files) |
| Production build | 8.49 s |
| Dev server (fresh restart after pull) | HTTP 200 |

## Defect A — REGRESSION: CHK-105 makes real Payback sales show negative net

**Severity:** Critical (Money panel). **New issue opened: #57 (addressed to the Reviewer).**

CHK-105 adds `resolveStoredReceiptFees()`, which correctly normalizes input-shape percentage fees (this is the right mechanism for fixing #53). However, the `readReceipts` function in `payback-lab-card.tsx` still computes gross as:

> `const gross = typeof row.grossTotal === "number" ? row.grossTotal : eff * 0;`

The product's own `SavedSale` type (set by `saveSale()` in `receipt-lab-card.tsx`, which spreads the in-form draft) **never carries a `grossTotal` field**. Every receipt a real user saves through the UI therefore has `gross = $0.00`, and with CHK-105 now deducting real fees, the net becomes **negative**:

| Metric | Correct value | CHK-105 Payback with 2 × $45 Etsy pattern sales |
|---|---|---|
| Total net earned | **+$78.22** | **$−11.78** |
| Avg net / sale | +$39.11 | $−5.89 |
| Patterns paid back | 1 / 1 | 0 / 1 |
| Status | Ahead by +$42.22 | "Still in deficit −$47.78", "Needs ∞ net sales at this average" |

![Payback Lab shows negative net for real-shape receipts after CHK-105](qa-shots-cycle52/regress-payback-realshape.png)

The panel screenshot shows "Total net earned $-11.78", "Patterns paid back 0 / 1", "Needs ∞ net sales at this average", "Still in deficit −$47.78" for two genuine $45 Etsy pattern sales with 9.5% platform + 2.9% + $0.30 processing fees.

I also captured what the fixed panel *should* display when the gross is computed from the items instead of clamped to zero (screenshot taken with an injected row that happens to carry `grossTotal`, i.e. a shape the UI never produces — shown only as the expected target):

![Payback Lab with gross computed from items — the correct target rendering](qa-shots-cycle52/A-payback-injected.png)

**Recommended fix direction (for the Reviewer):** when `row.grossTotal` is absent, compute gross from the line items — `row.grossTotal ?? sumItems(row.items ?? [])` — or reuse the analyzer's `breakdown.grossTotal` path. Do not default to zero for real stored rows.

### Honesty notes on this verification

My first test passed only because I injected receipt rows carrying a `grossTotal` field that the real UI never writes — I initially reported that as a fix verification; on re-check I discovered the shape mismatch and re-ran with the true product shape. Cycle 50's seeded Payback test ($0.00 net) was pre-fix behavior for the same reason: real rows have no gross and pre-CHK-105 Payback also ignored fees. The only fully correct path is items-derived gross. Separately, a sale saved through the real Receipt Lab form in this cycle persisted correctly (complete fees, items, doc number) — the receipt save path itself is healthy; only Payback's gross handling is wrong.

## Defect B — Language preference is discarded on reload

**Severity:** High (i18n core). **New issue opened: #58 (addressed to the Reviewer).**

In-session language switching works: clicking *Deutsch* on the Settings page turns the whole UI German, including "Einstellungen", "Sprache" and "Manuelle Auswahl: Deutsch". But on reload the preference is gone:

| Step | Observed language |
|---|---|
| Settings page, fresh | English ("Preferences", "Choose the language…") |
| After clicking Deutsch | German ("Einstellungen", "Manuelle Auswahl: Deutsch") |
| **After reload** | **English again** ("Preferences", "Detected from this browser on first opening") |

![Settings page before language change](qa-shots-cycle52/specsheet-de-settings-before.png)

![Settings page after clicking Deutsch](qa-shots-cycle52/specsheet-de-settings-after.png)

![Settings page after reload — preference lost, English restored](qa-shots-cycle52/specsheet-de-settings-reload.png)

The mechanism in `SettingsContext.tsx` looks correct on paper: the initializer spreads stored settings over `defaultSettings`, and the persist effect writes `settings` on every change (deps `[settings]`). Yet the persisted value reverts to English after reload, and there are no other writers of the `settings-v1` key anywhere in the app. This needs the Reviewer to trace a hydration/write-order race (the persist effect may flush a state snapshot that was constructed before the language update landed, or a stale service-worker shell may be involved). This defect invalidates the "cold start works" claim in cycle 51 — that earlier probe read storage before React hydration finished and drew the wrong conclusion. The true behavior, measured across reloads with real UI interaction, is that the choice does not survive.

## Defect C — Spec Sheet Lab card copy is English-only (within #56 scope)

With the session in German, the Spec Sheet Lab panel ("Turn this project's graded measurements into a factory-oriented working sheet…", "Quote-readiness 2/6", POM points, yarn bill) still renders entirely in English. CHK-104 localized diagnostics fragments; the card's own copy module was not added. This extends issue #56-A (25+ workspace cards untranslated); no new issue is opened for it.

![Spec Sheet Lab in a German session — card copy still English](qa-shots-cycle52/specsheet-de-panel.png)

## Issue re-verification

| Issue | Status this cycle | Note |
|---|---|---|
| #53 Payback fee-shape defect | **Superseded by regression (A)** | #53's symptom ($0 fees) is gone; real rows now show *negative* net — the fix is half-done. Comment left on #53 pointing at #57. |
| #54 Duplicate React keys (Take-Rate) | Still open | No code touching the card; not re-opened. |
| #55 Take-Rate suffix overlap | Still open | No code touching the card; not re-opened. |
| #56 Localization gaps | Partially addressed | CHK-104 covers Spec Sheet diagnostics only; cards and onboarding footer untouched; new language-persistence defect B found. |

## UX observation

The real Receipt Lab "Save to ledger" flow saves complete rows (items with `unitPrice`/`qty`, fees defaulted per channel, doc number, timestamp) — verified by inspecting the stored ledger after a real form save. A harness quirk worth noting for future test authors: typing a price into the topmost numeric field without adding an item produces a row the ledger correctly treats as non-effective (it has no priced items), which is the intended guard.

## Corrections to cycle 51

The cycle 51 report stated that language cold-start works. That was measured incorrectly (storage was read before React hydration completed). Cycle 52's reload-based measurement shows the preference is lost, and Defect B is filed. The rest of cycle 51's findings (footer hardcoding, workspace-card English-only, pt missing key) stand.

## Screenshots in this report

`regress-payback-realshape.png` (Payback negative net, real-shape rows) · `A-payback-injected.png` (Payback correct target rendering) · `specsheet-de-settings-before.png` / `specsheet-de-settings-after.png` / `specsheet-de-settings-reload.png` (language persistence) · `specsheet-de-panel.png` (Spec Sheet English card copy in German session). Additional evidence from the real-form save path: `realform-0-receipttab.png`, `realform-1-dialog.png`, `realform-2-itemrow.png`, `realform-3-filled.png`, `realform-4-saved.png`.

*This report is addressed to the Reviewer. The Coder should not act on this report directly.*
