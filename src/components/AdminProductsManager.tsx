"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import ModalPortal from '@/components/ModalPortal'

type Product = {
  id: string
  type: 'كتاب' | 'فيديو'
  title: string
  description: string
  cover: string
  rating: number | null
  reviews: number | null
  slug: string
  snippet: string | null
  created_at?: string
}

export default function AdminProductsManager() {
  const { data: session } = useSession()
  const isAdmin = !!session?.user?.email
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<Product>>({ type: 'كتاب' })
  const [file, setFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editCover, setEditCover] = useState<File | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'فشل التحميل')
      setItems(json.products || [])
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    load()
  }, [open])

  if (!isAdmin) return null

  function resetEditState() {
    setEditingId(null)
    setEditFile(null)
    setEditCover(null)
  }

  function closeModal() {
    setOpen(false)
    resetEditState()
  }

  async function create() {
    if (!form.type || !form.title || !form.description || !form.slug) {
      alert('أكملي الحقول المطلوبة')
      return
    }
    if (!file) {
      alert('رجاءً رفع ملف المنتج')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.set('type', String(form.type))
      fd.set('title', String(form.title))
      fd.set('description', String(form.description))
      fd.set('slug', String(form.slug))
      if (form.snippet) fd.set('snippet', String(form.snippet))
      fd.set('file', file)
      if (coverFile) fd.set('cover', coverFile)

      const res = await fetch('/api/admin/products-upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'فشل الإضافة')

      setForm({ type: 'كتاب' })
      setFile(null)
      setCoverFile(null)
      await load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function save(product: Product) {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('id', product.id)
      fd.append('type', product.type)
      fd.append('title', product.title)
      fd.append('description', product.description)
      fd.append('slug', product.slug)
      fd.append('snippet', product.snippet || '')
      if (product.rating != null) fd.append('rating', String(product.rating))
      if (product.reviews != null) fd.append('reviews', String(product.reviews))
      if (editFile) fd.append('file', editFile)
      if (editCover) fd.append('cover', editCover)

      const res = await fetch('/api/admin/products', { method: 'PATCH', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'فشل التعديل')

      resetEditState()
      await load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function del(id: string) {
    if (!confirm('حذف المنتج؟')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'فشل الحذف')
      await load()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn btn-outline" onClick={() => setOpen(true)}>
        إدارة المنتجات القديمة
      </button>

      {open && (
        <ModalPortal>
          <div className="modal-backdrop" onClick={closeModal}>
            <div
              className="modal-card glass-water"
              style={{ maxWidth: '900px', width: '95vw', maxHeight: '90vh', overflow: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-head">
                <h2>إدارة المنتجات (جدول products)</h2>
                <button className="btn" onClick={closeModal}>
                  إغلاق
                </button>
              </div>

              <div className="space-y-4">
                <div className="card p-4">
                  <h3 className="text-lg font-semibold mb-2">إضافة منتج</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select
                      className="input"
                      value={form.type || 'كتاب'}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Product['type'] }))}
                    >
                      <option value="كتاب">كتاب</option>
                      <option value="فيديو">فيديو</option>
                    </select>
                    <input
                      className="input"
                      placeholder="العنوان"
                      value={form.title || ''}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                    <input
                      className="input"
                      placeholder="الوصف"
                      value={form.description || ''}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                    <input
                      className="input"
                      placeholder="المعرف (slug)"
                      value={form.slug || ''}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    />
                    <input
                      className="input"
                      placeholder="مقتطف (اختياري)"
                      value={form.snippet || ''}
                      onChange={(e) => setForm((f) => ({ ...f, snippet: e.target.value }))}
                    />
                    <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    <input className="input" type="file" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                  </div>
                  <div className="mt-2">
                    <button className="btn btn-primary" disabled={loading} onClick={create}>
                      {loading ? 'جارٍ...' : 'إضافة'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.length === 0 ? (
                    <div className="text-sm text-gray-600">لا توجد منتجات</div>
                  ) : (
                    items.map((product) => (
                      <div key={product.id} className="card p-3 flex flex-col gap-2">
                        <img
                          src={product.cover}
                          alt="cover"
                          style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }}
                        />
                        {editingId === product.id ? (
                          <>
                            <input
                              className="input"
                              value={product.title}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((p) => (p.id === product.id ? { ...p, title: e.target.value } : p))
                                )
                              }
                            />
                            <select
                              className="input"
                              value={product.type}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((p) =>
                                    p.id === product.id ? { ...p, type: e.target.value as Product['type'] } : p
                                  )
                                )
                              }
                            >
                              <option value="كتاب">كتاب</option>
                              <option value="فيديو">فيديو</option>
                            </select>
                            <textarea
                              className="input"
                              rows={3}
                              value={product.description}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((p) => (p.id === product.id ? { ...p, description: e.target.value } : p))
                                )
                              }
                            />
                            <input
                              className="input"
                              value={product.snippet || ''}
                              placeholder="مقتطف (اختياري)"
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((p) => (p.id === product.id ? { ...p, snippet: e.target.value } : p))
                                )
                              }
                            />
                            <input
                              className="input"
                              value={product.slug}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((p) => (p.id === product.id ? { ...p, slug: e.target.value } : p))
                                )
                              }
                            />
                            <div className="grid grid-cols-1 gap-2">
                              <label className="text-sm text-gray-600">
                                ملف جديد (PDF/MP4)
                                <input
                                  className="input mt-1"
                                  type="file"
                                  accept="application/pdf,video/*"
                                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                                />
                              </label>
                              {editFile ? (
                                <span className="text-xs text-gray-500">سيتم استبدال الملف بـ {editFile.name}</span>
                              ) : (
                                <span className="text-xs text-gray-500">اترك الحقل فارغًا للحفاظ على الملف الحالي.</span>
                              )}
                              <label className="text-sm text-gray-600">
                                صورة الغلاف الجديدة
                                <input
                                  className="input mt-1"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setEditCover(e.target.files?.[0] || null)}
                                />
                              </label>
                              {editCover ? (
                                <span className="text-xs text-gray-500">سيتم تحديث الغلاف إلى {editCover.name}</span>
                              ) : (
                                <span className="text-xs text-gray-500">اترك الحقل فارغًا للحفاظ على الغلاف الحالي.</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button className="btn btn-primary" onClick={() => save(product)} disabled={loading}>
                                حفظ
                              </button>
                              <button
                                className="btn"
                                onClick={() => {
                                  resetEditState()
                                }}
                                disabled={loading}
                              >
                                إلغاء
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-lg font-semibold">{product.title}</div>
                            <div className="text-sm text-gray-600">{product.type} · {product.slug}</div>
                            <div className="flex gap-2">
                              <button
                                className="btn"
                                onClick={() => {
                                  setEditingId(product.id)
                                  setEditFile(null)
                                  setEditCover(null)
                                }}
                              >
                                تعديل
                              </button>
                              <button className="btn" onClick={() => del(product.id)} disabled={loading}>
                                حذف
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  )
}
