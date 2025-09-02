import { NextRequest, NextResponse } from "next/server";
import { freeBusyForDate, generateSlots } from "@/lib/google-server";

type FreeBody = { date: string }; // 'YYYY-MM-DD'

function isFreeBody(x: unknown): x is FreeBody {
  return typeof x === "object" && x !== null && typeof (x as Record<string, unknown>).date === "string";
}

type BusyRange = { start: string; end: string };
type FreeBusyCalendars = Record<string, { busy?: BusyRange[] }>;
type FreeBusyResult = { calendars?: FreeBusyCalendars };

function isBusyRangeArray(x: unknown): x is BusyRange[] {
  return Array.isArray(x) && x.every(
    (b) => typeof b === "object" && b !== null &&
      typeof (b as Record<string, unknown>).start === "string" &&
      typeof (b as Record<string, unknown>).end === "string"
  );
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();

    if (!isFreeBody(body)) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const { date } = body;

    const fb: FreeBusyResult = await freeBusyForDate(date);
    const calId = process.env.GOOGLE_CALENDAR_ID || "primary";

    const rawBusy = fb.calendars?.[calId]?.busy;
    const busy: BusyRange[] = isBusyRangeArray(rawBusy) ? rawBusy : [];

    const all = generateSlots(date, { start: "10:00", end: "18:00", stepMin: 30 });

    // keep only slots that do NOT overlap any busy range
    const intersects = (s: { start: string; end: string }, b: BusyRange) =>
      !(s.end <= b.start || s.start >= b.end);

    const free = all.filter((s) => !busy.some((b) => intersects(s, b)));

    return NextResponse.json({ free });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "server_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
