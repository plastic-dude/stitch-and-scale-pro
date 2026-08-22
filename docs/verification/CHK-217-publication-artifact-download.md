# CHK-217 — Publication artifact download truth boundary

**Date:** 2026-08-22  
**Scope:** Publication Package artifact-row Download affordance  
**Code commits:** `74297d6c040d6ecfe6c4823465b2c50bbe85bd0d` (`fix: make publication artifact downloads truthful`) plus `3f0359e6910b91ce8dd6726bceee3b1bf3d90ecd` (`fix: describe unavailable artifact downloads`)
**Production status:** Not deployed in this firing; the direct production deployment was rejected because the free-tier daily deployment quota was exhausted. A separate READY target-null preview deployment exists for `74297d6`, but it is not the active production alias.

## Finding

The Publication Packages card displayed a visible Download icon for every persisted artifact, but the persisted `PublicationArtifact` contract contains metadata (`type`, `label`, `filename`, `timestamp`, optional quality and inspection fields) and only an optional `url`. The normal browser package-record creation path does not persist generated PDF bytes, a Blob, a data URL, or a retrieval endpoint. PDF generation on the export page and transient MCP binary output are separate workflows; neither supplies a durable source to the package-row action.

The previous icon therefore implied an available download without a callable source. That was a publication-readiness truth defect, not merely a cosmetic gap.

## Correction

`project-package-card.tsx` now gates the action through `getArtifactDownloadUrl()`. Only a trimmed `blob:`, `data:`, `http:`, or `https:` URL is rendered as an actual anchor with the persisted filename and request-only browser wording. When no such URL exists, the icon is disabled, carries an accessible localized label, and exposes a metadata-only explanation through its title. No bytes, URL, or regeneration behavior is fabricated.

The five supported locales received aligned copy for the available action, unavailable state, request toast, and request description. The request toast says that the browser was asked to download the artifact and directs the user to check Downloads; it does not claim that delivery completed.

## Evidence and gates

| Check | Result |
|---|---|
| Focused artifact inspection and contract tests | Passed: 2 files, 9 tests |
| Full app Vitest suite | Passed: 217 files, 2,544 tests |
| App TypeScript check | Passed |
| Root TypeScript check | Passed |
| Production build | Passed in 4.89s |
| `git diff --check` | Passed |
| Source-bundle verifier | Passed; expected archive SHA `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`, 15 files |
| Protected invention brief hash | Passed; SHA `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Local four-width mobile smoke | Passed at 320/360/390/430px, plus dashboard, new project, workspace, export preflight, Grading Lab, and Design Ledger checks |
| Local 390px Packages-route smoke | Passed for route navigation and overflow; the sample fixture had no package artifact row to exercise, so the conditional behavior is covered structurally rather than claimed as a live artifact click |
| Active production route smoke | Passed for `/`, `/settings`, sample project, and PDF route; favicon returned 200 with 48,605 bytes |
| Active production MCP boundary | Passed: GET 405, OPTIONS 204 with the active origin and expected methods/headers, authenticated `tools/list` 200 with 8 canonical tools, forbidden alternate origin 403 / `-32001` |
| Vercel code deployment | Blocked before deployment creation by `api-deployments-free-per-day`: more than 100 deployments; retry after the quota window |

The build retains the six known non-fatal sourcemap-location warnings in `tooltip.tsx`, `label.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `select.tsx`, and `progress.tsx`. The full test run retains the known reducer-context `indexedDB is not defined` messages in the non-browser environment; they did not fail tests.

## Adjacent seam audit

Receipt Lab remains intentionally separate from this correction. Its image action honestly offers screenshot guidance rather than pretending to create a PNG. Its Web Share path hands text to the share target and falls back to copy when sharing is unavailable or cancelled; it does not claim publication or delivery.

Design Ledger’s CSV path does create a local Blob and requests a browser download, but it revokes the object URL immediately and uses existing `csvDownloaded` wording. That is a separate follow-up candidate requiring its own focused browser-lifecycle test; it was not bundled into CHK-217.

## Release posture

The code commits were pushed first to `coder/perfection-audit-2026-08-22` and then fast-forwarded to remote `main` after each parent check. The active public production deployment remains the previously proved code-bearing release `21a9a9f` / deployment `dpl_JAJUqmSvZYNFg8CFamxa1dNPjwTU`; it does not contain CHK-217. The exact final CHK-217 code commit `3f0359e` must be deployed after Vercel’s free-tier deployment quota resets, followed by fresh active-alias route, mobile, and MCP verification.

This correction does not create persisted artifact retrieval, multi-project PDF export, or social sharing. Those remain separate product tracks. `QUEUE-067` remains queued and research-only with its required separate brief and two-pass approval.
