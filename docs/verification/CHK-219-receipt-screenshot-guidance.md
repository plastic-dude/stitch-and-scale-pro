# CHK-219 — Receipt Lab screenshot guidance and mobile action targets

## Scope

This checkpoint follows the required WIDE RESEARCH audit across repository/release integrity, exportable handoffs, mobile/accessibility/localization/onboarding, MCP/origin boundaries, and full quality signals. The highest-impact safe unfinished defect was in Receipt Lab: the visible image action offered screenshot guidance rather than creating or saving an image, but its label and internal naming previously implied a Save as image operation. The same action row also rendered a 32px screenshot-guide control at 390px, below the product's 44px touch-target standard.

The correction remains deliberately narrow. It does not add server storage, image generation, automatic sharing, or a delivery claim that the browser cannot prove.

## Correction

`receipt-lab-card.tsx` now names the action and handler `Screenshot guide`, uses a camera icon, and explicitly presents the control as guidance for the device screenshot flow. The action row's five controls now carry a 44px minimum height for mobile touch safety: share, screenshot guidance, print/PDF, ledger save, and reset.

`receipt-copy.ts` renames the image action to explicit screenshot-guidance copy in English, German, French, Spanish, and Portuguese. Existing guidance explains that the user should use the device screenshot workflow; no browser image-save completion is claimed.

`receipt-export-contract.test.ts` adds the focused source contract for screenshot-guidance semantics, separation from print/PDF behavior, non-saving labels, five-locale coverage, and five 44px action targets.

## Evidence and gates

| Check | Result |
|---|---|
| Focused Receipt export contract | Passed: 1 file, 3 tests |
| Full app Vitest suite | Passed: 219 files, 2,549 tests |
| App TypeScript check | Passed |
| Root TypeScript check | Passed |
| Production build | Passed in 5.12s; known non-fatal sourcemap-location warnings remain |
| `git diff --check` | Passed |
| Source-bundle verifier | Passed; expected archive SHA `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`, 15 files |
| Protected invention brief hash | Passed; SHA `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Local four-width mobile smoke | Passed at 320/360/390/430px after rebuilding the final bundle, including onboarding, dashboard, new project, workspace, export preflight, Grading Lab, and Design Ledger |
| Local Receipt Lab route smoke | Passed at 390px through All Labs → Receipt Lab; observed truthful Screenshot guide label and guidance toast, no stale Save as image label, no horizontal overflow, and a 44px screenshot-guide hit area |
| Active production four-width mobile smoke | Passed at 320/360/390/430px against the active alias serving the verified commit |
| Active production Receipt route smoke | Passed at 390px through All Labs → Receipt Lab; observed the truthful label and guidance toast, no overflow, and a 44px hit area |
| Active production routes | `/`, `/settings`, `/project/audit-week-31`, and `/project/audit-week-31/pdf` returned 200; `/favicon-192.png` returned 200 with 48,605 bytes |
| Active MCP/origin boundary | Protocol `2026-07-28`: GET 405; active-origin OPTIONS 204 with `POST, OPTIONS` and `Authorization, Content-Type, MCP-Protocol-Version`; authenticated `tools/list` 200 with 8 canonical tools; forbidden alternate origin 403 / `-32001` |

The full Vitest run retains known non-fatal reducer-context `indexedDB is not defined` messages in the non-browser environment; tests passed. The build retains the known six sourcemap-location warnings in `tooltip.tsx`, `label.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `select.tsx`, and `progress.tsx`.

## Release integrity

Code commit `14975ab3e84db4deebc0f48ca52df4a648aca984` was pushed to `coder/perfection-audit-2026-08-22` first and then fast-forwarded to remote `main` after confirming that remote `main` still pointed to its expected parent. The worktree was clean after the source commit.

The exact code-bearing Vercel deployment is `dpl_FinfYmhzBCktr679fSQrE6qjYC3M`. It reached `READY`, has target `production`, carries commit SHA `14975ab3e84db4deebc0f48ca52df4a648aca984`, and is aliased to the active public origin [`stitch-and-scale-pro-api-server.vercel.app`](https://stitch-and-scale-pro-api-server.vercel.app). No manual alias assignment was used.

## Adjacent audit decisions

The WIDE RESEARCH audit found no safe reason to begin `QUEUE-067`; its consent-based social and media release layer remains queued and research-only pending a separate brief and two-pass approval. Publication Package download remains schema-safe and metadata-only unless a persisted safe URL exists. Design Ledger CSV download remains request-only with delayed object-URL cleanup. Pattern PDF, Project Book, and Brag Card remain separate export surfaces with their prior truth-boundary evidence; no unrelated export changes were bundled.

## Residual risks

Screenshot guidance remains intentionally user-mediated; the application cannot prove that the device screenshot was captured or saved. The Receipt Lab share path remains a handoff to the user's share target rather than proof of delivery. Public asset sizes and the known build/test warnings remain optimization and hygiene follow-ups, not release-integrity failures. A future custom-domain migration must update the explicit MCP allowed-origin policy and repeat the active-origin/forbidden-origin evidence; the current Vercel origin remains the only authorized production origin.

This checkpoint proves the Receipt Lab correction on the active production alias, but it does not by itself establish that every export surface is risk-free or that the broader publication-readiness program is complete.
