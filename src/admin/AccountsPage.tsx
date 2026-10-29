import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatKES } from '../lib/format'
import { orderCode, type Order } from '../lib/orders'
import { PageTitle, formatDate, formatDateTime } from './ui'

type PeriodId = 'today' | 'week' | 'month' | 'last-month' | 'year' | 'all'

const periods: { id: PeriodId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'month', label: 'This month' },
  { id: 'last-month', label: 'Last month' },
  { id: 'year', label: 'This year' },
  { id: 'all', label: 'All time' },
]

function range(id: PeriodId): [Date, Date] {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start.getTime() + 86_400_000)
  if (id === 'today') return [start, end]
  if (id === 'week') return [new Date(start.getTime() - 6 * 86_400_000), end]
  if (id === 'month') return [new Date(now.getFullYear(), now.getMonth(), 1), end]
  if (id === 'last-month') return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 1)]
  if (id === 'year') return [new Date(now.getFullYear(), 0, 1), end]
  return [new Date(2000, 0, 1), end]
}

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function AccountsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState('')
  const [period, setPeriod] = useState<PeriodId>('month')

  useEffect(() => {
    supabase!.from('orders').select('*').order('created_at', { ascending: false }).limit(5000).then(({ data, error }) => {
      if (error) setError(error.message)
      else setOrders(data as Order[])
    })
  }, [])

  const stats = useMemo(() => {
    const [from, to] = range(period)
    const inRange = (iso: string | null) => !!iso && new Date(iso) >= from && new Date(iso) < to
    const live = orders.filter((o) => o.status !== 'cancelled')
    const placed = live.filter((o) => inRange(o.created_at) && o.total > 0)
    // Money is counted on the day it was (last) received.
    const payments = orders.filter((o) => o.amount_paid > 0 && inRange(o.paid_at))
    const received = payments.reduce((n, o) => n + o.amount_paid, 0)
    const sales = placed.reduce((n, o) => n + o.total, 0)
    const owing = live.filter((o) => o.total > o.amount_paid && o.total > 0)

    // Received per day, for the chart (up to the last 31 days of the period).
    const days: { key: string; label: string; amount: number }[] = []
    const chartFrom = new Date(Math.max(from.getTime(), to.getTime() - 31 * 86_400_000))
    for (let d = new Date(chartFrom); d < to; d = new Date(d.getTime() + 86_400_000)) {
      days.push({ key: dayKey(d), label: d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }), amount: 0 })
    }
    for (const o of payments) {
      const day = days.find((x) => x.key === dayKey(new Date(o.paid_at!)))
      if (day) day.amount += o.amount_paid
    }

    return {
      received,
      sales,
      orderCount: placed.length,
      average: placed.length ? Math.round(sales / placed.length) : 0,
      outstanding: owing.reduce((n, o) => n + (o.total - o.amount_paid), 0),
      owing,
      payments,
      days,
    }
  }, [orders, period])

  const exportCsv = () => {
    const rows = [
      ['Date paid', 'Order', 'Customer', 'Phone', 'Order total', 'Amount paid', 'M-Pesa code / note'],
      ...stats.payments.map((o) => [
        new Date(o.paid_at!).toLocaleString('en-KE'), orderCode(o.id), o.customer_name, o.phone, o.total, o.amount_paid, o.mpesa_code ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `payments-${period}-${dayKey(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const max = Math.max(1, ...stats.days.map((d) => d.amount))

  return (
    <div>
      <PageTitle title="Accounts">
        <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodId)} className="input w-auto! rounded-full! py-2!">
          {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <button onClick={exportCsv} disabled={!stats.payments.length} className="btn bg-white py-2! ring-1 ring-cream-200"><Download className="size-4" /> Download (Excel)</button>
      </PageTitle>

      {error && <p className="mb-4 rounded-2xl bg-berry-100 p-3 text-sm text-berry-600">{error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Money received" value={formatKES(stats.received)} accent />
        <Stat label="Sales (orders placed)" value={formatKES(stats.sales)} note={`${stats.orderCount} orders`} />
        <Stat label="Average order" value={formatKES(stats.average)} />
        <Stat label="Still owed (all time)" value={formatKES(stats.outstanding)} note={`${stats.owing.length} orders`} warn={stats.outstanding > 0} />
      </div>

      <section className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-cream-200">
        <h2 className="mb-4 font-semibold">Money received per day</h2>
        <div className="flex h-40 items-end gap-1" role="img" aria-label="Bar chart of money received per day">
          {stats.days.map((d) => (
            <div key={d.key} className="group relative flex h-full flex-1 items-end">
              <div className="w-full rounded-t bg-berry-500" style={{ height: `${(d.amount / max) * 100}%`, minHeight: d.amount ? 2 : 0 }} />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-cocoa-800 px-2 py-1 text-xs whitespace-nowrap text-cream-50 group-hover:block">
                {d.label}: {formatKES(d.amount)}
              </span>
            </div>
          ))}
        </div>
        {stats.days.length > 1 && (
          <div className="mt-1 flex justify-between text-xs text-cocoa-500"><span>{stats.days[0].label}</span><span>{stats.days.at(-1)!.label}</span></div>
        )}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 ring-1 ring-cream-200">
          <h2 className="mb-3 font-semibold">Payments received</h2>
          {!stats.payments.length ? <p className="text-sm text-cocoa-500">No payments in this period.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-cocoa-500"><th className="pb-2">When</th><th>Customer</th><th>Code</th><th className="text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-cream-200">
                {stats.payments.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2">{formatDateTime(o.paid_at!)}</td>
                    <td>{o.customer_name || '—'} <span className="font-mono text-xs text-cocoa-500">#{orderCode(o.id)}</span></td>
                    <td className="font-mono text-xs">{o.mpesa_code ?? '—'}</td>
                    <td className="text-right font-semibold">{formatKES(o.amount_paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-3xl bg-white p-5 ring-1 ring-cream-200">
          <h2 className="mb-3 font-semibold">Customers who still owe</h2>
          {!stats.owing.length ? <p className="text-sm text-cocoa-500">Nobody owes anything. 🎉</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-cocoa-500"><th className="pb-2">Customer</th><th>Due</th><th className="text-right">Balance</th></tr></thead>
              <tbody className="divide-y divide-cream-200">
                {stats.owing.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2">{o.customer_name || '—'} <span className="block text-xs text-cocoa-500">{o.phone} · #{orderCode(o.id)}</span></td>
                    <td>{o.delivery_date ? formatDate(o.delivery_date) : '—'}</td>
                    <td className="text-right font-semibold text-berry-600">{formatKES(o.total - o.amount_paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value, note, accent, warn }: { label: string; value: string; note?: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={`rounded-3xl p-5 ring-1 ${accent ? 'bg-cocoa-800 text-cream-50 ring-cocoa-800' : 'bg-white ring-cream-200'}`}>
      <p className={`text-xs font-medium ${accent ? 'text-cream-200' : 'text-cocoa-500'}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold ${warn ? 'text-berry-600' : ''}`}>{value}</p>
      {note && <p className={`text-xs ${accent ? 'text-cream-200' : 'text-cocoa-500'}`}>{note}</p>}
    </div>
  )
}
