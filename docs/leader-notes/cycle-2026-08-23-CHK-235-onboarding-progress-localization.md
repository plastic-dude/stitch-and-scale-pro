# CHK-235 — Localized onboarding progress announcement

**Date:** 2026-08-23
**Role:** CODER II
**Status:** Code verified, promoted to `main`, and active production alias verified

## Decision summary

The fresh WIDE RESEARCH pass identified a small but high-confidence first-run accessibility and localization defect. The onboarding step indicator exposed a `role="progressbar"` with a hardcoded English accessible name, `Step {current} of {total}`, even when the rest of the onboarding overlay was translated. A screen-reader user or automated accessibility reader could therefore receive a partially English first-run experience in German, French, Spanish, or Portuguese.

This was selected over cosmetic work because onboarding is the first contract between the product and an independent designer. The repair is deliberately narrow and reversible: the progressbar keeps its numeric `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` semantics, while its accessible label now comes from the existing typed translation layer and interpolates the real current step and total step count.

## WIDE RESEARCH and selection

This firing began with a fresh repository/deployment reconciliation and six independent audit tracks covering exports, workflows, mobile layout, localization, performance, and trust/MCP boundaries. A separate read-only repository API check reviewed current open pull requests and issues before implementation. No parallel branch was merged or reused.

The current export, trust, and mobile surfaces did not produce a higher-confidence isolated repair than the onboarding finding. Existing publication-truth safeguards, artifact provenance, mobile footer clearance, Brag Card localization, route health, and MCP origin rejection were preserved. The portable maker-identity/Stitch Score directive remains research-only and was not implemented.

## Implementation

The translation contract now includes `workflow.onboarding.progress` in all five supported locales:

| Locale | Template |
|---|---|
| English | `Step {current} of {total}` |
| German | `Schritt {current} von {total}` |
| French | `Étape {current} sur {total}` |
| Spanish | `Paso {current} de {total}` |
| Portuguese | `Passo {current} de {total}` |

`StepDots` now receives the localized label from the existing `useSettings()` translation function. The visual dots, step boundaries, footer controls, skip behavior, and onboarding route were not changed.

The repair does not add a new persistence model, account, network request, connector, schedule, or background process. It does not alter the product’s local-first data ownership boundary.

## Regression coverage

The focused onboarding localization suite covers the translation foundation and overlay-specific copy contract. It asserts that the progress announcement resolves in every supported locale, that `{current}` and `{total}` are interpolated, and that the English baseline remains correct.

| Gate | Result |
|---|---|
| Focused tests: `i18n.test.ts` and `overlay-footer-copy.test.ts` | 2 files / 8 tests passed |
| Full application Vitest | 225 files / 2,591 tests passed |
| Application TypeScript | Passed |
| Workspace TypeScript | Passed |
| Production build | Passed in 5.39 seconds |
| `git diff --check` | Passed |
| Source-bundle context verifier | Passed; archive SHA `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`, 15 files |
| Protected invention brief | Passed; SHA `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` unchanged |

The full suite continues to emit the repository’s known non-browser `indexedDB is not defined` diagnostic from reducer tests. It is not a failing test and was not introduced by this change.

## Git promotion

The tested code commit was created on `coder/perfection-audit-2026-08-22`, pushed first, and then fast-forwarded to `main` only after the exact parent relationship was verified.

| Ref | Commit |
|---|---|
| Code commit on audit branch and `main` | `4489676a416c40e538a5d24b04550301a1138704` |
| Pre-change `main` parent | `822973112d320f380ca37d5523ee9407447c83dc` |
| Audit-branch remote proof | Exact match to `4489676a416c40e538a5d24b04550301a1138704` |
| Main remote proof | Exact match to `4489676a416c40e538a5d24b04550301a1138704` |

## Production deployment and active-alias proof

GitHub recorded Vercel Production deployment `6049410990` for the exact code commit with state `success` and completion description `Deployment has completed`. Its immutable target URL redirects to Vercel SSO when fetched directly without the deployment session; therefore the public active alias was used for the serving proof rather than claiming direct target access.

The active public alias is:

`https://stitch-and-scale-pro-api-server.vercel.app`

The active alias now serves the new entry bundle `/assets/index-DjUcJUN7.js`, not the preceding CHK-234 entry bundle. The onboarding lazy chunk `/assets/onboarding-D8pk70O0.js` returns HTTP 200 and contains the repaired `aria-label` and current/total interpolation wiring. The split translation chunk `/assets/lib-i18n-CV52cV6F.js` returns HTTP 200 and contains all five shipped progress templates and the `workflow.onboarding.progress` key.

The required public routes `/`, `/workspace`, `/grading`, and `/pdf` each returned HTTP 200. The MCP origin boundary remained intact: an OPTIONS preflight from the approved active public origin returned 204, while an unapproved `https://example.com` origin returned 403.

## Truth boundary

This checkpoint concerns the accessible name of the onboarding progressbar only. It makes no claim about PDF saving, browser download completion, social sharing, cloud persistence, or any other user action. No connector or schedule was enabled or modified.

## Residual risks

The following items remain open and are not release blockers for this narrow repair: other lower-priority hardcoded English strings may remain in less central lab surfaces; browser-native print/download/share APIs cannot prove that a user saved or completed the handoff; custom-domain and authenticated-MCP behavior still need deployment-specific verification; sub-320px, unusual safe-area, and browser zoom behavior need broader device coverage; the largest lazy chunks remain candidates for further performance work; and the isolated `mcp/grading-csv-export` branch remains unmerged after its independent deployment/typecheck failure.

Legacy publication artifacts without historical provenance remain explicitly `not-recorded`, as established by CHK-233. The portable maker-identity/Stitch Score work remains research-only pending the required two separate research passes.

## Next safe direction

The next firing should repeat the WIDE RESEARCH reconciliation and avoid duplicating active PR work. If no stronger trust or workflow defect emerges, prioritize a measured audit of remaining first-run and export accessibility names across non-English locales, followed by fresh mobile viewport and active-alias evidence rather than broad cosmetic renovation.

— **Manus AI**
