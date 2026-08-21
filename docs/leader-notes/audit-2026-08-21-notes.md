# Stitch & Scale audit notes

Target: https://stitch-and-scale-pro-api-server.vercel.app/

Audit scope: mobile-like layout, functionality, resilience, flaws, capability, strength, tone, and stress behavior.

## Baseline

The app loads successfully at the root URL with page title “Stitch & Scale”. The initial state shows an onboarding screen titled “Welcome to Stitch & Scale” and describes the product as “Professional knitwear grading software — built for designers who care about the details.” It claims local-first saving, offline full functionality, user-owned/exportable data, and publish-ready PDF exports with four professional templates. It also says cloud sync is optional and no account is required.

Visible initial controls include Skip setup, Begin, navigation links for Projects, Portfolio, Settings, and New Project, a Local only status, Dismiss, Draft a New Pattern, Import from a Spreadsheet, and a restore-from-.json option. The app displays a Local Storage Notice warning that clearing browser data will delete projects and recommending backup.

Initial concerns to test:

1. The onboarding and main application appear simultaneously in the extracted structure, which may be intentional but could create confusing state or accessibility ordering.
2. “Works offline — full functionality” and “publish-ready PDF exports” are strong claims requiring direct verification.
3. “Cloud sync is on the way” creates a future promise and may weaken trust if the app is presented as fully professional now.
4. The local-only warning is honest but potentially high-friction for professional users handling valuable work.
5. The product is positioned as premium/professional, so the audit must test whether the actual workflow meets that promise rather than only whether the page looks polished.

Date: 2026-08-21

## Onboarding journey findings

Clicking through the initial setup advances through these screens without visible error:

1. “Built on principles” presents four commitments: Local First, Optional Cloud Sync, Your Data, and Transparent Math. It says measurements belong to the user, JSON export is available, and there are no hidden AI decisions.
2. “Sizing Standard” defaults to Craft Yarn Council (CYC) and offers Custom Standard plus “Show 6 more standards.”
3. “Measurement units” offers inches and centimeters, with inches selected by default.
4. “How it works” compresses the product into five concepts: Dashboard, Sections, Measurements, Preview, and Export.
5. “See it in action” offers a Classic Crew Neck Sweater sample with 3 sections, 8 measurements, Size M base, and gauge of 20 stitches / 28 rows per 4 in worsted weight. Choices are Open Sample Project or Create My Own.

Strengths observed: clear progressive explanation, strong product principles, sample-first onboarding, and a coherent five-step mental model.

Weaknesses or risks observed: the onboarding is relatively long before users can reach their own project; unit copy says “inches Used in US / Canada” and “cm Used internationally,” which is serviceable but overly broad; “Transparent Math” is a strong trust claim that must be confirmed in the actual grading and export views; and the sample-first path may be the only way for a new user to understand value quickly.

The visible layout in the browser is a narrow centered content column with generous vertical spacing and large bottom navigation controls. It resembles a mobile-oriented layout even though the browser viewport used for this audit was 895×768; an actual device-emulation viewport still needs to be checked if available.

Date: 2026-08-21

## Sample project workspace

Opening the sample creates a project at `/project/sample-crew-neck-sweater` and shows `Local only` plus `Saved` in the header. The project is titled “Classic Crew Neck Sweater,” base size M, with gauge 20 stitches × 28 rows / 4 in. Visible primary actions include Full Grading Table and Export PDF.

The workspace exposes a very large tab surface. Core tabs include Sections, Preview, Yarn, Notes, Income, Draft, Pricing, Publish, Test Knit, Tech Edit, Finish, Deals, Launch, Trunk Show, Trans & Bundle, Pattern Club, Kits, Pipeline, KAL & Collab, Channels, Club Rev, Wholesale & Book, Hire vs Self, Inclusive, Licence It, Members, Promo, PriceWin, Repeat, Mix, Collab, Book It, Protect, Teach, Partners, Yarn Buy, KAL Planner, Grading Lab, Chart Lab, Test Knit Desk, Submissions, Lookbook, Spec Sheet, Distribution, Listing SEO, Ad Break-Even, Sample & Launch, Collab Deal Math, Photo ROI, Video & Social, Show ROI, Wholesale Lab, Pre-Order Lab, Listing Test Lab, Yarn Pool Lab, Membership Lab, Release Timing Lab, Booth Lab, Channel Lab, Workshop Lab, Re-Price Lab, Bundle Lab, Retreat Lab, Podcast Lab, Magazine Lab, Price Psych Lab, POD Patterns Lab, Take-Rate Lab, Box Inclusion Lab, Yarn Licensing Lab, Gift & Credit Lab, Wholesale Price List Lab, Intl Pricing Lab, Test Knit Lab, Gauge & Fit, Receipt Lab, Design Ledger, Brag Cards, Payback Lab.

The sections view shows Body (3 measurements), Sleeve (3 measurements), and Neckline (2 measurements), each with a delete control, plus Add New Section.

Major audit concern: the product’s visible capability surface is much larger than the five-concept onboarding story. This may signal a powerful product, but it may also create severe cognitive overload, navigation friction, shallow or unfinished features, and unclear prioritization. The remainder of the audit should test depth and reliability rather than count tabs.

Date: 2026-08-21

## Grading table and PDF export findings

Full Grading Table loads successfully at `/project/sample-crew-neck-sweater/grading` with Copy TSV, CSV, and Print Sheet controls. It presents nine sizes (XS through 5XL) and the Body, Sleeve, and Neckline sections. On the visible narrow layout, the table is horizontally scrollable; the screenshot shows only part of the nine-size table at once, with 2XL–5XL offscreen. This is workable for power users but high-friction on a phone because measurement names and size columns compete for space and the horizontal scrollbar is subtle.

The extracted content exposes a serious readability/data-presentation issue: values are concatenated in the text layer, for example `152 stsexact: 15030.00 in`, rather than clearly separated into stitch count, exact count, row count, and inches. The visual table is more structured than the text extraction suggests, but the rendered cells are very dense and small. This must be checked with actual users and screen readers; the current format risks ambiguity when a designer needs to verify a number quickly.

The PDF Export screen loads successfully and offers four templates: Minimal, Luxury, Craft / Cozy, and Technical / Blueprint. It offers logo upload, toggles for Cover Page, Gauge Summary, and Pattern Notes, a remembered filename, and a live six-page preview. The preview looks polished at first glance and supports the “professional export” promise. The export process itself says a print dialog will open and the user must choose “Save as PDF,” which is a manual browser-dependent step rather than an automatic download.

Potential export risks to test: whether all four templates actually change output; whether toggle state changes the page count and content; whether filename sanitization works; whether logo upload is constrained and previewed correctly; whether print output preserves page breaks, tables, colors, and fonts; and whether mobile browsers can complete the print/save flow.

Date: 2026-08-21

## Export interaction findings

Selecting Technical / Blueprint visibly changes the live preview from a minimalist cover to a blueprint-grid style with technical typography. The template choice is therefore functional rather than decorative.

Toggling Gauge Summary changed the live preview page count from 6 pages to 5 pages, indicating that the export configuration is connected to the preview state. The switch controls are visually small and the label/control relationship is not especially obvious in the narrow left column; this should be checked for touch accessibility and screen-reader labeling.

Date: 2026-08-21

## Filename and export stress findings

The export filename input accepted `../../audit test <>:` without visible validation or sanitization. The field displayed the raw path-like and special characters, and the page title changed to the same string after export was invoked. This is not proof of a security vulnerability because the export is client-side and the browser may sanitize the final download name, but it is a clear robustness and trust issue. The UI should normalize filenames to a safe basename, remove path separators and unsupported characters, prevent empty names, and show the final filename that will be used.

After invoking Export PDF, the interface changed to “Preparing your PDF…” and remained in that state during the follow-up inspection; no visible print dialog appeared in the browser session. This may be because the sandbox cannot expose the native print dialog, but the app should provide an explicit completion/error state and a fallback if `window.print()` is blocked or fails. A browser-dependent print dialog is a fragile export path, especially on mobile.

Date: 2026-08-21

## HTTP baseline and route audit

Low-impact requests to `/`, `/portfolio`, `/settings`, `/project/new`, the sample project, grading, PDF export, and a nonexistent route all returned HTTP 200 with the same 3,833-byte SPA shell. This is normal for client-side routing on a single-page app, but it means the server does not provide a meaningful HTTP 404 for an invalid route; the client must handle unknown paths correctly.

The root response returned HTTP/2, `server: Vercel`, HSTS, `access-control-allow-origin: *`, `cache-control: public, max-age=0, must-revalidate`, and `x-vercel-cache: HIT`. The wildcard CORS header is broader than necessary for a local-first application and should be reviewed if any API or future cloud-sync endpoints share the same origin or headers. The audit did not attempt credentialed or destructive API requests.

An empty POST to the root returned HTTP 405, which is a reasonable method rejection. OPTIONS returned HTTP 204 without an `access-control-allow-origin` header in the observed response, which may matter if future browser API calls rely on preflight behavior.

The route responses were fast in this low-volume test, generally around 0.14–0.23 seconds, but this is not a load test and does not establish production capacity.

Date: 2026-08-21

## Actual mobile-like capture: 390×844 root

Headless Chromium captured the root at 390×844. The app presents a mobile-oriented onboarding layout, but the PWA install prompt occupies the top area and visually competes with the product introduction. The prompt contains “Install Stitch & Scale,” an Install button, and a close icon; it appears before the user has understood the product.

The main heading wraps to two lines, which is acceptable, but the bottom sticky navigation bar overlaps the lower content area: the commitments card continues below the visible fold and is partly obscured by the fixed bottom bar. The sticky bar contains Back and Begin, with Begin prominent. This is a mobile usability issue because users may not know content is hidden behind the footer or may need extra scrolling to read the full promise.

The mobile root is visually attractive and focused, but it spends above-the-fold space on install promotion and onboarding chrome rather than demonstrating the product. The claims “Works offline — full functionality” and “no account needed” are highly visible and therefore need to survive real offline testing.

Capture source: locally generated screenshot of https://stitch-and-scale-pro-api-server.vercel.app/ at 390×844, 2026-08-21.

## Mobile deep-link finding

The headless capture of `/project/sample-crew-neck-sweater` at 390×844 rendered the same onboarding screen as the root because this clean browser profile had no onboarding/local-storage state. The route did not visibly honor the deep link for a first-time user. This may be intentional gating, but it creates a discoverability and testability risk: bookmarked or shared project URLs may not open the project unless onboarding state is already established. The app should either explain the gate and preserve the intended destination, or allow a safe read-only/project-entry path.

This also means mobile deep-link behavior cannot be judged solely from the desktop browser session, where onboarding state already existed.

Date: 2026-08-21

## Mobile clean-profile grading failure

The clean-profile capture of `/project/sample-crew-neck-sweater/grading` at 390×844 displayed **Project Not Found** with a Return to Dashboard button. This is a concrete deep-link failure for a first-time or empty-local-storage user. It is more severe than merely showing onboarding: a shared grading URL resolves to a route that cannot find the project in local storage and gives no import, recovery, or explanation.

If the product is intentionally local-only, this behavior must be explicit in the URL/share/export model. A project URL should not imply server availability when the project exists only in the sender’s browser. Consider a portable project file, encoded read-only preview, or an informative recovery state.

Date: 2026-08-21

## Mobile clean-profile PDF failure

The clean-profile capture of `/project/sample-crew-neck-sweater/pdf` at 390×844 also displayed **Project Not Found**. Thus, direct project subroutes for grading and PDF are not self-contained on a fresh device; they depend on local project state. This is a major mismatch if the product’s UX or marketing implies that projects can be shared or opened across devices.

Date: 2026-08-21

## Draft placeholder parser stress

Injected test content into Draft without saving:

- Valid `{Name}` and `{Size.bust}` resolved correctly.
- Missing `{Size.NOPE}` resolved to an em dash, while `{Unknown.token}` remained visible.
- Malformed `{Size.bust` remained visible.
- Repeated `{Size.M.bust.stitch}` resolved consistently to `192` three times.
- `{{Name}}` resolved to `{Classic Crew Neck Sweater}`, producing a surprising single-brace output rather than a clear literal/escaped representation.

This is better than silently fabricating values, but the user-facing behavior is inconsistent: one missing token becomes `—`, another remains raw, malformed syntax remains raw, and there is no visible validation/warning state. For a professional pattern tool, unresolved placeholders should be surfaced in an error panel or highlighted before export, because raw tokens can leak into a published pattern.

Date: 2026-08-21

## Pricing input stress

The Pricing Advisor accepted a negative current price (`-100`), zero hours, and an extreme hourly rate (`999999`) without visible validation or an error state. It displayed a recommended price of `$10.00`, a cost-plus floor of `$0.00`, and “At or above floor” versus current `$0.00`. The displayed comparison normalizes the entered negative price to `$0.00` while leaving the input as `-100`, which is internally inconsistent and could mislead users. Zero hours also makes the cost floor meaningless, while the extreme rate is effectively ignored in the visible recommendation.

This is a high-severity trust issue for a finance-adjacent tool. Inputs should have domain validation, min/max bounds, explanatory errors, and a visibly invalid state; calculations should not silently coerce values into a different number.

Date: 2026-08-21

## Income planner input stress

The Income Planner accepted a negative pattern price (`-5`), zero sales/month, one million design hours, and an hourly rate of `999999` without visible validation. It returned `$0.00` net/month across every platform, `—` sales to recover design time, `$0.00` annualized net, and `0%` effective fees. The visible output suppresses the fact that the input set is invalid and collapses the result to zeros.

This is not an acceptable professional-calculation failure mode. The module needs domain constraints such as positive price, nonnegative sales, reasonable finite hours/rate, and a clear invalid-input state. At minimum, it should distinguish “zero sales” from “invalid price” and avoid presenting a clean-looking financial result when the model was not meaningfully evaluated.

Date: 2026-08-21

## Grading Lab

The sample project’s Grading Lab gives a clear, high-signal result: `Ready`, 9 sizes, smooth ease, 0.0 cm maximum ease drift, and a transparent size-walk table from XS through 5XL. This is one of the strongest modules because it exposes the underlying values instead of only giving a score.

However, the wording `All 9 size(s) grade cleanly` and `No flags — the set grades cleanly` is stronger than the evidence shown: the sample project’s Publish module simultaneously reports two checks needing attention, including an apparent Back Length mismatch and missing hip measurement. Grading correctness and publish readiness may be separate domains, but the product should explain that distinction explicitly to avoid users reading `Ready` as universally ready.

The page also uses the claim `A freelancer would charge $135–$225 at market rates` without identifying the source or methodology inside the module. That is a credibility risk if this number is presented as authoritative.

Date: 2026-08-21

## Chart Lab

Chart Lab is a promising concept with visible repeat arithmetic, symbol controls, row totals, and copyable pattern prose. However, the default state is contradictory: the input `Graded base stitch count` is empty, yet the dashboard reports `Rows balancing the graded count 1/1`, `Max drift 0 st`, and `Verdict Ready`. Lower on the page it correctly says `No graded count to check against` and asks the user to provide one. The top-level Ready state therefore appears to be a false positive caused by treating an empty baseline as valid.

A professional chart checker must not show Ready when its main validation input is missing. The verdict should be `Incomplete` or `Needs input`, and the summary counters should be hidden or marked unavailable until the base stitch count is supplied.

Date: 2026-08-21

## Chart Lab numeric stress

Chart Lab accepted a base stitch count of `0`, repeat count `0`, selvedge-before `-10`, and selvedge-after `999999` without field-level validation. It did not crash. It recalculated to `0 / 1` rows balancing, `999993 st` maximum drift, and a `Review` verdict, with a useful warning naming row 1 and the mismatch.

This is a mixed result. The calculation layer is resilient enough to surface the arithmetic error, but the form layer allows absurd values and leaves the user to discover the problem only after calculation. The UI should reject negative selvedges and zero/empty base counts before they enter the chart model, and should constrain repeat counts to positive integers. The prose generator also emitted `k 999999 times`, which is mathematically traceable but not practically safe for a pattern author.

Date: 2026-08-21

## External benchmark findings

W3C WCAG 2.2 SC 2.5.8 says pointer-input targets should be at least 24×24 CSS pixels or have sufficient spacing, and notes that larger targets are preferable for important controls. This is directly relevant to the app’s extremely dense horizontal lab navigation and small switch controls on mobile.

W3C WCAG 2.2 SC 3.3.1 says that when an input error is detected, the erroneous item must be identified and the error described to the user in text. It also notes that silently changing an out-of-range value still requires informing the user of the change. This benchmarks the app’s silent acceptance/coercion of negative prices, extreme rates, impossible deadlines, and malformed chart inputs as a clear weakness.

OWASP Input Validation guidance recommends allowlist validation and validation at both syntactic and semantic levels, as early as possible, so malformed data does not persist or trigger downstream calculations. That supports treating negative prices, negative selvedges, zero base counts, extreme repeats, and unsafe export filenames as validation defects rather than merely unusual user behavior.

References:
- W3C, Understanding SC 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- W3C, Understanding SC 3.3.1 Error Identification: https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
- OWASP, Input Validation Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html

Date: 2026-08-21

## Core measurement editor validation

The Add Measurement form displayed an inline instruction, `Add a label and a base value to save`, when Save Measurement was attempted with both required fields empty. It did not create a malformed measurement or crash. This is a positive basic guard, but the error is generic rather than field-specific: it does not visibly identify the missing label and missing base-value inputs as separate errors, and it does not appear to provide a programmatic error state. The form exposes many tiny rounding controls and a dense layout that will be difficult on a narrow mobile viewport.

Date: 2026-08-21

The measurement editor accepted and displayed a label containing angle brackets and an ampersand (`<<invalid & label>>`) without visibly executing markup, which is a positive output-encoding signal in this test. However, the numeric base-value field remained empty after the attempted extreme-number fill because the live element index changed; therefore numeric rejection in this editor is not yet established. The form error updated to `Add a base value to save`, identifying the missing requirement at a general form level but not as a field-local error.

Date: 2026-08-21

## HTTP audit results

The low-impact HTTP audit found the main routes and a nonexistent route all return HTTP 200 with the same 3,833-byte SPA shell; `/does-not-exist-audit` is therefore handled by client-side routing rather than returning a server-level 404. This is acceptable for an SPA only if the client renders a clear not-found state; otherwise it weakens monitoring, indexing, and operational diagnostics.

Observed common response headers included `strict-transport-security: max-age=63072000; includeSubDomains; preload`, `access-control-allow-origin: *`, `cache-control: public, max-age=0, must-revalidate`, and Vercel cache headers. A permissive `Access-Control-Allow-Origin: *` is broad and should be reviewed if any future API or sensitive endpoints are added; it is less concerning for a purely local client shell.

`HEAD /` returned 200. `OPTIONS /` returned 204. An empty non-destructive `POST /` returned 405, which is a reasonable method rejection. The main routes were fast in this sample (roughly 0.17–0.19 seconds from the audit environment), but that measures shell delivery rather than client hydration or feature performance.

Date: 2026-08-21

## Confirmed core data-integrity failure

The measurement editor accepted and persisted the label `<<invalid & label>>` with a base value of `-9`. The table rendered the new row as `<<invalid & label>> | circumference | Bust | -9`, the header showed `Saved`, and a toast confirmed the item was added. This is a high-severity domain-validation defect: negative physical measurements can enter the project model and be treated as valid saved data. The earlier output-encoding observation remains positive, but it does not compensate for the missing semantic validation.

Date: 2026-08-21

## Downstream contamination check

After saving the malformed measurement `<<invalid & label>>` with a base value of `-9`, Grading Lab still reported `Ready`, `All 9 size(s) grade cleanly`, `0.0cm` maximum ease drift, and `No flags`. The lab appears to ignore the invalid extra measurement rather than flagging the project as internally inconsistent. This is a serious trust gap: a project can contain visibly impossible saved data while a downstream quality gate still gives a clean verdict. The app needs a project-wide integrity pass and should distinguish `gradeable` from `valid`.

Date: 2026-08-21

## Local persistence and offline architecture check

The app has an active service worker at `/sw.js` and a cache named `sns-shell-v1` containing the root shell, fonts, and many feature bundles. This supports the local/offline claim for the application shell and cached code, although it does not prove that every feature works offline or that a fresh deep-linked project is recoverable offline.

The `stitch-and-scale-v1` local-storage state was 2,847 bytes in the audited profile, and the corrupt `<<invalid & label>>` measurement was still present in serialized state. The invalid data therefore survives in the local-first persistence layer, not merely in transient UI state.

Date: 2026-08-21
