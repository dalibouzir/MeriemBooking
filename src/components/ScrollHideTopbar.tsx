"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import TopbarAuth from './TopbarAuth'

export default function ScrollHideTopbar() {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (frame.current !== null) return
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null
        const current = window.scrollY || 0
        const prev = lastY.current
        const delta = current - prev
        lastY.current = current

        if (current < 80) {
          setHidden(false)
          return
        }

        const threshold = 12
        if (delta > threshold) {
          setHidden(true)
        } else if (delta < -threshold) {
          setHidden(false)
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <header className={`topbar${hidden ? ' is-hidden' : ''}`}>
      <div className="container topbar-row">
        <Link href="/" className="brand" aria-label="الرجوع للصفحة الرئيسية — فطرة الأمهات">
          <img src="/logo/logo.png" alt="فطرة الأمهات" className="brand-logo" />
          <span className="brand-mark">Fittrah Moms </span>
        </Link>
        <TopbarAuth />
      </div>
    </header>
  )
}
