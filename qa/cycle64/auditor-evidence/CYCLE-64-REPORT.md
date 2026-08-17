# QA Cycle 64 — independent auditor report

## Scope and baseline

This cycle began from clean Sq1 browser contexts and tested the live deployment at `https://stitch-and-scale-pro-api-server.vercel.app` against latest main `70f0a94b91f0ad4e0ec5603c59f5f5b77bf5543d`. Before execution, the full-app crawl specification, app-layout-perfection standard, repository playbook, QA handoff SOP, and newer CHK-127/CHK-128 crawler guidance were reviewed. No application code, `main`, or the protected RC repository was modified.

The recurring auditor schedule remains active at a 25-minute interval. The scheduler reports task `etuJjiLGr9kDYCvoQEHs8b` as enabled and active with `intervalSeconds=1500`.

## Coverage

The focused cross-viewport crawl captured **85 screenshots** at Android 360px, iPhone 390px, iPhone 430px, tablet 768px, and desktop 1280px, with zero navigation/screenshot errors and zero console/page errors. It exercised root onboarding, landing and both CTAs, settings, new-project steps, created empty workspace, demo project route, PDF route, and top/middle/bottom scrolling for long routes.

The real-pointer desktop workspace crawl captured **all 79 project tabs** at 1280px. Every tab produced an active-panel identity matching the requested tab label: `inventoryCount=79`, `reachedCount=79`, `identityMismatch=0`, `errors=0`, and `consoleErrors=0`. Each state has a named screenshot in the evidence branch.

The 390px deep-state pass additionally covered landing scroll positions, seeded demo workspace, inline Add New Section form, project-list state, Portfolio catalogue scroll positions, Settings scroll positions and backup actions, and new-project empty state. A precise follow-up confirmed the actual `Download Backup` download and `Upload File` control, with no console/page errors. The All Labs sheet exposes 80 buttons: one Close button plus 79 distinct lab buttons, and real activation of Payback Lab changes the active panel identity.

## Fix verification: #64 / CHK-127

Issue #64 is verified fixed on commit `70f0a94b` across separate clean deep-link contexts at 360px, 390px, 430px, and 768px. Each context opened `/project/mss5osqd88j6fdyvtdu`, showed the onboarding overlay once, and after `Skip setup` remained on the same deep link. The `All Labs` trigger measured 328×44, 358×44, 398×44, and 704×44 respectively. The sheet opened successfully in all four contexts, exposing 79 distinct lab buttons, and Payback Lab activation produced the active tab identity `Payback Lab`.

The related onboarding route behavior is also correct: a plain root clean entry still falls back to `/project/new`, while a deep-link clean entry preserves `/project/mss5osqd88j6fdyvtdu`. The shell header remains collision-free with the skip control visible during onboarding.

## Fix verification: #65 / CHK-128

Issue #65 is verified fixed on commit `70f0a94b` at both 1280×900 and 1024×900. The desktop strip reports `justifyContent=flex-start`, `scrollLeft=0`, and 79 tabs. At initial position, Sections, Preview, and Yarn are fully visible with positive x coordinates. Sections activates without prior horizontal scrolling. Scrolling to the far end makes Payback Lab visible and clickable. The 1280px regression geometry measured `scrollWidth≈8143`, `clientWidth≈1214`; the 1024px geometry measured `scrollWidth≈8143`, `clientWidth≈958`. No console/page errors occurred.

## New verified finding — mobile shell touch targets

The mobile shell’s icon-only Projects, Portfolio, and Settings controls measure **36×36 CSS pixels** at 360px, 390px, and 430px. Each control was activated successfully by a real pointer in a separate clean context, so this is not a dead-control report; it is a verified effective hit-target shortfall against the supplied 44×44px minimum. The visible post-onboarding Settings screenshot confirms these are the actual shell controls, not hidden overlay geometry. This is distinct from #64’s hidden All Labs navigator and #65’s desktop strip alignment.

This finding is routed as a new **MINOR** Reviewer issue. The acceptance test is to provide at least 44×44px effective hit rectangles for the three mobile shell destinations at 360/390/430px, preserve their current routes, keep adjacent targets separated, and confirm no header collision with Skip setup in a fresh deep-link context.

## Backup-state result and duplicate suppression

`Download Backup` successfully produced `stitch-and-scale-export-2026-08-17.json`, and the manifest confirmed an `Upload File` input is present. After the successful download, Storage Health still displayed `Never backed up`. This reproduces the existing LIVE-006/LIVE-007 verification observation recorded in the latest leader guidance. It is not escalated as a new issue because its semantics remain unconfirmed rather than demonstrably incorrect; the result is preserved as a verification note for Reviewer.

The previously open #64 and #65 reports are now closed by Reviewer and were not reopened. Separate fresh verification comments are added to those closed issues. No duplicate was opened for the backup-status observation, prior landing CTA, first-paint, flat-navigation, or prior desktop-strip findings.

## Evidence

The evidence branch contains the focused manifest, 79-tab active-panel manifest, All Labs and desktop acceptance JSON, shell-touch-target measurements, inline-form and backup-flow results, deep-state manifest, visual notes, complete tab screenshots, and representative mobile/tablet/desktop regression screenshots. The branch contains evidence only and no application-code changes.

This report is addressed to the Reviewer. The Coder should not act on it directly — please triage and decide on closure or routing.
