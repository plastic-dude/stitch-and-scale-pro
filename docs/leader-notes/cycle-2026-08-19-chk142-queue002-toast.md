# Cycle log — CHK-142: QUEUE-002 part 2/2 — toast/snackbar module localization

**Date:** 2026-08-19 (continued-queue firing, run id `2026-08-19-Q003`)
**Commit:** `[CHK-142] [STITCH-AND-SCALE-PRO] [VERIFIED]`
**Status: DONE** — gates green, live-verified under German locale.

## Defect (confirmed live, prior firing)

The section-delete snackbar rendered English under the German locale:
title `Section deleted`, description `If that was a misclick, it is saved in your last export.`
Queue entry QUEUE-002 part 2/2 (toast/snackbar module).

## Audit of the toast surface (this firing)

The pre-queue audit had estimated "93 calls, 17+13 distinct strings." A measured audit found **~78 `toast()` call sites** across pages and components, of which the majority are served by **per-card local copy objects** (`copy`, `copyText`, `partnerCopy`, `tc`) — already localized through those objects. `toast-copy.ts` therefore covers only the previously **bare literal English strings** that had no localized copy object. This is recorded in the module header and in the queue entry. Honest count correction: final unlocalized call count was 31 (30 wired via the bulk script + 1 in `partner-economics-card.tsx`), not 93.

## Implementation

- **`src/lib/toast-copy.ts`** — new module: `ToastCopy` interface, `getToastCopy(language: LanguageCode)` accessor, five locale maps (en/de/fr/es/pt) with English fallback for unknown codes, following the established `workspace-copy` pattern. Covers: copy/saved/import/export/backup/onboarding/reset/note/table/roster/measurement/project duplicate/delete/import/restore toast strings, plus interpolation helpers with singular/plural for counts (`importSuccessTitle(n)`, `backupDownloadedDescription(n)`, `rosterRebuiltDescription(sizes, slots)`), label/name interpolation (`measurementRestored(label)`, `measurementDeleted(label)`, `measurementUpdatedAdded(label, isUpdating)`, `projectDuplicateDescription(name)`, `projectExportedDescription(name)`, `projectDeletedDescription(name)`, `projectImportedDescription(name)`, `yarnLoadedTitle(name)`, `showTierNotedDescription(tierLabel)`, `yarnPoolRequired(value, unit, max)`).
- **Wired ~31 bare-literal sites** across: `settings.tsx`, `project-workspace.tsx`, `project-pdf.tsx`, `project-grading.tsx`, `dashboard.tsx`, `storage-health-card.tsx`, `publish-toolkit-card.tsx`, `show-roi-card.tsx`, `teach-economics-card.tsx`, `tech-edit-card.tsx`, `test-knit-card.tsx`, `wholesale-book-card.tsx`, `yarn-buy-card.tsx`, `yarn-pool-card.tsx`, `translation-bundle-card.tsx`, `partner-economics-card.tsx`. Cards use `getToastCopy(language)` from `useSettings()` (all had settings access already); `translation-bundle-card` passes `tc` into its `CopyLine` sub-component.

## Regression tests

`src/lib/toast-copy.test.ts` — 7 cases: all five locales hold every plain key; EN/DE exact-string spot checks (including `sectionDeletedTitle`/`sectionDeletedDescription`); no raw English leftovers in non-EN maps; interpolation singular/plural behaviour (`importSuccessTitle(1)` vs `(3)`, `rosterRebuiltDescription`); fallback to EN for unknown language codes.

## Verification (all measured from the committed tree)

- `pnpm typecheck` — clean (tsc --noEmit, zero errors)
- `pnpm vitest run` — **1,988/1,988 across 136 files** (was 1,981/1,978 before this cycle's changes)
- `pnpm build` — green (7.38s; pre-existing chunk-size advisory, not a failure)
- **Fresh browser check under DE** — added temp section, deleted it, toast rendered `Abschnitt gelöscht` / `Falls es ein Versehen war: Er ist noch in deinem letzten Export gesichert.` (evidence: `docs/evidence/q002-toast-loeschung-de.webp`). Dialog also rendered correct German. Temp section deleted afterward; sandbox storage restored.

## Honest notes

- Toast sites with `description:` as template literals (variable interpolations like `${name} exported`) are served through the new interpolation helpers; sites whose descriptions come from existing per-card copy objects remain under those objects (not duplicated into `toast-copy.ts`).
- The dev-server HMR crash class (QUEUE-010) remains open — it is a separate queue entry, not part of this fix.
- Grading-sheet page strings (QUEUE-009) remain queued next after QUEUE-003/004 in walking order.
