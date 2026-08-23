# CHK-234 — Brag Card locale-complete controls and exports

**Date:** 2026-08-23  
**Owner:** CODER II  
**Scope:** Brag Card UI selectors and locally generated SVG/PNG export surface  
**Code commit:** `77571931b36b7b43b56397549f52f970ff993c70`  
**Parent:** `86b6e162c17c83e81037605108cd222f629da94b`

## Why this was the next safe repair

The fresh WIDE RESEARCH firing divided the current release into independent export, workflow, mobile, accessibility, localization, performance, and trust audits. The strongest actionable defect was in the Brag Card surface: its primary highlight buttons, style buttons, accent names, gauge sample, and several labels embedded in the generated SVG were hardcoded in English even though the application supports English, German, French, Spanish, and Portuguese. This meant a non-English maker could configure the card in their language but receive a partially English control surface and downloadable artifact.

This was a publication-quality defect rather than a cosmetic translation gap. Brag Cards are intended to be shared outside the application, so the export itself is part of the product’s voice and trust surface. The repair was kept narrow and reversible: it did not change sales aggregation, caption mathematics, branding security, canvas rasterization, native share fallback, or browser download truth semantics.

## Repair implemented

The typed `BragCardCopy` contract now includes localized option labels and blurbs for the four highlights, all six visual styles, and all four color accents. It also includes the fixed renderer labels and fallbacks used by the exported SVG: the studio fallback, gauge sample, earned label, ledger/report labels, and the selvedge/cameo labels. All five supported locales provide every required field, and locale resolution continues to normalize regional tags and fall back to English.

The interactive card now renders selector labels from the active locale rather than inline English literals. Accent buttons retain their original color values and now expose localized accessible names plus `aria-pressed` state. The SVG renderer receives the same copy object used by the UI, so German, French, Spanish, and Portuguese output no longer reverts to fixed English for the repaired labels. The product wordmark remains the product identity and is still safely replaced by configured local studio branding where applicable.

The existing export truth boundary remains unchanged. PNG download still reports that the browser was asked to download the file, and native share still reports device handoff language. No code claims that the browser saved, delivered, or completed a durable file operation.

## Focused evidence

| Check | Result |
|---|---:|
| Brag Card unit and renderer tests | **16 passed** |
| Brag Card browser export contract tests | **5 passed** |
| Focused total | **2 files / 21 tests passed** |
| Application TypeScript | **Passed** |
| Workspace TypeScript | **Passed** |
| Production build | **Passed in 4.91s** |
| Fixed-string scan for repaired renderer literals | **No matches** |
| Component scan for repaired inline selector literals | **No matches** |
| `git diff --check` | **Passed** |
| Source-bundle context verifier | **Passed**, archive SHA `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082` |
| Protected invention brief | **Unchanged**, SHA `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |

The full application suite passed on the final pre-commit worktree: **225 test files and 2,590 tests passed**. This total is three tests higher than CHK-233 because the focused localization regressions are now part of the suite.

## Promotion and production proof

The fresh remote fetch showed the working branch at the CHK-233 documentation tip, with `origin/main` at the same parent. The code commit was committed on `coder/perfection-audit-2026-08-22`, pushed to that audit branch first, verified as a fast-forward descendant of the current main tip, and then promoted to `main`. The remote audit branch and `main` now both point to `77571931b36b7b43b56397549f52f970ff993c70`.

The active public alias is:

> `https://stitch-and-scale-pro-api-server.vercel.app`

After Git-to-Vercel propagation, the root HTML served the new entry asset `/assets/index-CQs6jK96.js`. The workspace lazy module served `/assets/project-workspace-DbioP-ov.js`, which references the Brag Card chunk `/assets/brag-card-card-C4ZiemZO.js`; both returned HTTP 200. The live Brag Card chunk contained the new `templateOptions` path and localized marker strings including `Einnahmen`, `Échantillon`, `Musgo`, and `rentáveis`. The chunk also contains an older unused style metadata literal from the renderer module; this is not part of the interactive selector path and is not a rendered fixed-label source in the repaired component.

Required public routes returned HTTP 200: `/`, `/workspace`, `/grading`, and `/pdf`. The MCP origin boundary remained intact: an `OPTIONS` request from the active public origin returned **204**, while the same preflight from `https://evil.example` returned **403**. No connectors, schedules, credentials, or origin configuration were modified.

## Residual risks and non-claims

The repaired locale fields are now covered by source and renderer tests, but this checkpoint does not claim that every less-central application lab is free of hardcoded English. The Brag Card SVG still contains intentional product identity text and visual craft notation; those are separate from the repaired user-facing locale contract and should be reviewed if the product later requires complete translation of every decorative mark.

The browser still cannot prove that a download was saved, that a native share target delivered the file, or that a user did not cancel the system handoff. The application therefore continues to report preparation or handoff only. Existing residual deployment risks also remain: custom-domain and authenticated-MCP verification, behavior below 320px and under unusual safe-area/zoom conditions, large lazy-chunk performance on constrained devices, and the isolated failing CSV-export branch must not be treated as resolved by this checkpoint.

The research-only portable maker-identity/Stitch Score directive remains queued and must not be implemented from this work. It still requires its separate two-pass research process. The failing CSV-export pull request remains isolated and was not merged or reused.

## Next queue direction

Continue from the canonical work queue. Do not broaden this checkpoint into a social, gamification, cloud-sync, account, or identity implementation. The next firing must begin with a new WIDE RESEARCH reconciliation and select a fresh highest-impact issue from current evidence rather than assuming the remaining residual risks are solved.
