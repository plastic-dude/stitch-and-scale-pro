# Cycle 48 verified findings

## Confirmed twice: Marketplace Take-Rate Lab emits duplicate React keys

Two fresh browser runs in isolated Chromium contexts, with the same seeded sample project and the Take-Rate Lab activated, both produced React runtime errors:

- `Encountered two children with the same key ... TR-05`
- `Encountered two children with the same key ... TR-03`

The UI visibly renders two Etsy/Ravelry `TR-05` badges and two LoveCrafts/Ribblr `TR-03` badges. The component currently renders `result.flags.map(f => <Badge key={f.code}>...)`, but the engine legitimately returns one flag per channel, so codes are not globally unique. This is a product defect, not a sweep artifact. The exact source is `src/components/marketplace-takerate-lab-card.tsx:240-245`; a stable compound key such as code plus channel/index is needed.

Evidence files: `qa-shots-cycle48/c48-marketplace-run1.png` and `qa-shots-cycle48/c48-marketplace-run2.png`. Both runs showed the same duplicate badges and same console warnings.

## Not confirmed as app 404 defect

The corrected full sweep’s failed requests were Google Fonts `fonts.gstatic.com` requests, not localhost app assets. Focused reproduction captured no HTTP response >=400. The sandbox/network font failure is therefore a low-confidence environment observation, not a product issue.

## Sweep harness correction

The first full rerun had a harness bug: it concatenated `BASE` to an already absolute workspace URL, so workspace routes were not actually covered. The harness was corrected with `url_for()` and rerun. A second issue in the harness used viewport-dependent tab clicks; this was corrected to dispatch pointer/mouse events. The corrected run activated and dumped all 79 workspace tab panels; all 79 dumps were nonempty.

## Visual observations requiring broader audit

The marketplace screenshot is light mode, desktop, 1280x2175. Duplicate badges are visible in the Watch-outs section. Dark mode, all five locales, mobile/tablet/desktop, settings controls, onboarding/recovery, and all route-level interactions still require their dedicated audit/reproduction passes before final reporting.

## Integrity rule

Do not publish any additional issue until every candidate is independently reproduced twice, its screenshot evidence is present, and the final self-audit checks claims against actual logs and files.

## Representative theme/responsive observations

The focused rerun completed 30 result rows and 240 screenshots with zero recorded console-error rows or exceptions. It covered all five language options (`en`, `de`, `fr`, `es`, `pt`) at settings, both explicit themes, and all five viewport classes for landing/workspace representative checks. The dark desktop landing view retained readable hierarchy, CTA contrast, and no obvious consent asymmetry. The dark 375px landing view was a long but horizontally contained single-column layout; no clipped horizontal content was visually evident in the inspected screenshot. These are visual observations only, not a WCAG conformance claim.

The earlier corrected full sweep separately activated all 79 live workspace tabs; all 79 corresponding panel dumps were nonempty. The supplemental long matrix attempts timed out before producing result files, so they are not counted as completed coverage and will not be cited in the report.
