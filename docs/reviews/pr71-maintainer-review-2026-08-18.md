# PR #71 Maintainer Review

**Repository:** `plastic-dude/stitch-and-scale-pro`
**Pull request:** [#71](https://github.com/plastic-dude/stitch-and-scale-pro/pull/71)
**Branch:** `domain-foundations/knitwear-qa-records`
**Review date:** 18 August 2026

## Decision summary

PR #71 establishes a sound foundation for deterministic Pattern QA and publication preflight. The original committed change passed the full regression suite, typecheck, build, and whitespace checks. The follow-up audit found and corrected several release-quality issues around browser-locale normalization, warning propagation, custom-standard context, mobile scroll ownership, export decision order, localization leakage, and ledger attribution. The branch is suitable for a follow-up review after the new changes are committed and the complete verification gates are rerun.

A correct grade is necessary but not sufficient for a publishable knitwear pattern. Technical-editing references consistently identify mathematics, grading, stitch and row counts, repeats, charts, schematics, abbreviations, completeness, consistency, and clarity as review concerns [1] [2]. They also distinguish technical editing from test knitting: an automated calculation is not evidence that a real knitter successfully followed the complete pattern [1].

## Findings and dispositions

| Priority | Finding | Evidence | Disposition |
|---|---|---|---|
| High | Browser locale tags could be rejected by preflight even though the app’s i18n layer accepts them. | `en-US` and `pt-BR` normalize by language subtag elsewhere in the app. | Fixed by normalizing before validation and adding regression coverage. |
| High | Pattern QA warnings could disappear from publication status. | Missing measurement labels and similar warnings were not propagated. | Fixed; warnings remain visible without blocking print. |
| High | Partial or stale grading output could look non-empty and still pass. | The previous check only required one graded value somewhere in the result. | Fixed with X-008, which requires every project measurement to have all nine supported sizes. |
| High | Onboarding had competing scroll owners on compact phones and landscape. | Screenshots at 320×568 and 844×390 showed duplicate scrollbar tracks and footer coverage. | Fixed by locking document scroll, constraining the inner owner, using overscroll containment, and reserving safe-area footer clearance. |
| Medium | Export readiness appeared below the template scan. | At 390×844, four template cards preceded the actual readiness decision. | Fixed by placing the preflight status before the template picker. |
| Medium | Export controls had mobile target inconsistencies. | Filename input measured 36px; accent trigger measured 14px; new-project Next measured 38px; ledger delete controls had no explicit target. | Fixed with 44px minimum hit areas on the affected controls and smoke assertions. |
| Medium | PDF export contained English-only labels and theme metadata. | `Pattern Notes`, first-export tip, image-error toast, and theme descriptions were hardcoded or inherited English. | Fixed with five-locale labels, theme-copy registry, and locale contract tests. |
| Medium | Receipt sales were read directly from a localStorage key. | The ledger bypassed the established `projectStorage` adapter for Receipt Lab input. | Fixed by reading through the project-scoped storage seam while preserving Receipt Lab as read-only source of truth. |
| Medium | Fuzzy sale attribution could silently assign revenue to the wrong design. | First-match substring behavior was ambiguous for related design names. | Fixed: exact match wins; a partial match is used only when unique; ambiguous rows remain unattributed but stay in totals. |
| Follow-up | Generated-PDF accessibility and physical print quality cannot be proven from source checks alone. | Tagged-PDF guidance requires structural tags such as `Document`, headings, figures, and tables [3]. | Keep as a separate artifact-level and human-review gate; do not overclaim accessibility or test-knitting. |
| Follow-up | Samples, submissions, test-knit rounds, wholesale follow-up, invoices, and payment commitments are not durable records. | The existing ledger covers designs, expenses, receipt rollups, break-even, monthly P&L, and export. | Roadmapped as separate local-first record types, in that order. |

## Verification evidence

The focused suites passed after the follow-up changes, including Pattern QA, publication preflight, PDF localization, Design Ledger attribution, onboarding gate, and touch-target guards. The new dependency-free CDP smoke runner passed the following checks at 320, 360, 390, and 430px where applicable:

| Journey | Checks |
|---|---|
| Onboarding | No horizontal overflow across compact portrait widths; screenshot artifacts captured. |
| Dashboard | No horizontal overflow after onboarding completion. |
| New project | Required-field validation remains active; disabled Next retains a 44px hit area. |
| Sample workspace | No horizontal overflow; route loads after local sample seeding. |
| PDF export | Preflight status exists before template scan; no horizontal overflow; Export PDF is at least 44px high. |
| Grading Lab | Pattern QA summary is visible; no horizontal overflow. |
| Design Ledger | Ledger opens from All Labs; no horizontal overflow. |

The public Vercel preview used for PR #71 was behind a Vercel login wall in the available browser session. The configured Chrome DevTools MCP session also failed before creating a browser window. The visual evidence therefore comes from an isolated local Vite preview and sandbox Chromium/CDP session; no public deployment or destructive action was performed.

## Release boundaries

The current implementation should not claim tagged-PDF accessibility, print-perfect pagination, successful test knitting, tax treatment, automatic reconciliation, cloud sync, or money movement. It can claim deterministic source checks, visible preflight status, local-first persistence, localized UI coverage for the audited surfaces, and repeatable mobile smoke evidence. The PDF renderer, canonical grading engine, PDF export hook, tab registry, and project data shapes remain protected boundaries.

## References

[1]: https://knitjulep.com/knitting-technical-editing-services/ "Knit Julep — Technical Editing for Knitting"

[2]: https://www.midnightpurl.com/pricing-services "Midnight Purl — Technical Editing and Grading Services"

[3]: https://www.section508.gov/create/pdfs/common-tags-and-usage/ "Section 508 — Common PDF Tags and Their Usage"
