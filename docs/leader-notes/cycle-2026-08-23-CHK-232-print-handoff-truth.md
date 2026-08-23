# CHK-232 — Print-handoff truth boundary

**Date:** 2026-08-23  
**Author:** Manus AI / CODER II  
**Repository:** `plastic-dude/stitch-and-scale-pro`  
**Production alias:** `https://stitch-and-scale-pro-api-server.vercel.app`

## WIDE RESEARCH decision

Independent current-main audits covered export and receipt truth, product workflow reachability, mobile and accessibility behavior, localization and onboarding, bundle performance, and MCP/origin boundaries. The highest-impact unfinished trust defect was the PDF page’s `afterprint` callback: the page persisted a publication-package PDF artifact and showed “artifact created” after the browser print surface was accepted, even though browser APIs cannot truthfully tell the page whether the user later saved, canceled, or otherwise completed the print dialog.

The repair is deliberately narrow. Browser `afterprint` remains responsible only for print-surface cleanup and the in-flight lock. Page code no longer receives a success callback from that event. After the synchronous handoff is accepted, the page records a metadata-only print-prepared entry and shows localized copy that explicitly says the browser decides whether a file is saved. No durable-download claim, saved-file claim, server upload, AI request, schema change, or backend behavior was introduced.

The open `mcp/grading-csv-export` branch was not merged. Its independent TypeScript failure (`Cannot find module '@/lib/grading-engine'`) remains isolated and is not part of this release.

## Implementation

The following five files changed in code commit `5451c19b12d8862c7c59299c6a9a44503c902fe3`:

- `artifacts/stitch-and-scale/src/lib/pdf/print-utils.ts` — removed the page-facing success callback; retained `afterprint` for cleanup and lock release.
- `artifacts/stitch-and-scale/src/pages/project-pdf.tsx` — records only a metadata-only entry after a successful synchronous handoff and uses `artifactPrepared` copy.
- `artifacts/stitch-and-scale/src/lib/toast-copy.ts` — added the five-locale print-prepared contract.
- `artifacts/stitch-and-scale/src/lib/pdf/print-utils.test.ts` — locks the absence of the success callback and the page’s truth-preserving call path.
- `artifacts/stitch-and-scale/src/lib/toast-copy.test.ts` — verifies filename and metadata language for all five locales.

## Verification evidence

| Check | Result |
|---|---|
| Focused tests | 3 files / 36 tests passed (`print-utils`, `toast-copy`, `publication-package-workflow`) |
| Full application tests | 225 files / 2,583 tests passed |
| App TypeScript | Passed |
| Workspace TypeScript | Passed across `api-server`, `mockup-sandbox`, `stitch-and-scale`, and `scripts` |
| Production build | Passed in 5.05s |
| Bundle | Entry `324.16 kB` / `101.70 kB` gzip; i18n `208.62 kB` / `58.58 kB` gzip; PDF lazy chunk `69.97 kB` / `21.03 kB` gzip |
| Whitespace and integrity | `git diff --check` and `verify-source-bundle-context.mjs` passed; source-bundle fingerprint `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082` |
| Protected invention brief | SHA unchanged: `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |

## Promotion and active release proof

The code commit was pushed to `coder/perfection-audit-2026-08-22` first. `origin/main` was confirmed at the exact CHK-231 parent `9b4552d564fc0812208edeb125e1b0edb621f615`, then fast-forwarded to CHK-232 without force or merge noise.

Vercel production deployment `dpl_8sBhkGXjo4UoXxQo8gMyGG64Ggj9` was created from main commit `5451c19b12d8862c7c59299c6a9a44503c902fe3` and reached `READY`. The active alias serves `/assets/index-CeHaTEY8.js`; its lazy PDF chunk `/assets/project-pdf-BL2MpB8i.js` returned HTTP 200 and contains the new `artifactPrepared` path. Root, canonical workspace, grading, and PDF routes each returned HTTP 200.

The active MCP browser-origin boundary remained unchanged and verified: the approved active origin preflight returned `204`, while an unapproved origin returned `403`. No connectors or schedules were changed.

## Truth boundary and residual risks

The application now truthfully records that the browser print surface was prepared. It still cannot know whether the user saved or canceled the browser-native print dialog, and it does not claim durable PDF storage or delivery. A future enhancement could add explicit user confirmation after returning from the browser flow, but such confirmation would still be user-reported rather than browser-proven and therefore was not invented here.

The production alias check used route, asset, and preflight evidence rather than claiming a completed browser print dialog. The separate CSV-export feature branch remains a known isolated failure, and future custom-domain origin migration still requires an explicit active-origin verification. Large chunks, browser-specific print behavior, and below-320px layout behavior remain documented residual risks.

## Release status

CHK-232 is verified and production-promoted. The worktree was clean after the code commit; documentation follow-up is recorded separately from code history. No known release blocker was introduced by this change, and the remaining risks above are explicit rather than hidden behind a success claim.
