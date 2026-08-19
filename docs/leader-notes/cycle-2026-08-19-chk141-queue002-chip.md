# Cycle 2026-08-19 — CHK-141 — QUEUE-002 part 1 of 2 (measurements chip)

Continued-queue firing. Inherited state: QUEUE-001 done at `33611c1`; first queued entry is QUEUE-002 (localization pass 1 of 2: `0 measurements` chip + toast/snackbar module). This firing works the chip — one fix per cycle — and defers the toast module to the next firing as QUEUE-002's second part.

## Defect being closed

The Sections tab's per-section count chip at `project-workspace.tsx:585` rendered the hardcoded English phrase `{section.measurements.length} measurements` under the German locale (and under every non-English locale). Confirmed live during the QUEUE-001 audit (`2026-08-19-Q001`, finding 1).

## Fix

Added `measurementsChip(count: number): string` to the `WorkspaceCopy` interface and all five locale maps in `src/lib/workspace-copy.ts`, following the module's existing `getWorkspaceCopy` pattern (English fallback for unknown codes). Singular applies to exactly one measurement; all other counts — zero included — take the plural:

| Locale | count 1 | count 0 / n |
|---|---|---|
| en | `1 measurement` | `0 measurements` / `n measurements` |
| de | `1 Maß` | `0 Maße` / `n Maße` |
| fr | `1 mesure` | `0 mesures` / `n mesures` |
| es | `1 medida` | `0 medidas` / `n medidas` |
| pt | `1 medida` | `0 medidas` / `n medidas` |

Wired at `project-workspace.tsx:585`: `{copy.measurementsChip(section.measurements.length)}`.

## Regression tests

Four new cases appended to `src/lib/workspace-copy-sections.test.ts` (CHK-139 suite): all-locale truthy rendering at counts 0/1/5; exact-string verification including `1 Maß` / `0 Maße` / `3 Maße`; no-English-leftover guard for the chip under non-English locales; and English fallback for unknown codes now covering the chip too.

## Verification

Gates measured from this tree: `pnpm typecheck` clean, `pnpm vitest run` **1,981 passed / 1,981 (135 files)** — up from 1,978 at the prior firing — `pnpm build` green.

Live browser check on a fresh dev-server session (port 5002), German locale, full reload: added a temporary section `QATempSection`; the chip rendered **`0 Maße`** next to the section name (screenshot `docs/evidence/q002-chip-0-masse-de.webp`). The section delete dialog also rendered correct German (`Abschnitt QATempSection löschen?` / `Damit werden der Abschnitt und alle 0 seiner Maße entfernt…`). Temp section deleted afterwards; sandbox storage restored to the empty state (`docs/evidence/q002-chip-german-dialog.webp`).

## Observed but deferred (not this cycle)

The delete toast after confirming the section removal still renders English (`Section deleted / If that was a misclick…`) under German. This is the toast/snackbar module — it is QUEUE-002's second part and lands in the next firing (scope: `toast-copy.ts`, converting 93 calls, 17+13 distinct strings; estimate in `docs/leader-notes/scope-estimate-longform-localization.md`).

## Queue state after this firing

QUEUE-002: part 1 (chip) done as CHK-141; part 2 (toast module) next. Next firing works the toast module; after QUEUE-002 the walker proceeds to QUEUE-003.
