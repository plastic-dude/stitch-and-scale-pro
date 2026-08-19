# Work Queue — continued queue protocol

**Canonical file for the 15-minute loop firings.** This file is the single source of truth for "what is next." Every firing reads it first, works the first `queued` entry, updates statuses inline, and appends a ledger line. Owner directive 2026-08-19: firings continue this queue from the start, never restart from scratch.

## Queue entries (walking order)

| # | id | Description | Severity | Status | Evidence / notes |
|---|---|---|---|---|---|
| 1 | RESTUDY-001 | Full chronological restudy S001→HEAD | QUEUE-ITEM | done | `97897be`; details in `docs/leader-notes/restudy-2026-08-19-S001-to-HEAD.md` |
| 2 | LEDGER-HYGIENE-001 | Strike stale escalations (S182/S251 fixed in flight, S160 REQUIRES-REPRODUCTION, bundle partners functional); add Reviewer rule against re-escalating fixed items | QUEUE-ITEM | done | `15b473b`; `docs/team-standing-orders.md` updated |
| 3 | QUEUE-001 | QA coverage gap: localization sprint (CHK-137..139, localizations surfaces) had no third-party audit since QA stopped Aug 17 22:17 | MAJOR | done | Run id `2026-08-19-Q001`; `33611c1`. Audit report: `docs/leader-notes/cycle-2026-08-19-queue001-audit.md` — 12 findings: all CHK-139 fixes hold under fresh DE reload; defects confirmed: 0-measurements chip (closed as CHK-141 next firing), delete toast (toast module, next part of QUEUE-002), grading sheet page (4 strings, QUEUE-009), tester-desk + transbundle Tier 1 narratives (QUEUE-003/004 scope), HMR crash class (3 components, dev-only, QUEUE-010); mobile viewport eyes-check unavailable in this sandbox (limitation, not defect) |
| 4 | QUEUE-002 | Localization pass 1 of 2 — free small items: `0 measurements` chip (`workspace-copy.ts` `measurementsChip` helper, 5 locales) and toast/snackbar module (`toast-copy.ts` converting 93 calls, 17+13 distinct strings) | MINOR | in-progress | Part 1/2 DONE as CHK-141 (`measurementsChip` in `workspace-copy.ts` + wire at `project-workspace.tsx:585` + 4 regression tests; live-verified `0 Maße` under DE, evidence in `docs/evidence/` + `docs/leader-notes/cycle-2026-08-19-chk141-queue002-chip.md`). Part 2/2 toast module next; live defect re-confirmed during this firing's cleanup (`Section deleted` toast EN under DE). Scope in `docs/leader-notes/scope-estimate-longform-localization.md` |
| 5 | QUEUE-003 | Localization pass 2 of 2 — Tier 2 narratives ("Benchmarks baked in" footers, 9 cards) + ~95 `<Field hint>` strings across 8 files | MINOR | queued | Same scope files as QUEUE-002 |
| 6 | QUEUE-004 | Localization pass 3 of 2 — Tier 1 narrative cards (translation-bundle, testknit-desk, deals-tab intro+benchmarks, kal-planner, submission-desk, teach-economics: 9 paragraphs) | MINOR | queued | Same scope files as QUEUE-002; payback card intro is a German template to emulate |
| 7 | QUEUE-005 | #52 workspace legend overcount — Crawler confirmation at the current build | MINOR | queued | Fixed in flight previously; needs eyes at 360/390/430px |
| 8 | QUEUE-006 | S160 "migration delta" — concrete reproduction or final strike | MAJOR | queued | Structure solid at HEAD (`storage-lib.ts` reads-once migration + corrupt-key guard); flagged REQUIRES-REPRODUCTION in restudy `97897be` — needs one deliberate repro attempt (seed legacy key, verify migration) |
| 9 | QUEUE-007 | GitHub live state re-verification (connector needed) | QUEUE-ITEM | blocked | Human action: GitHub connector not enabled in this environment; last-known 0 open issues / 0 open PRs at CHK-138 is UNVERIFIED as of Aug 19 |
| 10 | QUEUE-009 | Grading sheet page English strings — "Back to Project", "Copy TSV / CSV / Print Sheet", "BASE SIZE", "GAUGE" in `project-grading.tsx` (4 strings) | MINOR | queued | Confirmed live under DE at `2026-08-19-Q001` (finding 8); not in CHK-139 sweep scope |
| 11 | QUEUE-010 | HMR crash class — `useState(useMemo(...))` initializer pattern crashes under Vite 7 HMR with "Cannot read properties of null (reading 'useState')"; 3 components in one session (`giftcard-lab-card.tsx:132`, `testknit-desk-card.tsx:80`, `translation-bundle-card.tsx:113`). Dev-only; vitest/prod unaffected | MINOR | queued | Suggested fix: shared `useProjectStorage` hook retiring the pattern across lazy-loaded card components |

## Run ledger

| Run (date) | Item worked | Gates | Commit | Next item |
|---|---|---|---|---|
| 2026-08-19 (restudy+hygiene, pre-queue session) | RESTUDY-001 + LEDGER-HYGIENE-001 | docs only | `15b473b` | QUEUE-001 |
| 2026-08-19-Q001 | QUEUE-001 audit (12 findings) + QUEUE-009/010 registered; chip fix DEFERRED per one-fix-per-cycle | docs; gates green at `43978d8` (tsc clean, 1,978/1,978 tests, build green), re-verified at `9a749fe` | `9a749fe` | QUEUE-002 (chip first, toast second) |
| 2026-08-19-Q002 | QUEUE-002 part 1/2 — measurementsChip (5 locales, singular/plural, 0-count plural) + wire + 4 regression tests + live DE browser check (`0 Maße` chip, German delete dialog, sandbox storage restored) | tsc clean; vitest 1,981/1,981 (135 files); build green; fresh browser check pass | `f0d4078` (refs lag one amend by construction) | QUEUE-002 part 2 (toast/snackbar module) |
