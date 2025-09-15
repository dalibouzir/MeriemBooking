"use client"

import { useEffect, useState } from 'react'

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
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<Product>>({ type: 'كتاب' })
  const [file, setFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const r = await fetch('/api/admin/products')
    const j = await r.json(); setLoading(false)
    if (!r.ok) return alert(j.error || 'فشل التحميل')
    setItems(j.products || [])
  }
  useEffect(()=>{ load() },[])

  async function create() {
    if (!form.type || !form.title || !form.description || !form.slug) return alert('أكملي الحقول المطلوبة')
    if (!file) return alert('رجاءً رفع ملف المنتج')
    setLoading(true)
    const fd = new FormData()
    fd.set('type', String(form.type))
    fd.set('title', String(form.title))
    fd.set('description', String(form.description))
    fd.set('slug', String(form.slug))
    if (form.snippet) fd.set('snippet', String(form.snippet))
    fd.set('file', file)
    if (coverFile) fd.set('cover', coverFile)
    const r = await fetch('/api/admin/products-upload', { method: 'POST', body: fd })
    const j = await r.json(); setLoading(false)
    if (!r.ok) return alert(j.error || 'فشل الإضافة')
    setForm({ type: 'كتاب' })
    setFile(null); setCoverFile(null)
    await load()
  }

  async function save(p: Product) {
    setLoading(true)
    const r = await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })
    const j = await r.json(); setLoading(false)
    if (!r.ok) return alert(j.error || 'فشل التعديل')
    setEditingId(null)
    await load()
  }

  async function del(id: string) {
    if (!confirm('حذف المنتج؟')) return
    setLoading(true)
    const r = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' })
    const j = await r.json(); setLoading(false)
    if (!r.ok) return alert(j.error || 'فشل الحذف')
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-2">إضافة منتج</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select className="input" value={form.type || 'كتاب'} onChange={(e)=>setForm(f=>({ ...f, type: e.target.value as Product['type'] }))}>
            <option value="كتاب">كتاب</option>
            <option value="فيديو">فيديو</option>
          </select>
          <input className="input" placeholder="العنوان" value={form.title || ''} onChange={(e)=>setForm(f=>({ ...f, title: e.target.value }))} />
          <input className="input" placeholder="الوصف" value={form.description || ''} onChange={(e)=>setForm(f=>({ ...f, description: e.target.value }))} />
          <input className="input" placeholder="المعرف (slug)" value={form.slug || ''} onChange={(e)=>setForm(f=>({ ...f, slug: e.target.value }))} />
          <input className="input" placeholder="مقتطف (اختياري)" value={form.snippet || ''} onChange={(e)=>setForm(f=>({ ...f, snippet: e.target.value }))} />
          <input className="input" type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
          <input className="input" type="file" onChange={(e)=>setCoverFile(e.target.files?.[0] || null)} />
        </div>
        <div className="mt-2"><button className="btn btn-primary" disabled={loading} onClick={create}>إضافة</button></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="text-sm text-gray-600">لا توجد منتجات</div>
        ) : items.map((p) => (
          <div key={p.id} className="card p-3 flex flex-col gap-2">
            <img src={p.cover} alt="cover" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }} />
            {editingId === p.id ? (
              <>
                <input className="input" value={p.title} onChange={(e)=>setItems(s=>s.map(x=>x.id===p.id?{...x, title:e.target.value}:x))} />
                <select className="input" value={p.type} onChange={(e)=>setItems(s=>s.map(x=>x.id===p.id?{...x, type:e.target.value as Product['type']}:x))}>
                  <option value="كتاب">كتاب</option>
                  <option value="فيديو">فيديو</option>
                </select>
                <input className="input" value={p.slug} onChange={(e)=>setItems(s=>s.map(x=>x.id===p.id?{...x, slug:e.target.value}:x))} />
                <div className="flex gap-2">
                  <button className="btn btn-primary" onClick={()=>save(p)}>حفظ</button>
                  <button className="btn" onClick={()=>setEditingId(null)}>إلغاء</button>
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold">{p.title}</div>
                <div className="text-sm text-gray-600">{p.type} · {p.slug}</div>
                <div className="flex gap-2">
                  <button className="btn" onClick={()=>setEditingId(p.id)}>تعديل</button>
                  <button className="btn" onClick={()=>del(p.id)}>حذف</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
