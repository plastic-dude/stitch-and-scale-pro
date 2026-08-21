# Stitch & Scale Pro — Brutal Mobile and Resilience Audit

**Target:** [stitch-and-scale-pro-api-server.vercel.app](https://stitch-and-scale-pro-api-server.vercel.app/)  
**Audit date:** 21 August 2026  
**Scope:** Mobile-like layout, onboarding, core grading, export, calculators, draft parsing, data integrity, persistence, route behavior, accessibility, capability, strength, and tone.  
**Method:** Hands-on browser testing, 390×844 iPhone-like captures, route and header checks, malformed-input tests, local persistence inspection, service-worker inspection, and comparison against W3C and OWASP guidance. This was an adversarial product audit, not a formal penetration test or high-volume load test.

## Executive verdict

**Stitch & Scale is a visually convincing, unusually ambitious prototype that is not yet trustworthy enough to call itself professional production software.** Its strongest work is the core grading presentation, local-first architecture, sample-led onboarding, and polished export concept. Its most serious weakness is not cosmetic: the app accepts impossible domain data, saves it, carries it into the full grading table, and can still report a clean `Ready` result downstream.

The blunt version is this: **the app looks more mature than its validation model is.** A designer could be encouraged by the interface, enter bad measurements or business assumptions, receive clean-looking numbers, and export or act on them without the product clearly saying that the inputs are invalid. That is a trust failure, not a minor UX imperfection.

I would classify the current product as **an attractive internal alpha or advanced prototype**. I would not recommend positioning it as “professional,” “publish-ready,” or “full functionality offline” until the integrity and export paths are corrected and tested systematically.

| Dimension | Judgment | Confidence |
|---|---|---:|
| Visual polish | Strong and distinctive | High |
| Onboarding clarity | Good, but longer and more promotional than necessary | High |
| Core grading presentation | Promising and easy to inspect | High |
| Data integrity | **Unsafe for professional use** | High |
| Calculator trustworthiness | **Unsafe with invalid inputs** | High |
| Mobile usability | Usable for reading, weak for dense editing and navigation | High |
| Export reliability | Promising preview; fragile completion path | Medium–high |
| Offline/local-first foundation | Real shell caching and local persistence observed | High |
| Capability breadth | Extremely broad; depth and prioritization are questionable | High |
| Product tone | Confident and premium, sometimes overclaiming | High |
| Production readiness | **Not ready** | High |

## What was tested

The audit exercised onboarding, the sample project, Sections, Preview, Draft, Pricing, Income, Publish, Grading Lab, Chart Lab, Test Knit Desk, Payback Lab, the full grading table, PDF export, mobile-like captures, direct deep links, route behavior, persistence, malformed placeholders, impossible numbers, path-like filenames, and the local service-worker/cache layer.

The visible workspace contains **more than eighty modules and labs**, ranging from core pattern functions to pricing, marketing, wholesale, partnerships, licensing, workshops, memberships, and launch planning. This is evidence of a large product vision. It is not evidence that every module is equally deep, reliable, or ready for professional reliance.

## Severity-ranked findings

| ID | Severity | Finding | User impact | Recommended owner/order |
|---|---|---|---|---|
| F-01 | **P0 — Critical** | Impossible physical measurement accepted and persisted | Corrupt project data can be treated as valid | Fix before any professional claim |
| F-02 | **P0 — Critical** | Downstream Grading Lab still reports `Ready` despite corrupt saved data | Users receive a false quality signal | Add project-wide integrity gate |
| F-03 | **P0 — Critical** | Financial calculators accept negative or nonsensical inputs and return clean-looking outputs | Pricing and income decisions can be misleading | Add semantic validation and invalid states |
| F-04 | **P0 — Critical** | PDF export can remain stuck at `Preparing your PDF…` after the action | Users cannot tell whether export succeeded or failed | Add deterministic download/fallback/error timeout |
| F-05 | **P1 — High** | Export filename accepts path-like and special characters without visible normalization | Confusing downloads, portability issues, possible future path-handling risk | Sanitize and preview final basename |
| F-06 | **P1 — High** | Mobile deep links do not represent portable project access | Shared grading/PDF links show onboarding or `Project Not Found` on a fresh device | Make local-only semantics explicit or provide portable artifacts |
| F-07 | **P1 — High** | Extremely dense horizontal module navigation | Discoverability and touch interaction degrade sharply on mobile | Reduce primary navigation and add search/progressive disclosure |
| F-08 | **P1 — High** | Chart Lab can show `Ready` while its graded base count is empty | Users may trust an incomplete chart validation | Use `Incomplete`/`Needs input`, not `Ready` |
| F-09 | **P1 — High** | Draft placeholder failure modes are inconsistent | Raw unresolved tokens may leak into published patterns | Add pre-export token validation and one error policy |
| F-10 | **P2 — Medium** | Sticky mobile onboarding footer obscures content | Users can miss or struggle to read commitments | Add safe-area/padding and avoid overlap |
| F-11 | **P2 — Medium** | Core form errors are generic rather than field-specific | Users must guess which field needs correction | Use field-local errors and accessible associations |
| F-12 | **P2 — Medium** | Professional benchmark claims lack visible methodology | Credibility is weakened | Label assumptions, sources, and uncertainty |
| F-13 | **P2 — Medium** | Wildcard CORS is broader than necessary | Future API/cloud-sync risk if the same policy persists | Restrict origins when APIs become real |
| F-14 | **P2 — Medium** | Server returns SPA shell with HTTP 200 for nonexistent paths | Monitoring, indexing, and diagnostics become weaker | Add client not-found state and consider server fallback strategy |

## Critical evidence

### 1. The app saved a physically impossible measurement

In the core measurement editor, I entered the label `<<invalid & label>>` and a base value of `-9`. The app displayed the row in the project table, showed `Saved`, and confirmed that the item was added. The malformed label was safely rendered as text rather than executed markup, which is positive output-encoding behavior. However, the semantic value was still accepted and persisted.

The same invalid row later appeared in the full grading table as a complete nine-size grade: `-85`, `-65`, `-45`, `-25`, `-5`, `15`, `35`, `55`, `75` stitches. A knitting measurement cannot be negative. This is not an edge case that should be left to user judgment; it should be impossible to save.

The local-first architecture made the problem durable: the corrupt row was stored in IndexedDB under `keyval-store`, key `stitch-and-scale-v1`. I removed only the exact injected test row after capturing the evidence, and verified that the sample workspace returned to its original two-measurement Neckline state.

### 2. The quality gate did not detect the corrupt data

After the invalid measurement was saved, Grading Lab still showed `Ready`, `All 9 size(s) grade cleanly`, `0.0cm` maximum ease drift, and `No flags`. The lab appears to validate only the subset of measurements it knows how to grade, while the project can contain other invalid measurements outside that path.

This reveals a dangerous distinction the product does not currently explain: **“the known grading subset is computable” is not the same as “the project is valid.”** The application needs a global integrity layer that runs before any `Ready`, `Publish`, `Export`, or “no flags” verdict.

### 3. Financial calculators silently accept invalid assumptions

Pricing Advisor accepted a negative current price of `-100`, zero hours, and an hourly rate of `999999`. It showed a recommended price of `$10.00`, a cost-plus floor of `$0.00`, and “At or above floor,” while the visible comparison normalized the negative input to `$0.00`. That is internally inconsistent: the field says one thing and the result behaves as if another value was entered.

Income Planner accepted a negative pattern price, zero sales, one million design hours, and an hourly rate of `999999`. It returned clean-looking `$0.00` outputs and a `0%` effective-fee result rather than an invalid-input state. Zero sales and an invalid negative price are not equivalent conditions, but the UI collapses them.

This is especially serious because the product speaks in business and pricing language. The calculators need explicit domain constraints, such as positive price, nonnegative sales, finite and bounded hours/rates, and clear handling for “no sales yet.” They must never display a reassuring financial answer when the model was not meaningfully evaluated.

### 4. Chart Lab contains a false-positive default verdict

Chart Lab displayed `Ready`, `1/1` rows balancing, and `0 st` maximum drift while its principal input, `Graded base stitch count`, was empty. Lower on the same module, the app correctly said there was no graded count to check against. The top-level verdict is therefore contradictory.

When stressed with base count `0`, repeat count `0`, selvedge-before `-10`, and selvedge-after `999999`, the calculation did not crash and eventually showed `Review` with a useful mismatch warning. That resilience is good. The form still allowed impossible values into the model, and the prose generator emitted `k 999999 times`, which is computationally traceable but not practically safe pattern output.

### 5. Draft parsing is more resilient than the numeric model, but not publication-safe

The Draft module resolved valid `{Name}` and `{Size.bust}` placeholders correctly. Repeated `{Size.M.bust.stitch}` resolved consistently. Missing `{Size.NOPE}` became an em dash, while `{Unknown.token}` remained visible. Malformed `{Size.bust` remained visible, and `{{Name}}` produced `{Classic Crew Neck Sweater}`.

This is better than silently inventing values, but it is not a professional publication policy. The product needs one predictable rule: unresolved, malformed, or ambiguous tokens should be highlighted and block export until the user explicitly resolves them. Raw template syntax should never be allowed to leak into a customer-facing pattern by accident.

## Mobile-like audit

### Root onboarding at 390×844

The mobile layout is visually attractive and focused, but the PWA install prompt consumes top-of-screen attention before the user understands the product. More importantly, the fixed bottom navigation overlaps the lower onboarding content: part of the commitments card is hidden behind the sticky footer. This is a concrete mobile layout defect, not merely a preference issue.

The prominent claims are “Works offline — full functionality,” “no account needed,” and local-first ownership. These are strong and appealing, but they create a high verification burden. A product that makes those claims must give the user a reliable recovery path when local data is missing.

### Mobile navigation and content density

The workspace presents a very large horizontally scrolling tab strip. This can work for a desktop power tool, but on a 390px viewport it makes the product feel like a compressed desktop application rather than a mobile workflow. The core actions—Sections, Preview, Draft, Grading, Chart, Test Knit, and Export—are mixed with dozens of secondary business labs.

W3C WCAG 2.2’s target-size guidance sets a minimum pointer-target criterion of 24×24 CSS pixels with spacing exceptions, while also recognizing that larger targets are preferable for important controls [1]. The app’s dense tab rail and small switches should be measured against that requirement; more importantly, the interaction burden suggests a practical target closer to comfortable thumb-sized controls for primary actions.

### Clean-profile deep links

At 390×844 with no onboarding/local project state, a direct link to `/project/sample-crew-neck-sweater` showed onboarding rather than preserving the intended project destination. Direct links to `/project/sample-crew-neck-sweater/grading` and `/project/sample-crew-neck-sweater/pdf` showed `Project Not Found`.

This behavior is understandable for a local-only product, but it conflicts with the mental model of a URL. A URL appears shareable; a local-only project is not. The product must choose and state a model clearly: either provide portable project files/encoded read-only views, or treat project URLs as local route pointers and explain why they cannot work on another device.

## Capability, strength, and depth

The app’s strongest capability is not the number of labs; it is the combination of a coherent sample project, transparent size-walk output, editable measurement sections, and a credible export concept. Grading Lab exposes nine sizes from XS through 5XL and shows the stitch progression, ease drift, and repeat alignment. That is the clearest proof of product value found in the audit.

The PDF preview is also a strong product surface. The Technical / Blueprint template visibly changes the preview, and toggling Gauge Summary changed the page count from six pages to five. These are real stateful interactions, not static screenshots. The preview looks professional enough to create a positive first impression.

The weakness is the gap between breadth and depth. The interface exposes more than eighty modules, but the onboarding teaches only five concepts: Dashboard, Sections, Measurements, Preview, and Export. A new user is likely to ask: **Which of these tools is essential, which is experimental, and which can I trust?** The current product answers that poorly. A large surface area can signal ambition, but it can also signal an unpruned backlog rendered as navigation.

The app should reduce the first-run product to a small, dependable core and progressively reveal the business-lab universe. The product does not need fewer ideas; it needs stronger hierarchy and clearer confidence boundaries.

## Tone assessment

The tone is **confident, premium, craft-aware, and commercially ambitious**. Phrases such as “Professional knitwear grading software,” “Transparent Math,” “publish-ready PDF exports,” “A premium tool,” and “full functionality” create a clear identity. The dark visual system, serif display treatment, technical tables, and vocabulary of grading, gauge, pattern notes, and test knitting support that identity.

The tone becomes too assertive when the implementation has not earned the claim. `Ready` and `No flags` are especially dangerous when invalid data can coexist with them. “Publish-ready” is also too strong while unresolved placeholders, impossible values, and a browser-dependent export handoff remain possible. The right adjustment is not to make the brand timid; it is to make claims precise.

| Current tone | Safer, stronger alternative |
|---|---|
| “Works offline — full functionality” | “Designed for local-first work; core editing is available offline. Verify export and browser support on your device.” |
| “Publish-ready PDF exports” | “Professional PDF layouts with print/export preview.” |
| “Ready” | “Ready for grading checks” or “Complete after integrity checks.” |
| “No flags” | “No flags in the checked grading rules; 3 measurements not checked” where applicable |
| “A freelancer would charge $135–$225” | “Illustrative benchmark: $135–$225, based on stated assumptions” |

## Accessibility and validation benchmark

W3C guidance says an input error must identify the erroneous item and describe the error in text [2]. OWASP recommends allowlist and semantic validation as early as possible, rather than allowing malformed or impossible data to flow into downstream calculations [3]. Against those benchmarks, the app’s generic `Add a label and a base value to save` message is a basic guard, but it is not field-specific. The pricing, income, chart, and measurement modules fall short because they permit impossible values without a visible invalid state.

The positive finding is that the app did not visibly execute the angle brackets in the malformed measurement label; the value was rendered as text. The negative finding is that output encoding was better than domain validation. Both are required for a trustworthy professional tool.

## Prioritized remediation plan

### P0: Make invalid state impossible to trust

Implement a shared schema for every domain object: measurements, grading keys, chart rows, pricing assumptions, income assumptions, test-knit schedules, and export settings. Validate syntax and semantics on input, on save, on calculation, on project load, and before export. Reject negative physical dimensions, zero or missing required counts, impossible repeats, negative prices, non-finite rates, and invalid deadlines.

Add a project-wide integrity status. Any invalid or unknown object should produce `Needs attention`, not `Ready`. Every lab should state what it checked and what it did not check. A global gate should prevent `Publish`, `Export`, and “no flags” claims until the project passes integrity checks or the user deliberately exports a clearly marked draft.

Add regression tests for the exact cases discovered here: negative measurements, negative prices, zero sales, extreme rates, zero chart counts, negative selvedges, malformed placeholders, missing placeholders, and path-like filenames. Include property-based tests for numeric boundaries and fuzz tests for token parsing.

### P0: Make export deterministic and safe

Sanitize filenames to a safe basename before showing them in the UI. Remove path separators, control characters, unsupported punctuation, and leading dots; enforce a length limit; and show the final filename. Do not rely on browser download behavior to repair unsafe input.

Replace the indefinite `Preparing your PDF…` state with a bounded state machine: preparing, ready, print dialog opened, completed, blocked, or failed. If `window.print()` cannot be confirmed, offer a direct browser-print fallback, an HTML print view, or a generated file path. Test this on iOS Safari, Android Chrome, desktop Chromium, and the installed PWA.

### P1: Redesign the mobile information architecture

Keep a compact primary navigation with perhaps Sections, Preview, Draft, Grading, and Export. Put business labs behind a searchable “More tools” surface with categories and recent/favorite tools. Preserve the rich capability breadth, but stop presenting the entire product as one undifferentiated horizontal rail.

Remove sticky-foot overlap using safe-area-aware bottom padding. Measure every primary touch target and ensure at least the WCAG minimum, while aiming for comfortable thumb use. Make the active tab, horizontal scroll position, and current workflow context obvious.

### P1: Fix local-only URL semantics

For a local-only app, project routes should communicate that they require local state. A shared route should either include a portable project artifact, offer an import/recovery flow, or render an explanatory page rather than a generic `Project Not Found`. Preserve the intended destination through onboarding when possible.

Add explicit backup/restore validation. Test a round trip: create project, export JSON, clear storage, open route, import JSON, verify measurements, grading, draft, and PDF all recover consistently.

### P1: Make calculators honest

Every calculator should distinguish blank, zero, negative, non-finite, and extreme values. Show the formula inputs and assumptions beside the result. Never clamp an invalid number into a valid-looking comparison without telling the user. Treat zero sales as a valid scenario only when price and model inputs are valid; treat negative price as invalid.

### P2: Put publication safety around Draft

Add a visible unresolved-token panel. Show token name, location, and suggested correction. Block final export when malformed or unresolved tokens remain, while allowing an explicitly labeled diagnostic draft. Define one consistent rule for missing tokens instead of mixing em dashes, raw tokens, and partially escaped output.

### P2: Clarify claims and sources

Label benchmark figures, market rates, ease bands, and sizing standards with their assumptions or source. In particular, the `$135–$225` freelancer-cost claim needs a methodology or softer wording. Separate “checked by this lab” from “validated for publication.”

### P2: Tighten web delivery policy

The audit observed `Access-Control-Allow-Origin: *` on the shell response. This is not by itself a demonstrated vulnerability for a client-only shell, but it is broader than necessary and should not be carried into future credentialed or cloud-sync APIs. Restrict origins and credentials deliberately when networked features arrive. Add a clear client-side not-found route and consider better operational handling for unknown paths.

## Suggested acceptance criteria before calling it professional

| Area | Minimum acceptance criterion |
|---|---|
| Measurement integrity | No negative, zero-invalid, non-finite, or impossible physical value can be saved. |
| Quality verdicts | Any unchecked or invalid project component prevents a global `Ready` verdict. |
| Calculators | Invalid inputs produce field-level errors and no misleading numeric result. |
| Draft | No unresolved or malformed token can reach final export. |
| PDF | Export ends in success, blocked, or failure; it never remains indefinitely in preparation. |
| Filenames | Final filename is normalized, visible, portable, and safe. |
| Mobile | Core workflow works at 390×844 without hidden content or desktop-style tab hunting. |
| Deep links | A new device receives an explicit recovery/import/read-only path rather than a misleading not-found state. |
| Offline | Core editing, persistence, backup/restore, and export behavior are tested separately; shell caching alone is not enough. |
| Evidence | Every benchmark and financial/business assumption is labeled with a source or stated assumption. |

## Final judgment

**Do not abandon the direction. Do not add more labs yet.** The product has a real concept, a strong visual voice, and a convincing central grading use case. Its risk is that the surface area and premium language are moving faster than its trust infrastructure.

The next move should be a **trust-hardening sprint**, not another feature sprint. Strip the product mentally down to Sections → Grading → Draft → Preview → Export. Make those five paths safe, honest, portable, and excellent on a phone. Then re-audit with a clean profile, malformed data, recovered backups, and real device print flows.

If those five paths become reliable, the existing breadth becomes an advantage. Until then, the breadth makes the app look capable while making it harder for users—and for you—to know what can actually be trusted.

## References

[1] [W3C, Understanding Success Criterion 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

[2] [W3C, Understanding Success Criterion 3.3.1: Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)

[3] [OWASP, Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

[4] [Stitch & Scale Pro live application](https://stitch-and-scale-pro-api-server.vercel.app/)
