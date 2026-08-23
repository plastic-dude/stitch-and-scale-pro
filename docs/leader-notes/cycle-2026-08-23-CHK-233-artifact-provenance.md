# CHK-233 — Truthful publication-artifact provenance

**Date:** 2026-08-23  
**Author:** Manus AI / CODER II  
**Repository:** `plastic-dude/stitch-and-scale-pro`  
**Production alias:** `https://stitch-and-scale-pro-api-server.vercel.app`  
**Code commit:** `f48fc23996bbb4f2db8d6d17f2f35884f92bf722`  

## WIDE RESEARCH decision

Independent current-main audits again covered export and receipt truth, publication workflow reachability, responsive/mobile behavior, localization and onboarding, bundle/performance surfaces, and MCP/origin boundaries. The highest-confidence remaining trust defect was in the rendered-artifact human-inspection path: `ProjectArtifactInspectionCard` inserted `rendererVersion: '1.0.0'` and `templateId: 'standard-v1'` into both preliminary validation and persisted inspection reports for every artifact. Those values were not read from the artifact, the selected PDF theme, or the renderer, so a legacy artifact, CSV, JSON, image, or differently themed PDF could receive an inspection report with fabricated provenance.

The repair is deliberately narrow and backwards-compatible. `PublicationArtifact` now accepts optional artifact-level `rendererVersion`, `templateId`, and `locale` fields. Newly prepared PDF print-handoff records capture the declared PDF renderer contract `pdf-renderer-v1`, the actual selected theme id, and the current export locale. The renderer emits the same renderer contract and selected template as HTML metadata. Legacy or incomplete artifacts are resolved to the explicit sentinel `not-recorded`; they are never silently presented as if they came from a known renderer or template. Existing `ArtifactInspectionReport` fields remain required so the inspection record stays structurally complete, but the required values are now truthful.

This change does not alter CHK-232’s print truth boundary. A prepared artifact remains a metadata-only record that the browser print surface was accepted. The application still does not claim that the browser saved, downloaded, uploaded, or durably stored a PDF.

## Implementation

The code commit changed eight application and test files:

| Area | Change |
|---|---|
| `src/lib/grading-engine.ts` | Added optional `rendererVersion`, `templateId`, and `locale` fields to `PublicationArtifact`, preserving legacy records. |
| `src/lib/artifact-inspection.ts` | Added `getArtifactInspectionProvenance()` and the explicit `not-recorded` fallback. |
| `src/components/project-artifact-inspection-card.tsx` | Replaced fabricated values in validation and save paths with resolved artifact provenance. |
| `src/lib/pdf/renderer.ts` | Declared `PDF_RENDERER_VERSION = 'pdf-renderer-v1'` and emitted renderer/template metadata in generated HTML. |
| `src/pages/project-pdf.tsx` | Captured the real renderer contract, selected theme, and locale on accepted metadata-only PDF print-prepared records. |
| `src/lib/artifact-inspection.test.ts` | Covered legacy unknown provenance and reducer preservation of known artifact provenance. |
| `src/lib/pdf/renderer-lang.test.ts` | Covered the renderer contract and template HTML metadata markers. |
| `src/lib/publication-package-workflow.test.ts` | Locked the PDF source boundary to provenance capture without a saved-file claim. |

## Verification evidence

| Check | Result |
|---|---|
| Focused tests | 3 files / 21 tests passed: artifact inspection, renderer language/provenance, and publication package workflow. |
| Full application tests | 225 files / 2,587 tests passed. |
| Application TypeScript | Passed. |
| Workspace TypeScript | Passed across `api-server`, `mockup-sandbox`, `stitch-and-scale`, and `scripts`. |
| Production build | Passed in 5.45s. |
| Bundle | Entry `324.33 kB` / `101.73 kB` gzip; i18n `208.62 kB` / `58.58 kB` gzip; PDF lazy chunk `70.17 kB` / `21.09 kB` gzip. |
| Whitespace and source integrity | `git diff --check` and `verify-source-bundle-context.mjs` passed; source-bundle fingerprint `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`; verifier reported 15 raw files present and fingerprinted. |
| Protected invention brief | SHA unchanged: `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`. |
| Worktree | Clean after the final code commit. |

## Promotion and active release proof

The code commit was pushed to `coder/perfection-audit-2026-08-22` first. After a fresh fetch, its parent was verified as the exact `origin/main` tip `a322e3e7fe382b4446348f3d8316bc5cea53d9b2`; the same commit was then fast-forwarded to `main` without force-push or merge noise. Both remote refs now resolve to `f48fc23996bbb4f2db8d6d17f2f35884f92bf722`.

GitHub’s public deployment record for that exact commit reports the Vercel **Production** deployment as deployment id `6048902995`, with a successful Vercel status and target deployment URL `https://stitch-and-scale-pro-api-server-2viu94tiw.vercel.app`. The deployment completed at `2026-08-23T14:13:32Z`. The active public alias subsequently served the new entry asset `/assets/index-0b2aiv9D.js`, which returned HTTP 200. Root, `/workspace`, `/project/demo/grading`, and `/project/demo/pdf` each returned HTTP 200.

The live MCP origin boundary remained unchanged and passed with the active public origin: an `OPTIONS /api/mcp` request from `https://stitch-and-scale-pro-api-server.vercel.app` returned `204`, while the same request from `https://evil.example` returned `403`. No connector, schedule, secret, origin configuration, or backend behavior was changed.

## Truth boundary and residual risks

Before this checkpoint, a human inspection record could falsely identify every artifact as produced by `1.0.0` / `standard-v1`, even when the artifact was legacy, non-PDF, differently themed, or created before provenance capture existed. After this checkpoint, new PDF preparation records identify the declared renderer contract, selected template, and locale from the actual export controls, while legacy and incomplete records explicitly say `not-recorded`. The sentinel is an uncertainty marker, not a claim that the artifact used a default template.

The renderer metadata describes the prepared HTML document and the declared renderer contract; it does not prove that a native print dialog was completed or that a PDF file was saved. Browser-native print completion, cancellation, download location, filesystem durability, and later sharing remain outside the app’s provable observation boundary. The package card still treats metadata-only records as unavailable for download rather than manufacturing a link.

Remaining risks are unchanged and explicit: legacy artifacts still lack historical provenance; browser print behavior varies by engine and device; custom-domain migration and its origin-scoped local storage still require a deliberate future verification; authenticated MCP behavior and non-browser clients need separate production checks; below-320px and unusual safe-area/zoom combinations need more evidence; the largest lazy chunks remain candidates for future performance work; and the isolated `mcp/grading-csv-export` branch remains unmerged because its independent deployment/TypeScript failure has not been repaired.

## Release status

CHK-233 is verified and production-promoted. The provenance defect is repaired without broadening the publication model or weakening the print-save truth boundary. The next firing must begin with WIDE RESEARCH and should not treat the research-only portable maker-identity directive, social/gamification ideas, or the isolated CSV-export branch as implementation permission.

## References

[1]: https://github.com/plastic-dude/stitch-and-scale-pro/commit/f48fc23996bbb4f2db8d6d17f2f35884f92bf722 "CHK-233 code commit"
[2]: https://stitch-and-scale-pro-api-server.vercel.app "Stitch & Scale Pro production alias"
[3]: https://stitch-and-scale-pro-api-server-2viu94tiw.vercel.app "CHK-233 production deployment target"
[4]: https://developer.mozilla.org/en-US/docs/Web/API/Window/afterprint "MDN: afterprint event"
[5]: https://developer.mozilla.org/en-US/docs/Web/API/Window/print "MDN: Window.print()"
