"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ModalPortal from '@/components/ModalPortal'
import AnalyticsEnClient from './analytics-en/AnalyticsEnClient'

function Modal({ open, onClose, title, children, footer, centered }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; centered?: boolean }) {
  if (!open) return null
  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose} style={centered ? { alignItems: 'center' } : undefined}>
        <div className="modal-card glass-water" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h2>{title}</h2>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
          <div className="modal-body">{children}</div>
          {footer ? <div className="modal-foot">{footer}</div> : null}
        </div>
      </div>
    </ModalPortal>
  )
}

type DownloadRow = {
  id: number
  created_at: string
  name: string
  first_name: string | null
  last_name: string | null
  email: string
  product_slug: string | null
  phone: string | null
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-xl font-semibold text-purple-700 mb-4">{title}</h2>
}

type TabKey = 'calendar' | 'email' | 'whatsapp' | 'products' | 'stats'
export default function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<TabKey>('calendar')

  return (
    <div dir="ltr" className="admin-shell" style={{ maxWidth: 1600, marginInline: 'auto' }}>
      {/* Page header (separate glass card) */}
      <header className="admin-header-card glass-water">
        <div className="admin-header-row">
          <div>
            <h1 className="admin-title">Admin Dashboard — Fitra Mothers</h1>
            <div className="admin-sub">Welcome, Meriem 🌸</div>
          </div>
          <div className="admin-head-tools" role="toolbar" aria-label="Header actions">
            <button className="btn btn-outline">Refresh</button>
          </div>
        </div>
        <nav aria-label="Dashboard sections" className="admin-action" role="tablist">
          {([
            { key: 'calendar', label: '📅 Appointments (Calendly)' },
            { key: 'email', label: '✉️ Bulk Email' },
            { key: 'whatsapp', label: '💬 Bulk WhatsApp' },
            { key: 'products', label: '📚 Products' },
            { key: 'stats', label: '📈 Analytics' },
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
          {/* Challenge admin link */}
          <Link href="/admin/challenge" className="admin-pill admin-pill-link">
            <span className="pill-label">🎯 Challenge</span>
          </Link>
        </nav>
      </header>

      {/* Switchable content only */}
      <main className="admin-content glass-water">
        {tab==='calendar' && <CalendlyInfoTab/>}
        {tab==='email' && <BulkEmailTab adminEmail={adminEmail}/>}        
        {tab==='whatsapp' && <BulkWhatsappTab/>}
        {tab==='products' && <ProductsTab/>}
        {tab==='stats' && (
          <div dir="ltr" className="w-full">
            <AnalyticsEnClient/>
          </div>
        )}
      </main>
    </div>
  )
}

function CalendlyInfoTab() {
  return (
    <div className="admin-section">
      <SectionHeader title="Manage appointments via Calendly" />
      <p className="text-sm text-gray-600">Scheduling and confirmations now live in your Calendly account. Open Calendly to add or edit available times and reminders will be handled there.</p>
      <div className="section-toolbar" style={{ marginTop: '1.5rem' }}>
        <a className="btn btn-primary" href="https://calendly.com/meriembouzir/30min" target="_blank" rel="noopener noreferrer">Open Calendly</a>
      </div>
      <p className="text-xs text-gray-500" style={{ marginTop: '1rem' }}>No need to manage capacity or Google Calendar inside the dashboard — Calendly handles it.</p>
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
  statuses: string[]
  lastSeen: number
  details: string[]
  summary: string
  detailsText: string
  lastActivityLabel: string
  phones: string[]
}

async function fetchRecipientAggregates(): Promise<Recipient[]> {
  const downloadsRes = await fetch('/api/admin/download-requests')
  const downloadsJson = await downloadsRes.json().catch(() => ({ rows: [], error: 'Failed to load downloads' } as { rows?: DownloadRow[]; error?: string }))

  if (!downloadsRes.ok) throw new Error(downloadsJson?.error || 'Failed to load downloads')

  type RecipientAccumulator = {
    key: string
    email: string
    names: Set<string>
    reservationCount: number
    reservationConfirmedCount: number
    downloadCount: number
    productSlugs: Set<string>
    statuses: Set<string>
    lastSeen: number
    details: Set<string>
    phones: Set<string>
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
        statuses: new Set<string>(),
        lastSeen: 0,
        details: new Set<string>(),
        phones: new Set<string>(),
      }
      map.set(key, entry)
    }
    return entry
  }

  const downloads = (downloadsJson?.rows || []) as DownloadRow[]
  for (const row of downloads) {
    const entry = ensureEntry(row?.email)
    if (!entry) continue
    entry.downloadCount += 1
    const combinedName = [row?.first_name, row?.last_name].filter(Boolean).join(' ').trim()
    if (combinedName) entry.names.add(combinedName)
    else if (row?.name) entry.names.add(row.name)
    if (row?.product_slug) entry.productSlugs.add(row.product_slug)
    if (row?.phone) entry.phones.add(row.phone)
    const createdAt = row?.created_at ? Date.parse(row.created_at) : 0
    if (createdAt && createdAt > entry.lastSeen) entry.lastSeen = createdAt
    entry.details.add(`Download: ${row?.product_slug || 'Untitled'}`)
  }

  const aggregated: Recipient[] = Array.from(map.values()).map((entry) => {
    const names = Array.from(entry.names)
    const productSlugs = Array.from(entry.productSlugs)
    const statuses = Array.from(entry.statuses)
    const details = Array.from(entry.details)
    const phones = Array.from(entry.phones)
    const confirmed = entry.reservationConfirmedCount
    const pending = entry.reservationCount - confirmed
    const summaryParts: string[] = []
    if (entry.reservationCount) {
      let part = `Bookings: ${entry.reservationCount}`
      if (confirmed) part += ` (confirmed: ${confirmed})`
      if (pending > 0) part += ` (other: ${pending})`
      summaryParts.push(part)
    }
    if (entry.downloadCount) summaryParts.push(`Downloads: ${entry.downloadCount}`)
    if (productSlugs.length) summaryParts.push(`Products: ${productSlugs.join(', ')}`)
    if (phones.length) summaryParts.push(`Phone: ${phones.join(', ')}`)
    const summary = summaryParts.join(' • ') || '—'
    const detailsText = details.join(' • ')
    const lastActivityLabel = entry.lastSeen ? new Date(entry.lastSeen).toLocaleString('en-GB') : '—'

    return {
      email: entry.email,
      emailKey: entry.key,
      names,
      reservationCount: entry.reservationCount,
      reservationConfirmedCount: entry.reservationConfirmedCount,
      downloadCount: entry.downloadCount,
      productSlugs,
      statuses,
      lastSeen: entry.lastSeen,
      details,
      summary,
      detailsText,
      lastActivityLabel,
      phones,
    }
  })

  return aggregated
}


function isWhatsappPreferred(rec: Recipient): boolean {
  return rec.phones.length > 0
}

function sanitizePhone(raw?: string | null): string | null {
  if (!raw) return null
  let value = raw.trim()
  if (!value) return null
  value = value.replace(/[^0-9+]/g, '')
  if (value.startsWith('00')) value = value.slice(2)
  if (value.startsWith('+')) value = value.slice(1)
  value = value.replace(/[^0-9]/g, '')
  if (value.length < 8) return null
  return value
}

type BulkEmailTemplate = { id: string; name: string }
type BulkEmailPreviewRow = {
  id: string | null
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string | null
  status: string | null
  tags: string[]
  country: string | null
  email_valid: boolean
}

type BulkEmailPreviewCounts = {
  eligible: number
  valid: number
  invalid: number
  limited: boolean
}

type BulkEmailPreviewResponse = {
  rows: BulkEmailPreviewRow[]
  total: number
  page: number
  pageSize: number
  counts: BulkEmailPreviewCounts
}

type BulkEmailFiltersForm = {
  status: string
  tags: string
  country: string
  from: string
  to: string
  search: string
}

function BulkEmailTab({ adminEmail }: { adminEmail: string }) {
  const [filters, setFilters] = useState<BulkEmailFiltersForm>({ status: '', tags: '', country: '', from: '', to: '', search: '' })
  const [templates, setTemplates] = useState<BulkEmailTemplate[]>([])
  const [templateId, setTemplateId] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [sendOption, setSendOption] = useState<'now' | 'schedule'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [preview, setPreview] = useState<BulkEmailPreviewResponse | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendStatus, setSendStatus] = useState<string>('')
  const [copying, setCopying] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const [copyError, setCopyError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    let isMounted = true
    fetch('/api/admin/bulk-email/templates')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return
        const list = (data?.templates || []) as BulkEmailTemplate[]
        setTemplates(list)
        setTemplateId((prev) => prev || list[0]?.id || '')
      })
      .catch(() => {
        if (!isMounted) return
        setTemplates([])
      })
    return () => {
      isMounted = false
    }
  }, [])

  const totalPages = useMemo(() => {
    if (!preview) return 1
    return Math.max(1, Math.ceil(preview.total / preview.pageSize))
  }, [preview])

  const previewCounts = preview?.counts

  const loadPreview = useCallback(async (nextPage?: number, nextPageSize?: number) => {
    setPreviewLoading(true)
    setPreviewError('')
    const params = new URLSearchParams()
    if (filters.status.trim()) params.set('status', filters.status)
    if (filters.tags.trim()) params.set('tags', filters.tags)
    if (filters.country.trim()) params.set('country', filters.country)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.search.trim()) params.set('search', filters.search.trim())
    params.set('page', String(nextPage ?? page))
    params.set('pageSize', String(nextPageSize ?? pageSize))

    try {
      const res = await fetch(`/api/admin/bulk-email/preview?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load preview')
      setPreview(json as BulkEmailPreviewResponse)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load preview'
      setPreviewError(message)
    } finally {
      setPreviewLoading(false)
    }
  }, [filters, page, pageSize])

  const handlePreview = useCallback(async () => {
    setPage(1)
    await loadPreview(1, pageSize)
  }, [loadPreview, pageSize])

  const handleCopyEmails = useCallback(async () => {
    setCopyError('')
    setCopyStatus('')
    setCopying(true)
    try {
      const params = buildFilterParams(filters)
      const res = await fetch(`/api/admin/bulk-email/emails?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load emails')
      const emails = (json?.emails || []) as string[]
      if (!emails.length) {
        setCopyStatus('No emails to copy for these filters.')
        return
      }
      await navigator.clipboard.writeText(emails.join('\n'))
      setCopyStatus(`Copied ${emails.length} emails to clipboard.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to copy emails'
      setCopyError(message)
    } finally {
      setCopying(false)
    }
  }, [filters])

  const handleReview = useCallback(async () => {
    setSendError('')
    setSendStatus('')
    if (!campaignName.trim()) return setSendError('Campaign name is required.')
    if (!subject.trim()) return setSendError('Subject is required.')
    if (!templateId) return setSendError('Select a template first.')
    if (!preview || preview.counts.valid === 0) return setSendError('Preview recipients before sending.')
    if (sendOption === 'schedule' && !scheduledAt) return setSendError('Pick a schedule date/time.')

    const payload = {
      campaignId,
      name: campaignName.trim(),
      templateId,
      subject: subject.trim(),
      previewText: previewText.trim(),
      scheduledAt: sendOption === 'schedule' ? toIsoString(scheduledAt) : null,
      filters: buildFiltersPayload(filters),
    }

    try {
      const res = await fetch('/api/admin/bulk-email/create-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save campaign')
      setCampaignId(json?.id || null)
      setConfirmOpen(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save campaign'
      setSendError(message)
    }
  }, [campaignId, campaignName, subject, templateId, previewText, filters, preview, sendOption, scheduledAt])

  const handleSend = useCallback(async () => {
    if (!campaignId) return setSendError('Campaign not saved yet.')
    setSendError('')
    setSendStatus('Sending...')

    try {
      const res = await fetch('/api/admin/bulk-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          scheduledAt: sendOption === 'schedule' ? toIsoString(scheduledAt) : null,
          sendNow: sendOption === 'now',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to send campaign')
      setSendStatus(sendOption === 'schedule' ? 'Campaign scheduled successfully.' : 'Campaign sent successfully.')
      setConfirmOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send campaign'
      setSendError(message)
      setSendStatus('')
    }
  }, [campaignId, scheduledAt, sendOption])

  return (
    <div>
      <SectionHeader title="Bulk Email" />
      <div className="card p-4 space-y-4">
        <div className="admin-form-grid2">
          <label className="admin-form-row">
            <span className="admin-form-label">Campaign name</span>
            <input className="input" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Spring webinar" />
          </label>
          <label className="admin-form-row">
            <span className="admin-form-label">Template</span>
            <select className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {templates.length === 0 ? (
                <option value="">No templates configured</option>
              ) : (
                templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))
              )}
            </select>
          </label>
        </div>

        <div className="admin-form-grid2">
          <label className="admin-form-row">
            <span className="admin-form-label">Subject</span>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
          </label>
          <label className="admin-form-row">
            <span className="admin-form-label">Preview text</span>
            <input className="input" value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Short preview text" />
          </label>
        </div>

        <div className="admin-form-grid2">
          <label className="admin-form-row">
            <span className="admin-form-label">Status filter</span>
            <input className="input" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} placeholder="confirmed, active" />
          </label>
          <label className="admin-form-row">
            <span className="admin-form-label">Tags filter</span>
            <input className="input" value={filters.tags} onChange={(e) => setFilters((prev) => ({ ...prev, tags: e.target.value }))} placeholder="vip, newsletter" />
          </label>
          <label className="admin-form-row">
            <span className="admin-form-label">Country filter</span>
            <input className="input" value={filters.country} onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value }))} placeholder="US, FR" />
          </label>
          <label className="admin-form-row">
            <span className="admin-form-label">Created from</span>
            <input className="input" type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} />
          </label>
          <label className="admin-form-row">
            <span className="admin-form-label">Created to</span>
            <input className="input" type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} />
          </label>
          <label className="admin-form-row">
            <span className="admin-form-label">Search</span>
            <input className="input" value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} placeholder="Email or name" />
          </label>
        </div>

        <div className="section-toolbar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handlePreview} disabled={previewLoading}>Preview recipients</button>
          <button className="btn btn-outline" onClick={() => loadPreview(page, pageSize)} disabled={!preview || previewLoading}>Refresh preview</button>
          <button className="btn btn-outline" onClick={handleCopyEmails} disabled={copying}>Copy emails</button>
        </div>

        {previewError && <div className="text-sm text-red-600">{previewError}</div>}
        {previewLoading && <div className="text-sm text-gray-600">Loading preview...</div>}
        {copyError && <div className="text-sm text-red-600">{copyError}</div>}
        {copyStatus && <div className="text-sm text-green-600">{copyStatus}</div>}

        {previewCounts && (
          <div className="text-sm text-gray-700">
            <div>Eligible: {previewCounts.eligible}</div>
            <div>Valid emails: {previewCounts.valid}</div>
            <div>Invalid emails skipped: {previewCounts.invalid}</div>
            {previewCounts.limited && <div className="text-xs text-gray-500">Invalid count sampled from first 10,000 records.</div>}
          </div>
        )}

        <div className="admin-form-grid2">
          <label className="admin-form-row">
            <span className="admin-form-label">Send option</span>
            <div className="flex flex-wrap gap-3 text-sm text-gray-700">
              <label className="flex items-center gap-2">
                <input type="radio" checked={sendOption === 'now'} onChange={() => setSendOption('now')} />
                Send now
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={sendOption === 'schedule'} onChange={() => setSendOption('schedule')} />
                Schedule
              </label>
            </div>
          </label>
          <label className="admin-form-row">
            <span className="admin-form-label">Schedule date/time</span>
            <input
              className="input"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              disabled={sendOption !== 'schedule'}
            />
          </label>
        </div>

        {sendError && <div className="text-sm text-red-600">{sendError}</div>}
        {sendStatus && <div className="text-sm text-green-600">{sendStatus}</div>}

        <div className="section-toolbar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleReview} disabled={!preview || previewLoading}>Review & confirm</button>
          <button className="btn btn-outline" onClick={() => setFilters({ status: '', tags: '', country: '', from: '', to: '', search: '' })}>Clear filters</button>
          <button className="btn" onClick={() => { setPreview(null); setPage(1); setPageSize(25) }}>Clear preview</button>
        </div>
      </div>

      <div className="card p-4 space-y-3" style={{ marginTop: 16 }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-gray-600">Recipient preview</div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <label className="flex items-center gap-2">
              Page size
              <select className="input" value={pageSize} onChange={(e) => {
                const next = Number(e.target.value)
                setPageSize(next)
                setPage(1)
                loadPreview(1, next)
              }}>
                {[25, 50, 100].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>
            <button className="btn" disabled={!preview || page <= 1} onClick={() => {
              const next = Math.max(1, page - 1)
              setPage(next)
              loadPreview(next, pageSize)
            }}>Prev</button>
            <span>Page {preview ? preview.page : page} / {totalPages}</span>
            <button className="btn" disabled={!preview || page >= totalPages} onClick={() => {
              const next = Math.min(totalPages, page + 1)
              setPage(next)
              loadPreview(next, pageSize)
            }}>Next</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table responsive text-sm">
            <thead>
              <tr className="bg-purple-100 text-purple-800">
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Tags</th>
                <th className="p-2 text-left">Country</th>
                <th className="p-2 text-left">Created</th>
                <th className="p-2 text-left">Valid</th>
              </tr>
            </thead>
            <tbody>
              {!preview ? (
                <tr><td className="p-2" colSpan={7}>Run a preview to load recipients.</td></tr>
              ) : preview.rows.length === 0 ? (
                <tr><td className="p-2" colSpan={7}>No recipients match the filters.</td></tr>
              ) : (
                preview.rows.map((row, idx) => (
                  <tr key={`${row.id ?? row.email}-${idx}`} className="odd:bg-gray-50">
                    <td className="p-2" data-th="Email">{row.email}</td>
                    <td className="p-2" data-th="Name">{[row.first_name, row.last_name].filter(Boolean).join(' ') || '-'}</td>
                    <td className="p-2" data-th="Status">{row.status || '-'}</td>
                    <td className="p-2" data-th="Tags">{row.tags.length ? row.tags.join(', ') : '-'}</td>
                    <td className="p-2" data-th="Country">{row.country || '-'}</td>
                    <td className="p-2" data-th="Created">{row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '-'}</td>
                    <td className="p-2" data-th="Valid">{row.email_valid ? 'Yes' : 'Invalid'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm bulk email"
        centered
        footer={
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={handleSend}>Confirm & send</button>
            <button className="btn" onClick={() => setConfirmOpen(false)}>Cancel</button>
          </div>
        }
      >
        <div className="grid gap-3 text-sm text-gray-700">
          <div><strong>Campaign:</strong> {campaignName || '-'}</div>
          <div><strong>Subject:</strong> {subject || '-'}</div>
          <div><strong>Template:</strong> {templates.find((t) => t.id === templateId)?.name || templateId || '-'}</div>
          <div><strong>Preview text:</strong> {previewText || '-'}</div>
          <div><strong>Recipients:</strong> {previewCounts?.valid || 0} valid, {previewCounts?.invalid || 0} invalid skipped</div>
          <div><strong>Send time:</strong> {sendOption === 'schedule' && scheduledAt ? new Date(scheduledAt).toLocaleString('en-GB') : 'Send now'}</div>
          <div><strong>Filters:</strong> {formatFiltersSummary(filters)}</div>
          {adminEmail && <div><strong>Sender:</strong> {adminEmail}</div>}
          <div className="text-xs text-gray-500">We will sync contacts, create a segment, and send via Resend.</div>
        </div>
      </Modal>
    </div>
  )
}

function buildFiltersPayload(filters: BulkEmailFiltersForm) {
  return {
    status: parseList(filters.status),
    tags: parseList(filters.tags),
    countries: parseList(filters.country),
    from: filters.from ? toIsoString(filters.from) : null,
    to: filters.to ? toIsoString(filters.to) : null,
    search: filters.search.trim() || null,
  }
}

function parseList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toIsoString(value: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function formatFiltersSummary(filters: BulkEmailFiltersForm) {
  const parts = []
  if (filters.status.trim()) parts.push(`Status: ${filters.status}`)
  if (filters.tags.trim()) parts.push(`Tags: ${filters.tags}`)
  if (filters.country.trim()) parts.push(`Country: ${filters.country}`)
  if (filters.from) parts.push(`From: ${filters.from}`)
  if (filters.to) parts.push(`To: ${filters.to}`)
  if (filters.search.trim()) parts.push(`Search: ${filters.search.trim()}`)
  return parts.length ? parts.join(' | ') : 'No filters'
}

function buildFilterParams(filters: BulkEmailFiltersForm) {
  const params = new URLSearchParams()
  if (filters.status.trim()) params.set('status', filters.status)
  if (filters.tags.trim()) params.set('tags', filters.tags)
  if (filters.country.trim()) params.set('country', filters.country)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.search.trim()) params.set('search', filters.search.trim())
  return params
}

function BulkWhatsappTab() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [pickerOpen, setPickerOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [optInOnly, setOptInOnly] = useState(true)
  const [copied, setCopied] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantInfo, setAssistantInfo] = useState<{ numbers: string[]; message: string; copy: 'pending' | 'success' | 'error' } | null>(null)

  const loadRecipients = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const aggregated = await fetchRecipientAggregates()
      const withPhones = aggregated.filter((item) => item.phones.length > 0)
      setRecipients(withPhones)
      setSelected((prev) => {
        const next: Record<string, boolean> = {}
        for (const item of withPhones) {
          const auto = isWhatsappPreferred(item)
          next[item.emailKey] = prev[item.emailKey] ?? auto
        }
        return next
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRecipients() }, [loadRecipients])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const filteredRecipients = useMemo(() => {
    let list = recipients
    if (optInOnly) list = list.filter(isWhatsappPreferred)
    if (showSelectedOnly) list = list.filter((item) => selected[item.emailKey])
    const q = searchTerm.trim().toLowerCase()
    if (!q) return list
    return list.filter((item) =>
      item.email.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.detailsText.toLowerCase().includes(q) ||
      (item.names.length > 0 && item.names.some((name) => name.toLowerCase().includes(q))) ||
      (item.phones.length > 0 && item.phones.some((phone) => phone.toLowerCase().includes(q)))
    )
  }, [recipients, optInOnly, showSelectedOnly, selected, searchTerm])

  const totalLoaded = recipients.length
  const filteredCount = filteredRecipients.length

  const selectedNumbers = useMemo(() => {
    const base = recipients.filter((item) => selected[item.emailKey])
    const eligible = optInOnly ? base.filter(isWhatsappPreferred) : base
    const numbers = eligible.flatMap((item) => item.phones.map(sanitizePhone).filter(Boolean) as string[])
    return Array.from(new Set(numbers))
  }, [recipients, selected, optInOnly])

  const selectedContactsCount = useMemo(() => {
    const base = recipients.filter((item) => selected[item.emailKey])
    const eligible = optInOnly ? base.filter(isWhatsappPreferred) : base
    return eligible.length
  }, [recipients, selected, optInOnly])

  const assistantClipboardText = useMemo(() => {
    if (!assistantInfo) return ''
    const lines: string[] = []
    if (assistantInfo.message) {
      lines.push('Message:', assistantInfo.message, '')
    }
    if (assistantInfo.numbers.length) {
      lines.push('Numbers to paste into a WhatsApp group:', ...assistantInfo.numbers)
    }
    return lines.join('\n')
  }, [assistantInfo])

  const copyAssistantBundle = useCallback(async () => {
    if (!assistantClipboardText) return
    try {
      await navigator.clipboard.writeText(assistantClipboardText)
      setAssistantInfo((prev) => (prev ? { ...prev, copy: 'success' } : prev))
    } catch (err) {
      console.error(err)
      setAssistantInfo((prev) => (prev ? { ...prev, copy: 'error' } : prev))
      alert('Could not copy, please copy manually from the list below.')
    }
  }, [assistantClipboardText])

  const toggleRecipient = useCallback((emailKey: string) => {
    setSelected((prev) => ({ ...prev, [emailKey]: !prev[emailKey] }))
  }, [])

  const copyNumbers = useCallback(async () => {
    if (selectedNumbers.length === 0) {
      alert('Select at least one contact with a valid phone number.')
      return
    }
    try {
      const formatted = selectedNumbers.map((num) => `+${num}`)
      await navigator.clipboard.writeText(formatted.join('\n'))
      setCopied(true)
    } catch (err) {
      console.error(err)
      alert('Could not copy numbers to the clipboard, copy them manually from the list.')
    }
  }, [selectedNumbers])

  const openWhatsApp = useCallback(() => {
    if (selectedNumbers.length === 0) {
      alert('Pick contacts that have a WhatsApp number first.')
      return
    }
    const text = message.trim()
    const [first] = selectedNumbers
    const base = `https://wa.me/${first}`
    const url = text ? `${base}?text=${encodeURIComponent(text)}` : base
    window.open(url, '_blank', 'noopener')

    const formattedNumbers = selectedNumbers.map((num) => `+${num}`)
    const clipboardLines: string[] = []
    if (text) {
      clipboardLines.push('Message:', text, '')
    }
    clipboardLines.push('Numbers to paste into a WhatsApp group:', ...formattedNumbers)

    setAssistantInfo({ numbers: formattedNumbers, message: text, copy: 'pending' })
    setAssistantOpen(true)

    navigator.clipboard.writeText(clipboardLines.join('\n'))
      .then(() => {
        setAssistantInfo((prev) => (prev ? { ...prev, copy: 'success' } : prev))
      })
      .catch(() => {
        setAssistantInfo((prev) => (prev ? { ...prev, copy: 'error' } : prev))
      })
  }, [selectedNumbers, message])

  const closeAssistant = useCallback(() => {
    setAssistantOpen(false)
    setAssistantInfo(null)
  }, [])

  function selectAll() {
    setSelected((prev) => {
      const next: Record<string, boolean> = {}
      for (const item of recipients) {
        const shouldSelect = isWhatsappPreferred(item)
        next[item.emailKey] = prev[item.emailKey] ?? shouldSelect
      }
      return next
    })
  }

  function clearSelection() {
    setSelected((prev) => {
      const next = { ...prev }
      for (const item of recipients) next[item.emailKey] = false
      return next
    })
  }

  return (
    <div>
      <SectionHeader title="Bulk WhatsApp" />
      <div className="card p-4 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-700">
            <div>Contact rows: {totalLoaded}</div>
            <div>Selected contacts: {selectedContactsCount}</div>
            <div>Valid numbers: {selectedNumbers.length}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={loadRecipients} disabled={loading}>Refresh</button>
            <button className="btn btn-outline" onClick={() => setPickerOpen(true)} disabled={totalLoaded === 0}>Choose numbers</button>
          </div>
        </div>

        <div className="grid gap-3">
          <textarea
            className="input textarea"
            rows={4}
            placeholder="WhatsApp message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm" style={{ color: '#4b5563' }}>
            <input type="checkbox" checked={optInOnly} onChange={(e) => setOptInOnly(e.target.checked)} />
            Show contacts that have a phone number only
          </label>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {loading && <div className="text-sm text-gray-600">Loading…</div>}

        {selectedNumbers.length > 0 ? (
          <div className="text-sm text-gray-700">
            The first WhatsApp chat will open and we will copy the message plus all numbers to help you start a new group quickly.
          </div>
        ) : (
          <div className="text-sm text-gray-600">Select contacts that have a valid WhatsApp number.</div>
        )}

        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={openWhatsApp} disabled={selectedNumbers.length === 0}>Launch WhatsApp helper</button>
          <button className="btn btn-outline" onClick={copyNumbers} disabled={selectedNumbers.length === 0}>
            {copied ? 'Copied ✅' : 'Copy number list'}
          </button>
        </div>
      </div>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choose contacts"
        centered
        footer={
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => { selectAll(); }}>Select all</button>
            <button className="btn btn-outline" onClick={() => { clearSelection(); }}>Clear all</button>
            <button className="btn" onClick={() => setPickerOpen(false)}>Done</button>
          </div>
        }
      >
        {totalLoaded === 0 ? (
          <div className="text-sm text-gray-600">No contacts to display.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="grid" style={{ gap: 12 }}>
              <input
                className="input"
                placeholder="Search by email, name or number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm" style={{ color: '#4b5563' }}>
                <input type="checkbox" checked={showSelectedOnly} onChange={(e) => setShowSelectedOnly(e.target.checked)} />
                Show selected only
              </label>
              <div className="text-xs text-gray-500">Showing: {filteredCount} / {totalLoaded}</div>
            </div>
            <div style={{ maxHeight: '55vh', overflowY: 'auto', display: 'grid', gap: 12 }}>
              {filteredCount === 0 ? (
                <div className="text-sm text-gray-500">No matching results.</div>
              ) : (
                filteredRecipients.map((item) => (
                  <WhatsappRecipientItem key={item.emailKey} item={item} isSelected={!!selected[item.emailKey]} onToggle={toggleRecipient} />
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={assistantOpen}
        onClose={closeAssistant}
        title="WhatsApp group helper"
        centered
        footer={
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={copyAssistantBundle} disabled={!assistantClipboardText}>Copy content again</button>
            <button className="btn" onClick={closeAssistant}>Close</button>
          </div>
        }
      >
        {assistantInfo ? (
          <div className="grid gap-3 text-sm text-gray-700">
            <p>1. Open WhatsApp, then start creating a new group.</p>
            <div className="grid gap-2">
              <div className="text-xs text-gray-500">Selected numbers</div>
              <textarea className="input textarea" rows={Math.min(6, Math.max(3, assistantInfo.numbers.length))} readOnly dir="ltr" value={assistantInfo.numbers.join('\n')} />
            </div>
            {assistantInfo.message ? (
              <div className="grid gap-2">
                <div className="text-xs text-gray-500">Prepared message</div>
                <textarea className="input textarea" rows={Math.min(6, Math.max(3, Math.ceil(assistantInfo.message.length / 60)))} readOnly value={assistantInfo.message} />
              </div>
            ) : (
              <div className="text-xs text-gray-500">No message was provided—add it manually inside WhatsApp.</div>
            )}
            {assistantInfo.copy === 'success' ? (
              <div className="text-xs text-green-600">Numbers (and the message, if any) were copied to the clipboard.</div>
            ) : assistantInfo.copy === 'error' ? (
              <div className="text-xs text-red-600">Automatic copy failed; copy manually or press the copy button again.</div>
            ) : (
              <div className="text-xs text-gray-500">Preparing the clipboard to make this easier—one moment…</div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No data to display.</div>
        )}
      </Modal>
    </div>
  )
}

type WhatsappRecipientItemProps = {
  item: Recipient
  isSelected: boolean
  onToggle: (emailKey: string) => void
}

const WhatsappRecipientItem = React.memo(({ item, isSelected, onToggle }: WhatsappRecipientItemProps) => {
  return (
    <label
      className="glass-water"
      style={{
        borderRadius: 12,
        padding: '12px 16px',
        display: 'grid',
        gap: 6,
        background: 'var(--card-bg, rgba(255,255,255,0.85))',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontWeight: 600 }}>{item.names[0] || item.email}</span>
        <input type="checkbox" checked={isSelected} onChange={() => onToggle(item.emailKey)} />
      </div>
      {item.phones.length > 0 && (
        <div className="text-xs" style={{ color: '#2563eb' }}>{item.phones.join(' / ')}</div>
      )}
      <div className="text-xs" style={{ color: '#4b5563' }}>{item.summary}</div>
      {item.detailsText && <div className="text-xs" style={{ color: '#6b7280', lineHeight: 1.5 }}>{item.detailsText}</div>}
      <div className="text-xs text-gray-500">Last activity: {item.lastActivityLabel}</div>
    </label>
  )
})
WhatsappRecipientItem.displayName = 'WhatsappRecipientItem'

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
    if (!r.ok) return alert(j.error || 'Failed to load products')
    const rows = (j.products || []) as ProductRow[]
    setItems(rows.map((p) => ({ id: p.id, type: p.type, title: p.title, slug: p.slug, cover: p.cover, description: p.description || undefined, snippet: p.snippet || undefined })))
  }
  useEffect(()=>{ load() },[])

  async function save() {
    // Create vs Update
    if (editId) {
      // Update metadata only
      if (!form.title || !form.description || !form.slug) return alert('Please complete the required fields')
      setSaving(true)
      const fd = new FormData()
      fd.set('id', editId)
      fd.set('type', form.type)
      fd.set('title', form.title)
      fd.set('description', form.description)
      fd.set('slug', form.slug)
      fd.set('snippet', form.snippet || '')
      if (form.file) fd.set('file', form.file)
      if (form.cover) fd.set('cover', form.cover)
      const r = await fetch('/api/admin/products', { method: 'PATCH', body: fd })
      const j = await r.json(); setSaving(false)
      if (!r.ok) return alert(j.error || 'Update failed')
      setOpen(false); setEditId(null)
      setForm({ type: 'كتاب', title: '', description: '', slug: '', snippet: '', file: null, cover: null })
      await load()
    } else {
      // Create requires file
      if (!form.title || !form.description || !form.slug || !form.file) return alert('Please complete the required fields')
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
      <SectionHeader title="Products"/>
      <div className="section-toolbar">
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-primary" onClick={()=>{ setEditId(null); setForm({ type: 'كتاب', title: '', description: '', slug: '', snippet: '', file: null, cover: null }); setOpen(true) }}>+ Add product</button>
        </div>
      </div>
      {/* Product upload — helper card */}
      <div className="card glass-water p-3" style={{ margin: '8px 0 10px' }}>
        <div className="text-sm" style={{ color: '#404252' }}>
          <strong>Upload the product:</strong> Upload the product file (PDF/MP4) and its cover, then add the title, description, and slug.
          After saving, the product appears on the homepage and is downloadable.
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table responsive text-sm">
          <thead>
            <tr className="bg-purple-100 text-purple-800">
              <th className="p-2 text-left">Cover</th>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Slug</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td className="p-2" colSpan={5}>Loading…</td></tr>) : items.length === 0 ? (<tr><td className="p-2" colSpan={5}>No products yet</td></tr>) : items.map((p) => {
              const typeLabel = p.type === 'فيديو' ? 'Video' : p.type === 'كتاب' ? 'Book' : (p.type || '—')
              return (
                <tr key={p.id} className="odd:bg-gray-50">
                  <td className="p-2" data-th="Cover"><img src={p.cover} alt="cover" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} /></td>
                  <td className="p-2" data-th="Title">{p.title}</td>
                  <td className="p-2" data-th="Type">{typeLabel}</td>
                  <td className="p-2" data-th="Slug">{p.slug}</td>
                  <td className="p-2 actions" data-th="Actions">
                    <button className="btn" onClick={()=>{ setEditId(p.id); setForm({ type: p.type, title: p.title, description: p.description || '', slug: p.slug, snippet: p.snippet || '', file: null, cover: null }); setOpen(true) }}>Edit</button>
                    <button className="btn" disabled={delBusy===p.id} onClick={()=>del(p.id)}>{delBusy===p.id ? '...' : 'Delete'}</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={()=>{ setOpen(false); setEditId(null) }} title={editId ? 'Edit product' : 'Add product'} footer={<div className="flex gap-2"><button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : (editId ? 'Save' : 'Add')}</button><button className="btn" onClick={()=>{ setOpen(false); setEditId(null) }}>Cancel</button></div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="field"><span className="field-label">Type</span><select className="input" value={form.type} onChange={(e)=>setForm(f=>({ ...f, type: e.target.value as 'كتاب'|'فيديو' }))}><option value="كتاب">Book</option><option value="فيديو">Video</option></select></label>
          <label className="field"><span className="field-label">Title</span><input className="input" value={form.title} onChange={(e)=>setForm(f=>({ ...f, title: e.target.value }))} /></label>
          <label className="field md:col-span-2"><span className="field-label">Description</span><textarea className="input textarea" rows={3} value={form.description} onChange={(e)=>setForm(f=>({ ...f, description: e.target.value }))} /></label>
          <label className="field"><span className="field-label">Slug</span><input className="input" value={form.slug} onChange={(e)=>setForm(f=>({ ...f, slug: e.target.value }))} /></label>
          <label className="field md:col-span-2"><span className="field-label">Snippet</span><textarea className="input textarea" rows={3} value={form.snippet} onChange={(e)=>setForm(f=>({ ...f, snippet: e.target.value }))} /></label>
          <label className="field">
            <span className="field-label">
              Product file
              <span className="block text-xs text-gray-500 font-normal">{editId ? 'Optional — upload a new PDF or MP4 to replace the existing file.' : 'PDF or MP4 — required when adding a product.'}</span>
            </span>
            <input className="input" type="file" onChange={(e)=>setForm(f=>({ ...f, file: e.target.files?.[0] || null }))} />
          </label>
          <label className="field">
            <span className="field-label">
              Cover image
              <span className="block text-xs text-gray-500 font-normal">{editId ? 'Optional — upload to replace the current cover.' : 'Optional but recommended to upload a cover image.'}</span>
            </span>
            <input className="input" type="file" accept="image/*" onChange={(e)=>setForm(f=>({ ...f, cover: e.target.files?.[0] || null }))} />
          </label>
        </div>
      </Modal>
    </div>
  )
}
