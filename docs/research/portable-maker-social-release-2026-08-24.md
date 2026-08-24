# Portable Maker Social/Media Release Layer

**Status:** Research brief — implementation blocked until two research passes are complete
**Owner boundary:** Local-first, voluntary, private-by-default release of already-produced maker artifacts
**Date:** 2026-08-24
**Author:** Manus AI

## 1. Purpose

Stitch & Scale Pro is a local-first production-control layer for independent knitwear designers. Its existing Brag Card, Project Book/publication package, Pattern PDF, and Receipt Lab surfaces already help a maker inspect work, make decisions, and prepare artifacts. A future social/media release layer could make those artifacts easier to carry into the places where makers already communicate, but it must not turn the product into a generic social dashboard or make sharing the default measure of success.

The product problem is therefore not “how do we post more?” It is: **how can a maker deliberately prepare a truthful, accessible, provenance-aware release from an artifact they already reviewed, while keeping ownership, audience, and withdrawal under the maker’s control?** This brief defines that boundary for research. It does not authorize application code, automatic posting, accounts, a server, engagement metrics, or a new MCP tool.

## 2. Current live foundation

The current application has useful local export precedents that should be extended rather than duplicated. The Brag Card engine derives sales and published-design statistics from the local Receipt Lab and Design Ledger, renders an SVG locally, and documents a zero-network flow. Its copy rules attribute claims to the designer’s own numbers, and its design contract requires studio attribution without watermarks. The branding seam accepts only bounded local image data URIs, preventing a remote logo dependency from becoming part of an export.

The Portfolio release surface currently prepares a browser print handoff. It opens a print window and requests printing, but does not claim that the browser completed saving, printing, or sharing. Receipt Lab keeps its screenshot control as guidance and separates it from the print/PDF action. Publication artifacts expose a download only when a real artifact URL exists; the UI does not fabricate a successful download. These are important trust patterns for any future release surface.

The existing image utility compresses uploaded logos into small local data URIs. It is not a finished photographic attachment system and should not be treated as one. Lookbook Desk currently plans photography and gallery requirements; it does not, by itself, establish that a user has licensed, attached, or approved a finished-work photograph. Future media work must therefore distinguish a planned shot from an actually selected local asset.

## 3. Working definition

A **social/media release** is a user-reviewed, explicitly selected presentation package that may contain one or more already-produced local artifacts, a human-authored caption, a human-reviewed text alternative for each non-text image, selected factual fields, and provenance language. The release is a preparation and handoff workflow. It is not an automatic post, a platform integration, a public profile, a popularity system, or proof that an external platform accepted anything.

The release should be **private by default** and should require an explicit user action after the app shows exactly what will leave the local device or be handed to another application. If the first implementation remains clipboard/download/print based, the UI must say that plainly. A browser handoff may open a chooser, print dialog, or download flow, but the product must not claim completion until it receives a verifiable local result; where no such result exists, it should use request or guidance language.

## 4. Goals and non-goals

| Area | In scope for future research | Explicitly out of scope for this queue item |
|---|---|---|
| Maker control | Select artifact, fields, audience, purpose, caption, alt text, and redactions | Auto-posting, implicit consent, default public release |
| Privacy | Minimize shared data, preview exact payload, local release record, clear delete/withdraw action | Accounts, cloud sync, server-side profile, social graph |
| Accessibility | Equivalent text alternatives, keyboard-complete controls, visible focus, mobile-safe preview, localized labels | AI-generated claims presented as user-approved facts |
| Truthfulness | Provenance label, source artifact, generation time, “self-reported” where applicable, request-only handoff wording | Engagement counts, follower metrics, fabricated platform success |
| Media | Explicitly selected local image attachments with user-authored descriptions and bounded size/type | Camera permission, background upload, remote asset fetching, inferred ownership/licence |
| Export | Reuse existing Brag Card/Project Book/Pattern PDF/receipt contracts through explicit selection | New automatic export, semantic changes to existing grading or PDF outputs |
| MCP | Possible later read-only preparation tool with explicit inputs and bounded output | Write/post tool, hidden selection, server sync, OAuth shortcut |

## 5. Proposed release object for research

The following is a conceptual shape only. It is not an implementation contract and should not be added to runtime until Pass 2 approves it.

```text
MakerReleaseDraftV1
  version: 1
  releaseId: local opaque identifier
  createdAt: local timestamp
  audience: private | client | testers | public-intended
  purpose: portfolio | launch | work-in-progress | finished-work | other
  sourceArtifacts[]:
    artifactKind: pattern-pdf | project-book | brag-card | receipt | other
    localArtifactId or explicit export reference
    selectedFields[]
  media[]:
    localAssetId
    mimeType
    byteLength
    userAltText
    userCaptionContext
    selectionConfirmed: true
  caption: user-authored text
  redactions[]: sensitive field identifiers removed from release
  provenance:
    generatedBy: Stitch & Scale Pro
    localOnlyUntilHandoff: true
    claims: self-reported
    completionStatus: prepared | handed-off | unknown
  consent:
    explicitlyReviewed: true
    reviewedAt: local timestamp
    withdrawnAt?: local timestamp
```

The important property is not the exact field names. It is the separation between **prepared**, **handed off**, and **confirmed by an external platform**. The last state should not be asserted by this local-first app unless a future, explicitly authorized integration can verify it.

## 6. Accessibility and privacy principles

WCAG 2.2 is a W3C Recommendation that organizes accessibility around perceivable, operable, understandable, and robust content.[1] A future release composer should therefore provide keyboard-complete selection and review, a visible focus path, meaningful accessible names, mobile-safe layout, and no interaction that depends only on color or drag gestures.

For non-text content, WCAG guidance says the alternative text should serve an equivalent purpose rather than merely describe that an image exists.[2] A maker’s finished-work photograph may need a short, human-authored description of the garment, construction, color, and relevant context. The app should guide the maker to write or review that text in the selected language; it should not silently invent a finished-work claim or imply that a photo is an approved tester image merely because it was selected.

The NIST Privacy Framework is a voluntary framework for identifying and managing privacy risk while protecting individuals.[3] Applied narrowly here, the future composer should show purpose and audience before release, minimize fields, support redaction, keep the release draft local unless the user starts a handoff, and offer a clear local delete/withdraw action. The W3C Data Privacy Vocabulary can inform vocabulary choices, but it is a Community Group Final Report rather than a W3C Standard; it is not a reason to add a privacy ontology or server-side consent machinery.[4]

## 7. Trust and provenance rules

The future release layer must reuse existing factual sources rather than calculate new social claims. Brag Card numbers should continue to come from the Receipt Lab and Design Ledger. A Project Book or Pattern PDF should identify the selected local publication artifact and its actual generation metadata. A receipt should remain a sales ledger artifact rather than being presented as proof of public demand. Stitch Identity data, if included later, must retain its plainly labeled `self-reported` status.

The release preview should show a compact “what leaves this device” section before the final handoff. It should list the selected artifact names, image names and sizes, caption, alt text, selected numeric facts, and omitted/redacted fields. It should also state that the app can prepare or hand off content but cannot guarantee that a platform accepted, published, saved, or displayed it.

## 8. Research questions for Pass 1 and Pass 2

Pass 1 should validate user need and harm boundaries against real independent-maker workflows: which artifacts are actually shared, which fields are commonly sensitive, what audiences need different redactions, and whether “release preparation” is more valuable than direct platform posting. It should inspect the current mobile review path, five-locale copy requirements, and browser handoff limits without implementing a composer.

Pass 2 should stress-test a minimal local draft shape and one explicit handoff touchpoint. It should test whether every field has a clear source, whether media descriptions are sufficient for accessibility, whether withdrawal/deletion can be truthful without a server, and whether the workflow remains useful when no photo is available. Only after that pass may a separate implementation item be opened; it should begin with pure schema validation and local preview, not posting or social analytics.

## 9. Decision

QUEUE-067 remains **research-only** after this brief. No application code, share button, camera permission, upload endpoint, account, cloud sync, social metric, automatic post, or MCP write capability is authorized by this document. The next allowed action is a separately recorded Pass 1 research firing. A future implementation must remain local-first, explicit-input, review-before-handoff, accessible, localized across `en/de/fr/es/pt`, and honest about external completion.

## References

[1]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines (WCAG) 2.2, W3C Recommendation"
[2]: https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html "Understanding Success Criterion 1.1.1: Non-text Content, W3C"
[3]: https://www.nist.gov/privacy-framework "NIST Privacy Framework"
[4]: https://www.w3.org/community/reports/dpvcg/CG-FINAL-dpv-20240801/ "Data Privacy Vocabulary v2.0, W3C Community Group Final Report"
