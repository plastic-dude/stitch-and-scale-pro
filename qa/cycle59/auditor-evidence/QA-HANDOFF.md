# QA Crawler → REVIEWER Handoff SOP

## Purpose

This handoff is for independent, read-only QA. The auditor may inspect the live application, source, build, tests, console, network behavior, responsive states, and persisted data, but must not edit application code. Findings are addressed to **REVIEWER**, not directly to CODER. REVIEWER decides whether a finding is valid, duplicate, stale, deferred, or ready for coder routing.

## Crawler output requirements

Every finding must include the live URL or commit under test, date/cycle, browser and viewport, clean-profile or seeded-data conditions, exact navigation path, reproduction steps, actual result, expected result, severity, console/network evidence when relevant, and links to named screenshots. A crawler must capture state-driven UI, not only URL routes: tabs, sub-tabs, menus, modals, dropdown-open states, forms, empty states, and top/middle/bottom scroll positions.

The crawler must maintain a state fingerprint such as `URL + visible heading + active tab + modal/dropdown state`, so it avoids duplicate screenshots while never treating a different tab or modal as the same state. Failed activations are evidence: record the target, viewport, failure reason, and whether the failure suggests a real reachability or touch-usability defect.

## Reviewer issue format

Use the title pattern:

`[QA cycle N] SEVERITY: concise user-facing defect`

Begin every body with:

> This report is addressed to the Reviewer. The Coder should not act on this report directly — please triage and decide on closure or routing.

Then include these sections:

1. **Severity and user impact.** Explain who is blocked, what data or workflow is at risk, and whether the defect is conversion-blocking, correctness-critical, major, minor, or informational.
2. **Reproduction.** Give numbered steps that another agent can execute from a clean or explicitly seeded state.
3. **Actual versus expected.** State the observed result and the intended result without speculative language.
4. **Evidence.** Link to the QA evidence branch and exact screenshot filenames. Include console errors or measured DOM/layout values when relevant.
5. **Suggested acceptance test.** Define the smallest verifiable condition that proves the fix works on the affected device classes.
6. **Related issues.** Identify duplicates, regressions, or existing ledger entries rather than opening parallel copies.

## Triage boundary

The auditor reports facts and a suggested acceptance test. The auditor does not prescribe unrelated refactors, close issues, or claim a fix is verified without retesting the current target. REVIEWER owns classification and routing. CODER receives work only after REVIEWER accepts or escalates the finding.

## Fix-verification comment

After a candidate fix exists, the auditor should add a separate comment addressed to REVIEWER. It must name the tested commit or QA branch, list the exact browser/device matrix, repeat the original reproduction, report console and visual results, mention regression checks, and leave closure to REVIEWER. If the original report was stale or not reproducible on current main, say so explicitly and preserve the original evidence.

## Evidence branch convention

Use a non-main branch such as `qa/manus-YYYY-MM-DD-cycleNN-auditor`. Store a compact reviewer evidence set under `qa/cycleNN/auditor-evidence/`, with filenames encoding route, state, and viewport. Keep the complete local archive separately when the full matrix is too large for a reviewer issue. The branch commit must contain no application-code changes.

## Device standard

At minimum, test 390×844 iPhone portrait and 360px Android portrait. Add 430px iPhone, 768px tablet, and 1280px desktop when the layout changes materially or a defect is borderline. For touch surfaces, use real swipe/activation behavior and verify the effective hit target, not just the existence of a DOM button.

## Current cycle

Cycle 59 published the evidence branch `qa/manus-2026-08-17-cycle59-auditor` and opened Reviewer-addressed issues #61, #62, and #63. The branch is a read-only evidence handoff; no application code was changed.
