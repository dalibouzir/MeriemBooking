'use client'

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import s from './journey.module.css'

export default function JourneyExplorer({ stages }: { stages: { title: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  function onKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index
    if (event.key === 'ArrowLeft') next = (index + 1) % stages.length
    else if (event.key === 'ArrowRight') next = (index + stages.length - 1) % stages.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = stages.length - 1
    else return
    event.preventDefault(); setActive(next); buttons.current[next]?.focus()
  }
  return <div className={s.explorer}>
    <div className={s.tabs} role="tablist" aria-label="مرحلتا الرحلة">{stages.map((stage, index) => <button key={stage.title} ref={el => { buttons.current[index] = el }} id={`phase-tab-${index}`} role="tab" type="button" aria-selected={active === index} aria-controls={`phase-panel-${index}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={event => onKey(event, index)}><span dir="ltr">{index === 0 ? '01 — 04' : '05 — 08'}</span><strong>{stage.title}</strong><span className={s.tabArrow} aria-hidden="true">↙</span></button>)}</div>
    <div className={s.body}>
      <div className={s.stageMap} aria-hidden="true"><span className={s.mapLabel}>{active === 0 ? 'الاتزان الذاتي' : 'الاتزان في العلاقات'}</span><div className={s.bigRange}><AnimatePresence mode="wait" initial={false}><motion.span key={active} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .18 }}>{active === 0 ? '1—4' : '5—8'}</motion.span></AnimatePresence></div><div className={s.weeks}>{Array.from({ length: 8 }, (_, i) => <span data-active={i < 4 ? active === 0 : active === 1} key={i}>{i + 1}</span>)}</div></div>
      <div className={s.panelArea}>{stages.map((stage, index) => <div key={stage.title} id={`phase-panel-${index}`} role="tabpanel" aria-labelledby={`phase-tab-${index}`} tabIndex={0} hidden={active !== index} className={s.panel}><motion.div key={`${index}-${active}`} initial={reduced ? false : { opacity: .5, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}>{stage.content}</motion.div></div>)}</div>
    </div>
  </div>
}
