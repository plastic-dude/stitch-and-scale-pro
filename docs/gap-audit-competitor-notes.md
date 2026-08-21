# Wide gap audit — adjacent product notes

## Stitchmastery
Source: https://stitchmastery.com/

The product positions itself around professional knitting charts and explicitly lists a large stitch library/custom stitch creation, flat/circular/two-pass charts, configurable grid and key appearance, repeated-stitch annotations, repeat instructions and borders, row/column arithmetic checks, automatic written instructions, and multi-format image/key export. These are relevant adjacent expectations for a product that claims to support end-to-end pattern production, not only business planning and size grading.

## KnitBird
Source: https://knitbird.com/

KnitBird lists draw tools, dotted/dashed lines, move/rotate/flip, repeated pattern generation, stitch color picker, instructions for charts/colors/symbols, JPEG/PDF chart export, image import-to-chart conversion, text insertion, reusable design-library fragments, and Windows/Mac support. Although discontinued, it is useful evidence that chart composition, visual motif reuse, and pattern artifact creation are established user expectations in the category.

## Sister Mountain: working with technical editors
Source: https://www.sistermountain.com/blog/tech-editing-beginners-guide

The guide distinguishes tech editing from rewriting and describes scope beyond arithmetic: proof-reading, instruction clarity, sizing, style-guide consistency, and sometimes grading. It recommends sending a first draft and schematic after the sample, maintaining a style guide, and using tech editing before test knitting so test knitters are not expected to find designer mistakes for free. This supports gaps around formal style guides, versioned review handoffs, correction tracking, and pre-test quality gates.

## Knit Julep: technical-editing deliverables
Source: https://knitjulep.com/knitting-technical-editing-services/

The service describes a publishable pattern as error-free in grammar/punctuation, complete with industry-standard elements, mathematically accurate, stylistically consistent, clear, and still recognizably the designer’s voice. It also highlights a pre-edit checklist, replayable walkthrough of edits, and final proofread. The product has deterministic readiness and technical-edit surfaces, but this external baseline indicates a remaining distinction between a numerical/readiness checker and a full editorial review system with issue lifecycle, style-guide enforcement, and human-review artifacts.

## Stitch Fiddle Premium: charting benchmark
Source: https://www.stitchfiddle.com/en/premium/pricing

The official pricing page exposes account/profile and saved-chart surfaces, with multiple currencies and a paid feature tier. Search-result discovery for the same official product identifies chart mirroring, fill tools, automatic chart error checking, and conversion from charts to written instructions. These establish a benchmark for interactive chart authoring and persistent user workspaces; Stitch & Scale’s Chart Lab is closer to chart checking/translation than a full visual chart authoring and pattern-document compiler.

## EnvisioKnit: professional chart and pattern benchmark
Source: https://www.envisioknit.com/features/

EnvisioKnit advertises freehand/shape drawing, fill/erase, rotate/flip, row/column editing, zoom and rulers, motif reuse, live revision of gauge/colors/symbols/instructions, annotations, automatically generated written instructions with repeats, WYSIWYG pattern preview, a compiled stitch glossary, custom-stitch editing, copyright notices, and export to SVG/PNG/JPEG/BMP/PDF/Word/OpenDocument. This indicates the principal design gap is not another calculator: it is a true chart authoring and pattern-composition layer with generated instructions, preview, glossary, and editable vector/document outputs.

## Ravelry publication benchmark — access limitation

Official Ravelry help search and FAQ URLs were opened, but the browser returned no readable page content (likely access/session rendering limitation). Search discovery indicates Ravelry separates publishing a pattern into database publication, adding it to the designer store, and uploading a PDF for free or sale; this is treated as contextual benchmark only, not as a directly verified claim in the final report unless independently corroborated.

## Craft Yarn Council: authoritative sizing baseline
Source: https://www.craftyarncouncil.com/standards/body-sizing

CYC explains that finished-garment fit depends on body measurements and ease, and provides actual body measurements for babies, children, women, and men in inches and centimeters, with fit/ease guidance and multiple measurement charts. Stitch & Scale currently exposes CYC plus Custom in onboarding; six other named standards are disabled. The defensible gap is international/alternative authoritative standards coverage, not merely adding labels without sourced tables.

## W3C WCAG 2.2: accessibility benchmark
Source: https://www.w3.org/TR/WCAG22/

WCAG 2.2 covers non-text alternatives, meaningful structure and sequence, orientation, input purpose, contrast, text resizing, reflow, non-text contrast, hover/focus content, keyboard operation, timing, focus visibility, target size, redundant entry, and accessible authentication. For this calculator-heavy mobile PWA, publication readiness requires continuous automated and manual validation of these criteria across dialogs, dense tables, tab strips, exports, form errors, status toasts, and touch targets. A global a11y baseline is evidence of progress, not proof of conformance.

## MCP tools and authorization benchmark
Sources: https://modelcontextprotocol.io/specification/2026-07-28/server/tools ; https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/authorization ; https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices

The current MCP tools specification says tool-capable applications should keep a human in the loop who can deny invocations, expose which tools are available, show clear invocation indicators, and present confirmations for operations. It also supports input-required multi-round trips, deterministic tool lists, structured schemas, pagination/caching, and task-aware interaction patterns. The authorization guidance says HTTP-hosted MCP servers handling user-specific data or requiring auditability should strongly consider OAuth 2.1 conventions, protected-resource metadata, consent, scopes, and PKCE. The security guidance emphasizes exact redirect URI validation, per-client consent, CSRF/state protection, audience validation, least privilege, and avoiding token passthrough/confused-deputy designs. Stitch & Scale’s current API-key, stateless, explicitly supplied snapshot boundary is a sensible MVP but lacks user identity, per-user scopes, durable audit history, durable tasks/progress/cancellation, and broad artifact/tool coverage.
