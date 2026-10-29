import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, MapPin, Phone, RefreshCw, Search } from 'lucide-react'
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

function OrderCard({ order: o, token, onUpdate, onReload }: { order: Order; token: string; onUpdate: (c: Partial<Order>) => void; onReload: () => void }) {
  const [open, setOpen] = useState(false)
  const payment = useMpesaPayment()
  const [checking, setChecking] = useState(false)
  const balance = Math.max(0, o.total - o.amount_paid)
  const pay = paymentStyles[o.payment_status]

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

  return (
    <li className="rounded-3xl bg-white ring-1 ring-cream-200">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 p-4 text-left">
        <span className="font-mono text-sm font-bold text-cocoa-500">#{orderCode(o.id)}</span>
        <span className="min-w-32 flex-1">
          <span className="block font-semibold">{o.customer_name || 'No name'}</span>
          <span className="text-xs text-cocoa-500">{kindLabel[o.kind]} · {formatDateTime(o.created_at)}</span>
        </span>
        {o.delivery_date && <span className="text-sm">Due <strong>{formatDate(o.delivery_date)}</strong></span>}
        <span className="font-bold">{o.total ? formatKES(o.total) : '—'}</span>
        <Badge className={pay.className}>{pay.label}</Badge>
        <Badge className={orderStatuses.find((s) => s.id === o.status)!.className}>{orderStatuses.find((s) => s.id === o.status)!.label}</Badge>
        <ChevronDown className={`size-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="grid gap-6 border-t border-cream-200 p-4 md:grid-cols-[1fr_18rem]">
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${o.phone}`} className="btn bg-cream-100 px-3! py-1.5!"><Phone className="size-4" /> {o.phone}</a>
              <a href={`https://wa.me/${waNumber(o.phone)}?text=${encodeURIComponent(`Hi ${o.customer_name}, about your order #${orderCode(o.id)}: `)}`} target="_blank" rel="noopener" className="btn bg-[#25D366]/10 px-3! py-1.5! text-[#128C4B]">
                <WhatsAppIcon /> WhatsApp
              </a>
            </div>
            {o.address && <p className="whitespace-pre-line"><span className="text-cocoa-500">Deliver to:</span> {linkify(o.address)}</p>}
            {/* Website orders keep the client's map pin link in `zone`; older orders have an area name there. */}
            {o.zone && (/^https?:\/\//.test(o.zone)
              ? <a href={o.zone} target="_blank" rel="noopener noreferrer" className="btn bg-pistachio-100 px-3! py-1.5!"><MapPin className="size-4" /> Open map pin</a>
              : <p><span className="text-cocoa-500">Area:</span> {o.zone}</p>)}

            {o.items.length > 0 && (
              <ul className="divide-y divide-cream-200 rounded-2xl bg-cream-50 px-3">
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
            {o.notes && <p className="whitespace-pre-line rounded-2xl bg-butter-100 p-3">{linkify(o.notes)}</p>}
            {o.items.length > 0 && (
              <p className="text-cocoa-500">Subtotal {formatKES(o.subtotal)} · Delivery {o.delivery_fee ? formatKES(o.delivery_fee) : 'free'} · <strong className="text-cocoa-800">Total {formatKES(o.total)}</strong></p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-cocoa-500">
              Order status
              <select value={o.status} onChange={(e) => onUpdate({ status: e.target.value as OrderStatus })} className="input mt-1">
                {orderStatuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
            {o.kind === 'custom' && (
              <label className="block text-xs font-medium text-cocoa-500">
                Quoted price (KES)
                <input type="number" min={0} defaultValue={o.total || ''} onBlur={(e) => Number(e.target.value) !== o.total && onUpdate({ total: Number(e.target.value) || 0, subtotal: Number(e.target.value) || 0 })} className="input mt-1" />
              </label>
            )}

            <div className="rounded-2xl bg-cream-50 p-3 text-sm">
              <p className="flex justify-between"><span>Paid</span><strong>{formatKES(o.amount_paid)}</strong></p>
              {balance > 0 && o.payment_status !== 'paid' && <p className="flex justify-between text-berry-600"><span>Balance</span><strong>{formatKES(balance)}</strong></p>}
              {o.mpesa_code && <p className="mt-1 text-xs text-cocoa-500">Code: <strong className="font-mono">{o.mpesa_code}</strong>{o.paid_at && ` · ${formatDateTime(o.paid_at)}`}</p>}
            </div>

            <MpesaStatus state={payment.state} error={payment.error} mpesaCode={payment.mpesaCode} phone={o.phone} />
            {o.payment_status === 'pending' && o.payment_reference && (
              <button onClick={check} disabled={checking} className="btn w-full bg-butter-100 py-2!">{checking ? 'Checking…' : 'Check M-Pesa payment'}</button>
            )}
            <button onClick={requestPayment} disabled={payment.state === 'sending' || payment.state === 'waiting'} className="btn-primary w-full py-2!">
              Send M-Pesa prompt
            </button>
            <button onClick={markPaid} className="btn w-full bg-white py-2! ring-1 ring-cream-200">Record payment manually</button>
          </div>
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
