"use client"

import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'

function Modal({ open, onClose, title, children, footer, centered }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; centered?: boolean }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose} style={centered ? { alignItems: 'center' } : undefined}>
      <div className="modal-card glass-water" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn" onClick={onClose}>إغلاق</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  )
}

type Slot = {
  id: string
  day: string
  start_time: string
  end_time: string
  capacity: number
  remaining?: number
  is_open: boolean
  note: string | null
}

type Reservation = {
  id: string
  slot_id: string
  user_id: string
  email: string
  status: string
  created_at: string
  free_call_slots?: { day: string; start_time: string; end_time: string } | null
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-xl font-semibold text-purple-700 mb-4">{title}</h2>
}

type TabKey = 'schedule'|'reservations'|'email'|'products'|'stats'
export default function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<TabKey>('schedule')

  return (
    <div dir="rtl" className="admin-shell" style={{ maxWidth: 1600, marginInline: 'auto' }}>
      {/* Page header (separate glass card) */}
      <header className="admin-header-card glass-water">
        <div className="admin-header-row">
          <div>
            <h1 className="admin-title">Fittrah Moms — Admin</h1>
            <div className="admin-sub">{adminEmail}</div>
          </div>
          <div className="admin-head-tools" role="toolbar" aria-label="Header actions">
            <button className="btn btn-outline">تحديث</button>
          </div>
        </div>
      </header>

      {/* Tabs/action bar (separate glass bar) */}
      <nav aria-label="Admin tabs" className="admin-action glass-water" role="tablist">
        {([
          { key: 'schedule', label: '📅 جدول المواعيد' },
          { key: 'reservations', label: '👥 الحجوزات' },
          { key: 'email', label: '✉️ الإرسال الجماعي' },
          { key: 'products', label: '📚 المنتجات' },
          { key: 'stats', label: '📈 الإحصائيات' },
        ] as { key: TabKey; label: string }[]).map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab===t.key}
            className={`admin-pill ${tab===t.key?'is-active':''}`}
            onClick={()=>setTab(t.key)}
          >
            <span className="pill-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Switchable content only */}
      <main className="admin-content glass-water">
        {tab==='schedule' && <ScheduleTab/>}
        {tab==='reservations' && <ReservationsTab/>}
        {tab==='email' && <BulkEmailTab adminEmail={adminEmail}/>}
        {tab==='products' && <ProductsTab/>}
        {tab==='stats' && <StatsTab/>}
      </main>
    </div>
  )
}

function ScheduleTab() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<{day: string; start_time: string; end_time: string; capacity: number; note: string}>({ day: '', start_time: '', end_time: '', capacity: 1, note: '' })
  const [durationMin, setDurationMin] = useState<number>(60)
  const [openModal, setOpenModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [busySlotId, setBusySlotId] = useState<string | null>(null)
  const [savingSlot, setSavingSlot] = useState(false)

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().slice(0,10)
    const r = await fetch(`/api/admin/free-call/slots?from=${today}`)
    const j = await r.json()
    setLoading(false)
    if (!r.ok) return alert(j.error || 'فشل التحميل')
    setSlots(j.slots || [])
  }

  useEffect(()=>{ load() },[])

  // createSlot merged into saveSlot

  async function toggleOpen(id: string, is_open: boolean) {
    setBusySlotId(id)
    const r = await fetch('/api/admin/free-call/slots', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_open: !is_open }) })
    const j = await r.json();
    setBusySlotId(null)
    if (!r.ok) return alert(j.error || 'Update failed'); await load()
  }
  async function del(id: string) {
    if (!confirm('Delete this slot?')) return
    setBusySlotId(id)
    const r = await fetch(`/api/admin/free-call/slots?id=${id}`, { method: 'DELETE' })
    const j = await r.json();
    setBusySlotId(null)
    if (!r.ok) return alert(j.error || 'Delete failed'); await load()
  }

  async function saveSlot() {
    if (!form.day || !form.start_time || form.capacity <= 0) { alert('تحققي من المدخلات'); return }
    const end_time = form.end_time || addDuration(form.start_time, durationMin)
    const method = editId ? 'PATCH' : 'POST'
    const body = editId ? { id: editId, ...form, end_time, is_open: true, note: form.note || null } : { ...form, end_time, is_open: true, note: form.note || null }
    setSavingSlot(true)
    const r = await fetch('/api/admin/free-call/slots', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const j = await r.json();
    setSavingSlot(false)
    if (!r.ok) return alert(j.error || 'Save failed')
    setOpenModal(false); setEditId(null); setForm({ day: '', start_time: '', end_time: '', capacity: 1, note: '' }); await load()
  }

  return (
    <div>
      <SectionHeader title="جدول المواعيد"/>
        <div className="section-toolbar">
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn btn-primary" onClick={()=>{ setEditId(null); setForm({ day: '', start_time: '', end_time: '', capacity: 1, note: '' }); setOpenModal(true) }}>+ إضافة موعد</button>
            <span className="text-sm text-gray-600">اختيارات سريعة:</span>
            {['11:00','12:00','13:00','14:00','15:00','16:00'].map(t => (
              <button key={t} className="btn btn-outline" onClick={()=>{ setEditId(null); setForm({ day: new Date().toISOString().slice(0,10), start_time: t, end_time: addDuration(t, durationMin), capacity: 1, note: '' }); setOpenModal(true) }}>{t}</button>
            ))}
          </div>
        </div>
      <div className="overflow-x-auto">
        <table className="table responsive text-sm">
          <thead>
            <tr className="bg-purple-100 text-purple-800">
              <th className="p-2 text-right">اليوم</th>
              <th className="p-2 text-right">البدء</th>
              <th className="p-2 text-right">النهاية</th>
              <th className="p-2 text-right">السعة</th>
              <th className="p-2 text-right">المتبقي</th>
              <th className="p-2 text-right">الحالة</th>
              <th className="p-2 text-right">ملاحظة</th>
              <th className="p-2 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-2" colSpan={8}>جارٍ التحميل…</td></tr>
            ) : slots.length === 0 ? (
              <tr><td className="p-2" colSpan={8}>لا يوجد مواعيد</td></tr>
            ) : slots.map((s) => (
              <tr key={s.id} className="odd:bg-gray-50">
                <td className="p-2" data-th="Day">{s.day}</td>
                <td className="p-2" data-th="Start">{s.start_time}</td>
                <td className="p-2" data-th="End">{s.end_time}</td>
                <td className="p-2" data-th="Capacity">{s.capacity}</td>
                <td className="p-2" data-th="Remaining">{s.remaining ?? 0}</td>
                <td className="p-2" data-th="Status">{s.is_open ? 'Open' : 'Closed'}</td>
                <td className="p-2" data-th="Note">{s.note || ''}</td>
                <td className="p-2 actions" data-th="Actions">
                  <button className="btn btn-outline" disabled={busySlotId===s.id} onClick={()=>toggleOpen(s.id, s.is_open)}>{busySlotId===s.id ? '...' : (s.is_open ? 'Close' : 'Open')}</button>
                  <button className="btn" disabled={busySlotId===s.id} onClick={()=>{ setEditId(s.id); setForm({ day: s.day, start_time: s.start_time, end_time: s.end_time, capacity: s.capacity, note: s.note || '' }); setOpenModal(true) }}>Edit</button>
                  <button className="btn" disabled={busySlotId===s.id} onClick={()=>del(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={openModal} onClose={()=>setOpenModal(false)} title={editId ? 'Edit Slot' : 'Add Slot'} footer={<div className="flex gap-2"><button className="btn btn-primary" disabled={savingSlot} onClick={saveSlot}>{savingSlot ? 'Saving…' : (editId ? 'Save' : 'Add')}</button><button className="btn" onClick={()=>setOpenModal(false)}>Cancel</button></div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="field"><span className="field-label">Day</span><input className="input" type="date" value={form.day} onChange={(e)=>setForm(f=>({...f, day: e.target.value}))} /></label>
          <label className="field"><span className="field-label">Start</span><input className="input" type="time" value={form.start_time} onChange={(e)=>setForm(f=>({...f, start_time: e.target.value}))} /></label>
          <label className="field"><span className="field-label">End</span><input className="input" type="time" value={form.end_time} onChange={(e)=>setForm(f=>({...f, end_time: e.target.value}))} placeholder="Optional" /></label>
          <label className="field"><span className="field-label">Duration</span><select className="input" value={durationMin} onChange={(e)=>setDurationMin(Number(e.target.value))}><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>60 min</option><option value={90}>90 min</option></select></label>
          <label className="field"><span className="field-label">Capacity</span><input className="input" type="number" min={1} value={form.capacity} onChange={(e)=>setForm(f=>({...f, capacity: Number(e.target.value||1)}))} /></label>
          <label className="field md:col-span-2"><span className="field-label">Note</span><input className="input" value={form.note} onChange={(e)=>setForm(f=>({...f, note: e.target.value}))} /></label>
        </div>
      </Modal>
    </div>
  )
}

function addDuration(startHHMM: string, minutes: number): string {
  const [h, m] = startHHMM.split(':').map((x) => parseInt(x || '0', 10))
  const base = new Date(0,0,1,h||0,m||0,0)
  const end = new Date(base.getTime() + minutes * 60000)
  const hh = String(end.getHours()).padStart(2,'0')
  const mm = String(end.getMinutes()).padStart(2,'0')
  return `${hh}:${mm}`
}

function ReservationsTab() {
  const [items, setItems] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [day, setDay] = useState('')
  const [slotId, setSlotId] = useState('')
  const [cancelBusy, setCancelBusy] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (day) params.set('day', day)
    if (slotId) params.set('slot_id', slotId)
    const r = await fetch(`/api/admin/free-call/reservations?${params.toString()}`)
    const j = await r.json()
    setLoading(false)
    if (!r.ok) return alert(j.error || 'فشل التحميل')
    setItems(j.reservations || [])
  }

  useEffect(()=>{ load() },[])

  async function cancel(id: string) {
    if (!confirm('Cancel this reservation?')) return
    setCancelBusy(id)
    const r = await fetch('/api/admin/free-call/reservations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const j = await r.json(); setCancelBusy(null); if (!r.ok) return alert(j.error || 'Cancel failed')
    await load()
  }

  return (
    <div>
      <SectionHeader title="الحجوزات"/>
      <div className="section-toolbar">
        <div className="flex items-center gap-2 flex-wrap">
          <input className="input" placeholder="اليوم (اختياري)" value={day} onChange={(e)=>setDay(e.target.value)} />
          <input className="input" placeholder="معرّف الموعد (اختياري)" value={slotId} onChange={(e)=>setSlotId(e.target.value)} />
          <button className="btn btn-primary" onClick={load}>تحديث</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table responsive text-sm">
          <thead>
            <tr className="bg-purple-100 text-purple-800">
              <th className="p-2 text-right">البريد</th>
              <th className="p-2 text-right">اليوم</th>
              <th className="p-2 text-right">الوقت</th>
              <th className="p-2 text-right">الحالة</th>
              <th className="p-2 text-right">أُنشئت</th>
              <th className="p-2 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-2" colSpan={6}>جارٍ التحميل…</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="p-2" colSpan={6}>لا يوجد حجوزات</td></tr>
            ) : items.map((r) => (
              <tr key={r.id} className="odd:bg-gray-50">
                <td className="p-2" data-th="Email">{r.email}</td>
                <td className="p-2" data-th="Day">{r.free_call_slots?.day}</td>
                <td className="p-2" data-th="Time">{r.free_call_slots?.start_time} – {r.free_call_slots?.end_time}</td>
                <td className="p-2" data-th="Status">{r.status}</td>
                <td className="p-2" data-th="Created">{new Date(r.created_at).toLocaleString('en-GB')}</td>
                <td className="p-2 actions" data-th="Actions"><button className="btn" disabled={cancelBusy===r.id} onClick={()=>cancel(r.id)}>{cancelBusy===r.id ? '...' : 'Cancel'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type Recipient = {
  email: string
  emailKey: string
  names: string[]
  reservationCount: number
  reservationConfirmedCount: number
  downloadCount: number
  productSlugs: string[]
  countries: string[]
  statuses: string[]
  lastSeen: number
  details: string[]
  summary: string
  detailsText: string
  lastActivityLabel: string
}

function BulkEmailTab({ adminEmail }: { adminEmail: string }) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [pickerOpen, setPickerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)

  const loadRecipients = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [reservationsRes, downloadsRes] = await Promise.all([
        fetch('/api/admin/free-call/reservations'),
        fetch('/api/admin/download-requests'),
      ])

      const reservationsJson = await reservationsRes.json().catch(() => ({} as { reservations?: Reservation[]; error?: string }))
      const downloadsJson = await downloadsRes.json().catch(() => ({} as { rows?: Array<{ id: number; created_at: string; name: string; email: string; country: string | null; product_slug: string | null }>; error?: string }))

      if (!reservationsRes.ok) throw new Error(reservationsJson?.error || 'فشل تحميل الحجوزات')
      if (!downloadsRes.ok) throw new Error(downloadsJson?.error || 'فشل تحميل التنزيلات')

      type RecipientAccumulator = {
        key: string
        email: string
        names: Set<string>
        reservationCount: number
        reservationConfirmedCount: number
        downloadCount: number
        productSlugs: Set<string>
        countries: Set<string>
        statuses: Set<string>
        lastSeen: number
        details: Set<string>
      }

      const map = new Map<string, RecipientAccumulator>()
      const ensureEntry = (rawEmail?: string | null) => {
        const trimmed = (rawEmail || '').trim()
        if (!trimmed || !trimmed.includes('@')) return null
        const key = trimmed.toLowerCase()
        let entry = map.get(key)
        if (!entry) {
          entry = {
            key,
            email: trimmed,
            names: new Set<string>(),
            reservationCount: 0,
            reservationConfirmedCount: 0,
            downloadCount: 0,
            productSlugs: new Set<string>(),
            countries: new Set<string>(),
            statuses: new Set<string>(),
            lastSeen: 0,
            details: new Set<string>(),
          }
          map.set(key, entry)
        }
        return entry
      }

      const reservations = (reservationsJson?.reservations || []) as Reservation[]
      for (const res of reservations) {
        const entry = ensureEntry(res?.email)
        if (!entry) continue
        entry.reservationCount += 1
        const status = (res?.status || '').trim()
        if (status) entry.statuses.add(status)
        if (status.toLowerCase() === 'confirmed') entry.reservationConfirmedCount += 1
        const createdAt = res?.created_at ? Date.parse(res.created_at) : 0
        if (createdAt && createdAt > entry.lastSeen) entry.lastSeen = createdAt
        const slot = res?.free_call_slots
        const slotLabel = slot?.day ? `${slot.day} ${slot.start_time || ''}`.trim() : ''
        if (slotLabel) entry.details.add(`حجز: ${slotLabel}${status ? ` (${status})` : ''}`)
      }

      type DownloadRow = { id: number; created_at: string; name: string; email: string; country: string | null; product_slug: string | null }
      const downloads = (downloadsJson?.rows || []) as DownloadRow[]
      for (const row of downloads) {
        const entry = ensureEntry(row?.email)
        if (!entry) continue
        entry.downloadCount += 1
        if (row?.name) entry.names.add(row.name)
        if (row?.product_slug) entry.productSlugs.add(row.product_slug)
        if (row?.country) entry.countries.add(row.country)
        const createdAt = row?.created_at ? Date.parse(row.created_at) : 0
        if (createdAt && createdAt > entry.lastSeen) entry.lastSeen = createdAt
        entry.details.add(`تنزيل: ${row?.product_slug || 'بدون اسم'}`)
      }

      const aggregated: Recipient[] = Array.from(map.values()).map((entry) => {
        const names = Array.from(entry.names)
        const productSlugs = Array.from(entry.productSlugs)
        const countries = Array.from(entry.countries)
        const statuses = Array.from(entry.statuses)
        const details = Array.from(entry.details)
        const confirmed = entry.reservationConfirmedCount
        const pending = entry.reservationCount - confirmed
        const summaryParts: string[] = []
        if (entry.reservationCount) {
          let part = `حجوزات: ${entry.reservationCount}`
          if (confirmed) part += ` (مؤكدة: ${confirmed})`
          if (pending > 0) part += ` (أخرى: ${pending})`
          summaryParts.push(part)
        }
        if (entry.downloadCount) summaryParts.push(`تنزيلات: ${entry.downloadCount}`)
        if (productSlugs.length) summaryParts.push(`منتجات: ${productSlugs.join(', ')}`)
        const summary = summaryParts.join(' • ') || '—'
        const detailsText = details.length ? details.join(' • ') : ''
        const lastActivityLabel = entry.lastSeen ? new Date(entry.lastSeen).toLocaleString('en-GB') : '—'

        return {
          email: entry.email,
          emailKey: entry.key,
          names,
          reservationCount: entry.reservationCount,
          reservationConfirmedCount: entry.reservationConfirmedCount,
          downloadCount: entry.downloadCount,
          productSlugs,
          countries,
          statuses,
          lastSeen: entry.lastSeen,
          details,
          summary,
          detailsText,
          lastActivityLabel,
        }
      })

      aggregated.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0) || a.email.localeCompare(b.email))

      setRecipients(aggregated)
      setSelected((prev) => {
        const next: Record<string, boolean> = {}
        for (const item of aggregated) {
          next[item.emailKey] = prev[item.emailKey] ?? true
        }
        return next
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'تعذر تحميل البيانات'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecipients()
  }, [loadRecipients])

  const deferredRecipients = useDeferredValue(recipients)
  const selectedCount = useMemo(() => deferredRecipients.reduce((count, r) => count + (selected[r.emailKey] ? 1 : 0), 0), [selected, deferredRecipients])
  const filteredRecipients = useMemo(() => {
    let list = deferredRecipients
    if (showSelectedOnly) list = list.filter((r) => selected[r.emailKey])
    const q = searchTerm.trim().toLowerCase()
    if (!q) return list
    return list.filter((r) =>
      r.email.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      (r.names.length > 0 && r.names.some((name) => name.toLowerCase().includes(q)))
    )
  }, [deferredRecipients, searchTerm, selected, showSelectedOnly])

  const totalLoaded = deferredRecipients.length
  const filteredCount = filteredRecipients.length

  const toggleRecipient = useCallback((emailKey: string) => {
    setSelected((prev) => ({ ...prev, [emailKey]: !prev[emailKey] }))
  }, [])

  function selectAll() {
    setSelected((prev) => {
      const next = { ...prev }
      for (const item of filteredRecipients) next[item.emailKey] = true
      return next
    })
  }

  function clearSelection() {
    setSelected((prev) => {
      const next = { ...prev }
      for (const item of filteredRecipients) next[item.emailKey] = false
      return next
    })
  }

  function openGmail() {
    const emails = deferredRecipients.filter((r) => selected[r.emailKey]).map((r) => r.email)
    if (emails.length === 0) {
      alert('اختاري بريداً واحداً على الأقل')
      return
    }
    const url = new URL('https://mail.google.com/mail/u/0/')
    url.searchParams.set('view', 'cm')
    url.searchParams.set('fs', '1')
    url.searchParams.set('tf', '1')
    if (adminEmail) url.searchParams.set('to', adminEmail)
    url.searchParams.set('bcc', emails.join(','))
    if (subject.trim()) url.searchParams.set('su', subject.trim())
    if (body.trim()) url.searchParams.set('body', body)
    window.open(url.toString(), '_blank', 'noopener')
  }

  return (
    <div>
      <SectionHeader title="الإرسال الجماعي"/>
      <div className="card p-4 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-700">
            <div>العناوين المحمّلة: {totalLoaded}</div>
            <div>المحددة: {selectedCount}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={loadRecipients} disabled={loading}>تحديث</button>
            <button className="btn btn-outline" onClick={() => setPickerOpen(true)} disabled={totalLoaded === 0}>اختيار العناوين</button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input className="input" placeholder="الموضوع (اختياري)" value={subject} onChange={(e)=>setSubject(e.target.value)} />
          <textarea className="input textarea md:col-span-2" rows={4} placeholder="نص البريد (اختياري)" value={body} onChange={(e)=>setBody(e.target.value)} />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {loading && <div className="text-sm text-gray-600">جارٍ التحميل…</div>}

        {selectedCount > 0 ? (
          <div className="text-sm text-gray-700">
            سيتم إرسال البريد إلى {selectedCount} عنوان عبر حقل BCC في Gmail.
          </div>
        ) : (
          <div className="text-sm text-gray-600">حددي بريداً واحداً على الأقل قبل الإرسال.</div>
        )}

        <button className="btn btn-primary" onClick={openGmail} disabled={selectedCount === 0}>فتح Gmail</button>
      </div>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="اختيار العناوين"
        centered
        footer={
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => { selectAll(); }}>تحديد الكل</button>
            <button className="btn btn-outline" onClick={() => { clearSelection(); }}>إلغاء الكل</button>
            <button className="btn" onClick={() => setPickerOpen(false)}>تم</button>
          </div>
        }
      >
        {totalLoaded === 0 ? (
          <div className="text-sm text-gray-600">لا توجد عناوين لعرضها.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="grid" style={{ gap: 12 }}>
              <input
                className="input"
                placeholder="ابحثي عن بريد أو اسم"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm" style={{ color: '#4b5563' }}>
                <input type="checkbox" checked={showSelectedOnly} onChange={(e) => setShowSelectedOnly(e.target.checked)} />
                عرض المحددة فقط
              </label>
              <div className="text-xs text-gray-500">المعروضة الآن: {filteredCount} / {totalLoaded}</div>
            </div>
            <div style={{ maxHeight: '55vh', overflowY: 'auto', display: 'grid', gap: 12 }}>
              {filteredCount === 0 ? (
                <div className="text-sm text-gray-500">لا توجد نتائج مطابقة.</div>
              ) : (
                filteredRecipients.map((item) => (
                  <RecipientListItem key={item.emailKey} item={item} isSelected={!!selected[item.emailKey]} onToggle={toggleRecipient} />
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

type RecipientListItemProps = {
  item: Recipient
  isSelected: boolean
  onToggle: (emailKey: string) => void
}

const RecipientListItem = React.memo(({ item, isSelected, onToggle }: RecipientListItemProps) => {
  return (
    <label
      className="glass-water"
      style={{
        borderRadius: 12,
        padding: '12px 16px',
        display: 'grid',
        gap: 8,
        background: 'var(--card-bg, rgba(255,255,255,0.85))',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>{item.email}</span>
        <input type="checkbox" checked={isSelected} onChange={() => onToggle(item.emailKey)} />
      </div>
      {item.names.length > 0 && <div className="text-xs text-gray-600">{item.names.join(' / ')}</div>}
      <div className="text-xs" style={{ color: '#4b5563' }}>{item.summary}</div>
      <div className="text-xs text-gray-500">آخر نشاط: {item.lastActivityLabel}</div>
    </label>
  )
})

RecipientListItem.displayName = 'RecipientListItem'

// Tokens tab removed per request; token summary appears in Stats

function ProductsTab() {
  const [items, setItems] = useState<{ id: string; type: 'كتاب'|'فيديو'; title: string; slug: string; cover: string; description?: string; snippet?: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{ type: 'كتاب'|'فيديو'; title: string; description: string; slug: string; snippet: string; file: File | null; cover: File | null }>({ type: 'كتاب', title: '', description: '', slug: '', snippet: '', file: null, cover: null })
  const [saving, setSaving] = useState(false)
  const [delBusy, setDelBusy] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  type ProductRow = { id: string; type: 'كتاب'|'فيديو'; title: string; slug: string; cover: string; description?: string|null; snippet?: string|null }

  async function load() {
    setLoading(true)
    const r = await fetch('/api/admin/products')
    const j = await r.json(); setLoading(false)
    if (!r.ok) return alert(j.error || 'فشل التحميل')
    const rows = (j.products || []) as ProductRow[]
    setItems(rows.map((p) => ({ id: p.id, type: p.type, title: p.title, slug: p.slug, cover: p.cover, description: p.description || undefined, snippet: p.snippet || undefined })))
  }
  useEffect(()=>{ load() },[])

  async function save() {
    // Create vs Update
    if (editId) {
      // Update metadata only
      if (!form.title || !form.description || !form.slug) return alert('أكملي الحقول المطلوبة')
      setSaving(true)
      const payload: Record<string, unknown> = {
        id: editId,
        type: form.type,
        title: form.title,
        description: form.description,
        slug: form.slug,
        snippet: form.snippet || null,
      }
      const r = await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await r.json(); setSaving(false)
      if (!r.ok) return alert(j.error || 'Update failed')
      setOpen(false); setEditId(null)
      setForm({ type: 'كتاب', title: '', description: '', slug: '', snippet: '', file: null, cover: null })
      await load()
    } else {
      // Create requires file
      if (!form.title || !form.description || !form.slug || !form.file) return alert('أكملي الحقول المطلوبة')
      setSaving(true)
      const fd = new FormData()
      fd.set('type', form.type)
      fd.set('title', form.title)
      fd.set('description', form.description)
      fd.set('slug', form.slug)
      if (form.snippet) fd.set('snippet', form.snippet)
      fd.set('file', form.file)
      if (form.cover) fd.set('cover', form.cover)
      const r = await fetch('/api/admin/products-upload', { method: 'POST', body: fd })
      const j = await r.json(); setSaving(false)
      if (!r.ok) return alert(j.error || 'Create failed')
      setOpen(false)
      setForm({ type: 'كتاب', title: '', description: '', slug: '', snippet: '', file: null, cover: null })
      await load()
    }
  }

  async function del(id: string) {
    if (!confirm('Delete this product?')) return
    setDelBusy(id)
    const r = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' })
    const j = await r.json(); setDelBusy(null)
    if (!r.ok) return alert(j.error || 'Delete failed')
    await load()
  }

  return (
    <div aria-labelledby="products-title" role="region">
      <SectionHeader title="المنتجات"/>
      <div className="section-toolbar">
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-primary" onClick={()=>{ setEditId(null); setForm({ type: 'كتاب', title: '', description: '', slug: '', snippet: '', file: null, cover: null }); setOpen(true) }}>+ إضافة منتج</button>
        </div>
      </div>
      {/* تحميل المنتج — بطاقة إرشادية */}
      <div className="card glass-water p-3" style={{ margin: '8px 0 10px' }}>
        <div className="text-sm" style={{ color: '#404252' }}>
          <strong>تحميل المنتج:</strong> ارفعي ملف المنتج (PDF/MP4) وغلافه، ثم أدخلي العنوان والوصف والـ slug.
          بعد الحفظ سيظهر المنتج في الصفحة الرئيسية ويمكن تنزيله.
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table responsive text-sm">
          <thead>
            <tr className="bg-purple-100 text-purple-800">
              <th className="p-2 text-right">الغلاف</th>
              <th className="p-2 text-right">العنوان</th>
              <th className="p-2 text-right">النوع</th>
              <th className="p-2 text-right">Slug</th>
              <th className="p-2 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td className="p-2" colSpan={5}>جارٍ التحميل…</td></tr>) : items.length === 0 ? (<tr><td className="p-2" colSpan={5}>لا توجد منتجات</td></tr>) : items.map(p => (
              <tr key={p.id} className="odd:bg-gray-50">
                <td className="p-2" data-th="Cover"><img src={p.cover} alt="cover" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} /></td>
                <td className="p-2" data-th="Title">{p.title}</td>
                <td className="p-2" data-th="Type">{p.type}</td>
                <td className="p-2" data-th="Slug">{p.slug}</td>
                <td className="p-2 actions" data-th="Actions">
                  <button className="btn" onClick={()=>{ setEditId(p.id); setForm({ type: p.type, title: p.title, description: p.description || '', slug: p.slug, snippet: p.snippet || '', file: null, cover: null }); setOpen(true) }}>Edit</button>
                  <button className="btn" disabled={delBusy===p.id} onClick={()=>del(p.id)}>{delBusy===p.id ? '...' : 'حذف'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={()=>{ setOpen(false); setEditId(null) }} title={editId ? 'تعديل منتج' : 'إضافة منتج'} footer={<div className="flex gap-2"><button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? (editId ? 'جارٍ حفظ…' : 'جارٍ…') : (editId ? 'حفظ' : 'إضافة')}</button><button className="btn" onClick={()=>{ setOpen(false); setEditId(null) }}>إلغاء</button></div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="field"><span className="field-label">النوع</span><select className="input" value={form.type} onChange={(e)=>setForm(f=>({ ...f, type: e.target.value as 'كتاب'|'فيديو' }))}><option value="كتاب">كتاب</option><option value="فيديو">فيديو</option></select></label>
          <label className="field"><span className="field-label">العنوان</span><input className="input" value={form.title} onChange={(e)=>setForm(f=>({ ...f, title: e.target.value }))} /></label>
          <label className="field md:col-span-2"><span className="field-label">الوصف</span><textarea className="input textarea" rows={3} value={form.description} onChange={(e)=>setForm(f=>({ ...f, description: e.target.value }))} /></label>
          <label className="field"><span className="field-label">Slug</span><input className="input" value={form.slug} onChange={(e)=>setForm(f=>({ ...f, slug: e.target.value }))} /></label>
          <label className="field"><span className="field-label">مقتطف</span><input className="input" value={form.snippet} onChange={(e)=>setForm(f=>({ ...f, snippet: e.target.value }))} /></label>
          {!editId && (
            <>
              <label className="field"><span className="field-label">ملف المنتج</span><input className="input" type="file" onChange={(e)=>setForm(f=>({ ...f, file: e.target.files?.[0] || null }))} /></label>
              <label className="field"><span className="field-label">صورة الغلاف</span><input className="input" type="file" onChange={(e)=>setForm(f=>({ ...f, cover: e.target.files?.[0] || null }))} /></label>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

type PlotData = unknown
type PlotLayout = { title?: string; margin?: { t?: number; r?: number; l?: number; b?: number }; paper_bgcolor?: string; plot_bgcolor?: string }
type PlotConfig = { displayModeBar?: boolean; responsive?: boolean }
interface PlotlyStatic { react: (id: string, data: PlotData[], layout?: PlotLayout, config?: PlotConfig) => void }
declare global { interface Window { Plotly?: PlotlyStatic } }

function StatsTab() {
  const [data, setData] = useState<{ reservations: { day: string; count: number }[]; downloads: { day: string; count: number }[] }>({ reservations: [], downloads: [] })
  const [tokenSummary, setTokenSummary] = useState<{ total: number; redeemed: number; unredeemed: number }>({ total: 0, redeemed: 0, unredeemed: 0 })
  const [loading, setLoading] = useState(false)
  const [reqs, setReqs] = useState<Array<{ id: number; created_at: string; name: string; email: string; country: string | null; product_slug: string }>>([])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const r = await fetch('/api/admin/stats')
      const j = await r.json(); setLoading(false)
      if (r.ok) { setData(j); if (j.tokens) setTokenSummary(j.tokens) }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      const r = await fetch('/api/admin/download-requests')
      const j = await r.json()
      if (r.ok) {
        const rows = (j.rows || []) as Array<{ id: number; created_at: string; name: string; email: string; country: string | null; product_slug: string }>
        // Keep only the latest row per email (API returns newest first)
        const seen = new Set<string>()
        const uniq: typeof rows = []
        for (const row of rows) {
          const key = (row.email || '').trim().toLowerCase()
          if (!key) continue
          if (seen.has(key)) continue
          seen.add(key)
          uniq.push(row)
        }
        setReqs(uniq)
      }
    })()
  }, [])

  useEffect(() => {
    if (!data.reservations.length && !data.downloads.length) return
    ensurePlotly().then(() => { renderPlots(data, tokenSummary) })
  }, [data, tokenSummary])

  function ensurePlotly(): Promise<PlotlyStatic> {
    if (window.Plotly) return Promise.resolve(window.Plotly)
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdn.plot.ly/plotly-2.26.0.min.js'
      s.async = true
      s.onload = () => resolve(window.Plotly as PlotlyStatic)
      s.onerror = reject
      document.head.appendChild(s)
    })
  }

  function renderPlots(d: { reservations: { day: string; count: number }[]; downloads: { day: string; count: number }[] }, tokens: { total: number; redeemed: number; unredeemed: number }) {
    const P = window.Plotly
    if (!P) return
    const daysR = d.reservations.map(x => x.day)
    const valsR = d.reservations.map(x => x.count)
    P.react('chart-resv', [{ type: 'bar', x: daysR, y: valsR, marker: { color: '#7c3aed' } }], { title: 'الحجوزات (آخر 30 يومًا)', margin: { t: 40, r: 10, l: 10, b: 40 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' }, { displayModeBar: false, responsive: true })

    const daysD = d.downloads.map(x => x.day)
    const valsD = d.downloads.map(x => x.count)
    P.react('chart-dl', [{ type: 'bar', x: daysD, y: valsD, marker: { color: '#22c55e' } }], { title: 'التنزيلات (آخر 30 يومًا)', margin: { t: 40, r: 10, l: 10, b: 40 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' }, { displayModeBar: false, responsive: true })

    const total = Math.max(1, tokens.total)
    const redeemed = Math.min(total, Math.max(0, tokens.redeemed))
    const unredeemed = Math.max(0, total - redeemed)
    P.react('chart-tokens', [{
      type: 'pie', values: [redeemed, unredeemed], labels: ['Redeemed', 'Unredeemed'], hole: 0.5,
      marker: { colors: ['#7c3aed', '#c084fc'] }
    }], { title: 'Tokens', margin: { t: 40, r: 10, l: 10, b: 10 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' }, { displayModeBar: false, responsive: true })
  }

  return (
    <div>
      <div className="admin-charts-row">
      {loading ? <div className="text-sm text-gray-600">جارٍ التحميل…</div> : null}
      <div className="card p-3 admin-chart"><div id="chart-resv" style={{height: 220}} /></div>
      <div className="card p-3 admin-chart"><div id="chart-dl" style={{height: 220}} /></div>
      <div className="card p-3 admin-chart"><div id="chart-tokens" style={{height: 220}} /></div>
      </div>

      {/* Download requests table */}
      <div className="card p-3" style={{ marginTop: 12 }}>
        <div className="font-semibold mb-2">طلبات التنزيل (آخر {reqs.length} سجل)</div>
        <div className="overflow-x-auto">
          <table className="table text-sm">
            <thead>
              <tr>
                <th className="p-2 text-right">التاريخ</th>
                <th className="p-2 text-right">الاسم</th>
                <th className="p-2 text-right">البريد</th>
                <th className="p-2 text-right">البلد</th>
                <th className="p-2 text-right">المنتج</th>
              </tr>
            </thead>
            <tbody>
              {reqs.length === 0 ? (
                <tr><td className="p-2" colSpan={5}>لا توجد بيانات</td></tr>
              ) : (
                reqs.map(r => (
                  <tr key={r.id}>
                    <td className="p-2" data-th="التاريخ">{new Date(r.created_at).toLocaleString('ar-TN')}</td>
                    <td className="p-2" data-th="الاسم">{r.name}</td>
                    <td className="p-2" data-th="البريد">{r.email}</td>
                    <td className="p-2" data-th="البلد">{r.country || '-'}</td>
                    <td className="p-2" data-th="المنتج">{r.product_slug}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
