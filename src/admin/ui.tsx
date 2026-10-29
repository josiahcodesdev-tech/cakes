import type { ReactNode } from 'react'
import type { OrderStatus, PaymentStatus } from '../lib/orders'

export const orderStatuses: { id: OrderStatus; label: string; className: string }[] = [
  { id: 'new', label: 'New', className: 'bg-butter-100 text-cocoa-800' },
  { id: 'confirmed', label: 'Confirmed', className: 'bg-berry-100 text-berry-600' },
  { id: 'baking', label: 'Baking', className: 'bg-cream-200 text-cocoa-800' },
  { id: 'ready', label: 'Ready', className: 'bg-pistachio-100 text-cocoa-800' },
  { id: 'delivered', label: 'Delivered', className: 'bg-pistachio-500 text-white' },
  { id: 'cancelled', label: 'Cancelled', className: 'bg-cocoa-500/15 text-cocoa-500 line-through' },
]

export const paymentStyles: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-pistachio-500 text-white' },
  pending: { label: 'Awaiting M-Pesa', className: 'bg-butter-400 text-cocoa-800' },
  unpaid: { label: 'Unpaid', className: 'bg-berry-100 text-berry-600' },
}

export function Badge({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

export const formatDate = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00` : iso).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })

/** Turns 07.. / +254.. into the digits wa.me needs. */
export const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, '')
  return d.startsWith('254') ? d : `254${d.replace(/^0/, '')}`
}
