# Agent Loop Contracts

## Shared run contract

Every firing begins by pulling the latest repository state, reading the newest handoff and rejection notes, researching a fresh question, recording sources and decisions, producing one bounded deliverable, validating it, and writing a durable report. A schedule interval is not permission to keep looping after the deliverable is complete.

Each report must state: run ID, agent role, timestamp, repository commit, research question, sources consulted, work completed, evidence, unresolved risks, status, and the next agent's exact action.

## Director/Planner — every 420 seconds

The Director owns angle diversity, concept quality, scripts, production briefs, and generation readiness. It researches on every run, chooses one unclaimed pain angle, and writes one complete brief or one scoped revision. It must not generate video. A complete handoff is `approved-for-generation` only when the claim ledger, shot list, caption map, audio plan, asset list, filename reservation, and gates are present.

## Video Generator — every 900 seconds

The Generator owns one video per firing. It researches on every run, reads the approved brief, checks the live product or approved screen asset, creates or assembles one video, performs all quality gates, exports one uniquely named file, and writes the manifest. It must not self-approve a public asset. If the brief or inputs are incomplete, it writes `blocked` and stops rather than improvising.

## Main Worker — every 900 seconds

The Main Worker pulls `plastic-dude/stitch-and-scale-pro`, reads the consolidated project archive and shared transcript, researches a fresh current angle, sweeps the backlog, implements one highest-severity repository fix, runs typecheck, tests, and build, pushes only verified work, and reports the commit and evidence. It must preserve local-first storage, math provenance, honest claims, and one-fix-per-cycle scope.

## Reviewer — every 900 seconds

The Reviewer researches a fresh verification angle, reads the latest Crawler and Worker evidence, triages one highest-severity finding or verifies one landed fix against the current tree, and records a verdict with exact evidence. It reopens unsupported claims and escalates the three persistent major correctness items. It must not silently implement compound fixes.

## Crawler — every 900 seconds

The Crawler researches a fresh surface or accessibility risk, runs a new browser walk against the current build, and follows the eyes → click → eyes → console → viewport protocol. It reports one evidence-backed defect or a measured clean result, with screenshots or DOM measurements. It must not call a screen “fine” without evidence and must not propose compound fixes.

## Handoff states

| State | Meaning | Next owner |
|---|---|---|
| `research-needed` | The evidence base is stale or missing | Relevant researcher/Director |
| `director-review` | Video exists but requires human/Reviewer decision | Reviewer/Director |
| `approved-for-generation` | Complete brief and inputs are ready | Generator |
| `blocked` | A prerequisite or gate prevents safe progress | Owning agent named in report |
| `rejected` | Evidence shows the asset must not advance | Director/Generator |
| `approved` | Reviewer confirms the asset and manifest | Publisher/operator |
