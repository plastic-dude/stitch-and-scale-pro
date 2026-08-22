# Soothing Recognition & Non-Manipulative Gamification — Research Brief

**Owner directive, 2026-08-22.** Compiled by Claude (PM) at the owner's request. This is a **research document, not an implementation spec.** See the Directive section before doing anything else.

---

## 1. Directive (read this first)

The owner's request, restated precisely for unambiguous execution:

> Investigate whether — and how — Stitch & Scale should recognize a maker's progress through the app (grading a pattern, exporting a PDF, publishing, and other real milestones) with small, soothing moments of acknowledgment. This is related to, but distinct from, Brag Cards (which is financial/business-stat, manual, and opt-in). Consider the whole normal usage flow, not just one screen.

**Binding constraints on how this directive is worked:**

1. **Do not implement anything from this document yet — including copy strings, storage schema, or a single line of UI code.** This is a research-only ticket.
2. **Run a full research pass on this topic twice, on two separate scheduled firings**, before any implementation ticket is opened. Each pass is a genuine independent pass, not a rubber stamp of the first — re-derive conclusions from the current state of the live code, not from this document's cached assumptions, since the codebase moves fast (150+ files can change between two firings of this same queue).
   - **Pass 1** should audit the *current, live* app for every moment listed in §5 below, confirm or correct each one against the actual component/file at HEAD, and identify any moments this document missed (it was written from a partial code read, not an exhaustive one — treat §5 as a hypothesis, not a source of truth).
   - **Pass 2** should specifically stress-test the design principles in §4 against Pass 1's findings: does every proposed touchpoint survive the "would this create anxiety, pressure, or a false claim if a maker never returns" test? Pass 2 should also produce the actual copy strings (5 locales, matching the project's existing `*-copy.ts` module convention) and a storage-schema sketch (`useProjectStorageState`-based, matching `storage-lib.ts` conventions) — but still stop short of writing application code.
   - Log each pass as its own `docs/leader-notes/cycle-*.md` entry, exactly like every other queue item, so both passes are independently auditable.
3. **Only after Pass 2** should an implementation ticket be queued, and it should be scoped narrowly (one touchpoint at a time is safer than a system-wide rollout, consistent with how every other feature in this codebase has shipped incrementally).
4. **Non-goals, stated up front so scope does not creep:** no points/XP economy, no leaderboards, no daily streaks or login-pressure mechanics, no social comparison between studios, no anything that could read as manipulating the maker rather than acknowledging them. §4 explains why each of these is excluded, not just asserted.

---

## 2. Why this is worth doing (product reasoning)

Stitch & Scale's core workflow — measurements in, grading math out — is precise, technical, and a little intimidating to a first-time user, especially a self-taught designer without a technical-editing background. The app's own existing UX discipline (readiness gates, `validateField` quarantines, integrity preflights that block a verdict on bad data, honest onboarding copy after CHK-149's "truth audit") is *correctly* strict about not overstating confidence. That strictness is good for trust, but it means the app currently has **zero moments that tell a maker "you did something real and good"** — every existing signal is either neutral (a saved toast) or corrective (a validation error). Brag Cards partially fills this, but it is financial-stat-focused, manual, and requires a maker to already have ledger data — it does nothing for the moment a first-time user successfully grades their first pattern with zero sales yet.

A small, honest acknowledgment layer is a plausible way to soften that technical intimidation *without* compromising the app's existing honesty discipline — provided it is built to recognize real, already-computed facts (mirroring how `grading.explain`'s `modelInstruction` refuses to narrate anything not already present in the data) rather than invented enthusiasm.

---

## 3. Grounding research (external)

Gamification research is split cleanly into two traditions, and the split matters for this ticket:

**The exploitative tradition** (loot boxes, streak-loss anxiety, leaderboards, variable-ratio reward schedules) works by weaponizing loss aversion and social comparison — Brignull's "dark patterns" taxonomy and the CHI-conference literature on deceptive design (Mathur, Kshirsagar & Mayer 2021; Bongard-Blanchy et al. 2021) treat this as the *default failure mode* of gamification, not an edge case. The clearest real-world case study is Duolingo's streak system: it drives strong retention numbers, but its own users and researchers describe it as converting "effort into identity" through loss aversion rather than positive motivation — breaking a streak "feels like breaking the self." Duolingo's own mitigation, "Streak Freeze," is widely described in the UX literature as "mercy infrastructure" grafted onto a fundamentally anxiety-driven mechanic, not a fix for the anxiety itself — one long-time user's public account of giving up a 480-day streak describes the freeze as "not solving the issue... just prolonging the inevitable."

**The healthy tradition** grounds itself in Self-Determination Theory (Deci & Ryan) — autonomy, competence, and relatedness — rather than extrinsic reward loops. Under this model, a well-designed acknowledgment moment should communicate *competence* ("you did something skilled and correct") without manufacturing *dependency* (no loss state, no countdown, no comparison to other makers, nothing that punishes absence).

**Directly relevant conclusion for this app:** anything resembling a *streak* (consecutive days graded, consecutive exports) should be avoided entirely, not softened with a "freeze" mechanic — the research is fairly consistent that the freeze is damage control for a mechanic that shouldn't exist in a tool like this in the first place. A pattern designer might grade one pattern a month; punishing or even subtly nudging about gaps is actively hostile to that real usage rhythm.

---

## 4. Design principles (non-negotiable constraints)

These are written so Pass 2 can mechanically check each proposed touchpoint against them:

1. **Milestone-only, never time-based.** Recognize *what happened* (first grade, first export, Nth pattern), never *when* or *how often*. No streaks, no "come back tomorrow," no daily anything.
2. **No loss state.** Nothing can be lost, broken, or reset. A milestone earned once is permanent. (Contrast with Duolingo's freeze-as-damage-control — the correct fix is to never build the loss condition, not to sell insurance against it.)
3. **Private by default, shareable only on request.** No leaderboard, no cross-studio comparison, no visible-to-others state unless the maker explicitly chooses to share it (e.g., feeding a milestone into a Brag Card caption is fine; broadcasting it automatically is not).
4. **Every claim must be true and already computed.** Exactly the same discipline `grading.explain`'s `modelInstruction` already enforces for AI-facing output: never invent a number, never round up, never imply an achievement that didn't happen. A "first pattern graded" title is only awarded after a real, successful `grading.run` — not an attempt, not a draft.
5. **Opt-out, not opt-in-by-default-dark-pattern.** A maker can turn the whole layer off in Settings without losing any underlying data or functionality it was layered on top of.
6. **No urgency, no FOMO copy.** No "don't miss out," no countdowns, no artificial scarcity language — this project's own `toast-copy.ts` and `retention-copy.ts` tone (calm, factual, respectful) is the right register to match, not a typical consumer-app hype voice.
7. **Fully localized from the first commit**, in all 5 locales (en/de/fr/es/pt), using the existing `*-copy.ts` module pattern — this codebase has repeatedly had to retroactively fix English-only leaks (CHK-174, CHK-177, CHK-031/034 "Localization Brutality" passes); a new feature shipping English-only would be a known, avoidable regression class.
8. **Local-first storage**, via the existing `useProjectStorageState` / `storage-lib.ts` seam — no new persistence architecture, no server round-trip, consistent with the whole app's "nothing uploaded" positioning (reinforced explicitly in onboarding after CHK-149's truth audit).
9. **Accessible and non-blocking.** A toast/badge moment, not a modal that interrupts the export or grading flow it's celebrating.

---

## 5. Current-state audit (hypothesis — Pass 1 must verify against live HEAD)

Confirmed at the time of writing that **no achievement/title/badge/milestone system exists anywhere in the codebase** (`grep` across `src/lib` for achievement/gamif/badge/streak/milestone/title-earning patterns returned nothing resembling this). The following are candidate touchpoints, drawn from a partial read of the real workflow files — Pass 1 should re-confirm each file/line against current HEAD before relying on it:

| # | Moment | Candidate trigger | Relevant file(s) (verify at HEAD) | Why it's a natural fit |
|---|---|---|---|---|
| 1 | First successful grade | First `grading.run` (or in-app equivalent) that reaches a `go`/valid verdict | `grading-lab.ts`, `pages/project-grading.tsx` | The single most intimidating first step in the whole app; already gated by the G-09 integrity preflight, so a "go" verdict is already a verified-true fact to recognize |
| 2 | First PDF export | First successful PDF export (not a "stuck" or failed attempt — `print-utils.ts`'s typed `PrintAttemptResult` already distinguishes success from failure/blocked) | `print-utils.ts`, `pages/project-pdf.tsx` (or equivalent) | Export is the "I made a real, sellable thing" moment; the app already has a reliable success signal to key off (post-CHK-153 state machine) |
| 3 | Nth pattern graded (e.g. 5th, 25th) | Count of distinct projects with a `go` verdict | Same as #1 + a small counter in local storage | Rewards continued use without being time-based |
| 4 | First multi-size / inclusive-sizing grade | First project graded across 3+ sizes, or first use of the inclusive-sizing analyzer | `inclusive-sizing-analyzer.ts` | Recognizes a *skill* milestone (size-inclusive design), not just volume |
| 5 | First Project Book (multi-project PDF) export | First successful `renderProjectBookDocument` export | `project-book-export.ts`, `pages/portfolio.tsx` | "Portfolio builder" moment — distinct from a single-pattern export |
| 6 | First onboarding completion | Completing the onboarding wizard for the first time | `pages/onboarding.tsx` | Softest possible landing moment — should be the gentlest, not the loudest |

Explicitly **not** proposed as touchpoints, and Pass 1/2 should keep them out unless a real case is made: sales/revenue milestones (already covered, opt-in, honestly, by Brag Cards — duplicating this would blur two systems with different trust models), KAL/community participation counts (third-party data, harder to verify truthfully), anything derived from the ~80 business-lab calculators (those are advisory tools, not achievements — a "milestone" there risks implying financial advice was validated, which it explicitly is not per those labs' own disclaimers).

---

## 6. Relationship to Brag Cards (explicitly, since the owner asked)

Brag Cards should remain the *financial/business* recognition surface: manual, ledger-driven, shareable-by-design, opt-in. This new layer should be the *craft/workflow* recognition surface: automatic (but private), milestone-driven, and much quieter — a toast or small badge, not a 1080×1080 shareable card. The two can connect loosely (a milestone unlocked here could become an available "highlight" option inside Brag Cards' existing template picker) but should not be merged into one system — they answer different questions ("what did I earn as a business" vs. "what did I just accomplish as a maker") and conflating them would weaken both.

---

## 7. Sources

- Deci, E. L., & Ryan, R. M. — Self-Determination Theory (autonomy, competence, relatedness) as the standard non-manipulative motivation framework in gamification design literature.
- Brignull, H. — "Dark Patterns" taxonomy (darkpatterns.org); Mathur, Kshirsagar & Mayer, "What Makes a Dark Pattern... Dark?", CHI 2021.
- Bongard-Blanchy et al., "I am Definitely Manipulated, Even When I am Aware of it. It's Ridiculous!", ACM DIS 2021 — end-user perspective on dark-pattern gamification.
- Multiple independent UX write-ups on Duolingo's streak/Streak-Freeze mechanic (2023–2026) converging on the same finding: streaks work via loss aversion, not positive motivation, and the freeze mitigates but does not remove the anxiety it creates. Representative account: a long-time user's public description of abandoning a 480-day streak because freezes "prolong the inevitable" rather than fix the underlying pressure.
- Internal: `docs/queue/work-queue.md` CHK-149 (onboarding truth audit), CHK-174/177 (localization leak fixes), CHK-144/153 (integrity preflight, PDF export state machine) — cited above as the existing honesty/reliability discipline this feature must not violate.

---

## 8. What Pass 1 and Pass 2 should each produce

- **Pass 1 output:** an updated §5 table verified against live HEAD (file paths, line numbers, exact success-signal to key off for each trigger), plus any additional real touchpoints found that this document missed. Log as `docs/leader-notes/cycle-<date>-<chk>-soothing-recognition-pass1.md`.
- **Pass 2 output:** the design-principle stress test (§4 checklist applied to every surviving touchpoint from Pass 1), draft copy in all 5 locales for the smallest viable first touchpoint, and a storage-schema sketch. Log as `docs/leader-notes/cycle-<date>-<chk>-soothing-recognition-pass2.md`. Only after this log lands should a numbered implementation `QUEUE-` item be opened, scoped to one touchpoint.
