# CHK-211 — Runtime favicon payload boundary

**Date:** 2026-08-22
**Scope:** Replace the remaining runtime and PDF consumers of the nearly 1 MB source favicon with a deterministic 192px derivative that preserves the original visual mark.

## Decision

The application shell, landing page, and PDF renderer previously referenced `/favicon.png`, a 1024x1024 PNG measuring 982,671 bytes in the current source tree. That image was appropriate as a high-resolution source but wasteful for 16–32px runtime branding and small PDF brand marks. The change adds `/favicon-192.png`, generated from the original with an RGBA LANCZOS resize without crop or creative alteration. The derivative measures 192x192 and 48,605 bytes in the file-generation report (47.5 KiB in the image viewer).

The shell header, both landing-page favicon consumers, and the default PDF `brandMark` now reference `/favicon-192.png`. Custom PDF logos are unchanged. The 32px browser-chrome icon, PWA icons, OG image, and distinct `app-logo.png` and `app-icon.png` visual roles are unchanged.

## Focused regression

`src/deployment-security.test.ts` now asserts that the shell, landing, and PDF source files do not reference `/favicon.png`, do reference `/favicon-192.png`, and that the derivative remains below 64 KiB. Existing browser-chrome and splash asset budgets remain in force.

Focused tests passed: 5 test files and 54 tests. `git diff --check` passed. The repository Prettier check was not used as a release gate because the four touched legacy source files already contain unrelated formatting differences; no broad formatting rewrite was made.

## Full gates

The application TypeScript check passed. The full Vitest suite passed. The production build passed in 5.58 seconds with the repository’s six known non-fatal Vite sourcemap-location warnings; the build was not described as warning-free. Root/workspace TypeScript passed across the checked packages. The worktree contained only the intended four source/test edits and the new public derivative at this stage.

## Responsive evidence

The established local CDP mobile smoke passed at 320, 360, 390, and 430px and covered onboarding, dashboard, new project validation, sample workspace, export preflight, Grading Lab, and Design Ledger. No horizontal-overflow or required-control failures were reported.

## Residual risk

The production alias must still be promoted to a deployment built from the final commit and then rechecked for the new public asset and deep-link integrity. The smoke workflow does not capture PDF print-dialog binary output. This change reduces runtime image transfer cost but does not address the remaining large `app-logo.png` and OG-image payloads, the known sourcemap warnings, or the broader grading/export publication blockers.
