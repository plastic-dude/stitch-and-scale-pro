import * as React from "react"
import { Link, useLocation } from "wouter"
import { Settings, Plus, BookOpen, ShieldCheck, X, Package } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useProjects } from "@/context/ProjectsContext"
import { AutosaveIndicator } from "@/components/autosave-indicator"
import { StorageBadge } from "@/components/storage-badge"
import { InstallBanner } from "@/components/install-banner"
import { useSettings } from "@/context/SettingsContext"
function RecoveryBanner() {
  const { recovered, dismissRecovery } = useProjects()
  const { t } = useSettings()
  if (!recovered) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4"
    >
      <div className="flex items-center gap-3 bg-secondary/40 border border-border rounded-lg px-4 py-2.5 text-sm">
        <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
        <p className="flex-1 text-foreground/80">
          <span className="font-medium text-foreground">{t('nav.recoveryTitle')}</span>{' '}
          {t('nav.recoveryDescription')}
        </p>
        <button
          onClick={dismissRecovery}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t('nav.dismiss')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const { saveStatus } = useProjects()
  const { t } = useSettings()
  const projectsLabel = t('nav.projects')
  const settingsLabel = t('nav.settings')
  const [justExported, setJustExported] = React.useState(false)

  React.useEffect(() => {
    const onExported = () => setJustExported(true)
    window.addEventListener('stitch-and-scale:pattern-exported', onExported)
    return () => window.removeEventListener('stitch-and-scale:pattern-exported', onExported)
  }, [])

  return (
    <div className="min-h-[100dvh] min-w-0 flex flex-col bg-background text-foreground transition-colors duration-200">
      <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline group">
            <img
              src="/favicon.png"
              alt="Stitch & Scale"
              className="w-8 h-8 rounded-lg object-cover transition-transform group-hover:scale-105 shadow-sm"
            />
            <span className="font-serif font-bold text-xl tracking-tight hidden sm:inline-block">
              Stitch & Scale
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-2">
            <StorageBadge />
            <AutosaveIndicator status={saveStatus} />
          </div>
          
          <nav className="flex items-center gap-1 sm:gap-4">
            {/* CHK-129: at phone widths the labels hide (hidden md:inline) and the
                link's p-2 hit area is 36×36px — below the 44×44px touch-target
                minimum (QA LIVE-004). min-h-11/min-w-11 raise the hit area
                without widening the visible icon (same pattern as CHK-123). */}
            <Link href="/" aria-label={projectsLabel} title={projectsLabel} aria-current={location === '/' ? 'page' : undefined} className={`min-h-11 min-w-11 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 ${location === '/' ? 'bg-secondary/50' : ''}`}>
              <BookOpen className="w-5 h-5" />
              <span className="hidden md:inline text-sm font-medium">{projectsLabel}</span>
            </Link>
            <Link href="/portfolio" aria-label={t('nav.portfolio')} title={t('nav.portfolio')} aria-current={location === '/portfolio' ? 'page' : undefined} className={`min-h-11 min-w-11 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 ${location === '/portfolio' ? 'bg-secondary/50' : ''}`}>
              <Package className="w-5 h-5" />
              <span className="hidden md:inline text-sm font-medium">{t('nav.portfolio')}</span>
            </Link>
            <Link href="/settings" aria-label={settingsLabel} title={settingsLabel} aria-current={location === '/settings' ? 'page' : undefined} className={`min-h-11 min-w-11 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 ${location === '/settings' ? 'bg-secondary/50' : ''}`}>
              <Settings className="w-5 h-5" />
              <span className="hidden md:inline text-sm font-medium">{settingsLabel}</span>
            </Link>
            
            <div className="w-px h-6 bg-border mx-2"></div>
            
            {/* CHK-129: at phone widths this is icon-only (label hidden <sm) —
                h-9 is 36px, below the 44×44px minimum. min-h-11 raises it. */}
            <Link href="/project/new" aria-label={t('nav.newProject')} title={t('nav.newProject')} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 min-h-11 px-4 py-2 gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.newProject')}</span>
            </Link>
          </nav>
        </div>
      </header>

      <AnimatePresence>
        <RecoveryBanner />
      </AnimatePresence>

      {justExported && <InstallBanner trigger="export" />}

      <main className="flex-1 flex flex-col min-w-0 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col min-w-0"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <footer className="border-t py-6 md:py-0 md:h-16 flex items-center justify-center text-sm text-muted-foreground">
        <p>{t('nav.footerDescription')}</p>
      </footer>
    </div>
  )
}
