'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  exportQuizCsvAction,
  getQuizInsightsAction,
  getQuizOverviewAction,
  listQuizContendorsAction,
  type QuizContendor,
  type QuizFilters,
  type QuizInsights,
  type QuizOverview,
} from './actions'

type TabKey = 'overview' | 'records'

const DEFAULT_FILTERS: QuizFilters = {
  search: '',
  resultType: 'all',
  shadowType: 'all',
  mixedOnly: false,
  page: 1,
  pageSize: 20,
}

const RESULT_TYPE_OPTIONS = [
  'all',
  'الأم الموجِّهة',
  'الأم المُرضية / المرهَقة',
  'الأم المُنقِذة',
  'الأم المستقلة',
] as const

const SHADOW_TYPE_OPTIONS = [
  'all',
  'الناقدة الساخطة',
  'المنصهرة',
  'الضحية',
  'غير الاجتماعية',
] as const

export default function AdminQuizClient() {
  const [tab, setTab] = useState<TabKey>('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [overview, setOverview] = useState<QuizOverview | null>(null)
  const [insights, setInsights] = useState<QuizInsights>({
    daily: [],
    byResultType: [],
    byShadowType: [],
  })

  const [rows, setRows] = useState<QuizContendor[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<QuizFilters>(DEFAULT_FILTERS)
  const [searchTerm, setSearchTerm] = useState('')

  const pageSize = filters.pageSize || 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const loadOverviewAndInsights = useCallback(async () => {
    const [ov, charts] = await Promise.all([
      getQuizOverviewAction(),
      getQuizInsightsAction(14),
    ])
    setOverview(ov)
    setInsights(charts)
  }, [])

  const loadRows = useCallback(async (nextFilters: QuizFilters) => {
    const result = await listQuizContendorsAction(nextFilters)
    setRows(result.data)
    setTotal(result.total)
    setPage(result.page)
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      loadOverviewAndInsights(),
      loadRows(DEFAULT_FILTERS),
    ]).finally(() => setLoading(false))
  }, [loadOverviewAndInsights, loadRows])

  const applyFilters = useCallback((next: QuizFilters) => {
    setFilters(next)
    setSearchTerm(next.search || '')
    loadRows(next)
  }, [loadRows])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      loadOverviewAndInsights(),
      loadRows(filters),
    ])
    setRefreshing(false)
  }

  const handleSearch = () => {
    applyFilters({ ...filters, search: searchTerm, page: 1 })
  }

  const handleExport = async () => {
    const { csv, filename } = await exportQuizCsvAction({
      search: filters.search,
      resultType: filters.resultType,
      shadowType: filters.shadowType,
      mixedOnly: filters.mixedOnly,
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const maxDaily = useMemo(
    () => Math.max(1, ...insights.daily.map((d) => d.count)),
    [insights.daily],
  )

  return (
    <div dir="ltr" className="admin-shell" style={{ maxWidth: 1600, marginInline: 'auto' }}>
      <header className="admin-header-card glass-water">
        <div className="admin-header-row">
          <div>
            <h1 className="admin-title">Quiz Insights</h1>
            <div className="admin-sub">Parenting quiz completions and audience breakdown</div>
          </div>
          <div className="admin-head-tools" role="toolbar" aria-label="Quiz admin tools">
            <Link href="/admin" className="btn btn-outline">← Back to Dashboard</Link>
            <button className="btn btn-outline" onClick={handleRefresh} disabled={refreshing || loading}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <nav aria-label="Quiz sections" className="admin-action" role="tablist">
          {([
            { key: 'overview', label: '📊 Overview' },
            { key: 'records', label: '👥 Records' },
          ] as { key: TabKey; label: string }[]).map((item) => (
            <button
              key={item.key}
              role="tab"
              aria-selected={tab === item.key}
              className={`admin-pill ${tab === item.key ? 'is-active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              <span className="pill-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="admin-content glass-water">
        {loading ? (
          <div className="admin-loading">Loading quiz analytics...</div>
        ) : (
          <>
            {tab === 'overview' && overview ? (
              <div className="admin-section">
                <h2 className="text-xl font-semibold text-purple-700 mb-4">Overview</h2>

                <div className="admin-challenge-stats-grid">
                  <StatCard label="Total completions" value={overview.total} highlight />
                  <StatCard label="Today" value={overview.today} />
                  <StatCard label="Unique emails" value={overview.uniqueEmails} />
                  <StatCard label="Mixed results" value={overview.mixedResults} />
                  <StatCard label="Top main type" value={overview.topResultType} isText />
                  <StatCard label="Top shadow type" value={overview.topShadowType} isText />
                </div>

                <div className="admin-challenge-chart-section" style={{ marginBottom: 16 }}>
                  <h3 className="text-lg font-semibold mb-3">Completions (Last 14 Days)</h3>
                  <div className="admin-challenge-chart">
                    <div className="admin-challenge-chart-bars">
                      {insights.daily.map((point) => (
                        <div key={point.date} className="admin-challenge-chart-day">
                          <div className="admin-challenge-chart-bar-group">
                            <div
                              className="admin-challenge-chart-bar confirmed"
                              style={{ height: `${(point.count / maxDaily) * 100}%`, width: 14 }}
                              title={`${point.date}: ${point.count}`}
                            />
                          </div>
                          <span className="admin-challenge-chart-label">{point.date.slice(5)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="admin-quiz-distribution-grid">
                  <DistributionCard title="Main type distribution" items={insights.byResultType} />
                  <DistributionCard title="Shadow type distribution" items={insights.byShadowType} />
                </div>
              </div>
            ) : null}

            {tab === 'records' ? (
              <div className="admin-section">
                <h2 className="text-xl font-semibold text-purple-700 mb-4">Quiz Records ({total})</h2>

                <div className="admin-reg-filters">
                  <div className="admin-reg-search">
                    <input
                      type="text"
                      className="input"
                      placeholder="Search name, email, result type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button className="btn btn-outline" onClick={handleSearch}>Search</button>
                  </div>

                  <select
                    className="input"
                    value={filters.resultType || 'all'}
                    onChange={(e) => applyFilters({ ...filters, resultType: e.target.value, page: 1 })}
                  >
                    {RESULT_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option === 'all' ? 'All main types' : option}
                      </option>
                    ))}
                  </select>

                  <select
                    className="input"
                    value={filters.shadowType || 'all'}
                    onChange={(e) => applyFilters({ ...filters, shadowType: e.target.value, page: 1 })}
                  >
                    {SHADOW_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option === 'all' ? 'All shadow types' : option}
                      </option>
                    ))}
                  </select>

                  <label className="admin-quiz-checkbox">
                    <input
                      type="checkbox"
                      checked={!!filters.mixedOnly}
                      onChange={(e) => applyFilters({ ...filters, mixedOnly: e.target.checked, page: 1 })}
                    />
                    <span>Mixed results only</span>
                  </label>

                  <button className="btn btn-outline" onClick={handleExport}>Export CSV</button>
                </div>

                <div className="admin-reg-table-wrap">
                  <table className="admin-reg-table">
                    <thead>
                      <tr>
                        <th>Created</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Main type</th>
                        <th>Secondary type</th>
                        <th>Shadow type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>
                            No quiz records found
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => (
                          <tr key={row.id}>
                            <td>{new Date(row.created_at).toLocaleString('en-GB')}</td>
                            <td>{row.name}</td>
                            <td className="ltr-cell">{row.email}</td>
                            <td><span className="admin-quiz-pill">{row.result_type}</span></td>
                            <td>{row.secondary_type ? <span className="admin-quiz-pill muted">{row.secondary_type}</span> : '—'}</td>
                            <td><span className="admin-quiz-pill shadow">{row.shadow_type}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 ? (
                  <div className="admin-reg-pagination">
                    <button
                      className="btn btn-sm"
                      disabled={page <= 1}
                      onClick={() => applyFilters({ ...filters, page: page - 1 })}
                    >
                      Previous
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button
                      className="btn btn-sm"
                      disabled={page >= totalPages}
                      onClick={() => applyFilters({ ...filters, page: page + 1 })}
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
  isText,
}: {
  label: string
  value: number | string
  highlight?: boolean
  isText?: boolean
}) {
  return (
    <div className={`admin-challenge-stat-card ${highlight ? 'highlight' : ''}`}>
      <span className={`admin-challenge-stat-value ${isText ? 'admin-quiz-stat-text' : ''}`}>{value}</span>
      <span className="admin-challenge-stat-label">{label}</span>
    </div>
  )
}

function DistributionCard({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((item) => item.count))

  return (
    <section className="admin-challenge-chart-section">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="admin-quiz-empty">No data yet.</p>
      ) : (
        <div className="admin-quiz-distribution-list">
          {items.map((item) => (
            <div key={item.label} className="admin-quiz-distribution-item">
              <div className="admin-quiz-distribution-head">
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>
              <div className="admin-quiz-distribution-track">
                <span
                  className="admin-quiz-distribution-fill"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
