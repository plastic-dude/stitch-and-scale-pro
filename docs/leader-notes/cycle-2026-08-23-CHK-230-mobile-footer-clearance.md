# CHK-230 — Mobile footer clearance

**Date:** 2026-08-23  
**Author:** Manus AI  
**Status:** Code released to `main`; exact production deployment READY and active alias verified  
**Code commit:** `1456b393b5364340bfd7bc78ab9145c1327788c1`  
**Vercel production deployment:** `dpl_8iPrH5Ezm2jy8C5hC1FMGFJtup1r`  
**Active origin:** `https://stitch-and-scale-pro-api-server.vercel.app`  
**Active entry asset:** `/assets/index-CE5GyZtK.js`

## Direct answer to the reported mobile issue

The reported obstruction was a genuine shared-shell clearance defect. The fixed mobile navigation remained visually anchored to the device viewport while the document footer ended too close to the viewport bottom. At the document’s maximum scroll position, the footer box could extend beneath the navigation even though the page itself had reached its scroll endpoint. The issue was not repaired by suppressing scrolling or by applying a global `overflow: hidden` rule.

The shared shell now reserves the full mobile navigation height plus the device safe-area inset in the footer. The clearance applies below the desktop breakpoint, including tablet widths where the mobile navigation is still active. The previous tablet utility that cancelled the vertical padding was removed. At the desktop breakpoint, the footer returns to its original compact height and the mobile navigation is hidden.

The supplied screenshot was not reopened. The conclusion was reproduced from source inspection and fresh DOM geometry against a rebuilt local bundle and the active public alias.

## Implemented repair

| Surface | Change | Boundary preserved |
|---|---|---|
| Shared mobile footer | Replaced the insufficient mobile-only bottom padding with `pb-[calc(4.25rem+env(safe-area-inset-bottom))]`, retaining the tablet rule through `md` and resetting only at `lg`. | Desktop layout remains unchanged; no page-wide overflow clamp or scroll suppression was introduced. |
| Responsive contract | Updated the source regression to require safe-area-aware footer clearance through tablet widths and desktop reset at `lg`. | Existing 100dvw fixed-navigation containment and fixed-surface assertions remain intact. |
| User-visible behavior | Footer description and About link remain reachable above the fixed navigation after scrolling to the document end. | The fix is shared and reversible, rather than a route-specific spacer that could drift as pages change. |

## Geometry evidence

A fresh isolated browser probe was run against the rebuilt local preview at 320, 390, 768, and 1024 CSS pixels, followed by the same probe against the active public alias. The probe scrolled to the document maximum and measured the fixed navigation, footer, and actual footer text/link descendants.

| Width | Nav geometry | Footer padding-bottom | End-scroll footer text bottom | Result |
|---:|---|---:|---:|---|
| 320 | `y=779`, `bottom=844`, `height=65` | `68px` | `776px` | Both footer rows end above the navigation. |
| 390 | `y=779`, `bottom=844`, `height=65` | `68px` | `775px` | Both footer rows end above the navigation. |
| 768 | `y=779`, `bottom=844`, `height=65` | `68px` | `776px` | Tablet mobile navigation remains clear of footer content. |
| 1024 | Navigation hidden | `0px` | `823px` | Desktop footer resets to `64px` with no mobile clearance residue. |

The active-alias probe produced the same geometry at 390, 768, and 1024px. The local 320px probe also passed; 320px is the narrowest width included in this follow-up smoke. The fixed navigation still occupies its intended device-native viewport surface; the document now has enough real content height for normal scrolling to reveal the footer above it.

## Validation evidence

The focused responsive suite passed, and the complete application gate passed **224 files / 2,578 tests**. The application and workspace TypeScript checks passed. The production build passed in **5.43 seconds** with entry bundle `324.16 kB / 101.71 kB gzip`, i18n bundle `208.62 kB / 58.58 kB gzip`, and the existing Project PDF route chunk `70.08 kB / 21.05 kB gzip`.

`git diff --check` passed. Source-bundle verification passed with archive SHA `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082` across 15 protected files. The protected invention brief remained unchanged at SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`.

The audited code commit was pushed to the audit branch first and then promoted to `main` only after confirming its parent was the exact prior release tip `b422ecf82b6b59b1c75dbf779bef0cb5cf01b4e3`. The resulting `main` and audit-branch tip is `1456b393b5364340bfd7bc78ab9145c1327788c1`, and the worktree is clean.

Vercel deployment `dpl_8iPrH5Ezm2jy8C5hC1FMGFJtup1r` progressed `QUEUED → BUILDING → READY` for the exact CHK-230 GitHub commit. The active alias serves matching entry asset `/assets/index-CE5GyZtK.js`. Root, canonical workspace, grading, and PDF routes returned HTTP 200. The active MCP boundary remains unchanged and passed again: allowed-origin `OPTIONS /api/mcp` returned `204` with the alias origin, while forbidden-origin preflight returned `403`. No connectors or schedules were modified.

## Residual risks

The supplied screenshot was not reopened, in accordance with the explicit restriction; the result is based on source, generated CSS, and programmatic browser geometry. Widths below 320px were not included in this follow-up matrix. Browser UI chrome, unusual safe-area implementations, zoom settings, and future changes to mobile navigation height can still change the required clearance. The current shared contract uses the known 65px navigation geometry plus safe-area padding; any future navigation redesign should update the responsive regression and geometry smoke together.

The page remains intentionally scrollable. The repair does not claim that every route has been visually inspected at every possible device size, nor does it claim durable export/download behavior. The broader deferred items from CHK-229 remain deferred, including custom-domain-specific origin verification, Project Book photo-page expansion, cross-project gallery indexing, social sharing, cloud sync, and gamification.
