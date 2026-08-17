# QA Cycle 60 — Stitch & Scale live regression report

## Scope

This was a fresh, read-only Sq1 crawl of `https://stitch-and-scale-pro-api-server.vercel.app` at the latest available repository head `89f09c3` (`[CHK-122]` notes; the relevant implementation fix is `d6c4a51` / `[CHK-120]`). The crawl used clean first-use contexts at Android 360px, iPhone 390px, iPhone 430px, tablet 768px, and desktop 1280px.

The cycle re-tested the three prior QA surfaces affected by the latest commits: the clean-profile landing demo CTA, the new responsive grouped workspace navigator, and the landing capability-card first-paint behavior. It also traversed Settings, New Project, PDF route entry, all six visible workflow-group controls, and representative long-form lab states.

## Baseline result

The prior issues were materially improved on the live build. The clean landing CTA now opens the populated sample project instead of Project Not Found. Landing capability content is present in the first loaded DOM and visible without a scroll gesture. The live crawl recorded 85 screenshots, zero navigation/screenshot errors, and zero browser console errors in the focused regression pass.

## New finding for REVIEWER

**Severity: MAJOR — mobile/tablet users cannot reach the full Labs navigator after CHK-120.**

On Android 360px, iPhone 390px, and iPhone 430px, the new `All Labs` control exists in the DOM with accessible name `Open grouped list of all 79 workspace labs`, but its bounding rectangle is `0×0` at `(0,0)`. The control is not visible or touch-reachable. The inspection shows its parent chain includes the hidden desktop surface:

```text
TabsList parent class: items-center ... hidden lg:flex lg:flex-nowrap ...
display: none at all tested mobile widths
```

The live mobile screenshot shows the six 44px workflow-group chips and the Sections content, but no visible `All Labs` button or sheet trigger. Activating a group chip directly opens only that group’s first lab; there is no visible control in the resulting lab page to open the remaining labs. The underlying 79 role-tab controls also have zero rectangles on mobile.

### Reproduction

1. Open the live URL in a clean mobile context at 390×844.
2. Choose **Skip setup**.
3. Open the project workspace and inspect the navigation below the project header.
4. Observe the six workflow-group chips, but no visible **All Labs** control.
5. Attempt to reach a late lab such as **Intl Pricing Lab**, **Payback Lab**, or **Brag Cards** using normal touch navigation. No visible All Labs sheet or complete lab list is available.
6. DOM evidence confirms the `data-testid="tab-navigator-trigger"` button has `display: inline-flex` itself but a zero-size ancestor whose class includes `hidden lg:flex`; the trigger’s measured rectangle is zero at 360, 390, and 430px.

### Source anchor

At the latest main source, `src/pages/project-workspace.tsx` lines 1017–1025 open `<TabsList className="hidden lg:flex ...">` and then mount the mobile `<div className="lg:hidden mb-2"><TabNavigator ... /></div>` before the `</TabsList>` close at line 1041. Because the mobile navigator is nested inside the hidden `TabsList`, the component’s correct mobile branch cannot render on small screens.

### Expected behavior

At mobile and tablet widths, `All Labs` must be visible, have a measurable touch target, open the grouped sheet, and expose every registered lab. The user must be able to select a late lab and return to Sections/Preview without hunting or using a hidden desktop control. The desktop flat strip may remain as a separate accessibility surface.

### Acceptance test

In fresh contexts at 360×800, 390×844, 430×932, and 768×1024: the `tab-navigator-trigger` must have a non-zero visible rectangle and a minimum 44px touch target; tapping it must open the grouped sheet/dropdown; every group must expose its full count; selecting Intl Pricing Lab, Payback Lab, and Brag Cards must render the correct panel; no role-tab or navigator control may be hidden by a parent `display:none`; console errors remain zero.

### Evidence

- Current mobile workspace: `sq1--post-onboarding-workspace__iphone-390.png`
- Current Android workspace: `sq1--post-onboarding-workspace__android-360.png`
- Current 430px workspace: `sq1--post-onboarding-workspace__iphone-430.png`
- 390px group interaction: `group-sizing-fit--open__iphone-390.png`
- Computed visibility probe: `mobile-navigator-regression.json`
- Source snapshots: `tab-navigator.tsx`, `project-workspace.tsx`

The finding is distinct from the prior QA #62 flat-tab-wall issue: #62’s old flat strip was replaced, but the replacement mobile navigator is currently mounted inside that strip’s hidden parent. This report is addressed to REVIEWER; the Coder should not act on it directly until triage and routing.
