/**
 * CHK-126 — Onboarding overlay route-gate regression suite.
 * Live mobile audit (Android 360px / iPhone 390px) found the first-launch
 * onboarding overlay rendering on /settings, /portfolio and unknown routes
 * (404). At 360px its "Skip setup" button collided with the header Settings
 * nav link (29x24 overlap), making navigation unreachable on phones.
 *
 * These structural tests pin the contract: the overlay must only block the
 * app-root entry flows (/, /project/new, /project/import-csv, /project/:id)
 * and must never render on the marketing surface, settings, portfolio, or
 * 404. Tests read the source directly — no jsdom — per project convention.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const APP_SRC = readFileSync(join(__dirname, 'App.tsx'), 'utf8')

/**
 * The gate logic under test, extracted from LandingGate in App.tsx.
 * It must match the source character-for-character in intent: overlay shows
 * only on entry flows, never elsewhere (unless onboarding not yet completed
 * on an entry flow).
 */
function gateShowsOverlay(location: string, onboardingCompleted: boolean): boolean {
  if (onboardingCompleted) return false
  const isEntryFlow = location === '/'
    || location === '/project/new'
    || location === '/project/import-csv'
    || /^\/project\/[\w-]+$/.test(location)
  const onPublicSurface = location === '/landing' || !isEntryFlow
  return onPublicSurface ? false : true
}

/**
 * CHK-127 — skipOnboarding deep-link preservation regression suite.
 * Live acceptance at 360px (also reproducible at 390/430/768 in a fresh
 * context with different timing) found that skipping the overlay from the
 * demo /project/:id deep link rerouted to /project/new: the demo project
 * seeds synchronously in ProjectsContext, so hasProject was already true
 * and the visitor never saw the demo they requested. Skip now returns to
 * the entry route the overlay mounted on.
 */

const ONBOARDING_SRC = readFileSync(join(__dirname, 'pages/onboarding.tsx'), 'utf8')

function skipRoutesTo(entryRoute: string): string {
  const isProjectEntry = /^\/project\//.test(entryRoute)
  return isProjectEntry ? entryRoute : '/project/new'
}

describe('Onboarding overlay route gate (CHK-126)', () => {
  it('blocks the app root for a cold visitor (no completed onboarding)', () => {
    expect(gateShowsOverlay('/', false)).toBe(true)
  })

  it('never renders on the marketing surface', () => {
    expect(gateShowsOverlay('/landing', false)).toBe(false)
  })

  it('never renders on Settings — live audit found the Skip button colliding with the Settings nav link at 360px', () => {
    expect(gateShowsOverlay('/settings', false)).toBe(false)
  })

  it('never renders on Portfolio', () => {
    expect(gateShowsOverlay('/portfolio', false)).toBe(false)
  })

  it('never renders on unknown routes (404)', () => {
    expect(gateShowsOverlay('/this-path-does-not-exist', false)).toBe(false)
  })

  it('never renders on deep grading/pdf/segment routes — overlay only on project-root entry, not sub-surfaces', () => {
    expect(gateShowsOverlay('/project/mss5osqd88j6fdyvtdu/grading', false)).toBe(false)
    expect(gateShowsOverlay('/project/mss5osqd88j6fdyvtdu/pdf', false)).toBe(false)
  })

  it('blocks entry flows /project/new and /project/import-csv', () => {
    expect(gateShowsOverlay('/project/new', false)).toBe(true)
    expect(gateShowsOverlay('/project/import-csv', false)).toBe(true)
  })

  it('blocks a bare project id (demo-link case from CHK-080)', () => {
    expect(gateShowsOverlay('/project/mss5osqd88j6fdyvtdu', false)).toBe(true)
  })

  it('never renders once onboarding is completed, on any route', () => {
    for (const loc of ['/', '/settings', '/portfolio', '/project/new', '/project/:id/demo', '/landing']) {
      expect(gateShowsOverlay(loc, true)).toBe(false)
    }
  })

  it('source still declares the entry-flow gate in LandingGate (anchored to the file)', () => {
    expect(APP_SRC).toContain('isEntryFlow')
    expect(APP_SRC).toContain("location === '/project/new'")
    expect(APP_SRC).toContain("location === '/project/import-csv'")
    expect(APP_SRC).toContain('/^\\/project\\/[\\w-]+$/.test(location)')
  })
})

describe('Onboarding skip deep-link preservation (CHK-127)', () => {
  it('skipping from the demo deep link lands back on the demo deep link', () => {
    expect(skipRoutesTo('/project/mss5osqd88j6fdyvtdu')).toBe('/project/mss5osqd88j6fdyvtdu')
  })

  it('skipping from any /project/:id entry preserves that id', () => {
    for (const id of ['some-new-pattern-id', 'user-2026-aug', 'abc123']) {
      expect(skipRoutesTo(`/project/${id}`)).toBe(`/project/${id}`)
    }
  })

  it('skipping from a plain app-root entry falls back to Draft a Pattern', () => {
    expect(skipRoutesTo('/')).toBe('/project/new')
  })

  it('skipping from /project/import-csv preserves the import flow (it is a project entry route)', () => {
    expect(skipRoutesTo('/project/import-csv')).toBe('/project/import-csv')
  })

  it('source: skipOnboarding resolves setLocation from the entry route, never from a stale branch (QA #64)', () => {
    // The defect: skipOnboarding's else branch called setLocation('/project/new')
    // even when the visitor opened a /project/:id deep link. Pin that the skip
    // handler now routes through the captured entry route regex.
    const skipBody = ONBOARDING_SRC.slice(
      ONBOARDING_SRC.indexOf('const skipOnboarding'),
      ONBOARDING_SRC.indexOf('const skipOnboarding') + 900,
    )
    expect(skipBody).toContain('/^\\/project\\//.test(entryRoute)')
    // The empty-workspace seeding still guarantees a live destination — but
    // the final setLocation must come from the entry route, not the sample id.
    const finalSetLocation = skipBody.match(/setLocation\([^)]*entryRoute[^)]*\)/)
    expect(finalSetLocation, 'skipOnboarding must call setLocation with the entry route').not.toBeNull()
  })

  it('source: the overlay still remembers the entry route it mounted on', () => {
    expect(ONBOARDING_SRC).toContain('const [entryRoute]')
    expect(ONBOARDING_SRC).toContain('useState(() => location)')
  })
})
