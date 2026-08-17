# Perfection cycle — issue #56 (QA cycle 51) work notes

Session: perfection-cycle. Current HEAD: b96f474 (CHK-106).

## Verified facts about issue #56 (from /tmp/issue56.json, fetched 2026-08-17)
- QA Cycle 51 report (qa-report label), addressed to Reviewer. Baseline: b7781f1.
- 51-A: 25+ workspace lab cards untranslated — LARGE tranche; incremental migration via `-copy.ts` pattern. NOT for this single-fix cycle (too large; also no Reviewer triage decision converting it to an approved scope yet; a single-cycle fix must stay minimal).
- 51-B: Onboarding overlay footer "Back"/"Begin"/"Continue" hardcoded English on every non-EN language — CONFIRMED in src/pages/onboarding.tsx (hardcodes at lines ~601 "Back", ~609 "Begin"/"Continue", ~625 "Back"). THIS IS THE FIX FOR THIS CYCLE.
- 51-C: pt missing workflow.newProject.title — NOT REPRODUCIBLE. All five locales (en/de/fr/es/pt) now have the full 15-key newProject set (verified programmatically). The QA count was a counting artifact. Do not "fix" this.
- 51-D/F: dark-mode control behind overlay; getInitialLanguage() dead read — low-priority leads, out of scope for this cycle.
- Issue #54 (Take-Rate duplicate React keys) and long-open MAJORs (S182, S251, empty-standards) are next backlog candidates.

## Fix in progress (this cycle)
1. DONE: Added 'workflow.overlay.back' | 'workflow.overlay.begin' | 'workflow.overlay.continue' to TranslationKey union in src/lib/i18n.ts (line ~53).
2. IN PROGRESS: Script /tmp/add_overlay_keys2.py appends three key entries to each locale block:
   en: Back / Begin / Continue
   de: Zurück / Los geht's / Weiter
   fr: Retour / Commencer / Continuer
   es: Atrás / Empezar / Continuar
   pt: Voltar / Começar / Continuar
3. TODO: Wire onboarding.tsx footer to t('workflow.overlay.back') and t('workflow.overlay.begin'/'continue') per step. Steps 6 and 7 already have their own footer (keyboard nav block, line ~616) — wire its Back too (honesty: QA showed "Back" English on every language).
4. TODO: Regression test file (new, focused) verifying all 5 locales have the three overlay keys and that onboarding renders the localized labels (via dictionary lookup, not necessarily react testing-library).
5. TODO: gates — pnpm run typecheck; pnpm exec vitest run; pnpm run build; localhost preview visual check of onboarding overlay (http://127.0.0.1:5000, seeded project URL http://127.0.0.1:5000/project/sample-crew-neck-sweater).
6. TODO: commit template [CHK-107] [STITCH-AND-SCALE-PRO] [VERIFIED] ...; push origin main; comment evidence on issue #56 on GitHub plastic-dude/stitch-and-scale-pro (token in remote URL); note 51-C unreproducible and 51-A pending triage/scope decision in the comment (do NOT close the issue unless all three items are done — likely keep open or close as partially fixed with explanation; decision: comment only, leave open, state 51-B done, 51-C already good, 51-A awaits review triage).
7. TODO: report to user: item fixed (51-B + 51-C debunk), commit hash, gates, next backlog item (#54 duplicate React keys or #51-A triage request).

## Repo mechanics
- Remote origin = https://<TOKEN>@github.com/plastic-dude/stitch-and-scale-pro.git; TOKEN = ${remote#https://} cut at @github.com.
- Repo PRIVATE; localhost-only preview; never touch stitch-and-scale-rc.
- Quality: honest claims only; measure gates from current tree.
- App dir: artifacts/stitch-and-scale (React/Vite/TS/Tailwind).

## State update — 2026-08-17 05:38 (GATES GREEN, VISUAL VERIFIED)
- Full vitest: 113 files / 1,767 tests passed. Build: green (known large-chunk warning only). tsc: clean.
- VISUAL VERIFIED in German (de): onboarding overlay step 1 renders footer "Zurück" (Back) left and "Los geht’s" (Begin) right — both genuinely localized. Screenshots saved at /home/ubuntu/screenshots/127_0_0_1_2026-08-17_05-37-47_7128.webp and 05-37-37.
- TODO next: commit CHK-107 (files: src/lib/i18n.ts, src/pages/onboarding.tsx, src/lib/overlay-footer-copy.test.ts — NOT the notes file), push, comment evidence on issue #56 (leave open; 51-B fixed, 51-C not reproducible, 51-A awaits triage), report to user.

## State update — 2026-08-17 05:37 (fix DONE locally)
- i18n.ts: union keys added at line ~53; three overlay keys appended to EACH locale block via /tmp/add_overlay_keys4.py — verified 6 occurrences of each key (1 union + 5 values). Values: en Back/Begin/Continue; de Zurück/Los geht’s/Weiter; fr Retour/Commencer/Continuer; es Atrás/Empezar/Continuar; pt Voltar/Começar/Continuar.
- onboarding.tsx: footer wired — `t('workflow.overlay.back')` both Back buttons; `stepKey` (typed union, declared after `const [step, setStep] = useState(1)`) selects begin/continue. `language` destructure left unused but TS is happy (exit 0). NOTE: consider removing unused `language` destructure for cleanliness — decision: leave it (used implicitly by t() via settings.language; harmless).
- Test file: src/lib/overlay-footer-copy.test.ts — 4 tests pass against public API (translate, getMissingTranslationKeys).
- tsc --noEmit: CLEAN. Next: full vitest suite + pnpm run build + localhost visual (preview at :5000). Then commit CHK-107, push, comment on issue #56 (do not close — 51-B fixed, 51-C not reproducible, 51-A awaits triage), report.
- IMPORTANT: the docs/perfection-cycle-51b-notes.md file is uncommitted — do NOT include it in the CHK commit (scope). Delete or leave, but keep commit scoped to: src/lib/i18n.ts, src/pages/onboarding.tsx, src/lib/overlay-footer-copy.test.ts.

## State update (after edits)
- Union addition DONE once again (file was reset; run `file edit` on i18n.ts union line: replace the end of the draftPattern union member with a newline + the three overlay keys ending in ';'. NOTE: after checkout the union edit was LOST too — must re-apply.
- Dictionary insertion script: /tmp/add_overlay_keys3.py — insert 3 keys into each locale block using raw strings (unicode escapes: \u00fc, \u2019, \u00e1, \u00e7). NEVER grep with [^'] regexes on this file; values may contain curly apostrophes. Verify with `grep -o` and count == 5 per key + 1 in union = 6 total.
- Onboarding wiring STILL TODO: src/pages/onboarding.tsx lines ~600-628: three hardcoded literals: `<ChevronLeft /> Back` (line ~601), `{step === 1 ? 'Begin' : 'Continue'}` (line ~609), second `Back` (line ~625). Import `useLanguage`/`useSettings` per existing convention: grep for `useSettings()` or `t(` imports in that file first.
- Notes file at docs/perfection-cycle-51b-notes.md (this file) — commit it as part of CHK-107? Better to keep commit scoped: include only i18n.ts, onboarding.tsx, and a new test file. Keep notes file OUT of commit (or include; decision: include docs file as it records the verified 51-C debunk for future cycles).
- Next after wiring: run `pnpm exec tsc --noEmit`, `pnpm exec vitest run` (expect ~1763 tests), `pnpm run build`, preview check at http://127.0.0.1:5000 (server may need restart: `pnpm exec vite --port 5000` in artifacts/stitch-and-scale).
- Commit: [CHK-107] [STITCH-AND-SCALE-PRO] [VERIFIED] — then push, then comment on issue #56 (do NOT close; 51-B fixed, 51-C not reproducible, 51-A awaiting review triage).
