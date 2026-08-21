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


## Expanded pass — Tech Edit

The Tech Edit module is one of the strongest observed modules. It reports a visible 90/100 score, one warning, and a specific GA-09b finding for Shoulder Width. It explains the suspected circumference-vs-half-width mistake and gives a concrete editor-cost estimate. The copy is actionable and the pre-edit summary is copyable. However, the module’s claim of a comprehensive numbers-first audit must be reconciled with the earlier demonstrated ability for an invalid negative measurement to persist and pass other `Ready` gates. This suggests the audit is useful but not yet a complete project integrity check. The hourly-rate input and several small controls should receive the same boundary and mobile validation tests as other modules.

Date: 2026-08-21


## Expanded pass — Tech Edit boundary input

Entering `-500` into the Tech Edit hourly-rate field resulted in the visible value becoming `200` with no visible validation message. The editor-savings estimate changed from `$70` at the prior rate to `$400`. The behavior may reflect an HTML max clamp, browser numeric-input normalization, or application logic, but the user is not told that their requested `-500` was rejected/transformed. This is a silent-input-transformation trust issue. The rate field should reject negative values with an explicit error or show a stated range and a clear correction message.

Date: 2026-08-21


## Expanded pass — Finish & Care Guide

The Finish module provides fibre selectors, optional metres-per-100g and fabric notes inputs, care flags, and a copy-ready pattern section. Selecting Acrylic changed the prose to mention acrylic and a blend rule, so the module is stateful rather than a static card. The module has meaningful domain guidance, but it makes broad care claims and recommends practices that should be treated as generalized guidance rather than a substitute for a yarn label; it does include a useful note to follow the specific ball band. The interface is dense on mobile and exposes many small fibre buttons. The generated copy includes awkward wording in the default state (`You can substitute or any yarn...`), which undermines the otherwise professional tone and should be tested across every fibre and blend combination.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Deals comparator boundary stress

The Deals module accepts impossible values without visible validation: design hours `0`, hourly rate `-40`, fixed costs `-200`, price `0`, and estimated lifetime sales `-10`. The rendered outputs become internally contradictory. For example, the flat-fee card says the $1,000 fee “covers your time and production costs and beats self-publishing by $1,350,” while the adjacent metric says `Beat vs baseline $-1,350`. The module also shows a `Take` verdict across multiple structures despite negative or zero assumptions and shows a negative hourly rate. This is a severe trust failure for a deal-analysis tool: domain constraints and signed/unsiged semantics are not being enforced, and the narrative verdict is not consistent with the numeric delta. The app should block impossible values, expose the formula inputs used, and make the verdict a pure function of the displayed numbers.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Launch Campaign boundary stress

The Launch module accepted and rendered a past date (`2020-01-01`), a script-like yarn-company string (`<script>x</script>`), a malformed Ravelry URL (`not-a-url`), a `javascript:` Etsy URL, an HTML-like coupon code (`<img src=x>`), and a `200%` coupon. It visibly warned that 200% off trains buyers to wait for sales and recommended capping coupons at 15%, so the module has some business-rule awareness, but it did not block or visibly mark the invalid value. The malformed URL strings were rendered into generated campaign text. No script execution was observed, but URL and HTML-like fields should be encoded and validated, with safe-link handling and explicit errors.

The module reports launch readiness `29/100` after the stress and still shows `Publish checklist 10/10` and `Tech-edit audit 7/10`, while other missing assets keep readiness low. It generated timeline text from the past date and retained a channel-links `7/7` score even though the typed URLs were invalid, suggesting link scoring may depend on non-empty fields rather than valid URLs. This is a serious claim-to-evidence and validation weakness for a launch-planning tool.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Trunk Show boundary stress

The Trunk Show planner accepted a past event date (`2020-01-01`), negative visitors/day (`-10`), try-on rate `2`, conversion `-0.5`, shop split `1.5`, negative pattern price (`-10`), negative channel fee (`-1`), zero event length, negative paired yarn sales (`-1000`), shop yarn cut `2`, negative sample yardage (`-50`), negative sample cost (`-20`), negative shipping (`-100`), negative travel/lodging (`-500`), negative catering (`-300`), and negative labor rate (`-40`). It then generated a positive `Expected copies sold 140`, net `$1,473.33`, effective `$232.63/hr`, and a `GO` verdict. The task list also generated nonsensical dates and text such as `0+ knitting hours` and `0% to the shop / 100% to me`. This is an extreme business-model integrity failure: invalid signed inputs are being combined into optimistic outputs without hard bounds or an invalid-state gate. The module must validate probabilities, percentages, prices, costs, durations, dates, and counts before calculating or issuing a recommendation.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Translation & Bundle boundary stress (partial)

The Translation & Bundle module is a more complex, multi-output planner. Attempting to enter a negative pattern word count (`-2000`) was reported as successful by the form tool, but the refreshed page still displayed `2000`, suggesting silent clamping, browser-number-input behavior, or an immediate state normalization. The reactive rerender changed/staled indexed controls after the first field update, so a second view is needed to test the remaining invalid fields accurately. This is itself a usability/testing signal: reactive recalculation is active, but any normalization should be visible and explained rather than silently changing the user’s entry.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Translation & Bundle normalization confirmation

After the negative word-count attempt, the field visibly remains at `2000`, and the rest of the form remains at its defaults. The UI does not show an error, warning, or explanation that the attempted value was normalized. The module’s default bundle output is already a red flag: with no partner patterns added and no meaningful coalition audience entered, it displays `$765` share, `$34` solo baseline, `$731` incremental upside, `2150% upside`, and a `great` / “Say yes” recommendation. It explicitly says the bundle is modeled with the user’s pattern alone, so the positive recommendation is not decision-safe until partner count, audience, bundle units, and baseline inputs are required or uncertainty is surfaced.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Pattern Club boundary stress

Pattern Club accepted negative member price (`-10`), negative annual price (`-100`), negative trial length (`-1`), negative trial price (`-5`), negative starting members (`-20`), negative new members/month (`-10`), 200% monthly churn, negative gift fulfilment (`-8`), negative production (`-1000`), negative community labour (`-500`), 200% channel fee, zero patterns/month, negative solo copies (`-50`), and negative solo price (`-8`). The rendered result changed to `Month-12 club net $1,419.20`, `Solo income lost/mo $0`, `Net vs selling solo $1,419.20`, and a lowercase `go` recommendation: “Launch it.” This is another severe financial-model validation and recommendation-gating failure. The app treats impossible or adversarial inputs as a favorable business case and gives a launch recommendation instead of an invalid-state result.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Kit Economics boundary stress

Kit Economics accepted negative yarn price (`-100`), negative kit retail (`-1`), negative notions (`-5`), packaging (`-10`), kitting labour (`-3` hours), labour rate (`-500`), overhead (`-100`), consignor share `2`, processor fee `-1`, wholesale marketplace fee `2`, negative self-sell kits/month (`-10`), negative consignment kits/month (`-20`), negative wholesale kits/order (`-5`), negative wholesale orders/month (`-3`), and negative solo pattern income (`-1000`). A target shop field accepted `<script>Kit Shop</script>` and rendered it as text, which is a positive encoding signal but still needs allowlist/length rules. The module produced contradictory outputs: `Kit COGS $85.00`, self-sell `-$1.36/kit`, consignment `-$4.00/kit`, wholesale `$0.50/kit`; it declared `LYS consignment beats the solo baseline` and `Best channel nets $80.00/mo versus -$1,000.00 pattern baseline`. The generated agreement text included `200/-100 split` and a proposal with `$-1.00` retail and `-$0.50` wholesale price, while still using positive sales language. This is a severe semantic-validation and recommendation-gating failure. Negative costs, prices, rates, shares, and quantities must block calculation; generated documents must never be produced from invalid state.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Submission Pipeline boundary stress

The Pipeline Add call action immediately created an `Untitled call` record before the form was completed. The form accepted a publication name containing `<script>Bad Pub</script>` and rendered the tags as text, plus an issue string `../../theme & audit`. It accepted a sequence of impossible, out-of-order historical dates: submission `2020-01-01`, decision `2019-01-01`, pattern due `2018-01-01`, sample due `2017-01-01`, launch `2016-01-01`; it also accepted an exclusive window of `-5` months and a publishing fee of `-100`. No visible validation state appeared. The record now displays the malformed publication and issue metadata in the call list. This is a data-quality and workflow-integrity defect: draft creation should not produce a saved call until required fields are valid, and dates should be checked for chronological order, future/past applicability, and nonnegative numeric constraints. The text rendering appears encoded, but field allowlists and length limits are still needed.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Pipeline production-rate boundary stress

The Pipeline production-rate controls were visible after scrolling. The browser/form map changed while scrolling; the sampled knit-rate and pattern-writing fields were not filled because their stale indices resolved to buttons, while swatch work accepted `999999` and hours/week accepted `-5`. The app exposed no visible domain warning in the captured state. This indicates both a usability problem in a highly dynamic dense form (stale indices are easy to hit) and a likely validation gap for production rates. The test call record remains a malformed persisted artifact and must be removed during cleanup.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — KAL & Collab baseline

KAL & Collab ROI presents editable campaign, affiliate, cost, and hour inputs. Default output: `-$146 net profit`, `-$5/hr effective`, gross revenue `$187`, fees + cash costs `$9`, labour cost `$324`, net profit `-$146`; recommendation: “This free KAL loses cash on top of your time. Trim giveaway costs, add an affiliate link list to the pattern page, or cut duration before signing up.” It also exposes a Brand-collab rights check and paste-ready collab pitch. This module has useful breadth and explicitly treats affiliate upside as not guaranteed cash, but its full validation behavior remains to be tested.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — KAL & Collab extreme-input stress

The module accepted all 18 extreme values: negative pattern price `-10`, event discount `150%`, negative copies sold `-5`, visibility tail `999999999`, negative tail duration `-12`, negative cross-sell `-1000`, negative leads `-25`, zero campaign length (browser normalized the visible state back to `4` after reactive updates), negative affiliate buyers `-10`, cart value `999999999`, commission rate `2`, negative sample yarn `-50`, negative prizes `-500`, negative design hours `-8`, promo hours `999999`, negative support hours `-4`, hourly bar `-200`, and platform fee rate `3`. The calculated output showed gross revenue `$109,999,998,881`, fees + cash costs `$109,999,998,890`, labour `$0`, net profit `-$9`, and repeated the standard “This free KAL loses cash” message. There was no blocking error, range warning, or explanation that the scenario was invalid. The tool’s arithmetic can remain numerically finite while its business interpretation becomes meaningless. This is a critical validation and decision-safety issue for a module positioned as ROI planning.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Channels baseline

Channels / Channel & Funnel Planner presents editable offer, audience, conversion, sales, economics, rights, and funnel fields. The default state shows `NO · -$411 · -10.3/hr`, a medium deadline, and advisory copy about marketing inserts, written terms, defunct-box risk, typical subscriber counts, audience reach, and email conversion. It also claims `With ~60% of sales landing in launch week...` and that the funnel clears the `$12/hr` bar, while the rendered input labels show duplicate `Evergreen conversion (%)`, duplicate `Work hours`, and duplicate `Deadline` fields in the lower funnel section. The model has strong strategic breadth but the baseline copy relies on external-looking benchmark statements without visible source links in the live module, and negative default economics are not paired with a prominent actionable block state.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Channels extreme-input stress

Channels accepted a malformed channel name `<img src=x onerror=alert(1)>` and extreme/invalid values: design fee `-999`, extras `999999999`, exclusivity `-12`, audience reach `-300`, visit rate `250%`, visitor conversion `-5%`, average spend `999999999`, effect duration `-24`, baseline sales `-100`, pattern price `-50`, work hours `-8`, deadline buffer `999999`, and defunct risk `200%`. The module then displayed `GO · $999,999,684 · 999999684.0/hr`, `Deadline: low`, and stated that at `-300 subscribers` the fee works out to about `$0.00 per subscriber exposed`, clears the `$12/hr` bar, and “this channel pays.” No invalid-state block or warning appeared. The malformed channel name was rendered as text rather than executed in the visible UI, but the field was accepted without a safe-format or length constraint. The lower email-funnel section visibly contains duplicate labels for Evergreen conversion, Work hours, and Deadline, creating ambiguity about which field controls which calculation. This is a critical decision-safety defect: impossible audience and rate inputs can flip a negative default deal into a confident GO verdict.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Club Revenue Model baseline

Club Rev / Club Revenue Model presents membership, churn, pricing, costs, premium-tier, terms, retention-calendar, and launch-email planning. Default output: Net MRR `$430`, projected annual net `$1,707`, breakeven members `52`, member LTV `$86`, effective hourly `$15.1/hr`, marketing payback `1.3 mo`, hours/month `28`, and `Churn: typical (TYPICAL)`. The module includes a premium-tier audit with `score 1/6`, six missing-perk recommendations, and copy about common churn/refund/retention practices. It exposes toggles for founder price lock, no annual refunds, and lifetime pattern access. The feature is strategically rich, but the claims use benchmark-like language (“good” churn bar, common refund/chargeback behavior) without a visible source or methodology in the module; validation and sensitivity behavior remain to be tested.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Club Revenue extreme-input stress

Club Rev accepted negative monthly members `-40`, annual members `-20`, monthly price `-7`, annual price `-77`, new signups/month `-6`, and monthly churn `200%` without field-level errors. It recalculated to Net MRR `$35`, projected annual net `-$3,710`, breakeven members `—`, member LTV `$8`, effective hourly `1.0/hr`, marketing payback `—`, and classified churn as `bleeding (BLEEDING)`. The module did at least recognize the 200% churn as a severe business problem and gave corrective copy, but it still evaluated and displayed a clean-looking model from impossible member and price inputs rather than returning `Invalid input` or separating the churn warning from data validity. This confirms the pattern across business modules: domain validation is weak, while post-calculation narrative warnings are comparatively stronger.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — module-switch recovery / blank render

Attempting to open Wholesale & Book from the heavily populated workspace produced a completely blank page with no interactive elements in the browser view. A subsequent inspection still showed the blank render. Reloading the same project route restored the workspace, which then displayed a recovery banner: `Your work is safe. Your last session closed unexpectedly — all projects were already saved locally.` The exact trigger and reproducibility of the blank state are not yet established, but this is direct evidence of a possible runtime crash or unhandled render failure during module switching. Recovery is better than data loss, but the user is left without an error explanation or a visible retry control beyond reloading.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Wholesale & Book boundary stress

Wholesale & Book accepted negative patterns offered `-5`, retail price `-8`, wholesale rate `-4`, order quantity `-100`, repeat-order chance `200%`, work hours `-5`, cash costs `-1000`, and direct net per pattern `-2`. It rendered Deal nets `$0`, same-volume self-sold `$0`, breakeven direct copies `—` in the metric, then narrative text stated `Sell Infinity copies direct to match this wholesale cheque at your $0.00/pattern net.` It classified the offer `MAYBE` and continued to produce relationship and labour guidance, including `-5h at the $12/hr floor = $-60`. The result is not a safe invalid state: impossible inputs yielded mathematically degenerate outputs and polished commercial advice. Although the final narrative did not say YES, it still failed to quarantine the scenario and exposed Infinity/negative values to the user.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Hire vs Self boundary stress

Hire vs Self accepted opportunity rate `-50/hr`, sample-knitter rate `-1/yd`, flat sample fee `-100`, return shipping `-20`, tech editor rate `-5/hr`, and self-edit hours `-10`. It rendered sample yardage `2,886 yd`, hire sample cost `$354`, edit cost `$113`, and hours freed `100 hr`, but transformed the negative opportunity rate into `$0` income potential. It classified both sample and editing decisions as `SELF` and overall `NO — self costs $0, hiring costs $467`, with reasoning that self-knitting wins because opportunity cost is `$0/hr`. The app did not block or explain the invalid negative inputs; it silently converted the business premise into a zero-rate scenario and produced a recommendation. This is a high-severity validation and trust defect, though the result was conservative rather than falsely positive.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Inclusive Sizing boundary stress

Inclusive accepted negative pattern price `-10`, monthly sales `-100`, design rate `-5`, and grade rule `-2` with no invalid-state block. It recalculated the audit to `1/6 Not inclusive`, effort cost `$416`, launch-week net baseline `$0`, and rewrote adaptive modification quotes as negative values such as `$-15`, `$-7`, and `$-12`. The launch copy embedded the impossible `-2" grade rule`. The model did not prevent nonsensical pricing or grade semantics; it continued to present a polished inclusivity audit and launch copy. This is high severity because the module’s purpose is to help designers communicate fit and accessibility accurately, yet invalid inputs can directly contaminate customer-facing copy.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Licence It boundary stress

Licence It accepted pattern price `-100`, expected monthly sales `-10`, design rate `-5/hr`, and invested hours `-40`. It rendered `Rights audit: 8/8 passed`, `GO`, a labour floor of `-$480`, self-sell value `-$0`, and a ready-to-send approval reply: `Send the agreement over and I'll turn it around within the week.` The module treated impossible negative economics as a successful rights decision rather than blocking or warning. This is critical because the UI is explicitly positioned to influence licensing decisions and produces a one-click-style persuasive response despite invalid premises.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Membership Planner boundary stress

Membership Planner accepted negative prices and member counts across all three tiers (`-$3`/`-60`, `-$5`/`-30`, `-$10`/`-10`) and churn values above 100% (`150%`, `200%`, `-50%`). It rendered `0 members · ~-150 churn/mo`, breakeven `≈ 0 members`, retained the previous `Membership loses $27/mo` narrative, and generated paste-ready tier copy containing negative monthly prices. It also emitted a watch-out that the bottom tier nets `$-8.55/member`. This is a critical invalid-state and customer-copy contamination defect: impossible subscription terms are not blocked and can be copied directly into launch material.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Promo boundary stress

Promo accepted pattern price `-10`, baseline sales `-100`, horizon `0`, kill threshold `-50`, daily budget `-5`, CPC `-1`, and conversion rate `150%`. It rendered a `MAYBE` summary with `Total spend $350 · projected net -$445`, an impossible kill rule of `$-50 spent with zero orders`, and channel output that continued to generate recommendations. Etsy offsite ads changed to `KILL` because commission exceeded the negative-priced net. The planner did not block or clearly mark the invalid state, allowing malformed assumptions to shape campaign advice and copy.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — PriceWin boundary stress

PriceWin accepted pattern price `-100`, baseline sales `-10`, and fave queue `-20`. It rendered sale price `-$80 → -$100`, full-price output `Net $5,463 · -58 sales over the window`, launch sale `Net $4,790 · -58 sales`, and a paste-ready launch listing containing `Pattern now 20% off — -$80 until day 14, then -$100.` The UI did not block impossible negative demand or prices and allowed malformed commercial copy to be generated. The negative-sales result also indicates arithmetic/sign handling is not safely bounded.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Repeat boundary stress

Repeat accepted negative email list, impossible percentages, zero release cadence, negative average price, and negative signup/knit inputs, although browser normalization converted several values to zero or 100. It produced a `NO` verdict and displayed `Cold-acquisition cost of the same buyers $NaN`. The page still emitted retention guidance and email copy while core assumptions were invalid. The NaN leakage is a concrete calculation and presentation failure, not merely a missing validation message.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Mix boundary stress

Mix accepted monthly sales `-100`, average price `-10`, design rate `-50`, marketing hours `-3`, and international sales `150%`. It rendered `Gross / mo $1,001`, `Maintenance -$225`, `Net after all of it $200`, platform rows with negative sales counts such as `-77.8 sales`, and recommended Etsy as the workhorse while suggesting Payhip. The output remained commercially actionable despite impossible inputs and contradictory signs. The model appears to use absolute or sign-inconsistent calculations in places, which makes the portfolio recommendation unsafe without an invalid-state gate.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Collab boundary stress

Collab accepted impossible negative fee, hours, rate, sample, post, sales, and follower inputs; browser normalization converted many to zero, while exclusivity remained `999` months. It returned `Verdict: Take it` with `$0` fair-fee floor and generated a reply confirming `0 hours` and `999 months exclusivity` for `$0`. This is a severe semantic safety failure: a contract/rights evaluator can recommend acceptance of an effectively perpetual, unpaid arrangement because it fails to validate or cap critical terms. The red-flag copy also contradicted the take-it verdict.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Book It boundary stress

Book It accepted `-1` list price, `0` pages, `200` color pages, `-50` expected copies, `-1000` production budget, `-200` marketing spend, and `-999` PDF baseline. It rendered `$0` net totals, zero break-even, every channel `DEAD`, and generated launch-ready copy containing negative price, negative copies, and negative production/marketing budget. It did show a `SKIP` verdict and a prompt to set valid values, but still exposed malformed data in a copyable output. Invalid-state quarantine is required before any copy/export action.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Protect boundary stress

Protect accepted `-1` copies/month, `-5` average price, `2` platform fee, `-10` marketing hours, and `-50` hourly rate. It rendered leak exposure `$12` and stated that the response budget `(-$200/incident) is worth it`, while readiness stayed `UNREADY`. The module’s guidance is useful when inputs are valid, but its legal/rights-adjacent recommendations are unsafe when a negative response cost is treated as a rational budget. It needs hard bounds, uncertainty language, and a visible invalid-input gate before generating takedown strategy.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Teach It boundary stress

Teach It accepted negative ticket, production hours, list size, rates, platform cost, runway, materials, session hours, sessions, expected students, list conversion, and a refund rate of `2`. It normalized many fields to zero but still returned `launch`, stated that the offer pays more per hour and covers costs, and displayed pathological outputs including `-$936/hr` self-hosted, `$7,488/hr` minutes-royalty, and `89940×` pattern rate. This is a severe decision-safety failure: invalid input did not force an invalid state, and positive launch advice survived contradictory assumptions. Teaching economics requires explicit bounds, unit tests for zero/negative/NaN, and a disabled copy/export state when inputs are invalid.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Partners boundary stress

Partners accepted negative fee, exclusivity, price, expected sales, yarn support, production cost, total hours, and marketing reach above 100. It normalized most visible economics to zero and returned `rethink`, which is safer than the positive false positives found elsewhere. However, it did not show field-level errors or clearly explain normalization, and the agreement copy remained available. A deal evaluator should block invalid terms before producing a draft agreement, because users may mistake the generated checklist for a safe contract.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — Yarn Buy boundary stress

Yarn Buy accepted negative yardage per skein (`-1`), negative price (`-10`), negative stash grams (`-999`), and negative skein weight (`-50`). It showed only a generic prompt to enter yardage and price; no field-specific validation, invalid-state treatment, or explanation of the normalized/invalid values appeared. The calculator did not produce a purchase recommendation under the malformed state, which is safer than a false quantity, but the raw impossible values remained visible. Domain constraints should be enforced explicitly: positive finite yardage, price, grams/skein, and nonnegative stash.

Source under test: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21


## Expanded pass — KAL Planner baseline

KAL Planner exposes a real P&L model with editable pattern price, base weekly sales, duration, lift, afterglow, prizes, sponsor value, sample cost, hours, hourly cost, session fees, and paid sessions. With defaults it showed `HOLD`, net P&L `-$332`, launch-window revenue `$195` from 30 sales, afterglow revenue `$23`, and prize/sample spend `$150`; it also flagged unpaid labour (`$400` time vs `~$218` revenue). The warning and hold behavior are materially safer than the repeated false-positive calculators, but the model still relies on baked-in heuristics and should disclose their provenance and uncertainty. Source: https://stitch-and-scale-pro-api-server.vercel.app/project/sample-crew-neck-sweater
Date: 2026-08-21

## Extended audit continuation — 2026-08-21

### Payback Lab — extreme negative hourly rate
- Entered `-999999` into the hourly-rate field and triggered the visible Apply action through the page DOM.
- The control accepted the value; no inline error, blocking state, warning, or visible normalization occurred. The module remained rendered with the invalid value in the field.
- With no ledger/receipt records, the headline totals stayed at $0.00 and 0/0, so the invalid rate did not yet contaminate a downstream calculation. The defect is still material: an impossible labour assumption is accepted as an active model parameter and would be dangerous once records exist.
- Severity: **P1 validation defect** (potentially P0 when combined with populated ledger data).

### Submissions — current observation
- Module rendered with a detailed, transparent self-publish comparison and an honest **NO** verdict for the default magazine offer; visible outcome showed negative net, negative effective rate, exclusivity dead-loss, rights-return tail, and a calculated break-even fee.
- This is one of the better modules in the app because it exposes assumptions and explains the recommendation rather than emitting an unexplained GO.
- The attempted scroll reported no large scroll container because the module fit in the current viewport; no additional lower content was available in the captured state.
- Severity: **no major defect observed in this pass**; retain as a relative strength, subject to the broader systemic input-validation concern.

### Interaction/tooling note
- Clicking the Submissions tab from Test Knit Desk did not leave the browser in the expected visible state; the next view showed Payback Lab instead. This may be a stale-index/SPA interaction artifact rather than an app defect, but it is worth retesting if tab-navigation reliability becomes a dedicated finding.
- A page scroll attempt on Submissions returned `no-large-container` because the page reported no scrollable remainder; no user-visible defect was inferred from this alone.

### Gauge & Fit — invalid denominator and negative swatch stress
- Baseline: the module rendered cleanly, showed a useful mismatch warning for a 22/30 tester swatch against the 20/28 pattern gauge, and explained that the sample project had no graded sections so placeholder XS–XL sizes would be used.
- Entered pattern stitches `0`, pattern rows `-28`, tester stitches `-20`, tester rows `0`, and target circumference `-100`.
- The visible controls ended up displaying `0` for every stressed numeric field. There was no field-level error, no invalid-state styling, and no explanation that negative values had been coerced or that the pattern gauge was unusable.
- The module then reported stitch ratio `1.000`, row ratio `1.000`, **“Tension is on gauge — proceed,”** and **“no tension-based size change is needed.”** This is a false-safe result from impossible/zero inputs and is especially serious because Gauge & Fit is a core technical decision surface, not merely a business calculator.
- Severity: **P0/P1 technical validation defect**. Zero or negative pattern gauge must block translation; all derived ratios and recommendations must be withheld until valid positive gauges exist.

### Listing SEO — copy-kit and numeric-boundary stress
- Baseline: cleanly rendered a pre-publish score with explicit criteria, channel net-per-sale cards, and a paste-ready listing kit. It initially held publication with a 15/100 score because title, tags, photos, price, written/charts, and announcement channels were incomplete.
- Entered title `<script>SEO</script>`, advertised sizes `-5`, photos `999999`, listing price `-20`, and a tag draft containing `<img src=x onerror=alert(1)>` plus blank comma-separated entries.
- Numeric inputs with declared bounds silently normalized: advertised sizes became `0`, price became `0`; photos retained `999999` in the DOM despite a declared `max=12`, while the score treated it as a full photo set. No field-level error appeared.
- The tag string was carried into the generated paste-ready kit as a literal malformed HTML-looking tag, alongside a generated `1 sizes` token. React displayed it as text rather than executing it in this test, but the output is still unsafe/unprofessional copy contamination and could become an injection risk in a different rendering/export context.
- The module's score changed from 15 to 20 despite invalid/absurd inputs, and the size-range criterion dropped to 0 for the normalized zero-size value. It still presented a customer-facing copy kit rather than blocking or clearly labelling the result as invalid.
- Severity: **P1 copy-integrity and validation defect**; upgrade to **P0** if any downstream HTML/Markdown renderer interprets copied tags or if listing export is treated as publish-ready.

### Ad Break-Even — invalid economics and contradictory recommendation
- Baseline: rendered a useful channel comparison with explicit net-per-sale, break-even CPC/ROAS, an email baseline, and an Offsite Ads fee note. Default assumptions produced a sensible “skip paid spend and feed the list” verdict.
- Entered price `-100`, CPC `0`, conversion `-1`, budget `999999`, email list `-5`, email conversion `-2`, and annual revenue `-100`.
- The visible controls silently normalized several impossible values to `0` (price, CPC, conversion, list size, email conversion, revenue) while retaining the extreme budget. No inline validation or “inputs invalid” state appeared.
- Output showed net per sale `-$0.44`, break-even ROAS `∞`, and a “Best paid channel” of Etsy Ads with `-$999,999.00/day` and `99,999,900 clicks/day at $0.00`. The high-level budget verdict said avoid paid channels, but the detailed recommendation still named a best paid channel with nonsensical economics.
- Severity: **P0 financial-integrity defect**. Zero denominators, negative rates, and invalid revenue inputs must block every recommendation and render a clear error state; “best channel” must be suppressed when no valid channel exists.

### Sample & Launch Window Lab — invalid sample economics
- Baseline rendered four sample-sale channels and a launch-window model with seasonal factor, week-one burst, and tail sales. It explicitly compared net sample proceeds against a labour/materials basis.
- Entered negative values for sample hours, yarn/materials, hourly rate, expected month-1 sales, garment ask price, sample-sale price, booth cost, and days-after-release.
- The numeric controls silently displayed `0` for the negative values. No errors or invalid-state indicators appeared.
- Output then presented a green success-style message: **“At Etsy listing the sample nets 0.00 against a 0.00 cost basis — it recovers 0% of its own production cost.”** It also labelled Etsy the “Best net,” generated a full zero-valued channel comparison, and reported a zero week-one launch plan. A zero-cost basis should be an incomplete/invalid state, not a positive-looking recovery result.
- Additional baseline oddity: the default launch copy reported weekly value at the sample-sale price rather than clearly distinguishing pattern price from sample-sale price, which may confuse the two revenue streams.
- Severity: **P1 financial-model validation defect**; false success styling from a zero basis merits **P0 treatment** if users could interpret it as an approval.

### Collab Deal Math — invalid contract terms contaminate negotiation copy
- Baseline rendered a detailed rights-contract comparison, brand-channel versus own-channel economics, exclusivity opportunity cost, and a paste-ready counter-offer letter. The default scenario produced a losing structure and a clear warning.
- Entered negative fixed fee `-999`, royalty `-20%`, company sales `-100`, free-yarn value `-500`, exclusivity `-999` months, tail `-999` months, hours `-1`, hourly rate `-100`, production cost `-50`, and monthly sales `-999`.
- Unlike some other labs, these negative values remained visible rather than being normalized. No field-level validation appeared.
- The module generated a confident decision (“This structure loses”) and a **paste-ready counter-offer containing negative offer amounts** such as `$-1399` and `$-599`, while also stating a negative hourly floor. This is not a safe degradation; it turns invalid user input into externally usable negotiation text.
- Severity: **P0 contract/financial-integrity defect**. Block copy generation until all terms are valid and enforce domain bounds (non-negative fees/sales/hours, royalty 0–100%, non-negative months, and a positive hourly floor where used).

### Photo ROI — zeroed photography economics and false payback language
- Baseline rendered a coherent comparison of DIY, per-image catalog, and half-day lifestyle shoots, plus break-even copies and thumbnail-lift economics. Default state selected the per-image catalog shoot as best for the pattern.
- Entered negative values for all major inputs: pattern/image counts, hourly rates, DIY hours, gear value, amortization library, model pay/hours, per-image and half-day rates, batch size, extras, pattern price, platform fee, monthly sales, CTR lift, and runway.
- The controls displayed `0` for the negative values without errors. The module generated zero-cost shoot options, zero break-even copies, and zero extra revenue, then stated **“Nearly free to shoot — the photos pay for themselves with the first sale.”** It also raised a per-image quote red flag from the invalid zero quote.
- Severity: **P1 financial-model validation defect**. Negative/zero denominators and an invalid zero-cost basis must produce an incomplete state, not a recommendation or payback claim.

### Video & Social ROI — invalid audience funnel collapses to a false zero plan
- Baseline rendered an informative per-channel funnel with audience, views, clicks, sales, net revenue, time cost, and net per hour; it identified Email list as the strongest channel and gave concrete batching guidance.
- Entered negative values for all audience sizes, posts/month, minutes/post, video length, pattern price, platform fee, monthly sales, email list, and email sales.
- All numeric controls silently normalized to `0` with no inline errors. Output changed to a zero-plan state: zero audience/views/clicks/sales, zero attributable net, and **“No content planned.”**
- The model still generated a verdict and operational advice from invalid premises. Although less dangerous than a false positive, this hides the distinction between “not entered,” “invalid,” and a real zero-audience strategy.
- Severity: **P1 validation and state-semantics defect**. Invalid inputs should be distinguishable from legitimate zeros; recommendations should be withheld until required funnel assumptions are positive and internally consistent.

### Show ROI — zero-event state still emits a booking verdict
- Baseline rendered a thorough event model with attendance, conversion, ticket, total fees, inventory mix, show net, post-time net, 7x fee target, list-capture value, and watch-outs. It flagged underpayment and inventory imbalance in the default scenario.
- Entered negative attendance, conversion, ticket, booth/application/travel/power costs, setup and on-site hours, card fee, tax, and follow-up buy rate.
- All negative numeric inputs silently displayed as `0`; no validation or explanation appeared.
- The module produced a zero-event model and still stated **“Cleared”** for the 7x fee bar because the booth fee had become zero, then issued an **“Underpaid but paid”** verdict at `$0/hour`. It also retained an inventory watch-out based on the unchanged product mix. A zero-fee event should be invalid/incomplete, not considered to have cleared a target.
- Severity: **P1 financial validation defect**, with **P0** potential where “Cleared” is interpreted as a booking approval.

### Payback Lab — Apply accepts an extreme negative hourly rate
- Payback Lab initially showed an hourly-rate field and an Apply button, with no patterns to recoup and zero invested/earned totals.
- Entered `-999999` and clicked Apply. The field remained `-999999`; no inline error, warning, clamping, or rejection appeared. With no ledger records, the totals stayed at `$0.00`, so the invalid rate's downstream effect was masked by the empty dataset.
- Severity: **P1 input-integrity defect**, escalating to **P0** once Design Ledger records are present because the rate is a core denominator/valuation assumption used by the payback model.

### Design Ledger — preliminary cost-entry observation
- Design Ledger starts with zero designs and zero costs and presents a cost-entry form with optional design, category, description, amount, date, and “Record cost.”
- Entered description `<script>Bad Cost</script>` and amount `-999999`; both values remained visible with no inline validation.
- A coordinate attempt on “Record cost” produced no visible change: the form still showed the invalid values and the page still said “No costs recorded yet.” This may indicate targeting failure rather than a definitive validation result; DOM-level verification is pending.

### Design Ledger — DOM-verified record behavior
- DOM-level click found and activated the `Record cost` button with the malformed description and `-999999` amount present.
- After the click, the inputs still contained the same values, the counters remained `Designs (0)` / `Costs (0)`, and “No costs recorded yet” remained visible. No inline error or explanation was rendered.
- Result: the invalid cost was not visibly persisted, but the user receives no actionable feedback about why. This is a **P1 validation/feedback defect** and a usability failure in the source-of-truth workflow. The safe aspect is that this particular malformed cost did not enter the ledger during this test.

### Receipt Lab — boundary inputs accepted in live receipt preview
- Receipt Lab opens with Ledger (0) and a New Receipt form. Entered customer `<script>Bad Customer</script>`, pattern `<script>Bad Pattern</script>`, date `1900-01-01`, quantity `-3`, price `-999`, tax `-15%`, platform fee `-20%`, processing fee `-30%`, shipping charged `-500`, and shipping cost `-500`.
- All targeted numeric/text/date inputs accepted the values without visible validation. The receipt preview immediately rendered the script-like strings as literal text and displayed the malformed date; the preview showed Total `$0.00` and Profit `$0.00` at this stage.
- The attempted item-description target was actually the “Add item” button, so no conclusion is drawn about that field. The remaining invalid values are ready for save-path testing.
- Severity: **P1 input-integrity and output-safety defect**; severity rises to **P0** if the Save to ledger action persists these values and they flow into financial totals or customer-facing artifacts.

### Receipt Lab — malformed receipt not visibly persisted, but no feedback
- After scrolling to the share controls, DOM-level activation of `Save to ledger` returned `clicked: true`, but the tab still displayed `Ledger (0)` and no receipt was added.
- The preview continued to expose the 1900 date and literal `<script>Bad Customer</script>` / `<script>Bad Pattern</script>` strings. No validation message, rejection reason, or recovery guidance appeared.
- Result: this test did not confirm durable contamination, but it confirms **unsafe live preview output** and an opaque save failure. The user could reasonably believe the receipt was saved when it was not. Severity: **P1**, potentially **P0** for a production invoicing/record-keeping workflow if silent save failures are not surfaced.

### Wholesale Lab — boundary-input attempt pending verification
- Wholesale Lab opens with three SKU rows (knit hours, materials, labour rate, wholesale and retail prices), order minimums, reorder assumptions, processing cost, units/order, annual hours, commission, terms, and calculated annual economics.
- A boundary attempt targeted eleven numeric inputs with negative values (`-10`, `-999`, `-25`, `-100`, `-200`, etc.). The fill operation reported success, but the returned element values and visible table appeared to retain the baseline values, suggesting controlled-input rerender/target ambiguity rather than a confirmed accepted or rejected result.
- DOM-level inspection is pending; no severity assigned yet.

### Wholesale Lab — controlled numeric field behaves ambiguously under invalid input
- DOM inspection confirmed the Wholesale Lab contains 22 numeric controls, including all three SKU rows and the order/annual assumptions.
- After an individual attempt to replace the first SKU’s `0.3` knit-hour value with `-10`, the live field displayed `0.310` and the calculated hat COGS/margin changed (`$12.04`, `38.58`), while no validation message appeared. The result is consistent with an input-targeting/controlled-field mutation rather than a deliberate safety response.
- The form therefore has both a testability problem and a likely input-integrity problem: users receive no clear indication that the intended value was not applied or that the computed result is based on a different value.
- Severity: **P1** for opaque controlled-input behavior; **P0** if a user can unknowingly rely on altered wholesale economics.

### Cleanup — malformed Pipeline record removed
- The app’s durable project list is backed by `keyval-store` / localStorage key `stitch-and-scale-v1`; the Pipeline module itself stores data under `stitch-and-scale-submitpipe-sample-crew-neck-sweater`.
- Located exactly one malformed call: `id: call-mt26roof`, publication `<script>Bad Pub</script>`, out-of-order dates, `exclusiveMonths: -5`, and `fee: -100`.
- Filtered and rewrote only that call. Verification: calls changed from `1` to `0`; Pipeline rates were preserved. No sample project records were deleted.

### Final persistence / cleanup verification
- A post-cleanup browser-local scan found no remaining `Bad Pub` or `call-mt26roof` markers in localStorage.
- The Pipeline record now contains `0` calls and still contains its `rates` object, confirming targeted cleanup rather than wholesale key deletion.
- The browser still had the expected local-first persistence footprint, including the sample project key, multiple per-Lab state keys, and the active service worker at `/sw.js`.
- IndexedDB enumeration showed `keyval-store` (version 1, object store `keyval`) as the project persistence database. The extended run therefore reinforces that persistence is real but fragmented across a central project store and many per-Lab localStorage keys, which complicates global integrity checks and reliable reset/cleanup behavior.
