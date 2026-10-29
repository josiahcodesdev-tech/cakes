import { useEffect, useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import MpesaStatus from '../components/MpesaStatus'
import { useMpesaPayment } from '../lib/mpesa'

const PASSWORD_KEY = 'admin-password'

// sessionStorage can throw in private windows; the page still works, it just asks again.
const loadPassword = () => {
  try { return sessionStorage.getItem(PASSWORD_KEY) ?? '' } catch { return '' }
}
const savePassword = (p: string) => {
  try { sessionStorage.setItem(PASSWORD_KEY, p) } catch { /* ignore */ }
}

/** Private page (not linked anywhere) where the shop owner sends an M-Pesa prompt to a client's phone. */
export default function AdminPayments() {
  const [password, setPassword] = useState(loadPassword)
  const [form, setForm] = useState({ phone: '', amount: '', name: '', reference: '' })
  const payment = useMpesaPayment()
  const paying = payment.state === 'sending' || payment.state === 'waiting'

  useEffect(() => {
    // Keep this page out of search results.
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  const update = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const send = (e: FormEvent) => {
    e.preventDefault()
    savePassword(password)
    payment.start({ phone: form.phone, amount: Number(form.amount), name: form.name, reference: form.reference }, password)
  }

  const sendAnother = () => {
    payment.reset()
    setForm({ phone: '', amount: '', name: '', reference: '' })
  }

  return (
    <div className="container-x flex justify-center py-16">
      <form onSubmit={send} className="w-full max-w-md space-y-4 rounded-[2rem] bg-white p-6 ring-1 ring-cream-200 sm:p-8">
        <p className="eyebrow">Shop owner</p>
        <h1 className="text-3xl font-bold">Request M-Pesa payment</h1>
        <p className="text-sm text-cocoa-500">Sends a payment prompt to your client’s phone. They enter their PIN and the money goes to your PayHero account.</p>

        <label className="block text-xs font-medium text-cocoa-500">
          <span className="flex items-center gap-1"><Lock className="size-3" /> Admin password</span>
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input mt-1" autoComplete="current-password" />
        </label>
        <label className="block text-xs font-medium text-cocoa-500">
          Client’s M-Pesa number
          <input required type="tel" value={form.phone} onChange={update('phone')} placeholder="0712 345 678" className="input mt-1" />
        </label>
        <label className="block text-xs font-medium text-cocoa-500">
          Amount (KES)
          <input required type="number" min={1} step={1} value={form.amount} onChange={update('amount')} placeholder="e.g. 2500" className="input mt-1" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-cocoa-500">
            Client name (optional)
            <input value={form.name} onChange={update('name')} className="input mt-1" />
          </label>
          <label className="block text-xs font-medium text-cocoa-500">
            Reference (optional)
            <input value={form.reference} onChange={update('reference')} placeholder="e.g. Wedding deposit" maxLength={40} className="input mt-1" />
          </label>
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
