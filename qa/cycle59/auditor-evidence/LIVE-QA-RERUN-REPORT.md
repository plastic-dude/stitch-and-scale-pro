# Stitch & Scale — Live Real-User QA Rerun

**Scope:** Read-only black-box QA of `https://stitch-and-scale-pro-api-server.vercel.app` with no repository edits.  
**Viewpoints:** Android 360px, iPhone 390px, iPhone 430px, tablet 768px, desktop 1280px, plus three interactive browser-session captures of populated New Project states.  
**Evidence:** 481 screenshots, a machine-readable manifest, crawl logs, and source manifests.

## Executive result

The live app is reachable and supports a complete first-use path: onboarding can be skipped, a sample workspace opens, a new pattern can be created through the three-step wizard, and the resulting project persists into a workspace with an explicit empty state. The screenshot package deliberately includes both public and authenticated-free local-first surfaces, deep routes, scroll positions, and the long project-tab surface.

The most important reviewer issues remain product-flow and mobile-usability risks rather than build failures. The public landing page advertises a live demo, but the fixed demo deep link can land a clean user on “Project Not Found.” The project workspace presents a very large flat tab surface; at mobile and tablet widths, some controls are difficult for automation to bring into view and activate because of the nested horizontal navigation. That behavior is itself evidence that the navigation is not sufficiently touch- and discovery-friendly for the stated Android/iOS audience.

## Reviewer issues

| ID | Severity | Issue | Evidence / reviewer action |
|---|---|---|---|
| LIVE-001 | **Critical** | Landing-page primary demo CTAs can resolve to a missing local project in a clean profile. | Open the landing CTA in a fresh context and verify that it reaches a populated demo, not “Project Not Found.” Review `demo-deep-link--project-not-found` screenshots across mobile widths. |
| LIVE-002 | **High** | Project workspace navigation is a 79-item flat tab wall, with many specialist tools competing with core workflow tabs. | Review the project-tab screenshot series. Group tools by workflow, keep only a small core set visible, and provide a clear More/Tools entry point with a one-tap return to Sections or Preview. |
| LIVE-003 | **High** | Project tabs are difficult to reach at tablet/mobile widths because the tab list is horizontally scrollable and the controls can sit outside the viewport or be intercepted by content. | Review tablet crawl errors and mobile tab screenshots. Test with real touch swipes at 360/390/430/768 widths rather than relying on programmatic clicks. |
| LIVE-004 | **High** | The tab triggers are visually compact and should be verified against a 44×44px touch target minimum. | Measure actual hit areas at each mobile width and increase the effective hit area without making the visible label wall denser. |
| LIVE-005 | **Medium** | The landing page capability area can appear sparse or blank in a full-page screenshot until scroll-triggered content enters the viewport. | Compare `landing--top` / full-page captures with `landing--scrolled-middle`; verify whether this is intended reveal animation or a user-visible loading/animation gap on slower devices. |
| LIVE-006 | **Medium** | The first-use and newly-created-project empty states are meaningful and reachable, but the “Add First Section” path should be tested through to section creation and persistence. | Review `workspace--new-project--empty-sections__desktop-browser.webp`; create a section, reload, and confirm it remains present. |
| LIVE-007 | **Verification** | Backup and local-storage status should be checked after creating a real project and exporting; status wording must clearly distinguish local export from cloud backup. | Repeat Settings export with the new project and verify the status changes or explains why it remains “Never backed up.” |

## Real-user workflows exercised

The rerun did not stop at route discovery. In a clean live browser session, onboarding was loaded and skipped; the generated sample project was opened; the New Project wizard was completed with a realistic pattern name, designer name, base size, and blocked gauge; the new project opened with a “No Sections Yet” empty state; public landing, portfolio, Settings, new-project, sample workspace, grading, PDF, and the project-tab surface were crawled; and top, middle, and bottom scroll positions were captured for long pages.

The populated New Project steps were also captured from an interactive browser session and added to the evidence package. Those captures show Project Details with entered values, Base Size selection, and Blocked Gauge configuration. No code was edited and no repository state was changed.

## Capture coverage

| Viewpoint | Evidence count | Coverage |
|---|---:|---|
| Android 360px | 115 | Public routes, onboarding, dashboard/workspace, deep routes, scroll states, and project tabs. |
| iPhone 390px | 115 | Public routes, onboarding, dashboard/workspace, deep routes, scroll states, and project tabs. |
| iPhone 430px | 115 | Public routes, onboarding, dashboard/workspace, deep routes, scroll states, and project tabs. |
| Tablet 768px | 75 | Public routes, onboarding, deep routes, workspace states, and partial tab series; difficult tab activations are recorded rather than hidden. |
| Desktop 1280px | 57 | Project workspace states and deep feature-tab series, plus public/deep routes captured in the separate desktop route pass. |
| Interactive browser session | 4 | Populated New Project steps and the newly created empty workspace. |

## Recommended reviewer order

First validate LIVE-001 in a fresh context because it is a conversion-blocking defect. Next review the 360/390/430 screenshots as a mobile user and decide the core-versus-secondary project navigation model before polishing individual lab screens. Then repeat the New Project workflow through section creation and reload persistence. Finally, run the full screenshot crawler again after fixes, using touch gestures and stable-DOM waits so animation and nested-scroll behavior are represented accurately.

## Package contents

`FINAL-MANIFEST.md` is the human-readable index. `FINAL-MANIFEST.json` is the machine-readable inventory. The `screenshots/` directory contains the evidence images. `tabs-wide-manifest.json`, `tablet-tab-manifest.json`, and `routes-desktop-manifest.json` preserve crawl-level records and failed interaction details. `visual-validation-notes.md` records representative visual inspection notes.
