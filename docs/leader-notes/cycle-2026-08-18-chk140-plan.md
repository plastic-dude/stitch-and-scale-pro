# Cycle plan — CHK-140 (2026-08-18)
**Status: PLAN ONLY — no component code touched yet. Written for Worker visibility before execution begins.**

## Item
Owner-flagged: after CHK-135–139's localization sweeps, `tools/inventory_i18n.py` was
re-run against the current tree (not the stale `i18n-remaining-inventory.txt` committed
earlier, which predates several of those fixes) and still finds English-only UI strings
in **32 component/page files**. This cycle closes that list to zero, using the same
per-string register + full 5-locale coverage + regression test discipline as CHK-135–139.

## Ground truth used
Fresh scan, this tree, HEAD `d177e04`:
```
python3 tools/inventory_i18n.py
```
→ 32 files, 240 hit lines. (Superseding the checked-in `i18n-remaining-inventory.txt`,
which will be regenerated and overwritten at the end of this cycle, not before.)

## Scope categories (so scope decisions are visible, not silent)
The scanner flags four literal-string patterns. They don't all need the same treatment:

| Category | Action | Why |
|---|---|---|
| `<Label>` / `<CardTitle>` text | Translate — new key per string | User-visible UI copy |
| `aria-label="..."` | Translate | Screen readers announce in the UI language; this is accessibility, not cosmetic |
| `toast({ title, description })` | Translate | User-visible feedback |
| `<SelectItem>` option text | Translate | User-visible choice labels |
| `<CardDescription>` long-form lab intros (pod-patterns, podcast-affiliate, pricing-psychology, release-timing, retreat-teaching, workshop-teaching, yarn-licensing, and similar "lab" cards) | Translate as long-form copy, **numbers/currency/named sources kept as-is** (e.g. "$2.30", "KDP", "Sori & Widjaja") | These are researched claims with citations; only the prose wrapping translates, not the cited figures/names |
| `placeholder="..."` | **Translate only if it contains English words** (e.g. `"Pick a yarn..."`, `"Notes per tester"`, `"handle / name"`). **Leave untouched if it's a pure numeric example** (e.g. `"0.00"`, `"220"`, `"90"`) since digits need no localization. Mixed cases (e.g. `"8 event hrs"`) are translated. | Prevents wasted keys on placeholders that are already language-neutral, while catching the ones that aren't |

This distinction is being stated up front so it's a documented decision, not a
judgment call discovered later in review.

## Register (files, grouped; full line-level detail lives in the fresh scan output,
`i18n-remaining-inventory.txt`, regenerated at cycle close)

**Financial/business lab cards (largest group — form labels, toasts, aria-labels):**
deals-tab-card, design-ledger-card, partner-economics-card, pod-patterns-lab-card,
podcast-affiliate-lab-card, pricing-psychology-lab-card, publish-toolkit-card,
receipt-lab-card, release-timing-lab-card, retreat-teaching-lab-card,
sample-launch-lab-card, show-roi-lab-card, storage-health-card, submission-desk-card,
submission-pipeline-card, teach-economics-card, tech-edit-card, test-knit-card,
testknit-desk-card, translation-bundle-card, trunk-show-card, video-social-lab-card,
wholesale-book-card, workshop-teaching-lab-card, yarn-buy-calculator-card,
yarn-estimator-card, yarn-licensing-lab-card

**Pages:** portfolio.tsx, project-grading.tsx, project-pdf.tsx, project-workspace.tsx,
settings.tsx

## Implementation approach
1. Where a component already has a `*-copy.ts` module (established pattern from
   CHK-135–139: `giftcard-copy.ts`, `workspace-copy.ts`, `translation-bundle-copy.ts`,
   `testknit-desk-copy.ts`, `grading-copy.ts`) — extend it with the new keys.
2. Where none exists yet, create a minimal `<component-name>-copy.ts` following the
   same shape: one exported function/const per string, a locale map for en/de/fr/es/pt,
   English fallback for unknown codes.
3. Wire `useSettings()` → `language` into every touched component (most already import
   it for other copy; a few don't yet and need the import added, same as
   `testknit-desk-card.tsx` in CHK-139).
4. No calculation, layout, or prop-contract changes — string source only.
5. Per-line patches (not multiline regex) after CHK-139's documented regex-mangling
   lesson.

## Regression tests
One test file per new/extended copy module, asserting all 5 locales resolve
(pattern from CHK-139: `workspace-copy-sections.test.ts` etc.).

## Gates (will be measured and reported honestly at completion, not assumed)
`tsc --noEmit`, full vitest suite, production build — same three gates as every prior
localization cycle in this log.

## Verification
Screenshots in German (spot-checking a sample across the 32 files, not all 240 lines
individually) plus full unit coverage for every new key across all 5 locales, matching
the CHK-139 verification table format.

## What this cycle deliberately does NOT do
- Does not create separate per-language builds/versions of the app — single codebase,
  key-based dictionary, as established in `src/lib/i18n.ts` since CHK-015.
- Does not touch user-generated data (project names, saved measurement labels, notes)
  — those are content, not UI chrome, and must never be run through the translation
  layer.
- Does not re-open categories already marked "verified not a defect" in CHK-139
  (Gift Card caller-supplied fallback params, project-name `h1`).

## Next step
Awaiting nothing further — proceeding to implementation per this plan. This file will
be updated in place (not superseded) with the completed register, gates, and
verification table once the sweep is done, matching the CHK-139 format.
