# CHK-227 — Responsive device-native shell, deep-link focus, and mobile controls

**Date:** 2026-08-23
**Author:** Manus AI
**Status:** Complete and live on the active production alias
**Code commit:** `3ad6d5015a6d42d151345eff5203c293199c971c`
**Production deployment:** `dpl_DKYmv2NbPdydtywNBQ7VYce7MLoW` (`READY`, target `production`)
**Active alias:** [stitch-and-scale-pro-api-server.vercel.app](https://stitch-and-scale-pro-api-server.vercel.app)

## Scope and decision

This checkpoint addresses the four user-reported device-native defects without broadening the product into a new navigation or gamification system. The implementation keeps the application logo as the top-level home affordance, makes the bottom route bar the single route-navigation surface below the desktop breakpoint, and restores the desktop header navigation at `lg` widths and above. The change is deliberately narrow, reversible, and tied to source-level regressions.

| Reported defect | Correction | Verification contract |
|---|---|---|
| New Project’s “Change in settings” opened a generic Settings landing | The handoff now uses `/settings?focus=grading-standard#grading-standard`. Settings detects the query/hash contract, scrolls the grading-standard section into view, and focuses the currently selected CYC or Custom button. | The target exists, CYC is selected in the seeded fixture, and `button-standard-cyc` is focused at 390px, 768px, and 1024px. |
| Release Portfolio appeared enlarged or cropped and could create page overflow | Planning and summary grids stack below `sm`; the Portfolio root now explicitly uses `w-full min-w-0` inside the shell’s flex route container; intentional inner ranking/bundle scrollers remain unchanged. | Portfolio has no body or document overflow at 390px, 768px, or 1024px in both local-preview and active-alias smoke runs. |
| Project-card selector covered the project-name initial; selected actions ran off-screen | The card header reserves selector space at all phone widths, the selector is a 44×44px touch target, and the batch banner/action groups wrap with minimum-width-safe text. | The selector’s right edge is at or before the title’s left edge; the seeded card and batch controls have no body or document overflow at all three widths. |
| Header and bottom navigation duplicated route controls on sub-desktop devices | Header route navigation/status controls move to `lg` visibility and the mobile bottom navigation remains active through `<lg`; the logo remains the top home link. Main and fixed surfaces receive sub-desktop bottom/viewport clearance. | At 390px and 768px, header route navigation is hidden and bottom navigation is visible; at 1024px, header navigation is visible and bottom navigation is hidden. |

## Implementation and regression coverage

The application changes are limited to `shell.tsx`, `index.css`, `dashboard.tsx`, `new-project.tsx`, `portfolio.tsx`, and `settings.tsx`. The test changes add or update the responsive layout, dashboard selection, shell navigation, and New Project touch-target contracts. The fixed mobile navigation is constrained to `100dvw`, and the toast stack receives a narrowly scoped sub-desktop viewport-width rule; no broad global overflow hiding was introduced.

The Settings implementation uses a stable `grading-standard` element ID, a `gradingStandardRef`, a one-time `requestAnimationFrame`, smooth section scrolling, and focus on the selected `[aria-pressed="true"]` choice with a CYC fallback. Both CYC and Custom controls retain explicit `aria-pressed` state. The dashboard selector preserves its existing event propagation safeguards and accessible label while adding the mobile hit-area reservation.

## Validation evidence

| Gate | Result |
|---|---|
| Focused responsive, shell, dashboard, and New Project tests | Passed before the complete gate; the complete suite also passed after the final source state. |
| Full Vitest | **222 test files passed; 2,570 tests passed**. Duration: 7.03s. |
| App TypeScript check | Passed. |
| Root/workspace TypeScript check | Passed for API server, Stitch & Scale, mockup sandbox, and scripts. |
| Production build | Passed in 4.80s. Current entry bundle: 324.08 kB / 101.65 kB gzip; i18n chunk: 208.61 kB / 58.57 kB gzip. |
| `git diff --check` | Passed. |
| Source-bundle context verifier | Passed: archive SHA `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`, 15 files. |
| Protected invention brief | Preserved: SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`. |

### Fresh browser smoke

A fresh dedicated CDP profile exercised the canonical seeded demo route and the affected pages at 390px, 768px, and 1024px. The local built preview and the active public alias produced the same contract result: all smoke assertions passed.

| Width | Settings target/focus | Portfolio overflow | Card selector/title | Batch overflow | Navigation ownership |
|---:|---|---|---|---|---|
| 390px | `#grading-standard`; CYC button focused | None | 44×44px selector; right edge 76px, title begins 81px | None | Header hidden; bottom navigation visible |
| 768px | `#grading-standard`; CYC button focused | None | 44×44px selector; right edge 92px, title begins 97px | None | Header hidden; bottom navigation visible |
| 1024px | `#grading-standard`; CYC button focused | None | Selector clears title | None | Header visible; bottom navigation hidden |

The active alias returned HTTP 200 for `/`, the Settings deep link, `/portfolio`, and the canonical demo project route. Its HTML references `assets/index-D3qaLKiz.js`, matching the current verified local production build. The exact Vercel deployment URL is protected by Vercel SSO and returned a 302 to the Vercel sign-on endpoint; this does not invalidate the active-alias proof.

## Production and integration boundaries

The audit branch was pushed first, then `main` was fast-forwarded only after `origin/main` equaled the code commit’s parent `f59ba2a41ab08908ce19b10bed2eef264ba35fdd`. The exact production deployment feed recorded the new commit SHA `3ad6d5015a6d42d151345eff5203c293199c971c`, target `production`, and state `READY`; the active alias then served the matching entry bundle and passed the fresh three-width smoke.

The active MCP boundary remained unchanged and was freshly checked. An allowed-origin `OPTIONS /api/mcp` returned `204` with `POST, OPTIONS` and the expected `Authorization, Content-Type, MCP-Protocol-Version` headers. A forbidden-origin preflight returned `403` JSON behavior. No authenticated MCP call was needed because this checkpoint changed only frontend responsive behavior.

No connector, browser integration, or active schedule was modified. Open public repository items remain PRs #70, #71, and #72; no standalone issue was introduced for this checkpoint. The current `main` and audit branch both resolve to `3ad6d5015a6d42d151345eff5203c293199c971c` locally after the push.

## Residual risks and honest limits

Vitest continues to emit known non-browser `indexedDB is not defined` persistence diagnostics in reducer tests, and Vite continues to emit six known sourcemap-location warnings for shared UI files. These are non-failing diagnostics and were not hidden. The smoke covered 390px, 768px, and 1024px; widths below 390px, real iOS/Android WebViews, custom-domain origin migration, authenticated MCP calls, and durable completion of browser download/print/share handoffs remain separate evidence items. The smoke proves request preparation and rendered geometry, not filesystem delivery or native share completion.

This checkpoint does not claim global chunk optimization or publication readiness beyond the exact responsive scope. It also does not reopen the queued recognition/gamification work: `QUEUE-067` remains research-only under the standing two-pass approval rule.
