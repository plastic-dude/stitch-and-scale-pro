# QA Cycle 61 — Stitch & Scale follow-up

## Scope

Fresh Sq1 run against `https://stitch-and-scale-pro-api-server.vercel.app` at repository head `3ab557a7` with the relevant changes `CHK-123`, `CHK-124`, and `CHK-125`. Clean contexts were tested at Android 360px, iPhone 390px, iPhone 430px, tablet 768px, and desktop 1280px.

## Verified changes

The clean-profile landing CTA still opens a populated sample project, and the landing capability content remains present without a scroll gesture. CHK-125 also improves desktop discoverability: at 1280px the workflow-chip row is absent and the flat tab strip is visible. The focused crawl produced 85 screenshots, zero navigation/screenshot errors, and zero browser console errors.

## Follow-up on open issue #64

**Issue #64 remains reproducible on mobile.** At 360px, 390px, and 430px, the `All Labs` trigger still has accessible name `Open grouped list of all 79 workspace labs` but a measured rectangle of `0×0` at `(0,0)`. Its ancestor chain still includes the hidden desktop `TabsList` (`hidden lg:flex`, computed `display:none`). The six visible workflow chips remain 44px targets, but they open only the first lab of each group and do not expose the complete lab list. The user cannot reach late labs such as Intl Pricing Lab, Payback Lab, and Brag Cards through normal mobile touch navigation.

The desktop side is improved and should not be regressed: the flat strip is visible at 1280px. The needed correction remains structural separation of the mobile `TabNavigator` from the hidden desktop `TabsList`, followed by a real touch verification at 360/390/430/768px.

## Evidence

- Manifest: `manifest.json`
- Visibility probe: `mobile-navigator-regression.json`
- iPhone workspace: `screenshots/sq1--post-onboarding-workspace__iphone-390.png`
- Desktop workspace: `screenshots/sq1--post-onboarding-workspace__desktop-1280.png`
- Visual notes: `visual-notes.md`

This follow-up is addressed to REVIEWER. It is an update to existing issue #64, not a new duplicate issue. No application code was changed.
