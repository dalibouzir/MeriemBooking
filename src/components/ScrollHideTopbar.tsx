"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Bars3Icon, CalendarDaysIcon, XMarkIcon } from '@heroicons/react/24/outline'
import ThemeSwitcher, { THEME_SWITCHER_CLOSE_EVENT } from './ThemeSwitcher'
import TopbarAuth from './TopbarAuth'
import MobileMenu from './MobileMenu'

type NavLink = {
  href: string
  label: string
  external?: boolean
}

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'الرئيسية' },
  { href: '/products', label: 'المكتبة' },
  { href: '/redeem', label: 'استبدال الرمز' },
  { href: '/download', label: 'تنزيلاتي' },
]

const BOOKING_URL = '/redeem'

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
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (menuOpen) window.dispatchEvent(new Event(THEME_SWITCHER_CLOSE_EVENT))
  }, [menuOpen])

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

  const handleMenuToggle = () =>
    setMenuOpen((prev) => {
      const next = !prev
      if (!prev) window.dispatchEvent(new Event(THEME_SWITCHER_CLOSE_EVENT))
      return next
    })
  const closeMenu = () => setMenuOpen(false)
  const handleThemePanel = (open: boolean) => {
    if (open) setMenuOpen(false)
  }

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
          <ThemeSwitcher onOpenChange={handleThemePanel} />
          <Link href={BOOKING_URL} className="btn btn-nav btn-primary topbar-cta" aria-label="استبدال رمز المكالمة">
            <CalendarDaysIcon className="topbar-cta-icon" aria-hidden />
            <span>استبدلي الرمز</span>
          </Link>
          <TopbarAuth />
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={closeMenu} links={NAV_LINKS} isActive={isActive} bookingUrl={BOOKING_URL} />
    </header>
  )
}
