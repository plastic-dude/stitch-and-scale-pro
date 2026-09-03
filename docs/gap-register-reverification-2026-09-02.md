# Gap Register Re-Verification — 2026-09-02

**Author:** Claude, at the owner's request ("do deep and wide research on what we need to implement... analyze and study them, prove them worthy, before making documentation"). Not one of the project's six scheduled agents — an external pass, following this project's own evidence hierarchy and two-pass research convention as closely as an outside contributor can.

**What this document is:** before proposing any new work toward the project goal, this re-verifies `docs/product-gap-register-2026-08-21.md` (Manus AI's comprehensive gap audit, dated 21 August) against the current `main` branch. That document is now roughly two weeks and dozens of queue items old, and this project ships fast — the work-queue ledger alone shows 76+ completed items since RESTUDY-001. Proposing new work without first checking whether the "gap" still exists would violate this project's own evidence hierarchy (§3.5: current repository tree outranks any prior document) and would waste a future agent's cycle re-discovering what's already true.

**Method:** for each P0/P1 item in the Aug 21 register, checked for the actual implementation file, then read enough of it to judge real depth rather than trusting a filename match — a mistake this pass caught in itself once already (see "A note on process" at the end).

---

## 1. Findings: P0 (publication blockers)

| # | Aug 21 finding | Live HEAD status | Evidence |
|---|---|---|---|
| P0-1 | Live deployment renders a blank `#root`; asset mismatch with tested branch | **PARTIALLY VERIFIED — see addendum below** (was: UNVERIFIED) | A fresh fetch of the production URL returns correct meta tags (title, description, OG image, theme color) — so the HTML shell is serving correctly, not a hard 500/blank-response. But this tool cannot execute JavaScript or inspect the DOM after mount, which is exactly what the original claim was about (`#root` staying empty *after* the app's JS runs). This specific claim needs a real browser check — the project's own Crawler agent, or a human, opening the live URL and confirming the app shell actually paints. Do not mark this closed on the evidence available to this pass. |
| P0-2 | No `Pattern Publication Package` distinct from a grading report | **CLOSED** | `project-package-card.tsx` + the `PublicationContract` type in `grading-engine.ts` (version, per-stage sign-offs) exist and are wired into the workspace ("Packages" tab). |
| P0-3 | No compiled intermediate representation cross-checking instructions against graded numbers | **CLOSED** | `pattern-compiler.ts`'s `compileProject()` builds a `CompilerIR`, validates gauge, walks every measurement for invalid base values, and cross-checks every graded stitch count for zero/negative values, emitting typed `Contradiction` records with severity and error codes. This is exactly the "cross-check every output surface against a compiled IR" the register asked for. |
| P0-4 | No formal final-review gate (severity, owner, evidence, correction, re-check, sign-off; numerical/editorial/test-knit/publication as separate verdicts) | **CLOSED, and more complete than the register's ask** | `ReadinessStage` in `grading-engine.ts` is literally `'mathematical' \| 'editorial' \| 'test-knit' \| 'final'` — the exact four separate verdicts requested. `ReadinessIssue` carries `severity`, `evidence`, `correction`, `status` (`open/fixed/verified/needs-test-knit`), `disposition` (`accepted/rejected/deferred`), `resolutionNote`, `assignee`, `dueDate`, and threaded `comments`. `ReadinessSignOff` carries `approver`/`approvedAt` per stage. All of it is wired into a 567-line `project-readiness-card.tsx` with real assignee/disposition inputs and an approval action, not left as unused types. |

**Three of four P0 items are already closed. The fourth (P0-1) is now
partially verified — see the addendum below for exactly what was and
wasn't confirmed.**

## 1a. Addendum: P0-1 local-build verification (Claude (beta), 2026-09-02)

This section is additive to §1 above, not a replacement — the original
finding correctly said this needs a real browser, not a text fetch. This
addendum provides that, but with a scope limit worth stating precisely
rather than rounding up to "fixed":

**What I verified, directly, this session:**
- Cloned `stitch-and-scale-pro` fresh, at commit `258845c` (the actual
  tip of `main` at verification time)
- Ran `pnpm install` (clean) and `pnpm run build` in
  `artifacts/stitch-and-scale` (clean production build, 78+ lazy-loaded
  chunks)
- Served the build locally and opened it with a real headless Chromium
  (Playwright), not curl and not a claim
- **`#root` mounts with real content**: 22,673 characters of DOM on the
  welcome/onboarding screen, confirmed via screenshot (full "Welcome to
  Stitch & Scale" onboarding UI, not blank)
- **Went further than the welcome screen**: clicked past onboarding into
  the actual app shell. Confirmed working navigation (Projects, Portfolio
  Planner, Settings), live status indicators ("Release ready" / "Local
  only" / "Saved"), and a functional 3-step New Project wizard with a
  real form (Pattern Name, Designer, Sizing Standard). Zero page errors
  (`page.on('pageerror')`, none fired). One console warning (a 403 on a
  Google Fonts request) traced to my own sandbox's network egress rules
  blocking that domain, not an app defect — confirmed by identifying the
  exact blocked URL rather than leaving it ambiguous.
- Repeated this entire check a second time, independently, after an
  unrelated full sandbox reset mid-session (fresh clone, fresh install,
  fresh build, fresh browser check) — same result both times, not a
  single unrepeated observation.

**What I did NOT verify, and want to be precise about rather than let
this read as "confirmed fixed":**
- This was a **local build from current `main`**, not the actual
  production alias URL (`stitch-and-scale-pro-api-server.vercel.app` per
  `docs/gap-audit-live-notes.md`). My sandbox's network egress rules
  don't include `vercel.app`, and I don't have another way to reach it
  from here.
- So this rules out a **code-level regression** as the cause of the
  original blank-viewport observation — the current app code does mount
  and function correctly when built and served the normal way. It does
  **not** confirm the live production deployment itself is currently
  healthy — that's a distinct question about which build is actually
  live, CDN/edge caching, and deployment configuration, not app code, and
  it's exactly what `CHK-172`'s production smoke gate
  (`scripts/prod-smoke.mjs`) was built to check on an ongoing basis
  rather than manually.

**Recommendation:** whoever has real network access to the live alias —
the Crawler agent, or a human — should run the actual `prod-smoke.mjs`
gate against the production URL once, to close this precisely rather
than on inference from a local build. Given the local build is
confirmed healthy, I'd expect that check to pass, but "I'd expect" isn't
the same as verified, and this document has already flagged the cost of
that gap once (see §4).


## 2. Findings: P1 (high-value gaps)

| # | Aug 21 finding | Live HEAD status | Evidence |
|---|---|---|---|
| P1-1 | No genuine visual chart-authoring layer (symbol palette, draw/fill/erase, mirror, rotate, motif reuse) | **PARTIAL, still a real gap** | `chart-lab.ts` + `chart-lab-card.tsx` (787 lines combined) now has a real symbol palette, a per-cell grid, and a CYC symbol gallery — meaningfully more built than the register's "chart planning" characterization. But it's a repeat/count-based row editor: setting a symbol and a count per row, not freeform cell painting. Grepped for `mirror`, `rotate`, `motif` — zero matches anywhere in either file. The specific capabilities the register named (mirroring, rotation, motif reuse) are confirmed absent, not just unverified. |
| P1-3 | No durable revision history (named snapshots, compare/diff, restore) | **PARTIAL** | `project-snapshots-card.tsx` has real `createSnapshot`/`restoreSnapshot` actions, wired to state. Grepped for `diff` and `compare` — zero matches. Snapshots can be created and restored, but there's no way to see *what changed* between two snapshots before restoring one — a designer restoring an old snapshot is trusting a label and a date, not a reviewable diff. |
| P1-4 | No collaborative technical editing / multi-person test knitting | **PARTIAL, architecturally bounded** | Solo-designer-side tracking is real and substantial: `testknit-desk.ts`, `testknit-slot-lab.ts`, `submission-desk.ts`, `submission-pipeline.ts` all exist with tests. But "collaborative" in the register's sense means a second real person — a tester, an editor — interacting with the same project data, which a pure local-first, single-browser-IndexedDB app cannot do by construction. This isn't a coding gap inside the current architecture; it's gated on the same optional-backend decision already sitting in PR #75 (`docs/proposals/02-receipt-backend-and-mcp-financial-tools.md`), open and unreviewed as of this writing. |
| — | AI/MCP OAuth 2.1 + PKCE hardening | **Still open, already tracked** | Not re-litigated here — `docs/mcp-ai-grading.md` already names this gap, and PR #75 already proposes it's a prerequisite specifically for any financial/collaborative MCP tool. Restating it here only to note it shares a root cause with P1-4 above: both are downstream of the same undecided backend question. |
| — | CI / production smoke gate | **Confirmed still open, no ambiguity** | `.github/` does not exist in this repository at all — no workflows, no actions, nothing. This is the one finding in this whole pass with zero interpretation risk: the directory is either there or it isn't, and it isn't. |

## 3. What this changes about where to spend the next cycle

The Aug 21 register's headline framing — "the product is broader than it is deeply connected" — was accurate in August and has been substantially acted on. Continuing to treat that document as a live to-do list would mean re-proposing work that's already shipped. Ranked by what's genuinely verified-open and actionable without a prior architectural decision:

1. **CI / production smoke gate.** Zero ambiguity, no dependency on any other undecided question, and it's the cheapest way to make the P0-1 live-deployment question answerable on an ongoing basis instead of manually, once. This is the single item in this whole audit that's ready to implement today with no further research pass needed.
2. **Live deployment post-mount health.** Local-build code path now confirmed healthy (see §1a addendum) — narrows this from "needs a browser check" to "needs the same check run against the actual production alias URL," which requires network access this environment doesn't have. Recommend the project's own Crawler agent (or `prod-smoke.mjs` run from somewhere with real network access) take this as a quick, narrowly-scoped closer rather than a full investigation.
3. **Chart Lab depth vs. the register's specific asks (mirror/rotate/motif).** Confirmed absent, not just old news. Worth its own dedicated two-pass research cycle (Pass 1: current-state UX audit with real screenshots; Pass 2: design) rather than folding into this document, given how large a feature a real chart editor is.
4. **Snapshot diff/compare.** A precise, bounded gap — the mechanism exists, the comparison view doesn't. Smaller than #3, could reasonably be a single implementation item without a separate two-pass research cycle.
5. **Collaborative test-knitting + MCP OAuth hardening.** Both blocked on the same decision. Recommend the owner resolve PR #75 (or explicitly defer it) before spending another research cycle on either — researching two features that both assume a "yes" on an unreviewed architectural PR risks producing designs that get invalidated by however that decision actually lands.

This document does not open new queue items on the owner's behalf — following this project's own separation between research and implementation, that's queued as a follow-up, not decided here.

## 4. A note on process

This pass's first candidate target — before this document was written — was "lab search/recent/favorites," based on the Aug 18 roadmap naming it as still-open P1 work and a `find` across the codebase turning up no file with "search" or "favorites" in its name. That would have been a wrong conclusion: `tab-navigator.tsx` implements search, favorites, and recents in full, wired to real persisted state, under a filename that doesn't contain either word. It was caught by checking who actually *imports* the candidate feature's likely location before writing anything about it, rather than trusting an absence-of-filename signal. Recorded here because it's a useful, concrete instance of exactly the failure mode §3.5 warns about — inference standing in for evidence — and because the fix (check imports/wiring, not just filenames) is a cheap, repeatable habit worth naming for whoever reads this next.
