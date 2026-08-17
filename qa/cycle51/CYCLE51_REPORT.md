# QA Cycle 51 — i18n Localization Review

**Repo:** `plastic-dude/stitch-and-scale-pro` · **Reviewed HEAD:** `355665d` (CHK-103) · **Previous HEAD:** `b7781f1`
**New commits under review:** CHK-099, CHK-101, CHK-102, CHK-103 — a five-language localization (i18n) migration plus partner-bundle baseline updates (167 files changed, +6,314 / −2,437).
**Author:** Manus QA · **Date:** 2026-08-17 · **Mode:** genuine visual review, iPhone 14 viewport (390×844, 3× DPR, iOS Safari UA), fresh browser profiles per test

This report is addressed to the Reviewer. The Coder should not act on this report directly; the Reviewer should evaluate the findings below and decide what to fix, what to defer, and what to reject.

## Baseline

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | Clean |
| Vitest | **1,758 / 1,758 passing** (110 files) |
| Production build | 8.22 s, no errors |
| Dev server | Fresh restart after pull, HTTP 200 |

## What this cycle tested

Because the new commits are an i18n migration, cycle 51 focused on the localization surface rather than re-running the full 79-tab money-lab sweep (cycles 48–50 already covered those panels). The sweep used **real UI interactions** (native clicks on the language picker, not injected seeds) across all five languages (en, de, fr, es, pt), verified cold-start persistence with a genuine page reload, and verified the "Skip setup" path. Visual evidence was captured for every state.

## Verified good (no defect)

**Language cold-start works.** On a fresh profile, clicking the German button in the onboarding dialog renders the whole page in German ("Willkommen bei Stitch & Scale", "Einrichtung überspringen", "Local-first — Projekte speichern sofort, kein Konto nötig"). After a genuine page reload, the stored language remains `de` and the page is still fully German. The same holds for French, Spanish, and Portuguese, where the overlay bodies are fully localized with correct accents and grammar. The earlier cycle-51 seed-script failures that made pages appear English were traced to the QA seeding mechanism itself, not to the app; the real user flow behaves correctly, so **no cold-start defect exists**.

**"Skip setup" persists correctly.** Clicking "Skip setup" writes `onboardingCompleted: true` to storage, and the overlay does not re-open on reload. Both storage stores were inspected (localStorage and the IndexedDB mirror) to confirm.

**Copy-module coverage is complete.** All 18 per-feature `*-copy.ts` modules export all five languages, and the migrated modules (marketplace take-rate, launch campaign, receipt, settings, and others) carry genuine translations — verified by reading the de/fr/es/pt dict bodies directly.

## New findings for the Reviewer

### 51-A (new issue): Workspace tools are not localized at all

The language switch today translates only the onboarding overlay, Settings, Dashboard, Landing, and Portfolio. **All 25+ workspace lab cards — the bulk of the application — have zero i18n imports and render in English regardless of the chosen language.** Static analysis listed every `components/*-card.tsx` without any i18n usage (grading table, pricing advisor, receipt lab, platform mix, wholesale, and dozens more). The app advertises five-language support in Settings, but a German or French designer who finishes onboarding in their own language lands in a workspace that is almost entirely English. This is the single largest localization gap and a design-level lead for the Reviewer: either localize the workspace cards incrementally (the existing `-copy.ts` pattern is already established), or adjust the Settings claim to say which surfaces are localized.

### 51-B (new issue): Onboarding overlay footer navigation is hardcoded English

On every non-English language, the overlay footer shows English "Back" / "Begin" / "Continue" while the entire body is translated. Visible in the French (`onboard-fr-step1.png`: body French, footer "Back"/"Begin"), German, and Spanish captures. Step 1's "Begin" is not in the 13 core workflow keys; the footer buttons need their own keys. Small, but it sits on the very first screen a new user sees.

### 51-C (new issue): Portuguese is missing one onboarding key

The Portuguese block of the core `i18n.ts` dictionary has 12 keys while en/de/fr/es have 13 — `workflow.newProject.title` is absent. On the "New Project" onboarding step, Portuguese users would fall back to English for that title. Trivial one-line fix.

### 51-D (lead): Dark-mode control unreachable until onboarding completes

The light/dark/system theme buttons live only on the Settings page, which the onboarding overlay blocks until completion. A fresh user who prefers dark mode cannot reach the control from the guided setup. Not a defect — arguably by design — but the Reviewer may want a theme affordance inside the onboarding dialog.

### 51-E (lead): Dead language storage read

`getInitialLanguage()` in `i18n.ts` reads a storage key (`stitch-and-scale-language-v1`) that no code path ever writes (`setLanguage` only updates React state; the persist effect writes `settings-v1`). Harmless today, but a future refactor that moves language out of the settings object would silently fall back to English. A one-line robustness change.

### 51-F (lead): Cold-start seed resilience

During investigation I found that a language preference written to `settings-v1` before app hydration can be silently replaced by defaults under specific storage-reconciliation conditions (a stale IndexedDB settings mirror lacking the language key). Real user flows are unaffected because the UI writes both stores consistently, but the reconciliation path deserves a defensive precedence check so stored preferences can never be quietly reverted.

## Previously open issues — re-verification

| Issue | Topic | Still open? | Evidence |
|---|---|---|---|
| #53 | Payback Lab reads output-shape fees → $0.00 net | **Yes** | `payback-lab-card.tsx` diff since `b7781f1` is copy-only; fee logic (`f.platformFee` reads) unchanged |
| #54 | Take-Rate Lab duplicate React keys (TR-03/TR-05) | **Yes** | No code change touching the ledger rendering |
| #55 | Take-Rate channel cards: unit suffix overlaps input digits | **Yes** | Same `NumField` component; suffix rendered identically; reproduced again in light mode with real numbers |

None of the four new commits modify the defect logic; the only code changes to affected cards are the new translated copy strings.

## Screenshots

| File | What it shows |
|---|---|
| `onboard-fr-step1.png` | French overlay step 1 — body fully French, footer still English "Back"/"Begin" (findings 51-A/51-B) |
| `onboard-de-step1.png` | German overlay step 1 — body fully German, English footer |
| `onboard-es-step1.png` | Spanish overlay step 1 — body fully Spanish, English footer |
| `onboard-pt-step1.png` | Portuguese overlay step 1 — body fully Portuguese ("Bem-vindo ao Stitch & Scale") |
| `onboard-en-step1.png` | English control baseline |
| `onboard-fr-step2.png` | French step 2 "Fondé sur des principes" — localized body, English "Back"/"Continue" |
| `flow-reload-post.png` | Cold-start persistence evidence (German retained after reload) |
| `de-01-landing-before.png`, `de-02-landing-scrolled.png`, `en-01/02-*.png`, `fr-01/02-*.png`, `es-01/02-*.png`, `pt-01/02-*.png` | Earlier-sweep localized page captures from cycle-51 phases 1–2 |

## Summary

The i18n migration itself is healthy: full five-language coverage on every page it reaches, correct cold-start persistence, and complete per-feature copy modules. The gap is coverage, not quality — the workspace (the app's core) and the overlay footer remain English-only, and Portuguese is missing a single key. Issues #53, #54, and #55 remain open and unchanged by this batch.
