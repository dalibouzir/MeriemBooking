"use client"

import { type DependencyList, type RefObject, useEffect } from 'react'

export function initRevealOnScroll(rootEl: HTMLElement | null | undefined) {
  if (!rootEl) return () => {}

  const elements = Array.from(rootEl.querySelectorAll<HTMLElement>('.reveal'))
  if (!elements.length) return () => {}

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    elements.forEach((el) => el.classList.add('is-inview'))
    return () => {}
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          const target = entry.target as HTMLElement
          target.classList.add('is-inview')
          obs.unobserve(target)
        }
      })
    },
    {
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px',
    }
  )

  elements.forEach((el) => observer.observe(el))

  return () => observer.disconnect()
}

export function useRevealOnScroll(rootRef: RefObject<HTMLElement | null>, deps: DependencyList = []) {
  useEffect(() => {
    const cleanup = initRevealOnScroll(rootRef?.current)
    return () => cleanup?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef, ...deps])
}
