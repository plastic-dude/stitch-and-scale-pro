/**
 * Skip-to-content link for keyboard and screen-reader users.
 * Renders off-screen by default, appears on focus.
 * WCAG 2.1 AA compliant.
 */
export function SkipNav() {
  return (
    <a
      href="#main-content"
      className="fixed left-4 top-4 z-[200] -translate-y-20 rounded-lg bg-coral px-4 py-2 font-semibold text-canvas shadow-lift transition-transform focus:translate-y-0"
    >
      Skip to main content
    </a>
  )
}
