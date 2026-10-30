'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import s from './enrollment.module.css'

const subscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

export default function MobileEnrollment({ target, title, subtitle, label, actionHref, hideAt }: { target: string; title: string; subtitle: string; label: string; actionHref?: string; hideAt?: string }) {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot)
  const [detailsVisible, setDetailsVisible] = useState(false)
  const [heroActionVisible, setHeroActionVisible] = useState(false)
  useEffect(() => {
    const el = document.getElementById(hideAt ?? target)
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setDetailsVisible(entry.isIntersecting), { threshold: 0 })
    observer.observe(el)
    const heroAction = document.querySelector(`article > section:first-of-type a[href="#${target}"]`)
    // A CTA behind the two sticky navigation bars is no longer available to tap.
    const heroObserver = new IntersectionObserver(([entry]) => setHeroActionVisible(entry.isIntersecting), { rootMargin: '-128px 0px 0px 0px', threshold: 0 })
    if (heroAction) heroObserver.observe(heroAction)
    return () => { observer.disconnect(); heroObserver.disconnect() }
  }, [target, hideAt])
  if (!mounted) return null
  return createPortal(
    <aside className={s.dock} data-hidden={detailsVisible || heroActionVisible} aria-label={title} inert={detailsVisible || heroActionVisible}>
      <div className={s.copy}><strong>{title}</strong><span>{subtitle}</span></div>
      <a href={actionHref ?? `#${target}`} target={actionHref ? '_blank' : undefined} rel={actionHref ? 'noopener noreferrer' : undefined}>{label}<ArrowLeftIcon aria-hidden="true" /></a>
    </aside>, document.body,
  )
}
