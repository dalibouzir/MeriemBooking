"use client"

import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

type AccordionItem = {
  id: string
  title: string
  content: ReactNode
}

type AccordionProps = {
  items: AccordionItem[]
  allowMultiple?: boolean
  defaultOpenIds?: string[]
  className?: string
}

export default function Accordion({
  items,
  allowMultiple = false,
  defaultOpenIds = [],
  className = '',
}: AccordionProps) {
  const baseId = useId()
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(defaultOpenIds))

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (allowMultiple) {
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      }

      if (next.has(id)) {
        next.delete(id)
        return next
      }
      next.clear()
      next.add(id)
      return next
    })
  }

  return (
    <div className={`accordion${className ? ` ${className}` : ''}`}>
      {items.map((item, index) => {
        const isOpen = openIds.has(item.id)
        const headerId = `${baseId}-header-${index}`
        const panelId = `${baseId}-panel-${index}`
        return (
          <div key={item.id} className={`accordion-item${isOpen ? ' is-open' : ''}`}>
            <button
              type="button"
              className="accordion-trigger"
              aria-expanded={isOpen}
              aria-controls={panelId}
              id={headerId}
              onClick={() => toggle(item.id)}
            >
              <span className="accordion-trigger-text">{item.title}</span>
              <ChevronDownIcon className="accordion-trigger-icon" aria-hidden />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              className="accordion-panel"
              hidden={!isOpen}
            >
              {typeof item.content === 'string' ? <p>{item.content}</p> : item.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
