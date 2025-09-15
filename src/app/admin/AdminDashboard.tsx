"use client"

import React, { useEffect, useState } from 'react'

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
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

export default function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<'schedule'|'reservations'|'email'|'tokens'|'products'|'stats'>('schedule')

  return (
    <div dir="rtl" className="main-container admin" style={{ padding: 16, maxWidth: 1440, marginInline: 'auto' }}>
      <header className="admin-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fittrah Moms — Admin</h1>
            <div className="text-sm text-gray-500" style={{ marginTop: 4 }}>{adminEmail}</div>
          </div>
          <div className="flex items-center gap-2" role="toolbar" aria-label="Header actions">
            <button className="btn btn-outline">تحديث</button>
          </div>
        </div>
      </header>
      <div className="flex flex-col gap-4">
        <nav aria-label="Admin tabs" className="admin-tabs" role="tablist">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'schedule', label: '📅 جدول المواعيد' },
              { key: 'reservations', label: '👥 الحجوزات' },
              { key: 'email', label: '✉️ الإرسال الجماعي' },
              { key: 'products', label: '📚 المنتجات' },
              { key: 'stats', label: '📈 الإحصائيات' },
            ].map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab===t.key}
                className={`btn admin-tab ${tab===t.key?'btn-primary':'btn-outline'}`}
                onClick={()=>setTab(t.key as any)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </nav>
        <main className="flex-1">
          {tab==='schedule' && <ScheduleTab/>}
          {tab==='reservations' && <ReservationsTab/>}
          {tab==='email' && <BulkEmailTab/>}
          {tab==='products' && <ProductsTab/>}
          {tab==='stats' && <StatsTab/>}
        </main>
      </div>
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

function BulkEmailTab() {
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [onlyConfirmed, setOnlyConfirmed] = useState(true)
  const [test, setTest] = useState(true)
  const [testEmail, setTestEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  async function send() {
    setLoading(true)
    setResult('')
    const r = await fetch('/api/admin/bulk-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, html, onlyConfirmed, test, testEmail })
    })
    const j = await r.json(); setLoading(false)
    if (!r.ok) return setResult(j.error || 'فشل الإرسال')
    setResult(`تم الإرسال: ${j.sent} — فشل: ${j.failed}`)
  }

  return (
    <div>
      <SectionHeader title="الإرسال الجماعي"/>
      <div className="card p-4 space-y-3">
        <input className="input" placeholder="الموضوع" value={subject} onChange={(e)=>setSubject(e.target.value)} />
        <textarea className="input textarea" rows={8} placeholder="محتوى HTML" value={html} onChange={(e)=>setHtml(e.target.value)} />
        <label className="flex items-center gap-2"><input type="checkbox" checked={onlyConfirmed} onChange={(e)=>setOnlyConfirmed(e.target.checked)} /> فقط المؤكدة</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={test} onChange={(e)=>setTest(e.target.checked)} /> وضع الاختبار</label>
        {test && <input className="input" placeholder="بريد الاختبار" value={testEmail} onChange={(e)=>setTestEmail(e.target.value)} />}
        <button className="btn btn-primary" disabled={loading} onClick={send}>{loading ? 'جارٍ الإرسال…' : 'إرسال'}</button>
        {result && <div className="text-sm text-gray-700">{result}</div>}
      </div>
    </div>
  )
}

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
    <div>
      <SectionHeader title="المنتجات"/>
      <div className="section-toolbar">
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-primary" onClick={()=>{ setEditId(null); setForm({ type: 'كتاب', title: '', description: '', slug: '', snippet: '', file: null, cover: null }); setOpen(true) }}>+ إضافة منتج</button>
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

function StatsTab() {
  const [data, setData] = useState<{ reservations: { day: string; count: number }[]; downloads: { day: string; count: number }[] }>({ reservations: [], downloads: [] })
  const [tokenSummary, setTokenSummary] = useState<{ total: number; redeemed: number; unredeemed: number }>({ total: 0, redeemed: 0, unredeemed: 0 })
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const r = await fetch('/api/admin/stats')
      const j = await r.json(); setLoading(false)
      if (r.ok) { setData(j); if (j.tokens) setTokenSummary(j.tokens) }
    })()
  }, [])

  const Bar = ({ label, series }: { label: string; series: { day: string; count: number }[] }) => {
    const max = Math.max(1, ...series.map((s) => s.count))
    return (
      <div className="card p-3">
        <div className="font-semibold mb-2">{label}</div>
        <svg width="100%" height="140" viewBox={`0 0 ${Math.max(1, series.length*10)} 140`} preserveAspectRatio="none">
          {series.map((s, i) => {
            const h = Math.max(2, (s.count / max) * 120)
            const x = i * 10 + 2
            const y = 130 - h
            return <rect key={s.day} x={x} y={y} width={6} height={h} rx={2} fill="#7c3aed" />
          })}
        </svg>
        <div className="text-xs text-gray-600 mt-1">آخر {series.length} يوم</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {loading ? <div className="text-sm text-gray-600">جارٍ التحميل…</div> : null}
      <Bar label="Reservations — last 30 days" series={data.reservations} />
      <Bar label="Downloads — last 30 days" series={data.downloads} />
      <div className="card p-3">
        <div className="font-semibold mb-2">Tokens — Total vs Redeemed</div>
        <div className="flex items-center gap-4">
          <svg width="110" height="110" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="#f3e8ff" />
            {(() => {
              const total = Math.max(1, tokenSummary.total)
              const used = Math.min(total, Math.max(0, tokenSummary.redeemed))
              const p = used / total
              const dash = p * 100
              return <circle cx="18" cy="18" r="16" fill="transparent" stroke="#7c3aed" strokeWidth="4" strokeDasharray={`${dash} 100`} transform="rotate(-90 18 18)" />
            })()}
          </svg>
          <div className="text-sm text-gray-700">
            <div>Total: <b>{tokenSummary.total}</b></div>
            <div>Redeemed: <b>{tokenSummary.redeemed}</b></div>
            <div>Unredeemed: <b>{tokenSummary.unredeemed}</b></div>
          </div>
        </div>
      </div>
    </div>
  )
}
