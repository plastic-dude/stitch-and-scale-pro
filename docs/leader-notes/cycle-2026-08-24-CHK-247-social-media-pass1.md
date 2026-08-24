# CHK-247 — QUEUE-067 Social/Media Release Pass 1

**Date:** 2026-08-24
**Worktree:** `/tmp/stitch-and-scale-coderii-20260824`
**Audited parent:** `b8a24e6ed276295ab10c31a4c47bda2c48342fdc`
**Scope:** Research-only; no application code

## Decision summary

This firing completed the required **separate brief and first research pass** for QUEUE-067, a possible private-by-default social/media release layer for independent knitwear designers. The pass does not authorize implementation. The next required step is a separate Pass 2 that stress-tests the proposed local release draft and one explicit handoff touchpoint before any runtime item can be opened.

The product opportunity is not to become a social dashboard. It is to help a maker deliberately prepare a truthful, accessible, provenance-aware handoff from a local artifact that they have already reviewed. The future workflow must preserve local ownership, avoid platform-success claims, and keep sharing voluntary rather than turning it into a measure of maker value.

## Fresh wide audit

The firing began with independent audits of repository ancestry/worktrees, queue and release history, current product/export/MCP boundaries, quality/build/performance evidence, and the live production trust boundary. The audited worktree was clean, `HEAD` matched `origin/main` at `b8a24e6ed276295ab10c31a4c47bda2c48342fdc`, and the protected invention brief retained its required SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`. The existing source-bundle read receipt remained present.

The queue showed that QUEUE-068 persistent local-storage protection and QUEUE-069 local StitchIdentityV1 normalization were complete. QUEUE-067 was the older eligible item but explicitly required its own separate brief and two research passes before implementation. That prerequisite is now satisfied for the brief and Pass 1 only; no application change was made.

## Current product evidence

The live Brag Card engine is a strong local-first precedent. It derives sales statistics from the local Receipt Lab and published-design information from the Design Ledger, renders SVG locally, and documents that nothing leaves the browser. Its copy attributes claims to the designer’s own numbers, requires studio/tool attribution without watermarks, and bounds custom logos to local image data URIs. A future release layer should reuse these facts and safeguards rather than inventing a second calculation path.

The Portfolio release surface performs a browser print handoff and does not claim that a browser saved, printed, or shared successfully. Receipt Lab deliberately presents screenshot support as guidance and separates it from print/PDF. Publication downloads are exposed only when a real artifact URL exists, avoiding fabricated download completion. These patterns should remain unchanged and become the baseline for any future handoff wording.

The current image utility is a bounded local logo compressor, not a finished-work photograph attachment system. Lookbook Desk plans gallery photography and shot requirements but does not prove that a finished image was selected, licensed, or approved for release. A future media design must distinguish planned photography from a user-selected local asset and must not imply ownership or tester status from file selection alone.

## Research findings

| Question | Pass 1 finding | Consequence |
|---|---|---|
| What should be shared? | An explicitly selected existing artifact plus selected factual fields, caption, and reviewed text alternatives | No default whole-project dump; preview the exact payload |
| Who controls release? | The maker, after reviewing audience, purpose, fields, media, caption, alt text, and redactions | Private by default; explicit final action |
| What can the app claim? | It can prepare or hand off local material; it cannot claim a platform accepted, published, saved, or displayed it without verifiable evidence | Use `prepared`, `handed off`, or `unknown`, never fabricated success |
| What media is supported? | Only a user-selected local asset with type/size bounds and human-reviewed description | No camera permission, remote fetch, background upload, or inferred licence |
| What provenance is required? | Artifact source, generation context, local-only-until-handoff status, and `self-reported` labels where applicable | Preserve existing Brag Card and StitchIdentity trust language |
| What remains out of scope? | Accounts, servers, community, social metrics, auto-posting, cryptography, hidden consent, and MCP write tools | Keep this app a local production-control layer |

WCAG 2.2 is a W3C Recommendation organized around perceivable, operable, understandable, and robust content.[1] Its non-text guidance requires alternatives that serve an equivalent purpose rather than a generic image label.[2] Therefore a future finished-work image flow should ask for or guide a maker-reviewed description in the selected language; it should not silently generate or assert garment facts.

The NIST Privacy Framework is a voluntary privacy-risk management framework.[3] Applied to this local-first product, its useful constraints are data minimization, purpose/audience clarity, review before release, and a user-controlled removal path. The W3C Data Privacy Vocabulary is a Community Group Final Report rather than a W3C Standard.[4] It may inform vocabulary comparison but does not justify adding a privacy ontology, server-side consent service, or account system.

## Pass 1 boundary and recommendation

The strongest safe direction is a **local Release Draft** rather than direct social integration. A future draft can hold a selected artifact, selected fields, human-authored caption, per-image alt text, redactions, audience/purpose, provenance, and a truthful completion state. The draft should be reviewable before a browser handoff and deletable locally. If no photo exists, the workflow must still be useful for a Pattern PDF, Project Book, Brag Card, or receipt-derived summary; photography must not become a gate for legitimate production work.

Pass 2 should challenge this direction with representative workflows: finished pattern launch, tester call, portfolio case study, work-in-progress update, and private client handoff. It should verify the minimum field set, five-locale wording, mobile review order, keyboard semantics, no-photo path, local deletion semantics, and the distinction between prepared and externally completed. It should also inspect whether a single explicit clipboard/download/print handoff is valuable without adding platform adapters.

**Recommendation:** Keep QUEUE-067 research-only. Do not create a share button or runtime release object from this pass. Open a future implementation item only if Pass 2 confirms that a minimal local preview/handoff improves the production workflow without creating pressure, false provenance, or new data leakage.

## References

[1]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines (WCAG) 2.2, W3C Recommendation"
[2]: https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html "Understanding Success Criterion 1.1.1: Non-text Content, W3C"
[3]: https://www.nist.gov/privacy-framework "NIST Privacy Framework"
[4]: https://www.w3.org/community/reports/dpvcg/CG-FINAL-dpv-20240801/ "Data Privacy Vocabulary v2.0, W3C Community Group Final Report"
