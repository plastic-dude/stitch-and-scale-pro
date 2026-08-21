# Stitch & Scale Pro: Wide Product Gap Audit

**Author:** Manus AI
**Date:** 21 August 2026
**Scope:** Live deployment, repository capability surface, mobile/PWA behavior, storage and export trust, grading and pattern-development workflow, AI/MCP boundary, publication operations, accessibility, and adjacent-product expectations.

## Executive verdict

Stitch & Scale Pro does not primarily lack more calculators. It already has an unusually broad **78-tab planning and decision-support workbench** covering grading, fit, pricing, launch, sales channels, teaching, partnerships, and community economics. The serious deficiency is that the product is broader than it is deeply connected: many surfaces help a designer plan or calculate, but fewer carry the user through a complete, reviewable, publishable pattern lifecycle.

The most urgent gap is not a feature at all. The public deployment currently presents a dark blank viewport with an empty `#root`, even though its JavaScript and CSS assets return successfully. The deployed entry asset was observed at approximately **1.06 MB**, while the current tested branch produces an initial asset of approximately **597.57 KB minified / 190.99 KB gzip**. This is evidence of deployment/build misalignment or a pre-mount runtime failure, not a cosmetic issue. Until the live URL is aligned with the tested branch and passes a real browser smoke test, the product cannot honestly be called publication-ready.

The second major deficiency is **pattern-production depth**. The current product is strong as a knitwear design business workbench and grading assistant, but it is not yet a full professional chart-authoring and pattern-compilation system comparable to established charting tools. Adjacent products advertise visual chart composition, motif reuse, generated written instructions, chart error checking, stitch glossaries, WYSIWYG previews, and multi-format document export.[3] [4] [5] [6] Stitch & Scale’s current Chart Lab, draft, specification, grading, and PDF surfaces should not be described as a complete replacement for that workflow.

The third major deficiency is **operational continuity**. The product is local-first and now has a responsible cross-origin migration path, but it still lacks optional account-backed sync, revision history, collaboration, review assignments, durable tester feedback, and a formal publication sign-off trail. A user can plan extensively, but a team cannot yet reliably work together around a single evolving pattern.

## What the product already has

The following are not missing and should not be rebuilt merely because the product has other gaps:

| Existing strength | Honest assessment |
|---|---|
| Structured projects | Create, name, edit, duplicate, delete, import, locally persist, and export projects. |
| Deterministic grading | Numeric grading, standards resolution, measurement validation, rounding/parity handling, warnings, and provenance are stronger than an AI-only calculator. |
| Broad business layer | Pricing, platform, wholesale, launch, promotion, memberships, teaching, partnerships, and related scenario planners are unusually comprehensive. |
| Export foundations | Grading table/CSV, Project Book, pattern-related PDF flows, Brag Card, receipt, and JSON backup surfaces exist, with branded identity support. |
| Local resilience | IndexedDB-first persistence, local fallback, storage health, route error recovery, install prompts, mobile bottom navigation, and reduced-motion handling exist. |
| Origin migration | A versioned, merge-safe, least-privilege browser migration package now protects the custom-domain transition better than a simple redirect would. |
| AI/MCP safety boundary | The current bridge is read-only by default, accepts explicit project snapshots, calls deterministic grading, requires approval for the grading PDF, and avoids silent writes. |
| Localization foundation | The interface has five locale families, including Spanish, German, French, Portuguese, and English. |

The product therefore needs **depth, continuity, and release reliability**, not another large collection of disconnected tabs.

## Priority 0: publication blockers

| Gap | Evidence | Why it matters | Required correction |
|---|---|---|---|
| Live release integrity | The live URL rendered a blank viewport; `#root` stayed empty after page completion; the deployed asset did not match the tested branch. Evidence is preserved in `docs/gap-audit-live-notes.md`. | Users cannot use, trust, or install a blank release. It also makes every feature audit of the public URL inconclusive. | Add a production smoke gate that opens the exact canonical URL, waits for the app shell, checks `#root`, checks for visible navigation, exercises one project creation and one export, and records console/network failures. Deploy only the tested commit; verify rollback and custom-domain routing. |
| No complete publishable-pattern compiler | The MCP artifact is explicitly a `grading-pdf`, and the current exports are not equivalent to a full multi-size pattern PDF with complete instructions, charts, glossary, schematic, layout, and revision metadata. | A designer may mistake a grading report or project book for a customer-ready pattern. That creates a direct trust and commercial risk. | Define a separate `Pattern Publication Package` with an explicit readiness contract: written instructions, charts, abbreviations/glossary, schematics, row/round numbering, all selected sizes, gauge/ease, materials, finishing, accessibility, copyright, version, and final-proof status. Keep grading reports clearly labeled as reports. |
| No end-to-end mathematical-to-instruction validation | The grading engine validates structured numeric inputs, but the audit found no proof that every generated instruction, chart, schematic, and finishing step is reconciled against the graded numbers. | A mathematically correct table can still produce an unusable pattern if instructions and charts disagree. | Introduce a compiled intermediate representation and cross-check every output surface against it. Block publication on unresolved contradictions, missing sizes, inconsistent stitch counts, or stale revision inputs. |
| No formal final-review gate | Technical editing currently operates as a numbers-first audit and summary for a human editor. External technical-editing practice includes clarity, grammar, style consistency, sizing, mathematical accuracy, final proofing, and replayable corrections.[7] [8] | The product can report readiness without proving that the actual customer-facing prose and layout are ready. | Add a versioned QA checklist with issue severity, owner, evidence, correction, re-check, and final sign-off. Treat numerical readiness, editorial readiness, test-knit readiness, and publication readiness as separate verdicts. |

## Priority 1: high-value product gaps

### 1. A real visual chart-authoring layer

The product needs a genuine chart editor rather than only chart planning, checking, or conversion. Expected capabilities include a symbol palette, custom stitch symbols, draw/fill/erase, repeat regions, borders, row/column editing, mirroring, rotation, motif reuse, annotations, color handling, zoom/rulers, and visual error checks. Stitchmastery, KnitBird, Stitch Fiddle, and EnvisioKnit provide strong evidence that these are established category expectations.[3] [4] [5] [6]

This should not be implemented as another isolated lab. It needs to share a pattern model with grading, written instructions, preview, and export so that changing a repeat or gauge cannot silently desynchronize the rest of the pattern.

### 2. Pattern composition and compiled document production

The product lacks a single authoritative pattern document model. A professional compiler should assemble the designer’s metadata, yarn and materials, gauge, measurements, ease, sizes, construction sequence, abbreviations, stitch glossary, charts, written instructions, schematics, photos/diagrams, finishing, care notes, copyright, links, and revision information into a coherent document.

The missing concept is not merely “export all tabs.” It is a **versioned publication package** that knows which content is authoritative, which content is draft, which sizes are included, and which checks have passed. Project Book is useful for a portfolio or multi-project review, but it should not be positioned as a substitute for a customer-delivery compiler.

### 3. Revision history and branching

There is no durable, user-facing revision system comparable to pattern v1, test-knit revision, corrected edition, and published edition. Local persistence is not the same as an audit trail. Users need named snapshots, compare view, restore, revision notes, changed-calculation detection, and a way to mark an export as generated from a specific revision.

This becomes essential once AI-assisted suggestions or multiple testers are involved. A proposed change must be reviewable as a diff rather than silently becoming the new truth.

### 4. Collaborative technical editing and test knitting

The Test Desk, submissions, test-knit, and technical-editing surfaces are valuable planners, but they are not yet operational collaboration workflows. Missing primitives include invited reviewers, tester accounts or secure links, assignments, due dates, structured issue reports, comments anchored to sections or rows, attachments, status transitions, reminders, resolution evidence, and final approval.

The product should support a controlled handoff from designer to editor to tester to final proof, while retaining a local-only mode for users who do not want accounts. The absence of collaboration is a product gap; forcing cloud accounts on every local-first user would be a design mistake.

### 5. Asset and attachment management

A publication-grade pattern contains more than text and numbers. The product needs a project asset area for photos, swatches, schematic images, chart images, diagrams, reference files, and editor/tester evidence, with explicit file limits, previews, deletion, provenance, and export inclusion rules. It should also support a generated package such as a ZIP containing the final PDF, charts, grading CSV, credits, and machine-readable manifest.

Without this, users must assemble the actual delivery package manually outside the app, which weakens the promise of an integrated workbench.

### 6. Stronger sizing and fit governance

CYC body sizing is a good authoritative baseline, but only CYC plus Custom are currently exposed in onboarding while several named standards remain disabled. The Craft Yarn Council emphasizes the relationship between body measurements, finished measurements, and ease across multiple populations and units.[9] The gap is not simply “add more labels.” The product needs sourced, versioned standards tables; a visible source date; body-versus-finished measurement distinctions; garment ease profiles; inclusive grading diagnostics; and custom-standard provenance.

A designer should be able to see exactly which standards version and ease assumptions produced a size row, and should receive a meaningful warning when a grading rule creates implausible jumps or outlier proportions.

### 7. Multi-project operations

The product can manage many projects individually, but the audited surface does not yet establish robust bulk operations: filter/search/tagging, batch validation, batch export with per-project failures, archive/restore, duplicate detection, and progress/cancellation for large jobs. This matters for the user’s stated “52 projects in a year” stress test.

A batch operation must never fail opaquely at the first malformed project. It should return a manifest with success, warnings, blocked items, and artifact links for each selected project.

### 8. Export lifecycle and artifact quality controls

The product has several exportables, but users still need export history, revision binding, filename presets, locale and unit confirmation, page-count/size preview, embedded-font and image checks, accessible text where possible, and post-export verification. Brag Cards need a consistent logo/wordmark lockup and safe-area preview across social dimensions. Receipts need a clear “not tax/accounting authority” boundary. Project Book needs a distinction between portfolio book, internal review book, and customer pattern package.

The missing capability is **artifact governance**, not a larger export button.

### 9. PWA lifecycle maturity

The PWA has a basic install flow and app-shell cache. The service-worker audit shows no update notification flow, no cache/data-aware migration beyond wholesale cache replacement, no background sync, no queued work, and no message back into the app. The manifest also lacks richer shortcuts, share targets, file handlers, and protocol handlers.

The highest-value additions are an honest update prompt, offline/online status, explicit cache version migration, “last backed up” state, safe update rollback, and user-facing data recovery guidance. Background sync is lower priority because the product is local-first and has no essential queued server operation yet.

### 10. Mobile performance and dense-workspace ergonomics

Route-level lazy loading and mobile animation bypass materially improve the situation, but the initial JavaScript chunk still triggers a Vite warning at approximately 597.57 KB minified. The remaining cost is primarily application code in the shared workspace graph, especially eager loading of many lab cards. The product still needs lab-card-level lazy loading, a performance budget, and measurements on real iOS and Android-like devices.

Performance is not only bundle size. Dense grading tables, long forms, tab strips, modal focus, keyboard behavior, sticky actions, touch target sizing, and export feedback need repeated mobile testing. WCAG 2.2 explicitly covers reflow, focus visibility, keyboard operation, target size, status communication, contrast, and form behavior; a global accessibility baseline is not proof of conformance.[10]

## Priority 1: trust, privacy, and release operations

| Missing capability | Current limitation | Needed product behavior |
|---|---|---|
| Optional cloud sync/account | Browser storage is origin-scoped; migration is now supported, but the user remains responsible for moving data and there is no synchronized cloud mirror. | Offer optional account-backed encrypted sync only when demand justifies it. Keep local-only mode explicit. Add conflict handling, device list, deletion, export, and recovery codes. |
| Data lifecycle controls | Export/restore exists, but a complete account/data lifecycle is not established. | Add “export all,” “delete all local data,” project-level delete confirmation, restore preview, schema migration history, and privacy documentation. |
| Observability | Source audit found no durable crash, performance, install, export, or conversion telemetry. | Add privacy-respecting error reporting and operational health checks with opt-out/consent decisions. Do not collect project content by default. |
| Release gates | The current public blank state demonstrates that a passing local build is not sufficient. | Add deployment smoke tests, asset/commit identity, automated route checks, API health checks, production environment verification, and rollback instructions. |
| Security policy surface | The current MCP API key boundary is a safe MVP, but not a multi-user identity system. | Publish privacy, retention, security contact, AI data-handling, and incident-response information before broad public distribution. |

## Priority 2: AI and MCP gaps

The current MCP surface is intentionally narrow: `project.intake`, `project.validate`, `grading.run`, `grading.explain`, and an approval-gated `export.pattern_pdf`. It requires the caller to supply a snapshot and states that the server does not save, publish, share, or change a project. That is a sound safety boundary for an MVP.

What it lacks is the infrastructure required for public, multi-user AI use:

| Gap | Why it matters |
|---|---|
| OAuth 2.1/PKCE and user identity | A shared API key cannot provide per-user identity, revocation, scopes, or user-specific audit history. MCP authorization guidance recommends standard authorization flows when a remote server handles user data or needs auditability.[11] |
| Per-tool scopes | Read project metadata, run grading, create artifacts, and propose changes should not all have the same permission. |
| Durable task lifecycle | Large Project Book, batch grading, and artifact jobs need progress, cancellation, retry, and per-item failure reporting rather than one unbounded request. |
| Native in-app conversation surface | The current in-app assistant prepares a local grading brief; it is not a complete conversational workspace with visible tool calls, approvals, and downloadable artifacts. |
| Broader safe artifact tools | The next useful read-only/approval-gated tools are Project PDF, Project Book, pattern draft, Brag Card, receipt, grading CSV, quality report, revision comparison, and batch grading. |
| Human-confirmed write proposals | If future AI writes are added, it needs a structured diff, deterministic revalidation, conflict check, explicit approval, and undo—not direct mutation. |
| AI audit and provenance | Every AI response should state which project revision, calculator version, standards source, and assumptions it used. MCP guidance emphasizes human denial ability, visible tool exposure, confirmations, and structured schemas.[12] |

Do not add an unrestricted “operate every tab,” `run_code`, storage enumeration, autonomous publisher, payment executor, or silent project writer. Those would increase liability faster than user value. The product’s most defensible AI position is: **Stitch & Scale calculates from the user’s data; AI helps interpret and prepare; the user approves what is shared, changed, exported, or published.**

## Accessibility, localization, and onboarding gaps

The product has made credible baseline improvements, but publication readiness requires evidence rather than intent. The remaining work is a continuous matrix covering keyboard-only operation, screen-reader names and relationships, focus return in dialogs, table headers, status announcements, form errors, contrast, text resizing, 200% zoom, reflow, reduced motion, coarse-pointer targets, and exported-document readability. WCAG 2.2 is the appropriate benchmark, not a one-time automated scan.[10]

Five locales are a good foundation, but generated artifacts and user-entered content require separate review. Locale-aware number, unit, date, currency, paper-size, and filename behavior should be explicit. Onboarding should remain short, but it should truthfully explain the product’s distinction between planning/calculation support and final human-reviewed publication. It should not imply that grading alone proves fit or that a PDF report is automatically a customer-ready pattern.

The 78-tab breadth also creates a discoverability gap. New users need progressive disclosure, a recommended first-project path, recent/favorite tools, global search or command access, contextual “next best step,” and a way to hide advanced commercial labs. Adding more navigation without reducing cognitive load would worsen the problem.

## What the product should deliberately not become

The product should not try to become a full accounting, tax, legal, inventory, payment, marketplace, or social network platform merely because it contains commercial planners. Those areas can remain carefully labeled decision-support surfaces or connect to specialist systems later.

It should not become an unrestricted autonomous agent. The MCP security guidance calls for least privilege, consent, exact redirect validation, state/CSRF protection, audience validation, and resistance to confused-deputy and token-passthrough risks.[12] The same principle applies inside the product: no silent publishing, no unreviewed price changes, no automatic outreach, no financial transactions, and no AI inference of missing body measurements.

If young users are a target audience, the product also should not introduce an always-on anthropomorphic companion, persistent youth profiling, hidden prompt retention, or engagement mechanics aimed at children without a dedicated privacy and age-appropriate-design program. A local, transparent, approval-gated assistant is safer than a background conversational character.

## Recommended order of execution

| Order | Work package | Outcome |
|---|---|---|
| 0 | **Release rescue** | Align the live deployment with the tested commit; add canonical-host checks, production smoke tests, rollback proof, and a visible app-shell health state. |
| 1 | **Trust foundation** | Add explicit data lifecycle controls, export/restore preview, backup status, revision snapshots, privacy/security documentation, and optional observability. |
| 2 | **Pattern production core** | Build the shared pattern model, visual chart editor, compiled written instructions, glossary, schematics, consistency linting, and publication readiness gates. |
| 3 | **Review operations** | Add issue tracking, technical-editor handoff, tester assignments, evidence attachments, comments, approvals, and revision comparison. |
| 4 | **Artifact and batch layer** | Add publication packages, export history, ZIP manifests, Project Book jobs, batch validation/grading, progress, cancellation, and per-project failure reports. |
| 5 | **AI/MCP public hardening** | Add OAuth/PKCE, scoped tools, audit events, task lifecycle, native in-app conversation, and approval-gated artifact/write proposals. |
| 6 | **Optional ecosystem integrations** | Consider commerce, marketplace, accounting, or cloud integrations only after actual user demand and a clear data/identity model. |

## Bottom line

Stitch & Scale Pro currently lacks **four things that matter more than another fifty features**: a reliable live release, a true pattern-authoring and compilation core, a reviewable multi-person lifecycle, and durable trust/continuity beyond one browser origin. Its calculator and commercial breadth is already a differentiator. The next perfecting move is to connect that breadth into a controlled path from **idea → draft → grade → test → edit → approve → compile → publish → revise**, while keeping local-first privacy and human approval as first-class product principles.

Until the blank public deployment is corrected and the pattern-production claims are narrowed or fulfilled, the honest status is **strong product foundation, broad beta workbench, not yet publication-grade end-to-end pattern platform**.

## References

[1]: https://stitch-and-scale-pro-api-server.vercel.app/ "Stitch & Scale Pro public deployment"

[2]: https://github.com/plastic-dude/stitch-and-scale-pro/blob/coder/perfection-foundation-2026-08-21/docs/capability-and-deployment-audit.md "Stitch & Scale Pro capability and deployment audit"

[3]: https://stitchmastery.com/ "Stitchmastery official product site"

[4]: https://knitbird.com/ "KnitBird official product site"

[5]: https://www.stitchfiddle.com/en/premium/pricing "Stitch Fiddle Premium feature page"

[6]: https://www.envisioknit.com/features/ "EnvisioKnit official features page"

[7]: https://www.sistermountain.com/blog/tech-editing-beginners-guide "Sister Mountain technical-editing guide"

[8]: https://knitjulep.com/knitting-technical-editing-services/ "Knit Julep technical-editing deliverables"

[9]: https://www.craftyarncouncil.com/standards/body-sizing "Craft Yarn Council body-sizing standards"

[10]: https://www.w3.org/TR/WCAG22/ "W3C Web Content Accessibility Guidelines 2.2"

[11]: https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/authorization "MCP authorization guidance"

[12]: https://modelcontextprotocol.io/specification/2026-07-28/server/tools "MCP tools specification and human-in-the-loop guidance"
