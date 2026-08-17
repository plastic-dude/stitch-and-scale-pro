# QA Cycle 62 — exhaustive project navigation audit

## Scope and method

This cycle began from a clean first-use context and crawled the live Stitch & Scale app at the user’s Android-class baseline of 360 CSS pixels, plus 390px, 430px, tablet 768px, and desktop 1280px viewpoints. The state-driven crawler inventory discovered **79 project tabs**. A dedicated event-driven traversal then exercised the full desktop tab registry and recorded a named state for each tab, with zero tab-activation exceptions and zero browser console/page errors in that traversal.

The mobile run also reconfirmed the open mobile navigator issue #64. The desktop run surfaced a separate defect that the prior focused runs missed.

## New finding

**Severity: MAJOR — desktop project workspace opens with core tabs offscreen because the 79-tab strip is centered inside its horizontal scroller.**

At 1280px, the project workspace’s flat tab strip is a 4,678px-wide content row inside a 1,214px client viewport. The strip’s computed class includes `justify-center`. On the initial state with `scrollLeft=0`, the core tabs **Sections**, **Preview**, and **Yarn** have negative x coordinates and no intersection with the visible strip. The visible strip begins partway through the workflow at the tail of **Submissions**, followed by **Lookbook**, **Spec Sheet**, **Distribution**, **Listing SEO**, **Ad Break-Even**, **Sample & Launch**, **Collab Deal Math**, **Photo ROI**, **Video & Social**, and **Show ROI**. The end of the strip is similarly not naturally discoverable; **Payback Lab** only enters view after scrolling to the end.

This is not merely a long-tab IA concern. It is an initial-scroll-position defect: the first screen does not expose the workspace’s core entry points and visually begins with a clipped label. A desktop user who lands on the workspace can reasonably believe the first tabs are missing or that the screen opened in the middle of a previous scroll position.

## Reproduction

1. Open the live URL in a clean desktop browser at 1280×900.
2. Choose **Skip setup**.
3. Open the sample project workspace.
4. Inspect the horizontal tab strip without touching it.
5. Observe that the strip starts with the clipped tail of **Submissions**; **Sections**, **Preview**, and **Yarn** are not visible.
6. Inspect the scroller geometry: `scrollWidth≈4678`, `clientWidth≈1214`, initial `scrollLeft=0`; the first three core tabs have no visible intersection with the strip.
7. Scroll manually to the far end and observe that a late tab such as **Payback Lab** becomes visible only there.

## Actual versus expected

**Actual:** the tab content is centered inside a horizontally scrollable `TabsList`; the start position does not begin with the first registered tab. The initial strip therefore omits core navigation and begins mid-registry.

**Expected:** the strip’s natural start position should show the first core tabs, especially Sections and Preview, with the row aligned to the start of the scroll container. Late tabs can remain horizontally scrollable or be exposed through the grouped Labs navigator, but the initial position must never hide the first navigation choices.

## Source anchor

At latest main head `3ab557a`, `artifacts/stitch-and-scale/src/pages/project-workspace.tsx` lines 1032–1033 mount the desktop `<TabsList>` with `hidden lg:flex lg:flex-nowrap ... overflow-x-auto`; the live primitive’s computed class includes `justify-center`. CHK-125 correctly hides the mobile group-chip row on desktop, but the centered overflow remains in the desktop surface.

## Acceptance test

At 1280×900 and a second desktop width such as 1024×900, load a clean sample project and verify that the initial tab strip has `scrollLeft=0`, the first registered core tabs have visible bounding boxes intersecting the strip, and no label is clipped at the left edge. Sections and Preview must be directly pointer-clickable without first swiping or manually recovering horizontal position. A complete 79-tab registry check must still pass, and manual scrolling must reach the final tab without horizontal layout breakage. At mobile/tablet widths, preserve the separate grouped navigator behavior and do not reintroduce the old flat-strip wall.

## Evidence

- Initial desktop strip: `desktop-tab-strip--start__desktop-1280.png`
- Middle position: `desktop-tab-strip--middle__desktop-1280.png`
- End position: `desktop-tab-strip--end__desktop-1280.png`
- Geometry probe: `desktop-strip-regression.json`
- Full tab inventory: `tab-inventory.json`
- Exhaustive tab manifest: `exhaustive-tabs-manifest.json`
- Visual notes: `desktop-strip-notes.md`

This report is addressed to REVIEWER. The Coder should not act on it directly — please triage and decide on closure or routing. It is distinct from #64: #64 covers the hidden mobile All Labs navigator, while this report covers the desktop strip’s incorrect initial horizontal alignment. No application code was changed.
