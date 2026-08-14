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

import Dashboard from '@/pages/dashboard';
import NewProjectWizard from '@/pages/new-project';
import ProjectWorkspace from '@/pages/project-workspace';
import ProjectGrading from '@/pages/project-grading';
import SettingsPage from '@/pages/settings';
import NotFound from '@/pages/not-found';
// ── Feature pages ────────────────────────────────────────────────
import ProjectPdf from '@/pages/project-pdf';
import ImportCSV from '@/pages/import-csv';
import Portfolio from '@/pages/portfolio';

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
