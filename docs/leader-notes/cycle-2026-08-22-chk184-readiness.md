# CHK-184: Pattern Publication Readiness Contract

## Mandate
Implement a formal publication readiness checklist and sign-off trail as defined in Priority 0 of the `product-gap-register-2026-08-21.md`.

## Implementation Details
- **Schema:** Added `PublicationContract`, `ReadinessSignOff`, and `ReadinessIssue` to `grading-engine.ts`.
- **State:** Added `publicationContract` to `PatternProject`.
- **Actions:** Added `updateContract` to `ProjectsContext` with IndexedDB persistence.
- **Localization:** Added 22 new strings to `WorkspaceCopy` for all 5 locales (EN, DE, FR, ES, PT).

## Readiness Stages
1. **Mathematical Accuracy:** Grading, repeats, ease, and stitch counts.
2. **Editorial & Style:** Written instructions, grammar, and layout.
3. **Test Knit Feedback:** Tester results and issue resolution.
4. **Final Proofing:** Last sign-off before publication.

## Issue Severity
- **Nitpick:** Cosmetic or minor phrasing.
- **Minor:** Non-critical errors.
- **Major:** Errors affecting pattern usability.
- **Critical:** Publication blockers (math errors, missing sizes).
