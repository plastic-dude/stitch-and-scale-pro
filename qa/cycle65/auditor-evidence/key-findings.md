# Cycle 65 key findings to date

## External baseline

Live deployment: https://stitch-and-scale-pro-api-server.vercel.app
Repository: https://github.com/plastic-dude/stitch-and-scale-pro
Latest main under test: `6db5aa11004092965d35094df60ca3f95f434a25` (`CHK-129` cycle log), preceded by `9404ccf1fe56f72cee47cfb2af0f8f37ea2935c7` (shell header nav touch-target fix). The 25-minute schedule remains active: task `etuJjiLGr9kDYCvoQEHs8b`, interval `1500` seconds.

CHK-129 guidance from the repository’s latest leader note says: all four shell header triggers should be at least 44×44px; the 79/79 desktop tab finding from Cycle 63 is stale at HEAD; All Labs should expose 80 dialog buttons (79 labs plus Close); next QA focus is every icon-only interactive at 360px and header regression at 640–767px.

## Cycle 65 results

The focused clean-start crawl at Android 360, iPhone 390, iPhone 430, tablet 768, and desktop 1280 captured 85 screenshots with 0 crawl errors and 0 console/page errors.

The Cycle 65 header sweep at 360, 390, 430, 640, 767, 768, and 1280 found no header overlaps. At 360/390/430, Projects, Portfolio, Settings each measure 44×44 and New Project 48×44. The previous Cycle 64 issue #66 (36×36 shell targets) is fixed by CHK-129.

The Cycle 65 mobile/tablet navigator probe from clean deep-link contexts continues to show All Labs at 328×44, 358×44, 398×44, and 704×44, with correct visibility and no hidden TabsList ancestry.

The Cycle 65 desktop strip probe at 1280 shows scrollWidth 8143, clientWidth 1214, scrollLeft 0, and Sections/Preview/Yarn fully visible at the start. Payback Lab is visible at the far end after scrolling. No console errors were reported.

The icon-only sweep at 360px found three section-delete controls at 36×36 (`Delete section Body`, `Delete section Sleeve`, `Delete section Neckline`) and four Brag Cards accent controls below 44px: Rose ~35.2×35.2, Honey 32×32, Moss 32×32, Denim 32×32. The All Labs sheet Close control measured 16×16 but real pointer activation closed the sheet. The sweep itself had 0 errors and 0 console/page errors.

The persistence probe at 390px created `Cycle 65 Persistence Test`, saved a Body section, and after page reload confirmed both title and Body section persisted. The clean 360px 404 route showed the friendly “Oh, we dropped a stitch…” error state, with no onboarding overlay and 0 errors.

## Routing status

No new issue has been opened yet in Cycle 65. Existing #66 and duplicate #67 are closed and are not to be reopened. Candidate new findings requiring confirmation and Reviewer routing are the under-44 section-delete controls, under-44 Brag Cards accent selectors, and the 16×16 All Labs close button. They may be grouped as a responsive touch-target family only if reproduction and evidence justify a single user-facing defect; otherwise keep them separate and avoid duplicates.

## Visual verification notes

The screenshot `touch-confirm--delete-body-after-pointer__android-360.png` confirms that the 36×36 `Delete section Body` control is a real, reachable action: a pointer click opens a visible confirmation sheet titled `Delete "Body"?` with `Delete Section` and `Keep It`. The section remained visible because the destructive confirmation was intentionally not submitted. This is a touch-target-size finding, not a dead-control finding.

The screenshot `touch-confirm--brag-card-accent-honey__android-360.png` still shows the All Labs sheet rather than the Brag Cards panel after the attempted activation. Because this state did not prove active-panel identity, the Brag Cards controls are treated as measured but not fully verified as activated in that particular run. The dedicated lab-network probe separately confirmed Brag Cards active with no bad network responses; any new issue should rely on only states with valid active-panel identity and real pointer activation.

The exact-dialog diagnostic confirms that selecting `Brag Cards` from the All Labs sheet changes the active tab to `Brag Cards` and exposes four accent controls, but leaves the Radix sheet mounted (`dialogAfter=1`) with the selected item highlighted. The screenshot `brag-debug--after-exact-activation__android-360.png` shows the sheet still covering the panel. Therefore, the earlier accent-control activation attempt was not a valid visible-panel interaction. This is a separate possible UX finding: lab selection changes active state while the modal remains open; it requires a deliberate cross-viewport verification before routing.

## Best-practice validation

The official Material bottom-sheet guidance states that a modal bottom sheet blocks interaction with the underlying screen and can be dismissed by tapping a menu item or action, tapping the scrim, swiping down, or using a close affordance: https://m2.material.io/components/sheets-bottom. Cycle 65’s All Labs surface is a modal Sheet with scrim; at 360/390/430/768px, selecting Brag Cards or Payback Lab by real pointer changes the active tab but leaves the dialog mounted and the selected panel under the scrim. This supports a separate MINOR finding that lab selection does not dismiss the blocking navigator surface.

The horizontal-overflow follow-up found a harness/runtime artifact after activating Brag Cards: `window.innerWidth`/`innerHeight` changed to 418×929 at the 360px context, while Playwright context size, `document.documentElement.clientWidth`, `visualViewport.width`, and the screenshot viewport remained 360×800. Base Sections state correctly reported 360×800. Because the real CSS/client viewport did not expand and no page/network errors occurred, the 418px values are not escalated as a layout defect.
