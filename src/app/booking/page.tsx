'use client'

import Link from 'next/link'

const BOOKING_URL = 'https://calendly.com/meriembouzir/30min'

export default function BookingPage() {
  return (
    <div className="booking-redirect">
      <div className="booking-card">
        <h1>الحجوزات أصبحت عبر Calendly</h1>
        <p>
          جميع المواعيد تُدار الآن من خلال لوحة Calendly الخاصة بمريم بوزير. اضغطي الزر بالأسفل لفتح الصفحة، ثم اختاري الوقت المناسب وسيصلك تأكيد تلقائي ورسالة تذكير.
        </p>
        <Link href={BOOKING_URL} className="btn btn-primary booking-btn" target="_blank" rel="noopener noreferrer">
          فتح صفحة Calendly
        </Link>
      </div>
    </div>
  )
}
