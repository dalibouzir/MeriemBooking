"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import TopbarAuth from './TopbarAuth'

export default function ScrollHideTopbar() {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const frame = useRef<number | null>(null)
  const hiddenRef = useRef(hidden)

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
