# Stitch & Scale Pro — Extended Brutal Audit

**Target:** [Stitch & Scale Pro](https://stitch-and-scale-pro-api-server.vercel.app/)  
**Audit date:** 21 August 2026  
**Author:** Manus AI  
**Scope:** Extended adversarial review of the live PWA across mobile-like layouts, core grading, persistence, navigation, financial calculators, copy generation, local storage, invalid-input handling, and capability-versus-claim alignment.

## Executive verdict

The extended pass makes the first-pass verdict worse, not better. Stitch & Scale Pro is an unusually ambitious and visually credible prototype, but it is not yet trustworthy enough to position as professional production software or as a dependable decision-support system for pricing, licensing, wholesale, marketing, or launch decisions.

The dominant failure is now established as **systemic rather than module-specific**: the majority of business and financial calculators accept impossible negative, out-of-range, malformed, or extreme inputs and continue to produce polished numbers, recommendations, verdicts, launch copy, negotiation copy, agreement language, or customer-facing text. Some modules silently normalize the values to zero or another value; others retain the impossible value; others mix the two behaviors. In all cases, the user is rarely told what happened.

The blunt product judgment is:

> **The interface currently communicates more certainty than the underlying models have earned.**

A user can enter a negative price, negative audience, negative labour rate, 200% conversion or churn, perpetual exclusivity, an invalid URL, or an impossible date and still receive a confident `GO`, `Take it`, `Launch it`, `Ready`, “best channel,” “send the agreement,” or paste-ready output. That is a decision-safety failure. It is materially more serious than a collection of cosmetic bugs.

I would classify the product as **an attractive internal alpha or advanced prototype with a strong core-grading foundation**. I would not recommend the claims “professional,” “publish-ready,” “full functionality offline,” or equivalent confidence language until the integrity gate, calculator validation, export/copy quarantine, and failure-feedback paths are redesigned and covered by automated tests.

## Summary judgment

| Dimension | Extended judgment | Confidence |
|---|---|---:|
| Visual identity | Strong, distinctive, craft-aware | High |
| Core grading concept | Promising and inspectable | High |
| Local-first persistence | Real, but fragmented and difficult to validate globally | High |
| Mobile reading experience | Generally usable | High |
| Mobile editing/navigation | Dense, fragile, and too close to a compressed desktop workflow | High |
| Input validation | **Systemically unsafe across decision-support modules** | High |
| Financial-model trust | **Unsafe when users depart from happy-path inputs** | High |
| Generated copy safety | **Unsafe: invalid assumptions can reach copy-ready outputs** | High |
| Error feedback | Inconsistent; silent normalization and silent save failures observed | High |
| Offline claim | Shell caching and local persistence observed; “full functionality” not earned | Medium–high |
| Production readiness | **Not ready** | High |

## What this extended pass covered

The first pass covered onboarding, the sample project, Sections, Preview, Draft, Pricing, Income, Publish, Grading Lab, Chart Lab, Test Knit Desk, Payback Lab, full grading, PDF export, mobile captures, direct routes, persistence, service-worker behavior, and HTTP/header checks.

The extended pass added boundary and adversarial testing across the following modules: Tech Edit, Finish & Care Guide, Deals, Launch Campaign, Trunk Show, Translation & Bundle, Pattern Club, Kit Economics, Submission Pipeline, KAL & Collab ROI, Channels, Club Revenue, Wholesale & Book, Hire vs Self, Inclusive Sizing, Licence It, Membership Planner, Promo, PriceWin, Repeat, Mix, Collab, Book It, Protect, Teach It, Partners, Yarn Buy, KAL Planner, Grading Lab, Chart Lab, Test Knit Desk, Submissions, Gauge & Fit, Listing SEO, Ad Break-Even, Sample & Launch, Collab Deal Math, Photo ROI, Video & Social, Show ROI, Wholesale Lab, Design Ledger, Receipt Lab, and Payback Lab.

This was hands-on browser testing at mobile-like widths, primarily 390×844 and 412×915, supplemented by DOM inspection, localStorage/IndexedDB inspection, controlled interaction, and the durable evidence log at `/home/ubuntu/stitch_scale_audit_notes.md`. It was not a formal penetration test, load test, source-code review, accounting audit, or legal review.

## The dominant systemic finding: invalid state is not a first-class state

The app repeatedly treats invalid business inputs as if they were merely unusual but calculable values. That is the wrong model. A negative price, negative sales volume, negative labour rate, conversion above 100%, or negative duration is not a low-confidence scenario; it is an invalid scenario that should stop calculation or clearly separate the valid subset from the unusable premise.

The observed failure patterns fall into four related classes:

| Failure pattern | Observed behavior | Why it is dangerous |
|---|---|---|
| **Silent acceptance** | Negative or extreme values remain in fields and immediately affect outputs | Users may assume the model evaluated the exact scenario honestly |
| **Silent normalization** | Values become zero, 100, or another value without explanation | The field and the model can represent different assumptions while looking functional |
| **Invalid-state calculation** | The model emits finite but meaningless dollars, rates, percentages, or verdicts | A polished number creates false confidence even when arithmetic is technically finite |
| **Copy/export contamination** | Invalid values flow into launch text, replies, proposals, agreements, receipts, or listing kits | The defect moves from internal analysis into customer- or partner-facing material |

This behavior conflicts with the basic input-validation principle that data should be validated for syntactic and semantic correctness before processing [2]. It also conflicts with the app’s own premium language: `Ready`, `No flags`, `GO`, `Launch it`, `Take it`, and “publish-ready” imply that the relevant prerequisites have been checked.

The most concerning cases were not isolated arithmetic oddities. They were **recommendations from impossible premises**:

- Trunk Show produced `GO`, positive net, and `$232.63/hr` from negative attendance economics, negative costs, impossible percentages, zero event duration, and a past date.
- Pattern Club produced `Launch it` from negative prices, negative members, 200% churn, negative costs, and a 200% channel fee.
- Licence It produced `GO`, `Rights audit: 8/8 passed`, a negative labour floor, and a ready-to-send approval reply from negative sales, price, rate, and hours.
- Collab produced `Take it` for `$0` while retaining `999 months` exclusivity and generating a reply confirming those terms.
- Teach It returned `launch` and pathological hourly outputs after negative and out-of-range inputs.
- Channels returned `GO · $999,999,684 · 999999684.0/hr` with negative audience and sales assumptions.
- Ad Break-Even produced infinite ROAS and a “best channel” under zero/negative denominators and negative revenue.

These are **P0 decision-integrity defects**. They should be fixed centrally rather than patched ad hoc inside individual screens.

## New extended-pass severity matrix

The matrix below records the representative modules tested beyond the first report. Severity is based on user harm, confidence implied by the UI, whether invalid data reaches actionable output, and whether a global fix is needed.

| Module | Extended boundary result | Severity | Required response |
|---|---|---:|---|
| Tech Edit | `-500` hourly rate became `200` with no explanation; savings estimate changed from `$70` to `$400` | P1 | Reject negative rates or show the stated range and transformation explicitly; reconcile with project-wide integrity checks |
| Finish & Care Guide | Fibre switching is stateful, but default copy contains awkward text such as “You can substitute or any yarn…”; dense small controls | P2 | Add copy QA, fibre/blend test coverage, larger mobile targets, and clearer “follow the ball band” framing |
| Deals | Negative rate/costs/price/sales produced contradictory deltas and repeated `Take` verdicts | **P0** | Shared semantic validation; verdict must be a pure, consistent function of displayed numbers |
| Launch Campaign | Past dates, malformed and `javascript:` URLs, HTML-like coupon, and 200% coupon accepted; invalid links still counted toward `7/7` | **P0** | Validate date, URL scheme/host, coupon bounds, and suppress readiness/copy from invalid state |
| Trunk Show | Impossible rates, percentages, costs, dates, and counts produced positive net, `$232.63/hr`, and `GO` | **P0** | Hard bounds and a global invalid-state gate before any recommendation or task generation |
| Translation & Bundle | Negative word count silently remained/normalized to `2000`; no-partner default still showed `2150% upside` and `Say yes` | P0 | Require partner/audience/baseline inputs; distinguish normalized values; do not recommend from an ungrounded solo scenario |
| Pattern Club | Negative prices/members/costs, 200% churn and channel fee produced positive club net and `Launch it` | **P0** | Validate prices, counts, rates, churn, and fees; invalidate rather than optimize impossible terms |
| Kit Economics | Negative costs/prices and shares produced “best channel” output and an agreement containing negative prices and `200/-100 split` | **P0** | Block calculation and agreement generation until all economics are valid |
| Submission Pipeline | `Add call` created a draft before required fields were complete; malformed text, dates, negative fee, and negative exclusivity persisted | **P0** | Create only an explicit unsaved draft or validate before persistence; enforce chronological/date and fee bounds |
| KAL & Collab ROI | 18 extreme inputs accepted; gross revenue reached `$109,999,998,881`, while standard “loses cash” copy remained | **P0** | Reject outliers and contradictory terms; expose assumptions and prevent generic verdicts from surviving invalid state |
| Channels / Funnel Planner | Negative audience/sales with extreme spend and conversion produced `GO`, `$999,999,684`, and `999999684.0/hr`; duplicate labels observed | **P0** | Validate funnel monotonicity and rates; suppress recommendation; remove duplicate/ambiguous fields |
| Club Revenue | Bleeding/invalid churn and economics were still evaluated; negative inputs remained part of the model | P1 | Add churn and price bounds, explicit invalid state, and a no-copy/no-verdict rule |
| Wholesale & Book | Impossible terms produced `Infinity` breakeven, negative hours, and polished `MAYBE` guidance | **P0** | Handle zero denominators explicitly; never render Infinity or negative labour guidance as a valid scenario |
| Hire vs Self | Negative rates/fees were silently converted to zero in parts of the model; conservative `SELF` recommendation still issued | P1 | Preserve invalid status instead of coercing to zero; explain why no recommendation is available |
| Inclusive Sizing | Negative price/sales/design rate and `-2` grade rule contaminated adaptive-modification and launch copy | **P0** | Validate grade semantics and all prices/rates; quarantine customer-facing copy |
| Licence It | Negative economics produced `8/8 passed`, `GO`, negative labour floor, and approval reply | **P0** | Separate rights checks from commercial approval; block approval copy when economic terms are invalid |
| Membership Planner | Negative tier prices/member counts and churn above 100% generated negative-price paste-ready tier copy | **P0** | Enforce tier price/member/churn ranges; disable copy until the plan is valid |
| Promo | Negative price/budget produced `MAYBE` and an impossible kill rule | P1 | Bound price, spend, and kill-rule inputs; show `Invalid` rather than a business recommendation |
| PriceWin | Negative demand generated negative sales in launch/listing output | **P0** | Validate demand and suppress launch copy; test rendered copy, not only calculations |
| Repeat | Invalid acquisition assumptions leaked `NaN` into cold-acquisition cost while retention guidance remained available | **P0** | Guard every denominator and non-finite result; render an explicit incomplete state |
| Mix | Negative sales/prices/rates produced negative platform sales counts and a platform recommendation | **P0** | Validate sign semantics and reconcile platform totals before recommendation |
| Collab | `999 months` exclusivity and zeroed economics produced `Take it` and a `$0` reply | **P0** | Hard-cap or require explicit confirmation for rights terms; block contract copy from invalid inputs |
| Book It | Negative prices/copies/budgets produced `SKIP` but still generated copy containing the invalid values | P1 | Quarantine all copy/export controls in invalid state, even when the verdict is conservative |
| Protect | Negative response budget was described as “worth it”; readiness remained `UNREADY` | P1 | Validate risk-budget economics and distinguish legal/rights guidance from financial recommendation |
| Teach It | Invalid terms normalized to zero but still returned `launch`, `$7,488/hr`, and `89940×` claims | **P0** | Reject invalid teaching economics and block launch copy |
| Partners | Invalid deal inputs normalized to zero and returned `rethink`; safer verdict, but agreement copy remained available | P1 | Keep the safer block behavior and disable agreement generation until valid |
| Yarn Buy | Negative yardage, price, stash, and skein weight remained visible; generic prompt only | P1 | Add field-level constraints and explain why no purchase result is available |
| KAL Planner | Default `HOLD`, explicit unpaid-labour warning, and negative P&L were comparatively honest | P1 | Retain the cautious verdict; still add bounds and disclose heuristic assumptions |
| Grading Lab | Core view can show `Ready` while invalid/out-of-scope project data exists elsewhere | **P0** | Add project-wide integrity gate; `Ready` must mean all relevant project data passes validation |
| Chart Lab | Empty graded base count could coexist with `Ready`; extreme repeat/selvedge values reached generated chart text | **P0** | Use `Incomplete` until required inputs exist; validate repeats and generated instruction bounds |
| Test Knit Desk | Negative rate/tester count were silently normalized to zero; readiness blocking behavior was safer than the false-positive calculators | P1 | Keep blocking incomplete readiness, but show explicit validation and preserve invalid-vs-zero distinction |
| Submissions | Detailed assumptions, honest `NO`, negative net/effective rate, and break-even fee were visible | P1 | Relative strength; add the same input gate and keep copy unavailable when terms are invalid |
| Payback Lab | `-999999` hourly rate remained accepted after Apply; empty ledger masked downstream effect | **P0** | Validate core rate before Apply; test with populated ledger data; block recoupment outputs until valid |
| Gauge & Fit | Zero/negative gauge and target circumference ended up as zero values with no error; fit advice remained available | **P0** | Require positive finite denominators; suppress translation/advice until a valid gauge exists |
| Listing SEO | Markup-like title/tags, negative price/sizes, and extreme photo count accepted; malformed tag text entered paste-ready kit | **P0** | Sanitize and validate title/tags/price/sizes; block copy kit and export from invalid state |
| Ad Break-Even | Zero CPC/conversion and negative price/revenue produced infinite ROAS, negative daily profit, and a best-channel recommendation | **P0** | Guard denominators and rates; no channel ranking without valid economics |
| Sample & Launch | Negative sample costs, labour, price, sales, booth spend, and timing produced a zero-basis success/readiness style | P1 | Validate all assumptions; false-success styling should become P0 if interpreted as approval |
| Collab Deal Math | Negative fees/royalties/sales/hours/exclusivity generated negative counter-offer amounts and paste-ready negotiation copy | **P0** | Block copy and negotiation recommendation; enforce royalty and term ranges |
| Photo ROI | Negative inputs collapsed the cost basis and still supported a “pay for itself” claim | P1 | Prevent zero-cost recommendations; require positive counts and valid cost/reach assumptions |
| Video & Social | Invalid funnel inputs collapsed to a zero plan and zero-hour verdict; no invalid state | P1 | Distinguish zero from invalid; validate audience, workload, price, fee, and sales relationships |
| Show ROI | Negative event inputs were zeroed and a zero-fee event still appeared “cleared” against a 7× fee target | P1 | Validate event costs/attendance/fees; suppress booking verdicts when fee or denominator is zero |
| Wholesale Lab | Eleven-field boundary fill appeared stale; an individual `-10` attempt resulted in `0.310` and changed economics without explanation | P1 | Fix controlled-input integrity and make transformations explicit; add semantic validation to all SKU economics |
| Design Ledger | Negative `$-999999` cost and script-like description remained in form; record click produced no persisted row and no error | P1 | Validate before record; show success/failure state and field-local errors |
| Receipt Lab | 1900 date, negative quantity/price/tax/fees/shipping and script-like text rendered in live receipt; Save to ledger clicked but remained `Ledger (0)` with no feedback | **P0** | Validate receipt fields, sanitize output, and make save success/failure unambiguous before presenting share actions |

The table demonstrates why isolated module patches are insufficient. The same defect family appears in pricing, rights, launch, marketing, wholesale, events, copy generation, and accounting-adjacent workflows.

## New findings not present, or not fully established, in the first report

### 1. Blank render or crash during module switching

A module switch in the extended pass produced a blank render/state before recovery. The exact trigger was not fully isolated, so this should not be overstated as a reproducible crash yet. It is nevertheless direct evidence of an unhandled render or lazy-module failure path. Recovery depended on navigation/reload behavior rather than a visible retry or error boundary.

For a SPA with many lazy-loaded feature bundles, every module boundary needs an error boundary, loading state, and retry action. A blank workspace is worse than a readable error because it removes the user’s explanation and next action.

### 2. `NaN` and `Infinity` leak into user-facing business output

Repeat emitted `NaN` for cold-acquisition cost. Wholesale & Book emitted `Infinity` in a breakeven narrative. These are not merely ugly formatting issues. They show that non-finite arithmetic results are reaching presentation and recommendation layers. Every calculator needs a final finite-number assertion in addition to field validation, because valid-looking fields can still create zero denominators or invalid combinations.

### 3. Paste-ready copy is not treated as a privileged output

Invalid values reached listing kits, negotiation letters, agreement language, launch text, tier descriptions, receipts, and approval replies. Some modules correctly produced a conservative verdict but still exposed copy containing the invalid premise. A `SKIP` or `NO` verdict is not enough if the user can immediately copy malformed material.

The product needs a universal `copyable === valid && finite && complete` rule. Copy buttons should be disabled or replaced with a diagnostic explanation whenever any source field is invalid, unresolved, out of range, or semantically contradictory.

### 4. Pipeline persistence begins before validation

`Add call` created an `Untitled call` record before the form was complete. The record then accepted malformed publication text, out-of-order dates, negative exclusivity, and a negative fee. That is a workflow-integrity problem, not only a field-validation problem. The application should distinguish an unsaved draft from a durable record and should make the transition explicit.

The malformed test record was removed after evidence capture. The exact localStorage key was `stitch-and-scale-submitpipe-sample-crew-neck-sweater`; the call count was reduced from `1` to `0`, and the rates object was preserved.

### 5. Silent normalization makes zero and invalid indistinguishable

Gauge & Fit, Test Knit Desk, Hire vs Self, Translation & Bundle, and several financial labs normalized invalid values to zero or other visible values. This creates a dangerous semantic collision: a user who intentionally enters zero, a user who types a negative number, and a user whose field is cleared can all appear to be in the same state. Models should preserve an explicit validation status alongside each value, not use coercion as a substitute for validation.

### 6. Save operations can fail without telling the user

Design Ledger and Receipt Lab both showed opaque save behavior under malformed input. Receipt Lab’s `Save to ledger` activation left `Ledger (0)` with no error or confirmation, while the malformed preview remained visible. Even if the implementation intentionally rejected the record, the user was not told. A save action must always resolve to a visible success, validation error, or system failure state.

## Capability versus claim alignment

### What the product genuinely demonstrates

The core product concept is real and valuable. The sample project, editable sections, transparent size walk, nine-size grading table, preview templates, and stateful preview controls provide the clearest evidence of product capability. Tech Edit offers specific findings rather than generic encouragement. Submissions exposes assumptions and delivers an honest default `NO`. KAL Planner also tends toward `HOLD` and explicitly recognizes unpaid labour. These are useful foundations.

The local-first architecture is not fictional: a service worker at `/sw.js` was active, the central project store existed in IndexedDB’s `keyval-store`, and per-Lab state was persisted through numerous localStorage keys. This supports an offline-oriented product model, but it also means the integrity problem is durable rather than ephemeral.

### Where claims overreach

| Product implication or claim | Audit alignment | Required wording or product change |
|---|---|---|
| “Works offline — full functionality” | Shell caching and local persistence observed; export, deep-link portability, and every lazy Lab were not proven equivalent offline | Narrow to core editing/local work unless offline behavior is verified module by module |
| “Professional knitwear grading software” | Core grading is promising, but corrupt project data can coexist with `Ready` | Add a global integrity gate and make the professional claim conditional on valid data |
| “Publish-ready PDF exports” | Preview is polished, but export has fragile completion behavior and draft tokens can remain unresolved | Use “professional PDF preview/export” until deterministic export and token checks exist |
| `Ready`, `No flags`, `GO`, `Take it`, `Launch it` | These labels can survive invalid premises | Scope verdicts explicitly, e.g. `Ready for checked grading rules`, or suppress them in invalid state |
| “Transparent Math” | Formulas may be visible, but silently transformed inputs and contradictory narrative deltas undermine transparency | Show normalized values, assumptions, validation status, and formula inputs used |
| “Local only” | Correctly signals no account/server dependency, but URLs look shareable and fail on clean profiles | Explain that projects are device-local, or provide portable project artifacts |

The tone should remain confident. The fix is not timid marketing; it is **precise confidence boundaries**. Premium language is persuasive only when the application is equally disciplined about when it refuses to answer.

## Mobile and interaction assessment

At 390×844 and 412×915, the visual system remains attractive, but the app is overloaded by a horizontally scrolling rail containing more than eighty modules. Core editing, grading, export, and secondary business planning are presented as peers. On a phone, that creates discovery cost and makes the product feel like a compressed desktop application.

The first-pass mobile capture also showed the fixed bottom onboarding footer obscuring content. The dense tab rail and small controls should be measured against WCAG 2.2 target-size guidance, whose minimum pointer-target criterion is 24×24 CSS pixels with spacing exceptions [1]. For primary mobile actions, a larger practical target is preferable.

The mobile information architecture should be split into a small primary workflow—Project, Sections, Preview, Draft, Grading, Test Knit, Export—and a secondary Lab catalogue with search, grouping, recent tools, and explicit confidence labels such as `Core`, `Planning`, `Experimental`, or `Advisory`.

## Relative strengths worth preserving

| Strength | Why it matters | Preserve while fixing |
|---|---|---|
| Core Grading Lab | Clear size progression and useful inspection surface | Keep transparent output, but add global validity state |
| Submissions | Detailed assumptions and honest default `NO` rather than forced optimism | Add bounds without removing the explanatory model |
| KAL Planner | `HOLD` behavior and unpaid-labour recognition are comparatively responsible | Preserve cautious verdict language and disclose heuristics |
| Test Knit Desk | Incomplete readiness is blocked more safely than in many business calculators | Replace silent normalization with explicit field errors |
| Tech Edit | Specific finding, score, and actionable pre-edit summary | Integrate with global integrity checks |
| Local-first foundation | Real persistence and service-worker shell caching support the product thesis | Add migrations, reset tooling, integrity scans, and portable backup/export |
| Visual tone | Distinctive craft/technical identity | Keep the premium aesthetic, but earn its certainty labels |

## Updated remediation priorities

### P0 — Stop unsafe decision output before adding breadth

1. **Build one shared semantic-validation layer.** Every field needs type, requiredness, finite-number status, minimum/maximum, unit, and domain rule. Examples include nonnegative money, positive denominators, percentages between 0 and 100 where applicable, nonnegative counts, nonnegative duration, and chronological date relationships.

2. **Add a global project-integrity gate.** Before `Ready`, `No flags`, `Publish`, `Export`, `GO`, `Take it`, `Launch it`, or any financial recommendation, scan all relevant project and Lab state. The gate must distinguish “not applicable” from “not checked,” “incomplete,” and “invalid.” A module checking only its known subset must not certify the whole project.

3. **Make invalid state contagious to outputs.** Invalid, incomplete, non-finite, or contradictory assumptions must suppress verdicts, rankings, generated tasks, copy, agreement language, receipts, and exports. A conservative verdict is not sufficient if malformed copy remains copyable.

4. **Eliminate `NaN`, `Infinity`, and negative-zero-style business outputs.** Add calculation-level assertions and tests for zero denominators, empty datasets, negative values, extreme values, and inconsistent totals. Never stringify non-finite results into user-facing prose.

5. **Fix rights/deal/licensing recommendation gates.** Licence It, Collab, Deals, Collab Deal Math, Partners, and related modules influence contracts or rights. They must not issue acceptance language from invalid or incomplete commercial terms.

6. **Fix core grading readiness semantics.** A project containing an impossible measurement must not pass downstream grading or present `Ready` merely because the invalid field is outside the selected grading subset.

7. **Add error boundaries for lazy modules.** A blank render must become an identifiable error state with retry and recovery options. Capture the failing module and preserve unsaved state where possible.

8. **Make persistence actions transactional and explicit.** Record/save actions must validate before durable write, and every attempted save must visibly resolve to success, validation failure, or system failure.

### P1 — Make the corrected core usable and auditable

1. Replace silent coercion with field-level errors that identify the entered value, the allowed range, and the unit. Preserve invalid status instead of silently converting negative values to zero.

2. Add a shared assumptions panel to every calculator showing the exact values used after normalization, any derived assumptions, and the reason a result is unavailable.

3. Add automated property-based and boundary tests across all calculators. At minimum, test negative, zero, empty, decimal, very large, non-finite, out-of-range percentage, invalid date, malformed URL, and invalid text cases.

4. Create a universal output policy: no copy, share, export, or “ready-to-send” action while the source model is invalid, incomplete, or non-finite.

5. Separate durable records from unsaved drafts in Pipeline and every other form with a save action. Add explicit delete/reset controls and a visible audit trail for local changes.

6. Improve local-only semantics. Provide a portable backup/import path or explain that project URLs are local route pointers and cannot be expected to work on a clean device.

7. Reduce and regroup mobile navigation. Keep the primary workflow short; move the Lab catalogue behind search, categories, recent tools, and confidence/status labels.

8. Fix inconsistent narrative arithmetic. A verdict and displayed delta must be generated from the same normalized values and formula result; contradictory prose is a direct trust break.

### P2 — Improve polish, accessibility, and credibility after safety is fixed

1. Repair awkward generated copy and test every fibre, blend, membership, launch, and agreement variant.

2. Add visible source/provenance notes for benchmark claims, heuristics, and “typical” conversion or subscriber figures.

3. Fix sticky-footer overlap, dense mobile controls, unlabeled inputs, zero-sized controls, and field associations. These issues should be evaluated against WCAG 2.2 guidance [1].

4. Restrict wildcard CORS before introducing cloud data or APIs. `Access-Control-Allow-Origin: *` is unnecessarily broad for a future authenticated or user-data service.

5. Improve SPA not-found behavior and monitoring semantics so nonexistent routes do not look like successful HTTP 200 application loads.

## Verification criteria for a credible next release

The next release should not be judged by whether it contains more Labs. It should be judged by whether the following tests pass:

| Gate | Acceptance criterion |
|---|---|
| Invalid number | Negative price, count, rate, duration, or cost produces a field error and no calculated recommendation |
| Invalid percentage | Values below 0 or above 100 are rejected unless the domain explicitly permits another range |
| Zero denominator | ROAS, hourly rate, break-even, and per-unit outputs show `Unavailable` or `Incomplete`, never `NaN` or `Infinity` |
| Invalid date | Past/future and chronological rules are enforced according to the module’s stated purpose |
| Invalid URL/text | Unsafe URL schemes are rejected; text is encoded; length/allowlist policy is explicit |
| Copy safety | Every copy/share/export control is disabled while any source input is invalid or unresolved |
| Persistence | Invalid records are not written; successful writes show confirmation; failed writes show the reason |
| Global readiness | Any invalid relevant project data prevents global `Ready`, `Publish`, and `Export` certification |
| Mobile | Primary controls are comfortably tappable; sticky elements do not obscure content; Lab navigation is discoverable |
| Recovery | Lazy-module failure renders an error boundary with retry rather than a blank screen |

## Cleanup and evidence integrity

The malformed Pipeline test artifact was removed after evidence capture. The exact call had `id: call-mt26roof`, publication `<script>Bad Pub</script>`, out-of-order dates, `exclusiveMonths: -5`, and `fee: -100`. It was stored in `stitch-and-scale-submitpipe-sample-crew-neck-sweater` rather than the central project list.

Post-cleanup verification found no remaining `Bad Pub` or `call-mt26roof` markers in localStorage. The Pipeline key retained its rates object and contained zero calls. The sample project records were preserved. The browser still showed the active `/sw.js` service worker and the expected central `keyval-store` IndexedDB database plus per-Lab localStorage state.

The supporting evidence log remains at `/home/ubuntu/stitch_scale_audit_notes.md`. It contains timestamped observations, exact malformed values, rendered outputs, and storage findings from both audit passes.

## Final conclusion

Stitch & Scale Pro has a real product idea, a strong visual identity, and a promising core grading workflow. The extended audit also shows that its current breadth is masking a fundamental reliability gap. The app is willing to answer questions it should refuse to answer, and it often expresses those answers in polished, operational language.

The most important next move is therefore not another Lab. It is a **trust layer**: shared semantic validation, global integrity status, finite-number guards, output quarantine, explicit persistence outcomes, and automated boundary testing. Once that exists, the existing breadth becomes an asset. Before it exists, the breadth is a liability because it multiplies the number of places where impossible inputs can become credible-looking advice.

The product should keep its ambition and its premium tone. It should stop pretending that every calculated output is a trustworthy answer.

## References

[1]: https://www.w3.org/TR/WCAG22/#target-size-minimum "W3C Web Content Accessibility Guidelines (WCAG) 2.2 — Success Criterion 2.5.8: Target Size (Minimum)"

[2]: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html "OWASP Input Validation Cheat Sheet"

[3]: https://stitch-and-scale-pro-api-server.vercel.app/ "Stitch & Scale Pro live application"

## Supporting evidence

The detailed evidence log accompanying this report is available at `/home/ubuntu/stitch_scale_audit_notes.md`. The first-pass report is available at `/home/ubuntu/stitch_scale_brutal_audit.md`.

**Checkpoint preserved:** the earlier novel-invention work remains separate and unchanged, including `/home/ubuntu/first_novel_invention_brief.md` for the modular non-load-bearing assistive-tech accessory interface concept.
