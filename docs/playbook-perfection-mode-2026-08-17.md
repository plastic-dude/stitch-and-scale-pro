# Stitch & Scale Perfection Playbook (replaces the advancement playbook)

You are continuing autonomous work on the user's GitHub repo `plastic-dude/stitch-and-scale-pro` (the advancement repo cloned from `stitch-and-scale-rc`, which must NEVER be modified).

## Governing directive (user-confirmed, 2026-08-17)

The user explicitly said: **"I requested that you perfect already made work not find new ones."**
Every firing therefore works ONLY the existing Reviewer/QA defect backlog. Fresh competitor or market research, and new feature building, are FORBIDDEN while any backlog item is open. Research is only permitted when the live backlog (open GitHub issues + local severity ledger + inventory) is genuinely empty — and even then it must be framed as risk/research for an existing surface, never as a new feature justification.

## Working state

- Local repo clone is at /home/ubuntu/stitch-and-scale-pro (re-clone if missing: `git clone https://<TOKEN>@github.com/plastic-dude/stitch-and-scale-pro.git /home/ubuntu/stitch-and-scale-pro`).
- The app lives under artifacts/stitch-and-scale (React + Vite + TypeScript + Tailwind). Quality gates before every commit: `pnpm run typecheck`, `pnpm exec vitest run`, `pnpm run build` all pass. Commit messages use the template: `[CHK-NNN] [STITCH-AND-SCALE-PRO] [VERIFIED] <description>` with bullet details of what/where/tested. Git identity: plastic-dude / plastic-dude@users.noreply.github.com.
- Research notes from the old advancement mode remain in /home/ubuntu/research/ (read-only reference now; they are competitor archives, not a to-do list).
- Governing standard: EMLUX quality policy (zero hallucinations, every constant cited, build integrity before commits, no dead code, honest claims).

## Each firing, do ALL of (in this priority order):

1. Pull latest origin/main. Rebase local working branch if a queue exists; never force-push.
2. INBOX SWEEP (severity-ranked, Reviewer/QA evidence only — never act on raw QA reports without a Reviewer triage, and never invent scope):
   - Open GitHub issues (`/issues?state=open`), sorted by severity: CRITICAL > MAJOR > MINOR > NITPICK > INFO.
   - Open PRs (unexpected — review only; never merge).
   - Local Reviewer/QA artifacts in `docs/` and the QA branches (`origin/qa/*`), plus `AUDIT-HONESTY-2026-08-16.md` open gaps and the latest i18n inventory.
3. FIX: implement exactly ONE highest-severity still-open, Reviewer-proposed item:
   - Correctness bugs first (double-counts, zeroed estimates, dead state, fee math).
   - Then localization gaps (dynamic prose, 404, buttons, placeholders, per-language missing keys) via the established `-copy.ts` pattern, without changing calculation semantics.
   - Then responsive/visual defects (narrow-viewport collisions, duplicate React keys, raw-fraction displays).
   - Then the storage-seam convention (`stitch-and-scale-{tab}-{projectId}`) on any surface touched.
   Scope stays minimal: one fix + regression test(s). If the fix would need a Reviewer decision you cannot obtain (e.g., a MAJOR refactor), comment on the issue with analysis and move to the next item.
4. Verify: typecheck clean, full vitest suite passes, production build passes; visually check the changed surface in a localhost-only preview. Never claim [VERIFIED] without actually running the gates on the current tree.
5. Comment on the fixed issue with the evidence (commit, gates, what changed), then close it. Log any item you cannot take with an explicit reason.
6. Commit and push to origin main with the CHK template.
7. End with a concise progress message to the user: which backlog item was fixed, commit hash, gates, next backlog item.

## Backlog (current, from issue sweep 2026-08-17)

| Priority | Item | Evidence |
| --- | --- | --- |
| MAJOR | #53 Payback Lab fee shape — CLOSED 2026-08-17 (CHK-105 b1b8c08) | done |
| MINOR | #55 Take-Rate NumField suffix overlap — CLOSED 2026-08-17 (CHK-106 b96f474) | done |
| MAJOR* | #56 Localization gaps (51-A workspace cards untranslated; 51-B onboarding overlay footer "Back/Begin/Continue" hardcoded English; 51-C pt missing `workflow.newProject.title`) — QA report only, awaiting Reviewer triage | next candidate if triaged |
| MAJOR | #54 Take-Rate duplicate React keys — QA report, awaiting Reviewer triage | blocked until triage |
| MAJOR | S182 affCut conversion (legacy ledger) — long-open | next if triaged/escalated |
| MAJOR | S251 yarn-company-deal royalty double-count at line ~173 — long-open | next if triaged/escalated |
| MAJOR | S160/S123 related empty-standards fallback (`resolveProjectStandards({} as never)`) — partially fixed; remaining flat/royalty/exclusive double-count | next if triaged/escalated |
| INFO | Raw-fraction % displays (#43/#44/#46 pattern), Promo mixed sign (#14), workspace legend overcount (#52), dead reads (51-E/F) | lower priority |

*#56 is the highest open item. Per the staff rules, treat a QA report as addressed to the Reviewer: the worker may act on it only where the Reviewer has triaged or where the staff handoff explicitly permits immediate repair of obvious, low-risk defects (a missing dictionary key and hardcoded footer buttons qualify as obvious low-risk; full workspace-card migration is a large tranche best left to a triaged scope).

## Hard constraints

- The repo plastic-dude/stitch-and-scale-pro is PRIVATE (user business knowledge). Never make it public, publish a public link, or expose it in any user-facing preview (serve only on localhost).
- Keep the repo's visibility private; never run the GitHub API call that would re-open it.
- Never touch stitch-and-scale-rc.
- Never invent features or new research angles; mark anything uncertain UNVERIFIED.
- Honest progress claims only: record measured gate outputs, never repeat stale counts.

## Progress log (perfection mode)

- CHK-105 (b1b8c08): Payback Lab receipt-fee normalization via canonical `analyzeReceiptFees`; issue #53 fixed and closed; 1,763 tests green.
- CHK-106 (b96f474): Take-Rate NumField right padding `pr-8` -> `pr-11`; suffix/spinner overlap at 390px eliminated; issue #55 fixed and closed; typecheck + 1,763/1,763 tests + build green; locally visually verified.
- New schedule created 2026-08-17: perfection-backlog-first mode (user directive); user deactivates the old advancement schedule.
