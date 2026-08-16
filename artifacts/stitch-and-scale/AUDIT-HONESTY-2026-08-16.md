# Honesty audit — 2026-08-16

## Scope
This audit compares repository evidence with prior statements that the product was fully localized, fully functional, production-ready, or fully verified.

## Verified from the current tree

- The repository has local modifications in the current working tree; no assumption should be made that the current state is committed or pushed.
- TypeScript typecheck passed immediately after the onboarding localization edits.
- The localization migration is not complete. A broad scan still finds many hard-coded English labels and descriptions in lab components, including listing-test, yarn-pool, spec-sheet, video-social, membership-site, and other workflow surfaces.
- The Brag Cards implementation still contains hard-coded English in the rendering engine and UI. This matters because generated SVG/social copy cannot become multilingual merely because Settings changes language.
- The Payback Lab still contains hard-coded English explanatory copy and labels.
- PDF rendering code still contains hard-coded English labels such as Gauge, Base Size, Yarn Weight, and by.
- The onboarding migration is only partial: headings and some unit labels now use translations, while descriptions, tour items, sample-project copy, and buttons still need inspection and migration.
- A claim such as “all five supported languages render correctly across all routes” is not yet evidenced by automated route-by-locale coverage.

## Claims that must not be repeated without evidence

- “Fully localized” or “entire app translated.”
- “All quality gates passing” unless typecheck, the complete test command, and production build are run against the exact current commit and their outputs are recorded.
- “Production-ready” or “global launch ready.”
- Exact test counts, tab counts, or bundle sizes unless measured from the current tree.
- “Every control is functional” without a current interaction audit.

## Immediate corrective direction

1. Finish the core journey localization before claiming broad i18n support.
2. Make dynamic outputs locale-aware, or explicitly label them English-only until that work is complete.
3. Add tests for locale switching and fallback behavior instead of relying on visual assumptions.
4. Re-run and record typecheck, tests, and build only after the changes are complete.
5. Report remaining gaps plainly rather than hiding them behind a feature-complete label.

## Work completed during this audit

The onboarding flow now translates the sizing description, standards disclosure control, unit explanation, workspace-tour labels and descriptions, sample-project copy, sample actions, and completion copy through the shared `t()` function. TypeScript typecheck passed after these changes.

This is a verified improvement, but it does not justify calling the whole product localized: most lab surfaces, generated social cards, receipt UI, and PDF labels still contain English literals and remain in the next migration tranche.

## Current quality evidence

The actual test run completed successfully: 88 test files and 1,694 tests passed in 5.04 seconds. This confirms the inherited landing statistic of 1,694 verified tests is current at this point in the working tree. It does not, by itself, prove that every visual control, every locale, every export, or every route is correct; those require separate coverage.

The count-drift guard also confirms that the registered workspace tab count is 79, so the landing claim of 79 labs is supported by the current registry. The separate reviewer observation of 75 visible triggers should not be conflated with the 79 registered tabs without explaining the distinction; the registry is the authoritative count used by the project’s own guard.

## Current build evidence

`git diff --check` passed and the production build completed successfully. The current main JavaScript chunk is 806.66 kB minified and 247.30 kB gzip, with Vite still warning that one chunk exceeds 500 kB. Therefore the earlier “about 780 kB” bundle statement is approximate and should not be presented as the current measured value. The build is healthy, but the performance objective is not fully closed while that warning remains.
