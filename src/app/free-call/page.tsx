'use client'

import React, { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Calendar from 'react-calendar'
import type { CalendarProps } from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { motion } from 'motion/react' // Motion One
import Image from 'next/image'

export default function FreeCallPage() {
  const params = useSearchParams()
  const token = params.get('token')

  // ✅ Hooks at top-level
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Minimal demo gate: require a token in the URL (?token=...)
  const hasAccess = useMemo(() => Boolean(token), [token])

  if (!hasAccess) {
    return (
      <div dir="rtl" className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">الدخول مرفوض</h1>
        <p className="mb-4">تحتاج/ين إلى توكن صالح لحجز مكالمة مجانية.</p>
        <a href="/redeem" className="text-purple-700 font-bold underline">
          عندي كود — أريد استبداله
        </a>
      </div>
    )
  }

  // Helper to normalize react-calendar's Value to a single Date
  function extractDateFromValue(value: unknown): Date | null {
    if (value instanceof Date) return value
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v instanceof Date) return v
        // v may be null in ranges; skip nulls safely
      }
    }
    return null
  }

  // ✅ Type-safe onChange (matches react-calendar signature)
  const handleDateChange: NonNullable<CalendarProps['onChange']> = (value) => {
    const d = extractDateFromValue(value)
    if (!d) return
    setSelectedDate(d)
    const iso = d.toISOString().split('T')[0]
    router.push(`/booking?date=${iso}`)
  }

  const notes: Record<string, string> = {
    '2025-08-28': 'Reserved',
    '2025-08-29': 'Premium session 💫',
    '2025-08-30': 'Group healing 🌿',
  }
  const unavailableDates = ['2025-08-27']

  return (
    <motion.div
      className="main-container"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {/* Profile Image */}
      <motion.div
        className="mx-auto w-40 h-40 rounded-full overflow-hidden shadow-lg border-4 border-purple-300"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Image
          src="/Meriem.webp"
          alt="Meriem"
          width={160}
          height={160}
          className="w-full h-full object-cover"
          priority
        />
      </motion.div>

      {/* Intro */}
      <motion.section
        className="bg-white bg-opacity-80 rounded-xl shadow-md p-6 text-center mt-4"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-purple-800 mb-3">Book Your Free Call</h1>
        <p className="text-lg leading-relaxed text-gray-700">
          Choose a date for your free emotional balance call.
        </p>
      </motion.section>

      {/* Calendar */}
      <motion.section
        className="bg-white bg-opacity-90 rounded-xl shadow-md p-6 text-center mt-6"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-semibold text-purple-700 mb-4">Pick a date</h2>
        <div className="flex justify-center">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              minDate={new Date()}
              locale="en"
              calendarType="gregory"
              selectRange={false}      // clarify intent: single date
              allowPartialRange={false}
              tileDisabled={({ date }) =>
                unavailableDates.includes(date.toISOString().split('T')[0])
              }
              tileContent={({ date }) => {
                const iso = date.toISOString().split('T')[0]
                return notes[iso] ? (
                  <div className="note-tooltip" title={notes[iso]}>
                    🟣<div className="note-text">{notes[iso]}</div>
                  </div>
                ) : null
              }}
              tileClassName={({ date, view }) => {
                const iso = date.toISOString().split('T')[0]
                if (view === 'month' && notes[iso]) return 'highlight-note'
                return ''
              }}
            />
          </div>
        </div>
      </motion.section>
    </motion.div>
  )
}
