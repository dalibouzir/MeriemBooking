"use client";
import { useState } from "react";

export default function GoogleBookButton({ startISO, endISO }: { startISO: string; endISO: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<string | null>(null);

  async function book() {
    setLoading(true);
    setResp(null);
    const r = await fetch("/api/google/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startISO, endISO, clientEmail: email, clientName: name, subject: "Free Call", notes }),
    });
    const j = await r.json();
    setResp(r.ok ? (j.meet || "Booked") : `Error: ${j.error}`);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button onClick={book} disabled={loading}>{loading ? "Booking..." : "Book"}</button>
      {resp && <p>{resp}</p>}
    </div>
  );
}
