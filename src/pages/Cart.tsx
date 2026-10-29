import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, MapPin, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
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
  const [form, setForm] = useState({ name: '', phone: '', date: today, address: '', notes: '' })
  const payment = useMpesaPayment()
  const paying = payment.state === 'sending' || payment.state === 'waiting'

  // We deliver anywhere: the client types their location and can drop a map pin.
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [pinError, setPinError] = useState('')
  const pinUrl = pin ? `https://maps.google.com/?q=${pin.lat.toFixed(6)},${pin.lng.toFixed(6)}` : ''

  const usePhoneLocation = () => {
    if (!navigator.geolocation) return setPinError('Your browser can’t share location. Type your location instead.')
    setLocating(true)
    setPinError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        setPinError('Couldn’t get your location. Allow location access, or type your location instead.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    )
  }

  // Delivery is free above the threshold; otherwise the fee depends on distance and is confirmed with the client.
  const freeDelivery = subtotal >= FREE_DELIVERY_FROM
  const delivery = freeDelivery ? 0 : null
  const total = subtotal + (delivery ?? 0)

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
      zone: pinUrl || null, // the map pin link, when the client shared one
      notes: form.notes || null,
      items: items.map((i) => ({
        name: i.name, quantity: i.quantity, size: i.size, flavour: i.flavour, message: i.message || undefined,
        unitPrice: i.unitPrice, link: itemLink(i, products),
      })),
      subtotal,
      delivery_fee: delivery ?? 0,
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
      `Delivery: ${freeDelivery ? 'FREE' : 'to be confirmed (depends on location)'}`,
      `*Total: ${formatKES(total)}*${freeDelivery ? '' : ' + delivery'}`,
      payment.state === 'paid' && `✅ *PAID via M-Pesa*${payment.mpesaCode ? ` (code ${payment.mpesaCode})` : ''}`,
      '',
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Delivery date: ${form.date}`,
      `Location: ${form.address}`,
      pinUrl && `📍 Map pin: ${pinUrl}`,
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
          <label className="block text-xs font-medium text-cocoa-500">
            Delivery date
            <input required type="date" min={today} value={form.date} onChange={update('date')} className="input mt-1" />
          </label>
          <label className="block text-xs font-medium text-cocoa-500">
            Delivery location
            <textarea
              required
              rows={2}
              value={form.address}
              onChange={update('address')}
              placeholder="Area, street, building, house no. and a landmark — or paste a Google Maps link"
              className="input mt-1 resize-none"
              autoComplete="street-address"
            />
          </label>
          {pin ? (
            <p className="flex items-center gap-2 rounded-2xl bg-pistachio-100 p-3 text-sm">
              <MapPin className="size-4 shrink-0 text-pistachio-500" />
              <span className="flex-1">Map pin added. <a href={pinUrl} target="_blank" rel="noopener" className="underline">Check it on the map</a></span>
              <button type="button" onClick={() => setPin(null)} className="rounded-full p-1 hover:bg-white" aria-label="Remove map pin"><X className="size-4" /></button>
            </p>
          ) : (
            <button type="button" onClick={usePhoneLocation} disabled={locating} className="btn w-full bg-cream-100 py-2.5! hover:bg-cream-200">
              {locating ? <><Loader2 className="size-4 animate-spin" /> Finding you…</> : <><MapPin className="size-4" /> Use my current location (drop a pin)</>}
            </button>
          )}
          {pinError && <p className="text-xs text-berry-600">{pinError}</p>}
          <textarea value={form.notes} onChange={update('notes')} placeholder="Notes for the baker (optional)" rows={2} className="input resize-none" />

          <dl className="space-y-2 border-t border-cream-200 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatKES(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{freeDelivery ? <span className="font-semibold text-pistachio-500">FREE</span> : <span className="text-cocoa-500">Confirmed after we see your location</span>}</dd>
            </div>
            {!freeDelivery && (
              <p className="text-xs text-cocoa-500">Free delivery on orders above {formatKES(FREE_DELIVERY_FROM)}: add {formatKES(FREE_DELIVERY_FROM - subtotal)} more.</p>
            )}
            <div className="flex justify-between border-t border-cream-200 pt-3 text-lg font-bold">
              <dt>{freeDelivery ? 'Total' : 'Total (cakes)'}</dt><dd className="text-berry-600">{formatKES(total)}</dd>
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
              : freeDelivery
                ? 'Pay now with an M-Pesa prompt on your phone, or send the order and pay after we confirm.'
                : 'Pay for the cakes now, or send the order first. We’ll confirm the delivery fee on WhatsApp.'}
          </p>
        </form>
      </div>
    </div>
  )
}
