import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import MpesaStatus from '../components/MpesaStatus'
import { useMpesaPayment } from '../lib/mpesa'
import { PageTitle } from './ui'

/** Send an M-Pesa prompt to any client's phone; it's recorded as an order so it shows in Orders and Accounts. */
export default function RequestPayment({ token }: { token: string }) {
  const [form, setForm] = useState({ phone: '', amount: '', name: '', reference: '' })
  const payment = useMpesaPayment()
  const paying = payment.state === 'sending' || payment.state === 'waiting'

  const update = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const send = (e: FormEvent) => {
    e.preventDefault()
    payment.start({ phone: form.phone, amount: Number(form.amount), name: form.name, reference: form.reference }, token)
  }

  const sendAnother = () => {
    payment.reset()
    setForm({ phone: '', amount: '', name: '', reference: '' })
  }

  const label = 'block text-xs font-medium text-cocoa-500'

  return (
    <div className="max-w-md">
      <PageTitle title="Request payment" />
      <form onSubmit={send} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-cream-200">
        <p className="text-sm text-cocoa-500">
          Sends an M-Pesa prompt to your client’s phone. To charge an existing order, use “Send M-Pesa prompt” on it in <Link to="/admin/orders" className="underline">Orders</Link> instead.
        </p>
        <label className={label}>Client’s M-Pesa number<input required type="tel" value={form.phone} onChange={update('phone')} placeholder="0712 345 678" className="input mt-1" /></label>
        <label className={label}>Amount (KES)<input required type="number" min={1} step={1} value={form.amount} onChange={update('amount')} placeholder="e.g. 2500" className="input mt-1" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>Client name (optional)<input value={form.name} onChange={update('name')} className="input mt-1" /></label>
          <label className={label}>What it’s for (optional)<input value={form.reference} onChange={update('reference')} placeholder="e.g. Wedding deposit" maxLength={80} className="input mt-1" /></label>
        </div>

        <MpesaStatus state={payment.state} error={payment.error} mpesaCode={payment.mpesaCode} phone={form.phone} />

        {payment.state === 'paid' ? (
          <button type="button" onClick={sendAnother} className="btn-dark w-full">Send another request</button>
        ) : (
          <button disabled={paying} className="btn-primary w-full">{paying ? 'Waiting for client…' : 'Send payment prompt'}</button>
        )}
      </form>
    </div>
  )
}
