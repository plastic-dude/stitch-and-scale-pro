# Stitch & Scale

Professional knitwear pattern grading software — local-first, offline-capable, with publish-ready PDF exports across four professional templates.

## Run & Operate

- `pnpm --filter @workspace/stitch-and-scale run dev` — run the web app (managed via workflow)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Tailwind CSS v4 + tw-animate-css
- Routing: Wouter
- Animations: Framer Motion
- UI: Shadcn/ui components (Radix primitives)
- Fonts: Fraunces (serif) + Plus Jakarta Sans (sans)
- State: React Context + localStorage (no backend/DB — fully local-first)
- PDF: Browser print engine (openPrintWindow) — no external PDF lib

## Where things live

- `artifacts/stitch-and-scale/src/` — app source
- `src/lib/grading-engine.ts` — **source of truth** for all data shapes (PatternProject, SectionMeasurement, Gauge, SizeKey, GradingKey, SIZE_STANDARDS)
- `src/context/SettingsContext.tsx` — app settings (unit, theme, sizingStandard, onboardingCompleted, pdfDefaults)
- `src/context/ProjectsContext.tsx` — project CRUD via localStorage reducer
- `src/lib/pdf/themes.ts` — four PDF templates: Minimal, Luxury, Craft, Technical
- `src/lib/pdf/renderer.ts` — HTML → print-ready PDF renderer
- `src/lib/sample-projects.ts` — seed data (Classic Crew Neck Sweater, Basic Ribbed Beanie)
- `src/pages/onboarding.tsx` — 7-step first-launch overlay
- `src/routes.tsx` — feature registry (add new pages here)

## Architecture decisions

- **Local-first, no server**: All data lives in localStorage under key `stitch-and-scale-v1` (projects) and `stitch-and-scale-settings-v1` (settings). No backend needed.
- **Onboarding is an overlay**, not a route — rendered from App.tsx based on `settings.onboardingCompleted`. Reset via Settings → Restart Onboarding.
- **Sizing standard field** (`sizingStandard`) is additive on SettingsContext; only CYC is selectable today, others shown as "coming soon" in the onboarding UI.
- **Sample projects** are seeded only when the user clicks "Open Sample Project" in onboarding step 6, never silently. IDs are stable (`sample-crew-neck-sweater`, `sample-basic-beanie`).
- **PDF system** (Replit B's territory): `src/lib/pdf/` — do not modify. Four templates: minimal, luxury, craft, technical.
- **New Project Wizard** (3-step, extends at step 1 with sizing standard indicator) — do NOT rebuild into a longer wizard; extend additively only.

## Product

- Dashboard: browse and search all knitwear pattern projects
- New Project Wizard: 3-step flow (name/author → base size → gauge)
- Project Workspace: add sections + measurements, full grading table view
- PDF Export: four print-ready templates with accent color overrides
- Settings: unit, appearance, onboarding restart, data export/import
- First-launch Onboarding: 7-step guided setup (welcome → philosophy → sizing → units → workspace tour → sample project offer → completion)

## User preferences

_Populate as you build._

## Gotchas

- Any new data shape must conform to types in `grading-engine.ts` exactly — it is the single source of truth.
- `stitch-and-scale-settings-v1` uses deep-merge on load so new fields always get defaults — safe to add fields additively.
- When extending SettingsContext, call out the change explicitly since the file may be touched across sessions.
- Do NOT touch `src/lib/pdf/` (Replit B territory) or `project-workspace.tsx`'s Export button hook.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
