# Verification Report: CHK-210
## Brag Card Local-Logo Export Boundary

### Overview

This cycle closed a trust and reliability gap in Brag Card branding. The Settings upload path already stores compressed local image data, and the MCP artifact path already rejected remote logos, but the shared SVG composer and browser preview still accepted `https://` logo URLs. A remote image could therefore make the browser canvas export depend on network access or become tainted, while contradicting the product's local-first promise.

### Structural change

The shared `isLocalBragCardLogo` predicate now accepts only a non-empty `data:image/` URI at or below the existing 200,000-character bound. The SVG composer, browser preview, client PNG path, and MCP Brag Card artifact path all use that same predicate. Remote URLs and oversized data URIs are omitted rather than fetched, embedded, or represented as successful branding. Existing local data-URI branding remains supported.

This is intentionally fail-closed and reversible: it changes only logo acceptance at the shared branding seam, does not alter project data, and does not introduce a new network request.

### Automated gates

| Gate | Result |
|---|---:|
| Focused Brag Card and MCP artifact tests | 19 passed / 19 |
| Application TypeScript | Passed |
| Full Vitest suite | Passed |
| Production build | Passed in 5.70s |
| Root/workspace TypeScript | Passed |
| Git diff check | Passed |
| Protected invention brief hash | Preserved as `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce` |

The production build continues to emit six known non-fatal Vite sourcemap-location warnings in unrelated UI dependencies; this cycle does not claim a warning-free build.

### Fresh public and mobile evidence

The public production alias `https://stitch-and-scale-pro-api-server.vercel.app` currently returned HTTP 200 for `/`, `/project/sample-crew-neck-sweater`, and `/project/sample-crew-neck-sweater/pdf`. Vercel reports promoted production deployment `dpl_3pJVjTLHXHuZG8zmjsreeuMC5MAS` with exact Git SHA `65d21d095843a83d856dc5b76d2b41670f0d8c63`, matching this verified commit. The fresh multi-width smoke completed successfully at 320, 360, 390, and 430 pixels and covered onboarding, dashboard, new project, sample workspace, export preflight, Grading Lab, and Design Ledger. No horizontal-overflow failure was reported.

The public MCP smoke remained healthy: GET returned the expected 405 JSON-RPC response, allowed-origin OPTIONS returned 204, authenticated `tools/list` returned 200 with the canonical eight-tool order, and a forbidden origin returned 403 with error `-32001`.

### Residual limitations

The current mobile smoke does not fully exercise Brag Card rendering and PNG download on every target width; that remains a follow-up evidence gap. Native browser print dialogs still prevent automated binary PDF capture in this environment.

**Verdict: VERIFIED AND PROMOTED; FOLLOW-UP UI EVIDENCE REMAINS**
