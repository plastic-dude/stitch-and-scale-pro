# Work Queue — continued queue protocol

**Canonical file for the 15-minute loop firings.** This file is the single source of truth for "what is next." Every firing reads it first, works the first `queued` entry, updates statuses inline, and appends a ledger line. Owner directive 2026-08-19: firings continue this queue from the start, never restart from scratch.

## Queue entries (walking order)

| # | id | Description | Severity | Status | Evidence / notes |
|---|---|---|---|---|---|
| 1 | RESTUDY-001 | Full chronological restudy S001→HEAD | QUEUE-ITEM | done | `97897be`; details in `docs/leader-notes/restudy-2026-08-19-S001-to-HEAD.md` |
| 2 | LEDGER-HYGIENE-001 | Strike stale escalations (S182/S251 fixed in flight, S160 REQUIRES-REPRODUCTION, bundle partners functional); add Reviewer rule against re-escalating fixed items | QUEUE-ITEM | done | `15b473b`; `docs/team-standing-orders.md` updated |
| 3 | QUEUE-001 | QA coverage gap: localization sprint (CHK-137..139, localizations surfaces) had no third-party audit since QA stopped Aug 17 22:17 | MAJOR | queued | QA last tip `d89608f`; Crawler/Reviewer pass over workspace, gift card, grading, bundle, tester-desk surfaces at current build — one firing walks this |
| 4 | QUEUE-002 | Localization pass 1 of 2 — free small items: `0 measurements` chip (`project-workspace.tsx:585`, `workspace-copy.ts` helper) and toast/snackbar module (`toast-copy.ts` converting 93 calls, 17+13 distinct strings) | MINOR | queued | Scope in `docs/leader-notes/scope-estimate-longform-localization.md`; plan in `docs/leader-notes/cycle-2026-08-18-chk140-plan.md` |
| 5 | QUEUE-003 | Localization pass 2 of 2 — Tier 2 narratives ("Benchmarks baked in" footers, 9 cards) + ~95 `<Field hint>` strings across 8 files | MINOR | queued | Same scope files as QUEUE-002 |
| 6 | QUEUE-004 | Localization pass 3 of 2 — Tier 1 narrative cards (translation-bundle, testknit-desk, deals-tab intro+benchmarks, kal-planner, submission-desk, teach-economics: 9 paragraphs) | MINOR | queued | Same scope files as QUEUE-002; payback card intro is a German template to emulate |
| 7 | QUEUE-005 | #52 workspace legend overcount — Crawler confirmation at the current build | MINOR | queued | Fixed in flight previously; needs eyes at 360/390/430px |
| 8 | QUEUE-006 | S160 "migration delta" — concrete reproduction or final strike | MAJOR | queued | Structure solid at HEAD (`storage-lib.ts` reads-once migration + corrupt-key guard); flagged REQUIRES-REPRODUCTION in restudy `97897be` — needs one deliberate repro attempt (seed legacy key, verify migration) |
| 9 | QUEUE-007 | GitHub live state re-verification (connector needed) | QUEUE-ITEM | blocked | Human action: GitHub connector not enabled in this environment; last-known 0 open issues / 0 open PRs at CHK-138 is UNVERIFIED as of Aug 19 |

## Run ledger

| Run (date) | Item worked | Gates | Commit | Next item |
|---|---|---|---|---|
| 2026-08-19 (restudy+hygiene, pre-queue session) | RESTUDY-001 + LEDGER-HYGIENE-001 | docs only | `15b473b` | QUEUE-001 |
