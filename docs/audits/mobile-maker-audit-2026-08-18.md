# Mobile Maker Audit — Local Preview

## Scope

The Vercel preview was inaccessible behind a Vercel login wall, and the configured Chrome DevTools MCP session failed to create a browser window after three attempts. Per the standing authorization, the audit continued against the local Vite preview using sandbox Chromium screenshots only; no public deployment was modified.

## Initial visual findings at 390×844

The first-load onboarding screen renders as a dark, polished mobile surface with a clear progress indicator, skip action, large welcome heading, concise value propositions, and a sticky bottom action row. The primary `Begin` control is visually prominent and comfortably sized. The content is readable and the four commitments are grouped in a scannable card.

The main concerns are that the heading wraps into two lines with a large vertical footprint, the scrollbar is visibly present at the right edge, and the sticky footer sits close to the bottom viewport boundary. The `Back` control is visually low-contrast while disabled, which is acceptable if it is truly disabled but should be verified semantically and by keyboard. The audit still needs to test smaller portrait sizes, landscape, keyboard focus, reduced motion, theme switching, and post-onboarding workspace routes.

## Capture notes

- A first screenshot was blank because the attempted duplicate dev server failed on port 5000 while an existing Vite process was already serving the branch.
- A second capture with a virtual-time budget hydrated the React app correctly and showed the onboarding surface.
- The public Vercel preview URL from PR #71 returned the Vercel login wall rather than the application.

## Additional viewport findings

At **320×568**, the onboarding content is materially cramped. The progress and skip controls remain visible, but the first commitment card begins at the bottom edge behind the sticky footer, while two vertical scrollbar tracks are visible on the right side. The footer is fixed over content without an obvious bottom-content affordance, making the first card feel clipped rather than intentionally scrollable. This is a high-priority small-screen issue.

At **844×390 landscape**, the shell adapts to a compact header with the wordmark, but the main content is vertically clipped by the sticky footer. The heading is visible, while the supporting paragraph is cut by the footer and the page exposes two right-side scrollbar tracks. Landscape needs a dedicated short-height layout or a footer that participates in flow after the content rather than covering it.

At **360×800**, the four commitments are readable and the primary button remains reachable, but the lower explanatory text is pressed against the fixed footer and the right edge still shows duplicated scrollbar tracks. The visible content ends at the footer boundary, so the user cannot confidently tell whether more content remains.

At **430×932**, the layout has comfortable width and the card hierarchy is strong. The footer is visually separated, but the content still leaves a large blank lower region and the scrollbar remains visible. This size is acceptable visually but should share the same single-scroll-container and safe-area behavior as the smaller layouts.

## Cross-size conclusion

The dominant defect is not typography; it is **scroll ownership and footer coverage**. The onboarding route appears to have nested scroll containers, producing duplicate scrollbars and allowing the fixed action footer to cover content at 320px and in landscape. The highest-leverage fix is to establish one vertical scroll owner, add bottom safe-area padding equal to the footer height, and switch to a short-height landscape layout that keeps the primary action visible without covering the explanation.

## Post-fix verification

The onboarding shell was updated to lock document and body scrolling while the dialog is mounted, constrain the content area with `min-h-0`, use `overscroll-contain`, and add safe-area-aware bottom padding. At **320×568**, the duplicate outer scrollbar is gone; one intentional content scrollbar remains. The footer still occupies a large portion of the short viewport, but the inner content now has reserved bottom clearance and can be scrolled without competing page scroll.

At **844×390 landscape**, the duplicate scrollbar is also gone and the action footer remains visible. The short-height composition still presents only the upper portion of the explanatory content, so a later refinement could use a dedicated landscape step layout, but the severe scroll-owner defect is resolved without changing step behavior or focus-trap logic.

## Workspace and new-project findings at 390×844

The completed-onboarding dashboard has no horizontal overflow and the primary empty-state actions are visually clear. The shell’s Projects, Portfolio, Settings, and New Project controls meet the measured 44px navigation target. The local-storage notice is useful but visually dominates the empty dashboard and its dismiss control is below the measured 44px target; the notice should either use a 44px dismiss hit area or a shared accessible alert pattern.

The new-project route also has no horizontal overflow. Pattern name and designer fields are 50px high and the Cancel action is 44px, but the disabled Next control measures only 38px high with a 36px minimum. Even when disabled, the primary action should preserve a 44px hit area and communicate the missing-field reason. The form card is readable, though the sizing-standard note is small and low contrast relative to the main fields.

## Sample workspace and All Labs findings at 390×844

The sample workspace has no horizontal overflow and the visible section cards are touch-comfortable. The card hierarchy is clear, but the workspace presents six group buttons plus an All Labs drawer before the user reaches the actual task tabs. Category labels truncate with ellipses, which makes `Business & Community` and `Launch & Marketing` harder to identify on a phone.

The All Labs drawer is a useful escape hatch, but it exposes **79 labs** in a long single-column list. The screenshot shows strong vertical density and only the first group at once; the user must scan a large drawer to locate a specific tool. This supports retaining the drawer but adding search or a “recent/favorites” layer rather than relying on category scanning alone. The close control is visible, but its measured hit target should be checked against the shared 44px rule.

## Grading Lab and PDF export findings at 390×844

The Grading Lab is mathematically legible and the new Pattern QA summary appears directly below the verdict, which is the right information order. The mobile card is long and the KPI/table content requires scrolling, but the visible verdict is strong. The existing `Re-run lab` action and table should retain their current deliberate scroll behavior; no horizontal overflow was measured.

The export route has no horizontal overflow and the preflight status is present in the rendered text. The visible first viewport is dominated by four template cards and branding, while the actual preflight status and Export PDF button are below the fold. This is a workflow-order concern: a designer reaches the most important readiness decision only after scanning visual templates. The template cards are compact but their accent-color controls are tiny decorative buttons in the DOM (14px computed size), even though the surrounding cards are selectable. The filename field measures 36px high, below the app’s 44px mobile control convention. The upload-logo action is 66px high and safe.

The highest-leverage export refinements are to make preflight status visible before or adjacent to the template picker, enlarge the filename input to 44px, and ensure color-picking is exposed through a 44px trigger rather than a 14px button.

## Craft-business records findings

The Design Ledger is correctly project-scoped and now reads Receipt Lab data through `projectStorage`, preserving Receipt Lab as the sales source of truth. Its calculations distinguish recorded receipts/refunds from excluded quotes, derive monthly P&L, and export stable CSV rows. A hardening pass now refuses ambiguous substring attribution instead of assigning a sale to the first matching design.

At **390×844**, the ledger card is reachable from the All Labs drawer and its four tabs wrap without horizontal overflow. The description is long but readable, while the actual entry form begins below the fold; this is acceptable for a secondary lab provided tab focus and return position remain stable. Destructive controls and export/break-even actions now use 44px minimum hit areas. Non-English ledger locales no longer inherit English for cost entry, deletion, export, and break-even copy.

Remaining product gap: the ledger still does not represent sample location/return status, submissions, test-knit rounds, wholesale follow-up, invoices, or payment commitments. Those should be separate record types or linked operational tables in a later milestone, not overloaded into the existing expense schema.
