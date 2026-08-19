# Cycle 2026-08-19 — QUEUE-001 audit of the localization-sprint surfaces

**Run id:** 2026-08-19-Q001. **Tree:** `43978d8` (HEAD at audit start). **Method:** full reload per surface (HMR state excluded from verdicts), German locale throughout, desktop viewport, eyes-pass plus toast interception. Gates verified green at audit start (tsc clean, vitest 1,978/1,978 across 135 files, build green).

## Verdict

QUEUE-001 is **done**. The third-party audit over the localization-sprint surfaces at HEAD confirmed that the CHK-137..139 fixes genuinely hold under a fresh German locale session, found **two confirmed unlocalized defects** on primary surfaces, and discovered one **dev-only defect class**. No defect was introduced by the sprint; two surfaces still render English where German is configured.

## Findings

| # | Surface | Verdict | Notes |
|---|---|---|---|
| 1 | Sections empty state ("Noch keine Abschnitte", add-first button, new-section dialog) | German | CHK-139 fixes hold under reload |
| 2 | Sections delete dialog (title, body with count, Behalten / Löschen) | German | Verified live with trash click |
| 3 | **Measurements chip — `{count} measurements`** | **ENGLISH — DEFECT** | Primary fix chosen this cycle: `0 measurements` renders English under DE at `project-workspace.tsx:585`. Fixed as CHK-140 in the same commit as this report |
| 4 | Delete toast ("Section deleted" / "If that was a misclick…") | **ENGLISH — DEFECT** | Toast module is unlocalized; registered in queue tail as QUEUE-008 item alongside chip (chip now done) |
| 5 | Gauge byline ("20M × 28R / 4in" style) | German | CHK-137 formatting holds |
| 6 | Gift Card lab (checkbox "Verfall und Inaktivitätsgebühren…", "60 % des Nennwerts" select, GC-03/04/09 warnings, stat margins) | German | All verified after clean server restart |
| 7 | Grading card empty state ("Noch keine Gradierungsdaten vorhanden…") | German | CHK-139 holds |
| 8 | **Grading sheet page — "Back to Project", "Copy TSV / CSV / Print Sheet", "BASE SIZE", "GAUGE"** | **ENGLISH — DEFECT** | Not in CHK-139 sweep scope; 4 strings registered as QUEUE-009 |
| 9 | Tester desk empty state ("Noch keine Tester — tippe oben…") | German | CHK-139 holds |
| 10 | Tester desk card body (title, intro, coverage, roster labels, benchmarks paragraph) | **ENGLISH — Tier 1 narrative** | Confirmed live; already covered by QUEUE-004 scope |
| 11 | Translation & Bundle planner card (title, intro, all field labels, table headers, pitch template) | **ENGLISH — Tier 1 narrative** | Confirmed live (largest single unlocalized card); partners empty state is German; already covered by QUEUE-004 scope |
| 12 | **HMR crash class — `useState(useMemo(...))`** | **DEV-ONLY DEFECT** | Three distinct components crashed in one session (`giftcard-lab-card.tsx:132`, `testknit-desk-card.tsx:80`, `translation-bundle-card.tsx:113`) with "Cannot read properties of null (reading 'useState')". Vitest and prod build unaffected. Registered as QUEUE-010 |

## Confirmed audit picture

The localization sprint is substantively sound: every CHK-139 fix verified under fresh reload. The remaining English surfaces are exactly the four already planned long-form passes — the chip (done as CHK-140 this firing), toasts (QUEUE-008 tail item), Tier 2 field hints (QUEUE-003), and Tier 1 narrative cards (QUEUE-004), plus the newly found grading-sheet page strings.

## Honest limitations

Mobile viewports (360/390/430 px) could not be visually verified from eyes: the sandbox browser's fixed 1280 px viewport cannot be reliably narrowed — a programmatic innerWidth override did not trigger Tailwind breakpoints in the rendered CSS. This is a crawler-environment limitation, not a finding. Mobile QA rides with the next crawler eyes-pass. QUEUE-005 (legend overcount) is a desktop-only confirmation and remains queued.

## Register changes

Two new queue entries appended at the tail: **QUEUE-009** (grading sheet page — 4 English strings in `project-grading.tsx`) and **QUEUE-010** (HMR crash class — replace `useState(useMemo(...))` initializer pattern across lazy-loaded card components; suggested fix is a shared `useProjectStorage` hook retiring the pattern). QUEUE-002 was updated: the chip item is done as CHK-140, so QUEUE-002 now covers the toast/snackbar module only.
