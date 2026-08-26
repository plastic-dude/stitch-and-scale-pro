# Who This Is Actually For — Niche, Economics, and Competitive Reality

**Owner directive, 2026-08-24. For consideration, not a hard gate.** Compiled by Claude (PM) at the owner's request, who was direct about not knowing the niche deeply and wanting the evidence rather than assumption. This is a **research document**, and unlike the four prior directives in this file, it does **not** mandate a two-pass implementation gate — the core question it raises (who is this actually for) is a founder decision, not something delegable to a research pass. What it does ask for is narrower: read it, and don't let future work quietly contradict it or the tension in §3 without the owner having actually decided.

---

## 1. Why this document exists

Three prior directives in this file (soothing-recognition, portable maker identity, device permissions, reaching-the-real-user) were all written using an "elderly, non-technical makers" framing for the target audience — that framing came directly from the owner in conversation. Separately, this project's own prior business research (`docs/source-bundle/stitch_scale_bundle-2026-08-22/original/stitch_scale_risk_pricing_report.md`, written by Manus AI) frames the audience differently: "average-income knitting mothers" versus "independent professional designers" as two distinct segments, with an explicit warning against serving both at once. Neither framing was checked against real external market data before now. This document does that check, surfaces the tension plainly, and leaves the decision where it belongs.

---

## 2. What the real evidence says

**Who actually sells patterns, per real survey data (not content-farm SEO articles):** Tara Swiger's independent designer income surveys describe the population as women, predominantly ages 30–60, college-educated, and — directly relevant to the "non-technical" framing — "very comfortable online." This is a materially different profile than "elderly, non-technical."

**The economics are genuinely thin, and this part *does* match the project's existing internal research:** Ravelry's own 2019 seller data (cited both externally and in this project's own pricing report) shows over 70% of designers who sell patterns make under $50/month from it. Pattern design is, for most who do it, inconsistent side-income, not a funded profession. Any pricing or onboarding decision needs to respect that a designer's actual willingness-to-pay is low and trust-sensitive, regardless of how the audience is otherwise described.

**There is a real, separate, younger population in this craft** — a documented Gen Z/millennial hobbyist resurgence, especially post-2020 — but this group skews toward making things for themselves, not running a pattern-sales business. They may use Stitch & Scale's grading tools eventually, but they are not the population the pricing-report's own economics were describing.

**Competitive landscape, checked directly rather than assumed:** Stitchmastery, Stitch Fiddle, KnitCompanion, and AranPaint were all checked. None of them perform automated multi-size grading — they are charting tools (drawing stitch diagrams) or project-tracking tools (row counters). A real, current (2025) blog tutorial series exists teaching designers to grade patterns by hand in Google Sheets, specifically because no dedicated tool does it well. **This validates, with actual evidence, the "meet spreadsheet users, don't compete with them" strategy already adopted in this project** (the `grading.export_csv` MCP tool) — the real competitor to Stitch & Scale's core function is a tutorial culture, not a product.

**On the specifically-named competitor, `stitchscale.app`:** could not be confirmed via two separate web searches. Either very new/low-visibility, not yet live, or the owner may be misremembering the exact name or URL. Not asserted as real or unreal here — the owner should check the URL directly.

---

## 3. The unresolved tension (for the owner, not for a research pass to resolve)

"Elderly, non-technical" and "capable, digitally-comfortable women 30–60 running inconsistent side-income pattern sales" are not the same target, even though they could overlap for some real individuals. Three possibilities, genuinely open:

1. The owner has specific signal this document doesn't have access to (an early tester conversation, a direct observation) that justifies "elderly, non-technical" regardless of the broader survey data. If so, that signal should outweigh this document's general research.
2. "Elderly, non-technical" was a reasonable general instinct that the real data doesn't fully support, and the three prior directives' framing should be revisited for consistency once the owner decides.
3. Both populations are real and worth designing for simultaneously — but per the pricing report's own explicit warning, trying to serve both without deciding which is primary risks satisfying neither.

**This document takes no position on which of the three is correct.** That's a founder decision. What it asks is that future research passes on the three prior directives don't silently treat "elderly, non-technical" as settled fact if the owner later says otherwise — and that if the owner does resolve this, the update should be a deliberate, explicit correction to those directives (the same way the Stitch Score brief's cryptography section was explicitly corrected earlier), not a silent drift.

---

## 4. Sources

- Tara Swiger, independent pattern designer income surveys — demographic profile of who actually sells patterns.
- Ravelry 2019 designer income data (cited both here and in this project's own `stitch_scale_risk_pricing_report.md`) — the <$50/month economic reality.
- Direct product checks: Stitchmastery, Stitch Fiddle, KnitCompanion, AranPaint (none perform automated grading) and a current (2025) manual-grading-via-spreadsheet tutorial series (Sister Mountain blog) — the real competitive landscape.
- Internal: `docs/source-bundle/stitch_scale_bundle-2026-08-22/original/stitch_scale_risk_pricing_report.md` — the project's own prior customer-segment research, whose "hobbyist vs. professional designer" framing this document compares against both the owner's "elderly, non-technical" framing and the external survey data.
