# CHK-113 cycle state (2026-08-17)

## Prior cycle closures done (all evidence posted, issues closed)
- #45 CLOSED (CHK-112, 7139247): Consignment zero sell-through $0.00 BEST crown.
- #43, #44, #48, #49, #50, #51 CLOSED as fixed-in-flight with evidence comment (body at /home/ubuntu/comment-49-51.md reused for all).
- #52 CLOSED with evidence (single TAB_REGISTRY 79 entries, assertTabRegistryIntegrity, lockstep TAB_GROUPS test). Comment body at /home/ubuntu/comment-52.md.
- Open PRs: none. leader-notes/ empty.

## CHK-113 item: QA #46 (Pattern Bundle Lab) — part 2 only
- #46.1 host-commission raw fraction %: ALREADY FIXED IN FLIGHT (card line 153: value={input.hostCommission * 100}, suffix %). No action.
- #46.2 INERT RENEGOTIATION SUGGESTION — VERIFIED REPRODUCING at current tree (HEAD 7139247):
  - File: artifacts/stitch-and-scale/src/lib/pattern-bundle-lab.ts, line ~317, verdictNote in branch verdict='Not yet — renegotiate before signing'.
  - Formula: `lift the bundle to $${Math.max(input.bundlePrice, Math.round((standaloneSum * 0.5) * 2) / 2)} (40-60% off)` — when bundle already ≥ 50% of standalone sum, suggested === current → inert no-op.
  - Probe test (src/lib/chk-113-probe.test.ts, 1 test, PASSING = defect reproduced): underwater input { bundleSales:30, best:60, worst:10, soloSalesPerPattern:20, promoHours:40 } yields verdict "Not yet — renegotiate before signing" with suggested $14 == current $14.
  - #46.3 worthGap dead code (lib line ~298 computed never read) — also to remove.

## Fix plan (minimal)
1. In pattern-bundle-lab.ts: compute suggestedPrice = Math.max(input.bundlePrice, Math.round(standaloneSum*0.5*2)/2); if suggestedPrice > input.bundlePrice → include "lift the bundle to $X (40-60% off)" clause; else include a clause stating the price already meets the floor and the live levers are commission (<25%) + host floor (≈floorSales.toLocaleString) — keep the commission & floor clauses always (guard floor display with === Infinity? 'a floor near your launch target' : floorSales.toLocaleString()).
2. Remove dead `worthGap` constant.
3. Probe test → convert to regression tests in pattern-bundle-lab.test.ts (delete chk-113-probe.test.ts after merge to avoid stray probe file; or keep as regression).
4. Gates: tsc clean, full vitest (current: 1784 tests/114 files), build green, localhost visual on the bundle lab.
5. Commit template [CHK-113] [STITCH-AND-SCALE-PRO] [VERIFIED]; push; comment evidence on #46 and close.
6. Report: item fixed, commit, gates, next backlog: #47 (podcast tab unreachable + magazine raw fraction, verify at current tree), then MAJORs S182/S251/S160 (ledger items; #46 closes as one issue covers both halves).

## Repo facts
- Repo: /home/ubuntu/stitch-and-scale-pro, app: artifacts/stitch-and-scale. Preview port 5000.
- gh auth: token=$(git remote get-url origin | sed -n 's|https://\(ghp_[A-Za-z0-9]*\)@.*|\1|p') && echo "$token" | gh auth login --with-token (session probe1/probe2 work; some sessions mangle heredocs — write comment bodies to files in /home/ubuntu/ first).
- Default demo project route: http://localhost:5000/project/mss5osqd88j6fdyvtdu ; bundle tab trigger id radix-...-trigger-pattern-bundle.

## CHK-113 fix implemented (verified by lib tests)
- pattern-bundle-lab.ts: dead `worthGap` removed; `suggestedPrice` computed once; renegotiate verdictNote uses conditional priceLever: suggestedPrice > bundlePrice → "lift the bundle to $X (40-60% off the $Y sum)" else "the $X price already sits at the 50%-of-sum floor — skip it".
- Tests appended to pattern-bundle-lab.test.ts (2 new: inert-lift-never + lift-only-when-beats). 27 tests in file. Full suite 1786/114, tsc clean, build green.
- Browser visual: PB field ids: pb-price-0, pb-worst, pb-sales, pb-best, pb-solo, pb-promo, pb-host. With worst=10,sales=30,best=60,solo=20,promo=40,host=30 the verdict lands in SKIP branch (breakEven >> best*1.2), which is consistent with lib test #1 params (bundleSales 30 alone also hits skip; the renegotiate branch needs higher sales — working params from probe: bundleSales 200, best 400, worst 100, soloSalesPerPattern 15, promoHours 30, hostCommission 0.3, emailGained 0, hourlyRate 40 → verdict renegotiate, incr -256).
- Remaining visual step: set pb-sales=200 pb-best=400 pb-worst=100 pb-solo=15 pb-promo=30 pb-host=30, expect verdict "Not yet — renegotiate before signing" with "floor — skip it, " phrasing (default price $14 >= floor $10.5) → screenshot, save to docs/screenshots/chk-113-bundle-floor-skip.webp.
- Then commit: git add -A; commit "[CHK-113] [STITCH-AND-SCALE-PRO] [VERIFIED] Pattern Bundle Lab: renegotiate verdict never restates the current price as a lift lever (QA #46) — inert price lever replaced by floor-meets-acknowledgment naming the two live levers; dead worthGap constant removed; 2 regression tests; gates green (tsc clean, 1786 tests/114 files, build green)"; push; comment /home/ubuntu/comment-46.md on issue 46, close.
- Comment-46.md body not yet written: use facts — #46.1 host-commission raw fraction already fixed in flight (card line 153 value*100+%); #46.2 fixed in CHK-113; #46.3 worthGap dead code removed; HEAD 7139247 + new commit.
