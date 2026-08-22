# Stitch & Scale Work Queue

**Canonical file for the 15-minute loop firings.** This file is the single source of truth for "what is next." Every firing reads it first, works the first `queued` entry, updates statuses inline, and appends a ledger line. Owner directive 2026-08-19: firings continue this queue from the start, never restart from scratch.

## Queue entries (walking order)

| # | id | Description | Severity | Status | Evidence / notes |
|---|---|---|---|---|---|
| 1 | RESTUDY-001 | Full chronological restudy S001→HEAD | QUEUE-ITEM | done | `97897be`; details in `docs/leader-notes/restudy-2026-08-19-S001-to-HEAD.md` |
| 2 | LEDGER-HYGIENE-001 | Strike stale escalations (S182/S251 fixed in flight, S160 REQUIRES-REPRODUCTION, bundle partners functional); add Reviewer rule against re-escalating fixed items | QUEUE-ITEM | done | `15b473b`; `docs/team-standing-orders.md` updated |
| ... | ... | ... | ... | ... | ... |
| 65 | QUEUE-050 | Priority 1 Gap 1: Visual Chart Authoring Layer (Phase 1: Grid, Palette, Symbols) | MAJOR | done | CHK-194: Visual grid editor + palette + grid-to-prose sync |
| 66 | QUEUE-051 | Priority 1 Gap 2: Pattern composition and compiled document production | MAJOR | done | CHK-195: Storage seam + CompositionPanel + Compiled PDF Renderer + Verified Gates |
| 67 | QUEUE-052 | Priority 0 Gap 3: Rendered-artifact publication inspection | MAJOR | done | CHK-196: Storage seam + Inspection UI + Localized reports |
| 68 | QUEUE-053 | Priority 1 Gap 4: Technical-editor defect ledger | MAJOR | done | CHK-197: Schema expansion + Five-locale UI + Lifecycle logic + Verified Gates |
| 69 | QUEUE-054 | Priority 1 Gap 5: Test-knit rounds and archival records | MAJOR | done | CHK-198: Durable records for test-knit rounds + localized archive UI + storage seam |
| 70 | QUEUE-055 | Priority 1 Gap 6: Sample tracker for physical design assets | MAJOR | done | CHK-199: Storage seam + SampleTracker UI + Five-locale localization |
| 71 | QUEUE-056 | Priority 1 Gap 7: Submission pipeline for outlet deadlines | MAJOR | done | CHK-200: Durable submissions records + UI verification + Context crash fix |
| 72 | QUEUE-057 | Wholesale follow-up: durable local records for yarn shop orders | MAJOR | done | CHK-201: Durable wholesale records + localized UI + storage seam |
| 73 | QUEUE-058 | Reconcile navigator lab counts and verify search/favorites integration | MINOR | done | CHK-202: Dynamic lab counts + hook violation fixes + tab integrity verified |
| 74 | QUEUE-059 | Branding Audit: logo usage, footer attribution, and EMLUX positioning | MINOR | done | CHK-203: Branding standardized + EMLUX positioning + QA localization fixes |
| 75 | QUEUE-060 | Revenue & Growth: pricing strategy, model selection, and experiments | MINOR | done | CHK-204: Evidence-led revenue planner + growth pillars + five-locale UI |

## Run ledger
| Run (date) | Item worked | Gates | Commit | Next item |
|---|---|---|---|---|
| 79 | 2026-08-22 (CHK-201) | QUEUE-057 (MAJOR) — Wholesale Follow-up | tsc clean; vitest 2,422/2,422; build green; durable wholesale records + localized UI + storage seam | 6faeb67 | QUEUE-058 |
| 78 | 2026-08-22 (CHK-200) | QUEUE-056 (MAJOR) — Submission Records | tsc clean; vitest 2,422/2,422; build green; durable submissions records + localized UI + dialog crash fix | 50785a1 | QUEUE-057 |
| 77 | 2026-08-22 (CHK-199) | QUEUE-055 (MAJOR) — Sample Tracker | tsc clean; vitest 2,417/2,417; build green; storage seam + SampleTracker UI + browser verified | cac0762d30d890dfc052595d655f718e26a09e95 | QUEUE-056 |
| 76 | 2026-08-22 (CHK-198) | QUEUE-054 (MAJOR) — Test-Knit Archive | tsc clean; vitest 2,417/2,417; build green; storage seam + localized UI + browser verified | 3b36e1a64a862e6081220498a39a26686258219d | QUEUE-055 |
| 75 | 2026-08-22 (CHK-197) | QUEUE-053 (MAJOR) — Defect Ledger | tsc clean; vitest 2,413/2,413; build green; five-locale UI + lifecycle + tab fix | 43b545466d279beb495ae526e8f538c4ae8a5fca | QUEUE-054 |
| 74 | 2026-08-22 (CHK-196) | QUEUE-052 (MAJOR) — Artifact Inspection | tsc clean; vitest green; build green; storage seam + inspection UI + localized reports | 99e8620b0b31032ebcdf6a13cabcc1bb8cf1a3be | QUEUE-053 |
| 73 | 2026-08-22 (CHK-195) | QUEUE-051 (MAJOR) — Pattern Composition | tsc clean; vitest green; build green; storage seam + composition UI + compiled renderer | 195fa85cb1e37e00098168d8d371f4590e419f94 | QUEUE-052 |
| 72 | 2026-08-22 (CHK-194) | QUEUE-050 (MAJOR) — Visual Chart Layer | tsc clean; vitest green; build green; grid editor + symbol palette + grid-to-prose sync | 9c009f6 | QUEUE-051 |
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
| 80 | 2026-08-22 (CHK-202) | QUEUE-058 (MINOR) — Navigator Reconciliation | tsc clean; vitest 2,422/2,422; build green; dynamic lab counts + hook violation fixes | 5f8c954 | QUEUE-059 |
| 81 | 2026-08-22 (CHK-203) | QUEUE-059 (MINOR) — Branding Audit | tsc clean; vitest 2,422/2,422; build green; branding standardized + EMLUX positioning + QA fixes | be7f767 | QUEUE-060 |
| 82 | 2026-08-22 (CHK-204) | QUEUE-060 (MINOR) — Revenue & Growth | tsc clean; vitest 2,425/2,425; build green; evidence-led revenue planner + growth pillars + localized UI | 6b66e1d | QUEUE-061 |
| 83 | 2026-08-22 (CHK-205) | QUEUE-061 (MAJOR) — Navigator Localization | tsc clean; vitest 2,430/2,430; build green; fixed 5 missing labels; fixed touch targets | dc02909 | QUEUE-062 |
| 84 | 2026-08-22 (CHK-206) | QUEUE-062 (CRITICAL) — Data Integrity | tsc clean; vitest 2,434/2,434; build green; nested normalization + publication gate + calculator quarantine | 5c0ab5a | done |
| 76 | QUEUE-061 | Lab search, recent, and favorites integration for mobile navigation | MAJOR | done | CHK-205: Audited localization; fixed 5 missing labels in de/fr/es/pt; fixed 44px touch targets. |
| 77 | QUEUE-062 | Data Integrity & Validation: Impossible measurement guard and global integrity gate | CRITICAL | done | CHK-206: Nested normalization + publication integrity gate + calculator quarantine. |
