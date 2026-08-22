# Team Standing Orders — Perfection Backlog Cycle (effective 2026-08-17)

Issued by the team lead (Manus, the main worker) under the user's directive of 2026-08-17: **"From now on, you're the leader of the agents working with you. Instruct them perfectly going forward, write in the repo where they must see your instructions and messages, same as you see theirs. They help you catch what you miss — so tell them to do their work perfectly."**

This document is the standing instruction set for **Reviewer** and **Crawler**. Every agent firing MUST read this file before acting and post its own messages, findings, and triage in `docs/leader-notes/` (create the directory if missing) so every member of the team sees what every other member has written. The lead reads that same directory before each firing.

## Exact owner-supplied bundle gate

Before any research, crawl, triage, approval, or clean-result claim, every application-agent firing must verify `docs/source-bundle/stitch_scale_bundle-2026-08-22/README.md`, `source-sha256s.txt`, and all 15 raw files under `original/`, then read every raw file in full. The derived `assimilation.md` and older `archive-digest.md` are follow-up aids only; they never replace the raw pass. Each handoff must include a `bundle_read_receipt` with the current repository SHA, archive SHA-256 `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`, manifest path, every raw path read, and one decision-relevant finding. If any file is missing, unreadable, altered, or not fully read, the agent must stop as `BLOCKED` or `UNVERIFIED` and must not implement, approve, or call the surface clean.

The exact raw bundle is strategic and historical evidence. Current code, tests, fresh surface evidence, the constitution, and explicit owner decisions outrank it. Bundle-derived pricing, market, competitor, and live-app statements require fresh verification before public reuse. Do not execute its Python files merely because they are present.

## The continued queue

The worker and all firings follow the continued-queue protocol: the canonical state lives in `docs/queue/work-queue.md` — every firing reads it first, walks the first `queued` entry from the top (older items always outrank newer), works exactly one item, updates the entry status and appends a run-ledger line in the same commit, and never restarts from scratch. A `done` entry can only be reopened with reproduction evidence against the current tree.
## Mission

The team works ONLY the existing defect backlog (open GitHub issues, the severity ledger, local QA artifacts). No new features, no competitor/market research, no scope invention. Every finding must be grounded in evidence: a file, a line, a rendered screenshot, a measured gate output. Claims without evidence are rejected as noise.

## Role 1 — CRAWLER (visual + functional QA)

Crawler's job is to see and click what code review cannot. Text-only linting has repeatedly missed defects that a human eye catches in one second; Crawler must operate like an agentic user with eyes and thumbs, and the standard of proof is **a screenshot or a measured DOM value, never a claim of "looks fine."**

For every screen Crawler examines, the inspection loop is strictly:

1. **EYES first.** Load the page in a real browser against the current build (the lead's localhost preview, or a fresh `vite preview`/`vite build` from the current tree — never a stale server). Take a screenshot. Look at the screenshot the way a stranger would: overlapping or clipped text, off-scale spacing, raw fractions (e.g. "0.15 %"), bare numbers without currency symbols, missing translations, unbalanced empty space, unreadable contrast. Broken layout is a bug, not a style opinion — flag it as such and stop evaluating anything else on that screen until it is fixed.
2. **CLICK.** Every tab, chip, button, select, and menu on that screen must be opened by Crawler, not assumed. A control that does not respond, a tab that does not mount, a menu that stays empty — each is a defect with evidence.
3. **EYES again in the new space.** Whenever a click opens a new panel, modal, tab content, or page, Crawler MUST take a fresh screenshot of the new space and repeat step 1 there. Navigation chains (e.g. Labs screen → category chip → a lab → its verdict) must be walked end to end, with a screenshot at every hop. The inspection stops only at dead ends.
4. **Console check.** Record any console warnings or errors seen during the walk (duplicate React keys, hydration warnings, failed fetches) with the exact message text.
5. **Multi-viewport check.** Screens with responsive risk are checked at 360px, 390px, and 430px widths — the widths where past defects (suffix overlap, legend overcount, tab crowding) hid.

### Crawler's perfection checklist (from the layout-perfection skill)

Every crawled screen is judged against these concrete rules, in order. Earlier failures invalidate later judgments:

| # | Check | Rule |
| --- | --- | --- |
| 1 | Broken layout | No overlapping, clipped, or hidden text at 360–430px; no content that renders correctly at only one width |
| 2 | Grouping | No flat ungrouped list over ~7–10 items; tabs grouped by workflow stage; categories visually linked to their contents |
| 3 | Navigation | Destinations labeled or with unambiguous icons; active tab unmistakable at a glance |
| 4 | Spacing | Every spacing value on the 8pt scale (4, 8, 12, 16, 24, 32, 48, 64); card internal padding 16px, gap between cards ≥ 24px; internal spacing ≤ gap to neighbors |
| 5 | Touch targets | Every tappable element ≥ 44×44pt with breathing room between adjacent targets |
| 6 | State design | Loading, first-use empty, filtered empty, and error are four different treatments — never one generic blank; the local-first app also needs a save-status indicator |
| 7 | Dead/readonly state | Every visible control actually affects something; a select or slider that writes state nobody reads is dead state (the class that produced #52's legend overcount and #48's frozen escheat math) |
| 8 | Localization | Buttons, placeholders, 404, verdicts, and dynamic prose show the selected language's copy — screenshots taken in each of the five locales catch what grep misses |

### Crawler's reporting format

One entry per crawl in `docs/leader-notes/crawler-<date>-<cycle>.md`: the screen walked, viewport(s), each finding as **defect (severity) — exact location (file:line where identifiable) — reproduction steps — screenshot filename — the proposed fix written as a one-sentence, scoped instruction the lead can hand to the worker**. Screenshot files go in `docs/screenshots/`. Crawler NEVER proposes compound fixes; one defect, one instruction, matching the worker's one-fix-per-cycle rule.

## Role 2 — REVIEWER (triage + verification)

Reviewer receives Crawler's crawl reports and the worker's fix evidence, and does three things:

1. **Triage every crawl finding** into the existing severity ladder (CRITICAL > MAJOR > MINOR > NITPICK > INFO) and file or comment on the corresponding GitHub issue. Triage = the worker may act. Untouched QA reports stay addressed-to-Reviewer and the worker may only act on obvious low-risk defects (missing dictionary keys, hardcoded footer strings).
2. **Verify every landed fix** against the current tree: re-run gates from a fresh clone state where feasible, reproduce the fix on the surface itself, and confirm or reopen the issue. Stale counts are rejected; measures must come from the tree as it stands.
3. **Escalate verified-open MAJORs only.** The standing escalation list is re-verified against the current tree every cycle and MUST be updated in this document when items are fixed in flight: as of 2026-08-19 (restudy `97897be`), the S182 royalty-conversion fix (`podcast-affiliate-lab.ts` inline "S182 fix") and the S251 royalty double-count fix (`yarn-company-deal.ts` inline "reviewer debt a") are both FIXED IN CODE and struck from the escalation list; S160 ("migration delta") is marked REQUIRES-REPRODUCTION (no concrete reproduction exists); the "bundle card never collects partner patterns" item is FIXED — `translation-bundle-card.tsx` has a real `addPartner()` control and the engine consumes `stored.bundle.partners`. Reviewer MUST NOT re-escalate an item that is visibly fixed in the current tree — the stale-escalation defect found in the Aug 14-17 reviews (which escalated S182/S251 that were already fixed) is a lesson baked into this document.

Reviewer must also call out **lies, overstatements, and flaws** wherever found — in its own reports, in QA reports, and in worker claims — per the user's honesty policy. A report that cannot point to evidence is itself a finding.

## Standing instruction to both agents: do the work perfectly

Perfection is the bar, defined concretely: Crawler leaves no screen unclicked and no new space unseen; Reviewer leaves no finding untriaged and no claim unmeasured; the worker leaves no fix untested. Anything uncertain is marked UNVERIFIED. Anything measured is recorded with the exact numbers.

## Backlog state as of 2026-08-19 (restudy `97897be`)

The Aug-14 sweep order (#51/#49/#50/#48/#47/#46/#45..#40/#16/#15/#14) is CLOSED: #49 closed CHK-079 (fmtMoney 13 currencies), #51 + S248 + S249 fixed CHK-084 (EUR/CHF compound key, raw-fraction %, 78-lab drift), #47 fixed CHK-076 (Podcast dead tab), #54/#59 dup React keys fixed CHK-110; #58 remains triaged NOT REPRODUCIBLE (no action); #52 needs Crawler confirmation at the current build. The current open backlog is: (a) localization per the CHK-140 plan — 32 files, register in `docs/leader-notes/cycle-2026-08-18-chk140-plan.md`, scope estimate in `docs/leader-notes/scope-estimate-longform-localization.md` — the registered items are the `0 measurements` chip, the toast/snackbar module (93 calls, 17+13 distinct strings), Tier 1 narrative paragraphs (6 cards, 9 paragraphs) and Tier 2 "Benchmarks baked in" footers plus ~95 `<Field hint>` strings; (b) the QA coverage gap — QA stopped at Aug 17 22:17 (`d89608f`), so the localization sprint has had no third-party audit; (c) ledger hygiene itself — every cycle that closes or fixes an item MUST strike it here and in `docs/playbook-perfection-mode-2026-08-17.md`. GitHub live state could not be re-verified (connector not enabled): 0 open issues / 0 open PRs at CHK-138 is last-known, UNVERIFIED as of Aug 19.

## Notes on the current tree

The worker's latest fix, CHK-110 (`dc2be73`), retired the duplicate React key class in the Take-Rate Lab watchout badges by keying `${code}-${index}` after confirming the duplicate codes (TR-03 ×2, TR-05 ×2) are legitimate per-channel warnings. Crawler should confirm the badge row at 360/390/430px on the current preview before that issue pair is considered fully closed.
