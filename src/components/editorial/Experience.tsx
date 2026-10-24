'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import s from './experience.module.css'
import trainingPortrait from '../../../public/Meriem.png'
import workshopPortrait from '../../../public/Meriem.jpeg'

export function EditorialPage({ children, className }: { children: ReactNode; className: string }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  return <article ref={ref} className={`${s.page} ${className}`} dir="rtl"><motion.div className={s.progress} style={{ scaleX: scrollYProgress }} aria-hidden="true" />{children}</article>
}

export function ChapterNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id)
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id)
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 })
    items.forEach(item => { const el = document.getElementById(item.id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [items])
  return <nav className={s.chapters} aria-label="أقسام الصفحة">{items.map((item, index) => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? 'location' : undefined} onClick={() => setActive(item.id)}><span aria-hidden="true">0{index + 1}</span>{item.label}<span className={s.chapterLine} /></a>)}</nav>
}

export function PortraitStage({ src, variant }: { src: string; variant: 'training' | 'workshop' }) {
  const portrait = src === '/Meriem.png' ? trainingPortrait : workshopPortrait
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(y, { stiffness: 170, damping: 26 })
  const rotateY = useSpring(x, { stiffness: 170, damping: 26 })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], [-14, 14])
  return <div className={`${s.portraitStage} ${variant === 'training' ? s.training : s.workshop}`} ref={ref}>
    <div className={s.portraitOutline} aria-hidden="true" />
    <motion.div className={s.portraitCard} style={reduced ? undefined : { rotateX, rotateY, transformPerspective: 1000 }}
      onPointerMove={event => {
        if (reduced || event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
        const box = event.currentTarget.getBoundingClientRect()
        x.set(((event.clientX - box.left) / box.width - 0.5) * 6)
        y.set(-((event.clientY - box.top) / box.height - 0.5) * 6)
      }} onPointerLeave={() => { x.set(0); y.set(0) }}>
      <motion.div className={s.portraitImage} style={reduced ? undefined : { y: imageY }}><Image src={portrait} alt="مريم بوزير" fill priority placeholder="blur" sizes="(max-width: 800px) 42vw, (max-width: 1400px) 40vw, 560px" /></motion.div>
      <div className={s.imageFooter}><span>مريم بوزير</span><span lang="en">FITTRAH WOMEN</span></div>
    </motion.div>
    <div className={s.portraitIndex} aria-hidden="true">{variant === 'training' ? <><strong>8</strong><span>أسابيع<br />لنفسكِ</span></> : <><span>زواج على</span><strong>الفطرة</strong></>}</div>
  </div>
}

export function SignaturePanel() {
  return <div className={s.signaturePanel} aria-hidden="true"><span lang="en">FITTRAH WOMEN</span><strong>4</strong><span>سنوات من التكوين</span><div>مريم بوزير</div><span lang="en">Meriem Bouzir</span></div>
}
