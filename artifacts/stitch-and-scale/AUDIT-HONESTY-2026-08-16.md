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

## Full localization pass: initial inventory

The separate landing page and application are distinct localization surfaces. The landing page currently contains hard-coded hero, capability, tester-funnel, founder-disclosure, footer, button, placeholder, and accessibility text. The application contains additional hard-coded user-facing text across the workspace registry, 79 lazy-loaded lab cards, error and empty states, receipts, Brag Cards, share text, PDF rendering, and form labels.

The next implementation pass must therefore distinguish three tasks: translating the landing page itself; translating the application shell and route states; and translating dynamic lab/export content. A language selector alone is not evidence of end-to-end localization.

## Full-surface migration pass — workspace checkpoint

Verified on 2026-08-16:

- Added locale-parity keys for the six workspace group headers and the first 13 core tabs (Sections, Preview, Yarn, Notes, Income, Draft, Pricing, Publish, Test Knit, Tech Edit, Finish, Launch, Channels) in EN/DE/FR/ES/PT.
- Added translated workspace header, section-editor, preview, and notes controls in all five locales, including interpolation for section names.
- Wired the group headers, core tab labels, workspace header actions, section editor, preview, and notes controls to `t()`.
- `pnpm run typecheck` passed; focused i18n and registry tests passed (6 tests).

Honest limitation retained intentionally: the lazy loading fallback is still a literal English string because `LazyPanel` is a module-level helper without access to the React settings context. It must be refactored to receive a localized label before the workspace can be called fully localized. Most later lab tab labels and lab-card copy are also still pending.

This checkpoint is not a full-localization completion claim.

## Localization checkpoint — PDF, Receipt Lab, workspace

- Receipt Lab visible labels, generated share copy, and common feedback messages now use a five-locale catalogue; typecheck and focused i18n tests pass.
- PDF export now receives the active language rather than hard-coding `en`. Export-page controls and major document labels use a five-locale PDF catalogue. The renderer still contains some intentionally non-translated product terminology and theme descriptions that require a later surface audit; this is not yet full PDF localization.
- Workspace group headers, core tabs, header metadata, project-not-found state, undo action, section-editor labels, table headers, and measurement-type options now use locale-aware copy. The full 79-tab lab-card content is not yet fully migrated.
- `git diff --check` and typecheck pass at this checkpoint. Focused regression tests: 10 tests across i18n, count-drift, and tab-registry files passed.
- These changes are verified in the working tree but are not yet a complete end-to-end localization delivery and must not be described as one.

## Brag Cards checkpoint

Brag Cards now consume a typed five-locale catalogue for generated captions, hero units, footer metrics, preview labels, card controls, share/download feedback, default studio placeholders, and the SVG used for downloads/native sharing. The component and renderer passed `pnpm run typecheck` after the change. Remaining audit work: inspect static template/style names and verify rendered output in all five locales; this checkpoint does not yet prove full product-wide localization.

## Full-surface localization re-scan — second pass

The core journey and generated-output surfaces now have locale-aware coverage: landing, 404, onboarding, shell, settings, project creation, workspace groups/core controls, all workspace tab labels, Receipt Lab, Brag Cards, and PDF export labels/metadata. However, a repository-wide literal scan confirms that many of the remaining lazy-loaded lab cards still contain direct English visible copy. Confirmed examples include `pattern-license-card.tsx`, `membership-card.tsx`, `promotion-card.tsx`, `copyright-protection-card.tsx`, `partner-economics-card.tsx`, `yarn-buy-calculator-card.tsx`, `grading-lab-card.tsx`, and `chart-lab-card.tsx`, with labels, helper notes, placeholders, select options, and accessibility text. This is a real unfinished tranche; the product must not be described as fully localized until those lab surfaces and their generated/validation messages are migrated and tested across all five supported locales.

## Localization checkpoint — Chart, workspace accessibility, Settings

- Chart Lab has a five-locale catalogue for editor controls, KPI labels, verdict/severity labels, and C-01–C-07 flag titles; `chart-copy.test.ts` plus chart analysis invariants pass (21 tests).
- Workspace navigation now uses the canonical locale-aware registry label at the live render boundary; the old English label switch no longer overrides translations.
- Section-delete, measurement-edit, and measurement-delete accessibility labels preserve item names while following the active locale.
- Settings now localizes remaining unit, grading-standard, CYC/custom, theme, onboarding-restart, export, restore-backup, and CYC-tooltip copy through `settings-copy.ts`.
- Typecheck passes after repairing the numeric CYC-tooltip formatter mismatch.

Remaining limitation remains explicit: detailed dynamic flag explanations in analysis libraries and many other lazy-loaded lab cards still require locale-aware templates. No full-localization claim is made yet.

## Dynamic lab tranche — Pattern License and Membership

Pattern License Planner now routes its visible title, description, form labels, rights summary labels, comparison summary, and clipboard feedback through a five-locale catalogue. Membership Planner now routes its visible title, description, tier controls, economics labels, result metrics, watch-out empty state, tier-copy heading, and clipboard feedback through a five-locale catalogue. Existing storage, calculations, and generated business diagnostics were intentionally not rewritten in this tranche.

Focused locale tests for Pattern License, Membership, and Chart passed: 3 files and 7 tests. Strict TypeScript typecheck also passed. The diagnostic strings returned from the business-analysis libraries, as well as many other lazy-loaded cards, remain open and are not represented as complete localization.


## Dynamic lab and diagnostic continuation checkpoint

The current working tree now also contains verified five-locale migrations for Promotion Planner, Yarn Pool Lab, and Trunk Show & License Planner. Their primary visible controls, headings, metrics, placeholders, license sections where applicable, and copy feedback are locale-aware; their underlying calculations and storage behavior were preserved.

Chart Lab rendered flag details C-01 through C-07 now use locale-aware guidance for DE/FR/ES/PT, with the original analyzer detail retained as the English fallback so dynamic numeric context is not silently lost. Grading Lab rendered flag details G-01 through G-08 follow the same pattern. Focused diagnostic tests and strict typecheck passed after these changes.

This remains an implementation checkpoint rather than a completion claim. The inventory still contains additional lazy-loaded lab cards and generated diagnostic/export text requiring migration and verification.


## Additional dynamic-card checkpoint

The current working tree now includes further five-locale catalogues and wiring for Copyright Protection Planner, Partner Economics Planner, and Pattern Income Planner. The migrated surfaces cover their principal headings, descriptions, inputs, labels, KPI headings, license/deal controls where applicable, accessibility labels inherited from those controls, comparison-table headings, and clipboard feedback where present. Existing calculations, storage, and analysis logic were preserved. Strict typecheck passed after each bounded wiring pass.

The refreshed inventory still reports many untranslated lab cards, including finance, finishing, inclusive sizing, hiring, international pricing, KAL, and other workflow surfaces. This audit therefore continues to reject any claim of complete product-wide localization until the remaining inventory is migrated and the full test/typecheck/build gates are rerun.


## Design Ledger checkpoint

The Design Ledger record-room shell is now locale-aware across EN, DE, FR, ES, and PT: title, description, Studio/Designs/Costs/Export tabs, studio name/currency/account bridge labels, financial summary headings, monthly P&L headings, design placeholders, first-design validation, add-design feedback, and empty-state copy are translated. Typecheck passed.

This card is not yet marked complete: the cost-entry form, cost-table headings, remove controls, export instructions/buttons, break-even panel, design-row status labels, notes placeholder/save action, and several generated/export descriptions remain to be migrated. The audit deliberately records this boundary instead of overstating the tranche.


## Latest verified records and care surfaces

Design Ledger now covers its cost-entry form, cost table, removal accessibility labels, notes action, export instructions and buttons, and break-even labels through the five-locale catalogue. Finish & Care Guide now covers its title, fibre-blend guidance, put-up and fabric-note fields, placeholders, copy-ready action, and moth-risk label across EN, DE, FR, ES, and PT.

Focused locale-parity tests for both catalogues pass, and strict TypeScript typecheck passes after the wiring. The broader repository remains in migration: the current inventory still contains many untouched cards and several generated diagnostic/value labels, so full product-wide completion has not yet been asserted.


## Gift Card Lab checkpoint

Gift Card Lab’s primary accounting explanation, core control labels, state-escheat label, reset action, KPI headings, watch-out heading, verdict heading, and empty-flag message now use the five-locale catalogue. Gift Card, Finish & Care, and Design Ledger locale-parity tests pass together; strict typecheck passes.

The Gift Card surface is not marked fully complete yet: many explanatory hints, legal/accounting detail strings, flag titles/notes, verdict output, and checklist copy still originate from English-only analyzer/component text. Those are retained as an explicit remaining gap for the diagnostic-message tranche.


## Gift Card diagnostic checkpoint

Gift Card Lab now localizes dynamic verdict labels and all eleven flag titles through the active language, while preserving the analyzer’s numeric values and English fallback. The expanded Gift Card copy test verifies non-English verdict and flag-title mappings; strict typecheck passes.

The flag notes, verdict notes, input hints, and final compliance checklist remain English-generated detail text. They are therefore still open in the diagnostic-detail tranche and are not counted as 100% localized.


## Dashboard checkpoint

Dashboard now uses a five-locale catalogue for the local-storage notice, dismissal accessibility label, project headings/count nouns, search placeholder, spreadsheet-import and JSON-restore tooltips/labels, import/export/delete/duplicate toast titles, and the principal empty-state copy/actions. Dashboard, Gift Card, Finish & Care, and Design Ledger locale tests pass together; strict typecheck passes.

Dashboard still has additional lower-page card/status/menu copy and some dynamic toast descriptions to inspect in the next route-surface pass. This checkpoint is not treated as whole-dashboard completion until the refreshed inventory confirms no user-facing literals remain.


## Import CSV route checkpoint

The Import CSV route now uses five-locale copy for its back link, route title and explanation, CSV template action, file-picker states and hint, pattern/designer labels and placeholders, base-size guidance, stitch/row labels, import confirmation action, and import toast title. Its dedicated parity test passes with the Dashboard, Gift Card, Finish & Care, and Design Ledger tests; strict typecheck passes.

Remaining route work includes the two FileReader error strings, row-count/error summaries, dynamic measurement-found wording, and imported-toast descriptions, which remain explicitly open for interpolation-aware translation rather than being counted as complete.


## New Project checkpoint

New Project now localizes its remaining pattern-name and designer placeholders, sizing-standard indicator, custom/CYC standard names, Settings link, and grading explanation across EN/DE/FR/ES/PT, complementing its existing translated wizard headings and controls. New Project, Import CSV, Dashboard, Gift Card, Finish & Care, and Design Ledger locale tests pass together; strict typecheck passes.

The wizard still requires a final scan for lower-step button and accessibility literals before being marked fully complete. No whole-route completion claim is made yet.


## Portfolio checkpoint

The Portfolio route now localizes its title, catalogue description, launch-plan explanation, item/skill/market controls, numeric input labels and hints, summary cards, launch-ranking explanation, readiness badges, ranking headers, and empty-state dashboard link across EN/DE/FR/ES/PT. Its catalogue parity test passes alongside New Project, Import CSV, Dashboard, Gift Card, Finish & Care, and Design Ledger; strict typecheck passes.

The bundle-candidate section, platform/cadence detail labels, listing-readiness detail wording, and any remaining hard-coded currency/market labels still require a final route scan before Portfolio can be called complete.


## Portfolio full-surface checkpoint

Portfolio’s bundle-candidate card, no-bundle state, platform-net interpolation, and evidence footnotes are now locale-aware in EN/DE/FR/ES/PT. This completes the previously recorded secondary Portfolio gaps without changing portfolio math, bundle pricing, or platform selection. The Portfolio, New Project, Import CSV, Dashboard, Gift Card, Finish & Care, and Design Ledger parity tests pass together; strict typecheck passes.


## Deal Comparator checkpoint

Deal Comparator’s primary flat-fee offer card now uses five-locale copy for verdict badges, fee/support labels, optional badge, resale-rights control, option text, and terms-copy feedback. The active locale catalogue is also scoped into the secondary design-offer section so further migration can continue without architectural rework. Its parity test passes alongside Portfolio, New Project, Import CSV, Dashboard, Gift Card, Finish & Care, and Design Ledger; strict typecheck passes.

The secondary design-offer heading, explanation, offer-type labels, royalty/exclusivity/coverage controls, accessibility labels, and its separate copy toasts remain open and are not counted as translated yet.


## Deal Comparator secondary-surface checkpoint

The secondary design-offer evaluator now consumes the active five-locale catalogue for its section heading, explanatory text, fee/royalty/support/price/sales labels, own-channel rights options, effective-rate and offer-value summaries, and copy action. The locale catalogue is scoped through the evaluator without changing its deal calculations. Deal Comparator parity and the current route/lab catalogue tests pass; strict typecheck passes.

Its offer-type option labels, coverage controls, accessibility labels, diagnostic flag details, summary text, and some verdict labels still require a final exact-copy pass and remain open.


## Inclusive Sizing checkpoint

Inclusive Sizing’s primary visible surface now uses EN/DE/FR/ES/PT copy for its heading and explanation, economics inputs, platform selector label, cup and petite/tall switches, size range, add-size action, adaptive-modification heading, audit/effort/cost/baseline metrics, yardage, pricing, inclusivity, launch-copy, notes, and clipboard feedback. The catalogue parity test passes with the current Deal Comparator, Portfolio, New Project, Import CSV, Dashboard, Gift Card, Finish & Care, and Design Ledger tests; strict typecheck passes.

Dynamic analyzer-produced modification names, strategy text, Wolcott warning, per-size notes, inclusivity-check rationale, and generated launch-copy content remain open because they require locale-aware templates at the analysis layer; they are not counted as fully translated yet.


## Inclusive Sizing dynamic-output checkpoint

The Inclusive Pack builder now accepts typed locale templates and uses them for effort-priced, plus-yardage-transparency, adaptive-consulting, and paste-ready launch-copy shells. The component passes the active locale catalogue into the pack builder, so the generated checklist and launch-copy framing no longer default to English in non-English sessions. The expanded dynamic-copy parity test passes with the current eight route/lab catalogue tests; strict typecheck passes.

The analyzer’s remaining generated strategy bullets, Wolcott warning, per-size yarn-cost note, audit check/rationale sentences, adaptive-mod descriptions, and the numeric badge statement still need the same template treatment and remain open.


## Gauge & Fit Translator checkpoint

Gauge & Fit Translator now uses EN/DE/FR/ES/PT copy for its title and explanation, published pattern-gauge labels and hints, tester controls and placeholders, primary measurement and target-fit controls, no-grading guidance, recommendation badge, ratio labels, result-table headings, and verdict shell. Its focused parity test passes with the current nine route/lab catalogue tests; strict typecheck passes.

The analyzer-generated tester flag titles/notes, verdict text, and dynamic measurement labels still need a locale-aware diagnostic layer and remain open. They are not counted as fully translated by this checkpoint.


## Gauge & Fit diagnostic checkpoint

GF-01 through GF-05 flag titles and the four analyzer verdict states now pass through locale-aware helpers in DE/FR/ES/PT, with English fallback for unknown or future codes. The focused Gauge & Fit copy test and strict typecheck pass.

The detailed tester notes, verdict notes, and dynamic measurement-key labels still contain analyzer-generated English and remain open for the next diagnostic-template pass; this checkpoint therefore does not claim full Gauge & Fit localization.


## Gauge & Fit detailed-warning checkpoint

GF-01–GF-05 warning notes now use locale-aware templates with preserved tester names, stitch ratios, row ratios, and percentage context in all five supported languages. Focused Gauge & Fit regression coverage and strict typecheck pass.

The analyzer’s four detailed verdict-note branches and dynamic FIT_KEYS_LABEL measurement names remain the next narrow gap; they are not being counted as complete until translated at source or through a typed helper.


## Gauge & Fit diagnostic completion checkpoint

Gauge & Fit now localizes its remaining dynamic diagnostic surface: GF-01–GF-05 titles and detailed notes, all four verdict states and verdict-note branches, and the primary measurement-key labels. Tester names, ratios, percentages, and counts remain interpolated from the analyzer results. The focused diagnostic-copy test passes and strict typecheck passes.


## Ad Break-Even Lab checkpoint

Ad Break-Even Lab now uses five-locale copy for its title, explanation, platform and financial inputs, Offsite Ads tier explanation, budget heading, channel metrics, channel ordering heading, email baseline, best-paid-channel summary, no-paid state, and email-list recommendation. Its focused catalogue test and strict typecheck pass.

The remaining channel-specific platform labels, verdict badge labels, dynamic channel reasons, and detailed budget reason are still analyzer-generated English and remain open for a diagnostic/template pass.


## Ad Break-Even verdict badge checkpoint

The Ad Break-Even channel verdict badges (fund, avoid, baseline, marginal) and budget badges (fund, skip, test small) now use locale-aware helpers in all five supported languages. Strict typecheck passes after passing the active language through ChannelRow.

Dynamic channel names/descriptions and analyzer-generated reason paragraphs remain open; the audit intentionally separates this badge checkpoint from full diagnostic completion.


## Ad Break-Even channel-label checkpoint

Channel names in the result rows and best-paid-channel summary now use locale-aware mappings for all five supported languages, with the existing English channel registry retained as fallback for future channel IDs. Strict typecheck passes.

Analyzer-generated channel descriptions/reasons and budget-reason paragraphs remain open for a source-template migration.


## Ad Break-Even dynamic explanation checkpoint

The rendered channel reason paragraphs and budget reason now use locale-aware templates for all five supported languages, with the analyzer’s original numeric-rich text retained as fallback for unknown future values. Focused Ad Break-Even catalogue coverage and strict typecheck pass.

The localized templates intentionally keep numeric economics in the adjacent metric cells; the next pass should verify visual density and confirm the full analyzer source remains covered by the locale helpers.


## Body Schematic checkpoint

The shared Body Schematic now localizes its Measurement Reference heading, explanatory sentence, SVG accessibility label, and all fourteen measurement labels in EN/DE/FR/ES/PT, with fallback labels retained for future grading keys. Its focused parity test passes alongside Ad Break-Even coverage, and strict typecheck passes.


## Box Inclusion primary-surface checkpoint

Box Inclusion Lab now localizes its title, offer explanation, all input labels, checkboxes, exposure funnel, financial metric headings, industry-anchor note, watch-out heading, and verdict shell in EN/DE/FR/ES/PT. Its focused parity test passes alongside Body Schematic and Ad Break-Even tests, and strict typecheck passes.

Dynamic Box Inclusion flag titles, flag notes, verdict wording, and the full industry-anchor evidence paragraph remain open for a source-template pass.


## Box Inclusion dynamic-label checkpoint

The BI-01 through BI-09 flag titles and all five Box Inclusion verdict labels now use locale-aware helpers in EN/DE/FR/ES/PT. The focused Box Inclusion parity test passes and strict typecheck passes. Detailed flag notes and verdict-note paragraphs remain open for the next source-template pass; they are not being counted as complete here.


## Box Inclusion dynamic-note checkpoint

BI-01 through BI-09 flag-note prose and all five verdict-note templates now use locale-aware helpers in EN/DE/FR/ES/PT. The focused Box Inclusion catalogue test passes and strict typecheck passes. Numeric evidence remains visible in the adjacent metric cards, while unknown future flag IDs retain the analyzer’s original text as fallback.


## Channel & Funnel Planner primary-surface checkpoint

Channel & Funnel Planner now localizes its title, explanation, channel offer controls, selector labels, input labels, exclusivity choices, marketing-insert and written-terms switches, deadline label, newsletter-funnel heading, and clipboard feedback in EN/DE/FR/ES/PT. Its focused parity test passes alongside the latest Box Inclusion, Body Schematic, and Ad Break-Even tests; strict typecheck passes.

The remaining generated analyzer notes, channel-type option labels, funnel input labels beyond the first tranche, and paste-ready pitch text remain open for the next bounded pass.


## Channel & Funnel dynamic-rendering checkpoint

Channel & Funnel Planner now uses locale-aware channel-type labels, verdict badges, and dynamic analyzer-note rendering in addition to its primary five-locale card surface. The focused Channel & Funnel, Gauge & Fit, Box Inclusion, and Ad Break-Even catalogue tests pass; strict typecheck passes. The numeric analyzer and fallback behavior remain unchanged. Generated launch-week insight and paste-ready pitch prose remain the next dynamic-output gap.


## Localization checkpoint — hiring, protection, deal, and drafting surfaces

The current working tree now includes verified five-locale coverage for the Hire vs Self card, Copyright Protection’s watch-word/evidence/escalation controls, the Deals tab’s principal offer workflows and clipboard feedback, and Pattern Draft’s shell, editor actions, save/copy feedback, placeholder, preview controls, and footer guidance. Existing calculations, storage seams, and generated business-analysis values were preserved rather than rewritten without an explicit diagnostic-template pass.

Focused regression runs passed for the migrated surfaces: 6 test files and 118 tests in the combined Deals/Copyright/Pattern Draft and earlier migration subset. Strict TypeScript passed after each bounded integration pass. The refreshed literal inventory still reports many untouched cards and some dynamic analyzer prose, token hints, offer subtitles, export text, and generated values. This checkpoint therefore does not support a claim of complete end-to-end localization; the remaining inventory and the full repository quality gates remain open.


## Localization checkpoint — drafting and platform economics

Pattern Draft now uses a five-locale catalogue for its editor shell, live guidance, save/copy feedback, sample action, placeholder, preview toggle, and computed-number footer. Platform Mix now uses a five-locale catalogue for its planner shell, store-wide inputs, offsite-ads control, copy feedback, and total KPI headings. Existing draft rendering, local storage, platform economics, and analyzer calculations were preserved.

The combined focused verification for these and adjacent migrated surfaces passed: 5 test files and 42 tests; strict TypeScript also passed. The regenerated inventory still lists numerous untouched cards and dynamic English output, so this remains a bounded checkpoint rather than a full-localization claim.


## Localization checkpoint — Pattern Club

Pattern Club & Magazine Lockout now has a five-locale catalogue wired to its shell, tabs, clipboard action, platform labels, core result headings, and magazine-offer headings. The planner’s storage, club economics, magazine comparison, and generated FAQ/reply behavior were preserved. A parity regression test covers all five locale objects.

Pattern Club planner tests and the expanded copy suite passed: 3 test files and 36 tests. Strict TypeScript passed, and the inventory was regenerated. Dynamic FAQ/reply prose, verdict notes, many field hints, and additional untouched lab cards remain open; this checkpoint is not a full-localization claim.


## Localization checkpoint — Channel Funnel residual controls

Channel Funnel’s remaining email-funnel inputs, launch metrics, pitch toggle, pitch form labels, marketing-insert label, and copy accessibility label now use its existing five-locale catalogue. Existing channel/funnel calculations, notes, and generated pitch text were preserved; generated insight and pitch prose remains a separate dynamic-copy task.

Focused Channel Funnel and catalogue verification passed: 3 test files and 22 tests. Strict TypeScript passed and the inventory was regenerated. The repository still contains many untouched cards and English analyzer output, so no full-localization claim is warranted.


## Localization checkpoint — Install Banner

The install banner now follows the active locale for its title, standard-device guidance, iOS guidance, install progress state, install action, acknowledgement action, and dismiss accessibility label. A five-locale parity regression test was added.

The expanded locale suite passed: 2 test files and 7 tests. Strict TypeScript, inventory regeneration, and git diff integrity checks passed. This is a bounded global-surface completion, not evidence that every remaining card or generated diagnostic is localized.


## Localization checkpoint — Channel Migration static surface

Channel Migration Lab now uses a five-locale catalogue for its shell, pattern-and-sales inputs, fee controls, comparison table headings, KPI labels, watch-out heading, and verdict heading. Numeric migration math and channel analyzer outputs were not altered.

Channel Migration tests and expanded catalogue parity verification passed: 2 test files and 43 tests. Strict TypeScript, inventory regeneration, and git diff integrity checks passed. Generated explanatory notes, flag titles, verdict text, channel labels, and unit suffixes remain explicit follow-up work; this checkpoint is intentionally limited to the static visible surface.


## Localization checkpoint — Chart Lab static surface

Chart Lab’s remaining hard-coded stitch units and source note now use its existing five-locale catalogue. The catalogue parity structure remains intact, and the chart analyzer’s numeric behavior was not changed.

Chart Lab and catalogue verification passed: 2 test files and 25 tests. Strict TypeScript passed. Dynamic row instructions from `rowProse`, verdict reasons, CYC symbol names, and the inventory’s remaining card surfaces remain open; this is deliberately not a claim of complete Chart Lab localization.


## Localization checkpoint — Club Revenue static surface

Club Revenue Model now follows the active locale for its shell, evidence-bounded description, membership section, core membership and pricing inputs, and copy feedback toasts. Revenue calculations, storage, and generated founding-offer content were not changed.

Club Revenue planner tests and catalogue parity verification passed: 2 test files and 31 tests. Strict TypeScript, inventory regeneration, and git diff integrity checks passed. Lower output headings, generated email prose, benchmark wording, and remaining controls are still open; no complete-card claim is made here.


## Localization checkpoint — Collaboration Deal Math static surface

Collab Deal Math now uses a five-locale catalogue for its shell, rights controls, designer-side controls, economics labels, channel comparison headings, best-structure note, counter-offer heading, copy action, and copy feedback. Deal calculations and generated counter-offer content were not altered.

Collab Deal Math tests and catalogue parity verification passed: 2 test files and 30 tests. Strict TypeScript, inventory regeneration, and git diff integrity checks passed. Analyzer-generated hints, clause flags, detailed reasons, structure labels from the shared analyzer, and generated counter-offer prose remain open; this checkpoint does not claim complete dynamic localization.


## Localization checkpoint — Collaboration Evaluator static surface

Collab & Exposure Evaluator now uses a five-locale catalogue for its shell, offer controls, baseline inputs, royalty controls, KPI headings, verdict labels, red-flag heading, reply heading, and copy feedback. The evaluator’s calculations, red-flag logic, and generated reply letter were not changed.

Collab Evaluator tests and catalogue parity verification passed: 2 test files and 30 tests. Strict TypeScript, inventory regeneration, and git diff integrity checks passed. Analyzer-generated hints, collab-type option labels, red-flag text, verdict reasons, generated reply prose, and benchmark/source note remain open; this checkpoint does not claim complete dynamic localization.


## Localization checkpoint — Design Ledger secondary surface

Design Ledger now uses locale-backed copy for monthly table headers, design-row economics, export feedback, and the empty design label in addition to its existing localized shell and record-room controls. Ledger calculations, storage, CSV generation, and summary generation were not changed.

Design Ledger tests and catalogue parity verification passed: 2 test files and 25 tests. Strict TypeScript, inventory regeneration, and git diff integrity checks passed. Expense category labels, design-status labels, dynamic CSV/summary content, and some remaining hints still depend on shared or analyzer-level copy and remain open; no complete-card claim is made here.


## Localization checkpoint — KAL Planner static surface

KAL Planner now uses a five-locale catalogue for its shell, format and pricing controls, sales and duration controls, prize and effort controls, P&L tile headings, prize-recovery wording, mystery clue calendar labels, reveal note, and red-flag heading. The planner’s calculations and analyzer output objects were not changed. A malformed prize-recovery JSX edit was caught by strict TypeScript and repaired before verification.

KAL Planner tests and catalogue parity verification passed: 2 test files and 26 tests. Strict TypeScript, inventory regeneration, and git diff integrity checks passed. Shared KAL format labels, benchmark paragraph, dynamic verdict reason and suggestion, and individual red-flag labels/details remain open; this checkpoint does not claim complete dynamic localization.


## Localization checkpoint — KAL and Collab ROI static surface

KAL and Collab ROI now uses a five-locale catalogue for its campaign, affiliate, cost-and-hours, verdict, KPI, rights-check, fee-range, pitch-control, and source-note labels. Existing ROI calculations, storage, rights evaluation, fee estimation, and generated pitch behavior were preserved.

The KAL ROI planner tests and catalogue parity verification passed: 2 test files and 36 tests. Strict TypeScript, inventory regeneration, and git diff integrity checks passed. Rights-check item details, fee notes, verdict result metrics, generated pitch prose, and analyzer source content remain open dynamic work; this checkpoint does not claim complete localization of the card.


## Localization checkpoint — Kit Economics static surface

Kit Economics now uses a five-locale catalogue for its shell, yarn and cost inputs, sales-channel volumes, COGS and KPI labels, capacity badges, best-channel messaging, consignment checklist heading, proposal heading, and clipboard feedback. The CopyLine helper now receives locale-aware copy-state labels; calculations, local storage, channel analysis, clause generation, and proposal generation were preserved.

Verification passed: 2 test files and 32 tests, strict TypeScript, regenerated inventory, and git diff integrity. Generated consignment clauses, generated kit proposal prose, channel labels sourced from analyzer constants, and remaining technical unit strings are still explicit follow-up work; this checkpoint does not claim 100% localization.


## Localization checkpoint — Launch Campaign static surface

Launch Campaign now uses a five-locale catalogue for its shell description, launch settings, URL and coupon labels, readiness inputs, launch gates, readiness heading, revenue-card headings, momentum labels, timeline controls, phase badges, milestone accessibility actions, post-launch review, reset action, and milestone clipboard feedback. The campaign planner, persistence seam, readiness calculations, revenue projection, gates, milestone generation, and review storage remain unchanged.

Verification passed: Launch Campaign tests plus the expanded catalogue parity suite (2 files, 32 tests), strict TypeScript, regenerated i18n inventory, and git diff integrity. Analyzer-generated gate labels and explanations, seasonal notes, readiness item labels and hints, milestone titles/checklists/copy, guardrail reasons, momentum reason, banner numeric prose, and post-launch placeholder remain explicit dynamic-prose gaps; this checkpoint does not claim full localization.


## Localization checkpoint — Listing SEO Lab static surface

Listing SEO Lab now uses a five-locale catalogue for its shell, pre-publish description, planned-listing section, title and tag placeholders, numeric input labels, listing switches, net-per-sale heading, documented fee note, paste-ready kit labels and copy action, and first-week momentum section. The listing score, channel fee calculations, kit generation, tag parsing, storage, and momentum calculations remain unchanged.

Verification passed: Listing SEO analyzer tests plus the expanded catalogue parity suite (2 files, 30 tests), strict TypeScript, regenerated i18n inventory, and git diff integrity. Scorecard item labels and hints, score verdict text, channel names and fee notes, generated listing title/tags/description, momentum values and reason, and the full dynamic kit prose remain explicit open localization surfaces; this checkpoint does not claim full localization.


## Localization checkpoint — Listing Test Lab static surface

Listing Test Lab now uses a five-locale catalogue for its shell, low-traffic explanation, queue controls and feedback, listing inputs, platform fee hints, test-variable controls, statistical inputs, honest-math metrics, methodology note, warnings heading, and verdict heading/badge labels. The underlying Miller test, expected-value ranking, queue ordering, storage, and numeric calculations remain unchanged.

Verification passed: Listing Test analyzer tests plus the expanded catalogue parity suite (2 files, 42 tests), strict TypeScript, regenerated i18n inventory, and git diff integrity. Analyzer-generated warning titles/details, queue verdict badges, verdict notes, and any generated recommendation prose remain explicit open dynamic localization surfaces; this checkpoint does not claim full localization.


## Localization checkpoint — Lookbook Desk static surface

Lookbook Desk now uses a five-locale catalogue for its explanation, shoot-tier controls, economics and hour inputs, tester-photo switch, platform labels, gallery image unit, tier-comparison headings, planned badge, verdict shell, shot-list heading, required badge, empty state, flags heading, and benchmark note. The photo-budget analyzer, platform minimum calculations, tier economics, shot-list generation, storage, and severity styling remain unchanged.

Verification passed: Lookbook analyzer tests plus the expanded catalogue parity suite (2 files, 39 tests), strict TypeScript, regenerated i18n inventory, and git diff integrity. Analyzer-generated tier names, verdict reason, hours summary, shot kinds/shots/reasons, flag severity/messages, and other dynamic diagnostic prose remain explicit open localization surfaces; this checkpoint does not claim full localization.


## Localization checkpoint — Magazine Submission Lab static surface

Magazine Submission Lab now uses a five-locale catalogue for its explanation, deal-model options, contract structure, royalty inputs, publisher-coverage inputs, self-publishing baseline, comparison stat boxes, negative-result explanation, market-sanity note, watch-outs heading, and verdict shell. The deal analyzer, royalty math, break-even calculations, storage, and verdict coloring remain unchanged.

Verification passed: Magazine Submission analyzer tests plus the expanded catalogue parity suite (2 files, 46 tests), strict TypeScript, regenerated i18n inventory, and git diff integrity. Analyzer-generated deal verdicts, flag titles, verdict notes, and other dynamic diagnostic prose remain explicit open localization surfaces; this checkpoint does not claim full localization.


## Localization checkpoint — Marketplace Take-rate Lab static surface

Marketplace Take-rate Lab now uses a five-locale catalogue for its explanation, channel labels, monthly-unit and average-price controls, Offsite Ads settings, PayPal controls, Ravelry tier toggle, portfolio summary, fee-leak leaderboard, threshold-alert heading, watch-outs heading, verdict shell, and reference note. Channel fee calculations, thresholds, annualization, concentration metrics, storage, and severity styling remain unchanged.

Verification passed: Marketplace Take-rate analyzer tests plus the expanded catalogue parity suite (2 files, 42 tests), strict TypeScript, regenerated i18n inventory, and git diff integrity. Threshold crossing details, channel-specific labels returned by the analyzer, flag titles, verdict notes, and other generated diagnostic prose remain explicit open localization surfaces; this checkpoint does not claim full localization.


## Localization checkpoint — Membership Site Lab static surface

Membership Site Lab now uses a five-locale catalogue for its explanation, audience and conversion controls, pricing and retention controls, fee-stack label, scenario table headings, KPI cards, watch-outs heading, and verdict shell. Membership math, churn lifetime, fee-stack calculations, persistence, and verdict styling remain unchanged.

Verification passed: Membership Site analyzer tests plus the expanded catalogue parity suite (2 files, 42 tests), strict TypeScript, regenerated i18n inventory, and git diff integrity. Fee-stack option names, scenario labels, analyzer flag titles, verdict notes, and other generated diagnostic prose remain explicit open localization surfaces; this checkpoint does not claim full localization.


## Localization checkpoint — Pattern Bundle Lab static surface

Pattern Bundle Lab now uses a five-locale catalogue for its shell explanation, pattern and bundle controls, split-mode options, launch volume and labor inputs, deal-math metrics, scenario-table headings, empty state, watch-outs heading, and verdict shell. Bundle calculations, weighted/equal split semantics, persistence, and analyzer behavior remain unchanged.

Verification passed: Pattern Bundle analyzer tests plus the expanded catalogue parity suite (2 files, 46 tests), strict TypeScript, regenerated i18n inventory, and git diff integrity. Scenario names, analyzer flag titles, verdict notes, percentage/unit phrasing, and other generated diagnostic prose remain explicit open localization surfaces; this checkpoint does not claim full localization.


## Localization checkpoint — Pattern License secondary control

Pattern License Planner’s remaining static royalty field label is now locale-backed through the existing five-locale catalogue. The licensing math, rights scoring, offer calculations, storage, and copy behavior remain unchanged.

Verification passed: Pattern License analyzer tests plus the expanded catalogue parity suite (2 files, 39 tests), strict TypeScript, regenerated i18n inventory, and git diff integrity. Platform and licence-option labels, yarn-weight values, rights-audit check titles, verdict notes, offer-letter text, and other analyzer-generated prose remain explicit open localization surfaces; this checkpoint does not claim full localization.


## Localization checkpoint — Payback Lab

Payback Lab now uses a five-locale catalogue across its shell description, empty state, hourly-rate controls, summary metrics, tabs, per-design badges, recoup metrics, cost and time labels, what-if panel, stale-sale notice, and local-first note. The card continues to read the Design Ledger and Receipt Lab locally, preserve project-scoped settings, and compute payback values without semantic changes.

Verification passed: Payback analyzer tests plus the expanded catalogue parity suite (2 files, 37 tests), strict TypeScript, regenerated i18n inventory, and git diff integrity. Design status values, source-derived design names and categories, dynamic verdict/result prose, currency-hour fragments, and analyzer-specific wording remain explicit open localization surfaces; this checkpoint does not claim full localization.


## Localization checkpoint — Photo ROI Lab

Photo ROI now selects the active language from SettingsContext and localizes the complete user-facing surface in English, German, French, Spanish, and Portuguese: card title and description, controls, section headings, hints, style buttons, option metrics, best-option badge, thumbnail-lift results, red-flag details, verdict branches, suggestions, and the style-selection toast. The analyzer keeps its existing default English behavior for non-UI callers while accepting an optional locale, so economic calculations and existing API semantics remain unchanged.

Verification passed: strict TypeScript, Photo ROI behavioral tests plus the locale parity suite (2 files, 36 tests), and git diff integrity. Currency symbols, source names, and technical identifiers remain intentionally technical or source-derived; they are not treated as user-facing untranslated copy claims.


## Localization checkpoint — Photo ROI and POD Book

Photo ROI is verified across the active five-language catalogue: its card shell, controls, hints, style labels, option metrics, best badge, thumbnail results, dynamic verdict/flag/suggestion templates, and accessibility labels now follow the active locale. Strict TypeScript, Photo ROI tests, locale parity tests, and `git diff --check` passed.

POD Book now has a typed five-locale catalogue wired into its title, description, form labels, channel/table headings, payout status labels, KPI headings, checklist/summary headings, clipboard feedback, copied-summary framing, watch-out prefix, and modelled-economics disclosure. Strict TypeScript, POD Book planner tests, Photo ROI tests, locale parity tests, and `git diff --check` passed. This is intentionally recorded as a partial card migration: numeric form hints, channel names/traffic notes, checklist item text, verdict reason, watch-out detail strings, and several generated pitch sentences still originate from analyzer or source data and remain open for the dynamic-prose tranche. No full-localization claim is made.


## Localization checkpoint — Pricing Advisor

Pricing Advisor now uses the active locale for its title, description, form labels, item-type and skill-level options, market-position options, checkboxes, recommendation and floor KPI labels, underpricing status, current-price comparison, market-band tables, reasoning/volume headings, and market-data disclosure. A typed parity test covers all five locale objects and nested option maps. Strict TypeScript, Pricing Advisor, POD Book, Photo ROI, and shared locale tests passed: 4 files, 70 tests; `git diff --check` also passed.

The advisor’s generated reasoning lines, band labels, volume-scenario labels, platform labels, and source-derived economic wording still come from the analyzer and remain open for the dynamic-prose and shared-label tranche. The shell migration is therefore verified but not a claim of complete Pricing Advisor localization.


## Localization checkpoint — Price Window

Price Window now uses the active five-language catalogue for its title, description, baseline controls, platform context labels, discount and sale-window controls, discount guidance, launch-month heading, advanced controls, launch-vs-full-price framing, discount-train heading, season-map heading, listing-copy label, and clipboard feedback. The catalogue parity regression is green. Strict TypeScript, Price Window optimizer, Pricing Advisor, POD Book, Photo ROI, and shared locale tests passed: 5 files, 85 tests; `git diff --check` passed.

This checkpoint does not claim full localization: season labels/notes, path-row verdict names and notes, trap item details, generated listing copy, and some platform labels remain analyzer/source-derived and are open for the dynamic-prose/shared-label tranche.


## Cumulative quality checkpoint — 2026-08-16

After the Photo ROI, POD Book, Pricing Advisor, and Price Window localization checkpoints, the complete Vitest suite passed: **110 test files and 1,752 tests**. The production build completed successfully in 6.40 seconds. Vite still reports the known large main chunk warning (`index` approximately 878 kB / 272 kB gzip), so the application remains functionally green but code-splitting optimization is still an explicit performance limitation. The build also emits non-fatal sourcemap-location warnings for several shared UI components; these do not fail the build and are retained as technical follow-up rather than silently omitted.


## Localization checkpoint — Retention Planner

Retention Planner now uses the active five-language catalogue for its title, description, list and release inputs, platform/tooling/acquisition labels, benchmark hint, monthly KPI headings, retention-advantage heading, repeat ladder heading, 12-month revenue heading, and clipboard feedback. Strict TypeScript, Retention Planner, Price Window, Pricing Advisor, POD Book, Photo ROI, and shared locale tests passed: 6 files, 105 tests; `git diff --check` passed.

Remaining open work is explicit: analyzer-generated verdict notes, email-tier labels, platform labels, cohort step labels, retained/acquired narrative fragments, and later summary sections still need dynamic/localized treatment. This checkpoint is not a claim of complete Retention Planner localization.


## Inventory closure — Club Revenue accessibility label

The remaining `aria-label="Copy email"` literal in Club Revenue was moved into the existing five-locale catalogue and the button now reads its active-language label. Strict TypeScript, the shared locale parity suite, Retention Planner, and Price Window tests passed: 3 files, 60 tests; `git diff --check` passed. This closes one concrete accessibility inventory item without claiming that all secondary-card remnants are finished.


## Localization checkpoint — Launch Campaign

Launch Campaign’s remaining shell literals are now routed through the five-language catalogue: reset toast title, launch-date summary sentence, Ravelry and Etsy URL placeholders, coupon placeholders, email-list/sales/photo/ad placeholders, and the existing active-language milestone copy surface. A typed `launchDateSummary` helper was added for all five locales. Strict TypeScript, Launch Campaign behavior, shared locale parity, and `git diff --check` passed: 2 files, 45 tests.

This is not a claim of complete Launch Campaign localization. Milestone titles/details, readiness gate reasons, guardrail/banner explanations, generated campaign copy, platform/market labels, and user-entered/default source text remain candidates for the dynamic-prose and data-label passes.


## Accessibility checkpoint — Storage Badge

The persistent Storage Badge now localizes its visible local-only status, accessibility label, device-only data warning, and backup action across EN, DE, FR, ES, and PT. Strict TypeScript, the shared locale parity suite, and `git diff --check` passed; the parity suite now reports 29 tests.

The Launch Campaign checkpoint also remains verified: its typed date-summary helper and remaining placeholder/reset strings are localized and covered. Neither checkpoint changes the broader status: dynamic analyzer/source-derived prose and several remaining secondary cards still require migration.


## Autonomous advancement checkpoint — Pattern Bundle partner baselines (2026-08-17)

The reviewer-proposed Pattern Bundle correctness gap was addressed narrowly in `src/lib/pattern-bundle-lab.ts`. The first designer retains the legacy shared `soloSalesPerPattern` baseline for saved-project compatibility, while each partner pattern now uses its own collected `monthlySales` input when computing its solo-window baseline and bundle gain/loss. A focused regression in `src/lib/pattern-bundle-lab.test.ts` proves that changing a partner’s collected sales changes that partner’s baseline and incremental result. No coalition split, fee, or pricing calculation was otherwise changed.

Evidence: focused Pattern Bundle tests passed 25/25; strict TypeScript passed; full Vitest passed 110 files / 1,756 tests; production build passed in 6.40 seconds. Visual verification opened the sample project at localhost, opened Bundle Lab, and confirmed the three pattern price/sales input rows, scenario table, verdict, and no visible runtime error. The build retains the existing non-fatal chunk-size warning. This checkpoint does not close unrelated reviewer findings or the broader five-language dynamic-prose inventory.

Research for this cycle is recorded separately in `/home/ubuntu/research/competitors-session-86-finance-admin-and-cost-accuracy.md`; the fresh competitor set was Craftybase, Wave, and Invoice Ninja. The implementation selection remained the reviewer-gated Pattern Bundle correctness fix from the staff prompt.


## CHK-100 — royalty exact-once regression evidence (2026-08-17)

This cycle researched a fresh competitor set—NuORDER, HoneyBook, and the historical Tundra case—without repeating the prior competitor files. The research is saved at `/home/ubuntu/research/competitors-session-100-wholesale-client-ops.md`.

The reviewer staff prompt identified the royalty double-count as a standing MAJOR. Inspection showed the production arithmetic was already corrected at HEAD: net-base royalties are computed as `companyNet * royaltyPct`, and the direct baseline is not cost-subtracted a second time. Rather than make an unnecessary behavioral change, a focused regression was added to `yarn-company-deal.test.ts` proving the royalty rate is applied exactly once and rejecting the double-rate result. This is evidence closure for the code path, not a claim that the live reviewer issue has been externally closed.

Verification: focused Yarn Company Deal tests passed (16/16); strict TypeScript passed; full Vitest passed (110 files, 1,757 tests); production build passed in 6.14 seconds. The build retained the known non-fatal warning about the 879.56 kB main chunk. Visual verification passed in the sample project at the Yarn Licensing Lab: offer inputs, economics cards, negative-net watch-out, and existing tab layout rendered without runtime or layout errors. Screenshot: `chk-100-yarn-licensing.webp`.

Boundaries: the cycle added regression evidence and did not alter royalty calculations because the reviewer-proposed implementation was already present. Remaining i18n dynamic prose, open reviewer findings, and live GitHub issue/PR status remain separate work.


## CHK-101 — Pattern Bundle partner-outcome completion (2026-08-17)

Fresh market research used a non-repeated competitor set: Airtable, Bonsai, and Sortly. The research is saved at `/home/ubuntu/research/competitors-session-101-record-room-and-operations.md`. It confirmed a differentiation opportunity around a knitwear-specific, local-first record room, but the reviewer-only rule prevented inventing a new tab without a reviewer proposal.

The reviewer-proposed Pattern Bundle gap was already partially closed: the card collected partner patterns, persisted them through the project-scoped storage seam, and the analyzer used each partner’s monthly-sales input. This cycle completed the end-to-end surface by adding a localized five-language **pattern-by-pattern outcome table** at realistic sales. It exposes each collected pattern’s share, net take, solo baseline, and gain/loss, making the partner inputs visible and decision-useful without changing coalition calculations.

Verification: strict TypeScript passed; focused Pattern Bundle and locale-parity tests passed (54/54); full Vitest passed (110 files, 1,757 tests); production build passed in 6.51 seconds. The existing non-fatal warnings remain: dynamic/static import overlap and a main chunk above 500 kB. Visual verification passed at the sample project’s Bundle Lab: three partner patterns rendered, the outcome table showed all three rows, and no runtime or layout errors appeared. Evidence screenshot: `docs/verification/chk-101-pattern-bundle.webp`.

Boundaries: the new table is a reviewer-supported completion of the existing Bundle Lab path, not a new Design Ledger implementation. Remaining dynamic-prose i18n work, unresolved reviewer backlog, and live GitHub issue/PR status remain open.
