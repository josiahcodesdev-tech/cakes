import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertCircle, CalendarDays, Check, CheckCircle2, ChevronDown, Clock, Copy, CreditCard, MapPin, Phone, RefreshCw, Search, Smartphone,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatKES } from '../lib/format'
import { checkPayment, useMpesaPayment } from '../lib/mpesa'
import { orderCode, type Order, type OrderStatus } from '../lib/orders'
import { WhatsAppIcon } from '../components/BrandIcons'
import MpesaStatus from '../components/MpesaStatus'
import { Badge, PageTitle, formatDate, formatDateTime, orderStatuses, paymentStyles, waNumber } from './ui'

const filters: { id: string; label: string; match: (o: Order) => boolean }[] = [
  { id: 'open', label: 'Open', match: (o) => o.status !== 'delivered' && o.status !== 'cancelled' },
  ...orderStatuses.map((s) => ({ id: s.id, label: s.label, match: (o: Order) => o.status === s.id })),
  { id: 'unpaid', label: 'Unpaid', match: (o) => o.payment_status !== 'paid' && o.status !== 'cancelled' && o.total > 0 },
  { id: 'all', label: 'All', match: () => true },
]

const kindLabel = { order: 'Website order', custom: 'Custom request', manual: 'Payment request' }

export default function OrdersPage({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('open')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500)
    setLoading(false)
    if (error) return setError(error.message)
    setError('')
    setOrders(data as Order[])
  }, [])

  useEffect(() => {
    void load()
    // New website orders appear without having to refresh.
    const id = window.setInterval(load, 30_000)
    return () => window.clearInterval(id)
  }, [load])

  const update = async (id: string, changes: Partial<Order>) => {
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, ...changes } : o)))
    const { error } = await supabase!.from('orders').update(changes).eq('id', id)
    if (error) {
      alert(`Couldn’t save: ${error.message}`)
      void load()
    }
  }

  const shown = useMemo(() => {
    const f = filters.find((x) => x.id === filter)!
    const q = search.trim().toLowerCase()
    return orders.filter(
      (o) =>
        f.match(o) &&
        (!q || [o.customer_name, o.phone, orderCode(o.id), o.mpesa_code ?? ''].some((s) => s.toLowerCase().includes(q))),
    )
  }, [orders, filter, search])

  const counts = useMemo(() => Object.fromEntries(filters.map((f) => [f.id, orders.filter(f.match).length])), [orders])

  return (
    <div>
      <PageTitle title="Orders">
        <label className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cocoa-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, phone, order #, M-Pesa code" className="input w-72! rounded-full! py-2! pl-9!" />
        </label>
        <button onClick={load} className="btn bg-white px-4! py-2! ring-1 ring-cream-200" aria-label="Refresh">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </PageTitle>

      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${filter === f.id ? 'bg-cocoa-800 text-cream-50' : 'bg-white ring-1 ring-cream-200'}`}
          >
            {f.label} <span className="opacity-60">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-2xl bg-berry-100 p-3 text-sm text-berry-600">{error}</p>}
      {!loading && !shown.length && <p className="py-16 text-center text-cocoa-500">No orders here yet.</p>}

      <ul className="space-y-3">
        {shown.map((o) => <OrderCard key={o.id} order={o} token={token} onUpdate={(c) => update(o.id, c)} onReload={load} />)}
      </ul>
    </div>
  )
}

/** Splits order notes into the client's photos ("Photo N: <link>" lines) and "Label: value" rows. */
function parseNotes(text: string | null) {
  const photos: string[] = []
  const rows: { label: string; value: string }[] = []
  for (const line of (text ?? '').split('\n')) {
    if (!line.trim()) continue
    const photo = line.match(/^Photo \d+: (https?:\/\/\S+)$/)
    if (photo) {
      photos.push(photo[1])
      continue
    }
    const kv = line.match(/^([^:]{1,30}):\s*(.*)$/)
    if (kv && !/^https?$/i.test(kv[1])) rows.push({ label: kv[1], value: kv[2] })
    else rows.push({ label: '', value: line })
  }
  return { photos, rows }
}

const payIcons = { paid: CheckCircle2, pending: Clock, unpaid: AlertCircle }

function Panel({ title, className = '', children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-2xl p-4 ring-1 ring-cream-200 ${className || 'bg-white'}`}>
      <h3 className="mb-3 font-bold">{title}</h3>
      {children}
    </section>
  )
}

function OrderCard({ order: o, token, onUpdate, onReload }: { order: Order; token: string; onUpdate: (c: Partial<Order>) => void; onReload: () => void }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const payment = useMpesaPayment()
  const [checking, setChecking] = useState(false)
  const balance = Math.max(0, o.total - o.amount_paid)
  const paidPercent = o.total > 0 ? Math.min(100, Math.round((o.amount_paid / o.total) * 100)) : 0
  const pay = paymentStyles[o.payment_status]
  const PayIcon = payIcons[o.payment_status]
  const status = orderStatuses.find((s) => s.id === o.status)!
  const { photos, rows } = parseNotes(o.notes)

  // Refresh the list once a payment requested from here goes through.
  useEffect(() => {
    if (payment.state === 'paid') onReload()
  }, [payment.state, onReload])

  const requestPayment = () => {
    const input = window.prompt(`Amount to request from ${o.phone} (KES):`, String(balance || o.total))
    const amount = Math.round(Number(input))
    if (!input || !amount) return
    payment.start({ phone: o.phone, amount, name: o.customer_name, orderId: o.id }, token)
  }

  const check = async () => {
    if (!o.payment_reference) return
    setChecking(true)
    const r = await checkPayment(o.payment_reference)
    setChecking(false)
    if (r.status === 'QUEUED') alert('Still waiting for the client to pay.')
    onReload()
  }

  const markPaid = () => {
    const input = window.prompt('Amount received (KES), e.g. cash or another M-Pesa number:', String(balance || o.total))
    const amount = Math.round(Number(input))
    if (!input || !amount) return
    const code = window.prompt('M-Pesa code or note (optional):', o.mpesa_code ?? 'CASH') ?? ''
    const paid = o.amount_paid + amount
    // Deposits leave the order "Unpaid" with a smaller balance until the total is covered.
    onUpdate({
      payment_status: paid >= o.total ? 'paid' : 'unpaid',
      amount_paid: paid,
      mpesa_code: [o.mpesa_code, code].filter(Boolean).join(', ') || null,
      paid_at: new Date().toISOString(),
    })
  }

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(o.phone)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('Copy this number:', o.phone)
    }
  }

  return (
    <li className="rounded-3xl bg-white shadow-sm ring-1 ring-cream-200">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full flex-wrap items-center gap-x-5 gap-y-3 p-4 text-left sm:p-5">
        <span className="rounded-xl bg-berry-100 px-3 py-2 font-mono text-sm font-bold text-berry-600">#{orderCode(o.id)}</span>
        <span className="min-w-36 flex-1">
          <span className="block text-lg leading-tight font-bold">{o.customer_name || 'No name'}</span>
          <span className="text-sm text-cocoa-500">{kindLabel[o.kind]} • {formatDateTime(o.created_at)}</span>
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <Badge className={`gap-1 ${pay.className}`}><PayIcon className="size-3.5" /> {pay.label}</Badge>
          <Badge className={status.className}>{status.label}</Badge>
        </span>
        {o.delivery_date && (
          <span className="flex items-center gap-1.5 text-sm text-cocoa-700"><CalendarDays className="size-4 text-cocoa-500" /> Due <strong>{formatDate(o.delivery_date)}</strong></span>
        )}
        <span className="border-cream-200 text-right sm:border-l sm:pl-5">
          <span className="block text-xl leading-tight font-bold text-berry-600">{o.total ? formatKES(o.total) : '—'}</span>
          <span className="text-xs text-cocoa-500">Total order value</span>
        </span>
        <ChevronDown className={`size-5 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="grid gap-4 border-t border-cream-200 p-4 text-sm sm:p-5 lg:grid-cols-[1fr_1.3fr_1fr]">
          <Panel title="Customer & Contact">
            <div className="flex items-center gap-4">
              {photos[0] ? (
                <a href={photos[0]} target="_blank" rel="noopener noreferrer" title="Client photo: open full size" className="shrink-0">
                  <img src={photos[0]} alt="Client photo" loading="lazy" className="size-24 rounded-full object-cover ring-4 ring-cream-100" />
                </a>
              ) : (
                <span className="grid size-24 shrink-0 place-items-center rounded-full bg-berry-100 text-3xl font-bold text-berry-600">
                  {(o.customer_name || '?').charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 space-y-1.5">
                <a href={`tel:${o.phone}`} className="block truncate text-lg font-bold hover:text-berry-600">{o.phone}</a>
                <p className="flex items-center gap-1.5 text-cocoa-500"><Phone className="size-4" /> Phone</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={copyNumber} className="btn border border-berry-500 px-3! py-1.5! text-berry-600 hover:bg-berry-100">
                    {copied ? <><Check className="size-4" /> Copied</> : <><Copy className="size-4" /> Copy number</>}
                  </button>
                  <a
                    href={`https://wa.me/${waNumber(o.phone)}?text=${encodeURIComponent(`Hi ${o.customer_name}, about your order #${orderCode(o.id)}: `)}`}
                    target="_blank"
                    rel="noopener"
                    className="btn bg-[#25D366]/10 px-3! py-1.5! text-[#128C4B]"
                    aria-label="WhatsApp the client"
                    title="WhatsApp"
                  >
                    <WhatsAppIcon />
                  </a>
                </div>
              </div>
            </div>
            {photos.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {photos.slice(1).map((src, n) => (
                  <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block size-12 overflow-hidden rounded-xl ring-1 ring-cream-200" title="Open full size">
                    <img src={src} alt={`Client photo ${n + 2}`} loading="lazy" className="size-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Order Details">
            {o.items.length > 0 && (
              <ul className="mb-3 divide-y divide-cream-200 rounded-xl bg-cream-50 px-3">
                {o.items.map((i, n) => (
                  <li key={n} className="flex justify-between gap-3 py-2">
                    <span>
                      <strong>{i.quantity}×</strong>{' '}
                      {i.link ? <a href={i.link} target="_blank" rel="noopener" className="underline underline-offset-2">{i.name}</a> : i.name}
                      <span className="block text-xs text-cocoa-500">{i.size} · {i.flavour}{i.message && ` · “${i.message}”`}</span>
                    </span>
                    <span className="shrink-0">{formatKES(i.unitPrice * i.quantity)}</span>
                  </li>
                ))}
              </ul>
            )}
            <dl className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-2.5">
              {o.address && <><dt className="text-cocoa-500">Deliver to</dt><dd className="whitespace-pre-line">{linkify(o.address)}</dd></>}
              {/* Website orders keep the client's map pin link in `zone`; older orders have an area name there. */}
              {o.zone && (/^https?:\/\//.test(o.zone)
                ? <><dt className="text-cocoa-500">Map pin</dt><dd><a href={o.zone} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-berry-600 underline"><MapPin className="size-4" /> Open map</a></dd></>
                : <><dt className="text-cocoa-500">Area</dt><dd>{o.zone}</dd></>)}
              {o.items.length > 0 && (
                <><dt className="text-cocoa-500">Delivery fee</dt><dd>{o.delivery_fee ? formatKES(o.delivery_fee) : 'Free / to confirm'}</dd></>
              )}
              {rows.map((r, n) =>
                r.label
                  ? <Fragment key={n}><dt className="text-cocoa-500">{r.label}</dt><dd className="font-medium break-words">{linkify(r.value)}</dd></Fragment>
                  : <dd key={n} className="col-span-2 break-words">{linkify(r.value)}</dd>,
              )}
            </dl>
          </Panel>

          <Panel title="Order Management">
            <label className="block font-medium">
              Order status
              <select value={o.status} onChange={(e) => onUpdate({ status: e.target.value as OrderStatus })} className="input mt-1.5">
                {orderStatuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
            {o.kind === 'custom' && (
              <label className="mt-3 block font-medium">
                Quoted price (KES)
                <input type="number" min={0} defaultValue={o.total || ''} onBlur={(e) => Number(e.target.value) !== o.total && onUpdate({ total: Number(e.target.value) || 0, subtotal: Number(e.target.value) || 0 })} className="input mt-1.5" />
              </label>
            )}
          </Panel>

          <Panel title="Payment Summary" className="bg-berry-100/30 lg:col-span-2">
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-[auto_auto_auto_1fr] sm:items-center sm:gap-0 sm:divide-x sm:divide-cream-200">
              <div className="sm:pr-6">
                <p className="text-cocoa-500">{o.kind === 'custom' ? 'Total quoted' : 'Order total'}</p>
                <p className="text-xl font-bold">{formatKES(o.total)}</p>
              </div>
              <div className="sm:px-6">
                <p className="text-cocoa-500">Amount paid</p>
                <p className="text-xl font-bold text-emerald-700">{formatKES(o.amount_paid)}</p>
              </div>
              <div className="sm:px-6">
                <p className="text-cocoa-500">Balance due</p>
                <p className={`text-xl font-bold ${balance ? 'text-berry-600' : 'text-emerald-700'}`}>{formatKES(balance)}</p>
              </div>
              <div className="col-span-3 sm:col-span-1 sm:pl-6">
                <p className="mb-2 flex items-center justify-between gap-2 text-cocoa-500">
                  <span>{paidPercent}% paid</span>
                  {balance > 0 && <span className="rounded-full bg-berry-100 px-2 py-0.5 text-xs font-semibold text-berry-600">{formatKES(balance)}</span>}
                </p>
                <div className="h-2.5 overflow-hidden rounded-full bg-berry-100" role="progressbar" aria-valuenow={paidPercent} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${paidPercent}%` }} />
                </div>
              </div>
            </div>
            {o.mpesa_code && <p className="mt-3 text-xs text-cocoa-500">M-Pesa code / note: <strong className="font-mono">{o.mpesa_code}</strong>{o.paid_at && ` · ${formatDateTime(o.paid_at)}`}</p>}
          </Panel>

          <section className="flex flex-col justify-center gap-3 rounded-2xl p-4 ring-1 ring-cream-200">
            <div className="flex flex-wrap gap-3">
              <button onClick={requestPayment} disabled={payment.state === 'sending' || payment.state === 'waiting'} className="btn-primary flex-1 whitespace-nowrap">
                <Smartphone className="size-4" /> Send M-Pesa prompt
              </button>
              <button onClick={markPaid} className="btn flex-1 whitespace-nowrap bg-white ring-1 ring-cream-200 hover:bg-cream-50">
                <CreditCard className="size-4" /> Record payment manually
              </button>
            </div>
            {o.payment_status === 'pending' && o.payment_reference && (
              <button onClick={check} disabled={checking} className="btn w-full bg-butter-100 py-2!">{checking ? 'Checking…' : 'Check M-Pesa payment'}</button>
            )}
            <MpesaStatus state={payment.state} error={payment.error} mpesaCode={payment.mpesaCode} phone={o.phone} />
          </section>
        </div>
      )}
    </li>
  )
}

/** Makes links in notes (e.g. reference pictures) clickable. */
function linkify(text: string) {
  return text.split(/(https?:\/\/\S+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all text-berry-600 underline">{part}</a> : part,
  )
}
