'use client'

import React, { useEffect, useState } from 'react'

export default function BookingPage() {
  const [data, setData] = useState<string[]>([])

  useEffect(() => {
    setData(['2025-08-26 — 10:00 to 11:00', '2025-08-27 — 14:00 to 15:00'])
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-purple-700">Therapist Availability</h1>
      <ul className="mt-4 space-y-2 text-gray-800">
        {data.map((item, index) => (
          <li key={index}>🗓️ {item}</li>
        ))}
      </ul>
    </div>
  )
}
