"use client"

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'

type ThemeSpec = {
  id: ThemeId
  label: string
  type: 'light' | 'dark'
  colors: [string, string, string, string]
}

type ThemeId =
  | 'theme-l1'
  | 'theme-l2'
  | 'theme-l3'
  | 'theme-l4'
  | 'theme-d1'
  | 'theme-d2'
  | 'theme-d3'
  | 'theme-d4'

const STORAGE_KEY = 'fitrah-theme'

const THEMES: ThemeSpec[] = [
  {
    id: 'theme-l1',
    label: 'الاستراحة البنفسجية',
    type: 'light',
    colors: ['hsl(268 86% 64%)', 'hsl(205 90% 70%)', 'hsl(316 82% 70%)', 'hsl(346 85% 68%)'],
  },
  {
    id: 'theme-l2',
    label: 'نسيم البحر',
    type: 'light',
    colors: ['hsl(230 88% 64%)', 'hsl(203 90% 68%)', 'hsl(308 78% 70%)', 'hsl(350 84% 66%)'],
  },
  {
    id: 'theme-l3',
    label: 'ندى الورد',
    type: 'light',
    colors: ['hsl(322 72% 64%)', 'hsl(210 88% 70%)', 'hsl(312 80% 68%)', 'hsl(0 82% 68%)'],
  },
  {
    id: 'theme-l4',
    label: 'شفق أرجواني',
    type: 'light',
    colors: ['hsl(284 76% 64%)', 'hsl(208 84% 68%)', 'hsl(318 78% 68%)', 'hsl(354 80% 65%)'],
  },
  {
    id: 'theme-d1',
    label: 'ليل بنفسجي',
    type: 'dark',
    colors: ['hsl(275 82% 68%)', 'hsl(205 84% 72%)', 'hsl(318 78% 72%)', 'hsl(350 80% 70%)'],
  },
  {
    id: 'theme-d2',
    label: 'بحر ليلي',
    type: 'dark',
    colors: ['hsl(230 82% 64%)', 'hsl(198 86% 68%)', 'hsl(312 78% 68%)', 'hsl(354 82% 68%)'],
  },
  {
    id: 'theme-d3',
    label: 'ليلة وردية',
    type: 'dark',
    colors: ['hsl(318 84% 68%)', 'hsl(210 80% 70%)', 'hsl(322 86% 72%)', 'hsl(0 80% 68%)'],
  },
  {
    id: 'theme-d4',
    label: 'نيون بنفسجي',
    type: 'dark',
    colors: ['hsl(260 78% 68%)', 'hsl(200 86% 68%)', 'hsl(318 82% 72%)', 'hsl(348 78% 66%)'],
  },
]
const LIGHT_THEMES = THEMES.filter((theme) => theme.type === 'light')
const DARK_THEMES = THEMES.filter((theme) => theme.type === 'dark')


type ThemeSwitcherProps = {
  compact?: boolean
  onSelect?: () => void
}

export default function ThemeSwitcher({ compact = false, onSelect }: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<ThemeId>('theme-l1')
  const containerRef = useRef<HTMLDivElement>(null)

  const activeTheme = useMemo(() => THEMES.find((theme) => theme.id === active) ?? THEMES[0], [active])

  useEffect(() => {
    const root = document.documentElement
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeId | null
    const hasStored = stored && THEMES.some((theme) => theme.id === stored)

    if (hasStored) {
      setActive(stored as ThemeId)
      applyTheme(stored as ThemeId)
      return
    }

    const existing = THEMES.find((theme) => root.classList.contains(theme.id))
    if (existing) {
      setActive(existing.id)
      return
    }

    applyTheme('theme-l1')
  }, [])

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (containerRef.current.contains(event.target as Node)) return
      setOpen(false)
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const handleSelect = (theme: ThemeId) => {
    setActive(theme)
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
    setOpen(false)
    if (onSelect) onSelect()
  }

  const renderThemeButton = (theme: ThemeSpec) => {
    const isActive = theme.id === active
    return (
      <button
        key={theme.id}
        type="button"
        className={`theme-option${isActive ? ' is-active' : ''}`}
        data-theme-tone={theme.type}
        onClick={() => handleSelect(theme.id)}
        aria-pressed={isActive}
        aria-label={theme.label}
      >
        <span className="theme-option-meta">
          <span className="theme-option-title">{theme.label}</span>
          <span className="theme-option-hint">{theme.type === 'light' ? 'فاتح' : 'داكن'}</span>
        </span>
        <span className="theme-option-palette" aria-hidden>
          {theme.colors.map((color, index) => (
            <span
              key={`${theme.id}-color-${index}`}
              className="theme-option-chip"
              style={{ background: color }}
            />
          ))}
        </span>
        <span className="sr-only">{theme.type === 'light' ? 'سمة فاتحة' : 'سمة داكنة'}</span>
      </button>
    )
  }

  return (
    <div className={`theme-switcher${compact ? ' theme-switcher--compact' : ''}`} ref={containerRef}>
      <button
        type="button"
        className={`theme-trigger${open ? ' is-open' : ''}${compact ? ' theme-trigger--compact' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="تغيير ألوان الموقع"
      >
        {activeTheme.type === 'light' ? (
          <SunIcon aria-hidden className="theme-trigger-icon" />
        ) : (
          <MoonIcon aria-hidden className="theme-trigger-icon" />
        )}
        {!compact && <span className="theme-trigger-label">المظهر</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.34, 0.66, 0.18, 1] }}
            className="theme-panel"
            role="dialog"
            aria-label="اختيار السمة اللونية"
          >
            <header className="theme-panel-head">
              <div>
                <p className="theme-panel-title">اختاري لوحة الألوان</p>
                <p className="theme-panel-sub">كل خيار متوافق مع القراءة والحركة اللطيفة</p>
              </div>
            </header>
            <div className="theme-sections">
              <section className="theme-section">
                <div className="theme-section-head">
                  <SunIcon className="theme-section-icon" aria-hidden />
                  <span className="theme-section-title">الوضع الفاتح</span>
                </div>
                <div className="theme-section-list">
                  {LIGHT_THEMES.map(renderThemeButton)}
                </div>
              </section>
              <section className="theme-section">
                <div className="theme-section-head">
                  <MoonIcon className="theme-section-icon" aria-hidden />
                  <span className="theme-section-title">الوضع الليلي</span>
                </div>
                <div className="theme-section-list">
                  {DARK_THEMES.map(renderThemeButton)}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function applyTheme(theme: ThemeId) {
  const root = document.documentElement
  THEMES.forEach((item) => {
    if (item.id === theme) return
    root.classList.remove(item.id)
  })
  if (!root.classList.contains(theme)) root.classList.add(theme)
}
