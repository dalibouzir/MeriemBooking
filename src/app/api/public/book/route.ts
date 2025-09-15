import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Deprecated: use /api/reservations with a slot_id' },
    { status: 410 },
  )
}
