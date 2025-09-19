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
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editThumb, setEditThumb] = useState<File | null>(null)

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
    setEditFile(null)
    setEditThumb(null)
  }

  function onCancelEdit() {
    setEditingId(null)
    setEditFile(null)
    setEditThumb(null)
  }

  async function onSaveEdit() {
    if (!editingId) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('id', editingId)
      fd.append('title', editTitle)
      fd.append('description', editDesc)
      fd.append('price', editPrice)
      if (editFile) fd.append('file', editFile)
      if (editThumb) fd.append('thumbnail', editThumb)
      const res = await fetch('/api/admin/library', {
        method: 'PATCH',
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Update failed')
      setItems((prev) => prev.map((it) => (it.id === json.item.id ? json.item : it)))
      setEditFile(null)
      setEditThumb(null)
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                          <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                          <textarea className="input textarea" rows={2} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                          <div className="grid2" style={{ alignItems: 'flex-start', gap: 10 }}>
                            <input className="input" placeholder="السعر" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button type="button" className="btn btn-primary" onClick={onSaveEdit} disabled={loading}>حفظ</button>
                              <button type="button" className="btn" onClick={onCancelEdit} disabled={loading}>إلغاء</button>
                            </div>
                          </div>
                          <div className="grid2" style={{ gap: 12 }}>
                            <label className="field">
                              <span className="field-label">ملف جديد (PDF/MP4)</span>
                              <input
                                type="file"
                                className="input"
                                accept="application/pdf,video/*"
                                onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
                              />
                              {editFile ? (
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>سيتم استبدال الملف الحالي بـ {editFile.name}</span>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>اتركه فارغًا للإبقاء على الملف الحالي.</span>
                              )}
                            </label>
                            <label className="field">
                              <span className="field-label">صورة مصغرة جديدة</span>
                              <input
                                type="file"
                                className="input"
                                accept="image/*"
                                onChange={(e) => setEditThumb(e.target.files?.[0] ?? null)}
                              />
                              {editThumb ? (
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>سيتم تحديث الصورة إلى {editThumb.name}</span>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>اتركه فارغًا للإبقاء على الصورة الحالية.</span>
                              )}
                            </label>
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
