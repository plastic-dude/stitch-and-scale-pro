# CHK-216 — Technical handoff truth correction

**Research and verification date:** 2026-08-22
**Scope:** `project-grading` technical JSON handoff and its localized browser-download toast.
**Decision:** Ship a narrow truthfulness correction because the UI could describe a browser download request, but it could not prove that a file was durably saved to the user’s device.

## Product-control finding

The grading surface generates a technical JSON artifact and asks the browser to download it. The application owns the artifact generation and the request boundary, but it does not own the browser’s download manager or the final filesystem outcome. Copy that says a file was saved would overstate what the local-first product can observe.

The correction now uses explicit browser-handoff language across English, German, French, Spanish, and Portuguese. The existing action label remains stable. The success toast reports that the **browser download was requested** and directs the user to check their downloads. It does not claim durable file saving, delivery, publication, or receipt.

## Implementation boundary

The change is deliberately narrow:

- `src/lib/handoff-copy.ts` replaces durable-download outcome fields with browser-download-request wording in all five supported locales.
- `src/pages/project-grading.tsx` reports only the request boundary after the JSON download anchor is invoked.
- `src/lib/handoff-copy.test.ts` adds focused five-locale regression coverage that rejects a return to completed-save language.
- No JSON evidence fields, grading calculations, project storage, MCP tools, or export payloads were changed.

## Evidence

### Automated quality

The fresh full local gate passed **215 Vitest files and 2,539 tests**. Application and root TypeScript checks passed. The production build passed in **10.61 seconds**.

Vitest still emits known non-failing happy-dom persistence diagnostics where tests exercise IndexedDB-backed reducers without an IndexedDB implementation. The build still emits the known six Vite sourcemap-location warnings for `tooltip.tsx`, `label.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `select.tsx`, and `progress.tsx`. The build is therefore not described as warning-free.

The focused technical-handoff, Brag Card, localization, evidence, and receipt suites passed, along with diff hygiene. The source-bundle verifier passed and the protected invention brief remained unchanged at SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`.

### Live release integrity

The code-bearing commit is:

`21a9a9ff8ea75aa782b00ad41498c7b67a4a0960` — `fix: clarify technical handoff download request`

The audit branch and `main` were reconciled before push, the audit branch was pushed first, `main` was fast-forwarded only when its remote parent matched, and the final worktree was clean.

Vercel deployment metadata proves the same exact commit is live:

| Field | Verified value |
|---|---|
| Deployment | `dpl_JAJUqmSvZYNFg8CFamxa1dNPjwTU` |
| State | `READY` |
| Target | `production` |
| Commit | `21a9a9ff8ea75aa782b00ad41498c7b67a4a0960` |
| Deployment URL | `stitch-and-scale-pro-api-server-37456inq4.vercel.app` |
| Active alias | `stitch-and-scale-pro-api-server.vercel.app` |

Fresh active-alias route checks returned 200 for the root, settings, project, and project PDF routes. The optimized favicon returned 200 at 48,605 bytes. The active MCP origin check passed with protocol `2026-07-28`: GET returned 405, allowed-origin OPTIONS returned 204 with the expected exact CORS declarations, authenticated `tools/list` returned the canonical eight tools, and the alternate origin was rejected with 403 / JSON-RPC `-32001`. No alias was assigned manually.

The public four-width mobile smoke also passed at 320/360/390/430 for onboarding, workspace, export preflight, grading, and ledger. The dedicated Brag Card smoke passed separately at 390px after the earlier mobile wrap correction.

## Truth boundary research

1. MDN states that `Navigator.share()` resolves when data has successfully been passed to the share target; it does not prove downstream delivery, publication, or recipient receipt. [MDN — Navigator.share](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
2. MDN states that `HTMLAnchorElement.download` indicates that a linked resource is intended to be downloaded, but the value cannot be used to determine whether the download will occur. [MDN — HTMLAnchorElement.download](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement/download)
3. The W3C Web Share Recommendation describes the API as handing content to an arbitrary user-selected destination and recommends `navigator.canShare()` when checking support for file data. [W3C — Web Share](https://www.w3.org/TR/web-share/)

Therefore, the truthful product boundary is **download requested** or **share handoff accepted**, never **file saved**, **delivered**, or **published** unless a separate verifiable storage or delivery receipt exists.

## Residual risks

This check does not close overall publication readiness. Remaining risks include the six nonfatal sourcemap-location warnings, oversized public visual assets, incomplete proof of native saved-PDF binary semantics, incomplete dedicated proof for every export surface, and bounded nested preview text-clipping diagnostics inside populated Brag Card content despite no page-level page overflow. The current public deployment is proven for the exact code-bearing commit above; future documentation-only commits may still require separate deployment-parity verification.

`QUEUE-067` remains a future research-only, voluntary/private-by-default social and media track. Public issues/PRs #70, #71, and #72 were not silently adopted. The existing recurring schedule and connector configuration were inspected and left unchanged.

## Conclusion

CHK-216 is **verified and closed for its narrow scope**. It improves truthfulness at a user-visible export boundary without pretending to observe browser-managed durable storage. It does not constitute an overall publication-ready claim.

## Supporting audit records

- `docs/verification/CHK-215-brag-card-handoff.md`
- `docs/verification/CHK-214-soothing-recognition.md`
- `/tmp/wide-firing-phase2/vitest.log` — fresh raw gate output retained in the audit workspace
- `/tmp/wide-firing-vercel-api.md` — official Vercel endpoint evidence retained in the audit workspace
- `/tmp/wide-research-share-download.md` — browser API truth-boundary research retained in the audit workspace
