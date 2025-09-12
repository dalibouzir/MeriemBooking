const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/calendar/v3";
const TZ = process.env.DEFAULT_TZ || "Africa/Tunis";
const CAL = process.env.GOOGLE_CALENDAR_ID || "primary";

import { ensureAccessToken } from './google-oauth'
function defaultOwnerUserId(): string {
  const id = process.env.GOOGLE_OWNER_USER_ID
  if (!id) throw new Error('Missing GOOGLE_OWNER_USER_ID in .env.local')
  return id
}

async function getAccessToken() {
  return ensureAccessToken(defaultOwnerUserId())
}

async function g(path: string, init?: RequestInit) {
  const token = await getAccessToken();
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const text = await r.text();
  if (!r.ok) {
    console.error("Google API error:", text);
    throw new Error(text);
  }
  return text ? JSON.parse(text) : {};
}

export async function freeBusyForDate(dateISO: string) {
  const dayStart = `${dateISO}T00:00:00.000Z`;
  const dayEnd = `${dateISO}T23:59:59.000Z`;
  return g(`/freeBusy`, {
    method: "POST",
    body: JSON.stringify({
      timeMin: dayStart,
      timeMax: dayEnd,
      timeZone: TZ,
      items: [{ id: CAL }],
    }),
  });
}

export function generateSlots(
  dateISO: string,
  { start = "10:00", end = "18:00", stepMin = 30 } = {}
) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const out: { start: string; end: string }[] = [];
  const t0 = new Date(Date.UTC(y, m - 1, d, sh, sm));
  const t1 = new Date(Date.UTC(y, m - 1, d, eh, em));
  for (let t = new Date(t0); t < t1; t = new Date(t.getTime() + stepMin * 60000)) {
    const s = new Date(t);
    const e = new Date(t.getTime() + stepMin * 60000);
    out.push({ start: s.toISOString(), end: e.toISOString() });
  }
  return out;
}

export async function createCalendarEvent(params: {
  startISO: string; endISO: string; clientEmail: string; clientName?: string; subject?: string; notes?: string;
}) {
  return g(`/calendars/${encodeURIComponent(CAL)}/events?conferenceDataVersion=1`, {
    method: "POST",
    body: JSON.stringify({
      summary: params.subject || "Free Intro Call",
      description: `Client: ${params.clientName ?? params.clientEmail}\nNotes: ${params.notes ?? ""}`,
      start: { dateTime: params.startISO, timeZone: TZ },
      end: { dateTime: params.endISO, timeZone: TZ },
      attendees: [{ email: params.clientEmail, displayName: params.clientName }],
      conferenceData: {
        createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } },
      },
    }),
  });
}
