# Scope estimate — long-form localization cycle (follow-up to CHK-139)

Date: 2026-08-18. Measured from HEAD `d177e04` (CHK-139 pushed). No code was changed;
this document is a measurement-only pass, recorded in the repo per documentation
discipline, so the estimate rests on grep-verified counts rather than memory.

## 1. The three registered items, reviewed

### Item A — the `0 measurements` chip (small, independent)
One user-visible literal: `project-workspace.tsx` line 585 renders
`{section.measurements.length} measurements` directly in English. It is the exact chip
the user saw under the German section names. Fix pattern: a single `measurementsLabel`
helper in `workspace-copy.ts` (5 locale map entries, ~2 lines of JSX wiring, a 5-test
regression file). English, German (`Messungen`), French (`mesures`), Spanish
(`mediciones`), Portuguese (`medições`). **Scope: under half an hour; can be folded
into the next cycle for free.**

### Item B — toast/snackbar strings (small, high leverage)
`grep` across `components/` and `pages/` (excluding tests) found **93 `toast()` calls
carrying hardcoded English literals**, but the deduplicated footprint is tiny:
**17 distinct titles and 13 distinct descriptions, roughly 1,000 characters of
unique text**. Most calls are mechanical variants — "Copied", "Copy failed",
"Notes saved", "Section deleted" — repeated across many cards. The right seam is a
single shared `toast-copy.ts` (itself a new copy module) exporting helpers such as
`toastTitleSaved`, `toastTitleCopied`, `toastDescSectionDeleted`, with every caller
converted to `{title: toastTitleCopied(language)}`. **Scope: one module (~90 lines),
one find-and-replace pass over ~60 files, one test file, roughly a half-day.** This is
the best effort-per-string ratio in the whole backlog.

### Item C — long-form narrative paragraphs (the real cycle)
The honest finding: the "long-form intro" class is **not as large as feared**.
Paragraph-by-paragraph inspection found **about 20 narrative paragraphs across 15
card files**. They split into two tiers.

**Tier 1 — intro + benchmark narrative cards (6 files, 9 paragraphs).** These are the
paragraphs that give each lab its voice and cite market research, and they are the
ones most worth translating well:

| File | Paragraphs | Example |
|---|---|---|
| `translation-bundle-card.tsx` | 2 | "The two channels every designer underuses…" |
| `testknit-desk-card.tsx` | 2 | "Test knits run on a Google-sheets/Instagram patchwork…" + "Benchmarks baked in (research session 43)…" |
| `deals-tab-card.tsx` | 2 | CardDescription opener + "Benchmarks: magazine-style flat fees…" |
| `kal-planner-card.tsx` | 1 | "Benchmarks baked in: Ravelry's best-ever January…" |
| `submission-desk-card.tsx` | 1 | "Benchmarks baked in: magazines pay by difficulty…" |
| `teach-economics-card.tsx` | 1 | "Benchmarks baked in: hosted workshops pay teachers…" |

A notable datum: `payback-lab-card.tsx`'s intro is **already German** ("Die Zeit von…"
class), confirming the team has translated long-form copy before — the pattern is
proven, not hypothetical.

**Tier 2 — single benchmark paragraphs in otherwise-localized lab cards (9 files).**
`workshop-teaching`, `release-timing`, `retreat-teaching`, `podcast-affiliate`,
`pod-patterns`, `convention-booth`, `channel-migration`, `pricing-psychology`,
`marketplace-takerate`, `yarn-licensing` lab cards each carry exactly one "Benchmarks
baked in:…" paragraph at the card foot. These can be appended to each card's existing
copy module as one new field — no new module, minimal wiring.

**Scope: roughly one to two days of focused work** — 15 files, 20 paragraphs, 5
locales, ~100 paragraph-translations, plus 20 regression tests. The translation
effort itself is the cost; the engineering is mechanical.

## 2. Adjacent class discovered during the sweep (register it, don't silently defer)

`grep` found **95 `<Field ... hint="…">` strings across 8 files**; 8 files have no copy
seam at all yet. These are one-to-two-sentence hints ("Market band: $5–$19/mo…") —
smaller than long-form paragraphs but larger than labels, and they are the class a
German user will actually read next on every lab card. Recommended treatment: extend
each card's copy module with `fieldHint` helpers (the modules already exist for most
of these cards post-CHK-137/139), adding roughly 1–2 hints per file. **Scope: half a
day; candidate for the same cycle as Item C since it touches the same files.**

## 3. Recommended sequencing

| Step | Items | Effort | Notes |
|---|---|---|---|
| 1 | A (chip) + B (toasts) | ~half a day | Highest string leverage; toast module covers all cards at once |
| 2 | C Tier 2 (9 single paragraphs) | ~half a day | Mechanical append-to-module; reuse the copy-module pattern exactly as established |
| 3 | C Tier 1 (9 narrative paragraphs, 6 files) | ~1 day | Needs the most translation care; payback card proves the pattern works in German |
| 4 | Field hints (95 strings, 8 files) | ~half a day | Same files as step 2; bundle into it |

Total: **two to three working days for the complete surface**, ending with the app
having no user-visible English under any of the five locales (with the standing
exceptions already logged: project names as user data, and any deliberately kept
English market terms).

## 4. Honest limits of this estimate

1. Counts are grep-verified against HEAD `d177e04`; dynamic strings built via
   template literals inside toast bodies (e.g. counts interpolated) were counted as
   their enclosing calls — a handful of those will need a `countParam` helper form
   instead of plain helpers, same pattern as `deleteSectionTitle(name)`.
2. The 95 field hints were counted per `hint="…"` occurrence; a few are
   already-localized via `Field`-level seams, so the true net-new count may be
   somewhat lower.
3. Translation quality for long-form copy is the risk surface: the benchmark
   paragraphs compress three or four research citations into one sentence, so each
   locale needs a fluent re-composition, not word-by-word translation. The payback
   card's existing German narrative is the reference standard.
4. No remote advance was observed at measurement time; if Reviewer or CRAWLER push
   before the cycle starts, the counts should be re-verified (the register is cheap
   to re-run).
