# QA Cycle 53 Report — Stitch & Scale Pro

**Commit reviewed:** `b96f4749cd56e7207fac3234a1a5c10f332cbab8` (CHK-106)
**Date:** August 17, 2026
**Reviewer:** Manus QA (third staff — tester)
**Previous reviewed commit:** `b1b8c080fbd7dc996847af67f89554a585dbd9e3`

> This report is addressed to the Reviewer. The Coder should not act on this report directly; the Reviewer should assess the findings below and decide whether to hand off any of them to the Coder.

---

## 1. What changed since the last review

A single commit arrived since cycle 52: **CHK-106**, a one-file, one-line change in `artifacts/stitch-and-scale/src/components/marketplace-takerate-lab-card.tsx`. The `NumField` inside the Take-Rate Lab channel cards had its right padding widened from `pr-8` to `pr-11`. This is the fix submitted for **issue #55** (unit suffix `u/mo` / `$` overlapping the input value digits at iPhone width). No other files, tests, or dependencies were touched, and no application logic changed.

## 2. Baseline health (verified, no code changes)

| Check | Result |
|---|---|
| TypeScript (`typecheck`, root + artifact) | Clean — no errors |
| Vitest | **1,763 passed / 1,763** across 112 files (unchanged from cycle 52; no new test files in CHK-106) |
| Production build | Succeeded in 7.84 s |
| Dev server (fresh restart after pull) | HTTP 200 at `http://localhost:5173/` |

Baseline is green. The test suite size is stable, which is consistent with a purely presentational change.

## 3. Fix verification — issue #55 (suffix/value overlap at phone width)

The fix was verified in a real browser (Playwright on the local Vite host) using seeded project data, at the exact viewport the defect was reported at: **iPhone 14 portrait, 390×844, iOS Safari user agent, device scale factor 3**, in **both light and dark themes**. The Take-Rate War Lab tab was opened on the seeded project, scrolled to the "Monthly units & average price per channel" section, and every channel card was inspected visually.

### Light theme, iPhone 14 (390px)

![Take-Rate channel cards, light theme, iPhone 14](qa-shots-cycle53/takerate-cards-light-390.png)

### Light theme, zoomed crop — Etsy and Ravelry card inputs

![Zoomed crop, light theme — units '15' with '%' suffix, 'u/mo' and '$' placeholders all clear](qa-shots-cycle53/crop-takerate-light.png)

### Dark theme, iPhone 14 (390px)

![Take-Rate channel cards, dark theme, iPhone 14](qa-shots-cycle53/takerate-cards-dark-390.png)

### Dark theme, zoomed crop

![Zoomed crop, dark theme — value '15' and '%' suffix separated, no overlap](qa-shots-cycle53/crop-takerate-dark.png)

### Regression coverage — wider and narrower widths

The same view was also rendered at iPhone SE width (375px), iPhone 14 Pro Max width (430px), and desktop width (1280px, three-column card grid):

| Viewport | Screenshot | Result |
|---|---|---|
| iPhone SE, 375px | `crop-takerate-se375.png` | Clean — "15" and "%" separated |
| iPhone 14, 390px | `crop-takerate-light.png`, `crop-takerate-dark.png` | Clean, both themes |
| iPhone 14 Pro Max, 430px | `takerate-cards-iphone-14promax-430.png` | Clean |
| Desktop, 1280px | `takerate-cards-desktop-1280.png` | Clean — grid intact, portfolio summary populated ($824.00 revenue, $105.08 fees, $718.92 net, 12.8% take) |

**Verdict: issue #55 is VERIFIED FIXED.** In both themes at 390px the value text no longer collides with the absolutely positioned suffixes — the widened padding (`pr-11`) gives the suffix adequate clearance. I confirm I *looked* at the pixels rather than just reading the DOM: in the pre-fix state (cycle 50) the digits were struck through by the suffix; now value and suffix sit side by side with visible breathing room. I could not produce a before/after pair this cycle because the repository no longer contains the pre-fix code, but cycle 50's evidence (`qa-shots-cycle50/`) documents the defective state. No regressions were observed at 375px, 430px, or 1280px, and the Take-Rate Lab arithmetic (keeps/net/sale, portfolio summary) continues to compute the same seeded figures correctly.

## 4. Re-verification of still-open issues

| Issue | Status in CHK-106 code | Re-verification this cycle |
|---|---|---|
| #57 — Payback negative net for real-shape receipts | Not touched (payback-lab-card.tsx unchanged) | Not re-opened per standing rule; remains open |
| #58 — Language preference lost on reload | Not touched (SettingsContext/i18n unchanged) | Not re-opened per standing rule; remains open |

Both remain unresolved in the code, and since CHK-106 does not touch their subsystems, they are simply noted as still open for the Reviewer.

## 5. New finding — INFO (non-blocking)

While capturing the Take-Rate Lab, the browser console emitted repeated React warnings:

> Warning: Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version. **TR-05**, **TR-03**

The Take-Rate Lab tabs **TR-03** and **TR-05** render two children with identical `key` props in their tab/panel structure. This does not visibly break rendering today, but duplicate keys are explicitly unsupported in React and can cause silent duplication/omission of elements in future releases. It costs nothing to fix and is worth a Reviewer eyeball — flagging as **INFO severity** (issue #59) rather than a blocking defect.

## 6. Console and crash check

No console **errors** occurred on any route during this cycle's session (the duplicate-key entries are React **warnings** only). No crashes, no dead views, no blocked interactions. Storage health was unaffected by the session (seeded data persisted as written).

## 7. Deliverables in this cycle

The report and all evidence screenshots were committed to the `qa/manus-2026-08-14-cycle39` branch under `qa/cycle53/` (evidence in `qa/cycle53/evidence/`). A verification comment was posted on issue #55, addressed to the Reviewer; the issue itself is intentionally left open because closing is the Reviewer's call. No pushes were made to `main`, and no application source was modified.

**Evidence files (all PNG):**

- `takerate-cards-light-390.png` — full channel-card section, light, 390px
- `takerate-cards-dark-390.png` — full channel-card section, dark, 390px
- `crop-takerate-light.png` — zoomed Etsy/Ravelry inputs, light
- `crop-takerate-dark.png` — zoomed Etsy/Ravelry inputs, dark
- `crop-takerate-se375.png` — tightest phone width (375px)
- `takerate-cards-iphone-14promax-430.png` — Pro Max width (430px)
- `takerate-cards-desktop-1280.png` — desktop 1280px with portfolio summary
