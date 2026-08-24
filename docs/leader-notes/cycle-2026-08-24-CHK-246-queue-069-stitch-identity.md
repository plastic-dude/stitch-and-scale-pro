# CHK-246 — QUEUE-069 local StitchIdentityV1 derivation

**Date:** 2026-08-24
**Topic:** Local, honest maker-identity foundation
**Implementation boundary:** QUEUE-069 only
**Audit branch:** `coderii/queue-069-stitch-identity-20260824`
**Implementation commit:** `434e8ecd90a49175155a6ef7a9979e0fe97da3cc`
**Promoted parent before implementation:** `4d3972ffecb6e4a3ad2a3a2fbc303816175e2752`
**Protected brief hash:** `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`

## Scope delivered

QUEUE-069 is implemented as a pure, local-only TypeScript seam in `artifacts/stitch-and-scale/src/lib/stitch-identity.ts`, with focused coverage in `src/lib/stitch-identity.test.ts`. It derives a versioned `StitchIdentityV1` snapshot from explicit caller-supplied project, recognition, maker-profile, and optional export-time inputs.

The implementation includes the approved `schema`, `trust`, `maker`, `profile`, `bragables`, `score`, and `provenance` sections. The trust status is machine-readable and human-readable as exactly `self-reported`; the output states that it is computed from editable records on this device and is not independently verified. The score remains `null` pending explicit product review of the public formula, rather than silently turning the research proposal into a product claim.

Project input requires an explicit source envelope. `manual` and `user-edited` records may contribute; `sample`, `demo`, and `import` records are excluded; unknown or malformed records fail closed and mark the snapshot `partial`. Recognition is read only from the existing versioned project-scoped `first-clean-grade` record. Project identity is deduplicated, recognition is limited to projects in the explicit snapshot, standards and yarn weights are deterministically normalized, earliest activity is labeled `earliestLocalProjectAt`, and clean-grade months are distinct calendar months rather than streaks.

The implementation deliberately does not read browser storage, perform I/O, send data, add a storage key, add UI, add automatic export, add a Brag Card flow, add an MCP tool, add a server endpoint, add accounts, add community/social features, add cryptography, or add new recognition event kinds. Calculator opens, repeated edits, export clicks, business-lab outputs, social metrics, and publication fingerprints are not signals.

## Verification evidence

| Gate | Result |
|---|---|
| Focused identity suite | 6 tests passed |
| Full app Vitest | 227 files / 2,622 tests passed |
| App TypeScript | Passed |
| Root TypeScript | Passed |
| Deterministic root production build | Passed; existing bundle-size and source-map notices remain non-blocking diagnostics |
| Prettier on new files | Passed |
| `git diff --check` | Passed |
| Source-bundle context verifier | Passed; 15 raw owner-bundle files fingerprinted |
| Protected invention brief | Required SHA preserved |
| Secret scan of staged TypeScript diff | No credential markers found |

## Release-integrity evidence

The implementation was committed on a fresh audit branch from the freshly verified `origin/main` parent, pushed first, and promoted through the guarded fast-forward helper. The promoted application commit is `434e8ecd90a49175155a6ef7a9979e0fe97da3cc`.

Vercel production deployment `dpl_ADXam2QhXuAT9gQwm1pCWTvoq8r9` matched the promoted SHA and reached `READY`. The deployment was assigned the project production aliases, including `stitch-and-scale-pro-api-server.vercel.app`; the production environment-name inventory remained unchanged and no credential was rotated or disclosed.

A fresh no-cache smoke against the public alias returned the following:

| Surface | Result |
|---|---|
| Root route | HTTP 200; `age: 0`; `x-vercel-cache: MISS` |
| Approved MCP preflight | HTTP 204; exact allowed origin; `Vary: Origin` |
| Forbidden MCP preflight | HTTP 403; no `Access-Control-Allow-Origin` |
| Missing-auth MCP POST | HTTP 401 with JSON-RPC error `-32003` |
| OAuth authorization-server discovery | HTTP 200 but `text/html` SPA fallback; intentionally still unshipped and not represented as valid OAuth metadata |

## Honest residual boundary

This is a data-contract foundation, not a finished identity feature. No user-facing identity review surface or portable JSON export was added because CHK-245 explicitly authorized only normalization and deterministic derivation as the first implementation. A later queue item may add a reviewed local export and optional presentation artifact only after this shape is reviewed in product context.

The score formula and tier mapping remain research proposals, not active product semantics. The output is not a credential, badge, verification, certification, proof of authorship, proof of skill, or independent assessment. Local project references are provenance pointers only. Export/Restore remains the app-data recovery path; any future identity export must not be described as backup or synchronization.

`QUEUE-067` social/media work remains research-blocked and was not widened into this change. The MCP/OAuth integration remains blocked until durable authorization state, single-use/revocable authorization handling, and a separate signing secret are explicitly provisioned and approved. No connectors or schedules were changed.

## Queue consequence

`QUEUE-069` is complete for its authorized first boundary. The next firing must begin with a fresh wide audit and re-read the queue before selecting work. The likely next queue-safe step is a separate review of the local identity schema and, only if still approved, a narrowly scoped local review/export touchpoint; no automatic export or MCP implementation is implied by this evidence note.
