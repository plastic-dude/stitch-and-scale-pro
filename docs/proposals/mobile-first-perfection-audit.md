# Mobile-First Perfection Audit Discussion

**Status:** Discussion proposal; audit-only, no implementation included.

**Scope:** Stitch & Scale should feel like a calm, native-quality mobile tool on iOS and Android while remaining excellent on tablets and desktop. The mobile experience is the primary design constraint, not a reduced desktop layout.

## Why this discussion exists

The product already contains a substantial knitwear grading workflow, but the current experience risks presenting too much capability at once. The audit should therefore focus on the distance between “all features exist” and “a designer can confidently complete the next important task with one hand, without losing context.” The desired outcome is not visual decoration. It is a system that feels deliberate, legible, forgiving, and fast under real mobile conditions.

This document is intentionally a discussion anchor for the audit and for future coding-agent work. It does not authorize implementation, dependency changes, data migrations, or changes to the PDF system.

## Audit principles

The audit must start from the smallest practical viewport and then prove that the same information architecture scales upward. Test at 320×568, 360×800, 390×844, and 430×932 CSS pixels, followed by tablet, desktop, landscape, browser zoom, large text, reduced motion, keyboard navigation, and screen-reader semantics. Important controls should aim for the platform-comfort target of approximately 44×44 points, while WCAG 2.2’s minimum target-size requirement remains a floor rather than a design aspiration.

> The standard for “perfect” is not that every control fits. The standard is that every important task remains discoverable, reachable, reversible, and comfortable when the device is narrow, the user is distracted, and the content is larger than expected.

The audit must separate observed evidence from hypotheses. Every finding should name the route or flow, the reproduction condition, the visible or programmatic evidence, the user impact, the proposed correction, and the verification test. A recommendation that cannot be tied to a user task or a measurable failure should not be promoted to implementation priority.

## Areas requiring explicit scrutiny

| Area | Questions the audit must answer |
|---|---|
| Onboarding | Does the first launch explain the product without consuming the user’s attention budget? Can the user skip safely, return to a deep link, enlarge text, use a keyboard, and understand what will be saved locally? |
| Global shell | Is the current route obvious? Are the logo, back behavior, settings, autosave state, and primary action placed within comfortable thumb reach? Do fixed regions respect safe areas and keyboard resize? |
| Dashboard | Can a designer find, search, restore, duplicate, export, and delete a pattern without scanning a wall of cards? Are empty, loading, recovery, and error states equally intentional? |
| New project | Are name, author, base size, gauge, units, and sizing standard presented in an order that matches the user’s mental model? Does validation explain what to do next rather than merely reject input? |
| Workspace navigation | Can users reach every lab without a dense tab strip, hidden triggers, unexplained horizontal scrolling, or loss of current context? Does a group-first model preserve direct access, history, and keyboard/screen-reader semantics? |
| Workspace content | Do tables, calculators, sliders, notes, media cards, and long forms reflow without clipping or nested-scroll confusion? Is the next action visually dominant? |
| Portfolio and launch surfaces | Do pricing, bundle, readiness, and launch recommendations communicate confidence and uncertainty without turning the interface into a dense analytics dashboard on a phone? |
| Settings and data safety | Are units, appearance, language, onboarding reset, backup, restore, and local-storage warnings understandable and recoverable? Are destructive actions confirmed and reversible where possible? |
| Export and PDF | Is export discoverable, honest about what it creates, safe under slow or offline conditions, and clear about completion? Do preview, print, and downloaded outputs preserve the user’s selected template and values? |
| Accessibility | Are headings, landmarks, labels, selected/expanded/disabled states, focus order, focus visibility, contrast, motion preferences, and modal focus behavior correct in both themes? |
| Performance | Does the first meaningful screen stay lightweight? Do lazy-loaded labs show an intentional loading state? Are console errors, failed requests, layout shifts, and oversized chunks visible to users? |

## Avoid by default

Do not solve every mobile problem with another horizontal scroll region. Do not hide essential actions behind icon-only controls, hover behavior, unlabeled menus, or a second navigation system whose relationship to the first is unclear. Do not use tiny text to fit more information, auto-dismiss important feedback before it can be understood, rely on color alone for status, or present unsupported standards and capabilities as if they are functional. Do not replace established localization, deep-link, persistence, or accessibility behavior merely to achieve a shorter component.

Do not add a dependency, analytics package, watermark, generated asset, backend service, or design-system rewrite as part of the audit. Do not touch `src/lib/pdf/` or alter the existing export hook without a separately approved implementation task. Treat `grading-engine.ts` as the source of truth for project data and sizing behavior.

## Evidence and acceptance bar

A future implementation agent should receive findings in priority order rather than a broad wish list. Each accepted change should include a narrow scope, the files it may touch, explicit non-goals, and a verification matrix covering mobile widths, keyboard and screen-reader behavior, light and dark themes, reduced motion, and desktop reflow. A change is not “done” because it looks better in one screenshot; it is done when the task is faster, the hierarchy is clearer, and no important route or capability becomes unreachable.

## Agent handoff prompt

> Audit and improve Stitch & Scale as a mobile-first product. Begin with the evidence in this document and the latest audit report. Do not add unrelated dependencies, watermarks, analytics, or backend services. Do not touch the PDF renderer or export hook unless explicitly authorized. Preserve local-first persistence, localization, deep links, and the canonical grading-engine data shapes. For each change, state the user problem, the smallest safe implementation, the files touched, the non-goals, and the verification steps. Test at 320×568, 360×800, 390×844, 430×932, tablet, desktop, landscape, large text, keyboard navigation, reduced motion, and both themes. Do not push an implementation until the audit finding has been certified.

## Reference benchmarks

[Apple Human Interface Guidelines: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) provides guidance on legibility, contrast, control sizing, spacing, alternative interactions, keyboard access, and reduced motion. [WCAG 2.2 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) defines the 24×24 CSS-pixel minimum or spacing alternative; important mobile controls should be evaluated against the stricter comfort target rather than only the minimum conformance floor. The [Chrome DevTools MCP project](https://github.com/ChromeDevTools/chrome-devtools-mcp) documents live Chrome inspection, emulation, debugging, screenshots, network inspection, and performance analysis for evidence collection.
