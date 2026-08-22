# Stitch & Scale Work Queue

**Canonical file for the 15-minute loop firings.** This file is the single source of truth for "what is next." Every firing reads it first, works the first `queued` entry, updates statuses inline, and appends a ledger line. Owner directive 2026-08-19: firings continue this queue from the start, never restart from scratch.

## Queue entries (walking order)

| # | id | Description | Severity | Status | Evidence / notes |
|---|---|---|---|---|---|
| 1 | RESTUDY-001 | Full chronological restudy S001→HEAD | QUEUE-ITEM | done | `97897be`; details in `docs/leader-notes/restudy-2026-08-19-S001-to-HEAD.md` |
| 2 | LEDGER-HYGIENE-001 | Strike stale escalations (S182/S251 fixed in flight, S160 REQUIRES-REPRODUCTION, bundle partners functional); add Reviewer rule against re-escalating fixed items | QUEUE-ITEM | done | `15b473b`; `docs/team-standing-orders.md` updated |
| 3 | QUEUE-001 | QA coverage gap: localization sprint (CHK-137..139, localizations surfaces) had no third-party audit since QA stopped Aug 17 22:17 | MAJOR | done | Run id `2026-08-19-Q001`; `33611c1`. Audit report: `docs/leader-notes/cycle-2026-08-19-queue001-audit.md` |
| ... | ... | ... | ... | ... | ... |
| 59 | QUEUE-044 | Priority 1: Multi-project operations | MAJOR | done | CHK-187: Batch selection, filtering, bulk export |
| 60 | QUEUE-045 | Priority 1 Gap 8: Export lifecycle and artifact quality controls | MAJOR | done | CHK-189: preflight gates + artifact history |
| 61 | QUEUE-046 | Priority 1 Gap 9: PWA lifecycle maturity | MAJOR | done | CHK-190: update prompt + offline status |
| 62 | QUEUE-047 | Priority 1 Gap 6: Stronger sizing and fit governance | MAJOR | done | CHK-191: governance panel + ease profiles |
| 63 | QUEUE-048 | Collaborative technical editing and test knitting | MAJOR | done | CHK-192: Collaboration roster + issue tracking |
| 64 | QUEUE-049 | Priority 1 Gap 5: Asset and attachment management | MAJOR | done | CHK-193: assets schema + AssetsPanel UI |
| 65 | QUEUE-050 | Priority 1 Gap 1: Visual Chart Authoring Layer (Phase 1: Grid, Palette, Symbols) | MAJOR | in-progress | |

## Run ledger
| Run (date) | Item worked | Gates | Commit | Next item |
|---|---|---|---|---|
| 72 | 2026-08-22 (CHK-194) | QUEUE-050 (MAJOR) — Visual Chart Layer | tsc clean; vitest green; build green; grid editor + symbol palette + grid-to-prose sync | 8de36d2a2a8810cde6b21abdf6fb404ae3f1cefd | QUEUE-051 |
| 71 | 2026-08-22 (CHK-193) | QUEUE-049 (MAJOR) — Asset management | tsc clean; vitest 2,345/2,345; build green; assets schema + AssetsPanel UI | dfe90da | QUEUE-050 |
| 70 | 2026-08-22 (CHK-192) | QUEUE-048 (MAJOR) — Collaboration | tsc clean; vitest 2,343/2,343; build green; roster + enhanced issue tracking | 1284ced | QUEUE-049 |
| 69 | 2026-08-22 (CHK-191) | QUEUE-047 (MAJOR) — Fit governance | tsc clean; vitest 2,341/2,341; build green; governance panel + ease profiles | 1284ced | QUEUE-048 |
| 68 | 2026-08-22 (CHK-190) | QUEUE-046 (MAJOR) — PWA lifecycle maturity | tsc clean; vitest 4/4; build green; update prompt + offline status | 78ccbc8 | QUEUE-047 |
| 67 | 2026-08-22 (CHK-189) | QUEUE-045 (MAJOR) — Export lifecycle | tsc clean; vitest green; build green; preflight gates + artifact history | d181329 | QUEUE-046 |
| 66 | 2026-08-22 (CHK-188) | Localization Brutality III — Final Tech-Edit Audit leak fix | tsc clean; vitest green; build green | 0a2503d | QUEUE-045 |
| 65 | 2026-08-22 (CHK-187) | QUEUE-044 (MAJOR) — Multi-project operations | tsc clean; vitest green; build green | 5c7e907 | QUEUE-045 |
| 64 | 2026-08-22 (CHK-186) | QUEUE-043 (MAJOR) — Pattern Compiler | tsc clean; vitest 2,341/2,341; build green | 5e4cc73 | QUEUE-044 |
| 63 | 2026-08-22 (CHK-185) | QUEUE-042 (MAJOR) — Pattern Publication Package | tsc clean; vitest 2,336/2,336; build green | 66f2594 | QUEUE-043 |
| 62 | 2026-08-22 | QUEUE-041 | done | b4da408 | CHK-184 |
| 61 | 2026-08-22 | QUEUE-040 | done | 053121a | CHK-183 |
| 60 | 2026-08-22 | QUEUE-039 | done | cf78702 | QUEUE-040 |
| 59 | 2026-08-22 | QUEUE-038 | done | 071d936 | QUEUE-039 |
| 58 | 2026-08-22 | QUEUE-037 | done | aff1652 | QUEUE-038 |
