import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google-server";

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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
