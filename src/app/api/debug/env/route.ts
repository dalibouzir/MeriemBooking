import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    clientIdStartsWith: (process.env.GOOGLE_CLIENT_ID || "").slice(0, 10),
    hasSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    refreshLen: (process.env.GOOGLE_REFRESH_TOKEN || "").length,
    calId: process.env.GOOGLE_CALENDAR_ID || "missing",
    tz: process.env.DEFAULT_TZ || "missing",
  });
}
