import { CheckCircle2, Loader2, Smartphone, XCircle } from 'lucide-react'
import type { PaymentState } from '../lib/mpesa'

/** Shows where an M-Pesa prompt is at: sending, waiting for the PIN, paid or failed. */
export default function MpesaStatus({ state, error, mpesaCode, phone }: { state: PaymentState; error: string; mpesaCode: string; phone: string }) {
  if (state === 'idle') return null
  if (state === 'sending') {
    return (
      <p role="status" className="flex items-center gap-2 rounded-2xl bg-cream-100 p-3 text-sm">
        <Loader2 className="size-4 animate-spin" /> Sending M-Pesa prompt…
      </p>
    )
  }
  if (state === 'waiting') {
    return (
      <p role="status" className="flex items-start gap-2 rounded-2xl bg-butter-100 p-3 text-sm">
        <Smartphone className="mt-0.5 size-4 shrink-0" />
        <span>Check <strong>{phone}</strong> and enter your M-Pesa PIN. Waiting for confirmation… <Loader2 className="inline size-3.5 animate-spin" /></span>
      </p>
    )
  }
  if (state === 'paid') {
    return (
      <p role="status" className="flex items-start gap-2 rounded-2xl bg-pistachio-100 p-3 text-sm">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-pistachio-500" />
        <span><strong>Payment received.</strong>{mpesaCode && <> M-Pesa code: <strong>{mpesaCode}</strong></>}</span>
      </p>
    )
  }
  return (
    <p role="alert" className="flex items-start gap-2 rounded-2xl bg-berry-100 p-3 text-sm text-berry-600">
      <XCircle className="mt-0.5 size-4 shrink-0" /> {error}
    </p>
  )
}
