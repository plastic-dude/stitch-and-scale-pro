# QA Report — Cycle 27 · CHK-056 Wholesale Program Lab (54th tab)

**Repo:** `plastic-dude/stitch-and-scale-pro` · **Reviewed range:** `a7bf30a` → `e83b8e3` (new code at `55ce053`, playbook log at `e83b8e3`)
**Files touched by CHK-056:** `src/lib/wholesale-lab.ts` (428 lines), `src/components/wholesale-lab-card.tsx` (457 lines), `src/lib/wholesale-lab.test.ts` (+27 tests), `src/pages/project-workspace.tsx` (+9 lines for the 54th tab mount).
**Role:** QA (third staff). Nothing in `src/` was modified. All artifacts land on branch `qa/manus-2026-08-14-cycle27` only — `main` was not touched.

---

## 1. This report is addressed to the Reviewer

The Coder should not act on this report; the Reviewer should read it and decide whether to forward it to the Coder.

## 2. Baseline integrity

Before any browser work, the build baseline was re-verified against the fresh pull:

| Check | Result |
|---|---|
| `tsc --noEmit` | Clean, zero diagnostics |
| Vitest | **1014/1014 passing** across 56 test files (27 new Wholesale tests included) |
| Production build (`vite build`) | OK, 6.8 s |
| Dev server | Fresh restart after pull (`pnpm --filter stitch-and-scale dev --port 5173`), HTTP 200 |

The 27 new engine tests cover SKU COGS/keystone/margin, order economics, every WL-01…WL-08 flag threshold, and all four verdict tiers — they pass, and the hand recomputes below confirm the engine is arithmetically correct, not just test-green.

## 3. Deep test — Wholesale Program Lab (`wholesale` tab)

### 3.1 Defaults (BEFORE any edits)

The card was opened on the sample Crew Neck Sweater project and every displayed number was recomputed by hand from the engine formulas, then re-checked in Node.js (matching JS `Math.round` behavior). All matched the UI exactly:

| Displayed value | Hand-computed | Match |
|---|---|---|
| Hat COGS / Keystone / margin / $/hr | $11.76 / $23.52 / $12.24 (51.0%) / $40.80 | Exact |
| Cowl COGS / Keystone / margin / $/hr | $19.32 / $38.64 / $19.68 (50.5%) / $43.73 | Exact |
| Shawl COGS / Keystone / margin / $/hr | $136.64 / $273.28 / $137.36 (50.1%) / $41.88 | Exact |
| Net per order | $1,931.18 (6 × $337 − 0.7% Faire-style − $15 processing) | Exact |
| Processing share | 0.7% | Exact |
| Suggested minimum | $150 | Exact |
| Net / stockist / yr | $11,966 | Exact |
| Annual wholesale net | $5,549 | Exact |
| $/wholesale-hour | $18.50 | Exact |
| Same-hours direct | $42.14/hr | Exact |
| Retail-margin reference | $37,661 | Exact |

At defaults all eight flags (WL-01…WL-08) stay quiet, as they should: every SKU keeps ≥ 50% margin, every wholesale price is at or above 85% of keystone, the $200 first-order minimum exceeds the suggested floor, processing is well under 10%, deposit terms hold, and the annual hour budget (145 h used of 300) comfortably serves all six stockists. The verdict correctly lands in the steady-work tier:

> "Wholesale is steady work at $19/hour ($5,549/year) — below the $30/hour floor but above piece-rate territory…"

(See `qa-shots-cycle27/c27-01a-wholesale-DEFAULT-before.png`.)

### 3.2 Flag and verdict sensitivity (AFTER edits)

Two edits were made: Shawl knit hours 3.28 → 5.5 h and the first-order minimum $200 → $75. The expected cascade was recomputed independently: Shawl COGS rises to $198.80, keystone to $398, wholesale-margin share drops to 27.6% (< 35% → WL-01), wholesale price $274 falls below 85% of keystone $398 (→ WL-02), and the $75 minimum triggers the "4 units to test" trap flag (→ WL-03).

The UI fired exactly these three flags with exactly these numbers, and the economics re-stated correctly: annual wholesale net $3,311 (6 orders × $551.90), $11.04/wholesale-hour, same-hours-direct $32.73/hr, retail reference $31,467, and the verdict moved to the correct lower tier ("Wholesale pays $11/hour ($3,311/year) — underpaid for knitting labor…"). The row-level badge also switched to the destructive state: "Shawl: under keystone (keep ≥ $398)".

(See `qa-shots-cycle27/c27-01b-wholesale-AFTER-edits.png`.)

### 3.3 Phone view (375 px)

A dedicated mobile pass captured the same tab at 375 px width. The card stacks into a single column, the SKU table scrolls horizontally without clipping, all eight economics figures remain readable and identical to the desktop defaults, the Flags/Verdict cards render intact, and nothing overflows or wraps destructively. **PASS.** (See `qa-shots-cycle27/c27-02-phone-375-wholesale.png`.)

## 4. Defect found — ISSUE #40 (INFO)

One information-grade defect in the new card's copy, confirmed both in the source (`src/lib/wholesale-lab.ts`, line 405) and rendered in the live UI:

> A suggestion string inside a backtick template literal uses a literal `$${avgKeystoneWholesale.toFixed(0)}` instead of `\${…}`. The result renders as the raw text "($${avgKeystoneWholesale.toFixed(0)})" in the Verdict suggestion, with a stray leading `$` and the variable name visible to the user.

The same pattern exists on line 399 (the ≥ $30/hour tier suggestion) with `$${suggestedMinimum.toFixed(0)}`, and would render there too. Every other verdict/suggestion branch uses `\$${…}` correctly. A one-line escape fix resolves both. Additionally, the card intro line runs together as "processings≤10%" (missing space) — same INFO ticket, one-word copy fix.

No functional or mathematical defects were found. The engine is exact to the cent across both tiers tested, flags fire at their documented thresholds, and the new 27 tests exercise the same thresholds.

## 5. Screenshot inventory (committed with this report)

| File | What it shows |
|---|---|
| `c27-01a-wholesale-DEFAULT-before.png` | Card at defaults: all SKU rows, margins, terms, eight economics figures, clean verdict, zero flags |
| `c27-01b-wholesale-AFTER-edits.png` | After edits: flags WL-01/WL-02/WL-03, retiered verdict, and the rendered $$ template-literal defect |
| `c27-02-phone-375-wholesale.png` | 375 px mobile render of the full card |

## 6. Verdict

**CHK-056 PASS for functionality and math.** One INFO issue (#40) is opened for the Reviewer regarding the unescaped template literal and the intro copy typo. Previously opened issues were not re-opened; no unfixed regression was observed in the surrounding tabs during tab navigation.
