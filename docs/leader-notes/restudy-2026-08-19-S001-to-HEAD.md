# Restudy — S001 (first codes) to HEAD — 2026-08-19

**Author:** Manus (Main Worker / Team Lead) · **Measured at:** HEAD `c1f4522` (Main Worker 15m-loop schedule record) · **Gates at restudy time:** tsc clean, vitest 1,978/1,978 (6.85 s, 135 files), production build green.

This is the owner-requested fresh-start review: the whole history read chronologically, claims checked against the tree as it stands (Reviewer protocol — no stale counts accepted), and the backlog state re-established before the main defect task resumes.

## 1. History skeleton

The repository contains **278 commits** on `main`, all non-merge, spanning **2026-08-13 23:29 UTC** (clone from `stitch-and-scale-rc @ d04a8c4`, first commit `b0cd83e`) to **2026-08-19 08:06 UTC** (this document's preceding commit `c1f4522`). That is roughly 32 hours of elapsed time at a peak rate of about ten commits per hour. The CHK series runs **CHK-001 through CHK-140 with a single gap at CHK-100** (never filed in any commit message; CHK-101..104 exist only as "Append CHK-NNN to playbook progress log" entries, marking the Aug-14-early feature era). A reference to "CHK-149" appears inside CHK-106's message, but only as a triage cross-reference `(QA #55, CHK-149)` — no CHK-149 commit exists, so it is treated as an issue/triage identifier, not a worker checkpoint.

| Era | Dates (UTC) | Content |
|---|---|---|
| `b0cd83e` base | Aug 13 23:29 | Clone from `stitch-and-scale-rc @ d04a8c4` (222 files, 26,347 insertions) — the pre-existing app body |
| CHK-001..008 | Aug 14 00:21–02:41 | First business labs: yarn estimator (CYC model), Pattern Income Planner, standing playbook, Pre-Publish Toolkit (12 tech-editor checks), Release Portfolio dashboard, Credibility Report, Deal Comparator tab (103 tests). Test suite grew 90 → ~1,080 |
| Untagged feature burst | Aug 14 00:09–00:41 | Pattern Draft tab, Storage Health panel (self-audit W1/W2/W3) — committed without CHK tags, against the playbook |
| CHK-037..089 | Aug 14–15 | QA-bug-fix era: fmtMoney dead-currency close (#49, CHK-079), Intl Pricing Lab (#76), Podcast dead tab (#47), EUR/CHF compound key + raw-fraction % + lab-count drift (CHK-084), Brag Card runtime crash (require() in component body, CHK-092) |
| CHK-090..118 | Aug 17 06:06–08:55 | Second-agent era (video-team/docs agent) plus localization sprints: consignment re-price QA fixes (#45 S255, #60 S260), yarn-pool dynamic prose localization, storage-seam hydration generalization, first-paint visibility (QA #63), mobile compatibility audit (LIVE-004), mobile navigator/deep-link fixes, desktop strip alignment (QA #65), PDF metadata localization |
| CHK-119..131 | Aug 17 08:45–22:18 | Third-agent perfection sprint on main: touch-target 44px cluster (LIVE-004 retired at gate level), AI Mode evidence protocol (CHK-130/131) |
| CHK-136..140 + MEM/SCHEDULE | Aug 18–19 | This worker's localization end-game: gauge byline (CHK-137), all-locale verification (CHK-138), nine-item no-deferral English-string sweep (CHK-139), long-form scope estimate (7bfb940), i18n sweep plan for 32 files (CHK-140 PLAN), assimilated memory (MEM-001), schedule-state record (MEM-002) |

Two facts about the agents deserve recording. First, QA (`origin/qa/*`) ran **79 cycles on Aug 14 and 12 cycles on Aug 17**, with its last commit `d89608f` at Aug 17 22:17 — QA has produced **no coverage during Aug 18–19**, exactly the period of the localization sprint. The latest QA fork shares merge-base `6db5aa1` with main and carries only two commits beyond it (AI Mode evidence protocol, CHK-130/131-era). Second, QA's own Aug-17 edits to the same localization surfaces (gift card copy, translation bundle, tester desk, membership site) were absorbed into main during CHK-139, which is why the CHK-139 diff overlapped the QA fork's content — no QA-only fix was lost.

## 2. Claim-vs-reality: the three "long-open MAJORs" are stale at HEAD

The team-standing-orders backlog paragraph (written CHK-110, Aug 17) lists S182, S160, and S251 as open on the escalation list, and the assimilated memory repeated them. Measured against the current tree, **all three are fixed or restructured in code**:

| Ledger item | Status at HEAD | Evidence |
|---|---|---|
| S251 — yarn-company-deal royalty double-count | **Fixed in flight** | `lib/yarn-company-deal.ts` carries an inline "FIX (reviewer debt a)" comment; the royalty branch now computes royalties + direct-channel net instead of subtracting costs a second time |
| S182 — podcast affCut conversion | **Fixed in flight** | `lib/podcast-affiliate-lab.ts:177-190` has an inline "S182 fix" comment; the platform-cut numerator now carries the same conversionRate weighting as affGross |
| S160 — migration delta | **Structure solid, premise unverifiable** | `lib/storage-lib.ts` implements a full reads-once scoped migration with a corrupt-legacy-key guard and a documented cloud-storage hook; no reproduction of the alleged delta exists, so it should be marked REQUIRES-REPRODUCTION rather than open |
| Bundle card "never collects partner patterns" | **Fixed** | `components/translation-bundle-card.tsx` has a real `addPartner()` control (aria-label "Add partner pattern"), partners persist in `stored.bundle.partners`, and the engine consumes them with retail price and solo-window defaults; the empty state was localized in CHK-139 |

The honest consequence: the reviewer report that escalated these items on Aug 14–17 was **stale at the time it was written** for at least S182 and S251 — the fixes landed in the CHK-076..118 window and were never struck from the ledger. This is not a code defect; it is a **ledger-hygiene defect**. The standing backlog paragraph also still lists #51/#49/#50/#48/#47/#46 as open even though CHK-079, CHK-084, CHK-076 and the CHK-110 key fix closed that whole class. The ledger (docs) now contradicts the code.

## 3. Architecture inventory at HEAD

The app body is 12 pages, **85 components** (77 lab cards plus shell/shared), and **277 lib files**, of which **64 are locale copy modules** (`*-copy.ts`, each with `Record<LanguageCode, string>` maps for en/de/fr/es/pt and an English fallback). 69 of the 85 components/pages import a copy module. Storage discipline at the JSX layer: **160 `projectStorage`/`settingsStorage` call sites**, no raw `localStorage` bypass found in the component layer; remaining English-only placeholders are language-neutral numerics ("0.00", "5.00") and legitimately outside localization. The grading engine remains the single source of truth for data shapes (276 lines), and `resolveProjectStandards` now falls back to CYC with an explicit `isCustomStandardMissing` flag instead of the S003-family silent-zero bug.

## 4. Backlog as it actually stands (Aug 19, post-restudy)

The real open work, in priority order:

1. **Localization** — the CHK-140 plan (32 files, register in `docs/leader-notes/cycle-2026-08-18-chk140-plan.md`): the registered `0 measurements` chip, the toast/snackbar module (93 calls, 17+13 distinct strings), Tier 1 narrative paragraphs (6 cards, 9 paragraphs) and Tier 2 "Benchmarks baked in" footers plus ~95 `<Field hint>` strings. Owner approval pending per the scope estimate.
2. **QA coverage gap** — QA stopped at Aug 17 22:17; the localization sprint and the Aug-19 code has had **no third-party audit**. A fresh QA pass over the fixed surfaces is warranted before new defect work.
3. **Ledger hygiene** — strike the stale MAJORs and closed issues from `docs/team-standing-orders.md` and the playbook, or the next cycle will re-litigate fixes that already landed. This is the next free item I can execute.
4. **Untagged commits** — `446af34` (Storage Health) and `3282a70` (Pattern Draft) skipped the CHK discipline; no corrective action needed, but the pattern should not recur.
5. **GitHub verification** — the connector is not enabled, so the live issue state cannot be re-confirmed from this sandbox; the last known state (0 open issues, 0 open PRs at CHK-138) stands until verified otherwise.

## 5. Honest limits of this restudy

Three limits are recorded. First, the S160 "migration delta" cannot be confirmed or refuted without a concrete reproduction; I report it as REQUIRES-REPRODUCTION, not closed. Second, the issue tracker could not be queried live (GitHub connector disabled), so the claim "0 open issues" is last-known, not freshly measured — it is marked UNVERIFIED as-of-Aug-19. Third, the QA branches are forks, not merged reports; their findings beyond the merge-base `6db5aa1` were not absorbed into main by construction, but the overlap analysis showed no lost QA-only fix on the surfaces CHK-139 touched.

**Next action:** ledger-hygiene pass (item 3), then resume the CHK-140 localization work at the owner's go-ahead, starting with the free small items (measurements chip, toast module) during the next scheduled loop firing.
