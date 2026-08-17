---
name: app-layout-perfection
description: Use this skill whenever the user asks to review, audit, clean up, or "make perfect" an app's UI layout, spacing, tab/navigation structure, settings screens, per-item/project workspaces, overflow ("More") menus, empty/loading/error states, dark-mode theming, or visual polish — including phrases like "arrange my app," "fix the spacing," "too many tabs/features," "make it feel native," "design review," or when screenshots of an app are shared for feedback. Also use it whenever generating instructions/prompts for a coding agent (Claude Code, Cursor, or similar) that will implement UI layout fixes, since it defines the exact spacing scale, touch-target rules, tab/navigation limits, information-architecture grouping rules, and screen-type-specific playbooks (Settings, per-item workspace, overflow menus, list/catalog screens) those instructions must follow. Trigger this proactively even if the user only says something looks "off," "cluttered," or "not polished" — don't wait for them to name spacing or IA explicitly.
---

# App Layout Perfection

A design-review and instruction-writing skill for taking an app's UI from "functional" to "polished, native-feeling, and organized." Covers three areas: spacing/detailing, tab & navigation grouping, and installable-web-app ("feels native") specifics. Grounded in Apple HIG, Material Design, and current IA/progressive-disclosure research.

## When reviewing an app (screenshots or code)

Work through these checks **in this order** — earlier problems make later ones impossible to judge accurately.

### 1. Broken layout / bugs first
Before judging taste, look for actual rendering failures: overlapping text, elements clipped or hidden, content that only shows correctly at one viewport width. These are almost always caused by:
- Two elements both using `position: absolute` without a shared, sized parent
- A flex row that doesn't wrap or truncate at narrow widths
- Text with no `max-width`/`text-overflow` sitting next to another dynamic-width element

Flag these as bugs, not style opinions. Nothing else on that screen can be properly evaluated until it's fixed.

### 2. Information architecture — is everything findable?
This is usually the highest-leverage fix in any "messy" app; more damaging than any spacing issue.

- **Flat lists over ~7 items are a smell.** If a screen shows more than 7 ungrouped items (tabs, menu entries, cards), it needs categories, search/filter, or both.
- **Progressive disclosure, max 3 levels deep.** Show what's needed now; put the rest one tap away, not zero and not four. If you already have named categories elsewhere in the app (e.g. chip filters), the flat list *must* live inside them, not duplicate them.
- **Labels must be self-explanatory out of context**, since users land on deep links, not just the home screen. "Lab," "Tool," "Manager" appended to everything makes every label equally vague — prefer verbs/nouns specific to what the screen does.
- **Every navigation decision is cognitive work.** Fewer, clearly-differentiated choices beat many similar-sounding ones.

### 3. Tab bars & primary navigation
- **3–5 top-level destinations, hard ceiling.** Apple HIG and Material both converge here — beyond 5, tap-target size drops, scanability drops, and a "More" catch-all becomes required (which itself signals too many tabs).
- Tab bar = navigation only. Never put one-off actions in it — those belong in a toolbar or a `+` button.
- Icon-only nav bars need either labels or extremely unambiguous iconography. If a first-time user can't say what each icon does without tapping it, add labels.
- On mobile, primary navigation belongs at the **bottom** (thumb reach), not top — especially for an installable/PWA-style app trying to feel native.
- Active tab state must be unmistakable at a glance (not just a subtle opacity shift).

### 4. Spacing — the 8pt grid
Never use arbitrary spacing values. Every margin, padding, and gap should be one of:

```
4, 8, 12, 16, 24, 32, 48, 64  (px or pt)
```

- 4px = fine adjustments only (icon-to-text gaps, tight inline elements)
- 8px = default gap between closely related items
- 16px = standard card padding, spacing between related-but-distinct elements
- 24–32px = separation between unrelated sections/groups
- 48–64px = major section breaks, page-level rhythm

Rule of thumb (Gestalt law of proximity, "internal ≤ external"): the padding *inside* a group must be ≤ the gap *between* that group and its neighbor, or the grouping won't read visually. If a card's internal padding is 16px, the gap to the next card should be ≥16px, ideally 24px.

Component heights and radii should also snap to this scale: buttons/inputs at 32/40/48/56px tall, consistent corner radius across all cards (pick one value — e.g. 12 or 16 — and never deviate).

### 5. Touch targets & accessibility
- Minimum **44×44pt** (Apple) / **48×48px** (Material) for every tappable element — buttons, icons, list rows, close buttons. Below this, tap-error rates rise sharply, especially for users with motor impairments.
- Adequate spacing *between* adjacent tap targets, not just target size — thumbs miss when targets are large but touching.
- Color contrast ≥4.5:1 for text.

### 6. "Feels native" specifics (installable / PWA web apps)
- Use `env(safe-area-inset-top/right/bottom/left)` in CSS so content never sits under a notch, Dynamic Island, or home-indicator bar. Apply to the outermost fixed/sticky containers, not just `body`.
- Bottom nav bars must pad with `env(safe-area-inset-bottom)` in standalone/installed mode.
- Remove tap-highlight flash and 300ms tap delay (`touch-action: manipulation`); disable rubber-band overscroll where it breaks the native illusion.
- Animate only `transform`/`opacity` for 60fps transitions; keep transition timing 150–250ms.
- Test the actual installed/standalone mode, not just the browser tab — viewport height and chrome differ.

## When writing instructions for a coding agent

Coding agents (Claude Code, Cursor, etc.) implement literally what they're told, so vague design notes produce vague fixes. When asked to turn a design review into an agent prompt:

1. **One numbered fix per issue**, ordered by severity (bugs → IA → nav → spacing → polish), matching the review order above.
2. **State the concrete rule, not the vibe.** Not "improve spacing" — say "apply the 8pt scale (4/8/12/16/24/32/48/64); card internal padding 16px, gap between cards 24px."
3. **Give exact acceptance criteria** the agent (or its own QA pass) can check against — e.g. "no two text elements may overlap at 360–430px viewport width," "max 5 items in the primary tab bar," "every tappable element ≥44×44pt."
4. **Name the specific screen/component** where possible, not just "the app."
5. **Don't bundle unrelated fixes into one instruction** — agents handle scoped tasks far more reliably than compound ones.
6. Close with a short verification checklist the agent should self-check before calling the task done.

See `references/agent-prompt-template.md` for a fill-in-the-blank version of this structure.

---

## Screen-type playbooks

Generic advice ("use good spacing") produces generic fixes. These are the four screen *types* almost every app has, each with its own failure pattern and specific rule set. Diagnose which type a given screen is before reviewing it.

### SETTINGS

**Failure pattern:** flat alphabetical or add-order list of every toggle/preference the app has ever grown, with no grouping and no priority.

- **Group into 5-8 categories max**, generic and predictable, not app-specific jargon: General, Account, Appearance, Data & Backups, Notifications, Privacy, About. Users transfer mental models from other apps — don't invent novel category names for ordinary settings.
- **Order groups by usage, not alphabetically or by build order.** Frequently-touched settings (Appearance, Account) near the top; "About"/version-number/legal content at the very bottom — nobody opens Settings to read the changelog.
- **Never put a destructive action (Delete Workspace, Log Out, Reset) at the top or make it visually louder than benign settings.** Bottom of the list, visually de-emphasized, behind a confirmation.
- **Use dividers to cluster, not to separate every single row.** A divider before/after a *group* reads as structure; a divider between every individual setting reads as noise.
- **Add search once you exceed roughly 15-20 individual settings across all groups combined** — even a good grouping scheme becomes slow to scan past that point.
- **Related toggles should nest under a parent switch** — e.g. disabling "Sync" should visually disable (not hide) its dependent sub-settings, so the user understands the relationship without guessing.
- If a settings screen mixes *preferences* (language, units) with *data operations* (export, backup, restore) with *account* — these are three different mental categories and should be visseparated into their own grouped sections, not interleaved by whatever order they were built in.

### PROJECT SPACE (per-item workspace / editor screens)

**Failure pattern:** a single item (a document, a project, a pattern) accumulates one flat horizontal tab per feature as the app grows, until the tab row itself needs to scroll through 30-50 items to find anything — the exact "wall of tabs" problem, just relocated one level deeper, inside a single project instead of the app's home screen.

- **This is still an information architecture problem, not a scrolling problem.** A horizontally-scrollable row of 40 tabs is not a fix for 40 flat tabs — it's the same flat list with an extra swipe.
- **Split into two tiers:** a small set of *core* tabs always visible (e.g. Sections, Preview, Pricing, Publish — the ones touched on nearly every visit), and a secondary "More tools" entry point for the long tail (specialty calculators, one-off planning tools, rarely-touched utilities).
- **Group the long tail by workflow stage, not alphabetically:** Draft & Design → Pricing & Income → Test Knit/QA → Launch & Marketing → Selling Channels → Business/Community — mirroring the lifecycle of the underlying item, not the order features shipped in.
- **A project-level tab bar should never exceed what fits on one line without scrolling on the smallest supported screen** (roughly 4-6 short labels at ~360px width). If it doesn't fit, it's a sign some of those tabs belong inside "More tools," not that the tabs need to shrink further.
- **Give the user a way back to "core" without hunting** — if they're three swipes deep into a secondary tool, a persistent way to jump back to Sections/Preview should be one tap, not a scroll-back gesture.
- Every project-space screen needs its own scoped **empty state** (see below) — "no sections yet" should look and read differently from "no sections match your filter."

### MORE / overflow menus (⋯ button, "More" tab, kebab menu)

**Failure pattern:** used either as a dumping ground for anything the team didn't want to think hard about placing, or missing entirely so unrelated actions get crammed into a primary tab bar.

- **A "More" tab that just contains a flat list of everything remaining is a symptom, not a fix.** If you're relying on it because you have 8+ top-level destinations, the real problem is the top-level IA, not the absence of a More tab — Apple's own guidance is explicit that a crowded More tab is a sign the destinations need rethinking, not a wider tab bar.
- **Per-row overflow menus (⋯ on a list item) should hold only secondary, non-destructive-by-default actions** — Rename, Duplicate, Export — with destructive actions (Delete) visually separated (a divider) and requiring confirmation.
- **Never put a frequently-used action inside an overflow menu.** If usage data (or common sense) says most users tap it, it belongs as a visible icon/button, not hidden behind a tap-to-reveal menu — that's an extra tap tax on your most common action.
- **Overflow menu items need the same 44×44pt touch target as everything else**, including generous spacing between Delete and its neighbors so it can't be mis-tapped.
- If both a bottom tab bar's "More" *and* per-card "⋯" menus exist in the same app, make sure they're visually distinct enough that users don't confuse "more app sections" with "more actions on this specific item" — different icon (three dots vs. a grid/list icon), different placement logic.

### List / catalog screens (home, "Your Patterns," search results)

- Cards in a repeating list need one clear visual hierarchy: title → 1-2 key metadata badges → secondary metadata → actions. Don't let every card try to show everything at equal visual weight.
- Loading, empty, and error states are three *different* screens, not one generic blank — see next section.

---

## State design: loading, empty, and error (the most commonly skipped layer)

Every screen that shows fetched or user-generated content has at minimum four possible states, and each needs distinct treatment. Collapsing them into one generic view (or leaving some unhandled) is one of the most common gaps in otherwise-polished apps.

| State | What happened | What to show |
|---|---|---|
| **Loading** | Data is being fetched/computed | A skeleton matching the eventual layout, or a spinner for sub-second waits. Never a blank screen — users read blank as broken, not busy. |
| **Empty (first use)** | Succeeded, zero items exist yet because the user hasn't created any | Explain *why* it's empty in plain language, and give exactly one primary CTA naming the next action ("Create your first pattern") — not a generic "No data." |
| **Empty (filtered/searched)** | Succeeded, zero items match current filter/search | Different copy and visual from first-use empty — e.g. "No patterns match 'X'" with a clear-filter action, so the user doesn't think their account was wiped. |
| **Error** | The fetch/save/operation failed | Plain-language explanation of what went wrong (never a raw error code or stack trace), a Retry action, and — if relevant — an alternative path. Never let an error render as an empty state; a user who sees "no results" when the real problem was a failed request will blame their search terms, not the app. |

For an offline-first / local-first app specifically (which yours is): add a fifth state for **sync/save status** — a small, persistent, non-intrusive indicator (e.g. "Saved locally," "Syncing," "Sync failed — tap to retry") so the user always knows whether their work is safely stored, especially important since your Settings screen already tells users nothing is backed up unless they export manually.

---

## Dark theme: contrast and elevation (your app's actual theme)

Dark UI has different rules than simply inverting a light theme — this app already uses a dark palette, so these apply directly:

- **Shadows barely register on dark backgrounds.** Elevation (which card is "on top of" which) must come from *surface color*, not drop-shadow: each layer going "up" gets a slightly lighter background (e.g. base `#111e18` → card `#182922` → modal/popover a shade lighter still). A subtle 1px lighter border also helps separate a card from its background.
- **Avoid pure white text on the darkest surfaces.** Pure `#FFFFFF` on near-black causes halation/glare for many readers, including anyone with astigmatism. Use an off-white (`#E8E8E8`–`#F0F0F0` range) for primary text instead.
- **Contrast minimums still apply in dark mode — WCAG AA is 4.5:1 for normal text, 3:1 for large text (≥24px, or ≥18.5px bold).** Muted secondary-text greys are the most common failure point; check them specifically, not just primary text.
- **Use color sparingly for status/emphasis** (your green "Ready to launch" pill, red delete icons) — let typography weight and surface elevation carry most of the hierarchy so color-coded states actually stand out when they appear.

---

## Motion & feedback

- Standard transition duration: **150-300ms.** Past ~500ms it reads as sluggish, not smooth.
- Animate only `transform` and `opacity` for 60fps performance — avoid animating `width`/`height`/`top`/`left` directly.
- Every transition should communicate one of: what just happened, what's coming, or that the tap registered. Decorative motion with no informational purpose should be cut.
- Respect `prefers-reduced-motion` — disable parallax/auto-playing transitions entirely for users who request it, not just slow them down.

---

## Forms (Project Details and similar)

- One field's error state should never affect a sibling field's layout position — validation messages should reserve their space or appear without pushing content unpredictably.
- Autocomplete/suggestion lists render as a clearly elevated dropdown *below* the active field only, with `z-index` high enough to sit above (never merge into) the next field down.
- Group related fields visually (tighter spacing within a fieldset, larger gap between fieldsets) — same 8pt "internal ≤ external" rule as card grouping.
- Label every input; placeholder text is not a substitute for a label (placeholders disappear the moment the user starts typing, which is exactly when they most need the label for context).
