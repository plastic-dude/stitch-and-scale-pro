/**
 * FEATURE REGISTRY
 * ─────────────────────────────────────────────────────────────────
 * To add a new feature:
 *  1. Create your page in src/pages/<feature-name>.tsx
 *  2. Import it below and add a route entry to ROUTES
 *  3. Add a nav link in src/components/shell.tsx if needed
 *
 * Route shape:
 *   { path: string; component: React.ComponentType<any>; navLabel?: string }
 * ─────────────────────────────────────────────────────────────────
 */

import { lazy } from 'react';

// Route pages are lazy-loaded so a mobile entry point does not download the
// entire workspace and all export/settings surfaces before the user asks for
// them. Each page still keeps its default export contract.
const Dashboard = lazy(() => import('@/pages/dashboard'));
const NewProjectWizard = lazy(() => import('@/pages/new-project'));
const ProjectWorkspace = lazy(() => import('@/pages/project-workspace'));
const ProjectGrading = lazy(() => import('@/pages/project-grading'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const ProjectPdf = lazy(() => import('@/pages/project-pdf'));
const ImportCSV = lazy(() => import('@/pages/import-csv'));
const Portfolio = lazy(() => import('@/pages/portfolio'));

const NotFound = lazy(() => import('@/pages/not-found'));

// ── Core routes (always present) ─────────────────────────────────
export const ROUTES = [
  { path: '/',                        component: Dashboard        },
  { path: '/project/new',             component: NewProjectWizard },
  { path: '/project/import-csv',      component: ImportCSV        },
  { path: '/project/:id/grading',     component: ProjectGrading   },
  { path: '/project/:id',             component: ProjectWorkspace },
  { path: '/settings',                component: SettingsPage     },

  // ── Feature routes — added here by each session / PR ─────────
  // Session 7 — Release Portfolio dashboard (catalogue-level launch planning)
  { path: '/portfolio',                component: Portfolio          },
  // Replit B — PDF Template Rendering Engine
  { path: '/project/:id/pdf',         component: ProjectPdf       },
  // ─────────────────────────────────────────────────────────────
] as const;

export { NotFound };
