---
name: exhaustive-mobile-qa-crawl
description: Use this skill whenever asked to perform a thorough, exhaustive, or "zero flaws skipped" visual/QA audit of a live website or web app — including phrases like "crawl audit," "mobile-first audit," "find every flaw," "screenshot every screen," "don't skip anything," "QA sweep," "full site audit," or when given a target URL and told quality matters more than speed. Also use when asked to write or tighten a prompt for another browsing/crawling agent that will perform this kind of audit. Not for single-page spot checks, automated Lighthouse/performance-only audits, or code review — this is manual, eyes-on, click-through visual and behavioral QA coverage performed by an agent with a real browser.
---

# Exhaustive Mobile-First QA Crawl

A methodology for finding every real defect in a live product, on the devices its actual users hold, without letting time pressure or report-length instincts cause anything to go unreported. Grounded in Bach & Bolton's Rapid Software Testing framework — specifically the SFDPOT coverage model and Session-Based Test Management (SBTM) — rather than invented rules, because "look at everything" without a coverage model just produces an unfocused wander that feels thorough and isn't.

## Core principle: report everything, skip nothing

This overrides every other instruction in this skill. Do not skip a flaw because it seems minor, because a similar one was already found, because time is short, or because reporting it makes the output longer. If you catch yourself thinking "this probably isn't worth mentioning," mention it anyway and let the reader decide. Under-reporting — not over-reporting — is the failure mode this methodology exists to prevent. A shorter report is only better than a longer one if nothing real was left out to make it shorter.

Corollary: **an unevidenced "clean" verdict is worthless.** Never write "looks fine," "works as expected," or "no issues found" without a screenshot and a specific description tied to that exact claim — an unevidenced clean verdict is indistinguishable from "didn't actually check."

## Required setup before starting

Before any crawling, confirm — and ask the requester for anything missing rather than guessing:
1. **Target URL(s)** and, if relevant, which environment (production vs. a preview/staging build) is actually being tested. State which one explicitly in the final report; a bug found on staging that isn't live yet is a different finding than one already in production.
2. **Primary device/audience context.** "Mobile-first" isn't just a viewport setting — know who actually uses this on a phone and why, since that shapes which flaws matter most (e.g., a flow used in short, interrupted sessions makes slow/hanging states a bigger deal than they'd be for a desktop power-user tool).
3. **A full enumeration of navigable surfaces** — every route, tab, or major screen — supplied by the requester or discoverable via the site's own navigation. Do not sample from a partial list; get the complete one first.
4. **Locales, themes, and account states in scope**, if the product has more than one of any.
5. **Any specific open question the audit exists to answer** (e.g., "does the app actually paint on first load, or does it stay blank") — treat this as the highest-priority charter, checked first and explicitly closed out in the summary either way.

## Coverage model: SFDPOT

Don't rely on instinct for what counts as "everything." Use Bach & Bolton's SFDPOT dimensions to build the actual coverage plan before starting — a wander through the UI, however careful, tends to over-cover the obvious happy path and under-cover everything else:

- **Structure** — every screen, component, and navigable surface that exists. The literal inventory from "required setup" above.
- **Function** — every capability each surface offers: every button, form, toggle, filter, sort, export.
- **Data** — boundary and invalid inputs, not just typical ones: empty fields, maximum-length text, zero/negative numbers where a positive is expected, special characters, a brand-new account with no data yet vs. one with a lot.
- **Platform** — every viewport in the matrix below, plus light/dark theme and locale if applicable. This is where "mobile-first" formally lives, as one dimension among several rather than the whole plan.
- **Operations** — how it's actually used in the wild: interrupted network, backgrounding and returning to a tab, rapid repeated taps, slow input.
- **Time** — anything that changes with duration or timing: loading states that should resolve but might hang, session timeouts, debounced inputs, animations that could get stuck mid-transition if interrupted.

Write out the plan against these six before starting. A plan that only covers Structure and Platform (i.e., "I opened every screen at every width") looks thorough but has silently skipped Function, Data, Operations, and Time.

## Session structure (SBTM)

Don't run one unbounded, unstructured pass. Break the work into sessions, each with:
- **A charter** — one to three sentences stating exactly what this session covers (e.g., "Charter: cover onboarding through first project creation, all primary viewports, English only, with empty/invalid/valid form submission at each step").
- **A time box** — a session is done when its charter is complete, not before, but it should be a bounded, nameable unit of work rather than an open-ended wander. 60–90 minutes of real testing effort per session is the standard starting point; scale to fit the charter's actual size.
- **A reviewable result** — the session's findings, written up in the format below, before moving to the next charter. This is what makes long, high-volume audits resumable and auditable rather than a single black box that either fully succeeds or fully fails.
- **A debrief** — a short note at the end of each session: what was covered, what wasn't (and why), and what the next session's charter should be. This is the checkpoint — write it after every session, not only at the very end.

Chain sessions to cover the full SFDPOT plan. For a large surface (a product with dozens of screens), this naturally produces many sessions and, honestly, a large number of screenshots — that's the expected shape of exhaustive coverage, not a sign the approach needs to be made more efficient.

## In-session technique: eyes → click → eyes

Within a session, apply this to every single interaction:
1. **Eyes** — screenshot the screen exactly as it first appears. Read every visible label, number, and button. Note the browser console state.
2. **Click** — interact with exactly one control.
3. **Eyes again** — screenshot the result. Did the right thing happen? Is anything now clipped, overlapping, or badly wrapped? Did a loading state resolve or hang? Did the console throw anything new?
4. Repeat for every visible control on the screen — not just the ones that seem important. A rarely-used control that's broken is still broken.
5. For every form specifically: submit empty, submit with invalid data, submit correctly — screenshot all three outcomes. Missing, wrong, or viewport-dependent validation messages are flaws.

## Optional technique: tours

If a straightforward SFDPOT walkthrough is producing suspiciously few findings on a surface that seems important, a tour-based heuristic can surface what a linear pass misses — e.g., a "Saboteur Tour" (deliberately try to break each flow: double-submit, navigate away mid-action, use the back button mid-form) or a "Money Tour" (follow whichever path most directly represents the product's core value, end to end, exactly as the real user would). Use these as a supplement to the charter plan, not a replacement for it.

## Viewport matrix (adjust to the actual target audience, but default to this)

Primary — every screen, no exceptions:
- 360 × 800 (most common real Android width)
- 390 × 844 (standard modern iPhone)
- 430 × 932 (large iPhone/Android)

Secondary — the full critical path at minimum, opportunistic elsewhere:
- 320 × 568 (smallest realistic modern phone; layouts break here first)
- 414 × 896 (older large iPhone)
- one landscape orientation of a primary width, confirming nothing becomes clipped or unreachable when rotated

## Reporting format

Every flaw, as its own entry — never bundle two problems into one:

```
FLAW — [severity: blocking / major / minor / cosmetic]
Location: [exact screen/component + viewport + locale/theme if relevant]
What's wrong: [specific and concrete — not "layout issue," but "the button's right edge is
  clipped by the viewport at 360px, roughly 8px cut off"]
How to reproduce: [exact steps from a fresh load]
Evidence: [screenshot filename(s)]
Console output at the time: [verbatim, or "none"]
```

Every fully-checked clean screen:

```
CLEAN — [screen name] at [viewport] / [locale/theme]
Controls opened: [list every control interacted with]
Console output: [verbatim, or "none"]
Evidence: [screenshot filename]
```

## Screenshot naming and organization

`[screen-or-route]_[viewport-width]w_[locale]_[state].png` — e.g. `checkout_390w_en_after-submit.png`. Group into folders by session/charter so a large evidence set stays navigable rather than becoming a flat, unsearchable pile.

## Final summary requirements

Only after every planned session is genuinely complete: total sessions run, total screenshots taken, full flaw list grouped by severity, and an explicit statement of anything the SFDPOT plan called for that couldn't be completed and why (a login wall, a feature needing a paid account, a real-browser capability the environment lacked). State this even when the honest answer is "everything planned was completed" — the absence of caveats is itself a claim that needs to be made explicitly, not left implied.
