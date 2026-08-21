# Product-goal assimilation and implementation decision

**Date:** 2026-08-21
**Scope:** Stitch & Scale Pro publication-readiness tranche
**Author:** Manus AI

## Governing product goal

Stitch & Scale Pro should be a trustworthy bridge from a designer’s base-size knitwear draft to a checked, human-review-ready, publication-ready multi-size pattern. The product must preserve mathematical integrity, designer ownership, recoverability, and creative control. The emotional test is: “I made it. I understand it. I can trust it. I can show it.”

The defensible wedge is a production-control layer between creative drafting and professional publication, not a general knitting dashboard, marketplace, social network, or generic AI assistant. The core path is:

> **Draft or import → Grade → Check → Human handoff → Publish or export.**

Business-planning modules remain valuable secondary surfaces, but the core workflow must earn trust first.

## Archive-derived requirements adopted in this tranche

The supplied plans repeatedly require separate states for **Calculated**, **Automated check passed**, and **Human reviewed**. A single score must never be mistaken for certification. A professional handoff should preserve assumptions, issue evidence, unresolved warnings, test-knit notes, version context, and designer or reviewer sign-off.

The implementation therefore adds a portable `humanReview` record to the canonical `PatternProject` model. It is deliberately small and reversible: status, reviewer name, note, and timestamp. The grading page presents it beside deterministic readiness and technical-edit evidence. Approval is disabled while canonical automated checks still report blocking errors. The record is included in print output and the multi-project Project Book so it survives the handoff rather than remaining trapped in a browser-only control.

Migration validation now rejects malformed review records and bounds names, notes, statuses, and timestamps. This preserves the local-first recovery promise without allowing hostile backup data to reach the project store.

## Performance decision

The correct chunk strategy is to remove non-critical runtime dependencies from the first route, not to silence Vite with arbitrary `manualChunks`. On the measured build, the critical entry is now approximately **444.99 KB minified / 142.61 KB gzip**, below the prior 500 KB warning threshold. The work was achieved by lazy-loading onboarding, not-found, and export-triggered install UI, replacing persistent shell and autosave Framer Motion usage with CSS-only transitions, and removing an unused static workspace import.

The remaining large deferred chunks are feature-scoped. Further splitting should be driven by real-device profiling and route usage, especially for the workspace graph and monolithic lab-stat copy, rather than by arbitrary vendor boundaries that may increase request overhead.

## Next successor work

The next highest-value product tranche is a real technical handoff packet: immutable project version metadata, an auditable calculation trail, issue-level annotations and assignment, test-knit evidence, and side-by-side version comparison. The private-beta plan should follow with a small server-side control plane for invitation, entitlement, feedback capture, and abuse protection. Full cloud sync and broad OAuth should remain deferred until the core workflow proves value.

A persistent in-app feedback control is also required before a serious private beta, but it should not pretend that a local-only `mailto:` link is a secure operational feedback system. It needs an intentional server-side boundary, report ID, redacted diagnostics, and role-protected review access.
