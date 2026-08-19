# Stitch & Scale — Next-Milestone Roadmap

**Prepared by Manus AI · 18 August 2026**

## Executive decision

The highest-leverage next milestone is not another broad lab. It is a **trusted release workflow for independent knitwear designers**: a pattern must be structurally valid, graded across all supported sizes, readable on a phone and printed page, exportable with explicit provenance, and accompanied by durable business records. PR #71 establishes the first two foundations. The follow-up work in this audit hardens them, adds mobile regression coverage, and closes several localization and record-integrity gaps.

The roadmap should remain **local-first, deterministic, and evidence-led**. The product must not imply cloud sync, automatic accounting, tagged-PDF accessibility, tax treatment, or physical test-knitting merely because an automated check passes. The existing research shows that designers need ownership, low-friction records, per-design cost visibility, and protection from platform fragility [1].

## Current state after this workstream

| Area | Completed or verified | Remaining risk |
|---|---|---|
| Pattern QA | Deterministic structural and grading checks; compact Grading Lab summary; blocking and warning semantics. | Human technical editing, test knitting, and chart/schematic review remain outside automation. |
| Publication preflight | Identity, grading presence and completeness, locale, template, renderer provenance, logo size, and propagated QA flags; export blocks on errors. | Generated-PDF tag structure, page-break quality, chart scale, and physical print review still need artifact-level checks. |
| Mobile UI | Onboarding scroll-owner fix; safe-area clearance; export preflight-first ordering; 44px fixes for key actions; local smoke runner across 320/360/390/430px. | Dedicated short-height landscape compositions and 79-lab search/favorites remain open. |
| Localization | PDF theme metadata, export tip, image errors, pattern-notes label, preflight copy, and ledger workflows now have five-locale coverage. | The wider application still needs a complete literal scan and long-text review in every route. |
| Craft-business records | Design Ledger remains project-scoped; Receipt Lab remains the sales source of truth; ambiguous sales attribution is no longer guessed; ledger actions are mobile-safe. | Samples, submissions, test-knit rounds, wholesale follow-up, invoices, and payment commitments are not yet durable record types. |
| Regression evidence | Unit suites for QA, preflight, labels, ledger; dependency-free CDP mobile smoke runner covering onboarding, dashboard, new project, workspace, export, Grading Lab, and Design Ledger. | The runner is local and read-only apart from explicit sample seeding; CI integration and keyboard/reduced-motion assertions are still needed. |

## Priority sequence

### P0 — Release trust and artifact evidence

**Objective.** Make publication readiness a defensible decision rather than a visual impression.

The first P0 increment should add a rendered-artifact inspection step after the current source preflight. It should record page count, blank-page detection, title/heading presence, table/header continuity, chart and schematic presence, filename, locale, template ID, renderer version, and source project ID. It should distinguish automated evidence from human review. The current renderer contract must remain unchanged; the inspection layer should consume its output or preview artifact rather than reimplement rendering.

The acceptance bar is a matrix covering all four templates, all five locales, representative long names and notes, custom logo present/absent, cover/gauge/notes toggles, and phone/tablet/desktop preview. A release cannot claim PDF accessibility until an external tagged-PDF inspection has been performed; Section 508 guidance identifies `Document`, heading, figure, and table tags as structural requirements [2]. Mobile review should check single-column readability, zoom burden, file size, and actual phone viewing [3].

### P1 — Technical-editor and test-knit workflow

**Objective.** Turn QA findings into a reviewable defect ledger.

Add a local-first defect record linked to a project and QA run. Each issue should carry a stable ID, severity, affected size(s), section/measurement reference, evidence, reproduction state, owner, disposition, and resolution note. Add explicit states such as `open`, `accepted`, `fixed`, and `needs-test-knit`. Do not silently dismiss a blocking issue; an accepted warning should require a designer decision and remain visible in release evidence.

Follow with test-knit rounds as separate records containing tester, size, gauge, yarn, date, status, observations, and follow-up. This is a safer boundary than adding free-form “reviewed” labels to the grading engine.

### P1 — Operational records for the designer’s real business

**Objective.** Extend the ledger only where durable history is currently missing.

Build the next record types in this order: **sample tracker**, **submission pipeline**, **test-knit archive**, then **wholesale order follow-up**. Each record should use the existing `projectStorage<T>` seam, stable identifiers, explicit dates, local export, and deletion confirmation. Sample records need current location, borrower/event, loan date, return due date, and returned/sold/lost status. Submission records need outlet, deadline, submitted date, outcome, and notes. Wholesale records need account, order/invoice ID, terms, due date, status, and payment follow-up.

Do not turn this into tax software, automatic reconciliation, or money movement. Every figure must be labeled as recorded, estimated, planned, or unverified, following the domain guardrails in the craft-business skill and the existing record-keeping research [1].

### P1 — Mobile-maker navigation and interruption recovery

**Objective.** Reduce the cost of doing real work in a studio, market, workshop, or event setting.

Keep one scroll owner per surface, preserve bottom safe-area clearance, restore focus after drawers and dialogs, and retain active tab/scroll position after interruption. Add search and “recent” or “favorite” lab access to the 79-lab drawer; category scanning alone is too slow on a phone. Add explicit unsaved-state messaging for text-heavy entries and confirm destructive deletion while preserving unrelated records.

The next acceptance matrix should include 320×568, 360×800, 390×844, 430×932, 844×390 landscape, tablet, desktop, 200% text scaling, keyboard-only navigation, reduced motion, light theme, dark theme, offline reload, and storage restoration.

### P2 — Full localization and content expansion audit

**Objective.** Make every supported route trustworthy in every locale.

Add a static literal scan for user-facing English in route components, copy registries, toast messages, theme metadata, helper text, and empty states. Then run a rendered long-text matrix for de, fr, es, and pt at the smallest supported widths. The audit must check truncation, awkward wrapping, pluralization, number and currency formatting, unit labels, date ordering, and locale fallback behavior. No route should silently inherit English merely because a copy object spreads `en`.

### P2 — CI and release evidence

**Objective.** Make the quality bar repeatable for future contributors.

Add the mobile smoke runner to a non-destructive CI job once a CI browser is available. Keep local sample seeding isolated to the test profile. The job should publish screenshots and structured metrics as artifacts, run the full Vitest suite, run typecheck and build, and fail on horizontal overflow, missing preflight status, missing QA summary, sub-44px critical controls, or a broken route. A separate manual checklist should cover printed pages and external PDF accessibility inspection.

## Recommended implementation order

| Sequence | Deliverable | Why now | Exit criterion |
|---:|---|---|---|
| 1 | Rendered-artifact publication inspection | Prevents “green source checks, broken PDF” releases. | Artifact report exists for every template and locale matrix cell. |
| 2 | Technical-editor defect ledger | Converts QA output into accountable decisions. | Every release warning has an owner or disposition. |
| 3 | Sample tracker and test-knit archive | Addresses the most dangerous physical-workflow gaps. | A sample can be loaned, returned, sold, or marked missing with history. |
| 4 | Submission pipeline | Prevents deadline loss and makes publication operations durable. | Deadline, submission, outcome, and notes survive reload/export. |
| 5 | Wholesale follow-up | Addresses payment visibility without becoming accounting software. | Due dates and follow-up status are locally recorded and exportable. |
| 6 | Lab search/recent/favorites | Makes the existing 79-lab surface usable on mobile. | A designer can reach any lab in one search or two deliberate taps. |
| 7 | CI smoke artifacts and full locale matrix | Protects the improvements from regression. | The same acceptance matrix runs on every release candidate. |

## Explicit non-goals

This milestone should not add cloud sync by implication, background jobs, analytics, payment processing, tax advice, automatic reconciliation, a competing grading engine, renderer rewrites, or generated numeric charts and schematics. It should not claim that an export is accessible or test-knit without the relevant artifact or human evidence.

## References

[1]: ../record-keeping-gap-map.md "Stitch & Scale record-keeping gap map and cited research"

[2]: https://www.section508.gov/create/pdfs/common-tags-and-usage/ "Section 508 — Common PDF Tags and Their Usage"

[3]: https://www.adobe.com/acrobat/hub/create-a-mobile-friendly-pdf.html "Adobe — How to create a mobile-friendly PDF"
