# Archive Digest — Founder's Brainstorm Files (v1)

*Condensed from the 39-file brainstorm archive received 15 Aug 2026. Full files preserved at `/home/ubuntu/upload/` (host machine). This is the working summary the repo should carry forward.*

## The founder's own strategic documents

**Stitch & Scale — The Pitch Playbook.** The single most important document in the archive. Golden rule: *never sound like you're selling; sound like a person who built something useful and is asking for help making it better.* Core weapon: the honest disclosure — "I don't know how to knit — my late mother did." Tested with a knitwear designer in conversation; the disclosure *increased* trust and engagement rather than damaging it. Tester incentive rule: serious bug reporters get a significant discount at paid-launch. Never overpromise roadmap features in pitch; testers spot the math gaps better than any AI audit.

**Elmux Master Strategy Blueprint.** The parent brand is **Emlux**; Stitch & Scale is the product within it. Founder is David Mokwunye, 19, indie developer. Personal signature **MOKDAVONY** for personal branding only, never for the product. Positioning: honest multi-size grading for indie knitwear designers, with transparent pricing. Voice: warm, transparent, craft-focused, no corporate fluff. Emotional hook: invisible labor — the hundreds of unpaid hours of spreadsheet math that bury the care in handmade work.

**Stitch & Scale Research Dossier v1 + EMLUX Market Research.** Market facts: ~43M active knitters in the US, $4B+ US craft market, indie pattern designers estimated 200K+ globally with 60–70% treating design as a side business. Competitor set: KnitGrader (free grading-only), Pattern Grader (paid grading), TechEdit services ($50–150/pattern, manual), Ravelry (community, no business math). Documented market anger: "checkbox grading" that doesn't scale past L/XL — "Knitting's XXL Lie". No tool covers the full business loop (grading → yield → pricing → channels → launch).

**STITCH_AND_SCALE_CANONICAL_BUSINESS_SPEC.md.** Defines DEC-0011 pricing: **Lite $45, Full $80 one-time** (lifetime). Full tier includes multi-size grading, yield, pricing, wholesale, launch. Note: *two independent designer audits later contradicted this* (see below).

## The audit stack (all four rounds agree on the revenue blockers)

**EMLUX Strategic Audit (4 rounds).** Market position verdict: strong concept, early-stage product, zero revenue signals so far. Pricing intelligence: comparable professional tools run $9–29/mo or $50–150/pattern; $45/$80 one-time is defensible but unproven.

**The Vance & Fiber Audit + Elara Vance Audit Diary (professional designer, 5-day test).** Most severe findings: (1) **Local-storage-only trust issue — #1 revenue blocker.** "Would not sell a paid pattern through this." Designers fear losing months of work; no cloud backup/account = no paid trust. (2) The tool speaks *developer* language to a craft audience. (3) The "business math" promise exceeds what a casual visitor can verify in 30 seconds.

**Stitch & Scale Product Review (A Knitwear Designer) — the revenue-blocking findings.** "For this to succeed, users must trust that months of work won't vanish on a browser reset" — repeated three ways. Also: naming confusion (Stitch & Scale vs StitchScale competitors), and *a pricing expectation the founder's DEC-0011 doesn't match: this designer independently said they'd expect $15–25/month, not $45/$80 one-time.*

**Comprehensive Product Audit (Expert Expanded) + God-Level Product Audit.** UI/design direction confirmed: "Elegant. Quiet. Premium. Readable. Craft-focused." The market wedge is **honest multi-size grading** — the documented pain of checkbox grading.

**First Impression Evaluation + MANUS Real Designer Test Prompt + Outreach/Pitch List.** Provides the tester recruitment list (Ravelry designers, Etsy pattern sellers, Instagram designers) and conversation scripts. The Q1 2026 audit's closing warning: the business math category is crowded on the *free grading* side; the open space is **designer business operations + honest size inclusivity**.

## What the archive changes for the repo (applied in CHK-082)

1. **The honest-founder rule** (`docs/brand-voice-brief.md`, Rule 1): copy never claims the founder knits; the mother-story disclosure is the trust weapon per the pitch playbook. Landing page footer + hero rewritten; post drafts corrected.
2. **Tab classification completed**: all 75 workspace tabs explicitly mapped to 6 groups (was 20 unmapped/defaulting).
3. **Pricing tension parked for a decision**: DEC-0011 ($45/$80 one-time) vs audit-found expectation ($15–25/mo). Resolution method per playbook: ask the founding testers directly — the first cohort decides pricing.
4. **Local-first trust stays the #1 thing to solve after landing traction** (Supabase sync → account trust), confirming the earlier architecture plan.
