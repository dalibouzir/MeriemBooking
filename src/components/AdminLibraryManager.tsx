"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import ModalPortal from '@/components/ModalPortal'

type Item = {
  id: string
  type: 'book' | 'video'
  title: string
  description: string | null
  public_url: string | null
  price: number | null
}

export default function AdminLibraryManager() {
  const { data: session } = useSession()
  // Only the credentials login exists and is limited to one email,
  // so any logged-in session is effectively admin.
  const isAdmin = !!session?.user?.email
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPrice, setEditPrice] = useState<string>('')

  useEffect(() => {
    if (!open) return
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/library', { cache: 'no-store' })
        const json = await res.json()
        if (res.ok) setItems(json.items || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [open])

  if (!isAdmin) return null

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formEl = e.currentTarget
    const fd = new FormData(formEl)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/library', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      setItems((prev) => [json.item, ...prev])
      formEl.reset()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function onDelete(id: string) {
    if (!confirm('حذف هذا العنصر؟')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/library?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Delete failed')
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function onStartEdit(i: Item) {
    setEditingId(i.id)
    setEditTitle(i.title)
    setEditDesc(i.description || '')
    setEditPrice(i.price != null ? String(i.price) : '')
  }

  async function onSaveEdit() {
    if (!editingId) return
    setLoading(true)
    try {
      type UpdatePayload = { id: string; title?: string; description?: string; price?: number | null }
      const payload: UpdatePayload = { id: editingId, title: editTitle, description: editDesc }
      if (editPrice === '') payload.price = null
      else payload.price = Number(editPrice)
      const res = await fetch('/api/admin/library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Update failed')
      setItems((prev) => prev.map((it) => (it.id === json.item.id ? json.item : it)))
      setEditingId(null)
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn btn-outline" onClick={() => setOpen(true)}>
        إدارة المكتبة
      </button>

      {open && (
        <ModalPortal>
          <div className="modal-backdrop" onClick={() => setOpen(false)}>
            <div className="modal-card glass-water" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h2>إضافة كتاب/فيديو</h2>
                <button className="btn" onClick={() => setOpen(false)}>إغلاق</button>
              </div>

            <form className="modal-form" onSubmit={onCreate}>
              <div className="grid2">
                <label className="field">
                  <span className="field-label">النوع</span>
                  <select name="type" className="input" required defaultValue="book">
                    <option value="book">كتاب</option>
                    <option value="video">فيديو</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">السعر (اختياري)</span>
                  <input name="price" type="number" step="0.01" className="input" placeholder="مثال: 29" />
                </label>
              </div>

              <label className="field">
                <span className="field-label">العنوان</span>
                <input name="title" className="input" placeholder="عنوان" required />
              </label>

              <label className="field">
                <span className="field-label">الوصف</span>
                <textarea name="description" className="input textarea" rows={3} placeholder="وصف مختصر" />
              </label>

              <div className="grid2">
                <label className="field">
                  <span className="field-label">الملف (PDF/MP4)</span>
                  <input name="file" type="file" className="input" required />
                </label>
                <label className="field">
                  <span className="field-label">الصورة المصغرة (اختياري)</span>
                  <input name="thumbnail" type="file" className="input" />
                </label>
              </div>

              <button className="btn btn-primary" disabled={loading}>
                {loading ? 'جارٍ...' : 'إضافة'}
              </button>
            </form>

              <hr style={{ margin: '16px 0', borderColor: '#eee' }} />
              <h3 style={{ marginBottom: 8 }}>العناصر</h3>
              {loading && !items.length ? <p>جارٍ التحميل…</p> : null}
              <ul className="admin-list">
                {items.map((i) => (
                  <li key={i.id} className="admin-row">
                    <div className="admin-row-main" style={{ flex: 1 }}>
                      <span className={`tag ${i.type === 'video' ? 'tag-video' : 'tag-book'}`}>
                        {i.type === 'video' ? 'فيديو' : 'كتاب'}
                      </span>
                      {editingId === i.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                          <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                          <textarea className="input textarea" rows={2} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                          <div className="grid2">
                            <input className="input" placeholder="السعر" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button type="button" className="btn btn-primary" onClick={onSaveEdit} disabled={loading}>حفظ</button>
                              <button type="button" className="btn" onClick={() => setEditingId(null)} disabled={loading}>إلغاء</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <strong>{i.title}</strong>
                          {i.public_url && (
                            <a href={i.public_url} target="_blank" rel="noreferrer" className="link">فتح</a>
                          )}
                        </>
                      )}
                    </div>
                    {editingId === i.id ? null : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn" onClick={() => onStartEdit(i)}>تعديل</button>
                        <button className="btn" onClick={() => onDelete(i.id)}>حذف</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  )
}
