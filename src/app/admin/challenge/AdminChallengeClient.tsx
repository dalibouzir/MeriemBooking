'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import ModalPortal from '@/components/ModalPortal'
import {
  getAdminOverviewAction,
  getAdminChartDataAction,
  getAdminChallengeSettingsAction,
  updateChallengeSettingsAction,
  listRegistrationsAction,
  updateRegistrationAction,
  deleteRegistrationAction,
  promoteWaitlistAction,
  exportCsvAction,
  type AdminOverview,
  type ChartDataPoint,
  type Registration,
  type RegistrationFilters,
} from './actions'
import type { ChallengeSettings } from '@/app/challenge/actions'

type TabKey = 'overview' | 'settings' | 'registrations'

const SCRIPT_DEFAULTS = {
  title: 'تحدّي الأم الهادئة في 3 أيام',
  subtitle: 'من التوتر والانفجار… إلى بداية هدوء حقيقي من الداخل',
  description:
    'أعطيني فقط 90 دقيقة خلال 3 أيام، واكتشفي كيف تبدأين استعادة هدوئك… حتى لو كنتِ عصبية وتحت ضغط يومي.',
  benefits: [
    'لماذا تفقدين السيطرة رغم أنك تعرفين ما هو الصواب.',
    'ما الذي يحرّك ردّة فعلك من الداخل.',
    'لماذا يتكرّر نفس النمط رغم محاولاتك المتكررة.',
  ],
  requirements: [
    'اليوم الأول: افهمي ما يحدث داخلك. لماذا تفقدين السيطرة رغم أنك تعلمين؟ (تبسيط عميق لما يحدث في داخلك).',
    'اليوم الثاني: ابدئي التغيير فعليًا عبر تمارين واستراتيجيات تساعدك على إيقاف ردّة الفعل، التعامل مع trigger، والخروج من نمط التوتر المتكرر.',
    'اليوم الثالث: جلسة تطبيق وأسئلة مباشرة على حالات حقيقية من المشاركات لتطبيق ما تعلّمناه على مواقف واقعية.',
  ],
}

const fallbackText = (value: string | null | undefined, fallbackValue: string) =>
  value && value.trim() ? value : fallbackValue

const fallbackList = (value: string[] | null | undefined, fallbackValue: string[]) =>
  value && value.length > 0 ? value : fallbackValue

// Simple Modal component matching existing admin style
function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  if (!open) return null
  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card glass-water" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h2>{title}</h2>
            <button className="btn" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-foot">{footer}</div>}
        </div>
      </div>
    </ModalPortal>
  )
}

export default function AdminChallengeClient() {
  const [tab, setTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [settings, setSettings] = useState<ChallengeSettings | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [regTotal, setRegTotal] = useState(0)
  const [regPage, setRegPage] = useState(1)
  const [filters, setFilters] = useState<RegistrationFilters>({
    status: 'all',
    page: 1,
    pageSize: 20,
  })

  // Load initial data
  const loadOverview = useCallback(async () => {
    const [ov, chart] = await Promise.all([getAdminOverviewAction(), getAdminChartDataAction()])
    setOverview(ov)
    setChartData(chart)
  }, [])

  const loadSettings = useCallback(async () => {
    const s = await getAdminChallengeSettingsAction()
    setSettings(s)
  }, [])

  const loadRegistrations = useCallback(async (f: RegistrationFilters = filters) => {
    const result = await listRegistrationsAction(f)
    setRegistrations(result.data)
    setRegTotal(result.total)
    setRegPage(result.page)
  }, [filters])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadOverview(), loadSettings(), loadRegistrations()]).finally(() => setLoading(false))
  }, [loadOverview, loadSettings, loadRegistrations])

  const handleRefresh = async () => {
    setLoading(true)
    await Promise.all([loadOverview(), loadSettings(), loadRegistrations()])
    setLoading(false)
  }

  return (
    <div dir="ltr" className="admin-shell" style={{ maxWidth: 1600, marginInline: 'auto' }}>
      {/* Header */}
      <header className="admin-header-card glass-water">
        <div className="admin-header-row">
          <div>
            <h1 className="admin-title">Challenge Management</h1>
            <div className="admin-sub">Manage your online challenge</div>
          </div>
          <div className="admin-head-tools" role="toolbar">
            <Link href="/admin" className="btn btn-outline">
              ← Back to Dashboard
            </Link>
            <button className="btn btn-outline" onClick={handleRefresh} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
        <nav aria-label="Challenge sections" className="admin-action" role="tablist">
          {(
            [
              { key: 'overview', label: '📊 Overview & Stats' },
              { key: 'settings', label: '⚙️ Settings' },
              { key: 'registrations', label: '👥 Registrations' },
            ] as { key: TabKey; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`admin-pill ${tab === t.key ? 'is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <span className="pill-label">{t.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="admin-content glass-water">
        {loading && !overview ? (
          <div className="admin-loading">Loading...</div>
        ) : (
          <>
            {tab === 'overview' && overview && (
              <OverviewTab overview={overview} chartData={chartData} onRefresh={loadOverview} />
            )}
            {tab === 'settings' && settings && (
              <SettingsTab settings={settings} onSave={loadSettings} />
            )}
            {tab === 'registrations' && (
              <RegistrationsTab
                registrations={registrations}
                total={regTotal}
                page={regPage}
                filters={filters}
                onFiltersChange={(f) => {
                  setFilters(f)
                  loadRegistrations(f)
                }}
                onRefresh={() => loadRegistrations(filters)}
                onOverviewRefresh={loadOverview}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}

// Overview Tab with stats and chart
function OverviewTab({
  overview,
  chartData,
  onRefresh,
}: {
  overview: AdminOverview
  chartData: ChartDataPoint[]
  onRefresh: () => void
}) {
  const maxValue = Math.max(...chartData.flatMap((d) => [d.confirmed, d.waitlist]), 1)

  return (
    <div className="admin-section">
      <h2 className="text-xl font-semibold text-purple-700 mb-4">Overview</h2>

      {/* Stats Cards */}
      <div className="admin-challenge-stats-grid">
        <StatCard label="Capacity" value={overview.capacity} />
        <StatCard label="Confirmed" value={overview.confirmed_count} highlight />
        <StatCard label="Remaining" value={overview.remaining_count} />
        <StatCard label="Waitlist" value={overview.waitlist_count} />
        <StatCard label="Link Copied" value={overview.copied_count} />
        <StatCard label="Link Saved" value={overview.saved_count} />
        <StatCard label="Not Copied Yet" value={overview.not_copied_count} warn={overview.not_copied_count > 0} />
      </div>

      {/* Simple Chart */}
      <div className="admin-challenge-chart-section">
        <h3 className="text-lg font-semibold mb-3">Registrations (Last 14 Days)</h3>
        <div className="admin-challenge-chart">
          <div className="admin-challenge-chart-legend">
            <span className="admin-challenge-legend-item confirmed">● Confirmed</span>
            <span className="admin-challenge-legend-item waitlist">● Waitlist</span>
          </div>
          <div className="admin-challenge-chart-bars">
            {chartData.map((point) => (
              <div key={point.date} className="admin-challenge-chart-day">
                <div className="admin-challenge-chart-bar-group">
                  <div
                    className="admin-challenge-chart-bar confirmed"
                    style={{ height: `${(point.confirmed / maxValue) * 100}%` }}
                    title={`Confirmed: ${point.confirmed}`}
                  />
                  <div
                    className="admin-challenge-chart-bar waitlist"
                    style={{ height: `${(point.waitlist / maxValue) * 100}%` }}
                    title={`Waitlist: ${point.waitlist}`}
                  />
                </div>
                <span className="admin-challenge-chart-label">{point.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
  warn,
}: {
  label: string
  value: number
  highlight?: boolean
  warn?: boolean
}) {
  return (
    <div className={`admin-challenge-stat-card ${highlight ? 'highlight' : ''} ${warn ? 'warn' : ''}`}>
      <span className="admin-challenge-stat-value">{value}</span>
      <span className="admin-challenge-stat-label">{label}</span>
    </div>
  )
}

// Settings Tab
function SettingsTab({
  settings,
  onSave,
}: {
  settings: ChallengeSettings
  onSave: () => void
}) {
  const [form, setForm] = useState({
    is_active: settings.is_active ?? false,
    title: fallbackText(settings.title, SCRIPT_DEFAULTS.title),
    subtitle: fallbackText(settings.subtitle, SCRIPT_DEFAULTS.subtitle),
    description: fallbackText(settings.description, SCRIPT_DEFAULTS.description),
    capacity: settings.capacity ?? 0,
    meeting_url: settings.meeting_url ?? '',
    starts_at: settings.starts_at ? settings.starts_at.slice(0, 16) : '',
    duration_minutes: settings.duration_minutes ?? 60,
    timezone: settings.timezone ?? 'Africa/Tunis',
    benefits: fallbackList(settings.benefits, SCRIPT_DEFAULTS.benefits),
    requirements: fallbackList(settings.requirements, SCRIPT_DEFAULTS.requirements),
    faq: settings.faq ?? [],
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setForm({
      is_active: settings.is_active ?? false,
      title: fallbackText(settings.title, SCRIPT_DEFAULTS.title),
      subtitle: fallbackText(settings.subtitle, SCRIPT_DEFAULTS.subtitle),
      description: fallbackText(settings.description, SCRIPT_DEFAULTS.description),
      capacity: settings.capacity ?? 0,
      meeting_url: settings.meeting_url ?? '',
      starts_at: settings.starts_at ? settings.starts_at.slice(0, 16) : '',
      duration_minutes: settings.duration_minutes ?? 60,
      timezone: settings.timezone ?? 'Africa/Tunis',
      benefits: fallbackList(settings.benefits, SCRIPT_DEFAULTS.benefits),
      requirements: fallbackList(settings.requirements, SCRIPT_DEFAULTS.requirements),
      faq: settings.faq ?? [],
    })
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const result = await updateChallengeSettingsAction({
      ...form,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : settings.starts_at,
    })
    if (result.success) {
      setMessage('تم حفظ إعدادات التحدّي بنجاح.')
      onSave()
    } else {
      setMessage(`خطأ: ${result.error}`)
    }
    setSaving(false)
  }

  return (
    <div className="admin-section">
      <h2 className="text-xl font-semibold text-purple-700 mb-4">إعدادات صفحة التحدّي (Script-based)</h2>

      <div className="admin-challenge-form">
        <div className="admin-form-row">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              setForm((p) => ({
                ...p,
                title: SCRIPT_DEFAULTS.title,
                subtitle: SCRIPT_DEFAULTS.subtitle,
                description: SCRIPT_DEFAULTS.description,
                benefits: [...SCRIPT_DEFAULTS.benefits],
                requirements: [...SCRIPT_DEFAULTS.requirements],
              }))
            }
          >
            تحميل نص السكربت الافتراضي
          </button>
        </div>

        {/* Active Toggle */}
        <div className="admin-form-row">
          <label className="admin-form-label">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            />
            <span style={{ marginLeft: 8 }}>تفعيل صفحة التحدّي</span>
          </label>
        </div>

        {/* Basic Info */}
        <div className="admin-form-row">
          <label className="admin-form-label">العنوان الرئيسي</label>
          <input
            type="text"
            className="input"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder={SCRIPT_DEFAULTS.title}
          />
        </div>

        <div className="admin-form-row">
          <label className="admin-form-label">العنوان الفرعي</label>
          <input
            type="text"
            className="input"
            value={form.subtitle}
            onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
            placeholder={SCRIPT_DEFAULTS.subtitle}
          />
        </div>

        <div className="admin-form-row">
          <label className="admin-form-label">الوصف الافتتاحي</label>
          <textarea
            className="input textarea"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder={SCRIPT_DEFAULTS.description}
          />
        </div>

        {/* Capacity & Meeting */}
        <div className="admin-form-grid2">
          <div className="admin-form-row">
            <label className="admin-form-label">عدد المقاعد</label>
            <input
              type="number"
              className="input"
              value={form.capacity}
              onChange={(e) => setForm((p) => ({ ...p, capacity: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <div className="admin-form-row">
            <label className="admin-form-label">رابط الجلسة</label>
            <input
              type="url"
              className="input"
              value={form.meeting_url}
              onChange={(e) => setForm((p) => ({ ...p, meeting_url: e.target.value }))}
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="admin-form-grid2">
          <div className="admin-form-row">
            <label className="admin-form-label">تاريخ/وقت البداية</label>
            <input
              type="datetime-local"
              className="input"
              value={form.starts_at}
              onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
            />
          </div>
          <div className="admin-form-row">
            <label className="admin-form-label">مدة الجلسة (بالدقائق)</label>
            <input
              type="number"
              className="input"
              value={form.duration_minutes}
              onChange={(e) => setForm((p) => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))}
            />
          </div>
        </div>

        <div className="admin-form-row">
          <label className="admin-form-label">المنطقة الزمنية</label>
          <input
            type="text"
            className="input"
            value={form.timezone}
            onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
            placeholder="Africa/Tunis"
          />
        </div>

        {/* Benefits List */}
        <ListEditor
          label="قسم: ماذا يعني هذا التحدّي؟ (ستكتشفين)"
          items={form.benefits}
          onChange={(benefits) => setForm((p) => ({ ...p, benefits }))}
        />

        {/* Requirements List */}
        <ListEditor
          label="قسم: تفاصيل الأيام (اليوم 1/2/3)"
          items={form.requirements}
          onChange={(requirements) => setForm((p) => ({ ...p, requirements }))}
        />

        {/* FAQ Editor */}
        <FAQEditor
          label="الأسئلة الشائعة (اختياري)"
          faq={form.faq}
          onChange={(faq) => setForm((p) => ({ ...p, faq }))}
        />

        {/* Save */}
        <div className="admin-form-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </button>
          {message && (
            <span className={message.includes('خطأ') ? 'text-red-600' : 'text-green-600'}>{message}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// List Editor for benefits/requirements
function ListEditor({
  label,
  items,
  onChange,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()])
      setNewItem('')
    }
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return
    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    onChange(newItems)
  }

  return (
    <div className="admin-form-row">
      <label className="admin-form-label">{label}</label>
      <div className="admin-list-editor">
        {items.map((item, index) => (
          <div key={index} className="admin-list-item">
            <span>{item}</span>
            <div className="admin-list-item-actions">
              <button type="button" onClick={() => moveItem(index, 'up')} disabled={index === 0}>
                ↑
              </button>
              <button type="button" onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1}>
                ↓
              </button>
              <button type="button" onClick={() => removeItem(index)}>
                ×
              </button>
            </div>
          </div>
        ))}
        <div className="admin-list-add">
          <textarea
            className="input"
            rows={2}
            placeholder="أضيفي سطرًا جديدًا..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
          />
          <button type="button" className="btn btn-outline" onClick={addItem}>
            إضافة
          </button>
        </div>
      </div>
    </div>
  )
}

// FAQ Editor
function FAQEditor({
  label,
  faq,
  onChange,
}: {
  label: string
  faq: { q: string; a: string }[]
  onChange: (faq: { q: string; a: string }[]) => void
}) {
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')

  const addFaq = () => {
    if (newQ.trim() && newA.trim()) {
      onChange([...faq, { q: newQ.trim(), a: newA.trim() }])
      setNewQ('')
      setNewA('')
    }
  }

  const removeFaq = (index: number) => {
    onChange(faq.filter((_, i) => i !== index))
  }

  return (
    <div className="admin-form-row">
      <label className="admin-form-label">{label}</label>
      <div className="admin-faq-editor">
        {faq.map((item, index) => (
          <div key={index} className="admin-faq-item">
            <div className="admin-faq-item-content">
              <strong>س: {item.q}</strong>
              <p>ج: {item.a}</p>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => removeFaq(index)}>
              حذف
            </button>
          </div>
        ))}
        <div className="admin-faq-add">
          <input
            type="text"
            className="input"
            placeholder="السؤال..."
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
          />
          <textarea
            className="input textarea"
            rows={2}
            placeholder="الإجابة..."
            value={newA}
            onChange={(e) => setNewA(e.target.value)}
          />
          <button type="button" className="btn btn-outline" onClick={addFaq}>
            إضافة سؤال
          </button>
        </div>
      </div>
    </div>
  )
}

// Registrations Tab
function RegistrationsTab({
  registrations,
  total,
  page,
  filters,
  onFiltersChange,
  onRefresh,
  onOverviewRefresh,
}: {
  registrations: Registration[]
  total: number
  page: number
  filters: RegistrationFilters
  onFiltersChange: (f: RegistrationFilters) => void
  onRefresh: () => void
  onOverviewRefresh: () => void
}) {
  const [editModal, setEditModal] = useState<Registration | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const pageSize = filters.pageSize || 20
  const totalPages = Math.ceil(total / pageSize)

  const handleSearch = () => {
    onFiltersChange({ ...filters, search: searchTerm, page: 1 })
  }

  const handleExport = async (filter: 'all' | 'confirmed' | 'waitlist') => {
    const { csv, filename } = await exportCsvAction(filter)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handlePromote = async (id: string) => {
    const result = await promoteWaitlistAction(id)
    if (result.success) {
      onRefresh()
      onOverviewRefresh()
    } else {
      alert(result.error)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteRegistrationAction(deleteId)
    setDeleteId(null)
    onRefresh()
    onOverviewRefresh()
  }

  return (
    <div className="admin-section">
      <h2 className="text-xl font-semibold text-purple-700 mb-4">Registrations ({total})</h2>

      {/* Filters */}
      <div className="admin-reg-filters">
        <div className="admin-reg-tabs">
          {(['all', 'confirmed', 'waitlist'] as const).map((s) => (
            <button
              key={s}
              className={`admin-reg-tab ${filters.status === s ? 'is-active' : ''}`}
              onClick={() => onFiltersChange({ ...filters, status: s, page: 1 })}
            >
              {s === 'all' ? 'All' : s === 'confirmed' ? 'Confirmed' : 'Waitlist'}
            </button>
          ))}
        </div>

        <div className="admin-reg-search">
          <input
            type="text"
            className="input"
            placeholder="Search email, name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-outline" onClick={handleSearch}>
            Search
          </button>
        </div>

        <div className="admin-reg-extra-filters">
          <label>
            <input
              type="checkbox"
              checked={filters.notCopied || false}
              onChange={(e) => onFiltersChange({ ...filters, notCopied: e.target.checked, page: 1 })}
            />
            <span style={{ marginLeft: 4 }}>Not Copied Yet</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.saved || false}
              onChange={(e) => onFiltersChange({ ...filters, saved: e.target.checked, page: 1 })}
            />
            <span style={{ marginLeft: 4 }}>Saved</span>
          </label>
        </div>

        <div className="admin-reg-export">
          <span>Export:</span>
          <button className="btn btn-sm" onClick={() => handleExport('all')}>
            All
          </button>
          <button className="btn btn-sm" onClick={() => handleExport('confirmed')}>
            Confirmed
          </button>
          <button className="btn btn-sm" onClick={() => handleExport('waitlist')}>
            Waitlist
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-reg-table-wrap">
        <table className="admin-reg-table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Link Copied</th>
              <th>Link Saved</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 20 }}>
                  No registrations found
                </td>
              </tr>
            ) : (
              registrations.map((reg) => (
                <tr key={reg.id}>
                  <td>{new Date(reg.created_at).toLocaleDateString()}</td>
                  <td>{reg.name}</td>
                  <td className="ltr-cell">{reg.email}</td>
                  <td className="ltr-cell">{reg.phone || '—'}</td>
                  <td>
                    <span className={`admin-reg-status ${reg.status}`}>{reg.status}</span>
                  </td>
                  <td>{reg.link_copied_at ? '✅' : '—'}</td>
                  <td>{reg.link_saved_at ? '✅' : '—'}</td>
                  <td>
                    <div className="admin-reg-actions">
                      <button className="btn btn-sm" onClick={() => setEditModal(reg)}>
                        Edit
                      </button>
                      {reg.status === 'waitlist' && (
                        <button className="btn btn-sm btn-primary" onClick={() => handlePromote(reg.id)}>
                          Promote
                        </button>
                      )}
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(reg.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-reg-pagination">
          <button
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => onFiltersChange({ ...filters, page: page - 1 })}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-sm"
            disabled={page >= totalPages}
            onClick={() => onFiltersChange({ ...filters, page: page + 1 })}
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <EditRegistrationModal
          registration={editModal}
          onClose={() => setEditModal(null)}
          onSave={() => {
            setEditModal(null)
            onRefresh()
            onOverviewRefresh()
          }}
        />
      )}

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Delete"
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete
            </button>
            <button className="btn btn-outline" onClick={() => setDeleteId(null)}>
              Cancel
            </button>
          </div>
        }
      >
        <p>Are you sure you want to delete this registration? This action cannot be undone.</p>
      </Modal>
    </div>
  )
}

// Edit Registration Modal
function EditRegistrationModal({
  registration,
  onClose,
  onSave,
}: {
  registration: Registration
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    name: registration.name,
    email: registration.email,
    phone: registration.phone || '',
    status: registration.status,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const result = await updateRegistrationAction(registration.id, {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      status: form.status,
    })
    if (result.success) {
      onSave()
    } else {
      alert(result.error)
    }
    setSaving(false)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Registration"
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      }
    >
      <div className="modal-form">
        <div className="admin-form-row">
          <label className="admin-form-label">Name</label>
          <input
            type="text"
            className="input"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">Email</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">Phone</label>
          <input
            type="tel"
            className="input"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>
        <div className="admin-form-row">
          <label className="admin-form-label">Status</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as 'confirmed' | 'waitlist' }))}
          >
            <option value="confirmed">Confirmed</option>
            <option value="waitlist">Waitlist</option>
          </select>
        </div>
      </div>
    </Modal>
  )
}
