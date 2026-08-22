# Exact-bundle assimilation — Stitch & Scale

**Source:** owner-supplied `stitch_scale_bundle.zip` downloaded from <https://drive.google.com/uc?id=1sM4MMceHQiKIP3GNPSi_v8P8l9D2LSJ1&export=download>

**Archive fingerprint:** SHA-256 `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`

**Assimilation status:** All 15 source files in `original/` were read from the exact extracted bundle. The three Python files were treated as source and were not executed. This document is a dated synthesis for operational use; it never replaces the mandatory raw-file reading gate.

## 1. Product identity and narrow wedge

The bundle consistently points to a specific job rather than a generic dashboard: help an independent knitwear designer turn a base-size draft or spreadsheet into an explicit, checked, human-review-ready, multi-size pattern and a stable publication package. The product should be judged as a **designer production-control and quality system** between creative drafting and professional publication.

The high-value chain is:

> **Draft/import → measurements and gauge → grading → automated checks → human handoff → export → publication maintenance.**

The application should make designer decisions more reliable, explainable, recoverable, and presentable without taking authorship or ownership away. Pricing, income, bundles, clubs, wholesale, launch planning, and other business modules are possible expansion layers, but they must not obscure the first successful core path.

The recommended one-sentence promise from `stitch_scale_validation_report.md` is:

> **Stitch & Scale helps an independent designer turn a base-size pattern into a checked, human-review-ready, publishable multi-size pattern with less rework and lower production cost.**

The shorter homepage/onboarding direction is:

> **Grade, check, and publish multi-size knitwear patterns with a transparent calculation trail.**

The bundle warns against positioning the product for all knitters, all crafters, or all creative entrepreneurs. The initial ideal customer is an independent designer who has published at least one pattern, is preparing another multi-size garment or accessory, uses spreadsheets or manual documents, and has paid for or seriously considered technical editing or test coordination.

## 2. The five questions the product must answer

A trustworthy release workflow should allow a designer and a technical editor to answer these questions without reconstructing the project in another spreadsheet:

1. Are the measurements, gauge, ease, standards, and grading assumptions explicit?
2. Do sizes, stitches, rows, shaping, schematics, and written instructions agree?
3. What remains unresolved, with severity and affected size or section?
4. What exactly does a technical editor or test knitter need to review?
5. Can the application regenerate a stable, versioned, professional pattern package from the same project state?

The bundle repeatedly separates three kinds of truth:

| Status | Meaning |
|---|---|
| **Calculated** | The application generated a value from stated inputs and formulas. |
| **Automated check passed** | A defined consistency rule passed. |
| **Human reviewed** | A designer, technical editor, or tester explicitly reviewed the result. |

A credibility score may summarize evidence, but it must never imply certification, perfect fit, error-free prose, or replacement of technical editing and test knitting.

## 3. Mathematical and review trust requirements

The grading engine is the critical trust boundary. Every important value should expose a “Why this number?” trail containing the source measurement, gauge, ease, formula, grade factor, rounding rule, repeat constraint, result, and any manual override. The user should be able to compare the base size with every graded size and see the affected section or row.

The bundle identifies the following preflight risks as release-critical: inconsistent units; gauge conversion errors; stitch and row rounding; invalid or implausible size increments; missing measurements; ease confusion; schematic/table disagreement; section discontinuity; yardage assumptions; incomplete instructions; stale versions; and mismatch between calculated, rounded, overridden, and published values.

The appropriate response to uncertainty is **stop, record, research, verify, then ask or change explicitly**. A plausible number is not proof. The system must state what it cannot verify: physical fit, prose quality, construction feel, and the complete user knitting experience still require human review.

A professional handoff packet should carry the grading assumptions, complete measurement table, schematics, calculation/provenance trail, issue list, unresolved warnings, test-knit notes, version, and designer sign-off. Issues should support explicit states such as accepted, fixed, not applicable, and awaiting human review, with history preserved.

## 4. Local-first ownership and recovery

Local-first is a trust advantage only if recovery is practical. Designers protect months of intellectual property. The bundle therefore requires visible save state, JSON export, version history, restore testing, a clear recovery path, and backup status. Optional cloud sync must not make local work unusable or make privacy unclear. If clearing browser data can delete a project, that risk must be stated plainly and paired with a usable backup/recovery action.

The bundle’s beta-access architecture recommends a small server-side control plane only for controlled invitations and entitlements: confirmed email reservation, one-time invitation, lightweight tester account, server-side feature entitlement, feedback capture, rate limiting, and abuse protection. Invitation tokens should be opaque, cryptographically random, single-use, stored hashed server-side, expiring, rate-limited, and revocable. Capacity counts should be server-authoritative and count confirmed reservations rather than raw submissions or theatrical countdowns.

## 5. Beta, human feedback, and launch sequence

The first cohort should be a limited, invitation-only private beta. Its single question is whether a qualified designer can create or import a real multi-size pattern, understand the calculation trail, resolve warnings, produce a human-review-ready handoff, and export without losing confidence.

The recommended beta design is approximately 10–15 qualified active designers using the same core tasks. The target sequence is:

> **Import or draft → grade → check → handoff → PDF.**

Keep advanced business modules out of the first-run path. Use real projects, known-good fixtures, and intentional-error fixtures. Seed errors should include unit mistakes, bad rounding, inconsistent increments, missing measurements, stale values, and schematic/table mismatches. Track grading time, correction rounds, editor cost, tester duration, export success, backup/restore success, and second-project return.

The first beta must not treat positive comments or sign-ups as sufficient evidence. Materially wrong grading, data loss, privacy exposure, unusable exports, and failures that can mislead a designer are P0-style blockers for promotion. The goal is not to eliminate technical editors; it is to make drafts cleaner, reviews faster, and evidence stronger.

A minimal in-app feedback system should use one persistent but quiet feedback/report action, a short structured modal, one secure submission path, a private role-protected admin inbox, report IDs, severity rules, and redacted diagnostics by default. Do not upload project content silently. Attachments must be optional, private, size/type limited, validated, deletable, and retained only as needed. Avoid a public comment wall, automatic AI classification, or a large support platform until the first cohort proves the need.

## 6. Export and publication quality

A preview is not the same as a production artifact. A professional export should be deterministic, downloadable, stable under regeneration, preserve page breaks, embed fonts as appropriate, carry a version, and make provenance visible. The export should not silently recalculate grading values; renderers consume the typed publication specification from the authoritative engine.

The bundle’s target release package includes the pattern, measurement and grading evidence, schematics, issue/warning status, test-knit notes, version, and designer sign-off. A human editor must be able to review it without learning the whole application. After publication, corrections require a stable update path, change log, and notification process.

## 7. Economics and pricing: hypotheses only

The included economic and pricing scripts are illustrative calculations, not live product truth. They model yarn, production cost, platform fee, price, and break-even scenarios but exclude important variables unless explicitly added: payment processing, designer labor, support, revisions, test management, photography, layout, advertising, and taxes.

The bundle contains several price hypotheses that must not be presented as approved pricing:

| Hypothesis | Context |
|---|---|
| `$7.99` project pass and `$39` annual hobbyist offer | Compact risk/pricing memo, illustrative only |
| `$4.99` monthly hobbyist and `$19` monthly Creator Pro | Compact pricing model, illustrative only |
| `$49–$99` monthly Editor/Studio | Professional-layer experiment, illustrative only |
| `$15–$30` single professional export, `$15–$29` monthly, or `$149–$249` annual | Validation report’s paid-pilot experiments, illustrative only |
| `$45` Lite / `$80` Full one-time | Earlier canonical business spec recorded in the archive digest and explicitly contradicted by later designer audits; unresolved without owner decision and paid-pilot evidence |

The defensible economic claim is **reduced avoidable cost, rework, and release friction**, not guaranteed income. Show at least cash cost, cash plus paid labor, and fully loaded economic cost. Include break-even sales and sensitivity to price, conversion, revision count, support time, and platform fees.

The bundle’s examples show why this matters: a low-price pattern can require many sales before recovering yarn, sample, editing, testing, photography, layout, fees, and time. These examples are scenario illustrations rather than forecasts.

## 8. Research and evidence boundaries

The bundle’s cited market and competitor research supports a meaningful ecosystem but does not prove willingness to pay or current market size. References include Craft Yarn Council, Ravelry community statistics, Sister Mountain workflow and tech-editing guidance, EnvisioKnit, Stitchmastery, Etsy fees, Payhip pricing, Slow Knitting, MediaPeruana, Lion Brand, and other sources listed in the raw documents.

The repository’s evidence hierarchy remains controlling: current repository tree, current tests, fresh current-surface evidence, constitution and approved decisions, historical archive, external research, then agent inference. Bundle claims about prices, market size, competitor capabilities, and live-app behavior require fresh verification before they become public claims. The bundle is a strategic source, not permission to invent scope or override current code.

## 9. 10/10 validation scorecard

The bundle defines a strong case for 10/10 only after measurement with real designers, not after feature breadth:

| Evidence area | Strong initial target |
|---|---|
| Customer urgency | 10 of 15 active designers identify grading, correction, or publishing QA as recurring pain |
| Existing spend | At least half have paid for or budgeted for editing, testing, photography, layout, or equivalent help |
| First value | Real import/base setup and useful graded result in under 60 minutes without personal coaching |
| Accuracy | Test corpus catches all specified seeded errors; false positives are measured and actionable |
| Workflow reduction | Initial hypothesis of at least 25% reduction in grading/rework time or editor correction rounds |
| Human review | Editors find the handoff clearer and faster than the normal draft |
| Output acceptance | At least 8 of 10 pilot patterns produce a publishable-after-normal-review PDF without manual rebuild |
| Repeat use | At least 5 of 10 pilot designers bring a second pattern within 30 days |
| Willingness to pay | 3–5 active designers pay for a real export or pilot without a personal favor |
| Trust | Visible backup status, deterministic versioning, and explicit calculated/check-passed/human-reviewed states |

The bundle’s first-six-month dashboard additionally recommends tracking qualified sign-ups, time to first useful graded result, real-project completion, paid export conversion, second-project rate, seeded-error pass rate, false-positive warnings, support minutes, export success, and backup/restore success.

## 10. Operating decision for this repository

The exact bundle is now stored in this repository as raw source plus a fingerprinted archive. Agents must read the raw files before acting, then use this assimilation to avoid re-deriving the same strategic context. Implementation priority should continue to favor the trustworthy core path, transparent grading provenance, honest preflight, human handoff, deterministic exports, recovery, and current-surface evidence over adding more disconnected business breadth.

No statement in this synthesis authorizes a pricing commitment, a universal standards claim, an accuracy guarantee, a cloud-sync promise, a beta entitlement, or a public-release declaration. Each requires current evidence and an explicit product decision.
