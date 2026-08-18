# Release Trust Milestone — Expansion Branch

**Date:** 18 August 2026
**Base:** `domain-foundations/knitwear-qa-records` at `4dcedd1`
**Branch:** `milestone/release-trust-and-records`

## Purpose

This branch extends PR #71 before review and merge. It turns the existing Pattern QA and publication-preflight foundation into a broader local-first operating layer for independent knitwear designers. The original PR branch remains unchanged and merge is deliberately deferred until this expansion is reviewed.

## What was built

| Area | Implementation | Evidence |
|---|---|---|
| Artifact-level publication inspection | Pure HTML artifact inspection for empty output, title/headings, missing image alt attributes, tables, and pagination markers. X-009 is added to publication preflight; empty rendered output blocks print. | `src/lib/pdf/artifact-inspection.ts`, focused tests, export panel evidence line. |
| Technical-editor defect ledger | Project-scoped persisted ledger with QA import de-duplication, affected sizes, evidence, reproduction/location, status, disposition, and summary counts. | `technical-editor-ledger.ts`, `technical-editor-ledger-card.tsx`, focused tests. |
| Samples and test knits | Durable records for sample location/status and tester, size, yarn, gauge, and test-knit status. | `operational-records.ts`, `operational-records-card.tsx`. |
| Submissions and wholesale | Durable deadline/status records for outlets and explicit account/order/amount/currency/terms/due-date follow-up. No reconciliation or tax automation is implied. | Same operational-records engine and card. |
| Backup/export | CSV export retains type, stable ID, project ID, primary party/name, status, date, amount, currency, location/terms, and notes. | `exportOperationalRecordsCsv` and operational record test. |
| Mobile lab navigation | Search across registry-backed localized labels and six-entry project-scoped recent history using `projectStorage`; desktop grouped navigation remains intact. | `filterTabGroups`, navigator tests, expanded mobile smoke. |
| CI evidence | GitHub Actions workflow runs typecheck, full Vitest, production build, Chromium mobile smoke, and uploads screenshots/logs. | `.github/workflows/quality.yml`, `scripts/mobile-smoke.mjs`. |

## Verification

The final gate passed with **142 test files and 2,011 tests**, clean typecheck, clean production build, `git diff --check`, and the expanded mobile smoke runner. Smoke coverage includes onboarding at 320, 360, 390, and 430 pixels, dashboard, new project, sample workspace, export preflight with artifact evidence, Grading Lab with defect-ledger access, mobile lab search and recent history, and Design Ledger with operational records.

The production build retains the existing large-chunk warning. This milestone did not add dependencies, analytics, watermarks, cloud sync, background jobs, or payment behavior.

## Guardrails

The branch does not modify `src/lib/pdf/renderer.ts`, `src/lib/grading-engine.ts`, the export hook, or the tab registry. All new persistence uses `projectStorage`; all new visible copy is provided for `en`, `de`, `fr`, `es`, and `pt`. The defect ledger distinguishes calculation/QA evidence from designer decisions and test knitting. Operational records distinguish recorded history from derived ledger summaries.

Artifact inspection is evidence about the rendered HTML sent to print. It is not a claim of tagged-PDF accessibility, perfect pagination, physical print quality, chart correctness, or successful test knitting. Those remain explicit human or physical-review steps.

## Merge decision

Do not merge PR #71 yet. First review this branch’s changed-file set, inspect the new mobile smoke screenshots, and decide whether the milestone should land as one branch or be split into publication inspection, records, navigation, and CI pull requests.
