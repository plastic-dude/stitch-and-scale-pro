# QA Cycle 54 — Stitch & Scale Pro

**Cycle:** 54 | **Date:** Aug 17, 2026 | **Reviewer:** Please review. The Coder should not act on this report directly.
**Commits reviewed:** `b96f474` → `48bdd8b` (3 new commits on `main`)
**This report is addressed to the Reviewer. The Coder should not act on this report directly — triage and route any findings through the review process.**

## 1. What changed

| Commit | Changelog | QA issue it targets |
|---|---|---|
| `a70669b` — CHK-107 | Localize onboarding overlay footer buttons (`workflow.overlay.back/continue/begin` in all 5 locales) | #53 (overlay footer hardcoded English) |
| `0bb6c4f` — CHK-108 | Payback derives gross from `items` for UI-saved rows missing `grossTotal`, with two-decimal and clamp helpers; new regression test file `payback-gross-regression.test.ts` | #57 (Payback showed negative net for real rows) |
| `48bdd8b` — CHK-109 | Localize dashboard workspace project cards (`dashboard-copy.ts`, German/French/Spanish/Portuguese dictionaries) | #51/#56 (workspace cards untranslated, pt missing key) |

## 2. Baseline

TypeScript typecheck clean across all artifacts. Vitest **1,776/1,776 passing across 114 files** (up 13 from 1,763/112 — the new Payback regression test file). Production build succeeded in 7.94s. The dev server was killed and freshly restarted after the pull before any browser testing. No console errors observed during any of the scripted sessions below.

## 3. Verification of the three fixes

### 3.1 Issue #57 — Payback negative net: VERIFIED FIXED (CHK-108)

This was the regression-risky change, so it received the deepest pass. Two real UI-saved receipt rows were seeded (the exact SavedSale shape the UI writes: `items[].unitPrice`, `fees` with input-shape percent/flat fields, **no `grossTotal`**) — two $45 sales, 6.5% platform commission, 2.9% + $0.30 processing. A design-ledger expense of $36.00 was seeded as the pattern investment.

Expected oracle from the commit's own regression test: gross $90.00, fees $9.08, net **+$80.92**, per-sale net $40.46, "Needs 1 net sale to recoup" with 2/1 sold, ahead by +$44.92. The Payback Lab UI matched the oracle to the cent:

> Total invested **$36.00** · Total net earned **$80.92** · Patterns paid back **1 / 1** · Copies sold **2** · Avg net / sale **$40.46** · Out of pocket $36.00 · Ahead by **+$44.92**

Verified visually on iPhone 14 portrait (390×844) in both light and dark themes — no negative numbers, no red errors, correct badges, correct progress bar.

Light mode:

![Payback Lab light, iPhone 14 — net +$80.92](qa-shots-cycle54/payback-net-light-390.png)

Dark mode:

![Payback Lab dark, iPhone 14 — net +$80.92](qa-shots-cycle54/payback-net-dark-390.png)

Also verified: the payback card renders the What-if panel, refund-shape handling was not broken (the regression test covers refund rows deriving gross the same way), and the panel scrolls cleanly at phone width. **Recommendation to Reviewer:** request a test for the `1e9` clamp edge (a `shippingCharged` above ten billion would now be clamped) — harmless, but worth a comment in #57.

### 3.2 Issue #58 — language preference lost on reload: VERIFIED FIXED

A German language preference was seeded into `stitch-and-scale-settings-v1` **before** first paint, then the app was loaded cold (fresh page, no in-session switches). Both verified surfaces rendered German:

- Onboarding overlay: `Einrichtung überspringen` (skip), `Zurück` (back), `Los geht's` (begin), and the full German welcome body.
- Settings page: `Sprache` section, language picker options, and the "Manuelle Auswahl: Deutsch" manual-selection label.

Overlay, German (before advancing):

![Onboarding overlay in German, iPhone 14](qa-shots-cycle54/lang-probe-a-overlay-de.png)

Settings page in German:

![Settings page in German, iPhone 14](qa-shots-cycle54/lang-probe-b-settings-de.png)

This is a genuine cold-start fix: in cycles 51–52 the stored language was ignored until an in-session `setLanguage` call, and it now survives a reload. **Issue #58 can be closed at the Reviewer's discretion** — QA verification comment to be posted.

### 3.3 Issue #53/#56 — overlay footer and dashboard cards localization: VERIFIED FIXED

Onboarding overlay footer (steps 1 and 2) renders fully localized in German and Portuguese:

German step 1 — `Zurück` / `Los geht's`:

![Overlay footer German step 1](qa-shots-cycle54/footer-de-step1.png)

German step 2 — `Weiter`:

![Overlay footer German step 2](qa-shots-cycle54/footer-de-step2.png)

Portuguese step 1 — `Voltar` / `Começar` / `Saltar configuração`:

![Overlay footer Portuguese step 1](qa-shots-cycle54/footer-pt-step1.png)

Dashboard workspace project cards now localize in all non-English locales (German cards show `Zu deinen Mustern`, `Neues Muster entwerfen`; Portuguese shows `Voltar aos seus padrões`, `Criar um padrão`; the page header also reads `Willkommen bei Stitch & Scale` / `Bem-vindo ao Stitch & Scale`). French and Spanish dictionaries ship the same key set per `dashboard-copy.ts` — the commit's own `dashboard-copy.test.ts` covers all five locales, and vitest confirms coverage.

German dashboard cards:

![Dashboard cards German, iPhone 14](qa-shots-cycle54/dashboard-cards-de.png)

Portuguese dashboard cards:

![Dashboard cards Portuguese, iPhone 14](qa-shots-cycle54/dashboard-cards-pt.png)

## 4. Observations (no new issue — Reviewer to weigh)

**Group pill text-wrap at phone width (pre-existing, unchanged).** At 390px the workspace group pills (`text-[10px]`, narrow pill width) wrap mid-word, rendering "Selling Channels" as `SellingChannels` and "Hire vs Self" as `Hirevs Self`. This is the same cosmetic artifact visible in cycles 50–53 and is not caused by these commits; the keys themselves contain the correct spaces. Left unreported as a new issue — cosmetic-only, pre-existing.

**Settings language picker label duplication (cosmetic).** Each language option renders both native and English labels ("English English", "Deutsch German"). Functional, low-priority; noted so the Coder does not treat it as a defect if spotted.

**Selling Channels pill** also confirmed: the space exists in `i18n.ts` (`workspace.group.channels: 'Selling Channels'`) and `workspace-tab-groups.ts`; the wrap-only effect is purely visual at 10px font in 390px viewport.

## 5. Actions taken this cycle

The report and ten evidence screenshots were pushed to a **new branch `qa/manus-2026-08-14-cycle40`** under `qa/cycle54/` (commit on QA identity). Verification comments were posted on GitHub issues **#57** and **#58** (both explicitly addressed to the Reviewer; issues intentionally left open for the Reviewer to close). `main` was never touched and no `src/` code was modified. `last-reviewed-sha.txt` was updated to `48bdd8bdaf48119fa32dc1403174ea55355045ba`.

## 6. Known open issues status

| Issue | Status after cycle 54 |
|---|---|
| #57 (Payback negative net) | **VERIFIED FIXED by CHK-108** — comment posted, awaiting Reviewer closure |
| #58 (language preference lost) | **VERIFIED FIXED** — comment posted, awaiting Reviewer closure |
| #53, #56 (localization gaps) | **VERIFIED FIXED by CHK-107/CHK-109** |
| #55 (NumField suffix overlap) | Fixed in cycle 53 — still open, Reviewer to close |
| #11–#17, #40–#52, #54, #59 | Open, untouched by this cycle's commits — not re-opened |
