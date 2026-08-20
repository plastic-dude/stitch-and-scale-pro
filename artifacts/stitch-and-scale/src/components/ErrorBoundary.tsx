import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Gracefully catches any uncaught React render errors and shows a
 * recovery screen instead of a blank white page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
          <div className="max-w-md">
            <p className="font-display text-5xl font-bold text-coral">!</p>
            <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
              Something went wrong
            </h1>
            <p className="mt-3 text-ink-soft">
              An unexpected error occurred. Your saved patterns are safe in your browser.
              You can try again or start fresh.
            </p>
            {this.state.error && (
              <details className="mt-4 rounded-lg border border-line bg-surface/50 p-3 text-left text-xs">
                <summary className="cursor-pointer font-medium text-ink">Error details</summary>
                <pre className="mt-2 overflow-auto text-ink-soft">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary px-5 py-2.5 text-sm"
              >
                Reload page
              </button>
              <Link to="/grader" className="btn-primary px-5 py-2.5 text-sm">
                Start new pattern
              </Link>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
