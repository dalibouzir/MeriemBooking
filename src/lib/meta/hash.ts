/**
 * SHA-256 hashing utilities for Meta CAPI
 * PII must be hashed before sending to Meta
 */

/**
 * Hash a string using SHA-256 (browser-compatible)
 */
export async function sha256(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase()
  const encoder = new TextEncoder()
  const data = encoder.encode(normalized)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Synchronous SHA-256 for server-side (Node.js)
 */
export function sha256Sync(value: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto')
  const normalized = value.trim().toLowerCase()
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

/**
 * Normalize and hash email
 */
export async function hashEmail(email: string): Promise<string> {
  return sha256(email)
}

/**
 * Normalize phone (digits only) and hash
 */
export async function hashPhone(phone: string): Promise<string> {
  const digitsOnly = phone.replace(/[^\d]/g, '')
  return sha256(digitsOnly)
}

/**
 * Server-side: Normalize and hash email
 */
export function hashEmailSync(email: string): string {
  return sha256Sync(email)
}

/**
 * Server-side: Normalize phone (digits only) and hash
 */
export function hashPhoneSync(phone: string): string {
  const digitsOnly = phone.replace(/[^\d]/g, '')
  return sha256Sync(digitsOnly)
}
