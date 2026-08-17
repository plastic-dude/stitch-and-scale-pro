# Stitch & Scale — UI Layout Fix Instructions

Forward this whole document to the coding agent. Fixes are ordered by severity —
do them in this order, and don't start #2+ until #1 is verified working.

---

## Fix 1: Overlapping/broken layout on Launch Ranking & Release Portfolio cards

**Screens:** Launch ranking list, Bundle candidates card (Release Portfolio tab)

**Problem:** On each pattern card, the price and score block is rendering with two
sets of text stacked directly on top of each other — e.g. "$9.50" overlapping
"$10.00", "readiness" overlapping "recommended," "per unit" overlapping
"(best/worst)." This is a broken layout, not a style issue — almost certainly two
elements using `position: absolute` inside a container that isn't sized/positioned
to contain them, or a flex row that isn't wrapping/truncating at this card width.

**Required change:**
- Locate the card component rendering price + readiness score + launch score for
  each pattern in the ranking list.
- Replace any absolute positioning between these sibling text blocks with a normal
  flex or grid layout so they lay out in-flow, never overlapping.
- If the card is a flex row and content doesn't fit at narrow widths, either wrap
  the row (`flex-wrap: wrap`) with proper row gap, or stack the price block above
  the score block vertically on narrow screens.
- Test at 360px, 390px, and 430px viewport widths (common phone sizes) — the bug
  must not reproduce at any of these.

**Acceptance criteria:**
- [ ] No two text elements overlap on the Launch Ranking or Bundle Candidates cards
      at 360–430px width
- [ ] Price, "net per unit," and score are each fully readable with normal line spacing

**Do not:** touch unrelated screens while fixing this.

---

## Fix 2: Flatten "wall of tabs" in the Labs / tools screen into grouped, filterable categories

**Screen:** The full-catalogue screen listing every "Lab" (Bundle Lab, Retreat Lab,
Podcast Lab, Price Psych Lab, Take-Rate Lab, Yarn Licensing Lab, Wholesale List Lab,
Intl Pricing Lab, Test Knit Lab, Gauge & Fit, Receipt Lab, Design Ledger, Brag Cards,
Payback Lab, and ~40 more)

**Problem:** 50+ items are shown as a flat two-column grid with no grouping, no
search, and no visual hierarchy. This screen already has category chips elsewhere
in the app (Design & Pattern·12, Sizing & Fit·7, Pricing & Income·15, Launch &
Marketing·13, Selling Channels·10, Business & Community·22) — but the flat grid
below ignores them. Flat lists over ~7 items are hard to scan; this one has 50+.

**Required change:**
- Nest the Lab items **under** their existing category chips instead of listing all
  of them together. Tapping "Pricing & Income" should show only its ~15 labs, not
  the full catalogue.
- Add a search/filter input at the top of this screen so a user can type a lab name
  directly, regardless of which category they're in.
- Within each category, sort by usage frequency if that data exists, otherwise
  alphabetically — anything is better than the current unordered layout.
- Each label should be understandable without extra context — audit names like
  "Retreat Lab" or "Box Inclusion Lab" for clarity; add a one-line subtitle if the
  name alone doesn't communicate function.

**Acceptance criteria:**
- [ ] No screen shows more than ~10–12 ungrouped items at once
- [ ] Every Lab is reachable via its category chip in 1 tap, or via search in 1 typed query
- [ ] Category chips and the lab list they filter are visually and functionally linked

**Do not:** delete or hide any existing Lab — this is a reorganization, not a feature cut.

---

## Fix 3: Add labels (or unambiguous icons) to the primary top navigation

**Screen:** Global top bar (book / cube / gear icons + "+")

**Problem:** Navigation is icon-only with no labels, and the icons (book, cube,
gear) don't clearly map to their destinations (Patterns, Release Portfolio,
Preferences) without trial and error.

**Required change:**
- Add short text labels under or beside each icon (e.g. "Patterns," "Launch,"
  "Settings"), OR
- If space genuinely doesn't allow labels, replace the cube icon specifically —
  it's the least self-explanatory of the three — with something more literally tied
  to "launch/release" (e.g. a rocket, matching the rocket emoji already used inside
  that screen's "Launch ranking" heading).
- Since this is an installable web app aiming to feel native on mobile, consider
  moving this primary nav to a **bottom** tab bar instead of top — bottom nav is
  the standard, thumb-reachable pattern on iOS/Android and will make the "feels
  like a mobile app" goal land better. This is a larger change; flag it back for a
  scope decision rather than doing it silently alongside the smaller icon-label fix.

**Acceptance criteria:**
- [ ] A first-time user can identify what each of the 3 top-level destinations does
      without tapping into it
- [ ] Active/current tab is visually unmistakable (not just a subtle background shift)

---

## Fix 4: Autocomplete suggestion bar overlapping form fields

**Screen:** Project Details form (Pattern Name / Designer fields)

**Problem:** When the "Designer" field's autocomplete suggestions appear (Dave,
David King, Mokwunye Emmanuel...), the suggestion bar overlaps the "Designer"
label and the field below it instead of appearing as a clean dropdown beneath the
active input.

**Required change:**
- Ensure the autocomplete/suggestion list is positioned directly below the active
  input field, with a proper `z-index` layering so it renders above other content
  without visually colliding with the label of the *next* field.
- Add a subtle shadow or background contrast so the dropdown reads as "floating
  above" the form rather than merging into it.

**Acceptance criteria:**
- [ ] Autocomplete suggestions never visually overlap the label or border of an
      adjacent field
- [ ] Suggestion list is clearly a dropdown (elevated/shadowed), not flush with the form

---

## Fix 5: Apply the 8pt spacing scale app-wide

**Screens:** All (starting with Project Details modal, which currently has uneven
dead space above/below the card)

**Problem:** Spacing appears inconsistent/arbitrary in places (e.g. the Project
Details modal has excess unbalanced space above and below the card on tall screens).

**Required change:**
- Audit spacing values across components; replace ad hoc pixel values with this
  fixed scale only: **4, 8, 12, 16, 24, 32, 48, 64** (px).
- Card internal padding: 16px. Gap between stacked cards/sections: 24px. Gap
  between closely related inline items (icon + label): 8px. Major section breaks:
  48px+.
- For modals like Project Details: center vertically with a consistent top/bottom
  margin from the 8pt scale rather than letting leftover space be arbitrary.

**Acceptance criteria:**
- [ ] No spacing value in the codebase falls outside the 4/8/12/16/24/32/48/64 scale
- [ ] Modal vertical centering feels balanced on both short and tall phone screens

---

## Final check before marking done
- [ ] No overlapping/clipped text or elements at 360–430px viewport width
- [ ] All spacing values are on the 8pt scale (4/8/12/16/24/32/48/64)
- [ ] Labs screen groups items by category with search — no 50-item flat grid remains
- [ ] Primary nav destinations are each clearly labeled or unambiguously iconed
- [ ] All tappable elements are ≥44×44pt with adequate spacing between them
- [ ] Fixed top/bottom bars respect `env(safe-area-inset-*)` in standalone/installed mode
