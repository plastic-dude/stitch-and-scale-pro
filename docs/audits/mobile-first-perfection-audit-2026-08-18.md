# Stitch & Scale Mobile-First Perfection Audit

**Audit date:** 18 August 2026
**Target:** [stitch-and-scale-pro-api-server.vercel.app](https://stitch-and-scale-pro-api-server.vercel.app/)
**Repository:** [plastic-dude/stitch-and-scale-pro](https://github.com/plastic-dude/stitch-and-scale-pro)
**Audit mode:** Read-only public deployment review, mobile-emulated DevTools view, captured DOM analysis, source inspection, and local typecheck/build validation.
**Implementation status:** No application code, dependencies, or PDF/export behavior were changed.

## Executive verdict

The product should not only be “perfected” by adding more polish to every screen. The larger opportunity is to make the existing power feel calm, reachable, honest, and dependable on a phone. Stitch & Scale already has the beginnings of a serious product: local-first storage, explicit data ownership, transparent grading language, a route registry, a grouped lab navigator, and a responsive shell. The gap is that these promises are not yet unified into a single mobile operating model.

Three issues create the greatest distance from a truly excellent mobile product. First, onboarding is a seven-step, full-screen experience with a long scrollable body and a fixed footer, so it feels like a compressed desktop modal rather than a native mobile decision flow. Second, the application’s information architecture still makes the user manage the product’s internal taxonomy: the workspace contains 79 registry entries while comments and copy refer to both 79 and 80 labs, and mobile navigation requires group selection followed by an “All Labs” sheet. Third, accessibility and resilience are uneven. The code exposes some good states, but error announcements, focus/inert behavior, reduced motion, selected-state semantics, touch comfort, and performance budgets are not treated as one system.

> The standard for “perfect” is not that every control fits. The standard is that every important task remains discoverable, reachable, reversible, and comfortable when the device is narrow, content is enlarged, the network is slow, and the user has not memorized the product’s taxonomy.

## Evidence boundary

The live mobile view was captured at approximately **314 × 536 CSS pixels** while onboarding. The visible flow showed the welcome screen, principles step, sizing-standard step, and measurement-unit step. The DOM snapshot contained the onboarding dialog plus dashboard content underneath it. Repository evidence was taken from the current main checkout, including `App.tsx`, `shell.tsx`, `onboarding.tsx`, `dashboard.tsx`, `new-project.tsx`, `project-workspace.tsx`, `tab-navigator.tsx`, `settings.tsx`, and `import-csv.tsx`.

The application checkout passed its typecheck and production build. The production build emitted a **950.97 kB minified main chunk, 293.80 kB gzip**, together with the bundler warning that some chunks exceed 500 kB. This is not automatically a user-visible failure, but it is a material mobile performance risk.

The official Chrome DevTools MCP connector was personalized for this audit with `/usr/bin/chromium`, `--headless`, `--isolated`, `--viewport=390x844`, disabled usage statistics and update checks, and `--experimental-devtools`. The connector definition saved successfully. The session’s generic MCP registry did not expose the custom connector name for a live run, so this report does **not** claim MCP-generated findings; it uses the captured DevTools mobile view, live DOM evidence, source evidence, and local validation instead. The reproducible setup is documented in the repository playbook.

## Critical findings

| ID | Severity | Finding | Evidence | User impact | Recommended correction |
|---|---|---|---|---|---|
| P1-01 | P1 High | Onboarding is a full-screen modal with an unproven focus boundary. | `onboarding.tsx` renders `role="dialog"` and `aria-modal="true"`, but the component does not visibly implement a focus trap, explicit focus return, or inert/`aria-hidden` treatment for the shell underneath. The DOM snapshot exposed dashboard text while onboarding was active. | Keyboard and screen-reader users may traverse content that sighted users cannot reach. Users can lose context or land on controls behind the overlay. | Use a tested dialog primitive or implement explicit focus capture, focus return, inert background behavior, labelled headings, and a keyboard escape policy. Add automated accessibility tests for initial focus, tab cycling, close/skip, and return focus. |
| P1-02 | P1 High | Workspace navigation has an identity/count inconsistency and still makes users manage taxonomy. | The registry contains 79 entry rows by source count, while `tab-navigator.tsx` comments mention “all 80 tabs”; localized copy says “All 79 Labs”; a separate count of `value:` fields is 80. | A product with dozens of labs cannot afford uncertainty about how many destinations exist. The mismatch reduces trust and makes QA drift likely. | Derive the count from one runtime registry function. Remove all hardcoded 79/80 strings and comments. Add a test that asserts registry count, group totals, trigger label, sheet title, and accessibility name remain identical. |
| P1-03 | P1 High | Mobile navigation is improved but remains a two-layer taxonomy rather than a task-first navigator. | At `<1024px`, `project-workspace.tsx` renders a two-column group-chip grid and a full-width “All Labs” sheet trigger. The sheet then exposes grouped lab lists. Group buttons select the first tab in a group and do not expose a selected state. | A designer must know the product’s six internal groups before reaching a lab. The “first tab” behavior is surprising, and the active group is not clearly conveyed. | Make the navigator task-first: provide recent/frequent labs, search/filter, explicit active group state, and a flat searchable list inside the sheet. Preserve direct URLs and browser history. Do not make a group chip silently open the first lab without clear preview or confirmation. |
| P1-04 | P1 High | Disabled sizing standards look like product choices even though only CYC and Custom are available. | `onboarding.tsx` defines eight standards, but six are disabled and labelled “Coming soon”; settings repeats that international standards will be available through future updates. The live flow exposes a “Show 6 more standards” expansion. | Users spend attention on dead controls and may assume a standard is available when it is not. This is especially risky in a grading product where a standard changes the meaning of measurements. | Replace disabled cards with a concise roadmap note, or clearly separate “available now” from “planned.” Show the exact current capability and link to a real settings roadmap only if it helps. Test copy against the grading engine’s supported values. |
| P1-05 | P1 High | Error feedback is not consistently announced to assistive technology. | CSV errors render in a styled `<div>` without a visible `role="alert"`/status pattern. Dashboard import failures are delivered through a toast. The form does not visibly associate an error summary with the file control. | A failed import can look like nothing happened to a screen-reader user or a user with a slow connection. Recovery steps are not guaranteed to be discoverable. | Use an assertive or polite live region according to severity, associate errors with the triggering control, preserve the selected filename, and give a deterministic retry path. Test malformed CSV, unreadable JSON, oversized files, and repeated same-file selection. |
| P1-06 | P1 High | The main mobile bundle is too large for a product whose workflow is explicitly local-first and mobile-oriented. | Production build: `index-ZqCxHBU2.js` is 950.97 kB minified / 293.80 kB gzip, with a warning for chunks over 500 kB. | Slow first launch, especially on mid-range phones or constrained networks, undermines the promise of immediacy and makes the seven-step onboarding feel heavier. | Measure route-level transfer and execution budgets. Move non-entry labs, PDF templates, portfolio cards, and optional settings logic behind verified route-level boundaries. Establish a mobile budget for first contentful interaction, not only total bundle size. |
| P1-07 | P1 High | The header becomes icon-only at phone widths without enough contextual support. | `shell.tsx` hides Projects, Portfolio, and Settings labels below `md`, and hides the New Project label below `sm`. The hit areas were raised to `min-h-11 min-w-11`, which helps touch comfort, but the visual identity is still icon-dependent. | Users who do not recognize the icons must infer navigation from symbols. The narrow header also competes with onboarding’s own header and skip action. | Use a mobile bottom navigation or a single clearly labelled “More” surface, keep one primary action visible, and expose the current destination with text or a stronger selected treatment. Test at 320px with large text. |

## Important findings

| ID | Severity | Finding | Evidence and impact | Recommended correction |
|---|---|---|---|---|
| P2-01 | P2 Medium | Onboarding asks for too much explanation before the first task. | Seven steps cover welcome, principles, sizing, units, workspace tour, sample journey, and completion. The principles step uses four cards; the captured mobile view required scrolling while a fixed footer occupied part of the viewport. | Reduce the mandatory path to the decisions required to create a project. Move philosophy, tour, and sample guidance into optional, revisitable education. Preserve a concise “why this matters” sentence rather than four cards. |
| P2-02 | P2 Medium | Onboarding progress is semantically present but visually too subtle. | `StepDots` exposes a `progressbar` label and values, but the visible dots are tiny, low-contrast, and do not show step names. | Users know there are dots but not what remains. Add “Step 3 of 7” text and a short current-step label. Keep the progressbar semantics and test zoom/large text. |
| P2-03 | P2 Medium | The dashboard’s empty state spends vertical space before giving the user a task. | `dashboard.tsx` uses `py-32` around the empty state and places the primary and import actions after a large illustration/title/copy block. | On a phone, the first useful action can fall below the fold, particularly with the storage warning and shell/footer present. | Make the first action visible within the initial viewport, keep the explanation short, and move backup education to a compact notice with a direct “Back up now” action. |
| P2-04 | P2 Medium | Local-storage messaging is repeated across layers without a clear safety action. | Onboarding explains local-first ownership and cloud sync; the dashboard exposes a Local Storage Notice; settings contains the actual backup controls. | The user receives warnings but must remember where the remedy lives. Repetition can feel alarming rather than empowering. | Convert the message into a stateful storage status component with last-backup time, backup action, restore action, and a non-alarming explanation of browser-data loss. |
| P2-05 | P2 Medium | New-project validation relies on disabled actions rather than visible guidance. | `new-project.tsx` blocks step 1 until name and author are non-empty and blocks creation until gauge values are positive. There is no visible inline explanation when the Next/Create action is disabled. | Users may interpret the app as frozen or fail to understand the required fields, especially with keyboard and screen-reader navigation. | Add field-level required indicators, inline errors after first interaction, and a short disabled-action explanation. Keep validation near the field rather than only in the footer. |
| P2-06 | P2 Medium | Settings is a long, dense control surface that needs information architecture rather than more cards. | `settings.tsx` stacks language, units, sizing, custom chart editing, appearance, onboarding, backup, and storage health in one long page. Custom standard keys use a horizontal scrolling chip row. | Important data-safety and grading controls compete with low-frequency preferences. Horizontal chips are difficult to scan and can hide the current editing context. | Group settings into task sections with a sticky local index or accordion. Replace the custom-key scroller with a searchable/selectable list that retains the current key and shows modified count. |
| P2-07 | P2 Medium | Several small icon-only controls remain below comfortable mobile targets. | The shell recovery dismiss button uses `p-1` around a 14px icon; dashboard card menu uses `p-1.5` around a 16px icon. The header navigation was explicitly corrected to 44px, but these controls were not given the same guarantee. | Dismiss, duplicate, export, and delete actions become harder to hit and easier to trigger accidentally. | Apply a consistent 44×44px hit area with a visually compact icon. Add spacing between adjacent icon actions and a visible confirmation for destructive actions. |
| P2-08 | P2 Medium | Reduced-motion support is not treated as a global interaction policy. | Source search found `useReducedMotion()` in `not-found.tsx`, but no general `prefers-reduced-motion`/`useReducedMotion` handling across onboarding, shell transitions, dashboard motion, and settings transitions. | Motion may be acceptable in one route and uncomfortable or disorienting in another. | Establish a shared motion policy. Disable or simplify onboarding transitions, staggered cards, and route fades when reduced motion is requested. Test the entire entry flow, not only 404. |
| P2-09 | P2 Medium | Mobile import and restore flows need explicit progress and recovery states. | File inputs are hidden behind large custom buttons; CSV parsing is asynchronous and reveals the form progressively; JSON restore uses toasts. | Users may not know whether a file is being read, merged, rejected, or safely stored, especially on large files or slow devices. | Show selected filename, progress/read state, record counts, validation summary, merge semantics, and a durable completion status. Keep the native file input accessible by label or programmatic association. |

## Flow-by-flow audit

### Onboarding

The visual direction is confident: dark background, strong serif headings, restrained accents, and a clear bottom action. The problem is not taste. It is the amount of ceremony placed between first launch and first useful work. The principles step uses four cards, the sizing step expands six unavailable standards, and the workspace tour adds another layer of explanation before the user can create a pattern. This should become a progressive disclosure system: one short setup path, with “Learn more” and “Try a sample” as optional branches.

The source implementation has some positive semantics. The progress indicator is a `progressbar` with current/min/max values, selected sizing/unit buttons use `aria-pressed`, and the overlay is labelled as a dialog. Those strengths should be retained. The missing proof is behavioral: initial focus, tab order, inert background, escape handling, focus return, and large-text/keyboard behavior must be tested rather than inferred from `aria-modal` alone.

### Dashboard and project creation

The empty dashboard is emotionally clear but operationally late. A blank canvas, long copy, and a large top/bottom rhythm can push “Draft a New Pattern” below the first mobile viewport. The storage notice is useful but should be coupled to an immediate backup action. Once projects exist, the card menu provides duplicate/export/delete capability, but the menu trigger’s small icon target and pointer-fine opacity behavior need a touch audit.

The three-step project wizard is structurally understandable. It uses a progress rail, form labels, a base-size grid, unit controls, numeric gauge inputs, and a persistent footer. Its main weakness is disabled-state communication. Requiring name and author is reasonable; making the action silently inert until both fields are populated is not. The wizard should explain the missing requirement in place and make the current step’s completion state explicit.

### Workspace and labs

The product’s largest information-architecture risk is the workspace navigator. The current responsive design is an improvement over a flat strip: mobile receives group chips and an “All Labs” bottom sheet, while desktop retains the real tab triggers. However, the user still has to understand six internal groups and then scan a long grouped list. A product with 79 labs should provide search, recents, favorites, and task-oriented labels before asking users to browse categories.

The count mismatch is particularly important because it is objective and testable. The source registry has 79 entry rows by the current text count, while the navigator comments, copy, and value-field count produce 80/79 ambiguity. This should be corrected before further navigation polish because every downstream QA result depends on a single source of truth.

### Settings, data safety, and import/export

Settings contains the right categories but presents them as a long vertical stack. The custom standard editor’s one-key-at-a-time approach is more usable than a 117-cell matrix, yet its horizontal key strip still makes the user manage the editor rather than the measurement task. Language selection, units, theme, onboarding reset, backup, restore, and storage health should be organized around user goals: **workspace defaults**, **grading standards**, **appearance**, and **data safety**.

The product’s local-first promise is valuable, but it raises the standard for recovery. Backup/export should be a first-class status, not only a setting and a warning. Import errors need accessible live announcements and durable recovery instructions. The product should be explicit about whether a restore merges or replaces data before the file is selected, not only after the operation.

## Accessibility and comfort audit

The benchmark is intentionally stricter than minimum conformance. Apple recommends a default control size of 44×44 points for iOS/iPadOS and emphasizes spacing, contrast, larger text, alternative interactions, and reduced motion.[1] WCAG 2.2’s minimum target-size criterion is 24×24 CSS pixels with spacing alternatives, while the enhanced criterion uses 44×44 CSS pixels.[2] Important Stitch & Scale controls should target the comfort standard, not merely pass the floor.

| Check | Current assessment | Required verification |
|---|---|---|
| Touch targets | Header links were raised to `min-h-11 min-w-11`, but recovery dismiss and card-menu controls remain visually compact without equivalent guarantees. | Measure every actionable element at 320px and 390px; test one-handed tapping and accidental adjacency. |
| Dialog focus | Overlay has `role="dialog"` and `aria-modal="true"`; explicit focus trap/inert behavior is not evident in the component. | Keyboard tab cycle, screen-reader virtual cursor, escape, skip, route change, and focus return. |
| Selected states | Onboarding unit and sizing controls use `aria-pressed`; workspace group chips and settings sizing-standard buttons do not show equivalent selected state. | Inspect accessibility tree for current group, tab, sizing standard, theme, language, and unit. |
| Errors | CSV errors are visual containers; dashboard/settings failures use toasts. | Confirm announcements, focus movement, persistent retry, and error-to-control association. |
| Motion | Global reduced-motion policy was not found; only `not-found.tsx` visibly uses `useReducedMotion`. | Enable Reduce Motion and verify onboarding, route transitions, card stagger, sheets, and settings expansion. |
| Contrast and text | Captured mobile onboarding showed small secondary copy that reads subdued against the dark background. | Measure text and icon contrast in both themes at normal and enlarged text sizes. |
| Zoom/keyboard | No complete live test was possible through the timed-out browser controls. | Test 200% zoom, 400% reflow where applicable, hardware keyboard, virtual keyboard, and focus visibility. |

## Performance and resilience

The main production bundle is the most concrete technical risk found in local validation. The main chunk is 950.97 kB minified and 293.80 kB gzip, and the bundler warns about chunks over 500 kB. Because the app is explicitly local-first, it should feel responsive without waiting for a server, which makes JavaScript transfer and execution a product issue rather than an engineering-only concern.

The application does lazy-load many lab cards, which is a good direction. The next step is to measure the entry route separately from the workspace and PDF routes, establish budgets, and verify that code splitting actually removes optional features from the first meaningful interaction. Add a slow-network/CPU test to the audit and record LCP, INP, CLS, first input readiness, and route transition time. Do not hide a slow experience behind a spinner; show a useful loading state and preserve the user’s context.

## Highest-leverage implementation order

| Order | Change | Why it comes first | Verification |
|---:|---|---|---|
| 1 | Establish a single registry-derived lab count and navigation contract. | It removes a factual trust defect and stabilizes every later navigation change. | Registry count test, localized copy test, grouped totals, deep links, history, screen-reader names. |
| 2 | Replace the mandatory seven-step onboarding with a short decision path plus optional education. | It improves time-to-first-task and reduces mobile scroll burden without removing the product story. | Fresh profile at four phone widths, skip/sample/create-own paths, large text, keyboard, reduced motion. |
| 3 | Make the onboarding dialog behaviorally accessible. | A visually correct modal can still be unusable for keyboard and assistive-technology users. | Initial focus, tab trap, escape, focus return, inert background, route preservation, screen reader. |
| 4 | Make the mobile workspace navigator task-first. | The 79-lab surface is the product’s largest discoverability challenge. | Search, recent/favorite labs, active group state, direct links, back behavior, no hidden destinations. |
| 5 | Create a unified mobile shell with one primary action and contextual navigation. | The current icon-heavy top shell competes with onboarding and workspace content. | 320px/large text, thumb reach, active route, safe areas, landscape, desktop parity. |
| 6 | Fix import/restore error semantics and recovery. | Data safety is a core product promise; failure must be understandable and reversible. | Screen reader announcements, malformed files, slow read, repeated selection, merge/retry. |
| 7 | Introduce a global reduced-motion and focus policy. | Motion and focus behavior should not vary unpredictably by route. | OS Reduce Motion, keyboard, sheets, route transitions, errors, dialogs. |
| 8 | Re-architect entry-route bundle boundaries. | Performance affects every first launch and every low-end phone. | Mobile slow 4G/CPU trace, route budgets, LCP/INP/CLS, first interaction readiness. |
| 9 | Restructure settings around user goals. | Data safety and grading standards are currently buried in a long card stack. | Findability test, deep links, custom standard editing, backup/restore, localization. |
| 10 | Add a visual-regression and accessibility matrix to CI. | Prevents recurring mobile regressions from being rediscovered manually. | Screenshots and accessibility snapshots at four widths, both themes, reduced motion, keyboard. |

## Agent-ready prompt pack

### Prompt A — Information architecture and navigation

> Audit and improve Stitch & Scale’s workspace navigation as a mobile-first task system. Start from the canonical tab registry and derive the total count, group counts, localized labels, and accessibility names from one source. Remove all hardcoded 79/80 strings. On mobile, provide search, recent/favorite labs, clear active-group state, and direct selection without requiring users to understand the internal taxonomy. Preserve deep links, browser history, back behavior, Radix tab semantics, and desktop reachability. Do not modify grading calculations, local persistence, PDF rendering, or add dependencies. Verify at 320×568, 360×800, 390×844, 430×932, landscape, desktop, keyboard, screen reader, large text, and reduced motion.

### Prompt B — Onboarding and mobile shell

> Redesign onboarding as a short, mobile-native decision flow. The product should not only be “perfected” by adding polish to every screen; prioritize time-to-first-task, clarity, safe skipping, recoverability, focus behavior, and one-handed comfort. Keep local-first, units, sizing-standard, sample, and create-own decisions honest. Move philosophy and tour content to optional education. Implement a behaviorally correct dialog with initial focus, focus trap, focus return, inert background, keyboard escape policy, readable progress text, and reduced-motion behavior. Preserve deep-link entry routes and sample-project semantics. Do not alter grading math or PDF output. Verify all phone widths, zoom, keyboard, screen reader, both themes, and slow devices.

### Prompt C — Accessibility and data safety

> Audit every import, restore, backup, delete, reset, and validation state. Every error must be announced, associated with its control, persistent long enough to understand, and paired with a recovery action. Make important touch targets approximately 44×44 CSS pixels or points with adequate spacing. Add selected/expanded/disabled semantics to all custom controls. Create a shared reduced-motion policy and focus policy. Preserve local-first storage and clearly explain merge versus replace behavior before a destructive or irreversible action. Do not add analytics or unrelated dependencies. Verify with keyboard, screen reader, 200% text, reduced motion, light/dark themes, malformed files, slow reads, and repeated actions.

### Prompt D — Performance and resilience

> Establish a mobile performance budget for the entry route. The current production build contains a 950.97 kB minified main chunk and a 293.80 kB gzip main chunk, so do not treat total bundle size as acceptable by default. Identify what the dashboard, onboarding, workspace, portfolio, PDF, and optional labs each load. Move optional features behind reliable boundaries, measure route-level transfer and execution, and preserve a useful loading state. Verify slow 4G, CPU throttling, offline/local-first behavior, LCP, INP, CLS, first meaningful interaction, and route transition time. Do not change feature behavior or add dependencies without a separate certified task.

## Repository discussion and tool profile

The discussion and playbook were published to the documentation-only branch [`audit/mobile-first-perfection-discussion`](https://github.com/plastic-dude/stitch-and-scale-pro/tree/audit/mobile-first-perfection-discussion). The latest remote commit is `bbb904a`, and the branch contains no application-code or dependency changes.

The playbook credits **Chrome DevTools MCP** and records the personalized session profile: `/usr/bin/chromium`, isolated headless mode, 390×844 viewport, disabled usage statistics and update checks, and experimental DevTools access. The profile is intentionally separate from the application and should never be added to `package.json`. The audit did not use the exposed credential file; that token should be revoked and rotated independently.

## References

[1]: https://developer.apple.com/design/human-interface-guidelines/accessibility "Apple Human Interface Guidelines: Accessibility"
[2]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html "WCAG 2.2 Success Criterion 2.5.8: Target Size (Minimum)"
[3]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html "WCAG 2.2 Success Criterion 2.5.5: Target Size (Enhanced)"
[4]: https://github.com/ChromeDevTools/chrome-devtools-mcp "Chrome DevTools MCP official repository"
