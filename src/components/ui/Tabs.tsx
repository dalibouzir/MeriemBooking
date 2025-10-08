"use client"

import { AnimatePresence, motion } from 'motion/react'
import { useId, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type Tab = {
  id: string
  title: ReactNode
  content: ReactNode
}

type TabsProps = {
  tabs: Tab[]
  defaultTabId?: string
  className?: string
}

export default function Tabs({ tabs, defaultTabId, className = '' }: TabsProps) {
  const fallbackId = tabs[0]?.id ?? ''
  const [active, setActive] = useState<string>(defaultTabId ?? fallbackId)
  const instanceId = useId()

  const normalizedTabs = useMemo(() => tabs.filter(Boolean), [tabs])
  const activeTab = useMemo(() => normalizedTabs.find((tab) => tab.id === active), [active, normalizedTabs])

  return (
    <div className={`tabs${className ? ` ${className}` : ''}`}>
      <div role="tablist" className="tabs-list" aria-orientation="horizontal">
        {normalizedTabs.map((tab, index) => {
          const isActive = tab.id === (activeTab?.id ?? active)
          const tabId = `${instanceId}-tab-${index}`
          const panelId = `${instanceId}-panel-${index}`
          return (
            <button
              key={tab.id}
              id={tabId}
              type="button"
              role="tab"
              className={`tabs-trigger${isActive ? ' is-active' : ''}`}
              aria-selected={isActive}
              aria-controls={panelId}
              onClick={() => setActive(tab.id)}
            >
              {tab.title}
            </button>
          )
        })}
      </div>

      <div className="tabs-panels">
        <AnimatePresence mode="wait">
          {normalizedTabs.map((tab, index) => {
            const isActive = tab.id === (activeTab?.id ?? active)
            const panelId = `${instanceId}-panel-${index}`
            const tabId = `${instanceId}-tab-${index}`
            return isActive ? (
              <motion.div
                key={tab.id}
                role="tabpanel"
                id={panelId}
                aria-labelledby={tabId}
                className="tabs-panel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.34, 0.66, 0.18, 1] }}
              >
                {tab.content}
              </motion.div>
            ) : null
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
