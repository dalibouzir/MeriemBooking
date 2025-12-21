'use client'

/**
 * Example: Lead Form with Meta Tracking
 * 
 * This demonstrates the correct Lead tracking flow with:
 * - Backend/API call first (confirm success)
 * - Single eventId for deduplication
 * - Both Pixel (client) + CAPI (server) firing
 * 
 * Two approaches are available:
 * 1. useMetaTracking() hook - via PixelProvider context
 * 2. trackLead() function - direct import (shown below)
 */

import { useState } from 'react'
import { trackLead } from '@/lib/meta/lead'
// Alternative: import { useMetaTracking } from '@/app/providers/PixelProvider'

interface FormData {
  email: string
  phone: string
  name: string
}

export default function LeadFormExample() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)

    try {
      // ═══════════════════════════════════════════════════════════════
      // STEP 1: Call your API (Supabase, fetch, etc.)
      // ═══════════════════════════════════════════════════════════════
      // const response = await fetch('/api/your-endpoint', {
      //   method: 'POST',
      //   body: JSON.stringify(formData),
      // })
      // if (!response.ok) throw new Error('Failed to submit')

      // Simulating successful API response
      await new Promise((resolve) => setTimeout(resolve, 500))

      // ═══════════════════════════════════════════════════════════════
      // STEP 2: Track Lead ONLY after confirmed success
      // ═══════════════════════════════════════════════════════════════
      // This fires BOTH:
      // - Client-side Pixel: fbq('track', 'Lead', {...}, { eventID })
      // - Server-side CAPI: POST /api/meta/capi with same eventID
      //
      // The same eventId ensures Meta deduplicates the events
      const result = await trackLead({
        email: formData.email,          // Will be SHA-256 hashed for CAPI
        phone: formData.phone,          // Will be SHA-256 hashed for CAPI
        formName: 'download_form',      // Custom data for analysis
        contentName: 'free_booklet',    // Custom data for analysis
        leadType: 'download',           // Custom data for analysis
      })

      console.log('Lead tracked:', result)
      // result = { eventId, browserSent: boolean, serverSent: boolean }

      // ═══════════════════════════════════════════════════════════════
      // STEP 3: Handle success UI
      // ═══════════════════════════════════════════════════════════════
      setSuccess(true)
    } catch (err) {
      // Lead tracking is NOT fired on errors
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Simple form UI for demonstration
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const form = e.target as HTMLFormElement
        const data: FormData = {
          email: (form.elements.namedItem('email') as HTMLInputElement).value,
          phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
          name: (form.elements.namedItem('name') as HTMLInputElement).value,
        }
        handleSubmit(data)
      }}
      className="space-y-4 max-w-md mx-auto p-6"
    >
      <h2 className="text-xl font-bold">Download Free Booklet</h2>

      {success ? (
        <div className="p-4 bg-green-100 text-green-800 rounded">
          ✅ Success! Check your email.
        </div>
      ) : (
        <>
          <input
            name="name"
            type="text"
            placeholder="Name"
            required
            className="w-full p-2 border rounded"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full p-2 border rounded"
          />
          <input
            name="phone"
            type="tel"
            placeholder="Phone"
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-2 bg-purple-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Download Now'}
          </button>
          {error && <p className="text-red-600">{error}</p>}
        </>
      )}
    </form>
  )
}
