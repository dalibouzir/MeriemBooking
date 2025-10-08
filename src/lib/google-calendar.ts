const GAPI = "https://www.googleapis.com/calendar/v3";
const TZ = process.env.DEFAULT_TZ || "Africa/Tunis";

async function gFetch(path: string, token: string, init?: RequestInit) {
  const r = await fetch(`${GAPI}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function freeBusy(token: string, timeMin: string, timeMax: string, calendarId = "primary") {
  return gFetch(`/freeBusy`, token, {
    method: "POST",
    body: JSON.stringify({ timeMin, timeMax, timeZone: TZ, items: [{ id: calendarId }] }),
  });
}

export async function createEvent(
  token: string,
  {
    calendarId = "primary",
    summary,
    description,
    startISO,
    endISO,
    attendeeEmail,
    attendeeName,
  }: {
    calendarId?: string;
    summary: string;
    description?: string;
    startISO: string;
    endISO: string;
    attendeeEmail: string;
    attendeeName?: string;
  }
) {
  return gFetch(`/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`, token, {
    method: "POST",
    body: JSON.stringify({
      summary,
      description,
      start: { dateTime: startISO, timeZone: TZ },
      end: { dateTime: endISO, timeZone: TZ },
      attendees: [{ email: attendeeEmail, displayName: attendeeName }],
      conferenceData: {
        createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } },
      },
    }),
  });
}

export function generateDaySlots(dateISO: string, { start = "10:00", end = "18:00", stepMin = 30 } = {}) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const slots: { start: string; end: string }[] = [];
  const t0 = new Date(Date.UTC(y, m - 1, d, sh, sm));
  const t1 = new Date(Date.UTC(y, m - 1, d, eh, em));
  for (let t = new Date(t0); t < t1; t = new Date(t.getTime() + stepMin * 60000)) {
    const s = new Date(t);
    const e = new Date(t.getTime() + stepMin * 60000);
    slots.push({ start: s.toISOString(), end: e.toISOString() });
  }
  return slots;
}
