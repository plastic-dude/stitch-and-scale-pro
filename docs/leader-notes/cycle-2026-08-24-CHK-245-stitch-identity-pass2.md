# CHK-245 — Stitch Identity Pass 2

**Date:** 2026-08-24
**Topic:** Portable, honest maker identity / Stitch Score
**Pass:** 2 of 2 (research-only)
**Reviewed HEAD:** `8de2f455303ca49f2b58ef0db55e3a47ae59913d`
**Branch:** `coderii/queue-068-storage-protection-20260824`
**Protected brief:** `docs/research/portable-maker-identity-stitch-score-2026-08-23.md`

## Scope and boundary

This is the second independent research pass required by the owner directive. It designs a proposed `StitchIdentityV1` shape, defines legitimate score signals, and sketches a concrete export flow using the existing grading CSV and Brag Card conventions. **No application code, storage key, score UI, export logic, MCP tool, account, server, community feature, or cryptographic mechanism is added by this pass.** A separate, narrowly scoped implementation item may be opened only because both required research passes are now complete.

The existing local-first product boundary remains unchanged: Stitch & Scale stores and computes its records on the maker’s device. A future separate community site does not exist in this repository and is not part of this work.

## Independent external research

The following authoritative sources were reviewed directly during this pass:

- 1EdTech, [Open Badges Specification v3.0](https://www.imsglobal.org/spec/ob/v3p0), Final Release document version 1.4.5, issued 2026-06-29.
- 1EdTech, [Open Badges 3.0 Implementation Guide](https://www.imsglobal.org/spec/ob/v3p0/impl), document version 2.1, issued 2026-06-15.
- 1EdTech, [Open Badges technical overview](https://www.1edtech.org/standards/open-badges).
- W3C, [Verifiable Credentials Data Model v2.0](https://www.w3.org/TR/vc-data-model-2.0/), W3C Recommendation 2025-05-15.

Those standards are relevant as a trust-boundary comparison, not as an implementation target. Open Badges and W3C Verifiable Credentials distinguish achievement claims from the issuer, holder, verifier, and cryptographic proof that make a credential verifiable. The W3C text also cautions that verifiability does not itself establish the truth of claims; a verifier applies its own policies. Stitch & Scale currently has no issuer, proof, verifier, account, or server. Therefore a local export must not imitate a verified credential or use issuer-like wording. Its trust status must remain visibly and machine-readably **self-reported**.

The complete external research receipt is retained at `/tmp/stitch-identity-pass2-research-20260824.md` for the firing audit. The sources and conclusions are copied here so the repository evidence remains understandable without relying on a temporary file.

## Live code re-verification

The reviewed HEAD still provides the correct foundation and the same important limits documented in Pass 1:

1. `recognition.ts` has a versioned, fail-closed `ProjectRecognitionStateV1` with one current event kind, `first-clean-grade`. It records only a genuinely clean `ready` observation with a positive graded-size count and no flags, and stores the event in the project-scoped storage seam.
2. `publicationSourceFingerprint()` is deterministic change-detection material used for publication invalidation. It has no secret, issuer, signature, or independent authenticity value and must not be reused as tamper evidence.
3. There is still no maker-level aggregate. A future identity layer must aggregate normalized project-scoped records without replacing or broadening the existing recognition module.
4. The shipped MCP export contract remains explicit-input and read-only. `grading.export_csv`, `export.pattern_pdf`, `export.project_book_pdf`, and `export.brag_card` are annotated read-only. Artifact preparation is gated by explicit `userApproved === true`, returns bounded data, and states that the server does not save, publish, share, or email the result.
5. The local Brag Card engine computes from supplied ledger/count inputs and local branding. It is a useful presentation precedent, but it is not an identity verifier and must remain separate from profile facts and the score.
6. The current studio profile already stores maker-owned presentation fields (`designerName`, `studioName`, `website`, `socialHandle`, and `copyrightNotice`) locally. There is no authoritative “member since” date, so a future export must not invent one. The safe alternative is a clearly named `earliestLocalProjectAt` derived from local project records, with a limitation note.

## Proposed `StitchIdentityV1` shape

The following is a design sketch, not TypeScript to copy directly. It follows the existing versioned-schema convention while keeping profile-able facts, brag-able moments, the score, and provenance distinct.

```text
StitchIdentityV1 {
  schema: {
    kind: "stitch-identity",
    version: 1,
    calculationVersion: "stitch-score-v1"
  },
  trust: {
    status: "self-reported",
    computedFrom: "local-project-records",
    statement: "Computed from editable records on this device. Not independently verified."
  },
  maker: {
    designerName: string,
    studioName: string,
    website: string,
    socialHandle: string,
    copyrightNotice: string
  },
  profile: {
    projectCount: number,
    cleanGradedProjectCount: number,
    earliestLocalProjectAt: ISO timestamp | null,
    standardsUsed: SizingStandard[],
    yarnWeightsUsed: YarnWeight[],
    cleanGradeSizeCountTotal: number,
    cleanGradeSizeCountMaximum: number,
    cleanGradeMonthCount: number,
    completeness: "complete" | "partial"
  },
  bragables: [
    {
      kind: "first-clean-grade",
      projectRef: string,
      projectName: string,
      observedAt: ISO timestamp,
      gradedSizeCount: number,
      source: "local-recognition-record"
    }
  ],
  score: {
    value: number | null,
    maximum: 35,
    tier: "starting" | "building" | "steady" | "established" | "broad-practice" | null,
    formulaVersion: "stitch-score-v1",
    explanation: string
  },
  provenance: {
    exportedAt: ISO timestamp,
    sourceProjectRefs: string[],
    sourceRecordKinds: ["projects", "recognition"],
    limitations: string[]
  }
}
```

### Shape decisions

The `trust.status` value is intentionally the exact phrase `self-reported`; it is not a hidden flag. The statement must appear in human-readable exports as well as structured data. The export must not contain an issuer, credential, badge, signature, public key, proof, authentication claim, or “verified” status. It may explain that the recipient cannot independently validate the local facts from this file alone.

`maker` is copied from the local studio profile and remains optional in practice through empty strings. `profile` is a set of derived facts, not a claim about talent, business success, or personal worth. `earliestLocalProjectAt` is explicitly local activity evidence and must never be labeled membership tenure. `standardsUsed` and `yarnWeightsUsed` are deduplicated values actually present in project records, not inferred skill endorsements.

`bragables` contains discrete, explainable moments already supported by project-scoped recognition records. The first implementation should not invent more event kinds or treat an arbitrary export click as a milestone. Each item must identify the local project reference, observation date, and evidence source. A future UI may let a maker select which moments to present, but it must not automatically post or share them.

`provenance` records calculation and export timing plus source kinds and limitations. Local project IDs are references, not authenticity proofs. A source fingerprint may remain useful for existing publication invalidation, but it must not be included as a trust signal or described as tamper evidence.

## Legitimate signal rules

The score is secondary to the facts and must not be presented as a measure of knitting talent, pattern quality, popularity, revenue, or worth. The proposed formula is deliberately public, capped, and based only on distinct clean-grade evidence:

| Component | Rule | Maximum |
|---|---|---:|
| Distinct clean-graded projects | `min(cleanGradedProjectCount, 10) × 2`; one project contributes at most once because the current recognition record is first-clean-grade per project | 20 |
| Breadth observed in one clean grade | `min(cleanGradeSizeCountMaximum, 9)`; uses the largest actually recorded graded-size count and does not reward re-grading the same source | 9 |
| Distinct clean-grade months | `min(cleanGradeMonthCount, 6)`; counts distinct calendar months and is explicitly not a streak or consecutive-day counter | 6 |
| **Total** | Sum of the three capped components | **35** |

The score is `null` with a limitation rather than `0` when the input set is incomplete or malformed in a way that prevents a reliable aggregate. A genuine empty complete record may be represented as `0` with an explanation such as “No clean-grade evidence recorded yet.” This prevents missing storage from being misrepresented as lack of achievement.

A proposed tier mapping is: `0–4 starting`, `5–11 building`, `12–19 steady`, `20–27 established`, and `28–35 broad practice`. These are neutral descriptions of the record summary, not ranks or comparative labels. The score formula and tier names require a future product review before implementation; they are recorded here to make the research concrete and auditable, not to authorize a gamification expansion.

### Included signals

- A distinct project’s existing `first-clean-grade` event after the canonical clean-grade conditions pass.
- The recorded number of sizes in that clean-grade observation, capped and presented as observed grading breadth, not inclusive-sizing certification.
- Distinct calendar months represented by those clean-grade observations, never consecutive-day streaks.
- Maker-entered studio profile fields and directly stored project metadata as profile-able facts, clearly separated from the score.
- The project-specific recognition moments as brag-able facts, with source and timestamp.

### Explicitly excluded signals

- Raw project counts as a proxy for skill, repeated edits, repeated grading attempts, re-grades of the same project, or calculator/lab opens.
- Any of the advisory business-lab calculator results, sales, revenue, follower counts, likes, social reactions, leaderboards, or comparisons to other makers.
- A PDF, Project Book, CSV, or Brag Card button click as proof that an artifact left the workspace. Current browser download/share completion is not reliably observable, and a click is not an achievement.
- Onboarding samples, demo projects, imports unless a later owner decision explicitly classifies them as user-created, or malformed/unknown-version records.
- `publicationSourceFingerprint()` as authenticity, verification, or anti-tamper evidence.
- Any claim that the score is an issuer-backed credential, certification, assessment of quality, or independent verification.

## Concrete export-flow sketch

1. **Build locally.** A future local identity module reads the normalized project list, the per-project recognition states, and the local studio profile. It derives profile facts and score components deterministically, retaining `complete` versus `partial` input coverage.
2. **Show a review surface.** The maker sees the trust label, the factual explanation, the source project count, the score formula summary, and limitations before any download or share handoff. Empty or partial evidence is explained rather than silently treated as zero.
3. **Export structured data.** An explicit button creates a JSON `StitchIdentityV1` file with a user-chosen safe filename such as `stitch-identity-<maker-name>.json`. An optional CSV projection may reuse the existing `grading.export_csv` style of explicit input and structured output, but JSON remains the canonical portable format because it preserves separate profile, bragable, score, and provenance sections.
4. **Export a presentation artifact.** A future identity Brag Card can reuse the local Brag Card renderer and branding conventions. It must show `Self-reported`, include the calculation version/date, let the maker review the content, and keep the choice of fields/redaction explicit. It must never auto-post, publish, email, or imply verification.
5. **MCP later, not now.** If a future MCP tool is approved, it should follow the shipped contract: the caller supplies the project/recognition/profile snapshot explicitly; schemas normalize and bound it; the tool is read-only; identity artifact generation requires `userApproved: true`; and the response states that the server does not save, publish, share, email, or independently verify the local claims. The server cannot reach a user’s browser local storage and must not pretend that it can.
6. **Preserve recovery.** Export is a user-controlled portable copy, not a backup or synchronization service. Existing Export/Restore remains the recovery path for app data; identity export must not alter it.

## Smallest implementation boundary opened after Pass 2

Open a separate implementation item for **local `StitchIdentityV1` normalization and deterministic fact derivation only**, building on the existing recognition schema and local storage seam. The first implementation must not add a social profile, community UI, server endpoint, MCP tool, cryptography, automatic Brag Card export, or new recognition event kinds. It should add pure normalizer/deriver tests first, including malformed-state handling, distinct-project deduplication, month bucketing, partial-input semantics, explicit self-reported copy, and proof that calculator/export clicks do not become signals. A later item may add a reviewed local JSON export and an optional presentation artifact after the data contract has survived implementation testing.

## Result

Pass 2 is complete. Both research passes required by the owner directive now exist as separate evidence records (`CHK-242` and `CHK-245`). This note opens the smallest candidate implementation boundary only; it does not implement it. `QUEUE-067` social/media release remains a separate research-blocked track requiring its own brief and two passes. No connectors, schedules, OAuth code, secrets, or production runtime behavior were changed.
