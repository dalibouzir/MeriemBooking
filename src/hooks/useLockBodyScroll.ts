import { useEffect, useRef } from 'react'

/**
 * Prevents body scrolling while the given flag is active.
 * Restores previous inline overflow value on cleanup.
 */
export default function useLockBodyScroll(active: boolean) {
  const previousOverflow = useRef<string | null>(null)

  useEffect(() => {
    if (!active) return
    const { body } = document
    previousOverflow.current = body.style.overflow
    body.style.overflow = 'hidden'
    return () => {
      if (previousOverflow.current !== null) {
        body.style.overflow = previousOverflow.current
      } else {
        body.style.removeProperty('overflow')
      }
    }
  }, [active])
}
