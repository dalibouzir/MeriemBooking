'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Calendar from 'react-calendar'
import type { CalendarProps } from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { motion } from 'motion/react'
import Image from 'next/image'

export default function FreeCallClient({ initialToken = '' }: { initialToken?: string }) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // صلاحية الدخول من خلال التوكن
  const hasAccess = useMemo(() => Boolean(initialToken), [initialToken])

  if (!hasAccess) {
    return (
      <section dir="rtl" aria-labelledby="no-access-title">
        <div className="container" style={{ maxWidth: 640, padding: '24px 16px' }}>
          <div className="card" style={{ padding: 18 }}>
            {/* عنوان وحالة */}
            <header style={{ textAlign: 'center', marginBottom: 10 }}>
              <h1 id="no-access-title" style={{ marginBottom: 6 }}>لا يمكنك الدخول</h1>
              <p style={{ color: '#5b5671', margin: 0 }}>
                هذه الصفحة محمية برمز (توكن) صالح لحجز مكالمة مجانية مع مريم.
              </p>
            </header>
  
            <div className="alert alert-danger" role="alert" aria-live="polite" style={{ marginBottom: 14 }}>
              🚫 لا يوجد توكن مرفق. يلزم إدخال/استبدال كود صالح للمتابعة.
            </div>
  
            {/* لماذا ظهرت لك هذه الرسالة؟ */}
            <section style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 6px', fontWeight: 800 }}>لماذا تظهر هذه الرسالة؟</h2>
              <ul style={{ margin: 0, paddingRight: '1.2rem', lineHeight: 1.9, color: '#404252' }}>
                <li>لم تُدخلي كودًا بعد، أو انتهت صلاحية الكود السابق.</li>
                <li>دخلتِ للصفحة مباشرة بدون المرور بعملية التحميل التي تُرسل الكود.</li>
              </ul>
            </section>
  
            {/* كيف أحصل على الكود؟ */}
            <section style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: '1.05rem', margin: '0 0 6px', fontWeight: 800 }}>كيف أحصل على الكود؟</h2>
              <ul style={{ margin: 0, paddingRight: '1.2rem', lineHeight: 1.9, color: '#404252' }}>
                <li>حمّلي أي منتج من المتجر (مثلاً: <strong>دفتر الاتزان العاطفي</strong>).</li>
                <li>سيصلك بريد إلكتروني يحتوي <strong>رابط التنزيل</strong> + <strong>رمز مكالمة مجانية</strong> صالح لمدة ٣٠ يومًا.</li>
                <li>إن كان البريد غير ظاهر، تفقدي مجلد <em>الرسائل غير الهامة/Spam</em>.</li>
              </ul>
            </section>
  
            {/* إجراءات سريعة */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <a href="/redeem" className="btn btn-primary" aria-label="الانتقال إلى صفحة استبدال الكود">
                عندي كود — أريد استبداله
              </a>
              <a href="/" className="btn btn-outline" aria-label="الرجوع إلى المتجر لاختيار منتج">
                الرجوع للمتجر
              </a>
            </div>
  
            {/* تلميحات صغيرة تبعث على الطمأنينة */}
            <p style={{ marginTop: 12, textAlign: 'center', color: '#6b7280', fontSize: '.95rem' }}>
              🔒 نستخدم بريدك فقط لإرسال رابط التنزيل والرمز — لا رسائل مزعجة.
            </p>
          </div>
        </div>
      </section>
    )
  }
  

  // ========== Helpers ==========
  function extractDateFromValue(value: unknown): Date | null {
    if (value instanceof Date) return value
    if (Array.isArray(value)) {
      for (const v of value) if (v instanceof Date) return v
    }
    return null
  }

  const formatArabicDate = (d: Date) =>
    d.toLocaleDateString('ar-TN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const handleDateChange: NonNullable<CalendarProps['onChange']> = (value) => {
    const d = extractDateFromValue(value)
    if (!d) return
    setSelectedDate(d)
    const iso = d.toISOString().split('T')[0]
    router.push(`/booking?date=${iso}`)
  }

  // ملاحظات وأيام غير متاحة (مثال واقعي)
  const notes: Record<string, string> = {
    '2025-08-28': 'محجوز بالكامل',
    '2025-08-29': 'جلسة بريميوم ✨',
    '2025-08-30': 'جلسة جماعية 🌿',
  }
  const unavailableDates = ['2025-08-27']

  return (
    <motion.div
      className="main-container"
      dir="rtl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {/* صورة مريم */}
      <motion.div
        className="mx-auto w-40 h-40 rounded-full overflow-hidden shadow-lg border-4 border-purple-300"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Image
          src="/Meriem.webp"
          alt="مريم"
          width={160}
          height={160}
          className="w-full h-full object-cover"
          priority
        />
      </motion.div>

      {/* تعريف سريع + وعد الجلسة */}
      <motion.section
        className="bg-white bg-opacity-80 rounded-xl shadow-md p-6 text-center mt-4"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-purple-800 mb-3">احجزي مكالمتك المجانية</h1>
        <p className="text-lg leading-relaxed text-gray-700">
          جلسة قصيرة مع <strong>مريم</strong> للتركيز على <strong>الاتزان العاطفي</strong>، تهدئة
          <strong> الناقد الداخلي</strong>، وبناء <strong>حدود لطيفة</strong> مناسبة لوضعك—خصوصًا للأمهات.
        </p>
        <ul className="text-gray-700 text-base mt-3 space-y-1">
          <li>⏱️ المدة: ٢٥–٣٠ دقيقة</li>
          <li>📍 أونلاين — رابط غرفة المكالمة يصلك بعد الحجز</li>
          <li>🕐 التوقيت: يُعرض حسب توقيت تونس (Africa/Tunis)</li>
        </ul>
      </motion.section>

      {/* اختيار اليوم */}
      <motion.section
        className="bg-white bg-opacity-90 rounded-xl shadow-md p-6 text-center mt-6"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-semibold text-purple-700 mb-4">اختاري اليوم المناسب</h2>

        {/* أسطورة صغيرة للرموز */}
        <div className="text-sm text-gray-600 mb-3 flex flex-col items-center gap-1">
          <div>🟣 ملاحظة خاصة باليوم · 🔒 غير متاح · ✨ جلسة بريميوم · 🌿 جلسة جماعية</div>
          <div>اليوم الذي تختارينه سينقلك تلقائيًا لصفحة اختيار <strong>الساعة</strong>.</div>
        </div>

        <div className="flex justify-center">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              minDate={new Date()}
              locale="ar-TN"
              calendarType="gregory"
              selectRange={false}
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

        {/* عرض اليوم المختار بشكل فوري */}
        {selectedDate && (
          <p className="mt-4 text-purple-800 font-bold">
            اليوم المختار: {formatArabicDate(selectedDate)} — جاري تحويلك لاختيار الساعة…
          </p>
        )}
      </motion.section>

      {/* تهيئة بسيطة قبل المكالمة */}
      <motion.section
        className="bg-white bg-opacity-70 rounded-xl shadow p-4 text-center mt-6"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-xl font-bold text-purple-700 mb-2">كيف تستفيدين لأقصى حد؟</h3>
        <ul className="text-gray-700 leading-7">
          <li>💜 مكان هادئ + سماعات إن أمكن.</li>
          <li>📝 اكتبِي ١–٢ سؤالًا يهمّك من يومك أو مع أطفالك.</li>
          <li>🌿 دقيقة تنفّس قبل المكالمة لتهدئة الجهاز العصبي.</li>
        </ul>
      </motion.section>
    </motion.div>
  )
}
