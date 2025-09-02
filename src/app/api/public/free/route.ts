import { NextRequest, NextResponse } from "next/server";
import { freeBusyForDate, generateSlots } from "@/lib/google-server";

export async function POST(req: NextRequest) {
  try {
    const { date } = await req.json(); // 'YYYY-MM-DD'
    if (!date) return NextResponse.json({ error: "missing date" }, { status: 400 });

    const fb = await freeBusyForDate(date);
    const calId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const busy = (fb.calendars?.[calId]?.busy || []) as { start: string; end: string }[];

    const all = generateSlots(date, { start: "10:00", end: "18:00", stepMin: 30 });
    const free = all.filter((s) => !busy.some((b) => !(s.end <= b.start || s.start >= b.end)));

    return NextResponse.json({ free });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "server_error" }, { status: 500 });
  }
}
