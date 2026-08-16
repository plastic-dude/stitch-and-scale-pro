# QA Cycle 48 — Complete Rerun Report

**Repository:** `plastic-dude/stitch-and-scale-pro`  
**Reviewed range:** `d7b37f48c7f92ffb9d57682e1f7aa84e00112029..b7781f144c0e76a9d9d679a3716ad743c6c82316`  
**Role:** Third staff member / QA tester  
**Audience:** Reviewer  
**Date:** 2026-08-16

> **This report is addressed to the Reviewer. The Coder should not act on this report directly without the Reviewer deciding which observations are accepted, rejected, or converted into implementation work.**

## Executive summary

This was a fresh top-to-bottom rerun rather than a partial regression check. It covered the new i18n and branding changes, all five available languages (`en`, `de`, `fr`, `es`, `pt`), explicit light and dark themes, system-theme controls, five viewport classes, the principal routes, all 79 live workspace tabs, onboarding, settings, email capture, project creation stress, malformed-storage recovery, keyboard navigation, reduced-motion mode, 200% zoom behavior, performance observations, and adversarial dark-pattern review. The final baseline was clean: TypeScript passed, Vitest passed **1,694/1,694 tests across 88 files**, and production build passed in **8.02 seconds**.

One product defect was independently reproduced twice and is ready for Reviewer triage. The Marketplace Take-Rate Lab renders duplicate React keys because it uses the flag code alone as the React key even though the engine legitimately emits the same code for different marketplace channels. The visible Watch-outs badges therefore show repeated `TR-03` and `TR-05` identifiers, and React reports the unsupported duplicate-key condition in both isolated runs. No other candidate was promoted to a defect: Google Fonts 404s were treated as a sandbox/network observation, and the low-vision overflow observed under a CSS-zoom probe was not reported as an application defect because that probe is not equivalent to a browser-level 200% zoom implementation.

## Coverage and evidence

| Dimension | Completed coverage | Evidence / qualification |
|---|---:|---|
| Routes | Landing, settings, portfolio, project creation, CSV route, workspace, grading, PDF, unknown route | Full route sweep in `cycle48_results.json`; the supplemental focused rerun exercised landing, settings, project creation, unknown route, and workspace again. |
| Workspace tabs | 79 live tab triggers activated; 79 panel dumps nonempty | Corrected Radix pointer-event activation; no blank panel was accepted as a pass. |
| Languages | English, German, French, Spanish, Portuguese | Settings language options were individually exercised in both themes; representative routes were loaded for every language. This is not a claim that every sentence is natively translated. |
| Themes | Explicit light, explicit dark, system control; reduced-motion media | Full sweep plus focused settings rerun. Representative screenshots are included below. |
| Viewports | 375×812, 430×932, 768×1024, 1280×900, 1440×1000 | Focused landing/workspace viewport sweep; mobile and desktop interaction evidence included. |
| Functional stress | Empty email, double-submit, special characters, empty new-project submission, back/refresh, tab switching | Before/after screenshots saved for key interactions. |
| Resilience | Malformed settings storage, missing project, reload, deep links | Malformed and missing-project scenarios captured in the full harness. |
| Accessibility | Keyboard Tab traversal, focus observations, heading inventory, touch-target counts, reduced motion, zoom probe | Spot-audit only; no WCAG conformance claim. |
| Performance | Navigation timing/LCP/CLS observations in the main sweep | Local lab only; not representative of production field performance. |
| Dark patterns | Landing copy and capture flow reviewed by adversarial persona | No confirmshaming, forced continuity, hidden payment requirement, or consent asymmetry was found in the inspected flow. |
| Personas | First-time visitor, impatient power user, low-vision keyboard user, skeptical/adversarial visitor | Four isolated fresh browser contexts, 24 screenshots, zero console-error rows. |

The focused rerun produced **30 result rows and 240 screenshots** with zero recorded console-error rows and zero harness exceptions. The persona run produced **4 isolated persona results and 24 screenshots**, also with zero recorded console-error rows. The corrected full workspace sweep produced **165 screenshots** and exercised the complete 79-tab registry. Earlier oversized supplemental attempts timed out before producing result files; they are intentionally excluded from the completed-coverage counts.

## Verified defect: duplicate React keys in Marketplace Take-Rate Lab

**Severity:** Major implementation defect, with visible UI and React reconciliation risk.  
**Reproduction:** Confirmed in two independent fresh browser contexts.  
**Relevant source:** `src/components/marketplace-takerate-lab-card.tsx`, lines 240–245.

The component currently renders the flags as follows:

```tsx
{result.flags.map(f => (
  <Badge key={f.code}>…</Badge>
))}
```

The engine returns one flag per channel, but flag codes are not globally unique. In the same valid seeded scenario, Etsy and Ravelry each generate `TR-05`, while LoveCrafts and Ribblr each generate `TR-03`. Both independent runs showed the same React messages:

> Encountered two children with the same key, `TR-05`.
>
> Encountered two children with the same key, `TR-03`.

The rendered screenshot visibly shows repeated `TR-05` and `TR-03` Watch-outs badges. The likely remedy is a stable compound key that includes a channel-unique value or a deterministic index, but the Reviewer should choose the implementation approach. This finding is not based on a single warning, a malformed seed, or a failed automation click; it was reproduced twice with the same valid project data and visually confirmed twice.

![Marketplace duplicate-key reproduction, run 1](qa/cycle48/c48-marketplace-run1.png)

![Marketplace duplicate-key reproduction, run 2](qa/cycle48/c48-marketplace-run2.png)

## Theme, language, and responsive observations

The dark desktop landing view retained the primary hierarchy, navigation, hero CTA, early-access form, and footer without an obvious contrast or consent asymmetry problem in the inspected screenshot. The 375px dark landing view reflowed into a single column without visible horizontal clipping. Settings language options were visited for all five catalog languages in both theme contexts. These observations establish tested states, not formal accessibility certification or proof of complete translation coverage.

![Dark-mode desktop landing](qa/cycle48/c48-dark-desktop-landing.png)

![Dark-mode mobile landing](qa/cycle48/c48-dark-mobile-landing.png)

![Light-mode settings language interaction — before](qa/cycle48/c48-light-settings-language-before.png)

![Light-mode settings language interaction — after](qa/cycle48/c48-light-settings-language-after.png)

![Dark-mode settings theme interaction — before](qa/cycle48/c48-dark-settings-theme-before.png)

![Dark-mode settings theme interaction — after](qa/cycle48/c48-dark-settings-theme-after.png)

## Functional interaction evidence

The landing email capture was tested with an empty submission and a valid submission under double-click stress. The new-project flow was tested with an empty submission and special-character input. Settings theme controls were toggled through light, dark, and system, then the page was refreshed to inspect persistence. Workspace tabs were activated by direct pointer-event dispatch and then revisited after keyboard navigation.

![Landing email empty before](qa/cycle48/c48-landing-email-empty-before.png)

![Landing email empty after](qa/cycle48/c48-landing-email-empty-after.png)

![Landing email valid before](qa/cycle48/c48-landing-email-valid-before.png)

![Landing email valid after](qa/cycle48/c48-landing-email-valid-after.png)

![Workspace tab activation](qa/cycle48/c48-workspace-tabs-after.png)

## Seven-pass audit results

**Pass 1 — Functional stress.** No additional confirmed defect was found in empty submission, double-submit, back/refresh, special-character, deep-link, or tab activation flows. The duplicate-key warning is the only confirmed product defect from the stress run.

**Pass 2 — Usability.** The principal journeys were understandable and recoverable in the tested states. The long landing page and dense workspace are intentional information-heavy surfaces; they merit continued design review but were not converted into defects without a reproducible task failure.

**Pass 3 — Visual/design system.** The harness measured touch-target dimensions, overflow, headings, and focus snapshots. Small-target counts were recorded as polish leads, not automatically defects. The dark and mobile screenshots did not show obvious clipping in the inspected states.

**Pass 4 — Accessibility.** Keyboard traversal, reduced motion, headings, visible focus snapshots, and a zoom probe were exercised. The zoom probe used CSS zoom and produced overflow, so it is explicitly not reported as a browser-level 200% zoom defect. No formal WCAG conformance claim is made.

**Pass 5 — Performance.** Navigation timing, LCP where available, and CLS observations were captured by the main sweep. These are local-lab measurements only. The build still reports a large main chunk warning, so the Reviewer may consider bundle-splitting follow-up separately from this QA defect report.

**Pass 6 — Resilience.** Malformed settings storage and missing-project routes were exercised in fresh contexts. No endless spinner or uncaught application exception was promoted from those scenarios.

**Pass 7 — Dark patterns.** The adversarial landing review found explicit “No signup” and “No spam” language, with no observed credit-card requirement, forced continuity, confirmshaming, hidden-cost disclosure, or asymmetric consent control in the tested flow.

## Non-findings and honest limitations

The seven runtime error rows in the main sweep were not all product defects. Four duplicate-key messages are the same confirmed Marketplace defect appearing in two runs. The other runtime messages were Google Fonts requests failing with 404 in the sandbox, plus an `about:srcdoc` sandboxed-script warning associated with the test environment or embedded preview behavior. Focused reproduction did not establish a localhost application asset failure, so no font/network issue is opened.

The final self-audit found and corrected multiple harness problems before counting results: an absolute/relative workspace URL join error, viewport-dependent tab clicks, delayed-page fallback handling, and screenshot path construction. The oversized supplemental matrix timed out and is excluded from the report. This report does not claim that every available UI string is translated, that every accessibility criterion passes, or that local performance numbers represent production users.

## Reviewer action requested

Please review the duplicate-key defect and decide whether it warrants a coding task. The Coder should not act directly from this report without that decision. Existing issues #48–#53 remain open in GitHub; no unchanged issue was reopened. The current code still contains the known open conditions tracked in those issues, and this cycle does not assert their closure.

## References and artifacts

The complete evidence is stored in the QA branch under `qa/cycle48/`. Key supporting files are `cycle48_coverage_matrix.md`, `cycle48_verified_findings.md`, `cycle48_diagnostics.txt`, `cycle48_self_audit.txt`, `cycle48_results.json`, `cycle48_focused_results.json`, and `cycle48_personas_results.json`.
