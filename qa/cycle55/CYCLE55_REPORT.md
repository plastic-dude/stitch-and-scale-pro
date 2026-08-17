# QA Cycle 55 — Stitch & Scale Pro

**Cycle:** 55 | **Date:** Aug 17, 2026 | **Reviewer:** Please review. The Coder should not act on this report directly.
**Commits reviewed:** `48bdd8b` → `d9dc820` (2 new commits on `main`)
**This report is addressed to the Reviewer. The Coder should not act on this report directly — triage and route any findings through the review process.**

## 1. What changed

| Commit | Changelog | QA issue it targets |
|---|---|---|
| `dc2be73` — CHK-110 | Take-Rate Lab watchout badges keyed by `code-index` instead of bare `code`; 3 regression tests lock duplicate-flag-code behavior | #59 (duplicate React keys on TR-03/TR-05 badges) |
| `d9dc820` — CHK-111 | Team standing orders: `docs/leader-notes` shared message board, layout-perfection checklist, playbook/staff-prompt updates | None (docs/process only, no `src/` change) |

## 2. Baseline

TypeScript typecheck clean across all artifacts. Vitest **1,779/1,779 passing across 114 files** (up 3 from 1,776 — the three new marketplace-takerate-lab regression tests). Production build succeeded in 8.77s. The dev server was killed and freshly restarted after the pull before any browser testing. CHK-111 is docs-only and did not alter application behavior.

## 3. Verification of CHK-110 — issue #59: VERIFIED FIXED

This cycle's regression-risky change was the React key re-keying on the Take-Rate Lab watchout badges, a direct response to issue #59 (which I raised in cycle 53: `TR-03` and `TR-05` each render twice under the default portfolio because LoveCrafts/Ribblr share a payout-lag flag and Etsy/Ravelry share a fee-inflation flag). The fix switches the badge `key` from `f.code` to `` `${f.code}-${i}` ``.

### 3.1 Console warning sweep

Two full sessions (iPhone 14 portrait, 390×844, iOS Safari UA) with every console message captured:

| Theme | Console warnings/errors | Duplicate-key warnings |
|---|---|---|
| Light | 0 | **0** |
| Dark | 0 | **0** |

The "encountered two children with the same key" warnings that fired in cycle 53 are gone.

### 3.2 Visual verification — duplicate flags now render as distinct badges

With the default sample portfolio the watchout section emits seven badges, and each previously-colliding code now renders twice as visually separate cards:

- `TR-03 — LoveCrafts: 45-day payout lag` and `TR-03 — Ribblr: 30-day payout lag` — both present, distinct
- `TR-05 — Etsy: fee-inflation history` and `TR-05 — Ravelry: fee-inflation history` — both present, distinct
- Plus `TR-02` (Etsy Offsite Ads), `TR-04` (Etsy delisting), `TR-08` (Ribblr floor)

The verdict card ("Balanced portfolio — protect and grow", 13% average fees) renders correctly beneath, and the channel cards above remain unchanged from cycle 54.

Light mode:

![Take-Rate watchouts light, iPhone 14](qa-shots-cycle55/takerate-watchouts-light-390.png)

Light mode — watchout badges close-up:

![Watchout badges close-up, light](qa-shots-cycle55/takerate-watchouts-light-390-zoom.png)

Dark mode:

![Take-Rate watchouts dark, iPhone 14](qa-shots-cycle55/takerate-watchouts-dark-390.png)

Dark mode — watchout badges close-up:

![Watchout badges close-up, dark](qa-shots-cycle55/takerate-watchouts-dark-390-zoom.png)

### 3.3 Code review of the fix (read-only)

The fix is correct for position-stable maps: React 18 requires key uniqueness only among siblings, and the map index is stable per render for a deterministic analyzer output (confirmed by the two new tests asserting exactly 2 × `TR-03` and 2 × `TR-05` in the default-portfolio output). The third regression test locks the uniqueness invariant (`keys.size === flags.length`). No ordering or rendering behavior changed — only the key attribute.

## 4. Observations (cosmetic, pre-existing — no new issue)

**Watchout badge text truncation at phone width.** Badge texts exceed the pill width at 390px and are visually cut off on the right edge (e.g. "TR-02 — Etsy: Offsite Ads leak — 15% of sales pay 15%" truncates). The card uses `max-w-sm` on the flex container but individual badges lack truncation/ellipsis or wrapping. Pre-existing across cycles 50–54; mentioned so the Coder is aware it is seen, but intentionally not re-filed as new.

**Channel card text wraps.** "Units / month", "Offsite-Ads share" and similar labels wrap mid-word at 390px (letter-spacing-wide styling compounds the wrap). Same artifact documented in cycles 50–54; the #55 padding fix removed the critical suffix collision; this leftover is purely cosmetic.

**Leader-notes docs (CHK-111).** The new team standing orders create a `docs/leader-notes` message board and a layout-perfection checklist. Nothing to verify functionally — noted for the team.

## 5. Actions taken this cycle

The report and four evidence screenshots were pushed to a **new branch `qa/manus-2026-08-14-cycle41`** under `qa/cycle55/` (commit on QA identity). A verification comment was posted on GitHub issue **#59** (explicitly addressed to the Reviewer; issue left open for the Reviewer to close). `main` was never touched and no `src/` code was modified. `last-reviewed-sha.txt` was updated to `d9dc820f92593a5f0e8ac44f4490b2ad87a6c03d`.

## 6. Known open issues status

| Issue | Status after cycle 55 |
|---|---|
| #59 (duplicate React keys TR-03/TR-05) | **VERIFIED FIXED by CHK-110** — comment posted, awaiting Reviewer closure |
| #57, #58, #55, #53, #56 | Verified fixed in cycles 52–54 — still open, Reviewer to close |
| #11–#17, #40–#52, #54 | Open, untouched by this cycle's commits — not re-opened |
