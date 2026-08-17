# Perfection cycle — NEXT item selection (2026-08-17 06:20, at HEAD 0bb6c4f = CHK-108)

## Inbox state confirmed this sweep
- #57 CLOSED (CHK-108 Payback gross derivation).
- #58 OPEN but Reviewer-triaged NOT REPRODUCIBLE — no action.
- #59 INFO — Take-Rate TR-03/TR-05 duplicate React keys — lowest severity open.
- #56 OPEN — 51-B DONE (CHK-107); 51-C not reproducible; **51-A workspace project cards untranslated remains** — top localization target.
- #54 duplicate React keys — queued behind 51-A.
- Long MAJORs S182 / S251 remain open in ledger (AUDIT-HONESTY-2026-08-16.md).

## This cycle's target
Selected per playbook ordering (correctness first, then localization): nothing higher-severity than 51-A is triaged and actionable. Working 51-A: localize workspace project cards (dashboard/project listing cards) that remain English-only.

## Conventions learned so far (reuse)
- gh auth via remote-embedded token: `token=$(git remote get-url origin | sed -n 's|https://\(ghp_[A-Za-z0-9]*\)@.*|\1|p') && echo "$token" | gh auth login --with-token`
- i18n typed dictionary: keys in `src/lib/i18n.ts` union + 5 locale blocks; insertion via plain-string replacement on the block lines (regex on single quotes is fragile; use /tmp/add_overlay_keys4.py-style approach: append to each locale block's content before its closing `},`).
- Pages get `t()` via `useSettings()` from '@/context/SettingsContext'; stepKey pattern: declare translation key union AFTER the relevant state, type as TranslationKey for t().
- Regression tests: 4-5 focused tests against public i18n API (translate, getMissingTranslationKeys).
- Gates: pnpm exec tsc --noEmit; pnpm vitest run; pnpm run build; preview on :5000 (already running at :5000, ss check first).
- Repo root commit paths are under artifacts/stitch-and-scale/...; do NOT commit docs/perfection-cycle notes.
- Comment via `gh issue comment N --body-file /tmp/file.md`; close via `gh issue close N --repo plastic-dude/stitch-and-scale-pro --comment "..."`.
- Screenshot knowledge: user likes screenshots in reports; app currently renders in German (de) in the local preview.
