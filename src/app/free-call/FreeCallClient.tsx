'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Calendar from 'react-calendar'
// CalendarProps not used; keep import minimal
import 'react-calendar/dist/Calendar.css'
import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
// No auth needed — reservations are created server-side using a guest/user-for-email

export default function FreeCallClient({ initialToken = '' }: { initialToken?: string }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [freeSlots, setFreeSlots] = useState<{ id: string; start: string; end: string; remaining?: number }[]>([])
  const [chosen, setChosen] = useState<{ id: string; start: string; end: string } | null>(null)
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const hasAccess = useMemo(() => Boolean(initialToken), [initialToken])

  // Fetch availability for the initial month on mount so days glow immediately
  useEffect(() => {
    fetchAvailableDays(new Date()).catch(() => {})
  }, [])

  if (!hasAccess) {
    return (
      <section dir="rtl" aria-labelledby="no-access-title">
        <div className="container fc-noaccess-wrap">
          <div className="card fc-card">
            <header className="fc-header">
              <h1 id="no-access-title" className="fc-title" style={{ marginBottom: 6 }}>لا يمكنك الدخول</h1>
              <p className="fc-subtle">
                هذه الصفحة محمية برمز (توكن) صالح لحجز مكالمة مجانية مع مريم.
              </p>
            </header>
            <div className="alert alert-danger fc-alert-space" role="alert" aria-live="polite">
              🚫 لا يوجد توكن مرفق. يلزم إدخال/استبدال كود صالح للمتابعة.
            </div>
            <section className="fc-section">
              <h2 className="fc-title" style={{ fontSize: '1.05rem' }}>لماذا تظهر هذه الرسالة؟</h2>
              <ul className="fc-list" style={{ paddingRight: '1.2rem' }}>
                <li>لم تُدخلي كودًا بعد، أو انتهت صلاحية الكود السابق.</li>
                <li>دخلتِ للصفحة مباشرة بدون المرور بعملية التحميل التي تُرسل الكود.</li>
              </ul>
            </section>
            <section className="fc-section">
              <h2 className="fc-title" style={{ fontSize: '1.05rem' }}>كيف أحصل على الكود؟</h2>
              <ul className="fc-list" style={{ paddingRight: '1.2rem' }}>
                <li>حمّلي أي منتج من المتجر.</li>
                <li>سيصلك بريد فيه رابط التنزيل + رمز مكالمة مجانية صالح ٣٠ يومًا.</li>
              </ul>
            </section>
            <div className="fc-calendar" style={{ gap: 8, flexWrap: 'wrap' }}>
              <Link href="/redeem" className="btn btn-primary">عندي كود — أريد استبداله</Link>
              <Link href="/" className="btn btn-outline">رجوع للمتجر</Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function extractDateFromValue(value: unknown): Date | null {
    if (value instanceof Date) return value
    if (Array.isArray(value)) for (const v of value) if (v instanceof Date) return v
    return null
  }

  function toDateKeyLocal(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const formatArabicDate = (d: Date) =>
    d.toLocaleDateString('ar-TN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  async function fetchAvailableDays(active: Date) {
    // Determine the first and last day of the visible month
    const year = active.getFullYear()
    const month = active.getMonth()
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const from = toDateKeyLocal(first)
    const to = toDateKeyLocal(last)
    const r = await fetch(`/api/public/free/days?from=${from}&to=${to}`, { cache: 'no-store' })
    const j = await r.json()
    if (!r.ok) return
    setAvailableDays(Array.isArray(j.days) ? j.days : [])
  }

  

  async function fetchFree(isoDate: string) {
    const r = await fetch('/api/public/free', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: isoDate }),
    })
    const j = await r.json()
    if (!r.ok) throw new Error(j.error || 'خطأ')
    setFreeSlots(j.free || [])
    setChosen(null)
  }

  async function bookChosen() {
    if (!chosen || !email) return alert('Enter email and choose a time')
    setLoading(true)
    const r = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: chosen.id, email, name, notes }),
    })
    const j = await r.json()
    setLoading(false)
    if (!r.ok) return alert(j.error || 'Booking failed')
    alert('Booking confirmed ✅')
    setFreeSlots([]); setChosen(null); setName(''); setEmail(''); setNotes(''); setSelectedDate(null)
  }

  const notesMap: Record<string, string> = {}
  const unavailableDates: string[] = []

  return (
    <motion.div
      className="main-container fc-wrapper"
      dir="rtl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <motion.div
        className="fc-avatar"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Image src="/Meriem.webp" alt="مريم" width={160} height={160} className="w-full h-full object-cover" priority />
      </motion.div>

      <motion.section className="fc-hero"
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <h1 className="fc-title">احجزي مكالمتك المجانية</h1>
        <ul className="fc-list">
          <li>⏱️ ٢٥–٣٠ دقيقة</li>
          <li>📍 أونلاين (رابط يُنشأ تلقائيًا)</li>
          <li>🕐 توقيت تونس (Africa/Tunis)</li>
        </ul>
      </motion.section>

      <motion.section className="fc-hero"
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <h2 className="text-2xl font-semibold text-purple-700 mb-4">اختاري اليوم والساعة</h2>

        <div className="fc-calendar">
          <div className="card" style={{ padding: '12px' }}>
            <Calendar
              onActiveStartDateChange={async ({ activeStartDate }) => {
                if (activeStartDate) await fetchAvailableDays(activeStartDate)
              }}
              onChange={async (value) => {
                const d = extractDateFromValue(value)
                if (!d) return
                setSelectedDate(d)
                const iso = toDateKeyLocal(d)
                try {
                  await fetchFree(iso)
                } catch (e: unknown) {             // ✅ safe type
                  const msg = e instanceof Error ? e.message : 'خطأ'
                  alert(msg)
                }                            
              }}
              value={selectedDate}
              minDate={new Date()}
              locale="ar-TN"
              calendarType="gregory"
              selectRange={false}
              allowPartialRange={false}
              tileDisabled={({ date }) => unavailableDates.includes(toDateKeyLocal(date))}
              tileContent={({ date }) => {
                const iso = toDateKeyLocal(date)
                return notesMap[iso] ? <div className="note-tooltip" title={notesMap[iso]}>🟣<div className="note-text">{notesMap[iso]}</div></div> : null
              }}
              tileClassName={({ date, view }) => {
                const iso = toDateKeyLocal(date)
                if (view === 'month') {
                  if (notesMap[iso]) return 'highlight-note'
                  if (availableDays.includes(iso)) return 'fc-available-day'
                }
                return ''
              }}
            />
          </div>
        </div>

        {selectedDate && (
          <p className="fc-picked">اليوم المختار: {formatArabicDate(selectedDate)}</p>
        )}

        {freeSlots.length > 0 && (
          <div className="fc-time-buttons">
            {freeSlots.map((s, i) => (
              <button key={i} className={`btn ${chosen?.start === s.start ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { setChosen({ id: s.id, start: s.start, end: s.end }); setShowModal(true) }}>
                {new Date(s.start).toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' })}
                {typeof s.remaining === 'number' ? ` — ${s.remaining}` : ''}
              </button>
            ))}
          </div>
        )}

        {/* Booking modal */}
        {showModal && (
          <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Confirm Appointment</h2>
              <button className="btn" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <p className="fc-muted" style={{ marginBottom: 10 }}>
              Selected time:
              <strong> {chosen ? new Date(chosen.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}</strong>
            </p>
            <div className="grid2">
              <input className="input" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
              <input className="input" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            </div>
            <label className="field" style={{ marginTop: 10 }}>
              <span className="field-label">Notes (optional)</span>
              <textarea className="input textarea" rows={3} placeholder="Any details you want to add" value={notes} onChange={(e)=>setNotes(e.target.value)} />
            </label>
            <div className="fc-calendar" style={{ gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" disabled={!chosen || !email || !name || loading} onClick={async ()=>{ await bookChosen(); setShowModal(false) }}>
                {loading ? 'Booking…' : 'Confirm Booking'}
              </button>
              <button className="btn" onClick={() => setShowModal(false)}>Back</button>
            </div>
          </div>
        </div>
      )}
      </motion.section>
    </motion.div>
  )
}
