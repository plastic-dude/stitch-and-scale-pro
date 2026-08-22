# Audit F-14: SPA 404 Route Integrity

## Mandate
Audit F-14 (MINOR) from the brutal mobile audit identified a monitoring weakness:
> "Server returns SPA shell with HTTP 200 for nonexistent paths — Monitoring, indexing, and diagnostics become weaker. Add client not-found state and consider server fallback strategy."

## Implementation Strategy (CHK-176)
For a client-side routed application (SPA), the server *must* serve the `index.html` entry point for all non-asset paths to allow the client-side router (Wouter) to handle the route. This naturally results in an HTTP 200 status code for paths that the server does not "know" about.

### 1. Client-Side 404 State
We have pinned the client-side 404 behavior via `src/spa-404-route.test.ts`. The application handles unknown paths using a catch-all route in `App.tsx` that renders a localized `NotFound` component.

| Feature | Status | Evidence |
| :--- | :--- | :--- |
| **Catch-all Route** | Verified | `App.tsx` contains `<Route component={NotFound} />` |
| **Localization** | Verified | `i18n.ts` contains `route.notFound.*` keys in 5 locales |
| **Shell Integrity** | Verified | 404 state renders inside the `Shell` (header/nav/footer preserved) |
| **Onboarding Gate** | Verified | Onboarding overlay is suppressed on 404 routes (CHK-126) |

### 2. Server-Side Fallback
To mitigate the "200-for-missing-paths" issue, we have hardened `vercel.json` to exclude known assets and API paths from the SPA rewrite. Because this project sets `cleanUrls: true`, the SPA destination is `/` rather than `/index.html`; this is the clean-URL-safe form of serving the built entry point. This ensures that a missing asset (e.g., a missing image in `/assets/`) returns a true HTTP 404 from the Vercel edge rather than the SPA shell.

```json
{
  "rewrites": [
    { "source": "/manifest.webmanifest", "destination": "/manifest.webmanifest" },
    { "source": "/manifest.json", "destination": "/manifest.json" },
    { "source": "/sw.js", "destination": "/sw.js" },
    { "source": "/:path((?!api(?:/|$)|assets(?:/|$)|manifest\\.json|manifest\\.webmanifest|sw\\.js|favicon\\.ico|robots\\.txt).*)", "destination": "/" }
  ],
  "cleanUrls": true,
  "trailingSlash": false
}
```

## Regression Testing
The following tests pin this behavior:
- `src/spa-404-route.test.ts`: Verifies the routing contract and localization.
- `src/onboarding-gate.test.ts`: Verifies that the onboarding overlay does not block 404 routes.
- `src/deployment-security.test.ts`: Verifies `vercel.json` rewrite rules.

## Honest Limitation
True HTTP 404 status codes for dynamic application routes (e.g., `/nonexistent-page`) are not possible without Server-Side Rendering (SSR) or a specialized Edge Function that validates routes against a manifest. Given the local-first nature of Stitch & Scale, the current client-side 404 state is the professional standard for this architecture.
