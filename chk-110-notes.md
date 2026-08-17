# CHK-110 root cause — #59 / #54 duplicate React keys TR-03 / TR-05

## Evidence
- Issue #59 (QA cycle 53): console warns duplicate child keys "TR-05" and "TR-03" when the Take-Rate War Lab renders.
- Card badges are keyed by `f.code` (`<Badge key={f.code}>` in `marketplace-takerate-lab-card.tsx`, line ~249).
- `analyzeTakeRate` loops `for (const b of breakdowns)` and pushes `code: 'TR-03'` for **every** channel with `payoutLagDays >= 30 && netPerMonth > 0` — LoveCrafts (45d) AND Ribblr (30d) both qualify with sales, so **two TR-03 flags** are pushed.
- Same for TR-05: any combination of channels (etsy/payhip/ravelry) with >25% of net qualifies — **two+ TR-05 flags** can be pushed (e.g. etsy + ravelry + payhip).
- TR-04 (delisting) and TR-01/TR-02 also loop per-channel with fixed codes → same class of duplicates for any qualifying combo.
- QA cycle 48 issue #54: "Marketplace Take-Rate Lab emits duplicate React keys for repeated flag codes" — same root cause, both issues.

## Fix (minimal)
In `marketplace-takerate-lab.ts`: collapse per-channel duplicates into a single aggregated flag per code (merge labels into the title; keep first qualifying channel's numbers or aggregate). Simplest correct approach: per code, collect qualifying channels, then push ONE flag with a combined title like `LoveCrafts, Ribblr: 30-45 day payout lag` — but that changes wording semantics. Safer: append an index suffix to the key at the card (`key={`${f.code}-${i}`}`) AND dedupe? No — the real issue is the SAME defect code appearing twice misleads designers into thinking two separate watchouts; QA says "dedupe the keys or key the second child distinctly".
Decision: dedupe at source — aggregate into ONE flag per code with joined labels, preserving the detail of the worst offender. Actually cleaner: keep separate warnings (information is real) but make keys unique at render: `key={`${f.code}-${i}`}`. This is the zero-cost cosmetic fix the QA described, and doesn't alter analysis semantics.
BETTER engineering: fix BOTH — keep per-channel flags (info is real) + unique keys at render + add regression test asserting flags have no duplicate-key warnings... but the true "duplicates could silently duplicate/omit" is fully solved by unique keys.
Hmm — but a flag-list with "TR-03 — LoveCrafts: 45-day payout lag" and "TR-03 — Ribblr: 30-day payout lag" is intentional, and QA cycle 48 #54 frames it as "duplicate keys for repeated flag codes". The Reviewer triage for #54 (MINOR) exists. Choosing: unique-key at render (minimal scope, matches QA wording 'key the second child distinctly').

## Files
- src/lib/marketplace-takerate-lab.ts — no change
- src/components/marketplace-takerate-lab-card.tsx — badges key={`${f.code}-${i}`}
- regression test: src/lib/marketplace-takerate-lab.test.ts — add test that default input (etsy+ravelry>25% each? default: etsy 40u*$6.5=260, ravelry 25*8=200, etc. totalNet: check TR-03/TR-05 dup with default input) asserts flags contain multiple entries with same code, and card renders with unique keys — but card test needs react rendering. Use existing vitest with @testing-library? Check test setup.

## Gates
tsc, vitest, build, localhost:5000 visual.

## Commit
[CHK-110] [STITCH-AND-SCALE-PRO] [VERIFIED] Unique keys for repeated Take-Rate lab flag codes (closes #54 and #59)

## Execution state (pre-commit)
- Fix applied: `src/components/marketplace-takerate-lab-card.tsx` badges now keyed `${f.code}-${i}` (was `f.code`).
- Regression tests added to `src/lib/marketplace-takerate-lab.test.ts` — 3 new tests in describe 'QA #54 / #59': default input emits 2x TR-03 (LoveCrafts 45d, Ribblr 30d), 2x TR-05 (Etsy 29%, Ravelry 25%), unique keys set size equals flags length.
- Gates green at current tree: tsc clean; vitest 1779 tests / 114 files; build ✓.
- Preview server restarted (port 5000, pid ~360831, serves new build).
- Localhost visual check DONE: demo project (mss5osqd88j6fdyvtdu) Take-Rate Lab — both TR-03 badges ("LoveCrafts: 45-day payout lag", "Ribblr: 30-day payout lag") and TR-05 badge render correctly; 7 watchout badges present; console clean of warnings.
- Evidence screenshot: /home/ubuntu/screenshots/localhost_2026-08-17_05-57-54_2104.webp
- Remaining: commit [CHK-110] [STITCH-AND-SCALE-PRO] [VERIFIED] Take-Rate Lab watchout badges keyed by code-plus-index (closes duplicate React keys QA #54 #59) → push → gh issue comment w/ evidence on #59 (and #54) → close both → report.
- Next backlog after CHK-110: #51 fmtMoney dead EUR/CHF compound key (MINOR correctness), then long-open MAJORs S182 (affCut) and S251 (yarn-company-deal royalty double-count) per staff-working-prompt.md.
