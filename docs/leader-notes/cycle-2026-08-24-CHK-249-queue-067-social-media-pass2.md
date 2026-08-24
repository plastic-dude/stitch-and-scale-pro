# CHK-249 — QUEUE-067 Social/Media Pass 2

**Date:** 2026-08-24
**Boundary:** WIDE RESEARCH — research-only Pass 2; no application implementation
**Parent reviewed:** `56befa5eaa8d3c80c1486eb8816a1a7dd5fa451e`
**Decision:** Pass 2 complete. One separate, narrow local implementation boundary may open; posting, accounts, cloud sync, camera/upload, analytics, MCP writes, and platform-success claims remain out of scope.

## 1. Purpose and older-work check

This firing began with the required independent WIDE audit across repository ancestry, queue and skipped work, quality gates, product/export/accessibility/localization surfaces, and live trust boundaries. The queue was read before selecting work. QUEUE-068, QUEUE-069, QUEUE-066, and CHK-248 are complete. QUEUE-067 Pass 1 was already complete in CHK-247, so this firing performed the required separate Pass 2 rather than reopening completed research or implementing from Pass 1 prematurely.

The product goal remains a trustworthy, local-first production-control layer for independent knitwear designers. The question was not how to add a generic social dashboard. It was whether a maker can deliberately prepare a truthful, accessible, private-by-default release from already-reviewed local artifacts while retaining control of purpose, audience, redaction, and local withdrawal.

## 2. Evidence inputs

The authoritative research brief was re-read: `docs/research/portable-maker-social-release-2026-08-24.md`. CHK-247 Pass 1 was re-read to avoid duplicating its findings. The following primary documentation was reviewed and recorded in `/tmp/queue067-pass2-sources-20260824.md`:

| Source | Pass 2 implication |
|---|---|
| [MDN Clipboard.writeText](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) | Clipboard handoff is secure-context-only and can reject with `NotAllowedError`; a local state may change only after the promise resolves, with unsupported/denied fallback kept distinct. |
| [MDN Window.print](https://developer.mozilla.org/en-US/docs/Web/API/Window/print) | Opening the print dialog is not proof that a PDF was saved, printed, or shared; request/preparation language remains mandatory. |
| [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Future release review must be keyboard-complete, visibly focused, meaningfully named, mobile-safe, and not dependent on color or drag interaction. |
| [W3C non-text content guidance](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html) | Image alternatives must serve an equivalent purpose; an empty or automatically invented description is not an acceptable review state. |
| [NIST Privacy Framework](https://www.nist.gov/privacy-framework) | Purpose, audience, data minimization, redaction, local retention, and clear local removal/withdrawal are required risk controls. |
| [W3C DPV v2 Community Group Final Report](https://www.w3.org/community/reports/dpvcg/CG-FINAL-dpv-20240801/) | Vocabulary may inform future copy, but the Community Group report is not a reason to add a privacy ontology or server-side consent system. |

## 3. Current product audit

The existing local project model is useful but is not yet a release-draft model. `PatternProject.assets` contains local `ProjectAsset` records with `id`, `type`, `label`, `filename`, `mimeType`, `size`, `dataUrl`, `category`, optional `caption`, `isFinishedWork`, `isFeatured`, and `includeInPdf`. `ProjectsContext` exposes local add, update, and delete asset mutations. This is enough to select an existing local image deliberately, but it does not establish that the image is licensed, consented, reviewed for release, or suitable as finished work merely because it exists.

The current model has no separate fields for `userAltText`, release audience, release purpose, selected-field provenance, redactions, explicit review timestamp, withdrawn timestamp, or per-channel handoff result. An implementation that merely wraps the existing asset list would therefore be under-specified and could falsely imply accessibility review, consent, or external completion. Pass 2 rejects that shortcut.

Existing export precedents remain safe foundations rather than evidence of a future release composer:

| Surface | Truthful behavior observed | Reuse boundary |
|---|---|---|
| Brag Card | Derives local statistics from Receipt Lab/Design Ledger; copy, PNG download, native share, and clipboard are local/browser handoffs. The download click does not prove a saved file; native share does not prove platform publication. | May be selected as an explicit artifact reference; retain source facts, attribution, and request-only wording. |
| Project Book / Portfolio | Prepares print HTML and invokes browser print; it does not claim a saved PDF. | May be prepared as a print handoff; status must remain request/unknown unless a verifiable local result exists. |
| Pattern PDF | Uses preflight and browser handoff semantics; it must not turn a print dialog into a saved-file claim. | May be selected only after explicit preflight; no semantic grading or export changes are authorized here. |
| Receipt Lab | Quarantines incomplete receipt handoffs and keeps screenshot guidance separate from print/copy/share. | May be selected only when its own completeness contract passes; no sales-demand or public-success claim may be added. |
| Finished-work assets | Supports caption, featured view, and optional PDF inclusion in five locales. | A selected image still needs a separate user-reviewed alt-text and release-review state. |

## 4. Pass 2 workflow stress test

### 4.1 Artifact selection and source truth

A minimal release draft can safely select one or more already-produced local artifacts, but the preview must show the artifact kind, local reference or generated-at timestamp, and the factual source of each included field. No field may be silently copied from a broad project object if the maker did not select it. Brag Card numbers must remain sourced from local Receipt Lab/Design Ledger data. A receipt remains a receipt, not evidence of popularity. Stitch Identity facts, if later selected, remain plainly labelled `self-reported`.

A source that is unavailable, malformed, deleted, or no longer locally resolvable must fail closed into an omitted/needs-review state. The composer must not substitute a sample/demo artifact or invent a replacement claim.

### 4.2 No-photo and artifact-only paths

A photo is optional, not a release prerequisite. A maker must be able to prepare a Brag Card, Project Book, Pattern PDF, or receipt handoff without attaching a finished-work image. The empty-media state must say that no media is selected and must not imply that a photo is missing from a required checklist. If a photo is selected, the preview must show its local filename, MIME type, byte size, caption context, and review state before handoff.

The future implementation must not request camera permission, upload to a server, fetch remote media, infer ownership/licence, or silently include every project asset. Selection must be explicit and reversible.

### 4.3 Caption and alt-text review across five locales

The current asset `caption` is maker-facing context, not a sufficient accessibility alternative. Every selected non-text image needs a separate required review field whose purpose is equivalent text, not merely a filename or the phrase “finished work.” It should be authored or edited by the maker in the active locale and visibly marked as reviewed before handoff. The app may offer localized guidance, but it must not present generated claims as user-approved facts.

Copy coverage exists for the current asset controls in `en`, `de`, `fr`, `es`, and `pt`, and focused asset/export tests pass. That does not prove a future composer has translation parity. The implementation boundary must add a parity test for every new release-draft key and must make missing locale keys fail closed at build/test time.

### 4.4 Purpose, audience, redaction, and preview

Purpose and audience must be selected before handoff rather than inferred from the destination. The draft must show exactly what leaves the device: selected artifact names, selected images and sizes, caption, alt text, selected factual fields, provenance, and omitted/redacted fields. Redaction must be represented as an explicit omission decision, not as destructive mutation of the source project.

The preview must remain private-by-default and require an explicit review action. The maker must be able to go back, change the audience or purpose, remove an artifact/media item, and review the resulting payload before any browser handoff.

### 4.5 Prepared, handed-off, and unknown

The three states are useful only when channel semantics are explicit:

| State | Allowed meaning |
|---|---|
| `prepared` | A local draft and preview exist; nothing has been handed to another application. |
| `handed-off` | A supported browser handoff promise resolved, such as clipboard write or an accepted native share request. This does not mean an external platform published, saved, displayed, or accepted the content. |
| `unknown` | The browser or channel provides no verifiable result, the user cancelled, permission was denied, the dialog was closed, or the result cannot be distinguished. Download-anchor and print-dialog requests belong here unless a separate verifiable local result exists. |

A cancelled, denied, or unsupported handoff must never be recorded as success. A local delete/withdraw action can remove the draft and its local metadata, but it cannot retract a copy already handed to another application or platform; the UI must say that plainly. No server-backed revocation or consent claim may be added.

### 4.6 Keyboard, mobile, and unusual viewport semantics

The repository’s dedicated mobile smoke was run against a fresh isolated headless browser target and the production alias. It passed onboarding at 320/360/390/430px, dashboard, new-project validation, sample workspace, export preflight, Grading Lab QA, and Design Ledger. This is valuable evidence that the existing shell is not currently blocked at those widths, but it does not validate a composer that does not yet exist.

A future composer must be tested at those widths plus keyboard-only traversal, visible focus, logical heading/order, long localized labels, no-photo layout, long captions/alt text, safe-area padding, zoom, and deletion/withdrawal confirmation. The review surface must not rely on horizontal scrolling, drag gestures, or color alone.

## 5. Focused existing-contract verification

Fresh focused tests passed: 4 files and 28 tests covering `assets`, `brag-card-export-contract`, `brag-card`, and `clipboard`. They verify the current local media/export/clipboard contracts, not a new release composer. No application code was changed in this firing, so the full 227-file application suite, TypeScript, and deterministic root build were not rerun; that omission is intentional and must not be reported as a fresh code gate.

## 6. Decision and narrowly opened future boundary

**Pass 2 is complete and QUEUE-067 is no longer research-blocked.** However, this firing does not implement the composer. The safe next boundary is a separate implementation item:

> **QUEUE-070 — Local Release Draft V1: schema validation, local preview, explicit artifact/media selection, five-locale review fields, redaction preview, and truthful browser handoff state.**

QUEUE-070 must begin with a pure schema/normalization/validation seam and focused tests. It may persist drafts locally only after the shape and failure modes are proven. The first UI touchpoint should be a reviewable local preview and handoff control, not an automatic share integration. It must include a first-class no-photo path, separate user-reviewed alt text, purpose/audience, non-destructive redaction, local delete/withdrawal wording, and prepared/handed-off/unknown channel status.

Explicitly prohibited from QUEUE-070: automatic posting, platform API, account/OAuth, server sync, analytics, engagement counters, camera permission, background upload, remote asset fetching, public URL credentials, MCP write tools, or any claim that an external platform accepted, saved, published, or displayed the release.

## 7. Residual risks and honest readiness statement

This research pass does not make the product publication-ready by itself. The release system remains unimplemented. The known live residuals remain: OAuth discovery paths intentionally return SPA HTML until durable authorization state and a separate signing secret exist; custom-domain behavior is not yet freshly proven; browser save/print/cancel/share outcomes, below-320px and unusual safe-area/zoom, constrained-network large chunks, full export visual inspection, and lower-priority localization surfaces remain risks. The current MCP boundary remains direct-Bearer/read-only and must never expose its key.

The auditable result of this firing is therefore a completed research boundary and a bounded implementation ticket, not a social feature and not a zero-risk publication claim.

## 8. Integrity checks

- Fresh WIDE audit completed before selecting work; repository and queue were fetched first.
- Branch was created from exact `origin/main` `56befa5eaa8d3c80c1486eb8816a1a7dd5fa451e`.
- Protected invention brief SHA remained `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`.
- No connector or schedule configuration changed.
- No application code, export semantics, MCP contract, OAuth route, credential, or secret was changed.
- Evidence-only research result is reversible and secret-free.

## 9. Exact release verification

The evidence commit `c1a713ba3e312ff835c3700752ea842e140593d9` was pushed and guarded-promoted to `main` from the verified parent `56befa5eaa8d3c80c1486eb8816a1a7dd5fa451e`. Vercel production deployment `dpl_9RiLW4REnaShKZftZv8ork5WzDFQ` for that exact SHA reached `READY` and received alias assignment. The private deployment probe listed only the existing production environment names `MCP_ALLOWED_ORIGIN` and `MCP_API_KEY`; no environment values were read or recorded.

A final no-cache public smoke against `https://stitch-and-scale-pro-api-server.vercel.app` returned the following:

| Probe | Observed result |
|---|---|
| Root with unique query and no-cache headers | HTTP 200; `Age: 0`; `X-Vercel-Cache: MISS` |
| Approved-origin `OPTIONS /api/mcp` | HTTP 204; exact ACAO `https://stitch-and-scale-pro-api-server.vercel.app` |
| Forbidden-origin `OPTIONS /api/mcp` | HTTP 403; no ACAO; JSON-RPC `-32001` |
| Approved-origin unauthenticated `POST /api/mcp` | HTTP 401; JSON-RPC `-32003` |
| `GET /api/mcp` | HTTP 405; `Allow: POST, OPTIONS` |
| OAuth authorization-server discovery | HTTP 200 `text/html`; SPA fallback, intentionally not valid metadata |
| OAuth protected-resource discovery | HTTP 200 `text/html`; SPA fallback, intentionally not valid metadata |

The protected invention-brief SHA remained `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`. The source-bundle verifier remained green with the existing 15-file fingerprint. The final worktree was clean after promotion. This was an evidence/documentation release; no application TypeScript, full Vitest suite, or deterministic root build was newly run because no runtime file changed. No connector or schedule configuration changed.
