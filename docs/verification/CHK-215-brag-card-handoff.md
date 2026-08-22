# CHK-215 — Brag Card browser-handoff truth and mobile resilience

**Date:** 2026-08-22
**Author:** Manus AI
**Scope:** One narrow structural improvement to Brag Card export/share behavior and its 390px layout. This note does not claim overall publication readiness.

## Decision and product boundary

The WIDE RESEARCH audit found a concrete trust gap in Brag Card outcomes. The browser can request a download or complete a device share handoff, but the application cannot prove that a file was durably saved, delivered to a recipient, published, or received. MDN documents that `Navigator.share()` resolves when data has been passed to the share target, not when downstream delivery or publication is known [1]. MDN likewise documents that an anchor’s `download` property expresses download intent but cannot determine whether the download will occur [2]. The W3C Web Share Recommendation recommends `navigator.canShare()` when checking whether a file payload is supported [3].

The selected correction therefore uses truthful browser-handoff language rather than claiming durable success. It is intentionally separate from QUEUE-066’s first-clean-grade recognition and does not add counters, streaks, automatic posting, recipient tracking, or server state.

## Implemented change

The Brag Card component now rasterizes one PNG artifact for both download and native share, checks file capability with `navigator.canShare()` when available, falls back to the browser download request when native sharing is unavailable, delays object-URL cleanup until after the handoff request, and reports only request/hand-off outcomes. The prior wording that implied a saved or externally shared result was replaced with explicit browser/device handoff wording in English, German, French, Spanish, and Portuguese. Copy-caption behavior remains a separate clipboard request path.

The export action row now wraps at narrow widths instead of forcing a fixed-width overflow. Empty Brag Card actions remain disabled until the project has qualifying ledger or published-design data, preventing a preview from being represented as an exportable accomplishment.

## Verification evidence

| Check | Result |
|---|---|
| Focused Brag Card/domain, export-contract, localization-parity, and related export suites | Passed before and after the layout correction |
| Full Vitest gate | Passed; **215 files / 2,539 tests** |
| Application typecheck | Passed |
| Root typecheck | Passed |
| Production build | Passed in **4.89 seconds**; six known nonfatal Vite sourcemap-location warnings remain |
| `git diff --check` | Passed |
| Source-bundle verifier | Passed; archive SHA-256 `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`; 15 raw files present |
| Protected invention brief | Unchanged; SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Four-width mobile smoke | Passed for onboarding 320/360/390/430, dashboard, new project, workspace, export preflight, grading lab, and design ledger |
| Isolated Brag Card mobile smoke | Passed at 390x844 after creating a valid project through the real wizard; page-level body/html overflow both measured 390px; Copy caption, Share, and Download PNG were visible and disabled in the empty state |
| Visual inspection | Confirmed the card remains within the viewport and action wrapping is visible; lab-category labels continue to ellipsize as an existing bounded mobile treatment |

The first dedicated Brag Card smoke exposed a real 390px document-level overflow caused by the export action row. That was corrected with a wrapping action container and re-verified against a freshly rebuilt preview. The final smoke still reports a few nested preview elements with internal scroll-width greater than client-width, but document-level overflow is false; this remains a future populated-data visual refinement candidate rather than a hidden pass.

## Repository and release integrity

The WIDE RESEARCH audit refreshed Git state, compared the audit branch with `main`, reviewed the canonical queue, inspected public backlog items, verified the protected brief, and inspected the active schedule without changing schedule or connector configuration. QUEUE-067 remains research-only and was not started. Public PRs #70, #71, and #72 remain proposals and were not silently merged.

After the verified push, Vercel deployment `dpl_C8Jc1vZjgCJbBupDZZiMjnyNKdBS` reached `READY` with target `production`, exact commit `794b3f14ec3b80c5313feec42b8670d314c12ede`, and the active alias `https://stitch-and-scale-pro-api-server.vercel.app`; no alias was manually assigned. Fresh active-alias checks returned 200 for `/`, `/settings`, `/project/audit-week-31`, and `/project/audit-week-31/pdf`, and `favicon-192.png` returned 200 at 48,605 bytes. The MCP boundary passed with protocol `2026-07-28`: GET 405, allowed-origin OPTIONS 204 with exact CORS declarations, authenticated `tools/list` 200 with the canonical eight tools, and the alternate origin rejected with 403 / JSON-RPC `-32001`. The isolated public four-width mobile smoke passed, and the public Brag Card smoke at 390x844 confirmed the truthful empty-state controls were visible and disabled with no page-level overflow. Overall publication readiness is still not claimed because the broader residual-risk list remains open.

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share "MDN: Navigator.share()"

[2]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement/download "MDN: HTMLAnchorElement.download"

[3]: https://www.w3.org/TR/web-share/ "W3C: Web Share Recommendation"
