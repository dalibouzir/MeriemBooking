import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google-server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type CreateEventInput = {
  startISO: string;
  endISO: string;
  clientEmail: string;
  clientName?: string;
  subject?: string;
  notes?: string;
};

function isCreateEventInput(x: unknown): x is CreateEventInput {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.startISO === "string" &&
    typeof o.endISO === "string" &&
    typeof o.clientEmail === "string" &&
    (o.clientName === undefined || typeof o.clientName === "string") &&
    (o.subject === undefined || typeof o.subject === "string") &&
    (o.notes === undefined || typeof o.notes === "string")
  );
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();

    if (!isCreateEventInput(body)) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const { startISO, endISO, clientEmail, clientName, subject, notes } = body;

    // Prevent duplicate bookings for the exact same start time by reserving in DB first
    // Requires a table with unique constraint on start_iso (see SQL below).
    const supabase = getSupabaseAdmin();
    const reservation = {
      start_iso: startISO,
      end_iso: endISO,
      email: clientEmail,
      name: clientName ?? null,
      notes: notes ?? null,
      created_at: new Date().toISOString(),
    } as const;

    // Try insert reservation; if another user already reserved the same start, this will fail
    const { error: reserveErr } = await supabase
      .from('call_bookings')
      .insert(reservation);

    if (reserveErr) {
      // PSQL error 23505 indicates unique violation
      const isDuplicate = (reserveErr as { code?: string; message: string }).code === '23505'
        || /duplicate/i.test((reserveErr as { message?: string }).message || '')
      return NextResponse.json(
        { error: isDuplicate ? 'تم حجز هذا الوقت للتو — اختاري وقتًا آخر.' : reserveErr.message },
        { status: isDuplicate ? 409 : 500 }
      );
    }

    const ev = await createCalendarEvent({
      startISO,
      endISO,
      clientEmail,
      clientName,
      subject,
      notes,
    });

    return NextResponse.json({
      ok: true,
      eventId: ev.id,
      meet: ev.hangoutLink ?? ev.htmlLink ?? null,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "server_error";
    if (typeof message === 'string' && message.includes('google_reconnect_required')) {
      return NextResponse.json({ error: 'google_reconnect_required' }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
