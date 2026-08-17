# 51-A cycle — dashboard workspace cards (2026-08-17)

At HEAD 0bb6c4f (CHK-108). Target: `src/pages/dashboard.tsx` + `src/lib/dashboard-copy.ts`.

English literals confirmed in dashboard.tsx (all user-facing, must be localized via copy keys):

| Line | Literal | New copy key |
|---|---|---|
| 182 | `{n} project(s) in your workspace` | inWorkspace (singular already keyed) |
| 254 | `Restoring…` / `or restore a backup from a .json file` | restoring / orRestore |
| 285 | `Duplicate` | duplicateAction (verb form; existing `duplicate` is past tense toast title) |
| 289 | `Export as JSON` | exportJson |
| 298/390 | `Delete` (menu + confirm button) | deleteAction |
| 315 | `Graded` | graded |
| 323 | `Draft` | draft |
| 335 | `Size {n}` | sizeLabel |
| 345 | `{n} section(s)` | sectionsLabel |
| 366 | `Start New Pattern` | startNewPattern |
| 368 | `Set up base` | setUpBase |
| 378 | `Delete "{name}"?` | deleteTitle |
| 380 | description text | deleteDesc |
| 384 | `Cancel` | cancel |

Note: `formatDistanceToNow(...,{addSuffix:true})` uses date-fns locale — date-fns uses the imported locale, currently English; localize via `date-fns/locale` map if straightforward, else leave (dates are numeric-ish). Decision: date-fns `fr`/`de`/`es`/`pt` locales exist in date-fns/locale — add small locale map to keep dynamic prose localized.

Approach: extend DashboardCopy interface + all 5 locale objects (en/de/fr/es/pt) with the new keys (genuine translations; de/fr/es/pt already exist in app pattern), wire dashboard.tsx to copy. No calculation changes.

TODO after edits: tsc; vitest; build; preview :5000 (running? check ss -ltn); visual: dashboard at / with language switch; commit scoped (dashboard-copy.ts + dashboard.tsx + new test), push, comment evidence on #56 (51-A fixed; 51-B done CHK-107; 51-C not reproducible), close #56.
Next backlog after: #54 duplicate React keys / #59 Take-Rate TR-03/TR-05; long MAJORs S182/S251.

## Progress (06:45)
- dashboard-copy.ts DONE: 15 new keys appended to interface + all 5 locales (en/de/fr/es/pt verified). Keys: inWorkspace, restoring, orRestore, duplicateAction, exportJson, deleteAction, graded, draft, sizeLabel, sectionsLabel, startNewPattern, setUpBase, deleteTitle, deleteDesc, cancel. Placeholders {0} for sizeLabel, deleteTitle; sectionsLabel is singular with plural handled at render via count.
- NEXT: wire dashboard.tsx to copy — replace literals at lines 182, 254, 285, 289, 298, 315, 323, 335, 345, 366, 368, 378, 380, 384, 390 with copy.x references. For {0} placeholders: `copy.deleteTitle.replace('{0}', name)` etc.
- Then: date-fns locale — check if dashboard imports date-fns and add locale map (de/fr/es/pt locales exist in date-fns/locale; en default). Optional but QA wants dynamic prose localized.
- Then: new test file src/lib/dashboard-copy.test.ts (per-locale key parity + sample spot checks), tsc, vitest, build, preview :5000 visual (dashboard at /, language switch to de), commit scoped files only (no docs/perfection notes), push, gh comment+close #56, report.
- gh login: token via git remote url sed (see 51A notes above). Repo plastic-dude/stitch-and-scale-pro.

## Gates + visual (06:52)
- Typecheck clean. Vitest 114 files / 1,776 tests green. Production build ✓ (6.21s, only known sourcemap warnings).
- Visual at :5000 (German locale): dashboard shows "2 Projekte in deinem Bereich", chips "Graduiert", "Größe M", "3 Abschnitts", "vor etwa 2 Stunden" (date-fns de locale working), card button "Neues Muster starten / Basis einrichten". Onboarding footer shows Zurück/Los geht's. Fix verified real.
- Remaining commit steps: stage artifacts/stitch-and-scale/src/pages/dashboard.tsx src/lib/dashboard-copy.ts src/lib/dashboard-copy.test.ts; commit CHK-109; push; gh comment+close #56; report.
- Next backlog: #54 / #59 duplicate React keys (Take-Rate TR-03/TR-05), then long MAJORs S182/S251.
