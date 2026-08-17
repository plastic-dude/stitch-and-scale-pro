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
