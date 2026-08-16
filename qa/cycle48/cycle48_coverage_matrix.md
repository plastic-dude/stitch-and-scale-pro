# Cycle 48 Fresh QA Coverage Matrix

## Repository and baseline

| Area | Coverage |
|---|---|
| Commit range | `d7b37f4..b7781f1` — CHK-095 through current i18n/branding changes |
| Branch safety | Test on local `main` at `origin/main`; deliver only on a `qa/` branch; never modify `src/` |
| Baseline | `pnpm run typecheck`, full Vitest suite, production build, dev-server HTTP 200 |
| State reset | Fresh Playwright browser context per persona and sweep; clear app localStorage, IndexedDB, cookies, and session state before each isolated scenario |

## Routes and core journeys

| Surface | Required checks |
|---|---|
| `/landing` | Hero, navigation, demo links, Emlux attribution, copy-link action, footer, email capture, deep-link behavior |
| `/` | Onboarding gate, first-run language detection, seven onboarding steps, skip/restart behavior |
| `/project/new` | Three-step wizard, empty/invalid/overlong/special-character input, back/next/create/cancel, double-submit, refresh/back recovery |
| `/project/import-csv` | Valid CSV, malformed CSV, empty file, duplicate import, cancel, error recovery, local persistence |
| `/project/:id` | Workspace shell, all registry tabs, sections CRUD, measurement editing, persisted settings, refresh/deep-link |
| `/project/:id/grading` | Arithmetic spot checks, table rendering, copy TSV, CSV download, unit changes |
| `/project/:id/pdf` | Four templates, theme/accent, include switches, trigger/spinner behavior, no overclaim about headless print |
| `/portfolio` | Empty/populated states, search/navigation, project links |
| `/settings` | Units, light/dark/system, all language options, sizing standard, custom grading values, backup export/import, storage health, restart onboarding |
| Unknown route | Not-found view, recovery link, browser back/forward |

## Themes, languages, devices, and browser modes

| Dimension | Matrix |
|---|---|
| Theme | Explicit light, explicit dark, system-light, system-dark; verify persistence after refresh and route changes |
| Languages | English (`en`), German (`de`), French (`fr`), Spanish (`es`), Portuguese (`pt`); first-run detection for representative browser language tags and unsupported fallback to English |
| Viewports | 375×812 one-thumb mobile, 430×932 large mobile, 768×1024 tablet, 1280×900 desktop, 1440×1000 wide desktop |
| Accessibility modes | Keyboard-only, visible focus, 200% zoom, prefers-reduced-motion, screen-reader semantic checks, contrast sampling |
| Network/state | Offline reload, delayed storage, empty storage, malformed JSON, missing project, refresh during lazy tab load |

## Workspace tabs

Activate every live `TAB_REGISTRY` entry and assert: trigger becomes active, panel mounts, panel is not blank/error, no console exception, no failed chunk request, and return navigation works. Deep-check representative rich tabs from design, fit, pricing, launch, channels, and business groups with input changes and persistence.

## Seven-pass audit

1. Functional stress: empty/invalid/duplicate submit, back/refresh, autofill, resize mid-flow, deep links.
2. Usability: Nielsen heuristic score per key journey step.
3. Visual: computed spacing/grid, touch targets, responsive overflow, hierarchy, contrast, theme parity.
4. Accessibility: keyboard order, focus, headings, labels, alt text, 200% zoom, reduced motion.
5. Performance: navigation timing, LCP/INP/CLS where observable, lazy chunk failures, lab-only caveat.
6. Resilience: offline and malformed-storage recovery, no endless spinners, failed optional dependency behavior.
7. Dark patterns: roach motel, confirmshaming, forced continuity, consent asymmetry, hidden costs, nagging, misleading attribution.

## Isolated personas

Run fresh contexts for: first-time high-intent visitor; impatient power user; low-vision keyboard-only user; mobile one-thumb user on a poor connection; skeptical/adversarial visitor; non-native language user. Persona observations are leads until independently reproduced.

## Evidence rule

Every candidate finding requires two independent reproductions with distinct screenshots. Reports must distinguish confirmed defects, low-confidence leads, and test-fixture/tool artifacts. Before delivery, verify screenshot links, issue text, commit range, branch, test counts, and all claims against saved evidence.

## Planned evidence naming

Screenshots go under `qa/cycle48/` on the QA branch, with distinct `before` and `after` files for every key interaction and theme/locale/device combination used as evidence.

## Explicit omissions to avoid

Do not claim every language is fully translated unless all user-facing surfaces are verified. Do not claim accessibility conformance from spot checks. Do not claim production performance from a local lab. Do not treat a failed automation action as an app defect. Do not reopen unchanged known issues.

**Status:** Matrix created before browser execution; results are intentionally blank until observed.

**Sources:** `QA_PLAYBOOK.md`, `SKILLS_NEW_ABILITIES.md`, current `routes.tsx`, `SettingsContext.tsx`, and `i18n.ts`.
