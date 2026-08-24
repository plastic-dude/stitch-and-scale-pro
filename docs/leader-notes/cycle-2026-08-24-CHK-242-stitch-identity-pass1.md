# CHK-242 — Stitch Identity Pass 1

**Date:** 2026-08-24
**Topic:** Portable, honest maker identity / Stitch Score
**Pass:** 1 of 2 (research-only)
**Reviewed HEAD:** `0330349845c4b992aa91501a85389481561fae61`
**Branch:** `coderii/chk-240-evidence-20260824`
**Protected brief:** `docs/research/portable-maker-identity-stitch-score-2026-08-23.md`

## Scope and boundary

This is the first of two independent research passes required by the owner directive. No application code, data schema, storage key, score formula, export logic, or implementation ticket was opened. The second pass must occur in a later firing and must design the data shape, legitimate signals, and export-flow sketch before any implementation item is eligible.

## Live-HEAD current-state verification

The brief’s §5 audit remains accurate at the reviewed HEAD.

1. `recognition.ts` defines `RECOGNITION_SCHEMA_VERSION = 1`, a single `first-clean-grade` event kind, and `ProjectRecognitionStateV1`. `normalizeRecognitionState()` fails closed for malformed, unknown-version, malformed-event, and duplicate records. `observeFirstCleanGrade()` records only a clean ready result with a positive graded-size count and no flags, and suppresses repeats after source revisions.
2. The storage seam is project-scoped, not maker-scoped. The live regression test proves that `recognition` keys resolve separately for `project-1` and `project-2`. There is no cross-project maker aggregate or Stitch Score in the current recognition module. This is the actual future design gap; replacing or broadening the existing per-project milestone system would be scope drift.
3. The recognition source fingerprint is not an authenticity mechanism. `publicationSourceFingerprint()` is a deterministic `JSON.stringify()` of selected publication inputs. It is appropriate for source-change detection and post-approval invalidation, but it contains no secret or issuer proof and must not be reused as tamper evidence for a portable identity.
4. The existing export conventions are suitable foundations but serve different purposes. `grading.export_csv` accepts an explicitly supplied project snapshot, reuses the canonical grading CSV serializer, returns structured/tool-readable output, and is annotated read-only. `export.brag_card` accepts explicitly supplied local-ledger data and counts, produces a local SVG/social artifact, and states that the server does not invent, verify, save, publish, share, or email it. Neither tool provides independent identity verification, which is consistent with the product’s local-first boundary.
5. The Brag Card engine keeps designer-owned numbers attributable to the designer, renders locally, uses bounded local branding data, and does not make a network request. It is a valid precedent for a future brag-able identity artifact, but it must remain conceptually separate from profile-able facts and any aggregate score.

## §6.2 decision verification: plain self-reported export

The owner’s decision to use option 1 only—plain export explicitly labeled **self-reported**—is sound for this product’s current audience and constraints. It avoids introducing keys, cryptography, verifier infrastructure, account identity, server state, or a confusing technical ceremony for elderly and non-technical makers. It also avoids a more serious trust failure: presenting locally editable numbers as independently verified.

The honesty mechanism is the label and the surrounding contract, not the fingerprint. Any future identity export must make the trust status visible in the artifact and structured data, must not use words such as `verified`, `certified`, `issued`, or `authenticated`, and must explain that the receiving site or person cannot independently validate the facts from this file alone. A recipient can edit a local-first export before sharing it; the design must acknowledge that rather than implying tamper resistance.

### Sized recommendation

Keep the plain self-reported approach. It is **small-to-moderate implementation effort** once Pass 2 is complete: a versioned local schema, explicit trust-status metadata, deterministic fact derivation, and two local export presentations. It has **zero backend and zero key-management cost**, but it requires strict copy review and regression tests that prevent verified-sounding claims. The future community site, if ever built separately, may choose its own review or verification policy; this app must not claim one.

The eventual schema should preserve provenance that is useful without overstating it: source project identifiers or stable local references, observation/export timestamps, calculation/schema versions, and the exact self-reported status. It must not include a cryptographic signature, issuer key, server-verification claim, or a hidden trust score. Pass 2 must decide the final fields and signal rules; this note does not authorize implementation.

## Risks and residual questions for Pass 2

The primary design risk is score inflation through repeated or trivial activity. Pass 2 must distinguish durable profile-able facts, discrete brag-able moments, and the score itself; avoid streaks and raw repetition; prefer distinct clean-graded patterns and other evidence already available locally; and exclude advisory calculator usage or facts not present in the app. It must also specify how a future export remains legible when data is incomplete, migrated, or malformed.

## Evidence anchors

- `artifacts/stitch-and-scale/src/lib/recognition.ts`
- `artifacts/stitch-and-scale/src/lib/recognition.test.ts`
- `artifacts/stitch-and-scale/src/lib/publication-integrity.ts`
- `artifacts/stitch-and-scale/src/lib/brag-card.ts`
- `artifacts/stitch-and-scale/src/lib/mcp-contract.ts`
- `artifacts/stitch-and-scale/src/lib/mcp-server.ts`
- `docs/research/portable-maker-identity-stitch-score-2026-08-23.md`

**Result:** Pass 1 complete. Re-queue the brief for a separate later Pass 2. No application implementation is authorized yet.
