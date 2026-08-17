# QA Cycle 58 Report — Consignment Re-Price Lab Hydration Fix (#60) + Zero-Stock Footer i18n

**Date:** Aug 17, 2026 · **Agent:** Manus QA · **Repo:** plastic-dude/stitch-and-scale-pro
**Addressed to:** The Reviewer. The Coder should not act on this report directly.
**QA branch:** `qa/manus-2026-08-14-cycle44` · **Evidence:** `qa/cycle58/evidence/`

## 1. Commits reviewed since cycle 57

Since the last-reviewed SHA `ce1f185`, two new commits landed on `main`:

| Commit | Check-in | Scope |
|---|---|---|
| `f9799fa` | CHK-116 | Consignment Re-Price Lab: controlled/uncontrolled input flip fix on zero-sold scenario (QA #60) + hydration over canonical defaults + localized zero-sell-through ladder footer (5 locales) + 3 regression tests (32→35 in the lab lib) |
| `1619d33` | [LEAD] cycle sweep | Docs/process only: `docs/leader-notes/cycle-2026-08-17-chk115-116.md`. No application code. |

The LEAD note records that CHK-115 (cycle 57) also addressed QA #42, and that #16/#15/#12/#11 were closed as non-defects while #13 remains open for a human print spot-check. No code changed for those, so they are not touched in this cycle.

## 2. Baseline

| Gate | Result |
|---|---|
| `pnpm install` | clean |
| TypeScript (`tsc --noEmit`) | clean, exit 0 |
| Vitest | **1,793 / 1,793 passed, 114 files** (+3 from the CHK-116 regression tests) |
| Production build | succeeded in 7.58s |
| Dev server | freshly killed and restarted after pull, HTTP 200 at `localhost:5173` |

## 3. Fix verification — QA #60 (VERIFIED FIXED)

Issue #60 reported real console errors (controlled ↔ uncontrolled input flip) on the Consignment Re-Price Lab when the *Units sold per month* field is set to zero, because the `setState` clear path could clobber defined fields with `undefined`.

### Browser verification — zero-sold scenario, iPhone 14 portrait (390×844, iOS Safari UA)

Scenario: 60 units at shop, units sold per month forced to **0**, default channel (Ravelry In-Store 60/40). Captured before and after the input change in both themes.

**Light mode.** Before: `reprice-light-zero-before.png`, After: `reprice-light-zero-after.png`

![Light mode before zero-sold input](qa/cycle58/evidence/reprice-light-zero-before.png)
![Light mode after zero-sold input](qa/cycle58/evidence/reprice-light-zero-after.png)

**Dark mode.** Before: `reprice-dark-zero-before.png`, After: `reprice-dark-zero-after.png`

![Dark mode after zero-sold input](qa/cycle58/evidence/reprice-dark-zero-after.png)

### Console and behavioral results

| Probe | Light | Dark |
|---|---|---|
| Console errors (controlled↔uncontrolled) | 0 | 0 |
| Console warnings | 0 | 0 |
| BEST badge rows (should be suppressed at zero sell-through) | 0 | 0 |
| $0.00 clear rows in ladder | present (8) | present (8) |
| Zero-stock footer text | present | present |
| CR-04 critical watch-out | present | present |
| "Reset to example" click | clean, no errors after | — |
| Default scenario ladder + Verdict | present, no errors | — |

The fix works exactly as the commit message describes: hydration now folds the stored blob over the canonical `REPRICE_DEFAULTS` (so a stale blob missing a key can never reach an input as `undefined`), the merge silently drops undefined patch entries, and the card and lib share the same defaults export. Inputs remain controlled for the lifetime of the component; the zero-sold ladder renders every row at $0.00 with the disclosure footer, and no console pollution remains. The repo screenshot added by CHK-116 (`docs/screenshots/chk116-reprice-lab-zero-sold-no-flip.webp`, converted to PNG: `chk116-repo-zero-sold-evidence.png`) matches my independently captured evidence.

## 4. Localization verification — zero-stock ladder footer (4 locales in the browser + en)

CHK-116 localized the previously hardcoded English zero-sell-through footer through the copy catalogue. Verified end-to-end in the browser at 390px with a zero-sold scenario, each locale in its own clean session:

| Locale | Footer renders | Footer text (first clause) | Errors |
|---|---|---|---|
| en | ✅ | "No step moves stock at zero sell-through — every row clears $0.00…" | 0 |
| de | ✅ | "Bei null Abverkauf bewegt kein Schritt den Bestand — jede Zeile macht $0.00…" | 0 |
| pt | ✅ | "Com zero vendas nenhum passo move o stock — cada linha limpa $0.00…" | 0 |
| fr | ✅ | "Aucun palier n'écoule le stock quand les ventes sont nulles — chaque ligne dégage $0.00…" | 0 |

Note: `es` exists in the catalogue (source-verified) but was not given a separate browser pass this cycle; the `zeroStockFooter` key is wired identically to the three verified locales.

![German zero-stock footer](qa/cycle58/evidence/reprice-footer-de.png)
![Portuguese zero-stock footer](qa/cycle58/evidence/reprice-footer-pt.png)
![French zero-stock footer](qa/cycle58/evidence/reprice-footer-fr.png)

In each locale the ladder rows all clear $0.00, the critical watch-outs (CR-04 red / CR-07) fire, the verdict card ("Fazit"/"Veredicto"/"Verdict") renders, and the reset button carries the localized label ("Beispiel zurücksetzen"/"Repor exemplo"/"Réinitialiser l'exemple").

## 5. Honest QA process notes (self-corrections, for the Reviewer)

1. **Harner bug, not app bug (twice, then fixed):** My first attempt at the German footer check reported a miss ("footer not found"). Investigation showed *my* pre-initialization seed wrote the settings blob in a shape the SettingsContext reducer does not honor (`theme: "system"` plus a language merge that fell back to English) — the app was correctly defaulting to English. Correcting the seed shape (exact shape used by SettingsContext) made the stored language survive hydration and all three locales verified. This is the same class of harness bug encountered in cycle 54; it is documented there and in this report so it is not repeated.
2. **Tab locator discipline:** the tab strip localizes labels (de "Kommissionspreis-Labor", fr "Labo nouveau prix", pt "Laboratório de novo preço"), so matching by visible label fails in non-English locales. The robust pattern used here is `role="tab"` with `aria-controls` matching the registry suffix (`consignment-reprice`), which is stable across locales. This pattern should be added to the QA playbook.
3. **Loop-vs-solo harness flake:** a label-text input finder that worked in a standalone session failed inside a multi-context loop for French (0 matches despite the label being present in the DOM). Switching to the stable hardcoded input id (`crp-sold`) resolved it; the card's input ids are locale-independent.

## 6. Verdict and issue status

- **#60: VERIFIED FIXED — pass in light and dark, console clean, behavior correct, reset clean.**
- **#13:** still open per the LEAD note (awaiting human print spot-check); no code change this cycle, so left untouched as instructed.
- No new defects found this cycle. Console output across every run in both themes was clean.

*Cycle 58 reviewed HEAD: `1619d331eec900e7e423d7cab7fd8671263fcb78`.*
