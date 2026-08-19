# Assimilated Memory — Full Context State

**Date:** 2026-08-19 · **Author:** Manus (Team Lead, main worker) · **Trigger:** owner directive — "read each file word by word, assimilate for hyper-understanding, update memory for persistent awareness, emphasize quality and perfection."

This document records the complete assimilated state from the five owner-supplied knowledge files. It exists so that any agent firing — including future sessions of this worker — can restore the full strategic context without rereading the source material. Where the owner's files and the repo already contain overlapping content (e.g. `docs/team-standing-orders.md`, `docs/staff-working-prompt.md`), this document points at the canonical repo copy and records the *understanding* here, not a duplicate.

---

## 1. Source inventory

| # | File | What it is | Assimilation status |
|---|---|---|---|
| 1 | `Stitch_&_Scale_—_Goals_and_Agent_Goals_Constitution.md` | The constitution: product vision, six-agent team (Director, Generator, Reviewer, Crawler, QA, Main Worker), contracts and standing orders | Fully read and absorbed |
| 2 | `stitch-scale-entire-chat-transcript.md` | The complete working transcript: how the product evolved, the receipt-lab research, decisions made and why | Fully read and absorbed |
| 3 | `stitch-scale-completed-cutoff-reconstruction.md` | The reconstruction: product doctrine, pain research, prioritization tiers, PDF/publishing philosophy, monetization thinking, completion instructions | Fully read and absorbed |
| 4 | `stitch-scale-application-and-private-chatgpt-docs.md` | The working prompt, team standing orders, layout-perfection skill, video lessons, Drive setup state, schedule commands | Fully read and absorbed |
| 5 | `External_research_evidence_for_rebuilt_Stitch_&_Sc.md` | Evidence base for the receipt/product research layer | Fully read and absorbed |

---

## 2. What this product is (and is not)

The product is a **knitwear/crochet pattern grading and publishing-business tool** whose final line is: *a professional designer opens the app, does the work, and leaves saying "I made this" — not "the software generated this."* The positioning sentence to never betray:

> Stitch & Scale is the mathematical and publishing layer between the designer's creative process and their final pattern.

The anti-goal is equally firm: we must never become "Canva + Excel + Ravelry + Illustrator + pattern-writing software." That is scope death. Designers will keep using Procreate, Illustrator, Ravelry, Etsy, their own websites — our part of the workflow must simply become so much better that they do not want to go back.

The lifecycle the product must eventually cover is: **Design → Measurements → Gauge → Write → Illustrate → Grade → Verify → Document → Publish → Sell → Maintain → Update → Republish**. A pattern is not finished when a PDF is generated; professionals issue corrections. The strongest MVP is a complete loop, not 35 features: open → standard → gauge → sections → measurements → grade → catch problems → verify → produce a gorgeous professional document, with every number explainable.

### The user and the pain hierarchy

There are multiple real users: the aspiring designer ("I want to turn this into an actual pattern"), the professional independent designer, the brand/studio, the technical editor (a hidden customer with a future Review Mode: "here is the mathematical state of this pattern"), and publishers/yarn companies (a later B2B surface receiving standard, sizes, measurements, gauge, materials, version, validation state, provenance). Knit and crochet are *not* assumed identical users — the profile should distinguish craft (knit/crochet/both/custom) and designer type.

The five-tier pain hierarchy is the product's prioritization spine, with one guardrail that outranks everything:

| Tier | Content |
|---|---|
| 1 — Trust | grading correctness, gauge correctness, sizing consistency, repeat integrity, transparent provenance, version safety |
| 2 — Time | automatic grading, reusable sections, templates, duplication, presets, reduced data entry |
| 3 — Publishing | beautiful PDF, professional cover, complete measurement tables, consistent typography, versioned exports |
| 4 — Professional workflow | review, backup, history, sharing, eventual cloud sync, eventual publishing platform |
| 5 — Delight | onboarding, beautiful empty states, smart defaults, contextual help, microcopy |

**Delight should never outrank correctness.** The economic-risk ranking that produced this: incorrect grading, incorrect gauge/math, and bad pattern instructions are all *very high* financial consequences; publishing mistakes, repeated manual work, and poor documentation are *high*; the rest trails behind. The highest-value chain is **Correct → Understandable → Reusable → Beautiful → Publishable**.

The evidence posture is disciplined, not boastful: we do not claim designers universally "hate Excel" or that every designer loses substantial money to grading. Community posts are evidence that problems *occur*, not evidence of *how common* they are. Every claim gets labelled FACT, INFERENCE, HYPOTHESIS, or UNKNOWN, and direct user research is still the next required research layer (spreadsheet prevalence, outsourcing, time spent, willingness to pay).

### Receipt Lab evidence (the chat-first gap)

The research layer documents why Etsy sellers cannot issue invoices (order confirmations only), why craft-fair sellers handwrite receipts or use spreadsheet chaos, why custom-order sellers run on DMs with WhatsApp payment proof, and why ~98% WhatsApp open rates make chat-first PNG receipts dramatically more valuable than email PDFs. Nobody combines receipt generation + sales ledger + per-sale profit math + chat-first shareable output — that gap is the Receipt Lab.

---

## 3. The five core pillars (operating law)

1. **Mathematical Provenance.** Every important number is traceable to standard, standard version, size, base measurement, gauge, grading rule, engine version, ease, and designer modifications. The system must never leave a designer wondering "where did this number come from?" This enables trustworthy validation, version history, quality seals, and safe republishing. It is part of the product's credibility, not a feature.
2. **Mathematics Is Sacred.** Never silently alter grading mathematics — not AI, UI logic, export logic, templates, formatting, or convenience. If uncertain: **STOP → Document → Ask → Research → Verify → change explicitly.** Agents must not "improve" a grading formula because it seems more logical.
3. **Grading Engine Beyond CYC.** The architecture is Engine → Standard Provider → (CYC / UK / EN 13402 / Japanese / Korean / Chinese / ANZ / custom / brand), with CYC the *default provider*, never the engine's identity. But standards must *earn their place* through verification — a fake "global standard library" is worse than a small verified one. Quality of each standard matters more than quantity.
4. **Ease Is First-Class.** Positive/negative/zero ease, measurement-specific ease, fit profiles, and the fundamental distinction between the standard's body measurement and the designer's intended finished garment measurement. Ease lives independently from the standard.
5. **The Designer Owns Their Work.** Local-first is a philosophy, not a storage decision: "the software is a guest in the designer's life, not a landlord." IndexedDB → optional cloud. Auth is convenience, not ownership — signing in enhances the experience, never unlocks the fundamental right to use one's own work. Cloud sync must never betray the mathematics: explicit conflict handling, no silent version destruction, collaboration later. The designer's brand must survive every export — the PDF says "This is my pattern," not "This is a Stitch & Scale document."

---

## 4. The six-agent team and my role as Team Lead

The constitution defines six agents: **Director** (plans campaigns with angles and proof surfaces), **Generator** (produces media from approved briefs and assets only), **Reviewer** (triage + verification against evidence), **Crawler** (eyes-and-clicks QA with screenshots as proof), **QA** (pattern-creator and math-focused defect finding), and **Main Worker** (me — build, fixes, and quality gates).

My standing instruction from the owner: *I am the leader of the agents. They help me catch what I miss; I must instruct them perfectly, write in the repo where they must see my instructions and messages, and verify their output against evidence.* The canonical instructions live in `docs/team-standing-orders.md` (agents read it before every firing and post findings to `docs/leader-notes/`) and `docs/staff-working-prompt.md` (my working prompt). Both agents are told plainly: perfection is the bar, measured with exact numbers; anything uncertain is marked UNVERIFIED; reports without evidence are themselves findings; lies, overstatements, and flaws must be called out wherever found — including in my own claims.

The team works **only the existing defect backlog** (open issues, severity ledger, QA artifacts). No new features, no scope invention, no competitor research outside the backlog. Every commit is `[CHK-NNN] [STITCH-AND-SCALE-PRO] [VERIFIED] …` with honest gate claims (typecheck + vitest + build). The repo stays private; `stitch-and-scale-rc` is never touched; nothing is merged or pushed on anyone's behalf.

### My per-session inbox sweep (before any code)

1. Sweep GitHub Issues: `S0xx` auto-monitor findings (severity-ranked, file:line:evidence:proposed-fix) then the QA backlog, highest severity first; fix → comment with evidence → close. Silence is treated as "not seen," so deferred items get a session-note reason.
2. Check open PRs (none expected under current policy).
3. Keep the three long-open MAJORs from going stale, escalating until fixed: (a) royalty double-count in `yarn-company-deal.ts` L173; (b) `resolveProjectStandards({} as never)` empty fallback in `pattern-readiness.ts` ×2 and `yarn-estimator.ts`; (c) the bundle card never collecting partner patterns.
4. Apply the storage-seam convention to every new tab before shipping: `stitch-and-scale-{tab}-{projectId}` plus global defaults — never another bare localStorage key (18 known).

### Schedule state

The six-agent schedules are created one-per-task from each agent's own chat (the completion instructions in `docs/stitch-scale-completion-instructions.md`), using the published playbook files under `docs/agent-prompts/`. The Drive archive is live and private (`docs/stitch-scale-drive-setup-state.md`); the one remaining human action is the one-time OAuth consent on the owner's PC, after which the Generator and Reviewer get Drive access via the connected Google Workspace account.

---

## 5. Design doctrine (layout-perfection skill, memorized)

Inspection order: broken layout first (bug, not style), then information architecture, navigation, spacing, touch targets, state design, localization. Broken layout is never evaluated last — it invalidates everything after it.

| Rule | Concrete form |
|---|---|
| Flat lists | >7 ungrouped items is a smell; group, filter, or both |
| Disclosure depth | Max 3 levels; progressive disclosure |
| Tab bar | 3–5 top-level destinations, hard ceiling; navigation only, never one-off actions; bottom nav on mobile; active tab unmistakable |
| Spacing | 8pt grid only: 4/8/12/16/24/32/48/64; internal padding ≤ gap to neighbors; card padding 16px, card gap ≥24px |
| Touch targets | ≥44×44pt with breathing room between adjacent targets |
| Settings screens | 5–8 generic categories, usage order, destructive actions at bottom behind confirmation, search past ~15–20 settings, dependent toggles nested under their parent |
| Project space | Two-tier tabs: core set + "More tools" grouped by workflow stage; max ~4–6 core labels at 360px; every project screen its own empty state |
| State design | Loading / first-use empty / filtered empty / error are four *different* treatments, never one generic blank; local-first adds a save-status indicator |
| Dark theme | Elevation via surface color, not shadows; off-white text, never pure #FFF on near-black (halation) |
| PWA feel | `env(safe-area-inset-*)`, `touch-action: manipulation`, animate transform/opacity only, 150–250ms |

Crawler's perfection checklist (8 items, same table, applied visually with screenshots at 360/390/430px) is the visual enforcement of these rules.

---

## 6. Video production doctrine (memorized from the test-video lessons)

The single biggest failure observed: **caption obstruction** — captions rendered over the grading table hid the exact numbers the video was supposed to prove. A promotional video must never obscure the evidence it asks the viewer to trust. Full rules: caption safe-zone mapped before the shot list; one intentional visual-text layer at a time (never invented UI labels or floating text); dense tables are establishing views only, proof shots zoom into one claim; one declared narrator family per video (mono track is not proof of a single voice — listening passes at normal and low volume); scripts must dramatize one high-stakes moment, never a generic feature tour; brand voice is the honest outsider founder ("I don't know how to knit. My late mother did. I wrote the math so you don't have to fight Excel at 11 PM") — scripts never imply the founder is a designer or that revenue exists; unsupported claims are UNVERIFIED; the delivery gate is eight passes (watch-through, technical, captions-off clarity, captions-on safe zone, voice continuity, mobile legibility, claim verification, filename/checksum manifest); creative angles must rotate (XXL lie, 11 PM spreadsheet, stale instructions after a changed measurement, local-first privacy, invisible labor, test-knit roster, outsider confession, show-me-the-math).

---

## 7. Prioritized feature inventory (35 tiers)

The reconstruction produced a ranked inventory. The 🔴 MVP tier (14 items) is the first serious build surface: ease & fit, multi-size finished measurements, grading sanity checks (warnings, never silent corrections), gauge verification, pattern-repeat warnings ("67 isn't divisible by 4 — recommend, designer decides"), project metadata, section templates, designer notes, export preflight, beautiful PDF starter templates, revision identity, calculation provenance, CYC-behind-an-interface, and the custom-standard *architecture* (creation may come later). The 🟡 next tier adds schematic, shaping planner, materials record, revision comparison, standard locking, submission checklist, and shareable finished reports. The 🔵 ecosystem tier (cloud sync, read-only sharing, review workflow, publishing engine, storefront, marketplace, analytics, collaboration, AI) is deliberately last.

The pre-publication **Pattern Check** quality gate (≈20 reconciliations: stitch/row counts reconcile, schematic ↔ graded consistency, missing data, impossible values, required metadata) and the **schematic generated from the same numbers as the grading engine** (Measurement → Grade → Schematic provenance chain) are the two highest-leverage safeguards identified, because they catch exactly the class of errors human tech editors currently catch.

---

## 8. Current backlog and last delivered state

Localization: the CHK-137/138 (gauge byline + units) and CHK-139 (nine-item no-deferral sweep of remaining English-only strings) cycles are pushed; the long-form localization scope estimate is in `docs/leader-notes/scope-estimate-longform-localization.md` (~20 narrative paragraphs, 17+13 distinct toast strings, one measurements chip, ~95 field hints — honest estimate 2–3 working days, pending the owner's go-ahead). Open registered items: the `0 measurements` chip, toast/snackbar module, Tier 1/Tier 2 narrative localization. **MAJOR update 2026-08-19 (restudy `97897be`, verified at HEAD):** the §4 inbox-sweep escalations are struck — S182 and S251 are FIXED IN CODE (inline `S182 fix` comment in `podcast-affiliate-lab.ts` and `reviewer debt a` comment in `yarn-company-deal.ts`); S160 is REQUIRES-REPRODUCTION (no concrete reproduction exists); the "bundle card never collects partner patterns" item is FIXED (real `addPartner()` control in `translation-bundle-card.tsx`, partners consumed by the engine). The stale-escalation defect is now a standing rule in `docs/team-standing-orders.md`: Reviewer must never re-escalate an item visibly fixed in the current tree. Full details in `docs/leader-notes/restudy-2026-08-19-S001-to-HEAD.md`.

Gates discipline: every claim measured from the current tree (tsc, vitest, build); honest claims only; anything I cannot verify is marked UNVERIFIED.

---

*This document is the persistent memory for the next task. All evidence lives in the repo; the owner's five files remain the canonical source where the two conflict.*
