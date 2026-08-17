# Cycle 49 — iPhone-Focused QA Rerun

**Repository:** `plastic-dude/stitch-and-scale-pro`  
**Reviewed SHA:** `b7781f144c0e76a9d9d679a3716ad743c6c82316`  
**Branch safety:** local `main` was clean and matched `origin/main`; no application source was modified.  
**Publication policy:** no GitHub push or new Issue was made because this rerun reviewed the same SHA already recorded as reviewed. Existing Issue #54 remains open and was not reopened.

## Scope and method

This was a fresh iPhone-emulation rerun rather than a reuse of the prior desktop/mobile result. Chromium contexts used an iPhone Safari user agent, `is_mobile=true`, `has_touch=true`, device scale factor 3, and the following physical viewport classes: iPhone SE portrait `375×667`, iPhone SE landscape `667×375`, iPhone 14 portrait `390×844`, iPhone 14 landscape `844×390`, iPhone 14 Pro Max portrait `430×932`, and iPhone 14 Pro Max landscape `932×430`.

The route/theme/locale sweep covered all five catalog languages—English, German, French, Spanish, and Portuguese—against both explicit light and dark themes. Landing was exercised at all six iPhone viewport classes for every language and theme. Settings was exercised at iPhone 14 portrait and landscape for every language and theme, including touch selection of light, dark, and system appearance and all five language choices. The workspace was opened at all six iPhone viewport classes in both themes with the English seed and each actionable workspace panel was activated and checked for nonempty content.

A separate twice-isolated interaction audit exercised email entry through touch and keyboard typing, empty and valid submission, scroll-to-bottom, refresh, settings theme persistence, keyboard focus, workspace navigation, and a missing-project route. Every one of those two-run interaction contexts completed without console errors or failed network requests.

| Coverage area | Result |
|---|---|
| Locale/theme route matrix | 60 landing rows plus 20 settings rows across 5 languages × 2 themes |
| iPhone viewport classes | 6 classes: SE, iPhone 14, and Pro Max; portrait and landscape |
| Workspace panels | 79 actionable panel activations recorded per workspace context; all recorded panels had nonempty content |
| Workspace contexts | 12 contexts: 6 viewport classes × 2 themes |
| Interaction reruns | 2 isolated runs covering landing, settings, workspace, and missing-project recovery |
| Bounded sweep result rows | 92 |
| Bounded sweep screenshots | 92 |
| Focused interaction screenshots | 20 |
| Horizontal overflow | 0 rows in the bounded and focused result sets |
| Failed network requests | 0 rows in the bounded and focused result sets |
| Focused interaction console errors | 0 rows in both isolated runs |

## Findings

### Existing defect #54 reproduced on iPhone

The iPhone workspace sweep reproduced the already-open Marketplace Take-Rate Lab defect: React emitted duplicate-key warnings for `TR-03` and `TR-05`. The warning appeared in 12 workspace contexts—every tested iPhone viewport and both themes—and is consistent with Issue #54, which documents the component’s use of a non-unique flag code as the React key. Because this is an existing, unchanged issue and the repository SHA did not change, it was not reopened or duplicated.

The relevant warning text was recorded as “Encountered two children with the same key … TR-03” and the equivalent `TR-05` warning. This is a confirmed regression status, not a new iPhone-only issue.

### No new iPhone-specific product defect promoted

The completed focused interaction rerun found no console errors, failed requests, or horizontal overflow. Theme selection persisted after refresh in the settings context. Touch input and keyboard typing reached the email field, and empty and valid submission paths completed without a new failure. The missing-project route returned a rendered recovery state rather than a browser-level crash.

The audit measured some controls below the 44×44 CSS-pixel touch-target guideline. That is reported as a usability/accessibility review lead, not a confirmed defect, because several elements are compact secondary controls or icon-adjacent controls and the measurement does not prove the effective hit area on physical iOS Safari. A physical-device or stricter accessible-name review would be required before opening an issue.

The first screenshot-heavy iPhone script reached 1,200 screenshots but exceeded its time budget before writing its result file. I do not count that attempt as a completed run. The bounded replacement completed the required matrix and produced the counts in this report. This limitation is intentionally disclosed rather than hidden.

The workspace harness also observed a dynamic difference between the trigger count read at the end of a context and the number of actionable panels activated during iteration. The stable actionable sequence contained 79 unique labeled panels, all nonempty. Because the count changed while the workspace mounted, I do not assert a new tab-registry defect from that observation.

## Visual evidence

The attached screenshots include iPhone SE portrait light landing, iPhone 14 landscape dark settings, representative iPhone interaction before/after states, and two independent Marketplace Take-Rate reproductions. The full evidence folders contain the complete locale, theme, orientation, and workspace captures.

## Final self-audit

The report does not claim that a physical iPhone was used; it claims browser-level iPhone emulation with touch-capable contexts. It does not claim that all small controls violate WCAG; it records them as leads. It does not count the timed-out screenshot-heavy attempt as successful coverage. It does not reopen Issue #54, does not create a duplicate issue, does not push to `main`, and does not report environment warnings as product defects.

**Conclusion:** the app is broadly usable in the tested iPhone-emulated matrix, with no newly verified iPhone-only defect. The existing Marketplace duplicate-key defect remains reproducible across iPhone sizes and both themes and still requires Reviewer/Coder follow-through under Issue #54.
