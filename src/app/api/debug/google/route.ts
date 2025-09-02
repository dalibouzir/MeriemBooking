import { NextResponse } from "next/server";
export async function GET() {
  const TOKEN_URL = "https://oauth2.googleapis.com/token";
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
    }),
    cache: "no-store",
  });
  const text = await res.text();
  return NextResponse.json({ ok: res.ok, status: res.status, reply: text.slice(0, 1000) }, { status: res.ok ? 200 : 500 });
}
