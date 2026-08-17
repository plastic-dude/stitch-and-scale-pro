# Crawler's Layout-Perfection Checklist

Authoritative visual/functional QA checklist for every crawl. Derived from the owner-approved `app-layout-perfection` skill (source: `docs/skills-source/app-layout-perfection-SKILL.md`; a copy is archived there when available — this file is the canonical in-repo copy). Judged in the listed order: earlier failures invalidate later judgments.

## The inspection loop (eyes → click → eyes, in every new space)

Load the page against the current build. Take a screenshot. Then open every tab, chip, button, select, and menu on that screen. Whenever a click opens a new panel, modal, tab content, or page, take a fresh screenshot of the new space and repeat the screenshot judgment there. Walk navigation chains end to end, stopping only at dead ends. Record any console warning or error with its exact text. Re-check responsive-risk screens at 360px, 390px, and 430px.

## Checks in order

**1. Broken layout / bugs first.** No overlapping, clipped, or hidden text; no content that renders correctly at only one viewport width. These are bugs, not style opinions — flag them as such and stop evaluating anything else on that screen until fixed. Typical causes: two absolutely-positioned siblings without a sized parent, unwrapped flex rows at narrow widths, dynamic-width text next to fixed elements.

**2. Information architecture.** No flat ungrouped list over ~7–10 items. Progressive disclosure max three levels deep. Labels self-explanatory out of context. Every navigation decision is cognitive work — fewer, clearly-differentiated choices beat many similar-sounding ones.

**3. Tab bars and primary navigation.** Destinations labeled or with unambiguous icons; active tab unmistakable at a glance; one-off actions stay out of tab bars.

**4. Spacing — the 8pt grid only.** The only allowed spacing values are 4, 8, 12, 16, 24, 32, 48, 64 px. Card internal padding 16px; gap between cards ≥ 24px; icon-plus-label 8px; major section breaks 48px+. Internal spacing within a group must be ≤ the gap to its neighbor (Gestalt proximity) or the grouping will not read. Consistent corner radius across all cards.

**5. Touch targets and accessibility.** Every tappable element ≥ 44×44pt with adequate space between adjacent targets; text contrast ≥ 4.5:1; color used sparingly for status/emphasis.

**6. "Feels native" specifics.** `env(safe-area-inset-*)` on outermost fixed/sticky containers; bottom nav padded for the home indicator; `touch-action: manipulation`; transitions 150–300ms on transform/opacity only; respects `prefers-reduced-motion`.

**7. State design — loading, empty, and error are three different screens.** Loading shows a skeleton or spinner, never a blank. First-use empty explains why and offers one primary CTA. Filtered empty uses different copy with a clear-filter action. Errors explain in plain language with Retry. The local-first app adds a fifth state: a persistent save-status indicator ("Saved locally" / "Sync failed — tap to retry").

**8. Dead and read-only state.** Every visible control must affect something. A select/slider that writes state nobody reads (like #48's escheatMode frozen at 60%, or #52's legend overcount) is dead state — the same defect class the worker has been hunting.

**9. Localization.** Every surface — buttons, placeholders, 404, verdicts, dynamic prose — shows the selected locale's copy. Screenshots in each of the five locales catch what grep misses.

**10. Forms.** Validation of one field never pushes a sibling field's layout; error messages reserve their space. Autocomplete renders as an elevated dropdown below the active field, never merging into the next field. Placeholders are not labels.

## Reporting format

One markdown file per crawl in `docs/leader-notes/` named `crawler-<date>-<cycle>.md`: screen walked, viewport(s), and each finding as *defect (severity) — location (file:line) — reproduction — screenshot filename — one-sentence scoped fix instruction*. Screenshots in `docs/screenshots/`. One defect per instruction; no compound fixes.

## Acceptance checklist (close-of-crawl self-check)

No overlapping/clipped text at 360–430px; no spacing value outside the 8pt scale on touched surfaces; no 50-item flat grid; labeled or unambiguous navigation; tappable elements ≥ 44×44pt; fixed bars respect safe-area insets; every clicked path ends with eyes having looked at the destination.
