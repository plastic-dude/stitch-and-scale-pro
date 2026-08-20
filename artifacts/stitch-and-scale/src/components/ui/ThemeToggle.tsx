import { Sun, Moon, Monitor } from 'lucide-react'
import { useSettingsStore, type ThemePreference } from '@/store/settings.store'

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

interface ThemeToggleProps {
  /** 'compact' = icon-only pill for the header. 'full' = icon + label for Settings. */
  variant?: 'compact' | 'full'
}

export function ThemeToggle({ variant = 'full' }: ThemeToggleProps) {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center rounded-lg border border-line bg-canvas-2 p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition-all sm:py-1.5 ${
              active ? 'bg-surface text-ink shadow-soft' : 'text-ink-faint hover:text-ink-soft'
            }`}
          >
            <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            {variant === 'full' && <span className="hidden sm:inline">{label}</span>}
          </button>
        )
      })}
    </div>
  )
}
