# CHK-244 — QUEUE-068 persistent local-storage protection

**Status:** Implemented, verified, promoted, and live on the production alias.

**Date:** 2026-08-24

**Audited parent:** `640a5bb515ec550ba6e23d2306dbac4054b15a84`

**Implementation commit:** `13a3554a4b6f860e8015b3d883fccfd7e20098db`

**Scope:** The single implementation boundary opened by CHK-243: optional browser persistent-storage protection after a meaningful manual project save. No Notification API, push, background sync, cloud sync, accounts, analytics, geolocation, camera, microphone, grading semantic change, export semantic change, connector change, or schedule change was included.

## Decision and research

CHK-243 approved persistent local-storage protection as the only current implementation candidate because it supports the app’s local-first ownership promise without a server. The fresh official-source receipt is `/tmp/storage-persistence-research-20260824.md` and records the following constraints:

1. `navigator.storage.persisted()` reports whether the site’s storage bucket is already persistent.
2. `navigator.storage.persist()` is a request, not a guarantee. Its Promise resolves to `true` when accepted and `false` when not accepted; browser-specific policy controls the result, and the API can reject or be unavailable.
3. The APIs require a suitable secure context and may fail when storage cannot be obtained.
4. Persistent storage reduces automatic browser eviction under storage pressure where supported; it is not backup, sync, encryption, protection from device loss, or protection from explicit user clearing or every browser policy.
5. Export/Restore remains the user-controlled backup path.

The implementation therefore keeps browser calls behind an explicit user button. It does not request storage protection during render, startup, route entry, onboarding, settings visits, imports, automatic demo/sample creation, timers, or generic persistence effects.

## Implementation summary

The new `storage-protection.ts` seam is browser-safe and SSR-safe. It feature-detects the StorageManager methods and returns explicit `protected`, `not-requested`, `declined`, `unavailable`, and `error` outcomes. Local decisions use the versioned `stitch-and-scale-storage-protection-v1` key. A dismissal is remembered for a bounded 30-day cooldown; protected, declined, unavailable, and error outcomes are preserved as factual results.

`ProjectsContext` now exposes a minimal post-save signal. The signal is armed only by the explicit new-project wizard’s `createProject(..., 'manual')` path, only for a meaningful project record, and only after the normal asynchronous local save resolves successfully. Onboarding samples are labeled `sample`, CSV imports are labeled `import`, and automatic demo seeding remains unarmed. No browser permission API is called by the provider.

`StorageProtectionBanner` is a single non-modal, localized, accessible surface mounted in the shared shell. It offers an explicit “Protect local data” action, “Not now,” and a close action. Render and route entry are inert. Closing a completed result cannot overwrite the browser outcome with a dismissal. The copy is complete across `en`, `de`, `fr`, `es`, and `pt`, and consistently distinguishes eviction protection from backup.

## Verification evidence

| Gate | Result |
|---|---|
| Focused storage seam, banner, provider, and localization tests | Passed: 14 tests across 3 files |
| Full app Vitest | Passed: 226 files, 2,617 tests |
| App TypeScript | Passed |
| Root TypeScript | Passed as part of root build |
| Root deterministic production build | Passed; mockup build-only values and workspace concurrency guard remained intact |
| `git diff --check` | Passed |
| Source-bundle verifier | Passed: archive fingerprint verified and 15 raw files present; the required reading receipt already exists in the source-bundle directory |
| Protected invention brief | Unchanged; SHA-256 remained `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Fresh ancestry guard | Passed; audit branch started from exact `origin/main` `640a5bb...` and promotion was fast-forward-only |

The full local build continues to emit the repository’s known non-fatal sourcemap-location warnings for existing UI primitives and a known dynamic/static import warning; no new build failure was introduced.

## Promotion and production proof

The fresh audit branch `coderii/queue-068-storage-protection-20260824` was pushed before promotion. The guarded fast-forward promotion advanced `main` to `13a3554a4b6f860e8015b3d883fccfd7e20098db`.

Vercel created the exact-SHA production deployment `dpl_CSaigJGGHNzkXDrkheJ4gEfQjpxy`, which reached `READY` and received these aliases:

- `stitch-and-scale-pro-api-server.vercel.app`
- `stitch-and-scale-pro-api-server-git-main-plastic-dudes-projects.vercel.app`
- `stitch-and-scale-pro-api-server-plastic-dudes-projects.vercel.app`

Fresh public alias smoke checks passed:

| Surface | Result |
|---|---|
| `/` | HTTP 200 with `age: 0` and `x-vercel-cache: MISS` |
| `GET /api/mcp` | HTTP 405 with `Allow: POST, OPTIONS` and the expected JSON-RPC invalid-request response |
| Approved-origin MCP preflight | HTTP 204 with the exact approved origin and allowlisted methods/headers |
| Forbidden-origin MCP preflight | HTTP 403 with no `Access-Control-Allow-Origin` |
| MCP POST without authorization | HTTP 401 with JSON-RPC error `-32003` |

The production environment-name inventory remains limited to the existing MCP origin and bearer-key entries. No secret values were printed or changed in this firing.

## Honest boundary and next work

QUEUE-068 is complete as a narrow browser-capability improvement. It does not guarantee persistence, create a backup, or replace Export/Restore. It also does not implement notifications or push; CHK-243’s future-only asynchronous-operation boundary remains binding. OAuth discovery and durable OAuth authorization state remain blocked and intentionally unshipped until durable state and a separate signing secret are explicitly provisioned and authorized.

The next queue-safe work is Stitch Identity Pass 2 research in a separate firing. It must remain research-only until its data shape and legitimate score signals are documented and reviewed.

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist "MDN StorageManager.persist()"
[2]: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persisted "MDN StorageManager.persisted()"
[3]: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager "MDN StorageManager"
[4]: https://web.dev/articles/storage-for-the-web "web.dev Storage for the web"

The official-source research receipt is recorded in `/tmp/storage-persistence-research-20260824.md`; the repository’s bundle-reading receipt is `docs/source-bundle/stitch_scale_bundle-2026-08-22/bundle_read_receipt.md`.

— **Manus AI**
