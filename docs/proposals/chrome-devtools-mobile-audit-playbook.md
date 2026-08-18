# Chrome DevTools Mobile Audit Playbook

**Purpose:** Provide a repeatable, evidence-first way to audit Stitch & Scale as a mobile-quality product before any implementation work is approved.

## Acknowledgement

This playbook is built around **[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)**, the tool currently being used to support the audit. It gives an agent a disciplined way to control and inspect Chrome, emulate mobile viewports, inspect DOM and computed styles, review console and network behavior, capture screenshots, and investigate performance. Its value here is not to replace human judgment; it is to make the evidence reproducible and the conversation with a coding agent more precise.

> Chrome DevTools MCP is an inspection instrument, not a permission to modify the product. The audit must remain read-only until a separate implementation task is explicitly certified.

## Recommended inspection setup

Launch the public deployment in an isolated Chrome session with a **390×844 CSS-pixel viewport**. Repeat the critical checks at 320×568, 360×800, and 430×932. Keep the device toolbar active while navigating, and record the viewport, route, selected element, and scroll position for every screenshot or measurement. Use a real Chrome session only when the user has deliberately provided it and understands that browser content can be exposed to the inspection client.

The recommended Chrome DevTools MCP configuration for this audit is equivalent to the following session-only command:

```text
npx -y chrome-devtools-mcp@latest --headless --isolated --viewport=390x844 --no-usage-statistics --no-update-checks --experimental-devtools
```

Do not add this command, its package, or any MCP configuration to the application’s `package.json`. It is an audit connector, not a product dependency. Keep usage statistics and update checks disabled for this audit session when the environment supports those flags.

## Inspection sequence

Begin with a clean browser profile and open `/`. Record the first-launch state before dismissing onboarding. Test the skip action, each onboarding step, back behavior, sample-project path, start-from-scratch path, and a deep link into a project. Verify that the overlay traps focus, returns focus correctly, hides the background from assistive technology, and remains usable when text is enlarged or the software keyboard is present.

Next, inspect the dashboard with zero projects and with seeded projects. Test search, open, duplicate, delete, export, import, restore, recovery messaging, autosave status, and empty states. Measure the primary action’s position and size, card density, text line length, and whether the fixed shell creates a second scroll container.

Then inspect the new-project flow. Test incomplete fields, invalid numeric values, units, sizing standard selection, back navigation, persistence, and successful creation. Confirm that every option presented in the UI is supported by the canonical grading engine; no label may imply an implemented standard when the resolver falls back to another table.

For an existing project, inspect the workspace header, grading table, PDF/export route, all grouped tabs, every lab reachable from the navigation model, lazy-loading states, error states, sliders, forms, media cards, notes, and destructive actions. Record whether a user can reach late modules without relying on horizontal scrolling, whether active state is unmistakable, whether browser history works, and whether keyboard and screen-reader traversal follows the visual order.

Finally, inspect portfolio, settings, theme changes, language changes, onboarding reset, backup/restore, export completion, and offline behavior. Review Console and Network for uncaught errors, failed requests, noisy warnings, layout shifts, and unnecessary requests. Use the Performance panel when a slow route or large lazy-loaded panel suggests a user-visible delay.

## Evidence format

Every finding should use this structure:

| Field | Required content |
|---|---|
| Finding | A short, falsifiable issue statement. |
| Severity | P0 blocker, P1 high, P2 medium, or P3 polish. |
| Evidence | Route, viewport, selector or accessible name, computed dimension, screenshot, console/network record, or exact reproduction steps. |
| User impact | What becomes slower, confusing, unreachable, unsafe, or uncomfortable. |
| Recommendation | The smallest correction that addresses the root cause. |
| Verification | A test that proves the correction at mobile, desktop, keyboard, accessibility, and theme conditions where relevant. |

Separate observed facts from hypotheses. “The tab row overflows at 320px” is an observation. “Users will never find the last lab” is a hypothesis until reachability is tested. If a state cannot be reached, record the blocker instead of filling the gap with assumptions.

## Perfection pointers

The audit should look especially hard for desktop-first residue: fixed headers that compete with content, bottom bars that obscure actions, nested scroll regions, horizontal tab strips that hide essential destinations, cards that consume too much vertical space, weak active states, low-contrast secondary text, tiny icon controls, auto-dismissed feedback, and large headings that force the working surface below the fold.

It should also challenge the information architecture. More categories are not automatically better. A mobile user should know where they are, what the current group means, what the next action is, and how to return without memorizing a taxonomy. A group-first navigation model is acceptable only if every module remains discoverable, direct access and history are preserved, late modules are reachable, and the model works with a keyboard and screen reader.

Accessibility is part of product quality rather than a final compliance pass. Check meaningful headings, landmark structure, accessible names, selected/expanded/disabled states, focus visibility, modal focus trapping, contrast in both themes, color-independent status indicators, reduced motion, large text, keyboard access, and sufficient control size and spacing. Aim for the platform comfort target for important mobile controls; treat the WCAG 24×24 CSS-pixel target-size minimum as a floor, not the finish line.

The audit must also test honesty. Local-first, cloud sync, backup, restore, sizing standards, PDF export, autosave, and offline promises should match the actual implementation. If a capability is unavailable, the UI should explain that clearly without presenting a dead or misleading control.

## Handoff prompt for a coding agent

> Use the latest Chrome DevTools MCP-backed mobile audit as the source of truth. Fix only certified findings, in priority order. Preserve local-first persistence, localization, deep-link behavior, canonical grading-engine types, and the existing PDF renderer/export boundary. Do not add unrelated dependencies, analytics, watermarks, or backend services. For each change, state the user problem, evidence, files allowed to change, non-goals, responsive behavior, accessibility behavior, and verification matrix. Test at 320×568, 360×800, 390×844, 430×932, landscape, tablet, desktop, large text, keyboard navigation, reduced motion, light theme, and dark theme. Do not push an implementation until the relevant audit finding has been certified.

## References

[Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) documents the official inspection, emulation, debugging, screenshot, network, and performance capabilities used by this playbook.

[Apple Human Interface Guidelines: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) provides guidance on legibility, contrast, control sizing, spacing, alternative interactions, keyboard access, and reduced motion.

[WCAG 2.2 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) defines the minimum pointer-target size and spacing alternatives for accessible web controls.
