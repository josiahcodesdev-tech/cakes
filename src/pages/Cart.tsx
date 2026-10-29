import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { deliveryZones } from '../data/products'
import { useProducts } from '../data/catalog'
import { cakeUrl, formatKES, whatsappLink } from '../lib/format'
import type { CartItem, Product } from '../types'
import { WhatsAppIcon } from '../components/BrandIcons'
import MpesaStatus from '../components/MpesaStatus'
import { useMpesaPayment } from '../lib/mpesa'
import { newOrderId, orderCode, ordersEnabled, saveOrder } from '../lib/orders'

const FREE_DELIVERY_FROM = 8000
const today = new Date().toISOString().split('T')[0]

const itemLink = (i: CartItem, products: Product[]) => {
  const product = products.find((p) => p.id === i.productId || p.name === i.name)
  return product ? cakeUrl(product.slug) : i.image
}

export default function Cart() {
  const { items, subtotal, updateQuantity, removeItem } = useCart()
  const products = useProducts()
  const [zone, setZone] = useState(deliveryZones[0].area)
  const [form, setForm] = useState({ name: '', phone: '', date: today, address: '', notes: '' })
  const payment = useMpesaPayment()
  const paying = payment.state === 'sending' || payment.state === 'waiting'

  const zoneFee = deliveryZones.find((z) => z.area === zone)?.fee ?? 0
  const delivery = subtotal >= FREE_DELIVERY_FROM ? 0 : zoneFee
  const total = subtotal + delivery

  const update = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  // The order is saved once (on the first Pay or WhatsApp click) so it appears in the admin page.
  const [orderId] = useState(newOrderId)
  const saved = useRef<Promise<string | null> | null>(null)
  const ensureSaved = () =>
    (saved.current ??= saveOrder(orderId, {
      kind: 'order',
      customer_name: form.name,
      phone: form.phone,
      address: form.address,
      delivery_date: form.date,
      zone,
      notes: form.notes || null,
      items: items.map((i) => ({
        name: i.name, quantity: i.quantity, size: i.size, flavour: i.flavour, message: i.message || undefined,
        unitPrice: i.unitPrice, link: itemLink(i, products),
      })),
      subtotal,
      delivery_fee: delivery,
      total,
    }))

  const checkout = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // The form has two submit buttons: pay by M-Pesa, or send the order on WhatsApp.
    if ((e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'mpesa') {
      const id = await ensureSaved()
      payment.start({ phone: form.phone, amount: total, name: form.name, orderId: id ?? undefined })
      return
    }
    // Not awaited: the WhatsApp window has to open straight from the click or browsers block it.
    void ensureSaved()
    const lines = items.map(
      (i, n) =>
        // WhatsApp links carry text only, so each cake goes in as a link to its page (the first one shows a photo preview).
        `${n + 1}. ${i.name} x${i.quantity}\n   ${i.size} · ${i.flavour}${i.message ? ` · "${i.message}"` : ''}\n   ${formatKES(i.unitPrice * i.quantity)}\n   🔗 ${itemLink(i, products)}`,
    )
    const message = [
      '🎂 *New cake order*',
      ordersEnabled() && `Order #${orderCode(orderId)}`,
      '',
      ...lines,
      '',
      `Subtotal: ${formatKES(subtotal)}`,
      `Delivery (${zone}): ${delivery ? formatKES(delivery) : 'FREE'}`,
      `*Total: ${formatKES(total)}*`,
      payment.state === 'paid' && `✅ *PAID via M-Pesa*${payment.mpesaCode ? ` (code ${payment.mpesaCode})` : ''}`,
      '',
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Delivery date: ${form.date}`,
      `Address: ${form.address}`,
      form.notes && `Notes: ${form.notes}`,
    ]
      .filter((l) => typeof l === 'string' && l !== '')
      .join('\n')
    window.open(whatsappLink(message), '_blank', 'noopener')
  }

  if (!items.length) {
    return (
      <div className="container-x flex flex-col items-center py-28 text-center">
        <span className="mb-6 grid size-20 place-items-center rounded-full bg-berry-100 text-berry-500">
          <ShoppingBag className="size-9" />
        </span>
        <h1 className="text-4xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-cocoa-700">Looks like you haven’t picked a cake yet.</p>
        <Link to="/shop" className="btn-primary mt-8">Browse cakes</Link>
      </div>
    )
  }

  return (
    <div className="container-x py-12">
      <h1 className="mb-8 text-4xl font-bold sm:text-5xl">Your cart</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_26rem]">
        <ul className="space-y-4">
          {items.map((i) => (
            <li key={i.key} className="flex gap-4 bg-white p-4 ring-1 ring-cream-200">
              <img src={i.image} alt="" className="size-24 shrink-0 object-cover sm:size-28" />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold">{i.name}</h2>
                  <button onClick={() => removeItem(i.key)} className="text-cocoa-500 hover:text-berry-600" aria-label={`Remove ${i.name}`}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-cocoa-500">{i.size} · {i.flavour}</p>
                {i.message && <p className="truncate text-sm text-cocoa-500 italic">“{i.message}”</p>}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full bg-cream-100">
                    <button onClick={() => updateQuantity(i.key, i.quantity - 1)} className="grid size-9 place-items-center" aria-label="Decrease quantity">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{i.quantity}</span>
                    <button onClick={() => updateQuantity(i.key, i.quantity + 1)} className="grid size-9 place-items-center" aria-label="Increase quantity">
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="font-bold">{formatKES(i.unitPrice * i.quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={checkout} className="h-fit space-y-4 rounded-[2rem] bg-white p-6 ring-1 ring-cream-200 lg:sticky lg:top-32">
          <h2 className="text-2xl font-bold">Delivery details</h2>
          <input required value={form.name} onChange={update('name')} placeholder="Full name" className="input" autoComplete="name" />
          <input required value={form.phone} onChange={update('phone')} placeholder="Phone (e.g. 0712 345 678)" type="tel" className="input" autoComplete="tel" />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-cocoa-500">
              Delivery date
              <input required type="date" min={today} value={form.date} onChange={update('date')} className="input mt-1" />
            </label>
            <label className="text-xs font-medium text-cocoa-500">
              Area
              <select value={zone} onChange={(e) => setZone(e.target.value)} className="input mt-1">
                {deliveryZones.map((z) => (
                  <option key={z.area} value={z.area}>{z.area}</option>
                ))}
              </select>
            </label>
          </div>
          <input required value={form.address} onChange={update('address')} placeholder="Street, building, house no." className="input" autoComplete="street-address" />
          <textarea value={form.notes} onChange={update('notes')} placeholder="Notes for the baker (optional)" rows={2} className="input resize-none" />

          <dl className="space-y-2 border-t border-cream-200 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatKES(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{delivery ? formatKES(delivery) : <span className="font-semibold text-pistachio-500">FREE</span>}</dd>
            </div>
            {subtotal < FREE_DELIVERY_FROM && (
              <p className="text-xs text-cocoa-500">Add {formatKES(FREE_DELIVERY_FROM - subtotal)} more for free delivery.</p>
            )}
            <div className="flex justify-between border-t border-cream-200 pt-3 text-lg font-bold">
              <dt>Total</dt><dd className="text-berry-600">{formatKES(total)}</dd>
            </div>
          </dl>

          {payment.state !== 'paid' && (
            <button type="submit" value="mpesa" disabled={paying} className="btn-primary w-full">
              {paying ? 'Waiting for M-Pesa…' : <>Pay {formatKES(total)} with M-Pesa</>}
            </button>
          )}
          <MpesaStatus state={payment.state} error={payment.error} mpesaCode={payment.mpesaCode} phone={form.phone} />

          <button type="submit" value="whatsapp" className="btn w-full bg-[#25D366] text-white hover:bg-[#1fb857]">
            <WhatsAppIcon /> {payment.state === 'paid' ? 'Send paid order via WhatsApp' : 'Send order via WhatsApp'}
          </button>
          <p className="text-center text-xs text-cocoa-500">
            {payment.state === 'paid'
              ? 'Send us your order so we can start baking.'
              : 'Pay now with an M-Pesa prompt on your phone, or send the order and pay after we confirm.'}
          </p>
        </form>
      </div>
    </div>
  )
}
