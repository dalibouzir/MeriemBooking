"use client"
import React from 'react'
import { signIn } from 'next-auth/react'

export default function GoogleBookButton() {
  const onClick = () => signIn('google')
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
    >
      Connect Google Calendar
    </button>
  )
}
