'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function WorkshopReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={false}
      whileInView={reducedMotion ? undefined : { y: [12, 0], opacity: [0.7, 1] }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
    >{children}</motion.div>
  )
}
