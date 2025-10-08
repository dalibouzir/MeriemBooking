"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Bars3Icon, CalendarDaysIcon, XMarkIcon } from '@heroicons/react/24/outline'
import ThemeSwitcher from './ThemeSwitcher'
import TopbarAuth from './TopbarAuth'

type NavLink = {
  href: string
  label: string
  external?: boolean
}

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'الرئيسية' },
  { href: '/products', label: 'المتجر' },
  { href: '/free-call', label: 'جلسة تعريفية' },
  { href: '/download', label: 'تنزيلاتي' },
]

const BOOKING_URL = 'https://calendly.com/meriembouzir/30min'

export default function ScrollHideTopbar() {
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const lastY = useRef(0)
  const frame = useRef<number | null>(null)
  const hiddenRef = useRef(hidden)
  const pathname = usePathname()

  useEffect(() => {
    hiddenRef.current = hidden
  }, [hidden])

  const applyHidden = useCallback((next: boolean) => {
    setHidden((prev) => {
      if (prev === next) return prev
      hiddenRef.current = next
      return next
    })
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (frame.current !== null) return
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null
        const current = window.scrollY || 0
        const prev = lastY.current
        const delta = current - prev

        const HIDE_DELTA = 6
        const SHOW_DELTA = 4

        if (current < 80) {
          if (hiddenRef.current) applyHidden(false)
          lastY.current = current
          return
        }

        if (delta > HIDE_DELTA && !hiddenRef.current) {
          applyHidden(true)
        } else if (delta < -SHOW_DELTA && hiddenRef.current) {
          applyHidden(false)
        }

        lastY.current = current
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [applyHidden])

  useEffect(() => {
    if (!menuOpen) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const isActive = useCallback(
    (href: string) => {
      if (href === '/') return pathname === '/'
      return pathname.startsWith(href)
    },
    [pathname],
  )

  const navItems = useMemo(
    () =>
      NAV_LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`topbar-link${isActive(item.href) ? ' is-active' : ''}`}
          aria-current={isActive(item.href) ? 'page' : undefined}
        >
          {item.label}
        </Link>
      )),
    [isActive],
  )

  const handleMenuToggle = () => setMenuOpen((prev) => !prev)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={`topbar${hidden ? ' is-hidden' : ''}`}>
      <div className="container topbar-row">
        <div className="brand-col">
          <Link href="/" className="brand" aria-label="الرجوع للصفحة الرئيسية — فطرة الأمهات">
            <Image src="/logo/logo.png" alt="فطرة الأمهات" className="brand-logo" width={48} height={48} priority />
            <span className="brand-mark">Fittrah Moms</span>
          </Link>
          <button
            type="button"
            className="topbar-menu-toggle"
            onClick={handleMenuToggle}
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <XMarkIcon className="topbar-menu-icon" /> : <Bars3Icon className="topbar-menu-icon" />}
          </button>
        </div>

        <nav className="topbar-nav" aria-label="التنقل الرئيسي">
          {navItems}
        </nav>

        <div className="topbar-actions">
          <ThemeSwitcher />
          <Link
            href={BOOKING_URL}
            className="btn btn-nav btn-primary topbar-cta"
            aria-label="احجزي جلسة عبر Calendly"
            target="_blank"
            rel="noopener noreferrer"
          >
            <CalendarDaysIcon className="topbar-cta-icon" aria-hidden />
            <span>احجزي جلسة</span>
          </Link>
          <TopbarAuth />
        </div>
      </div>

      {menuOpen && (
        <div className="topbar-drawer is-open" onClick={closeMenu}>
          <div className="topbar-drawer-inner" onClick={(event) => event.stopPropagation()}>
            <div className="topbar-drawer-header">
              <span className="drawer-title">القائمة</span>
              <ThemeSwitcher compact onSelect={closeMenu} />
            </div>
            <nav className="topbar-drawer-nav" aria-label="روابط الجوال">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`topbar-drawer-link${isActive(item.href) ? ' is-active' : ''}`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="topbar-drawer-card">
              <div className="topbar-drawer-card-head">
                <p className="topbar-drawer-title">ابدئي في دقيقتين</p>
                <p className="topbar-drawer-note">احجزي جلسة عبر Calendly أو تسوقي الكتب والدورات الرقمية.</p>
              </div>
              <div className="topbar-drawer-buttons">
                <Link
                  href={BOOKING_URL}
                  className="btn btn-primary drawer-cta"
                  aria-label="احجزي جلسة من القائمة"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                >
                  <CalendarDaysIcon className="topbar-cta-icon" aria-hidden />
                  <span>حجز جلسة فورية</span>
                </Link>
                <Link
                  href="/products"
                  className="btn btn-outline drawer-cta"
                  aria-label="زيارة المتجر الرقمي"
                  onClick={closeMenu}
                >
                  <span>زيارة المتجر</span>
                </Link>
              </div>
              <TopbarAuth variant="mobile" onNavigate={closeMenu} />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
