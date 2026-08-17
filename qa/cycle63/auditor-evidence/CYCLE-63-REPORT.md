# QA Cycle 63 — unique-state navigation verification

## Scope

This cycle started from Sq1 with clean first-use browser contexts against `https://stitch-and-scale-pro-api-server.vercel.app`, using the latest main head `7e4d834a` and the user’s Android-class baseline of 360 CSS pixels, plus 390px, 430px, tablet 768px, and desktop 1280px. The supplied crawler prompt, app-layout-perfection standard, and repository playbook were reloaded before testing.

The focused route regression pass produced 85 named screenshots, zero navigation/screenshot errors, and zero browser console/page errors. The latest CHK-126 change was not a regression on the tested onboarding/route surfaces: clean landing/demo entry remains usable, and the route shells load without the prior overlay behavior reported in the commit notes.

## Unique project-tab verification

The project registry contains **79 role-tab entries**. This cycle used a real-pointer crawl across the desktop horizontal scroller rather than counting DOM entries as coverage. It reached **32 unique panels**:

`Submissions`, `Lookbook`, `Spec Sheet`, `Distribution`, `Listing SEO`, `Ad Break-Even`, `Sample & Launch`, `Collab Deal Math`, `Photo ROI`, `Video & Social`, `Show ROI`, `Membership Lab`, `Release Timing Lab`, `Booth Lab`, `Channel Lab`, `Workshop Lab`, `Re-Price Lab`, `Bundle Lab`, `Retreat Lab`, `Podcast Lab`, `Magazine Lab`, `Price Psych Lab`, `Yarn Licensing Lab`, `Gift & Credit Lab`, `Wholesale List Lab`, `Intl Pricing Lab`, `Test Knit Lab`, `Gauge & Fit`, `Receipt Lab`, `Design Ledger`, `Brag Cards`, and `Payback Lab`.

**47 tabs were blocked from real activation** because the current desktop strip’s initial/scroll positions never expose them. This blocked set includes the core `Sections`, `Preview`, and `Yarn` tabs plus 37 additional early workflow tabs and 7 late lab tabs. The crawler records the blocked labels explicitly in `reachable-tabs-manifest.json`; it does not count them as verified panel coverage.

## Open finding #64 — mobile navigator

At 360px, 390px, and 430px, `data-testid="tab-navigator-trigger"` still has accessible name `Open grouped list of all 79 workspace labs` but a `0×0` rectangle. Its ancestor chain still includes `hidden lg:flex` with computed `display:none`. The six visible group chips open only the first lab in each group; the complete mobile lab list remains unreachable. This is a follow-up to #64, not a duplicate.

## Open finding #65 — desktop strip alignment

At 1280px, the desktop strip still measures approximately `scrollWidth=4678`, `clientWidth=1214`, and initial `scrollLeft=0`. `Sections`, `Preview`, and `Yarn` remain outside the strip’s visible rectangle at the initial position. The visible strip begins at the clipped tail of `Submissions`. The centered-overflow defect remains reproducible after CHK-126. This is a follow-up to #65, not a duplicate.

## Evidence and limits

Evidence includes the full 79-entry inventory, the 32 reached panel screenshots, the 47 blocked labels, the mobile navigator computed-visibility probe, and the desktop start/middle/end strip screenshots. The open navigation defects are also the reason a genuinely exhaustive panel crawl cannot honestly be claimed yet. The next verification gate is structural: fix or expose the navigation surfaces, then re-run all 79 entries and require the active panel label to change for each one before counting a panel as covered.

No application code, `main`, or the protected RC repository was modified by this auditor.

This report is addressed to REVIEWER. The Coder should not act on it directly — please triage and decide on closure or routing.
