import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google-server";

export async function POST(req: NextRequest) {
  try {
    const { startISO, endISO, clientEmail, clientName, subject, notes } = await req.json();
    if (!startISO || !endISO || !clientEmail) return NextResponse.json({ error: "missing fields" }, { status: 400 });

    const ev = await createCalendarEvent({ startISO, endISO, clientEmail, clientName, subject, notes });
    return NextResponse.json({ ok: true, eventId: ev.id, meet: ev.hangoutLink ?? ev.htmlLink ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "server_error" }, { status: 500 });
  }
}
