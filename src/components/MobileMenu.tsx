import { useEffect, useMemo, useState } from 'react'
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
  assistantUrl: string
}

export default function MobileMenu({ open, onClose, links, isActive, bookingUrl, assistantUrl }: MobileMenuProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const node = document.createElement('div')
    node.setAttribute('data-mobile-menu-root', '')
    document.body.appendChild(node)
    setContainer(node)
    return () => {
      document.body.removeChild(node)
      setContainer(null)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useLockBodyScroll(open)

  const filteredLinks = useMemo(
    () => links.filter((item) => item.href !== bookingUrl && item.href !== assistantUrl),
    [links, bookingUrl, assistantUrl],
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

  if (!container) return null

  return createPortal(
    <div className={`mobile-menu-root${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="القائمة الجوال">
      <div className="mobile-menu-backdrop" onClick={onClose} />
      <aside className="mobile-menu-panel" dir="rtl">
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
            href={assistantUrl}
            className="btn btn-primary mobile-menu-btn"
            onClick={onClose}
          >
            <span>مساعد الذكاء الاصطناعي</span>
          </Link>
          <Link
            href={bookingUrl}
            className="btn btn-primary mobile-menu-btn"
            onClick={onClose}
          >
            <CalendarDaysIcon className="mobile-menu-btn-icon" aria-hidden />
            <span>حجز الجلسة</span>
          </Link>
          <Link href="/products" className="btn mobile-menu-btn secondary" onClick={onClose}>
            المكتبة الرقمية
          </Link>
        </div>

        <TopbarAuth variant="mobile" onNavigate={onClose} />
      </aside>
    </div>,
    container,
  )
}
