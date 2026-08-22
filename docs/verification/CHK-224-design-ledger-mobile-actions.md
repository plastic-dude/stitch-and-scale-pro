# CHK-224 — Design Ledger mobile production-control actions

**Date:** 2026-08-22
**Author:** Manus AI
**Scope:** One narrow, reversible mobile accessibility correction for Design Ledger production-control actions. This checkpoint does not alter ledger schemas, persistence semantics, CSV generation, summary copy behavior, MCP tools, or browser-handoff truth claims.

## Decision and product boundary

A fresh WIDE RESEARCH audit identified a remaining mobile interaction barrier in the Design Ledger, a core production-control surface. Several user-facing controls inherited the shared small-button defaults or bare button sizing. The affected controls were the add-design action, record-cost action, CSV export, copy-summary action, design and expense removal affordances, and save-notes action. The shared small-button defaults are below the 44px mobile target, so these actions could require more precise tapping than the rest of the application.

This was selected over new feature work because it directly reduces friction in the designer’s operating ledger and is reversible without changing stored data, export formats, calculations, sharing permissions, or MCP behavior.

## Implemented correction

`artifacts/stitch-and-scale/src/components/design-ledger-card.tsx` now applies explicit minimum hit-area classes to the affected controls:

- Add Design and Record Cost: `min-h-11`.
- Download CSV and Copy Summary: `min-h-11`.
- Remove expense and Remove design: `min-h-11 min-w-11`.
- Save Notes: `min-h-11`.

The handlers, validation, local-first persistence, CSV object-URL lifecycle, clipboard fallback, localized copy, and calculation logic were not changed. The CSV action remains a browser handoff: the application can request a download but cannot observe whether the browser completed or saved it. The copy-summary action likewise remains a browser clipboard request with its existing observable-boundary wording.

`artifacts/stitch-and-scale/src/lib/residual-touch-targets.test.ts` now protects the Design Ledger action classes with a structural regression, alongside the existing workspace, Brag Card, shared Sheet, lab-card, and project-PDF touch-target guards.

## Verification evidence

| Check | Result |
|---|---|
| Focused regression | Passed: 3 files / 9 tests, covering residual touch targets, Design Ledger export contract, and Design Ledger copy |
| Full Vitest gate | Passed: **220 files / 2,560 tests** |
| Application TypeScript check | Passed |
| Root TypeScript check | Passed |
| Production build | Passed in **5.08 seconds**; entry bundle 324.92 kB / 101.85 kB gzip and i18n bundle 208.61 kB / 58.57 kB gzip |
| `git diff --check` | Passed before commit and in the sequential gate runner |
| Source-bundle verifier | Passed; expected archive SHA-256 `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`; 15 files present and fingerprinted |
| Protected invention brief | Unchanged; SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |
| Asset state | `app-logo.webp` remains 416,824 bytes; `logo.png` and `app-icon.png` remain 2,307,550 bytes each; no asset was changed in this checkpoint |
| Known diagnostics | Vitest continues to log non-browser `indexedDB is not defined` persistence diagnostics while passing. The build continues to emit six known sourcemap-location warnings in `tooltip.tsx`, `label.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `select.tsx`, and `progress.tsx`. |

## Live route, mobile, MCP, and release integrity

The fresh active-alias audit returned HTTP 200 for `/`, `/settings`, `/portfolio`, `/project/mss5osqd88j6fdyvtdu`, `/project/mss5osqd88j6fdyvtdu/pdf`, `/app-logo.webp`, and `/favicon-192.png`. The active alias served `/app-logo.webp` as `image/webp`, confirming that the earlier branding payload correction remains live.

The active-origin MCP preflight returned HTTP 204 with `access-control-allow-origin: https://stitch-and-scale-pro-api-server.vercel.app`, allowed methods `POST, OPTIONS`, and allowed headers `Authorization, Content-Type, MCP-Protocol-Version`. A forbidden alternate origin returned HTTP 403 with JSON-RPC error `-32001` (`This MCP origin is not allowed.`). This UI-only correction changed no MCP code or trust-boundary behavior.

A matching Vercel deployment for the exact Design Ledger commit was observed as READY but with `target: null`: deployment `dpl_31NbdXu39oV5knz3YbPVfTjZ7j5Z`, commit `a984e9a80d76782b1b7d9677d7b28d825866bc92`. It has no production alias. The active production release remains the preceding READY production deployment `dpl_9dVymTG8vvr3k29EQ5PvyVM4WHvL` at Brag Card code commit `1cd5321fad1363d6c782e39202cd7633d1f2c3d9`. No manual deployment, promotion, or alias mutation was performed, and the active public application cannot yet be credited with the Design Ledger correction.

## Repository and operating-state integrity

The application commit is `a984e9a80d76782b1b7d9677d7b28d825866bc92` (`fix: protect design ledger mobile actions`). It was pushed to `coder/perfection-audit-2026-08-22` first, then to `main` only after a fresh fetch proved `origin/main` was exactly its parent `e3f250fd244d8445ffbda99d08df452922228cd9`. Public remote refs and the local worktree were finally verified at `a984e9a`; no uncommitted changes remain.

The existing operating schedule was inspected and left unchanged: one active max-mode task, 30-minute interval, `runAsNewTask=false`, timezone `Africa/Lagos`. Connector configuration was not modified. Public GitHub backlog inspection remains separate from implementation; no open proposal was adopted or merged, and `QUEUE-067` remains queued and research-only pending its separate brief and two-pass approval.

## Residual risks and release posture

This checkpoint proves a focused source-level 44px correction for Design Ledger controls and a successful matching READY preview build. It does not prove that the active production alias serves this new code, that a browser completed a CSV download or clipboard write, or that any browser-mediated export reached durable storage.

Residual risks remain explicit: the prescribed screenshot-heavy mobile harness has previously timed out before assertions in this constrained environment; the new Design Ledger control geometry still merits a dedicated route-level live smoke after production deployment; larger public branding assets remain; entry and i18n chunks remain large; browser-mediated export, print, share, clipboard, and save outcomes remain outside application observability; six sourcemap warnings and non-browser IndexedDB diagnostics remain; and future custom-domain/MCP-origin migration requires fresh verification.

**Overall publication readiness is not claimed.** CHK-224 reduces mobile interaction friction in a core local-first production-control workflow while preserving existing truthfulness, reversibility, and release-attribution discipline. The active alias must not be described as containing this correction until a matching READY production deployment is observed and re-verified.

## Commit

`a984e9a80d76782b1b7d9677d7b28d825866bc92` — `fix: protect design ledger mobile actions`

The checkpoint document is intentionally recorded separately so its evidence cannot be confused with the application-code release identity.
