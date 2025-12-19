"use client"

import { useEffect, useMemo, useRef, useState } from 'react'

type Summary = { requests: number; clicks: number; ratio: number; from: string; to: string }
type SeriesPoint = { date: string; requests: number; clicks: number }
type DeviceRow = { device: string; count: number }
type RequestRow = {
  id: number
  created_at: string
  name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  product_slug?: string | null
  country?: string | null
  source?: string | null
  click_id?: string | null
  user_agent?: string | null
  meta?: any
}

type RequestsResponse = { rows: RequestRow[]; total: number; page: number; pageSize: number; from: string; to: string }
type ClickRow = {
  id: number
  created_at: string
  product_slug?: string | null
  source?: string | null
  referrer?: string | null
  click_id?: string | null
  user_agent?: string | null
  meta?: any
}
type ClicksResponse = { rows: ClickRow[]; total: number; page: number; pageSize: number; from: string; to: string }

type DatePreset = '7d' | '30d' | 'custom'
// Earliest allowed date: 16/12/2025
const MIN_RANGE_START = new Date(Date.UTC(2025, 11, 16))
const REQUEST_PAGE_SIZE = 5
const CLICK_PAGE_SIZE = 5

export default function AnalyticsEnClient() {
  const [preset, setPreset] = useState<DatePreset>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [series, setSeries] = useState<SeriesPoint[]>([])
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [table, setTable] = useState<RequestRow[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [clicks, setClicks] = useState<ClickRow[]>([])
  const [clickPage, setClickPage] = useState(1)
  const [clickTotal, setClickTotal] = useState(0)
  const [clickSearch, setClickSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [clickLoading, setClickLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ type: 'request' | 'click'; row: RequestRow | ClickRow } | null>(null)

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / REQUEST_PAGE_SIZE)), [total])
  const totalClickPages = useMemo(() => Math.max(1, Math.ceil((clickTotal || 0) / CLICK_PAGE_SIZE)), [clickTotal])

  const range = useMemo(() => resolveRange(preset, customFrom, customTo), [preset, customFrom, customTo])

  useEffect(() => {
    setPage(1)
  }, [range.from, range.to, search])

  useEffect(() => {
    setClickPage(1)
  }, [range.from, range.to, clickSearch])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ from: range.from, to: range.to })
    const tableParams = new URLSearchParams({ from: range.from, to: range.to, page: String(page), pageSize: String(REQUEST_PAGE_SIZE) })
    if (search.trim()) tableParams.set('search', search.trim())

    Promise.all([
      fetchJson<Summary>(`/api/admin/analytics-en/summary?${params.toString()}`),
      fetchJson<{ points: SeriesPoint[] }>(`/api/admin/analytics-en/series?${params.toString()}`),
      fetchJson<{ items: DeviceRow[] }>(`/api/admin/analytics-en/devices?${params.toString()}`),
      fetchJson<RequestsResponse>(`/api/admin/analytics-en/requests?${tableParams.toString()}`),
    ])
      .then(([s, ser, dev, tbl]) => {
        setSummary(s)
        setSeries(fillMissing(ser?.points || [], range.from, range.to))
        setDevices(dev?.items || [])
        setTable(tbl?.rows || [])
        setTotal(tbl?.total || 0)
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load analytics')
      })
      .finally(() => setLoading(false))
  }, [range.from, range.to, page, search])

  useEffect(() => {
    setClickLoading(true)
    const clickParams = new URLSearchParams({ from: range.from, to: range.to, page: String(clickPage), pageSize: String(CLICK_PAGE_SIZE) })
    if (clickSearch.trim()) clickParams.set('search', clickSearch.trim())

    fetchJson<ClicksResponse>(`/api/admin/analytics-en/clicks?${clickParams.toString()}`)
      .then((data) => {
        setClicks(data?.rows || [])
        setClickTotal(data?.total || 0)
      })
      .catch((err) => {
        console.error(err)
        setError('Failed to load clicks')
      })
      .finally(() => setClickLoading(false))
  }, [range.from, range.to, clickPage, clickSearch])

  const lineChartRef = useRef<HTMLCanvasElement | null>(null)
  const deviceChartRef = useRef<HTMLCanvasElement | null>(null)
  const lineChartInstance = useRef<any>(null)
  const deviceChartInstance = useRef<any>(null)

  useEffect(() => {
    if (!lineChartRef.current || !series.length) return
    ensureChartJs().then((Chart) => {
      const ctx = lineChartRef.current!.getContext('2d')
      if (!ctx) return
      if (lineChartInstance.current) lineChartInstance.current.destroy()
      lineChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: series.map((p) => p.date),
          datasets: [
            { label: 'Requests', data: series.map((p) => p.requests), borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.1)', tension: 0.3 },
            { label: 'Clicks', data: series.map((p) => p.clicks), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', tension: 0.3 },
          ],
        },
        options: {
          responsive: true,
          interaction: { mode: 'index', intersect: false },
          plugins: { tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y}` } } },
          scales: { x: { ticks: { maxRotation: 0, autoSkip: true } }, y: { beginAtZero: true } },
        },
      })
    })
  }, [series])

  useEffect(() => {
    if (!deviceChartRef.current || !devices.length) return
    ensureChartJs().then((Chart) => {
      const ctx = deviceChartRef.current!.getContext('2d')
      if (!ctx) return
      if (deviceChartInstance.current) deviceChartInstance.current.destroy()
      deviceChartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: devices.map((d) => d.device),
          datasets: [{
            data: devices.map((d) => d.count),
            backgroundColor: ['#6366f1', '#22c55e', '#f59e0b', '#94a3b8', '#ef4444'],
          }],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
      })
    })
  }, [devices])

  const kpis = summary || { requests: 0, clicks: 0, ratio: 0 }

  return (
    <div className="analytics-en" lang="en" dir="ltr">
      <header className="analytics-head">
        <div>
          <h1 className="analytics-title">Download Analytics</h1>
          <p className="analytics-sub">Monitor downloads across requests and clicks.</p>
        </div>
        <div className="analytics-filters-en">
          <div className="filter-row">
            {['7d','30d','custom'].map((p) => (
              <button key={p} className={`chip ${preset===p?'is-active':''}`} onClick={() => setPreset(p as DatePreset)}>{p === '7d' ? 'Last 7d' : p === '30d' ? 'Last 30d' : 'Custom'}</button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="filter-row">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
          )}
        </div>
      </header>

      {error ? <div className="text-red-600 text-sm">{error}</div> : null}
      {loading ? <div className="text-sm text-gray-600">Loading analytics…</div> : null}

      <section className="kpi-grid-en">
        <div className="kpi-card-en">
          <div className="kpi-label-en">Total Download Requests</div>
          <div className="kpi-value-en">{kpis.requests}</div>
        </div>
        <div className="kpi-card-en">
          <div className="kpi-label-en">Total Download Clicks</div>
          <div className="kpi-value-en">{kpis.clicks}</div>
        </div>
        <div className="kpi-card-en">
          <div className="kpi-label-en">Click/Request Ratio</div>
          <div className="kpi-value-en">{kpis.requests === 0 ? '0.00%' : `${kpis.ratio.toFixed(2)}%`}</div>
        </div>
      </section>

      <section className="chart-grid-en">
        <div className="chart-card-en">
          <div className="chart-head-en">Requests vs Clicks (daily)</div>
          {series.length ? <canvas ref={lineChartRef} /> : <div className="empty-en">No data in this range.</div>}
        </div>
        <div className="chart-card-en is-pie">
          <div className="chart-head-en">Devices</div>
          {devices.length ? <canvas ref={deviceChartRef} className="pie-canvas" /> : <div className="empty-en">No device data.</div>}
        </div>
      </section>

      <section className="table-card-en">
        <div className="table-head-en">
          <div>
            <h2 className="table-title-en">Download requests</h2>
            <p className="table-sub-en">Search by name, email, or phone. Sorted newest first.</p>
          </div>
          <input
            className="input-en"
            placeholder="Search (name/email/phone)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="table-en">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {table.length === 0 ? (
                <tr><td colSpan={6} className="text-center">No requests found.</td></tr>
              ) : table.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.created_at)}</td>
                  <td>{row.product_slug || '—'}</td>
                  <td>{formatName(row)}</td>
                  <td className="ltr-cell">{row.email || '—'}</td>
                  <td className="ltr-cell">{row.phone || '—'}</td>
                  <td><button className="btn-sm-en" onClick={() => setSelected({ type: 'request', row })}>Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer-en">
          <span>Page {page} of {totalPages}</span>
          <div className="pager-en">
            <button disabled={page<=1} onClick={() => setPage((p) => Math.max(1, p-1))}>Prev</button>
            <button disabled={page>=totalPages} onClick={() => setPage((p) => Math.min(totalPages, p+1))}>Next</button>
          </div>
        </div>
      </section>

      <section className="table-card-en">
        <div className="table-head-en">
          <div>
            <h2 className="table-title-en">Download clicks</h2>
            <p className="table-sub-en">Search by click id, referrer, or source.</p>
          </div>
          <input
            className="input-en"
            placeholder="Search (click id/referrer/source)"
            value={clickSearch}
            onChange={(e) => setClickSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="table-en">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Source</th>
                <th>Referrer</th>
                <th>Device</th>
                <th>Click ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clicks.length === 0 ? (
                <tr><td colSpan={7} className="text-center">{clickLoading ? 'Loading…' : 'No clicks found.'}</td></tr>
              ) : clicks.map((row) => (
                <tr key={row.id}>
                  <td>{formatDate(row.created_at)}</td>
                  <td>{row.product_slug || '—'}</td>
                  <td>{row.source || '—'}</td>
                  <td className="ltr-cell">{row.referrer || '—'}</td>
                  <td>{formatDevice(row.user_agent)}</td>
                  <td className="ltr-cell">{row.click_id || '—'}</td>
                  <td><button className="btn-sm-en" onClick={() => setSelected({ type: 'click', row })}>Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer-en">
          <span>Page {clickPage} of {totalClickPages}</span>
          <div className="pager-en">
            <button disabled={clickPage<=1} onClick={() => setClickPage((p) => Math.max(1, p-1))}>Prev</button>
            <button disabled={clickPage>=totalClickPages} onClick={() => setClickPage((p) => Math.min(totalClickPages, p+1))}>Next</button>
          </div>
        </div>
      </section>

        {selected ? (
          <div className="modal-backdrop" onClick={() => setSelected(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>{selected.type === 'request' ? 'Request details' : 'Click details'}</h3>
                <button className="btn" onClick={() => setSelected(null)}>Close</button>
              </div>
            {selected.type === 'request' ? (
              <div className="detail-grid-en">
                <div><strong>Date:</strong> {formatDate((selected.row as RequestRow).created_at)}</div>
                <div><strong>Product:</strong> {(selected.row as RequestRow).product_slug || '—'}</div>
                <div><strong>Name:</strong> {formatName(selected.row as RequestRow)}</div>
                <div className="ltr-cell"><strong>Email:</strong> {(selected.row as RequestRow).email || '—'}</div>
                <div className="ltr-cell"><strong>Phone:</strong> {(selected.row as RequestRow).phone || '—'}</div>
                <div><strong>Country:</strong> {(selected.row as RequestRow).country || '—'}</div>
                <div><strong>Source:</strong> {(selected.row as RequestRow).source || '—'}</div>
                <div className="ltr-cell"><strong>Click ID:</strong> {(selected.row as any).click_id || '—'}</div>
                <div><strong>User Agent:</strong> {(selected.row as RequestRow).user_agent || '—'}</div>
                <div className="full"><strong>Meta:</strong><pre className="meta-preview">{(selected.row as RequestRow).meta ? JSON.stringify((selected.row as RequestRow).meta, null, 2) : '—'}</pre></div>
              </div>
            ) : (
              <div className="detail-grid-en">
                <div><strong>Date:</strong> {formatDate((selected.row as ClickRow).created_at)}</div>
                <div><strong>Product:</strong> {(selected.row as ClickRow).product_slug || '—'}</div>
                <div><strong>Source:</strong> {(selected.row as ClickRow).source || '—'}</div>
                <div className="ltr-cell"><strong>Referrer:</strong> {(selected.row as ClickRow).referrer || '—'}</div>
                <div><strong>Device:</strong> {formatDevice((selected.row as ClickRow).user_agent)}</div>
                <div className="ltr-cell"><strong>Click ID:</strong> {(selected.row as ClickRow).click_id || '—'}</div>
                <div><strong>User Agent:</strong> {(selected.row as ClickRow).user_agent || '—'}</div>
                <div className="full"><strong>Meta:</strong><pre className="meta-preview">{(selected.row as ClickRow).meta ? JSON.stringify((selected.row as ClickRow).meta, null, 2) : '—'}</pre></div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatName(row: RequestRow) {
  const combined = [row.first_name, row.last_name].filter(Boolean).join(' ').trim()
  return combined || row.name || '—'
}

function formatDate(value?: string) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return value
  }
}

function formatDevice(userAgent?: string | null) {
  const ua = (userAgent || '').toLowerCase()
  if (!ua) return 'Unknown'
  const isTablet = /ipad|tablet|sm-t|kindle|silk|playbook/.test(ua)
  const isMobile = /iphone|android|mobile|opera mini|blackberry|phone/.test(ua)
  if (isTablet) return 'Tablet'
  if (isMobile && !isTablet) return 'Mobile'
  return 'Desktop'
}

function resolveRange(preset: DatePreset, customFrom: string, customTo: string) {
  const now = new Date()
  let from = new Date(now)
  let to = new Date(now)
  if (preset === '7d') {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (preset === '30d') {
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  } else if (preset === 'custom' && customFrom && customTo) {
    from = new Date(customFrom)
    to = new Date(customTo)
  }
  if (from < MIN_RANGE_START) from = new Date(MIN_RANGE_START)
  if (to > now) to = new Date(now)
  if (to < from) to = new Date(from)
  return { from: from.toISOString(), to: to.toISOString() }
}

function fillMissing(points: SeriesPoint[], fromIso: string, toIso: string): SeriesPoint[] {
  const map = new Map(points.map((p) => [p.date.slice(0,10), p]))
  const out: SeriesPoint[] = []
  let cursor = startOfDay(new Date(fromIso))
  const end = startOfDay(new Date(toIso))
  while (cursor <= end) {
    const key = normalizeDay(cursor)
    const p = map.get(key)
    out.push({ date: key, requests: p?.requests || 0, clicks: p?.clicks || 0 })
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  }
  return out
}

function normalizeDay(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

async function ensureChartJs(): Promise<any> {
  if (typeof window === 'undefined') throw new Error('no-window')
  if ((window as any).Chart) return (window as any).Chart
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js'
    s.async = true
    s.onload = () => resolve((window as any).Chart)
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => 'request_failed')
    throw new Error(text)
  }
  return res.json()
}
