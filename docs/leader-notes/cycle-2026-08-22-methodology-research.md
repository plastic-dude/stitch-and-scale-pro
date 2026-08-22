# Methodology Research Findings (QUEUE-028)

## 1. Professional Benchmarks
The following benchmarks are used across the Stitch & Scale workspace to frame designer economics and professional standards.

### 1.1. Pattern Economics & Deals
- **Flat Fees:** Magazine-style flat fees typically range from $250 to $1,500 (or £60–£100 for smaller publications).
- **Royalties:** Commonly 5–15% of gross sales or 30% of net proceeds (Making Stories precedent).
- **Exclusivity:** Windows typically range from 6 months to lifetime (Stitchcraft Marketing).
- **Sources:** Stitchcraft Marketing (2017), Who Pays Knitters, Making Stories.

### 1.2. Teaching & Retreats
- **Guest Teacher Baseline:** $125/class-hour plus travel, meals, and lodging.
- **Host Profit Floor:** $100/person/day profit floor against minimum attendance.
- **Tuition Ranges:**
  - Budget: ~$118/day ($235 weekend with meals).
  - Tuition-only (3-day): ~$358/day (~$1,075 total).
  - All-inclusive destination: ~$750/day ($2,999 for 4 days).
- **Sources:** Fibre Retreat Audit 2026, Pip & Pin, Kneedles & Life.

### 1.3. Spec Sheets & Technical Packs
- **POM Points:** Sweater sheets often use 15–25 Points of Measure.
- **Tolerances:** ±0.25 inches is the standard cited knitwear tolerance.
- **Machine Gauge:** Flat-bed machines typically operate in the 3–14 gauge range.
- **Pack Costs:**
  - Freelance packs: $450–$850 per pack.
  - AI-assisted packs: $150–$350 per pack (varying completeness).
- **Sources:** Session-35 Market Research, Laine/Pompom 2026 rates.

### 1.4. Mystery KALs & Production
- **Mystery KAL Timing:** Benchmarks from 43 tracked mystery KAL launches.
- **Sweater Production Cost:** Average $155 based on independent designer survey.
- **Sources:** Ravelry Record Data (Jan 2025).

### 1.5. Test Knitting
- **Paid Rates:** $0.10–$0.40 per yard (Yarnpond median data).
- **Failure Modes:** "Ghosting" frequency and Fit-to-Stitch 2025 report findings.

## 2. Implementation Strategy
- **Shared Component:** `BenchmarkFooter` provides the UI seam.
- **Localization:** Methodology strings are stored in `WorkspaceCopy` for consistent access across labs.
- **Transparency:** Every benchmark claim should have a "View Methodology" tooltip citing these specific assumptions and sources.
