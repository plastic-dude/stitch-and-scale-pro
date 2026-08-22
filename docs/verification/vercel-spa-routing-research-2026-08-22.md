# Vercel SPA routing research — 2026-08-22

## Sources

- Official Vercel rewrites documentation: https://vercel.com/docs/routing/rewrites (last updated 2026-07-01; retrieved 2026-08-22).
- Official static `vercel.json` reference: https://vercel.com/docs/project-configuration/vercel-json (last updated 2026-06-17; retrieved 2026-08-22).
- Vercel repository discussion on SPA fallback excluding API endpoints: https://github.com/vercel/vercel/discussions/5448 (retrieved 2026-08-22).

## Relevant findings

Vercel rewrites route requests to another destination without changing the browser URL. The official examples support a named path parameter containing a negative lookahead, such as `/:path((?!uk/).*)`. The primary discussion records the established SPA pattern `/:path((?!api/.*).*)` / `/(.*)` and the requirement to exclude API paths when an application combines a static SPA with Vercel Functions.

The repository’s static Vite output contains one `index.html` shell and absolute `/assets/...` references; it does not emit route-specific HTML or a fallback script. Therefore direct application deep links depend on the host rewrite layer. The corrected repository route uses a named `:path(...)` parameter and excludes `api`, `assets`, `manifest.json`, `manifest.webmanifest`, `sw.js`, `favicon.ico`, and `robots.txt` before rewriting the remaining path to `/index.html`.

This evidence supports the config-level repair but does not prove production behavior until a target=production deployment containing the correction reaches READY and the public alias serves it. The first exact-main deployment attempt for commit `8eeeab6` on this date returned HTTP 402 `payment_required` with Vercel code `api-deployments-free-per-day`; the public alias therefore remains stale until quota permits a new production deployment.
