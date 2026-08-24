# CHK-250 — QUEUE-070 Local Release Draft V1

**Date:** 2026-08-24
**Boundary:** WIDE RESEARCH followed by one narrow local-only implementation boundary
**Parent reviewed:** `81a94bdd45006da7e904a9e7fc7a969d944e98fc`
**Working branch:** `coderii/queue-070-release-draft-v1-053155`
**Decision:** Local code is verified and the implementation boundary is complete for review. Production release remains blocked by the known Vercel Free-tier deployment-capacity residual; this note does not claim a public deployment, main promotion, or publication readiness.

## 1. Older-work and product-goal check

This firing began with the required WIDE audit across repository ancestry, uncommitted scope, queue order, protected product documents, trust boundaries, quality gates, and the current local mobile path. `origin/main`, `HEAD`, and the branch merge base remained the exact parent `81a94bd`; no adjacent stale worktree was merged and no remote conflict was found. The protected invention brief remained unchanged. QUEUE-067 Pass 2, QUEUE-068, QUEUE-069, and CHK-248 remain complete; this firing stayed on the already-open QUEUE-070 boundary rather than starting an unrelated feature.

The product goal remains a **trustworthy local-first production-control layer for independent knitwear designers**. Release Draft V1 is a private preparation and review surface, not a social network or generic dashboard. A maker chooses what to prepare, sees what the local browser handoff payload contains, reviews accessibility text and omissions, and may withdraw or delete local draft metadata without the app claiming that another platform published, saved, displayed, or accepted anything.

## 2. Implemented boundary

The implementation is embedded in the existing Brag Cards workspace tab and does not add a route, account system, platform connector, or server write. It adds a typed, versioned `ReleaseDraft` model with fail-closed normalization and validation at the existing project persistence boundary. Malformed, external, or no-longer-resolvable references do not become available release material.

The local card now provides the following controls and semantics:

| Requirement | Verified implementation |
|---|---|
| Private-by-default draft | New drafts begin as local metadata with explicit purpose/audience controls; no network path is introduced. |
| Explicit artifact selection | The maker must explicitly include an artifact. A Brag Card is selectable only when its existing local Receipt Lab/Design Ledger source data is truthfully available; stale metadata is shown as unavailable/omitted rather than treated as ready. |
| No-photo path | A draft can be reviewed and prepared without selecting media. No camera permission, upload, remote fetch, or photo prerequisite exists. |
| Explicit fields and redaction | Project fields can be included or left on-device; redaction is non-destructive and is represented in the omitted preview and handoff payload. Selected/redacted conflicts fail closed. |
| Exact local preview | The card names the selected artifact/provenance, purpose, audience, selected fields, media filename/MIME/bytes and caption context when present, active-locale reviewed alt text when present, and omitted/redacted material. Only this filtered payload is eligible for clipboard handoff. |
| Five-locale review | `en`, `de`, `fr`, `es`, and `pt` copy parity is tested. A localized native review-language selector lets the maker switch active locale; review state remains distinct by locale and draft-level review must be renewed when the reviewed payload changes. |
| Media safety | Local image references are explicit and never duplicate or transmit data URLs. A redacted media item remains visibly selected while excluded from the handoff payload, preventing accidental reselection/reset. |
| Truthful browser handoff | Clipboard is a request-only local browser handoff. Denied, unsupported, or unresolved clipboard behavior remains a truthful unavailable/unknown result. A bounded timeout prevents a browser permission promise from leaving the card pending indefinitely. No platform delivery or save claim is made. |
| Local withdrawal and deletion | Withdrawal is a terminal local state that disables editing and handoff. Separate local deletion removes draft metadata only and explicitly says it cannot retract content already copied or handed to another application. |

The canonical existing project writer remains the only persistence seam. No release-draft-specific localStorage key or second store was added.

## 3. Focused contract verification

The pure contract and component source contracts passed in the final focused run:

| Suite | Result |
|---|---:|
| `src/lib/release-draft.test.ts` | 13 tests passed |
| `src/lib/release-draft-copy.test.ts` | 1 test passed |
| `src/components/release-draft-card.test.ts` | 7 tests passed |
| `src/lib/clipboard.test.ts` | 6 tests passed |
| **Total** | **4 files / 27 tests passed** |

Coverage includes no-photo preparation, truthful unavailable artifacts, selected-field inclusion/exclusion, field-redaction conflicts, local-media reference handling, active-locale alt-text review, five-locale copy parity, review gating, handoff state mapping, clipboard timeout fallback, withdrawal terminal semantics, explicit deletion contract, accessible control names, touch-target/source contracts, and absence of external write paths or credential-shaped strings.

## 4. Full quality gates

A fresh full application run passed **230 Vitest files / 2,645 tests**. The app TypeScript check passed. The deterministic root build passed after a first environmental SIGTERM was diagnosed as memory pressure from a stale task-created isolated Chromium profile; that profile was cleaned without touching unrelated services, and the subsequent root build completed successfully. The final Vite application build completed in approximately 5.31 seconds and the API bundle completed in approximately 160 ms.

Post-build hygiene also passed: `git diff --check`, `node scripts/verify-source-bundle-context.mjs`, the protected brief SHA check, strict changed-path scope, and the silent credential-shaped diff scan. The protected brief SHA remained:

> `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`

## 5. Targeted mobile and visual evidence

A disposable isolated CDP target was used on the local Vite app at its actual configured port `5000`; no user browser session or shared CDP port was reused. The final smoke passed at **320, 390, and 430 CSS pixels** with the following result at every width:

| Check | 320px | 390px | 430px |
|---|---:|---:|---:|
| No horizontal overflow | pass | pass | pass |
| No-photo draft creation | pass | pass | pass |
| Explicit artifact selection | pass | pass | pass |
| Field inclusion/redaction | pass | pass | pass |
| Active-locale switch | pass | pass | pass |
| Review gate | pass | pass | pass |
| Clipboard outcome observed | pass | pass | pass |
| Withdrawal terminal state | pass | pass | pass |
| Local deletion | pass | pass | pass |

The visual contact sheet is preserved at `/tmp/queue070-release-draft-contact-sheet-9254.png`, with findings recorded at `/tmp/queue070-release-draft-visual-findings-9254.txt`. The Release Draft card remains within the viewport at all three widths, stacks controls into a readable single-column flow, exposes the selected artifact and field controls, and presents the fixed bottom navigator without body/document overflow. The captured red browser-handoff toast is intentionally the immediate denied-clipboard outcome and truthfully states that no handoff was claimed; it is transient feedback, not an external-success claim.

The existing repository mobile smoke also passed its prior supported route matrix at 320/360/390/430px, including onboarding, dashboard, new-project validation, sample workspace, PDF preflight, Grading Lab, and Design Ledger. Those checks are supporting shell evidence; the targeted Release Draft smoke above is the direct evidence for this new surface.

## 6. Trust and scope exclusions

No automatic posting, platform API, account/OAuth flow, server/cloud synchronization, analytics, engagement metric, camera permission, upload, remote media fetch, MCP write behavior, public credential, or external completion claim was added. The existing MCP surface remains read-only/direct-Bearer and was not changed. OAuth discovery remains intentionally unshipped; it is not papered over as a valid authorization flow.

The browser handoff remains inherently limited by browser permission and user-agent behavior. Clipboard success, if available, means only that a local browser request resolved; it does not mean a social service or other destination accepted, saved, displayed, or published the material. Local deletion cannot retract content already copied or handed off.

## 7. Release residual and honest readiness statement

The QUEUE-070 code and local evidence are verified, but this branch is **release-blocked**, not production-ready. The known Vercel Free-tier deployment-capacity limit remains active: the prior exact-SHA deployment trigger returned sanitized HTTP 402 `payment_required`, stating that the resource is limited and to retry after 24 hours because of `api-deployments-free-per-day` (`more than 100`). The last exact production proof belongs to older code, not this QUEUE-070 branch. Therefore this firing does not claim that the public alias serves this implementation, does not fast-forward `main`, and does not claim a verified public release.

When capacity is available, the remaining release procedure is intentionally narrow: fresh parent check; push this verified branch; trigger the exact candidate SHA; await Vercel READY and alias assignment; then run no-cache root smoke plus the existing MCP exact-origin CORS/auth matrix and confirm the intentionally unshipped OAuth fallback. No quota-spam retries are justified while the blocker remains.

## 8. Integrity record

- WIDE audit completed before the final implementation and verification work.
- Current branch remains based on exact `origin/main`/`HEAD` parent `81a94bd`.
- Protected invention brief preserved with the required SHA.
- Only the 12 intended implementation/test files were changed before this evidence note and queue update; documentation adds only this note and the canonical queue ledger/status entry.
- No connector, schedule, OAuth, MCP write, or secret configuration changed.
- Local-only persistence uses the existing `ProjectsContext`/project writer.
- Evidence is reversible and does not expose credentials.
