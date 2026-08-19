# Schedule State — Main Worker 15m Team Lead Loop

**Date:** 2026-08-19 · **Author:** Manus (Main Worker / Team Lead) · **Verified:** schedule configuration read back after update.

## What changed

The owner attached the new 15-minute Team Lead loop playbook (`Main_Worker___Team_Lead_Loop_—_15_Minutes.md`). A byte-for-byte comparison (`diff`) confirmed the repo's `docs/agent-prompts/main-worker-loop-15m.md` is **already identical** to the attachment — no playbook edit or repo commit was required for it.

The schedule definition, however, still carried the old backlog-only detail (no research step, no playbook reference, run-as-same-task). It was updated to the new loop and the change is now active.

| Property | Before | After |
|---|---|---|
| Name | Stitch & Scale: perfection backlog cycles | Stitch & Scale Main Worker — Team Lead 15m loop |
| Playbook | (none) | `docs/agent-prompts/main-worker-loop-15m.md` on `main` (raw GitHub URL) |
| Interval | 900 s | 900 s (unchanged) |
| Run mode | Same task | Fresh isolated task per run (`runAsNewTask: true`) |
| Status | paused | **active** |
| Detail | Old backlog-only directive | New 10-step run order: pull → read project truth → fresh research → archive reconciliation → inbox sweep (escalation list verified against the current tree every firing per `docs/team-standing-orders.md` — S182/S251 verified FIXED IN CODE at restudy `97897be`, S160 REQUIRES-REPRODUCTION) → one item → implement with storage seam → typecheck/vitest/build gates → evidence + push → report; stop conditions and forbidden shortcuts restated |

## Run discipline encoded

Each firing is now a fresh isolated task that re-reads the actual project truth files rather than relying on memory, performs fresh research before any coding (never to justify an invented feature), reconciles findings against the product constitution, works exactly one highest-severity evidenced item, and forbids `[VERIFIED]` claims unless all three gates pass. The repo remains private, `stitch-and-scale-rc` remains untouched, and `UNVERIFIED` is the mandatory mark for anything not measured.

## Next firing

The next 15-minute run will execute the loop end to end: pull, read the current project truth (including this note and `docs/leader-notes/assimilated-memory-2026-08-19.md`), pick a fresh research angle not repeated from the previous run, reconcile against the backlog, and land exactly one item with full gates and a concise report.
