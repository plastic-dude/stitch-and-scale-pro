# CHK-229 — Full-document preview and grading-matrix continuity

**Date:** 2026-08-23  
**Author:** Manus AI  
**Status:** Code released to `main`; exact production deployment READY and active alias verified  
**Code commit:** `71fd40ad2cda939f4dba5044d1989394b379f406`  
**Vercel production deployment:** `dpl_E7TJ3prEXCQAqZoF4fiXbdgYBoXP`  
**Active origin:** `https://stitch-and-scale-pro-api-server.vercel.app`  
**Active entry asset:** `/assets/index-DOZ4qaww.js`

## Direct answer to the screenshot findings

The reported lower-content problem was a genuine **in-app preview crop**, not evidence that the generated export omitted the lower sections. Before this release, the Project PDF screen placed a fixed 794 × 1123 iframe inside an `overflow-hidden` paper frame and set the visible container to one scaled page. The counter showed an estimated page count, but it did not provide page navigation or a way to reach the later rendered pages. The generated HTML and the print handoff were separate from that first-page React viewport.

The preview now reads the same-origin `srcDoc` after load, measures the complete document root/body height, resizes the iframe to that full height, and scales the complete document to the paper width. A localized status says the preview is the full document, and a localized hint explains that the user can scroll through it. On the seeded five-page production fixture, the embedded document measured 2,815px and the iframe CSS height matched 2,815px at every audited width. The final rendered page ended at the same document boundary, so the previous fixed one-page crop is no longer present.

The AI Grading Assistant is **not a live autonomous AI grader or embedded chat**. It runs the deterministic local grading contract, prepares a read-only text brief, and lets the user copy that brief. The brief instructs a downstream tutor to use only supplied facts, avoid recalculation and fit diagnosis, ask before suggesting project changes, and remain suitable for a young learner. It sends no request, delivers no data, makes no automatic project change, and does not claim garment fit. The card was retained because it is valuable, but moved after the main grading table so the central production-control workflow appears first.

The apparent 4XL/5XL loss had two distinct causes. In the live app, all nine sizes were present inside an intentional horizontal scroll region; later columns were simply beyond a narrow viewport, with no strong continuation explanation. In the generated PDF renderer, the full ten-column matrix was previously composed under a global portrait-letter rule without a dedicated wide-table strategy, creating a real risk of compressed or clipped late columns. This release preserves the live horizontal table, adds a named keyboard-focusable region, shows a localized continuation cue, keeps the measurement column sticky while scrolling, and retains all nine size columns. The renderer now marks grading pages as landscape, allocates fixed table columns, repeats table headings, and avoids splitting grading rows where practical. XS through 5XL remain in the export source, including 4XL and 5XL.

## Implemented repair

| Surface | Change | Truth and reversibility boundary |
|---|---|---|
| Project PDF preview | Replaced the fixed one-page iframe height with full `srcDoc` measurement and full-document scaling; added localized full-document status and scroll guidance. | This changes only the on-screen inspection viewport. The preview is not represented as the saved PDF itself. |
| PDF renderer | Added a named landscape grading-page rule, explicit grading matrix column allocation, repeated table headers, and row-level fragmentation protection. | Values, source sections, and all sizes are unchanged. The browser still prepares the complete generated HTML for print/save handoff. |
| Project Grading table | Added `role="region"`, keyboard focus, localized `aria-describedby` continuation copy, visible `XS–5XL` cue, sticky measurement header/cells, and print-visible overflow behavior. | Horizontal scrolling remains intentional for dense data; no global body overflow clamp or size removal was introduced. |
| AI Grading Assistant | Moved the optional card below the Human Review card and primary grading output. | The local-only, read-only preparation boundary and five-locale copy remain intact. |
| Localization | Added preview status/hint and grading-table region/hint labels to English, German, French, Spanish, and Portuguese contracts. | No new hard-coded user-facing English was added for these changes. |

## Validation evidence

The focused repair suites passed **5 files / 128 tests**, including the new full-document preview, renderer landscape/all-size, grading scroll-region, localization parity, responsive, and print-handoff contracts. The complete application gate passed **224 files / 2,578 tests**. The application and workspace TypeScript checks passed. The production build passed in **5.33 seconds** with entry bundle `324.10 kB / 101.66 kB gzip`, i18n bundle `208.62 kB / 58.58 kB gzip`, and the repaired PDF route chunk `70.08 kB / 21.05 kB gzip`.

Source-bundle verification passed with archive SHA `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082` across 15 protected files. The protected invention brief remained unchanged at SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`. `git diff --check` passed.

A fresh isolated browser audit against a newly built local preview passed at 320px, 390px, 768px, and 1024px. A second fresh isolated browser audit against the active public alias passed at 320px, 390px, 768px, and 1024px. For the seeded five-page fixture, each active width measured the embedded document at 2,815px, iframe CSS height at 2,815px, and the last page bottom at 2,815px. The grading region exposed `MEASUREMENT`, `XS`, `S`, `M`, `L`, `XL`, `2XL`, `3XL`, `4XL`, and `5XL`; at 390px its scroll width was 1,051px against a 356px client width, proving the continuation is intentional and reachable rather than missing.

The active alias serves the matching entry asset `/assets/index-DOZ4qaww.js`. Root, canonical workspace, grading, and PDF routes returned HTTP 200. The exact Vercel production deployment progressed `QUEUED → BUILDING → READY` for GitHub `main` at the exact code SHA above. The active MCP boundary remains intact: allowed-origin `OPTIONS /api/mcp` returned 204 with `POST, OPTIONS` and `Authorization, Content-Type, MCP-Protocol-Version`; forbidden-origin preflight returned 403. No connectors or schedules were modified.

## Export truth boundary

`openPrintWindow` still prepares the complete generated HTML for the browser’s print dialog; it does not screenshot the visible React preview. This release therefore claims that the complete document is inspectable in-app and that the full generated source retains all grading sizes. It does **not** claim that a browser print dialog was durably saved, downloaded, or delivered to another system. The renderer’s landscape strategy is tested at source-HTML level and through the live grading route; PDF byte-level output remains dependent on the user’s browser print engine and chosen paper/printer settings.

## Residual risks and deferred work

The supplied screenshots were not reopened, per the explicit task restriction; all conclusions were reproduced from source, generated HTML, DOM geometry, and active-alias browser audits. The preview currently measures same-origin `srcDoc` content, which is supported by its `sandbox="allow-same-origin"` arrangement; future changes to sandboxing or cross-origin preview architecture would require revisiting that contract. Very narrow widths below 320px and custom-domain-specific browser-origin behavior remain outside this release’s active smoke matrix. Print engines can still apply user-selected scaling, margins, or paper sizes differently, so the product should continue to describe print as browser preparation rather than durable delivery. The renderer does not yet provide interactive page navigation inside the preview; full-document vertical inspection is the chosen reversible repair. Project Book photo pages, cross-project gallery indexing, social sharing, cloud sync, and gamification remain deferred.

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/break-inside/ — MDN, `break-inside` and generated-page fragmentation.

[2]: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/page-break-inside/ — MDN, legacy `page-break-inside` compatibility alias.
