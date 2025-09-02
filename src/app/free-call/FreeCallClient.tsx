'use client'

import React, { useMemo, useState } from 'react'
import Calendar from 'react-calendar'
import type { CalendarProps } from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'

export default function FreeCallClient({ initialToken = '' }: { initialToken?: string }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [freeSlots, setFreeSlots] = useState<{ start: string; end: string }[]>([])
  const [chosen, setChosen] = useState<{ start: string; end: string } | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const hasAccess = useMemo(() => Boolean(initialToken), [initialToken])

  if (!hasAccess) {
    return (
      <section dir="rtl" aria-labelledby="no-access-title">
        <div className="container" style={{ maxWidth: 640, padding: '24px 16px' }}>
          <div className="card" style={{ padding: 18 }}>
            <header style={{ textAlign: 'center', marginBottom: 10 }}>
              <h1 id="no-access-title" style={{ marginBottom: 6 }}>لا يمكنك الدخول</h1>
              <p style={{ color: '#5b5671', margin: 0 }}>
                هذه الصفحة محمية برمز (توكن) صالح لحجز مكالمة مجانية مع مريم.
              </p>
            </header>
            <div className="alert alert-danger" role="alert" aria-live="polite" style={{ marginBottom: 14 }}>
              🚫 لا يوجد توكن مرفق. يلزم إدخال/استبدال كود صالح للمتابعة.
            </div>
            <section style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 6px', fontWeight: 800 }}>لماذا تظهر هذه الرسالة؟</h2>
              <ul style={{ margin: 0, paddingRight: '1.2rem', lineHeight: 1.9, color: '#404252' }}>
                <li>لم تُدخلي كودًا بعد، أو انتهت صلاحية الكود السابق.</li>
                <li>دخلتِ للصفحة مباشرة بدون المرور بعملية التحميل التي تُرسل الكود.</li>
              </ul>
            </section>
            <section style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 6px', fontWeight: 800 }}>كيف أحصل على الكود؟</h2>
              <ul style={{ margin: 0, paddingRight: '1.2rem', lineHeight: 1.9, color: '#404252' }}>
                <li>حمّلي أي منتج من المتجر.</li>
                <li>سيصلك بريد فيه رابط التنزيل + رمز مكالمة مجانية صالح ٣٠ يومًا.</li>
              </ul>
            </section>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
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

  const formatArabicDate = (d: Date) =>
    d.toLocaleDateString('ar-TN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

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
    if (!chosen || !email || !name) return alert('أدخلي الاسم والبريد واختاري وقتًا')
    setLoading(true)
    const r = await fetch('/api/public/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startISO: chosen.start,
        endISO: chosen.end,
        clientEmail: email,
        clientName: name,
        subject: 'Free Call',
        notes,
      }),
    })
    const j = await r.json()
    setLoading(false)
    if (!r.ok) return alert(j.error || 'فشل الحجز')
    alert(`تم الحجز ✅ ${j.meet ? 'رابط اللقاء: ' + j.meet : 'تم إرسال الدعوة على بريدك'}`)
    setFreeSlots([]); setChosen(null); setName(''); setEmail(''); setNotes(''); setSelectedDate(null)
  }

  const notesMap: Record<string, string> = {}
  const unavailableDates: string[] = []

  return (
    <motion.div
      className="main-container"
      dir="rtl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <motion.div
        className="mx-auto w-40 h-40 rounded-full overflow-hidden shadow-lg border-4 border-purple-300"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Image src="/Meriem.webp" alt="مريم" width={160} height={160} className="w-full h-full object-cover" priority />
      </motion.div>

      <motion.section className="bg-white bg-opacity-80 rounded-xl shadow-md p-6 text-center mt-4"
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <h1 className="text-3xl font-bold text-purple-800 mb-3">احجزي مكالمتك المجانية</h1>
        <ul className="text-gray-700 text-base mt-3 space-y-1">
          <li>⏱️ ٢٥–٣٠ دقيقة</li>
          <li>📍 أونلاين (رابط يُنشأ تلقائيًا)</li>
          <li>🕐 توقيت تونس (Africa/Tunis)</li>
        </ul>
      </motion.section>

      <motion.section className="bg-white bg-opacity-90 rounded-xl shadow-md p-6 text-center mt-6"
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <h2 className="text-2xl font-semibold text-purple-700 mb-4">اختاري اليوم والساعة</h2>

        <div className="flex justify-center">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <Calendar
              onChange={async (value) => {
                const d = extractDateFromValue(value)
                if (!d) return
                setSelectedDate(d)
                const iso = d.toISOString().split('T')[0]
                try { await fetchFree(iso) } catch (e:any) { alert(e.message || 'خطأ') }
              }}
              value={selectedDate}
              minDate={new Date()}
              locale="ar-TN"
              calendarType="gregory"
              selectRange={false}
              allowPartialRange={false}
              tileDisabled={({ date }) => unavailableDates.includes(date.toISOString().split('T')[0])}
              tileContent={({ date }) => {
                const iso = date.toISOString().split('T')[0]
                return notesMap[iso] ? <div className="note-tooltip" title={notesMap[iso]}>🟣<div className="note-text">{notesMap[iso]}</div></div> : null
              }}
              tileClassName={({ date, view }) => {
                const iso = date.toISOString().split('T')[0]
                if (view === 'month' && notesMap[iso]) return 'highlight-note'
                return ''
              }}
            />
          </div>
        </div>

        {selectedDate && (
          <p className="mt-4 text-purple-800 font-bold">
            اليوم المختار: {formatArabicDate(selectedDate)}
          </p>
        )}

        {freeSlots.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {freeSlots.map((s, i) => (
              <button key={i} className={`btn ${chosen?.start === s.start ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setChosen(s)}>
                {new Date(s.start).toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' })}
              </button>
            ))}
          </div>
        )}

        {freeSlots.length > 0 && (
          <div className="mt-6 max-w-md mx-auto text-right space-y-2">
            <input className="input w-full" placeholder="الاسم" value={name} onChange={(e)=>setName(e.target.value)} />
            <input className="input w-full" placeholder="البريد الإلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <textarea className="input w-full" placeholder="ملاحظات (اختياري)" value={notes} onChange={(e)=>setNotes(e.target.value)} />
            <button className="btn btn-primary w-full" disabled={!chosen || !email || !name || loading} onClick={bookChosen}>
              {loading ? 'جارٍ الحجز…' : 'تأكيد الحجز'}
            </button>
          </div>
        )}
      </motion.section>
    </motion.div>
  )
}
