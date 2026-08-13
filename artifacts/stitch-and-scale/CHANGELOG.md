# Changelog

All notable changes to Stitch & Scale are documented here.

## [0.10.0] — Stabilization & Trust Pass — 2026-08-08

### Added
- Custom Sizing Standard: a real, editable measurement chart alongside CYC, wired directly into the grading engine (not a UI-only toggle) — starts as an editable copy of CYC, one grading key at a time, so it's usable on a phone screen instead of a 117-cell grid.
- Armhole Depth as a new grading key, sourced from CYC's real published chart — closes the original audit's measurement-key gap and doubles as the standard reference point for yoke depth.
- Per-measurement rounding: Exact / Multiple of N / Even / Odd, replacing the old "multiple only" constraint.
- Dashboard project cards now show Draft or Graded status at a glance.
- Illustrated 404 page with real artwork, matching the app's brand identity.
- Persistent local-storage safety indicator with one-click backup, visible app-wide rather than buried in Settings.
- PWA install banner.

### Fixed
- **Data integrity:** the body-measurement table labeled "CYC" didn't actually match CYC's real published chart (e.g. Medium sleeve length was 31" against CYC's real 17" — not a rounding gap, an untraceable number). Reconciled directly against CYC's official chart, verified current as of this release.
- **Provenance:** a project's sizing standard is now locked in at creation. Previously, switching the global Sizing Standard setting silently re-graded every existing project, including ones already exported.
- Core app routing: Settings, New Project, and PDF export pages 404'd on direct navigation or refresh (missing SPA fallback).
- Measurement entry form closed after every single save, requiring a full re-open for each additional measurement in a section.
- "Save Measurement" gave no indication of why it was disabled; now states exactly what's missing.
- Import button gave no feedback while a file was being read, and had no error handler at all for a failed read.
- "Skip setup" remained clickable through the entire onboarding flow instead of only the first step.
- Disabled-button contrast measured 2.77:1 in light mode (WCAG AA wants 4.5:1); raised to a verified 4.74:1.
- Mobile viewport zoom-out bugs across the grading table, action button rows, and the Custom Standard chip selector — root cause was CSS overflow containers not isolating their layout width from the page; fixed with CSS containment.
- `maximum-scale=1` removed from the viewport meta tag — was blocking pinch-zoom entirely, a real accessibility barrier, not just a cosmetic setting.
- Icon-only nav controls (Settings, New Project, storage-warning dismiss) had no accessible label once their text hid on mobile.
- PDF export: placeholder colored-square logo replaced with the real logo on all four cover themes; larger/sharper type; a blank page that appeared after the cover; deterministic page sizing across devices.

### Changed
- Internal/technical phrasing removed from user-facing copy ("MVP version," "upgraded storage engine") in favor of plain language a designer would actually use.
- Onboarding's Sizing Standard step: Custom is now correctly shown as available (was previously mislabeled "Coming soon" after already shipping); the six still-unavailable international standards are collapsed behind a "Show more" toggle instead of all six sitting visible next to the two real options.

### Notes
- Real international standards (UK, EN13402, etc.) remain unavailable — researched directly rather than assumed, and there isn't a CYC-equivalent official source to build against yet for most of them. Documented in `onboarding.tsx` for whoever picks this up next.
- Construction-aware shaping (raglan increases, set-in sleeve curves) is not yet supported — the engine grades flat body measurements correctly, but doesn't compute shaping sequences. Real gap, tracked separately, not attempted in this release.

## [0.9.0] — MVP Closed Beta — 2026-07-30

### Added
- Core local-first grading engine (Craft Yarn Council standard), IndexedDB-backed persistence with automatic migration from legacy localStorage data.
- Full PDF export system: four themed publication templates (Minimal, Luxury, Craft/Cozy, Technical/Blueprint), each with a distinct cover layout, shared component library, and a fixed diagonal "Stitch & Scale" microprint watermark baked into every export.
- Smart export dialog: intelligent default filenames, persisted custom naming preferences, template picker with live preview.
- First-launch onboarding flow: philosophy/trust screens, sizing-standard introduction, guided workspace tour, sample project.
- Sizing Standard setting: Craft Yarn Council is the only selectable standard in this release; architecture is built to support additional standards without a rewrite.
- Sample projects seeded for new users.
- Dashboard, project workspace, grading tables, and settings — all local-first, no account required.

### Fixed
- Defensive rendering for pattern cards with missing/legacy gauge data — previously caused a silent render crash that left the dashboard grid blank while still showing a correct project count.
- Removed all "EMLUX" co-branding from PDF export templates (cover taglines, footers) — the exported pattern is the designer's product; Stitch & Scale is now the sole, fixed brand mark across every template.
- Mobile storage migration to IndexedDB for reliability with larger project libraries.

### Notes
- Authentication, cloud sync, marketplace, and multiple user-facing grading standards are intentionally out of scope for this release. See project roadmap.
