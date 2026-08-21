# Stitch & Scale Pro: Capability and Deployment Audit

## Executive verdict

Stitch & Scale Pro is not a single calculator. It is a local-first design, grading, publishing, selling, teaching, and commercial-planning workbench for independent knitwear designers. The canonical workspace registry contains **78 user-facing tabs** across design, fit, pricing, launch, channel, and business groups. The repository also contains route-level pages, import/export seams, storage-health tooling, deterministic grading engines, localized copy, and branded deliverables.

The product is currently **Vite/React plus browser persistence**, deployed through Vercel. That does not make the product intrinsically Vercel-dependent. The browser application can be deployed to any static host, while the new `/api/mcp` route is the only Vercel-specific server seam at present. The MCP dispatcher and workflow libraries are pure TypeScript modules and can be moved later to another Node-compatible host with an adapter change.

The honest position is therefore: **custom-domain deployment on Vercel should work without architectural trouble, but the current MCP route needs production-domain configuration and stronger multi-origin/authentication handling before broad public distribution.** The existing app’s local-first data boundary remains intact; attaching a custom domain does not centralize user projects or make IndexedDB remotely readable.

There is one serious migration trap: browser storage is origin-scoped. IndexedDB and localStorage stored under `stitch-and-scale-pro-api-server.vercel.app` will not automatically be visible under `app.yourdomain.com`, and service-worker registration/cache scope changes with the origin.[13] [14] [15] [16] A custom-domain launch must therefore include an old-domain export prompt, a custom-domain import path, and a deliberate canonical-host plan. Do not tell existing users that DNS or a redirect will migrate their local projects automatically.

## The complete current capability surface

### Core product and project lifecycle

The app can create, name, edit, duplicate, delete, import, and locally persist structured pattern projects. A project carries metadata, gauge, base size, sections, measurements, description, yarn weight, timestamps, optional sizing-standard snapshots, notes, and related project state. The app supports demo-project seeding, local save status, storage-health inspection, dual-write recovery, JSON snapshot export, JSON snapshot import, and browser-local project continuity. This is a real local workspace, not merely a collection of stateless calculators.

The project workspace provides a single coherent tab registry. It renders the same registry for navigation and content, which prevents the previously audited hidden-panel and tab-reversion defect class. Onboarding, settings, studio profile, logo selection, language selection, mobile bottom navigation, keyboard focus, coarse-pointer targets, reduced-motion behavior, route recovery, clipboard fallbacks, and install-banner behavior form the surrounding product shell.

The exact registry is grouped as follows:

| Group | Workspace capabilities |
|---|---|
| Design & Pattern | Sections, Preview, Draft, Finish, Grading Lab, Chart Lab, Test Desk, Specification Sheet, Lookbook, Yarn, Notes, Yarn Licensing |
| Sizing & Fit | Test Knit, Technical Edit, Test Knit Lab, Submissions, Gauge Fit, Inclusive Sizing, Box Inclusion |
| Pricing & Income | Income, Pricing, Price Window, Pricing Psychology, International Pricing, Platform Mix, Repeat Revenue, Marketplace Take Rate, Ad Lab, Deal Math, Gift Card, Receipt Lab, Consignment Reprice, Pattern Bundle, Payback |
| Launch & Marketing | Launch, Sample Launch, Promotion, Listing SEO, Listing Test, Video & Social, Photo Lab, Release Timing, Preorder, Translation Bundle, Magazine Submission, Podcast Affiliate, Brag Card |
| Selling Channels | Publish, Channels, Wholesale, Wholesale Price List, Wholesale Book, Channel Migration, Subscription Distribution, Convention Booth, Trunk Show, Podcast Patterns |
| Business & Community | Deals, Collaboration, Partners, Protect, License It, Yarn Pool, Yarn Buying, Hire vs Self, Memberships, Pattern Club, Club Revenue, KAL ROI, KAL, Pipeline, Kits, Book It, Membership Site, Retreat Teaching, Workshop Teaching, Teach Economics, Show ROI, Design Ledger |

This map is the practical product inventory: some entries are planners, some are editors or previews, and some are export or commercial decision surfaces. They should not all be exposed as equal-power AI tools.

### Design and pattern development

| Capability family | Current functions |
|---|---|
| Pattern structure | Sections, preview, yarn details, notes, draft writing, finish guidance, specification sheet, chart planning, and pattern-quality/readiness checks |
| Gauge and fit | Gauge-fit translation, body schematic, measurement validation, inclusive sizing, gauge and ease interpretation, size grading, and test-knit preparation |
| Technical production | Technical editing, test-knit desk, test-knit programme, test-knit slots, submissions, sample launch planning, yarn estimation, yarn buying, yarn pool planning, and pattern-draft rendering |
| Pattern delivery | Pattern draft preview/editing, localized copy, print-oriented project PDF, grading table, grading CSV, and pattern-related project documentation |

These functions can turn a structured project into a more complete pattern-development record. They do not prove that a finished pattern is mathematically or physically perfect; they provide deterministic checks and planning aids whose assumptions must remain visible.

### Deterministic grading and validation

The grading engine calculates size rows from project measurements, gauge, and resolved standards. The grading lab adds readiness analysis, warnings, custom-standard compatibility, and localized explanations. Measurement validation protects physical values and rejects malformed or implausible input. The application’s numeric guard and model normalizers protect calculator boundaries from `NaN`, `Infinity`, negative values, over-100% rates, and implausibly unbounded economics.

This is the product’s most important trust surface. Any AI integration should call these existing functions and report their provenance. An AI model should never independently calculate stitch counts, row counts, grading increments, break-even values, or commercial totals.

### Pricing, income, and commercial planning

The pricing and commercial layer can model income, pattern pricing, price psychology, international pricing, price windows, platform mixes, retention, promotion effects, advertising break-even, payback, gift cards and credit, receipts, consignment repricing, pattern bundles, marketplace take-rates, wholesale economics, wholesale price lists, wholesale books, partner economics, collaboration deal math, channel migration, subscription distribution, preorders, memberships, and related scenario economics.

The product also includes hire-versus-self analysis, design-ledger information, credibility reporting, partner and pipeline planning, and multiple teaching, booking, retreat, workshop, KAL, and community-revenue planners. These are decision-support tools. They are not accounting, tax, legal, investment, or guaranteed business advice, and an AI surface must not present their scenarios as promises.

### Launch, marketing, and audience growth

The launch layer supports launch campaigns, sample launches, promotion planning, release timing, listing SEO, listing testing, translation and bundling, magazine submissions, podcast affiliate planning, video and social planning, photo ROI, show ROI, lookbooks, Brag Cards, publication toolkits, channel publishing preparation, and pattern-club or membership promotion. The copy system is localized across English, German, French, and Portuguese in addition to Spanish, with Spanish currently relevant to the live deployment context.

Brag Cards can use studio identity, wordmark, logo, social information, and copyright details. This makes them suitable for an AI-assisted preparation flow, but any public posting or sharing must remain a separate user-confirmed action.

### Sales, distribution, and channel operations

The product can plan and compare wholesale, direct, marketplace, print-on-demand, subscription, box-inclusion, partner, convention-booth, trunk-show, channel-migration, distribution, and publishing scenarios. It can model fee stacks, take-rates, conversion, demand, wholesale economics, channel fit, commercial risk, and operational workload. It can also produce wholesale-related books, price lists, and project-book material.

These surfaces are valuable for an AI analyst, but they are more sensitive than grading because their outputs can influence prices, commitments, and business decisions. A future assistant should show assumptions and scenario ranges and should avoid language such as “you should definitely” or “this will make a profit.”

### Exports and deliverables

| Deliverable | Current state | Safe conversational use |
|---|---|---|
| Grading table and grading CSV | Deterministic and locally exportable | Ask the assistant to validate, summarize, or prepare a download after showing the exact inputs |
| Project PDF | Existing browser print handoff in the PWA; MCP now has a real server-generated grading PDF artifact | Generate only after explicit approval of scope, locale, and filename |
| Project Book | Multi-project print renderer with cover, catalogue, ranking, and per-project detail, including studio branding | Prepare as a user-approved batch artifact with explicit project selection and progress reporting |
| Pattern draft | Structured renderer and editable draft card | Generate a draft for review; never silently overwrite the project |
| Brag Card | Branded preview and PNG/share path | Prepare locally or as an artifact; require confirmation before any sharing or posting |
| Receipt | Receipt lab and localized copy | Prepare an artifact, but do not treat it as tax/accounting authority or send it automatically |
| JSON snapshot | IDB-first canonical backup and restore seam | Export or restore only with clear user action and a local confirmation step |
| Project and grading briefs | Clipboard-safe, bounded text handoffs | Useful for external AI clients, but free-form project notes must be treated as untrusted input |

### PWA, mobile, accessibility, and resilience

The product can behave as an installable PWA, use mobile bottom navigation, persist offline-first project state in IndexedDB with localStorage fallback, recover from route-level render errors, expose keyboard focus, support coarse-pointer interaction, honor reduced-motion preferences, and provide truthful clipboard failure handling. These capabilities should remain available whether or not a user connects an AI client.

## What the product can support through AI or MCP

### Tier 1: safe and high-value now

The implemented MCP supports staged conversational intake, validation, deterministic grading, bounded explanation, and explicitly approved grading-PDF generation. An AI client can ask clarifying questions, refuse to invent missing measurements, call the grading engine, explain warnings, and return a real PDF artifact. The user remains responsible for approving what is shared and whether the PDF is created. This follows MCP’s structured tool-result and human-in-the-loop expectations.[1] [2]

The in-app assistant currently prepares a local-only grading brief. It does not silently transmit project data or invoke a model inside the PWA. This distinction is intentional and should remain visible in the interface.

### Tier 2: valuable next extensions

The next practical read-only or approval-gated tools are `project.snapshot`, `grading.compare_sizes`, `grading.compare_revisions`, `export.project_pdf`, `export.project_book`, `export.pattern_draft`, `export.brag_card`, `export.receipt`, `export.grading_csv`, and `project.quality_report`. A batch grading tool could process explicitly selected projects and return per-project success, warnings, and failures rather than failing opaquely at the first bad project.

These tools should use the same deterministic libraries, return structured outputs plus provenance, and require explicit approval for artifact creation. Multi-project operations should be modeled as tasks with progress and cancellation rather than an unbounded synchronous request, following MCP’s user-control and task-lifecycle guidance.[1] [2]

### Tier 3: possible but requiring stronger identity and consent

A future authenticated sync layer could let a user select projects from a cloud mirror instead of pasting snapshots. A controlled write layer could accept a proposed patch, show a human-readable diff, validate it, and apply it only after confirmation inside Stitch & Scale. Other candidates include saving an AI-created draft, importing a reviewed pattern description, updating project notes, and creating a project from an approved intake.

Commercial planning could eventually support a “scenario report” that runs multiple calculators, but it should remain clearly labeled as a model based on user assumptions. It must not place orders, sign agreements, transfer money, publish prices, send outreach, or make legal/tax representations.

### Tier 4: capabilities I would deliberately not add

I would not add an unrestricted `run_task`, `run_code`, `storage.read_all`, or “operate every tab” tool. I would not allow an AI client to enumerate all projects by default, infer missing body measurements, modify or delete projects without an in-app diff and confirmation, publish a pattern, send a message, share a Brag Card, submit to a magazine, place a wholesale order, or complete a financial transaction. MCP’s security guidance makes least privilege, explicit consent, exact redirect validation, and protection from confused-deputy and token-passthrough risks material requirements.[3] [4]

I would also refuse an anthropomorphic always-on companion, persistent youth conversation memory, behavioral profiling, engagement nudges aimed at children, hidden prompt uploads, background browsing of personal information, or a tool that treats model confidence as grading confidence. These capabilities may be technically possible, but they are disproportionate to the product’s trust model and create avoidable safety, privacy, and liability exposure.

## Vercel and custom-domain assessment

### What is Vercel-specific

The static Vite build and browser application are portable. The current Vercel-specific portion is the root `api/mcp.ts` serverless adapter and its deployment environment variables. The pure MCP dispatcher, contract, workflow, grading, and PDF modules are ordinary TypeScript and can be hosted behind another Node-compatible HTTP runtime later.

The repository’s SPA fallback does not need to own the API route. Vercel supports version-controlled project configuration and filesystem-aware routing/rewrites, so the `/api/mcp` function can coexist with the catch-all application rewrite; a custom domain attached to the same project should serve the application at the custom host and the MCP endpoint at `https://your-domain.example/api/mcp`.[5] [6] [7] The custom-domain setup itself is therefore not a reason to remove Vercel.

### What must be configured for a custom domain

The apex domain and any `www` or application subdomain must be deliberately assigned a canonical host. DNS records must point to Vercel according to the current Vercel domain instructions, and redirects between the non-canonical and canonical host must be tested. HTTPS, POST requests, authorization headers, JSON content types, and non-cached responses must survive any DNS proxy or reverse proxy placed in front of Vercel. Because browser storage is origin-bound, the migration should temporarily keep the old deployment available long enough for users to export snapshots before they move.[13] [14] [15] [16]

The production environment must set `MCP_API_KEY` and `MCP_ALLOWED_ORIGIN` independently from Preview. Vercel scopes variables by environment and applies changes to new deployments, so changing the custom-domain origin without redeploying is an operational failure mode.[8] If the MCP is accessed from browser-based AI clients, the current exact-origin check must be expanded into a deliberately controlled origin allowlist or a client-specific authorization policy; setting it only to the product domain may reject a legitimate AI host whose browser sends a different `Origin` header. Non-browser requests without an `Origin` header should continue to rely on authentication, not on CORS.

### Vercel-specific operational risks

The current rate limiter is in-memory. On a serverless platform it is best-effort per warm instance, not a globally enforced user quota; this is an implementation property of the current function, not a Vercel guarantee. Broad public distribution needs a durable rate limiter or edge/provider control. The current body limit is 256 KiB, which is appropriate for bounded snapshots but not for arbitrary pattern files or image uploads. Base64-embedded PDFs also increase response size, so artifact limits and platform response limits need monitoring.

Serverless execution time, memory, cold starts, concurrency, and deployment-region behavior should be tested with real custom-domain traffic. The current artifact path is intentionally stateless and does not persist files. If users later expect artifact history, resumable batch jobs, large uploads, or multi-minute generation, a durable job store and object storage will be required; those should not be smuggled into the current function through ad hoc in-memory state.

### Portability plan

If you stay on Vercel, keep the static output and `/api/mcp` function in the same project, use separate Preview and Production variables, add a controlled origin policy, and test the custom domain with `OPTIONS`, unauthorized `POST`, valid `POST`, oversized body, rate-limit, and PDF-artifact cases.

If you later move away from Vercel, deploy the static `dist/public` output to any CDN or web server and run the pure MCP dispatcher behind a small Node, Fastify, Hono, or equivalent adapter. Keep the existing domain contract, authentication, input limits, audit events, and artifact policy unchanged. The product’s local-first project storage means a hosting move does not require migrating user projects unless a future cloud-sync feature is introduced.

## Recommended implementation order

First, keep the current MCP scope stable and add the remaining safe artifact tools: Project PDF, Project Book, pattern draft, Brag Card, receipt, CSV, and quality report. Second, add revision comparison and explicitly selected batch grading with progress and per-project failure reporting. Third, add OAuth-based identity and optional cloud sync only if user demand proves that snapshot handoff is too burdensome. Fourth, consider human-confirmed write patches. Do not reverse this order by building a general autonomous agent first.

The single most important product message should be visible everywhere AI is offered: **the product calculates from the user’s data; AI helps interpret and prepare; the user approves what is shared, changed, exported, or published.**

## Primary references

[1]: https://modelcontextprotocol.io/specification/2026-07-28 "Model Context Protocol specification"
[2]: https://modelcontextprotocol.io/specification/2026-07-28/server/tools "MCP tools specification"
[3]: https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/authorization "MCP authorization guidance"
[4]: https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices "MCP security best practices"
[5]: https://vercel.com/docs/domains/working-with-domains/add-a-domain "Vercel custom domains"
[6]: https://vercel.com/docs/routing/rewrites "Vercel rewrites"
[7]: https://vercel.com/docs/project-configuration "Vercel project configuration"
[8]: https://vercel.com/docs/environment-variables "Vercel environment variables"
[9]: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa "FTC COPPA"
[10]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/ "UK ICO Children's Code"
[11]: https://www.unicef.org/innocenti/reports/policy-guidance-ai-children "UNICEF Guidance on AI and children"
[12]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence "NIST Generative AI Profile"
[13]: https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy "MDN same-origin policy"
[14]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API "MDN IndexedDB API"
[15]: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Client-side_APIs/Client-side_storage "MDN client-side storage"
[16]: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage "MDN localStorage"
