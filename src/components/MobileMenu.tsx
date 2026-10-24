import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import useLockBodyScroll from '@/hooks/useLockBodyScroll'
import TopbarAuth from './TopbarAuth'

export type MobileNavLink = {
  href: string
  label: string
  external?: boolean
}

type MobileMenuProps = {
  open: boolean
  onClose: () => void
  links: MobileNavLink[]
  isActive: (href: string) => boolean
  bookingUrl: string
}

const subscribeToHydration = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

export default function MobileMenu({ open, onClose, links, isActive, bookingUrl }: MobileMenuProps) {
  const mounted = useSyncExternalStore(subscribeToHydration, clientSnapshot, serverSnapshot)
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open || !mounted) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]') ?? [])
    focusable()[0]?.focus({ preventScroll: true })
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const controls = focusable()
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus({ preventScroll: true })
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previousFocus?.focus({ preventScroll: true })
    }
  }, [open, onClose, mounted])

  useLockBodyScroll(open)

  const filteredLinks = useMemo(
    () => {
      const featuredPaths = ['/train-program', '/marriage-workshop']
      const availableLinks = links.filter((item) => item.href !== bookingUrl)
      return [
        ...featuredPaths.flatMap((href) => availableLinks.filter((item) => item.href === href)),
        ...availableLinks.filter((item) => !featuredPaths.includes(item.href)),
      ]
    },
    [links, bookingUrl],
  )

  const navItems = useMemo(
    () =>
      filteredLinks.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`mobile-menu-link${isActive(item.href) ? ' is-active' : ''}`}
          onClick={onClose}
          aria-current={isActive(item.href) ? 'page' : undefined}
          target={item.external ? '_blank' : undefined}
          rel={item.external ? 'noopener noreferrer' : undefined}
        >
          {item.label}
        </Link>
      )),
    [filteredLinks, isActive, onClose],
  )

  if (!mounted) return null

  return createPortal(
    <div
      className={`mobile-menu-root${open ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="القائمة الجوال"
      aria-hidden={!open}
      inert={!open}
    >
      <div className="mobile-menu-backdrop" onClick={onClose} />
      <aside ref={panelRef} className="mobile-menu-panel" dir="rtl">
        <div className="mobile-menu-header">
          <button type="button" className="mobile-menu-close" onClick={onClose} aria-label="إغلاق القائمة">
            <XMarkIcon className="mobile-menu-close-icon" />
          </button>
          <span className="mobile-menu-title">القائمة</span>
        </div>

        <nav className="mobile-menu-nav" aria-label="روابط الجوال">
          {navItems}
        </nav>

        <div className="mobile-menu-cta">
          <Link
            href={bookingUrl}
            className="btn mobile-menu-btn mobile-menu-btn-booking"
            onClick={onClose}
          >
            <CalendarDaysIcon className="mobile-menu-btn-icon" aria-hidden />
            <span>حجز الجلسة الآن</span>
          </Link>
          <Link href="/products" className="btn mobile-menu-btn secondary" onClick={onClose}>
            المكتبة الرقمية
          </Link>
        </div>

        <TopbarAuth variant="mobile" onNavigate={onClose} />
      </aside>
    </div>,
    document.body,
  )
}
